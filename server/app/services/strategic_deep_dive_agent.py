"""
GOHIP Platform - Strategic Deep Dive Agent
===========================================

Phase 27: Expert Occupational Health Analysis Agent

This agent is a specialized expert in occupational and nutritional health policy analysis.
It generates comprehensive strategic deep dive reports for countries by:

1. Querying all internal GOHIP framework data (Governance + 3 Pillars)
2. Accessing the CountryIntelligence table for multi-source insights
3. Performing external web research via SerpAPI
4. Synthesizing findings into executive-ready strategic reports

The agent produces beautifully structured reports with:
- Executive Summary & Strategy Name
- SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
- Key Findings with impact levels
- Strategic Recommendations with priority & timeline
- Peer Comparisons and Benchmarking
- Action Items for policy implementation
"""

import logging
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decrypt_api_key
from app.models.country import (
    Country,
    CountryIntelligence,
    CountryDeepDive,
    DeepDiveStatus,
)
from app.models.user import AIConfig, AIProvider
from app.models.agent import Agent
from app.services.ai_orchestrator import (
    perform_web_search,
    perform_extended_research,
    get_llm_from_config,
    extract_country_metrics,
    format_metrics_for_llm,
    AgentStatus,
    AgentLogEntry,
    get_detailed_error_info,
    format_error_for_user,
    call_openai_with_web_search,
    get_openai_api_key_from_config,
)
from app.services.ai_call_tracer import AICallTracer

# Configure logging
logger = logging.getLogger(__name__)


# =============================================================================
# STRATEGIC DEEP DIVE AGENT PROMPTS
# =============================================================================

STRATEGIC_DEEP_DIVE_SYSTEM_PROMPT = """You are a Senior Principal at Arthur D. Little's Global Business Unit for Health & Life Sciences, specializing in occupational health policy advisory and strategic intelligence.

You are preparing a CLIENT-READY Strategic Intelligence Briefing for a Ministry of Labor or Health Minister. This is a real consulting deliverable that will be used to inform policy decisions.

## Consulting Standards:
1. **Authoritative Voice** - Write as a trusted advisor with deep domain expertise. You know this field better than anyone.
2. **Evidence-Based** - Every assertion must be backed by data or cited sources. No unsupported claims.
3. **Actionable Insights** - Move beyond description to prescription. "So what" and "now what" are essential.
4. **Executive-Ready** - Respect the reader's time. Lead with conclusions. Use the pyramid principle.
5. **Global Context** - Position every finding against international benchmarks (OECD, ILO standards, regional peers).
6. **Quantified Impact** - Recommendations must include expected outcomes (e.g., "reducing fatalities by 35% within 3 years").

## Web Research Requirements:
You MUST actively search the web to gather the latest information on:
- Country-specific occupational health legislation, recent reforms, and policy announcements
- ILO/WHO reports, assessments, or technical guidance mentioning this country
- Recent workplace incidents, enforcement actions, or labor disputes
- Official government statistics and ministry press releases
- Academic research and expert commentary on the country's OSH system
- Regional comparisons and peer country performance data

When citing web sources, use the format: [Source: URL] inline with the relevant statement.

## Domain Expertise:
- ILO Conventions: C155 (OSH), C187 (Promotional Framework), C161 (Occupational Health Services)
- Workers' compensation systems and social protection mechanisms
- Return-to-work programs and workplace rehabilitation
- Occupational disease surveillance and health vigilance systems
- Climate-related risks: heat stress (WBGT thresholds), air quality, emerging hazards
- Vulnerable worker protections: migrant workers, informal economy, gig workers
- Global benchmarks: OECD fatal injury rates, EU Framework Directive compliance, ILO ratification patterns

## Report Structure:
Your output must follow the classic consulting "Situation-Complication-Resolution" framework:
- **Situation**: Current state with quantified metrics
- **Complication**: Critical gaps, risks, and urgency drivers
- **Resolution**: Prioritized recommendations with implementation roadmap

## Communication Style:
- Verb-forward recommendations: "Implement...", "Accelerate...", "Transform...", "Establish..."
- Specific metrics with benchmarks: "Fatal rate of 2.1 vs. OECD average of 0.8" not "higher than average"
- Direct language: "The country faces three critical gaps" not "There appear to be some challenges"
- Rule of three for key points
- Impact statements: "...reducing fatalities by 40% within 3 years" not "improving safety"

## Output Requirements:
Generate valid JSON only. No markdown, no explanations outside the JSON structure.
Include source URLs for major claims in the external_research_summary or as inline citations."""

