#!/usr/bin/env python3
"""
GOHIP Platform - Full Framework ETL Pipeline
=============================================

Phase 26: Multi-Source Intelligence Integration

Automated data pipeline implementing comprehensive multi-source data fusion from:

CORE DATA SOURCES (API-based):
- ILO ILOSTAT: Fatal injury rates (SDG 8.8.1) [Primary]
- WHO GHO: Road Safety, UHC Index [Proxy/Secondary]
- World Bank: Governance, Vulnerable Employment, Health Expenditure [Context]
- World Bank Extended: 6 Governance Indicators, Economic, Labor, Health [Deep]

INTELLIGENCE DATA SOURCES (Reference + API):
- Transparency International: Corruption Perception Index (CPI)
- UNDP: Human Development Index (HDI), Education Index
- Yale EPI: Environmental Performance, Air Quality
- IHME GBD: Occupational DALYs, Disease Burden, Mortality
- World Justice Project: Rule of Law, Regulatory Enforcement
- OECD: Work-Life Balance (OECD countries only)
- Curated Reference Data: Policy classifications, compliance rates [Curated]

=====================================================================
FULL FRAMEWORK DATA MAPPING:
=====================================================================

GOVERNANCE LAYER:
- ILO C187/C155 Ratification Status → Reference Data
- Inspector Density → Reference Data
- Mental Health Policy → Reference Data
- Strategic Capacity Score → World Bank GE.EST

PILLAR 1: HAZARD CONTROL:
- Fatal Accident Rate → ILO ILOSTAT / WHO Proxy
- Carcinogen Exposure % → Reference Data
- Heat Stress Regulation → Reference Data
- OEL Compliance % → Reference Data
- NIHL Rate → Reference Data
- Safety Training Hours → Reference Data
- Control Maturity Score → Computed

PILLAR 2: HEALTH VIGILANCE:
- Surveillance Logic → Reference Data
- Disease Detection Rate → WHO UHC Index
- Vulnerability Index → World Bank
- Migrant Workforce % → Reference Data
- Lead Screening Rate → Reference Data
- Disease Reporting Rate → Reference Data

PILLAR 3: RESTORATION:
- Payer Mechanism → Reference Data
- Reintegration Law → Reference Data
- Sickness Absence Days → Reference Data
- Rehab Access Score → World Bank Health Expenditure
- RTW Success Rate → Reference Data
- Claim Settlement Days → Reference Data
- Rehab Participation Rate → Reference Data

Features:
- Multi-source data fusion with fall-through logic
- Full framework population (all 4 layers)
- Per-country resilience (failures don't stop pipeline)
- Detailed source tracking for transparency

Usage:
    python run_pipeline.py [--batch-size N]
"""

import sys
import time
import logging
import argparse
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from uuid import uuid4

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import SessionLocal, engine
from app.core.config import settings
from app.models.country import Country, Pillar1Hazard, Pillar2Vigilance, Pillar3Restoration, GovernanceLayer
from app.services.etl.ilo_client import ILOClient
from app.services.etl.wb_client import WorldBankClient
from app.services.etl.who_client import WHOClient, calculate_proxy_fatal_rate
from app.services.scoring import calculate_maturity_score
from app.data.targets import GLOBAL_ECONOMIES_50, COUNTRY_NAMES, get_country_name
from app.data.reference_data import (
    get_governance_data,
    get_pillar_1_data,
    get_pillar_2_data,
    get_pillar_3_data,
    get_all_reference_data
)

# Import pipeline_logger for stop request checking (used in both CLI and API modes)
from app.services.pipeline_logger import pipeline_logger, LogLevel

# Configure logging with colors for terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ANSI color codes for terminal output
class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


# Rate limiting configuration
RATE_LIMIT_DELAY = 0.5  # seconds between API calls


