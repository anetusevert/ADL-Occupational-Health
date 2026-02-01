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
from app.core.dependencies import get_current_user, get_current_user_optional
from app.services.game_events import generate_event, generate_end_game_summary
from app.services.simulator_agents import (
    generate_country_briefing,
    generate_decision_cards,
    generate_news_items,
    CountryBriefing,
    DecisionCard,
    NewsItem,
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
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Research a country and generate a comprehensive briefing for game start.
    
    This uses AI to:
    - Fetch country data from the database
    - Search for recent occupational health articles
    - Generate socioeconomic and cultural analysis
    - Identify key stakeholders and challenges
    - Create an immersive mission briefing
    
    Note: Works for both authenticated and anonymous users.
    """
    try:
        # Get AI config (user's or global fallback)
        ai_config = get_ai_config_with_fallback(db, current_user)
        
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
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate 4-5 decision cards for the current month.
    
    Decisions are contextual based on:
    - Current pillar scores (weakest areas get priority)
    - Budget availability
    - Recent decisions and events
    - Country-specific context (real institutions, cities)
    
    Note: Works for both authenticated and anonymous users.
    """
    try:
        # Get country context
        context = get_country_context(request.iso_code)
        if not context:
            from app.data.country_contexts import generate_fallback_context
            context = generate_fallback_context(request.iso_code, request.country_name, "Unknown")
        
        # Get AI config (user's or global fallback)
        ai_config = get_ai_config_with_fallback(db, current_user)
        
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
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate realistic news headlines for the newsfeed.
    
    News items reference:
    - Recent player decisions
    - Country-specific institutions and locations
    - Realistic sources (media, government, unions)
    
    Note: Works for both authenticated and anonymous users.
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
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a game event based on the current country state.
    
    Events are contextually generated based on:
    - Country characteristics
    - Current pillar scores
    
    Note: Works for both authenticated and anonymous users.
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
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate an end-game summary with AI narrative.
    
    Includes:
    - Personalized narrative based on performance
    - Key highlights and achievements
    
    Note: Works for both authenticated and anonymous users.
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
            "workflow-intelligence-briefing",
            "workflow-strategic-advisor",
            "workflow-news-generator",
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


# =============================================================================
# WORKFLOW ENDPOINTS (AI Agent-Powered)
# =============================================================================

class WorkflowResponse(BaseModel):
    """Standard response for all workflow endpoints."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None
    agent_log: Optional[List[Dict[str, Any]]] = None


class IntelligenceBriefingRequest(BaseModel):
    """Request for intelligence briefing workflow."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    
    class Config:
        json_schema_extra = {
            "example": {
                "iso_code": "DEU"
            }
        }


class StrategicAdvisorRequest(BaseModel):
    """Request for strategic advisor workflow."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    country_name: str
    current_month: int = Field(..., ge=1, le=12)
    current_year: int = Field(..., ge=2025, le=2100)
    ohi_score: float = Field(..., ge=1.0, le=4.0)
    pillars: PillarScores
    budget_remaining: int = Field(..., ge=0)
    recent_decisions: List[str] = Field(default=[])
    news_headlines: List[str] = Field(default=[])
    user_question: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "iso_code": "DEU",
                "country_name": "Germany",
                "current_month": 3,
                "current_year": 2025,
                "ohi_score": 3.2,
                "pillars": {
                    "governance": 75,
                    "hazardControl": 70,
                    "healthVigilance": 65,
                    "restoration": 72
                },
                "budget_remaining": 100,
                "recent_decisions": [],
                "news_headlines": ["New workplace safety law passed", "Factory inspection reveals violations"],
                "user_question": "What should I prioritize this month?"
            }
        }


class NewsGeneratorRequest(BaseModel):
    """Request for news generator workflow."""
    iso_code: str = Field(..., min_length=3, max_length=3)
    country_name: str
    current_month: int = Field(..., ge=1, le=12)
    current_year: int = Field(..., ge=2025, le=2100)
    recent_decisions: List[Dict[str, Any]] = Field(default=[])
    pillar_changes: Dict[str, float] = Field(default={})
    game_state: Optional[str] = None
    count: int = Field(default=5, ge=1, le=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "iso_code": "DEU",
                "country_name": "Germany",
                "current_month": 3,
                "current_year": 2025,
                "recent_decisions": [],
                "pillar_changes": {},
                "game_state": "OHI Score: 3.2, Governance: 75, Hazard: 70",
                "count": 5
            }
        }


@router.post(
    "/workflow/intelligence-briefing",
    response_model=WorkflowResponse,
    summary="Intelligence Briefing Workflow",
    description="AI-powered workflow that generates a comprehensive country briefing using the Intelligence Briefing Agent.",
)
async def workflow_intelligence_briefing(
    request: IntelligenceBriefingRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a comprehensive intelligence briefing for game start.
    
    This workflow:
    1. Fetches all country data from the database
    2. Calls the intelligence-briefing agent with full context
    3. Optionally performs web search for recent developments
    4. Returns structured briefing data with agent activity log
    """
    import json
    from datetime import datetime
    from app.services.agent_runner import AgentRunner
    from app.data.country_contexts import get_country_context, generate_fallback_context
    
    agent_log = []
    
    def log_agent(agent: str, status: str, message: str, emoji: str = "🔄"):
        agent_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent,
            "status": status,
            "message": message,
            "emoji": emoji,
        })
    
    try:
        iso_code = request.iso_code.upper()
        
        # Step 1: Initialize
        log_agent("Orchestrator", "starting", "Initializing intelligence briefing workflow...", "🚀")
        
        # Step 2: Get AI config
        ai_config = get_ai_config_with_fallback(db, current_user)
        if not ai_config:
            log_agent("Orchestrator", "error", "No AI configuration found", "❌")
            return WorkflowResponse(
                success=False,
                errors=["No AI configuration found. Please configure AI settings."],
                agent_log=agent_log,
            )
        
        # Step 3: Fetch country data
        log_agent("DataAgent", "querying", f"Fetching database records for {iso_code}...", "📊")
        
        country = db.query(Country).filter(Country.iso_code == iso_code).first()
        if not country:
            log_agent("DataAgent", "error", f"Country {iso_code} not found", "❌")
            return WorkflowResponse(
                success=False,
                errors=[f"Country {iso_code} not found in database"],
                agent_log=agent_log,
            )
        
        log_agent("DataAgent", "complete", f"Loaded {country.name} with OHI score {country.maturity_score:.2f}", "✅")
        
        # Step 4: Get country context
        log_agent("DataAgent", "querying", "Loading institutional context...", "🏛️")
        context = get_country_context(iso_code)
        if not context:
            context = generate_fallback_context(iso_code, country.name, "Unknown")
        log_agent("DataAgent", "complete", f"Loaded context: {context.ministry_name}", "✅")
        
        # Step 5: Get intelligence data
        log_agent("DataAgent", "querying", "Fetching multi-source intelligence...", "🔍")
        intelligence = db.query(CountryIntelligence).filter(
            CountryIntelligence.country_iso_code == iso_code
        ).first()
        if intelligence:
            log_agent("DataAgent", "complete", "Intelligence data loaded (World Bank, ILO, WHO)", "✅")
        else:
            log_agent("DataAgent", "complete", "Using core metrics only", "⚠️")
        
        # Step 6: Run the Intelligence Briefing Agent
        log_agent("IntelligenceAgent", "starting", "Generating intelligence briefing...", "🧠")
        
        runner = AgentRunner(db, ai_config)
        agent_result = await runner.run(
            agent_id="intelligence-briefing",
            variables={
                "ISO_CODE": iso_code,
                "CONTEXT": json.dumps(context.to_dict()) if context else "{}",
            },
            enable_web_search=True,
        )
        
        if not agent_result["success"]:
            log_agent("IntelligenceAgent", "error", f"Agent failed: {agent_result['error']}", "❌")
            # Fall back to database-only briefing
            log_agent("Orchestrator", "synthesizing", "Generating fallback briefing from database...", "🔄")
            briefing_data = _create_fallback_briefing(country, context, intelligence, db)
            log_agent("Orchestrator", "complete", "Fallback briefing generated", "✅")
        else:
            log_agent("IntelligenceAgent", "complete", "Intelligence briefing generated", "✅")
            
            # Step 7: Parse agent output
            log_agent("Orchestrator", "synthesizing", "Structuring briefing data...", "📋")
            try:
                output = agent_result["output"]
                # Find JSON in response
                json_start = output.find("{")
                json_end = output.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    ai_content = json.loads(output[json_start:json_end])
                else:
                    ai_content = {}
            except (json.JSONDecodeError, TypeError):
                ai_content = {}
            
            # Merge AI content with database data
            briefing_data = _create_briefing_from_ai(country, context, intelligence, ai_content, db)
            log_agent("Orchestrator", "complete", "Briefing structured successfully", "✅")
        
        log_agent("Orchestrator", "complete", f"Intelligence briefing ready for {country.name}", "🎯")
        
        return WorkflowResponse(
            success=True,
            data=briefing_data,
            agent_log=agent_log,
        )
        
    except Exception as e:
        log_agent("Orchestrator", "error", f"Workflow failed: {str(e)}", "❌")
        return WorkflowResponse(
            success=False,
            errors=[str(e)],
            agent_log=agent_log,
        )


