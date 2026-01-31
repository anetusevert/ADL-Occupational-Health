"""
Game Workflow Orchestrator
==========================

Dedicated orchestration layer for the Sovereign Health game.
Integrates with the AI orchestration system to provide:

1. Intelligence Briefing Workflow - Runs when a country is selected
2. Strategic Advisor Workflow - Powers the conversational advisor
3. News & Development Generator - Creates dynamic news content
4. Final Report Workflow - Generates end-game summaries

These workflows run agents in parallel where possible and integrate
web search for real-time data enrichment.
"""

import logging
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decrypt_api_key
from app.models.user import AIConfig, AIProvider
from app.models.agent import Agent, Workflow
from app.data.country_contexts import get_country_context, CountryContext
from app.services.ai_orchestrator import (
    perform_web_search,
    get_llm_from_config,
    call_openai_with_web_search,
    get_openai_api_key_from_config,
    AgentStatus,
    AgentLogEntry,
)

logger = logging.getLogger(__name__)


# =============================================================================
# WORKFLOW TYPES
# =============================================================================

class GameWorkflowType(str, Enum):
    """Types of game workflows."""
    INTELLIGENCE_BRIEFING = "intelligence_briefing"
    STRATEGIC_ADVISOR = "strategic_advisor"
    NEWS_GENERATOR = "news_generator"
    FINAL_REPORT = "final_report"


@dataclass
class WorkflowResult:
    """Result from a workflow execution."""
    workflow_type: GameWorkflowType
    success: bool
    data: Dict[str, Any]
    agent_log: List[AgentLogEntry] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    execution_time_ms: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "workflow_type": self.workflow_type.value,
            "success": self.success,
            "data": self.data,
            "agent_log": [entry.to_dict() for entry in self.agent_log],
            "errors": self.errors,
            "execution_time_ms": self.execution_time_ms,
        }


# =============================================================================
# AGENT PROMPTS FOR GAME WORKFLOWS
# =============================================================================

INTELLIGENCE_BRIEFING_SYSTEM_PROMPT = """You are Dr. Helena Richter, Senior Principal at Arthur D. Little's Global Health Intelligence unit.
You are preparing a classified intelligence briefing for a newly appointed Health Minister.

Your mission: Create an immersive, realistic briefing that makes the player feel like a real government official.

CRITICAL REQUIREMENTS:
1. Use REAL institution names, not generic ones
2. Reference REAL cities and industrial regions
3. Name actual ministries, unions, and employer federations
4. Include specific statistics and recent developments
5. Create a compelling narrative that motivates action

The briefing must feel like classified intelligence, not a Wikipedia article.
"""

STRATEGIC_ADVISOR_SYSTEM_PROMPT = """You are the Strategic Advisor to the Health Minister of {country_name}.
You speak directly to the Minister in a conversational tone, offering strategic counsel.

Your personality:
- Knowledgeable but accessible
- Supportive but honest about challenges
- Uses real examples and institutions
- Acknowledges the Minister's decisions

Current situation:
- Country: {country_name}
- Current Month: {current_month}/{current_year}
- OHI Score: {ohi_score}
- Budget Available: {budget_remaining} points

When presenting decision options:
1. Explain the strategic context
2. Present 4-5 concrete options
3. Highlight trade-offs and risks
4. Reference real stakeholders who will react
"""

NEWS_GENERATOR_SYSTEM_PROMPT = """You are a news aggregation AI for {country_name}'s occupational health sector.
Generate realistic news headlines and summaries based on current events.

News sources to simulate:
- National newspapers ({country_name}'s major outlets)
- Government press releases ({ministry_name})
- Union statements ({unions})
- Industry publications
- International organizations (ILO, WHO)
- Local regional media

News quality requirements:
- Headlines must be realistic and punchy
- Summaries should be 2-3 sentences
- Reference specific locations and institutions
- Vary sentiment (positive, negative, neutral)
- Connect to recent government decisions when relevant
"""

FINAL_REPORT_SYSTEM_PROMPT = """You are preparing the final assessment report for the Health Minister's tenure.
This is a formal document evaluating the simulation outcomes.

Report structure:
1. Executive Summary - Overall performance assessment
2. Key Achievements - Major successes during tenure
3. Areas for Improvement - Where more progress was needed
4. Strategic Recommendations - Advice for the successor
5. Legacy Assessment - Long-term impact of decisions

Write in a formal, ministerial tone. Be balanced but honest.
"""


