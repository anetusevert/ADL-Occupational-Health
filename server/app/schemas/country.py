"""
GOHIP Platform - Pydantic Schemas for Country Assessment Data
Sovereign OH Integrity Framework v3.0

These schemas handle validation for API requests/responses and provide
nested structures for the complete country assessment view.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict, computed_field


# ============================================================================
# ENUMS (Mirror SQLAlchemy enums for Pydantic validation)
# ============================================================================

class HeatStressRegulationType(str, Enum):
    """Heat stress regulation types for Pillar 1."""
    STRICT = "Strict"
    ADVISORY = "Advisory"
    NONE = "None"


class SurveillanceLogicType(str, Enum):
    """Surveillance logic types for Pillar 2."""
    RISK_BASED = "Risk-Based"
    MANDATORY = "Mandatory"
    INTEGRATED = "Integrated"
    FRAGMENTED = "Fragmented"
    MIXED = "Mixed"
    NONE = "None"


class PayerMechanismType(str, Enum):
    """Payer mechanism types for Pillar 3."""
    NO_FAULT = "No-Fault"
    SOCIAL_INSURANCE = "Social Insurance"
    LITIGATION = "Litigation"
    MIXED = "Mixed"
    OUT_OF_POCKET = "Out-of-Pocket"


# ============================================================================
# GOVERNANCE LAYER SCHEMAS
# ============================================================================

class GovernanceLayerBase(BaseModel):
    """Base schema for Governance Layer data."""
    ilo_c187_status: Optional[bool] = Field(None, description="ILO C187 Promotional Framework ratified")
    ilo_c155_status: Optional[bool] = Field(None, description="ILO C155 Occupational Safety & Health ratified")
    inspector_density: Optional[float] = Field(None, ge=0, description="Inspectors per 10,000 workers")
    mental_health_policy: Optional[bool] = Field(None, description="National workplace mental health policy exists")
    strategic_capacity_score: Optional[float] = Field(None, ge=0, le=100, description="Aggregate governance capacity (0-100)")
    source_urls: Optional[Dict[str, Any]] = Field(None, description="Source URLs for all data points")


class GovernanceLayerCreate(GovernanceLayerBase):
    """Schema for creating Governance Layer data."""
    pass


class GovernanceLayerResponse(GovernanceLayerBase):
    """Schema for Governance Layer API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    country_iso_code: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class GovernanceLayerNested(GovernanceLayerBase):
    """Nested schema for embedding in Country responses."""
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# PILLAR 1: HAZARD CONTROL SCHEMAS
# ============================================================================

class Pillar1HazardBase(BaseModel):
    """Base schema for Pillar 1 Hazard Control data."""
    fatal_accident_rate: Optional[float] = Field(None, ge=0, description="Fatal accidents per 100,000 workers")
    carcinogen_exposure_pct: Optional[float] = Field(None, ge=0, le=100, description="% workforce exposed to carcinogens")
    heat_stress_reg_type: Optional[HeatStressRegulationType] = Field(None, description="Heat stress regulation type")
    # === NEW DENSIFIED METRICS ===
    oel_compliance_pct: Optional[float] = Field(None, ge=0, le=100, description="Occupational Exposure Limit compliance (%)")
    noise_induced_hearing_loss_rate: Optional[float] = Field(None, ge=0, description="NIHL rate per 100,000 workers")
    safety_training_hours_avg: Optional[float] = Field(None, ge=0, description="Average annual safety training hours per worker")
    control_maturity_score: Optional[float] = Field(None, ge=0, le=100, description="Hazard control maturity (0-100)")
    source_urls: Optional[Dict[str, Any]] = Field(None, description="Source URLs for all data points")


class Pillar1HazardCreate(Pillar1HazardBase):
    """Schema for creating Pillar 1 Hazard data."""
    pass


class Pillar1HazardResponse(Pillar1HazardBase):
    """Schema for Pillar 1 Hazard API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    country_iso_code: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class Pillar1HazardNested(Pillar1HazardBase):
    """Nested schema for embedding in Country responses."""
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# PILLAR 2: HEALTH VIGILANCE SCHEMAS
# ============================================================================

class Pillar2VigilanceBase(BaseModel):
    """Base schema for Pillar 2 Health Vigilance data."""
    surveillance_logic: Optional[SurveillanceLogicType] = Field(None, description="Surveillance system logic type")
    disease_detection_rate: Optional[float] = Field(None, ge=0, description="Occupational disease detection rate")
    vulnerability_index: Optional[float] = Field(None, ge=0, le=100, description="Worker vulnerability index (0-100)")
    # === NEW DENSIFIED METRICS ===
    migrant_worker_pct: Optional[float] = Field(None, ge=0, le=100, description="Migrant workforce percentage")
    lead_exposure_screening_rate: Optional[float] = Field(None, ge=0, description="Lead exposure screening rate per 100,000")
    occupational_disease_reporting_rate: Optional[float] = Field(None, ge=0, le=100, description="Disease reporting compliance rate (%)")
    source_urls: Optional[Dict[str, Any]] = Field(None, description="Source URLs for all data points")


class Pillar2VigilanceCreate(Pillar2VigilanceBase):
    """Schema for creating Pillar 2 Vigilance data."""
    pass


class Pillar2VigilanceResponse(Pillar2VigilanceBase):
    """Schema for Pillar 2 Vigilance API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    country_iso_code: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class Pillar2VigilanceNested(Pillar2VigilanceBase):
    """Nested schema for embedding in Country responses."""
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# PILLAR 3: RESTORATION SCHEMAS
# ============================================================================

