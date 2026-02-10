"""
GOHIP Platform - ETL API Endpoints
==================================

Phase 23: Unified 5-Point Dragnet Pipeline

Provides endpoints for:
- Triggering ETL pipeline as a background task (202 Accepted)
- Polling real-time pipeline logs
- Per-country status tracking for visual grid
- Fetching source registry data

Features:
- Fire-and-forget execution (instant 202 response)
- 5-Point Dragnet: ILO (Primary) + WHO (Proxy) + World Bank (Context)
- Per-country status updates for Live Ops Center
- Resilient per-country processing (failures don't stop pipeline)
- Rate limiting between API calls
- Real-time progress logging
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db, SessionLocal
from app.core.dependencies import get_current_admin_user
from app.models.country import Country, Pillar1Hazard, GovernanceLayer
from app.models.user import User
from app.services.pipeline_logger import pipeline_logger, LogLevel
from app.services.database_fill_agent import (
    get_fill_status,
    reset_fill_status,
    run_batch_fill,
    _fill_status,
)
from app.data.targets import GLOBAL_ECONOMIES_50, UN_MEMBER_STATES, get_country_name

# =============================================================================
# REGISTRY CACHE (5-minute TTL)
# =============================================================================
_registry_cache: Optional[Any] = None
_registry_cache_time: Optional[datetime] = None
REGISTRY_CACHE_TTL = timedelta(minutes=5)

# Create router
router = APIRouter(prefix="/etl", tags=["ETL Pipeline"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PipelineRunRequest(BaseModel):
    """Request body for starting the pipeline."""
    countries: Optional[List[str]] = None  # ISO codes to process, None = all 50
    fetch_flags: bool = True  # Whether to fetch flag images from Wikipedia


class PipelineRunResponse(BaseModel):
    """Response when pipeline is triggered."""
    success: bool
    message: str
    status: str
    countries_count: int = 50


class PipelineLogsResponse(BaseModel):
    """Response containing pipeline logs."""
    logs: List[str]
    is_running: bool
    started_at: Optional[str]
    finished_at: Optional[str]
    log_count: int


class SourceRegistryItem(BaseModel):
    """Individual metric in the source registry."""
    country_iso: str
    country_name: str
    metric: str
    value: Optional[str]
    source_url: Optional[str]


class SourceRegistryResponse(BaseModel):
    """Full source registry response."""
    total: int
    items: List[SourceRegistryItem]
    last_updated: Optional[str]


class CountryStatusItem(BaseModel):
    """Status for a single country in the pipeline."""
    status: str  # pending, processing, success, failed
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    metric: Optional[float] = None
    error: Optional[str] = None


class PipelineStatusResponse(BaseModel):
    """
    Phase 17: Detailed pipeline status for Live Operations Center.
    
    Used by the visual grid to show real-time country processing status.
    """
    current_country: Optional[str]  # ISO code being processed
    progress: str  # "12/50" format
    progress_count: int
    total_countries: int
    completed_countries: List[str]  # ISO codes that succeeded
    failed_countries: List[str]  # ISO codes that failed
    country_data: Dict[str, CountryStatusItem]  # Per-country status
    logs: List[str]  # Last 10 log entries for ticker
    is_running: bool
    started_at: Optional[str]
    finished_at: Optional[str]


# =============================================================================
# BACKGROUND TASK: ETL PIPELINE
# =============================================================================

def run_etl_pipeline_task(countries: Optional[List[str]] = None, fetch_flags: bool = True):
    """
    Execute the full 5-Point Dragnet ETL pipeline as a background task.
    
    Phase 23: Unified Pipeline - Calls the same function as CLI execution.
    Phase 25: Country Selection - Allows user to specify which countries to process.
    
    This ensures the UI "Sync" button executes the SAME powerful logic as
    `python run_pipeline.py` - the full ILO + WHO + WB fusion strategy.
    
    Args:
        countries: Optional list of ISO codes to process. If None, processes all 50.
        fetch_flags: Whether to fetch flag images from Wikipedia.
    
    The 5-Point Dragnet:
    ====================
    1. [DIRECT]   ILO Fatal Rate → Pillar 1: Fatal Accident Rate
    2. [PROXY]    WHO Road Safety / 10 → Fallback for missing ILO data
    3. [CONTEXT]  WB Governance → Strategic Capacity Score
    4. [CONTEXT]  WB Vulnerable Employment → Pillar 2 Vulnerability
    5. [CONTEXT]  WB Health Expenditure → Pillar 3 Rehab Proxy
    """
    # Import here to avoid circular imports at module load time
    import sys
    from pathlib import Path
    
    # Ensure run_pipeline is importable
    server_path = Path(__file__).parent.parent.parent.parent
    if str(server_path) not in sys.path:
        sys.path.insert(0, str(server_path))
    
    from run_pipeline import run_full_pipeline
    
    try:
        # Execute the canonical 5-Point Dragnet pipeline with UI logging enabled
        # Pass the filtered country list and flag fetching option
        run_full_pipeline(
            batch_size=len(countries) if countries else 195,
            use_pipeline_logger=True,
            country_filter=countries,
            fetch_flags=fetch_flags
        )
    except Exception as e:
        # Ensure pipeline_logger is properly closed on crash
        pipeline_logger.error(f"Pipeline crashed: {e}")
        pipeline_logger.finish(success=False)
        raise


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/run",
    response_model=PipelineRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger ETL Pipeline (Fire-and-Forget)",
    description="""
    Start the ETL pipeline as a background task.
    
    Phase 17: Live Operations Center - Fire-and-Forget Execution
    Phase 25: Country Selection - Optionally specify which countries to process
    
    Returns 202 Accepted IMMEDIATELY after triggering the background task.
    The browser does NOT wait for the job to finish.
    
    Request Body (optional):
    - countries: List of ISO 3166-1 alpha-3 codes to process. If omitted, all 50 are processed.
    - fetch_flags: Whether to download flag images from Wikipedia (default: true)
    
    The pipeline will:
    1. Fetch data from ILO ILOSTAT API for each country
    2. Fetch data from World Bank API for each country
    3. Fetch flag images from Wikipedia (if enabled)
    4. Upsert records to the database (per-country resilience)
    5. Calculate maturity scores
    
    Progress can be monitored via:
    - GET /api/v1/etl/status (for Live Ops Center visual grid)
    - GET /api/v1/etl/logs (for raw log streaming)
    """
)
async def run_pipeline(
    background_tasks: BackgroundTasks,
    request: Optional[PipelineRunRequest] = None
):
    """
    Trigger the ETL pipeline to run in the background.
    
    Phase 17: Returns 202 Accepted IMMEDIATELY - Fire-and-Forget pattern.
    Phase 25: Accepts optional country filter and flag fetching option.
    """
    if pipeline_logger.is_running:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=PipelineRunResponse(
                success=False,
                message="Pipeline is already running",
                status="running",
                countries_count=0
            ).model_dump()
        )
    
    # Parse request parameters
    countries = None
    fetch_flags = True
    
    if request:
        countries = request.countries
        fetch_flags = request.fetch_flags
    
    # Validate country codes if provided
    if countries:
        valid_codes = set(UN_MEMBER_STATES)
        invalid = [c for c in countries if c not in valid_codes]
        if invalid:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": f"Invalid country codes: {', '.join(invalid)}",
                    "status": "error",
                    "countries_count": 0
                }
            )
    
    # Determine count
    count = len(countries) if countries else len(UN_MEMBER_STATES)
    
    # Add pipeline to background tasks - returns immediately
    background_tasks.add_task(run_etl_pipeline_task, countries, fetch_flags)
    
    # 202 Accepted - Fire-and-Forget pattern
    return PipelineRunResponse(
        success=True,
        message=f"Pipeline started - Processing {count} countries" + (" with flags" if fetch_flags else ""),
        status="accepted",
        countries_count=count
    )


@router.get(
    "/status",
    response_model=PipelineStatusResponse,
    summary="Get Pipeline Status (Live Ops Center)",
    description="""
    Phase 17: Detailed pipeline status for the Live Operations Center.
    
    Returns per-country processing status for the visual grid:
    - current_country: ISO code currently being processed (pulses blue)
    - completed_countries: List of successful ISO codes (green border)
    - failed_countries: List of failed ISO codes (red border)
    - country_data: Per-country metrics and status
    - logs: Last 10 log entries for the ticker
    
    Poll every 1 second for real-time UI updates.
    """
)
async def get_pipeline_status():
    """
    Get detailed pipeline status for Live Operations Center.
    
    Designed for 1-second polling by the visual country grid UI.
    """
    detailed = pipeline_logger.get_detailed_status()
    
    return PipelineStatusResponse(
        current_country=detailed["current_country"],
        progress=detailed["progress"],
        progress_count=detailed["progress_count"],
        total_countries=detailed["total_countries"],
        completed_countries=detailed["completed_countries"],
        failed_countries=detailed["failed_countries"],
        country_data={
            iso: CountryStatusItem(**data) 
            for iso, data in detailed["country_data"].items()
        },
        logs=detailed["logs"],
        is_running=detailed["is_running"],
        started_at=detailed["started_at"],
        finished_at=detailed["finished_at"],
    )


@router.post(
    "/stop",
    summary="Stop Running Pipeline",
    description="Stop the currently running ETL pipeline gracefully."
)
async def stop_pipeline():
    """
    Stop the currently running ETL pipeline.
    
    Sets a flag that the pipeline checks between countries to stop gracefully.
    """
    if not pipeline_logger.is_running:
        return {
            "success": False,
            "message": "No pipeline is currently running",
            "status": "idle"
        }
    
    # Set stop flag - pipeline will check this between countries
    pipeline_logger.request_stop()
    
    return {
        "success": True,
        "message": "Stop requested - pipeline will halt after current country",
        "status": "stopping"
    }


@router.get(
    "/logs",
    response_model=PipelineLogsResponse,
    summary="Get Pipeline Logs",
    description="Retrieve current pipeline execution logs for real-time monitoring."
)
async def get_logs():
    """
    Get all current pipeline logs.
    
    Returns:
        PipelineLogsResponse with log lines and status
    """
    status = pipeline_logger.get_status()
    
    return PipelineLogsResponse(
        logs=pipeline_logger.get_logs(),
        is_running=status["is_running"],
        started_at=status["started_at"],
        finished_at=status["finished_at"],
        log_count=status["log_count"],
    )


@router.get(
    "/registry",
    response_model=SourceRegistryResponse,
    summary="Get Source Registry",
    description="Get all metrics with their sources for the transparency center."
)
async def get_source_registry(db: Session = Depends(get_db)):
    """
    Get the complete source registry showing all metrics and their data sources.
    
    OPTIMIZED: Uses eager loading to fetch all data in ~2 queries instead of N+1.
    CACHED: Results cached for 5 minutes to reduce database load.
    
    Includes data from ALL sources:
    - ILO: Fatal rates, convention ratifications
    - WHO: UHC Index, health indicators
    - World Bank: Governance, economic, health expenditure
    - CPI: Corruption Perception Index
    - HDI: Human Development Index
    - EPI: Environmental Performance Index
    - IHME GBD: Disease burden DALYs
    - WJP: Rule of Law Index
    - OECD: Work-life balance (OECD countries)
    
    Returns:
        SourceRegistryResponse with all tracked metrics
    """
    global _registry_cache, _registry_cache_time
    
    # Return cached response if still valid
    if _registry_cache is not None and _registry_cache_time is not None:
        if datetime.now() - _registry_cache_time < REGISTRY_CACHE_TTL:
            return _registry_cache
    
    from app.models.country import CountryIntelligence, Pillar2Vigilance, Pillar3Restoration
    from sqlalchemy import text
    
    items: List[SourceRegistryItem] = []
    last_updated = None
    
    # OPTIMIZED: Bulk load all related data with separate queries
    # This is 6 queries total instead of N*5 (where N = number of countries)
    countries = db.query(Country).all()
    
    # Build lookup dictionaries for O(1) access
    all_hazards = db.query(Pillar1Hazard).all()
    hazard_map = {h.country_iso_code: h for h in all_hazards}
    
    all_governance = db.query(GovernanceLayer).all()
    governance_map = {g.country_iso_code: g for g in all_governance}
    
    # Load vigilance data using raw SQL to avoid enum parsing issues
    vigilance_result = db.execute(text("""
        SELECT country_iso_code, disease_detection_rate, vulnerability_index, 
               surveillance_logic::text as surveillance_logic
        FROM pillar_2_vigilance
    """))
    vigilance_map = {}
    for row in vigilance_result:
        vigilance_map[row.country_iso_code] = {
            'disease_detection_rate': row.disease_detection_rate,
            'vulnerability_index': row.vulnerability_index,
            'surveillance_logic': row.surveillance_logic
        }
    
    # Load restoration data using raw SQL to avoid enum parsing issues
    restoration_result = db.execute(text("""
        SELECT country_iso_code, rehab_access_score, payer_mechanism::text as payer_mechanism
        FROM pillar_3_restoration
    """))
    restoration_map = {}
    for row in restoration_result:
        restoration_map[row.country_iso_code] = {
            'rehab_access_score': row.rehab_access_score,
            'payer_mechanism': row.payer_mechanism
        }
    
    all_intel = db.query(CountryIntelligence).all()
    intel_map = {intel.country_iso_code: intel for intel in all_intel}
    
    for country in countries:
        # Track last update
        if country.updated_at and (last_updated is None or country.updated_at > last_updated):
            last_updated = country.updated_at
        
        # Access data from lookup maps
        hazard = hazard_map.get(country.iso_code)
        governance = governance_map.get(country.iso_code)
        vigilance = vigilance_map.get(country.iso_code)
        restoration = restoration_map.get(country.iso_code)
        intel = intel_map.get(country.iso_code)
        
        # ================================================================
        # PILLAR 1: HAZARD CONTROL (ILO Source)
        # ================================================================
        if hazard:
            if hazard.fatal_accident_rate is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Fatal Accident Rate (per 100k workers)",
                    value=str(round(hazard.fatal_accident_rate, 2)),
                    source_url="https://ilostat.ilo.org"
                ))
            
            if hazard.carcinogen_exposure_pct is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Carcinogen Exposure (%)",
                    value=str(hazard.carcinogen_exposure_pct),
                    source_url=None
                ))
            
            if hazard.oel_compliance_pct is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="OEL Compliance (%)",
                    value=str(hazard.oel_compliance_pct),
                    source_url=None
                ))
            
            if hazard.control_maturity_score is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Hazard Control Maturity Score",
                    value=str(round(hazard.control_maturity_score, 1)),
                    source_url=None
                ))
        
        # ================================================================
        # GOVERNANCE LAYER (ILO + World Bank)
        # ================================================================
        if governance:
            if governance.ilo_c187_status is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="ILO C187 Ratified",
                    value="Yes" if governance.ilo_c187_status else "No",
                    source_url="https://www.ilo.org/normlex"
                ))
            
            if governance.ilo_c155_status is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="ILO C155 Ratified",
                    value="Yes" if governance.ilo_c155_status else "No",
                    source_url="https://www.ilo.org/normlex"
                ))
            
            if governance.inspector_density is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Inspector Density (per 10k workers)",
                    value=str(governance.inspector_density),
                    source_url="https://ilostat.ilo.org"
                ))
            
            if governance.mental_health_policy is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Mental Health Policy",
                    value="Yes" if governance.mental_health_policy else "No",
                    source_url=None
                ))
            
            if governance.strategic_capacity_score is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Strategic Capacity Score",
                    value=str(round(governance.strategic_capacity_score, 1)),
                    source_url="https://data.worldbank.org"
                ))
            
            if governance.source_urls and "economic_context" in governance.source_urls:
                econ = governance.source_urls["economic_context"]
                if isinstance(econ, dict) and econ.get("industry_pct_gdp"):
                    items.append(SourceRegistryItem(
                        country_iso=country.iso_code,
                        country_name=country.name,
                        metric="Industry (% of GDP)",
                        value=str(round(econ["industry_pct_gdp"], 1)),
                        source_url="https://data.worldbank.org"
                    ))
        
        # ================================================================
        # PILLAR 2: HEALTH VIGILANCE (WHO Source)
        # ================================================================
        if vigilance:
            if vigilance.get('disease_detection_rate') is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Disease Detection Rate (UHC Index)",
                    value=str(round(vigilance['disease_detection_rate'], 1)),
                    source_url="https://www.who.int/data/gho"
                ))
            
            if vigilance.get('vulnerability_index') is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Vulnerability Index",
                    value=str(round(vigilance['vulnerability_index'], 1)),
                    source_url="https://data.worldbank.org"
                ))
            
            if vigilance.get('surveillance_logic') is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Surveillance Logic Type",
                    value=str(vigilance['surveillance_logic']),
                    source_url=None
                ))
        
        # ================================================================
        # PILLAR 3: RESTORATION
        # ================================================================
        if restoration:
            if restoration.get('rehab_access_score') is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Rehab Access Score",
                    value=str(round(restoration['rehab_access_score'], 1)),
                    source_url="https://data.worldbank.org"
                ))
            
            if restoration.get('payer_mechanism') is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Payer Mechanism Type",
                    value=str(restoration['payer_mechanism']),
                    source_url=None
                ))
        
        # ================================================================
        # COUNTRY INTELLIGENCE (CPI, HDI, EPI, IHME GBD, WJP, OECD)
        # ================================================================
        if intel:
            if intel.corruption_perception_index is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Corruption Perception Index (CPI)",
                    value=str(round(intel.corruption_perception_index, 1)),
                    source_url="https://www.transparency.org/cpi"
                ))
            
            if intel.hdi_score is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Human Development Index (HDI)",
                    value=str(round(intel.hdi_score, 3)),
                    source_url="https://hdr.undp.org/data-center"
                ))
            
            if intel.education_index is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Education Index (HDI)",
                    value=str(round(intel.education_index, 3)),
                    source_url="https://hdr.undp.org/data-center"
                ))
            
            if intel.epi_score is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Environmental Performance Index (EPI)",
                    value=str(round(intel.epi_score, 1)),
                    source_url="https://epi.yale.edu"
                ))
            
            if intel.epi_air_quality is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Air Quality Score (EPI)",
                    value=str(round(intel.epi_air_quality, 1)),
                    source_url="https://epi.yale.edu"
                ))
            
            if intel.daly_occupational_total is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Occupational DALYs Total (IHME GBD)",
                    value=str(round(intel.daly_occupational_total, 1)),
                    source_url="https://www.healthdata.org/gbd"
                ))
            
            if intel.daly_occupational_injuries is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Occupational Injury DALYs (IHME GBD)",
                    value=str(round(intel.daly_occupational_injuries, 1)),
                    source_url="https://www.healthdata.org/gbd"
                ))
            
            if intel.daly_occupational_carcinogens is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Occupational Carcinogen DALYs (IHME GBD)",
                    value=str(round(intel.daly_occupational_carcinogens, 1)),
                    source_url="https://www.healthdata.org/gbd"
                ))
            
            if intel.rule_of_law_index is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Rule of Law Index (WJP)",
                    value=str(round(intel.rule_of_law_index, 2)),
                    source_url="https://worldjusticeproject.org"
                ))
            
            if intel.regulatory_enforcement_score is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Regulatory Enforcement Score (WJP)",
                    value=str(round(intel.regulatory_enforcement_score, 2)),
                    source_url="https://worldjusticeproject.org"
                ))
            
            if intel.oecd_work_life_balance is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Work-Life Balance Score (OECD)",
                    value=str(round(intel.oecd_work_life_balance, 1)),
                    source_url="https://stats.oecd.org"
                ))
            
            if intel.oecd_hours_worked_annual is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Annual Hours Worked (OECD)",
                    value=str(int(intel.oecd_hours_worked_annual)),
                    source_url="https://stats.oecd.org"
                ))
            
            if intel.government_effectiveness is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Government Effectiveness (WB)",
                    value=str(round(intel.government_effectiveness, 2)),
                    source_url="https://data.worldbank.org"
                ))
            
            if intel.uhc_service_coverage_index is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="UHC Service Coverage Index (WHO)",
                    value=str(round(intel.uhc_service_coverage_index, 1)),
                    source_url="https://www.who.int/data/gho"
                ))
            
            if intel.life_expectancy_at_birth is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Life Expectancy at Birth (WHO)",
                    value=str(round(intel.life_expectancy_at_birth, 1)),
                    source_url="https://www.who.int/data/gho"
                ))
            
            if intel.gdp_per_capita_ppp is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="GDP per Capita PPP (WB)",
                    value=f"${int(intel.gdp_per_capita_ppp):,}",
                    source_url="https://data.worldbank.org"
                ))
            
            if intel.unemployment_rate is not None:
                items.append(SourceRegistryItem(
                    country_iso=country.iso_code,
                    country_name=country.name,
                    metric="Unemployment Rate (WB)",
                    value=f"{round(intel.unemployment_rate, 1)}%",
                    source_url="https://data.worldbank.org"
                ))
        
        # ================================================================
        # MATURITY SCORE (Calculated)
        # ================================================================
        if country.maturity_score is not None:
            items.append(SourceRegistryItem(
                country_iso=country.iso_code,
                country_name=country.name,
                metric="Maturity Score",
                value=str(round(country.maturity_score, 2)),
                source_url=None
            ))
    
    response = SourceRegistryResponse(
        total=len(items),
        items=items,
        last_updated=last_updated.isoformat() if last_updated else None
    )
    
    # Cache the response
    _registry_cache = response
    _registry_cache_time = datetime.now()
    
    return response


# =============================================================================
# DATABASE FILL - AI-Enriched Pillar Metrics (Phase 2)
# =============================================================================

def _ensure_fill_agent_exists(db: Session) -> None:
    """Ensure the database-fill-agent exists in the database (lazy seed)."""
    from app.models.agent import Agent, DEFAULT_AGENTS

    agent_id = "database-fill-agent"
    existing = db.query(Agent).filter(Agent.id == agent_id).first()
    if not existing:
        agent_config = next((a for a in DEFAULT_AGENTS if a["id"] == agent_id), None)
        if agent_config:
            agent = Agent(**agent_config)
            db.add(agent)
            db.commit()
            logger.info(f"[ETL] Created '{agent_id}' agent in database (lazy seed)")
        else:
            logger.error(f"[ETL] Could not find '{agent_id}' in DEFAULT_AGENTS!")


class DatabaseFillRequest(BaseModel):
    """Request body for the database fill endpoint."""
    country_filter: Optional[List[str]] = None  # List of ISOs, or None for all 193
    delay_between: float = 2.0  # Seconds between countries (rate limiting)


class DatabaseFillResponse(BaseModel):
    """Response when fill is started."""
    success: bool
    message: str
    total_countries: int
    status: str  # "accepted", "already_running", "error"


class DatabaseFillStatusResponse(BaseModel):
    """Current status of the batch fill operation."""
    status: str  # "idle", "running", "completed"
    total: int = 0
    completed: int = 0
    failed: int = 0
    skipped: int = 0
    current_country: Optional[str] = None
    fields_written: int = 0
    errors: List[Dict[str, Any]] = []
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


@router.post(
    "/fill-database",
    response_model=DatabaseFillResponse,
    summary="Fill Database with AI (Phase 2)",
    description="""
    Start the AI-driven database fill process.
    
    Uses GPT-4o with web search to fill NULL structured pillar fields
    for all countries (or a filtered subset). Processes countries sequentially
    with rate limiting. Admin only.
    
    Poll /fill-status for progress updates.
    """,
)
async def fill_database(
    request: Optional[DatabaseFillRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Start the AI database fill process as a background task."""
    import asyncio
    from app.core.config import settings

    # Ensure the database-fill-agent exists in the DB (lazy seed)
    _ensure_fill_agent_exists(db)

    # Verify AI configuration exists
    from app.models.user import AIConfig
    ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No AI configuration found. Please configure AI settings in Admin > AI Settings first.",
        )
    if not ai_config.api_key_encrypted:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI API key not set for provider {ai_config.provider.value if ai_config.provider else 'Unknown'}. Please add your API key in Admin > AI Settings.",
        )

    # Check if already running
    current_status = get_fill_status()
    if current_status.get("status") == "running":
        return DatabaseFillResponse(
            success=False,
            message="Database fill is already running",
            total_countries=current_status.get("total", 0),
            status="already_running",
        )

    # Determine target countries
    delay_between = 2.0
    if request:
        delay_between = request.delay_between
        if request.country_filter:
            valid_codes = set(UN_MEMBER_STATES)
            invalid = [c for c in request.country_filter if c.upper() not in valid_codes]
            if invalid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid country codes: {', '.join(invalid)}",
                )
            target_countries = [c.upper() for c in request.country_filter]
        else:
            # All countries currently in the database
            db_countries = db.query(Country.iso_code).all()
            target_countries = [c.iso_code for c in db_countries]
    else:
        db_countries = db.query(Country.iso_code).all()
        target_countries = [c.iso_code for c in db_countries]

    if not target_countries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No countries found in database. Run ETL pipeline first.",
        )

    # Reset and start
    reset_fill_status()

    asyncio.create_task(
        run_batch_fill(
            country_isos=target_countries,
            db_url=settings.DATABASE_URL,
            delay_between=delay_between,
        )
    )

    return DatabaseFillResponse(
        success=True,
        message=f"Database fill started for {len(target_countries)} countries",
        total_countries=len(target_countries),
        status="accepted",
    )


@router.get(
    "/fill-status",
    response_model=DatabaseFillStatusResponse,
    summary="Get Database Fill Status",
    description="Poll this endpoint to track the progress of the AI database fill operation.",
)
async def get_database_fill_status():
    """Get the current status of the batch database fill."""
    current = get_fill_status()

    if not current:
        return DatabaseFillStatusResponse(status="idle")

    return DatabaseFillStatusResponse(
        status=current.get("status", "idle"),
        total=current.get("total", 0),
        completed=current.get("completed", 0),
        failed=current.get("failed", 0),
        skipped=current.get("skipped", 0),
        current_country=current.get("current_country"),
        fields_written=current.get("fields_written", 0),
        errors=current.get("errors", []),
        started_at=current.get("started_at"),
        completed_at=current.get("completed_at"),
    )
