"""
GOHIP Platform - Comparison Reports API
========================================

Cached AI-generated comparison reports for country benchmarking.
Reports are stored persistently and only regenerated on admin request.

Endpoints:
- GET /api/v1/comparison/{iso} - Get cached report (or null)
- POST /api/v1/comparison/{iso}/generate - Generate new report (respects cache)
- PUT /api/v1/comparison/{iso}/regenerate - Force regenerate (admin only)
- GET /api/v1/comparison/all - List all cached reports (admin)
"""

import logging
import json
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
from app.models.comparison_report import ComparisonReport
from app.models.agent import Agent, DEFAULT_AGENTS
from app.services.agent_runner import AgentRunner
from app.services.country_data_provider import CountryDataProvider


# Create router
router = APIRouter(prefix="/comparison", tags=["Comparison Reports"])

logger.info("Comparison Reports router initialized")


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ComparisonReportSummary(BaseModel):
    """Summary of a comparison report for listing."""
    id: str
    comparison_iso: str
    comparison_name: Optional[str]
    created_at: Optional[str]
    version: int


class ComparisonReportResponse(BaseModel):
    """Full comparison report response."""
    id: str
    primary_iso: str
    comparison_iso: str
    executive_summary: Optional[str]
    framework_analysis: Optional[List[Dict[str, Any]]]
    socioeconomic_comparison: Optional[Dict[str, Any]]
    metric_comparisons: Optional[List[Dict[str, Any]]]
    strategic_recommendations: Optional[List[Dict[str, Any]]]
    sources_cited: Optional[List[str]]
    created_at: Optional[str]
    updated_at: Optional[str]
    version: int
    generation_time_seconds: Optional[float]
    # Include country names for display
    primary_name: Optional[str] = "Saudi Arabia"
    comparison_name: Optional[str]


class GenerateRequest(BaseModel):
    """Request to generate a report."""
    force: bool = Field(False, description="Force regeneration even if cached")


class ReportListResponse(BaseModel):
    """List of all cached reports."""
    total: int
    reports: List[ComparisonReportSummary]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_ai_config(db: Session) -> Optional[AIConfig]:
    """Get active AI configuration."""
    return db.query(AIConfig).filter(AIConfig.is_active == True).first()


def get_country_data(db: Session, iso_code: str) -> Optional[Country]:
    """Get country with all relationships loaded."""
    return db.query(Country).filter(Country.iso_code == iso_code).first()


def get_intelligence_data(db: Session, iso_code: str) -> Optional[CountryIntelligence]:
    """Get country intelligence data."""
    return db.query(CountryIntelligence).filter(
        CountryIntelligence.country_iso_code == iso_code
    ).first()


