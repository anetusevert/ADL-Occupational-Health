"""
GOHIP Platform - Strategic Deep Dive API Endpoints
===================================================

Phase 27: Admin-only endpoints for Strategic Deep Dive feature

All endpoints require admin authentication.
"""

from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Integer

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.country import Country, CountryDeepDive, DeepDiveStatus
from app.services.strategic_deep_dive_agent import (
    generate_strategic_deep_dive,
    get_all_deep_dives,
    get_deep_dive_report,
    get_country_topic_statuses,
)

router = APIRouter(prefix="/strategic-deep-dive", tags=["Strategic Deep Dive"])


# =============================================================================
# ALL 13 ANALYSIS TOPICS
# =============================================================================

ALL_TOPICS = [
    "Comprehensive Occupational Health Assessment",
    # Governance Ecosystem (3 topics)
    "Policy & Regulatory Framework",
    "Inspection & Enforcement Capacity",
    "Tripartite Governance & Social Dialogue",
    # Hazard Prevention (3 topics)
    "Chemical & Carcinogen Exposure Control",
    "Physical Hazards & Ergonomics",
    "Heat Stress & Climate Adaptation",
    # Surveillance & Detection (3 topics)
    "Occupational Disease Surveillance",
    "Workplace Mental Health Programs",
    "Health Screening & Medical Surveillance",
    # Restoration & Compensation (3 topics)
    "Workers' Compensation Systems",
    "Return-to-Work & Rehabilitation",
    "Migrant & Informal Worker Protection",
]

# =============================================================================
# PARALLEL EXECUTION CONFIGURATION
# =============================================================================

# Maximum concurrent report generations (reduced to avoid API rate limits)
# With 2 concurrent + throttling, we stay well under typical RPM limits
MAX_CONCURRENT_GENERATIONS = 2

# Delay between batches to avoid rate limit bursts (seconds)
THROTTLE_DELAY_SECONDS = 3

# European countries (44)
EU_COUNTRIES = [
    "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK",
    "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA",
    "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR",
    "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE",
    "CHE", "UKR", "GBR", "VAT"
]

# GCC countries (6)
GCC_COUNTRIES = ["BHR", "KWT", "OMN", "QAT", "SAU", "ARE"]


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class GenerateDeepDiveRequest(BaseModel):
    """Request to generate a deep dive for a country."""
    iso_code: str = Field(..., min_length=3, max_length=3, description="ISO 3166-1 alpha-3 code")
    topic: str = Field(
        default="Comprehensive Occupational Health Assessment",
        description="Analysis focus topic"
    )


class GenerateBatchRequest(BaseModel):
    """Request to generate deep dives for multiple countries."""
    iso_codes: List[str] = Field(..., min_items=1, description="List of ISO codes")
    topic: str = Field(
        default="Comprehensive Occupational Health Assessment",
        description="Analysis focus topic"
    )


class DeepDiveSummary(BaseModel):
    """Summary of a deep dive record."""
    iso_code: str
    country_name: str
    status: str
    strategy_name: Optional[str] = None
    generated_at: Optional[str] = None
    has_report: bool = False


class KeyFinding(BaseModel):
    title: str
    description: str
    impact_level: str


class SWOTItem(BaseModel):
    title: str
    description: str


class Recommendation(BaseModel):
    title: str
    description: str
    priority: str
    timeline: str


class ActionItem(BaseModel):
    action: str
    responsible_party: str
    timeline: str


class BenchmarkCountry(BaseModel):
    iso_code: str
    name: str
    reason: str


