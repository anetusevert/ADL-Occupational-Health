"""
GOHIP Platform - Policy Simulator API Endpoints
================================================

Sovereign Health: The Occupational Health Strategy Game

Endpoints for:
- Event generation
- Game summary generation
- Score calculation
"""

from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.game_events import generate_event, generate_end_game_summary
from app.models.user import User


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


# =============================================================================
# ENDPOINTS
# =============================================================================

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
        "timestamp": datetime.utcnow().isoformat(),
    }
