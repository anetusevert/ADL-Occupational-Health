"""
GOHIP Platform - Personas API
=============================

API endpoints for Saudi Arabia labor force personas.
Provides persona data and AI-generated research with caching.

Endpoints:
- GET /api/v1/personas - List all personas
- GET /api/v1/personas/{persona_id} - Get persona details
- GET /api/v1/personas/{persona_id}/research - Get cached research
- POST /api/v1/personas/research - Generate new research (with AI agent)
"""

import logging
import json
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import get_db, Base
from app.core.dependencies import get_current_user, get_current_user_optional
from app.models.user import User, UserRole, AIConfig
from app.services.agent_runner import AgentRunner

# Create router
router = APIRouter(prefix="/personas", tags=["Personas"])

logger.info("Personas router initialized")


# =============================================================================
# DATABASE MODEL FOR CACHED RESEARCH
# =============================================================================

class CachedPersonaResearch(Base):
    """Cached AI-generated research for personas."""
    __tablename__ = "cached_persona_research"
    
    persona_id = Column(String(100), primary_key=True)
    research_data = Column(JSONB, nullable=True)
    generated_at = Column(DateTime, nullable=True)
    generated_by = Column(String(100), nullable=True)


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PersonaDemographics(BaseModel):
    """Demographics data for a persona."""
    population_share: float = Field(..., description="Percentage of labor force")
    participation_rate: float = Field(..., description="Labor force participation rate")
    unemployment_rate: float = Field(..., description="Unemployment rate")
    key_age_group: str = Field(..., description="Primary age group")
    primary_sectors: List[str] = Field(default_factory=list)


class PersonaCoverage(BaseModel):
    """GOSI coverage details for a persona."""
    annuities: bool = Field(..., description="Has annuities coverage")
    occupational_hazards: bool = Field(..., description="Has OH coverage")
    contribution_rate: str = Field(..., description="Contribution rate description")
    payer: str = Field(..., description="Who pays: employer, shared, none")
    gaps: List[str] = Field(default_factory=list)


class PersonaJourneyStep(BaseModel):
    """A step in the OH journey."""
    title: str
    description: str
    duration: str
    icon: str


class PersonaOHJourney(BaseModel):
    """OH journey for a persona."""
    steps: List[PersonaJourneyStep]
    total_duration: str
    outcome: str


class PersonaSource(BaseModel):
    """Research source citation."""
    title: str
    url: str
    type: str = Field(..., description="official, academic, or news")
    date: str


class PersonaResearch(BaseModel):
    """AI-generated research for a persona."""
    key_risks: List[str]
    challenges: List[str]
    recent_changes: List[str]
    sources: List[PersonaSource]


class PersonaResponse(BaseModel):
    """Full persona response."""
    id: str
    name: str
    arabic_name: str
    tagline: str
    description: str
    avatar_url: str
    color: str
    gradient: str
    demographics: PersonaDemographics
    coverage: PersonaCoverage
    oh_journey: PersonaOHJourney
    research: PersonaResearch


class PersonaSummary(BaseModel):
    """Summary of a persona for listing."""
    id: str
    name: str
    tagline: str
    color: str
    coverage_status: str
    participation_rate: float


class PersonaListResponse(BaseModel):
    """List of all personas."""
    total: int
    personas: List[PersonaSummary]


class ResearchRequest(BaseModel):
    """Request to generate persona research."""
    persona_id: str
    persona_name: str
    persona_description: str
    enable_web_search: bool = True


class ResearchResponse(BaseModel):
    """Response from AI-generated research."""
    persona_id: str
    persona_name: str
    research_summary: Optional[str] = None
    demographics: Optional[Dict[str, Any]] = None
    gosi_coverage: Optional[Dict[str, Any]] = None
    occupational_risks: Optional[List[Dict[str, Any]]] = None
    injury_journey: Optional[Dict[str, Any]] = None
    financial_impact: Optional[Dict[str, Any]] = None
    recent_developments: Optional[List[Dict[str, Any]]] = None
    sources: Optional[List[Dict[str, Any]]] = None
    generated_at: Optional[str] = None
    cached: bool = False


# =============================================================================
# STATIC PERSONA DATA
# =============================================================================

