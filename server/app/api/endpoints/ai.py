"""
GOHIP Platform - AI Deep Dive API Endpoints
============================================

Phase 25: Multi-Agent AI Orchestration Endpoints
Phase 26: Country Assessment & Metric Explanations

Exposes endpoints for:
- Deep Dive strategic analysis
- Country assessment generation (using agent prompts)
- Pillar metric explanations (admin only)
"""

from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin_user
from app.services.ai_orchestrator import run_deep_dive_analysis
from app.models.country import Country
from app.models.user import User, AIConfig, AIProvider

# Create router
router = APIRouter(prefix="/ai", tags=["AI Analysis"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class DeepDiveRequest(BaseModel):
    """Request schema for Deep Dive analysis."""
    iso_code: str = Field(
        ...,
        description="ISO 3166-1 alpha-3 country code (e.g., DEU, SAU, IDN)",
        min_length=3,
        max_length=3,
    )
    topic: str = Field(
        default="occupational health strategy",
        description="Specific topic to analyze (e.g., 'rehabilitation centers', 'hazard control')",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "iso_code": "IDN",
                "topic": "rehabilitation centers"
            }
        }


class AgentLogEntry(BaseModel):
    """Agent activity log entry."""
    timestamp: str
    agent: str
    status: str
    message: str
    emoji: str


class SWOTAnalysisSchema(BaseModel):
    """SWOT analysis structure."""
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


class DeepDiveResponse(BaseModel):
    """Response schema for Deep Dive analysis."""
    success: bool
    strategy_name: Optional[str] = None
    country_name: Optional[str] = None
    iso_code: Optional[str] = None
    topic: Optional[str] = None
    key_findings: Optional[List[str]] = None
    swot_analysis: Optional[SWOTAnalysisSchema] = None
    recommendation: Optional[str] = None
    executive_summary: Optional[str] = None
    agent_log: List[AgentLogEntry] = []
    generated_at: Optional[str] = None
    source: Optional[str] = None  # "openai" or "mock"
    error: Optional[str] = None

    class Config:
        from_attributes = True


class DeepDiveTopicsResponse(BaseModel):
    """Response with suggested topics."""
    topics: List[dict]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/deep-dive",
    response_model=DeepDiveResponse,
    summary="Run Deep Dive Strategic Analysis",
    description="""
    Execute a comprehensive Deep Dive analysis for a specific country and topic.
    
    This endpoint leverages a Multi-Agent AI Orchestration system:
    1. **DataAgent**: Queries internal GOHIP database for country metrics
    2. **ResearchAgent**: Searches web for qualitative policy information
    3. **Orchestrator**: Synthesizes both into strategic intelligence
    
    The analysis includes:
    - A compelling strategy name
    - Key findings (5-7 bullet points)
    - Complete SWOT analysis
    - Strategic recommendation
    - Executive summary
    - Full agent activity log
    
    Typical processing time: 5-15 seconds depending on API availability.
    """
)
async def run_deep_dive(
    request: DeepDiveRequest,
    db: Session = Depends(get_db)
) -> DeepDiveResponse:
    """
    Run a Deep Dive strategic analysis for a country.
    
    Args:
        request: DeepDiveRequest with iso_code and topic
        db: Database session (injected)
        
    Returns:
        DeepDiveResponse with complete analysis
    """
    # Normalize ISO code
    iso_code = request.iso_code.upper()
    
    # Validate ISO code format
    if not iso_code.isalpha() or len(iso_code) != 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISO code format: '{iso_code}'. Must be 3-letter alpha code."
        )
    
    # Run the analysis
    result = run_deep_dive_analysis(
        iso_code=iso_code,
        topic=request.topic,
        db=db,
    )
    
    # Check for errors
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", "Analysis failed")
        )
    
    return DeepDiveResponse(**result)


