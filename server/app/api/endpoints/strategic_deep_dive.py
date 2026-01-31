"""
Strategic Deep Dive API - Using AgentRunner
============================================

Generates strategic intelligence reports by country and topic using:
- AgentRunner with report-generation agent
- CountryDataProvider for automatic database context injection
- CountryDeepDive model for persistent storage
"""

import logging
import json
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User, AIConfig
from app.models.country import Country, CountryDeepDive, DeepDiveStatus
from app.services.agent_runner import AgentRunner

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/strategic-deep-dive", tags=["Strategic Deep Dive"])


# =============================================================================
# SCHEMAS
# =============================================================================

class CountryListItem(BaseModel):
    """Country with report status."""
    iso_code: str
    name: str
    region: Optional[str]
    has_report: bool
    report_status: Optional[str]
    topic_count: int


class CountryListResponse(BaseModel):
    """List of countries with their report statuses."""
    countries: List[CountryListItem]
    total: int


class TopicStatus(BaseModel):
    """Status of a single topic for a country."""
    topic: str
    status: str
    generated_at: Optional[str]


class TopicStatusResponse(BaseModel):
    """All topic statuses for a country."""
    iso_code: str
    country_name: str
    topics: List[TopicStatus]


class GenerateRequest(BaseModel):
    """Request to generate a deep dive report."""
    topic: str = "Comprehensive Occupational Health Assessment"
    enable_web_search: bool = False


class ReportResponse(BaseModel):
    """Full report response."""
    iso_code: str
    country_name: str
    topic: str
    status: str
    strategy_name: Optional[str]
    executive_summary: Optional[str]
    strategic_narrative: Optional[str]
    health_profile: Optional[str]
    workforce_insights: Optional[str]
    key_findings: List[dict]
    strengths: List[dict]
    weaknesses: List[dict]
    opportunities: List[dict]
    threats: List[dict]
    strategic_recommendations: List[dict]
    action_items: List[dict]
    priority_interventions: List[dict]
    peer_comparison: Optional[str]
    global_ranking_context: Optional[str]
    benchmark_countries: List[dict]
    data_quality_notes: Optional[str]
    generated_at: Optional[str]
    error_message: Optional[str]


class AgentLogEntry(BaseModel):
    """Single entry in the agent activity log."""
    timestamp: str
    agent: str
    status: str
    message: str
    emoji: str = ""


class GenerateResponse(BaseModel):
    """Response from synchronous report generation - matches frontend expectations."""
    success: bool
    iso_code: str
    country_name: str
    report: Optional[ReportResponse] = None
    agent_log: List[AgentLogEntry] = []
    error: Optional[str] = None


# =============================================================================
# AVAILABLE TOPICS
# =============================================================================

AVAILABLE_TOPICS = [
    "Comprehensive Occupational Health Assessment",
    "Policy & Regulatory Framework",
    "Workforce Health & Safety",
    "Healthcare Infrastructure",
    "Economic Impact Analysis",
    "Regional Comparison",
    "Implementation Roadmap",
    "Risk Assessment",
]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/countries", response_model=CountryListResponse)
async def list_countries(
    db: Session = Depends(get_db),
):
    """
    List all countries with their deep dive report statuses.
    
    Returns countries with:
    - Whether they have any completed reports
    - Count of topics with reports
    """
    try:
        # Get all countries
        countries = db.query(Country).order_by(Country.name).all()
        
        # Get all deep dives grouped by country
        deep_dives = db.query(CountryDeepDive).all()
        dive_map = {}
        for dive in deep_dives:
            if dive.country_iso_code not in dive_map:
                dive_map[dive.country_iso_code] = []
            dive_map[dive.country_iso_code].append(dive)
        
        result = []
        for country in countries:
            country_dives = dive_map.get(country.iso_code, [])
            completed_dives = [d for d in country_dives if d.status == DeepDiveStatus.COMPLETED]
            
            # Get the most recent status
            latest_status = None
            if country_dives:
                latest = max(country_dives, key=lambda d: d.updated_at or d.created_at)
                latest_status = latest.status.value
            
            result.append(CountryListItem(
                iso_code=country.iso_code,
                name=country.name,
                region=getattr(country, 'region', None),
                has_report=len(completed_dives) > 0,
                report_status=latest_status,
                topic_count=len(completed_dives),
            ))
        
        return CountryListResponse(
            countries=result,
            total=len(result),
        )
    except Exception as e:
        logger.error(f"Failed to list countries: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/topics")