class DeepDiveReport(BaseModel):
    """Full deep dive report."""
    iso_code: str
    topic: str = "Comprehensive Occupational Health Assessment"
    country_name: Optional[str] = None
    status: str
    strategy_name: Optional[str] = None
    executive_summary: Optional[str] = None
    strategic_narrative: Optional[str] = None
    health_profile: Optional[str] = None
    workforce_insights: Optional[str] = None
    key_findings: List[dict] = []
    strengths: List[dict] = []
    weaknesses: List[dict] = []
    opportunities: List[dict] = []
    threats: List[dict] = []
    strategic_recommendations: List[dict] = []
    action_items: List[dict] = []
    priority_interventions: List[str] = []
    peer_comparison: Optional[str] = None
    global_ranking_context: Optional[str] = None
    benchmark_countries: List[dict] = []
    data_sources_used: List[str] = []
    external_research_summary: Optional[str] = None
    data_quality_notes: Optional[str] = None
    ai_provider: Optional[str] = None
    generated_at: Optional[str] = None
    updated_at: Optional[str] = None


class CountryListItem(BaseModel):
    """Country item for the selection list."""
    iso_code: str
    name: str
    flag_url: Optional[str] = None
    has_deep_dive: bool = False
    deep_dive_status: Optional[str] = None
    strategy_name: Optional[str] = None
    generated_at: Optional[str] = None
    completed_reports: int = 0  # Number of completed topic reports (out of 13)


class AllCountriesResponse(BaseModel):
    """Response with all countries and their deep dive status."""
    countries: List[CountryListItem]
    total_count: int
    with_deep_dive: int
    pending: int
    processing: int
    completed: int
    failed: int


class TopicOption(BaseModel):
    """Analysis topic option."""
    id: str
    name: str
    description: str


class TopicsResponse(BaseModel):
    """Response with available topics."""
    topics: List[TopicOption]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/topics", response_model=TopicsResponse)
async def get_analysis_topics(
    current_user: User = Depends(get_current_admin_user),
):
    """Get available analysis topics for deep dive."""
    topics = [
        TopicOption(
            id="comprehensive",
            name="Comprehensive Occupational Health Assessment",
            description="Full analysis of all occupational health pillars and governance"
        ),
        TopicOption(
            id="rehabilitation",
            name="Rehabilitation & Return-to-Work",
            description="Focus on rehabilitation infrastructure, RTW programs, and recovery outcomes"
        ),
        TopicOption(
            id="hazard",
            name="Hazard Control & Prevention",
            description="Analysis of hazard identification, control measures, and safety enforcement"
        ),
        TopicOption(
            id="surveillance",
            name="Health Surveillance Systems",
            description="Assessment of disease surveillance, early detection, and reporting mechanisms"
        ),
        TopicOption(
            id="governance",
            name="Policy & Governance Framework",
            description="Review of regulatory framework, enforcement capacity, and ILO compliance"
        ),
        TopicOption(
            id="compensation",
            name="Compensation & Social Protection",
            description="Analysis of workers' compensation systems and social safety nets"
        ),
        TopicOption(
            id="mental-health",
            name="Workplace Mental Health",
            description="Evaluation of mental health policies, programs, and support systems"
        ),
        TopicOption(
            id="heat-stress",
            name="Heat Stress & Climate Adaptation",
            description="Assessment of heat stress regulations and climate adaptation strategies"
        ),
        TopicOption(
            id="migrant",
            name="Migrant Worker Protection",
            description="Review of protections and coverage for migrant workforce populations"
        ),
    ]
    return TopicsResponse(topics=topics)


