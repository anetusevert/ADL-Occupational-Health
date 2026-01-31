"""
GOHIP Platform - AI Orchestration Layer API
============================================

Endpoints for managing AI agents, workflows, and prompts.
Full CRUD operations for the visual workflow builder.
"""

from typing import List, Optional
from datetime import datetime
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User, AIConfig, AIProvider, SUPPORTED_MODELS
from app.models.agent import Agent, Workflow, AgentCategory, DEFAULT_AGENTS, DEFAULT_WORKFLOWS

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
    workflow_id: Optional[str]
    system_prompt: Optional[str]
    user_prompt_template: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    order_in_workflow: Optional[int]
    position_x: Optional[float]
    position_y: Optional[float]
    llm_provider: Optional[str]
    llm_model_name: Optional[str]
    is_active: bool
    template_variables: List[str]
    created_at: Optional[str]
    updated_at: Optional[str]


class WorkflowResponse(BaseModel):
    """Workflow details response."""
    id: str
    name: str
    description: Optional[str]
    color: Optional[str]
    is_default: bool
    created_at: Optional[str]
    updated_at: Optional[str]


class AgentListResponse(BaseModel):
    """List of agents and workflows."""
    agents: List[AgentResponse]
    workflows: List[WorkflowResponse]


class CreateAgentRequest(BaseModel):
    """Request to create a new agent."""
    name: str
    description: Optional[str] = None
    category: str = "analysis"
    workflow_id: Optional[str] = None
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None
    icon: str = "bot"
    color: str = "cyan"
    position_x: float = 100
    position_y: float = 100
    llm_provider: Optional[str] = None
    llm_model_name: Optional[str] = None
    template_variables: List[str] = Field(default_factory=list)


class UpdateAgentRequest(BaseModel):
    """Request to update an agent."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    workflow_id: Optional[str] = None
    system_prompt: Optional[str] = None
    user_prompt_template: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order_in_workflow: Optional[int] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    llm_provider: Optional[str] = None
    llm_model_name: Optional[str] = None
    is_active: Optional[bool] = None
    template_variables: Optional[List[str]] = None


class UpdatePositionRequest(BaseModel):
    """Request to update agent position."""
    position_x: float
    position_y: float


class CreateWorkflowRequest(BaseModel):
    """Request to create a new workflow."""
    name: str
    description: Optional[str] = None
    color: str = "cyan"


class UpdateWorkflowRequest(BaseModel):
    """Request to update a workflow."""
    name: Optional[str] = None
    description: Optional[str] = None
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


class ProviderInfo(BaseModel):
    """LLM Provider information."""
    id: str
    name: str
    models: List[str]
    is_configured: bool
    is_global_default: bool


class ProvidersResponse(BaseModel):
    """List of available providers."""
    providers: List[ProviderInfo]
    global_provider: Optional[str]
    global_model: Optional[str]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def agent_to_response(agent: Agent) -> AgentResponse:
    """Convert Agent model to response."""
    return AgentResponse(
        id=agent.id,
        name=agent.name,
        description=agent.description,
        category=agent.category.value if agent.category else "analysis",
        workflow_id=agent.workflow_id,
        system_prompt=agent.system_prompt,
        user_prompt_template=agent.user_prompt_template,
        icon=agent.icon,
        color=agent.color,
        order_in_workflow=agent.order_in_workflow,
        position_x=agent.position_x,
        position_y=agent.position_y,
        llm_provider=agent.llm_provider,
        llm_model_name=agent.llm_model_name,
        is_active=agent.is_active,
        template_variables=agent.template_variables or [],
        created_at=agent.created_at.isoformat() if agent.created_at else None,
        updated_at=agent.updated_at.isoformat() if agent.updated_at else None,
    )


def workflow_to_response(workflow: Workflow) -> WorkflowResponse:
    """Convert Workflow model to response."""
    return WorkflowResponse(
        id=workflow.id,
        name=workflow.name,
        description=workflow.description,
        color=workflow.color,
        is_default=workflow.is_default,
        created_at=workflow.created_at.isoformat() if workflow.created_at else None,
        updated_at=workflow.updated_at.isoformat() if workflow.updated_at else None,
    )


def seed_defaults(db: Session):
    """Seed default workflows and agents if they don't exist."""
    # Seed workflows first
    workflow_count = db.query(Workflow).count()
    if workflow_count == 0:
        logger.info("Seeding default workflows...")
        for wf_data in DEFAULT_WORKFLOWS:
            workflow = Workflow(
                id=wf_data["id"],
                name=wf_data["name"],
                description=wf_data["description"],
                color=wf_data["color"],
                is_default=wf_data["is_default"],
            )
            db.add(workflow)
        db.commit()
        logger.info(f"Seeded {len(DEFAULT_WORKFLOWS)} default workflows")
    
    # Seed agents
    agent_count = db.query(Agent).count()
    if agent_count == 0:
        logger.info("Seeding default agents...")
        for agent_data in DEFAULT_AGENTS:
            category = agent_data.get("category", AgentCategory.analysis)
            if isinstance(category, str):
                category = AgentCategory(category)
            
            agent = Agent(
                id=agent_data["id"],
                name=agent_data["name"],
                description=agent_data["description"],
                category=category,
                workflow_id=agent_data.get("workflow_id"),
                icon=agent_data["icon"],
                color=agent_data["color"],
                order_in_workflow=agent_data["order_in_workflow"],
                position_x=agent_data.get("position_x", 100),
                position_y=agent_data.get("position_y", 100),
                template_variables=agent_data["template_variables"],
                system_prompt=agent_data["system_prompt"],
                user_prompt_template=agent_data["user_prompt_template"],
                is_active=True,
            )
            db.add(agent)
        db.commit()
        logger.info(f"Seeded {len(DEFAULT_AGENTS)} default agents")


