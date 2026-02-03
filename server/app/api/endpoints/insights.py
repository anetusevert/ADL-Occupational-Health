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


class InsightResponse(BaseModel):
    """Full insight response."""
    id: int
    country_iso: str
    category: str
    images: List[ImageData] = []
    what_is_analysis: Optional[str] = None
    oh_implications: Optional[str] = None
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
# HELPER FUNCTIONS
# =============================================================================

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
    
    return InsightResponse(
        id=insight.id,
        country_iso=insight.country_iso,
        category=insight.category.value if insight.category else "",
        images=images,
        what_is_analysis=insight.what_is_analysis,
        oh_implications=insight.oh_implications,
        status=insight.status.value if insight.status else "pending",
        error_message=insight.error_message,
        generated_at=insight.generated_at.isoformat() if insight.generated_at else None,
        generated_by=insight.generated_by,
    )


async def generate_insight_content(
    db: Session,
    country: Country,
    intelligence: Optional[CountryIntelligence],
    category: InsightCategory,
    user: User,
) -> Dict[str, Any]:
    """
    Generate AI insight content.
    
    Returns dict with:
    - what_is_analysis: str (3-4 paragraphs)
    - oh_implications: str (3-4 paragraphs)
    - images: list of image objects
    """
    ai_config = get_ai_config(db)
    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured"
        )
    
    category_meta = CATEGORY_METADATA.get(category, {})
    category_title = category_meta.get("title", category.value)
    
    # Build context for AI
    context_parts = [
        f"Country: {country.name} ({country.iso_code})",
        f"Category: {category_title}",
        f"Category Description: {category_meta.get('description', '')}",
    ]
    
    if intelligence:
        context_parts.extend([
            f"\nSocioeconomic Data:",
            f"- GDP per Capita (PPP): ${intelligence.gdp_per_capita_ppp:,.0f}" if intelligence.gdp_per_capita_ppp else "",
            f"- Population: {intelligence.population_total:,.0f}" if intelligence.population_total else "",
            f"- Labor Force Participation: {intelligence.labor_force_participation}%" if intelligence.labor_force_participation else "",
            f"- Unemployment Rate: {intelligence.unemployment_rate}%" if intelligence.unemployment_rate else "",
            f"- Life Expectancy: {intelligence.life_expectancy_at_birth} years" if intelligence.life_expectancy_at_birth else "",
            f"- Urban Population: {intelligence.urban_population_pct}%" if intelligence.urban_population_pct else "",
        ])
    
    if country.governance_score:
        context_parts.append(f"- OH Governance Score: {country.governance_score}")
    if country.pillar1_score:
        context_parts.append(f"- Hazard Control Score: {country.pillar1_score}")
    if country.pillar2_score:
        context_parts.append(f"- Vigilance Score: {country.pillar2_score}")
    if country.pillar3_score:
        context_parts.append(f"- Restoration Score: {country.pillar3_score}")
    
    context = "\n".join([p for p in context_parts if p])
    
    # Build prompt
    prompt = f"""You are a senior consultant writing analytical content about {category_title} in {country.name} for an Occupational Health intelligence platform.

CONTEXT:
{context}

Generate two sections of analysis:

SECTION 1: "What is {category_title}?"
Write 3-4 paragraphs explaining {category_title} in {country.name}.
- Be factual, informative, and data-driven
- Include country-specific context and statistics where relevant
- Write in a professional consulting style (McKinsey-like)
- Focus on factual description, not opinions

SECTION 2: "What does this mean for Occupational Health?"
Write 3-4 paragraphs analyzing the OH implications.
- Connect {category_title} to occupational health outcomes
- Explain specific impacts on workplace safety, worker health, and OH systems
- Be purely informative - NO strategic recommendations
- Ground analysis in the country context

Format your response as JSON:
{{
  "what_is_analysis": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3\\n\\nParagraph 4",
  "oh_implications": "Paragraph 1\\n\\nParagraph 2\\n\\nParagraph 3\\n\\nParagraph 4"
}}
"""

    try:
        runner = AgentRunner(db, ai_config)
        
        # Use a generic analysis agent or create content directly
        # For now, we'll use direct API call pattern
        from app.services.ai_service import call_ai_api
        
        result = await call_ai_api(
            db=db,
            ai_config=ai_config,
            prompt=prompt,
            agent_id="country-insight-generator",
            user_email=user.email if user else None,
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
                "ai_provider": ai_config.provider.value if ai_config.provider else None,
                "ai_model": ai_config.model_name,
            }
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI response as JSON: {result[:500]}")
            return {
                "what_is_analysis": result,
                "oh_implications": "",
                "ai_provider": ai_config.provider.value if ai_config.provider else None,
                "ai_model": ai_config.model_name,
            }
            
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
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
        
        # Generate placeholder images
        images = generate_placeholder_images(country.name, cat_enum)
        
        # Update insight
        insight.what_is_analysis = content.get("what_is_analysis")
        insight.oh_implications = content.get("oh_implications")
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
            
            images = generate_placeholder_images(country.name, category)
            
            # Update insight
            insight.what_is_analysis = content.get("what_is_analysis")
            insight.oh_implications = content.get("oh_implications")
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
