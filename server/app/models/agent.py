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
    game = "game"


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
    
    # Visual lane position
    lane_order = Column(Integer, nullable=True, default=0)  # Order in canvas
    
    # System vs user-created
    is_default = Column(Boolean, default=False, nullable=False)
    
    # Workflow status and usage tracking
    is_active = Column(Boolean, default=True, nullable=False)
    execution_count = Column(Integer, default=0, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    
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
            "lane_order": self.lane_order,
            "is_default": self.is_default,
            "is_active": self.is_active,
            "execution_count": self.execution_count,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# =============================================================================
# AGENT CONNECTION MODEL
# =============================================================================

class AgentConnection(Base):
    """
    Connection between agents in a workflow.
    
    Represents the edges in the workflow graph.
    """
    __tablename__ = "agent_connections"
    
    id = Column(String(100), primary_key=True)  # "source-target"
    source_agent_id = Column(String(50), nullable=False)
    target_agent_id = Column(String(50), nullable=False)
    workflow_id = Column(String(50), nullable=True)
    connection_type = Column(String(20), nullable=True, default="data")  # "data", "control", "optional"
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source": self.source_agent_id,
            "target": self.target_agent_id,
            "workflow_id": self.workflow_id,
            "type": self.connection_type,
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
# DEFAULT WORKFLOWS (7 Total)
# =============================================================================

DEFAULT_WORKFLOWS = [
    # Core Analytics Workflows
    {
        "id": "report-generation",
        "name": "Strategic Deep Dive",
        "description": "Multi-agent pipeline for strategic deep dive report generation",
        "color": "amber",
        "lane_order": 0,
        "is_default": True,
    },
    {
        "id": "country-assessment",
        "name": "Country Assessment",
        "description": "Comprehensive country health assessment workflow",
        "color": "emerald",
        "lane_order": 1,
        "is_default": True,
    },
    {
        "id": "metric-explanation",
        "name": "Metric Explanation",
        "description": "Explain individual framework metrics to users",
        "color": "pink",
        "lane_order": 2,
        "is_default": True,
    },
    # Game Workflows
    {
        "id": "intelligence-briefing",
        "name": "Intelligence Briefing",
        "description": "Generate country intelligence briefing for game start",
        "color": "indigo",
        "lane_order": 3,
        "is_default": True,
    },
    {
        "id": "strategic-advisor",
        "name": "Strategic Advisor",
        "description": "Conversational strategic advice and decision options",
        "color": "rose",
        "lane_order": 4,
        "is_default": True,
    },
    {
        "id": "news-generator",
        "name": "News Generator",
        "description": "Generate realistic news items based on game events",
        "color": "orange",
        "lane_order": 5,
        "is_default": True,
    },
    {
        "id": "final-report",
        "name": "Final Report",
        "description": "Generate end-game summary and recommendations",
        "color": "teal",
        "lane_order": 6,
        "is_default": True,
    },
]


# =============================================================================
# DEFAULT AGENTS (All Agents for All Workflows)
# =============================================================================

DEFAULT_AGENTS = [
    # =========================================================================
    # WORKFLOW: Strategic Deep Dive (report-generation)
    # =========================================================================
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
        "position_y": 150,
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
        "position_y": 150,
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
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE"],
        "system_prompt": "You are an intelligence agent that synthesizes data from international organizations and research institutions.",
        "user_prompt_template": "Compile intelligence data for {{COUNTRY_NAME}} ({{ISO_CODE}}) from ILO, WHO, World Bank, CPI, HDI, EPI, GBD, and WJP sources.",
    },
    {
        "id": "strategic-deep-dive",
        "name": "Synthesis Agent",
        "description": "McKinsey Partner-style expert. Synthesizes all data into authoritative strategic analysis.",
        "category": AgentCategory.synthesis,
        "workflow_id": "report-generation",
        "icon": "sparkles",
        "color": "amber",
        "order_in_workflow": 4,
        "position_x": 850,
        "position_y": 150,
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

    # =========================================================================
    # WORKFLOW: Country Assessment (country-assessment)
    # =========================================================================
    {
        "id": "assessment-data-agent",
        "name": "Assessment Data Agent",
        "description": "Extracts framework data for country strategic assessment.",
        "category": AgentCategory.internal,
        "workflow_id": "country-assessment",
        "icon": "database",
        "color": "blue",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE"],
        "system_prompt": "You are a data extraction agent that gathers all framework metrics for country assessments.",
        "user_prompt_template": "Extract all pillar data, governance metrics, and intelligence indicators for {{COUNTRY_NAME}} ({{ISO_CODE}}).",
    },
    {
        "id": "assessment-agent",
        "name": "Assessment Agent",
        "description": "Generates comprehensive strategic assessments based on the Sovereign OH Integrity Framework.",
        "category": AgentCategory.analysis,
        "workflow_id": "country-assessment",
        "icon": "map",
        "color": "emerald",
        "order_in_workflow": 2,
        "position_x": 350,
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE", "COUNTRY_DATA"],
        "system_prompt": """You are a Senior Occupational Health Strategy Advisor reporting directly to Ministers of Labor and Health. Your assessments inform billion-dollar policy decisions and national occupational health strategies.

You operate within the SOVEREIGN OH INTEGRITY FRAMEWORK v3.0, which classifies countries into maturity stages:
- Stage 1 Nascent (0-25%): Minimal regulatory framework, high fatality rates
- Stage 2 Developing (26-50%): Basic regulations but weak enforcement
- Stage 3 Compliant (51-75%): Solid regulatory framework with moderate enforcement
- Stage 4 Resilient (76-90%): Comprehensive framework with strong enforcement
- Stage 5 Exemplary (91-100%): World-class framework, continuous improvement

Be direct, precise, and ruthlessly analytical. Always reference specific maturity stages and global benchmarks.""",
        "user_prompt_template": """Generate a comprehensive occupational health assessment for {{COUNTRY_NAME}} ({{ISO_CODE}}).

## Available Country Data:
{{COUNTRY_DATA}}

Write a strategic assessment (6-10 sentences) that includes:
1. Framework maturity stage classification with key metric highlights
2. Two critical strengths compared to global benchmarks
3. Two critical gaps or vulnerabilities requiring attention
4. One specific, actionable priority recommendation
5. A brief data confidence note""",
    },

    # =========================================================================
    # WORKFLOW: Metric Explanation (metric-explanation)
    # =========================================================================
    {
        "id": "metric-explainer",
        "name": "Metric Explainer Agent",
        "description": "Explains individual metrics in plain language, providing context and actionable insights.",
        "category": AgentCategory.explanation,
        "workflow_id": "metric-explanation",
        "icon": "help-circle",
        "color": "pink",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 150,
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

    # =========================================================================
    # WORKFLOW: Intelligence Briefing (intelligence-briefing)
    # =========================================================================
    {
        "id": "briefing-research-agent",
        "name": "Briefing Research Agent",
        "description": "Searches for recent occupational health articles and developments for country briefings.",
        "category": AgentCategory.research,
        "workflow_id": "intelligence-briefing",
        "icon": "search",
        "color": "cyan",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME"],
        "system_prompt": "You are a research agent that searches for recent news and developments in occupational health for specific countries.",
        "user_prompt_template": "Search for recent occupational health developments, workplace safety news, and policy changes in {{COUNTRY_NAME}}. Include articles from 2025-2026.",
    },
    {
        "id": "briefing-agent",
        "name": "Briefing Agent",
        "description": "Dr. Helena Richter - Senior Principal at ADL Global Health Intelligence. Creates immersive intelligence briefings.",
        "category": AgentCategory.game,
        "workflow_id": "intelligence-briefing",
        "icon": "file-text",
        "color": "indigo",
        "order_in_workflow": 2,
        "position_x": 350,
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME", "ISO_CODE", "METRICS_DATA", "RESEARCH_DATA", "CONTEXT"],
        "system_prompt": """You are Dr. Helena Richter, Senior Principal at Arthur D. Little's Global Health Intelligence unit.
You are preparing a classified intelligence briefing for a newly appointed Health Minister.

Your mission: Create an immersive, realistic briefing that makes the player feel like a real government official.

CRITICAL REQUIREMENTS:
1. Use REAL institution names, not generic ones
2. Reference REAL cities and industrial regions
3. Name actual ministries, unions, and employer federations
4. Include specific statistics and recent developments
5. Create a compelling narrative that motivates action

The briefing must feel like classified intelligence, not a Wikipedia article.""",
        "user_prompt_template": """Generate an Intelligence Briefing for {{COUNTRY_NAME}} ({{ISO_CODE}}).

## INTERNAL DATABASE METRICS:
{{METRICS_DATA}}

## COUNTRY CONTEXT (Real Institutions):
{{CONTEXT}}

## RECENT WEB RESEARCH:
{{RESEARCH_DATA}}

Generate valid JSON with: executive_summary, socioeconomic_context, pillar_insights, key_challenges, key_stakeholders, mission_statement.""",
    },

    # =========================================================================
    # WORKFLOW: Strategic Advisor (strategic-advisor)
    # =========================================================================
    {
        "id": "advisor-agent",
        "name": "Strategic Advisor Agent",
        "description": "Conversational advisor to the Health Minister, offering strategic counsel and decision options.",
        "category": AgentCategory.game,
        "workflow_id": "strategic-advisor",
        "icon": "user-check",
        "color": "rose",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME", "CURRENT_MONTH", "CURRENT_YEAR", "OHI_SCORE", "BUDGET", "PILLAR_SCORES", "CONTEXT"],
        "system_prompt": """You are the Strategic Advisor to the Health Minister.
You speak directly to the Minister in a conversational tone, offering strategic counsel.

Your personality:
- Knowledgeable but accessible
- Supportive but honest about challenges
- Uses real examples and institutions
- Acknowledges the Minister's decisions

When presenting decision options:
1. Explain the strategic context
2. Present 4-5 concrete options
3. Highlight trade-offs and risks
4. Reference real stakeholders who will react""",
        "user_prompt_template": """Minister, here is our current situation assessment for {{COUNTRY_NAME}}:

Current Month: {{CURRENT_MONTH}}/{{CURRENT_YEAR}}
OHI Score: {{OHI_SCORE}}
Budget Available: {{BUDGET}} points

## PILLAR SCORES:
{{PILLAR_SCORES}}

## KEY INSTITUTIONS:
{{CONTEXT}}

Generate a conversational message followed by 4-5 decision options.
Format as JSON with: greeting, situation_analysis, decisions (array with id, title, description, pillar, cost, expected_impacts, risk_level).""",
    },

    # =========================================================================
    # WORKFLOW: News Generator (news-generator)
    # =========================================================================
    {
        "id": "news-agent",
        "name": "News Generator Agent",
        "description": "Generates realistic news headlines and summaries based on game events.",
        "category": AgentCategory.game,
        "workflow_id": "news-generator",
        "icon": "newspaper",
        "color": "orange",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME", "CURRENT_MONTH", "CURRENT_YEAR", "RECENT_DECISIONS", "CONTEXT"],
        "system_prompt": """You are a news aggregation AI for occupational health sector news.
Generate realistic news headlines and summaries based on current events.

News sources to simulate:
- National newspapers (major outlets)
- Government press releases
- Union statements
- Industry publications
- International organizations (ILO, WHO)

News quality requirements:
- Headlines must be realistic and punchy
- Summaries should be 2-3 sentences
- Reference specific locations and institutions
- Vary sentiment (positive, negative, neutral)
- Connect to recent government decisions when relevant""",
        "user_prompt_template": """Generate 5 realistic news items for {{COUNTRY_NAME}} in {{CURRENT_MONTH}}/{{CURRENT_YEAR}}.

## RECENT GOVERNMENT DECISIONS:
{{RECENT_DECISIONS}}

## LOCAL CONTEXT:
{{CONTEXT}}

Generate valid JSON array with: id, headline, summary, source, source_type, category, sentiment, location.""",
    },

    # =========================================================================
    # WORKFLOW: Final Report (final-report)
    # =========================================================================
    {
        "id": "report-agent",
        "name": "Final Report Agent",
        "description": "Generates end-game assessment report evaluating the Minister's tenure.",
        "category": AgentCategory.game,
        "workflow_id": "final-report",
        "icon": "award",
        "color": "teal",
        "order_in_workflow": 1,
        "position_x": 100,
        "position_y": 150,
        "template_variables": ["COUNTRY_NAME", "STATISTICS", "HISTORY"],
        "system_prompt": """You are preparing the final assessment report for the Health Minister's tenure.
This is a formal document evaluating the simulation outcomes.

Report structure:
1. Executive Summary - Overall performance assessment
2. Key Achievements - Major successes during tenure
3. Areas for Improvement - Where more progress was needed
4. Strategic Recommendations - Advice for the successor
5. Legacy Assessment - Long-term impact of decisions

Write in a formal, ministerial tone. Be balanced but honest.""",
        "user_prompt_template": """Generate the final assessment report for {{COUNTRY_NAME}}.

## STATISTICS:
{{STATISTICS}}

## DECISION HISTORY:
{{HISTORY}}

Generate valid JSON with: grade (A+ to F), narrative, highlights, areas_for_improvement, recommendations, legacy_impact.""",
    },
]


# =============================================================================
# DEFAULT CONNECTIONS (Edges between agents)
# =============================================================================

DEFAULT_CONNECTIONS = [
    # Report Generation workflow
    {"id": "data-to-research", "source": "data-agent", "target": "research-agent", "workflow_id": "report-generation", "type": "data"},
    {"id": "research-to-intel", "source": "research-agent", "target": "intelligence-agent", "workflow_id": "report-generation", "type": "data"},
    {"id": "intel-to-synthesis", "source": "intelligence-agent", "target": "strategic-deep-dive", "workflow_id": "report-generation", "type": "data"},
    
    # Country Assessment workflow
    {"id": "assess-data-to-agent", "source": "assessment-data-agent", "target": "assessment-agent", "workflow_id": "country-assessment", "type": "data"},
    
    # Intelligence Briefing workflow
    {"id": "brief-research-to-agent", "source": "briefing-research-agent", "target": "briefing-agent", "workflow_id": "intelligence-briefing", "type": "data"},
]