@router.get(
    "/deep-dive/topics",
    response_model=DeepDiveTopicsResponse,
    summary="Get Suggested Analysis Topics",
    description="Returns a list of suggested topics for Deep Dive analysis."
)
async def get_deep_dive_topics() -> DeepDiveTopicsResponse:
    """
    Get a list of suggested Deep Dive analysis topics.
    
    Returns:
        List of topic suggestions with descriptions
    """
    topics = [
        {
            "id": "rehabilitation",
            "name": "Rehabilitation & Return-to-Work",
            "description": "Analyze rehabilitation infrastructure, RTW programs, and recovery outcomes",
            "keywords": ["rehabilitation", "return-to-work", "recovery", "reintegration"],
        },
        {
            "id": "hazard_control",
            "name": "Hazard Control & Prevention",
            "description": "Evaluate hazard identification, control measures, and safety enforcement",
            "keywords": ["hazard", "safety", "prevention", "fatal accidents"],
        },
        {
            "id": "surveillance",
            "name": "Health Surveillance Systems",
            "description": "Assess disease surveillance, early detection, and reporting mechanisms",
            "keywords": ["surveillance", "detection", "monitoring", "reporting"],
        },
        {
            "id": "governance",
            "name": "Policy & Governance Framework",
            "description": "Review regulatory framework, enforcement capacity, and ILO compliance",
            "keywords": ["governance", "policy", "regulation", "ILO", "enforcement"],
        },
        {
            "id": "compensation",
            "name": "Compensation & Social Protection",
            "description": "Analyze workers' compensation systems and social safety nets",
            "keywords": ["compensation", "insurance", "social protection", "benefits"],
        },
        {
            "id": "mental_health",
            "name": "Workplace Mental Health",
            "description": "Evaluate mental health policies, programs, and support systems",
            "keywords": ["mental health", "psychosocial", "stress", "wellbeing"],
        },
        {
            "id": "heat_stress",
            "name": "Heat Stress & Climate Adaptation",
            "description": "Assess heat stress regulations and climate adaptation strategies",
            "keywords": ["heat stress", "climate", "temperature", "outdoor work"],
        },
        {
            "id": "migrant_workers",
            "name": "Migrant Worker Protection",
            "description": "Review protections and coverage for migrant workforce populations",
            "keywords": ["migrant", "foreign worker", "labor mobility", "coverage"],
        },
    ]
    
    return DeepDiveTopicsResponse(topics=topics)


@router.get(
    "/health",
    summary="AI Service Health Check",
    description="Check the health status of the AI orchestration service."
)
async def ai_health_check():
    """
    Health check endpoint for AI services.
    
    Returns:
        Service status and configuration info
    """
    from app.core.config import settings
    
    return {
        "status": "active",
        "service": "AI Orchestration Layer",
        "version": "1.0.0",
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "agents": [
            {"name": "DataAgent", "status": "ready"},
            {"name": "ResearchAgent", "status": "ready"},
            {"name": "Orchestrator", "status": "ready"},
        ],
    }


# =============================================================================
# COUNTRY ASSESSMENT ENDPOINTS (Phase 26)
# =============================================================================

class CountryAssessmentResponse(BaseModel):
    """Response schema for country assessment generation."""
    success: bool
    iso_code: str
    country_name: Optional[str] = None
    assessment: Optional[str] = None
    source: Optional[str] = None  # "openai", "anthropic", "google", etc.
    error: Optional[str] = None
    generated_at: Optional[str] = None

    class Config:
        from_attributes = True


class PillarExplanationRequest(BaseModel):
    """Request schema for pillar metric explanations."""
    pillar_id: str = Field(
        ...,
        description="Pillar identifier: 'governance', 'pillar1', 'pillar2', or 'pillar3'"
    )
    force_regenerate: bool = Field(
        default=False,
        description="Force regeneration even if explanation exists"
    )


class MetricExplanation(BaseModel):
    """Single metric explanation."""
    metric_name: str
    metric_value: Optional[str] = None
    value: Optional[str] = None  # Alias for metric_value (backwards compat)
    explanation: str
    performance_analysis: Optional[str] = None
    performance_rating: Optional[str] = "moderate"
    perspective: Optional[str] = None  # Alias for performance_rating (backwards compat)
    percentile_rank: Optional[float] = None
    global_average: Optional[float] = None
    comparison_data: Optional[dict] = None
    benchmark_comparison: Optional[str] = None  # Deprecated, kept for compat


class PillarExplanationResponse(BaseModel):
    """Response schema for pillar metric explanations."""
    success: bool
    iso_code: str
    country_name: str
    pillar_id: str
    pillar_name: str
    explanations: List[MetricExplanation] = []
    overall_perspective: Optional[str] = None
    generated_at: Optional[str] = None
    source: Optional[str] = None
    error: Optional[str] = None


