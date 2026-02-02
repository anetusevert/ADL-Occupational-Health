"""
Best Practices Compendium API
=============================

Provides endpoints for the Best Practices Compendium feature:
- Browse framework pillars and strategic questions
- Get AI-generated best practice content
- View top countries for each question
- Get country-specific best practice case studies

Uses AgentRunner with dedicated best-practice agents.
"""

import asyncio
import logging
import json
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User, AIConfig
from app.models.country import Country
from app.models.agent import Agent, DEFAULT_AGENTS
from app.models.best_practice import (
    BestPractice,
    CountryBestPractice,
    STRATEGIC_QUESTIONS,
    get_questions_by_pillar,
    get_question_by_id,
)
from app.services.agent_runner import AgentRunner

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/best-practices", tags=["Best Practices"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PillarInfo(BaseModel):
    """Summary of a framework pillar."""
    id: str
    name: str
    description: str
    icon: str
    color: str
    question_count: int
    completed_count: int


class PillarsResponse(BaseModel):
    """All pillars with their status."""
    pillars: List[PillarInfo]
    total_questions: int
    completed_questions: int


class QuestionInfo(BaseModel):
    """A strategic question with its status."""
    question_id: str
    question_title: str
    question_text: str
    pillar: str
    status: str  # pending, completed, generating, failed
    generated_at: Optional[str] = None


class PillarDetailResponse(BaseModel):
    """Single pillar with all its questions."""
    pillar_id: str
    pillar_name: str
    pillar_description: str
    icon: str
    color: str
    questions: List[QuestionInfo]


class TopCountry(BaseModel):
    """A top-performing country for a question."""
    iso_code: str
    name: str
    rank: int
    score: int
    summary: str
    flag_url: Optional[str] = None
    has_detail: bool = False  # Whether CountryBestPractice exists


class KeyPrinciple(BaseModel):
    """A key principle for best practice."""
    title: str
    description: str


class ImplementationElement(BaseModel):
    """An implementation element."""
    element: str
    description: str
    examples: Optional[str] = None


class BestPracticeResponse(BaseModel):
    """Complete best practice content for a question."""
    question_id: str
    question_title: str
    question_text: str
    pillar: str
    status: str
    
    # AI-generated content
    best_practice_overview: Optional[str] = None
    key_principles: List[Any] = []
    implementation_elements: List[Any] = []
    success_factors: List[str] = []
    common_pitfalls: List[str] = []
    
    # Top countries
    top_countries: List[TopCountry] = []
    
    # Metadata
    generated_at: Optional[str] = None
    ai_provider: Optional[str] = None


class CountryMetric(BaseModel):
    """A country metric with context."""
    metric: str
    value: str
    context: str


class PolicyHighlight(BaseModel):
    """A notable policy."""
    policy: str
    description: str
    year_enacted: Optional[str] = None


class CountryBestPracticeResponse(BaseModel):
    """Country-specific best practice case study."""
    country_iso_code: str
    country_name: str
    question_id: str
    question_title: str
    pillar: str
    rank: Optional[int] = None
    score: Optional[int] = None
    status: str
    
    # AI-generated content
    approach_description: Optional[str] = None
    why_best_practice: Optional[str] = None
    key_metrics: List[Any] = []
    policy_highlights: List[Any] = []
    lessons_learned: Optional[str] = None
    transferability: Optional[str] = None
    
    # Metadata
    flag_url: Optional[str] = None
    generated_at: Optional[str] = None


class GenerateRequest(BaseModel):
    """Request to generate best practice content."""
    force_regenerate: bool = False


# =============================================================================
# PILLAR DEFINITIONS
# =============================================================================

