"""
GOHIP Platform - Saudi Arabia Comparison Analysis API
======================================================

AI-powered deep comparative analysis for Saudi Arabia vs benchmark countries.
Specifically designed for GOSI pitch tool.

Endpoints:
- POST /api/v1/saudi-analysis/{comparison_iso} - Generate comparison analysis
- GET /api/v1/saudi-analysis/{comparison_iso}/fallback - Get quick fallback data
"""

import logging
import json
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.models.user import User, AIConfig
from app.models.country import Country
from app.models.agent import Agent, DEFAULT_AGENTS
from app.services.agent_runner import AgentRunner
from app.services.country_data_provider import CountryDataProvider


# Create router
router = APIRouter(prefix="/saudi-analysis", tags=["Saudi Analysis"])

logger.info("Saudi Analysis router initialized")


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class SaudiAnalysisRequest(BaseModel):
    """Request for Saudi comparison analysis."""
    force_regenerate: bool = Field(False, description="Force regeneration")


class PillarComparison(BaseModel):
    """Comparison data for a single pillar."""
    pillar: str
    saudi_score: float
    benchmark_score: float
    gap: float
    saudi_assessment: str
    benchmark_assessment: str
    key_differences: List[str]
    transferable_lessons: List[str]
    priority_actions: List[str]


class MetricComparison(BaseModel):
    """Comparison data for a specific metric."""
    metric_name: str
    saudi_value: str
    benchmark_value: str
    gap: str
    significance: str
    improvement_potential: str


class StrategicRecommendation(BaseModel):
    """A strategic recommendation for GOSI."""
    priority: int
    recommendation: str
    rationale: str
    expected_impact: str
    complexity: str  # "high", "medium", "low"
    timeline: str  # "Short-term", "Medium-term", "Long-term"


class OverallComparison(BaseModel):
    """Overall comparison summary."""
    saudi_score: float
    benchmark_score: float
    gap_percentage: float
    gap_interpretation: str


class SaudiAnalysisResponse(BaseModel):
    """Full Saudi comparison analysis response."""
    analysis_title: str
    executive_overview: str
    overall_comparison: OverallComparison
    pillar_analysis: List[PillarComparison]
    metric_comparisons: List[MetricComparison]
    strategic_recommendations: List[StrategicRecommendation]
    implementation_roadmap: str
    conclusion: str
    generated_at: str
    comparison_country_iso: str
    comparison_country_name: str


