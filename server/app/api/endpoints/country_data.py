"""
GOHIP Platform - Country Data Registry API Endpoints
=====================================================

Provides pivot table data for the Country Data Registry page.
Allows multi-country selection (up to 10) with category filtering
for dynamic data table generation.
"""

from typing import List, Optional, Dict, Any
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.country import (
    Country, 
    GovernanceLayer, 
    Pillar1Hazard, 
    Pillar2Vigilance, 
    Pillar3Restoration,
    CountryIntelligence
)


# =============================================================================
# ROUTER
# =============================================================================

router = APIRouter(prefix="/country-data", tags=["Country Data Registry"])


# =============================================================================
# ENUMS & SCHEMAS
# =============================================================================

class DataCategory(str, Enum):
    """Available data categories for the pivot table."""
    GOVERNANCE = "governance"
    PILLAR_1_HAZARD = "pillar_1_hazard"
    PILLAR_2_VIGILANCE = "pillar_2_vigilance"
    PILLAR_3_RESTORATION = "pillar_3_restoration"
    INTELLIGENCE_GOVERNANCE = "intelligence_governance"
    INTELLIGENCE_HAZARD = "intelligence_hazard"
    INTELLIGENCE_VIGILANCE = "intelligence_vigilance"
    INTELLIGENCE_RESTORATION = "intelligence_restoration"
    INTELLIGENCE_ECONOMIC = "intelligence_economic"


class MetricDefinition(BaseModel):
    """Definition of a metric for display."""
    id: str
    name: str
    unit: Optional[str] = None
    description: Optional[str] = None
    lower_is_better: bool = False


class CountryMetricValue(BaseModel):
    """A country's value for a specific metric."""
    iso_code: str
    country_name: str
    flag_url: Optional[str] = None
    value: Optional[Any] = None
    formatted_value: str = "N/A"


class PivotRow(BaseModel):
    """A row in the pivot table representing a metric."""
    metric: MetricDefinition
    values: List[CountryMetricValue]


class PivotTableResponse(BaseModel):
    """Complete pivot table response."""
    categories: List[str] = Field(..., description="Selected categories")
    countries: List[Dict[str, Any]] = Field(..., description="Selected countries metadata")
    rows: List[PivotRow] = Field(..., description="Pivot table rows")
    total_metrics: int = Field(..., description="Total number of metrics")
    generated_at: str = Field(..., description="Timestamp of generation")


class CountrySummary(BaseModel):
    """Summary info for a country."""
    iso_code: str
    name: str
    flag_url: Optional[str] = None
    maturity_score: Optional[float] = None


class AvailableCountriesResponse(BaseModel):
    """Response with all available countries for selection."""
    total: int
    countries: List[CountrySummary]


class CategoryInfo(BaseModel):
    """Information about a data category."""
    id: str
    name: str
    description: str
    metric_count: int


class AvailableCategoriesResponse(BaseModel):
    """Response with all available categories."""
    categories: List[CategoryInfo]


# =============================================================================
# METRIC DEFINITIONS
# =============================================================================

GOVERNANCE_METRICS = [
    MetricDefinition(id="ilo_c187_status", name="ILO C187 Ratified", description="ILO Promotional Framework Convention"),
    MetricDefinition(id="ilo_c155_status", name="ILO C155 Ratified", description="ILO Occupational Safety & Health Convention"),
    MetricDefinition(id="inspector_density", name="Inspector Density", unit="per 10k workers", description="Labor inspectors per 10,000 workers"),
    MetricDefinition(id="mental_health_policy", name="Mental Health Policy", description="National workplace mental health policy exists"),
    MetricDefinition(id="strategic_capacity_score", name="Strategic Capacity Score", unit="%", description="Aggregate governance capacity"),
]

PILLAR_1_METRICS = [
    MetricDefinition(id="fatal_accident_rate", name="Fatal Accident Rate", unit="per 100k", lower_is_better=True, description="Fatal accidents per 100,000 workers"),
    MetricDefinition(id="carcinogen_exposure_pct", name="Carcinogen Exposure", unit="%", lower_is_better=True, description="Workforce exposed to carcinogens"),
    MetricDefinition(id="heat_stress_reg_type", name="Heat Stress Regulation", description="Type of heat stress regulation"),
    MetricDefinition(id="oel_compliance_pct", name="OEL Compliance", unit="%", description="Occupational Exposure Limit compliance"),
    MetricDefinition(id="noise_induced_hearing_loss_rate", name="NIHL Rate", unit="per 100k", lower_is_better=True, description="Noise-induced hearing loss rate"),
    MetricDefinition(id="safety_training_hours_avg", name="Safety Training Hours", unit="hrs/yr", description="Average annual safety training hours"),
    MetricDefinition(id="control_maturity_score", name="Control Maturity Score", unit="%", description="Hazard control maturity score"),
]