# This matches the frontend personas.ts data
PERSONAS_DATA = [
    {
        "id": "saudi-male-professional",
        "name": "Saudi Male Professional",
        "arabic_name": "الموظف السعودي",
        "tagline": "The Backbone of Saudization",
        "description": "Full-time Saudi national working in the private or government sector.",
        "avatar_url": "/personas/saudi-male-professional.png",
        "color": "purple",
        "gradient": "from-purple-500/20 to-violet-600/20",
        "demographics": {
            "population_share": 24,
            "participation_rate": 64.0,
            "unemployment_rate": 4.3,
            "key_age_group": "25-54",
            "primary_sectors": ["Government", "Finance & Banking", "Oil & Gas", "Technology", "Healthcare"]
        },
        "coverage": {
            "annuities": True,
            "occupational_hazards": True,
            "contribution_rate": "22% (phased by 2028)",
            "payer": "shared",
            "gaps": ["Mental health coverage still developing", "Long-term disability support varies by sector"]
        },
        "coverage_status": "full"
    },
    {
        "id": "saudi-female-professional",
        "name": "Saudi Female Professional",
        "arabic_name": "الموظفة السعودية",
        "tagline": "Vision 2030's Rising Force",
        "description": "Saudi women entering the workforce at unprecedented rates.",
        "avatar_url": "/personas/saudi-female-professional.png",
        "color": "cyan",
        "gradient": "from-cyan-500/20 to-teal-600/20",
        "demographics": {
            "population_share": 12,
            "participation_rate": 34.5,
            "unemployment_rate": 11.3,
            "key_age_group": "25-44",
            "primary_sectors": ["Education", "Healthcare", "Retail", "Finance", "Tourism"]
        },
        "coverage": {
            "annuities": True,
            "occupational_hazards": True,
            "contribution_rate": "22% (phased by 2028)",
            "payer": "shared",
            "gaps": ["Maternity leave coordination with GOSI", "Workplace harassment protections developing"]
        },
        "coverage_status": "full"
    },
    {
        "id": "migrant-construction-worker",
        "name": "Migrant Construction Worker",
        "arabic_name": "العامل المهاجر",
        "tagline": "Building the Kingdom",
        "description": "Expatriate workers forming approximately 76% of the private sector workforce.",
        "avatar_url": "/personas/migrant-construction-worker.png",
        "color": "amber",
        "gradient": "from-amber-500/20 to-orange-600/20",
        "demographics": {
            "population_share": 45,
            "participation_rate": 95.0,
            "unemployment_rate": 0.5,
            "key_age_group": "20-45",
            "primary_sectors": ["Construction", "Manufacturing", "Transportation", "Utilities", "Mining"]
        },
        "coverage": {
            "annuities": False,
            "occupational_hazards": True,
            "contribution_rate": "2% employer only",
            "payer": "employer",
            "gaps": ["No retirement/pension benefits", "No unemployment insurance", "Limited legal recourse"]
        },
        "coverage_status": "partial"
    },
    {
        "id": "domestic-worker",
        "name": "Domestic Worker",
        "arabic_name": "العامل المنزلي",
        "tagline": "The Invisible Workforce",
        "description": "Housemaids, drivers, and gardeners working in private households.",
        "avatar_url": "/personas/domestic-worker.png",
        "color": "rose",
        "gradient": "from-rose-500/20 to-pink-600/20",
        "demographics": {
            "population_share": 15,
            "participation_rate": 98.0,
            "unemployment_rate": 0.2,
            "key_age_group": "25-50",
            "primary_sectors": ["Private Households"]
        },
        "coverage": {
            "annuities": False,
            "occupational_hazards": False,
            "contribution_rate": "None",
            "payer": "none",
            "gaps": ["Completely excluded from GOSI", "No occupational injury coverage", "Dependent on employer goodwill"]
        },
        "coverage_status": "none"
    },
    {
        "id": "young-saudi-worker",
        "name": "Young Saudi Worker",
        "arabic_name": "الشاب السعودي",
        "tagline": "Tomorrow's Workforce",
        "description": "Saudi youth (15-24) entering the workforce.",
        "avatar_url": "/personas/young-saudi-worker.png",
        "color": "emerald",
        "gradient": "from-emerald-500/20 to-green-600/20",
        "demographics": {
            "population_share": 8,
            "participation_rate": 31.6,
            "unemployment_rate": 28.0,
            "key_age_group": "15-24",
            "primary_sectors": ["Retail", "Hospitality", "Food Service", "Customer Service", "Gig Economy"]
        },
        "coverage": {
            "annuities": True,
            "occupational_hazards": True,
            "contribution_rate": "22% when employed (phased by 2028)",
            "payer": "shared",
            "gaps": ["High unemployment limits coverage access", "Gig economy workers often unregistered"]
        },
        "coverage_status": "full"
    }
]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_ai_config(db: Session) -> Optional[AIConfig]:
    """Get active AI configuration."""
    return db.query(AIConfig).filter(AIConfig.is_active == True).first()


