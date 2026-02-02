"""
GOHIP Platform - Pillar Analysis API Endpoints
===============================================

AI-powered deep analysis for individual framework pillars.
With persistent caching and admin-only generation.

Endpoints:
- POST /api/v1/pillar-analysis/{iso_code}/{pillar_id} - Get or generate pillar analysis
- GET /api/v1/pillar-analysis/{iso_code}/{pillar_id}/fallback - Get quick fallback
- POST /api/v1/summary-report/{iso_code} - Get or generate comprehensive summary
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
from app.models.country import Country, CachedPillarReport, CachedSummaryReport
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
    force_regenerate: bool = Field(False, description="Force regeneration (admin only)")


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
    cached: bool = False  # Indicates if this was from cache


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
    cached: bool = False  # Indicates if this was from cache


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


def is_admin(user: Optional[User]) -> bool:
    """Check if user is admin."""
    return user is not None and user.role == "admin"


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


def get_cached_pillar_report(db: Session, iso_code: str, pillar_id: str) -> Optional[CachedPillarReport]:
    """Get cached pillar report from database."""
    return db.query(CachedPillarReport).filter(
        CachedPillarReport.iso_code == iso_code.upper(),
        CachedPillarReport.pillar_id == pillar_id
    ).first()


def get_cached_summary_report(db: Session, iso_code: str) -> Optional[CachedSummaryReport]:
    """Get cached summary report from database."""
    return db.query(CachedSummaryReport).filter(
        CachedSummaryReport.iso_code == iso_code.upper()
    ).first()


def store_pillar_report(db: Session, iso_code: str, pillar_id: str, report_dict: dict, user_id: Optional[int]) -> None:
    """Store pillar report in database."""
    # Delete existing if any
    existing = get_cached_pillar_report(db, iso_code, pillar_id)
    if existing:
        db.delete(existing)
    
    # Create new cached report
    cached = CachedPillarReport(
        iso_code=iso_code.upper(),
        pillar_id=pillar_id,
        report_json=json.dumps(report_dict),
        generated_at=datetime.utcnow(),
        generated_by_id=user_id
    )
    db.add(cached)
    db.commit()
    logger.info(f"Stored pillar report: {iso_code}/{pillar_id}")


def store_summary_report(db: Session, iso_code: str, report_dict: dict, user_id: Optional[int]) -> None:
    """Store summary report in database."""
    # Delete existing if any
    existing = get_cached_summary_report(db, iso_code)
    if existing:
        db.delete(existing)
    
    # Create new cached report
    cached = CachedSummaryReport(
        iso_code=iso_code.upper(),
        report_json=json.dumps(report_dict),
        generated_at=datetime.utcnow(),
        generated_by_id=user_id
    )
    db.add(cached)
    db.commit()
    logger.info(f"Stored summary report: {iso_code}")


# =============================================================================
# PILLAR ANALYSIS ENDPOINTS
# =============================================================================

@router.post(
    "/{iso_code}/{pillar_id}",
    response_model=PillarAnalysisResponse,
    summary="Get or generate pillar analysis",
    description="Returns cached report if available, or generates new one (admin only).",
)
async def generate_pillar_analysis(
    iso_code: str,
    pillar_id: str,
    request: PillarAnalysisRequest = PillarAnalysisRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get or generate pillar analysis with caching."""
    
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
    
    # 1. Check for cached report
    cached = get_cached_pillar_report(db, iso_code, pillar_id)
    
    # 2. If cached and not force_regenerate, return cached
    if cached and not request.force_regenerate:
        logger.info(f"Returning cached pillar report: {iso_code}/{pillar_id}")
        report_dict = json.loads(cached.report_json)
        report_dict["cached"] = True
        return PillarAnalysisResponse(**report_dict)
    
    # 3. If force_regenerate requested, must be admin
    if request.force_regenerate and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for report regeneration"
        )
    
    # 4. If no cache exists, only admin can generate
    if not cached and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not yet generated for this country/pillar. Please contact an administrator."
        )
    
    # 5. Generate new report (admin only reaches here)
    logger.info(f"Generating new pillar report: {iso_code}/{pillar_id} by user {current_user.id if current_user else 'unknown'}")
    
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
        logger.warning("No AI config found, returning fallback")
        return generate_pillar_fallback_response(country, pillar_id)
    
    # Ensure agent exists
    agent = ensure_agent_exists(db, "pillar-analysis")
    if not agent:
        logger.warning("Agent not found, returning fallback")
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
        
        # Build response dict
        response_dict = {
            "iso_code": iso_code.upper(),
            "country_name": country.name,
            "pillar_id": pillar_id,
            "title": parsed.get("title", f"{country.name} - {PILLAR_NAMES[pillar_id]} Analysis"),
            "analysis_paragraphs": parsed.get("analysis_paragraphs", []),
            "key_insights": parsed.get("key_insights", []),
            "recommendations": parsed.get("recommendations", []),
            "generated_at": datetime.utcnow().isoformat(),
            "cached": False,
        }
        
        # Store in database
        store_pillar_report(
            db, 
            iso_code, 
            pillar_id, 
            response_dict, 
            current_user.id if current_user else None
        )
        
        return PillarAnalysisResponse(
            **response_dict,
            key_insights=[KeyInsight(**i) if isinstance(i, dict) else i for i in response_dict["key_insights"]],
            recommendations=[Recommendation(**r) if isinstance(r, dict) else r for r in response_dict["recommendations"]],
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
        cached=False,
    )