PILLAR_DEFINITIONS = {
    "governance": {
        "id": "governance",
        "name": "Governance Ecosystem",
        "description": "Strategic capacity & policy foundations",
        "icon": "crown",
        "color": "purple",
    },
    "hazard": {
        "id": "hazard",
        "name": "Hazard Prevention",
        "description": "Pillar I — Prevention & Control",
        "icon": "shield",
        "color": "blue",
    },
    "vigilance": {
        "id": "vigilance",
        "name": "Surveillance & Detection",
        "description": "Pillar II — Health Vigilance",
        "icon": "eye",
        "color": "emerald",
    },
    "restoration": {
        "id": "restoration",
        "name": "Restoration & Compensation",
        "description": "Pillar III — Recovery & Support",
        "icon": "heart",
        "color": "amber",
    },
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def ensure_agents_exist(db: Session) -> None:
    """Ensure best practice agents exist in database."""
    for agent_data in DEFAULT_AGENTS:
        if agent_data["id"] in ["best-practice-overview", "country-best-practice"]:
            existing = db.query(Agent).filter(Agent.id == agent_data["id"]).first()
            if not existing:
                new_agent = Agent(
                    id=agent_data["id"],
                    name=agent_data["name"],
                    description=agent_data["description"],
                    system_prompt=agent_data["system_prompt"],
                    user_prompt_template=agent_data["user_prompt_template"],
                    template_variables=agent_data["template_variables"],
                    icon=agent_data["icon"],
                    color=agent_data["color"],
                    is_active=True,
                )
                db.add(new_agent)
    db.commit()


def get_flag_url(iso_code: str) -> str:
    """Generate flag CDN URL from ISO code."""
    iso2_map = {
        'SAU': 'sa', 'ARE': 'ae', 'QAT': 'qa', 'KWT': 'kw', 'BHR': 'bh', 'OMN': 'om',
        'DEU': 'de', 'GBR': 'gb', 'USA': 'us', 'FRA': 'fr', 'ESP': 'es', 'ITA': 'it',
        'NLD': 'nl', 'BEL': 'be', 'AUT': 'at', 'CHE': 'ch', 'POL': 'pl', 'CZE': 'cz',
        'JPN': 'jp', 'CHN': 'cn', 'KOR': 'kr', 'IND': 'in', 'AUS': 'au', 'NZL': 'nz',
        'BRA': 'br', 'MEX': 'mx', 'CAN': 'ca', 'ARG': 'ar', 'CHL': 'cl', 'COL': 'co',
        'ZAF': 'za', 'EGY': 'eg', 'NGA': 'ng', 'KEN': 'ke', 'SWE': 'se', 'NOR': 'no',
        'DNK': 'dk', 'FIN': 'fi', 'SGP': 'sg', 'MYS': 'my', 'THA': 'th', 'IDN': 'id',
    }
    iso2 = iso2_map.get(iso_code.upper(), iso_code[:2].lower())
    return f"https://flagcdn.com/w80/{iso2}.png"


def get_top_countries_for_pillar(db: Session, pillar: str, limit: int = 5) -> List[dict]:
    """Get top countries based on pillar score."""
    score_field_map = {
        "governance": "governance_score",
        "hazard": "pillar1_score",
        "vigilance": "pillar2_score",
        "restoration": "pillar3_score",
    }
    score_field = score_field_map.get(pillar, "governance_score")
    
    countries = db.query(Country).filter(
        getattr(Country, score_field).isnot(None)
    ).order_by(
        desc(getattr(Country, score_field))
    ).limit(limit).all()
    
    result = []
    for idx, country in enumerate(countries):
        score = getattr(country, score_field) or 0
        result.append({
            "iso_code": country.iso_code,
            "name": country.name,
            "rank": idx + 1,
            "score": int(score),
            "summary": f"Ranked #{idx + 1} globally for {PILLAR_DEFINITIONS[pillar]['name'].lower()}.",
            "flag_url": get_flag_url(country.iso_code),
        })
    
    return result


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/pillars", response_model=PillarsResponse)
async def get_all_pillars(db: Session = Depends(get_db)):
    """
    Get all 4 framework pillars with their completion status.
    """
    pillars = []
    total_questions = len(STRATEGIC_QUESTIONS)
    completed_questions = 0
    
    for pillar_id, pillar_def in PILLAR_DEFINITIONS.items():
        questions = get_questions_by_pillar(pillar_id)
        question_count = len(questions)
        
        # Check how many questions have completed content
        completed = db.query(BestPractice).filter(
            BestPractice.pillar == pillar_id,
            BestPractice.status == "completed"
        ).count()
        
        completed_questions += completed
        
        pillars.append(PillarInfo(
            id=pillar_def["id"],
            name=pillar_def["name"],
            description=pillar_def["description"],
            icon=pillar_def["icon"],
            color=pillar_def["color"],
            question_count=question_count,
            completed_count=completed,
        ))
    
    return PillarsResponse(
        pillars=pillars,
        total_questions=total_questions,
        completed_questions=completed_questions,
    )


@router.get("/pillar/{pillar_id}", response_model=PillarDetailResponse)
async def get_pillar_detail(pillar_id: str, db: Session = Depends(get_db)):
    """
    Get a single pillar with all its questions and their statuses.
    """
    if pillar_id not in PILLAR_DEFINITIONS:
        raise HTTPException(status_code=404, detail=f"Pillar '{pillar_id}' not found")
    
    pillar_def = PILLAR_DEFINITIONS[pillar_id]
    questions_data = get_questions_by_pillar(pillar_id)
    
    questions = []
    for q_data in questions_data:
        # Check if content exists
        bp = db.query(BestPractice).filter(
            BestPractice.question_id == q_data["question_id"]
        ).first()
        
        questions.append(QuestionInfo(
            question_id=q_data["question_id"],
            question_title=q_data["question_title"],
            question_text=q_data["question_text"],
            pillar=pillar_id,
            status=bp.status if bp else "pending",
            generated_at=bp.generated_at.isoformat() if bp and bp.generated_at else None,
        ))
    
    return PillarDetailResponse(
        pillar_id=pillar_def["id"],
        pillar_name=pillar_def["name"],
        pillar_description=pillar_def["description"],
        icon=pillar_def["icon"],
        color=pillar_def["color"],
        questions=questions,
    )


@router.get("/question/{question_id}", response_model=BestPracticeResponse)
async def get_best_practice(question_id: str, db: Session = Depends(get_db)):
    """
    Get best practice content for a specific question.
    Includes the AI-generated overview and top 5 countries.
    """
    # Get question definition
    q_data = get_question_by_id(question_id)
    if not q_data:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found")
    
    # Get stored best practice
    bp = db.query(BestPractice).filter(
        BestPractice.question_id == question_id
    ).first()
    
    # Get top countries (from stored data or calculate)
    top_countries = []
    if bp and bp.top_countries:
        for tc in bp.top_countries:
            # Check if country detail exists
            has_detail = db.query(CountryBestPractice).filter(
                CountryBestPractice.country_iso_code == tc.get("iso_code"),
                CountryBestPractice.question_id == question_id,
                CountryBestPractice.status == "completed"
            ).first() is not None
            
            top_countries.append(TopCountry(
                iso_code=tc.get("iso_code", ""),
                name=tc.get("name", ""),
                rank=tc.get("rank", 0),
                score=tc.get("score", 0),
                summary=tc.get("summary", ""),
                flag_url=get_flag_url(tc.get("iso_code", "")),
                has_detail=has_detail,
            ))
    else:
        # Calculate from database
        top_data = get_top_countries_for_pillar(db, q_data["pillar"], 5)
        for tc in top_data:
            top_countries.append(TopCountry(**tc, has_detail=False))
    
    return BestPracticeResponse(
        question_id=question_id,
        question_title=q_data["question_title"],
        question_text=q_data["question_text"],
        pillar=q_data["pillar"],
        status=bp.status if bp else "pending",
        best_practice_overview=bp.best_practice_overview if bp else None,
        key_principles=bp.key_principles or [] if bp else [],
        implementation_elements=bp.implementation_elements or [] if bp else [],
        success_factors=bp.success_factors or [] if bp else [],
        common_pitfalls=bp.common_pitfalls or [] if bp else [],
        top_countries=top_countries,
        generated_at=bp.generated_at.isoformat() if bp and bp.generated_at else None,
        ai_provider=bp.ai_provider if bp else None,
    )


@router.get("/country/{iso_code}/{question_id}", response_model=CountryBestPracticeResponse)
async def get_country_best_practice(
    iso_code: str,
    question_id: str,
    db: Session = Depends(get_db)
):
    """
    Get country-specific best practice analysis for a question.
    """
    iso_code = iso_code.upper()
    
    # Validate country exists
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(status_code=404, detail=f"Country '{iso_code}' not found")
    
    # Validate question exists
    q_data = get_question_by_id(question_id)
    if not q_data:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found")
    
    # Get stored country best practice
    cbp = db.query(CountryBestPractice).filter(
        CountryBestPractice.country_iso_code == iso_code,
        CountryBestPractice.question_id == question_id,
    ).first()
    
    return CountryBestPracticeResponse(
        country_iso_code=iso_code,
        country_name=country.name,
        question_id=question_id,
        question_title=q_data["question_title"],
        pillar=q_data["pillar"],
        rank=cbp.rank if cbp else None,
        score=cbp.score if cbp else None,
        status=cbp.status if cbp else "pending",
        approach_description=cbp.approach_description if cbp else None,
        why_best_practice=cbp.why_best_practice if cbp else None,
        key_metrics=cbp.key_metrics or [] if cbp else [],
        policy_highlights=cbp.policy_highlights or [] if cbp else [],
        lessons_learned=cbp.lessons_learned if cbp else None,
        transferability=cbp.transferability if cbp else None,
        flag_url=get_flag_url(iso_code),
        generated_at=cbp.generated_at.isoformat() if cbp and cbp.generated_at else None,
    )


@router.post("/generate/{question_id}", response_model=BestPracticeResponse)
async def generate_best_practice(
    question_id: str,
    request: GenerateRequest = GenerateRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Generate or regenerate best practice content for a question.
    Admin only.
    """
    # Validate question exists
    q_data = get_question_by_id(question_id)
    if not q_data:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found")
    
    # Ensure agents exist
    ensure_agents_exist(db)
    
    # Get or create BestPractice record
    bp = db.query(BestPractice).filter(
        BestPractice.question_id == question_id
    ).first()
    
    if bp and not request.force_regenerate:
        if bp.status == "completed":
            # Return existing content
            return await get_best_practice(question_id, db)
        elif bp.status == "generating":
            raise HTTPException(status_code=409, detail="Generation already in progress")
    
    if not bp:
        bp = BestPractice(
            pillar=q_data["pillar"],
            question_id=question_id,
            question_title=q_data["question_title"],
            question_text=q_data["question_text"],
            status="generating",
        )
        db.add(bp)
    else:
        bp.status = "generating"
        bp.error_message = None
    
    db.commit()
    db.refresh(bp)
    
    try:
        # Get AI config
        ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
        if not ai_config:
            raise HTTPException(status_code=400, detail="No AI configuration found")
        
        # Run the best practice agent
        runner = AgentRunner(db, ai_config)
        
        start_time = datetime.utcnow()
        result = await asyncio.wait_for(
            runner.run(
                agent_id="best-practice-overview",
                variables={
                    "QUESTION_ID": question_id,
                    "QUESTION_TITLE": q_data["question_title"],
                    "QUESTION_TEXT": q_data["question_text"],
                    "PILLAR": PILLAR_DEFINITIONS[q_data["pillar"]]["name"],
                },
                update_stats=True,
                enable_web_search=False,  # Use database context only
            ),
            timeout=120.0,
        )
        end_time = datetime.utcnow()
        
        if not result["success"]:
            bp.status = "failed"
            bp.error_message = result.get("error", "Unknown error")
            db.commit()
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        # Parse JSON response
        output = result["output"]
        try:
            if isinstance(output, str):
                # Clean up potential markdown wrapping
                if "```json" in output:
                    output = output.split("```json")[1].split("```")[0]
                elif "```" in output:
                    output = output.split("```")[1].split("```")[0]
                data = json.loads(output)
            else:
                data = output
        except json.JSONDecodeError as e:
            bp.status = "failed"
            bp.error_message = f"Failed to parse AI response: {str(e)}"
            db.commit()
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
        # Update BestPractice with generated content
        bp.best_practice_overview = data.get("best_practice_overview")
        bp.key_principles = data.get("key_principles", [])
        bp.implementation_elements = data.get("implementation_elements", [])
        bp.success_factors = data.get("success_factors", [])
        bp.common_pitfalls = data.get("common_pitfalls", [])
        bp.top_countries = data.get("top_countries", [])
        bp.status = "completed"
        bp.generated_at = datetime.utcnow()
        bp.ai_provider = ai_config.provider.value if ai_config.provider else "unknown"
        bp.generation_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        db.commit()
        
        logger.info(f"Generated best practice for {question_id} in {bp.generation_time_ms}ms")
        
        return await get_best_practice(question_id, db)
        
    except asyncio.TimeoutError:
        bp.status = "failed"
        bp.error_message = "Generation timed out"
        db.commit()
        raise HTTPException(status_code=504, detail="Generation timed out")
    except Exception as e:
        bp.status = "failed"
        bp.error_message = str(e)
        db.commit()
        logger.exception(f"Failed to generate best practice for {question_id}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-country/{iso_code}/{question_id}", response_model=CountryBestPracticeResponse)
async def generate_country_best_practice(
    iso_code: str,
    question_id: str,
    request: GenerateRequest = GenerateRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Generate or regenerate country-specific best practice analysis.
    Admin only.
    """
    iso_code = iso_code.upper()
    
    # Validate country exists
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(status_code=404, detail=f"Country '{iso_code}' not found")
    
    # Validate question exists
    q_data = get_question_by_id(question_id)
    if not q_data:
        raise HTTPException(status_code=404, detail=f"Question '{question_id}' not found")
    
    # Ensure agents exist
    ensure_agents_exist(db)
    
    # Get or create CountryBestPractice record
    cbp = db.query(CountryBestPractice).filter(
        CountryBestPractice.country_iso_code == iso_code,
        CountryBestPractice.question_id == question_id,
    ).first()
    
    if cbp and not request.force_regenerate:
        if cbp.status == "completed":
            return await get_country_best_practice(iso_code, question_id, db)
        elif cbp.status == "generating":
            raise HTTPException(status_code=409, detail="Generation already in progress")
    
    # Calculate country's rank/score for this pillar
    score_field_map = {
        "governance": "governance_score",
        "hazard": "pillar1_score",
        "vigilance": "pillar2_score",
        "restoration": "pillar3_score",
    }
    score_field = score_field_map.get(q_data["pillar"], "governance_score")
    country_score = int(getattr(country, score_field) or 0)
    
    # Calculate rank
    higher_count = db.query(Country).filter(
        getattr(Country, score_field) > country_score
    ).count()
    country_rank = higher_count + 1
    
    if not cbp:
        cbp = CountryBestPractice(
            country_iso_code=iso_code,
            question_id=question_id,
            pillar=q_data["pillar"],
            rank=country_rank,
            score=country_score,
            status="generating",
        )
        db.add(cbp)
    else:
        cbp.status = "generating"
        cbp.rank = country_rank
        cbp.score = country_score
        cbp.error_message = None
    
    db.commit()
    db.refresh(cbp)
    
    try:
        # Get AI config
        ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
        if not ai_config:
            raise HTTPException(status_code=400, detail="No AI configuration found")
        
        # Run the country best practice agent
        runner = AgentRunner(db, ai_config)
        
        result = await asyncio.wait_for(
            runner.run(
                agent_id="country-best-practice",
                variables={
                    "ISO_CODE": iso_code,
                    "COUNTRY_NAME": country.name,
                    "QUESTION_ID": question_id,
                    "QUESTION_TITLE": q_data["question_title"],
                    "QUESTION_TEXT": q_data["question_text"],
                    "PILLAR": PILLAR_DEFINITIONS[q_data["pillar"]]["name"],
                    "RANK": str(country_rank),
                    "SCORE": str(country_score),
                },
                update_stats=True,
                enable_web_search=False,
            ),
            timeout=120.0,
        )
        
        if not result["success"]:
            cbp.status = "failed"
            cbp.error_message = result.get("error", "Unknown error")
            db.commit()
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        # Parse JSON response
        output = result["output"]
        try:
            if isinstance(output, str):
                if "```json" in output:
                    output = output.split("```json")[1].split("```")[0]
                elif "```" in output:
                    output = output.split("```")[1].split("```")[0]
                data = json.loads(output)
            else:
                data = output
        except json.JSONDecodeError as e:
            cbp.status = "failed"
            cbp.error_message = f"Failed to parse AI response: {str(e)}"
            db.commit()
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
        # Update CountryBestPractice with generated content
        cbp.approach_description = data.get("approach_description")
        cbp.why_best_practice = data.get("why_best_practice")
        cbp.key_metrics = data.get("key_metrics", [])
        cbp.policy_highlights = data.get("policy_highlights", [])
        cbp.lessons_learned = data.get("lessons_learned")
        cbp.transferability = data.get("transferability")
        cbp.status = "completed"
        cbp.generated_at = datetime.utcnow()
        cbp.ai_provider = ai_config.provider.value if ai_config.provider else "unknown"
        
        db.commit()
        
        logger.info(f"Generated country best practice for {iso_code}/{question_id}")
        
        return await get_country_best_practice(iso_code, question_id, db)
        
    except asyncio.TimeoutError:
        cbp.status = "failed"
        cbp.error_message = "Generation timed out"
        db.commit()
        raise HTTPException(status_code=504, detail="Generation timed out")
    except Exception as e:
        cbp.status = "failed"
        cbp.error_message = str(e)
        db.commit()
        logger.exception(f"Failed to generate country best practice for {iso_code}/{question_id}")
        raise HTTPException(status_code=500, detail=str(e))