PILLAR_2_METRICS = [
    MetricDefinition(id="surveillance_logic", name="Surveillance Logic", description="Surveillance system type"),
    MetricDefinition(id="disease_detection_rate", name="Disease Detection Rate", unit="%", description="Occupational disease detection rate"),
    MetricDefinition(id="vulnerability_index", name="Vulnerability Index", unit="/100", lower_is_better=True, description="Worker vulnerability index"),
    MetricDefinition(id="migrant_worker_pct", name="Migrant Workforce", unit="%", description="Migrant workforce percentage"),
    MetricDefinition(id="lead_exposure_screening_rate", name="Lead Screening Rate", unit="%", description="Lead exposure screening rate"),
    MetricDefinition(id="occupational_disease_reporting_rate", name="Disease Reporting Rate", unit="%", description="Disease reporting compliance rate"),
]

PILLAR_3_METRICS = [
    MetricDefinition(id="payer_mechanism", name="Payer Mechanism", description="Compensation payer mechanism type"),
    MetricDefinition(id="reintegration_law", name="Reintegration Law", description="Mandatory return-to-work legislation"),
    MetricDefinition(id="sickness_absence_days", name="Sickness Absence Days", unit="days/yr", lower_is_better=True, description="Average sickness absence days per year"),
    MetricDefinition(id="rehab_access_score", name="Rehab Access Score", unit="/100", description="Rehabilitation access score"),
    MetricDefinition(id="return_to_work_success_pct", name="RTW Success Rate", unit="%", description="Return-to-work program success rate"),
    MetricDefinition(id="avg_claim_settlement_days", name="Claim Settlement Days", unit="days", lower_is_better=True, description="Average days to settle claim"),
    MetricDefinition(id="rehab_participation_rate", name="Rehab Participation Rate", unit="%", description="Rehabilitation program participation rate"),
]

INTELLIGENCE_GOVERNANCE_METRICS = [
    MetricDefinition(id="corruption_perception_index", name="Corruption Perception Index", unit="/100", description="TI CPI Score (higher=less corrupt)"),
    MetricDefinition(id="rule_of_law_index", name="Rule of Law Index", unit="/1", description="WJP Rule of Law Index"),
    MetricDefinition(id="government_effectiveness", name="Government Effectiveness", description="WB Government Effectiveness score"),
    MetricDefinition(id="regulatory_quality", name="Regulatory Quality", description="WB Regulatory Quality score"),
    MetricDefinition(id="political_stability", name="Political Stability", description="WB Political Stability score"),
]

INTELLIGENCE_HAZARD_METRICS = [
    MetricDefinition(id="daly_occupational_total", name="Total Occupational DALYs", unit="per 100k", lower_is_better=True, description="Total occupational DALYs per 100,000"),
    MetricDefinition(id="daly_occupational_injuries", name="DALYs from Injuries", unit="per 100k", lower_is_better=True, description="DALYs from occupational injuries"),
    MetricDefinition(id="deaths_occupational_total", name="Occupational Deaths", unit="per 100k", lower_is_better=True, description="Deaths from occupational causes"),
    MetricDefinition(id="epi_score", name="Environmental Performance Index", unit="/100", description="Yale EPI Overall Score"),
    MetricDefinition(id="epi_air_quality", name="EPI Air Quality", unit="/100", description="EPI Air Quality Score"),
]

INTELLIGENCE_VIGILANCE_METRICS = [
    MetricDefinition(id="uhc_service_coverage_index", name="UHC Coverage Index", unit="/100", description="WHO Universal Health Coverage index"),
    MetricDefinition(id="health_expenditure_gdp_pct", name="Health Expenditure (% GDP)", unit="%", description="Health expenditure as % of GDP"),
    MetricDefinition(id="health_expenditure_per_capita", name="Health Expenditure per Capita", unit="USD", description="Health expenditure per capita"),
    MetricDefinition(id="life_expectancy_at_birth", name="Life Expectancy", unit="years", description="Life expectancy at birth"),
]

INTELLIGENCE_RESTORATION_METRICS = [
    MetricDefinition(id="hdi_score", name="Human Development Index", unit="/1", description="UNDP HDI Score"),
    MetricDefinition(id="education_index", name="Education Index", unit="/1", description="UNDP Education Index"),
    MetricDefinition(id="labor_force_participation", name="Labor Force Participation", unit="%", description="Labor force participation rate"),
    MetricDefinition(id="unemployment_rate", name="Unemployment Rate", unit="%", lower_is_better=True, description="Unemployment rate"),
]

