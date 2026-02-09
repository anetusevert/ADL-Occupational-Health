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
from sqlalchemy import func, desc, asc

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.models.user import User, AIConfig
from app.models.country import Country, CachedPillarReport, CachedSummaryReport
from app.models.agent import Agent, DEFAULT_AGENTS
from app.models.best_practice import BestPractice, STRATEGIC_QUESTIONS
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


# New strategic question-based format
class Citation(BaseModel):
    """A citation from database or research."""
    text: str
    source: str  # "database" or "research"
    reference: str


class QuestionAnswer(BaseModel):
    """Answer to a strategic question."""
    summary: str
    detailed: List[str]
    citations: List[Citation] = []
    status: str  # "complete", "partial", "gap"
    score: float


class BestPracticeLeader(BaseModel):
    """A best practice leader country."""
    country_iso: str
    country_name: str
    score: int
    what_they_do: str
    how_they_do_it: str
    key_lesson: str
    sources: List[str] = []


class StrategicQuestionResponse(BaseModel):
    """Response for a single strategic question."""
    question_id: str
    question: str
    answer: QuestionAnswer
    best_practices: List[BestPracticeLeader] = []


class PillarAnalysisResponse(BaseModel):
    """Response with pillar analysis - strategic question format."""
    pillar_id: str
    pillar_name: str
    country_iso: str
    country_name: str
    overall_score: float
    questions: List[StrategicQuestionResponse]
    generated_at: str
    cached: bool = False
    sources_used: Optional[Dict[str, Any]] = None


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


def get_pillar_best_practices(db: Session, pillar_id: str) -> Dict[str, Any]:
    """Get best practice leaders from the database for a pillar.
    
    Returns a dict with:
    - top_countries: list of top performing countries
    - strategic_questions: list of questions for this pillar
    """
    # Map pillar_id to pillar name for best practices
    pillar_map = {
        "governance": "governance",
        "hazard-control": "hazard",
        "vigilance": "vigilance",
        "restoration": "restoration",
    }
    pillar_name = pillar_map.get(pillar_id, pillar_id)
    
    # Score field map for querying top countries
    score_field_map = {
        "governance": "governance_score",
        "hazard-control": "pillar1_score",
        "vigilance": "pillar2_score",
        "restoration": "pillar3_score",
    }
    score_field = score_field_map.get(pillar_id, "governance_score")
    
    # Get top 5 countries by pillar score
    from sqlalchemy import desc
    top_countries = []
    try:
        countries = db.query(Country).filter(
            getattr(Country, score_field).isnot(None)
        ).order_by(
            desc(getattr(Country, score_field))
        ).limit(5).all()
        
        for idx, country in enumerate(countries):
            score = getattr(country, score_field) or 0
            top_countries.append({
                "iso_code": country.iso_code,
                "name": country.name,
                "rank": idx + 1,
                "score": int(score * 100) if score <= 1 else int(score),
            })
    except Exception as e:
        logger.warning(f"Error getting top countries for {pillar_id}: {e}")
    
    # Get strategic questions for this pillar
    questions = [q for q in STRATEGIC_QUESTIONS if q["pillar"] == pillar_name]
    
    # Get cached best practice data if available
    cached_best_practices = []
    try:
        bp_records = db.query(BestPractice).filter(
            BestPractice.pillar == pillar_name,
            BestPractice.status == "completed"
        ).all()
        
        for bp in bp_records:
            cached_bp = {
                "question_id": bp.question_id,
                "question_title": bp.question_title,
                "top_countries": bp.top_countries or [],
            }
            cached_best_practices.append(cached_bp)
    except Exception as e:
        logger.warning(f"Error getting cached best practices: {e}")
    
    return {
        "top_countries": top_countries,
        "strategic_questions": questions,
        "cached_best_practices": cached_best_practices,
    }


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


def normalize_comparison_country(comparison_country: Optional[str]) -> str:
    """Normalize comparison country input for cache compatibility checks."""
    if not comparison_country or comparison_country.lower() == "global":
        return "global"
    return comparison_country.upper()


def get_country_database_context(db: Session, iso_code: str) -> str:
    """Get database context text for a single country ISO code."""
    provider = CountryDataProvider(db)
    context = provider.get_country_context(iso_code)
    if not context:
        return f"No comparison context available for {iso_code.upper()}."
    return context.get("DATABASE_CONTEXT", f"No comparison context available for {iso_code.upper()}.")


