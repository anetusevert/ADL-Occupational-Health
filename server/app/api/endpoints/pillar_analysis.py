"""
GOHIP Platform - Pillar Analysis API Endpoints
===============================================

AI-powered deep analysis for individual framework pillars.

Endpoints:
- POST /api/v1/pillar-analysis/{iso_code}/{pillar_id} - Generate pillar analysis
- GET /api/v1/pillar-analysis/{iso_code}/{pillar_id}/fallback - Get quick fallback
- POST /api/v1/summary-report/{iso_code} - Generate comprehensive summary
- GET /api/v1/summary-report/{iso_code}/fallback - Get quick summary fallback
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
router = APIRouter(prefix="/pillar-analysis", tags=["Pillar Analysis"])

# Summary report router (separate prefix)
summary_router = APIRouter(prefix="/summary-report", tags=["Summary Report"])

logger.info("Pillar Analysis router initialized")


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PillarAnalysisRequest(BaseModel):
    """Request for pillar analysis."""
    comparison_country: Optional[str] = Field("global", description="Comparison country ISO or 'global'")


class KeyInsight(BaseModel):
    """A key insight from the analysis."""
    insight: str
    implication: str


class Recommendation(BaseModel):
    """A strategic recommendation."""
    action: str
    rationale: str
    expected_impact: str


class PillarAnalysisResponse(BaseModel):
    """Response with pillar analysis."""
    iso_code: str
    country_name: str
    pillar_id: str
    title: str
    analysis_paragraphs: List[str]
    key_insights: List[KeyInsight]
    recommendations: List[Recommendation]
    generated_at: str


class StrategicPriority(BaseModel):
    """A strategic priority item."""
    priority: str
    rationale: str
    pillar: str
    urgency: str  # high, medium, low


class SummaryReportResponse(BaseModel):
    """Response with summary report."""
    iso_code: str
    country_name: str
    executive_summary: List[str]
    strategic_priorities: List[StrategicPriority]
    overall_assessment: str
    generated_at: str


# =============================================================================
# PILLAR CONFIGS
# =============================================================================

PILLAR_NAMES = {
    "governance": "Governance",
    "hazard-control": "Hazard Control",
    "vigilance": "Vigilance",
    "restoration": "Restoration",
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_ai_config(db: Session) -> Optional[AIConfig]:
    """Get AI configuration from database."""
    try:
        return db.query(AIConfig).first()
    except Exception:
        return None


def get_country_data(db: Session, iso_code: str) -> Optional[Country]:
    """Fetch country with all relationships."""
    try:
        country = db.query(Country).filter(Country.iso_code == iso_code.upper()).first()
        return country
    except Exception as e:
        logger.error(f"Error fetching country {iso_code}: {e}")
        return None


def parse_agent_response(response_text: str) -> Dict[str, Any]:
    """Parse JSON response from agent."""
    try:
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse agent response: {e}")
        return {
            "title": "Analysis Unavailable",
            "analysis_paragraphs": [response_text[:500] if response_text else "Unable to generate analysis."],
            "key_insights": [],
            "recommendations": []
        }


def ensure_agent_exists(db: Session, agent_id: str) -> Optional[Agent]:
    """Ensure agent exists, seed if needed."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        # Try to seed from defaults
        for agent_data in DEFAULT_AGENTS:
            if agent_data["id"] == agent_id:
                agent = Agent(**agent_data)
                db.add(agent)
                db.commit()
                db.refresh(agent)
                return agent
    return agent


# =============================================================================
# PILLAR ANALYSIS ENDPOINTS
# =============================================================================