INTELLIGENCE_ECONOMIC_METRICS = [
    MetricDefinition(id="gdp_per_capita_ppp", name="GDP per Capita (PPP)", unit="USD", description="GDP per capita in PPP USD"),
    MetricDefinition(id="gdp_growth_rate", name="GDP Growth Rate", unit="%", description="Annual GDP growth rate"),
    MetricDefinition(id="population_total", name="Total Population", description="Total population"),
    MetricDefinition(id="urban_population_pct", name="Urban Population", unit="%", description="Urban population percentage"),
]

CATEGORY_METRICS = {
    DataCategory.GOVERNANCE: GOVERNANCE_METRICS,
    DataCategory.PILLAR_1_HAZARD: PILLAR_1_METRICS,
    DataCategory.PILLAR_2_VIGILANCE: PILLAR_2_METRICS,
    DataCategory.PILLAR_3_RESTORATION: PILLAR_3_METRICS,
    DataCategory.INTELLIGENCE_GOVERNANCE: INTELLIGENCE_GOVERNANCE_METRICS,
    DataCategory.INTELLIGENCE_HAZARD: INTELLIGENCE_HAZARD_METRICS,
    DataCategory.INTELLIGENCE_VIGILANCE: INTELLIGENCE_VIGILANCE_METRICS,
    DataCategory.INTELLIGENCE_RESTORATION: INTELLIGENCE_RESTORATION_METRICS,
    DataCategory.INTELLIGENCE_ECONOMIC: INTELLIGENCE_ECONOMIC_METRICS,
}

