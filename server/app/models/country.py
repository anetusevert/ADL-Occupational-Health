"""
GOHIP Platform - Sovereign OH Integrity Framework v3.0
Database Models for Country Assessment Data

Phase 26: Extended Multi-Source Intelligence Integration

This module defines the relational schema for the 4 strategic layers:
- Governance Layer (strategic capacity & policy foundations)
- Pillar 1: Hazard Control (occupational hazard management)
- Pillar 2: Health Vigilance (surveillance & detection)
- Pillar 3: Restoration (compensation & rehabilitation)

Plus the CountryIntelligence table for deep AI-accessible insights from:
- ILOSTAT, World Bank, WHO GHO
- IHME Global Burden of Disease
- Yale Environmental Performance Index
- Transparency International CPI
- World Justice Project Rule of Law
- UNDP Human Development Index
- OECD.Stat
- Our World in Data
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


# ============================================================================
# ENUMS
# ============================================================================

class HeatStressRegulationType(str, enum.Enum):
    """Heat stress regulation types for Pillar 1."""
    STRICT = "Strict"
    ADVISORY = "Advisory"
    NONE = "None"


class SurveillanceLogicType(str, enum.Enum):
    """Surveillance logic types for Pillar 2."""
    RISK_BASED = "Risk-Based"
    MANDATORY = "Mandatory"
    INTEGRATED = "Integrated"
    FRAGMENTED = "Fragmented"
    MIXED = "Mixed"
    NONE = "None"


class PayerMechanismType(str, enum.Enum):
    """Payer mechanism types for Pillar 3."""
    NO_FAULT = "No-Fault"
    SOCIAL_INSURANCE = "Social Insurance"
    LITIGATION = "Litigation"
    MIXED = "Mixed"
    OUT_OF_POCKET = "Out-of-Pocket"


# ============================================================================
# COUNTRY TABLE (Parent Entity)
# ============================================================================

class Country(Base):
    """
    Primary entity representing a sovereign nation in the GOHIP framework.
    All strategic layers link back to this parent table.
    """
    __tablename__ = "countries"

    # Primary Key - ISO 3166-1 alpha-3 code
    iso_code = Column(String(3), primary_key=True, index=True)
    
    # Basic Information
    name = Column(String(100), unique=True, nullable=False, index=True)
    
    # Flag Image URL (local path to stored flag image)
    flag_url = Column(String(255), nullable=True, comment="URL path to country flag image")
    
    # Computed Maturity Score (aggregate of all layers)
    maturity_score = Column(Float, nullable=True)
    
    # Framework-Aligned Pillar Scores (0-100 scale)
    # These are calculated from component metrics using configurable weights
    governance_score = Column(Float, nullable=True, comment="Governance Index (0-100)")
    pillar1_score = Column(Float, nullable=True, comment="Hazard Control Index (0-100)")
    pillar2_score = Column(Float, nullable=True, comment="Health Vigilance Index (0-100)")
    pillar3_score = Column(Float, nullable=True, comment="Restoration Index (0-100)")
    
    # AI-Generated Strategic Assessment (Phase 4 - Consultant Agent)
    strategic_summary_text = Column(
        Text, 
        nullable=True, 
        comment="AI-generated qualitative strategic assessment from the Consultant Agent"
    )
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (One-to-One with each layer)
    governance = relationship(
        "GovernanceLayer",
        back_populates="country",
        uselist=False,
        cascade="all, delete-orphan"
    )
    pillar_1_hazard = relationship(
        "Pillar1Hazard",
        back_populates="country",
        uselist=False,
        cascade="all, delete-orphan"
    )
    pillar_2_vigilance = relationship(
        "Pillar2Vigilance",
        back_populates="country",
        uselist=False,
        cascade="all, delete-orphan"
    )
    pillar_3_restoration = relationship(
        "Pillar3Restoration",
        back_populates="country",
        uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Country(iso_code='{self.iso_code}', name='{self.name}')>"

    def data_coverage_score(self) -> float:
        """
        Calculate the data coverage score as a percentage (0-100).
        
        Measures how many data fields across all Pillars are populated
        versus the total possible fields.
        
        Returns:
            float: Percentage of non-null fields (0-100)
        """
        # Define the trackable fields for each layer (excluding IDs, FKs, timestamps, source_urls)
        governance_fields = [
            'ilo_c187_status', 'ilo_c155_status', 'inspector_density',
            'mental_health_policy', 'strategic_capacity_score'
        ]
        pillar1_fields = [
            'fatal_accident_rate', 'carcinogen_exposure_pct', 'heat_stress_reg_type',
            'oel_compliance_pct', 'noise_induced_hearing_loss_rate', 'safety_training_hours_avg',
            'control_maturity_score'
        ]
        pillar2_fields = [
            'surveillance_logic', 'disease_detection_rate', 'vulnerability_index',
            'migrant_worker_pct', 'lead_exposure_screening_rate', 'occupational_disease_reporting_rate'
        ]
        pillar3_fields = [
            'payer_mechanism', 'reintegration_law', 'sickness_absence_days', 'rehab_access_score',
            'return_to_work_success_pct', 'avg_claim_settlement_days', 'rehab_participation_rate'
        ]
        
        total_fields = len(governance_fields) + len(pillar1_fields) + len(pillar2_fields) + len(pillar3_fields)
        populated_fields = 0
        
        # Count Governance fields
        if self.governance:
            for field in governance_fields:
                if getattr(self.governance, field, None) is not None:
                    populated_fields += 1
        
        # Count Pillar 1 fields
        if self.pillar_1_hazard:
            for field in pillar1_fields:
                if getattr(self.pillar_1_hazard, field, None) is not None:
                    populated_fields += 1
        
        # Count Pillar 2 fields
        if self.pillar_2_vigilance:
            for field in pillar2_fields:
                if getattr(self.pillar_2_vigilance, field, None) is not None:
                    populated_fields += 1
        
        # Count Pillar 3 fields
        if self.pillar_3_restoration:
            for field in pillar3_fields:
                if getattr(self.pillar_3_restoration, field, None) is not None:
                    populated_fields += 1
        
        if total_fields == 0:
            return 0.0
        
        return round((populated_fields / total_fields) * 100, 1)


# ============================================================================
# GOVERNANCE LAYER (Strategic Capacity & Policy Foundations)
# ============================================================================

class GovernanceLayer(Base):
    """
    Governance Layer: Strategic capacity and policy foundation metrics.
    
    Tracks ILO convention ratifications, inspector density, and 
    strategic capacity indicators.
    """
    __tablename__ = "governance_layer"

    id = Column(String(36), primary_key=True)
    country_iso_code = Column(
        String(3),
        ForeignKey("countries.iso_code", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # ILO Convention Ratification Status
    ilo_c187_status = Column(Boolean, nullable=True, comment="ILO C187 Promotional Framework ratified")
    ilo_c155_status = Column(Boolean, nullable=True, comment="ILO C155 Occupational Safety & Health ratified")
    
    # Structural Indicators
    inspector_density = Column(Float, nullable=True, comment="Inspectors per 10,000 workers")
    mental_health_policy = Column(Boolean, nullable=True, comment="National workplace mental health policy exists")
    
    # Computed Score
    strategic_capacity_score = Column(Float, nullable=True, comment="Aggregate governance capacity (0-100)")
    
    # Source Documentation (JSONB for flexible URL storage)
    source_urls = Column(JSONB, nullable=True, comment="Source URLs for all data points")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    country = relationship("Country", back_populates="governance")

    def __repr__(self):
        return f"<GovernanceLayer(country='{self.country_iso_code}')>"


# ============================================================================
# PILLAR 1: HAZARD CONTROL
# ============================================================================

class Pillar1Hazard(Base):
    """
    Pillar 1: Hazard Control metrics.
    
    Tracks fatal accident rates, carcinogen exposure, heat stress regulations,
    OEL compliance, noise-induced hearing loss, and overall control maturity.
    """
    __tablename__ = "pillar_1_hazard"

    id = Column(String(36), primary_key=True)
    country_iso_code = Column(
        String(3),
        ForeignKey("countries.iso_code", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # Core Metrics
    fatal_accident_rate = Column(Float, nullable=True, comment="Fatal accidents per 100,000 workers")
    carcinogen_exposure_pct = Column(Float, nullable=True, comment="% workforce exposed to carcinogens")
    
    # Regulatory Classification
    # Using String instead of Enum to avoid SQLAlchemy enum validation issues
    # with existing database values
    heat_stress_reg_type = Column(
        String(50),
        nullable=True,
        comment="Heat stress regulation type"
    )
    
    # === NEW DENSIFIED METRICS ===
    oel_compliance_pct = Column(Float, nullable=True, comment="Occupational Exposure Limit compliance percentage")
    noise_induced_hearing_loss_rate = Column(Float, nullable=True, comment="NIHL rate per 100,000 workers")
    safety_training_hours_avg = Column(Float, nullable=True, comment="Average annual safety training hours per worker")
    
    # Computed Score
    control_maturity_score = Column(Float, nullable=True, comment="Hazard control maturity (0-100)")
    
    # Source Documentation
    source_urls = Column(JSONB, nullable=True, comment="Source URLs for all data points")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    country = relationship("Country", back_populates="pillar_1_hazard")

    def __repr__(self):
        return f"<Pillar1Hazard(country='{self.country_iso_code}')>"


# ============================================================================
# PILLAR 2: HEALTH VIGILANCE
# ============================================================================

class Pillar2Vigilance(Base):
    """
    Pillar 2: Health Vigilance metrics.
    
    Tracks surveillance systems, disease detection rates, vulnerability indices,
    migrant workforce health, lead exposure screening, and disease reporting.
    """
    __tablename__ = "pillar_2_vigilance"

    id = Column(String(36), primary_key=True)
    country_iso_code = Column(
        String(3),
        ForeignKey("countries.iso_code", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # Surveillance Configuration
    # Using String instead of Enum to avoid SQLAlchemy enum validation issues
    # with existing database values
    surveillance_logic = Column(
        String(50),
        nullable=True,
        comment="Surveillance system logic type"
    )
    
    # Core Metrics
    disease_detection_rate = Column(Float, nullable=True, comment="Occupational disease detection rate")
    vulnerability_index = Column(Float, nullable=True, comment="Worker vulnerability index (0-100)")
    
    # === NEW DENSIFIED METRICS ===
    migrant_worker_pct = Column(Float, nullable=True, comment="Migrant workforce percentage")
    lead_exposure_screening_rate = Column(Float, nullable=True, comment="Lead exposure screening rate per 100,000")
    occupational_disease_reporting_rate = Column(Float, nullable=True, comment="Disease reporting compliance rate (%)")
    
    # Source Documentation
    source_urls = Column(JSONB, nullable=True, comment="Source URLs for all data points")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    country = relationship("Country", back_populates="pillar_2_vigilance")

    def __repr__(self):
        return f"<Pillar2Vigilance(country='{self.country_iso_code}')>"


# ============================================================================
# PILLAR 3: RESTORATION
# ============================================================================

class Pillar3Restoration(Base):
    """
    Pillar 3: Restoration metrics.
    
    Tracks compensation mechanisms, reintegration laws, sickness absence,
    rehabilitation access, return-to-work success, and claim settlement.
    """
    __tablename__ = "pillar_3_restoration"

    id = Column(String(36), primary_key=True)
    country_iso_code = Column(
        String(3),
        ForeignKey("countries.iso_code", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # Compensation Framework
    # Using String instead of Enum to avoid SQLAlchemy enum validation issues
    # with existing database values
    payer_mechanism = Column(
        String(50),
        nullable=True,
        comment="Compensation payer mechanism type"
    )
    
    # Legal Framework
    reintegration_law = Column(Boolean, nullable=True, comment="Mandatory return-to-work legislation exists")
    
    # Core Metrics
    sickness_absence_days = Column(Float, nullable=True, comment="Average sickness absence days per worker per year")
    rehab_access_score = Column(Float, nullable=True, comment="Rehabilitation access score (0-100)")
    
    # === NEW DENSIFIED METRICS ===
    return_to_work_success_pct = Column(Float, nullable=True, comment="Return-to-work program success rate (%)")
    avg_claim_settlement_days = Column(Float, nullable=True, comment="Average days to settle workers' comp claim")
    rehab_participation_rate = Column(Float, nullable=True, comment="Rehabilitation program participation rate (%)")
    
    # Source Documentation
    source_urls = Column(JSONB, nullable=True, comment="Source URLs for all data points")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    country = relationship("Country", back_populates="pillar_3_restoration")

    def __repr__(self):
        return f"<Pillar3Restoration(country='{self.country_iso_code}')>"


# ============================================================================
# COUNTRY INTELLIGENCE (Deep AI-Accessible Insights)
# ============================================================================

class CountryIntelligence(Base):
    """
    Comprehensive intelligence layer aggregating data from multiple sources.
    
    This table provides AI-accessible deep insights for generating smart summaries
    and powering advanced analytics across all framework pillars.
    
    Data Sources:
    - ILOSTAT: Labor statistics, injury rates, social security
    - World Bank: Economic indicators, governance metrics
    - WHO GHO: Health coverage, mortality data
    - IHME GBD: Disease burden, DALYs, risk factors
    - Yale EPI: Environmental performance, air quality
    - Transparency International: Corruption perception
    - World Justice Project: Rule of law, enforcement
    - UNDP: Human development, education
    - OECD: Work-life balance (for member countries)
    - Our World in Data: Aggregated metrics
    """
    __tablename__ = "country_intelligence"

    id = Column(String(36), primary_key=True)
    country_iso_code = Column(
        String(3),
        ForeignKey("countries.iso_code", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # =========================================================================
    # GOVERNANCE INTELLIGENCE (Rule of Law & Institutional Capacity)
    # =========================================================================
    
    # Transparency International
    corruption_perception_index = Column(Float, nullable=True, comment="TI CPI Score (0-100, higher=less corrupt)")
    corruption_rank = Column(Float, nullable=True, comment="TI CPI Global Rank")
    
    # World Justice Project
    rule_of_law_index = Column(Float, nullable=True, comment="WJP Rule of Law Index (0-1)")
    regulatory_enforcement_score = Column(Float, nullable=True, comment="WJP Regulatory Enforcement (0-1)")
    civil_justice_score = Column(Float, nullable=True, comment="WJP Civil Justice (0-1)")
    constraints_on_gov_powers = Column(Float, nullable=True, comment="WJP Constraints on Government Powers (0-1)")
    open_government_score = Column(Float, nullable=True, comment="WJP Open Government (0-1)")
    
    # World Bank Governance
    government_effectiveness = Column(Float, nullable=True, comment="WB Government Effectiveness (-2.5 to 2.5)")
    regulatory_quality = Column(Float, nullable=True, comment="WB Regulatory Quality (-2.5 to 2.5)")
    rule_of_law_wb = Column(Float, nullable=True, comment="WB Rule of Law (-2.5 to 2.5)")
    control_of_corruption_wb = Column(Float, nullable=True, comment="WB Control of Corruption (-2.5 to 2.5)")
    political_stability = Column(Float, nullable=True, comment="WB Political Stability (-2.5 to 2.5)")
    voice_accountability = Column(Float, nullable=True, comment="WB Voice & Accountability (-2.5 to 2.5)")
    
    # ILOSTAT - Social Protection
    social_security_coverage_pct = Column(Float, nullable=True, comment="% workforce with social security coverage")
    unemployment_insurance_coverage = Column(Float, nullable=True, comment="% with unemployment insurance")
    
    # =========================================================================
    # HAZARD CONTROL INTELLIGENCE (Burden of Disease & Environmental Risk)
    # =========================================================================
    
    # IHME Global Burden of Disease - Occupational DALYs
    daly_occupational_total = Column(Float, nullable=True, comment="Total Occupational DALYs per 100,000")
    daly_occupational_injuries = Column(Float, nullable=True, comment="DALYs from Occupational Injuries per 100,000")
    daly_occupational_carcinogens = Column(Float, nullable=True, comment="DALYs from Occupational Carcinogens per 100,000")
    daly_occupational_noise = Column(Float, nullable=True, comment="DALYs from Occupational Noise per 100,000")
    daly_occupational_ergonomic = Column(Float, nullable=True, comment="DALYs from Ergonomic Factors per 100,000")
    daly_occupational_particulates = Column(Float, nullable=True, comment="DALYs from Particulate Matter per 100,000")
    daly_occupational_asthmagens = Column(Float, nullable=True, comment="DALYs from Occupational Asthmagens per 100,000")
    
    # IHME - Mortality
    deaths_occupational_total = Column(Float, nullable=True, comment="Deaths from Occupational Causes per 100,000")
    deaths_occupational_injuries = Column(Float, nullable=True, comment="Deaths from Occupational Injuries per 100,000")
    deaths_occupational_diseases = Column(Float, nullable=True, comment="Deaths from Occupational Diseases per 100,000")
    
    # Yale Environmental Performance Index
    epi_score = Column(Float, nullable=True, comment="Yale EPI Overall Score (0-100)")
    epi_rank = Column(Float, nullable=True, comment="Yale EPI Global Rank")
    epi_air_quality = Column(Float, nullable=True, comment="EPI Air Quality Score (0-100)")
    epi_pm25_exposure = Column(Float, nullable=True, comment="EPI PM2.5 Exposure Score (0-100)")
    epi_heavy_metals = Column(Float, nullable=True, comment="EPI Heavy Metals Exposure Score (0-100)")
    epi_lead_exposure = Column(Float, nullable=True, comment="EPI Lead Exposure Score (0-100)")
    epi_occupational_safety = Column(Float, nullable=True, comment="EPI Occupational Safety Proxy Score")
    epi_sanitation = Column(Float, nullable=True, comment="EPI Sanitation Score (0-100)")
    
    # ILOSTAT - Extended Injury Data
    non_fatal_injury_rate = Column(Float, nullable=True, comment="Non-Fatal Injuries per 100,000 workers")
    injury_frequency_rate = Column(Float, nullable=True, comment="Injury Frequency Rate")
    days_lost_per_injury = Column(Float, nullable=True, comment="Average Days Lost per Injury")
    
    # =========================================================================
    # HEALTH VIGILANCE INTELLIGENCE (Detection & Monitoring Capacity)
    # =========================================================================
    
    # WHO Global Health Observatory
    uhc_service_coverage_index = Column(Float, nullable=True, comment="WHO UHC Service Coverage Index (0-100)")
    health_workforce_density = Column(Float, nullable=True, comment="Health workers per 10,000 population")
    hospital_beds_density = Column(Float, nullable=True, comment="Hospital beds per 10,000 population")
    
    # WHO - Mortality & Safety Culture Proxies
    road_traffic_deaths_rate = Column(Float, nullable=True, comment="Road traffic deaths per 100,000 (safety culture proxy)")
    life_expectancy_at_birth = Column(Float, nullable=True, comment="Life expectancy at birth (years)")
    healthy_life_expectancy = Column(Float, nullable=True, comment="Healthy life expectancy (years)")
    
    # World Bank - Health System Capacity
    health_expenditure_gdp_pct = Column(Float, nullable=True, comment="Health expenditure as % of GDP")
    health_expenditure_per_capita = Column(Float, nullable=True, comment="Health expenditure per capita (USD)")
    out_of_pocket_health_pct = Column(Float, nullable=True, comment="Out-of-pocket health expenditure (%)")
    
    # =========================================================================
    # RESTORATION INTELLIGENCE (Rehabilitation & Social Support)
    # =========================================================================
    
    # UNDP Human Development
    hdi_score = Column(Float, nullable=True, comment="UNDP Human Development Index (0-1)")
    hdi_rank = Column(Float, nullable=True, comment="UNDP HDI Global Rank")
    education_index = Column(Float, nullable=True, comment="UNDP Education Index (0-1)")
    expected_years_schooling = Column(Float, nullable=True, comment="Expected Years of Schooling")
    mean_years_schooling = Column(Float, nullable=True, comment="Mean Years of Schooling")
    gni_per_capita = Column(Float, nullable=True, comment="Gross National Income per capita (PPP USD)")
    inequality_adjusted_hdi = Column(Float, nullable=True, comment="Inequality-Adjusted HDI")
    
    # OECD Work-Life Balance (OECD countries only)
    oecd_work_life_balance = Column(Float, nullable=True, comment="OECD Work-Life Balance Score")
    oecd_hours_worked_annual = Column(Float, nullable=True, comment="OECD Average Annual Hours Worked")
    oecd_long_hours_pct = Column(Float, nullable=True, comment="OECD % Working Very Long Hours")
    oecd_time_for_leisure = Column(Float, nullable=True, comment="OECD Time Devoted to Leisure (hours/day)")
    
    # World Bank - Labor Market
    labor_force_participation = Column(Float, nullable=True, comment="Labor force participation rate (%)")
    unemployment_rate = Column(Float, nullable=True, comment="Unemployment rate (%)")
    youth_unemployment_rate = Column(Float, nullable=True, comment="Youth unemployment rate (%)")
    informal_employment_pct = Column(Float, nullable=True, comment="Informal employment as % of total")
    
    # =========================================================================
    # ECONOMIC CONTEXT (Cross-Cutting)
    # =========================================================================
    
    gdp_per_capita_ppp = Column(Float, nullable=True, comment="GDP per capita (PPP, current USD)")
    gdp_growth_rate = Column(Float, nullable=True, comment="GDP growth rate (%)")
    industry_pct_gdp = Column(Float, nullable=True, comment="Industry (including construction) % of GDP")
    manufacturing_pct_gdp = Column(Float, nullable=True, comment="Manufacturing % of GDP")
    agriculture_pct_gdp = Column(Float, nullable=True, comment="Agriculture % of GDP")
    services_pct_gdp = Column(Float, nullable=True, comment="Services % of GDP")
    
    # Population & Demographics
    population_total = Column(Float, nullable=True, comment="Total population")
    population_working_age = Column(Float, nullable=True, comment="Working age population (15-64)")
    urban_population_pct = Column(Float, nullable=True, comment="Urban population %")
    median_age = Column(Float, nullable=True, comment="Median age (years)")
    
    # =========================================================================
    # DATA QUALITY & METADATA
    # =========================================================================
    
    # Source tracking (JSONB for flexible storage of all source URLs and timestamps)
    data_sources = Column(JSONB, nullable=True, comment="Detailed source tracking for all metrics")
    
    # Data freshness
    last_ilostat_update = Column(DateTime, nullable=True)
    last_worldbank_update = Column(DateTime, nullable=True)
    last_who_update = Column(DateTime, nullable=True)
    last_ihme_update = Column(DateTime, nullable=True)
    last_epi_update = Column(DateTime, nullable=True)
    last_cpi_update = Column(DateTime, nullable=True)
    last_wjp_update = Column(DateTime, nullable=True)
    last_undp_update = Column(DateTime, nullable=True)
    last_oecd_update = Column(DateTime, nullable=True)
    
    # AI Summary (generated from all intelligence data)
    ai_deep_summary = Column(Text, nullable=True, comment="AI-generated deep intelligence summary")
    ai_risk_assessment = Column(Text, nullable=True, comment="AI-generated risk assessment")
    ai_opportunity_areas = Column(Text, nullable=True, comment="AI-identified opportunity areas")
    
    # Computed Scores
    governance_intelligence_score = Column(Float, nullable=True, comment="Composite governance intelligence (0-100)")
    hazard_intelligence_score = Column(Float, nullable=True, comment="Composite hazard intelligence (0-100)")
    vigilance_intelligence_score = Column(Float, nullable=True, comment="Composite vigilance intelligence (0-100)")
    restoration_intelligence_score = Column(Float, nullable=True, comment="Composite restoration intelligence (0-100)")
    overall_intelligence_score = Column(Float, nullable=True, comment="Overall intelligence composite (0-100)")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    country = relationship("Country", backref="intelligence")

    def __repr__(self):
        return f"<CountryIntelligence(country='{self.country_iso_code}')>"


# ============================================================================
# COUNTRY STRATEGIC DEEP DIVE (Phase 27 - Admin-Only Strategic Analysis)
# ============================================================================

class DeepDiveStatus(str, enum.Enum):
    """Status of deep dive analysis."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CountryDeepDive(Base):
    """
    Strategic Deep Dive Analysis - Admin-generated comprehensive country reports.
    
    This model stores AI-generated strategic analyses from the Strategic Deep Dive Agent.
    The agent is an expert in occupational and nutritional health policy analysis.
    
    Features:
    - Executive summary with strategic narrative
    - SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
    - Key findings and insights
    - Strategic recommendations with priority levels
    - Action items for policy implementation
    - Source references and data provenance
    """
    __tablename__ = "country_deep_dives"
    
    # Composite unique constraint: one report per country+topic combination
    __table_args__ = (
        UniqueConstraint('country_iso_code', 'topic', name='uq_country_topic'),
    )

    id = Column(String(36), primary_key=True)
    country_iso_code = Column(
        String(3),
        ForeignKey("countries.iso_code", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Analysis topic this report covers
    topic = Column(
        String(100),
        nullable=False,
        index=True,
        default="Comprehensive Occupational Health Assessment",
        comment="Analysis topic this report covers (e.g., 'Policy & Regulatory Framework')"
    )

    # Status tracking
    status = Column(
        Enum(DeepDiveStatus),
        default=DeepDiveStatus.PENDING,
        nullable=False,
        comment="Current status of the deep dive analysis"
    )
    
    # Queue position for ordering in the generation queue
    queue_position = Column(
        Integer,
        nullable=True,
        default=None,
        index=True,
        comment="Position in generation queue (lower = higher priority)"
    )
    
    # =========================================================================
    # EXECUTIVE SUMMARY & NARRATIVE
    # =========================================================================
    
    executive_summary = Column(
        Text,
        nullable=True,
        comment="Concise 3-4 sentence strategic overview"
    )
    
    strategy_name = Column(
        String(200),
        nullable=True,
        comment="Compelling strategy title (e.g., 'The Nordic Resilience Model')"
    )
    
    strategic_narrative = Column(
        Text,
        nullable=True,
        comment="Detailed strategic narrative with policy context"
    )
    
    # =========================================================================
    # KEY FINDINGS & INSIGHTS
    # =========================================================================
    
    key_findings = Column(
        JSONB,
        nullable=True,
        comment="Array of key strategic findings [{title, description, impact_level}]"
    )
    
    health_profile = Column(
        Text,
        nullable=True,
        comment="Occupational and nutritional health profile summary"
    )
    
    workforce_insights = Column(
        Text,
        nullable=True,
        comment="Workforce health and safety insights"
    )
    
    # =========================================================================
    # SWOT ANALYSIS
    # =========================================================================
    
    strengths = Column(
        JSONB,
        nullable=True,
        comment="Array of strength items [{title, description}]"
    )
    
    weaknesses = Column(
        JSONB,
        nullable=True,
        comment="Array of weakness items [{title, description}]"
    )
    
    opportunities = Column(
        JSONB,
        nullable=True,
        comment="Array of opportunity items [{title, description}]"
    )
    
    threats = Column(
        JSONB,
        nullable=True,
        comment="Array of threat items [{title, description}]"
    )
    
    # =========================================================================
    # RECOMMENDATIONS & ACTION ITEMS
    # =========================================================================
    
    strategic_recommendations = Column(
        JSONB,
        nullable=True,
        comment="Array of recommendations [{title, description, priority, timeline}]"
    )
    
    action_items = Column(
        JSONB,
        nullable=True,
        comment="Array of actionable items [{action, responsible_party, timeline}]"
    )
    
    priority_interventions = Column(
        JSONB,
        nullable=True,
        comment="Top 3-5 priority interventions for immediate focus"
    )
    
    # =========================================================================
    # BENCHMARKING & COMPARISONS
    # =========================================================================
    
    peer_comparison = Column(
        Text,
        nullable=True,
        comment="Comparison with peer countries in same region/income group"
    )
    
    global_ranking_context = Column(
        Text,
        nullable=True,
        comment="Context on global ranking and performance"
    )
    
    benchmark_countries = Column(
        JSONB,
        nullable=True,
        comment="List of benchmark countries for comparison [{iso_code, name, reason}]"
    )
    
    # =========================================================================
    # DATA PROVENANCE & SOURCES
    # =========================================================================
    
    data_sources_used = Column(
        JSONB,
        nullable=True,
        comment="List of data sources consulted during analysis"
    )
    
    external_research_summary = Column(
        Text,
        nullable=True,
        comment="Summary of external web research findings"
    )
    
    data_quality_notes = Column(
        Text,
        nullable=True,
        comment="Notes on data quality and coverage for this country"
    )
    
    # =========================================================================
    # GENERATION METADATA
    # =========================================================================
    
    ai_provider = Column(
        String(100),
        nullable=True,
        comment="AI provider and model used for generation"
    )
    
    generation_log = Column(
        JSONB,
        nullable=True,
        comment="Agent activity log from generation process"
    )
    
    generated_by_user_id = Column(
        String(36),
        nullable=True,
        comment="User ID of admin who triggered generation"
    )
    
    error_message = Column(
        Text,
        nullable=True,
        comment="Error message if generation failed"
    )
    
    # Timestamps
    generated_at = Column(DateTime, nullable=True, comment="When analysis was completed")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    country = relationship("Country", backref="deep_dive")

    def __repr__(self):
        return f"<CountryDeepDive(country='{self.country_iso_code}', status='{self.status.value}')>"
    
    def to_report_dict(self) -> dict:
        """Convert to a dictionary suitable for frontend display."""
        return {
            "iso_code": self.country_iso_code,
            "topic": self.topic,
            "status": self.status.value,
            "strategy_name": self.strategy_name,
            "executive_summary": self.executive_summary,
            "strategic_narrative": self.strategic_narrative,
            "health_profile": self.health_profile,
            "workforce_insights": self.workforce_insights,
            "key_findings": self.key_findings or [],
            "strengths": self.strengths or [],
            "weaknesses": self.weaknesses or [],
            "opportunities": self.opportunities or [],
            "threats": self.threats or [],
            "strategic_recommendations": self.strategic_recommendations or [],
            "action_items": self.action_items or [],
            "priority_interventions": self.priority_interventions or [],
            "peer_comparison": self.peer_comparison,
            "global_ranking_context": self.global_ranking_context,
            "benchmark_countries": self.benchmark_countries or [],
            "data_sources_used": self.data_sources_used or [],
            "external_research_summary": self.external_research_summary,
            "data_quality_notes": self.data_quality_notes,
            "ai_provider": self.ai_provider,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ============================================================================
# CACHED REPORTS (Persistent Report Storage)
# ============================================================================

class CachedPillarReport(Base):
    """
    Cached pillar analysis reports for persistent storage.
    Reports are generated once by admins and served to all users.
    """
    __tablename__ = "cached_pillar_reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    iso_code = Column(String(3), ForeignKey("countries.iso_code"), index=True, nullable=False)
    pillar_id = Column(String(50), index=True, nullable=False, comment="governance, hazard-control, vigilance, restoration")
    report_json = Column(Text, nullable=False, comment="Full JSON response from LLM")
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Unique constraint: one report per country-pillar combination
    __table_args__ = (
        UniqueConstraint('iso_code', 'pillar_id', name='uq_cached_pillar_report'),
    )
    
    # Relationships
    country = relationship("Country", backref="cached_pillar_reports")
    generated_by = relationship("User", backref="generated_pillar_reports")
    
    def __repr__(self):
        return f"<CachedPillarReport(country='{self.iso_code}', pillar='{self.pillar_id}')>"


class CachedSummaryReport(Base):
    """
    Cached overall summary reports for persistent storage.
    Reports are generated once by admins and served to all users.
    """
    __tablename__ = "cached_summary_reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    iso_code = Column(String(3), ForeignKey("countries.iso_code"), unique=True, index=True, nullable=False)
    report_json = Column(Text, nullable=False, comment="Full JSON response from LLM")
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    generated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    country = relationship("Country", backref="cached_summary_report")
    generated_by = relationship("User", backref="generated_summary_reports")
    
    def __repr__(self):
        return f"<CachedSummaryReport(country='{self.iso_code}')>"
