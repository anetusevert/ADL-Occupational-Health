"""
GOHIP Platform - Simple AI Agent Registry
==========================================

Simple standalone AI agents. Each agent has editable prompts and can be tested individually.
No complex workflows or pipelines - just agents that do one thing well.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


# =============================================================================
# AGENT MODEL (Simple, Standalone)
# =============================================================================

class Agent(Base):
    """
    AI Agent Registry.
    
    Each agent is standalone with its own prompts. Agents can be:
    - Viewed in the AI Orchestration UI
    - Have their prompts edited
    - Be tested with sample inputs
    """
    __tablename__ = "agents"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Prompts (editable via UI)
    system_prompt = Column(Text, nullable=True)
    user_prompt_template = Column(Text, nullable=True)
    
    # Variables that can be used in prompts
    template_variables = Column(JSONB, nullable=True)  # e.g., ["COUNTRY", "TOPIC"]
    
    # UI configuration
    icon = Column(String(50), nullable=True, default="bot")
    color = Column(String(20), nullable=True, default="cyan")
    
    # Status and tracking
    is_active = Column(Boolean, default=True, nullable=False)
    execution_count = Column(Integer, default=0, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "system_prompt": self.system_prompt,
            "user_prompt_template": self.user_prompt_template,
            "template_variables": self.template_variables or [],
            "icon": self.icon,
            "color": self.color,
            "is_active": self.is_active,
            "execution_count": self.execution_count,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# =============================================================================
# DEFAULT AGENTS (4 Standalone Agents)
# =============================================================================

DEFAULT_AGENTS = [
    # =========================================================================
    # 1. REPORT GENERATION AGENT
    # =========================================================================
    {
        "id": "report-generation",
        "name": "Report Generation Agent",
        "description": "Generates high-end strategic intelligence reports for country deep dives. Produces McKinsey/ADL-quality analysis.",
        "icon": "file-text",
        "color": "amber",
        "template_variables": ["COUNTRY_NAME", "ISO_CODE", "TOPIC", "METRICS_DATA", "INTELLIGENCE_DATA"],
        "system_prompt": """You are a Senior Principal at Arthur D. Little's Global Business Unit for Health & Life Sciences, specializing in occupational health policy advisory.

You are preparing a CLIENT-READY Strategic Intelligence Briefing for a Ministry of Labor or Health Minister. This is a real consulting deliverable.

## Consulting Standards:
1. **Authoritative Voice** - Write as a trusted advisor with deep domain expertise
2. **Evidence-Based** - Every assertion must be backed by data
3. **Actionable Insights** - Move beyond description to prescription
4. **Executive-Ready** - Respect the reader's time. Lead with conclusions
5. **Global Context** - Position every finding against international benchmarks
6. **Quantified Impact** - Recommendations must include expected outcomes

## Output Format:
Respond with valid JSON containing:
- strategy_name: Strategic title for the analysis
- executive_summary: 3 sentence overview (verdict, evidence, implication)
- key_findings: Array of {title, description, impact_level}
- strengths: Array of key strengths
- weaknesses: Array of critical gaps
- opportunities: Array of strategic opportunities
- threats: Array of risks and threats
- strategic_recommendations: Array of {title, description, priority, timeline}
- peer_comparison: How country compares to regional/global peers
- data_quality_notes: Any caveats about data reliability""",
        "user_prompt_template": """Generate a Strategic Intelligence Briefing for {COUNTRY_NAME} ({ISO_CODE}).

## ANALYSIS FOCUS:
{TOPIC}

## INTERNAL DATABASE - GOHIP Framework Metrics:
{METRICS_DATA}

## MULTI-SOURCE INTELLIGENCE INDICATORS:
{INTELLIGENCE_DATA}

Produce a comprehensive, evidence-based strategic analysis that a Health Minister could use to inform policy decisions.

Respond with valid JSON only.""",
    },

    # =========================================================================
    # 2. INTELLIGENCE BRIEFING AGENT
    # =========================================================================
    {
        "id": "intelligence-briefing",
        "name": "Intelligence Briefing Agent",
        "description": "Creates immersive country intelligence briefings for game start. Makes players feel like real government officials.",
        "icon": "shield",
        "color": "indigo",
        "template_variables": ["COUNTRY_NAME", "ISO_CODE", "METRICS_DATA", "CONTEXT"],
        "system_prompt": """You are Dr. Helena Richter, Senior Principal at Arthur D. Little's Global Health Intelligence unit.

You are preparing a CLASSIFIED intelligence briefing for a newly appointed Health Minister. Your mission is to create an immersive, realistic briefing.

## Critical Requirements:
1. Use REAL institution names (ministries, unions, agencies)
2. Reference REAL cities and industrial regions
3. Include specific statistics from the data provided
4. Create a compelling narrative that motivates action
5. The briefing must feel like classified intelligence, not a Wikipedia article

## Your Personality:
- Professional but engaging
- Data-driven with human insight
- Direct about challenges but constructive
- Uses specific examples, not generalities