CATEGORY_NAMES = {
    DataCategory.GOVERNANCE: "Governance Layer",
    DataCategory.PILLAR_1_HAZARD: "Pillar 1: Hazard Control",
    DataCategory.PILLAR_2_VIGILANCE: "Pillar 2: Health Vigilance",
    DataCategory.PILLAR_3_RESTORATION: "Pillar 3: Restoration",
    DataCategory.INTELLIGENCE_GOVERNANCE: "Intelligence: Governance",
    DataCategory.INTELLIGENCE_HAZARD: "Intelligence: Hazard Burden",
    DataCategory.INTELLIGENCE_VIGILANCE: "Intelligence: Health System",
    DataCategory.INTELLIGENCE_RESTORATION: "Intelligence: Social Support",
    DataCategory.INTELLIGENCE_ECONOMIC: "Intelligence: Economic Context",
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def format_value(value: Any, unit: Optional[str] = None) -> str:
    """Format a value for display."""
    if value is None:
        return "N/A"
    
    if isinstance(value, bool):
        return "Yes" if value else "No"
    
    if isinstance(value, float):
        # Format floats nicely
        if value >= 1000000:
            return f"{value/1000000:.1f}M"
        elif value >= 1000:
            return f"{value/1000:.1f}K"
        elif value < 0.01:
            return f"{value:.4f}"
        else:
            return f"{value:.2f}"
    
    if isinstance(value, int):
        if value >= 1000000:
            return f"{value/1000000:.1f}M"
        elif value >= 1000:
            return f"{value/1000:.1f}K"
        return str(value)
    
    # For enums and other types
    if hasattr(value, 'value'):
        return str(value.value)
    
    return str(value)


def get_pillar_data(country: Country, category: DataCategory) -> Optional[Any]:
    """Get the appropriate pillar/layer data for a category."""
    if category == DataCategory.GOVERNANCE:
        return country.governance
    elif category == DataCategory.PILLAR_1_HAZARD:
        return country.pillar_1_hazard
    elif category == DataCategory.PILLAR_2_VIGILANCE:
        return country.pillar_2_vigilance
    elif category == DataCategory.PILLAR_3_RESTORATION:
        return country.pillar_3_restoration
    return None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get(
    "/countries",
    response_model=AvailableCountriesResponse,
    summary="Get Available Countries",
    description="Get all countries available for selection in the pivot table."
)
async def get_available_countries(
    db: Session = Depends(get_db)
) -> AvailableCountriesResponse:
    """Fetch all countries available for pivot table selection."""
    countries = (
        db.query(Country)
        .order_by(Country.name)
        .all()
    )
    
    summaries = [
        CountrySummary(
            iso_code=c.iso_code,
            name=c.name,
            flag_url=c.flag_url,
            maturity_score=c.maturity_score
        )
        for c in countries
    ]
    
    return AvailableCountriesResponse(
        total=len(summaries),
        countries=summaries
    )


@router.get(
    "/categories",
    response_model=AvailableCategoriesResponse,
    summary="Get Available Categories",
    description="Get all data categories available for the pivot table."
)
async def get_available_categories() -> AvailableCategoriesResponse:
    """Return all available data categories with descriptions."""
    categories = [
        CategoryInfo(
            id=cat.value,
            name=CATEGORY_NAMES[cat],
            description=f"Metrics from {CATEGORY_NAMES[cat]}",
            metric_count=len(CATEGORY_METRICS[cat])
        )
        for cat in DataCategory
    ]
    
    return AvailableCategoriesResponse(categories=categories)


@router.get(
    "/pivot",
    response_model=PivotTableResponse,
    summary="Generate Pivot Table",
    description="""
    Generate a pivot table for selected countries and categories.
    
    **Constraints:**
    - At least 1 country and 1 category required
    - No upper limit on countries (all countries supported)
    
    **Response:**
    - Rows: Metrics from selected categories
    - Columns: Selected countries
    - Values: Metric values with formatting
    """
)
async def generate_pivot_table(
    countries: List[str] = Query(..., description="List of ISO codes"),
    categories: List[str] = Query(..., description="List of category IDs"),
    db: Session = Depends(get_db)
) -> PivotTableResponse:
    """Generate a pivot table for the specified countries and categories."""
    from datetime import datetime
    
    if len(countries) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 1 country required"
        )
    
    if len(categories) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 1 category required"
        )
    
    # Normalize country codes
    countries = [c.upper() for c in countries]
    
    # Validate categories
    valid_categories = []
    for cat_id in categories:
        try:
            valid_categories.append(DataCategory(cat_id))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid category: {cat_id}"
            )
    
    # Fetch countries with all related data
    country_data = (
        db.query(Country)
        .options(
            joinedload(Country.governance),
            joinedload(Country.pillar_1_hazard),
            joinedload(Country.pillar_2_vigilance),
            joinedload(Country.pillar_3_restoration),
        )
        .filter(Country.iso_code.in_(countries))
        .all()
    )
    
    # Create a map for quick lookup, maintaining requested order
    country_map = {c.iso_code: c for c in country_data}
    
    # Fetch intelligence data separately if needed
    intelligence_categories = [
        DataCategory.INTELLIGENCE_GOVERNANCE,
        DataCategory.INTELLIGENCE_HAZARD,
        DataCategory.INTELLIGENCE_VIGILANCE,
        DataCategory.INTELLIGENCE_RESTORATION,
        DataCategory.INTELLIGENCE_ECONOMIC,
    ]
    
    intelligence_map = {}
    if any(cat in valid_categories for cat in intelligence_categories):
        intelligence_data = (
            db.query(CountryIntelligence)
            .filter(CountryIntelligence.country_iso_code.in_(countries))
            .all()
        )
        intelligence_map = {i.country_iso_code: i for i in intelligence_data}
    
    # Build country metadata list (maintaining order)
    countries_meta = []
    for iso in countries:
        if iso in country_map:
            c = country_map[iso]
            countries_meta.append({
                "iso_code": c.iso_code,
                "name": c.name,
                "flag_url": c.flag_url,
                "maturity_score": c.maturity_score,
            })
    
    # Build pivot rows
    rows = []
    for category in valid_categories:
        metrics = CATEGORY_METRICS[category]
        
        for metric in metrics:
            values = []
            
            for iso in countries:
                country = country_map.get(iso)
                if not country:
                    values.append(CountryMetricValue(
                        iso_code=iso,
                        country_name="Unknown",
                        value=None,
                        formatted_value="N/A"
                    ))
                    continue
                
                # Get the value based on category type
                raw_value = None
                
                if category in intelligence_categories:
                    # Get from intelligence data
                    intel = intelligence_map.get(iso)
                    if intel:
                        raw_value = getattr(intel, metric.id, None)
                else:
                    # Get from pillar data
                    pillar = get_pillar_data(country, category)
                    if pillar:
                        raw_value = getattr(pillar, metric.id, None)
                
                formatted = format_value(raw_value, metric.unit)
                
                values.append(CountryMetricValue(
                    iso_code=iso,
                    country_name=country.name,
                    flag_url=country.flag_url,
                    value=raw_value if not hasattr(raw_value, 'value') else raw_value.value,
                    formatted_value=formatted
                ))
            
            rows.append(PivotRow(
                metric=metric,
                values=values
            ))
    
    return PivotTableResponse(
        categories=[cat.value for cat in valid_categories],
        countries=countries_meta,
        rows=rows,
        total_metrics=len(rows),
        generated_at=datetime.utcnow().isoformat()
    )
