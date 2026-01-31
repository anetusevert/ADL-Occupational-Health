"""
Country Data Provider Service
==============================

Fetches and formats all country data from the database in a single optimized query.
Provides comprehensive context for AI agents.
"""

import logging
from typing import Optional, Dict, Any
from functools import lru_cache

from sqlalchemy.orm import Session, joinedload

from app.models.country import (
    Country,
    GovernanceLayer,
    Pillar1Hazard,
    Pillar2Vigilance,
    Pillar3Restoration,
    CountryIntelligence,
)

logger = logging.getLogger(__name__)


class CountryDataProvider:
    """
    Fetches all country data and formats it for AI agent consumption.
    
    Usage:
        provider = CountryDataProvider(db)
        context = provider.get_country_context("DEU")
        # Returns dict with COUNTRY_NAME, DATABASE_CONTEXT, METRICS_DATA, etc.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_country_context(self, iso_code: str) -> Optional[Dict[str, Any]]:
        """
        Fetch complete country context for an AI agent.
        
        Args:
            iso_code: ISO 3166-1 alpha-3 country code (e.g., "DEU", "USA")
            
        Returns:
            Dict with all formatted context variables, or None if country not found
        """
        try:
            # Query country with all relationships eagerly loaded
            country = (
                self.db.query(Country)
                .options(
                    joinedload(Country.governance),
                    joinedload(Country.pillar_1_hazard),
                    joinedload(Country.pillar_2_vigilance),
                    joinedload(Country.pillar_3_restoration),
                )
                .filter(Country.iso_code == iso_code.upper())
                .first()
            )
            
            if not country:
                # Try to find by name
                country = (
                    self.db.query(Country)
                    .options(
                        joinedload(Country.governance),
                        joinedload(Country.pillar_1_hazard),
                        joinedload(Country.pillar_2_vigilance),
                        joinedload(Country.pillar_3_restoration),
                    )
                    .filter(Country.name.ilike(f"%{iso_code}%"))
                    .first()
                )
            
            if not country:
                logger.warning(f"Country not found: {iso_code}")
                return None
            
            # Get intelligence data separately (no relationship defined)
            intelligence = (
                self.db.query(CountryIntelligence)
                .filter(CountryIntelligence.country_iso_code == country.iso_code)
                .first()
            )
            
            # Format all data
            return {
                "COUNTRY_NAME": country.name,
                "ISO_CODE": country.iso_code,
                "DATABASE_CONTEXT": self._format_complete_context(country, intelligence),
                "METRICS_DATA": self._format_metrics(country),
                "INTELLIGENCE_DATA": self._format_intelligence(intelligence),
                "CONTEXT": self._format_institutions(country),
                "PILLAR_SCORES": self._format_pillar_scores(country),
                "OHI_SCORE": str(round(country.maturity_score or 0, 1)),
            }
            
        except Exception as e:
            logger.error(f"Error fetching country context for {iso_code}: {e}", exc_info=True)
            return None
    
    def _format_complete_context(self, country: Country, intelligence: Optional[CountryIntelligence]) -> str:
        """Format complete database context as structured text."""
        sections = []
        
        # Header
        sections.append(f"# COMPLETE DATABASE CONTEXT FOR {country.name} ({country.iso_code})")
        sections.append("")
        
        # Maturity Overview
        sections.append("## MATURITY OVERVIEW")
        sections.append(f"- Overall Maturity Score: {self._fmt(country.maturity_score)}%")
        sections.append(f"- Governance Score: {self._fmt(country.governance_score)}%")
        sections.append(f"- Hazard Control Score (Pillar 1): {self._fmt(country.pillar1_score)}%")
        sections.append(f"- Health Vigilance Score (Pillar 2): {self._fmt(country.pillar2_score)}%")
        sections.append(f"- Restoration Score (Pillar 3): {self._fmt(country.pillar3_score)}%")
        sections.append("")
        
        # Governance Layer
        sections.append("## GOVERNANCE LAYER")
        if country.governance:
            g = country.governance
            sections.append(f"- ILO C187 (Promotional Framework) Ratified: {self._bool(g.ilo_c187_status)}")
            sections.append(f"- ILO C155 (OSH Convention) Ratified: {self._bool(g.ilo_c155_status)}")
            sections.append(f"- Inspector Density: {self._fmt(g.inspector_density)} per 10,000 workers")
            sections.append(f"- National Mental Health Policy: {self._bool(g.mental_health_policy)}")
            sections.append(f"- Strategic Capacity Score: {self._fmt(g.strategic_capacity_score)}%")
        else:
            sections.append("- No governance data available")
        sections.append("")
        
        # Pillar 1: Hazard Control
        sections.append("## PILLAR 1: HAZARD CONTROL")
        if country.pillar_1_hazard:
            p1 = country.pillar_1_hazard
            sections.append(f"- Fatal Accident Rate: {self._fmt(p1.fatal_accident_rate)} per 100,000 workers")
            sections.append(f"- Carcinogen Exposure: {self._fmt(p1.carcinogen_exposure_pct)}% of workforce")
            sections.append(f"- Heat Stress Regulation: {p1.heat_stress_reg_type or 'Unknown'}")
            sections.append(f"- OEL Compliance: {self._fmt(p1.oel_compliance_pct)}%")
            sections.append(f"- Noise-Induced Hearing Loss Rate: {self._fmt(p1.noise_induced_hearing_loss_rate)} per 100,000")
            sections.append(f"- Avg Safety Training Hours: {self._fmt(p1.safety_training_hours_avg)} hours/year")
            sections.append(f"- Control Maturity Score: {self._fmt(p1.control_maturity_score)}%")
        else:
            sections.append("- No hazard control data available")
        sections.append("")
        
        # Pillar 2: Health Vigilance
        sections.append("## PILLAR 2: HEALTH VIGILANCE")
        if country.pillar_2_vigilance:
            p2 = country.pillar_2_vigilance
            sections.append(f"- Surveillance System: {p2.surveillance_logic or 'Unknown'}")
            sections.append(f"- Disease Detection Rate: {self._fmt(p2.disease_detection_rate)}%")
            sections.append(f"- Workforce Vulnerability Index: {self._fmt(p2.vulnerability_index)}")
            sections.append(f"- Migrant Worker Percentage: {self._fmt(p2.migrant_worker_pct)}%")
            sections.append(f"- Lead Exposure Screening Rate: {self._fmt(p2.lead_exposure_screening_rate)} per 100,000")
            sections.append(f"- Disease Reporting Rate: {self._fmt(p2.occupational_disease_reporting_rate)}%")
        else:
            sections.append("- No health vigilance data available")
        sections.append("")
        
        # Pillar 3: Restoration
        sections.append("## PILLAR 3: RESTORATION")
        if country.pillar_3_restoration:
            p3 = country.pillar_3_restoration
            sections.append(f"- Compensation Mechanism: {p3.payer_mechanism or 'Unknown'}")
            sections.append(f"- Mandatory Reintegration Law: {self._bool(p3.reintegration_law)}")
            sections.append(f"- Avg Sickness Absence Days: {self._fmt(p3.sickness_absence_days)} days/year")
            sections.append(f"- Rehabilitation Access Score: {self._fmt(p3.rehab_access_score)}%")
            sections.append(f"- Return-to-Work Success Rate: {self._fmt(p3.return_to_work_success_pct)}%")
            sections.append(f"- Avg Claim Settlement Days: {self._fmt(p3.avg_claim_settlement_days)} days")
            sections.append(f"- Rehab Participation Rate: {self._fmt(p3.rehab_participation_rate)}%")
        else:
            sections.append("- No restoration data available")
        sections.append("")
        
        # Intelligence Data
        if intelligence:
            sections.append("## MULTI-SOURCE INTELLIGENCE")
            sections.append("")
            sections.append("### Governance Intelligence")
            sections.append(f"- Corruption Perception Index: {self._fmt(intelligence.corruption_perception_index)} (rank: {self._fmt(intelligence.corruption_rank)})")
            sections.append(f"- Rule of Law Index (WJP): {self._fmt(intelligence.rule_of_law_index)}")
            sections.append(f"- Government Effectiveness (WB): {self._fmt(intelligence.government_effectiveness)}")
            sections.append(f"- Regulatory Quality (WB): {self._fmt(intelligence.regulatory_quality)}")
            sections.append(f"- Social Security Coverage: {self._fmt(intelligence.social_security_coverage_pct)}%")
            sections.append("")
            
            sections.append("### Health & Safety Burden")
            sections.append(f"- Total Occupational DALYs: {self._fmt(intelligence.daly_occupational_total)} per 100,000")
            sections.append(f"- Occupational Deaths: {self._fmt(intelligence.deaths_occupational_total)} per 100,000")
            sections.append(f"- EPI Score: {self._fmt(intelligence.epi_score)} (rank: {self._fmt(intelligence.epi_rank)})")
            sections.append(f"- EPI Air Quality: {self._fmt(intelligence.epi_air_quality)}")
            sections.append("")
            
            sections.append("### Health System Capacity")
            sections.append(f"- UHC Service Coverage: {self._fmt(intelligence.uhc_service_coverage_index)}")
            sections.append(f"- Health Workforce Density: {self._fmt(intelligence.health_workforce_density)} per 10,000")
            sections.append(f"- Health Expenditure: {self._fmt(intelligence.health_expenditure_gdp_pct)}% of GDP")
            sections.append(f"- Life Expectancy: {self._fmt(intelligence.life_expectancy_at_birth)} years")
            sections.append("")
            
            sections.append("### Economic Context")
            sections.append(f"- GDP per Capita (PPP): ${self._fmt(intelligence.gdp_per_capita_ppp)}")
            sections.append(f"- Population: {self._fmt_pop(intelligence.population_total)}")
            sections.append(f"- Urban Population: {self._fmt(intelligence.urban_population_pct)}%")
            sections.append(f"- Unemployment Rate: {self._fmt(intelligence.unemployment_rate)}%")
            sections.append(f"- Informal Employment: {self._fmt(intelligence.informal_employment_pct)}%")
            sections.append("")
            
            sections.append("### Human Development")
            sections.append(f"- HDI Score: {self._fmt(intelligence.hdi_score)} (rank: {self._fmt(intelligence.hdi_rank)})")
            sections.append(f"- Education Index: {self._fmt(intelligence.education_index)}")
            sections.append(f"- Labor Force Participation: {self._fmt(intelligence.labor_force_participation)}%")
        
        return "\n".join(sections)
    
    def _format_metrics(self, country: Country) -> str:
        """Format core framework metrics."""
        lines = []
        lines.append(f"Country: {country.name} ({country.iso_code})")
        lines.append(f"Maturity Score: {self._fmt(country.maturity_score)}%")
        lines.append("")
        
        lines.append("GOVERNANCE:")
        if country.governance:
            g = country.governance
            lines.append(f"  Score: {self._fmt(country.governance_score)}%")
            lines.append(f"  ILO C187 Ratified: {self._bool(g.ilo_c187_status)}")
            lines.append(f"  ILO C155 Ratified: {self._bool(g.ilo_c155_status)}")
            lines.append(f"  Inspector Density: {self._fmt(g.inspector_density)}")
        
        lines.append("")
        lines.append("HAZARD CONTROL (Pillar 1):")
        if country.pillar_1_hazard:
            p1 = country.pillar_1_hazard
            lines.append(f"  Score: {self._fmt(country.pillar1_score)}%")
            lines.append(f"  Fatal Accident Rate: {self._fmt(p1.fatal_accident_rate)}")
            lines.append(f"  Carcinogen Exposure: {self._fmt(p1.carcinogen_exposure_pct)}%")
        
        lines.append("")
        lines.append("HEALTH VIGILANCE (Pillar 2):")
        if country.pillar_2_vigilance:
            p2 = country.pillar_2_vigilance
            lines.append(f"  Score: {self._fmt(country.pillar2_score)}%")
            lines.append(f"  Surveillance: {p2.surveillance_logic or 'Unknown'}")
            lines.append(f"  Disease Detection: {self._fmt(p2.disease_detection_rate)}%")
        
        lines.append("")
        lines.append("RESTORATION (Pillar 3):")
        if country.pillar_3_restoration:
            p3 = country.pillar_3_restoration
            lines.append(f"  Score: {self._fmt(country.pillar3_score)}%")
            lines.append(f"  Compensation: {p3.payer_mechanism or 'Unknown'}")
            lines.append(f"  Return-to-Work: {self._fmt(p3.return_to_work_success_pct)}%")
        
        return "\n".join(lines)
    
    def _format_intelligence(self, intelligence: Optional[CountryIntelligence]) -> str:
        """Format intelligence data."""
        if not intelligence:
            return "No intelligence data available"
        
        lines = []
        lines.append("GOVERNANCE INDICATORS:")
        lines.append(f"  Corruption Perception Index: {self._fmt(intelligence.corruption_perception_index)}")
        lines.append(f"  Rule of Law (WJP): {self._fmt(intelligence.rule_of_law_index)}")
        lines.append(f"  Government Effectiveness: {self._fmt(intelligence.government_effectiveness)}")
        lines.append("")
        
        lines.append("HEALTH BURDEN:")
        lines.append(f"  Occupational DALYs: {self._fmt(intelligence.daly_occupational_total)} per 100,000")
        lines.append(f"  Occupational Deaths: {self._fmt(intelligence.deaths_occupational_total)} per 100,000")
        lines.append(f"  EPI Score: {self._fmt(intelligence.epi_score)}")
        lines.append("")
        
        lines.append("ECONOMIC:")
        lines.append(f"  GDP per Capita (PPP): ${self._fmt(intelligence.gdp_per_capita_ppp)}")
        lines.append(f"  HDI: {self._fmt(intelligence.hdi_score)}")
        lines.append(f"  Unemployment: {self._fmt(intelligence.unemployment_rate)}%")
        lines.append("")
        
        lines.append("HEALTH SYSTEM:")
        lines.append(f"  UHC Coverage: {self._fmt(intelligence.uhc_service_coverage_index)}")
        lines.append(f"  Health Workforce: {self._fmt(intelligence.health_workforce_density)} per 10,000")
        lines.append(f"  Life Expectancy: {self._fmt(intelligence.life_expectancy_at_birth)} years")
        
        return "\n".join(lines)
    
    def _format_institutions(self, country: Country) -> str:
        """Format key institutions context (placeholder - can be enhanced)."""
        # This would ideally come from a dedicated institutions table
        # For now, provide general guidance
        return f"""Key stakeholders for {country.name}:
- Ministry of Labour / Employment
- Ministry of Health
- National OSH Authority/Institute
- Social Insurance Institution
- Major Trade Unions/Labor Federations
- Employer Associations
- ILO Country Office"""
    
    def _format_pillar_scores(self, country: Country) -> str:
        """Format pillar scores in a readable format."""
        return f"""Governance: {self._fmt(country.governance_score)}%
Hazard Control (P1): {self._fmt(country.pillar1_score)}%
Health Vigilance (P2): {self._fmt(country.pillar2_score)}%
Restoration (P3): {self._fmt(country.pillar3_score)}%
Overall Maturity: {self._fmt(country.maturity_score)}%"""
    
    def _fmt(self, value: Any) -> str:
        """Format a numeric value, handling None."""
        if value is None:
            return "N/A"
        if isinstance(value, float):
            return f"{value:.1f}"
        return str(value)
    
    def _fmt_pop(self, value: Any) -> str:
        """Format population number."""
        if value is None:
            return "N/A"
        if value >= 1_000_000_000:
            return f"{value / 1_000_000_000:.1f}B"
        if value >= 1_000_000:
            return f"{value / 1_000_000:.1f}M"
        if value >= 1_000:
            return f"{value / 1_000:.1f}K"
        return str(int(value))
    
    def _bool(self, value: Any) -> str:
        """Format a boolean value."""
        if value is None:
            return "Unknown"
        return "Yes" if value else "No"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_country_context(db: Session, iso_code: str) -> Optional[Dict[str, Any]]:
    """
    Convenience function to get country context.
    
    Example:
        context = get_country_context(db, "DEU")
        if context:
            print(context["DATABASE_CONTEXT"])
    """
    provider = CountryDataProvider(db)
    return provider.get_country_context(iso_code)


def detect_country_from_name(db: Session, name: str) -> Optional[str]:
    """
    Detect ISO code from country name.
    
    Returns ISO code if found, None otherwise.
    """
    country = db.query(Country).filter(Country.name.ilike(f"%{name}%")).first()
    return country.iso_code if country else None