class StatisticianPipeline:
    """
    ETL Pipeline orchestrator for GOHIP occupational health data.
    
    Phase 22: 5-Point Dragnet - Multi-source Data Fusion
    
    Implements fall-through logic:
    1. ILO (Primary) → WHO (Proxy) for fatal rates
    2. World Bank for governance/vulnerability/health context
    """
    
    def __init__(self, db: Session, batch_size: int = 10):
        self.db = db
        self.ilo_client = ILOClient()
        self.wb_client = WorldBankClient()
        self.who_client = WHOClient()  # Phase 22: WHO integration
        self.batch_size = batch_size
        self.target_countries = GLOBAL_ECONOMIES_50.copy()
        self.stats = {
            "countries_processed": 0,
            "countries_created": 0,
            "countries_updated": 0,
            "hazard_records_created": 0,
            "hazard_records_updated": 0,
            "vigilance_records_updated": 0,
            "restoration_records_updated": 0,
            "governance_records_updated": 0,
            "ilo_direct_hits": 0,
            "who_proxy_hits": 0,
            "successful": [],
            "failed": [],
            "errors": [],
            "data_sources_used": []  # Track which sources contributed
        }
    
    def ensure_country_exists(self, iso_code: str) -> Country:
        """
        Ensure a country record exists, creating it if necessary.
        
        Args:
            iso_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Country model instance
        """
        country = self.db.query(Country).filter(Country.iso_code == iso_code).first()
        
        if not country:
            country_name = get_country_name(iso_code)
            country = Country(
                iso_code=iso_code,
                name=country_name
            )
            self.db.add(country)
            self.db.flush()
            self.stats["countries_created"] += 1
            logger.info(f"Created country: {country_name} ({iso_code})")
        else:
            self.stats["countries_updated"] += 1
        
        return country
    
    def upsert_pillar1_hazard(
        self, 
        iso_code: str, 
        fatal_rate: float = None,
        carcinogen_exposure_pct: float = None,
        heat_stress_reg_type: str = None,
        oel_compliance_pct: float = None,
        noise_induced_hearing_loss_rate: float = None,
        safety_training_hours_avg: float = None,
        source_url: str = None,
        ref_source: str = None
    ) -> Pillar1Hazard:
        """
        Upsert Pillar 1 (Hazard Control) data for a country.
        
        Phase 24: Now populates ALL Pillar 1 metrics.
        """
        # Ensure country exists first
        self.ensure_country_exists(iso_code)
        
        # Find or create hazard record
        hazard = self.db.query(Pillar1Hazard).filter(
            Pillar1Hazard.country_iso_code == iso_code
        ).first()
        
        if not hazard:
            hazard = Pillar1Hazard(
                id=str(uuid4()),
                country_iso_code=iso_code,
                source_urls={}
            )
            self.db.add(hazard)
            self.db.flush()  # Ensure record is visible to subsequent queries
            self.stats["hazard_records_created"] += 1
        else:
            self.stats["hazard_records_updated"] += 1
        
        # Update all fields if provided
        if fatal_rate is not None:
            hazard.fatal_accident_rate = fatal_rate
        
        if carcinogen_exposure_pct is not None:
            hazard.carcinogen_exposure_pct = carcinogen_exposure_pct
        
        if heat_stress_reg_type is not None:
            hazard.heat_stress_reg_type = heat_stress_reg_type
        
        if oel_compliance_pct is not None:
            hazard.oel_compliance_pct = oel_compliance_pct
        
        if noise_induced_hearing_loss_rate is not None:
            hazard.noise_induced_hearing_loss_rate = noise_induced_hearing_loss_rate
        
        if safety_training_hours_avg is not None:
            hazard.safety_training_hours_avg = safety_training_hours_avg
        
        # Calculate control maturity score based on available data
        if hazard.fatal_accident_rate is not None and hazard.oel_compliance_pct is not None:
            # Simple scoring: lower fatal rate + higher compliance = higher maturity
            fatal_component = max(0, 100 - (hazard.fatal_accident_rate * 8))  # 0-100 scale
            compliance_component = hazard.oel_compliance_pct or 50
            hazard.control_maturity_score = round((fatal_component * 0.6 + compliance_component * 0.4), 1)
        
        # Update source URLs
        if hazard.source_urls is None:
            hazard.source_urls = {}
        if source_url:
            hazard.source_urls["fatal_accident_rate"] = source_url
        if ref_source:
            hazard.source_urls["reference_data"] = ref_source
        
        # Update timestamp
        hazard.updated_at = datetime.utcnow()
        
        return hazard
    
    def update_country_attributes(
        self,
        iso_code: str,
        industry_pct_gdp: float = None,
        source_info: str = None
    ) -> GovernanceLayer:
        """
        Update governance layer with industry context data.
        """
        # Ensure country exists
        self.ensure_country_exists(iso_code)
        
        # Find or create governance layer
        governance = self.db.query(GovernanceLayer).filter(
            GovernanceLayer.country_iso_code == iso_code
        ).first()
        
        if not governance:
            governance = GovernanceLayer(
                id=str(uuid4()),
                country_iso_code=iso_code,
                source_urls={}
            )
            self.db.add(governance)
            self.db.flush()  # Ensure record is visible to subsequent queries
        
        # Store industry data in source_urls JSONB (flexible attributes)
        if industry_pct_gdp is not None:
            if governance.source_urls is None:
                governance.source_urls = {}
            
            governance.source_urls["economic_context"] = {
                "industry_pct_gdp": industry_pct_gdp,
                "source": source_info,
                "updated_at": datetime.utcnow().isoformat()
            }
        
        governance.updated_at = datetime.utcnow()
        
        return governance
    
    def upsert_governance_layer(
        self,
        iso_code: str,
        ilo_c187_status: bool = None,
        ilo_c155_status: bool = None,
        inspector_density: float = None,
        mental_health_policy: bool = None,
        strategic_capacity_score: float = None,
        gov_effectiveness_raw: float = None,
        source_url: str = None,
        ref_source: str = None
    ) -> GovernanceLayer:
        """
        Upsert Governance Layer with full data.
        
        Phase 24: Now populates ALL governance metrics.
        """
        self.ensure_country_exists(iso_code)
        
        governance = self.db.query(GovernanceLayer).filter(
            GovernanceLayer.country_iso_code == iso_code
        ).first()
        
        if not governance:
            governance = GovernanceLayer(
                id=str(uuid4()),
                country_iso_code=iso_code,
                source_urls={}
            )
            self.db.add(governance)
            self.db.flush()  # Ensure record is visible to subsequent queries
        
        # Update all fields if provided
        if ilo_c187_status is not None:
            governance.ilo_c187_status = ilo_c187_status
        
        if ilo_c155_status is not None:
            governance.ilo_c155_status = ilo_c155_status
        
        if inspector_density is not None:
            governance.inspector_density = inspector_density
        
        if mental_health_policy is not None:
            governance.mental_health_policy = mental_health_policy
        
        if strategic_capacity_score is not None:
            governance.strategic_capacity_score = strategic_capacity_score
            self.stats["governance_records_updated"] += 1
        
        # Store source information
        if governance.source_urls is None:
            governance.source_urls = {}
        
        if gov_effectiveness_raw is not None:
            governance.source_urls["wb_gov_effectiveness"] = {
                "raw_value": gov_effectiveness_raw,
                "normalized_value": strategic_capacity_score,
                "source": source_url,
                "updated_at": datetime.utcnow().isoformat()
            }
        
        if ref_source:
            governance.source_urls["reference_data"] = ref_source
        
        governance.updated_at = datetime.utcnow()
        return governance
    
    def upsert_pillar2_vigilance(
        self,
        iso_code: str,
        surveillance_logic: str = None,
        disease_detection_rate: float = None,
        vulnerability_index: float = None,
        migrant_worker_pct: float = None,
        lead_exposure_screening_rate: float = None,
        occupational_disease_reporting_rate: float = None,
        source_url: str = None,
        ref_source: str = None
    ) -> Pillar2Vigilance:
        """
        Upsert Pillar 2 (Health Vigilance) data.
        
        Phase 24: Now populates ALL Pillar 2 metrics.
        """
        self.ensure_country_exists(iso_code)
        
        vigilance = self.db.query(Pillar2Vigilance).filter(
            Pillar2Vigilance.country_iso_code == iso_code
        ).first()
        
        if not vigilance:
            vigilance = Pillar2Vigilance(
                id=str(uuid4()),
                country_iso_code=iso_code,
                source_urls={}
            )
            self.db.add(vigilance)
            self.db.flush()  # Ensure record is visible to subsequent queries
        
        # Update all fields if provided
        if surveillance_logic is not None:
            vigilance.surveillance_logic = surveillance_logic
        
        if disease_detection_rate is not None:
            vigilance.disease_detection_rate = disease_detection_rate
        
        if vulnerability_index is not None:
            vigilance.vulnerability_index = vulnerability_index
            self.stats["vigilance_records_updated"] += 1
        
        if migrant_worker_pct is not None:
            vigilance.migrant_worker_pct = migrant_worker_pct
        
        if lead_exposure_screening_rate is not None:
            vigilance.lead_exposure_screening_rate = lead_exposure_screening_rate
        
        if occupational_disease_reporting_rate is not None:
            vigilance.occupational_disease_reporting_rate = occupational_disease_reporting_rate
        
        # Update source documentation
        if vigilance.source_urls is None:
            vigilance.source_urls = {}
        
        if source_url:
            vigilance.source_urls["vulnerability_source"] = source_url
        
        if ref_source:
            vigilance.source_urls["reference_data"] = ref_source
        
        vigilance.updated_at = datetime.utcnow()
        return vigilance
    
    def upsert_pillar3_restoration(
        self,
        iso_code: str,
        payer_mechanism: str = None,
        reintegration_law: bool = None,
        sickness_absence_days: float = None,
        rehab_access_score: float = None,
        return_to_work_success_pct: float = None,
        avg_claim_settlement_days: float = None,
        rehab_participation_rate: float = None,
        source_url: str = None,
        ref_source: str = None
    ) -> Pillar3Restoration:
        """
        Upsert Pillar 3 (Restoration) data.
        
        Phase 24: Now populates ALL Pillar 3 metrics.
        """
        self.ensure_country_exists(iso_code)
        
        restoration = self.db.query(Pillar3Restoration).filter(
            Pillar3Restoration.country_iso_code == iso_code
        ).first()
        
        if not restoration:
            restoration = Pillar3Restoration(
                id=str(uuid4()),
                country_iso_code=iso_code,
                source_urls={}
            )
            self.db.add(restoration)
            self.db.flush()  # Ensure record is visible to subsequent queries
        
        # Update all fields if provided
        if payer_mechanism is not None:
            restoration.payer_mechanism = payer_mechanism
        
        if reintegration_law is not None:
            restoration.reintegration_law = reintegration_law
        
        if sickness_absence_days is not None:
            restoration.sickness_absence_days = sickness_absence_days
        
        if rehab_access_score is not None:
            restoration.rehab_access_score = rehab_access_score
            self.stats["restoration_records_updated"] += 1
        
        if return_to_work_success_pct is not None:
            restoration.return_to_work_success_pct = return_to_work_success_pct
        
        if avg_claim_settlement_days is not None:
            restoration.avg_claim_settlement_days = avg_claim_settlement_days
        
        if rehab_participation_rate is not None:
            restoration.rehab_participation_rate = rehab_participation_rate
        
        # Update source documentation
        if restoration.source_urls is None:
            restoration.source_urls = {}
        
        if source_url:
            restoration.source_urls["health_expenditure"] = source_url
        
        if ref_source:
            restoration.source_urls["reference_data"] = ref_source
        
        restoration.updated_at = datetime.utcnow()
        return restoration
    
    def generate_national_source_url(self, iso_code: str) -> str:
        """
        Generate the ILO LEGOSH national legislation link.
        
        This provides direct access to each country's occupational health
        and safety legal framework documentation.
        """
        return f"https://www.ilo.org/dyn/legosh/en/f?p=14100:1100:0::NO::P1100_ISO_CODE:{iso_code}"
    
    def process_single_country(self, iso_code: str) -> Dict[str, Any]:
        """
        Process a single country with FULL FRAMEWORK data population.
        
        Phase 24: Complete Data Population Strategy
        ===========================================
        
        1. API Data (Live Fetch):
           - ILO Fatal Rate / WHO Proxy
           - WHO UHC Index → Disease Detection
           - WB Governance → Strategic Capacity
           - WB Vulnerable Employment → Vulnerability Index
           - WB Health Expenditure → Rehab Access
        
        2. Reference Data (Curated):
           - All policy fields (C187/C155, surveillance logic, payer mechanism)
           - Compliance rates (OEL, disease reporting)
           - Training hours, screening rates
           - RTW success, claim settlement times
        
        Args:
            iso_code: Country ISO code
            
        Returns:
            Dict with status, data sources used, and any errors
        """
        result = {
            "iso_code": iso_code,
            "success": False,
            "ilo_data": None,
            "who_data": None,
            "wb_data": {},
            "ref_data": {},
            "fatal_rate_source": None,
            "national_source_url": None,
            "error": None,
            "sources_used": []
        }
        
        try:
            # ==================================================================
            # LOAD REFERENCE DATA (Curated)
            # ==================================================================
            gov_ref = get_governance_data(iso_code)
            p1_ref = get_pillar_1_data(iso_code)
            p2_ref = get_pillar_2_data(iso_code)
            p3_ref = get_pillar_3_data(iso_code)
            
            if any([gov_ref, p1_ref, p2_ref, p3_ref]):
                result["ref_data"] = {
                    "governance": gov_ref,
                    "pillar_1": p1_ref,
                    "pillar_2": p2_ref,
                    "pillar_3": p3_ref
                }
                result["sources_used"].append("REF")
            
            # ==================================================================
            # STEP 1 [DIRECT]: Try ILO Fatal Rate (Primary Source)
            # ==================================================================
            ilo_result = self.ilo_client.fetch_fatality_rate_sync(iso_code)
            fatal_rate = None
            fatal_source = None
            
            if ilo_result:
                result["ilo_data"] = ilo_result
                result["sources_used"].append("ILO")
                fatal_rate = ilo_result.get("value")
                fatal_source = ilo_result.get("source")
                result["fatal_rate_source"] = "ILO"
                self.stats["ilo_direct_hits"] += 1
            
            # ==================================================================
            # STEP 2 [PROXY]: If ILO null → WHO Road Safety Proxy
            # ==================================================================
            if fatal_rate is None:
                who_road = self.who_client.fetch_road_safety_sync(iso_code)
                if who_road:
                    result["who_data"] = who_road
                    if "WHO" not in result["sources_used"]:
                        result["sources_used"].append("WHO")
                    fatal_rate = calculate_proxy_fatal_rate(who_road["value"])
                    fatal_source = who_road.get("source")
                    result["fatal_rate_source"] = "WHO_PROXY"
                    self.stats["who_proxy_hits"] += 1
            
            # ==================================================================
            # STEP 3: Upsert PILLAR 1 - Full Hazard Control Data
            # ==================================================================
            self.upsert_pillar1_hazard(
                iso_code=iso_code,
                fatal_rate=fatal_rate,
                carcinogen_exposure_pct=p1_ref.get("carcinogen_exposure_pct") if p1_ref else None,
                heat_stress_reg_type=p1_ref.get("heat_stress_reg_type") if p1_ref else None,
                oel_compliance_pct=p1_ref.get("oel_compliance_pct") if p1_ref else None,
                noise_induced_hearing_loss_rate=p1_ref.get("noise_induced_hearing_loss_rate") if p1_ref else None,
                safety_training_hours_avg=p1_ref.get("safety_training_hours_avg") if p1_ref else None,
                source_url=fatal_source,
                ref_source=p1_ref.get("source") if p1_ref else None
            )
            
            # ==================================================================
            # STEP 4 [CONTEXT]: WHO UHC Index → Pillar 2 Disease Detection
            # ==================================================================
            who_uhc = self.who_client.fetch_uhc_index_sync(iso_code)
            disease_detection = who_uhc["value"] if who_uhc else None
            if who_uhc and "WHO" not in result["sources_used"]:
                result["sources_used"].append("WHO")
            
            # ==================================================================
            # STEP 5 [CONTEXT]: WB Governance → Strategic Capacity
            # ==================================================================
            wb_gov = self.wb_client.fetch_governance_score_sync(iso_code)
            strategic_capacity = wb_gov["value"] if wb_gov else None
            if wb_gov:
                result["wb_data"]["governance"] = wb_gov
                if "WB" not in result["sources_used"]:
                    result["sources_used"].append("WB")
            
            # ==================================================================
            # STEP 6: Upsert GOVERNANCE LAYER - Full Data
            # ==================================================================
            self.upsert_governance_layer(
                iso_code=iso_code,
                ilo_c187_status=gov_ref.get("ilo_c187_status") if gov_ref else None,
                ilo_c155_status=gov_ref.get("ilo_c155_status") if gov_ref else None,
                inspector_density=gov_ref.get("inspector_density") if gov_ref else None,
                mental_health_policy=gov_ref.get("mental_health_policy") if gov_ref else None,
                strategic_capacity_score=strategic_capacity,
                gov_effectiveness_raw=wb_gov.get("raw_value") if wb_gov else None,
                source_url=wb_gov.get("source") if wb_gov else None,
                ref_source=gov_ref.get("source") if gov_ref else None
            )
            
            # ==================================================================
            # STEP 7 [CONTEXT]: WB Vulnerable Employment → Pillar 2
            # ==================================================================
            wb_vuln = self.wb_client.fetch_vulnerable_employment_sync(iso_code)
            vulnerability = wb_vuln["value"] if wb_vuln else None
            if wb_vuln:
                result["wb_data"]["vulnerable_emp"] = wb_vuln
                if "WB" not in result["sources_used"]:
                    result["sources_used"].append("WB")
            
            # ==================================================================
            # STEP 8: Upsert PILLAR 2 - Full Health Vigilance Data
            # ==================================================================
            self.upsert_pillar2_vigilance(
                iso_code=iso_code,
                surveillance_logic=p2_ref.get("surveillance_logic") if p2_ref else None,
                disease_detection_rate=disease_detection,
                vulnerability_index=vulnerability,
                migrant_worker_pct=p2_ref.get("migrant_worker_pct") if p2_ref else None,
                lead_exposure_screening_rate=p2_ref.get("lead_exposure_screening_rate") if p2_ref else None,
                occupational_disease_reporting_rate=p2_ref.get("occupational_disease_reporting_rate") if p2_ref else None,
                source_url=wb_vuln.get("source") if wb_vuln else None,
                ref_source=p2_ref.get("source") if p2_ref else None
            )
            
            # ==================================================================
            # STEP 9 [CONTEXT]: WB Health Expenditure → Pillar 3 Rehab
            # ==================================================================
            wb_health = self.wb_client.fetch_health_expenditure_sync(iso_code)
            rehab_score = None
            if wb_health:
                result["wb_data"]["health_exp"] = wb_health
                rehab_score = min(100, round(wb_health["value"] * 5.5, 1))
                if "WB" not in result["sources_used"]:
                    result["sources_used"].append("WB")
            
            # ==================================================================
            # STEP 10: Upsert PILLAR 3 - Full Restoration Data
            # ==================================================================
            self.upsert_pillar3_restoration(
                iso_code=iso_code,
                payer_mechanism=p3_ref.get("payer_mechanism") if p3_ref else None,
                reintegration_law=p3_ref.get("reintegration_law") if p3_ref else None,
                sickness_absence_days=p3_ref.get("sickness_absence_days") if p3_ref else None,
                rehab_access_score=rehab_score,
                return_to_work_success_pct=p3_ref.get("return_to_work_success_pct") if p3_ref else None,
                avg_claim_settlement_days=p3_ref.get("avg_claim_settlement_days") if p3_ref else None,
                rehab_participation_rate=p3_ref.get("rehab_participation_rate") if p3_ref else None,
                source_url=wb_health.get("source") if wb_health else None,
                ref_source=p3_ref.get("source") if p3_ref else None
            )
            
            # ==================================================================
            # STEP 11: WB Industry Context
            # ==================================================================
            wb_industry = self.wb_client.fetch_industry_pct_gdp_sync(iso_code)
            if wb_industry:
                result["wb_data"]["industry"] = wb_industry
                self.update_country_attributes(
                    iso_code=iso_code,
                    industry_pct_gdp=wb_industry.get("value"),
                    source_info=wb_industry.get("source")
                )
            
            # ==================================================================
            # STEP 12 [LINK]: Generate National Source URL
            # ==================================================================
            result["national_source_url"] = self.generate_national_source_url(iso_code)
            
            governance = self.db.query(GovernanceLayer).filter(
                GovernanceLayer.country_iso_code == iso_code
            ).first()
            if governance:
                if governance.source_urls is None:
                    governance.source_urls = {}
                governance.source_urls["national_legislation"] = result["national_source_url"]
            
            # Commit for this country
            self.db.commit()
            result["success"] = True
            self.stats["successful"].append(iso_code)
            self.stats["countries_processed"] += 1
            self.stats["data_sources_used"].extend(result["sources_used"])
            
        except Exception as e:
            self.db.rollback()
            result["error"] = str(e)
            self.stats["failed"].append(iso_code)
            self.stats["errors"].append(f"{iso_code}: {e}")
            logger.error(f"Error processing {iso_code}: {e}")
        
        return result
    
    def update_all_maturity_scores(self) -> None:
        """
        Calculate and update maturity scores for all countries in the database.
        """
        countries = self.db.query(Country).all()
        
        for country in countries:
            try:
                score, label = calculate_maturity_score(country)
                old_score = country.maturity_score
                country.maturity_score = score
                country.updated_at = datetime.utcnow()
                
                if old_score != score:
                    logger.info(
                        f"Updated {country.iso_code} maturity_score: "
                        f"{old_score} -> {score} ({label})"
                    )
                    
            except Exception as e:
                logger.warning(f"Could not calculate score for {country.iso_code}: {e}")
        
        self.db.commit()
    
    def run(self) -> Dict[str, Any]:
        """
        Execute the full ETL pipeline with 5-Point Dragnet fusion.
        
        Processes all target countries with:
        - Multi-source data fusion (ILO → WHO → WB)
        - Fall-through logic for missing data
        - Per-country error handling (failures don't stop pipeline)
        - Rate limiting between API calls
        - Detailed progress logging with fusion status
        
        Returns:
            Dict with pipeline execution stats and results
        """
        logger.info("=" * 70)
        logger.info(f"{Colors.BOLD}GOHIP Full Framework Pipeline - Phase 24: Complete Data Population{Colors.RESET}")
        logger.info(f"Target: {len(self.target_countries)} Global Economies")
        logger.info(f"Data Sources: ILO + WHO + World Bank + Reference Data")
        logger.info(f"Layers: Governance + Pillar 1 (Hazard) + Pillar 2 (Vigilance) + Pillar 3 (Restoration)")
        logger.info("=" * 70)
        
        start_time = datetime.utcnow()
        
        # =================================================================
        # PHASE 1-5: Process Each Country with Dragnet Fusion
        # =================================================================
        logger.info(f"\n{Colors.CYAN}[FULL FRAMEWORK] Processing Countries (All 4 Layers){Colors.RESET}")
        logger.info("-" * 60)
        
        total = len(self.target_countries)
        
        # Country flag emojis (subset for visual appeal)
        FLAG_EMOJIS = {
            "USA": "🇺🇸", "GBR": "🇬🇧", "DEU": "🇩🇪", "FRA": "🇫🇷", "JPN": "🇯🇵",
            "CHN": "🇨🇳", "IND": "🇮🇳", "BRA": "🇧🇷", "SAU": "🇸🇦", "NGA": "🇳🇬",
            "ZAF": "🇿🇦", "AUS": "🇦🇺", "CAN": "🇨🇦", "KOR": "🇰🇷", "MEX": "🇲🇽",
            "IDN": "🇮🇩", "TUR": "🇹🇷", "RUS": "🇷🇺", "ITA": "🇮🇹", "ARE": "🇦🇪",
            "EGY": "🇪🇬", "SGP": "🇸🇬", "MYS": "🇲🇾", "THA": "🇹🇭", "VNM": "🇻🇳",
            "PHL": "🇵🇭", "PAK": "🇵🇰", "BGD": "🇧🇩", "ARG": "🇦🇷", "CHL": "🇨🇱",
            "CHE": "🇨🇭", "SWE": "🇸🇪", "NOR": "🇳🇴", "POL": "🇵🇱", "ISR": "🇮🇱",
        }
        
        for idx, iso_code in enumerate(self.target_countries, 1):
            # Check for stop request from UI
            if pipeline_logger.stop_requested:
                logger.warning(f"\n{Colors.YELLOW}[STOPPED] Pipeline halted by user request{Colors.RESET}")
                if self.use_pipeline_logger:
                    pipeline_logger.log("Pipeline stopped by user", LogLevel.WARNING)
                break
            
            country_name = get_country_name(iso_code)
            flag = FLAG_EMOJIS.get(iso_code, "🌍")
            progress = f"[{idx:3d}/{total}]"
            
            try:
                # Process the country with dragnet fusion
                result = self.process_single_country(iso_code)
                
                if result["success"]:
                    # Build fusion status string
                    sources = result.get("sources_used", [])
                    source_str = " + ".join(sources) if sources else "No Data"
                    
                    # Get fatal rate info
                    fatal_rate = "N/A"
                    fatal_tag = ""
                    if result["ilo_data"]:
                        fatal_rate = result["ilo_data"].get("value", "N/A")
                        fatal_tag = ""
                    elif result["who_data"]:
                        # Proxy data
                        fatal_rate = calculate_proxy_fatal_rate(result["who_data"]["value"])
                        fatal_tag = f"{Colors.YELLOW}[PROXY]{Colors.RESET} "
                    
                    logger.info(
                        f"{progress} {flag} {Colors.GREEN}{country_name}:{Colors.RESET} "
                        f"Fusion Complete ({source_str}) | "
                        f"{fatal_tag}Fatal: {fatal_rate}"
                    )
                else:
                    logger.error(
                        f"{progress} {flag} {Colors.RED}{country_name}:{Colors.RESET} "
                        f"FAILED | Error: {result['error']}"
                    )
                
            except Exception as e:
                # Catch-all for any unexpected errors
                logger.error(
                    f"{progress} {flag} {Colors.RED}{country_name}:{Colors.RESET} "
                    f"UNEXPECTED ERROR | {e}"
                )
                self.stats["failed"].append(iso_code)
                self.stats["errors"].append(f"{iso_code}: {e}")
            
            # Rate limiting - avoid API bans
            if idx < total:
                time.sleep(RATE_LIMIT_DELAY)
        
        # =================================================================
        # PHASE 3: Calculate Maturity Scores
        # =================================================================
        logger.info(f"\n{Colors.CYAN}[PHASE 3] Calculating Maturity Scores{Colors.RESET}")
        logger.info("-" * 50)
        
        try:
            self.update_all_maturity_scores()
            logger.info(f"{Colors.GREEN}Maturity scores updated successfully{Colors.RESET}")
        except Exception as e:
            logger.error(f"{Colors.RED}Scoring Error: {e}{Colors.RESET}")
            self.stats["errors"].append(f"Scoring: {e}")
        
        # Calculate duration
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Count unique sources used
        unique_sources = set(self.stats["data_sources_used"])
        source_counts = {s: self.stats["data_sources_used"].count(s) for s in unique_sources}
        
        # =================================================================
        # FINAL SUMMARY - 5-POINT DRAGNET RESULTS
        # =================================================================
        logger.info("\n" + "=" * 70)
        logger.info(f"{Colors.BOLD}🎯 PHASE 24: FULL FRAMEWORK EXECUTION SUMMARY{Colors.RESET}")
        logger.info("=" * 70)
        logger.info(f"Duration: {duration:.2f} seconds")
        logger.info(f"Countries Targeted: {len(self.target_countries)}")
        logger.info(f"Countries Processed: {self.stats['countries_processed']}")
        logger.info(f"{Colors.GREEN}Successful: {len(self.stats['successful'])}{Colors.RESET}")
        logger.info(f"{Colors.RED}Failed: {len(self.stats['failed'])}{Colors.RESET}")
        
        logger.info(f"\n{Colors.CYAN}[DATA SOURCE BREAKDOWN]{Colors.RESET}")
        logger.info(f"  ILO Direct Hits (Primary):  {self.stats['ilo_direct_hits']}")
        logger.info(f"  WHO Proxy Hits (Fallback):  {self.stats['who_proxy_hits']}")
        logger.info(f"  World Bank Context Records: {source_counts.get('WB', 0)}")
        logger.info(f"  Reference Data Records:     {source_counts.get('REF', 0)}")
        
        logger.info(f"\n{Colors.CYAN}[RECORDS UPDATED]{Colors.RESET}")
        logger.info(f"  Countries Created: {self.stats['countries_created']}")
        logger.info(f"  Countries Updated: {self.stats['countries_updated']}")
        logger.info(f"  Pillar 1 (Hazard) Records: {self.stats['hazard_records_created'] + self.stats['hazard_records_updated']}")
        logger.info(f"  Pillar 2 (Vigilance) Records: {self.stats['vigilance_records_updated']}")
        logger.info(f"  Pillar 3 (Restoration) Records: {self.stats['restoration_records_updated']}")
        logger.info(f"  Governance Layer Records: {self.stats['governance_records_updated']}")
        
        # Calculate coverage metrics
        total_fatal_data = self.stats['ilo_direct_hits'] + self.stats['who_proxy_hits']
        fatal_coverage_pct = (total_fatal_data / len(self.target_countries)) * 100 if self.target_countries else 0
        
        logger.info(f"\n{Colors.CYAN}[COVERAGE METRICS]{Colors.RESET}")
        logger.info(f"  Fatal Rate Coverage: {fatal_coverage_pct:.1f}% ({total_fatal_data}/{len(self.target_countries)})")
        logger.info(f"  ILO/WHO Split: {self.stats['ilo_direct_hits']} direct / {self.stats['who_proxy_hits']} proxy")
        
        if self.stats["failed"]:
            logger.info(f"\n{Colors.YELLOW}Failed Countries:{Colors.RESET}")
            for code in self.stats["failed"]:
                logger.info(f"  - {code} ({get_country_name(code)})")
        
        if self.stats["errors"]:
            logger.warning(f"\n{Colors.YELLOW}Errors ({len(self.stats['errors'])}):{Colors.RESET}")
            for err in self.stats["errors"][:10]:  # Limit to first 10
                logger.warning(f"  • {err}")
            if len(self.stats["errors"]) > 10:
                logger.warning(f"  ... and {len(self.stats['errors']) - 10} more")
        
        logger.info("\n" + "=" * 70)
        logger.info(f"{Colors.GREEN}✅ FULL FRAMEWORK POPULATION COMPLETE - All Layers Populated{Colors.RESET}")
        logger.info("=" * 70)
        
        return {
            "stats": self.stats,
            "duration_seconds": duration,
            "success_rate": len(self.stats["successful"]) / len(self.target_countries) * 100,
            "fatal_coverage_pct": fatal_coverage_pct,
            "ilo_direct_hits": self.stats["ilo_direct_hits"],
            "who_proxy_hits": self.stats["who_proxy_hits"]
        }


