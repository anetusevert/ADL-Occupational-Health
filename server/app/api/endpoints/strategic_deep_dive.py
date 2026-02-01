"""
Strategic Deep Dive API - Using AgentRunner
============================================

Generates strategic intelligence reports by country and topic using:
- AgentRunner with report-generation agent
- CountryDataProvider for automatic database context injection
- CountryDeepDive model for persistent storage
"""

import asyncio
import logging
import json
import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db, SessionLocal
from app.core.dependencies import get_current_admin_user
from app.models.user import User, AIConfig
from app.models.country import Country, CountryDeepDive, DeepDiveStatus
from app.models.agent import Agent, DEFAULT_AGENTS
from app.services.agent_runner import AgentRunner

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/strategic-deep-dive", tags=["Strategic Deep Dive"])


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def ensure_agents_exist_with_session(db: Session) -> bool:
    """
    Ensure all default agents exist in the database AND have updated prompts.
    
    This is called before running agents to ensure they exist,
    since the orchestration page might not have been visited yet.
    
    IMPORTANT: This also UPDATES existing agents with the latest prompts from DEFAULT_AGENTS.
    This ensures that code changes to prompts are reflected in production.
    
    Returns True if report-generation agent exists, False otherwise.
    """
    try:
        logger.info("[SEED] Syncing agents with DEFAULT_AGENTS...")
        
        # Sync all default agents - create new or update existing
        for agent_data in DEFAULT_AGENTS:
            existing = db.query(Agent).filter(Agent.id == agent_data["id"]).first()
            
            if existing:
                # Check if prompts need updating by comparing lengths (quick check)
                prompt_changed = (
                    len(existing.system_prompt or "") != len(agent_data["system_prompt"]) or
                    existing.name != agent_data["name"]
                )
                
                if prompt_changed:
                    logger.info(f"[SEED] Updating agent prompts: {agent_data['id']} (name: {agent_data['name']})")
                    existing.name = agent_data["name"]
                    existing.description = agent_data["description"]
                    existing.system_prompt = agent_data["system_prompt"]
                    existing.user_prompt_template = agent_data["user_prompt_template"]
                    existing.template_variables = agent_data["template_variables"]
                    existing.icon = agent_data["icon"]
                    existing.color = agent_data["color"]
                else:
                    logger.debug(f"[SEED] Agent already up-to-date: {agent_data['id']}")
            else:
                logger.info(f"[SEED] Creating new agent: {agent_data['id']}")
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
        logger.info(f"[SEED] Agent sync completed for {len(DEFAULT_AGENTS)} agents")
        
        # Verify the report-generation agent exists
        verify = db.query(Agent).filter(Agent.id == "report-generation").first()
        if verify:
            logger.info(f"[SEED] Verified: report-generation agent ready (name: {verify.name})")
            return True
        else:
            logger.error(f"[SEED] CRITICAL: Agent still not found after sync!")
            return False
        
    except Exception as e:
        logger.error(f"[SEED] ERROR syncing agents: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False


def ensure_agents_exist():
    """
    Create a new database session and ensure agents exist.
    Uses a completely isolated session to avoid any contamination.
    """
    isolated_db = None
    try:
        isolated_db = SessionLocal()
        result = ensure_agents_exist_with_session(isolated_db)
        return result
    except Exception as e:
        logger.error(f"[SEED] Failed to ensure agents exist: {e}")
        return False
    finally:
        if isolated_db:
            isolated_db.close()


def _validate_llm_output(output: str) -> tuple[bool, str]:
    """
    Check if LLM output looks like contaminated agent data.
    
    Returns (is_valid, error_message)
    """
    if not output:
        return False, "LLM output is empty"
    
    # Check for suspicious patterns that indicate agent data contamination
    suspicious_patterns = [
        ('system_prompt__', 'Contains agent system_prompt field with index'),
        ('user_prompt_template__', 'Contains agent user_prompt_template field with index'),
        ('template_variables__', 'Contains agent template_variables field with index'),
        ('datetime.datetime(', 'Contains Python datetime object repr'),
        ("'id__0':", 'Contains flattened agent id field'),
        ("'id__1':", 'Contains flattened agent id field'),
        ("'name__0':", 'Contains flattened agent name field'),
        ("'name__1':", 'Contains flattened agent name field'),
        ('execution_count__', 'Contains agent execution_count field with index'),
        ('is_active__', 'Contains agent is_active field with index'),
    ]
    
    for pattern, description in suspicious_patterns:
        if pattern in output:
            logger.error(f"[VALIDATE] LLM output CONTAMINATED: {description}")
            logger.error(f"[VALIDATE] Output sample: {output[:500]}...")
            return False, f"LLM output contains agent data (contaminated): {description}"
    
    # Check if output looks like valid JSON (should start with { or [)
    stripped = output.strip()
    if not (stripped.startswith('{') or stripped.startswith('[') or stripped.startswith('```')):
        logger.warning(f"[VALIDATE] LLM output doesn't look like JSON: {stripped[:100]}...")
    
    return True, ""


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
    force_regenerate: bool = False  # If True, delete existing report and generate fresh


class ReportResponse(BaseModel):
    """McKinsey-grade comprehensive strategic report with deep analysis sections."""
    # Core identification
    iso_code: str
    country_name: str
    topic: str
    status: str
    
    # Executive Section
    strategy_name: Optional[str] = None
    executive_summary: Optional[str] = None
    strategic_narrative: Optional[str] = None
    
    # Deep Analysis Sections (NEW for McKinsey-grade)
    situation_analysis: Optional[str] = None
    deep_dive_analysis: Optional[str] = None
    
    # Context Sections
    health_profile: Optional[str] = None
    workforce_insights: Optional[str] = None
    
    # Key Findings (each: {title, description, impact_level})
    key_findings: List[Any] = []
    
    # SWOT Analysis (each item: {title, description, ...})
    strengths: List[Any] = []
    weaknesses: List[Any] = []
    opportunities: List[Any] = []
    threats: List[Any] = []
    
    # Recommendations and Actions
    strategic_recommendations: List[Any] = []  # {title, description, priority, timeline}
    priority_interventions: List[str] = []
    action_items: List[Any] = []  # {action, responsible_party, timeline}
    
    # Implementation & Risk (NEW for McKinsey-grade)
    implementation_roadmap: Optional[str] = None
    stakeholder_analysis: Optional[str] = None
    risk_assessment: Optional[str] = None
    resource_requirements: Optional[str] = None
    success_metrics: Optional[str] = None
    
    # Benchmarking
    peer_comparison: Optional[str] = None
    global_ranking_context: Optional[str] = None
    benchmark_countries: List[Any] = []  # {iso_code, name, reason}
    
    # Metadata
    generated_at: Optional[str] = None
    error_message: Optional[str] = None
    model_used: Optional[str] = None


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
    
    # DEBUG: Log what we found
    if dive:
        logger.info(f"GET /{iso_code} - Found dive record:")
        logger.info(f"  status: {dive.status.value}")
        logger.info(f"  key_findings type: {type(dive.key_findings)}")
        logger.info(f"  key_findings sample: {str(dive.key_findings)[:200] if dive.key_findings else 'empty'}")
        logger.info(f"  strengths type: {type(dive.strengths)}")
        logger.info(f"  executive_summary: {dive.executive_summary[:100] if dive.executive_summary else 'None'}...")
    else:
        logger.info(f"GET /{iso_code} - No dive record found for topic: {topic}")
    
    if not dive:
        # Return empty report with pending status
        return ReportResponse(
            iso_code=iso_code,
            country_name=country.name,
            topic=topic,
            status="not_started",
        )
    
    # Return McKinsey-grade report with all fields
    # Note: New fields (situation_analysis, etc.) will be None for old reports until regenerated
    return ReportResponse(
        # Core identification
        iso_code=iso_code,
        country_name=country.name,
        topic=dive.topic,
        status=dive.status.value,
        
        # Executive Section
        strategy_name=dive.strategy_name,
        executive_summary=dive.executive_summary,
        strategic_narrative=dive.strategic_narrative,
        
        # Deep Analysis Sections (not in DB yet - will be None for old reports)
        situation_analysis=None,
        deep_dive_analysis=None,
        
        # Context Sections
        health_profile=dive.health_profile,
        workforce_insights=dive.workforce_insights,
        
        # Key Findings (preserve full objects)
        key_findings=dive.key_findings or [],
        
        # SWOT Analysis (preserve full objects)
        strengths=dive.strengths or [],
        weaknesses=dive.weaknesses or [],
        opportunities=dive.opportunities or [],
        threats=dive.threats or [],
        
        # Recommendations and Actions
        strategic_recommendations=dive.strategic_recommendations or [],
        priority_interventions=dive.priority_interventions or [],
        action_items=dive.action_items or [],
        
        # Implementation & Risk (not in DB yet - will be None for old reports)
        implementation_roadmap=None,
        stakeholder_analysis=None,
        risk_assessment=None,
        resource_requirements=None,
        success_metrics=None,
        
        # Benchmarking
        peer_comparison=dive.peer_comparison,
        global_ranking_context=dive.global_ranking_context,
        benchmark_countries=dive.benchmark_countries or [],
        
        # Metadata
        generated_at=dive.generated_at.isoformat() if dive.generated_at else None,
        error_message=dive.error_message,
        model_used=dive.ai_provider,
    )


@router.get("/{iso_code}/debug")
async def debug_report(
    iso_code: str,
    topic: str = "Comprehensive Occupational Health Assessment",
    db: Session = Depends(get_db),
):
    """
    Debug endpoint to inspect raw CountryDeepDive data.
    
    Use this to check if JSONB fields contain corrupted/unexpected data.
    """
    iso_code = iso_code.upper()
    
    dive = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code,
        CountryDeepDive.topic == topic,
    ).first()
    
    if not dive:
        return {
            "status": "no_record",
            "iso_code": iso_code,
            "topic": topic,
            "message": "No deep dive record found for this country and topic",
        }
    
    # Inspect the data types and samples
    return {
        "status": "found",
        "iso_code": iso_code,
        "topic": topic,
        "dive_id": dive.id,
        "dive_status": dive.status.value,
        "data_inspection": {
            "executive_summary": {
                "type": str(type(dive.executive_summary)),
                "length": len(dive.executive_summary) if dive.executive_summary else 0,
                "sample": dive.executive_summary[:300] if dive.executive_summary else None,
            },
            "key_findings": {
                "type": str(type(dive.key_findings)),
                "length": len(dive.key_findings) if dive.key_findings else 0,
                "sample": str(dive.key_findings)[:500] if dive.key_findings else None,
            },
            "strengths": {
                "type": str(type(dive.strengths)),
                "length": len(dive.strengths) if dive.strengths else 0,
                "sample": str(dive.strengths)[:500] if dive.strengths else None,
            },
            "weaknesses": {
                "type": str(type(dive.weaknesses)),
                "length": len(dive.weaknesses) if dive.weaknesses else 0,
                "sample": str(dive.weaknesses)[:500] if dive.weaknesses else None,
            },
            "strategic_recommendations": {
                "type": str(type(dive.strategic_recommendations)),
                "length": len(dive.strategic_recommendations) if dive.strategic_recommendations else 0,
                "sample": str(dive.strategic_recommendations)[:500] if dive.strategic_recommendations else None,
            },
        },
        "generated_at": dive.generated_at.isoformat() if dive.generated_at else None,
        "error_message": dive.error_message,
    }


