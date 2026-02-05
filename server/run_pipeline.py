"""
GOHIP Platform - Full ETL Pipeline
===================================

Phase 23: Unified 5-Point Dragnet Pipeline

This module orchestrates the complete ETL pipeline for fetching
occupational health data from multiple international sources:

Data Sources (5-Point Dragnet):
1. ILO ILOSTAT: Fatal occupational injury rates (SDG 8.8.1)
2. WHO GHO: UHC Index, Road Safety (proxy for safety culture)
3. World Bank: Governance, Vulnerable Employment, Health Expenditure
4. Wikipedia: Country flag images

Pipeline Features:
- Per-country resilient processing (failures don't stop pipeline)
- Real-time status tracking via pipeline_logger
- Rate limiting between API calls
- Maturity score calculation
- Pillar score calculation

Usage:
    # From CLI
    python run_pipeline.py
    
    # Programmatic (from API endpoint)
    from run_pipeline import run_full_pipeline
    run_full_pipeline(batch_size=50, use_pipeline_logger=True)
"""

import asyncio
import logging
import time
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database
from app.core.database import SessionLocal
from app.models.country import (
    Country,
    Pillar1Hazard,
    Pillar2Vigilance,
    Pillar3Restoration,
    GovernanceLayer,
)

# ETL Clients
from app.services.etl.ilo_client import ILOClient
from app.services.etl.wb_client import WorldBankClient
from app.services.etl.who_client import WHOClient, calculate_proxy_fatal_rate

# Pipeline Logger for Live Ops Center
from app.services.pipeline_logger import pipeline_logger, LogLevel

# Scoring
from app.services.scoring import calculate_maturity_score

# Flag Fetcher
from app.services.flag_fetcher import fetch_flag_from_wikipedia, get_flag_url, get_existing_flag_url

# Target countries
from app.data.targets import GLOBAL_ECONOMIES_50, get_country_name


# =============================================================================
# PILLAR SCORE CALCULATION
# =============================================================================

def calculate_pillar_scores(
    fatal_rate: Optional[float],
    gov_effectiveness: Optional[float],
    uhc_index: Optional[float],
    vulnerable_employment: Optional[float],
    health_expenditure: Optional[float],
) -> Dict[str, Optional[float]]:
    """
    Calculate pillar scores from raw metrics.
    
    Pillar 1 (Hazard Control): Based on fatal accident rate
    - Lower fatal rate = higher score
    - Formula: 100 - (fatal_rate * 10), clamped to 0-100
    
    Pillar 2 (Health Vigilance): Based on UHC Index and vulnerability
    - UHC Index directly used (0-100)
    - Adjusted by vulnerability index
    
    Pillar 3 (Restoration): Based on health expenditure
    - Higher health expenditure = better rehab access
    - Formula: min(health_exp * 5, 100)
    
    Governance: Based on World Bank Government Effectiveness
    - Already normalized to 0-100 by WorldBankClient
    
    Returns:
        Dict with governance_score, pillar1_score, pillar2_score, pillar3_score
    """
    scores = {
        "governance_score": None,
        "pillar1_score": None,
        "pillar2_score": None,
        "pillar3_score": None,
    }
    
    # Governance Score (from World Bank Government Effectiveness)
    if gov_effectiveness is not None:
        scores["governance_score"] = round(gov_effectiveness, 1)
    
    # Pillar 1: Hazard Control (from fatal rate)
    # Lower fatal rate = higher score
    if fatal_rate is not None:
        # Fatal rates typically range from 0.5 to 15 per 100k
        # We invert and scale: score = 100 - (rate * 6.67)
        # This maps: 0 -> 100, 15 -> 0
        pillar1 = 100 - (fatal_rate * 6.67)
        scores["pillar1_score"] = round(max(0, min(100, pillar1)), 1)
    
    # Pillar 2: Health Vigilance (from UHC Index)
    if uhc_index is not None:
        # UHC Index is already 0-100
        # Adjust by vulnerability if available (higher vulnerability = lower score)
        base_score = uhc_index
        if vulnerable_employment is not None:
            # Vulnerability penalty: reduce score by (vuln_emp / 2)
            # High informal employment (e.g., 80%) reduces score by 40 points
            penalty = vulnerable_employment / 2
            base_score = base_score - penalty
        scores["pillar2_score"] = round(max(0, min(100, base_score)), 1)
    
    # Pillar 3: Restoration (from health expenditure)
    if health_expenditure is not None:
        # Health expenditure typically ranges from 2% to 18% of GDP
        # Higher spending = better rehab infrastructure
        # Formula: score = health_exp * 5.5 (caps at 100 around 18%)
        pillar3 = health_expenditure * 5.5
        scores["pillar3_score"] = round(max(0, min(100, pillar3)), 1)
    
    return scores