def ensure_agent_exists(db: Session, agent_id: str = "comparison-research-analyst") -> None:
    """Ensure the comparison research agent exists in the database."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        agent_config = next((a for a in DEFAULT_AGENTS if a["id"] == agent_id), None)
        if agent_config:
            agent = Agent(**agent_config)
            db.add(agent)
            db.commit()
            logger.info(f"Created {agent_id} agent")


def format_country_data(country: Country, intelligence: Optional[CountryIntelligence]) -> str:
    """Format country data for AI prompt."""
    parts = []
    
    parts.append(f"### {country.name} ({country.iso_code})")
    parts.append(f"- OHI Score: {country.maturity_score or 'N/A'}")
    parts.append(f"- Data Coverage: {country.data_coverage_score or 'N/A'}%")
    
    # Pillar scores
    if country.governance_score:
        parts.append(f"- Governance Score: {country.governance_score}")
    if country.pillar1_score:
        parts.append(f"- Hazard Control Score: {country.pillar1_score}")
    if country.pillar2_score:
        parts.append(f"- Health Vigilance Score: {country.pillar2_score}")
    if country.pillar3_score:
        parts.append(f"- Restoration Score: {country.pillar3_score}")
    
    # Intelligence data
    if intelligence:
        parts.append("\n### Socioeconomic Context:")
        if intelligence.gdp_per_capita_ppp:
            parts.append(f"- GDP per Capita (PPP): ${intelligence.gdp_per_capita_ppp:,.0f}")
        if intelligence.population_total:
            parts.append(f"- Population: {intelligence.population_total:,.0f}")
        if intelligence.health_expenditure_gdp_pct:
            parts.append(f"- Health Expenditure (% GDP): {intelligence.health_expenditure_gdp_pct}%")
        if intelligence.life_expectancy_at_birth:
            parts.append(f"- Life Expectancy: {intelligence.life_expectancy_at_birth} years")
        if intelligence.hdi_score:
            parts.append(f"- HDI Score: {intelligence.hdi_score}")
        if intelligence.labor_force_participation:
            parts.append(f"- Labor Force Participation: {intelligence.labor_force_participation}%")
        if intelligence.unemployment_rate:
            parts.append(f"- Unemployment Rate: {intelligence.unemployment_rate}%")
    
    return "\n".join(parts)


def format_socioeconomic_data(
    saudi_intel: Optional[CountryIntelligence],
    comparison_intel: Optional[CountryIntelligence]
) -> str:
    """Format socioeconomic comparison data for AI prompt."""
    parts = ["### Socioeconomic Comparison Data:"]
    
    metrics = [
        ("GDP per Capita (PPP)", "gdp_per_capita_ppp", "${:,.0f}"),
        ("Population", "population_total", "{:,.0f}"),
        ("Health Expenditure (% GDP)", "health_expenditure_gdp_pct", "{}%"),
        ("Life Expectancy", "life_expectancy_at_birth", "{} years"),
        ("HDI Score", "hdi_score", "{}"),
        ("Labor Force Participation", "labor_force_participation", "{}%"),
        ("Unemployment Rate", "unemployment_rate", "{}%"),
        ("Urban Population", "urban_population_pct", "{}%"),
    ]
    
    for name, attr, fmt in metrics:
        saudi_val = getattr(saudi_intel, attr, None) if saudi_intel else None
        comp_val = getattr(comparison_intel, attr, None) if comparison_intel else None
        
        saudi_str = fmt.format(saudi_val) if saudi_val else "N/A"
        comp_str = fmt.format(comp_val) if comp_val else "N/A"
        
        parts.append(f"- {name}: Saudi Arabia = {saudi_str}, Comparison = {comp_str}")
    
    return "\n".join(parts)


def parse_ai_response(response: str) -> Dict[str, Any]:
    """Parse AI response JSON."""
    try:
        # Try to find JSON in the response
        response = response.strip()
        
        # Remove markdown code blocks if present
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        
        return json.loads(response.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        logger.error(f"Response was: {response[:500]}...")
        return {}


async def generate_comparison_report(
    db: Session,
    comparison_iso: str,
    user_email: Optional[str] = None
) -> ComparisonReport:
    """Generate a new comparison report using AI."""
    start_time = time.time()
    
    # Get AI config
    ai_config = get_ai_config(db)
    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured"
        )
    
    # Ensure agent exists
    ensure_agent_exists(db)
    
    # Get country data
    saudi = get_country_data(db, "SAU")
    comparison = get_country_data(db, comparison_iso)
    
    if not saudi or not comparison:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country data not found for SAU or {comparison_iso}"
        )
    
    # Get intelligence data
    saudi_intel = get_intelligence_data(db, "SAU")
    comparison_intel = get_intelligence_data(db, comparison_iso)
    
    # Prepare variables for agent
    data_provider = CountryDataProvider(db)
    
    variables = {
        "SAUDI_DATA": format_country_data(saudi, saudi_intel),
        "COMPARISON_NAME": comparison.name or comparison_iso,
        "COMPARISON_ISO": comparison_iso,
        "COMPARISON_DATA": format_country_data(comparison, comparison_intel),
        "FRAMEWORK_METRICS": data_provider.get_framework_metrics_context(),
        "SOCIOECONOMIC_DATA": format_socioeconomic_data(saudi_intel, comparison_intel),
    }
    
    # Run agent
    runner = AgentRunner(db, ai_config)
    result = await runner.run("comparison-research-analyst", variables)
    
    # Parse response
    parsed = parse_ai_response(result)
    
    generation_time = time.time() - start_time
    
    # Create or update report
    report_id = ComparisonReport.generate_id("SAU", comparison_iso)
    existing = db.query(ComparisonReport).filter(ComparisonReport.id == report_id).first()
    
    if existing:
        # Update existing
        existing.executive_summary = parsed.get("executive_summary")
        existing.framework_analysis = parsed.get("framework_analysis")
        existing.socioeconomic_comparison = parsed.get("socioeconomic_comparison")
        existing.metric_comparisons = parsed.get("metric_comparisons")
        existing.strategic_recommendations = parsed.get("strategic_recommendations")
        existing.sources_cited = parsed.get("sources_cited")
        existing.updated_at = datetime.utcnow()
        existing.version = (existing.version or 0) + 1
        existing.generation_time_seconds = generation_time
        db.commit()
        return existing
    else:
        # Create new
        report = ComparisonReport(
            id=report_id,
            primary_iso="SAU",
            comparison_iso=comparison_iso,
            executive_summary=parsed.get("executive_summary"),
            framework_analysis=parsed.get("framework_analysis"),
            socioeconomic_comparison=parsed.get("socioeconomic_comparison"),
            metric_comparisons=parsed.get("metric_comparisons"),
            strategic_recommendations=parsed.get("strategic_recommendations"),
            sources_cited=parsed.get("sources_cited"),
            created_by=user_email,
            version=1,
            generation_time_seconds=generation_time,
        )
        db.add(report)
        db.commit()
        return report


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/{comparison_iso}", response_model=Optional[ComparisonReportResponse])
async def get_comparison_report(
    comparison_iso: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get cached comparison report for a country.
    
    Returns null if no report exists yet.
    """
    comparison_iso = comparison_iso.upper()
    report_id = ComparisonReport.generate_id("SAU", comparison_iso)
    
    report = db.query(ComparisonReport).filter(ComparisonReport.id == report_id).first()
    
    if not report:
        return None
    
    # Get comparison country name
    comparison_country = get_country_data(db, comparison_iso)
    comparison_name = comparison_country.name if comparison_country else comparison_iso
    
    return ComparisonReportResponse(
        id=report.id,
        primary_iso=report.primary_iso,
        comparison_iso=report.comparison_iso,
        executive_summary=report.executive_summary,
        framework_analysis=report.framework_analysis,
        socioeconomic_comparison=report.socioeconomic_comparison,
        metric_comparisons=report.metric_comparisons,
        strategic_recommendations=report.strategic_recommendations,
        sources_cited=report.sources_cited,
        created_at=report.created_at.isoformat() if report.created_at else None,
        updated_at=report.updated_at.isoformat() if report.updated_at else None,
        version=report.version or 1,
        generation_time_seconds=report.generation_time_seconds,
        comparison_name=comparison_name,
    )


