"""
GOHIP Platform - AI Orchestration Layer API
============================================

Endpoints for managing AI agents, workflows, connections, and prompts.
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
from app.models.agent import (
    Agent, Workflow, AgentConnection, AgentCategory,
    DEFAULT_AGENTS, DEFAULT_WORKFLOWS, DEFAULT_CONNECTIONS
)

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
    lane_order: Optional[int]
    is_default: bool
    is_active: bool
    execution_count: int
    success_count: int
    last_run_at: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]


class ConnectionResponse(BaseModel):
    """Connection between agents."""
    id: str
    source: str
    target: str
    workflow_id: Optional[str]
    type: Optional[str]


class AgentListResponse(BaseModel):
    """List of agents, workflows, and connections."""
    agents: List[AgentResponse]
    workflows: List[WorkflowResponse]
    connections: List[ConnectionResponse]


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


class CreateConnectionRequest(BaseModel):
    """Request to create a connection."""
    source: str
    target: str
    workflow_id: Optional[str] = None
    type: str = "data"


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
        lane_order=workflow.lane_order,
        is_default=workflow.is_default,
        is_active=workflow.is_active if workflow.is_active is not None else True,
        execution_count=workflow.execution_count if workflow.execution_count is not None else 0,
        success_count=workflow.success_count if hasattr(workflow, 'success_count') and workflow.success_count is not None else 0,
        last_run_at=workflow.last_run_at.isoformat() if workflow.last_run_at else None,
        created_at=workflow.created_at.isoformat() if workflow.created_at else None,
        updated_at=workflow.updated_at.isoformat() if workflow.updated_at else None,
    )


def connection_to_response(conn: AgentConnection) -> ConnectionResponse:
    """Convert AgentConnection model to response."""
    return ConnectionResponse(
        id=conn.id,
        source=conn.source_agent_id,
        target=conn.target_agent_id,
        workflow_id=conn.workflow_id,
        type=conn.connection_type,
    )


def seed_defaults(db: Session):
    """Seed default workflows, agents, and connections if they don't exist."""
    # Seed workflows first
    try:
        workflow_count = db.query(Workflow).count()
    except Exception as e:
        logger.warning(f"Could not count workflows (table may not exist): {e}")
        db.rollback()
        return  # Exit early if tables don't exist
    
    if workflow_count == 0:
        logger.info("Seeding default workflows...")
        try:
            for wf_data in DEFAULT_WORKFLOWS:
                workflow = Workflow(
                    id=wf_data["id"],
                    name=wf_data["name"],
                    description=wf_data["description"],
                    color=wf_data["color"],
                    lane_order=wf_data.get("lane_order", 0),
                    is_default=wf_data["is_default"],
                )
                db.add(workflow)
            db.commit()
            logger.info(f"Seeded {len(DEFAULT_WORKFLOWS)} default workflows")
        except Exception as e:
            logger.warning(f"Could not seed workflows: {e}")
            db.rollback()
    
    # Seed agents
    try:
        agent_count = db.query(Agent).count()
    except Exception as e:
        logger.warning(f"Could not count agents (table may not exist): {e}")
        db.rollback()
        return
    
    if agent_count == 0:
        logger.info("Seeding default agents...")
        try:
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
        except Exception as e:
            logger.warning(f"Could not seed agents: {e}")
            db.rollback()
    
    # Seed connections (with error handling for missing table)
    try:
        connection_count = db.query(AgentConnection).count()
        if connection_count == 0:
            logger.info("Seeding default connections...")
            for conn_data in DEFAULT_CONNECTIONS:
                connection = AgentConnection(
                    id=conn_data["id"],
                    source_agent_id=conn_data["source"],
                    target_agent_id=conn_data["target"],
                    workflow_id=conn_data.get("workflow_id"),
                    connection_type=conn_data.get("type", "data"),
                )
                db.add(connection)
            db.commit()
            logger.info(f"Seeded {len(DEFAULT_CONNECTIONS)} default connections")
    except Exception as e:
        logger.warning(f"Could not seed connections (table may not exist yet): {e}")
        db.rollback()


# =============================================================================
# AGENT ENDPOINTS
# =============================================================================