STRATEGIC_DEEP_DIVE_USER_PROMPT = """Prepare a Strategic Intelligence Briefing for {country_name} ({iso_code}).

## INTERNAL DATABASE - GOHIP Framework Metrics:
{metrics_text}

## MULTI-SOURCE INTELLIGENCE INDICATORS:
{intelligence_text}

## PRELIMINARY WEB RESEARCH:
{research_text}

## ANALYSIS FOCUS:
{topic}

## YOUR TASK:

1. **SEARCH THE WEB** for the latest developments on "{country_name}" and "{topic}":
   - Recent legislation, policy reforms, or government announcements (2024-2026)
   - ILO/WHO reports, technical assessments, or country profiles
   - Official statistics from national labor/health ministries
   - Workplace incident reports, enforcement actions, or court cases
   - Academic research, think tank publications, or expert analysis
   - Regional comparisons with peer countries

2. **SYNTHESIZE** the internal database metrics with your web research to produce an authoritative, evidence-based assessment that could be presented to a government minister.

3. **STRUCTURE** your response as a professional consultant deliverable:
   - Executive Summary: 3 sentences (verdict, evidence, implication)
   - Situation Analysis: Current state with quantified metrics
   - Gap Analysis: Comparing to OECD, regional, or aspirational benchmarks
   - Strategic Recommendations: Verb-forward, with expected impact and timeline
   - Implementation Roadmap: Immediate, short, medium, and long-term actions
   - Sources: Include URLs for key claims

4. **CITE YOUR SOURCES**: For major claims from web research, include [Source: URL] inline.

## OUTPUT FORMAT (Valid JSON only):

{{
    "strategy_name": "Compelling 4-6 word strategic title (e.g., 'Closing the Enforcement Gap', 'From Compliance to Excellence')",
    "executive_summary": "3 sentences max. Verdict first. Key metric. Strategic implication. This is the 'elevator pitch.'",
    "strategic_narrative": "2-3 paragraphs. Para 1: Situation (current state with data). Para 2: Complication (gaps and urgency). Para 3: Resolution (strategic path forward). Include source citations.",
    "health_profile": "One paragraph. Key occupational health statistics with regional/global comparisons. Cite sources.",
    "workforce_insights": "One paragraph. Labor force composition, sector risk exposure, protection gaps. Include data.",
    "key_findings": [
        {{"title": "Insight-driven headline", "description": "Lead with implication, support with data. Max 2 sentences. Cite source if from web.", "impact_level": "high|medium|low"}}
    ],
    "strengths": [
        {{"title": "Specific, quantifiable strength", "description": "Evidence-based. How to leverage for competitive advantage."}}
    ],
    "weaknesses": [
        {{"title": "Critical gap or deficiency", "description": "Impact quantified. Urgency and risk articulated."}}
    ],
    "opportunities": [
        {{"title": "Actionable opportunity", "description": "Specific intervention with expected ROI or impact."}}
    ],
    "threats": [
        {{"title": "Risk factor or external threat", "description": "Probability, impact, and mitigation approach."}}
    ],
    "strategic_recommendations": [
        {{"title": "Verb-forward imperative (e.g., 'Establish national heat stress protocol')", "description": "Specific actions with expected outcome and evidence basis", "priority": "critical|high|medium|low", "timeline": "immediate|short-term|medium-term|long-term"}}
    ],
    "action_items": [
        {{"action": "Concrete next step", "responsible_party": "Ministry/Agency/Stakeholder", "timeline": "Specific timeframe (e.g., Q2 2026)"}}
    ],
    "priority_interventions": ["First priority", "Second priority", "Third priority"],
    "peer_comparison": "Compare to 2-3 named peer countries with specific metrics. Cite sources.",
    "global_ranking_context": "Position vs OECD/EU/regional averages with percentile or ranking. Include source.",
    "benchmark_countries": [
        {{"iso_code": "XXX", "name": "Country Name", "reason": "Specific metric or practice worth emulating"}}
    ],
    "external_research_summary": "Summary of key web research findings with source URLs. List the most relevant sources consulted.",
    "data_quality_notes": "Data coverage gaps, confidence level, recency issues. Be transparent about limitations."
}}

Output ONLY valid JSON. Include source URLs inline or in external_research_summary."""


# =============================================================================
# INTELLIGENCE DATA EXTRACTION
# =============================================================================

