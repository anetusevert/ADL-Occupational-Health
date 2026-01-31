"""
GOHIP Platform - Policy Simulator API Endpoints
================================================

Sovereign Health: The Occupational Health Strategy Game

Endpoints for:
- Country research and briefing generation
- Decision card generation
- Outcome processing
- News generation
- Event generation
- Game summary generation
"""

from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.game_events import generate_event, generate_end_game_summary
from app.services.simulator_agents import (
    generate_country_briefing,
    generate_decision_cards,
    generate_news_items,
    CountryBriefing,
    DecisionCard,
    NewsItem,
)
from app.services.game_workflow_orchestrator import (
    GameWorkflowOrchestrator,
    GameWorkflowType,
    run_game_workflow,
    run_all_mission_start_workflows,
)
from app.data.country_contexts import get_country_context, get_all_country_contexts
from app.models.user import User, AIConfig
from app.models.country import Country, CountryIntelligence


# Create router
router = APIRouter(prefix="/simulator", tags=["Policy Simulator"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PillarScores(BaseModel):
    """Pillar score structure."""
    governance: float = Field(..., ge=0, le=100)
    hazardControl: float = Field(..., ge=0, le=100)
    healthVigilance: float = Field(..., ge=0, le=100)
    restoration: float = Field(..., ge=0, le=100)


class ResearchCountryRequest(BaseModel):
    """Request to research a country for game start."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    
    class Config:
        json_schema_extra = {
            "example": {
                "iso_code": "DEU"
            }
        }


class CountryBriefingResponse(BaseModel):
    """Response with full country briefing."""
    country_name: str
    iso_code: str
    flag_url: str
    executive_summary: str
    socioeconomic_context: str
    cultural_factors: str
    future_outlook: str
    key_statistics: Dict[str, Any]
    ohi_score: float
    pillar_scores: Dict[str, float]
    global_rank: int
    pillar_insights: Dict[str, Any]
    key_challenges: List[str]
    key_stakeholders: List[Dict[str, str]]
    recent_articles: List[Dict[str, Any]]
    mission_statement: str
    difficulty_rating: str
    country_context: Dict[str, Any]


class GenerateDecisionsRequest(BaseModel):
    """Request for generating decision cards."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    country_name: str
    current_month: int = Field(..., ge=1, le=12)
    current_year: int = Field(..., ge=2025, le=2100)
    pillars: PillarScores
    budget_remaining: int = Field(..., ge=0)
    recent_decisions: List[str] = Field(default=[])
    recent_events: List[str] = Field(default=[])
    
    class Config:
        json_schema_extra = {
            "example": {
                "iso_code": "DEU",
                "country_name": "Germany",
                "current_month": 3,
                "current_year": 2025,
                "pillars": {
                    "governance": 75,
                    "hazardControl": 70,
                    "healthVigilance": 65,
                    "restoration": 72
                },
                "budget_remaining": 100,
                "recent_decisions": [],
                "recent_events": []
            }
        }


class DecisionCardResponse(BaseModel):
    """A single decision card."""
    id: str
    title: str
    description: str
    detailed_context: str
    pillar: str
    cost: int
    expected_impacts: Dict[str, int]
    risk_level: str
    time_to_effect: str
    stakeholder_reactions: Dict[str, str]
    location: Optional[str] = None
    institution: Optional[str] = None


class GenerateNewsRequest(BaseModel):
    """Request for generating news items."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    current_month: int = Field(..., ge=1, le=12)
    current_year: int = Field(..., ge=2025, le=2100)
    recent_decisions: List[Dict[str, Any]] = Field(default=[])
    pillar_changes: Dict[str, float] = Field(default={})
    count: int = Field(default=3, ge=1, le=10)


class NewsItemResponse(BaseModel):
    """A single news item."""
    id: str
    headline: str
    summary: str
    source: str
    source_type: str
    category: str
    sentiment: str
    location: Optional[str] = None
    timestamp: str
    related_decision: Optional[str] = None


class GenerateEventRequest(BaseModel):
    """Request schema for event generation."""
    country_iso: str = Field(..., min_length=3, max_length=3)
    country_name: str = Field(...)
    current_year: int = Field(..., ge=2025, le=2100)
    ohi_score: float = Field(..., ge=1.0, le=4.0)
    pillars: PillarScores
    recent_events: List[str] = Field(default=[])
    active_policies: List[str] = Field(default=[])
    
    class Config:
        json_schema_extra = {
            "example": {
                "country_iso": "DEU",
                "country_name": "Germany",
                "current_year": 2030,
                "ohi_score": 3.2,
                "pillars": {
                    "governance": 75,
                    "hazardControl": 70,
                    "healthVigilance": 65,
                    "restoration": 72
                },
                "recent_events": [],
                "active_policies": ["gov_osh_law", "haz_risk_assessment"]
            }
        }


class EventChoice(BaseModel):
    """Event choice structure."""
    id: str
    label: str
    description: str
    cost: int
    impacts: Dict[str, float]
    long_term_effects: Optional[List[Dict]] = None


class GameEventResponse(BaseModel):
    """Response schema for generated event."""
    id: str
    type: str
    severity: str
    title: str
    description: str
    narrative: str
    choices: List[Dict]
    deadline: int
    triggeredYear: int
    isResolved: bool


class CycleHistory(BaseModel):
    """Single cycle history entry."""
    cycleNumber: int
    year: int
    pillars: PillarScores
    ohiScore: float
    rank: int
    budgetSpent: Dict[str, float]
    policiesActive: List[str]
    eventsOccurred: List[str]
    choicesMade: Dict[str, str]


class GameStatistics(BaseModel):
    """Game statistics structure."""
    totalCyclesPlayed: int
    startingOHIScore: float
    currentOHIScore: float
    peakOHIScore: float
    lowestOHIScore: float
    startingRank: int
    currentRank: int
    bestRank: int
    totalBudgetSpent: int
    policiesMaxed: int
    eventsHandled: int
    criticalEventsManaged: int


class GenerateSummaryRequest(BaseModel):
    """Request schema for end-game summary."""
    country_name: str
    history: List[CycleHistory]
    statistics: GameStatistics
    final_rank: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "country_name": "Germany",
                "history": [],
                "statistics": {
                    "totalCyclesPlayed": 5,
                    "startingOHIScore": 2.5,
                    "currentOHIScore": 3.2,
                    "peakOHIScore": 3.3,
                    "lowestOHIScore": 2.5,
                    "startingRank": 25,
                    "currentRank": 15,
                    "bestRank": 12,
                    "totalBudgetSpent": 500,
                    "policiesMaxed": 5,
                    "eventsHandled": 3,
                    "criticalEventsManaged": 1
                },
                "final_rank": 15
            }
        }


class SummaryResponse(BaseModel):
    """Response schema for game summary."""
    narrative: str
    highlights: List[str]
    recommendations: List[str]
    grade: str


class CountryContextResponse(BaseModel):
    """Country context data for realistic gameplay."""
    iso_code: str
    name: str
    capital: str
    major_cities: List[str]
    industrial_regions: List[str]
    key_industries: List[str]
    high_risk_sectors: List[str]
    ministry_name: str
    ministry_abbreviation: str
    labor_inspection_body: str
    major_unions: List[str]
    industry_associations: List[str]
    employer_federation: str
    iconic_landmark: str
    landmark_city: str


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/research-country",
    response_model=CountryBriefingResponse,
    summary="Research Country for Game Start",
    description="Generate comprehensive country briefing with AI research.",
)
async def research_country(
    request: ResearchCountryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Research a country and generate a comprehensive briefing for game start.
    
    This uses AI to:
    - Fetch country data from the database
    - Search for recent occupational health articles
    - Generate socioeconomic and cultural analysis
    - Identify key stakeholders and challenges
    - Create an immersive mission briefing
    """
    try:
        # Get user's AI config
        ai_config = db.query(AIConfig).filter(AIConfig.user_id == current_user.id).first()
        
        briefing = await generate_country_briefing(
            iso_code=request.iso_code,
            db=db,
            ai_config=ai_config,
        )
        
        return briefing.to_dict()
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to research country: {str(e)}"
        )


@router.post(
    "/generate-decisions",
    response_model=List[DecisionCardResponse],
    summary="Generate Decision Cards",
    description="Generate contextual decision cards for the current turn.",
)
async def generate_decisions(
    request: GenerateDecisionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate 4-5 decision cards for the current month.
    
    Decisions are contextual based on:
    - Current pillar scores (weakest areas get priority)
    - Budget availability
    - Recent decisions and events
    - Country-specific context (real institutions, cities)
    """
    try:
        # Get country context
        context = get_country_context(request.iso_code)
        if not context:
            from app.data.country_contexts import generate_fallback_context
            context = generate_fallback_context(request.iso_code, request.country_name, "Unknown")
        
        # Get AI config
        ai_config = db.query(AIConfig).filter(AIConfig.user_id == current_user.id).first()
        
        pillar_scores = {
            "governance": request.pillars.governance,
            "hazardControl": request.pillars.hazardControl,
            "healthVigilance": request.pillars.healthVigilance,
            "restoration": request.pillars.restoration,
        }
        
        decisions = await generate_decision_cards(
            iso_code=request.iso_code,
            country_name=request.country_name,
            current_month=request.current_month,
            current_year=request.current_year,
            pillar_scores=pillar_scores,
            budget_remaining=request.budget_remaining,
            recent_decisions=request.recent_decisions,
            recent_events=request.recent_events,
            context=context,
            ai_config=ai_config,
            db=db,
        )
        
        return [d.to_dict() for d in decisions]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate decisions: {str(e)}"
        )


@router.post(
    "/generate-news",
    response_model=List[NewsItemResponse],
    summary="Generate News Items",
    description="Generate realistic news items for the current month.",
)
async def generate_news(
    request: GenerateNewsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate realistic news headlines for the newsfeed.
    
    News items reference:
    - Recent player decisions
    - Country-specific institutions and locations
    - Realistic sources (media, government, unions)
    """
    try:
        context = get_country_context(request.iso_code)
        if not context:
            from app.data.country_contexts import generate_fallback_context
            context = generate_fallback_context(request.iso_code, "Unknown", "Unknown")
        
        # Convert decision dicts to DecisionCard objects for the agent
        from app.services.simulator_agents import DecisionCard
        recent_decisions = [
            DecisionCard(
                id=d.get("id", ""),
                title=d.get("title", ""),
                description=d.get("description", ""),
                detailed_context=d.get("detailed_context", ""),
                pillar=d.get("pillar", "governance"),
                cost=d.get("cost", 0),
                expected_impacts=d.get("expected_impacts", {}),
                risk_level=d.get("risk_level", "medium"),
                time_to_effect=d.get("time_to_effect", "immediate"),
                stakeholder_reactions=d.get("stakeholder_reactions", {}),
                location=d.get("location"),
                institution=d.get("institution"),
            )
            for d in request.recent_decisions
        ]
        
        news_items = generate_news_items(
            context=context,
            month=request.current_month,
            year=request.current_year,
            recent_decisions=recent_decisions,
            pillar_changes=request.pillar_changes,
            count=request.count,
        )
        
        return [n.to_dict() for n in news_items]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate news: {str(e)}"
        )


@router.get(
    "/country-context/{iso_code}",
    response_model=CountryContextResponse,
    summary="Get Country Context",
    description="Get realistic context data for a country.",
)
async def get_context(
    iso_code: str,
    db: Session = Depends(get_db),
):
    """
    Get country context data for realistic gameplay.
    
    Includes real:
    - Institution names
    - Cities and regions
    - Unions and employer groups
    - Landmarks for visualization
    """
    context = get_country_context(iso_code.upper())
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country context not found for {iso_code}"
        )
    
    return {
        "iso_code": context.iso_code,
        "name": context.name,
        "capital": context.capital,
        "major_cities": context.major_cities,
        "industrial_regions": context.industrial_regions,
        "key_industries": context.key_industries,
        "high_risk_sectors": context.high_risk_sectors,
        "ministry_name": context.ministry_name,
        "ministry_abbreviation": context.ministry_abbreviation,
        "labor_inspection_body": context.labor_inspection_body,
        "major_unions": context.major_unions,
        "industry_associations": context.industry_associations,
        "employer_federation": context.employer_federation,
        "iconic_landmark": context.iconic_landmark,
        "landmark_city": context.landmark_city,
    }