@router.delete("/{iso_code}/clear-all")
async def clear_all_reports(
    iso_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Delete ALL deep dive records for a country to allow fresh generation.
    
    Admin only. Use this to clear corrupted data.
    """
    iso_code = iso_code.upper()
    
    deleted = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code
    ).delete()
    db.commit()
    
    logger.info(f"Cleared {deleted} deep dive records for {iso_code}")
    
    return {
        "success": True,
        "iso_code": iso_code,
        "deleted_count": deleted,
        "message": f"Deleted {deleted} deep dive records for {iso_code}",
    }


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
    country = None  # Initialize for error handler
    
    def log_step(agent: str, status: str, message: str, emoji: str = ""):
        agent_log.append(AgentLogEntry(
            timestamp=datetime.utcnow().isoformat(),
            agent=agent,
            status=status,
            message=message,
            emoji=emoji,
        ))
    
    try:
        # Ensure agents are seeded before running - USE ISOLATED SESSION
        # This prevents any potential data contamination from agent queries
        logger.info(f"[GENERATE] Starting generation for {iso_code}")
        
        # Use the new function that manages its own session
        agents_ready = ensure_agents_exist()
        
        # CRITICAL: Expire main session cache so it can see newly committed agents
        db.expire_all()
        
        if not agents_ready:
            logger.error(f"[GENERATE] CRITICAL: Failed to ensure agents exist!")
            return GenerateResponse(
                success=False,
                iso_code=iso_code,
                country_name="Unknown",
                report=None,
                agent_log=agent_log,
                error="Failed to initialize report-generation agent. Please check server logs.",
            )
        
        logger.info(f"[GENERATE] ensure_agents_exist completed successfully, main session cache expired")
        
        # CRITICAL: Verify the agent is visible to the main session
        # Due to transaction isolation, the main session might not see newly committed agents
        verify_agent = db.query(Agent).filter(Agent.id == "report-generation").first()
        if not verify_agent:
            logger.error(f"[GENERATE] Agent not visible to main session - trying direct seed")
            # Try seeding with the main session as a fallback
            for agent_data in DEFAULT_AGENTS:
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
                    logger.info(f"[GENERATE] Added agent via main session: {agent_data['id']}")
            db.commit()
            logger.info(f"[GENERATE] Direct seed completed, verifying again...")
            
            # Verify again
            verify_agent = db.query(Agent).filter(Agent.id == "report-generation").first()
            if not verify_agent:
                logger.error(f"[GENERATE] CRITICAL: Agent still not found after direct seed!")
                return GenerateResponse(
                    success=False,
                    iso_code=iso_code,
                    country_name="Unknown",
                    report=None,
                    agent_log=agent_log,
                    error="Failed to create report-generation agent. Database issue.",
                )
        
        logger.info(f"[GENERATE] Agent verified in main session: {verify_agent.name}")
        
        # Get country
        country = db.query(Country).filter(Country.iso_code == iso_code).first()
        logger.info(f"[GENERATE] Country query result: {country.name if country else 'Not found'}")
        if not country:
            return GenerateResponse(
                success=False,
                iso_code=iso_code,
                country_name="Unknown",
                report=None,
                agent_log=agent_log,
                error=f"Country '{iso_code}' not found",
            )
        
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
        
        log_step("System", "ready", f"Using AI: {ai_config.provider}/{ai_config.model_name}", "⚙️")
        
        # Handle force_regenerate: delete existing report to generate fresh
        if request.force_regenerate:
            deleted = db.query(CountryDeepDive).filter(
                CountryDeepDive.country_iso_code == iso_code,
                CountryDeepDive.topic == request.topic,
            ).delete()
            if deleted:
                db.commit()
                log_step("System", "regenerate", f"Deleted existing report for force regeneration", "🔄")
                logger.info(f"Force regenerate: deleted existing report for {iso_code}/{request.topic}")
        
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
        # Run the report-generation agent SYNCHRONOUSLY with timeout
        # Railway has ~60s timeout, so we use 50s to ensure response is sent
        log_step("AgentRunner", "running", "Executing report-generation agent with database context", "🤖")
        
        runner = AgentRunner(db, ai_config)
        
        # HYBRID MODEL STRATEGY: Try configured model first, fallback to fast model on timeout
        model_used = f"{ai_config.provider}/{ai_config.model_name}"
        used_fallback = False
        FALLBACK_MODEL = "gpt-4o-mini"
        
        try:
            # First attempt with user's configured model (may be GPT-5/o1/o3)
            log_step("AgentRunner", "running", f"Trying primary model: {ai_config.model_name}", "🤖")
            
            result = await asyncio.wait_for(
                runner.run(
                    agent_id="report-generation",
                    variables={
                        "ISO_CODE": iso_code,
                        "TOPIC": request.topic,
                        # DATABASE_CONTEXT and COUNTRY_NAME are auto-injected by AgentRunner
                    },
                    update_stats=True,
                    enable_web_search=request.enable_web_search,
                ),
                timeout=45.0  # 45 seconds for primary model (leave room for fallback)
            )
        except asyncio.TimeoutError:
            # Primary model timed out - retry with fast fallback model
            log_step("AgentRunner", "retry", f"{ai_config.model_name} timed out, retrying with {FALLBACK_MODEL}", "⚡")
            logger.info(f"[GENERATE] Primary model {ai_config.model_name} timed out, trying fallback {FALLBACK_MODEL}")
            
            try:
                # Create a modified config with fast model
                from copy import copy
                fast_config = copy(ai_config)
                fast_config.model_name = FALLBACK_MODEL
                
                fast_runner = AgentRunner(db, fast_config)
                
                result = await asyncio.wait_for(
                    fast_runner.run(
                        agent_id="report-generation",
                        variables={
                            "ISO_CODE": iso_code,
                            "TOPIC": request.topic,
                        },
                        update_stats=True,
                        enable_web_search=False,  # Skip web search for faster fallback
                    ),
                    timeout=45.0  # 45 seconds for fallback
                )
                
                model_used = f"openai/{FALLBACK_MODEL} (fallback)"
                used_fallback = True
                log_step("AgentRunner", "completed", f"Fallback model {FALLBACK_MODEL} succeeded", "✅")
                
            except asyncio.TimeoutError:
                # Even fallback timed out - give up
                dive.status = DeepDiveStatus.FAILED
                dive.error_message = "Both primary and fallback models timed out"
                dive.generated_at = datetime.utcnow()
                db.commit()
                
                log_step("AgentRunner", "timeout", "Both models timed out", "⏱️")
                
                return GenerateResponse(
                    success=False,
                    iso_code=iso_code,
                    country_name=country.name,
                    report=None,
                    agent_log=agent_log,
                    error="Generation timed out. Both primary and fallback models took too long. Please try again.",
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
        logger.info(f"[GENERATE] AgentRunner output type: {type(output)}")
        logger.info(f"[GENERATE] AgentRunner output length: {len(output) if output else 0}")
        logger.info(f"[GENERATE] AgentRunner output sample: {str(output)[:500] if output else 'None'}...")
        
        # VALIDATE: Check for contaminated agent data in output
        is_valid, validation_error = _validate_llm_output(output)
        if not is_valid:
            dive.status = DeepDiveStatus.FAILED
            dive.error_message = f"Output validation failed: {validation_error}"
            dive.generated_at = datetime.utcnow()
            db.commit()
            
            log_step("Validator", "failed", f"Output contaminated: {validation_error}", "🚫")
            
            return GenerateResponse(
                success=False,
                iso_code=iso_code,
                country_name=country.name,
                report=None,
                agent_log=agent_log,
                error=f"LLM output validation failed: {validation_error}",
            )
        
        logger.info(f"[GENERATE] LLM output validation passed")
        
        report_data = _parse_agent_output(output)
        logger.info(f"[GENERATE] Parsed report_data type: {type(report_data)}")
        logger.info(f"[GENERATE] Parsed report_data keys: {list(report_data.keys()) if report_data else 'None'}")
        
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
        
        log_step("Parser", "completed", "JSON parsed successfully, storing premium report", "📋")
        
        # Update deep dive with parsed data (PREMIUM schema - all fields)
        dive.status = DeepDiveStatus.COMPLETED
        
        # Executive Section
        dive.strategy_name = report_data.get("strategy_name")
        dive.executive_summary = report_data.get("executive_summary")
        dive.strategic_narrative = report_data.get("strategic_narrative")
        
        # Context Sections
        dive.health_profile = report_data.get("health_profile")
        dive.workforce_insights = report_data.get("workforce_insights")
        
        # Key Findings
        dive.key_findings = report_data.get("key_findings", [])
        
        # SWOT Analysis
        dive.strengths = report_data.get("strengths", [])
        dive.weaknesses = report_data.get("weaknesses", [])
        dive.opportunities = report_data.get("opportunities", [])
        dive.threats = report_data.get("threats", [])
        
        # Recommendations and Actions
        dive.strategic_recommendations = report_data.get("strategic_recommendations") or report_data.get("recommendations", [])
        dive.priority_interventions = report_data.get("priority_interventions", [])
        dive.action_items = report_data.get("action_items", [])
        
        # Benchmarking
        dive.peer_comparison = report_data.get("peer_comparison")
        dive.global_ranking_context = report_data.get("global_ranking_context")
        dive.benchmark_countries = report_data.get("benchmark_countries", [])
        
        # Metadata
        dive.ai_provider = model_used  # Track which model was used (may include "fallback")
        dive.generated_at = datetime.utcnow()
        dive.error_message = None
        
        db.commit()
        db.refresh(dive)
        
        log_step("System", "completed", f"Report generated successfully for {country.name}", "🎉")
        logger.info(f"Report generation completed for {iso_code} - {request.topic}")
        
        # Build and return the McKinsey-grade report response with all fields
        # Note: New fields (situation_analysis, deep_dive_analysis, etc.) come directly from report_data
        # since they're not yet in the database schema
        report = ReportResponse(
            # Core identification
            iso_code=iso_code,
            country_name=country.name,
            topic=dive.topic,
            status=dive.status.value,
            
            # Executive Section
            strategy_name=dive.strategy_name,
            executive_summary=dive.executive_summary,
            strategic_narrative=dive.strategic_narrative,
            
            # Deep Analysis Sections (from report_data, not stored in DB yet)
            situation_analysis=report_data.get("situation_analysis"),
            deep_dive_analysis=report_data.get("deep_dive_analysis"),
            
            # Context Sections
            health_profile=dive.health_profile,
            workforce_insights=dive.workforce_insights,
            
            # Key Findings (preserve full objects)
            key_findings=dive.key_findings or [],
            
            # SWOT Analysis (preserve full objects)
            strengths=dive.strengths or [],
            weaknesses=dive.weaknesses or [],
            opportunities=dive.opportunities or [],
            threats=dive.threats or [],
            
            # Recommendations and Actions
            strategic_recommendations=dive.strategic_recommendations or [],
            priority_interventions=dive.priority_interventions or [],
            action_items=dive.action_items or [],
            
            # Implementation & Risk (from report_data, not stored in DB yet)
            implementation_roadmap=report_data.get("implementation_roadmap"),
            stakeholder_analysis=report_data.get("stakeholder_analysis"),
            risk_assessment=report_data.get("risk_assessment"),
            resource_requirements=report_data.get("resource_requirements"),
            success_metrics=report_data.get("success_metrics"),
            
            # Benchmarking
            peer_comparison=dive.peer_comparison,
            global_ranking_context=dive.global_ranking_context,
            benchmark_countries=dive.benchmark_countries or [],
            
            # Metadata
            generated_at=dive.generated_at.isoformat() if dive.generated_at else None,
            error_message=None,
            model_used=model_used,
        )
        
        # Validate report before returning - check for unexpected data
        logger.info(f"[GENERATE] Building final response with report")
        logger.info(f"[GENERATE] Report iso_code: {report.iso_code}, status: {report.status}")
        logger.info(f"[GENERATE] Report executive_summary length: {len(report.executive_summary) if report.executive_summary else 0}")
        logger.info(f"[GENERATE] Report key_findings count: {len(report.key_findings)}")
        
        # Check for suspicious agent-like data in the report
        report_dict = report.dict() if hasattr(report, 'dict') else {}
        suspicious_keys = [k for k in report_dict.keys() if 'system_prompt' in str(k).lower() or '__' in str(k)]
        if suspicious_keys:
            logger.error(f"[GENERATE] ALERT: Report contains suspicious keys: {suspicious_keys}")
        
        final_response = GenerateResponse(
            success=True,
            iso_code=iso_code,
            country_name=country.name,
            report=report,
            agent_log=agent_log,
            error=None,
        )
        
        logger.info(f"[GENERATE] Returning successful GenerateResponse")
        return final_response
        
    except Exception as e:
        logger.error(f"Error generating report for {iso_code}: {e}", exc_info=True)
        
        # Try to update dive status if it was created
        try:
            if 'dive' in locals() and dive:
                dive.status = DeepDiveStatus.FAILED
                dive.error_message = str(e)
                dive.generated_at = datetime.utcnow()
                db.commit()
        except Exception:
            db.rollback()
        
        log_step("System", "failed", f"Exception: {str(e)}", "💥")
        
        # Return error response with safe country name
        country_name = country.name if country else "Unknown"
        
        return GenerateResponse(
            success=False,
            iso_code=iso_code,
            country_name=country_name,
            report=None,
            agent_log=agent_log,
            error=f"Server error: {str(e)}",
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