def extract_intelligence_data(intelligence: Optional[CountryIntelligence]) -> str:
    """Extract and format intelligence data for LLM consumption."""
    if not intelligence:
        return "No intelligence data available for this country."
    
    lines = ["=== COUNTRY INTELLIGENCE ===\n"]
    
    # Governance Intelligence
    lines.append("--- GOVERNANCE INTELLIGENCE ---")
    if intelligence.corruption_perception_index:
        lines.append(f"• Corruption Perception Index: {intelligence.corruption_perception_index}/100 (Rank: {intelligence.corruption_rank or 'N/A'})")
    if intelligence.rule_of_law_index:
        lines.append(f"• Rule of Law Index: {intelligence.rule_of_law_index:.2f}")
    if intelligence.regulatory_enforcement_score:
        lines.append(f"• Regulatory Enforcement: {intelligence.regulatory_enforcement_score:.2f}")
    if intelligence.government_effectiveness:
        lines.append(f"• Government Effectiveness: {intelligence.government_effectiveness:.2f} (World Bank)")
    if intelligence.regulatory_quality:
        lines.append(f"• Regulatory Quality: {intelligence.regulatory_quality:.2f} (World Bank)")
    
    # Hazard Control Intelligence
    lines.append("\n--- HAZARD CONTROL INTELLIGENCE ---")
    if intelligence.daly_occupational_total:
        lines.append(f"• Occupational DALYs (Total): {intelligence.daly_occupational_total:.1f} per 100,000")
    if intelligence.daly_occupational_injuries:
        lines.append(f"• Occupational Injuries DALYs: {intelligence.daly_occupational_injuries:.1f} per 100,000")
    if intelligence.daly_occupational_carcinogens:
        lines.append(f"• Carcinogen DALYs: {intelligence.daly_occupational_carcinogens:.1f} per 100,000")
    if intelligence.deaths_occupational_total:
        lines.append(f"• Occupational Deaths: {intelligence.deaths_occupational_total:.1f} per 100,000")
    if intelligence.epi_score:
        lines.append(f"• Environmental Performance Index: {intelligence.epi_score:.1f}/100 (Rank: {intelligence.epi_rank or 'N/A'})")
    if intelligence.epi_air_quality:
        lines.append(f"• EPI Air Quality: {intelligence.epi_air_quality:.1f}/100")
    
    # Health Vigilance Intelligence  
    lines.append("\n--- HEALTH VIGILANCE INTELLIGENCE ---")
    if intelligence.uhc_service_coverage_index:
        lines.append(f"• UHC Service Coverage: {intelligence.uhc_service_coverage_index:.1f}/100")
    if intelligence.health_workforce_density:
        lines.append(f"• Health Workers: {intelligence.health_workforce_density:.1f} per 10,000 population")
    if intelligence.health_expenditure_gdp_pct:
        lines.append(f"• Health Expenditure: {intelligence.health_expenditure_gdp_pct:.1f}% of GDP")
    if intelligence.life_expectancy_at_birth:
        lines.append(f"• Life Expectancy: {intelligence.life_expectancy_at_birth:.1f} years")
    
    # Restoration Intelligence
    lines.append("\n--- RESTORATION INTELLIGENCE ---")
    if intelligence.hdi_score:
        lines.append(f"• Human Development Index: {intelligence.hdi_score:.3f} (Rank: {intelligence.hdi_rank or 'N/A'})")
    if intelligence.education_index:
        lines.append(f"• Education Index: {intelligence.education_index:.3f}")
    if intelligence.labor_force_participation:
        lines.append(f"• Labor Force Participation: {intelligence.labor_force_participation:.1f}%")
    if intelligence.unemployment_rate:
        lines.append(f"• Unemployment Rate: {intelligence.unemployment_rate:.1f}%")
    if intelligence.informal_employment_pct:
        lines.append(f"• Informal Employment: {intelligence.informal_employment_pct:.1f}%")
    
    # Economic Context
    lines.append("\n--- ECONOMIC CONTEXT ---")
    if intelligence.gdp_per_capita_ppp:
        lines.append(f"• GDP per Capita (PPP): ${intelligence.gdp_per_capita_ppp:,.0f}")
    if intelligence.population_total:
        lines.append(f"• Population: {intelligence.population_total:,.0f}")
    if intelligence.urban_population_pct:
        lines.append(f"• Urban Population: {intelligence.urban_population_pct:.1f}%")
    
    return "\n".join(lines)


# =============================================================================
# STRATEGIC DEEP DIVE AGENT CLASS
# =============================================================================