# =============================================================================
# AGENT ENDPOINTS
# =============================================================================

@router.get("/agents", response_model=AgentListResponse)
async def get_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get all agents and workflows."""
    # Seed defaults if needed
    seed_defaults(db)
    
    agents = db.query(Agent).order_by(Agent.workflow_id, Agent.order_in_workflow).all()
    workflows = db.query(Workflow).order_by(Workflow.name).all()
    
    return AgentListResponse(
        agents=[agent_to_response(a) for a in agents],
        workflows=[workflow_to_response(w) for w in workflows],
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
    
    return agent_to_response(agent)


@router.post("/agents", response_model=AgentResponse)
async def create_agent(
    request: CreateAgentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Create a new agent."""
    # Generate unique ID from name
    agent_id = request.name.lower().replace(" ", "-").replace("_", "-")
    agent_id = "".join(c for c in agent_id if c.isalnum() or c == "-")
    
    # Check for duplicate ID
    existing = db.query(Agent).filter(Agent.id == agent_id).first()
    if existing:
        agent_id = f"{agent_id}-{uuid.uuid4().hex[:6]}"
    
    # Validate category
    try:
        category = AgentCategory(request.category)
    except ValueError:
        category = AgentCategory.analysis
    
    agent = Agent(
        id=agent_id,
        name=request.name,
        description=request.description,
        category=category,
        workflow_id=request.workflow_id,
        system_prompt=request.system_prompt,
        user_prompt_template=request.user_prompt_template,
        icon=request.icon,
        color=request.color,
        position_x=request.position_x,
        position_y=request.position_y,
        llm_provider=request.llm_provider,
        llm_model_name=request.llm_model_name,
        template_variables=request.template_variables,
        is_active=True,
    )
    
    db.add(agent)
    db.commit()
    db.refresh(agent)
    
    logger.info(f"Created agent {agent_id} by user {current_user.email}")
    
    return agent_to_response(agent)