@router.post("/{comparison_iso}/generate", response_model=ComparisonReportResponse)
async def generate_report(
    comparison_iso: str,
    request: GenerateRequest = GenerateRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Generate a comparison report.
    
    Checks cache first unless force=true.
    Regular users cannot force regeneration.
    """
    comparison_iso = comparison_iso.upper()
    report_id = ComparisonReport.generate_id("SAU", comparison_iso)
    
    # Check if report exists
    if not request.force:
        existing = db.query(ComparisonReport).filter(ComparisonReport.id == report_id).first()
        if existing:
            # Return cached
            comparison_country = get_country_data(db, comparison_iso)
            comparison_name = comparison_country.name if comparison_country else comparison_iso
            
            return ComparisonReportResponse(
                id=existing.id,
                primary_iso=existing.primary_iso,
                comparison_iso=existing.comparison_iso,
                executive_summary=existing.executive_summary,
                framework_analysis=existing.framework_analysis,
                socioeconomic_comparison=existing.socioeconomic_comparison,
                metric_comparisons=existing.metric_comparisons,
                strategic_recommendations=existing.strategic_recommendations,
                sources_cited=existing.sources_cited,
                created_at=existing.created_at.isoformat() if existing.created_at else None,
                updated_at=existing.updated_at.isoformat() if existing.updated_at else None,
                version=existing.version or 1,
                generation_time_seconds=existing.generation_time_seconds,
                comparison_name=comparison_name,
            )
    
    # Generate new report
    user_email = current_user.email if current_user else None
    report = await generate_comparison_report(db, comparison_iso, user_email)
    
    comparison_country = get_country_data(db, comparison_iso)
    comparison_name = comparison_country.name if comparison_country else comparison_iso
    
    return ComparisonReportResponse(
        id=report.id,
        primary_iso=report.primary_iso,
        comparison_iso=report.comparison_iso,
        executive_summary=report.executive_summary,
        framework_analysis=report.framework_analysis,
        socioeconomic_comparison=report.socioeconomic_comparison,
        metric_comparisons=report.metric_comparisons,
        strategic_recommendations=report.strategic_recommendations,
        sources_cited=report.sources_cited,
        created_at=report.created_at.isoformat() if report.created_at else None,
        updated_at=report.updated_at.isoformat() if report.updated_at else None,
        version=report.version or 1,
        generation_time_seconds=report.generation_time_seconds,
        comparison_name=comparison_name,
    )


@router.put("/{comparison_iso}/regenerate", response_model=ComparisonReportResponse)
async def regenerate_report(
    comparison_iso: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Force regenerate a comparison report (admin only).
    """
    # Check admin
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can force regeneration"
        )
    
    comparison_iso = comparison_iso.upper()
    
    # Generate new report
    report = await generate_comparison_report(db, comparison_iso, current_user.email)
    
    comparison_country = get_country_data(db, comparison_iso)
    comparison_name = comparison_country.name if comparison_country else comparison_iso
    
    return ComparisonReportResponse(
        id=report.id,
        primary_iso=report.primary_iso,
        comparison_iso=report.comparison_iso,
        executive_summary=report.executive_summary,
        framework_analysis=report.framework_analysis,
        socioeconomic_comparison=report.socioeconomic_comparison,
        metric_comparisons=report.metric_comparisons,
        strategic_recommendations=report.strategic_recommendations,
        sources_cited=report.sources_cited,
        created_at=report.created_at.isoformat() if report.created_at else None,
        updated_at=report.updated_at.isoformat() if report.updated_at else None,
        version=report.version or 1,
        generation_time_seconds=report.generation_time_seconds,
        comparison_name=comparison_name,
    )


@router.get("/all", response_model=ReportListResponse)
async def list_all_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all cached comparison reports (admin only).
    """
    # Check admin
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view all reports"
        )
    
    reports = db.query(ComparisonReport).order_by(ComparisonReport.created_at.desc()).all()
    
    summaries = []
    for report in reports:
        comparison_country = get_country_data(db, report.comparison_iso)
        summaries.append(ComparisonReportSummary(
            id=report.id,
            comparison_iso=report.comparison_iso,
            comparison_name=comparison_country.name if comparison_country else None,
            created_at=report.created_at.isoformat() if report.created_at else None,
            version=report.version or 1,
        ))
    
    return ReportListResponse(total=len(summaries), reports=summaries)