@router.post(
    "/{iso_code}/{pillar_id}",
    response_model=PillarAnalysisResponse,
    summary="Generate pillar analysis",
    description="Generate AI-powered deep analysis for a specific framework pillar.",
)
async def generate_pillar_analysis(
    iso_code: str,
    pillar_id: str,
    request: PillarAnalysisRequest = PillarAnalysisRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Generate in-depth analysis for a framework pillar."""
    
    # Validate pillar
    if pillar_id not in PILLAR_NAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pillar_id. Must be one of: {', '.join(PILLAR_NAMES.keys())}"
        )
    
    # Get country
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Country not found: {iso_code}")
    
    # Get comparison data
    comparison_context = "No comparison country selected."
    if request.comparison_country and request.comparison_country != "global":
        comparison_country = get_country_data(db, request.comparison_country)
        if comparison_country:
            data_provider = CountryDataProvider(db)
            comparison_context = data_provider.get_database_context(request.comparison_country)
    
    # Get AI config
    ai_config = get_ai_config(db)
    if not ai_config:
        # Return fallback if no AI config
        return generate_pillar_fallback_response(country, pillar_id)
    
    # Ensure agent exists
    agent = ensure_agent_exists(db, "pillar-analysis")
    if not agent:
        return generate_pillar_fallback_response(country, pillar_id)
    
    try:
        runner = AgentRunner(db, ai_config)
        
        result = await runner.run(
            agent_id="pillar-analysis",
            variables={
                "ISO_CODE": iso_code.upper(),
                "PILLAR_ID": pillar_id,
                "PILLAR_NAME": PILLAR_NAMES[pillar_id],
                "COMPARISON_DATA": comparison_context,
            },
            enable_web_search=True,
        )
        
        parsed = parse_agent_response(result.get("output", ""))
        
        return PillarAnalysisResponse(
            iso_code=iso_code.upper(),
            country_name=country.name,
            pillar_id=pillar_id,
            title=parsed.get("title", f"{country.name} - {PILLAR_NAMES[pillar_id]} Analysis"),
            analysis_paragraphs=parsed.get("analysis_paragraphs", []),
            key_insights=[KeyInsight(**i) for i in parsed.get("key_insights", [])],
            recommendations=[Recommendation(**r) for r in parsed.get("recommendations", [])],
            generated_at=datetime.utcnow().isoformat(),
        )
        
    except Exception as e:
        logger.error(f"Pillar analysis generation failed: {e}", exc_info=True)
        return generate_pillar_fallback_response(country, pillar_id)


@router.get(
    "/{iso_code}/{pillar_id}/fallback",
    response_model=PillarAnalysisResponse,
    summary="Get fallback pillar analysis",
)
async def get_pillar_fallback(
    iso_code: str,
    pillar_id: str,
    db: Session = Depends(get_db),
):
    """Get quick fallback analysis for a pillar."""
    
    if pillar_id not in PILLAR_NAMES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid pillar_id")
    
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Country not found: {iso_code}")
    
    return generate_pillar_fallback_response(country, pillar_id)


def generate_pillar_fallback_response(country: Country, pillar_id: str) -> PillarAnalysisResponse:
    """Generate fallback pillar analysis from database."""
    
    pillar_name = PILLAR_NAMES.get(pillar_id, pillar_id)
    
    descriptions = {
        "governance": [
            f"The governance architecture of {country.name} encompasses the strategic capacity, international alignment, and institutional infrastructure for occupational health.",
            "Key governance components include ILO convention ratification status, labor inspection capacity, and policy frameworks for workplace health.",
            "Effective governance forms the foundation upon which all other pillars are built, determining enforcement effectiveness and system coherence."
        ],
        "hazard-control": [
            f"{country.name}'s hazard control infrastructure addresses workplace safety through exposure standards, prevention systems, and enforcement mechanisms.",
            "Core components include occupational exposure limits (OELs), heat stress regulations, carcinogen exposure monitoring, and safety training requirements.",
            "This pillar directly impacts worker safety outcomes including fatal accident rates and occupational disease prevalence."
        ],
        "vigilance": [
            f"The vigilance architecture for {country.name} covers health surveillance systems, disease detection capabilities, and vulnerable population monitoring.",
            "Key elements include surveillance approach (risk-based vs mandatory), disease reporting systems, and screening programs for high-risk exposures.",
            "Effective vigilance enables early detection and intervention, reducing long-term health impacts and system costs."
        ],
        "restoration": [
            f"{country.name}'s restoration architecture follows ILO frameworks for workers' compensation, rehabilitation, and return-to-work support.",
            "The rehabilitation chain spans from acute care through medical, vocational, and social reintegration—each stage with its own payer and operator architecture.",
            "Strong restoration systems protect worker livelihoods and maintain labor force productivity following occupational injuries or diseases."
        ],
    }
    
    return PillarAnalysisResponse(
        iso_code=country.iso_code,
        country_name=country.name,
        pillar_id=pillar_id,
        title=f"{country.name}: {pillar_name} Architecture Assessment",
        analysis_paragraphs=descriptions.get(pillar_id, ["Analysis content is being generated."]),
        key_insights=[
            KeyInsight(insight="Architecture component mapping available", implication="Each component shows top 3 global leaders"),
            KeyInsight(insight="ILO-aligned framework structure", implication="Enables international benchmarking")
        ],
        recommendations=[
            Recommendation(action="Review component-level gaps", rationale="Identify specific infrastructure weaknesses", expected_impact="Targeted improvement opportunities")
        ],
        generated_at=datetime.utcnow().isoformat(),
    )


# =============================================================================
# SUMMARY REPORT ENDPOINTS
# =============================================================================

@summary_router.post(
    "/{iso_code}",
    response_model=SummaryReportResponse,
    summary="Generate summary report",
    description="Generate comprehensive McKinsey-grade summary across all pillars.",
)
async def generate_summary_report(
    iso_code: str,
    request: PillarAnalysisRequest = PillarAnalysisRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Generate comprehensive summary report."""
    
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Country not found: {iso_code}")
    
    # Get comparison data
    comparison_context = "No comparison country selected."
    if request.comparison_country and request.comparison_country != "global":
        comparison_country = get_country_data(db, request.comparison_country)
        if comparison_country:
            data_provider = CountryDataProvider(db)
            comparison_context = data_provider.get_database_context(request.comparison_country)
    
    ai_config = get_ai_config(db)
    if not ai_config:
        return generate_summary_fallback_response(country)
    
    agent = ensure_agent_exists(db, "summary-report")
    if not agent:
        return generate_summary_fallback_response(country)
    
    try:
        runner = AgentRunner(db, ai_config)
        
        result = await runner.run(
            agent_id="summary-report",
            variables={
                "ISO_CODE": iso_code.upper(),
                "COMPARISON_DATA": comparison_context,
            },
            enable_web_search=True,
        )
        
        parsed = parse_agent_response(result.get("output", ""))
        
        return SummaryReportResponse(
            iso_code=iso_code.upper(),
            country_name=country.name,
            executive_summary=parsed.get("executive_summary", []),
            strategic_priorities=[
                StrategicPriority(**p) for p in parsed.get("strategic_priorities", [])
            ],
            overall_assessment=parsed.get("overall_assessment", ""),
            generated_at=datetime.utcnow().isoformat(),
        )
        
    except Exception as e:
        logger.error(f"Summary report generation failed: {e}", exc_info=True)
        return generate_summary_fallback_response(country)


@summary_router.get(
    "/{iso_code}/fallback",
    response_model=SummaryReportResponse,
    summary="Get fallback summary",
)
async def get_summary_fallback(
    iso_code: str,
    db: Session = Depends(get_db),
):
    """Get quick fallback summary report."""
    
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Country not found: {iso_code}")
    
    return generate_summary_fallback_response(country)


def generate_summary_fallback_response(country: Country) -> SummaryReportResponse:
    """Generate fallback summary from database."""
    
    gov = country.governance
    p1 = country.pillar_1_hazard
    p2 = country.pillar_2_vigilance
    p3 = country.pillar_3_restoration
    
    scores = {
        "governance": gov.strategic_capacity_score if gov else None,
        "hazard-control": p1.control_maturity_score if p1 else None,
        "vigilance": p2.disease_detection_rate if p2 else None,
        "restoration": p3.rehab_access_score if p3 else None,
    }
    
    valid_scores = [s for s in scores.values() if s is not None]
    avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0
    
    # Find weakest and strongest
    sorted_scores = [(k, v) for k, v in scores.items() if v is not None]
    sorted_scores.sort(key=lambda x: x[1])
    weakest = sorted_scores[0] if sorted_scores else None
    strongest = sorted_scores[-1] if sorted_scores else None
    
    executive = [
        f"{country.name} demonstrates an average framework score of {avg_score:.0f}% across available pillars, indicating a {'developing' if avg_score < 50 else 'moderate' if avg_score < 70 else 'mature'} occupational health system.",
    ]
    
    if strongest:
        executive.append(f"The strongest performance is in {PILLAR_NAMES[strongest[0]]} ({strongest[1]:.0f}%), providing a foundation for system development.")
    
    if weakest:
        executive.append(f"Priority attention is needed in {PILLAR_NAMES[weakest[0]]} ({weakest[1]:.0f}%) to address critical infrastructure gaps.")
    
    priorities = []
    if weakest:
        priorities.append(StrategicPriority(
            priority=f"Strengthen {PILLAR_NAMES[weakest[0]]} infrastructure",
            rationale="Lowest-performing pillar requires focused investment",
            pillar=PILLAR_NAMES[weakest[0]],
            urgency="high"
        ))
    
    priorities.append(StrategicPriority(
        priority="Align with ILO conventions",
        rationale="International standards provide roadmap for improvement",
        pillar="Governance",
        urgency="medium"
    ))
    
    return SummaryReportResponse(
        iso_code=country.iso_code,
        country_name=country.name,
        executive_summary=executive,
        strategic_priorities=priorities,
        overall_assessment=f"{country.name} presents a {'developing' if avg_score < 50 else 'advancing'} occupational health framework with clear opportunities for targeted improvement across multiple pillars.",
        generated_at=datetime.utcnow().isoformat(),
    )