@router.put("/agents/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    request: UpdateAgentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update an agent's configuration."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    # Update fields
    if request.name is not None:
        agent.name = request.name
    if request.description is not None:
        agent.description = request.description
    if request.category is not None:
        try:
            agent.category = AgentCategory(request.category)
        except ValueError:
            pass
    if request.workflow_id is not None:
        agent.workflow_id = request.workflow_id
    if request.system_prompt is not None:
        agent.system_prompt = request.system_prompt
    if request.user_prompt_template is not None:
        agent.user_prompt_template = request.user_prompt_template
    if request.icon is not None:
        agent.icon = request.icon
    if request.color is not None:
        agent.color = request.color
    if request.order_in_workflow is not None:
        agent.order_in_workflow = request.order_in_workflow
    if request.position_x is not None:
        agent.position_x = request.position_x
    if request.position_y is not None:
        agent.position_y = request.position_y
    if request.llm_provider is not None:
        agent.llm_provider = request.llm_provider if request.llm_provider else None
    if request.llm_model_name is not None:
        agent.llm_model_name = request.llm_model_name if request.llm_model_name else None
    if request.is_active is not None:
        agent.is_active = request.is_active
    if request.template_variables is not None:
        agent.template_variables = request.template_variables
    
    agent.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(agent)
    
    logger.info(f"Updated agent {agent_id} by user {current_user.email}")
    
    return agent_to_response(agent)


@router.patch("/agents/{agent_id}/position", response_model=AgentResponse)
async def update_agent_position(
    agent_id: str,
    request: UpdatePositionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update an agent's canvas position."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    agent.position_x = request.position_x
    agent.position_y = request.position_y
    agent.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(agent)
    
    return agent_to_response(agent)


@router.delete("/agents/{agent_id}")
async def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete an agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    db.delete(agent)
    db.commit()
    
    logger.info(f"Deleted agent {agent_id} by user {current_user.email}")
    
    return {"success": True, "message": f"Agent {agent_id} deleted"}


@router.post("/agents/{agent_id}/test", response_model=AgentTestResponse)
async def test_agent(
    agent_id: str,
    request: AgentTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Test an agent with sample data."""
    import time
    from app.services.ai_orchestrator import get_llm_from_config
    from langchain_core.messages import SystemMessage, HumanMessage
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    # Get AI config (use agent override if set, otherwise global)
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not config:
        return AgentTestResponse(
            success=False,
            error="No AI configuration found. Please configure AI settings first."
        )
    
    start_time = time.time()
    
    try:
        # Get LLM (use agent override if specified)
        if agent.llm_provider and agent.llm_model_name:
            # Create a temporary config-like object for the override
            llm = get_llm_from_config(config, 
                                       override_provider=agent.llm_provider,
                                       override_model=agent.llm_model_name)
        else:
            llm = get_llm_from_config(config)
        
        # Prepare prompts with test variables
        system_prompt = agent.system_prompt or ""
        user_prompt = agent.user_prompt_template or ""
        
        # Default test variables
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
        
        # Truncate for testing
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
            response=content[:500],
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


# =============================================================================
# WORKFLOW ENDPOINTS
# =============================================================================

@router.get("/workflows", response_model=List[WorkflowResponse])
async def get_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get all workflows."""
    seed_defaults(db)
    workflows = db.query(Workflow).order_by(Workflow.name).all()
    return [workflow_to_response(w) for w in workflows]


@router.post("/workflows", response_model=WorkflowResponse)
async def create_workflow(
    request: CreateWorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Create a new workflow."""
    # Generate ID from name
    workflow_id = request.name.lower().replace(" ", "-").replace("_", "-")
    workflow_id = "".join(c for c in workflow_id if c.isalnum() or c == "-")
    
    # Check for duplicate
    existing = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if existing:
        workflow_id = f"{workflow_id}-{uuid.uuid4().hex[:6]}"
    
    workflow = Workflow(
        id=workflow_id,
        name=request.name,
        description=request.description,
        color=request.color,
        is_default=False,  # User-created workflows are not default
    )
    
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    
    logger.info(f"Created workflow {workflow_id} by user {current_user.email}")
    
    return workflow_to_response(workflow)


@router.put("/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    request: UpdateWorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Update a workflow."""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    if request.name is not None:
        workflow.name = request.name
    if request.description is not None:
        workflow.description = request.description
    if request.color is not None:
        workflow.color = request.color
    
    workflow.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(workflow)
    
    logger.info(f"Updated workflow {workflow_id} by user {current_user.email}")
    
    return workflow_to_response(workflow)


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete a workflow (only if not a default workflow)."""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    if workflow.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete a default system workflow")
    
    # Check if any agents use this workflow
    agent_count = db.query(Agent).filter(Agent.workflow_id == workflow_id).count()
    if agent_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete workflow with {agent_count} assigned agents. Move or delete agents first."
        )
    
    db.delete(workflow)
    db.commit()
    
    logger.info(f"Deleted workflow {workflow_id} by user {current_user.email}")
    
    return {"success": True, "message": f"Workflow {workflow_id} deleted"}


# =============================================================================
# PROVIDER ENDPOINTS
# =============================================================================

@router.get("/providers", response_model=ProvidersResponse)
async def get_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get available LLM providers for agent configuration."""
    # Get active global config
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    
    global_provider = config.provider.value if config else None
    global_model = config.model_name if config else None
    
    providers = []
    for provider in AIProvider:
        models = SUPPORTED_MODELS.get(provider, {})
        model_names = list(models.keys()) if models else []
        
        providers.append(ProviderInfo(
            id=provider.value,
            name=provider.value.replace("_", " ").title(),
            models=model_names,
            is_configured=config is not None and config.provider == provider,
            is_global_default=config is not None and config.provider == provider,
        ))
    
    return ProvidersResponse(
        providers=providers,
        global_provider=global_provider,
        global_model=global_model,
    )


# =============================================================================
# SEED ENDPOINT
# =============================================================================

@router.post("/seed")
async def seed_agents_and_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Re-seed default agents and workflows (resets all to defaults)."""
    # Delete existing
    db.query(Agent).delete()
    db.query(Workflow).delete()
    db.commit()
    
    # Seed fresh
    seed_defaults(db)
    
    return {"success": True, "message": f"Seeded {len(DEFAULT_WORKFLOWS)} workflows and {len(DEFAULT_AGENTS)} agents"}