@router.get("/agents", response_model=AgentListResponse)
async def get_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get all agents, workflows, and connections."""
    try:
        # Seed defaults if needed
        seed_defaults(db)
        
        # Query agents
        try:
            agents = db.query(Agent).order_by(Agent.workflow_id, Agent.order_in_workflow).all()
        except Exception as e:
            logger.warning(f"Could not order agents properly: {e}")
            agents = db.query(Agent).all()
        
        # Query workflows (with fallback if lane_order doesn't exist)
        try:
            workflows = db.query(Workflow).order_by(Workflow.lane_order).all()
        except Exception as e:
            logger.warning(f"Could not order workflows by lane_order: {e}")
            workflows = db.query(Workflow).all()
        
        # Get connections (with fallback if table doesn't exist)
        try:
            connections = db.query(AgentConnection).all()
        except Exception as e:
            logger.warning(f"Could not query connections: {e}")
            connections = []
        
        return AgentListResponse(
            agents=[agent_to_response(a) for a in agents],
            workflows=[workflow_to_response(w) for w in workflows],
            connections=[connection_to_response(c) for c in connections],
        )
    except Exception as e:
        logger.error(f"Failed to get agents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load agents: {str(e)}")


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
    
    # Delete related connections
    db.query(AgentConnection).filter(
        (AgentConnection.source_agent_id == agent_id) | 
        (AgentConnection.target_agent_id == agent_id)
    ).delete(synchronize_session=False)
    
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
            "CONTEXT": "[Sample context data]",
            "CURRENT_MONTH": "6",
            "CURRENT_YEAR": "2026",
            "OHI_SCORE": "72.5",
            "BUDGET": "100",
            "PILLAR_SCORES": "[Sample pillar scores]",
            "RECENT_DECISIONS": "[Sample decisions]",
            "STATISTICS": "[Sample statistics]",
            "HISTORY": "[Sample history]",
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
    workflows = db.query(Workflow).order_by(Workflow.lane_order).all()
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
    
    # Get max lane order
    max_order = db.query(Workflow).count()
    
    workflow = Workflow(
        id=workflow_id,
        name=request.name,
        description=request.description,
        color=request.color,
        lane_order=max_order,
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


@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowResponse)
async def record_workflow_execution(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Record a workflow execution.
    Increments execution_count and updates last_run_at timestamp.
    Called when 'Test Workflow' is clicked.
    """
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    # Update execution stats
    workflow.execution_count = (workflow.execution_count or 0) + 1
    workflow.last_run_at = datetime.utcnow()
    
    db.commit()
    db.refresh(workflow)
    
    logger.info(f"Recorded execution #{workflow.execution_count} for workflow {workflow_id}")
    
    return workflow_to_response(workflow)


