"""
AI Orchestration API - Simple Agent Management
===============================================

Simple API for managing standalone AI agents.
- List all agents
- Get agent details (prompts)
- Update agent prompts
- Test agent with sample input
"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User, AIConfig
from app.models.agent import Agent, DEFAULT_AGENTS
from app.services.agent_runner import AgentRunner

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orchestration", tags=["AI Orchestration"])


# =============================================================================
# SCHEMAS
# =============================================================================

class AgentResponse(BaseModel):
    """Agent details response."""
    id: str
    name: str
    description: Optional[str]
    system_prompt: Optional[str]
    user_prompt_template: Optional[str]
    template_variables: List[str]
    icon: str
    color: str
    is_active: bool
    execution_count: int
    last_run_at: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]


class AgentListResponse(BaseModel):
    """List of agents."""
    agents: List[AgentResponse]
    total: int


class AgentUpdateRequest(BaseModel):
    """Request to update agent prompts."""
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None
    is_active: Optional[bool] = None


class AgentTestRequest(BaseModel):
    """Request to test an agent."""
    variables: dict  # e.g., {"ISO_CODE": "DEU", "TOPIC": "Governance"}
    enable_web_search: bool = False  # Whether to perform web search


class AgentTestResponse(BaseModel):
    """Response from agent test."""
    success: bool
    output: Optional[str]
    error: Optional[str]
    execution_time_ms: Optional[int]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def agent_to_response(agent: Agent) -> AgentResponse:
    """Convert Agent model to response."""
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=getattr(agent, 'description', None),
        system_prompt=getattr(agent, 'system_prompt', None),
        user_prompt_template=getattr(agent, 'user_prompt_template', None),
        template_variables=getattr(agent, 'template_variables', None) or [],
        icon=getattr(agent, 'icon', 'bot') or "bot",
        color=getattr(agent, 'color', 'cyan') or "cyan",
        is_active=getattr(agent, 'is_active', True) if getattr(agent, 'is_active', None) is not None else True,
        execution_count=getattr(agent, 'execution_count', 0) or 0,
        last_run_at=agent.last_run_at.isoformat() if getattr(agent, 'last_run_at', None) else None,
        created_at=agent.created_at.isoformat() if getattr(agent, 'created_at', None) else None,
        updated_at=agent.updated_at.isoformat() if getattr(agent, 'updated_at', None) else None,
    )


def seed_agents(db: Session):
    """Seed default agents if they don't exist."""
    try:
        existing_count = db.query(Agent).count()
        if existing_count > 0:
            return  # Already have agents
        
        logger.info("Seeding default agents...")
        for agent_data in DEFAULT_AGENTS:
            agent = Agent(
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
            db.add(agent)
        db.commit()
        logger.info(f"Seeded {len(DEFAULT_AGENTS)} default agents")
    except Exception as e:
        logger.warning(f"Could not seed agents: {e}")
        db.rollback()


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/agents", response_model=AgentListResponse)
async def list_agents(
    db: Session = Depends(get_db),
):
    """
    List all agents.
    
    Public endpoint - no authentication required.
    """
    try:
        # Try to seed defaults if needed
        try:
            seed_agents(db)
        except Exception as seed_error:
            logger.warning(f"Could not seed agents: {seed_error}")
            db.rollback()
        
        # Query agents with fallback
        try:
            agents = db.query(Agent).order_by(Agent.name).all()
        except Exception as query_error:
            logger.warning(f"Query failed, trying without order: {query_error}")
            db.rollback()
            try:
                agents = db.query(Agent).all()
            except Exception as e2:
                logger.warning(f"Agent query failed completely: {e2}")
                db.rollback()
                return AgentListResponse(agents=[], total=0)
        
        # Convert to response with error handling per agent
        response_agents = []
        for a in agents:
            try:
                response_agents.append(agent_to_response(a))
            except Exception as conv_error:
                logger.warning(f"Could not convert agent {a.id}: {conv_error}")
        
        return AgentListResponse(
            agents=response_agents,
            total=len(response_agents),
        )
    except Exception as e:
        logger.error(f"Failed to list agents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
):
    """
    Get agent details including prompts.
    
    Public endpoint - no authentication required.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    return agent_to_response(agent)


@router.patch("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    update: AgentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Update agent prompts.
    
    Admin only - requires authentication.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    
    # Update fields if provided
    if update.system_prompt is not None:
        agent.system_prompt = update.system_prompt
    if update.user_prompt_template is not None:
        agent.user_prompt_template = update.user_prompt_template
    if update.is_active is not None:
        agent.is_active = update.is_active
    
    agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent)
    
    logger.info(f"Agent '{agent_id}' updated by user {current_user.id}")
    
    return agent_to_response(agent)


@router.post("/agents/{agent_id}/test", response_model=AgentTestResponse)
async def test_agent(
    agent_id: str,
    request: AgentTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Test an agent with sample variables.
    
    Admin only - requires authentication.
    """
    import time
    start_time = time.time()
    
    # Get AI config
    ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not ai_config:
        return AgentTestResponse(
            success=False,
            output=None,
            error="No AI configuration found. Please configure AI settings first.",
            execution_time_ms=0,
        )
    
    # Run the agent with auto database context injection
    runner = AgentRunner(db, ai_config)
    result = await runner.run(
        agent_id, 
        request.variables, 
        update_stats=True,
        enable_web_search=request.enable_web_search
    )
    
    execution_time_ms = int((time.time() - start_time) * 1000)
    
    return AgentTestResponse(
        success=result["success"],
        output=result["output"],
        error=result["error"],
        execution_time_ms=execution_time_ms,
    )


@router.post("/seed")
async def seed_default_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Force re-seed default agents (resets all agents to defaults).
    
    Admin only - requires authentication.
    WARNING: This will delete all existing agents and recreate from defaults.
    """
    try:
        # Delete existing agents
        db.query(Agent).delete()
        db.commit()
        
        # Seed fresh
        for agent_data in DEFAULT_AGENTS:
            agent = Agent(
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
            db.add(agent)
        db.commit()
        
        return {
            "success": True,
            "message": f"Seeded {len(DEFAULT_AGENTS)} agents",
            "agents": [a["id"] for a in DEFAULT_AGENTS],
        }
    except Exception as e:
        logger.error(f"Failed to seed agents: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/init")
async def initialize_agents(
    db: Session = Depends(get_db),
):
    """
    Initialize agents if none exist.
    
    Public endpoint - used by frontend to ensure agents exist.
    """
    try:
        existing_count = db.query(Agent).count()
        
        if existing_count > 0:
            return {
                "success": True,
                "message": f"Already have {existing_count} agents",
                "seeded": False,
            }
        
        # Seed agents
        seed_agents(db)
        
        return {
            "success": True,
            "message": f"Seeded {len(DEFAULT_AGENTS)} agents",
            "seeded": True,
        }
    except Exception as e:
        logger.error(f"Failed to initialize agents: {e}")
        raise HTTPException(status_code=500, detail=str(e))
