"""
GOHIP Platform - Country Insights API
=====================================

AI-generated country insights for the Country Dashboard.
Insights are stored persistently and only regenerated on admin request.

Endpoints:
- GET /api/v1/insights/{country_iso}/{category} - Get cached insight (or null)
- POST /api/v1/insights/{country_iso}/{category}/regenerate - Regenerate (admin only)
- GET /api/v1/insights/{country_iso} - List all insights for a country
"""

import logging
import time
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_user_optional
from app.models.user import User, UserRole, AIConfig
from app.models.country import Country, CountryIntelligence
from app.models.country_insight import (
    CountryInsight,
    InsightCategory,
    InsightStatus,
    CATEGORY_METADATA,
)
from app.services.agent_runner import AgentRunner


# Create router
router = APIRouter(prefix="/insights", tags=["Country Insights"])

logger.info("Country Insights router initialized")


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ImageData(BaseModel):
    """Image data for slideshow."""
    url: str
    thumbnail_url: Optional[str] = None
    alt: str
    photographer: Optional[str] = None


class KeyStatData(BaseModel):
    """Key stat for tile display."""
    label: str
    value: str
    description: Optional[str] = None


class InsightResponse(BaseModel):
    """Full insight response."""
    id: int
    country_iso: str
    category: str
    images: List[ImageData] = []
    what_is_analysis: Optional[str] = None
    oh_implications: Optional[str] = None
    key_stats: List[KeyStatData] = []
    status: str
    error_message: Optional[str] = None
    generated_at: Optional[str] = None
    generated_by: Optional[int] = None


class InsightSummary(BaseModel):
    """Summary of an insight for listing."""
    category: str
    title: str
    status: str
    generated_at: Optional[str] = None
    has_content: bool = False


class InsightListResponse(BaseModel):
    """List of insights for a country."""
    country_iso: str
    country_name: Optional[str] = None
    total: int
    insights: List[InsightSummary]


class RegenerateResponse(BaseModel):
    """Response for regenerate operation."""
    success: bool
    message: str
    insight: Optional[InsightResponse] = None


# =============================================================================
# CURATED IMAGES - Reliable country/category specific images
# =============================================================================

CURATED_IMAGES = {
    # Saudi Arabia (SAU)
    "SAU": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80", "alt": "Riyadh skyline at sunset"},
            {"url": "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80", "alt": "Traditional Saudi architecture"},
            {"url": "https://images.unsplash.com/photo-1609252509102-aa7b66d0e6ce?w=800&q=80", "alt": "Modern Saudi Arabia"},
        ],
        "industry": [
            {"url": "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80", "alt": "Oil refinery at dusk"},
            {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "Industrial facility"},
            {"url": "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80", "alt": "Construction in Saudi Arabia"},
        ],
        "oh-infrastructure": [
            {"url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", "alt": "Modern hospital building"},
            {"url": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80", "alt": "Healthcare facility"},
            {"url": "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80", "alt": "Medical center"},
        ],
        "political": [
            {"url": "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800&q=80", "alt": "Government building"},
            {"url": "https://images.unsplash.com/photo-1577416412292-747c6607f055?w=800&q=80", "alt": "Administrative center"},
        ],
        "urban": [
            {"url": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80", "alt": "Riyadh cityscape"},
            {"url": "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80", "alt": "Urban development"},
            {"url": "https://images.unsplash.com/photo-1609252509102-aa7b66d0e6ce?w=800&q=80", "alt": "Modern city"},
        ],
        "workforce": [
            {"url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80", "alt": "Diverse workforce"},
            {"url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80", "alt": "Professional workers"},
        ],
    },
    # Germany (DEU)
    "DEU": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80", "alt": "German cityscape"},
            {"url": "https://images.unsplash.com/photo-1554072675-66db59dba46f?w=800&q=80", "alt": "Traditional German architecture"},
        ],
        "industry": [
            {"url": "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80", "alt": "German manufacturing"},
            {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "Industrial facility"},
        ],
        "oh-infrastructure": [
            {"url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", "alt": "German hospital"},
            {"url": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80", "alt": "Healthcare center"},
        ],
    },
    # Canada (CAN)
    "CAN": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80", "alt": "Toronto skyline"},
            {"url": "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80", "alt": "Canadian landscape"},
        ],
        "industry": [
            {"url": "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80", "alt": "Canadian industry"},
            {"url": "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80", "alt": "Industrial operations"},
        ],
        "oh-infrastructure": [
            {"url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", "alt": "Canadian hospital"},
            {"url": "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80", "alt": "Medical facility"},
        ],
    },
}