class Pillar3RestorationBase(BaseModel):
    """Base schema for Pillar 3 Restoration data."""
    payer_mechanism: Optional[PayerMechanismType] = Field(None, description="Compensation payer mechanism type")
    reintegration_law: Optional[bool] = Field(None, description="Mandatory return-to-work legislation exists")
    sickness_absence_days: Optional[float] = Field(None, ge=0, description="Average sickness absence days per worker per year")
    rehab_access_score: Optional[float] = Field(None, ge=0, le=100, description="Rehabilitation access score (0-100)")
    # === NEW DENSIFIED METRICS ===
    return_to_work_success_pct: Optional[float] = Field(None, ge=0, le=100, description="Return-to-work program success rate (%)")
    avg_claim_settlement_days: Optional[float] = Field(None, ge=0, description="Average days to settle workers' comp claim")
    rehab_participation_rate: Optional[float] = Field(None, ge=0, le=100, description="Rehabilitation program participation rate (%)")
    source_urls: Optional[Dict[str, Any]] = Field(None, description="Source URLs for all data points")


class Pillar3RestorationCreate(Pillar3RestorationBase):
    """Schema for creating Pillar 3 Restoration data."""
    pass


class Pillar3RestorationResponse(Pillar3RestorationBase):
    """Schema for Pillar 3 Restoration API responses."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    country_iso_code: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class Pillar3RestorationNested(Pillar3RestorationBase):
    """Nested schema for embedding in Country responses."""
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# COUNTRY SCHEMAS (Top-level with nested layers)
# ============================================================================

def get_maturity_label_from_score(score: Optional[float]) -> Optional[str]:
    """
    Get the maturity stage label based on the score (1.0-4.0 scale).
    
    Returns:
        Stage label string (e.g., "Stage 3 Advancing")
    
    Score ranges (1.0-4.0 scale, canonical definitions):
    - 1.0-1.9: Stage 1 Critical (Red)
    - 2.0-2.4: Stage 2 Developing (Orange)
    - 2.5-3.4: Stage 3 Advancing (Yellow)
    - 3.5-4.0: Stage 4 Leading (Green)
    """
    if score is None:
        return None
    
    if score >= 3.5:
        return "Stage 4 Leading"
    elif score >= 2.5:
        return "Stage 3 Advancing"
    elif score >= 2.0:
        return "Stage 2 Developing"
    else:
        return "Stage 1 Critical"


class CountryBase(BaseModel):
    """Base schema for Country data."""
    iso_code: str = Field(..., min_length=3, max_length=3, description="ISO 3166-1 alpha-3 code")
    name: str = Field(..., min_length=1, max_length=100, description="Country name")
    maturity_score: Optional[float] = Field(None, ge=0, le=100, description="Overall maturity score (0-100 scale)")


class CountryCreate(CountryBase):
    """
    Schema for creating a Country with all nested layers.
    Use this for full country data insertion.
    """
    governance: Optional[GovernanceLayerCreate] = Field(None, description="Governance layer data")
    pillar_1_hazard: Optional[Pillar1HazardCreate] = Field(None, description="Pillar 1: Hazard Control data")
    pillar_2_vigilance: Optional[Pillar2VigilanceCreate] = Field(None, description="Pillar 2: Health Vigilance data")
    pillar_3_restoration: Optional[Pillar3RestorationCreate] = Field(None, description="Pillar 3: Restoration data")


class CountryResponse(CountryBase):
    """
    Full Country response schema with all nested layers.
    Returns the complete assessment structure in one JSON object.
    """
    model_config = ConfigDict(from_attributes=True)
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    strategic_summary_text: Optional[str] = Field(None, description="AI-generated strategic assessment")
    
    # Flag URL for country flag image
    flag_url: Optional[str] = Field(None, description="URL path to country flag SVG image")
    
    # Nested layers (all optional as they may not be populated)
    governance: Optional[GovernanceLayerNested] = None
    pillar_1_hazard: Optional[Pillar1HazardNested] = None
    pillar_2_vigilance: Optional[Pillar2VigilanceNested] = None
    pillar_3_restoration: Optional[Pillar3RestorationNested] = None
    
    # Data coverage score (passed from model)
    data_coverage_score: Optional[float] = Field(None, ge=0, le=100, description="Data coverage percentage (0-100)")
    
    @computed_field
    @property
    def maturity_label(self) -> Optional[str]:
        """
        Computed maturity label based on score (canonical definitions).
        - 1.0-1.9: Stage 1 Critical (Red)
        - 2.0-2.4: Stage 2 Developing (Orange)
        - 2.5-3.4: Stage 3 Advancing (Yellow)
        - 3.5-4.0: Stage 4 Leading (Green)
        """
        return get_maturity_label_from_score(self.maturity_score)


class CountryListResponse(BaseModel):
    """Schema for listing multiple countries (summary view)."""
    model_config = ConfigDict(from_attributes=True)
    
    iso_code: str
    name: str
    maturity_score: Optional[float] = None
    flag_url: Optional[str] = Field(None, description="URL path to country flag SVG image")
    created_at: datetime
    
    @computed_field
    @property
    def maturity_label(self) -> Optional[str]:
        """Computed maturity label based on score."""
        return get_maturity_label_from_score(self.maturity_score)


class CountryListPaginated(BaseModel):
    """Paginated response for country list."""
    total: int
    page: int
    per_page: int
    countries: List[CountryListResponse]
