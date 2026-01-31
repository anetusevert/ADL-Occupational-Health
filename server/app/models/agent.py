"""
GOHIP Platform - AI Agent & Workflow Models
============================================

Database models for storing AI agent configurations and workflows.
Agents can be configured, tested, and their prompts edited via the UI.
Workflows organize agents into logical pipelines.
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class AgentCategory(str, enum.Enum):
    """Agent category classification."""
    analysis = "analysis"
    research = "research"
    synthesis = "synthesis"
    explanation = "explanation"
    internal = "internal"


# =============================================================================
# WORKFLOW MODEL
# =============================================================================

class Workflow(Base):
    """
    Workflow definition.
    
    Workflows organize agents into logical pipelines. Users can create
    custom workflows or use the default system workflows.
    """
    __tablename__ = "workflows"
    
    id = Column(String(50), primary_key=True)  # e.g., "report-generation"
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=True, default="cyan")  # Tailwind color
    
    # System vs user-created
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    agents = relationship("Agent", back_populates="workflow_rel", lazy="dynamic")
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# =============================================================================
# AGENT MODEL
# =============================================================================

class Agent(Base):
    """
    AI Agent Registry.
    
    Stores configuration for all AI agents in the orchestration layer.
    Each agent has a system prompt and user prompt template that can be
    edited via the AI Orchestration Layer UI.
    """
    __tablename__ = "agents"
    
    id = Column(String(50), primary_key=True)  # e.g., "strategic-deep-dive"
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Classification
    category = Column(Enum(AgentCategory), nullable=False, default=AgentCategory.analysis)
    workflow_id = Column(String(50), ForeignKey("workflows.id"), nullable=True)
    
    # Prompts
    system_prompt = Column(Text, nullable=True)
    user_prompt_template = Column(Text, nullable=True)
    
    # UI configuration
    icon = Column(String(50), nullable=True, default="bot")  # Lucide icon name
    color = Column(String(20), nullable=True, default="cyan")  # Tailwind color
    order_in_workflow = Column(Integer, nullable=True, default=0)  # Display order
    
    # Canvas position for visual workflow builder
    position_x = Column(Float, nullable=True, default=0)
    position_y = Column(Float, nullable=True, default=0)
    
    # LLM Override (optional - uses global config if null)
    llm_provider = Column(String(50), nullable=True)  # e.g., "openai", "anthropic"
    llm_model_name = Column(String(100), nullable=True)  # e.g., "gpt-4o", "claude-3-opus"
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Variables that can be used in prompts
    template_variables = Column(JSONB, nullable=True)  # e.g., ["COUNTRY_NAME", "ISO_CODE"]
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    workflow_rel = relationship("Workflow", back_populates="agents")
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category.value if self.category else None,
            "workflow_id": self.workflow_id,
            "system_prompt": self.system_prompt,
            "user_prompt_template": self.user_prompt_template,
            "icon": self.icon,
            "color": self.color,
            "order_in_workflow": self.order_in_workflow,
            "position_x": self.position_x,
            "position_y": self.position_y,
            "llm_provider": self.llm_provider,
            "llm_model_name": self.llm_model_name,
            "is_active": self.is_active,
            "template_variables": self.template_variables or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# =============================================================================
# DEFAULT WORKFLOWS
# =============================================================================

DEFAULT_WORKFLOWS = [
    {
        "id": "report-generation",
        "name": "Report Generation",
        "description": "Strategic deep dive report generation using multiple agents",
        "color": "amber",
        "is_default": True,
    },
    {
        "id": "country-assessment",
        "name": "Country Assessment",
        "description": "Comprehensive country health assessment",
        "color": "emerald",
        "is_default": True,
    },
    {
        "id": "metric-explanation",
        "name": "Metric Explanation",
        "description": "Explain individual metrics to users",
        "color": "pink",
        "is_default": True,
    },
]


# =============================================================================
# DEFAULT AGENTS TO SEED
# =============================================================================

DEFAULT_AGENTS = [
    {
        "id": "data-agent",
        "name": "Data Agent",
        "description": "Retrieves internal GOHIP framework data including country metrics, pillar scores, and intelligence data.",
        "category": AgentCategory.internal,
        "workflow_id": "report-generation",
        "icon": "database",
        "color": "blue",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 100,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE"],
        "system_prompt": "You are a data retrieval agent for the GOHIP platform. Your role is to gather and organize framework data for analysis.",
        "user_prompt_template": "Retrieve all available data for {{COUNTRY_NAME}} ({{ISO_CODE}}) including governance scores, pillar metrics, and intelligence indicators.",
    },
    {
        "id": "research-agent",
        "name": "Web Research Agent",
        "description": "Conducts deep web research on occupational health policies, regulations, and statistics.",
        "category": AgentCategory.research,
        "workflow_id": "report-generation",
        "icon": "search",
        "color": "cyan",
        "order_in_workflow": 2,
        "position_x": 350,
        "position_y": 100,
        "template_variables": ["COUNTRY_NAME", "TOPIC"],
        "system_prompt": "You are a specialized research agent focused on occupational health and safety. Your role is to gather current, relevant information from reliable sources.",
        "user_prompt_template": "Research the latest occupational health developments for {{COUNTRY_NAME}} focusing on {{TOPIC}}. Include policy changes, statistics, and regulatory updates.",
    },
    {
        "id": "intelligence-agent",
        "name": "Intelligence Agent",
        "description": "Accesses multi-source intelligence data including ILO, WHO, World Bank, and other international sources.",
        "category": AgentCategory.internal,
        "workflow_id": "report-generation",
        "icon": "globe",
        "color": "purple",
        "order_in_workflow": 3,
        "position_x": 600,
        "position_y": 100,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE"],
        "system_prompt": "You are an intelligence agent that synthesizes data from international organizations and research institutions.",
        "user_prompt_template": "Compile intelligence data for {{COUNTRY_NAME}} ({{ISO_CODE}}) from ILO, WHO, World Bank, CPI, HDI, EPI, GBD, and WJP sources.",
    },
    {
        "id": "strategic-deep-dive",
        "name": "Strategic Deep Dive Agent",
        "description": "McKinsey Partner-style expert agent. Generates authoritative, succinct strategic country analyses with quantified insights and action-oriented recommendations.",
        "category": AgentCategory.synthesis,
        "workflow_id": "report-generation",
        "icon": "sparkles",
        "color": "amber",
        "order_in_workflow": 4,
        "position_x": 850,
        "position_y": 100,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE", "METRICS_DATA", "INTELLIGENCE_DATA", "RESEARCH_DATA", "TOPIC"],
        "system_prompt": """You are a McKinsey Partner-level expert specializing in occupational health strategy. 