def verify_database_state(db: Session):
    """
    Verify and display the current state of relevant tables.
    """
    logger.info("\n" + "=" * 70)
    logger.info(f"{Colors.BOLD}DATABASE VERIFICATION{Colors.RESET}")
    logger.info("=" * 70)
    
    # Query totals
    country_count = db.query(Country).count()
    hazard_count = db.query(Pillar1Hazard).count()
    governance_count = db.query(GovernanceLayer).count()
    
    logger.info(f"\n{Colors.CYAN}[Table Counts]{Colors.RESET}")
    logger.info(f"  Countries: {country_count}")
    logger.info(f"  Pillar 1 Hazard Records: {hazard_count}")
    logger.info(f"  Governance Layer Records: {governance_count}")
    
    # Sample data
    logger.info(f"\n{Colors.CYAN}[Sample Data - First 5 Countries]{Colors.RESET}")
    countries = db.query(Country).limit(5).all()
    
    for c in countries:
        hazard = db.query(Pillar1Hazard).filter(
            Pillar1Hazard.country_iso_code == c.iso_code
        ).first()
        
        fatal_rate = hazard.fatal_accident_rate if hazard else "N/A"
        score = c.maturity_score if c.maturity_score else "N/A"
        
        logger.info(f"  {c.iso_code}: {c.name} | Fatal Rate: {fatal_rate} | Score: {score}")