def build_global_comparison_context(db: Session, top_n: int = 5) -> str:
    """Build a concise global benchmark context for AI prompts."""
    total_countries = db.query(func.count(Country.iso_code)).scalar() or 0

    avg_maturity = db.query(func.avg(Country.maturity_score)).scalar()
    avg_governance = db.query(func.avg(Country.governance_score)).scalar()
    avg_hazard = db.query(func.avg(Country.pillar1_score)).scalar()
    avg_vigilance = db.query(func.avg(Country.pillar2_score)).scalar()
    avg_restoration = db.query(func.avg(Country.pillar3_score)).scalar()

    top_countries = (
        db.query(Country)
        .filter(Country.maturity_score.isnot(None))
        .order_by(desc(Country.maturity_score))
        .limit(top_n)
        .all()
    )
    lowest_countries = (
        db.query(Country)
        .filter(Country.maturity_score.isnot(None))
        .order_by(asc(Country.maturity_score))
        .limit(top_n)
        .all()
    )

    lines = [
        "GLOBAL BENCHMARK CONTEXT",
        f"- Total countries in benchmark set: {int(total_countries)}",
        "",
        "Global average scores:",
        f"- Overall maturity: {avg_maturity:.1f}" if avg_maturity is not None else "- Overall maturity: N/A",
        f"- Governance: {avg_governance:.1f}" if avg_governance is not None else "- Governance: N/A",
        f"- Hazard Control: {avg_hazard:.1f}" if avg_hazard is not None else "- Hazard Control: N/A",
        f"- Vigilance: {avg_vigilance:.1f}" if avg_vigilance is not None else "- Vigilance: N/A",
        f"- Restoration: {avg_restoration:.1f}" if avg_restoration is not None else "- Restoration: N/A",
        "",
        f"Top {top_n} countries by maturity score:",
    ]

    for idx, country in enumerate(top_countries, start=1):
        lines.append(f"- #{idx} {country.name} ({country.iso_code}): {country.maturity_score:.1f}")

    lines.append("")
    lines.append(f"Bottom {top_n} countries by maturity score:")
    for idx, country in enumerate(lowest_countries, start=1):
        lines.append(f"- #{idx} {country.name} ({country.iso_code}): {country.maturity_score:.1f}")

    return "\n".join(lines)


def is_cache_compatible(report_dict: Dict[str, Any], comparison_country: str) -> bool:
    """Validate whether a cached report matches the requested comparison context."""
    cached_comparison = normalize_comparison_country(report_dict.get("_comparison_country"))
    return cached_comparison == comparison_country


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


def get_or_create_agent(db: Session, agent_id: str) -> Optional[Agent]:
    """Get or create agent from database."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        # Try to create from defaults
        for agent_data in DEFAULT_AGENTS:
            if agent_data["id"] == agent_id:
                agent = Agent(**agent_data)
                db.add(agent)
                db.commit()
                db.refresh(agent)
                return agent
    return agent


def build_pillar_user_prompt(country_name: str, pillar_id: str, country_context: str) -> str:
    """Build user prompt for pillar analysis."""
    pillar_name = PILLAR_NAMES.get(pillar_id, pillar_id)
    
    return f"""Analyze the {pillar_name} pillar for {country_name}.

Country Context:
{country_context}

Provide a comprehensive analysis following the required JSON format. Include:
1. Analysis of current state and gaps
2. Key insights with specific data points
3. Actionable recommendations

Focus on McKinsey-grade consulting quality with specific, evidence-based findings."""


def build_summary_user_prompt(country_name: str, country_context: str, comparison: str) -> str:
    """Build user prompt for summary report."""
    return f"""Create a comprehensive strategic assessment for {country_name}.

Country Context:
{country_context}

Comparison: {comparison}