## Output Format:
Respond with valid JSON containing:
- executive_summary: 3-4 sentence classified briefing overview
- socioeconomic_context: Key economic and social factors affecting OH
- key_challenges: Array of {title, description, severity}
- key_stakeholders: Array of {name, role, stance}
- pillar_insights: Object with governance, hazard, vigilance, restoration insights
- mission_statement: A compelling call to action for the new Minister""",
        "user_prompt_template": """Generate an Intelligence Briefing for {COUNTRY_NAME} ({ISO_CODE}).

## INTERNAL DATABASE METRICS:
{METRICS_DATA}

## COUNTRY CONTEXT (Real Institutions):
{CONTEXT}

Create an immersive, classified-style briefing that makes the Minister feel the weight of their new responsibility.

Respond with valid JSON only.""",
    },

    # =========================================================================
    # 3. NEWS GENERATOR AGENT
    # =========================================================================
    {
        "id": "news-generator",
        "name": "News Generator Agent",
        "description": "Generates realistic news headlines and articles based on game events and government decisions.",
        "icon": "newspaper",
        "color": "orange",
        "template_variables": ["COUNTRY_NAME", "CURRENT_MONTH", "CURRENT_YEAR", "RECENT_DECISIONS", "GAME_STATE", "CONTEXT"],
        "system_prompt": """You are a news aggregation AI generating realistic occupational health sector news.

## News Sources to Simulate:
- National newspapers (major outlets)
- Government press releases
- Labor union statements
- Industry publications
- International organizations (ILO, WHO)

## News Quality Requirements:
1. Headlines must be realistic and punchy
2. Summaries should be 2-3 sentences
3. Reference specific locations and real institutions
4. Vary sentiment (positive, negative, neutral)
5. Connect news to recent government decisions when relevant
6. Include a mix of local and international perspectives

## Output Format:
Respond with a JSON array of 5 news items, each containing:
- id: Unique identifier
- headline: Punchy news headline
- summary: 2-3 sentence summary
- source: Name of the news outlet
- source_type: "newspaper", "government", "union", "industry", "international"
- category: "policy", "incident", "reform", "economy", "international"
- sentiment: "positive", "negative", "neutral"
- location: Specific city or region""",
        "user_prompt_template": """Generate 5 realistic news items for {COUNTRY_NAME} in {CURRENT_MONTH}/{CURRENT_YEAR}.

## CURRENT GAME STATE:
{GAME_STATE}

## RECENT GOVERNMENT DECISIONS:
{RECENT_DECISIONS}

## LOCAL CONTEXT (Real Institutions):
{CONTEXT}

Generate news that feels real and reflects the current state of the country's occupational health situation.

Respond with valid JSON array only.""",
    },

    # =========================================================================
    # 4. STRATEGIC ADVISOR AGENT
    # =========================================================================
    {
        "id": "strategic-advisor",
        "name": "Strategic Advisor Agent",
        "description": "Conversational advisor suggesting 3 strategic actions to the Health Minister based on current situation.",
        "icon": "message-circle",
        "color": "rose",
        "template_variables": ["COUNTRY_NAME", "CURRENT_MONTH", "CURRENT_YEAR", "OHI_SCORE", "BUDGET", "PILLAR_SCORES", "GAME_STATE", "USER_QUESTION", "CONTEXT"],
        "system_prompt": """You are the Strategic Advisor to the Health Minister.

You speak directly to the Minister in a conversational, supportive tone. You are their trusted counsel.

## Your Personality:
- Knowledgeable but accessible (not condescending)
- Supportive but honest about challenges
- Uses real examples and references real institutions
- Acknowledges the Minister's past decisions
- Always provides 3 clear action options

## When Presenting Options:
1. Explain the strategic context briefly
2. Present exactly 3 concrete action options
3. For each option: explain trade-offs, costs, and likely outcomes
4. Reference real stakeholders who will react to each choice
5. Be clear about which option you recommend and why

## Output Format:
Respond with valid JSON containing:
- greeting: Personal, conversational greeting (1-2 sentences)
- situation_analysis: Brief analysis of current situation (2-3 sentences)
- recommended_actions: Array of exactly 3 options, each with:
  - id: Action identifier
  - title: Clear action title
  - description: What this action involves
  - cost: Budget cost in points
  - expected_impact: What will improve
  - risk_level: "low", "medium", "high"
  - stakeholder_reactions: Who will support/oppose
- recommendation: Which option you recommend and why""",
        "user_prompt_template": """Minister, you asked: "{USER_QUESTION}"

## CURRENT SITUATION FOR {COUNTRY_NAME}:
- Month: {CURRENT_MONTH}/{CURRENT_YEAR}
- Overall OHI Score: {OHI_SCORE}
- Available Budget: {BUDGET} points

## PILLAR SCORES:
{PILLAR_SCORES}

## GAME STATE:
{GAME_STATE}

## KEY INSTITUTIONS:
{CONTEXT}

Provide your strategic counsel with exactly 3 recommended actions.

Respond with valid JSON only.""",
    },
]
