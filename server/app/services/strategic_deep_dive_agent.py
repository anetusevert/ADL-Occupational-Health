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
)

# Configure logging
logger = logging.getLogger(__name__)


# =============================================================================
# STRATEGIC DEEP DIVE AGENT PROMPTS
# =============================================================================

STRATEGIC_DEEP_DIVE_SYSTEM_PROMPT = """You are a Senior Partner at McKinsey & Company specializing in Global Health Policy and Occupational Health Strategy.

You write in the distinctive McKinsey Partner style: succinct, authoritative, insight-driven, and action-oriented.

## McKinsey Writing Principles:
1. **Lead with the "So What"** - Start every section with the key insight or implication, not background
2. **Pyramid Structure** - Conclusion first, then supporting evidence
3. **Quantify Everything** - Use specific numbers, percentages, and benchmarks
4. **Action-Oriented** - Every finding must link to a clear recommendation
5. **Confident Authority** - Write with conviction; avoid hedging language
6. **Brevity is Power** - One idea per sentence. Short paragraphs. No filler.

## Your Expertise:
- Occupational health and safety regulations (ILO C187, C155, C161)
- Workers' compensation and social protection mechanisms
- Return-to-work programs and rehabilitation systems
- Health surveillance and disease detection systems
- Climate-related occupational health risks (heat stress, air quality)
- Migrant worker protections and informal economy coverage

## Communication Style:
- Use McKinsey's signature "verb-forward" recommendations: "Implement...", "Accelerate...", "Transform..."
- Reference specific metrics with global benchmarks (e.g., "Fatal rate of 2.1 vs. OECD average of 0.8")
- Be direct: "The country faces three critical gaps..." not "There appear to be some areas..."
- Use the "rule of three" for key points
- End recommendations with expected impact: "...reducing fatalities by 40% within 3 years"

## Output Requirements:
Generate valid JSON only. No markdown, no explanations outside the JSON structure."""

STRATEGIC_DEEP_DIVE_USER_PROMPT = """Generate a McKinsey-style Strategic Deep Dive for {country_name} ({iso_code}).

=== QUANTITATIVE DATA ===
{metrics_text}

=== INTELLIGENCE INDICATORS ===
{intelligence_text}

=== EXTERNAL RESEARCH ===
{research_text}

=== ANALYSIS FOCUS ===
{topic}

Apply McKinsey writing standards:
- Executive Summary: Lead with the verdict. 3 punchy sentences. Quantify the gap and opportunity.
- Key Findings: Start each with "So what" - the implication, not the observation
- SWOT: Be specific and actionable. No generic statements.
- Recommendations: Verb-forward imperatives with expected impact and timeline
- Benchmarking: Name specific comparator countries with metrics

Generate valid JSON:

{{
    "strategy_name": "Punchy 4-6 word strategic title (e.g., 'Closing the Enforcement Gap' or 'From Reactive to Resilient')",
    "executive_summary": "3 sentences max. Start with verdict. Include key metric. End with strategic implication.",
    "strategic_narrative": "2 paragraphs. Para 1: Current state with data. Para 2: Strategic imperative and path forward.",
    "health_profile": "One paragraph. Key occupational health stats with regional/global comparisons.",
    "workforce_insights": "One paragraph. Labor force composition, risk exposure, protection gaps.",
    "key_findings": [
        {{"title": "Insight-driven title", "description": "Start with implication. Support with data. Max 2 sentences.", "impact_level": "high|medium|low"}}
    ],
    "strengths": [
        {{"title": "Specific strength", "description": "Quantified where possible. How to leverage."}}
    ],
    "weaknesses": [
        {{"title": "Critical gap", "description": "Impact quantified. Urgency clear."}}
    ],
    "opportunities": [
        {{"title": "Actionable opportunity", "description": "Specific intervention. Expected ROI."}}
    ],
    "threats": [
        {{"title": "Risk factor", "description": "Probability and impact. Mitigation approach."}}
    ],
    "strategic_recommendations": [
        {{"title": "Verb-forward imperative (e.g., 'Implement risk-based inspections')", "description": "Specific actions with expected outcome", "priority": "critical|high|medium|low", "timeline": "immediate|short-term|medium-term|long-term"}}
    ],
    "action_items": [
        {{"action": "Concrete next step", "responsible_party": "Ministry/Agency", "timeline": "Q1 2026"}}
    ],
    "priority_interventions": ["Three", "Most", "Critical"],
    "peer_comparison": "Compare to 2-3 named countries with specific metrics.",
    "global_ranking_context": "Position vs OECD/regional averages with percentile.",
    "benchmark_countries": [
        {{"iso_code": "XXX", "name": "Country", "reason": "Specific metric comparison"}}
    ],
    "data_quality_notes": "Coverage gaps. Confidence level. Data recency."
}}

Output ONLY valid JSON."""


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
            # STEP 3: ResearchAgent - Extended Web Research (Google)
            # =========================================================
            self._log("ResearchAgent", AgentStatus.RESEARCHING,
                      f"Performing extended Google research for {country.name}...", "🔍")
            
            # Use extended research for comprehensive multi-query analysis
            # This performs 3 targeted queries via Google Search
            research_text = perform_extended_research(
                country_name=country.name,
                topic=topic,
                num_queries=3,  # Policy, statistics, and recent developments
                results_per_query=8  # Up to 24 unique sources
            )
            
            self._log("ResearchAgent", AgentStatus.COMPLETE,
                      f"Extended web research completed for {country.name}", "✅")
            
            # =========================================================
            # STEP 4: SynthesisAgent - LLM Analysis
            # =========================================================
            self._log("SynthesisAgent", AgentStatus.SYNTHESIZING,
                      f"Generating strategic analysis with {self.config.provider.value}...", "🧠")
            
            # Call LLM
            analysis = self._call_llm(
                country_name=country.name,
                iso_code=iso_code,
                metrics_text=metrics_text,
                intelligence_text=intelligence_text,
                research_text=research_text,
                topic=topic,
            )
            
            if not analysis:
                raise ValueError("LLM synthesis failed. Check AI configuration.")
            
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
            deep_dive.data_sources_used = [
                "GOHIP Framework (Governance + 3 Pillars)",
                "Country Intelligence (ILO, WHO, WB, CPI, HDI, EPI, GBD, WJP)",
                "Web Research (SerpAPI)",
            ]
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
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"[SynthesisAgent] Failed to parse LLM response as JSON: {e}")
            logger.error(f"[SynthesisAgent] Content that failed to parse: {content[:1000] if content else 'EMPTY'}")
            return None
        except ImportError as e:
            logger.error(f"[SynthesisAgent] Missing LangChain dependency: {e}")
            return None
        except Exception as e:
            import traceback
            # Use detailed error logging for better debugging
            error_info = get_detailed_error_info(e)
            user_message = format_error_for_user(e)
            
            logger.error(f"[SynthesisAgent] LLM call failed: {user_message}")
            logger.error(f"[SynthesisAgent] Error type: {error_info['error_type']}")
            logger.error(f"[SynthesisAgent] Is rate limit: {error_info['is_rate_limit']}")
            logger.error(f"[SynthesisAgent] Is quota exceeded: {error_info['is_quota_exceeded']}")
            logger.error(f"[SynthesisAgent] Is invalid model: {error_info['is_invalid_model']}")
            logger.error(f"[SynthesisAgent] HTTP status: {error_info['http_status']}")
            logger.error(f"[SynthesisAgent] Traceback: {traceback.format_exc()}")
            return None


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