@router.post(
    "/workflow/strategic-advisor",
    response_model=WorkflowResponse,
    summary="Strategic Advisor Workflow",
    description="AI-powered workflow that generates strategic advice and decision options using the Strategic Advisor Agent.",
)
async def workflow_strategic_advisor(
    request: StrategicAdvisorRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate strategic advice and decision options for the current turn.
    
    This workflow:
    1. Takes current game state and context
    2. Calls the strategic-advisor agent
    3. Returns conversational advice with 3 decision options
    """
    import json
    from datetime import datetime
    from app.services.agent_runner import AgentRunner
    from app.data.country_contexts import get_country_context, generate_fallback_context
    
    agent_log = []
    
    def log_agent(agent: str, status: str, message: str, emoji: str = "🔄"):
        agent_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent,
            "status": status,
            "message": message,
            "emoji": emoji,
        })
    
    try:
        iso_code = request.iso_code.upper()
        
        log_agent("Orchestrator", "starting", "Consulting strategic advisor...", "🎯")
        
        # Get AI config
        ai_config = get_ai_config_with_fallback(db, current_user)
        if not ai_config:
            return WorkflowResponse(
                success=False,
                errors=["No AI configuration found."],
                agent_log=agent_log,
            )
        
        # Get country context
        context = get_country_context(iso_code)
        if not context:
            context = generate_fallback_context(iso_code, request.country_name, "Unknown")
        
        # Format game state with all context
        news_context = "\n".join([f"- {headline}" for headline in request.news_headlines]) if request.news_headlines else "No recent news"
        game_state = f"""
Current Pillar Scores:
- Governance: {request.pillars.governance}/100
- Hazard Control: {request.pillars.hazardControl}/100
- Health Vigilance: {request.pillars.healthVigilance}/100
- Restoration: {request.pillars.restoration}/100

OHI Score: {request.ohi_score:.2f}/4.0
Budget Available: {request.budget_remaining} points

Recent Decisions: {', '.join(request.recent_decisions) if request.recent_decisions else 'None yet'}

Recent News Headlines:
{news_context}
"""
        
        log_agent("StrategicAdvisor", "analyzing", "Analyzing current situation...", "📊")
        
        # Run the Strategic Advisor Agent
        runner = AgentRunner(db, ai_config)
        agent_result = await runner.run(
            agent_id="strategic-advisor",
            variables={
                "ISO_CODE": iso_code,
                "CURRENT_MONTH": str(request.current_month),
                "CURRENT_YEAR": str(request.current_year),
                "BUDGET": str(request.budget_remaining),
                "GAME_STATE": game_state,
                "USER_QUESTION": request.user_question or "What should I focus on this month?",
                "CONTEXT": json.dumps(context.to_dict()) if context else "{}",
            },
            enable_web_search=False,
        )
        
        if not agent_result["success"]:
            log_agent("StrategicAdvisor", "error", f"Advisor failed: {agent_result['error']}", "❌")
            # Generate fallback decisions
            decisions = _generate_fallback_decisions(iso_code, request, context)
            return WorkflowResponse(
                success=True,
                data={
                    "greeting": f"Minister, let me advise you on {request.country_name}'s priorities.",
                    "situation_analysis": f"Your current OHI score is {request.ohi_score:.2f}. Focus on the weakest pillar.",
                    "decisions": decisions,
                    "recommendation": "I recommend focusing on your weakest pillar for maximum impact.",
                },
                agent_log=agent_log,
            )
        
        log_agent("StrategicAdvisor", "complete", "Strategic analysis complete", "✅")
        
        # Parse agent output
        try:
            output = agent_result["output"]
            json_start = output.find("{")
            json_end = output.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                ai_content = json.loads(output[json_start:json_end])
            else:
                ai_content = {}
        except (json.JSONDecodeError, TypeError):
            ai_content = {}
        
        # Transform AI content to expected format
        decisions = []
        for action in ai_content.get("recommended_actions", []):
            decisions.append({
                "id": action.get("id", f"dec_{len(decisions)+1}"),
                "title": action.get("title", "Strategic Action"),
                "description": action.get("description", ""),
                "detailed_context": action.get("description", ""),
                "pillar": _detect_pillar(action.get("title", "")),
                "cost": action.get("cost", 30),
                "expected_impacts": action.get("expected_impact", {}),
                "risk_level": action.get("risk_level", "medium"),
                "time_to_effect": "immediate",
                "stakeholder_reactions": action.get("stakeholder_reactions", {}),
            })
        
        # Ensure we have at least 3 decisions
        if len(decisions) < 3:
            fallback = _generate_fallback_decisions(iso_code, request, context)
            decisions.extend(fallback[len(decisions):])
        
        return WorkflowResponse(
            success=True,
            data={
                "greeting": ai_content.get("greeting", f"Good day, Minister. Let's review {request.country_name}'s situation."),
                "situation_analysis": ai_content.get("situation_analysis", f"Your OHI score is {request.ohi_score:.2f}."),
                "decisions": decisions[:3],
                "recommendation": ai_content.get("recommendation", "I recommend a balanced approach."),
            },
            agent_log=agent_log,
        )
        
    except Exception as e:
        log_agent("Orchestrator", "error", f"Workflow failed: {str(e)}", "❌")
        return WorkflowResponse(
            success=False,
            errors=[str(e)],
            agent_log=agent_log,
        )


@router.post(
    "/workflow/news-generator",
    response_model=WorkflowResponse,
    summary="News Generator Workflow",
    description="AI-powered workflow that generates contextual news items using the News Generator Agent.",
)
async def workflow_news_generator(
    request: NewsGeneratorRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate realistic news items for the current month.
    
    This workflow:
    1. Takes current game state and recent decisions
    2. Calls the news-generator agent
    3. Returns news items reflecting player actions
    """
    import json
    import uuid
    from datetime import datetime
    from app.services.agent_runner import AgentRunner
    from app.data.country_contexts import get_country_context, generate_fallback_context
    
    agent_log = []
    month_names = ["January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]
    
    def log_agent(agent: str, status: str, message: str, emoji: str = "🔄"):
        agent_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent,
            "status": status,
            "message": message,
            "emoji": emoji,
        })
    
    try:
        iso_code = request.iso_code.upper()
        month_name = month_names[request.current_month - 1] if 1 <= request.current_month <= 12 else "January"
        
        log_agent("Orchestrator", "starting", "Generating news feed...", "📰")
        
        # Get AI config
        ai_config = get_ai_config_with_fallback(db, current_user)
        if not ai_config:
            # Generate fallback news without AI
            news_items = _generate_fallback_news(request, month_name)
            return WorkflowResponse(
                success=True,
                data={"news_items": news_items},
                agent_log=agent_log,
            )
        
        # Get country context
        context = get_country_context(iso_code)
        if not context:
            context = generate_fallback_context(iso_code, request.country_name, "Unknown")
        
        # Format recent decisions for the agent
        decisions_text = "None this month"
        if request.recent_decisions:
            decisions_text = "\n".join([
                f"- {d.get('title', 'Unknown')}: {d.get('description', '')[:100]}"
                for d in request.recent_decisions[:5]
            ])
        
        # Format game state
        game_state = request.game_state or f"Month: {month_name} {request.current_year}"
        
        log_agent("NewsGenerator", "researching", "Gathering news context...", "🔍")
        
        # Run the News Generator Agent
        runner = AgentRunner(db, ai_config)
        agent_result = await runner.run(
            agent_id="news-generator",
            variables={
                "ISO_CODE": iso_code,
                "CURRENT_MONTH": month_name,
                "CURRENT_YEAR": str(request.current_year),
                "RECENT_DECISIONS": decisions_text,
                "GAME_STATE": game_state,
                "CONTEXT": json.dumps(context.to_dict()) if context else "{}",
            },
            enable_web_search=False,
        )
        
        if not agent_result["success"]:
            log_agent("NewsGenerator", "error", f"News generation failed: {agent_result['error']}", "❌")
            news_items = _generate_fallback_news(request, month_name)
        else:
            log_agent("NewsGenerator", "complete", f"Generated news for {month_name} {request.current_year}", "✅")
            
            # Parse agent output
            try:
                output = agent_result["output"]
                json_start = output.find("[")
                json_end = output.rfind("]") + 1
                if json_start >= 0 and json_end > json_start:
                    news_items = json.loads(output[json_start:json_end])
                else:
                    # Try to find JSON object with news_items key
                    json_start = output.find("{")
                    json_end = output.rfind("}") + 1
                    if json_start >= 0 and json_end > json_start:
                        parsed = json.loads(output[json_start:json_end])
                        news_items = parsed.get("news_items", [])
                    else:
                        news_items = []
            except (json.JSONDecodeError, TypeError):
                news_items = []
            
            # Ensure proper format
            for item in news_items:
                if "id" not in item:
                    item["id"] = f"news_{uuid.uuid4().hex[:8]}"
                if "timestamp" not in item:
                    item["timestamp"] = f"{month_name} {request.current_year}"
        
        # Ensure we have at least some news
        if len(news_items) < request.count:
            fallback = _generate_fallback_news(request, month_name)
            news_items.extend(fallback[len(news_items):])
        
        return WorkflowResponse(
            success=True,
            data={"news_items": news_items[:request.count]},
            agent_log=agent_log,
        )
        
    except Exception as e:
        log_agent("Orchestrator", "error", f"Workflow failed: {str(e)}", "❌")
        return WorkflowResponse(
            success=False,
            errors=[str(e)],
            agent_log=agent_log,
        )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_ai_config_with_fallback(db: Session, user: Optional[User]) -> Optional[AIConfig]:
    """
    Get the active AI configuration.
    
    AIConfig is global (not per-user), so we just return the active config.
    The user parameter is kept for potential future per-user configs.
    """
    return db.query(AIConfig).filter(AIConfig.is_active == True).first()