async def list_topics():
    """Get list of available analysis topics."""
    return {
        "topics": AVAILABLE_TOPICS,
        "default": AVAILABLE_TOPICS[0],
    }


@router.get("/{iso_code}/topics", response_model=TopicStatusResponse)
async def get_topic_statuses(
    iso_code: str,
    db: Session = Depends(get_db),
):
    """
    Get status of all topics for a specific country.
    
    Shows which topics have been generated and their status.
    """
    iso_code = iso_code.upper()
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(status_code=404, detail=f"Country '{iso_code}' not found")
    
    # Get all deep dives for this country
    dives = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code
    ).all()
    
    dive_map = {d.topic: d for d in dives}
    
    topics = []
    for topic_name in AVAILABLE_TOPICS:
        dive = dive_map.get(topic_name)
        topics.append(TopicStatus(
            topic=topic_name,
            status=dive.status.value if dive else "not_started",
            generated_at=dive.generated_at.isoformat() if dive and dive.generated_at else None,
        ))
    
    return TopicStatusResponse(
        iso_code=iso_code,
        country_name=country.name,
        topics=topics,
    )


@router.get("/{iso_code}", response_model=ReportResponse)
async def get_report(
    iso_code: str,
    topic: str = "Comprehensive Occupational Health Assessment",
    db: Session = Depends(get_db),
):
    """
    Get a stored deep dive report for a country and topic.
    
    Returns the full report if available, or status if still processing.
    """
    iso_code = iso_code.upper()
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(status_code=404, detail=f"Country '{iso_code}' not found")
    
    # Get the deep dive
    dive = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code,
        CountryDeepDive.topic == topic,
    ).first()
    
    if not dive:
        # Return empty report with pending status
        return ReportResponse(
            iso_code=iso_code,
            country_name=country.name,
            topic=topic,
            status="not_started",
            strategy_name=None,
            executive_summary=None,
            strategic_narrative=None,
            health_profile=None,
            workforce_insights=None,
            key_findings=[],
            strengths=[],
            weaknesses=[],
            opportunities=[],
            threats=[],
            strategic_recommendations=[],
            action_items=[],
            priority_interventions=[],
            peer_comparison=None,
            global_ranking_context=None,
            benchmark_countries=[],
            data_quality_notes=None,
            generated_at=None,
            error_message=None,
        )
    
    return ReportResponse(
        iso_code=iso_code,
        country_name=country.name,
        topic=dive.topic,
        status=dive.status.value,
        strategy_name=dive.strategy_name,
        executive_summary=dive.executive_summary,
        strategic_narrative=dive.strategic_narrative,
        health_profile=dive.health_profile,
        workforce_insights=dive.workforce_insights,
        key_findings=dive.key_findings or [],
        strengths=dive.strengths or [],
        weaknesses=dive.weaknesses or [],
        opportunities=dive.opportunities or [],
        threats=dive.threats or [],
        strategic_recommendations=dive.strategic_recommendations or [],
        action_items=dive.action_items or [],
        priority_interventions=dive.priority_interventions or [],
        peer_comparison=dive.peer_comparison,
        global_ranking_context=dive.global_ranking_context,
        benchmark_countries=dive.benchmark_countries or [],
        data_quality_notes=dive.data_quality_notes,
        generated_at=dive.generated_at.isoformat() if dive.generated_at else None,
        error_message=dive.error_message,
    )


