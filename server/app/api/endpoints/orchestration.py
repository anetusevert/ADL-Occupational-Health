"""
GOHIP Platform - AI Orchestration Layer API
============================================

Endpoints for managing AI agents, workflows, and prompts.
"""

from typing import List, Optional
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User
from app.models.agent import Agent, AgentCategory, AgentWorkflow, DEFAULT_AGENTS

router = APIRouter(prefix="/orchestration", tags=["AI Orchestration"])
logger = logging.getLogger(__name__)


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class AgentResponse(BaseModel):
    """Agent details response."""
    id: str
    name: str
    description: Optional[str]
    category: str
    workflow: str
    system_prompt: Optional[str]
    user_prompt_template: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    order_in_workflow: Optional[int]
    is_active: bool
    template_variables: List[str]
    created_at: Optional[str]
    updated_at: Optional[str]


class AgentListResponse(BaseModel):
    """List of agents grouped by workflow."""
    agents: List[AgentResponse]
    workflows: List[dict]


class AgentUpdateRequest(BaseModel):
    """Request to update an agent's prompts."""
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None
    is_active: Optional[bool] = None
    icon: Optional[str] = None
    color: Optional[str] = None


class AgentTestRequest(BaseModel):
    """Request to test an agent."""
    test_variables: dict = Field(default_factory=dict)


class AgentTestResponse(BaseModel):
    """Response from agent test."""
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    latency_ms: Optional[int] = None


class WorkflowResponse(BaseModel):
    """Workflow definition."""
    id: str
    name: str
    description: str
    agents: List[str]  # Agent IDs in order


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/agents", response_model=AgentListResponse)
async def get_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get all agents with their configurations.
    Seeds default agents if none exist.
    """
    # Check if agents exist, seed if not
    agent_count = db.query(Agent).count()
    if agent_count == 0:
        logger.info("Seeding default agents...")
        for agent_data in DEFAULT_AGENTS:
            agent = Agent(
                id=agent_data["id"],
                name=agent_data["name"],
                description=agent_data["description"],
                category=agent_data["category"],
                workflow=agent_data["workflow"],
                icon=agent_data["icon"],
                color=agent_data["color"],
                order_in_workflow=agent_data["order_in_workflow"],
                template_variables=agent_data["template_variables"],
                system_prompt=agent_data["system_prompt"],
                user_prompt_template=agent_data["user_prompt_template"],
                is_active=True,
            )
            db.add(agent)
        db.commit()
        logger.info(f"Seeded {len(DEFAULT_AGENTS)} default agents")
    
    # Get all agents
    agents = db.query(Agent).order_by(Agent.workflow, Agent.order_in_workflow).all()
    
    # Build workflow definitions
    workflows = [
        {
            "id": "report_generation",
            "name": "Report Generation",
            "description": "Strategic deep dive report generation workflow",
            "color": "amber",
        },
        {
            "id": "country_assessment",
            "name": "Country Assessment",
            "description": "Country health assessment workflow",
            "color": "emerald",
        },
        {
            "id": "metric_explanation",
            "name": "Metric Explanation",
            "description": "Metric explanation and Q&A workflow",
            "color": "pink",
        },
        {
            "id": "data_collection",
            "name": "Data Collection",
            "description": "Data gathering and research workflow",
            "color": "cyan",
        },
    ]
    
    return AgentListResponse(
        agents=[
            AgentResponse(
                id=a.id,
                name=a.name,
                description=a.description,
                category=a.category.value if a.category else "analysis",
                workflow=a.workflow.value if a.workflow else "report_generation",
                system_prompt=a.system_prompt,
                user_prompt_template=a.user_prompt_template,
                icon=a.icon,
                color=a.color,
                order_in_workflow=a.order_in_workflow,
                is_active=a.is_active,
                template_variables=a.template_variables or [],
                created_at=a.created_at.isoformat() if a.created_at else None,
                updated_at=a.updated_at.isoformat() if a.updated_at else None,
            )
            for a in agents
        ],
        workflows=workflows,
    )


@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get a single agent by ID."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        category=agent.category.value if agent.category else "analysis",
        workflow=agent.workflow.value if agent.workflow else "report_generation",
        system_prompt=agent.system_prompt,
        user_prompt_template=agent.user_prompt_template,
        icon=agent.icon,
        color=agent.color,
        order_in_workflow=agent.order_in_workflow,
        is_active=agent.is_active,
        template_variables=agent.template_variables or [],
        created_at=agent.created_at.isoformat() if agent.created_at else None,
        updated_at=agent.updated_at.isoformat() if agent.updated_at else None,
    )


@router.put("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    update: AgentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update an agent's configuration and prompts."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    # Update fields
    if update.name is not None:
        agent.name = update.name
    if update.description is not None:
        agent.description = update.description
    if update.system_prompt is not None:
        agent.system_prompt = update.system_prompt
    if update.user_prompt_template is not None:
        agent.user_prompt_template = update.user_prompt_template
    if update.is_active is not None:
        agent.is_active = update.is_active
    if update.icon is not None:
        agent.icon = update.icon
    if update.color is not None:
        agent.color = update.color
    
    agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent)
    
    logger.info(f"Updated agent {agent_id} by user {current_user.email}")
    
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        category=agent.category.value if agent.category else "analysis",
        workflow=agent.workflow.value if agent.workflow else "report_generation",
        system_prompt=agent.system_prompt,
        user_prompt_template=agent.user_prompt_template,
        icon=agent.icon,
        color=agent.color,
        order_in_workflow=agent.order_in_workflow,
        is_active=agent.is_active,
        template_variables=agent.template_variables or [],
        created_at=agent.created_at.isoformat() if agent.created_at else None,
        updated_at=agent.updated_at.isoformat() if agent.updated_at else None,
    )


@router.post("/agents/{agent_id}/test", response_model=AgentTestResponse)
async def test_agent(
    agent_id: str,
    request: AgentTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Test an agent with sample data.
    
    Fills in template variables and runs the agent prompt.
    """
    import time
    from app.models.user import AIConfig
    from app.services.ai_orchestrator import get_llm_from_config
    from langchain_core.messages import SystemMessage, HumanMessage
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    # Get AI config
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not config:
        return AgentTestResponse(
            success=False,
            error="No AI configuration found. Please configure AI settings first."
        )
    
    start_time = time.time()
    
    try:
        # Get LLM
        llm = get_llm_from_config(config)
        
        # Prepare prompts with test variables
        system_prompt = agent.system_prompt or ""
        user_prompt = agent.user_prompt_template or ""
        
        # Replace template variables with test values or defaults
        test_vars = {
            "COUNTRY_NAME": "Germany",
            "ISO_CODE": "DEU",
            "TOPIC": "Occupational Health Policy",
            "METRICS_DATA": "[Sample metrics data]",
            "INTELLIGENCE_DATA": "[Sample intelligence data]",
            "RESEARCH_DATA": "[Sample research data]",
            "COUNTRY_DATA": "[Sample country data]",
            "METRIC_NAME": "Fatal Accident Rate",
            "METRIC_VALUE": "2.1 per 100,000",
            "GLOBAL_AVERAGE": "3.5 per 100,000",
            "PERCENTILE": "75th",
            **(request.test_variables or {}),
        }
        
        for key, value in test_vars.items():
            system_prompt = system_prompt.replace(f"{{{{{key}}}}}", str(value))
            user_prompt = user_prompt.replace(f"{{{{{key}}}}}", str(value))
        
        # Truncate for testing to keep response brief
        user_prompt = user_prompt[:500] + "\n\n[Note: This is a test. Provide a brief 2-3 sentence response to verify the agent is working.]"
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]
        
        response = llm.invoke(messages)
        latency = int((time.time() - start_time) * 1000)
        
        content = response.content if hasattr(response, 'content') else str(response)
        
        return AgentTestResponse(
            success=True,
            response=content[:500],  # Truncate for UI display
            latency_ms=latency,
        )
        
    except Exception as e:
        latency = int((time.time() - start_time) * 1000)
        logger.error(f"Agent test failed for {agent_id}: {str(e)}")
        return AgentTestResponse(
            success=False,
            error=str(e),
            latency_ms=latency,
        )