@router.post(
    "/country-assessment/{iso_code}/generate",
    response_model=CountryAssessmentResponse,
    summary="Generate Country Strategic Assessment",
    description="""
    Generate a comprehensive AI-powered country strategic assessment using the 
    Report Generation Agent from the AI Orchestration Layer.
    
    This endpoint uses the unified AgentRunner system with automatic database 
    context injection.
    
    The assessment includes:
    - Framework maturity stage classification
    - Critical strengths and gaps analysis
    - Global benchmark comparisons
    - Actionable priority recommendations
    
    Requires authentication.
    """
)
async def generate_country_assessment(
    iso_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> CountryAssessmentResponse:
    """
    Generate a comprehensive country assessment using the Report Generation Agent.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        db: Database session
        current_user: Authenticated user
        
    Returns:
        CountryAssessmentResponse with assessment text
    """
    import logging
    from app.services.agent_runner import AgentRunner
    
    logger = logging.getLogger(__name__)
    
    # Normalize ISO code
    iso_code = iso_code.upper()
    
    # Validate ISO code format
    if not iso_code.isalpha() or len(iso_code) != 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISO code format: '{iso_code}'. Must be 3-letter alpha code."
        )
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with ISO code '{iso_code}' not found"
        )
    
    try:
        # Use the Report Generation Agent via AgentRunner
        runner = AgentRunner(db)
        result = await runner.run(
            agent_id="report-generation",
            variables={
                "ISO_CODE": iso_code,
                "TOPIC": "Comprehensive Strategic Assessment",
            },
            update_stats=True,
        )
        
        if result.get("success"):
            return CountryAssessmentResponse(
                success=True,
                iso_code=iso_code,
                country_name=country.name,
                assessment=result.get("output"),
                source="report-generation-agent",
                generated_at=datetime.utcnow().isoformat(),
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Assessment generation failed")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report Generation Agent failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assessment generation failed: {str(e)}"
        )


@router.get(
    "/metric-explanations/{iso_code}/{pillar_id}",
    response_model=PillarExplanationResponse,
    summary="Get Stored Metric Explanations",
    description="""
    Retrieve permanently stored metric explanations for a pillar.
    
    These explanations are generated by admins and stored in the database.
    Available to all authenticated users.
    """
)
async def get_metric_explanations(
    iso_code: str,
    pillar_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PillarExplanationResponse:
    """
    Get stored metric explanations for a pillar.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        pillar_id: governance, pillar1, pillar2, or pillar3
        
    Returns:
        PillarExplanationResponse with stored explanations
    """
    from app.services.metric_explanation_agent import get_stored_explanations, PILLAR_NAMES
    
    iso_code = iso_code.upper()
    pillar_id = pillar_id.lower()
    
    # Validate pillar ID
    valid_pillars = ["governance", "pillar1", "pillar2", "pillar3"]
    if pillar_id not in valid_pillars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pillar_id: '{pillar_id}'"
        )
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with ISO code '{iso_code}' not found"
        )
    
    # Get stored explanations
    explanations = get_stored_explanations(iso_code, pillar_id, db)
    
    return PillarExplanationResponse(
        success=True,
        iso_code=iso_code,
        country_name=country.name,
        pillar_id=pillar_id,
        pillar_name=PILLAR_NAMES.get(pillar_id, pillar_id),
        explanations=[MetricExplanation(**exp) for exp in explanations],
        generated_at=datetime.utcnow().isoformat() if explanations else None,
        source="stored"
    )


@router.post(
    "/metric-explanations/{iso_code}/{pillar_id}/generate",
    response_model=PillarExplanationResponse,
    summary="Generate and Store Metric Explanations (Admin Only)",
    description="""
    Generate AI-powered explanations for each metric in a pillar and store permanently.
    
    Uses the dedicated Metric Explanation Agent with a focused prompt for:
    - What each metric measures and why it matters
    - How the country performs relative to global benchmarks
    - Visual comparison data for charts
    
    Admin only. Stored permanently for all users to view.
    """
)
async def generate_pillar_explanations(
    iso_code: str,
    pillar_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
) -> PillarExplanationResponse:
    """
    Generate and store metric explanations using the dedicated Metric Explanation Agent.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        pillar_id: governance, pillar1, pillar2, or pillar3
        db: Database session
        admin_user: Admin user (required)
        
    Returns:
        PillarExplanationResponse with generated explanations
    """
    from app.services.metric_explanation_agent import generate_and_store_explanations, PILLAR_NAMES
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Normalize
    iso_code = iso_code.upper()
    pillar_id = pillar_id.lower()
    
    # Validate pillar ID
    valid_pillars = ["governance", "pillar1", "pillar2", "pillar3"]
    if pillar_id not in valid_pillars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pillar_id: '{pillar_id}'. Must be one of: {valid_pillars}"
        )
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with ISO code '{iso_code}' not found"
        )
    
    try:
        # Generate and store explanations using the dedicated agent
        results = generate_and_store_explanations(iso_code, pillar_id, db, admin_user)
        
        return PillarExplanationResponse(
            success=True,
            iso_code=iso_code,
            country_name=country.name,
            pillar_id=pillar_id,
            pillar_name=PILLAR_NAMES.get(pillar_id, pillar_id),
            explanations=[MetricExplanation(**r) for r in results],
            generated_at=datetime.utcnow().isoformat(),
            source="metric_explanation_agent"
        )
    except Exception as e:
        logger.error(f"Metric explanation generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explanations: {str(e)}"
        )