# =============================================================================
# WORKFLOW HELPER FUNCTIONS
# =============================================================================

def _generate_stakeholders_from_context(context, country_name: str) -> List[Dict[str, str]]:
    """Generate stakeholder list from country context with real official names."""
    stakeholders = []
    
    # Get key officials from context if available
    key_officials = getattr(context, 'key_officials', {}) or {}
    
    # Labor/HR Minister
    labor_minister_name = key_officials.get('labor_minister', f"Minister of Labour, {country_name}")
    stakeholders.append({
        "name": labor_minister_name,
        "role": "Minister of Labour",
        "institution": context.ministry_name if context else "Ministry of Labour",
        "stance": "supportive"
    })
    
    # Health Minister
    health_minister_name = key_officials.get('health_minister', f"Minister of Health, {country_name}")
    stakeholders.append({
        "name": health_minister_name,
        "role": "Minister of Health",
        "institution": context.health_authority if context else "Ministry of Health",
        "stance": "supportive"
    })
    
    # OSHA/Labor Inspection Head
    if key_officials.get('osha_administrator') or key_officials.get('hse_chief_executive') or key_officials.get('baua_president'):
        inspection_head = key_officials.get('osha_administrator') or key_officials.get('hse_chief_executive') or key_officials.get('baua_president')
        stakeholders.append({
            "name": inspection_head,
            "role": "Chief Inspector",
            "institution": context.labor_inspection_body if context else "Labor Inspectorate",
            "stance": "supportive"
        })
    
    # Social Insurance/GOSI Head
    if key_officials.get('gosi_governor') or key_officials.get('dguv_ceo'):
        insurance_head = key_officials.get('gosi_governor') or key_officials.get('dguv_ceo')
        stakeholders.append({
            "name": insurance_head,
            "role": "Social Insurance Director",
            "institution": context.social_insurance_body if context else "Social Insurance",
            "stance": "supportive"
        })
    
    # Union leader if available
    if key_officials.get('dgb_president') or key_officials.get('tuc_general_secretary') or key_officials.get('afl_cio_president'):
        union_leader = key_officials.get('dgb_president') or key_officials.get('tuc_general_secretary') or key_officials.get('afl_cio_president')
        stakeholders.append({
            "name": union_leader,
            "role": "Union Leader",
            "institution": context.major_unions[0] if context and context.major_unions else "Workers' Union",
            "stance": "neutral"
        })
    
    return stakeholders