# =============================================================================
# SUMMARY REPORT ENDPOINTS
# =============================================================================

@summary_router.post(
    "/{iso_code}",
    response_model=SummaryReportResponse,
    summary="Get or generate summary report",
    description="Returns cached report if available, or generates new one (admin only).",
)
async def generate_summary_report(
    iso_code: str,
    request: PillarAnalysisRequest = PillarAnalysisRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Get or generate summary report with caching."""
    
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Country not found: {iso_code}")
    
    # 1. Check for cached report
    cached = get_cached_summary_report(db, iso_code)
    
    # 2. If cached and not force_regenerate, return cached
    if cached and not request.force_regenerate:
        logger.info(f"Returning cached summary report: {iso_code}")
        report_dict = json.loads(cached.report_json)
        report_dict["cached"] = True
        return SummaryReportResponse(**report_dict)
    
    # 3. If force_regenerate requested, must be admin
    if request.force_regenerate and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for report regeneration"
        )
    
    # 4. If no cache exists, only admin can generate
    if not cached and not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not yet generated for this country. Please contact an administrator."
        )
    
    # 5. Generate new report (admin only reaches here)
    logger.info(f"Generating new summary report: {iso_code} by user {current_user.id if current_user else 'unknown'}")
    
    # Get comparison data
    comparison_context = "No comparison country selected."
    if request.comparison_country and request.comparison_country != "global":
        comparison_country = get_country_data(db, request.comparison_country)
        if comparison_country:
            data_provider = CountryDataProvider(db)
            comparison_context = data_provider.get_database_context(request.comparison_country)
    
    ai_config = get_ai_config(db)
    if not ai_config:
        logger.warning("No AI config found, returning fallback")
        return generate_summary_fallback_response(country)
    
    agent = ensure_agent_exists(db, "summary-report")
    if not agent:
        logger.warning("Agent not found, returning fallback")
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
        
        # Build response dict
        response_dict = {
            "iso_code": iso_code.upper(),
            "country_name": country.name,
            "executive_summary": parsed.get("executive_summary", []),
            "strategic_priorities": parsed.get("strategic_priorities", []),
            "overall_assessment": parsed.get("overall_assessment", ""),
            "generated_at": datetime.utcnow().isoformat(),
            "cached": False,
        }
        
        # Store in database
        store_summary_report(
            db,
            iso_code,
            response_dict,
            current_user.id if current_user else None
        )
        
        return SummaryReportResponse(
            **response_dict,
            strategic_priorities=[
                StrategicPriority(**p) if isinstance(p, dict) else p 
                for p in response_dict["strategic_priorities"]
            ],
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
        cached=False,
    )