@router.get("/countries", response_model=AllCountriesResponse)
async def get_all_countries_with_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get all countries with their deep dive status."""
    from collections import defaultdict
    
    # Get all countries
    countries = db.query(Country).order_by(Country.name).all()
    
    # Get all deep dives and group by country
    deep_dives = db.query(CountryDeepDive).all()
    
    # Group deep dives by country ISO code
    country_deep_dives: dict = defaultdict(list)
    for dd in deep_dives:
        country_deep_dives[dd.country_iso_code].append(dd)
    
    # Build response
    country_list = []
    stats = {"pending": 0, "processing": 0, "completed": 0, "failed": 0}
    total_with_reports = 0
    
    for country in countries:
        dds = country_deep_dives.get(country.iso_code, [])
        
        # Count completed reports for this country
        completed_count = sum(1 for dd in dds if dd.status == DeepDiveStatus.COMPLETED)
        pending_count = sum(1 for dd in dds if dd.status == DeepDiveStatus.PENDING)
        processing_count = sum(1 for dd in dds if dd.status == DeepDiveStatus.PROCESSING)
        failed_count = sum(1 for dd in dds if dd.status == DeepDiveStatus.FAILED)
        
        # Determine overall status for this country
        # Priority: processing > pending > completed > failed > none
        if processing_count > 0:
            overall_status = "processing"
        elif pending_count > 0:
            overall_status = "pending"
        elif completed_count > 0:
            overall_status = "completed"
        elif failed_count > 0:
            overall_status = "failed"
        else:
            overall_status = None
        
        # Get the most recent completed deep dive for metadata
        completed_dds = [dd for dd in dds if dd.status == DeepDiveStatus.COMPLETED]
        latest_dd = max(completed_dds, key=lambda d: d.generated_at or d.updated_at or d.created_at) if completed_dds else None
        
        item = CountryListItem(
            iso_code=country.iso_code,
            name=country.name,
            flag_url=country.flag_url,
            has_deep_dive=completed_count > 0,  # Only true if at least one COMPLETED report
            deep_dive_status=overall_status,
            strategy_name=latest_dd.strategy_name if latest_dd else None,
            generated_at=latest_dd.generated_at.isoformat() if latest_dd and latest_dd.generated_at else None,
            completed_reports=completed_count,
        )
        country_list.append(item)
        
        # Update global stats (count reports, not countries)
        stats["pending"] += pending_count
        stats["processing"] += processing_count
        stats["completed"] += completed_count
        stats["failed"] += failed_count
        
        if completed_count > 0:
            total_with_reports += 1
    
    return AllCountriesResponse(
        countries=country_list,
        total_count=len(country_list),
        with_deep_dive=total_with_reports,  # Countries with at least one completed report
        **stats,
    )


@router.get("/{iso_code}", response_model=DeepDiveReport)
async def get_country_deep_dive(
    iso_code: str,
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get the deep dive report for a specific country and topic.
    
    If topic is not specified, returns the first available report.
    """
    report = get_deep_dive_report(iso_code.upper(), db, topic)
    
    if not report:
        topic_msg = f" for topic '{topic}'" if topic else ""
        raise HTTPException(
            status_code=404,
            detail=f"No deep dive report found for {iso_code}{topic_msg}"
        )
    
    return report


class TopicStatusItem(BaseModel):
    """Status of a specific topic for a country."""
    topic: str
    status: str
    strategy_name: Optional[str] = None
    generated_at: Optional[str] = None
    has_report: bool = False


class CountryTopicStatusesResponse(BaseModel):
    """Response with all topic statuses for a country."""
    iso_code: str
    topics: List[TopicStatusItem]


