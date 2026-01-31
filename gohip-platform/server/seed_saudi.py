#!/usr/bin/env python3
"""
GOHIP Platform - Saudi Arabia Data Seeder
Sovereign OH Integrity Framework v3.0

This script seeds the database with Saudi Arabia (SAU) reference data
as defined in the Master Country Table.

Run: python seed_saudi.py
"""

import os
import sys
import uuid
from datetime import datetime

# Add the server directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import (
    Country,
    GovernanceLayer,
    Pillar1Hazard,
    Pillar2Vigilance,
    Pillar3Restoration,
    HeatStressRegulationType,
    SurveillanceLogicType,
    PayerMechanismType,
)


def get_database_url():
    """Get database URL from environment."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/gohip_db"
    )


def create_saudi_data():
    """
    Create Saudi Arabia (SAU) data based on the Master Country Table.
    
    Saudi Arabia represents a "Tier 2 - Developing" occupational health system with:
    - Improving governance under Vision 2030
    - Higher fatality rates (construction, oil/gas sectors)
    - Mandatory surveillance (not risk-based)
    - Litigation-based compensation system
    """
    
    # Country Base Record
    saudi = Country(
        iso_code="SAU",
        name="Saudi Arabia",
        maturity_score=None,  # Will be calculated by scoring service
        created_at=datetime.utcnow(),
    )
    
    # Governance Layer - Developing institutional framework
    governance = GovernanceLayer(
        id=str(uuid.uuid4()),
        country_iso_code="SAU",
        ilo_c187_status=False,  # Not ratified C187
        ilo_c155_status=False,  # Not ratified C155
        inspector_density=0.4,   # 0.4 inspectors per 10,000 workers
        mental_health_policy=False,  # No national workplace mental health policy
        strategic_capacity_score=45.0,
        source_urls={
            "ilo_conventions": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11200:0::NO::P11200_COUNTRY_ID:103208",
            "inspector_density": "https://www.mhrsd.gov.sa/en",
            "vision_2030": "https://www.vision2030.gov.sa/en/",
        },
        created_at=datetime.utcnow(),
    )
    
    # Pillar 1: Hazard Control - Higher risk industries (DENSIFIED)
    pillar1 = Pillar1Hazard(
        id=str(uuid.uuid4()),
        country_iso_code="SAU",
        fatal_accident_rate=3.21,     # 3.21 per 100,000 workers (ILO estimate)
        carcinogen_exposure_pct=12.5, # 12.5% workforce exposed (oil/gas sector)
        heat_stress_reg_type=HeatStressRegulationType.ADVISORY,  # Advisory only
        # === NEW DENSIFIED METRICS (with data gaps) ===
        oel_compliance_pct=None,       # No reliable OEL data available
        noise_induced_hearing_loss_rate=None,  # NIHL data not systematically tracked
        safety_training_hours_avg=8.0,        # Limited training (8 hours/year estimate)
        control_maturity_score=42.0,
        source_urls={
            "fatal_accident_rate": "ILO ILOSTAT estimate (2021)",
            "heat_stress": "https://www.mhrsd.gov.sa/en/labor/regulations",
            "carcinogen_exposure": "https://www.aramco.com/en/sustainability/safety",
            "safety_training": "https://www.mhrsd.gov.sa/en/labor/training-requirements",
        },
        created_at=datetime.utcnow(),
    )
    
    # Pillar 2: Health Vigilance - Mandatory (not risk-based) (DENSIFIED)
    pillar2 = Pillar2Vigilance(
        id=str(uuid.uuid4()),
        country_iso_code="SAU",
        surveillance_logic=SurveillanceLogicType.MANDATORY,  # Mandatory, not risk-based
        disease_detection_rate=45.2,   # Lower detection rate
        vulnerability_index=58.5,      # Higher vulnerability
        # === NEW DENSIFIED METRICS (HIGH MIGRANT CONTEXT) ===
        migrant_worker_pct=76.0,        # 76% migrant workforce (very high - Kafala legacy)
        lead_exposure_screening_rate=35.0,  # Limited screening (35%)
        occupational_disease_reporting_rate=28.0,  # Low reporting compliance
        source_urls={
            "surveillance_system": "https://www.moh.gov.sa/en/Pages/default.aspx",
            "regulations": "https://www.mhrsd.gov.sa/en/labor/regulations",
            "migrant_workforce": "https://www.stats.gov.sa/en/1025",
            "health_screening": "https://www.moh.gov.sa/en/HealthAwareness/EducationalContent/PublicHealth/Pages/Occupational.aspx",
        },
        created_at=datetime.utcnow(),
    )
    
    # Pillar 3: Restoration - Litigation-based, no mandatory rehab (DENSIFIED)
    pillar3 = Pillar3Restoration(
        id=str(uuid.uuid4()),
        country_iso_code="SAU",
        payer_mechanism=PayerMechanismType.LITIGATION,  # Litigation-based
        reintegration_law=False,        # No mandatory return-to-work legislation
        sickness_absence_days=8.5,      # Lower reported absence (underreporting)
        rehab_access_score=35.0,        # Limited rehabilitation access
        # === NEW DENSIFIED METRICS (LIMITED DATA) ===
        return_to_work_success_pct=40.0,  # 40% RTW success (estimated, low)
        avg_claim_settlement_days=180.0,  # Long claim settlement (180 days avg)
        rehab_participation_rate=22.0,    # Low rehab participation (22%)
        source_urls={
            "compensation_system": "https://gosi.gov.sa/GOSIOnline/",
            "labor_law": "https://www.mhrsd.gov.sa/en/labor/laws",
            "gosi_benefits": "https://gosi.gov.sa/GOSIOnline/OH_Benefits",
            "vision_2030_labor": "https://www.vision2030.gov.sa/en/v2030/vrps/ntp/",
        },
        created_at=datetime.utcnow(),
    )
    
    return saudi, governance, pillar1, pillar2, pillar3


def seed_saudi():
    """Seed the database with Saudi Arabia data."""
    
    print("=" * 60)
    print("GOHIP Platform - Saudi Arabia Data Seeder")
    print("Sovereign OH Integrity Framework v3.0")
    print("=" * 60)
    print()
    
    # Get database URL
    database_url = get_database_url()
    print(f"Database: {database_url.split('@')[-1]}")
    print()
    
    # Create engine and session
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all tables (if they don't exist)
    print("Creating tables if not exist...")
    Base.metadata.create_all(bind=engine)
    print("Tables ready.")
    print()
    
    # Create session
    session = SessionLocal()
    
    try:
        # Check if Saudi Arabia already exists
        existing = session.query(Country).filter_by(iso_code="SAU").first()
        if existing:
            print("Saudi Arabia (SAU) data already exists in database.")
            print("Skipping insertion to avoid duplicates.")
            print()
            return False
        
        # Create Saudi Arabia data
        saudi, governance, pillar1, pillar2, pillar3 = create_saudi_data()
        
        # Add to session
        print("Inserting Saudi Arabia (SAU) data...")
        session.add(saudi)
        session.flush()
        
        session.add(governance)
        session.add(pillar1)
        session.add(pillar2)
        session.add(pillar3)
        
        # Commit transaction
        session.commit()
        
        print()
        print("=" * 60)
        print("Saudi Arabia Data Inserted Successfully")
        print("=" * 60)
        print()
        print("Summary:")
        print(f"  Country: {saudi.name} ({saudi.iso_code})")
        print(f"  Maturity Score: (to be calculated)")
        print()
        print("  Governance Layer:")
        print(f"    - ILO C187 Ratified: {governance.ilo_c187_status}")
        print(f"    - ILO C155 Ratified: {governance.ilo_c155_status}")
        print(f"    - Inspector Density: {governance.inspector_density}/10k workers")
        print(f"    - Mental Health Policy: {governance.mental_health_policy}")
        print(f"    - Strategic Capacity Score: {governance.strategic_capacity_score}")
        print()
        print("  Pillar 1 - Hazard Control:")
        print(f"    - Fatal Accident Rate: {pillar1.fatal_accident_rate}/100k workers")
        print(f"    - Carcinogen Exposure: {pillar1.carcinogen_exposure_pct}%")
        print(f"    - Heat Stress Regulation: {pillar1.heat_stress_reg_type.value}")
        print(f"    - Control Maturity Score: {pillar1.control_maturity_score}")
        print()
        print("  Pillar 2 - Health Vigilance:")
        print(f"    - Surveillance Logic: {pillar2.surveillance_logic.value}")
        print(f"    - Disease Detection Rate: {pillar2.disease_detection_rate}/100k")
        print(f"    - Vulnerability Index: {pillar2.vulnerability_index}")
        print()
        print("  Pillar 3 - Restoration:")
        print(f"    - Payer Mechanism: {pillar3.payer_mechanism.value}")
        print(f"    - Reintegration Law: {pillar3.reintegration_law}")
        print(f"    - Sickness Absence Days: {pillar3.sickness_absence_days}")
        print(f"    - Rehab Access Score: {pillar3.rehab_access_score}")
        print()
        print("=" * 60)
        
        return True
        
    except Exception as e:
        session.rollback()
        print(f"Error inserting data: {e}")
        raise
        
    finally:
        session.close()


if __name__ == "__main__":
    try:
        success = seed_saudi()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Seeder failed: {e}")
        sys.exit(1)