def _create_fallback_briefing(
    country: Country,
    context,
    intelligence: Optional[CountryIntelligence],
    db: Session,
) -> Dict[str, Any]:
    """Create a briefing from database data when AI is unavailable."""
    
    # Calculate rank
    all_countries = db.query(Country).filter(Country.maturity_score.isnot(None)).all()
    sorted_countries = sorted(all_countries, key=lambda c: c.maturity_score or 0, reverse=True)
    global_rank = next(
        (i + 1 for i, c in enumerate(sorted_countries) if c.iso_code == country.iso_code),
        len(sorted_countries)
    )
    
    ohi_score = country.maturity_score or 2.5
    
    # Determine difficulty
    if ohi_score >= 3.5:
        difficulty = "Easy"
    elif ohi_score >= 2.5:
        difficulty = "Medium"
    elif ohi_score >= 1.5:
        difficulty = "Hard"
    else:
        difficulty = "Expert"
    
    pillar_scores = {
        "governance": country.governance_score or 50,
        "hazardControl": country.pillar1_score or 50,
        "healthVigilance": country.pillar2_score or 50,
        "restoration": country.pillar3_score or 50,
    }
    
    key_statistics = {}
    if intelligence:
        key_statistics = {
            "gdp_per_capita": intelligence.gdp_per_capita_ppp,
            "population": intelligence.population_total,
            "labor_force": intelligence.labor_force_participation,
            "health_expenditure_pct": intelligence.health_expenditure_gdp_pct,
            "life_expectancy": intelligence.life_expectancy_at_birth,
            "unemployment_rate": intelligence.unemployment_rate,
        }
    
    iso2 = context.iso2_code if context else country.iso_code[:2]
    
    # Generate detailed fallback content
    industries = ", ".join(context.key_industries[:3]) if context and context.key_industries else "various industries"
    high_risk = ", ".join(context.high_risk_sectors[:3]) if context and context.high_risk_sectors else "construction, mining, and manufacturing"
    capital = context.capital if context else "the capital"
    work_week = context.typical_work_week if context else "40-48 hours"
    
    # Calculate GDP text
    gdp_text = f"${key_statistics.get('gdp_per_capita', 'N/A'):,.0f} per capita" if key_statistics.get('gdp_per_capita') else "developing economy"
    pop_text = f"{key_statistics.get('population', 'N/A'):,.0f} million" if key_statistics.get('population') else "a significant population"
    
    executive_summary = f"""Welcome to {country.name}, Minister. As the newly appointed Health Minister, you inherit a complex occupational health landscape that demands immediate attention and strategic vision.

{country.name} currently ranks #{global_rank} globally with an OHI score of {ohi_score:.2f} out of 4.0. This positions the nation in the {difficulty.lower()} difficulty tier for occupational health reform. The current framework shows {pillar_scores.get('governance', 50):.0f}/100 in governance capacity, {pillar_scores.get('hazardControl', 50):.0f}/100 in hazard control, {pillar_scores.get('healthVigilance', 50):.0f}/100 in health surveillance, and {pillar_scores.get('restoration', 50):.0f}/100 in worker rehabilitation and compensation systems.

Your mandate is clear: transform {country.name}'s occupational health infrastructure to protect the nation's workforce while supporting sustainable economic growth. The path forward requires strategic investment, stakeholder alignment, and evidence-based policy decisions."""

    socioeconomic_context = f"""{country.name}'s economy is characterized by a GDP of {gdp_text}, supporting a population of {pop_text}. The nation's economic structure is heavily influenced by {industries}, each presenting unique occupational health challenges.

The labor force participation rate stands at approximately {key_statistics.get('labor_force', 65):.1f}%, with the formal sector employing the majority of workers. However, a significant informal economy exists, particularly in {high_risk} sectors, where workers often lack access to basic occupational health protections and surveillance systems.

Health expenditure represents {key_statistics.get('health_expenditure_pct', 5):.1f}% of GDP, with occupational health receiving a small but growing share of this investment. The current infrastructure includes {context.labor_inspection_body if context else 'the national labor inspectorate'} as the primary enforcement body, though capacity constraints limit effective coverage.

The capital, {capital}, serves as the administrative hub for occupational health policy, while industrial regions face the greatest challenges in enforcement and worker protection. The typical work week of {work_week} reflects local labor standards, though actual hours may vary significantly by sector."""

    cultural_factors = f"""Work culture in {country.name} reflects a complex interplay of traditional values, economic pressures, and evolving safety consciousness. Historically, workplace safety has been viewed through the lens of productivity, with worker protection sometimes taking a secondary role to economic output.

Recent years have seen growing awareness of occupational health issues, driven by international standards, media attention to workplace incidents, and advocacy from labor organizations. The {context.ministry_name if context else 'Ministry of Labour'} has begun implementing reforms, though resistance to change persists in some sectors.

Enforcement remains challenging, with inspectors facing resource constraints and, in some cases, political pressure from powerful industry actors. Building a culture of safety will require sustained effort at all levels of society."""

    future_outlook = f"""The economic trajectory of {country.name} suggests both opportunities and challenges for occupational health. Emerging industries and technological change will create new workplace hazards requiring updated regulatory frameworks.

Climate change and demographic shifts will further complicate the landscape, demanding adaptive strategies. Your decisions over the coming years will shape whether {country.name} advances or falls behind in protecting its workers."""

    return {
        "country_name": country.name,
        "iso_code": country.iso_code,
        "flag_url": f"https://flagcdn.com/w160/{iso2.lower()}.png",
        "executive_summary": executive_summary,
        "socioeconomic_context": socioeconomic_context,
        "cultural_factors": cultural_factors,
        "future_outlook": future_outlook,
        "key_statistics": key_statistics,
        "ohi_score": ohi_score,
        "pillar_scores": pillar_scores,
        "global_rank": global_rank,
        "pillar_insights": {
            "governance": {
                "score": pillar_scores.get("governance", 50),
                "analysis": f"Governance capacity scores {pillar_scores.get('governance', 50):.0f}/100, reflecting the strength of legal frameworks, institutional capacity, and strategic coordination for occupational health.",
                "key_issues": ["Limited inspector-to-worker ratio", "Fragmented regulatory framework", "Gaps in enforcement capacity"],
                "opportunities": ["Strengthen inter-agency coordination", "Modernize inspection protocols", "Expand training programs"],
            },
            "hazardControl": {
                "score": pillar_scores.get("hazardControl", 50),
                "analysis": f"Hazard control measures score {pillar_scores.get('hazardControl', 50):.0f}/100, indicating room for improvement in workplace safety standards and risk prevention.",
                "key_issues": ["Outdated equipment safety standards", "Limited PPE enforcement", "Insufficient hazard reporting"],
                "opportunities": ["Implement technology-based monitoring", "Enhance safety training", "Develop sector-specific guidelines"],
            },
            "healthVigilance": {
                "score": pillar_scores.get("healthVigilance", 50),
                "analysis": f"Health surveillance systems score {pillar_scores.get('healthVigilance', 50):.0f}/100, with opportunities to strengthen disease detection and worker health monitoring.",
                "key_issues": ["Limited occupational disease reporting", "Gaps in health screening coverage", "Data integration challenges"],
                "opportunities": ["Expand electronic health records", "Strengthen disease surveillance", "Increase screening frequency"],
            },
            "restoration": {
                "score": pillar_scores.get("restoration", 50),
                "analysis": f"Worker rehabilitation and compensation systems score {pillar_scores.get('restoration', 50):.0f}/100, with potential to improve worker recovery and reintegration.",
                "key_issues": ["Slow claim processing", "Limited rehabilitation services", "Gaps in return-to-work programs"],
                "opportunities": ["Streamline compensation processes", "Expand rehabilitation infrastructure", "Develop early intervention programs"],
            },
        },
        "key_challenges": [
            "Improving enforcement capacity - limited resources constrain effective workplace inspections",
            "Expanding coverage to informal sector - workers outside formal employment lack protections",
            "Modernizing surveillance systems - data infrastructure requires significant upgrades",
            "Strengthening stakeholder coordination - fragmented approach to occupational health governance",
        ],
        "key_stakeholders": _generate_stakeholders_from_context(context, country.name) if context else [],
        "recent_articles": [],
        "mission_statement": f"Transform {country.name}'s occupational health system into a world-class framework that protects every worker.",
        "difficulty_rating": difficulty,
        "country_context": context.to_dict() if context else {},
    }