@router.get("/{iso_code}/topics", response_model=CountryTopicStatusesResponse)
async def get_country_topic_statuses_endpoint(
    iso_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get the status of all topics for a specific country."""
    # #region agent log
    import time; _start = time.time()
    with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:get_topics","message":"Endpoint called","data":{"iso_code":"'+iso_code+'"},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"D"}\n')
    # #endregion
    
    topic_statuses = get_country_topic_statuses(iso_code.upper(), db)
    
    # #region agent log
    with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:get_topics","message":"DB query done","data":{"iso_code":"'+iso_code+'","elapsed_ms":'+str(int((time.time()-_start)*1000))+',"topic_count":'+str(len(topic_statuses))+'},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"D"}\n')
    # #endregion
    
    topics_list = [
        TopicStatusItem(
            topic=topic,
            status=info["status"],
            strategy_name=info["strategy_name"],
            generated_at=info["generated_at"],
            has_report=info["has_report"],
        )
        for topic, info in topic_statuses.items()
    ]
    
    return CountryTopicStatusesResponse(
        iso_code=iso_code.upper(),
        topics=topics_list,
    )


@router.post("/{iso_code}/generate")
async def generate_country_deep_dive(
    iso_code: str,
    request: GenerateDeepDiveRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Generate a deep dive report for a specific country."""
    # Verify country exists
    country = db.query(Country).filter(
        Country.iso_code == iso_code.upper()
    ).first()
    
    if not country:
        raise HTTPException(
            status_code=404,
            detail=f"Country {iso_code} not found in database"
        )
    
    topic = request.topic if request else "Comprehensive Occupational Health Assessment"
    
    result = generate_strategic_deep_dive(
        iso_code=iso_code.upper(),
        topic=topic,
        db=db,
        user_id=str(current_user.id),
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Deep dive generation failed")
        )
    
    return result


class GenerateAllTopicsResponse(BaseModel):
    """Response for generate all topics endpoint (async version)."""
    success: bool
    message: str
    iso_code: str
    country_name: str
    topics_queued: int


def _generate_single_topic_task(iso_code: str, topic: str, user_id: str):
    """
    Background task wrapper for generating a single topic report.
    
    Creates a fresh database session since background tasks run outside
    the request context.
    """
    import logging
    import time
    from app.core.database import SessionLocal
    
    logger = logging.getLogger(__name__)
    
    # #region agent log
    _start = time.time()
    with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:background_task","message":"Task STARTING","data":{"iso_code":"'+iso_code+'","topic":"'+topic.replace('"','\\"')+'"},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"F"}\n')
    # #endregion
    
    logger.info(f"[BackgroundTask] Starting generation: {iso_code} - {topic}")
    
    db = SessionLocal()
    try:
        result = generate_strategic_deep_dive(
            iso_code=iso_code,
            topic=topic,
            db=db,
            user_id=user_id,
        )
        if result.get("success"):
            # #region agent log
            with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:background_task","message":"Task COMPLETED","data":{"iso_code":"'+iso_code+'","topic":"'+topic.replace('"','\\"')+'","elapsed_s":'+str(int(time.time()-_start))+'},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"F"}\n')
            # #endregion
            logger.info(f"[BackgroundTask] Completed: {iso_code} - {topic}")
        else:
            # #region agent log
            error_msg = str(result.get('error', 'Unknown')).replace('"', '\\"').replace('\n', ' ')[:200]
            with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:background_task","message":"Task FAILED","data":{"iso_code":"'+iso_code+'","topic":"'+topic.replace('"','\\"')+'","error":"'+error_msg+'"},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"F"}\n')
            # #endregion
            logger.error(f"[BackgroundTask] Failed: {iso_code} - {topic}: {result.get('error')}")
    except Exception as e:
        # #region agent log
        error_msg = str(e).replace('"', '\\"').replace('\n', ' ')[:200]
        with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:background_task","message":"Task EXCEPTION","data":{"iso_code":"'+iso_code+'","topic":"'+topic.replace('"','\\"')+'","error":"'+error_msg+'"},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"F"}\n')
        # #endregion
        logger.error(f"[BackgroundTask] Exception: {iso_code} - {topic}: {str(e)}")
    finally:
        db.close()


def _generate_all_topics_parallel(iso_code: str, topics: List[str], user_id: str):
    """
    Execute multiple topic generations in parallel with controlled concurrency.
    
    Uses ThreadPoolExecutor to run up to MAX_CONCURRENT_GENERATIONS tasks
    simultaneously, while ensuring each task has its own database session.
    
    Includes throttling between batches to avoid API rate limits.
    
    This is faster than sequential generation while staying under rate limits:
    - Sequential: ~2 min/report = ~26 min for 13 topics
    - Parallel (2) with throttle: ~2.5 min/report = ~16 min for 13 topics
    """
    import time
    
    logger = logging.getLogger(__name__)
    logger.info(f"[ParallelGen] Starting parallel generation for {iso_code}: {len(topics)} topics (max {MAX_CONCURRENT_GENERATIONS} concurrent, {THROTTLE_DELAY_SECONDS}s throttle)")
    
    completed = 0
    failed = 0
    
    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT_GENERATIONS) as executor:
        # Submit all tasks to the executor
        future_to_topic = {
            executor.submit(_generate_single_topic_task, iso_code, topic, user_id): topic
            for topic in topics
        }
        
        # Process completions as they finish
        for future in as_completed(future_to_topic):
            topic = future_to_topic[future]
            try:
                future.result()  # This will raise if task failed
                completed += 1
                logger.info(f"[ParallelGen] Completed {completed}/{len(topics)}: {iso_code} - {topic}")
            except Exception as e:
                failed += 1
                logger.error(f"[ParallelGen] Failed {iso_code} - {topic}: {e}")
            
            # Throttle between task completions to avoid rate limit bursts
            if completed + failed < len(topics):
                logger.debug(f"[ParallelGen] Throttling for {THROTTLE_DELAY_SECONDS}s...")
                time.sleep(THROTTLE_DELAY_SECONDS)
    
    logger.info(f"[ParallelGen] Finished {iso_code}: {completed} completed, {failed} failed out of {len(topics)} topics")