# =============================================================================
# GAME WORKFLOW ORCHESTRATOR
# =============================================================================

class GameWorkflowOrchestrator:
    """
    Orchestrates AI workflows for the Sovereign Health game.
    
    This class manages the execution of various game-related AI workflows,
    coordinating multiple agents and integrating with the central AI
    orchestration layer.
    """

    def __init__(self, db: Session, ai_config: Optional[AIConfig] = None):
        self.db = db
        self.ai_config = ai_config
        self.agent_log: List[AgentLogEntry] = []

    def _log_agent_activity(
        self,
        agent: str,
        status: AgentStatus,
        message: str,
        emoji: str = "📍"
    ) -> None:
        """Log agent activity."""
        entry = AgentLogEntry(
            timestamp=datetime.utcnow().isoformat(),
            agent=agent,
            status=status,
            message=message,
            emoji=emoji,
        )
        self.agent_log.append(entry)
        logger.info(f"[{agent}] {status.value}: {message}")

    async def run_intelligence_briefing(
        self,
        iso_code: str,
        country_name: str,
        metrics_data: Dict[str, Any],
        context: CountryContext,
    ) -> WorkflowResult:
        """
        Run the Intelligence Briefing workflow.
        
        This workflow:
        1. Performs web search for recent articles
        2. Analyzes country metrics from database
        3. Generates comprehensive briefing with AI
        4. Returns structured briefing data
        """
        start_time = datetime.utcnow()
        self.agent_log = []
        
        self._log_agent_activity(
            "Orchestrator", 
            AgentStatus.STARTING,
            f"Initiating Intelligence Briefing for {country_name}",
            "🚀"
        )

        try:
            # Check if AI config is available
            use_ai = self.ai_config is not None
            if not use_ai:
                logger.warning("No AI configuration available - will use fallback data")
                self._log_agent_activity(
                    "Orchestrator",
                    AgentStatus.ANALYZING,
                    "Using template-based briefing (no AI configured)",
                    "📋"
                )
            
            # Web search for recent articles (optional, with error handling)
            all_results = []
            research_text = "No recent articles found - using historical knowledge."
            
            if use_ai:
                try:
                    self._log_agent_activity(
                        "ResearchAgent",
                        AgentStatus.RESEARCHING,
                        f"Searching for recent occupational health developments in {country_name}",
                        "🔍"
                    )

                    search_queries = [
                        f"{country_name} occupational health safety 2025 2026",
                        f"{country_name} workplace safety legislation reform",
                    ]
                    
                    for query in search_queries[:2]:
                        try:
                            results = await perform_web_search(query, max_results=3)
                            if results:
                                all_results.extend(results)
                        except Exception as search_err:
                            logger.warning(f"Web search failed for query '{query}': {search_err}")

                    self._log_agent_activity(
                        "ResearchAgent",
                        AgentStatus.COMPLETE,
                        f"Found {len(all_results)} relevant articles",
                        "✅"
                    )

                    # Format research results
                    if all_results:
                        research_text = "\n".join([
                            f"- {r.get('title', 'Unknown')}: {r.get('snippet', r.get('content', ''))[:200]}"
                            for r in all_results[:5]
                        ])
                except Exception as research_err:
                    logger.warning(f"Research phase failed: {research_err}")
                    self._log_agent_activity(
                        "ResearchAgent",
                        AgentStatus.COMPLETE,
                        "Web search unavailable - continuing with database data",
                        "⚠️"
                    )

            # Generate briefing (with AI or fallback)
            self._log_agent_activity(
                "BriefingAgent",
                AgentStatus.SYNTHESIZING,
                "Generating intelligence briefing",
                "🧠"
            )

            if use_ai:
                briefing_data = await self._generate_briefing_content(
                    country_name=country_name,
                    iso_code=iso_code,
                    metrics_data=metrics_data,
                    context=context,
                    research_text=research_text,
                )
            else:
                # Generate fallback briefing without AI
                briefing_data = self._generate_fallback_briefing(
                    country_name=country_name,
                    iso_code=iso_code,
                    metrics_data=metrics_data,
                    context=context,
                )

            self._log_agent_activity(
                "Orchestrator",
                AgentStatus.COMPLETE,
                "Intelligence Briefing complete",
                "🎯"
            )

            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            return WorkflowResult(
                workflow_type=GameWorkflowType.INTELLIGENCE_BRIEFING,
                success=True,
                data=briefing_data,
                agent_log=self.agent_log.copy(),
                execution_time_ms=execution_time,
            )

        except Exception as e:
            logger.error(f"Intelligence Briefing workflow failed: {e}")
            self._log_agent_activity(
                "Orchestrator",
                AgentStatus.ERROR,
                f"Workflow failed: {str(e)}",
                "❌"
            )
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return WorkflowResult(
                workflow_type=GameWorkflowType.INTELLIGENCE_BRIEFING,
                success=False,
                data={},
                agent_log=self.agent_log.copy(),
                errors=[str(e)],
                execution_time_ms=execution_time,
            )

    async def _generate_briefing_content(
        self,
        country_name: str,
        iso_code: str,
        metrics_data: Dict[str, Any],
        context: CountryContext,
        research_text: str,
    ) -> Dict[str, Any]:
        """Generate briefing content using AI."""
        
        user_prompt = f"""Generate an Intelligence Briefing for {country_name} ({iso_code}).

## INTERNAL DATABASE METRICS:
{json.dumps(metrics_data, indent=2)}

## COUNTRY CONTEXT (Real Institutions):
- Ministry: {context.ministry_name} ({context.ministry_abbreviation})
- Inspection Body: {context.labor_inspection_body}
- Major Unions: {', '.join(context.major_unions[:3])}
- Key Industries: {', '.join(context.key_industries[:4])}
- Major Cities: {', '.join(context.major_cities[:4])}
- Industrial Regions: {', '.join(context.industrial_regions[:3])}

## RECENT WEB RESEARCH:
{research_text}

## GENERATE BRIEFING:
Create a compelling intelligence briefing as valid JSON with these fields:
- executive_summary: 3-4 sentence overview
- socioeconomic_context: 2-3 paragraphs on economy and OH implications
- cultural_factors: 1-2 paragraphs on work culture
- future_outlook: 1-2 paragraphs on emerging challenges
- pillar_insights: Analysis for governance, hazardControl, healthVigilance, restoration
- key_challenges: Array of 3-5 main challenges
- key_stakeholders: Array of key players with name, role, institution, stance
- recent_articles: Summary of relevant articles from research
- mission_statement: Inspiring mission for the player
- political_system: Brief description of government structure
- key_government_officials: Array of key ministers/officials
"""

        if self.ai_config and self.ai_config.provider == AIProvider.OPENAI:
            api_key = get_openai_api_key_from_config(self.ai_config, self.db)
            if api_key:
                response = await call_openai_with_web_search(
                    api_key=api_key,
                    model=self.ai_config.model_name or "gpt-4o",
                    system_prompt=INTELLIGENCE_BRIEFING_SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                    search_context_size="medium",
                )
                if response:
                    try:
                        json_start = response.find("{")
                        json_end = response.rfind("}") + 1
                        if json_start >= 0 and json_end > json_start:
                            return json.loads(response[json_start:json_end])
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse AI response as JSON")

        # Fallback to LangChain
        llm = get_llm_from_config(self.ai_config, self.db)
        if llm:
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content=INTELLIGENCE_BRIEFING_SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ]
            response = await llm.ainvoke(messages)
            if response and response.content:
                try:
                    json_start = response.content.find("{")
                    json_end = response.content.rfind("}") + 1
                    if json_start >= 0 and json_end > json_start:
                        return json.loads(response.content[json_start:json_end])
                except json.JSONDecodeError:
                    pass

        # Return empty dict if AI fails
        return {}

    def _generate_fallback_briefing(
        self,
        country_name: str,
        iso_code: str,
        metrics_data: Dict[str, Any],
        context: CountryContext,
    ) -> Dict[str, Any]:
        """Generate a fallback briefing without AI."""
        
        # Determine difficulty based on maturity score
        maturity = metrics_data.get("maturity_score", 2.5) or 2.5
        if maturity >= 3.5:
            difficulty = "manageable"
        elif maturity >= 2.5:
            difficulty = "moderate"
        elif maturity >= 1.5:
            difficulty = "significant"
        else:
            difficulty = "critical"
        
        # Build fallback briefing
        return {
            "executive_summary": f"{country_name} presents a {difficulty} challenge for occupational health transformation. As the new Health Minister, you will need to balance improving worker safety with economic development priorities.",
            
            "socioeconomic_context": f"{country_name}'s economy is driven by {', '.join(context.key_industries[:3]) if context.key_industries else 'diverse industries'}. The workforce faces particular risks in {', '.join(context.high_risk_sectors[:2]) if context.high_risk_sectors else 'various sectors'}.",
            
            "cultural_factors": f"Work culture in {country_name} reflects local traditions and economic priorities. Understanding these cultural factors is essential for effective policy implementation.",
            
            "future_outlook": f"Looking ahead, {country_name} faces evolving challenges including technological disruption, climate-related workplace hazards, and demographic shifts.",
            
            "pillar_insights": {
                "governance": {
                    "analysis": f"Current governance score indicates {'strong foundation' if (metrics_data.get('governance_score') or 50) >= 70 else 'room for improvement'}.",
                    "key_issues": ["Enforcement capacity", "Policy coordination"],
                    "opportunities": ["Strengthen regulatory framework"]
                },
                "hazardControl": {
                    "analysis": f"Hazard control measures show {'good progress' if (metrics_data.get('pillar1_score') or 50) >= 70 else 'areas needing attention'}.",
                    "key_issues": ["Risk assessment coverage", "PPE compliance"],
                    "opportunities": ["Modernize inspection systems"]
                },
                "healthVigilance": {
                    "analysis": f"Health surveillance systems are {'well-developed' if (metrics_data.get('pillar2_score') or 50) >= 70 else 'developing'}.",
                    "key_issues": ["Disease reporting", "Early detection"],
                    "opportunities": ["Digital health monitoring"]
                },
                "restoration": {
                    "analysis": f"Worker rehabilitation and compensation {'functions effectively' if (metrics_data.get('pillar3_score') or 50) >= 70 else 'needs strengthening'}.",
                    "key_issues": ["Return-to-work programs", "Compensation coverage"],
                    "opportunities": ["Expand mental health support"]
                }
            },
            
            "key_challenges": [
                "Improving enforcement capacity",
                "Expanding coverage to all workers",
                "Modernizing surveillance systems"
            ],
            
            "key_stakeholders": [
                {"name": "Minister of Labour", "role": "Government Lead", "institution": context.ministry_name, "stance": "supportive"},
                {"name": "Chief Labour Inspector", "role": "Enforcement", "institution": context.labor_inspection_body, "stance": "supportive"},
                {"name": "Union Federation", "role": "Worker Representative", "institution": context.major_unions[0] if context.major_unions else "National Union", "stance": "neutral"},
            ],
            
            "recent_articles": [],
            
            "mission_statement": f"Transform {country_name}'s occupational health system into a model framework that protects every worker while supporting economic growth.",
            
            "political_system": "Government structure with dedicated ministry for labour and health matters.",
            
            "key_government_officials": []
        }

    async def run_strategic_advisor(
        self,
        iso_code: str,
        country_name: str,
        current_month: int,
        current_year: int,
        ohi_score: float,
        pillar_scores: Dict[str, float],
        budget_remaining: int,
        recent_decisions: List[str],
        context: CountryContext,
    ) -> WorkflowResult:
        """
        Run the Strategic Advisor workflow.
        
        Generates conversational advice and decision options.
        """
        start_time = datetime.utcnow()
        self.agent_log = []

        # Check if AI config is available
        if not self.ai_config:
            logger.warning("No AI configuration available for Strategic Advisor")
            self._log_agent_activity(
                "AdvisorAgent",
                AgentStatus.ERROR,
                "No AI configuration found. Please configure AI settings in Admin.",
                "⚠️"
            )
            return WorkflowResult(
                workflow_type=GameWorkflowType.STRATEGIC_ADVISOR,
                success=False,
                data={"decisions": []},
                agent_log=self.agent_log.copy(),
                errors=["No AI configuration found. Please configure AI settings in Admin > AI Settings."],
                execution_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            )

        self._log_agent_activity(
            "AdvisorAgent",
            AgentStatus.STARTING,
            f"Preparing strategic advice for {country_name}",
            "💼"
        )

        try:
            # Format the advisor prompt
            system_prompt = STRATEGIC_ADVISOR_SYSTEM_PROMPT.format(
                country_name=country_name,
                current_month=current_month,
                current_year=current_year,
                ohi_score=ohi_score,
                budget_remaining=budget_remaining,
            )

            # Determine priority areas
            weakest_pillar = min(pillar_scores, key=pillar_scores.get)
            strongest_pillar = max(pillar_scores, key=pillar_scores.get)

            user_prompt = f"""Minister, here is our current situation assessment:

## PILLAR SCORES:
- Governance: {pillar_scores.get('governance', 50):.0f}/100
- Hazard Control: {pillar_scores.get('hazardControl', 50):.0f}/100  
- Health Vigilance: {pillar_scores.get('healthVigilance', 50):.0f}/100
- Restoration: {pillar_scores.get('restoration', 50):.0f}/100

## PRIORITY ANALYSIS:
Our weakest area is {weakest_pillar} (score: {pillar_scores.get(weakest_pillar, 50):.0f}).
Our strongest area is {strongest_pillar} (score: {pillar_scores.get(strongest_pillar, 50):.0f}).

## RECENT DECISIONS:
{chr(10).join(f'- {d}' for d in recent_decisions[-5:]) if recent_decisions else 'No recent decisions.'}

## KEY INSTITUTIONS:
- Ministry: {context.ministry_name}
- Inspection Body: {context.labor_inspection_body}
- Key Industries: {', '.join(context.key_industries[:3])}

Generate a conversational message to the Minister followed by 4-5 decision options.
Format as JSON with:
- greeting: Short personalized greeting
- situation_analysis: 2-3 sentences on current priorities
- decisions: Array of decision objects with:
  - id, title, description, pillar, cost, expected_impacts, risk_level, time_to_effect
"""

            self._log_agent_activity(
                "AdvisorAgent",
                AgentStatus.SYNTHESIZING,
                "Generating strategic recommendations",
                "🧠"
            )

            # Generate with AI
            advisor_data = await self._generate_with_ai(system_prompt, user_prompt)

            self._log_agent_activity(
                "AdvisorAgent",
                AgentStatus.COMPLETE,
                "Strategic advice prepared",
                "✅"
            )

            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            return WorkflowResult(
                workflow_type=GameWorkflowType.STRATEGIC_ADVISOR,
                success=True,
                data=advisor_data,
                agent_log=self.agent_log.copy(),
                execution_time_ms=execution_time,
            )

        except Exception as e:
            logger.error(f"Strategic Advisor workflow failed: {e}")
            return WorkflowResult(
                workflow_type=GameWorkflowType.STRATEGIC_ADVISOR,
                success=False,
                data={},
                errors=[str(e)],
                execution_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            )

    async def run_news_generator(
        self,
        iso_code: str,
        country_name: str,
        current_month: int,
        current_year: int,
        recent_decisions: List[Dict[str, Any]],
        pillar_changes: Dict[str, float],
        context: CountryContext,
        count: int = 5,
    ) -> WorkflowResult:
        """
        Run the News Generator workflow.
        
        Generates realistic news items based on game events.
        """
        start_time = datetime.utcnow()
        self.agent_log = []

        # Check if AI config is available
        if not self.ai_config:
            logger.warning("No AI configuration available for News Generator")
            return WorkflowResult(
                workflow_type=GameWorkflowType.NEWS_GENERATOR,
                success=False,
                data={"news_items": []},
                errors=["No AI configuration found. Please configure AI settings in Admin > AI Settings."],
                execution_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            )

        self._log_agent_activity(
            "NewsAgent",
            AgentStatus.STARTING,
            f"Generating news for {country_name}",
            "📰"
        )

        try:
            # Get union names for the prompt
            unions_str = ', '.join(context.major_unions[:2]) if context.major_unions else "worker unions"
            
            system_prompt = NEWS_GENERATOR_SYSTEM_PROMPT.format(
                country_name=country_name,
                ministry_name=context.ministry_name,
                unions=unions_str,
            )

            month_names = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"]
            month_name = month_names[current_month - 1] if 1 <= current_month <= 12 else "January"

            user_prompt = f"""Generate {count} realistic news items for {month_name} {current_year}.

## RECENT GOVERNMENT DECISIONS:
{json.dumps(recent_decisions[-3:] if recent_decisions else [], indent=2)}

## PILLAR SCORE CHANGES:
{json.dumps(pillar_changes, indent=2) if pillar_changes else 'No changes this period.'}

## LOCAL CONTEXT:
- Capital: {context.capital}
- Major Cities: {', '.join(context.major_cities[:3])}
- Key Industries: {', '.join(context.key_industries[:3])}
- Major Unions: {', '.join(context.major_unions[:2])}
- Industry Groups: {', '.join(context.industry_associations[:2])}

Generate valid JSON array of news items:
[
  {{
    "id": "unique_id",
    "headline": "Realistic headline",
    "summary": "2-3 sentence summary",
    "source": "Real or realistic source name",
    "source_type": "media|official|union|industry|international",
    "category": "governance|hazardControl|healthVigilance|restoration",
    "sentiment": "positive|negative|neutral",
    "location": "Specific city or region",
    "related_decision": "decision_id if relevant"
  }}
]
"""

            self._log_agent_activity(
                "NewsAgent",
                AgentStatus.SYNTHESIZING,
                f"Generating {count} news items",
                "✍️"
            )

            # Generate with AI
            news_data = await self._generate_with_ai(system_prompt, user_prompt, expect_array=True)

            self._log_agent_activity(
                "NewsAgent",
                AgentStatus.COMPLETE,
                f"Generated {len(news_data) if isinstance(news_data, list) else 0} news items",
                "✅"
            )

            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            return WorkflowResult(
                workflow_type=GameWorkflowType.NEWS_GENERATOR,
                success=True,
                data={"news_items": news_data if isinstance(news_data, list) else []},
                agent_log=self.agent_log.copy(),
                execution_time_ms=execution_time,
            )

        except Exception as e:
            logger.error(f"News Generator workflow failed: {e}")
            return WorkflowResult(
                workflow_type=GameWorkflowType.NEWS_GENERATOR,
                success=False,
                data={"news_items": []},
                errors=[str(e)],
                execution_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            )

    async def run_final_report(
        self,
        country_name: str,
        history: List[Dict[str, Any]],
        statistics: Dict[str, Any],
        final_rank: int,
    ) -> WorkflowResult:
        """
        Run the Final Report workflow.
        
        Generates end-game summary and recommendations.
        """
        start_time = datetime.utcnow()
        self.agent_log = []

        # Check if AI config is available
        if not self.ai_config:
            logger.warning("No AI configuration available for Final Report")
            return WorkflowResult(
                workflow_type=GameWorkflowType.FINAL_REPORT,
                success=False,
                data={},
                errors=["No AI configuration found. Please configure AI settings in Admin > AI Settings."],
                execution_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            )

        self._log_agent_activity(
            "ReportAgent",
            AgentStatus.STARTING,
            "Generating final assessment report",
            "📋"
        )

        try:
            user_prompt = f"""Generate the final assessment report for the Health Minister's tenure in {country_name}.

## STATISTICS:
- Total Cycles Played: {statistics.get('totalCyclesPlayed', 0)}
- Starting OHI Score: {statistics.get('startingOHIScore', 0):.2f}
- Final OHI Score: {statistics.get('currentOHIScore', 0):.2f}
- Peak OHI Score: {statistics.get('peakOHIScore', 0):.2f}
- Starting Rank: {statistics.get('startingRank', 0)}
- Final Rank: {final_rank}
- Best Rank Achieved: {statistics.get('bestRank', 0)}
- Total Budget Spent: {statistics.get('totalBudgetSpent', 0)}
- Policies Maximized: {statistics.get('policiesMaxed', 0)}
- Events Handled: {statistics.get('eventsHandled', 0)}
- Critical Events Managed: {statistics.get('criticalEventsManaged', 0)}

## PERFORMANCE DELTA:
Score Change: {(statistics.get('currentOHIScore', 0) - statistics.get('startingOHIScore', 0)):+.2f}
Rank Change: {(statistics.get('startingRank', 0) - final_rank):+d} positions

Generate valid JSON:
{{
  "grade": "A+/A/A-/B+/B/B-/C+/C/C-/D/F based on performance",
  "narrative": "3-4 paragraph assessment of the Minister's tenure",
  "highlights": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "areas_for_improvement": ["Area 1", "Area 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "legacy_impact": "Brief statement on long-term impact"
}}
"""

            self._log_agent_activity(
                "ReportAgent",
                AgentStatus.SYNTHESIZING,
                "Analyzing performance and generating narrative",
                "🧠"
            )

            report_data = await self._generate_with_ai(FINAL_REPORT_SYSTEM_PROMPT, user_prompt)

            self._log_agent_activity(
                "ReportAgent",
                AgentStatus.COMPLETE,
                "Final report generated",
                "✅"
            )

            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            return WorkflowResult(
                workflow_type=GameWorkflowType.FINAL_REPORT,
                success=True,
                data=report_data,
                agent_log=self.agent_log.copy(),
                execution_time_ms=execution_time,
            )

        except Exception as e:
            logger.error(f"Final Report workflow failed: {e}")
            return WorkflowResult(
                workflow_type=GameWorkflowType.FINAL_REPORT,
                success=False,
                data={},
                errors=[str(e)],
                execution_time_ms=int((datetime.utcnow() - start_time).total_seconds() * 1000),
            )

    async def _generate_with_ai(
        self,
        system_prompt: str,
        user_prompt: str,
        expect_array: bool = False,
    ) -> Any:
        """Helper to generate content with AI."""
        
        if self.ai_config and self.ai_config.provider == AIProvider.OPENAI:
            api_key = get_openai_api_key_from_config(self.ai_config, self.db)
            if api_key:
                response = await call_openai_with_web_search(
                    api_key=api_key,
                    model=self.ai_config.model_name or "gpt-4o",
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    search_context_size="low",
                )
                if response:
                    try:
                        if expect_array:
                            json_start = response.find("[")
                            json_end = response.rfind("]") + 1
                        else:
                            json_start = response.find("{")
                            json_end = response.rfind("}") + 1
                        
                        if json_start >= 0 and json_end > json_start:
                            return json.loads(response[json_start:json_end])
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse OpenAI response as JSON")

        # Fallback to LangChain (if we have config)
        if self.ai_config:
            try:
                llm = get_llm_from_config(self.ai_config, self.db)
                if llm:
                    from langchain_core.messages import HumanMessage, SystemMessage
                    messages = [
                        SystemMessage(content=system_prompt),
                        HumanMessage(content=user_prompt),
                    ]
                    response = await llm.ainvoke(messages)
                    if response and response.content:
                        try:
                            if expect_array:
                                json_start = response.content.find("[")
                                json_end = response.content.rfind("]") + 1
                            else:
                                json_start = response.content.find("{")
                                json_end = response.content.rfind("}") + 1
                            
                            if json_start >= 0 and json_end > json_start:
                                return json.loads(response.content[json_start:json_end])
                        except json.JSONDecodeError:
                            pass
            except ValueError as e:
                logger.warning(f"Failed to get LLM from config: {e}")
        else:
            logger.warning("No AI config available - cannot generate AI content")

        return [] if expect_array else {}


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