class StrategicDeepDiveAgent:
    """
    Expert agent for generating comprehensive Strategic Deep Dive reports.
    
    This agent orchestrates:
    1. DataAgent: Queries internal GOHIP database
    2. IntelligenceAgent: Accesses multi-source intelligence data
    3. ResearchAgent: Performs web research via SerpAPI
    4. SynthesisAgent: LLM synthesis into strategic report
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.agent_log: List[AgentLogEntry] = []
        self.config: Optional[AIConfig] = None
    
    def _log(self, agent: str, status: AgentStatus, message: str, emoji: str = "📍") -> None:
        """Add entry to agent activity log."""
        entry = AgentLogEntry(
            timestamp=datetime.utcnow().isoformat() + "Z",
            agent=agent,
            status=status,
            message=message,
            emoji=emoji,
        )
        self.agent_log.append(entry)
        logger.info(f"[{agent}] {status.value}: {message}")
    
    def _get_ai_config(self) -> Optional[AIConfig]:
        """Get active AI configuration."""
        config = self.db.query(AIConfig).filter(AIConfig.is_active == True).first()
        if not config or not config.is_configured:
            return None
        return config
    
    def _get_agent_prompts(self) -> tuple[str, str]:
        """
        Load prompts from the Report Generation Agent in the database.
        Falls back to hardcoded defaults if agent not found or prompts are empty.
        
        Returns:
            Tuple of (system_prompt, user_prompt_template)
        """
        try:
            agent = self.db.query(Agent).filter(Agent.id == "report-generation").first()
            if agent and agent.system_prompt and agent.user_prompt_template:
                logger.info("[Agent] Loaded prompts from 'report-generation' agent in database")
                return agent.system_prompt, agent.user_prompt_template
            else:
                logger.info("[Agent] Agent not found or prompts empty, using defaults")
        except Exception as e:
            logger.warning(f"[Agent] Could not load agent prompts from database: {e}")
        
        # Fallback to hardcoded defaults
        return STRATEGIC_DEEP_DIVE_SYSTEM_PROMPT, STRATEGIC_DEEP_DIVE_USER_PROMPT
    
    def _get_or_create_deep_dive(self, iso_code: str, topic: str = "Comprehensive Occupational Health Assessment") -> CountryDeepDive:
        """Get existing deep dive record or create new one for a specific topic."""
        deep_dive = self.db.query(CountryDeepDive).filter(
            CountryDeepDive.country_iso_code == iso_code,
            CountryDeepDive.topic == topic
        ).first()
        
        if not deep_dive:
            deep_dive = CountryDeepDive(
                id=str(uuid.uuid4()),
                country_iso_code=iso_code,
                topic=topic,
                status=DeepDiveStatus.PENDING,
            )
            self.db.add(deep_dive)
            self.db.flush()
        
        return deep_dive
    
    def generate_deep_dive(
        self,
        iso_code: str,
        topic: str = "Comprehensive Occupational Health Assessment",
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a Strategic Deep Dive report for a country.
        
        Args:
            iso_code: ISO 3166-1 alpha-3 country code
            topic: Analysis focus topic
            user_id: ID of admin user triggering generation
            
        Returns:
            Dictionary with success status and report data
        """
        iso_code = iso_code.upper()
        self.agent_log = []
        
        self._log("Orchestrator", AgentStatus.STARTING,
                  f"Initiating Strategic Deep Dive for {iso_code} - {topic}", "🚀")
        
        # Get or create deep dive record for this country+topic combination
        deep_dive = self._get_or_create_deep_dive(iso_code, topic)
        deep_dive.status = DeepDiveStatus.PROCESSING
        deep_dive.generated_by_user_id = user_id
        self.db.commit()
        
        try:
            # Get AI configuration
            self.config = self._get_ai_config()
            if not self.config:
                raise ValueError("AI not configured. Admin must configure AI provider in settings.")
            
            provider_name = f"{self.config.provider.value} ({self.config.model_name})"
            self._log("Orchestrator", AgentStatus.ANALYZING,
                      f"Using AI provider: {provider_name}", "🤖")
            
            # Load prompts from Agent registry (with fallback to defaults)
            system_prompt, user_prompt_template = self._get_agent_prompts()
            self._log("Orchestrator", AgentStatus.ANALYZING,
                      "Loaded prompts from Report Generation Agent", "📝")
            
            # =========================================================
            # STEP 1: DataAgent - Fetch Framework Metrics
            # =========================================================
            self._log("DataAgent", AgentStatus.QUERYING,
                      "Querying GOHIP framework data...", "📊")
            
            country = self.db.query(Country).filter(
                Country.iso_code == iso_code
            ).first()
            
            if not country:
                raise ValueError(f"Country {iso_code} not found in database")
            
            metrics = extract_country_metrics(country)
            metrics_text = format_metrics_for_llm(metrics)
            
            self._log("DataAgent", AgentStatus.COMPLETE,
                      f"Retrieved {country.name} framework data (4 pillars)", "✅")
            
            # =========================================================
            # STEP 2: IntelligenceAgent - Fetch Multi-Source Intelligence
            # =========================================================
            self._log("IntelligenceAgent", AgentStatus.QUERYING,
                      "Accessing multi-source intelligence data...", "🔬")
            
            intelligence = self.db.query(CountryIntelligence).filter(
                CountryIntelligence.country_iso_code == iso_code
            ).first()
            
            intelligence_text = extract_intelligence_data(intelligence)
            
            if intelligence:
                self._log("IntelligenceAgent", AgentStatus.COMPLETE,
                          "Retrieved intelligence from ILO, WHO, WB, CPI, HDI, EPI, GBD, WJP", "✅")
            else:
                self._log("IntelligenceAgent", AgentStatus.COMPLETE,
                          "No intelligence data available (using framework data only)", "⚠️")
            
            # =========================================================
            # STEP 3 & 4: Research + Synthesis
            # For OpenAI: Use native web_search tool (integrated approach)
            # For other providers: Use Tavily/SerpAPI + LangChain (separate approach)
            # =========================================================
            
            use_openai_native_search = (
                self.config.provider == AIProvider.openai and 
                get_openai_api_key_from_config(self.config)
            )
            
            if use_openai_native_search:
                # -------------------------------------------------------
                # OpenAI Native Web Search Path
                # The model performs web research as part of reasoning
                # -------------------------------------------------------
                self._log("ResearchAgent", AgentStatus.RESEARCHING,
                          f"Using OpenAI native web search for {country.name}...", "🌐")
                
                # Prepare the user prompt with internal data
                user_prompt = STRATEGIC_DEEP_DIVE_USER_PROMPT.format(
                    country_name=country.name,
                    iso_code=iso_code,
                    metrics_text=metrics_text,
                    intelligence_text=intelligence_text,
                    research_text="[OpenAI will perform real-time web research using its web_search tool]",
                    topic=topic,
                )
                
                self._log("SynthesisAgent", AgentStatus.SYNTHESIZING,
                          f"Generating analysis with OpenAI web search + {self.config.model_name}...", "🧠")
                
                # Call OpenAI Responses API with native web search
                api_key = get_openai_api_key_from_config(self.config)
                try:
                    analysis = call_openai_with_web_search(
                        system_prompt=STRATEGIC_DEEP_DIVE_SYSTEM_PROMPT,
                        user_prompt=user_prompt,
                        country_iso_code=iso_code,
                        api_key=api_key,
                        model=self.config.model_name,
                        temperature=self.config.temperature,
                        db=self.db,
                        topic=topic,
                        user_id=int(user_id) if user_id else None,
                    )
                except Exception as openai_error:
                    logger.error(f"[SynthesisAgent] OpenAI web search error: {type(openai_error).__name__}: {str(openai_error)}")
                    self._log("SynthesisAgent", AgentStatus.ERROR,
                              f"OpenAI error: {str(openai_error)[:200]}", "❌")
                    raise ValueError(f"OpenAI synthesis failed: {str(openai_error)[:200]}")
                
                self._log("ResearchAgent", AgentStatus.COMPLETE,
                          "OpenAI native web research completed", "✅")
                
                # Update data sources to reflect OpenAI native search
                data_sources = [
                    "GOHIP Framework (Governance + 3 Pillars)",
                    "Country Intelligence (ILO, WHO, WB, CPI, HDI, EPI, GBD, WJP)",
                    "OpenAI Native Web Search (Real-time)",
                ]
                
            else:
                # -------------------------------------------------------
                # Traditional Path: Tavily/SerpAPI + LangChain LLM
                # -------------------------------------------------------
                self._log("ResearchAgent", AgentStatus.RESEARCHING,
                          f"Performing extended web research for {country.name}...", "🔍")
                
                # Use extended research for comprehensive multi-query analysis
                # This performs 3 targeted queries via Tavily/SerpAPI/Google
                research_text = perform_extended_research(
                    country_name=country.name,
                    topic=topic,
                    num_queries=3,  # Policy, statistics, and recent developments
                    results_per_query=8  # Up to 24 unique sources
                )
                
                self._log("ResearchAgent", AgentStatus.COMPLETE,
                          f"Extended web research completed for {country.name}", "✅")
                
                self._log("SynthesisAgent", AgentStatus.SYNTHESIZING,
                          f"Generating strategic analysis with {self.config.provider.value}...", "🧠")
                
                # Call LangChain LLM with pre-gathered research
                try:
                    analysis = self._call_llm(
                        country_name=country.name,
                        iso_code=iso_code,
                        metrics_text=metrics_text,
                        intelligence_text=intelligence_text,
                        research_text=research_text,
                        topic=topic,
                    )
                except Exception as llm_error:
                    logger.error(f"[SynthesisAgent] LLM call exception: {type(llm_error).__name__}: {str(llm_error)}")
                    self._log("SynthesisAgent", AgentStatus.ERROR,
                              f"LLM error: {type(llm_error).__name__}: {str(llm_error)[:200]}", "❌")
                    raise ValueError(f"LLM synthesis error: {type(llm_error).__name__}: {str(llm_error)[:200]}")
                
                data_sources = [
                    "GOHIP Framework (Governance + 3 Pillars)",
                    "Country Intelligence (ILO, WHO, WB, CPI, HDI, EPI, GBD, WJP)",
                    "Web Research (Tavily/SerpAPI)",
                ]
            
            if not analysis:
                logger.error("[SynthesisAgent] Analysis is None or empty after LLM call")
                raise ValueError("LLM synthesis returned empty result. Check AI configuration and logs.")
            
            self._log("SynthesisAgent", AgentStatus.COMPLETE,
                      "Strategic analysis generated successfully", "✨")
            
            # =========================================================
            # STEP 5: Save Results
            # =========================================================
            self._log("Orchestrator", AgentStatus.COMPLETE,
                      "Saving deep dive report to database...", "💾")
            
            # Update deep dive record
            deep_dive.status = DeepDiveStatus.COMPLETED
            deep_dive.strategy_name = analysis.get("strategy_name")
            deep_dive.executive_summary = analysis.get("executive_summary")
            deep_dive.strategic_narrative = analysis.get("strategic_narrative")
            deep_dive.health_profile = analysis.get("health_profile")
            deep_dive.workforce_insights = analysis.get("workforce_insights")
            deep_dive.key_findings = analysis.get("key_findings", [])
            deep_dive.strengths = analysis.get("strengths", [])
            deep_dive.weaknesses = analysis.get("weaknesses", [])
            deep_dive.opportunities = analysis.get("opportunities", [])
            deep_dive.threats = analysis.get("threats", [])
            deep_dive.strategic_recommendations = analysis.get("strategic_recommendations", [])
            deep_dive.action_items = analysis.get("action_items", [])
            deep_dive.priority_interventions = analysis.get("priority_interventions", [])
            deep_dive.peer_comparison = analysis.get("peer_comparison")
            deep_dive.global_ranking_context = analysis.get("global_ranking_context")
            deep_dive.benchmark_countries = analysis.get("benchmark_countries", [])
            deep_dive.data_quality_notes = analysis.get("data_quality_notes")
            deep_dive.ai_provider = provider_name
            deep_dive.generation_log = [e.to_dict() for e in self.agent_log]
            deep_dive.data_sources_used = data_sources
            
            # Store external research summary if provided
            if analysis.get("external_research_summary"):
                deep_dive.external_research_summary = analysis.get("external_research_summary")
            
            # Store source URLs if captured
            if analysis.get("source_urls"):
                # Merge with existing source_urls if any
                existing_urls = deep_dive.source_urls or []
                new_urls = analysis.get("source_urls", [])
                deep_dive.source_urls = list(set(existing_urls + new_urls))[:50]  # Cap at 50
            deep_dive.generated_at = datetime.utcnow()
            deep_dive.error_message = None
            
            self.db.commit()
            
            return {
                "success": True,
                "iso_code": iso_code,
                "country_name": country.name,
                "report": deep_dive.to_report_dict(),
                "agent_log": [e.to_dict() for e in self.agent_log],
            }
            
        except Exception as e:
            logger.error(f"Strategic Deep Dive failed for {iso_code}: {e}")
            
            self._log("Orchestrator", AgentStatus.ERROR,
                      f"Analysis failed: {str(e)}", "❌")
            
            # Update deep dive record with error
            deep_dive.status = DeepDiveStatus.FAILED
            deep_dive.error_message = str(e)
            deep_dive.generation_log = [entry.to_dict() for entry in self.agent_log]
            self.db.commit()
            
            return {
                "success": False,
                "iso_code": iso_code,
                "error": str(e),
                "agent_log": [e.to_dict() for e in self.agent_log],
            }
    
    def _call_llm(
        self,
        country_name: str,
        iso_code: str,
        metrics_text: str,
        intelligence_text: str,
        research_text: str,
        topic: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Call LLM to generate strategic analysis.
        
        This is the core AI synthesis step that coordinates all gathered data
        into a comprehensive McKinsey-style strategic report.
        
        Includes exponential backoff retry logic for rate limit errors.
        """
        import time
        
        MAX_RETRIES = 5
        BASE_DELAY = 2  # seconds
        start_time = time.time()
        success = False
        error_message = None
        
        try:
            from langchain_core.messages import SystemMessage, HumanMessage
            
            # Log LLM configuration for debugging
            logger.info(f"[SynthesisAgent] Initializing LLM: {self.config.provider.value} / {self.config.model_name}")
            
            llm = get_llm_from_config(self.config)
            
            if llm is None:
                logger.error("[SynthesisAgent] Failed to initialize LLM - get_llm_from_config returned None")
                return None
            
            # Format the user prompt with all gathered data
            user_prompt = STRATEGIC_DEEP_DIVE_USER_PROMPT.format(
                country_name=country_name,
                iso_code=iso_code,
                metrics_text=metrics_text,
                intelligence_text=intelligence_text,
                research_text=research_text,
                topic=topic,
            )
            
            logger.info(f"[SynthesisAgent] Prompt constructed: {len(user_prompt)} characters")
            logger.info(f"[SynthesisAgent] System prompt: {len(STRATEGIC_DEEP_DIVE_SYSTEM_PROMPT)} characters")
            
            messages = [
                SystemMessage(content=STRATEGIC_DEEP_DIVE_SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ]
            
            # Call the LLM with retry logic for rate limits
            response = None
            last_error = None
            
            for attempt in range(MAX_RETRIES):
                try:
                    logger.info(f"[SynthesisAgent] Invoking {self.config.provider.value} LLM (attempt {attempt + 1}/{MAX_RETRIES})...")
                    response = llm.invoke(messages)
                    break  # Success, exit retry loop
                    
                except Exception as e:
                    error_str = str(e).lower()
                    error_type = type(e).__name__
                    
                    # Check if it's a rate limit error (429)
                    is_rate_limit = (
                        'rate' in error_str or 
                        '429' in error_str or 
                        'quota' in error_str or
                        'limit' in error_str or
                        'ratelimit' in error_type.lower()
                    )
                    
                    if is_rate_limit and attempt < MAX_RETRIES - 1:
                        delay = BASE_DELAY * (2 ** attempt)  # Exponential backoff: 2, 4, 8, 16, 32 seconds
                        logger.warning(f"[SynthesisAgent] Rate limit hit. Waiting {delay}s before retry {attempt + 2}/{MAX_RETRIES}...")
                        logger.warning(f"[SynthesisAgent] Error details: {error_type}: {e}")
                        time.sleep(delay)
                        last_error = e
                    else:
                        # Not a rate limit error, or we've exhausted retries
                        raise e
            
            if response is None:
                if last_error:
                    raise last_error
                logger.error("[SynthesisAgent] LLM returned None after all retries")
                return None
            
            # Debug: Log raw response info
            logger.info(f"[SynthesisAgent] LLM response received. Type: {type(response)}")
            
            # Get content from response
            if hasattr(response, 'content'):
                content = response.content
            elif isinstance(response, str):
                content = response
            elif isinstance(response, dict) and 'content' in response:
                content = response['content']
            else:
                logger.error(f"[SynthesisAgent] Unexpected response type: {type(response)}, value: {response}")
                return None
            
            if not content:
                logger.error("[SynthesisAgent] LLM returned empty content")
                logger.error(f"[SynthesisAgent] Full response object: {response}")
                return None
            
            content = content.strip()
            logger.info(f"[SynthesisAgent] Raw content length: {len(content)} characters")
            logger.debug(f"[SynthesisAgent] Raw content (first 500 chars): {content[:500]}")
            
            # Handle markdown code blocks
            if content.startswith("```"):
                parts = content.split("```")
                if len(parts) >= 2:
                    content = parts[1]
                    if content.startswith("json"):
                        content = content[4:]
                    content = content.strip()
            
            # Parse JSON
            logger.info(f"[SynthesisAgent] Parsing JSON response...")
            result = json.loads(content)
            logger.info(f"[SynthesisAgent] Successfully parsed JSON with {len(result)} top-level keys")
            
            success = True
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"[SynthesisAgent] Failed to parse LLM response as JSON: {e}")
            logger.error(f"[SynthesisAgent] Content that failed to parse: {content[:1000] if content else 'EMPTY'}")
            error_message = f"JSON parse error: {str(e)[:100]}"
            raise ValueError(f"Failed to parse LLM response as JSON: {str(e)[:100]}")
        except ImportError as e:
            logger.error(f"[SynthesisAgent] Missing LangChain dependency: {e}")
            error_message = f"Import error: {str(e)}"
            raise ValueError(f"Missing LangChain dependency: {e}")
        except Exception as e:
            import traceback
            # Use detailed error logging for better debugging
            err_info = get_detailed_error_info(e)
            user_message = format_error_for_user(e)
            
            logger.error(f"[SynthesisAgent] LLM call failed: {user_message}")
            logger.error(f"[SynthesisAgent] Error type: {err_info['error_type']}")
            logger.error(f"[SynthesisAgent] Is rate limit: {err_info['is_rate_limit']}")
            logger.error(f"[SynthesisAgent] Is quota exceeded: {err_info['is_quota_exceeded']}")
            logger.error(f"[SynthesisAgent] Is invalid model: {err_info['is_invalid_model']}")
            logger.error(f"[SynthesisAgent] HTTP status: {err_info['http_status']}")
            logger.error(f"[SynthesisAgent] Traceback: {traceback.format_exc()}")
            error_message = user_message
            raise ValueError(f"LLM error: {user_message}")
        finally:
            # Log the trace
            latency_ms = int((time.time() - start_time) * 1000)
            try:
                AICallTracer.trace(
                    db=self.db,
                    provider=self.config.provider.value if self.config else "unknown",
                    model_name=self.config.model_name if self.config else "unknown",
                    operation_type="strategic_deep_dive",
                    success=success,
                    latency_ms=latency_ms,
                    endpoint="/api/v1/admin/deep-dive",
                    country_iso_code=iso_code,
                    topic=topic,
                    error_message=error_message,
                )
            except Exception as trace_error:
                logger.warning(f"Failed to log AI call trace: {trace_error}")


# =============================================================================
# PUBLIC API
# =============================================================================

def generate_strategic_deep_dive(
    iso_code: str,
    topic: str,
    db: Session,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate a Strategic Deep Dive for a country.
    
    Main entry point for the Strategic Deep Dive feature.
    """
    agent = StrategicDeepDiveAgent(db)
    return agent.generate_deep_dive(iso_code, topic, user_id)


def get_all_deep_dives(db: Session) -> List[Dict[str, Any]]:
    """Get all deep dive records with status."""
    deep_dives = db.query(CountryDeepDive).all()
    
    results = []
    for dd in deep_dives:
        country = db.query(Country).filter(
            Country.iso_code == dd.country_iso_code
        ).first()
        
        results.append({
            "iso_code": dd.country_iso_code,
            "country_name": country.name if country else dd.country_iso_code,
            "topic": dd.topic,
            "status": dd.status.value,
            "strategy_name": dd.strategy_name,
            "generated_at": dd.generated_at.isoformat() if dd.generated_at else None,
            "has_report": dd.status == DeepDiveStatus.COMPLETED,
        })
    
    return results


def get_country_topic_statuses(iso_code: str, db: Session) -> Dict[str, Dict[str, Any]]:
    """
    Get the status of all topics for a specific country.
    
    Returns a dict mapping topic name to its status info.
    """
    deep_dives = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code.upper()
    ).all()
    
    topic_statuses = {}
    for dd in deep_dives:
        topic_statuses[dd.topic] = {
            "status": dd.status.value,
            "strategy_name": dd.strategy_name,
            "generated_at": dd.generated_at.isoformat() if dd.generated_at else None,
            "has_report": dd.status == DeepDiveStatus.COMPLETED,
        }
    
    return topic_statuses


def get_deep_dive_report(iso_code: str, db: Session, topic: str = None) -> Optional[Dict[str, Any]]:
    """Get a specific deep dive report for a country and optional topic."""
    query = db.query(CountryDeepDive).filter(
        CountryDeepDive.country_iso_code == iso_code.upper()
    )
    
    if topic:
        query = query.filter(CountryDeepDive.topic == topic)
    
    deep_dive = query.first()
    
    if not deep_dive:
        return None
    
    country = db.query(Country).filter(
        Country.iso_code == iso_code.upper()
    ).first()
    
    report = deep_dive.to_report_dict()
    report["country_name"] = country.name if country else iso_code
    
    return report