# =============================================================================
# BATCH COUNTRIES ENDPOINT (must be before /{iso_code} routes for correct matching)
# =============================================================================

class BatchCountriesRequest(BaseModel):
    """Request to generate all topics for multiple countries."""
    iso_codes: List[str] = Field(..., min_items=1, description="List of ISO codes")


class BatchCountriesResponse(BaseModel):
    """Response for batch countries generation."""
    success: bool
    message: str
    countries_queued: int
    total_reports: int
    valid_countries: List[str]
    invalid_countries: List[str]


@router.post("/batch-countries/generate-all", response_model=BatchCountriesResponse)
async def generate_all_for_multiple_countries(
    request: BatchCountriesRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Generate all 13 topic reports for multiple countries.
    
    This is the fastest way to generate reports for many countries:
    - Each country's 13 topics run in parallel (max 3 concurrent)
    - Multiple countries are processed sequentially to avoid overwhelming the API
    
    Example: Generate for all EU + GCC countries (50 countries x 13 topics = 650 reports)
    """
    logger = logging.getLogger(__name__)
    
    valid_codes = []
    invalid_codes = []
    
    # Validate all ISO codes
    for iso_code in request.iso_codes:
        country = db.query(Country).filter(
            Country.iso_code == iso_code.upper()
        ).first()
        if country:
            valid_codes.append(iso_code.upper())
        else:
            invalid_codes.append(iso_code.upper())
    
    if not valid_codes:
        raise HTTPException(
            status_code=400,
            detail=f"No valid country codes provided. Invalid: {invalid_codes}"
        )
    
    logger.info(f"[BatchCountries] Queuing {len(valid_codes)} countries for parallel generation")
    
    # Queue each country's parallel generation as a separate background task
    for iso_code in valid_codes:
        background_tasks.add_task(
            _generate_all_topics_parallel,
            iso_code=iso_code,
            topics=ALL_TOPICS,
            user_id=str(current_user.id),
        )
    
    total_reports = len(valid_codes) * len(ALL_TOPICS)
    
    return BatchCountriesResponse(
        success=True,
        message=f"Queued {len(valid_codes)} countries for parallel generation ({total_reports} total reports). Each country runs {MAX_CONCURRENT_GENERATIONS} topics concurrently.",
        countries_queued=len(valid_codes),
        total_reports=total_reports,
        valid_countries=valid_codes,
        invalid_countries=invalid_codes,
    )


# =============================================================================
# PROGRESS MONITORING ENDPOINTS
# =============================================================================

class CountryProgress(BaseModel):
    """Progress for a single country."""
    iso_code: str
    name: str
    completed: int
    failed: int
    pending: int
    total: int = 13
    percent_complete: float


class GlobalProgressResponse(BaseModel):
    """Global progress across all countries."""
    total_countries: int
    total_reports: int
    completed_reports: int
    failed_reports: int
    pending_reports: int
    percent_complete: float
    countries: List[CountryProgress]
    eu_progress: dict
    gcc_progress: dict


@router.get("/progress/global", response_model=GlobalProgressResponse)
async def get_global_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get global progress for all report generation.
    
    Shows overall progress and per-country breakdown for EU and GCC countries.
    """
    from sqlalchemy import func
    
    # Get all deep dives grouped by country
    countries_data = db.query(
        CountryDeepDive.country_iso_code,
        func.count().label('total'),
        func.sum(func.cast(CountryDeepDive.status == DeepDiveStatus.COMPLETED, Integer)).label('completed'),
        func.sum(func.cast(CountryDeepDive.status == DeepDiveStatus.FAILED, Integer)).label('failed'),
    ).group_by(CountryDeepDive.country_iso_code).all()
    
    countries_progress = []
    total_completed = 0
    total_failed = 0
    total_pending = 0
    
    for row in countries_data:
        country = db.query(Country).filter(Country.iso_code == row.country_iso_code).first()
        completed = row.completed or 0
        failed = row.failed or 0
        total = row.total or 0
        pending = total - completed - failed
        
        total_completed += completed
        total_failed += failed
        total_pending += pending
        
        countries_progress.append(CountryProgress(
            iso_code=row.country_iso_code,
            name=country.name if country else row.country_iso_code,
            completed=completed,
            failed=failed,
            pending=pending,
            total=13,
            percent_complete=round((completed / 13) * 100, 1) if completed else 0,
        ))
    
    # Sort by completion percentage (descending)
    countries_progress.sort(key=lambda x: x.percent_complete, reverse=True)
    
    # Calculate EU/GCC specific progress
    eu_completed = sum(c.completed for c in countries_progress if c.iso_code in EU_COUNTRIES)
    eu_total = len([c for c in countries_progress if c.iso_code in EU_COUNTRIES]) * 13
    
    gcc_completed = sum(c.completed for c in countries_progress if c.iso_code in GCC_COUNTRIES)
    gcc_total = len([c for c in countries_progress if c.iso_code in GCC_COUNTRIES]) * 13
    
    total_reports = len(countries_progress) * 13
    percent_complete = round((total_completed / total_reports) * 100, 1) if total_reports else 0
    
    return GlobalProgressResponse(
        total_countries=len(countries_progress),
        total_reports=total_reports,
        completed_reports=total_completed,
        failed_reports=total_failed,
        pending_reports=total_pending,
        percent_complete=percent_complete,
        countries=countries_progress,
        eu_progress={
            "completed": eu_completed,
            "total": eu_total,
            "percent": round((eu_completed / eu_total) * 100, 1) if eu_total else 0,
        },
        gcc_progress={
            "completed": gcc_completed,
            "total": gcc_total,
            "percent": round((gcc_completed / gcc_total) * 100, 1) if gcc_total else 0,
        },
    )


# =============================================================================
# SINGLE COUNTRY ENDPOINTS
# =============================================================================

@router.post("/{iso_code}/generate-all", response_model=GenerateAllTopicsResponse)
async def generate_all_topics_for_country(
    iso_code: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Queue all 13 topic reports for a single country.
    
    This generates reports for:
    - 1 Comprehensive Assessment
    - 3 Governance topics
    - 3 Hazard Prevention topics
    - 3 Surveillance topics
    - 3 Restoration topics
    
    Reports are queued for background generation and this endpoint
    returns immediately. Use GET /{iso_code}/topics to poll for
    completion status.
    """
    # #region agent log
    import time; _start = time.time()
    with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:generate-all","message":"Endpoint called","data":{"iso_code":"'+iso_code+'"},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"B"}\n')
    # #endregion
    
    # Verify country exists
    country = db.query(Country).filter(
        Country.iso_code == iso_code.upper()
    ).first()
    
    if not country:
        raise HTTPException(
            status_code=404,
            detail=f"Country {iso_code} not found in database"
        )
    
    # Queue parallel generation as a single background task
    # This uses ThreadPoolExecutor to run up to MAX_CONCURRENT_GENERATIONS
    # tasks simultaneously, which is ~3x faster than sequential
    background_tasks.add_task(
        _generate_all_topics_parallel,
        iso_code=iso_code.upper(),
        topics=ALL_TOPICS,
        user_id=str(current_user.id),
    )
    
    # #region agent log
    with open(r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log", "a") as f: f.write('{"location":"strategic_deep_dive.py:generate-all","message":"Parallel tasks queued","data":{"iso_code":"'+iso_code+'","elapsed_ms":'+str(int((time.time()-_start)*1000))+',"tasks_queued":'+str(len(ALL_TOPICS))+',"max_concurrent":'+str(MAX_CONCURRENT_GENERATIONS)+'},"timestamp":'+str(int(time.time()*1000))+',"sessionId":"debug-session","hypothesisId":"B"}\n')
    # #endregion
    
    return GenerateAllTopicsResponse(
        success=True,
        message=f"Queued all {len(ALL_TOPICS)} topics for {country.name} (parallel: max {MAX_CONCURRENT_GENERATIONS} concurrent). Use GET /{iso_code.upper()}/topics to check progress.",
        iso_code=iso_code.upper(),
        country_name=country.name,
        topics_queued=len(ALL_TOPICS),
    )


@router.post("/generate-batch")
async def generate_batch_deep_dives(
    request: GenerateBatchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Queue deep dive generation for multiple countries.
    
    This runs in the background and returns immediately.
    """
    valid_codes = []
    
    # Validate all ISO codes
    for iso_code in request.iso_codes:
        country = db.query(Country).filter(
            Country.iso_code == iso_code.upper()
        ).first()
        if country:
            valid_codes.append(iso_code.upper())
    
    if not valid_codes:
        raise HTTPException(
            status_code=400,
            detail="No valid country codes provided"
        )
    
    # Mark countries as processing for the specified topic
    for iso_code in valid_codes:
        from app.services.strategic_deep_dive_agent import StrategicDeepDiveAgent
        agent = StrategicDeepDiveAgent(db)
        deep_dive = agent._get_or_create_deep_dive(iso_code, request.topic)
        deep_dive.status = DeepDiveStatus.PENDING
    db.commit()
    
    return {
        "success": True,
        "message": f"Queued {len(valid_codes)} countries for deep dive generation",
        "queued_countries": valid_codes,
        "topic": request.topic,
    }


@router.delete("/{iso_code}")
async def delete_country_deep_dive(
    iso_code: str,
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Delete a deep dive report for a specific country.
    
    If topic is specified, only deletes that specific topic's report.
    If topic is not specified, deletes ALL reports for the country.
    """
    query = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code.upper()
    )
    
    if topic:
        query = query.filter(CountryDeepDive.topic == topic)
    
    deep_dives = query.all()
    
    if not deep_dives:
        topic_msg = f" for topic '{topic}'" if topic else ""
        raise HTTPException(
            status_code=404,
            detail=f"No deep dive found for {iso_code}{topic_msg}"
        )
    
    count = len(deep_dives)
    for dd in deep_dives:
        db.delete(dd)
    db.commit()
    
    topic_msg = f" topic '{topic}'" if topic else f" ({count} report(s))"
    return {
        "success": True,
        "message": f"Deep dive for {iso_code}{topic_msg} deleted successfully",
        "deleted_count": count
    }