def _create_briefing_from_ai(
    country: Country,
    context,
    intelligence: Optional[CountryIntelligence],
    ai_content: Dict[str, Any],
    db: Session,
) -> Dict[str, Any]:
    """Merge AI-generated content with database data."""
    
    # Start with fallback data
    briefing = _create_fallback_briefing(country, context, intelligence, db)
    
    # Override with AI content where available
    if ai_content.get("executive_summary"):
        briefing["executive_summary"] = ai_content["executive_summary"]
    if ai_content.get("socioeconomic_context"):
        briefing["socioeconomic_context"] = ai_content["socioeconomic_context"]
    if ai_content.get("key_challenges"):
        briefing["key_challenges"] = ai_content["key_challenges"]
    if ai_content.get("key_stakeholders"):
        briefing["key_stakeholders"] = ai_content["key_stakeholders"]
    if ai_content.get("pillar_insights"):
        briefing["pillar_insights"] = ai_content["pillar_insights"]
    if ai_content.get("mission_statement"):
        briefing["mission_statement"] = ai_content["mission_statement"]
    
    return briefing


def _generate_fallback_decisions(
    iso_code: str,
    request,
    context,
) -> List[Dict[str, Any]]:
    """Generate fallback decision options without AI."""
    import random
    import uuid
    
    # Find weakest pillar
    pillars = {
        "governance": request.pillars.governance,
        "hazardControl": request.pillars.hazardControl,
        "healthVigilance": request.pillars.healthVigilance,
        "restoration": request.pillars.restoration,
    }
    weakest = min(pillars, key=pillars.get)
    
    decisions = []
    
    # Decision for weakest pillar
    pillar_titles = {
        "governance": "Strengthen Regulatory Framework",
        "hazardControl": "Enhance Workplace Safety Standards",
        "healthVigilance": "Improve Health Surveillance Systems",
        "restoration": "Expand Worker Compensation Programs",
    }
    
    decisions.append({
        "id": f"dec_{uuid.uuid4().hex[:8]}",
        "title": pillar_titles.get(weakest, "Strategic Initiative"),
        "description": f"Focus on improving {weakest.replace('C', ' C').replace('V', ' V')} to address critical gaps.",
        "detailed_context": f"This initiative will strengthen the nation's {weakest} capacity.",
        "pillar": weakest,
        "cost": 35,
        "expected_impacts": {weakest: random.randint(3, 6)},
        "risk_level": "medium",
        "time_to_effect": "3 months",
        "stakeholder_reactions": {"Unions": "supportive", "Industry": "neutral"},
    })
    
    # Decision for governance
    if weakest != "governance":
        decisions.append({
            "id": f"dec_{uuid.uuid4().hex[:8]}",
            "title": "Launch National OSH Campaign",
            "description": "Nationwide awareness campaign on workplace safety rights and responsibilities.",
            "detailed_context": "Public awareness is key to long-term cultural change.",
            "pillar": "governance",
            "cost": 25,
            "expected_impacts": {"governance": random.randint(2, 4)},
            "risk_level": "low",
            "time_to_effect": "immediate",
            "stakeholder_reactions": {"Media": "supportive", "Public": "positive"},
        })
    
    # Decision for hazard control
    if weakest != "hazardControl":
        decisions.append({
            "id": f"dec_{uuid.uuid4().hex[:8]}",
            "title": "Deploy Mobile Inspection Teams",
            "description": "Mobile units to conduct inspections in underserved areas.",
            "detailed_context": "Reaching informal workplaces requires mobile capabilities.",
            "pillar": "hazardControl",
            "cost": 40,
            "expected_impacts": {"hazardControl": random.randint(3, 5)},
            "risk_level": "medium",
            "time_to_effect": "6 months",
            "stakeholder_reactions": {"Inspectors": "supportive", "Industry": "cautious"},
        })
    
    # Ensure we have 3 decisions
    while len(decisions) < 3:
        decisions.append({
            "id": f"dec_{uuid.uuid4().hex[:8]}",
            "title": "International Partnership Initiative",
            "description": "Partner with ILO for technical assistance and knowledge transfer.",
            "detailed_context": "International cooperation accelerates progress.",
            "pillar": "governance",
            "cost": 20,
            "expected_impacts": {"governance": 2, "hazardControl": 1},
            "risk_level": "low",
            "time_to_effect": "6 months",
            "stakeholder_reactions": {"ILO": "highly supportive"},
        })
    
    return decisions[:3]