def run_full_pipeline(
    batch_size: int = 195, 
    use_pipeline_logger: bool = False,
    country_filter: Optional[List[str]] = None,
    fetch_flags: bool = True
) -> Dict[str, Any]:
    """
    Execute the full Multi-Source Intelligence ETL pipeline.
    
    This is the CANONICAL entry point for both:
    - CLI execution (`python run_pipeline.py`)
    - API execution (`POST /api/v1/etl/run`)
    
    Phase 26: Multi-Source Intelligence Integration
    
    The 10-Point Intelligence Strategy:
    ====================================
    CORE DATA (4 Pillars):
    1. [DIRECT]   ILO Fatal Rate → Pillar 1: Fatal Accident Rate
    2. [PROXY]    WHO Road Safety / 10 → Fallback for missing ILO data
    3. [CONTEXT]  WB Governance → Strategic Capacity Score
    4. [CONTEXT]  WB Vulnerable Employment → Pillar 2 Vulnerability
    5. [CONTEXT]  WB Health Expenditure → Pillar 3 Rehab Proxy
    6. [VISUAL]   Wikipedia Flag Images → Country Identification
    
    DEEP INTELLIGENCE (CountryIntelligence Table):
    7.  [WB-EXT]   World Bank Extended → 20+ governance, economic, labor indicators
    8.  [TI-CPI]   Transparency International → Corruption Perception Index
    9.  [UNDP]     Human Development Index → HDI, Education Index
    10. [IHME]     Global Burden of Disease → Occupational DALYs, Mortality
    11. [EPI]      Yale Environmental Performance → Air Quality, Heavy Metals
    12. [WJP]      World Justice Project → Rule of Law, Regulatory Enforcement
    13. [OECD]     Work-Life Balance → Hours worked, leisure time
    
    Args:
        batch_size: Number of countries to process (default 195 for all global economies)
        use_pipeline_logger: If True, logs to pipeline_logger for API/UI consumption
        country_filter: Optional list of ISO codes to process. If None, processes all.
        fetch_flags: Whether to download flag images from Wikipedia (default True)
        
    Returns:
        Dict with pipeline execution stats and results including intelligence_stats
    """
    # pipeline_logger is now imported at module level
    
    # Determine which countries to process
    target_countries = country_filter if country_filter else GLOBAL_ECONOMIES_50.copy()
    
    logger.info("Connecting to database: %s", settings.DATABASE_URL.split("@")[-1])
    
    # Create database session
    db = SessionLocal()
    
    try:
        # UI Feedback: Initial "Flood" message
        if use_pipeline_logger:
            pipeline_logger.start(total_countries=len(target_countries))
            pipeline_logger.log("🌊 STARTING FULL FRAMEWORK SYNC: Populating all layers with comprehensive data...")
            pipeline_logger.log(f"Target: {len(target_countries)} Countries × 4 Layers × ~20 Metrics Each")
            pipeline_logger.log("Data Sources: ILO + WHO + World Bank + Curated Reference Data")
            if fetch_flags:
                pipeline_logger.log("🏳️ Flag fetching ENABLED - Will download from Wikipedia")
            pipeline_logger.log("Layers: Governance + Hazard Control + Health Vigilance + Restoration")
        
        logger.info("🌊 STARTING FULL FRAMEWORK SYNC: Populating all layers with comprehensive data...")
        
        # Run the pipeline with filtered countries
        pipeline = StatisticianPipeline(db, batch_size=batch_size)
        pipeline.target_countries = target_countries  # Override with filtered list
        
        # ============================================================
        # PHASE 0: Fetch Flag Images from Wikipedia (if enabled)
        # Smart fetching: Only fetches flags that aren't already in DB
        # ============================================================
        flag_results = {}
        if fetch_flags:
            import asyncio
            from app.services.flag_fetcher import fetch_flags_for_countries_smart
            
            logger.info(f"\n{Colors.CYAN}[PHASE 0] Smart Flag Fetching from Wikipedia{Colors.RESET}")
            if use_pipeline_logger:
                pipeline_logger.phase("Smart Flag Fetching")
                pipeline_logger.log("Checking database for existing flags...")
            
            # Run async flag fetching in a sync context
            # Uses smart fetching which checks DB first to avoid redundant downloads
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                # Pass DB session for smart checking
                flag_results = loop.run_until_complete(
                    fetch_flags_for_countries_smart(target_countries, db)
                )
                loop.close()
                
                flags_total = sum(1 for url in flag_results.values() if url)
                flags_new = len([c for c in target_countries 
                               if flag_results.get(c) and not db.query(Country).filter(
                                   Country.iso_code == c, 
                                   Country.flag_url != None
                               ).first()])
                
                logger.info(f"{Colors.GREEN}Flags: {flags_total}/{len(target_countries)} available ({flags_new} newly fetched){Colors.RESET}")
                
                if use_pipeline_logger:
                    pipeline_logger.log(f"Flags: {flags_total}/{len(target_countries)} available")
                    if flags_new > 0:
                        pipeline_logger.log(f"Newly fetched: {flags_new} flags from Wikipedia")
                
                # NOTE: Flag URLs will be saved to DB AFTER the main pipeline creates countries
                
            except Exception as e:
                logger.warning(f"Flag fetching failed (continuing without flags): {e}")
                if use_pipeline_logger:
                    pipeline_logger.log(f"Flag fetching failed: {e}")
        
        # Hook into pipeline for UI logging if requested
        if use_pipeline_logger:
            # Override logging to also push to pipeline_logger
            original_process = pipeline.process_single_country
            
            def logged_process(iso_code: str) -> Dict[str, Any]:
                country_name = get_country_name(iso_code)
                pipeline_logger.start_country(iso_code)
                
                result = original_process(iso_code)
                
                if result["success"]:
                    # Build comprehensive source info
                    source_tags = []
                    fatal_rate = None
                    fatal_source = ""
                    
                    # Check ILO data
                    if result["ilo_data"]:
                        fatal_rate = result["ilo_data"].get("value")
                        fatal_source = "[ILO]"
                        source_tags.append("ILO✓")
                    # Check WHO proxy
                    elif result["who_data"]:
                        fatal_rate = calculate_proxy_fatal_rate(result["who_data"]["value"])
                        fatal_source = "[WHO-PROXY]"
                        source_tags.append("WHO-PROXY")
                    
                    # Check WB data
                    if result["wb_data"].get("governance"):
                        source_tags.append("WB-GOV✓")
                    if result["wb_data"].get("vulnerable_emp"):
                        source_tags.append("WB-VULN✓")
                    if result["wb_data"].get("health_exp"):
                        source_tags.append("WB-HEALTH✓")
                    
                    # Check reference data
                    if result.get("ref_data"):
                        ref_count = sum(1 for v in result["ref_data"].values() if v)
                        if ref_count > 0:
                            source_tags.append(f"REF({ref_count})")
                    
                    sources_str = " ".join(source_tags) if source_tags else "No Data"
                    
                    # Count total metrics populated
                    ref_data = result.get("ref_data", {})
                    metrics_count = 0
                    if ref_data.get("governance"):
                        metrics_count += len([k for k in ref_data["governance"].keys() if k != "source"])
                    if ref_data.get("pillar_1"):
                        metrics_count += len([k for k in ref_data["pillar_1"].keys() if k != "source"])
                    if ref_data.get("pillar_2"):
                        metrics_count += len([k for k in ref_data["pillar_2"].keys() if k != "source"])
                    if ref_data.get("pillar_3"):
                        metrics_count += len([k for k in ref_data["pillar_3"].keys() if k != "source"])
                    
                    # Format the log message with clear source attribution
                    if fatal_rate:
                        pipeline_logger.success(
                            f"✅ {country_name} ({iso_code}) | {fatal_source} Fatal: {fatal_rate:.2f} | {metrics_count} metrics | {sources_str}"
                        )
                    else:
                        pipeline_logger.log(
                            f"⚠️ {country_name} ({iso_code}) | No Fatal Rate | {metrics_count} metrics | {sources_str}"
                        )
                    
                    pipeline_logger.complete_country(iso_code, metric=fatal_rate)
                else:
                    pipeline_logger.error(f"❌ {country_name} ({iso_code}) | ERROR: {result['error']}")
                    pipeline_logger.fail_country(iso_code, result.get("error", "Unknown error"))
                
                return result
            
            pipeline.process_single_country = logged_process
        
        results = pipeline.run()
        
        # ============================================================
        # PHASE FINAL: Save Flag URLs to Database (after countries exist)
        # ============================================================
        if flag_results:
            logger.info(f"\n{Colors.CYAN}[PHASE FINAL] Saving Flag URLs to Database{Colors.RESET}")
            if use_pipeline_logger:
                pipeline_logger.phase("Saving Flag URLs")
            
            flags_saved = 0
            for iso_code, flag_url in flag_results.items():
                if flag_url:
                    country = db.query(Country).filter(Country.iso_code == iso_code).first()
                    if country:
                        country.flag_url = flag_url
                        flags_saved += 1
            
            db.commit()
            logger.info(f"{Colors.GREEN}Saved {flags_saved} flag URLs to database{Colors.RESET}")
            if use_pipeline_logger:
                pipeline_logger.log(f"Saved {flags_saved} flag URLs to database")
        
        # ============================================================
        # PHASE INTELLIGENCE: Deep Multi-Source Intelligence Collection
        # ============================================================
        logger.info(f"\n{Colors.CYAN}[PHASE INTELLIGENCE] Collecting Deep Intelligence Data{Colors.RESET}")
        if use_pipeline_logger:
            pipeline_logger.phase("Deep Intelligence Collection")
            pipeline_logger.log("Fetching: World Bank + CPI + HDI + EPI + IHME GBD + WJP + OECD")
        
        try:
            from app.services.etl.intelligence_pipeline import IntelligencePipeline
            
            intel_pipeline = IntelligencePipeline(db)
            intel_stats = intel_pipeline.run(target_countries)
            
            logger.info(f"{Colors.GREEN}Intelligence data collected for {intel_stats['countries_processed']} countries{Colors.RESET}")
            
            if use_pipeline_logger:
                pipeline_logger.log(f"World Bank: {intel_stats['wb_hits']} hits")
                pipeline_logger.log(f"CPI + HDI + EPI: {intel_stats['cpi_hits'] + intel_stats['hdi_hits'] + intel_stats['epi_hits']} hits")
                pipeline_logger.log(f"IHME GBD: {intel_stats['gbd_hits']} hits")
                pipeline_logger.log(f"WJP + OECD: {intel_stats['wjp_hits'] + intel_stats['oecd_hits']} hits")
            
            # Add intelligence stats to results
            results["intelligence_stats"] = intel_stats
            
        except Exception as e:
            logger.warning(f"Intelligence pipeline failed (continuing): {e}")
            if use_pipeline_logger:
                pipeline_logger.log(f"Intelligence collection error: {e}")
        
        # Verify final state
        verify_database_state(db)
        
        # Finalize UI logging
        if use_pipeline_logger:
            pipeline_logger.phase("Pipeline Summary")
            pipeline_logger.log(f"Countries Processed: {results['stats']['countries_processed']}")
            pipeline_logger.log(f"ILO Direct Hits: {results['ilo_direct_hits']}")
            pipeline_logger.log(f"WHO Proxy Hits: {results['who_proxy_hits']}")
            pipeline_logger.log(f"Success Rate: {results['success_rate']:.1f}%")
            pipeline_logger.log(f"Fatal Rate Coverage: {results['fatal_coverage_pct']:.1f}%")
            
            if results["stats"]["failed"]:
                pipeline_logger.finish(success=False)
            else:
                pipeline_logger.finish(success=True)
        
        return results
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        if use_pipeline_logger:
            pipeline_logger.error(f"Pipeline crashed: {e}")
            pipeline_logger.finish(success=False)
        raise
    finally:
        db.close()


def main():
    """Main entry point for the ETL pipeline (CLI execution)."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="GOHIP ETL Pipeline - Phase 23: 5-Point Dragnet")
    parser.add_argument(
        "--batch-size", 
        type=int, 
        default=195,
        help="Number of countries to process (default: 195 for all global economies)"
    )
    args = parser.parse_args()
    
    # Execute the full pipeline
    return run_full_pipeline(batch_size=args.batch_size, use_pipeline_logger=False)


if __name__ == "__main__":
    main()
