"""
GOHIP Platform - Countries API Endpoints
=========================================

Phase 15.1: Optimized GeoJSON Metadata Endpoint
Provides lightweight country data for global map visualization.

Key Features:
- 95%+ payload reduction vs full country objects
- Supports 195+ countries without lag
- Includes status derivation for gap analysis
"""

from typing import List, Optional
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.country import Country, Pillar1Hazard, Pillar2Vigilance, Pillar3Restoration, GovernanceLayer, CountryIntelligence
from app.schemas.country import (
    CountryResponse,
    CountryListResponse,
    CountryListPaginated,
)


# =============================================================================
# ROUTER
# =============================================================================

router = APIRouter(prefix="/countries", tags=["Countries"])


# =============================================================================
# SCHEMAS FOR LIGHTWEIGHT ENDPOINTS
# =============================================================================

class CountryStatus(str, Enum):
    """Visual status classification for map rendering."""
    RESILIENT = "resilient"       # Low fatal rate (< 1.0) - Green
    GOOD = "good"                 # Moderate rate (1.0-2.0) - Yellow-Green
    CONCERNING = "concerning"     # Elevated rate (2.0-3.0) - Orange  
    CRITICAL = "critical"         # High rate (> 3.0) - Red
    DATA_GAP = "data_gap"         # In DB but no fatal_rate - Amber (Investigation Needed)
    GHOST = "ghost"               # Not in DB - Dark Slate


class GeoJSONCountryMetadata(BaseModel):
    """
    Lightweight country metadata for GeoJSON feature enrichment.
    Framework-Aligned: Governance + 3 Pillars + Maturity
    
    ~95% smaller than full CountryResponse objects.
    """
    iso_code: str = Field(..., description="ISO 3166-1 alpha-3 code")
    name: str = Field(..., description="Country name")
    # === Framework-Aligned Scores ===
    maturity_score: Optional[float] = Field(None, description="Overall Maturity (1.0-4.0 scale)")
    governance_score: Optional[float] = Field(None, description="Governance Index (0-100)")
    pillar1_score: Optional[float] = Field(None, description="Hazard Control Index (0-100)")
    pillar2_score: Optional[float] = Field(None, description="Health Vigilance Index (0-100)")
    pillar3_score: Optional[float] = Field(None, description="Restoration Index (0-100)")
    # === Derived Status ===
    status: CountryStatus = Field(..., description="Visual status for map coloring")
    flag_url: Optional[str] = Field(None, description="Path to country flag image")

    class Config:
        from_attributes = True