@router.get(
    "/available-countries",
    summary="List Available Countries",
    description="Get list of countries with full context data.",
)
async def list_available_countries():
    """Get list of countries that have full context data for the best gameplay experience."""
    contexts = get_all_country_contexts()
    return {
        "countries": [
            {
                "iso_code": ctx.iso_code,
                "name": ctx.name,
                "capital": ctx.capital,
                "landmark": ctx.iconic_landmark,
            }
            for ctx in contexts.values()
        ],
        "total": len(contexts),
    }


@router.post(
    "/generate-event",
    response_model=GameEventResponse,
    summary="Generate Game Event",
    description="Generate a contextual AI-powered event based on current game state.",
)
async def generate_game_event(
    request: GenerateEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a game event based on the current country state.
    
    Events are contextually generated based on:
    - Country characteristics
    - Current pillar scores
    - Active policies
    - Recent event history
    """
    try:
        pillars_dict = {
            "governance": request.pillars.governance,
            "hazardControl": request.pillars.hazardControl,
            "healthVigilance": request.pillars.healthVigilance,
            "restoration": request.pillars.restoration,
        }
        
        event = generate_event(
            country_iso=request.country_iso,
            country_name=request.country_name,
            current_year=request.current_year,
            ohi_score=request.ohi_score,
            pillars=pillars_dict,
            recent_events=request.recent_events,
            active_policies=request.active_policies,
            db=db,
        )
        
        return event
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate event: {str(e)}"
        )


@router.post(
    "/generate-summary",
    response_model=SummaryResponse,
    summary="Generate Game Summary",
    description="Generate an AI-powered end-game summary and narrative.",
)
async def generate_game_summary(
    request: GenerateSummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate an end-game summary with AI narrative.
    
    Includes:
    - Personalized narrative based on performance
    - Key highlights and achievements
    - Strategic recommendations
    - Letter grade
    """
    try:
        history_dicts = [h.dict() for h in request.history]
        stats_dict = request.statistics.dict()
        
        summary = generate_end_game_summary(
            country_name=request.country_name,
            history=history_dicts,
            statistics=stats_dict,
            final_rank=request.final_rank,
        )
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )


@router.get(
    "/health",
    summary="Health Check",
    description="Check if the simulator API is running.",
)
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "service": "policy-simulator",
        "version": "2.0.0",
        "features": [
            "country-research",
            "decision-generation",
            "news-generation",
            "event-generation",
            "game-summary",
            "workflow-orchestration",
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


# =============================================================================
# WORKFLOW-BASED ENDPOINTS (Enhanced AI Integration)
# =============================================================================

class WorkflowRequest(BaseModel):
    """Base request for workflow execution."""
    iso_code: str = Field(..., min_length=3, max_length=3)


class AdvisorWorkflowRequest(BaseModel):
    """Request for strategic advisor workflow."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    country_name: str
    current_month: int = Field(..., ge=1, le=12)
    current_year: int = Field(..., ge=2025, le=2100)
    ohi_score: float = Field(..., ge=1.0, le=4.0)
    pillars: PillarScores
    budget_remaining: int = Field(..., ge=0)
    recent_decisions: List[str] = Field(default=[])


class NewsWorkflowRequest(BaseModel):
    """Request for news generator workflow."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    country_name: str
    current_month: int = Field(..., ge=1, le=12)
    current_year: int = Field(..., ge=2025, le=2100)
    recent_decisions: List[Dict[str, Any]] = Field(default=[])
    pillar_changes: Dict[str, float] = Field(default={})
    count: int = Field(default=5, ge=1, le=15)


class WorkflowResponse(BaseModel):
    """Response from workflow execution."""
    workflow_type: str
    success: bool
    data: Dict[str, Any]
    agent_log: List[Dict[str, Any]]
    errors: List[str]
    execution_time_ms: int


@router.post(
    "/workflow/intelligence-briefing",
    response_model=WorkflowResponse,
    summary="Run Intelligence Briefing Workflow",
    description="Execute the full intelligence briefing workflow with web search and AI synthesis.",
)
async def run_intelligence_briefing_workflow(
    request: WorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run the enhanced Intelligence Briefing workflow.
    
    This workflow:
    1. Performs web search for recent occupational health articles
    2. Retrieves country metrics from the database
    3. Uses AI to synthesize a comprehensive briefing
    4. Returns structured data with agent activity log
    """
    try:
        # Get user's AI config
        ai_config = db.query(AIConfig).filter(AIConfig.user_id == current_user.id).first()
        
        # Get country and context
        country = db.query(Country).filter(Country.iso_code == request.iso_code).first()
        if not country:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Country {request.iso_code} not found"
            )
        
        context = get_country_context(request.iso_code)
        if not context:
            from app.data.country_contexts import generate_fallback_context
            context = generate_fallback_context(request.iso_code, country.name, "Unknown")
        
        # Get intelligence data
        intelligence = db.query(CountryIntelligence).filter(
            CountryIntelligence.iso_code == request.iso_code
        ).first()
        
        # Build metrics data
        metrics_data = {
            "maturity_score": country.maturity_score,
            "governance_score": country.governance_score,
            "pillar1_score": country.pillar1_score,
            "pillar2_score": country.pillar2_score,
            "pillar3_score": country.pillar3_score,
            "gdp_per_capita": intelligence.gdp_per_capita_ppp if intelligence else None,
            "population": intelligence.population_total if intelligence else None,
            "health_expenditure": intelligence.health_expenditure_gdp_pct if intelligence else None,
            "labor_force": intelligence.labor_force_participation if intelligence else None,
        }
        
        # Run workflow
        result = await run_game_workflow(
            workflow_type=GameWorkflowType.INTELLIGENCE_BRIEFING,
            db=db,
            ai_config=ai_config,
            iso_code=request.iso_code,
            country_name=country.name,
            metrics_data=metrics_data,
            context=context,
        )
        
        return {
            "workflow_type": result.workflow_type.value,
            "success": result.success,
            "data": result.data,
            "agent_log": [entry.to_dict() for entry in result.agent_log],
            "errors": result.errors,
            "execution_time_ms": result.execution_time_ms,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow execution failed: {str(e)}"
        )


@router.post(
    "/workflow/strategic-advisor",
    response_model=WorkflowResponse,
    summary="Run Strategic Advisor Workflow",
    description="Execute the strategic advisor workflow for decision generation.",
)
async def run_strategic_advisor_workflow(
    request: AdvisorWorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run the Strategic Advisor workflow.
    
    Generates conversational advice and contextual decision options.
    """
    try:
        ai_config = db.query(AIConfig).filter(AIConfig.user_id == current_user.id).first()
        
        context = get_country_context(request.iso_code)
        if not context:
            from app.data.country_contexts import generate_fallback_context
            context = generate_fallback_context(request.iso_code, request.country_name, "Unknown")
        
        pillar_scores = {
            "governance": request.pillars.governance,
            "hazardControl": request.pillars.hazardControl,
            "healthVigilance": request.pillars.healthVigilance,
            "restoration": request.pillars.restoration,
        }
        
        result = await run_game_workflow(
            workflow_type=GameWorkflowType.STRATEGIC_ADVISOR,
            db=db,
            ai_config=ai_config,
            iso_code=request.iso_code,
            country_name=request.country_name,
            current_month=request.current_month,
            current_year=request.current_year,
            ohi_score=request.ohi_score,
            pillar_scores=pillar_scores,
            budget_remaining=request.budget_remaining,
            recent_decisions=request.recent_decisions,
            context=context,
        )
        
        return {
            "workflow_type": result.workflow_type.value,
            "success": result.success,
            "data": result.data,
            "agent_log": [entry.to_dict() for entry in result.agent_log],
            "errors": result.errors,
            "execution_time_ms": result.execution_time_ms,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow execution failed: {str(e)}"
        )


@router.post(
    "/workflow/news-generator",
    response_model=WorkflowResponse,
    summary="Run News Generator Workflow",
    description="Execute the news generator workflow for dynamic news content.",
)
async def run_news_generator_workflow(
    request: NewsWorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run the News Generator workflow.
    
    Generates realistic news items based on game events and decisions.
    """
    try:
        ai_config = db.query(AIConfig).filter(AIConfig.user_id == current_user.id).first()
        
        context = get_country_context(request.iso_code)
        if not context:
            from app.data.country_contexts import generate_fallback_context
            context = generate_fallback_context(request.iso_code, request.country_name, "Unknown")
        
        result = await run_game_workflow(
            workflow_type=GameWorkflowType.NEWS_GENERATOR,
            db=db,
            ai_config=ai_config,
            iso_code=request.iso_code,
            country_name=request.country_name,
            current_month=request.current_month,
            current_year=request.current_year,
            recent_decisions=request.recent_decisions,
            pillar_changes=request.pillar_changes,
            context=context,
            count=request.count,
        )
        
        return {
            "workflow_type": result.workflow_type.value,
            "success": result.success,
            "data": result.data,
            "agent_log": [entry.to_dict() for entry in result.agent_log],
            "errors": result.errors,
            "execution_time_ms": result.execution_time_ms,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow execution failed: {str(e)}"
        )


@router.post(
    "/workflow/final-report",
    response_model=WorkflowResponse,
    summary="Run Final Report Workflow",
    description="Execute the final report workflow for end-game summary.",
)
async def run_final_report_workflow(
    request: GenerateSummaryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run the Final Report workflow.
    
    Generates comprehensive end-game assessment.
    """
    try:
        ai_config = db.query(AIConfig).filter(AIConfig.user_id == current_user.id).first()
        
        history_dicts = [h.dict() for h in request.history]
        stats_dict = request.statistics.dict()
        
        result = await run_game_workflow(
            workflow_type=GameWorkflowType.FINAL_REPORT,
            db=db,
            ai_config=ai_config,
            country_name=request.country_name,
            history=history_dicts,
            statistics=stats_dict,
            final_rank=request.final_rank,
        )
        
        return {
            "workflow_type": result.workflow_type.value,
            "success": result.success,
            "data": result.data,
            "agent_log": [entry.to_dict() for entry in result.agent_log],
            "errors": result.errors,
            "execution_time_ms": result.execution_time_ms,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow execution failed: {str(e)}"
        )