class SaudiAnalysisError(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_ai_config(db: Session) -> Optional[AIConfig]:
    """Get active AI configuration."""
    return db.query(AIConfig).filter(AIConfig.is_active == True).first()


def get_country_data(db: Session, iso_code: str) -> Optional[Country]:
    """Get country with all relationships loaded."""
    return db.query(Country).filter(Country.iso_code == iso_code).first()


def ensure_agent_exists(db: Session, agent_id: str = "saudi-comparison-analyst") -> None:
    """Ensure the Saudi comparison agent exists in the database."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        # Find in default agents
        agent_config = next((a for a in DEFAULT_AGENTS if a["id"] == agent_id), None)
        if agent_config:
            agent = Agent(**agent_config)
            db.add(agent)
            db.commit()
            logger.info(f"Created {agent_id} agent")


def calculate_effective_score(country: Country) -> float:
    """Calculate effective OHI score for a country."""
    if country.maturity_score:
        return country.maturity_score
    
    # Fallback calculation
    scores = [
        country.governance_score,
        country.pillar1_score,
        country.pillar2_score,
        country.pillar3_score
    ]
    valid_scores = [s for s in scores if s is not None]
    if valid_scores:
        return sum(valid_scores) / len(valid_scores)
    return 0


def generate_fallback_response(
    saudi: Country,
    comparison: Country
) -> Dict[str, Any]:
    """Generate a fallback response without AI."""
    saudi_score = calculate_effective_score(saudi)
    comparison_score = calculate_effective_score(comparison)
    gap = comparison_score - saudi_score
    gap_pct = (gap / comparison_score * 100) if comparison_score > 0 else 0
    
    # Build pillar comparisons
    pillars = [
        ("Governance", saudi.governance_score or 0, comparison.governance_score or 0),
        ("Hazard Control", saudi.pillar1_score or 0, comparison.pillar1_score or 0),
        ("Vigilance", saudi.pillar2_score or 0, comparison.pillar2_score or 0),
        ("Restoration", saudi.pillar3_score or 0, comparison.pillar3_score or 0),
    ]
    
    pillar_analysis = []
    for pillar_name, saudi_val, comp_val in pillars:
        pillar_gap = comp_val - saudi_val
        pillar_analysis.append({
            "pillar": pillar_name,
            "saudi_score": saudi_val,
            "benchmark_score": comp_val,
            "gap": pillar_gap,
            "saudi_assessment": f"Saudi Arabia scores {saudi_val:.1f}% on {pillar_name}.",
            "benchmark_assessment": f"{comparison.name} scores {comp_val:.1f}% on {pillar_name}.",
            "key_differences": [f"Gap of {pillar_gap:.1f} percentage points"],
            "transferable_lessons": ["Further analysis needed"],
            "priority_actions": ["Conduct detailed gap analysis"]
        })
    
    return {
        "analysis_title": f"Saudi Arabia vs {comparison.name}: Framework Comparison",
        "executive_overview": f"Saudi Arabia (OHI Score: {saudi_score:.1f}) compared against {comparison.name} (OHI Score: {comparison_score:.1f}). The gap of {gap:.1f} points ({gap_pct:.1f}%) indicates significant opportunity for improvement across the occupational health framework.",
        "overall_comparison": {
            "saudi_score": saudi_score,
            "benchmark_score": comparison_score,
            "gap_percentage": gap_pct,
            "gap_interpretation": f"Saudi Arabia trails {comparison.name} by {gap:.1f} points on the OHI framework."
        },
        "pillar_analysis": pillar_analysis,
        "metric_comparisons": [],
        "strategic_recommendations": [
            {
                "priority": 1,
                "recommendation": "Conduct detailed gap analysis across all pillars",
                "rationale": f"With an overall gap of {gap:.1f} points, systematic analysis is needed",
                "expected_impact": "Clear improvement roadmap",
                "complexity": "medium",
                "timeline": "Short-term"
            }
        ],
        "implementation_roadmap": "A phased approach is recommended: Phase 1 - Detailed analysis and prioritization. Phase 2 - Quick wins in areas with largest gaps. Phase 3 - Systemic improvements requiring institutional changes.",
        "conclusion": f"Saudi Arabia has significant opportunity to improve its occupational health framework by learning from {comparison.name}'s approaches.",
        "generated_at": datetime.utcnow().isoformat(),
        "comparison_country_iso": comparison.iso_code,
        "comparison_country_name": comparison.name
    }


def parse_agent_response(response: str) -> Dict[str, Any]:
    """Parse AI agent response, handling potential JSON issues."""
    try:
        # Try direct parse
        return json.loads(response)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        import re
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', response)
        if json_match:
            try:
                return json.loads(json_match.group(1).strip())
            except json.JSONDecodeError:
                pass
        
        # Try to find JSON object
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        raise ValueError("Could not parse AI response as JSON")


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.post(
    "/{comparison_iso}",
    response_model=SaudiAnalysisResponse,
    responses={
        400: {"model": SaudiAnalysisError},
        404: {"model": SaudiAnalysisError},
        500: {"model": SaudiAnalysisError},
    },
)
async def generate_saudi_comparison(
    comparison_iso: str,
    request: SaudiAnalysisRequest = SaudiAnalysisRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a comprehensive comparison analysis between Saudi Arabia and a benchmark country.
    
    This endpoint uses AI to generate deep analytical insights for GOSI strategic planning.
    """
    logger.info(f"Generating Saudi comparison analysis vs {comparison_iso}")
    
    # Always compare against Saudi Arabia
    saudi_iso = "SAU"
    
    # Get Saudi Arabia data
    saudi = get_country_data(db, saudi_iso)
    if not saudi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saudi Arabia data not found in database"
        )
    
    # Get comparison country data
    comparison = get_country_data(db, comparison_iso.upper())
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country {comparison_iso} not found in database"
        )
    
    # Ensure agent exists
    ensure_agent_exists(db, "saudi-comparison-analyst")
    
    # Get AI configuration
    ai_config = get_ai_config(db)
    if not ai_config:
        logger.warning("No AI configuration found, using fallback")
        fallback = generate_fallback_response(saudi, comparison)
        return SaudiAnalysisResponse(**fallback)
    
    # Prepare data provider
    data_provider = CountryDataProvider(db)
    
    try:
        # Get comprehensive data for both countries
        saudi_data = data_provider.get_full_database_context(saudi_iso)
        comparison_data = data_provider.get_full_database_context(comparison_iso.upper())
        
        # Prepare framework metrics reference
        framework_metrics = """
FRAMEWORK METRICS:
- Overall OHI Score: Weighted average of all pillars (0-100 scale, mapped to 1.0-4.0 maturity)
- Governance: Legal framework, institutional capacity, enforcement mechanisms
- Hazard Control: Exposure limits, risk assessment, prevention infrastructure
- Vigilance: Disease surveillance, detection capacity, data quality
- Restoration: Compensation coverage, benefit adequacy, rehabilitation outcomes

KEY METRICS TO COMPARE:
- Fatal accident rate (per 100,000 workers)
- Inspector density (per 10,000 workers)
- ILO convention ratifications
- Workers' compensation coverage
- Return-to-work success rate
- Disease detection rate
"""
        
        # Initialize agent runner
        runner = AgentRunner(db=db, ai_config=ai_config)
        
        # Run the agent
        result = await runner.run_agent(
            agent_id="saudi-comparison-analyst",
            variables={
                "COMPARISON_ISO": comparison_iso.upper(),
                "COMPARISON_NAME": comparison.name,
                "SAUDI_DATA": saudi_data,
                "COMPARISON_DATA": comparison_data,
                "FRAMEWORK_METRICS": framework_metrics,
            },
            enable_web_search=True
        )
        
        if not result.get("success"):
            logger.error(f"Agent execution failed: {result.get('error')}")
            fallback = generate_fallback_response(saudi, comparison)
            return SaudiAnalysisResponse(**fallback)
        
        # Parse response
        content = result.get("content", "")
        analysis_data = parse_agent_response(content)
        
        # Add metadata
        analysis_data["generated_at"] = datetime.utcnow().isoformat()
        analysis_data["comparison_country_iso"] = comparison_iso.upper()
        analysis_data["comparison_country_name"] = comparison.name
        
        return SaudiAnalysisResponse(**analysis_data)
        
    except Exception as e:
        logger.error(f"Error generating Saudi analysis: {e}", exc_info=True)
        fallback = generate_fallback_response(saudi, comparison)
        return SaudiAnalysisResponse(**fallback)


@router.get(
    "/{comparison_iso}/fallback",
    response_model=SaudiAnalysisResponse,
    responses={
        404: {"model": SaudiAnalysisError},
    },
)
async def get_saudi_comparison_fallback(
    comparison_iso: str,
    db: Session = Depends(get_db),
):
    """
    Get a quick database-driven comparison without AI generation.
    
    This is faster than the AI-powered analysis and provides immediate results.
    """
    logger.info(f"Getting fallback Saudi comparison vs {comparison_iso}")
    
    # Get Saudi Arabia data
    saudi = get_country_data(db, "SAU")
    if not saudi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saudi Arabia data not found in database"
        )
    
    # Get comparison country data
    comparison = get_country_data(db, comparison_iso.upper())
    if not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country {comparison_iso} not found in database"
        )
    
    fallback = generate_fallback_response(saudi, comparison)
    return SaudiAnalysisResponse(**fallback)