@router.post("/{iso_code}/generate", response_model=GenerateResponse)
async def generate_report(
    iso_code: str,
    request: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Generate a strategic deep dive report using AgentRunner - SYNCHRONOUS.
    
    Uses the report-generation agent with automatic database context injection.
    Returns the full report immediately (not background processing).
    Admin only - requires authentication.
    """
    iso_code = iso_code.upper()
    agent_log = []
    
    def log_step(agent: str, status: str, message: str, emoji: str = ""):
        agent_log.append(AgentLogEntry(
            timestamp=datetime.utcnow().isoformat(),
            agent=agent,
            status=status,
            message=message,
            emoji=emoji,
        ))
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise HTTPException(status_code=404, detail=f"Country '{iso_code}' not found")
    
    log_step("System", "started", f"Generating report for {country.name}", "🚀")
    
    # Get AI config
    ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not ai_config:
        return GenerateResponse(
            success=False,
            iso_code=iso_code,
            country_name=country.name,
            report=None,
            agent_log=agent_log,
            error="No AI configuration found. Please configure AI settings first.",
        )
    
    log_step("System", "ready", f"Using AI: {ai_config.provider}/{ai_config.model}", "⚙️")
    
    # Create or update deep dive record
    existing = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code,
        CountryDeepDive.topic == request.topic,
    ).first()
    
    if existing:
        dive = existing
        dive.status = DeepDiveStatus.PROCESSING
        dive.error_message = None
    else:
        dive = CountryDeepDive(
            id=str(uuid.uuid4()),
            country_iso_code=iso_code,
            topic=request.topic,
            status=DeepDiveStatus.PROCESSING,
            generated_by_user_id=str(current_user.id),
        )
        db.add(dive)
    
    db.commit()
    db.refresh(dive)
    
    try:
        # Run the report-generation agent SYNCHRONOUSLY
        log_step("AgentRunner", "running", "Executing report-generation agent with database context", "🤖")
        
        runner = AgentRunner(db, ai_config)
        result = await runner.run(
            agent_id="report-generation",
            variables={
                "ISO_CODE": iso_code,
                "TOPIC": request.topic,
                # DATABASE_CONTEXT and COUNTRY_NAME are auto-injected by AgentRunner
            },
            update_stats=True,
            enable_web_search=request.enable_web_search,
        )
        
        if not result["success"]:
            dive.status = DeepDiveStatus.FAILED
            dive.error_message = result["error"]
            dive.generated_at = datetime.utcnow()
            db.commit()
            
            log_step("AgentRunner", "failed", f"Agent failed: {result['error']}", "❌")
            
            return GenerateResponse(
                success=False,
                iso_code=iso_code,
                country_name=country.name,
                report=None,
                agent_log=agent_log,
                error=result["error"],
            )
        
        log_step("AgentRunner", "completed", "Agent returned output, parsing JSON...", "✅")
        
        # Parse JSON response from agent
        output = result["output"]
        report_data = _parse_agent_output(output)
        
        if not report_data:
            dive.status = DeepDiveStatus.FAILED
            dive.error_message = "Failed to parse agent output as JSON"
            dive.generated_at = datetime.utcnow()
            db.commit()
            
            log_step("Parser", "failed", "Could not parse agent output as JSON", "❌")
            
            return GenerateResponse(
                success=False,
                iso_code=iso_code,
                country_name=country.name,
                report=None,
                agent_log=agent_log,
                error="Failed to parse agent output as JSON",
            )
        
        log_step("Parser", "completed", "JSON parsed successfully, storing report", "📋")
        
        # Update deep dive with parsed data
        dive.status = DeepDiveStatus.COMPLETED
        dive.strategy_name = report_data.get("strategy_name")
        dive.executive_summary = report_data.get("executive_summary")
        dive.strategic_narrative = report_data.get("strategic_narrative")
        dive.health_profile = report_data.get("health_profile")
        dive.workforce_insights = report_data.get("workforce_insights")
        dive.key_findings = report_data.get("key_findings", [])
        dive.strengths = report_data.get("strengths", [])
        dive.weaknesses = report_data.get("weaknesses", [])
        dive.opportunities = report_data.get("opportunities", [])
        dive.threats = report_data.get("threats", [])
        dive.strategic_recommendations = report_data.get("strategic_recommendations", [])
        dive.action_items = report_data.get("action_items", [])
        dive.priority_interventions = report_data.get("priority_interventions", [])
        dive.peer_comparison = report_data.get("peer_comparison")
        dive.global_ranking_context = report_data.get("global_ranking_context")
        dive.benchmark_countries = report_data.get("benchmark_countries", [])
        dive.data_quality_notes = report_data.get("data_quality_notes")
        dive.external_research_summary = report_data.get("external_research_summary")
        dive.ai_provider = f"{ai_config.provider}/{ai_config.model}"
        dive.generated_at = datetime.utcnow()
        dive.error_message = None
        
        db.commit()
        db.refresh(dive)
        
        log_step("System", "completed", f"Report generated successfully for {country.name}", "🎉")
        logger.info(f"Report generation completed for {iso_code} - {request.topic}")
        
        # Build and return the full report response
        report = ReportResponse(
            iso_code=iso_code,
            country_name=country.name,
            topic=dive.topic,
            status=dive.status.value,
            strategy_name=dive.strategy_name,
            executive_summary=dive.executive_summary,
            strategic_narrative=dive.strategic_narrative,
            health_profile=dive.health_profile,
            workforce_insights=dive.workforce_insights,
            key_findings=dive.key_findings or [],
            strengths=dive.strengths or [],
            weaknesses=dive.weaknesses or [],
            opportunities=dive.opportunities or [],
            threats=dive.threats or [],
            strategic_recommendations=dive.strategic_recommendations or [],
            action_items=dive.action_items or [],
            priority_interventions=dive.priority_interventions or [],
            peer_comparison=dive.peer_comparison,
            global_ranking_context=dive.global_ranking_context,
            benchmark_countries=dive.benchmark_countries or [],
            data_quality_notes=dive.data_quality_notes,
            generated_at=dive.generated_at.isoformat() if dive.generated_at else None,
            error_message=None,
        )
        
        return GenerateResponse(
            success=True,
            iso_code=iso_code,
            country_name=country.name,
            report=report,
            agent_log=agent_log,
            error=None,
        )
        
    except Exception as e:
        logger.error(f"Error generating report for {iso_code}: {e}", exc_info=True)
        
        try:
            dive.status = DeepDiveStatus.FAILED
            dive.error_message = str(e)
            dive.generated_at = datetime.utcnow()
            db.commit()
        except Exception:
            db.rollback()
        
        log_step("System", "failed", f"Exception: {str(e)}", "💥")
        
        return GenerateResponse(
            success=False,
            iso_code=iso_code,
            country_name=country.name,
            report=None,
            agent_log=agent_log,
            error=str(e),
        )


def _parse_agent_output(output: str) -> Optional[dict]:
    """
    Parse JSON output from the report-generation agent.
    
    Handles various JSON formats:
    - Pure JSON
    - JSON wrapped in markdown code blocks
    - JSON with text before/after
    """
    if not output:
        return None
    
    # Try direct parse
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        pass
    
    # Try extracting from markdown code block
    import re
    
    # Match ```json ... ``` or ``` ... ```
    json_block = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?```', output)
    if json_block:
        try:
            return json.loads(json_block.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try to find JSON object in the text
    brace_start = output.find('{')
    brace_end = output.rfind('}')
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        try:
            return json.loads(output[brace_start:brace_end + 1])
        except json.JSONDecodeError:
            pass
    
    logger.warning(f"Could not parse JSON from agent output: {output[:200]}...")
    return None


@router.get("/{iso_code}/status")
async def get_generation_status(
    iso_code: str,
    topic: str = "Comprehensive Occupational Health Assessment",
    db: Session = Depends(get_db),
):
    """
    Get the generation status for a specific report.
    
    Useful for polling during generation.
    """
    iso_code = iso_code.upper()
    
    dive = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code,
        CountryDeepDive.topic == topic,
    ).first()
    
    if not dive:
        return {
            "iso_code": iso_code,
            "topic": topic,
            "status": "not_started",
            "generated_at": None,
            "error_message": None,
        }
    
    return {
        "iso_code": iso_code,
        "topic": topic,
        "status": dive.status.value,
        "generated_at": dive.generated_at.isoformat() if dive.generated_at else None,
        "error_message": dive.error_message,
    }