def get_persona_by_id(persona_id: str) -> Optional[Dict]:
    """Get persona data by ID."""
    for persona in PERSONAS_DATA:
        if persona["id"] == persona_id:
            return persona
    return None


def get_cached_research(db: Session, persona_id: str) -> Optional[CachedPersonaResearch]:
    """Get cached research for a persona."""
    return db.query(CachedPersonaResearch).filter(
        CachedPersonaResearch.persona_id == persona_id
    ).first()


def save_cached_research(
    db: Session, 
    persona_id: str, 
    research_data: Dict,
    generated_by: str = "system"
) -> CachedPersonaResearch:
    """Save or update cached research."""
    cached = get_cached_research(db, persona_id)
    
    if cached:
        cached.research_data = research_data
        cached.generated_at = datetime.utcnow()
        cached.generated_by = generated_by
    else:
        cached = CachedPersonaResearch(
            persona_id=persona_id,
            research_data=research_data,
            generated_at=datetime.utcnow(),
            generated_by=generated_by
        )
        db.add(cached)
    
    db.commit()
    db.refresh(cached)
    return cached


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.get("", response_model=PersonaListResponse)
async def list_personas():
    """
    Get list of all personas with summary information.
    """
    summaries = []
    for p in PERSONAS_DATA:
        summaries.append(PersonaSummary(
            id=p["id"],
            name=p["name"],
            tagline=p["tagline"],
            color=p["color"],
            coverage_status=p["coverage_status"],
            participation_rate=p["demographics"]["participation_rate"]
        ))
    
    return PersonaListResponse(
        total=len(PERSONAS_DATA),
        personas=summaries
    )


@router.get("/{persona_id}")
async def get_persona(persona_id: str):
    """
    Get full persona data by ID.
    """
    persona = get_persona_by_id(persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona '{persona_id}' not found"
        )
    
    return persona


@router.get("/{persona_id}/research", response_model=Optional[ResearchResponse])
async def get_persona_research(
    persona_id: str,
    db: Session = Depends(get_db)
):
    """
    Get cached AI-generated research for a persona.
    Returns null if no cached research exists.
    """
    persona = get_persona_by_id(persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona '{persona_id}' not found"
        )
    
    cached = get_cached_research(db, persona_id)
    if not cached or not cached.research_data:
        return None
    
    return ResearchResponse(
        persona_id=persona_id,
        persona_name=persona["name"],
        **cached.research_data,
        generated_at=cached.generated_at.isoformat() if cached.generated_at else None,
        cached=True
    )


@router.post("/research", response_model=ResearchResponse)
async def generate_persona_research(
    request: ResearchRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generate AI-powered research for a persona.
    Uses the persona-research agent with optional web search.
    Results are cached for future retrieval.
    """
    persona = get_persona_by_id(request.persona_id)
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Persona '{request.persona_id}' not found"
        )
    
    # Get AI config
    ai_config = get_ai_config(db)
    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI is not configured. Please configure AI provider in admin settings."
        )
    
    try:
        # Initialize agent runner
        runner = AgentRunner(db, ai_config)
        
        # Run the persona research agent
        result = await runner.run_agent(
            agent_id="persona-research",
            variables={
                "PERSONA_ID": request.persona_id,
                "PERSONA_NAME": request.persona_name,
                "PERSONA_DESCRIPTION": request.persona_description,
            },
            country_iso="SAU",  # Always Saudi Arabia for personas
            enable_web_search=request.enable_web_search
        )
        
        # Parse the result
        if isinstance(result, str):
            try:
                research_data = json.loads(result)
            except json.JSONDecodeError:
                research_data = {
                    "research_summary": result,
                    "sources": []
                }
        else:
            research_data = result
        
        # Cache the result
        user_id = str(current_user.id) if current_user else "anonymous"
        save_cached_research(db, request.persona_id, research_data, user_id)
        
        return ResearchResponse(
            persona_id=request.persona_id,
            persona_name=persona["name"],
            **research_data,
            generated_at=datetime.utcnow().isoformat(),
            cached=False
        )
        
    except Exception as e:
        logger.error(f"Error generating persona research: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate research: {str(e)}"
        )
