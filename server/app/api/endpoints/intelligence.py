"""
GOHIP Platform - Intelligence API Endpoints
============================================

Phase 26: Multi-Source Intelligence Integration

Provides API access to deep country intelligence data for:
- AI-powered analysis and summaries
- Comparative country analytics
- Risk assessment dashboards
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.country import CountryIntelligence, Country


router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class IntelligenceScores(BaseModel):
    """Intelligence composite scores."""
    governance_intelligence_score: Optional[float]
    hazard_intelligence_score: Optional[float]
    vigilance_intelligence_score: Optional[float]
    restoration_intelligence_score: Optional[float]
    overall_intelligence_score: Optional[float]


class GovernanceIntelligence(BaseModel):
    """Governance-related intelligence data."""
    corruption_perception_index: Optional[float]
    corruption_rank: Optional[float]
    rule_of_law_index: Optional[float]
    regulatory_enforcement_score: Optional[float]
    civil_justice_score: Optional[float]
    government_effectiveness: Optional[float]
    regulatory_quality: Optional[float]
    political_stability: Optional[float]


class HazardIntelligence(BaseModel):
    """Hazard burden intelligence data."""
    daly_occupational_total: Optional[float]
    daly_occupational_injuries: Optional[float]
    daly_occupational_carcinogens: Optional[float]
    daly_occupational_noise: Optional[float]
    deaths_occupational_total: Optional[float]
    epi_score: Optional[float]
    epi_air_quality: Optional[float]


class VigilanceIntelligence(BaseModel):
    """Health vigilance intelligence data."""
    uhc_service_coverage_index: Optional[float]
    health_expenditure_gdp_pct: Optional[float]
    health_expenditure_per_capita: Optional[float]
    life_expectancy_at_birth: Optional[float]


class RestorationIntelligence(BaseModel):
    """Restoration capacity intelligence data."""
    hdi_score: Optional[float]
    hdi_rank: Optional[float]
    education_index: Optional[float]
    oecd_work_life_balance: Optional[float]
    oecd_hours_worked_annual: Optional[float]
    labor_force_participation: Optional[float]
    unemployment_rate: Optional[float]


class EconomicContext(BaseModel):
    """Economic context data."""
    gdp_per_capita_ppp: Optional[float]
    gdp_growth_rate: Optional[float]
    industry_pct_gdp: Optional[float]
    population_total: Optional[float]
    urban_population_pct: Optional[float]


class CountryIntelligenceResponse(BaseModel):
    """Full country intelligence response."""
    iso_code: str
    country_name: str
    scores: IntelligenceScores
    governance: GovernanceIntelligence
    hazard: HazardIntelligence
    vigilance: VigilanceIntelligence
    restoration: RestorationIntelligence
    economic: EconomicContext
    ai_deep_summary: Optional[str]
    ai_risk_assessment: Optional[str]

    class Config:
        from_attributes = True


class IntelligenceSummary(BaseModel):
    """Summary of intelligence data for a country."""
    iso_code: str
    country_name: str
    overall_intelligence_score: Optional[float]
    governance_intelligence_score: Optional[float]
    hazard_intelligence_score: Optional[float]
    vigilance_intelligence_score: Optional[float]
    restoration_intelligence_score: Optional[float]
    corruption_perception_index: Optional[float]
    hdi_score: Optional[float]
    daly_occupational_total: Optional[float]


class IntelligenceListResponse(BaseModel):
    """List of country intelligence summaries."""
    total: int
    countries: List[IntelligenceSummary]


class CountryRank(BaseModel):
    """Individual country ranking entry."""
    iso_code: str
    name: str
    value: float
    rank: int
    is_current: bool = False


class CurrentCountryRank(BaseModel):
    """Current country ranking details."""
    iso_code: str
    name: str
    value: float
    rank: int
    percentile: float


class GlobalRankingsResponse(BaseModel):
    """Response for global rankings endpoint."""
    metric: str
    metric_label: str
    unit: str
    total_countries: int
    data_source: str
    higher_is_better: bool
    current_country: Optional[CurrentCountryRank]
    top_10: List[CountryRank]
    bottom_10: List[CountryRank]


# Metric configuration mapping
METRIC_CONFIG = {
    "gdp_per_capita": {
        "column": "gdp_per_capita_ppp",
        "label": "GDP Per Capita (PPP)",
        "unit": "USD",
        "source": "World Bank",
        "higher_is_better": True,
    },
    "population": {
        "column": "population_total",
        "label": "Population",
        "unit": "",
        "source": "World Bank",
        "higher_is_better": True,
    },
    "labor_force": {
        "column": "labor_force_participation",
        "label": "Labor Force Participation Rate",
        "unit": "%",
        "source": "World Bank",
        "higher_is_better": True,
    },
    "life_expectancy": {
        "column": "life_expectancy_at_birth",
        "label": "Life Expectancy at Birth",
        "unit": "years",
        "source": "World Bank / WHO",
        "higher_is_better": True,
    },
    "urban_population": {
        "column": "urban_population_pct",
        "label": "Urban Population",
        "unit": "%",
        "source": "World Bank",
        "higher_is_better": True,
    },
    "hdi_score": {
        "column": "hdi_score",
        "label": "Human Development Index",
        "unit": "",
        "source": "UNDP",
        "higher_is_better": True,
    },
}


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get(
    "/",
    response_model=IntelligenceListResponse,
    summary="List All Country Intelligence",
    description="Get intelligence summaries for all countries in the database."
)
async def list_intelligence(db: Session = Depends(get_db)):
    """List all countries with intelligence data."""
    
    # Query all intelligence records with country names
    results = db.query(CountryIntelligence, Country.name).join(
        Country, CountryIntelligence.country_iso_code == Country.iso_code
    ).all()
    
    summaries = []
    for intel, country_name in results:
        summaries.append(IntelligenceSummary(
            iso_code=intel.country_iso_code,
            country_name=country_name,
            overall_intelligence_score=intel.overall_intelligence_score,
            governance_intelligence_score=intel.governance_intelligence_score,
            hazard_intelligence_score=intel.hazard_intelligence_score,
            vigilance_intelligence_score=intel.vigilance_intelligence_score,
            restoration_intelligence_score=intel.restoration_intelligence_score,
            corruption_perception_index=intel.corruption_perception_index,
            hdi_score=intel.hdi_score,
            daly_occupational_total=intel.daly_occupational_total,
        ))
    
    # Sort by overall score descending
    summaries.sort(key=lambda x: x.overall_intelligence_score or 0, reverse=True)
    
    return IntelligenceListResponse(
        total=len(summaries),
        countries=summaries
    )


@router.get(
    "/{iso_code}",
    response_model=CountryIntelligenceResponse,
    summary="Get Country Intelligence",
    description="Get comprehensive intelligence data for a specific country."
)
async def get_country_intelligence(iso_code: str, db: Session = Depends(get_db)):
    """Get full intelligence data for a country."""
    
    iso_code = iso_code.upper()
    
    # Get intelligence record
    intel = db.query(CountryIntelligence).filter(
        CountryIntelligence.country_iso_code == iso_code
    ).first()
    
    if not intel:
        raise HTTPException(
            status_code=404,
            detail=f"No intelligence data found for country {iso_code}"
        )
    
    # Get country name
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    country_name = country.name if country else iso_code
    
    return CountryIntelligenceResponse(
        iso_code=iso_code,
        country_name=country_name,
        scores=IntelligenceScores(
            governance_intelligence_score=intel.governance_intelligence_score,
            hazard_intelligence_score=intel.hazard_intelligence_score,
            vigilance_intelligence_score=intel.vigilance_intelligence_score,
            restoration_intelligence_score=intel.restoration_intelligence_score,
            overall_intelligence_score=intel.overall_intelligence_score,
        ),
        governance=GovernanceIntelligence(
            corruption_perception_index=intel.corruption_perception_index,
            corruption_rank=intel.corruption_rank,
            rule_of_law_index=intel.rule_of_law_index,
            regulatory_enforcement_score=intel.regulatory_enforcement_score,
            civil_justice_score=intel.civil_justice_score,
            government_effectiveness=intel.government_effectiveness,
            regulatory_quality=intel.regulatory_quality,
            political_stability=intel.political_stability,
        ),
        hazard=HazardIntelligence(
            daly_occupational_total=intel.daly_occupational_total,
            daly_occupational_injuries=intel.daly_occupational_injuries,
            daly_occupational_carcinogens=intel.daly_occupational_carcinogens,
            daly_occupational_noise=intel.daly_occupational_noise,
            deaths_occupational_total=intel.deaths_occupational_total,
            epi_score=intel.epi_score,
            epi_air_quality=intel.epi_air_quality,
        ),
        vigilance=VigilanceIntelligence(
            uhc_service_coverage_index=intel.uhc_service_coverage_index,
            health_expenditure_gdp_pct=intel.health_expenditure_gdp_pct,
            health_expenditure_per_capita=intel.health_expenditure_per_capita,
            life_expectancy_at_birth=intel.life_expectancy_at_birth,
        ),
        restoration=RestorationIntelligence(
            hdi_score=intel.hdi_score,
            hdi_rank=intel.hdi_rank,
            education_index=intel.education_index,
            oecd_work_life_balance=intel.oecd_work_life_balance,
            oecd_hours_worked_annual=intel.oecd_hours_worked_annual,
            labor_force_participation=intel.labor_force_participation,
            unemployment_rate=intel.unemployment_rate,
        ),
        economic=EconomicContext(
            gdp_per_capita_ppp=intel.gdp_per_capita_ppp,
            gdp_growth_rate=intel.gdp_growth_rate,
            industry_pct_gdp=intel.industry_pct_gdp,
            population_total=intel.population_total,
            urban_population_pct=intel.urban_population_pct,
        ),
        ai_deep_summary=intel.ai_deep_summary,
        ai_risk_assessment=intel.ai_risk_assessment,
    )


@router.get(
    "/{iso_code}/ai-context",
    summary="Get AI Context for Country",
    description="Get a comprehensive text summary of all intelligence data for AI consumption."
)
async def get_ai_context(iso_code: str, db: Session = Depends(get_db)):
    """
    Generate a comprehensive text summary of all intelligence data
    that can be used as context for AI analysis.
    """
    iso_code = iso_code.upper()
    
    intel = db.query(CountryIntelligence).filter(
        CountryIntelligence.country_iso_code == iso_code
    ).first()
    
    if not intel:
        raise HTTPException(
            status_code=404,
            detail=f"No intelligence data found for country {iso_code}"
        )
    
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    country_name = country.name if country else iso_code
    
    # Build comprehensive AI context
    context_parts = [
        f"# Country Intelligence Report: {country_name} ({iso_code})",
        "",
        "## Executive Summary Scores",
        f"- Overall Intelligence Score: {intel.overall_intelligence_score or 'N/A'}",
        f"- Governance Score: {intel.governance_intelligence_score or 'N/A'}",
        f"- Hazard Score: {intel.hazard_intelligence_score or 'N/A'}",
        f"- Vigilance Score: {intel.vigilance_intelligence_score or 'N/A'}",
        f"- Restoration Score: {intel.restoration_intelligence_score or 'N/A'}",
        "",
        "## Governance Intelligence",
        f"- Corruption Perception Index: {intel.corruption_perception_index or 'N/A'} (Rank: {intel.corruption_rank or 'N/A'})",
        f"- Rule of Law Index (WJP): {intel.rule_of_law_index or 'N/A'}",
        f"- Regulatory Enforcement: {intel.regulatory_enforcement_score or 'N/A'}",
        f"- Government Effectiveness (WB): {intel.government_effectiveness or 'N/A'}",
        f"- Political Stability (WB): {intel.political_stability or 'N/A'}",
        "",
        "## Occupational Health Burden (IHME GBD)",
        f"- Total Occupational DALYs: {intel.daly_occupational_total or 'N/A'} per 100,000",
        f"- Injury DALYs: {intel.daly_occupational_injuries or 'N/A'}",
        f"- Carcinogen DALYs: {intel.daly_occupational_carcinogens or 'N/A'}",
        f"- Noise DALYs: {intel.daly_occupational_noise or 'N/A'}",
        f"- Occupational Deaths: {intel.deaths_occupational_total or 'N/A'} per 100,000",
        "",
        "## Environmental Performance (Yale EPI)",
        f"- EPI Score: {intel.epi_score or 'N/A'} (Rank: {intel.epi_rank or 'N/A'})",
        f"- Air Quality Score: {intel.epi_air_quality or 'N/A'}",
        "",
        "## Health System Capacity",
        f"- UHC Coverage Index: {intel.uhc_service_coverage_index or 'N/A'}",
        f"- Health Expenditure (% GDP): {intel.health_expenditure_gdp_pct or 'N/A'}%",
        f"- Health Expenditure per Capita: ${intel.health_expenditure_per_capita or 'N/A'}",
        f"- Life Expectancy: {intel.life_expectancy_at_birth or 'N/A'} years",
        "",
        "## Human Development (UNDP)",
        f"- HDI Score: {intel.hdi_score or 'N/A'} (Rank: {intel.hdi_rank or 'N/A'})",
        f"- Education Index: {intel.education_index or 'N/A'}",
        "",
        "## Labor Market",
        f"- Labor Force Participation: {intel.labor_force_participation or 'N/A'}%",
        f"- Unemployment Rate: {intel.unemployment_rate or 'N/A'}%",
        f"- Youth Unemployment: {intel.youth_unemployment_rate or 'N/A'}%",
        f"- Informal Employment: {intel.informal_employment_pct or 'N/A'}%",
        "",
        "## Economic Context",
        f"- GDP per Capita (PPP): ${intel.gdp_per_capita_ppp or 'N/A'}",
        f"- GDP Growth Rate: {intel.gdp_growth_rate or 'N/A'}%",
        f"- Industry (% GDP): {intel.industry_pct_gdp or 'N/A'}%",
        f"- Population: {intel.population_total or 'N/A'}",
        "",
    ]
    
    # Add OECD data if available
    if intel.oecd_work_life_balance is not None:
        context_parts.extend([
            "## Work-Life Balance (OECD)",
            f"- Work-Life Balance Score: {intel.oecd_work_life_balance}",
            f"- Annual Hours Worked: {intel.oecd_hours_worked_annual or 'N/A'}",
            f"- Long Hours (%): {intel.oecd_long_hours_pct or 'N/A'}%",
            "",
        ])
    
    return {
        "iso_code": iso_code,
        "country_name": country_name,
        "ai_context": "\n".join(context_parts),
        "data_sources": [
            "World Bank Worldwide Governance Indicators",
            "World Bank Development Indicators",
            "Transparency International CPI",
            "UNDP Human Development Report",
            "Yale Environmental Performance Index",
            "IHME Global Burden of Disease",
            "World Justice Project Rule of Law Index",
            "OECD Better Life Index (OECD countries)",
        ]
    }


@router.get(
    "/rankings/{metric}",
    response_model=GlobalRankingsResponse,
    summary="Get Global Rankings for a Metric",
    description="Get global rankings for a specific metric (GDP, population, etc.) from the database."
)
async def get_global_rankings(
    metric: str,
    current_iso: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get global rankings for a specific metric.
    
    Supported metrics:
    - gdp_per_capita: GDP per capita (PPP, current USD)
    - population: Total population
    - labor_force: Labor force participation rate (%)
    - life_expectancy: Life expectancy at birth (years)
    - urban_population: Urban population (%)
    - hdi_score: Human Development Index (0-1)
    """
    metric = metric.lower()
    
    if metric not in METRIC_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metric '{metric}'. Valid options: {', '.join(METRIC_CONFIG.keys())}"
        )
    
    config = METRIC_CONFIG[metric]
    column_name = config["column"]
    higher_is_better = config["higher_is_better"]
    
    # Get the column attribute from the model
    column_attr = getattr(CountryIntelligence, column_name, None)
    if column_attr is None:
        raise HTTPException(
            status_code=500,
            detail=f"Column {column_name} not found in CountryIntelligence model"
        )
    
    # Query all countries with this metric, join with Country for names
    results = db.query(
        CountryIntelligence.country_iso_code,
        Country.name,
        column_attr
    ).join(
        Country, CountryIntelligence.country_iso_code == Country.iso_code
    ).filter(
        column_attr.isnot(None)
    ).all()
    
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for metric '{metric}'"
        )
    
    # Sort by value (descending for higher_is_better, ascending otherwise)
    sorted_results = sorted(
        results,
        key=lambda x: x[2] if x[2] is not None else float('-inf'),
        reverse=higher_is_better
    )
    
    # Assign ranks
    ranked_countries = []
    for rank, (iso_code, name, value) in enumerate(sorted_results, start=1):
        ranked_countries.append({
            "iso_code": iso_code,
            "name": name,
            "value": value,
            "rank": rank
        })
    
    total_countries = len(ranked_countries)
    
    # Get top 10 and bottom 10
    top_10 = []
    bottom_10 = []
    
    for entry in ranked_countries[:10]:
        is_current = current_iso and entry["iso_code"].upper() == current_iso.upper()
        top_10.append(CountryRank(
            iso_code=entry["iso_code"],
            name=entry["name"],
            value=entry["value"],
            rank=entry["rank"],
            is_current=is_current
        ))
    
    for entry in ranked_countries[-10:]:
        is_current = current_iso and entry["iso_code"].upper() == current_iso.upper()
        bottom_10.append(CountryRank(
            iso_code=entry["iso_code"],
            name=entry["name"],
            value=entry["value"],
            rank=entry["rank"],
            is_current=is_current
        ))
    
    # Find current country ranking
    current_country_rank = None
    if current_iso:
        current_iso_upper = current_iso.upper()
        for entry in ranked_countries:
            if entry["iso_code"].upper() == current_iso_upper:
                percentile = round(((total_countries - entry["rank"] + 1) / total_countries) * 100, 1)
                current_country_rank = CurrentCountryRank(
                    iso_code=entry["iso_code"],
                    name=entry["name"],
                    value=entry["value"],
                    rank=entry["rank"],
                    percentile=percentile
                )
                break
    
    return GlobalRankingsResponse(
        metric=metric,
        metric_label=config["label"],
        unit=config["unit"],
        total_countries=total_countries,
        data_source=config["source"],
        higher_is_better=higher_is_better,
        current_country=current_country_rank,
        top_10=top_10,
        bottom_10=bottom_10
    )
