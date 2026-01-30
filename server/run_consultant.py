#!/usr/bin/env python3
"""
GOHIP Platform - Consultant Agent Orchestrator
===============================================

Phase 4: Batch Processing Script
Runs the AI Consultant Agent for all target countries in the database.

Target Countries: DEU, SAU, SGP, GBR

Usage:
    python run_consultant.py

The script will:
1. Connect to the PostgreSQL database
2. Generate strategic assessments for each country
3. Save assessments to the strategic_summary_text column
4. Display results summary
"""

import sys
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.config import settings
from app.models.country import Country
from app.services.ai_consultant import generate_country_assessment

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# Target countries for Phase 4
TARGET_COUNTRIES = ["DEU", "SAU", "SGP", "GBR"]


def print_banner():
    """Print application banner."""
    print()
    print("=" * 70)
    print("  GOHIP Platform - AI Consultant Agent")
    print("  Sovereign OH Integrity Framework v3.0 - Phase 4")
    print("=" * 70)
    print()
    print(f"  Timestamp: {datetime.utcnow().isoformat()}")
    print(f"  OpenAI API: {'Configured' if settings.OPENAI_API_KEY else 'Not configured (using mock)'}")
    print(f"  Target Countries: {', '.join(TARGET_COUNTRIES)}")
    print()
    print("-" * 70)
    print()


def verify_countries_exist(db: Session) -> List[str]:
    """
    Verify which target countries exist in the database.
    
    Args:
        db: Database session
        
    Returns:
        List of ISO codes that exist in database
    """
    existing = []
    missing = []
    
    for iso_code in TARGET_COUNTRIES:
        country = db.query(Country).filter(Country.iso_code == iso_code).first()
        if country:
            existing.append(iso_code)
            logger.info(f"Found country: {country.name} ({iso_code})")
        else:
            missing.append(iso_code)
            logger.warning(f"Country not found in database: {iso_code}")
    
    if missing:
        print()
        print(f"WARNING: {len(missing)} countries not in database: {', '.join(missing)}")
        print("Run the ETL pipeline first: python run_pipeline.py")
        print()
    
    return existing


def run_batch_assessment(db: Session, iso_codes: List[str]) -> Dict[str, Any]:
    """
    Run assessment generation for multiple countries.
    
    Args:
        db: Database session
        iso_codes: List of country ISO codes
        
    Returns:
        Dict with results summary
    """
    results = {
        "total": len(iso_codes),
        "successful": 0,
        "failed": 0,
        "assessments": {}
    }
    
    for i, iso_code in enumerate(iso_codes, 1):
        print()
        print(f"[{i}/{len(iso_codes)}] Processing {iso_code}...")
        print("-" * 40)
        
        try:
            result = generate_country_assessment(iso_code, db)
            
            if result["success"]:
                results["successful"] += 1
                results["assessments"][iso_code] = {
                    "country_name": result["country_name"],
                    "assessment": result["assessment"],
                    "source": result["source"],
                }
                
                print(f"Country: {result['country_name']}")
                print(f"Source: {result['source'].upper()}")
                print()
                print("Assessment:")
                print("-" * 40)
                # Print wrapped assessment
                assessment = result["assessment"]
                words = assessment.split()
                line = ""
                for word in words:
                    if len(line) + len(word) + 1 > 70:
                        print(line)
                        line = word
                    else:
                        line = f"{line} {word}".strip()
                if line:
                    print(line)
                print("-" * 40)
                print("SUCCESS")
                
            else:
                results["failed"] += 1
                results["assessments"][iso_code] = {
                    "error": result["error"]
                }
                print(f"ERROR: {result['error']}")
                
        except Exception as e:
            results["failed"] += 1
            results["assessments"][iso_code] = {
                "error": str(e)
            }
            logger.error(f"Exception processing {iso_code}: {e}")
            print(f"EXCEPTION: {e}")
    
    return results


def print_summary(results: Dict[str, Any]):
    """Print final summary of batch processing."""
    print()
    print("=" * 70)
    print("  BATCH PROCESSING SUMMARY")
    print("=" * 70)
    print()
    print(f"  Total Countries: {results['total']}")
    print(f"  Successful: {results['successful']}")
    print(f"  Failed: {results['failed']}")
    print()
    
    if results["successful"] > 0:
        print("-" * 70)
        print("  GENERATED ASSESSMENTS")
        print("-" * 70)
        
        for iso_code, data in results["assessments"].items():
            if "assessment" in data:
                print()
                print(f"  [{iso_code}] {data['country_name']} (via {data['source'].upper()})")
                print()
                # Indent and wrap the assessment
                assessment = data["assessment"]
                words = assessment.split()
                line = "    "
                for word in words:
                    if len(line) + len(word) + 1 > 66:
                        print(line)
                        line = "    " + word
                    else:
                        line = f"{line} {word}".strip()
                        if not line.startswith("    "):
                            line = "    " + line
                if line.strip():
                    print(line)
                print()
    
    print("=" * 70)
    print()


def verify_database_updates(db: Session, iso_codes: List[str]):
    """Verify that assessments were saved to database."""
    print("DATABASE VERIFICATION")
    print("-" * 70)
    
    for iso_code in iso_codes:
        country = db.query(Country).filter(Country.iso_code == iso_code).first()
        if country:
            has_assessment = country.strategic_summary_text is not None
            assessment_preview = ""
            if has_assessment:
                assessment_preview = country.strategic_summary_text[:50] + "..."
            print(f"  {iso_code}: strategic_summary_text = {'SET' if has_assessment else 'NULL'}")
            if has_assessment:
                print(f"         Preview: {assessment_preview}")
    
    print("-" * 70)
    print()


def main():
    """Main entry point for the Consultant Agent orchestrator."""
    print_banner()
    
    logger.info("Connecting to database: %s", settings.DATABASE_URL.split("@")[-1])
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Verify target countries exist
        print("VERIFYING TARGET COUNTRIES")
        print("-" * 70)
        existing_countries = verify_countries_exist(db)
        
        if not existing_countries:
            logger.error("No target countries found in database!")
            print("ERROR: No target countries found. Please run the ETL pipeline first.")
            return 1
        
        print()
        print(f"Processing {len(existing_countries)} countries...")
        
        # Run batch assessment
        results = run_batch_assessment(db, existing_countries)
        
        # Print summary
        print_summary(results)
        
        # Verify database updates
        verify_database_updates(db, existing_countries)
        
        return 0 if results["failed"] == 0 else 1
        
    except Exception as e:
        logger.error(f"Orchestrator failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