Your analyses are authoritative, data-driven, and actionable.

You must respond with valid JSON in this exact structure:
{
    "strategy_name": "Strategic title for the analysis",
    "executive_summary": "2-3 sentence overview",
    "key_findings": [{"title": "...", "description": "...", "impact_level": "high/medium/low"}],
    "swot_analysis": {
        "strengths": [{"title": "...", "description": "..."}],
        "weaknesses": [{"title": "...", "description": "..."}],
        "opportunities": [{"title": "...", "description": "..."}],
        "threats": [{"title": "...", "description": "..."}]
    },
    "strategic_recommendations": [{"title": "...", "description": "...", "priority": "immediate/short-term/medium-term", "timeline": "..."}]
}""",
        "user_prompt_template": """Generate a strategic deep dive analysis for {{COUNTRY_NAME}} ({{ISO_CODE}}) on the topic: {{TOPIC}}

## Available Framework Data:
{{METRICS_DATA}}

## Intelligence Data:
{{INTELLIGENCE_DATA}}

## Research Findings:
{{RESEARCH_DATA}}

Provide a comprehensive McKinsey-quality strategic analysis.""",
    },
    {
        "id": "country-analysis",
        "name": "Country Analysis Agent",
        "description": "Generates comprehensive occupational health assessments for countries using framework data and web research.",
        "category": AgentCategory.analysis,
        "workflow_id": "country-assessment",
        "icon": "map",
        "color": "emerald",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 100,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE", "COUNTRY_DATA"],
        "system_prompt": """You are an expert occupational health analyst for Arthur D. Little's Global Health Intelligence Platform.
Your task is to generate a comprehensive strategic assessment based on the Sovereign OH Integrity Framework.""",
        "user_prompt_template": """Generate a comprehensive occupational health assessment for {{COUNTRY_NAME}} ({{ISO_CODE}}).

## Available Country Data:
{{COUNTRY_DATA}}

## Analysis Requirements:
1. **Executive Summary**: Provide a 2-3 sentence overview of the country's occupational health maturity.
2. **Governance Analysis**: Evaluate the strategic capacity and policy framework.
3. **Hazard Control Assessment**: Analyze risk management effectiveness.
4. **Health Vigilance Review**: Assess surveillance and detection capabilities.
5. **Restoration Evaluation**: Evaluate recovery and compensation systems.
6. **Strategic Recommendations**: Provide actionable recommendations.""",
    },
    {
        "id": "metric-explainer",
        "name": "Metric Explanation Agent",
        "description": "Explains individual metrics in plain language, providing context and actionable insights.",
        "category": AgentCategory.explanation,
        "workflow_id": "metric-explanation",
        "icon": "help-circle",
        "color": "pink",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 100,
        "template_variables": ["COUNTRY_NAME", "METRIC_NAME", "METRIC_VALUE", "GLOBAL_AVERAGE", "PERCENTILE"],
        "system_prompt": """You are a helpful analyst who explains occupational health metrics in plain language.
Your explanations are clear, contextual, and actionable.""",
        "user_prompt_template": """Explain this metric for {{COUNTRY_NAME}}:

**Metric**: {{METRIC_NAME}}
**Value**: {{METRIC_VALUE}}
**Global Average**: {{GLOBAL_AVERAGE}}
**Percentile Rank**: {{PERCENTILE}}

Provide:
1. What this metric measures
2. How the country performs relative to global benchmarks
3. What this means for occupational health outcomes
4. Actionable recommendations for improvement""",
    },
]