async def run_game_workflow(
    workflow_type: GameWorkflowType,
    db: Session,
    ai_config: Optional[AIConfig],
    **kwargs
) -> WorkflowResult:
    """
    Convenience function to run a game workflow.
    
    Usage:
        result = await run_game_workflow(
            GameWorkflowType.INTELLIGENCE_BRIEFING,
            db=db,
            ai_config=user_ai_config,
            iso_code="DEU",
            country_name="Germany",
            metrics_data={...},
            context=country_context,
        )
    """
    orchestrator = GameWorkflowOrchestrator(db, ai_config)

    if workflow_type == GameWorkflowType.INTELLIGENCE_BRIEFING:
        return await orchestrator.run_intelligence_briefing(**kwargs)
    elif workflow_type == GameWorkflowType.STRATEGIC_ADVISOR:
        return await orchestrator.run_strategic_advisor(**kwargs)
    elif workflow_type == GameWorkflowType.NEWS_GENERATOR:
        return await orchestrator.run_news_generator(**kwargs)
    elif workflow_type == GameWorkflowType.FINAL_REPORT:
        return await orchestrator.run_final_report(**kwargs)
    else:
        return WorkflowResult(
            workflow_type=workflow_type,
            success=False,
            data={},
            errors=[f"Unknown workflow type: {workflow_type}"],
        )


async def run_all_mission_start_workflows(
    db: Session,
    ai_config: Optional[AIConfig],
    iso_code: str,
    country_name: str,
    metrics_data: Dict[str, Any],
    context: CountryContext,
) -> Dict[str, WorkflowResult]:
    """
    Run all workflows that should execute when a mission starts.
    
    This runs Intelligence Briefing and prepares initial Strategic Advisor content.
    """
    orchestrator = GameWorkflowOrchestrator(db, ai_config)

    # Run briefing workflow
    briefing_result = await orchestrator.run_intelligence_briefing(
        iso_code=iso_code,
        country_name=country_name,
        metrics_data=metrics_data,
        context=context,
    )

    return {
        "intelligence_briefing": briefing_result,
    }
