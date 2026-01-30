#!/usr/bin/env python3
"""
GOHIP Platform - Germany Data Seeder
Sovereign OH Integrity Framework v3.0

This script seeds the database with Germany (DEU) reference data
as defined in the Master Country Table.

Run: python seed_germany.py
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


def create_germany_data():
    """
    Create Germany (DEU) data based on the Master Country Table.
    
    Germany represents a "Tier 1 - Mature" occupational health system with:
    - Strong governance and ILO convention ratification
    - Comprehensive hazard control regulations
    - Risk-based health surveillance
    - No-fault workers' compensation with strong rehabilitation
    """
    
    # Country Base Record
    germany = Country(
        iso_code="DEU",
        name="Germany",
        maturity_score=87.5,  # Tier 1 - Mature system
        created_at=datetime.utcnow(),
    )
    
    # Governance Layer - Strong institutional framework
    governance = GovernanceLayer(
        id=str(uuid.uuid4()),
        country_iso_code="DEU",
        ilo_c187_status=True,   # Ratified C187 Promotional Framework
        ilo_c155_status=True,   # Ratified C155 Occupational Safety & Health
        inspector_density=1.2,  # 1.2 inspectors per 10,000 workers (exceeds ILO minimum)
        mental_health_policy=True,  # National workplace mental health policy exists
        strategic_capacity_score=92.0,
        source_urls={
            "ilo_c187": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11310:0::NO::P11310_INSTRUMENT_ID:312332",
            "ilo_c155": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11310:0::NO::P11310_INSTRUMENT_ID:312300",
            "inspector_density": "https://www.baua.de/EN/Service/Statistics/statistics_node.html",
            "mental_health_policy": "https://www.bmas.de/EN/Services/Publications/mental-health-at-work.html",
        },
        created_at=datetime.utcnow(),
    )
    
    # Pillar 1: Hazard Control - Comprehensive regulations (DENSIFIED)
    pillar1 = Pillar1Hazard(
        id=str(uuid.uuid4()),
        country_iso_code="DEU",
        fatal_accident_rate=0.8,       # 0.8 per 100,000 workers (excellent)
        carcinogen_exposure_pct=8.2,   # 8.2% workforce exposed to carcinogens
        heat_stress_reg_type=HeatStressRegulationType.STRICT,  # Strict heat regulations
        # === NEW DENSIFIED METRICS ===
        oel_compliance_pct=95.0,       # 95% OEL compliance - Excellent (German precision)
        noise_induced_hearing_loss_rate=12.5,  # Low NIHL rate per 100,000
        safety_training_hours_avg=24.0,        # 24 hours/year average safety training
        control_maturity_score=89.0,
        source_urls={
            "fatal_accident_rate": "https://ec.europa.eu/eurostat/databrowser/view/hsw_n2_02/default/table",
            "carcinogen_exposure": "https://osha.europa.eu/en/themes/dangerous-substances/carcinogens-mutagens",
            "heat_stress": "https://www.baua.de/DE/Themen/Arbeitsgestaltung/Physische-Belastung/Klima/Klima_node.html",
            "oel_compliance": "https://www.baua.de/EN/Topics/Work-design/Hazardous-substances/TRGS/TRGS.html",
            "nihl_rate": "https://www.dguv.de/en/statistics/occupational-diseases/index.jsp",
            "safety_training": "https://www.bmas.de/EN/Services/Publications/occupational-safety-health.html",
        },
        created_at=datetime.utcnow(),
    )
    
    # Pillar 2: Health Vigilance - Risk-based surveillance (DENSIFIED)
    pillar2 = Pillar2Vigilance(
        id=str(uuid.uuid4()),
        country_iso_code="DEU",
        surveillance_logic=SurveillanceLogicType.RISK_BASED,  # Risk-based surveillance
        disease_detection_rate=156.3,   # Cases per 100,000 workers
        vulnerability_index=18.5,       # Low vulnerability (0-100, lower is better)
        # === NEW DENSIFIED METRICS ===
        migrant_worker_pct=12.8,        # 12.8% migrant workforce (moderate)
        lead_exposure_screening_rate=92.0,  # 92% screening compliance
        occupational_disease_reporting_rate=94.5,  # High reporting compliance
        source_urls={
            "surveillance_system": "https://www.dguv.de/en/index.jsp",
            "disease_detection": "https://www.baua.de/EN/Topics/Work-and-Health/Occupational-Diseases/Occupational-Diseases_node.html",
            "vulnerability": "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Accidents_at_work_statistics",
            "migrant_workforce": "https://www.destatis.de/EN/Themes/Labour/Labour-Market/Employment/Tables/foreign-employees.html",
            "lead_screening": "https://www.baua.de/EN/Topics/Work-design/Hazardous-substances/BioMon/BioMon.html",
            "disease_reporting": "https://www.baua.de/EN/Topics/Work-and-Health/Occupational-Diseases/reporting.html",
        },
        created_at=datetime.utcnow(),
    )
    
    # Pillar 3: Restoration - No-fault compensation with strong rehabilitation (DENSIFIED)
    pillar3 = Pillar3Restoration(
        id=str(uuid.uuid4()),
        country_iso_code="DEU",
        payer_mechanism=PayerMechanismType.NO_FAULT,  # No-fault workers' compensation
        reintegration_law=True,         # Mandatory return-to-work legislation
        sickness_absence_days=18.3,     # Average days per worker per year
        rehab_access_score=91.0,        # Excellent rehabilitation access
        # === NEW DENSIFIED METRICS ===
        return_to_work_success_pct=88.0,  # 88% RTW success rate (excellent)
        avg_claim_settlement_days=45.0,   # Fast claim settlement (45 days avg)
        rehab_participation_rate=82.0,    # 82% participation in rehab programs
        source_urls={
            "compensation_system": "https://www.dguv.de/en/benefits/index.jsp",
            "reintegration": "https://www.bmas.de/EN/Services/Publications/return-to-work.html",
            "sickness_absence": "https://www.destatis.de/EN/Home/_node.html",
            "rehabilitation": "https://www.bar-frankfurt.de/english.html",
            "rtw_success": "https://www.dguv.de/en/rehabilitation/index.jsp",
            "claim_settlement": "https://www.dguv.de/en/benefits/cash-benefits/index.jsp",
            "rehab_participation": "https://www.bar-frankfurt.de/english/rehabilitation.html",
        },
        created_at=datetime.utcnow(),
    )
    
    return germany, governance, pillar1, pillar2, pillar3


def seed_germany():
    """Seed the database with Germany data."""
    
    print("=" * 60)
    print("GOHIP Platform - Germany Data Seeder")
    print("Sovereign OH Integrity Framework v3.0")
    print("=" * 60)
    print()
    
    # Get database URL
    database_url = get_database_url()
    print(f"Database: {database_url.split('@')[-1]}")  # Print only host/db part
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
        # Check if Germany already exists
        existing = session.query(Country).filter_by(iso_code="DEU").first()
        if existing:
            print("Germany (DEU) data already exists in database.")
            print("Skipping insertion to avoid duplicates.")
            print()
            return False
        
        # Create Germany data
        germany, governance, pillar1, pillar2, pillar3 = create_germany_data()
        
        # Add to session
        print("Inserting Germany (DEU) data...")
        session.add(germany)
        session.flush()  # Flush to ensure country exists for foreign keys
        
        session.add(governance)
        session.add(pillar1)
        session.add(pillar2)
        session.add(pillar3)
        
        # Commit transaction
        session.commit()
        
        print()
        print("=" * 60)
        print("Germany Data Inserted Successfully")
        print("=" * 60)
        print()
        print("Summary:")
        print(f"  Country: {germany.name} ({germany.iso_code})")
        print(f"  Maturity Score: {germany.maturity_score}")
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
        success = seed_germany()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Seeder failed: {e}")
        sys.exit(1)