class GeoJSONMetadataResponse(BaseModel):
    """Response schema for the lightweight GeoJSON metadata endpoint."""
    total: int = Field(..., description="Total countries in database")
    countries: List[GeoJSONCountryMetadata] = Field(..., description="Lightweight country metadata")


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def derive_country_status(fatal_rate: Optional[float]) -> CountryStatus:
    """
    Derive the visual status based on fatal accident rate.
    
    Status Logic:
    - < 1.0: RESILIENT (Green) - Excellent safety performance
    - 1.0-2.0: GOOD (Yellow-Green) - Acceptable performance
    - 2.0-3.0: CONCERNING (Orange) - Needs attention
    - >= 3.0: CRITICAL (Red) - Urgent intervention required
    - None/NULL: DATA_GAP (Amber) - Investigation needed
    
    Args:
        fatal_rate: Fatal accident rate per 100,000 workers (can be None)
        
    Returns:
        CountryStatus enum value
    """
    if fatal_rate is None:
        return CountryStatus.DATA_GAP
    
    if fatal_rate < 1.0:
        return CountryStatus.RESILIENT
    elif fatal_rate < 2.0:
        return CountryStatus.GOOD
    elif fatal_rate < 3.0:
        return CountryStatus.CONCERNING
    else:
        return CountryStatus.CRITICAL


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get(
    "/geojson-metadata",
    response_model=GeoJSONMetadataResponse,
    summary="Get Lightweight GeoJSON Metadata",
    description="""
    **Performance-Optimized Endpoint for Global Map Visualization**
    
    Returns lightweight metadata for all countries in the database.
    Designed for instant map rendering with 195+ countries.
    
    **Payload Optimization:**
    - Full CountryResponse: ~2-5KB per country
    - GeoJSON Metadata: ~200 bytes per country
    - **90%+ reduction** in payload size
    
    **Metrics Included:**
    - `maturity_score`: Overall maturity (1.0-4.0 scale)
    - `fatal_accident_rate`: From Pillar 1 (per 100k workers)
    - `strategic_capacity_score`: From Governance (0-100)
    - `vulnerability_index`: From Pillar 2 (0-100)
    - `rehab_access_score`: From Pillar 3 (0-100)
    
    **Status Classification (based on maturity_score):**
    - `resilient`: ≥ 3.5 (Green)
    - `good`: 3.0-3.4 (Lime)
    - `concerning`: 2.0-2.9 (Orange)
    - `critical`: < 2.0 (Red)
    - `data_gap`: No maturity_score (Amber)
    """
)
async def get_geojson_metadata(
    db: Session = Depends(get_db)
) -> GeoJSONMetadataResponse:
    """
    Fetch lightweight country metadata for map visualization.
    
    READS STORED PILLAR SCORES from the countries table.
    These scores are calculated and stored by the /admin/metric-config/recalculate endpoint.
    
    If scores are NULL, falls back to on-the-fly calculation for backward compatibility.
    Uses raw SQL to avoid ORM enum processing issues.
    """
    from sqlalchemy import text
    
    # Query stored scores from countries table, with fallback metrics for calculation
    query = text("""
        SELECT 
            c.iso_code,
            c.name,
            c.maturity_score,
            c.governance_score,
            c.pillar1_score,
            c.pillar2_score,
            c.pillar3_score,
            c.flag_url,
            -- Fallback metrics for on-the-fly calculation if stored scores are NULL
            g.ilo_c187_status,
            g.ilo_c155_status,
            g.inspector_density,
            g.mental_health_policy,
            g.strategic_capacity_score,
            p1.fatal_accident_rate,
            p1.oel_compliance_pct,
            p1.safety_training_hours_avg,
            p1.carcinogen_exposure_pct,
            p2.vulnerability_index,
            p2.disease_detection_rate,
            p2.occupational_disease_reporting_rate,
            p2.lead_exposure_screening_rate,
            p3.rehab_access_score,
            p3.return_to_work_success_pct,
            p3.rehab_participation_rate,
            p3.avg_claim_settlement_days
        FROM countries c
        LEFT JOIN governance_layer g ON c.iso_code = g.country_iso_code
        LEFT JOIN pillar_1_hazard p1 ON c.iso_code = p1.country_iso_code
        LEFT JOIN pillar_2_vigilance p2 ON c.iso_code = p2.country_iso_code
        LEFT JOIN pillar_3_restoration p3 ON c.iso_code = p3.country_iso_code
        ORDER BY c.name
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    
    # Build lean response using STORED scores (with fallback calculation)
    metadata = []
    for row in rows:
        (iso_code, name, maturity_score, 
         stored_governance, stored_pillar1, stored_pillar2, stored_pillar3, flag_url,
         # Fallback metrics
         ilo_c187, ilo_c155, inspector_density, mental_health_policy, strategic_cap,
         fatal_rate, oel_compliance, safety_training, carcinogen_exp,
         vuln_idx, disease_detection, disease_reporting, lead_screening,
         rehab_access, rtw_success, rehab_participation, claim_settlement) = row
        
        # Use stored scores if available, otherwise calculate on-the-fly
        governance_score = stored_governance if stored_governance is not None else calculate_governance_score(
            ilo_c187, ilo_c155, inspector_density, mental_health_policy, strategic_cap
        )
        
        pillar1_score = stored_pillar1 if stored_pillar1 is not None else calculate_pillar1_score(
            fatal_rate, oel_compliance, safety_training, carcinogen_exp, None
        )
        
        pillar2_score = stored_pillar2 if stored_pillar2 is not None else calculate_pillar2_score(
            vuln_idx, disease_detection, disease_reporting, lead_screening
        )
        
        pillar3_score = stored_pillar3 if stored_pillar3 is not None else calculate_pillar3_score(
            rehab_access, rtw_success, rehab_participation, claim_settlement
        )
        
        # Derive status from maturity_score (1-4 scale)
        status = derive_maturity_status(maturity_score)
        
        metadata.append(GeoJSONCountryMetadata(
            iso_code=iso_code,
            name=name,
            maturity_score=maturity_score,
            governance_score=governance_score,
            pillar1_score=pillar1_score,
            pillar2_score=pillar2_score,
            pillar3_score=pillar3_score,
            status=status,
            flag_url=flag_url,
        ))
    
    return GeoJSONMetadataResponse(
        total=len(metadata),
        countries=metadata
    )


# =============================================================================
# PILLAR SCORE CALCULATION FUNCTIONS (Expert-Level WHO/ILO Aligned)
# =============================================================================

def safe_normalize(value: Optional[float], max_value: float, invert: bool = False) -> Optional[float]:
    """Safely normalize a value to 0-100 scale."""
    if value is None:
        return None
    normalized = min(100.0, max(0.0, (value / max_value) * 100))
    return 100.0 - normalized if invert else normalized


def weighted_average(components: list[tuple[Optional[float], float]]) -> Optional[float]:
    """
    Calculate weighted average of components.
    Only includes non-None values, redistributing weights.
    Returns None if no valid components.
    """
    valid_components = [(v, w) for v, w in components if v is not None]
    if not valid_components:
        return None
    
    total_weight = sum(w for _, w in valid_components)
    if total_weight == 0:
        return None
    
    weighted_sum = sum(v * (w / total_weight) for v, w in valid_components)
    return round(weighted_sum, 1)


def calculate_governance_score(
    ilo_c187: Optional[bool],
    ilo_c155: Optional[bool],
    inspector_density: Optional[float],
    mental_health_policy: Optional[bool],
    strategic_cap: Optional[float]
) -> Optional[float]:
    """
    Calculate Governance Index (0-100) based on WHO/ILO guidance.
    
    Components (Expert Weights):
    - ILO C187 Ratification: 20% (max 1 = ratified)
    - ILO C155 Ratification: 20% (max 1 = ratified)
    - Inspector Density: 30% (max 3.0 inspectors per 10k workers)
    - Mental Health Policy: 15% (max 1 = has policy)
    - Strategic Capacity: 15% (max 100 points)
    """
    components = [
        (100.0 if ilo_c187 else (0.0 if ilo_c187 is not None else None), 0.20),
        (100.0 if ilo_c155 else (0.0 if ilo_c155 is not None else None), 0.20),
        (safe_normalize(inspector_density, 3.0), 0.30),
        (100.0 if mental_health_policy else (0.0 if mental_health_policy is not None else None), 0.15),
        (strategic_cap, 0.15),  # Already 0-100
    ]
    return weighted_average(components)


def calculate_pillar1_score(
    fatal_rate: Optional[float],
    oel_compliance: Optional[float],
    safety_training: Optional[float],
    carcinogen_exp: Optional[float],
    control_maturity: Optional[float]
) -> Optional[float]:
    """
    Calculate Pillar 1: Hazard Control Index (0-100).
    
    Components (Expert Weights - WHO/ILO guidance):
    - Fatal Accident Rate: 40% (max 10, INVERTED - lower is better)
    - OEL Compliance: 25% (max 100%)
    - Safety Training Hours: 20% (max 40 hours)
    - Carcinogen Exposure: 15% (max 50%, INVERTED - lower is better)
    
    Note: control_maturity_score is excluded as it's a derived metric.
    """
    components = [
        (safe_normalize(fatal_rate, 10.0, invert=True), 0.40),
        (oel_compliance, 0.25),  # Already percentage
        (safe_normalize(safety_training, 40.0), 0.20),
        (safe_normalize(carcinogen_exp, 50.0, invert=True), 0.15),
    ]
    return weighted_average(components)


def calculate_pillar2_score(
    vuln_idx: Optional[float],
    disease_detection: Optional[float],
    disease_reporting: Optional[float],
    lead_screening: Optional[float]
) -> Optional[float]:
    """
    Calculate Pillar 2: Health Vigilance Index (0-100).
    
    Components (Expert Weights):
    - Vulnerability Index: 30% (max 100, INVERTED - lower is better)
    - Disease Detection Rate: 30% (max 100%)
    - Occupational Disease Reporting: 20% (max 100%)
    - Lead Exposure Screening: 20% (max 100%)
    """
    components = [
        (safe_normalize(vuln_idx, 100.0, invert=True), 0.30),
        (disease_detection, 0.30),  # Already percentage
        (disease_reporting, 0.20),  # Already percentage
        (lead_screening, 0.20),  # Already percentage
    ]
    return weighted_average(components)


def calculate_pillar3_score(
    rehab_access: Optional[float],
    rtw_success: Optional[float],
    rehab_participation: Optional[float],
    claim_settlement: Optional[float]
) -> Optional[float]:
    """
    Calculate Pillar 3: Restoration Index (0-100).
    
    Components (Expert Weights):
    - Rehab Access Score: 30% (max 100)
    - Return-to-Work Success: 30% (max 100%)
    - Rehab Participation Rate: 20% (max 100%)
    - Claim Settlement Days: 20% (max 365 days, INVERTED - lower is better)
    """
    components = [
        (rehab_access, 0.30),  # Already 0-100
        (rtw_success, 0.30),  # Already percentage
        (rehab_participation, 0.20),  # Already percentage
        (safe_normalize(claim_settlement, 365.0, invert=True), 0.20),
    ]
    return weighted_average(components)


def derive_maturity_status(maturity_score: Optional[float]) -> CountryStatus:
    """
    Derive visual status from maturity score (1.0-4.0 scale).
    
    - ≥ 3.5: RESILIENT (Green)
    - 3.0-3.4: GOOD (Lime)
    - 2.0-2.9: CONCERNING (Orange)
    - < 2.0: CRITICAL (Red)
    - None: DATA_GAP (Amber)
    """
    if maturity_score is None:
        return CountryStatus.DATA_GAP
    
    if maturity_score >= 3.5:
        return CountryStatus.RESILIENT
    elif maturity_score >= 3.0:
        return CountryStatus.GOOD
    elif maturity_score >= 2.0:
        return CountryStatus.CONCERNING
    else:
        return CountryStatus.CRITICAL


@router.post(
    "/recalculate-scores",
    summary="Recalculate All Maturity Scores",
    description="""
    **Admin Endpoint: Recalculate maturity scores for all countries**
    
    Uses raw SQL to bypass ORM enum processing issues.
    This calculates scores based on the framework rules:
    - Base score: 1.0
    - Pillar 1: +1.0 if fatal_rate < 1.0 AND inspector_density > 1.0
    - Pillar 1 Cap: Max 2.0 if fatal_rate > 3.0
    - Pillar 3: +1.0 if reintegration_law = true
    """
)
async def recalculate_all_scores(
    db: Session = Depends(get_db)
):
    """
    Recalculate maturity scores for all countries using raw SQL.
    """
    from sqlalchemy import text
    from datetime import datetime
    
    # Step 1: Get all country data we need for scoring
    query = text("""
        SELECT 
            c.iso_code,
            p1.fatal_accident_rate,
            g.inspector_density,
            p3.reintegration_law
        FROM countries c
        LEFT JOIN pillar_1_hazard p1 ON c.iso_code = p1.country_iso_code
        LEFT JOIN governance_layer g ON c.iso_code = g.country_iso_code
        LEFT JOIN pillar_3_restoration p3 ON c.iso_code = p3.country_iso_code
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    
    updated_count = 0
    scores_by_iso = {}
    
    for row in rows:
        iso_code, fatal_rate, inspector_density, reintegration_law = row
        
        # Calculate score using framework rules
        score = 1.0  # Base score
        capped = False
        
        # Pillar 1: Cap at 2.0 if fatal_rate > 3.0
        if fatal_rate is not None and fatal_rate > 3.0:
            capped = True
        
        # Pillar 1: +1.0 if fatal_rate < 1.0 AND inspector_density > 1.0
        if not capped and fatal_rate is not None and inspector_density is not None:
            if fatal_rate < 1.0 and inspector_density > 1.0:
                score += 1.0
        
        # Pillar 3: +1.0 if reintegration_law is True
        if not capped and reintegration_law is True:
            score += 1.0
        
        # Apply cap
        if capped:
            score = min(score, 2.0)
        else:
            score = min(score, 4.0)
        
        score = round(score, 1)
        scores_by_iso[iso_code] = score
    
    # Step 2: Update all scores in a single transaction
    for iso_code, score in scores_by_iso.items():
        update_query = text("""
            UPDATE countries 
            SET maturity_score = :score, updated_at = :now
            WHERE iso_code = :iso_code
        """)
        db.execute(update_query, {
            "score": score,
            "now": datetime.utcnow(),
            "iso_code": iso_code
        })
        updated_count += 1
    
    db.commit()
    
    # Count score distribution
    score_dist = {"1.0": 0, "2.0": 0, "3.0": 0, "4.0": 0}
    for score in scores_by_iso.values():
        if score < 2.0:
            score_dist["1.0"] += 1
        elif score < 3.0:
            score_dist["2.0"] += 1
        elif score < 3.5:
            score_dist["3.0"] += 1
        else:
            score_dist["4.0"] += 1
    
    return {
        "status": "success",
        "message": f"Recalculated maturity scores for {updated_count} countries",
        "score_distribution": {
            "reactive (1.0-1.9)": score_dist["1.0"],
            "compliant (2.0-2.9)": score_dist["2.0"],
            "proactive (3.0-3.4)": score_dist["3.0"],
            "resilient (3.5-4.0)": score_dist["4.0"],
        }
    }


@router.post(
    "/sync-missing",
    summary="Sync Missing Countries",
    description="""
    **Admin Endpoint: Insert all missing countries from the target list**
    
    Identifies countries that are in the target list (195 UN member states)
    but not yet in the database, and inserts them with default values.
    """
)
async def sync_missing_countries(
    db: Session = Depends(get_db)
):
    """
    Insert missing countries from the target list.
    """
    from sqlalchemy import text
    from datetime import datetime
    from app.data.targets import UN_MEMBER_STATES, get_country_name
    
    # Get existing countries
    existing_query = text("SELECT iso_code FROM countries")
    result = db.execute(existing_query)
    existing_codes = {row[0] for row in result.fetchall()}
    
    # Find missing countries
    missing_codes = [code for code in UN_MEMBER_STATES if code not in existing_codes]
    
    if not missing_codes:
        return {
            "status": "success",
            "message": "All countries are already in the database",
            "existing_count": len(existing_codes),
            "missing_count": 0
        }
    
    # Insert missing countries
    inserted = []
    for iso_code in missing_codes:
        name = get_country_name(iso_code)
        insert_query = text("""
            INSERT INTO countries (iso_code, name, maturity_score, created_at, updated_at)
            VALUES (:iso_code, :name, 1.0, :now, :now)
        """)
        try:
            db.execute(insert_query, {
                "iso_code": iso_code,
                "name": name,
                "now": datetime.utcnow()
            })
            inserted.append(iso_code)
        except Exception as e:
            pass  # Country might already exist
    
    db.commit()
    
    return {
        "status": "success",
        "message": f"Inserted {len(inserted)} missing countries",
        "existing_count": len(existing_codes),
        "inserted_codes": inserted,
        "total_now": len(existing_codes) + len(inserted)
    }


@router.get(
    "/",
    response_model=CountryListPaginated,
    summary="List Countries (Paginated)",
    description="Get a paginated list of all countries with summary information."
)
async def list_countries(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
) -> CountryListPaginated:
    """
    List all countries with pagination.
    
    For full country data, use GET /countries/{iso_code}
    For map visualization, use GET /countries/geojson-metadata
    """
    # Count total
    total = db.query(Country).count()
    
    # Fetch page
    offset = (page - 1) * per_page
    countries = (
        db.query(Country)
        .order_by(Country.name)
        .offset(offset)
        .limit(per_page)
        .all()
    )
    
    return CountryListPaginated(
        total=total,
        page=page,
        per_page=per_page,
        countries=[CountryListResponse.model_validate(c) for c in countries]
    )


class ComparisonCountriesResponse(BaseModel):
    """Response schema for comparison endpoint with all countries and full pillar data."""
    total: int = Field(..., description="Total countries available for comparison")
    countries: List[CountryResponse] = Field(..., description="Full country data with all pillars")


@router.get(
    "/comparison/all",
    response_model=ComparisonCountriesResponse,
    summary="Get All Countries for Comparison",
    description="""
    **Endpoint for Framework Comparison Page**
    
    Returns all countries with complete pillar data for side-by-side comparison.
    Includes governance layer and all 3 pillars with metrics.
    
    **Use Case:**
    - Framework Comparison page country selection
    - Full metric comparison between any two countries
    """
)
async def get_comparison_countries(
    db: Session = Depends(get_db)
) -> ComparisonCountriesResponse:
    """
    Fetch all countries with complete pillar data for comparison.
    
    Uses eager loading to prevent N+1 queries.
    """
    # Query with eager loading of all layers
    countries = (
        db.query(Country)
        .options(
            joinedload(Country.governance),
            joinedload(Country.pillar_1_hazard),
            joinedload(Country.pillar_2_vigilance),
            joinedload(Country.pillar_3_restoration),
        )
        .order_by(Country.name)
        .all()
    )
    
    # Build full response for each country
    country_responses = []
    for country in countries:
        response_data = {
            "iso_code": country.iso_code,
            "name": country.name,
            "maturity_score": country.maturity_score,
            "strategic_summary_text": country.strategic_summary_text,
            "flag_url": country.flag_url,
            "created_at": country.created_at,
            "updated_at": country.updated_at,
            "governance": country.governance,
            "pillar_1_hazard": country.pillar_1_hazard,
            "pillar_2_vigilance": country.pillar_2_vigilance,
            "pillar_3_restoration": country.pillar_3_restoration,
            "data_coverage_score": country.data_coverage_score(),
        }
        country_responses.append(CountryResponse.model_validate(response_data))
    
    return ComparisonCountriesResponse(
        total=len(country_responses),
        countries=country_responses
    )


@router.get(
    "/{iso_code}",
    response_model=CountryResponse,
    summary="Get Country Details",
    description="Get full country assessment data with all nested layers."
)
async def get_country(
    iso_code: str,
    db: Session = Depends(get_db)
) -> CountryResponse:
    """
    Get detailed country data with all strategic layers.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code (e.g., DEU, SAU)
        
    Returns:
        Full CountryResponse with all nested pillar data
    """
    # Normalize to uppercase
    iso_code = iso_code.upper()
    
    # Validate format
    if len(iso_code) != 3 or not iso_code.isalpha():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISO code format: '{iso_code}'. Must be 3-letter alpha code."
        )
    
    # Query with eager loading of all layers
    country = (
        db.query(Country)
        .options(
            joinedload(Country.governance),
            joinedload(Country.pillar_1_hazard),
            joinedload(Country.pillar_2_vigilance),
            joinedload(Country.pillar_3_restoration),
        )
        .filter(Country.iso_code == iso_code)
        .first()
    )
    
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with ISO code '{iso_code}' not found"
        )
    
    # Build response with data coverage score
    response_data = {
        "iso_code": country.iso_code,
        "name": country.name,
        "maturity_score": country.maturity_score,
        "strategic_summary_text": country.strategic_summary_text,
        "flag_url": country.flag_url,
        "created_at": country.created_at,
        "updated_at": country.updated_at,
        "governance": country.governance,
        "pillar_1_hazard": country.pillar_1_hazard,
        "pillar_2_vigilance": country.pillar_2_vigilance,
        "pillar_3_restoration": country.pillar_3_restoration,
        "data_coverage_score": country.data_coverage_score(),
    }
    
    return CountryResponse.model_validate(response_data)