# =============================================================================
# MAIN PIPELINE FUNCTION
# =============================================================================

def run_full_pipeline(
    batch_size: int = 195,
    use_pipeline_logger: bool = True,
    country_filter: Optional[List[str]] = None,
    fetch_flags: bool = True,
) -> Dict[str, Any]:
    """
    Execute the full 5-Point Dragnet ETL pipeline.
    
    This is the canonical pipeline function called by both:
    - CLI: python run_pipeline.py
    - API: POST /api/v1/etl/run (background task)
    
    Args:
        batch_size: Maximum number of countries to process
        use_pipeline_logger: Whether to use pipeline_logger for status tracking
        country_filter: Optional list of ISO codes to process (None = all)
        fetch_flags: Whether to fetch flag images from Wikipedia
    
    Returns:
        Summary dict with counts and statistics
    
    The 5-Point Dragnet:
    ====================
    1. [DIRECT]   ILO Fatal Rate → Pillar 1: Fatal Accident Rate
    2. [PROXY]    WHO Road Safety / 10 → Fallback for missing ILO data
    3. [CONTEXT]  WB Governance → Strategic Capacity Score
    4. [CONTEXT]  WB Vulnerable Employment → Pillar 2 Vulnerability
    5. [CONTEXT]  WB Health Expenditure → Pillar 3 Rehab Proxy
    """
    start_time = time.time()
    
    # Determine countries to process
    if country_filter:
        target_countries = [c for c in country_filter if c in GLOBAL_ECONOMIES_50]
    else:
        target_countries = GLOBAL_ECONOMIES_50[:batch_size]
    
    total_countries = len(target_countries)
    
    # Initialize pipeline logger
    if use_pipeline_logger:
        pipeline_logger.start(total_countries)
        pipeline_logger.phase("5-Point Dragnet ETL Pipeline")
        pipeline_logger.log(f"Processing {total_countries} countries")
        pipeline_logger.log(f"Flags: {'Enabled' if fetch_flags else 'Disabled'}")
    
    # Initialize ETL clients
    ilo_client = ILOClient()
    wb_client = WorldBankClient()
    who_client = WHOClient()
    
    # Create database session
    db = SessionLocal()
    
    # Statistics
    success_count = 0
    failed_count = 0
    
    try:
        for idx, iso_code in enumerate(target_countries):
            country_name = get_country_name(iso_code)
            
            # Check for stop request
            if use_pipeline_logger and pipeline_logger.stop_requested:
                pipeline_logger.warning(f"Stop requested - halting at {idx}/{total_countries}")
                break
            
            # Mark country as processing
            if use_pipeline_logger:
                pipeline_logger.start_country(iso_code)
                pipeline_logger.log(f"[{idx+1}/{total_countries}] Processing {country_name} ({iso_code})")
            
            try:
                # =====================================================================
                # STEP 1: Fetch ILO Fatal Rate
                # =====================================================================
                ilo_data = ilo_client.fetch_fatality_rate_sync(iso_code)
                fatal_rate = ilo_data.get("value") if ilo_data else None
                fatal_source = ilo_data.get("source") if ilo_data else None
                
                if fatal_rate is not None:
                    if use_pipeline_logger:
                        pipeline_logger.success(f"  ILO Fatal Rate: {fatal_rate} per 100k")
                else:
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  ILO Fatal Rate: No data")
                
                # =====================================================================
                # STEP 2: Fetch World Bank Data
                # =====================================================================
                wb_data = wb_client.fetch_all_context_indicators_sync(iso_code)
                
                gov_data = wb_data.get("gov_effectiveness")
                gov_effectiveness = gov_data.get("value") if gov_data else None
                
                vuln_data = wb_data.get("vulnerable_employment")
                vulnerable_employment = vuln_data.get("value") if vuln_data else None
                
                health_data = wb_data.get("health_expenditure")
                health_expenditure = health_data.get("value") if health_data else None
                
                industry_data = wb_data.get("industry_pct_gdp")
                industry_pct = industry_data.get("value") if industry_data else None
                
                if use_pipeline_logger:
                    if gov_effectiveness is not None:
                        pipeline_logger.success(f"  World Bank Gov Effectiveness: {gov_effectiveness:.1f}")
                    if vulnerable_employment is not None:
                        pipeline_logger.log(f"  World Bank Vulnerable Emp: {vulnerable_employment:.1f}%")
                    if health_expenditure is not None:
                        pipeline_logger.log(f"  World Bank Health Exp: {health_expenditure:.1f}% GDP")
                
                # Rate limit between API calls
                time.sleep(0.3)
                
                # =====================================================================
                # STEP 3: Fetch WHO Data (UHC Index, Road Safety as proxy)
                # =====================================================================
                who_data = who_client.fetch_all_indicators_sync(iso_code)
                
                uhc_data = who_data.get("uhc_index")
                uhc_index = uhc_data.get("value") if uhc_data else None
                
                road_data = who_data.get("road_safety")
                road_safety = road_data.get("value") if road_data else None
                
                if use_pipeline_logger:
                    if uhc_index is not None:
                        pipeline_logger.success(f"  WHO UHC Index: {uhc_index}")
                    if road_safety is not None:
                        pipeline_logger.log(f"  WHO Road Safety: {road_safety} per 100k")
                
                # Use road safety as proxy for fatal rate if ILO is missing
                if fatal_rate is None and road_safety is not None:
                    fatal_rate = calculate_proxy_fatal_rate(road_safety)
                    fatal_source = "WHO Road Safety Proxy"
                    if use_pipeline_logger:
                        pipeline_logger.warning(f"  Using WHO proxy fatal rate: {fatal_rate}")
                
                # =====================================================================
                # STEP 4: Calculate Pillar Scores
                # =====================================================================
                scores = calculate_pillar_scores(
                    fatal_rate=fatal_rate,
                    gov_effectiveness=gov_effectiveness,
                    uhc_index=uhc_index,
                    vulnerable_employment=vulnerable_employment,
                    health_expenditure=health_expenditure,
                )
                
                if use_pipeline_logger:
                    pipeline_logger.log(f"  Scores: Gov={scores['governance_score']}, P1={scores['pillar1_score']}, P2={scores['pillar2_score']}, P3={scores['pillar3_score']}")
                
                # =====================================================================
                # STEP 5: Upsert to Database
                # =====================================================================
                
                # Get or create Country record
                country = db.query(Country).filter(Country.iso_code == iso_code).first()
                if not country:
                    country = Country(
                        iso_code=iso_code,
                        name=country_name,
                    )
                    db.add(country)
                
                # Update pillar scores on country
                country.governance_score = scores["governance_score"]
                country.pillar1_score = scores["pillar1_score"]
                country.pillar2_score = scores["pillar2_score"]
                country.pillar3_score = scores["pillar3_score"]
                
                # Update or create Pillar1Hazard
                pillar1 = db.query(Pillar1Hazard).filter(
                    Pillar1Hazard.country_iso_code == iso_code
                ).first()
                if not pillar1:
                    pillar1 = Pillar1Hazard(
                        id=str(uuid.uuid4()),
                        country_iso_code=iso_code,
                    )
                    db.add(pillar1)
                
                pillar1.fatal_accident_rate = fatal_rate
                pillar1.control_maturity_score = scores["pillar1_score"]
                pillar1.source_urls = {
                    "fatal_rate": fatal_source,
                    "updated_at": datetime.utcnow().isoformat(),
                }
                
                # Update or create Pillar2Vigilance
                pillar2 = db.query(Pillar2Vigilance).filter(
                    Pillar2Vigilance.country_iso_code == iso_code
                ).first()
                if not pillar2:
                    pillar2 = Pillar2Vigilance(
                        id=str(uuid.uuid4()),
                        country_iso_code=iso_code,
                    )
                    db.add(pillar2)
                
                pillar2.disease_detection_rate = uhc_index
                pillar2.vulnerability_index = vulnerable_employment
                pillar2.source_urls = {
                    "uhc_index": "https://www.who.int/data/gho",
                    "vulnerability": "https://data.worldbank.org",
                    "updated_at": datetime.utcnow().isoformat(),
                }
                
                # Update or create Pillar3Restoration
                pillar3 = db.query(Pillar3Restoration).filter(
                    Pillar3Restoration.country_iso_code == iso_code
                ).first()
                if not pillar3:
                    pillar3 = Pillar3Restoration(
                        id=str(uuid.uuid4()),
                        country_iso_code=iso_code,
                    )
                    db.add(pillar3)
                
                # Convert health expenditure to rehab access score (0-100)
                rehab_score = None
                if health_expenditure is not None:
                    rehab_score = min(health_expenditure * 5.5, 100)
                pillar3.rehab_access_score = rehab_score
                pillar3.source_urls = {
                    "health_expenditure": "https://data.worldbank.org",
                    "updated_at": datetime.utcnow().isoformat(),
                }
                
                # Update or create GovernanceLayer
                governance = db.query(GovernanceLayer).filter(
                    GovernanceLayer.country_iso_code == iso_code
                ).first()
                if not governance:
                    governance = GovernanceLayer(
                        id=str(uuid.uuid4()),
                        country_iso_code=iso_code,
                    )
                    db.add(governance)
                
                governance.strategic_capacity_score = gov_effectiveness
                governance.source_urls = {
                    "gov_effectiveness": "https://data.worldbank.org/indicator/GE.EST",
                    "economic_context": {
                        "industry_pct_gdp": industry_pct,
                    },
                    "updated_at": datetime.utcnow().isoformat(),
                }
                
                # Commit country data before calculating maturity
                db.commit()
                
                # Refresh to get relationships
                db.refresh(country)
                
                # Calculate maturity score
                try:
                    maturity_score, maturity_label = calculate_maturity_score(country)
                    country.maturity_score = maturity_score
                    db.commit()
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  Maturity: {maturity_score} ({maturity_label})")
                except Exception as e:
                    logger.warning(f"Could not calculate maturity for {iso_code}: {e}")
                
                # =====================================================================
                # STEP 6: Fetch Flag (if enabled)
                # =====================================================================
                if fetch_flags:
                    # Check if flag already exists
                    existing_flag = get_existing_flag_url(iso_code)
                    if existing_flag:
                        country.flag_url = existing_flag
                    else:
                        try:
                            flag_url = asyncio.run(fetch_flag_from_wikipedia(iso_code, country_name))
                            if flag_url:
                                country.flag_url = flag_url
                                if use_pipeline_logger:
                                    pipeline_logger.success(f"  Flag downloaded")
                        except Exception as e:
                            if use_pipeline_logger:
                                pipeline_logger.warning(f"  Flag fetch failed: {e}")
                    
                    db.commit()
                
                # Mark country as complete
                success_count += 1
                if use_pipeline_logger:
                    pipeline_logger.complete_country(iso_code, fatal_rate)
                    pipeline_logger.success(f"  Saved {country_name} to database")
                
            except Exception as e:
                failed_count += 1
                error_msg = str(e)
                logger.error(f"Error processing {iso_code}: {error_msg}")
                if use_pipeline_logger:
                    pipeline_logger.error(f"  ERROR: {error_msg}")
                    pipeline_logger.fail_country(iso_code, error_msg)
                
                # Rollback on error
                db.rollback()
            
            # Rate limit between countries
            time.sleep(0.5)
        
        # Pipeline complete
        elapsed = time.time() - start_time
        
        if use_pipeline_logger:
            pipeline_logger.phase("Pipeline Complete")
            pipeline_logger.log(f"Processed: {success_count}/{total_countries} countries")
            pipeline_logger.log(f"Failed: {failed_count} countries")
            pipeline_logger.log(f"Duration: {elapsed:.1f}s")
            pipeline_logger.finish(success=failed_count == 0)
        
        return {
            "success": True,
            "total": total_countries,
            "processed": success_count,
            "failed": failed_count,
            "duration_seconds": round(elapsed, 1),
        }
        
    except Exception as e:
        logger.error(f"Pipeline crashed: {e}")
        if use_pipeline_logger:
            pipeline_logger.error(f"Pipeline crashed: {e}")
            pipeline_logger.finish(success=False)
        raise
    
    finally:
        db.close()


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="GOHIP ETL Pipeline")
    parser.add_argument(
        "--batch-size", 
        type=int, 
        default=195,
        help="Number of countries to process (default: 195)"
    )
    parser.add_argument(
        "--countries",
        type=str,
        nargs="+",
        help="Specific country ISO codes to process"
    )
    parser.add_argument(
        "--no-flags",
        action="store_true",
        help="Skip flag fetching"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Disable pipeline logger output"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("GOHIP Platform - 5-Point Dragnet ETL Pipeline")
    print("=" * 60)
    print()
    
    result = run_full_pipeline(
        batch_size=args.batch_size,
        use_pipeline_logger=not args.quiet,
        country_filter=args.countries,
        fetch_flags=not args.no_flags,
    )
    
    print()
    print("=" * 60)
    print(f"Pipeline Complete: {result['processed']}/{result['total']} countries")
    print(f"Failed: {result['failed']}")
    print(f"Duration: {result['duration_seconds']}s")
    print("=" * 60)