def _generate_fallback_news(request, month_name: str) -> List[Dict[str, Any]]:
    """Generate fallback news items without AI."""
    import random
    import uuid
    
    headlines = [
        {
            "headline": f"Government Announces New Workplace Safety Initiative",
            "summary": f"The Ministry of Labour unveiled a comprehensive plan to improve occupational health standards across key industries in {request.country_name}.",
            "source": "National News Agency",
            "source_type": "government",
            "category": "policy",
            "sentiment": "positive",
        },
        {
            "headline": f"Union Leaders Call for Stronger Worker Protections",
            "summary": f"Labor unions are pushing for enhanced safety measures following recent workplace incidents.",
            "source": "Labor Times",
            "source_type": "union",
            "category": "reform",
            "sentiment": "neutral",
        },
        {
            "headline": f"Industry Report Highlights Occupational Health Progress",
            "summary": f"A new industry report shows measurable improvements in workplace safety metrics over the past year.",
            "source": "Industry Weekly",
            "source_type": "industry",
            "category": "economy",
            "sentiment": "positive",
        },
        {
            "headline": f"ILO Commends Regional Occupational Health Efforts",
            "summary": f"The International Labour Organization praised recent progress in the region's workplace safety standards.",
            "source": "ILO News",
            "source_type": "international",
            "category": "international",
            "sentiment": "positive",
        },
        {
            "headline": f"Experts Discuss Future of Workplace Health",
            "summary": f"Leading occupational health experts gathered to discuss emerging challenges and solutions.",
            "source": "Health Policy Journal",
            "source_type": "newspaper",
            "category": "policy",
            "sentiment": "neutral",
        },
    ]
    
    news_items = []
    for i, item in enumerate(headlines[:request.count]):
        news_items.append({
            "id": f"news_{uuid.uuid4().hex[:8]}",
            "headline": item["headline"],
            "summary": item["summary"],
            "source": item["source"],
            "source_type": item["source_type"],
            "category": item["category"],
            "sentiment": item["sentiment"],
            "location": request.country_name,
            "timestamp": f"{month_name} {request.current_year}",
        })
    
    return news_items


def _detect_pillar(title: str) -> str:
    """Detect pillar from action title."""
    title_lower = title.lower()
    if any(word in title_lower for word in ["govern", "law", "regulat", "enforce", "inspect", "policy"]):
        return "governance"
    if any(word in title_lower for word in ["hazard", "safety", "ppe", "risk", "prevent"]):
        return "hazardControl"
    if any(word in title_lower for word in ["surveil", "health", "disease", "monitor", "screen"]):
        return "healthVigilance"
    if any(word in title_lower for word in ["compens", "rehabilit", "return", "restor", "support"]):
        return "restoration"
    return "governance"  # Default
