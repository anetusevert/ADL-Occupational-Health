"""
Sovereign Health: Simulator API Endpoints

Game-related API endpoints for event generation and game state management.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

from ...services.game_events import (
    generate_event,
    generate_event_with_ai,
    GameEvent,
    EventChoice,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class GenerateEventRequest(BaseModel):
    country_iso: str
    country_name: str
    current_year: int
    ohi_score: float
    pillars: Dict[str, float]
    recent_event_ids: Optional[List[str]] = None
    active_policies: Optional[List[str]] = None
    use_ai: bool = False


class GenerateEventResponse(BaseModel):
    event: Optional[GameEvent] = None
    success: bool
    message: Optional[str] = None


class GenerateSummaryRequest(BaseModel):
    country_name: str
    start_year: int
    end_year: int
    starting_score: float
    final_score: float
    starting_rank: int
    final_rank: int
    cycles_played: int
    policies_maxed: int
    events_handled: int
    history: List[Dict]


class GenerateSummaryResponse(BaseModel):
    narrative: str
    highlights: List[str]
    recommendations: List[str]
    grade: str
    success: bool


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/generate-event", response_model=GenerateEventResponse)
async def generate_game_event(request: GenerateEventRequest):
    """
    Generate a contextual game event based on the current game state.
    
    Uses deterministic rules with randomization, optionally enhanced by AI
    for more sophisticated narratives.
    """
    try:
        if request.use_ai:
            event = await generate_event_with_ai(
                country_iso=request.country_iso,
                country_name=request.country_name,
                current_year=request.current_year,
                ohi_score=request.ohi_score,
                pillars=request.pillars,
            )
        else:
            event = generate_event(
                country_iso=request.country_iso,
                country_name=request.country_name,
                current_year=request.current_year,
                ohi_score=request.ohi_score,
                pillars=request.pillars,
                recent_event_ids=request.recent_event_ids,
                active_policies=request.active_policies,
            )
        
        if event:
            return GenerateEventResponse(
                event=event,
                success=True,
                message=f"Generated {event.severity.value} {event.type.value} event"
            )
        else:
            return GenerateEventResponse(
                event=None,
                success=True,
                message="No event triggered this cycle"
            )
    
    except Exception as e:
        logger.error(f"Error generating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-summary", response_model=GenerateSummaryResponse)
async def generate_game_summary(request: GenerateSummaryRequest):
    """
    Generate an AI-powered end-game summary narrative.
    """
    try:
        # Calculate performance metrics
        score_change = request.final_score - request.starting_score
        rank_change = request.starting_rank - request.final_rank
        years = request.end_year - request.start_year
        
        # Determine grade
        if score_change >= 1.5:
            grade = "A+"
        elif score_change >= 1.0:
            grade = "A"
        elif score_change >= 0.7:
            grade = "B+"
        elif score_change >= 0.4:
            grade = "B"
        elif score_change >= 0.2:
            grade = "C+"
        elif score_change >= 0:
            grade = "C"
        elif score_change >= -0.3:
            grade = "D"
        else:
            grade = "F"
        
        # Generate narrative
        direction = "improved" if score_change > 0 else "declined" if score_change < 0 else "maintained"
        
        narrative = f"Over {years} years of leadership, {request.country_name} has {direction} its occupational health standing. "
        
        if score_change > 0.5:
            narrative += f"Your strategic investments in worker protection have paid off, moving the country from rank #{request.starting_rank} to #{request.final_rank}. "
        elif score_change > 0:
            narrative += "While progress was made, there remains room for more ambitious reforms. "
        elif score_change < 0:
            narrative += "The country faced significant challenges that impacted worker safety outcomes. "
        
        if request.policies_maxed > 5:
            narrative += f"You successfully maximized {request.policies_maxed} policies, demonstrating commitment to comprehensive reform. "
        
        if request.events_handled > 0:
            narrative += f"Your administration navigated {request.events_handled} events, testing your crisis management abilities."
        
        # Generate highlights
        highlights = []
        if score_change > 0:
            highlights.append(f"OHI Score improved by {score_change:.2f} points")
        if rank_change > 0:
            highlights.append(f"Climbed {rank_change} positions in global rankings")
        if request.policies_maxed > 0:
            highlights.append(f"Maximized {request.policies_maxed} policy investments")
        if request.events_handled > 0:
            highlights.append(f"Successfully managed {request.events_handled} events")
        
        # Generate recommendations
        recommendations = []
        if request.final_score < 3.0:
            recommendations.append("Consider strengthening governance and enforcement mechanisms")
        if request.policies_maxed < 5:
            recommendations.append("Focus on maximizing high-impact policies for better outcomes")
        recommendations.append("Continue investing in worker health surveillance systems")
        recommendations.append("Explore international partnerships for knowledge sharing")
        
        return GenerateSummaryResponse(
            narrative=narrative,
            highlights=highlights,
            recommendations=recommendations,
            grade=grade,
            success=True,
        )
    
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint for the simulator service."""
    return {"status": "healthy", "service": "simulator"}