# =============================================================================
# COUNTRY INTELLIGENCE ENDPOINT
# =============================================================================

class CountryIntelligenceSimple(BaseModel):
    """Simplified country intelligence for dashboard."""
    iso_code: str
    # Economic data
    gdp_per_capita_ppp: Optional[float] = None
    gdp_growth_rate: Optional[float] = None
    population_total: Optional[float] = None
    population_working_age: Optional[float] = None
    labor_force_participation: Optional[float] = None
    unemployment_rate: Optional[float] = None
    youth_unemployment_rate: Optional[float] = None
    informal_employment_pct: Optional[float] = None
    urban_population_pct: Optional[float] = None
    median_age: Optional[float] = None
    # Industry breakdown
    industry_pct_gdp: Optional[float] = None
    manufacturing_pct_gdp: Optional[float] = None
    agriculture_pct_gdp: Optional[float] = None
    services_pct_gdp: Optional[float] = None
    # Health & safety
    life_expectancy_at_birth: Optional[float] = None
    healthy_life_expectancy: Optional[float] = None
    health_expenditure_gdp_pct: Optional[float] = None
    # HDI
    hdi_score: Optional[float] = None
    hdi_rank: Optional[float] = None


@router.get(
    "/{iso_code}/intelligence",
    response_model=CountryIntelligenceSimple,
    summary="Get Country Intelligence Data",
    description="Get economic and demographic intelligence data for a country."
)
async def get_country_intelligence(
    iso_code: str,
    db: Session = Depends(get_db)
) -> CountryIntelligenceSimple:
    """
    Get country intelligence data for dashboard visualization.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        
    Returns:
        Economic and demographic intelligence data
    """
    iso_code = iso_code.upper()
    
    # Query intelligence data
    intel = db.query(CountryIntelligence).filter(
        CountryIntelligence.country_iso_code == iso_code
    ).first()
    
    if not intel:
        # Return empty response with just iso_code
        return CountryIntelligenceSimple(iso_code=iso_code)
    
    return CountryIntelligenceSimple(
        iso_code=intel.country_iso_code,
        gdp_per_capita_ppp=intel.gdp_per_capita_ppp,
        gdp_growth_rate=intel.gdp_growth_rate,
        population_total=intel.population_total,
        population_working_age=intel.population_working_age,
        labor_force_participation=intel.labor_force_participation,
        unemployment_rate=intel.unemployment_rate,
        youth_unemployment_rate=intel.youth_unemployment_rate,
        informal_employment_pct=intel.informal_employment_pct,
        urban_population_pct=intel.urban_population_pct,
        median_age=intel.median_age,
        industry_pct_gdp=intel.industry_pct_gdp,
        manufacturing_pct_gdp=intel.manufacturing_pct_gdp,
        agriculture_pct_gdp=intel.agriculture_pct_gdp,
        services_pct_gdp=intel.services_pct_gdp,
        life_expectancy_at_birth=intel.life_expectancy_at_birth,
        healthy_life_expectancy=intel.healthy_life_expectancy,
        health_expenditure_gdp_pct=intel.health_expenditure_gdp_pct,
        hdi_score=intel.hdi_score,
        hdi_rank=intel.hdi_rank,
    )
