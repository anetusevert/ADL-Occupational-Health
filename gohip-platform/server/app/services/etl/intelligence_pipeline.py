"""
GOHIP Platform - Intelligence Pipeline
=======================================

Phase 26: Multi-Source Intelligence Integration

Orchestrates the collection and storage of deep intelligence data from:
- World Bank Extended Indicators
- Transparency International CPI
- UNDP Human Development Index
- Yale Environmental Performance Index
- IHME Global Burden of Disease
- World Justice Project Rule of Law
- OECD Work-Life Balance
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.country import CountryIntelligence, Country
from app.services.etl.intelligence_client import (
    IntelligenceClient,
    get_cpi_data,
    get_hdi_data,
    get_epi_data,
)
from app.data.intelligence_reference import (
    get_ihme_gbd_data,
    get_wjp_data,
    get_oecd_data,
)

logger = logging.getLogger(__name__)


class IntelligencePipeline:
    """
    Orchestrates multi-source intelligence data collection for GOHIP.
    
    Aggregates data from:
    - World Bank API (governance, economic, health, labor indicators)
    - Reference Data (CPI, HDI, EPI, IHME GBD, WJP, OECD)
    
    Stores results in CountryIntelligence table for AI access.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.client = IntelligenceClient()
        self.stats = {
            "countries_processed": 0,
            "intelligence_created": 0,
            "intelligence_updated": 0,
            "wb_hits": 0,
            "cpi_hits": 0,
            "hdi_hits": 0,
            "epi_hits": 0,
            "gbd_hits": 0,
            "wjp_hits": 0,
            "oecd_hits": 0,
            "errors": [],
        }
    
    def get_or_create_intelligence(self, iso_code: str) -> CountryIntelligence:
        """Get existing intelligence record or create a new one."""
        intel = self.db.query(CountryIntelligence).filter(
            CountryIntelligence.country_iso_code == iso_code
        ).first()
        
        if not intel:
            intel = CountryIntelligence(
                id=str(uuid4()),
                country_iso_code=iso_code,
                data_sources={},
            )
            self.db.add(intel)
            self.stats["intelligence_created"] += 1
        else:
            self.stats["intelligence_updated"] += 1
        
        return intel
    
    def process_country(self, iso_code: str) -> Dict[str, Any]:
        """
        Process a single country and collect all intelligence data.
        
        Args:
            iso_code: ISO Alpha-3 country code
            
        Returns:
            Dict with processing results and data sources used
        """
        result = {
            "iso_code": iso_code,
            "success": False,
            "sources_used": [],
            "error": None,
        }
        
        try:
            # Ensure country exists
            country = self.db.query(Country).filter(Country.iso_code == iso_code).first()
            if not country:
                result["error"] = f"Country {iso_code} not found in database"
                return result
            
            # Get or create intelligence record
            intel = self.get_or_create_intelligence(iso_code)
            
            # Initialize data sources tracking
            if intel.data_sources is None:
                intel.data_sources = {}
            
            # =================================================================
            # SOURCE 1: World Bank Extended Indicators (API)
            # =================================================================
            try:
                wb_data = self.client.fetch_all_intelligence(iso_code)
                
                if wb_data and wb_data.get("sources_used"):
                    # Governance indicators
                    if wb_data.get("government_effectiveness") is not None:
                        intel.government_effectiveness = wb_data["government_effectiveness"]
                    if wb_data.get("regulatory_quality") is not None:
                        intel.regulatory_quality = wb_data["regulatory_quality"]
                    if wb_data.get("rule_of_law_wb") is not None:
                        intel.rule_of_law_wb = wb_data["rule_of_law_wb"]
                    if wb_data.get("control_of_corruption_wb") is not None:
                        intel.control_of_corruption_wb = wb_data["control_of_corruption_wb"]
                    if wb_data.get("political_stability") is not None:
                        intel.political_stability = wb_data["political_stability"]
                    if wb_data.get("voice_accountability") is not None:
                        intel.voice_accountability = wb_data["voice_accountability"]
                    
                    # Economic indicators
                    if wb_data.get("gdp_per_capita_ppp") is not None:
                        intel.gdp_per_capita_ppp = wb_data["gdp_per_capita_ppp"]
                    if wb_data.get("gdp_growth_rate") is not None:
                        intel.gdp_growth_rate = wb_data["gdp_growth_rate"]
                    if wb_data.get("industry_pct_gdp") is not None:
                        intel.industry_pct_gdp = wb_data["industry_pct_gdp"]
                    if wb_data.get("manufacturing_pct_gdp") is not None:
                        intel.manufacturing_pct_gdp = wb_data["manufacturing_pct_gdp"]
                    if wb_data.get("services_pct_gdp") is not None:
                        intel.services_pct_gdp = wb_data["services_pct_gdp"]
                    if wb_data.get("agriculture_pct_gdp") is not None:
                        intel.agriculture_pct_gdp = wb_data["agriculture_pct_gdp"]
                    
                    # Labor indicators
                    if wb_data.get("labor_force_participation") is not None:
                        intel.labor_force_participation = wb_data["labor_force_participation"]
                    if wb_data.get("unemployment_rate") is not None:
                        intel.unemployment_rate = wb_data["unemployment_rate"]
                    if wb_data.get("youth_unemployment_rate") is not None:
                        intel.youth_unemployment_rate = wb_data["youth_unemployment_rate"]
                    if wb_data.get("informal_employment_pct") is not None:
                        intel.informal_employment_pct = wb_data["informal_employment_pct"]
                    
                    # Health indicators
                    if wb_data.get("health_expenditure_gdp_pct") is not None:
                        intel.health_expenditure_gdp_pct = wb_data["health_expenditure_gdp_pct"]
                    if wb_data.get("health_expenditure_per_capita") is not None:
                        intel.health_expenditure_per_capita = wb_data["health_expenditure_per_capita"]
                    if wb_data.get("out_of_pocket_health_pct") is not None:
                        intel.out_of_pocket_health_pct = wb_data["out_of_pocket_health_pct"]
                    if wb_data.get("life_expectancy_at_birth") is not None:
                        intel.life_expectancy_at_birth = wb_data["life_expectancy_at_birth"]
                    
                    # Population indicators
                    if wb_data.get("population_total") is not None:
                        intel.population_total = wb_data["population_total"]
                    if wb_data.get("urban_population_pct") is not None:
                        intel.urban_population_pct = wb_data["urban_population_pct"]
                    
                    intel.last_worldbank_update = datetime.utcnow()
                    result["sources_used"].append("WORLD_BANK")
                    self.stats["wb_hits"] += 1
                    
            except Exception as e:
                logger.warning(f"World Bank data fetch failed for {iso_code}: {e}")
            
            # =================================================================
            # SOURCE 2: Transparency International CPI (Reference)
            # =================================================================
            cpi_data = get_cpi_data(iso_code)
            if cpi_data:
                intel.corruption_perception_index = cpi_data.get("score")
                intel.corruption_rank = cpi_data.get("rank")
                intel.last_cpi_update = datetime.utcnow()
                result["sources_used"].append("TI_CPI")
                self.stats["cpi_hits"] += 1
            
            # =================================================================
            # SOURCE 3: UNDP Human Development Index (Reference)
            # =================================================================
            hdi_data = get_hdi_data(iso_code)
            if hdi_data:
                intel.hdi_score = hdi_data.get("score")
                intel.hdi_rank = hdi_data.get("rank")
                intel.last_undp_update = datetime.utcnow()
                result["sources_used"].append("UNDP_HDI")
                self.stats["hdi_hits"] += 1
            
            # =================================================================
            # SOURCE 4: Yale EPI (Reference)
            # =================================================================
            epi_data = get_epi_data(iso_code)
            if epi_data:
                intel.epi_score = epi_data.get("score")
                intel.epi_rank = epi_data.get("rank")
                intel.epi_air_quality = epi_data.get("air_quality")
                intel.last_epi_update = datetime.utcnow()
                result["sources_used"].append("YALE_EPI")
                self.stats["epi_hits"] += 1
            
            # =================================================================
            # SOURCE 5: IHME Global Burden of Disease (Reference)
            # =================================================================
            gbd_data = get_ihme_gbd_data(iso_code)
            if gbd_data:
                intel.daly_occupational_total = gbd_data.get("daly_occupational_total")
                intel.daly_occupational_injuries = gbd_data.get("daly_occupational_injuries")
                intel.daly_occupational_carcinogens = gbd_data.get("daly_occupational_carcinogens")
                intel.daly_occupational_noise = gbd_data.get("daly_occupational_noise")
                intel.daly_occupational_ergonomic = gbd_data.get("daly_occupational_ergonomic")
                intel.daly_occupational_particulates = gbd_data.get("daly_occupational_particulates")
                intel.daly_occupational_asthmagens = gbd_data.get("daly_occupational_asthmagens")
                intel.deaths_occupational_total = gbd_data.get("deaths_occupational_total")
                intel.deaths_occupational_injuries = gbd_data.get("deaths_occupational_injuries")
                intel.deaths_occupational_diseases = gbd_data.get("deaths_occupational_diseases")
                intel.last_ihme_update = datetime.utcnow()
                result["sources_used"].append("IHME_GBD")
                self.stats["gbd_hits"] += 1
            
            # =================================================================
            # SOURCE 6: World Justice Project (Reference)
            # =================================================================
            wjp_data = get_wjp_data(iso_code)
            if wjp_data:
                intel.rule_of_law_index = wjp_data.get("rule_of_law_index")
                intel.regulatory_enforcement_score = wjp_data.get("regulatory_enforcement")
                intel.civil_justice_score = wjp_data.get("civil_justice")
                intel.constraints_on_gov_powers = wjp_data.get("constraints_gov")
                intel.open_government_score = wjp_data.get("open_government")
                intel.last_wjp_update = datetime.utcnow()
                result["sources_used"].append("WJP_ROL")
                self.stats["wjp_hits"] += 1
            
            # =================================================================
            # SOURCE 7: OECD Work-Life Balance (Reference, OECD only)
            # =================================================================
            oecd_data = get_oecd_data(iso_code)
            if oecd_data:
                intel.oecd_work_life_balance = oecd_data.get("work_life_balance")
                intel.oecd_hours_worked_annual = oecd_data.get("hours_worked_annual")
                intel.oecd_long_hours_pct = oecd_data.get("long_hours_pct")
                intel.oecd_time_for_leisure = oecd_data.get("time_for_leisure")
                intel.last_oecd_update = datetime.utcnow()
                result["sources_used"].append("OECD")
                self.stats["oecd_hits"] += 1
            
            # =================================================================
            # COMPUTE INTELLIGENCE SCORES
            # =================================================================
            intel.governance_intelligence_score = self._compute_governance_score(intel)
            intel.hazard_intelligence_score = self._compute_hazard_score(intel)
            intel.vigilance_intelligence_score = self._compute_vigilance_score(intel)
            intel.restoration_intelligence_score = self._compute_restoration_score(intel)
            intel.overall_intelligence_score = self._compute_overall_score(intel)
            
            # Update timestamp
            intel.updated_at = datetime.utcnow()
            
            # Commit changes
            self.db.commit()
            
            result["success"] = True
            self.stats["countries_processed"] += 1
            
        except Exception as e:
            self.db.rollback()
            result["error"] = str(e)
            self.stats["errors"].append(f"{iso_code}: {e}")
            logger.error(f"Intelligence processing failed for {iso_code}: {e}")
        
        return result
    
    def _compute_governance_score(self, intel: CountryIntelligence) -> Optional[float]:
        """Compute composite governance intelligence score."""
        components = []
        
        # CPI (0-100)
        if intel.corruption_perception_index is not None:
            components.append(intel.corruption_perception_index)
        
        # Rule of Law (0-1 -> 0-100)
        if intel.rule_of_law_index is not None:
            components.append(intel.rule_of_law_index * 100)
        
        # WB Government Effectiveness (-2.5 to 2.5 -> 0-100)
        if intel.government_effectiveness is not None:
            normalized = ((intel.government_effectiveness + 2.5) / 5) * 100
            components.append(normalized)
        
        if components:
            return round(sum(components) / len(components), 1)
        return None
    
    def _compute_hazard_score(self, intel: CountryIntelligence) -> Optional[float]:
        """Compute composite hazard intelligence score (inverted - lower DALYs = higher score)."""
        components = []
        
        # DALY burden (inverted: 0-1000 DALYs -> 100-0 score)
        if intel.daly_occupational_total is not None:
            # Higher DALYs = worse = lower score
            score = max(0, 100 - (intel.daly_occupational_total / 10))
            components.append(score)
        
        # EPI Air Quality (0-100)
        if intel.epi_air_quality is not None:
            components.append(intel.epi_air_quality)
        
        if components:
            return round(sum(components) / len(components), 1)
        return None
    
    def _compute_vigilance_score(self, intel: CountryIntelligence) -> Optional[float]:
        """Compute composite vigilance intelligence score."""
        components = []
        
        # UHC Coverage (0-100)
        if intel.uhc_service_coverage_index is not None:
            components.append(intel.uhc_service_coverage_index)
        
        # Health Expenditure per capita (normalized, capped at 10000)
        if intel.health_expenditure_per_capita is not None:
            normalized = min(100, (intel.health_expenditure_per_capita / 100))
            components.append(normalized)
        
        # Life Expectancy (normalized 50-90 years -> 0-100)
        if intel.life_expectancy_at_birth is not None:
            normalized = ((intel.life_expectancy_at_birth - 50) / 40) * 100
            components.append(min(100, max(0, normalized)))
        
        if components:
            return round(sum(components) / len(components), 1)
        return None
    
    def _compute_restoration_score(self, intel: CountryIntelligence) -> Optional[float]:
        """Compute composite restoration intelligence score."""
        components = []
        
        # HDI (0-1 -> 0-100)
        if intel.hdi_score is not None:
            components.append(intel.hdi_score * 100)
        
        # OECD Work-Life Balance (0-10 -> 0-100)
        if intel.oecd_work_life_balance is not None:
            components.append(intel.oecd_work_life_balance * 10)
        
        # GDP per capita (normalized, capped)
        if intel.gdp_per_capita_ppp is not None:
            normalized = min(100, (intel.gdp_per_capita_ppp / 1000))
            components.append(normalized)
        
        if components:
            return round(sum(components) / len(components), 1)
        return None
    
    def _compute_overall_score(self, intel: CountryIntelligence) -> Optional[float]:
        """Compute overall intelligence score from pillar scores."""
        scores = [
            intel.governance_intelligence_score,
            intel.hazard_intelligence_score,
            intel.vigilance_intelligence_score,
            intel.restoration_intelligence_score,
        ]
        
        valid_scores = [s for s in scores if s is not None]
        
        if valid_scores:
            return round(sum(valid_scores) / len(valid_scores), 1)
        return None
    
    def run(self, target_countries: list) -> Dict[str, Any]:
        """
        Run the intelligence pipeline for all target countries.
        
        Args:
            target_countries: List of ISO Alpha-3 country codes
            
        Returns:
            Dict with pipeline execution statistics
        """
        logger.info(f"Starting Intelligence Pipeline for {len(target_countries)} countries...")
        
        for idx, iso_code in enumerate(target_countries, 1):
            logger.info(f"[{idx}/{len(target_countries)}] Processing {iso_code}...")
            result = self.process_country(iso_code)
            
            if result["success"]:
                sources = ", ".join(result["sources_used"]) if result["sources_used"] else "None"
                logger.info(f"  -> {iso_code}: Sources={sources}")
            else:
                logger.error(f"  -> {iso_code}: FAILED - {result['error']}")
        
        logger.info("=" * 60)
        logger.info("INTELLIGENCE PIPELINE SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Countries Processed: {self.stats['countries_processed']}")
        logger.info(f"Intelligence Created: {self.stats['intelligence_created']}")
        logger.info(f"Intelligence Updated: {self.stats['intelligence_updated']}")
        logger.info(f"World Bank Hits: {self.stats['wb_hits']}")
        logger.info(f"TI CPI Hits: {self.stats['cpi_hits']}")
        logger.info(f"UNDP HDI Hits: {self.stats['hdi_hits']}")
        logger.info(f"Yale EPI Hits: {self.stats['epi_hits']}")
        logger.info(f"IHME GBD Hits: {self.stats['gbd_hits']}")
        logger.info(f"WJP Rule of Law Hits: {self.stats['wjp_hits']}")
        logger.info(f"OECD Hits: {self.stats['oecd_hits']}")
        logger.info(f"Errors: {len(self.stats['errors'])}")
        
        return self.stats