@router.patch("/workflows/{workflow_id}/toggle-active", response_model=WorkflowResponse)
async def toggle_workflow_active(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Toggle a workflow's active status."""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")
    
    workflow.is_active = not (workflow.is_active if workflow.is_active is not None else True)
    
    db.commit()
    db.refresh(workflow)
    
    status = "activated" if workflow.is_active else "deactivated"
    logger.info(f"Workflow {workflow_id} {status} by user {current_user.email}")
    
    return workflow_to_response(workflow)


# =============================================================================
# CONNECTION ENDPOINTS
# =============================================================================

@router.get("/connections", response_model=List[ConnectionResponse])
async def get_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Get all connections."""
    try:
        connections = db.query(AgentConnection).all()
        return [connection_to_response(c) for c in connections]
    except Exception as e:
        logger.warning(f"Could not query connections: {e}")
        return []


@router.post("/connections", response_model=ConnectionResponse)
async def create_connection(
    request: CreateConnectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Create a new connection between agents."""
    # Verify source and target agents exist
    source = db.query(Agent).filter(Agent.id == request.source).first()
    target = db.query(Agent).filter(Agent.id == request.target).first()
    
    if not source:
        raise HTTPException(status_code=404, detail=f"Source agent {request.source} not found")
    if not target:
        raise HTTPException(status_code=404, detail=f"Target agent {request.target} not found")
    
    # Generate connection ID
    conn_id = f"{request.source}-{request.target}"
    
    # Check for existing connection
    existing = db.query(AgentConnection).filter(AgentConnection.id == conn_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    connection = AgentConnection(
        id=conn_id,
        source_agent_id=request.source,
        target_agent_id=request.target,
        workflow_id=request.workflow_id,
        connection_type=request.type,
    )
    
    db.add(connection)
    db.commit()
    db.refresh(connection)
    
    logger.info(f"Created connection {conn_id} by user {current_user.email}")
    
    return connection_to_response(connection)


@router.delete("/connections/{connection_id}")
async def delete_connection(
    connection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Delete a connection."""
    connection = db.query(AgentConnection).filter(AgentConnection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    db.delete(connection)
    db.commit()
    
    logger.info(f"Deleted connection {connection_id} by user {current_user.email}")
    
    return {"success": True, "message": f"Connection {connection_id} deleted"}


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
# WORKFLOW DASHBOARD ENDPOINT (Public)
# =============================================================================

class WorkflowDashboardItem(BaseModel):
    """Workflow dashboard item with usage stats."""
    id: str
    name: str
    description: Optional[str]
    color: str
    is_active: bool
    is_default: bool
    agent_count: int
    execution_count: int
    success_count: int
    success_rate: float
    last_run_at: Optional[str]


@router.get("/workflows/dashboard", response_model=List[WorkflowDashboardItem])
async def get_workflow_dashboard(
    db: Session = Depends(get_db),
):
    """
    Get all workflows with usage statistics.
    
    This is a public endpoint that returns workflow data for the dashboard.
    """
    try:
        # Try to seed defaults, but don't fail if tables don't exist
        try:
            seed_defaults(db)
        except Exception as seed_error:
            logger.warning(f"Could not seed defaults (tables may not exist): {seed_error}")
            db.rollback()
        
        # Query workflows with multiple fallbacks
        workflows = []
        try:
            workflows = db.query(Workflow).order_by(Workflow.lane_order).all()
        except Exception as query_error:
            logger.warning(f"Query with lane_order failed: {query_error}")
            db.rollback()
            try:
                workflows = db.query(Workflow).all()
            except Exception as e2:
                logger.warning(f"Workflow query failed completely: {e2}")
                db.rollback()
                # Return empty list if tables don't exist
                return []
        
        if not workflows:
            return []
        
        result = []
        for w in workflows:
            try:
                # Count agents for this workflow
                try:
                    agent_count = db.query(Agent).filter(Agent.workflow_id == w.id).count()
                except Exception:
                    agent_count = 0
                
                # Safely get values with defaults (handles missing DB columns)
                exec_count = getattr(w, 'execution_count', 0) or 0
                succ_count = getattr(w, 'success_count', 0) or 0
                is_active = getattr(w, 'is_active', True)
                if is_active is None:
                    is_active = True
                last_run = getattr(w, 'last_run_at', None)
                
                # Calculate success rate
                success_rate = (succ_count / exec_count * 100) if exec_count > 0 else 0.0
                
                result.append(WorkflowDashboardItem(
                    id=w.id,
                    name=w.name,
                    description=w.description,
                    color=w.color or "cyan",
                    is_active=is_active,
                    is_default=getattr(w, 'is_default', True),
                    agent_count=agent_count,
                    execution_count=exec_count,
                    success_count=succ_count,
                    success_rate=round(success_rate, 1),
                    last_run_at=last_run.isoformat() if last_run else None,
                ))
            except Exception as item_error:
                logger.warning(f"Error processing workflow {w.id}: {item_error}")
                # Add minimal item on error
                result.append(WorkflowDashboardItem(
                    id=w.id,
                    name=getattr(w, 'name', 'Unknown'),
                    description=getattr(w, 'description', None),
                    color=getattr(w, 'color', 'cyan') or "cyan",
                    is_active=True,
                    is_default=True,
                    agent_count=0,
                    execution_count=0,
                    success_count=0,
                    success_rate=0.0,
                    last_run_at=None,
                ))
        
        return result
    except Exception as e:
        logger.error(f"Failed to get workflow dashboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SEED ENDPOINT
# =============================================================================

@router.post("/seed")
async def seed_agents_and_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """Re-seed default agents, workflows, and connections (resets all to defaults)."""
    # Delete existing
    db.query(AgentConnection).delete()
    db.query(Agent).delete()
    db.query(Workflow).delete()
    db.commit()
    
    # Seed fresh
    seed_defaults(db)
    
    return {
        "success": True, 
        "message": f"Seeded {len(DEFAULT_WORKFLOWS)} workflows, {len(DEFAULT_AGENTS)} agents, and {len(DEFAULT_CONNECTIONS)} connections"
    }


@router.post("/init")
async def initialize_orchestration(
    db: Session = Depends(get_db),
):
    """
    Public endpoint to initialize/seed orchestration data.
    Only seeds if data doesn't exist (safe to call multiple times).
    """
    try:
        # Check current counts
        workflow_count = db.query(Workflow).count()
        agent_count = db.query(Agent).count()
        
        if workflow_count == 0 or agent_count == 0:
            # Force reseed if either is empty
            db.query(AgentConnection).delete()
            db.query(Agent).delete()
            db.query(Workflow).delete()
            db.commit()
            seed_defaults(db)
            
            return {
                "success": True,
                "message": f"Initialized {len(DEFAULT_WORKFLOWS)} workflows, {len(DEFAULT_AGENTS)} agents, {len(DEFAULT_CONNECTIONS)} connections",
                "was_empty": True,
            }
        else:
            return {
                "success": True,
                "message": f"Already initialized with {workflow_count} workflows and {agent_count} agents",
                "was_empty": False,
            }
    except Exception as e:
        logger.error(f"Failed to initialize orchestration: {e}")
        raise HTTPException(status_code=500, detail=str(e))
