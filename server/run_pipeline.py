"""
GOHIP Platform - Full ETL Pipeline
===================================

Phase 23+: Unified 9-Source Data Engine Pipeline

This module orchestrates the complete ETL pipeline for fetching
occupational health data from multiple international sources:

Data Sources (9-Source Data Engine):
1. ILO ILOSTAT: Fatal occupational injury rates (SDG 8.8.1)
2. WHO GHO: UHC Index, Road Safety (proxy for safety culture)
3. World Bank Core: Governance, Vulnerable Employment, Health Expenditure
4. World Bank Extended: GDP, Labor, Health (via IntelligencePipeline)
5. Transparency International: Corruption Perceptions Index (CPI)
6. UNDP: Human Development Index (HDI)
7. Yale: Environmental Performance Index (EPI)
8. IHME: Global Burden of Disease (GBD) - Occupational DALYs
9. World Justice Project: Rule of Law Index
10. OECD: Work-Life Balance (OECD countries only)
11. Wikipedia: Country flag images

Pipeline Features:
- Per-country resilient processing (failures don't stop pipeline)
- Real-time status tracking via pipeline_logger
- Comprehensive logging of all data sources fetched
- Rate limiting between API calls
- Maturity score calculation
- Pillar score calculation
- Intelligence score calculation

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

# Intelligence Pipeline and Reference Data (Additional 6 Sources)
from app.services.etl.intelligence_pipeline import IntelligencePipeline
from app.services.etl.intelligence_client import get_cpi_data, get_hdi_data, get_epi_data
from app.data.intelligence_reference import get_ihme_gbd_data, get_wjp_data, get_oecd_data

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
    Execute the full 9-Source Data Engine ETL pipeline.
    
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
    
    The 9-Source Data Engine:
    =========================
    1. [CORE]    ILO Fatal Rate → Pillar 1: Fatal Accident Rate
    2. [CORE]    WHO UHC Index → Pillar 2: Health Coverage
    3. [CORE]    WHO Road Safety → Fallback for missing ILO data
    4. [CORE]    World Bank Core → Governance, Vulnerable Emp, Health Exp
    5. [INTEL]   World Bank Extended → GDP, Labor, Demographics
    6. [INTEL]   TI Corruption Perceptions Index (CPI)
    7. [INTEL]   UNDP Human Development Index (HDI)
    8. [INTEL]   Yale Environmental Performance Index (EPI)
    9. [INTEL]   IHME Global Burden of Disease (Occupational DALYs)
    10. [INTEL]  World Justice Project Rule of Law Index
    11. [INTEL]  OECD Work-Life Balance (OECD countries only)
    12. [FLAGS]  Wikipedia → Country flag images
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
        pipeline_logger.phase("9-Source Data Engine ETL Pipeline")
        pipeline_logger.log(f"Processing {total_countries} countries")
        pipeline_logger.log("=" * 50)
        pipeline_logger.log("DATA SOURCES TO FETCH:")
        pipeline_logger.log("  [1] ILO ILOSTAT - Fatal Occupational Injury Rates")
        pipeline_logger.log("  [2] WHO GHO - UHC Index & Road Safety")
        pipeline_logger.log("  [3] World Bank - Governance & Health Expenditure")
        pipeline_logger.log("  [4] TI CPI - Corruption Perceptions Index")
        pipeline_logger.log("  [5] UNDP HDI - Human Development Index")
        pipeline_logger.log("  [6] Yale EPI - Environmental Performance Index")
        pipeline_logger.log("  [7] IHME GBD - Occupational Disease Burden (DALYs)")
        pipeline_logger.log("  [8] WJP - Rule of Law Index")
        pipeline_logger.log("  [9] OECD - Work-Life Balance (OECD countries)")
        pipeline_logger.log("=" * 50)
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
                # STEP 4: Fetch Intelligence Data (6 Additional Sources)
                # =====================================================================
                intel_sources_fetched = []
                
                # SOURCE 4: Transparency International CPI
                cpi_data = get_cpi_data(iso_code)
                if cpi_data:
                    cpi_score = cpi_data.get("score")
                    cpi_rank = cpi_data.get("rank")
                    intel_sources_fetched.append("CPI")
                    if use_pipeline_logger:
                        pipeline_logger.success(f"  TI CPI: Score={cpi_score}, Rank={cpi_rank}")
                else:
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  TI CPI: No data")
                
                # SOURCE 5: UNDP Human Development Index
                hdi_data = get_hdi_data(iso_code)
                if hdi_data:
                    hdi_score = hdi_data.get("score")
                    hdi_rank = hdi_data.get("rank")
                    intel_sources_fetched.append("HDI")
                    if use_pipeline_logger:
                        pipeline_logger.success(f"  UNDP HDI: Score={hdi_score:.3f}, Rank={hdi_rank}")
                else:
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  UNDP HDI: No data")
                
                # SOURCE 6: Yale Environmental Performance Index
                epi_data = get_epi_data(iso_code)
                if epi_data:
                    epi_score = epi_data.get("score")
                    epi_rank = epi_data.get("rank")
                    epi_air = epi_data.get("air_quality")
                    intel_sources_fetched.append("EPI")
                    if use_pipeline_logger:
                        pipeline_logger.success(f"  Yale EPI: Score={epi_score:.1f}, Rank={epi_rank}, Air={epi_air}")
                else:
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  Yale EPI: No data")
                
                # SOURCE 7: IHME Global Burden of Disease
                gbd_data = get_ihme_gbd_data(iso_code)
                if gbd_data:
                    daly_total = gbd_data.get("daly_occupational_total")
                    deaths_total = gbd_data.get("deaths_occupational_total")
                    intel_sources_fetched.append("IHME_GBD")
                    if use_pipeline_logger:
                        pipeline_logger.success(f"  IHME GBD: DALYs={daly_total}, Deaths={deaths_total}")
                else:
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  IHME GBD: No data")
                
                # SOURCE 8: World Justice Project Rule of Law
                wjp_data = get_wjp_data(iso_code)
                if wjp_data:
                    rol_index = wjp_data.get("rule_of_law_index")
                    reg_enforcement = wjp_data.get("regulatory_enforcement")
                    intel_sources_fetched.append("WJP")
                    if use_pipeline_logger:
                        pipeline_logger.success(f"  WJP Rule of Law: Index={rol_index:.2f}, Enforcement={reg_enforcement:.2f}")
                else:
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  WJP Rule of Law: No data")
                
                # SOURCE 9: OECD Work-Life Balance (OECD countries only)
                oecd_data = get_oecd_data(iso_code)
                if oecd_data:
                    work_life = oecd_data.get("work_life_balance")
                    hours_annual = oecd_data.get("hours_worked_annual")
                    intel_sources_fetched.append("OECD")
                    if use_pipeline_logger:
                        pipeline_logger.success(f"  OECD Work-Life: Balance={work_life:.1f}, Hours/yr={hours_annual}")
                else:
                    if use_pipeline_logger:
                        pipeline_logger.log(f"  OECD Work-Life: No data (non-OECD)")
                
                # Log intelligence summary
                if use_pipeline_logger:
                    if intel_sources_fetched:
                        pipeline_logger.log(f"  Intelligence Sources: {', '.join(intel_sources_fetched)} ({len(intel_sources_fetched)}/6)")
                    else:
                        pipeline_logger.log(f"  Intelligence Sources: None available")
                
                # =====================================================================
                # STEP 5: Calculate Pillar Scores
                # =====================================================================
                if use_pipeline_logger:
                    pipeline_logger.log(f"  Calculating pillar scores...")
                    
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
                # STEP 6: Upsert Core Data to Database
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
                # STEP 7: Save Intelligence Data (via IntelligencePipeline)
                # =====================================================================
                try:
                    intel_pipeline = IntelligencePipeline(db)
                    intel_result = intel_pipeline.process_country(iso_code)
                    
                    if intel_result["success"]:
                        sources_saved = intel_result.get("sources_used", [])
                        if use_pipeline_logger and sources_saved:
                            pipeline_logger.success(f"  Intelligence saved: {', '.join(sources_saved)}")
                    else:
                        if use_pipeline_logger and intel_result.get("error"):
                            pipeline_logger.warning(f"  Intelligence save warning: {intel_result['error']}")
                except Exception as e:
                    logger.warning(f"Intelligence pipeline failed for {iso_code}: {e}")
                    if use_pipeline_logger:
                        pipeline_logger.warning(f"  Intelligence pipeline error: {e}")
                
                # =====================================================================
                # STEP 8: Fetch Flag (if enabled)
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
                
                # Compile list of all data sources fetched for this country
                all_sources = []
                if fatal_rate is not None:
                    all_sources.append("ILO")
                if uhc_index is not None or road_safety is not None:
                    all_sources.append("WHO")
                if gov_effectiveness is not None or health_expenditure is not None:
                    all_sources.append("WorldBank")
                all_sources.extend(intel_sources_fetched)
                
                if use_pipeline_logger:
                    pipeline_logger.complete_country(iso_code, fatal_rate)
                    pipeline_logger.success(f"  COMPLETE: {country_name} | Sources: {', '.join(all_sources) if all_sources else 'None'} ({len(all_sources)} sources)")
                
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
            pipeline_logger.log("=" * 50)
            pipeline_logger.log("9-SOURCE DATA ENGINE SUMMARY")
            pipeline_logger.log("=" * 50)
            pipeline_logger.log(f"Countries Processed: {success_count}/{total_countries}")
            pipeline_logger.log(f"Countries Failed: {failed_count}")
            pipeline_logger.log(f"Duration: {elapsed:.1f}s")
            pipeline_logger.log("=" * 50)
            pipeline_logger.log("DATA SOURCES AVAILABLE:")
            pipeline_logger.log("  [1] ILO ILOSTAT - Fetched via API")
            pipeline_logger.log("  [2] WHO GHO - Fetched via API")
            pipeline_logger.log("  [3] World Bank - Fetched via API")
            pipeline_logger.log("  [4] TI CPI - Reference data")
            pipeline_logger.log("  [5] UNDP HDI - Reference data")
            pipeline_logger.log("  [6] Yale EPI - Reference data")
            pipeline_logger.log("  [7] IHME GBD - Reference data")
            pipeline_logger.log("  [8] WJP Rule of Law - Reference data")
            pipeline_logger.log("  [9] OECD Work-Life - Reference data (OECD only)")
            pipeline_logger.log("=" * 50)
            pipeline_logger.finish(success=failed_count == 0)
        
        return {
            "success": True,
            "total": total_countries,
            "processed": success_count,
            "failed": failed_count,
            "duration_seconds": round(elapsed, 1),
            "data_sources": [
                "ILO_ILOSTAT",
                "WHO_GHO", 
                "WORLD_BANK",
                "TI_CPI",
                "UNDP_HDI",
                "YALE_EPI",
                "IHME_GBD",
                "WJP_ROL",
                "OECD"
            ],
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
    print("GOHIP Platform - 9-Source Data Engine ETL Pipeline")
    print("=" * 60)
    print("Data Sources:")
    print("  [1] ILO ILOSTAT    [4] TI CPI     [7] IHME GBD")
    print("  [2] WHO GHO        [5] UNDP HDI   [8] WJP Rule of Law")
    print("  [3] World Bank     [6] Yale EPI   [9] OECD Work-Life")
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