@router.get("/workflows")
async def get_workflows(
    current_user: User = Depends(get_current_admin_user),
):
    """Get workflow definitions with their agent mappings."""
    return {
        "workflows": [
            {
                "id": "report_generation",
                "name": "Report Generation",
                "description": "Strategic deep dive report generation using multiple agents",
                "color": "amber",
                "agents": ["data-agent", "research-agent", "intelligence-agent", "strategic-deep-dive"],
            },
            {
                "id": "country_assessment",
                "name": "Country Assessment",
                "description": "Comprehensive country health assessment",
                "color": "emerald",
                "agents": ["data-agent", "country-analysis"],
            },
            {
                "id": "metric_explanation",
                "name": "Metric Explanation",
                "description": "Explain individual metrics to users",
                "color": "pink",
                "agents": ["metric-explainer"],
            },
        ]
    }


@router.post("/seed")
async def seed_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Re-seed default agents (resets all prompts to defaults)."""
    # Delete existing agents
    db.query(Agent).delete()
    
    # Seed fresh agents
    for agent_data in DEFAULT_AGENTS:
        agent = Agent(
            id=agent_data["id"],
            name=agent_data["name"],
            description=agent_data["description"],
            category=agent_data["category"],
            workflow=agent_data["workflow"],
            icon=agent_data["icon"],
            color=agent_data["color"],
            order_in_workflow=agent_data["order_in_workflow"],
            template_variables=agent_data["template_variables"],
            system_prompt=agent_data["system_prompt"],
            user_prompt_template=agent_data["user_prompt_template"],
            is_active=True,
        )
        db.add(agent)
    
    db.commit()
    logger.info(f"Re-seeded {len(DEFAULT_AGENTS)} agents by user {current_user.email}")
    
    return {"success": True, "message": f"Seeded {len(DEFAULT_AGENTS)} agents"}