Provide a McKinsey-grade executive summary covering:
1. Overall system assessment
2. Key strengths and gaps
3. Strategic priorities
4. Recommendations for improvement"""


# =============================================================================
# REPORT STATUS ENDPOINT
# =============================================================================

class ReportStatusItem(BaseModel):
    """Status of a single report."""
    has_report: bool
    generated_at: Optional[str] = None


class ReportStatusResponse(BaseModel):
    """Response containing report status for all pillars and summary."""
    governance: ReportStatusItem
    hazard_control: ReportStatusItem = Field(..., alias="hazard-control")
    vigilance: ReportStatusItem
    restoration: ReportStatusItem
    summary: ReportStatusItem
    
    class Config:
        populate_by_name = True


@router.get(
    "/{iso_code}/status",
    response_model=dict,
    summary="Check report status for a country",
    description="Returns which pillars have cached reports for the given country.",
)
async def get_report_status(
    iso_code: str,
    db: Session = Depends(get_db),
):
    """Check which pillars have cached reports for a country."""
    iso_code = iso_code.upper()
    pillars = ["governance", "hazard-control", "vigilance", "restoration"]
    
    status = {}
    for pillar_id in pillars:
        cached = get_cached_pillar_report(db, iso_code, pillar_id)
        status[pillar_id] = {
            "has_report": cached is not None,
            "generated_at": cached.generated_at.isoformat() if cached else None
        }
    
    # Check summary report
    summary = get_cached_summary_report(db, iso_code)
    status["summary"] = {
        "has_report": summary is not None,
        "generated_at": summary.generated_at.isoformat() if summary else None
    }
    
    return status


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
    
    normalized_comparison_country = normalize_comparison_country(request.comparison_country)

    # 1. Check for cached report
    cached = get_cached_pillar_report(db, iso_code, pillar_id)
    
    # 2. If cached and not force_regenerate, return cached
    if cached and not request.force_regenerate:
        report_dict = json.loads(cached.report_json)
        if is_cache_compatible(report_dict, normalized_comparison_country):
            logger.info(f"Returning cached pillar report: {iso_code}/{pillar_id} ({normalized_comparison_country})")
            report_dict["cached"] = True
            return PillarAnalysisResponse(**report_dict)
        logger.info(
            f"Cached pillar report context mismatch for {iso_code}/{pillar_id}. "
            f"Requested={normalized_comparison_country}, cached={report_dict.get('_comparison_country')}"
        )
        cached = None
    
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
    comparison_context = build_global_comparison_context(db)
    if normalized_comparison_country != "global":
        comparison_country = get_country_data(db, normalized_comparison_country)
        if comparison_country:
            comparison_context = get_country_database_context(db, normalized_comparison_country)
    
    # Get best practice leaders from database
    best_practice_data = get_pillar_best_practices(db, pillar_id)
    best_practice_context = json.dumps({
        "top_countries": best_practice_data["top_countries"],
        "strategic_questions": [
            {"question_id": q["question_id"], "title": q["question_title"], "text": q["question_text"]}
            for q in best_practice_data["strategic_questions"]
        ],
    }, indent=2)
    
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
                "BEST_PRACTICE_LEADERS": best_practice_context,
            },
            enable_web_search=True,
        )
        
        # Parse JSON response from agent
        parsed = parse_agent_response(result.get("output", ""))
        
        # Validate it has questions array - if not, use fallback
        if "questions" not in parsed or not isinstance(parsed.get("questions"), list):
            logger.warning("Agent returned invalid format (no questions array), using fallback")
            return generate_pillar_fallback_response(country, pillar_id, best_practice_data)
        
        # Get pillar score for overall_score
        pillar_score = get_pillar_score(country, pillar_id)
        
        # Build response dict with new format
        response_dict = {
            "pillar_id": pillar_id,
            "pillar_name": PILLAR_NAMES[pillar_id],
            "country_iso": iso_code.upper(),
            "country_name": country.name,
            "overall_score": parsed.get("overall_score", pillar_score or 50),
            "questions": parsed["questions"],
            "generated_at": datetime.utcnow().isoformat(),
            "cached": False,
            "sources_used": parsed.get("sources_used"),
            "_comparison_country": normalized_comparison_country,
        }
        
        # Store in database
        store_pillar_report(
            db, 
            iso_code, 
            pillar_id, 
            response_dict, 
            current_user.id if current_user else None
        )
        
        return PillarAnalysisResponse(**response_dict)
        
    except Exception as e:
        logger.error(f"Pillar analysis generation failed: {e}", exc_info=True)
        return generate_pillar_fallback_response(country, pillar_id, best_practice_data)


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
    
    # Get best practice leaders from database
    best_practice_data = get_pillar_best_practices(db, pillar_id)
    
    return generate_pillar_fallback_response(country, pillar_id, best_practice_data)


def get_pillar_score(country: Country, pillar_id: str) -> Optional[float]:
    """Get pillar score from country object."""
    score_field_map = {
        "governance": "governance_score",
        "hazard-control": "pillar1_score",
        "vigilance": "pillar2_score",
        "restoration": "pillar3_score",
    }
    field = score_field_map.get(pillar_id)
    if field and hasattr(country, field):
        score = getattr(country, field)
        if score is not None:
            # Normalize to 0-100 if score is in 0-1 range
            return score * 100 if score <= 1 else score
    return None


# Strategic questions for fallback (matches frontend structure)
PILLAR_QUESTIONS = {
    "governance": [
        {"id": "legal-foundation", "title": "Legal Foundation", "question": "Does the country have comprehensive OH legislation aligned with ILO conventions?"},
        {"id": "institutional-setup", "title": "Institutional Architecture", "question": "Are there dedicated institutions with clear mandates for OH policy and enforcement?"},
        {"id": "enforcement-capacity", "title": "Enforcement Capacity", "question": "Does the country have sufficient inspection resources to enforce OH standards?"},
        {"id": "strategic-planning", "title": "Strategic Planning", "question": "Is there a current national OH strategy with measurable targets?"},
    ],
    "hazard-control": [
        {"id": "exposure-standards", "title": "Exposure Standards", "question": "Are occupational exposure limits set and enforced for key hazards?"},
        {"id": "risk-assessment", "title": "Risk Assessment Systems", "question": "Is workplace risk assessment mandatory and systematically implemented?"},
        {"id": "prevention-infrastructure", "title": "Prevention Infrastructure", "question": "Are prevention services available and accessible to all workplaces?"},
        {"id": "safety-outcomes", "title": "Safety Outcomes", "question": "What is the country's performance on preventing workplace injuries and fatalities?"},
    ],
    "vigilance": [
        {"id": "surveillance-architecture", "title": "Surveillance Architecture", "question": "Is there a systematic approach to detecting and recording occupational diseases?"},
        {"id": "detection-capacity", "title": "Detection Capacity", "question": "How effectively are occupational diseases identified and attributed to work?"},
        {"id": "data-quality", "title": "Data Quality", "question": "Is OH surveillance data comprehensive, reliable, and used for policy?"},
        {"id": "vulnerable-populations", "title": "Vulnerable Populations", "question": "Are high-risk and informal sector workers adequately monitored?"},
    ],
    "restoration": [
        {"id": "payer-architecture", "title": "Payer Architecture", "question": "Who finances workplace injury and disease compensation, and is coverage universal?"},
        {"id": "benefit-adequacy", "title": "Benefit Adequacy", "question": "Are compensation benefits sufficient to maintain living standards during recovery?"},
        {"id": "rehabilitation-chain", "title": "Rehabilitation Chain", "question": "Is there an integrated pathway from injury through treatment to return-to-work?"},
        {"id": "recovery-outcomes", "title": "Recovery Outcomes", "question": "What percentage of injured workers successfully return to productive employment?"},
    ],
}


def generate_pillar_fallback_response(
    country: Country, 
    pillar_id: str, 
    best_practice_data: Optional[Dict] = None
) -> PillarAnalysisResponse:
    """Generate fallback pillar analysis with strategic questions format."""
    
    pillar_name = PILLAR_NAMES.get(pillar_id, pillar_id)
    pillar_score = get_pillar_score(country, pillar_id) or 50
    
    # Get questions for this pillar
    questions_def = PILLAR_QUESTIONS.get(pillar_id, [])
    
    # Get top countries from best_practice_data or use defaults
    top_countries = []
    if best_practice_data and "top_countries" in best_practice_data:
        top_countries = best_practice_data["top_countries"][:3]
    
    # Build questions array
    questions = []
    for i, q_def in enumerate(questions_def):
        # Determine status based on overall score
        status = "complete" if pillar_score >= 70 else "partial" if pillar_score >= 40 else "gap"
        q_score = max(20, min(95, pillar_score + (i * 5 - 10)))  # Slight variation per question
        
        # Build best practice leaders from top countries
        best_practices = []
        for idx, tc in enumerate(top_countries[:3]):
            best_practices.append(BestPracticeLeader(
                country_iso=tc.get("iso_code", "DEU"),
                country_name=tc.get("name", "Germany"),
                score=tc.get("score", 90 - idx * 5),
                what_they_do=f"{tc.get('name', 'This country')} has established a comprehensive framework for {q_def['title'].lower()} with robust institutional support.",
                how_they_do_it="Through dedicated legislation, well-resourced enforcement, and strong tripartite collaboration between government, employers, and workers.",
                key_lesson=f"Investment in {q_def['title'].lower()} infrastructure and stakeholder engagement yields sustainable outcomes.",
                sources=["ILO Database", "ISSA Reports", "National Statistics"],
            ))
        
        # Add default leaders if none from database
        if not best_practices:
            default_leaders = [
                ("DEU", "Germany", 92),
                ("SWE", "Sweden", 89),
                ("JPN", "Japan", 85),
            ]
            for iso, name, score in default_leaders:
                best_practices.append(BestPracticeLeader(
                    country_iso=iso,
                    country_name=name,
                    score=score,
                    what_they_do=f"{name} has established a comprehensive framework for this area with robust institutional support.",
                    how_they_do_it="Through dedicated legislation, well-resourced enforcement, and strong tripartite collaboration.",
                    key_lesson="Investment in institutional capacity and stakeholder engagement yields sustainable outcomes.",
                    sources=["ILO Database", "ISSA Reports"],
                ))
        
        questions.append(StrategicQuestionResponse(
            question_id=q_def["id"],
            question=q_def["question"],
            answer=QuestionAnswer(
                summary=f"{country.name}'s {q_def['title'].lower()} framework {('meets' if status == 'complete' else 'partially meets' if status == 'partial' else 'has gaps in meeting')} international standards.",
                detailed=[
                    f"The assessment of {country.name}'s {q_def['title'].lower()} reveals {('strong alignment with international best practices' if status == 'complete' else 'moderate progress with room for improvement' if status == 'partial' else 'significant gaps requiring strategic attention')}.",
                    f"Analysis based on available database metrics and research indicates {('comprehensive implementation' if status == 'complete' else 'partial implementation with identified weaknesses' if status == 'partial' else 'fundamental infrastructure gaps')} in this area.",
                ],
                citations=[
                    Citation(
                        text=f"{pillar_name} score: {pillar_score:.0f}%",
                        source="database",
                        reference=f"pillar{'3' if pillar_id == 'restoration' else '2' if pillar_id == 'vigilance' else '1' if pillar_id == 'hazard-control' else ''}_score",
                    ),
                ],
                status=status,
                score=q_score,
            ),
            best_practices=best_practices,
        ))
    
    return PillarAnalysisResponse(
        pillar_id=pillar_id,
        pillar_name=pillar_name,
        country_iso=country.iso_code,
        country_name=country.name,
        overall_score=pillar_score,
        questions=questions,
        generated_at=datetime.utcnow().isoformat(),
        cached=False,
        sources_used={"database_fields": [f"pillar_score"], "web_sources": []},
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
    
    normalized_comparison_country = normalize_comparison_country(request.comparison_country)

    # 1. Check for cached report
    cached = get_cached_summary_report(db, iso_code)
    
    # 2. If cached and not force_regenerate, return cached
    if cached and not request.force_regenerate:
        report_dict = json.loads(cached.report_json)
        if is_cache_compatible(report_dict, normalized_comparison_country):
            logger.info(f"Returning cached summary report: {iso_code} ({normalized_comparison_country})")
            report_dict["cached"] = True
            return SummaryReportResponse(**report_dict)
        logger.info(
            f"Cached summary report context mismatch for {iso_code}. "
            f"Requested={normalized_comparison_country}, cached={report_dict.get('_comparison_country')}"
        )
        cached = None
    
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
    comparison_context = build_global_comparison_context(db)
    if normalized_comparison_country != "global":
        comparison_country = get_country_data(db, normalized_comparison_country)
        if comparison_country:
            comparison_context = get_country_database_context(db, normalized_comparison_country)
    
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
            "_comparison_country": normalized_comparison_country,
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


# =============================================================================
# BATCH GENERATION ENDPOINTS
# =============================================================================

class BatchGenerationStatus(BaseModel):
    """Status of batch report generation."""
    iso_code: str
    total: int = 5
    completed: int = 0
    in_progress: str = ""
    results: Dict[str, str] = {}  # pillar_id -> status ("success", "cached", "error")
    message: str = ""

batch_router = APIRouter(prefix="/batch-generate", tags=["Batch Generation"])


@batch_router.post("/{iso_code}", response_model=BatchGenerationStatus)
async def batch_generate_reports(
    iso_code: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate all reports for a country (4 pillars + summary).
    Admin only. Runs synchronously to completion.
    """
    iso_code = iso_code.upper()
    
    # Admin check
    if not current_user or not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required for batch generation"
        )
    
    # Verify country exists
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {iso_code}"
        )
    
    logger.info(f"[BatchGenerate] Starting batch generation for {iso_code}")
    
    status_response = BatchGenerationStatus(
        iso_code=iso_code,
        total=5,
        completed=0,
        results={}
    )
    
    # Pillars to generate
    pillars = ["governance", "hazard-control", "vigilance", "restoration"]
    
    # Check for existing cached reports
    for pillar_id in pillars:
        cached = get_cached_pillar_report(db, iso_code, pillar_id)
        if cached:
            status_response.results[pillar_id] = "cached"
            status_response.completed += 1
    
    # Check for cached summary
    cached_summary = get_cached_summary_report(db, iso_code)
    if cached_summary:
        status_response.results["summary"] = "cached"
        status_response.completed += 1
    
    # If all cached, return early
    if status_response.completed == 5:
        status_response.message = "All reports already cached"
        return status_response
    
    # Generate missing pillar reports
    for pillar_id in pillars:
        if pillar_id in status_response.results:
            continue  # Already cached
        
        status_response.in_progress = pillar_id
        logger.info(f"[BatchGenerate] Generating {pillar_id} for {iso_code}")
        
        try:
            # Get AI config
            ai_config = get_ai_config(db)
            if not ai_config or not ai_config.api_key:
                status_response.results[pillar_id] = "error: No AI config"
                continue
            
            # Get agent
            agent = get_or_create_agent(db, "pillar-analysis")
            if not agent:
                status_response.results[pillar_id] = "error: No agent"
                continue
            
            # Build prompt
            data_provider = CountryDataProvider(db)
            country_context = data_provider.get_country_context_full(iso_code)
            
            agent_runner = AgentRunner(
                api_key=ai_config.api_key,
                model=ai_config.model,
                temperature=ai_config.temperature,
                max_tokens=ai_config.max_tokens,
            )
            
            user_prompt = build_pillar_user_prompt(country.name, pillar_id, country_context)
            
            result = agent_runner.run_sync(
                system_prompt=agent.system_prompt,
                user_prompt=user_prompt,
            )
            
            if result.get("success") and result.get("response"):
                # Parse and store
                try:
                    parsed = json.loads(result["response"])
                    store_pillar_report(db, iso_code, pillar_id, result["response"], current_user.id if current_user else None)
                    status_response.results[pillar_id] = "success"
                    status_response.completed += 1
                except json.JSONDecodeError:
                    status_response.results[pillar_id] = "error: Invalid JSON"
            else:
                status_response.results[pillar_id] = f"error: {result.get('error', 'Unknown')}"
        except Exception as e:
            logger.error(f"[BatchGenerate] Error generating {pillar_id}: {e}")
            status_response.results[pillar_id] = f"error: {str(e)[:50]}"
    
    # Generate summary if not cached
    if "summary" not in status_response.results:
        status_response.in_progress = "summary"
        logger.info(f"[BatchGenerate] Generating summary for {iso_code}")
        
        try:
            ai_config = get_ai_config(db)
            agent = get_or_create_agent(db, "summary-report")
            
            if ai_config and ai_config.api_key and agent:
                data_provider = CountryDataProvider(db)
                country_context = data_provider.get_country_context_full(iso_code)
                
                agent_runner = AgentRunner(
                    api_key=ai_config.api_key,
                    model=ai_config.model,
                    temperature=ai_config.temperature,
                    max_tokens=ai_config.max_tokens,
                )
                
                user_prompt = build_summary_user_prompt(country.name, country_context, "global")
                
                result = agent_runner.run_sync(
                    system_prompt=agent.system_prompt,
                    user_prompt=user_prompt,
                )
                
                if result.get("success") and result.get("response"):
                    try:
                        parsed = json.loads(result["response"])
                        store_summary_report(db, iso_code, result["response"], current_user.id if current_user else None)
                        status_response.results["summary"] = "success"
                        status_response.completed += 1
                    except json.JSONDecodeError:
                        status_response.results["summary"] = "error: Invalid JSON"
                else:
                    status_response.results["summary"] = f"error: {result.get('error', 'Unknown')}"
            else:
                status_response.results["summary"] = "error: Missing config/agent"
        except Exception as e:
            logger.error(f"[BatchGenerate] Error generating summary: {e}")
            status_response.results["summary"] = f"error: {str(e)[:50]}"
    
    status_response.in_progress = ""
    status_response.message = f"Batch generation complete. {status_response.completed}/{status_response.total} reports ready."
    
    logger.info(f"[BatchGenerate] Completed for {iso_code}: {status_response.results}")
    
    return status_response