# Default images by category (fallback)
DEFAULT_CATEGORY_IMAGES = {
    "culture": [
        {"url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", "alt": "Cultural scene"},
        {"url": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80", "alt": "Society and culture"},
    ],
    "industry": [
        {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "Industrial facility"},
        {"url": "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80", "alt": "Manufacturing plant"},
        {"url": "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80", "alt": "Oil and gas industry"},
    ],
    "oh-infrastructure": [
        {"url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", "alt": "Modern hospital"},
        {"url": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80", "alt": "Healthcare facility"},
        {"url": "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80", "alt": "Medical center"},
    ],
    "political": [
        {"url": "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800&q=80", "alt": "Government building"},
        {"url": "https://images.unsplash.com/photo-1577416412292-747c6607f055?w=800&q=80", "alt": "Parliament"},
    ],
    "urban": [
        {"url": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", "alt": "City skyline"},
        {"url": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80", "alt": "Urban development"},
        {"url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80", "alt": "Metropolitan area"},
    ],
    "workforce": [
        {"url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80", "alt": "Team collaboration"},
        {"url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80", "alt": "Professional workforce"},
        {"url": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80", "alt": "Workers in industry"},
    ],
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_curated_images(country_iso: str, category: str) -> List[Dict]:
    """Get curated images for country/category with fallback."""
    # Try country-specific first
    if country_iso in CURATED_IMAGES:
        if category in CURATED_IMAGES[country_iso]:
            return CURATED_IMAGES[country_iso][category]
    
    # Fallback to default category images
    if category in DEFAULT_CATEGORY_IMAGES:
        return DEFAULT_CATEGORY_IMAGES[category]
    
    # Ultimate fallback
    return [{"url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", "alt": "Business and economy"}]


def get_ai_config(db: Session) -> Optional[AIConfig]:
    """Get active AI configuration."""
    return db.query(AIConfig).filter(AIConfig.is_active == True).first()


def get_country_data(db: Session, iso_code: str) -> Optional[Country]:
    """Get country by ISO code."""
    return db.query(Country).filter(Country.iso_code == iso_code).first()


def get_intelligence_data(db: Session, iso_code: str) -> Optional[CountryIntelligence]:
    """Get country intelligence data."""
    return db.query(CountryIntelligence).filter(
        CountryIntelligence.country_iso_code == iso_code
    ).first()


def parse_category(category_str: str) -> InsightCategory:
    """Parse category string to enum."""
    try:
        return InsightCategory(category_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category: {category_str}. Valid categories: {[c.value for c in InsightCategory]}"
        )


def format_insight_response(insight: CountryInsight) -> InsightResponse:
    """Format insight model to response."""
    images = []
    if insight.images:
        for img in insight.images:
            images.append(ImageData(
                url=img.get("url", ""),
                thumbnail_url=img.get("thumbnailUrl") or img.get("thumbnail_url"),
                alt=img.get("alt", ""),
                photographer=img.get("photographer"),
            ))
    
    # Parse key_stats
    key_stats = []
    if insight.key_stats:
        for stat in insight.key_stats:
            key_stats.append(KeyStatData(
                label=stat.get("label", ""),
                value=stat.get("value", ""),
                description=stat.get("description"),
            ))
    
    return InsightResponse(
        id=insight.id,
        country_iso=insight.country_iso,
        category=insight.category.value if insight.category else "",
        images=images,
        what_is_analysis=insight.what_is_analysis,
        oh_implications=insight.oh_implications,
        key_stats=key_stats,
        status=insight.status.value if insight.status else "pending",
        error_message=insight.error_message,
        generated_at=insight.generated_at.isoformat() if insight.generated_at else None,
        generated_by=insight.generated_by,
    )


def ensure_insight_agent_exists(db: Session) -> None:
    """Ensure the country insight agent exists in the database."""
    from app.models.agent import Agent, DEFAULT_AGENTS
    
    agent_id = "country-insight-generator"
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        # Find in default agents
        agent_config = next((a for a in DEFAULT_AGENTS if a["id"] == agent_id), None)
        if agent_config:
            agent = Agent(**agent_config)
            db.add(agent)
            db.commit()
            logger.info(f"Created {agent_id} agent")


async def generate_insight_content(
    db: Session,
    country: Country,
    intelligence: Optional[CountryIntelligence],
    category: InsightCategory,
    user: User,
) -> Dict[str, Any]:
    """
    Generate AI insight content using the country-insight-generator agent.
    
    Returns dict with:
    - what_is_analysis: str (3-4 paragraphs)
    - oh_implications: str (3-4 paragraphs)
    - key_stats: list of 6 stat objects [{label, value, description}]
    """
    ai_config = get_ai_config(db)
    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please configure AI settings in admin panel."
        )
    
    # Ensure agent exists
    ensure_insight_agent_exists(db)
    
    category_meta = CATEGORY_METADATA.get(category, {})
    category_title = category_meta.get("title", category.value)
    
    # Build comprehensive context for AI
    context_parts = [
        f"Country: {country.name}",
        f"ISO Code: {country.iso_code}",
        "",
        "## Socioeconomic Data:",
    ]
    
    if intelligence:
        if intelligence.gdp_per_capita_ppp:
            context_parts.append(f"- GDP per Capita (PPP): ${intelligence.gdp_per_capita_ppp:,.0f}")
        if intelligence.population_total:
            context_parts.append(f"- Population: {intelligence.population_total:,.0f}")
        if intelligence.labor_force_participation:
            context_parts.append(f"- Labor Force Participation: {intelligence.labor_force_participation}%")
        if intelligence.unemployment_rate:
            context_parts.append(f"- Unemployment Rate: {intelligence.unemployment_rate}%")
        if intelligence.life_expectancy_at_birth:
            context_parts.append(f"- Life Expectancy: {intelligence.life_expectancy_at_birth} years")
        if intelligence.urban_population_pct:
            context_parts.append(f"- Urban Population: {intelligence.urban_population_pct}%")
        if intelligence.hdi_score:
            context_parts.append(f"- HDI Score: {intelligence.hdi_score}")
    
    context_parts.append("")
    context_parts.append("## Occupational Health Scores:")
    
    if country.governance_score:
        context_parts.append(f"- OH Governance Score: {country.governance_score}/100")
    if country.pillar1_score:
        context_parts.append(f"- Hazard Control Score: {country.pillar1_score}/100")
    if country.pillar2_score:
        context_parts.append(f"- Vigilance Score: {country.pillar2_score}/100")
    if country.pillar3_score:
        context_parts.append(f"- Restoration Score: {country.pillar3_score}/100")
    if country.maturity_score:
        context_parts.append(f"- Overall OHI Score: {country.maturity_score}/100")
    
    database_context = "\n".join([p for p in context_parts if p is not None])
    
    # Use ai_service for direct LLM call with the agent's prompt pattern
    try:
        from app.services.ai_service import call_ai_api
        
        # Build prompt following agent pattern
        prompt = f"""Generate a detailed analysis about {category_title} in {country.name} for an Occupational Health intelligence platform.

## COUNTRY DATA:
{database_context}

## REQUIREMENTS:

**SECTION 1: "What is {category_title}?"**
Write 3-4 substantial paragraphs (250-350 words total) explaining {category_title} in {country.name}:
- Be highly specific to {country.name} - name industries, institutions, statistics
- Include concrete data points: percentages, rankings, growth rates
- Describe the current state with factual precision
- Cover key trends and recent developments

**SECTION 2: "What does this mean for Occupational Health?"**
Write 3-4 substantial paragraphs (250-350 words total) analyzing OH implications:
- Connect {category_title} directly to worker safety and health outcomes
- Explain specific impacts on workplace conditions
- Describe how OH systems are affected
- Be purely informative - NO strategic recommendations

**SECTION 3: Key Statistics**
Provide exactly 6 key statistics that highlight the most important data points about {category_title} in {country.name}.
Each stat should have:
- label: Short label (2-4 words, e.g., "GDP Growth", "Labor Force")
- value: The actual value with unit (e.g., "$71,565", "4.0%", "33.7M")
- description: Brief context (10-15 words explaining significance)

## OUTPUT FORMAT:
Respond with valid JSON only:
{{
  "what_is_analysis": "Full 3-4 paragraph analysis here...",
  "oh_implications": "Full 3-4 paragraph OH analysis here...",
  "key_stats": [
    {{"label": "Stat Name", "value": "Value", "description": "Brief context"}},
    {{"label": "Stat Name", "value": "Value", "description": "Brief context"}},
    {{"label": "Stat Name", "value": "Value", "description": "Brief context"}},
    {{"label": "Stat Name", "value": "Value", "description": "Brief context"}},
    {{"label": "Stat Name", "value": "Value", "description": "Brief context"}},
    {{"label": "Stat Name", "value": "Value", "description": "Brief context"}}
  ]
}}"""

        system_prompt = """You are a Senior McKinsey Partner specializing in country analysis for occupational health strategy.

Your role is to provide CONCRETE, SPECIFIC, DATA-DRIVEN analysis. Never be generic or vague.

WRITING REQUIREMENTS:
1. SPECIFICITY: Name specific industries, companies, institutions, statistics
2. DATA-DRIVEN: Include percentages, numbers, rankings, growth rates
3. COUNTRY-SPECIFIC: Every sentence must be relevant to the specific country
4. CONSULTING QUALITY: Write in professional, analytical prose
5. OH-FOCUSED: Connect all analysis to occupational health implications

TONE:
- Authoritative and expert
- Factual, not speculative
- Informative without recommendations (analysis only)
- McKinsey partner briefing a client"""

        result = await call_ai_api(
            db=db,
            ai_config=ai_config,
            prompt=prompt,
            agent_id="country-insight-generator",
            user_email=user.email if user else None,
            system_prompt=system_prompt,
        )
        
        # Parse JSON response
        import json
        try:
            # Clean response
            response_text = result.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            parsed = json.loads(response_text.strip())
            return {
                "what_is_analysis": parsed.get("what_is_analysis", ""),
                "oh_implications": parsed.get("oh_implications", ""),
                "key_stats": parsed.get("key_stats", []),
                "ai_provider": ai_config.provider.value if ai_config.provider else None,
                "ai_model": ai_config.model_name,
            }
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI response as JSON: {result[:500]}")
            # Return raw result as what_is_analysis
            return {
                "what_is_analysis": result,
                "oh_implications": "",
                "key_stats": [],
                "ai_provider": ai_config.provider.value if ai_config.provider else None,
                "ai_model": ai_config.model_name,
            }
            
    except Exception as e:
        logger.error(f"AI generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insight content: {str(e)}"
        )


def generate_placeholder_images(country_name: str, category: InsightCategory) -> List[Dict]:
    """Generate placeholder images using Unsplash."""
    category_meta = CATEGORY_METADATA.get(category, {})
    queries = category_meta.get("image_queries", [category.value])
    
    images = []
    for i, query in enumerate(queries[:3]):  # Max 3 images
        images.append({
            "url": f"https://source.unsplash.com/800x600/?{country_name},{query}",
            "thumbnailUrl": f"https://source.unsplash.com/400x300/?{country_name},{query}",
            "alt": f"{category_meta.get('title', category.value)} in {country_name}",
            "photographer": None,
        })
    
    return images


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/{country_iso}", response_model=InsightListResponse)
async def list_country_insights(
    country_iso: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    List all insights for a country.
    
    Returns status for each category (pending, completed, etc.)
    """
    country_iso = country_iso.upper()
    
    # Get country name
    country = get_country_data(db, country_iso)
    country_name = country.name if country else None
    
    # Get all insights for this country
    insights = db.query(CountryInsight).filter(
        CountryInsight.country_iso == country_iso
    ).all()
    
    # Build lookup map
    insight_map = {i.category: i for i in insights}
    
    # Build summaries for all categories
    summaries = []
    for category in InsightCategory:
        insight = insight_map.get(category)
        meta = CATEGORY_METADATA.get(category, {})
        
        summaries.append(InsightSummary(
            category=category.value,
            title=meta.get("title", category.value),
            status=insight.status.value if insight else "pending",
            generated_at=insight.generated_at.isoformat() if insight and insight.generated_at else None,
            has_content=bool(insight and insight.what_is_analysis),
        ))
    
    return InsightListResponse(
        country_iso=country_iso,
        country_name=country_name,
        total=len(summaries),
        insights=summaries,
    )


# Country Insight categories to auto-generate (the 6 bottom tiles)
COUNTRY_INSIGHT_CATEGORIES = [
    InsightCategory.culture,
    InsightCategory.oh_infrastructure,
    InsightCategory.industry,
    InsightCategory.urban,
    InsightCategory.workforce,
    InsightCategory.political,
]


class InitializeResponse(BaseModel):
    """Response for initialize operation."""
    country_iso: str
    country_name: str
    status: str  # "already_complete", "generating", "started"
    total_categories: int
    existing: int
    missing: int
    categories_to_generate: List[str]


@router.post("/{country_iso}/initialize", response_model=InitializeResponse)
async def initialize_country_insights(
    country_iso: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize all Country Insight categories for a country.
    
    This endpoint:
    1. Checks which of the 6 Country Insight categories are missing content
    2. If admin, triggers generation for all missing categories
    3. Returns status immediately (generation happens in background for large batches)
    
    Only admins can trigger generation. Regular users get status only.
    """
    country_iso = country_iso.upper()
    
    # Get country data
    country = get_country_data(db, country_iso)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {country_iso}"
        )
    
    # Get existing insights for Country Insight categories only
    existing_insights = db.query(CountryInsight).filter(
        CountryInsight.country_iso == country_iso,
        CountryInsight.category.in_(COUNTRY_INSIGHT_CATEGORIES),
        CountryInsight.status == InsightStatus.completed,
        CountryInsight.what_is_analysis.isnot(None),
    ).all()
    
    existing_categories = {i.category for i in existing_insights}
    missing_categories = [c for c in COUNTRY_INSIGHT_CATEGORIES if c not in existing_categories]
    
    # If all complete, return early
    if not missing_categories:
        return InitializeResponse(
            country_iso=country_iso,
            country_name=country.name,
            status="already_complete",
            total_categories=len(COUNTRY_INSIGHT_CATEGORIES),
            existing=len(existing_categories),
            missing=0,
            categories_to_generate=[],
        )
    
    # Check if user is admin
    if current_user.role != UserRole.admin:
        return InitializeResponse(
            country_iso=country_iso,
            country_name=country.name,
            status="missing_content",
            total_categories=len(COUNTRY_INSIGHT_CATEGORIES),
            existing=len(existing_categories),
            missing=len(missing_categories),
            categories_to_generate=[c.value for c in missing_categories],
        )
    
    # Admin: Generate all missing categories
    intelligence = get_intelligence_data(db, country_iso)
    
    generated = 0
    errors = []
    
    for category in missing_categories:
        try:
            # Find or create insight record
            insight = db.query(CountryInsight).filter(
                CountryInsight.country_iso == country_iso,
                CountryInsight.category == category,
            ).first()
            
            if not insight:
                insight = CountryInsight(
                    country_iso=country_iso,
                    category=category,
                    status=InsightStatus.generating,
                )
                db.add(insight)
                db.commit()
                db.refresh(insight)
            else:
                insight.status = InsightStatus.generating
                db.commit()
            
            # Generate content
            content = await generate_insight_content(
                db, country, intelligence, category, current_user
            )
            
            # Get curated images
            images = get_curated_images(country_iso, category.value)
            
            # Update insight
            insight.what_is_analysis = content.get("what_is_analysis")
            insight.oh_implications = content.get("oh_implications")
            insight.key_stats = content.get("key_stats", [])
            insight.images = images
            insight.status = InsightStatus.completed
            insight.generated_at = datetime.utcnow()
            insight.generated_by = current_user.id
            insight.ai_provider = content.get("ai_provider")
            insight.ai_model = content.get("ai_model")
            db.commit()
            
            generated += 1
            logger.info(f"Generated {category.value} insight for {country_iso}")
            
        except Exception as e:
            logger.error(f"Failed to generate {category.value} for {country_iso}: {e}")
            errors.append({"category": category.value, "error": str(e)})
    
    return InitializeResponse(
        country_iso=country_iso,
        country_name=country.name,
        status="generated" if generated == len(missing_categories) else "partial",
        total_categories=len(COUNTRY_INSIGHT_CATEGORIES),
        existing=len(existing_categories) + generated,
        missing=len(missing_categories) - generated,
        categories_to_generate=[],
    )


@router.get("/{country_iso}/{category}", response_model=Optional[InsightResponse])
async def get_country_insight(
    country_iso: str,
    category: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get a specific insight for a country and category.
    
    Returns null if no insight exists yet.
    """
    country_iso = country_iso.upper()
    cat_enum = parse_category(category)
    
    insight = db.query(CountryInsight).filter(
        CountryInsight.country_iso == country_iso,
        CountryInsight.category == cat_enum,
    ).first()
    
    if not insight:
        return None
    
    return format_insight_response(insight)


@router.post("/{country_iso}/{category}/regenerate", response_model=RegenerateResponse)
async def regenerate_insight(
    country_iso: str,
    category: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Regenerate an insight (admin only).
    
    Generates new AI content and images, replacing existing content.
    """
    # Check admin
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can regenerate insights"
        )
    
    country_iso = country_iso.upper()
    cat_enum = parse_category(category)
    
    # Get country data
    country = get_country_data(db, country_iso)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {country_iso}"
        )
    
    intelligence = get_intelligence_data(db, country_iso)
    
    # Find or create insight record
    insight = db.query(CountryInsight).filter(
        CountryInsight.country_iso == country_iso,
        CountryInsight.category == cat_enum,
    ).first()
    
    if not insight:
        insight = CountryInsight(
            country_iso=country_iso,
            category=cat_enum,
            status=InsightStatus.generating,
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)
    else:
        insight.status = InsightStatus.generating
        insight.error_message = None
        db.commit()
    
    try:
        start_time = time.time()
        
        # Generate AI content
        content = await generate_insight_content(
            db, country, intelligence, cat_enum, current_user
        )
        
        # Get curated images (reliable, country-specific)
        images = get_curated_images(country_iso, cat_enum.value)
        
        # Update insight
        insight.what_is_analysis = content.get("what_is_analysis")
        insight.oh_implications = content.get("oh_implications")
        insight.key_stats = content.get("key_stats", [])
        insight.images = images
        insight.status = InsightStatus.completed
        insight.generated_at = datetime.utcnow()
        insight.generated_by = current_user.id
        insight.ai_provider = content.get("ai_provider")
        insight.ai_model = content.get("ai_model")
        insight.error_message = None
        
        generation_time = time.time() - start_time
        logger.info(f"Generated insight for {country_iso}/{category} in {generation_time:.1f}s")
        
        db.commit()
        
        return RegenerateResponse(
            success=True,
            message=f"Successfully regenerated insight for {category}",
            insight=format_insight_response(insight),
        )
        
    except Exception as e:
        logger.error(f"Failed to regenerate insight: {e}")
        insight.status = InsightStatus.error
        insight.error_message = str(e)
        db.commit()
        
        return RegenerateResponse(
            success=False,
            message=f"Failed to regenerate: {str(e)}",
            insight=format_insight_response(insight),
        )


@router.post("/{country_iso}/regenerate-all", response_model=Dict[str, Any])
async def regenerate_all_insights(
    country_iso: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Regenerate all insights for a country (admin only).
    
    This is a long-running operation - consider using background tasks.
    """
    # Check admin
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can regenerate insights"
        )
    
    country_iso = country_iso.upper()
    
    # Get country data
    country = get_country_data(db, country_iso)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {country_iso}"
        )
    
    results = {
        "country_iso": country_iso,
        "country_name": country.name,
        "total_categories": len(InsightCategory),
        "successful": 0,
        "failed": 0,
        "errors": [],
    }
    
    intelligence = get_intelligence_data(db, country_iso)
    
    for category in InsightCategory:
        try:
            # Find or create insight record
            insight = db.query(CountryInsight).filter(
                CountryInsight.country_iso == country_iso,
                CountryInsight.category == category,
            ).first()
            
            if not insight:
                insight = CountryInsight(
                    country_iso=country_iso,
                    category=category,
                    status=InsightStatus.generating,
                )
                db.add(insight)
                db.commit()
                db.refresh(insight)
            else:
                insight.status = InsightStatus.generating
                db.commit()
            
            # Generate content
            content = await generate_insight_content(
                db, country, intelligence, category, current_user
            )
            
            # Get curated images
            images = get_curated_images(country_iso, category.value)
            
            # Update insight
            insight.what_is_analysis = content.get("what_is_analysis")
            insight.oh_implications = content.get("oh_implications")
            insight.key_stats = content.get("key_stats", [])
            insight.images = images
            insight.status = InsightStatus.completed
            insight.generated_at = datetime.utcnow()
            insight.generated_by = current_user.id
            insight.ai_provider = content.get("ai_provider")
            insight.ai_model = content.get("ai_model")
            db.commit()
            
            results["successful"] += 1
            
        except Exception as e:
            logger.error(f"Failed to generate {category.value}: {e}")
            results["failed"] += 1
            results["errors"].append({
                "category": category.value,
                "error": str(e),
            })
    
    return results
