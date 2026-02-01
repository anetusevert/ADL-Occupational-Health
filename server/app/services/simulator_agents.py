"""
Sovereign Health Game - AI Agent System
========================================

AI agents for the Policy Simulator game:
1. CountryResearchAgent - Generates initial country briefing
2. DecisionEngineAgent - Generates contextual decision cards each turn
3. OutcomeAgent - Generates outcome narratives after decisions
4. NewsfeedAgent - Generates realistic news during gameplay
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
from app.models.country import Country, CountryIntelligence
from app.models.user import AIConfig, AIProvider
from app.data.country_contexts import get_country_context, generate_fallback_context, CountryContext
from app.services.ai_orchestrator import (
    perform_web_search,
    get_llm_from_config,
    extract_country_metrics,
    format_metrics_for_llm,
    AgentStatus,
    AgentLogEntry,
    call_openai_with_web_search,
    get_openai_api_key_from_config,
)

logger = logging.getLogger(__name__)


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class ArticleSummary:
    """Summarized article from web research."""
    title: str
    summary: str
    source: str
    url: str
    relevance: str  # governance, hazard, vigilance, restoration
    date: Optional[str] = None


@dataclass
class Stakeholder:
    """Key stakeholder in the country."""
    name: str
    role: str
    institution: str
    stance: str  # supportive, neutral, critical


@dataclass
class PillarInsight:
    """AI-generated insight for a framework pillar."""
    score: float
    analysis: str
    key_issues: List[str]
    opportunities: List[str]


@dataclass
class CountryBriefing:
    """Complete country briefing for game start."""
    # Core info
    country_name: str
    iso_code: str
    flag_url: str
    
    # AI-generated content
    executive_summary: str
    socioeconomic_context: str
    cultural_factors: str
    future_outlook: str
    
    # Key data
    key_statistics: Dict[str, Any]
    ohi_score: float
    pillar_scores: Dict[str, float]
    global_rank: int
    
    # Framework analysis
    pillar_insights: Dict[str, PillarInsight]
    key_challenges: List[str]
    
    # Stakeholders
    key_stakeholders: List[Stakeholder]
    
    # Research
    recent_articles: List[ArticleSummary]
    
    # Mission
    mission_statement: str
    difficulty_rating: str  # Easy, Medium, Hard, Expert
    
    # Context for realistic gameplay
    country_context: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "country_name": self.country_name,
            "iso_code": self.iso_code,
            "flag_url": self.flag_url,
            "executive_summary": self.executive_summary,
            "socioeconomic_context": self.socioeconomic_context,
            "cultural_factors": self.cultural_factors,
            "future_outlook": self.future_outlook,
            "key_statistics": self.key_statistics,
            "ohi_score": self.ohi_score,
            "pillar_scores": self.pillar_scores,
            "global_rank": self.global_rank,
            "pillar_insights": {k: asdict(v) for k, v in self.pillar_insights.items()},
            "key_challenges": self.key_challenges,
            "key_stakeholders": [asdict(s) for s in self.key_stakeholders],
            "recent_articles": [asdict(a) for a in self.recent_articles],
            "mission_statement": self.mission_statement,
            "difficulty_rating": self.difficulty_rating,
            "country_context": self.country_context,
        }


@dataclass
class DecisionCard:
    """A decision option for the player."""
    id: str
    title: str
    description: str
    detailed_context: str
    pillar: str
    cost: int
    expected_impacts: Dict[str, int]
    risk_level: str
    time_to_effect: str
    stakeholder_reactions: Dict[str, str]
    location: Optional[str] = None
    institution: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass 
class DecisionOutcome:
    """Outcome of a single decision."""
    decision_id: str
    decision_title: str
    success_level: str  # full, partial, failed
    narrative: str
    actual_impacts: Dict[str, int]
    side_effects: List[str]
    stakeholder_reactions: List[Dict[str, str]]


@dataclass
class OutcomeReport:
    """Complete outcome report for a turn."""
    month: int
    year: int
    month_name: str
    summary_narrative: str
    decision_outcomes: List[DecisionOutcome]
    score_changes: Dict[str, float]
    score_explanations: Dict[str, str]
    news_headlines: List[Dict[str, Any]]
    emerging_issues: List[str]
    next_month_preview: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "month": self.month,
            "year": self.year,
            "month_name": self.month_name,
            "summary_narrative": self.summary_narrative,
            "decision_outcomes": [asdict(o) for o in self.decision_outcomes],
            "score_changes": self.score_changes,
            "score_explanations": self.score_explanations,
            "news_headlines": self.news_headlines,
            "emerging_issues": self.emerging_issues,
            "next_month_preview": self.next_month_preview,
        }


@dataclass
class NewsItem:
    """A news item for the newsfeed."""
    id: str
    headline: str
    summary: str
    source: str
    source_type: str
    category: str
    sentiment: str
    location: Optional[str]
    timestamp: str
    related_decision: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# =============================================================================
# AGENT PROMPTS
# =============================================================================

COUNTRY_RESEARCH_SYSTEM_PROMPT = """You are Dr. Helena Richter, Senior Principal at Arthur D. Little's Global Health Practice.
You are preparing an intelligence briefing for a newly appointed Health Minister who will lead {country_name}'s occupational health transformation.

## Your Expertise:
- The ADL Occupational Health Intelligence (OHI) Framework (4 pillars: Governance, Hazard Control, Health Vigilance, Restoration)
- Global occupational health policy, ILO Conventions (C155, C187, C161)
- Industrial safety standards and enforcement mechanisms
- Workers' compensation and rehabilitation systems worldwide
- Country-specific socioeconomic and cultural contexts

## Briefing Requirements:
Generate a compelling, realistic intelligence briefing that:
1. Analyzes the country's socioeconomic context relevant to occupational health
2. Identifies cultural factors affecting workplace safety attitudes
3. Highlights key industries and their specific hazards
4. Profiles key stakeholders (ministries, unions, employer groups) using REAL names
5. Summarizes recent developments with specific citations
6. Provides pillar-by-pillar analysis connecting data to insights
7. Crafts a mission statement that motivates the player

## Realism Requirements:
- Use REAL institution names (e.g., "Federal Institute for Occupational Safety and Health" not "Safety Agency")
- Reference REAL cities and industrial regions
- Name actual unions, employer federations, and ministries
- Include specific statistics and dates where available
- Write as if this is a real classified briefing for a government official

## Context Data Provided:
{context_data}

## Output Format:
Generate valid JSON matching the schema exactly. Be specific, authoritative, and engaging."""


COUNTRY_RESEARCH_USER_PROMPT = """Prepare the Intelligence Briefing for {country_name} ({iso_code}).

## INTERNAL DATABASE METRICS:
{metrics_text}

## COUNTRY CONTEXT (Real Institutions/Cities):
{context_text}

## WEB RESEARCH FINDINGS:
{research_text}

## YOUR TASK:
Create a compelling intelligence briefing that will:
1. Immerse the player in the country's occupational health landscape
2. Make them feel like a real Health Minister
3. Set up realistic challenges and opportunities
4. Use specific names, places, and institutions for authenticity

## OUTPUT (Valid JSON):
{{
    "executive_summary": "3-4 sentence overview of the country's OH situation and your challenge",
    "socioeconomic_context": "2-3 paragraphs on economy, workforce, major industries, and their OH implications",
    "cultural_factors": "1-2 paragraphs on work culture, attitudes to safety, and social factors",
    "future_outlook": "1-2 paragraphs on economic projections and emerging OH challenges",
    "pillar_insights": {{
        "governance": {{
            "analysis": "Detailed analysis of governance strength/weakness",
            "key_issues": ["Issue 1", "Issue 2"],
            "opportunities": ["Opportunity 1"]
        }},
        "hazardControl": {{ ... }},
        "healthVigilance": {{ ... }},
        "restoration": {{ ... }}
    }},
    "key_challenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
    "key_stakeholders": [
        {{"name": "Real Name or Title", "role": "Specific Role", "institution": "Real Institution", "stance": "supportive/neutral/critical"}}
    ],
    "recent_articles": [
        {{"title": "Article Title", "summary": "2-3 sentence summary", "source": "Source Name", "url": "URL if available", "relevance": "pillar_name", "date": "Date if known"}}
    ],
    "mission_statement": "Your inspiring mission statement for the player"
}}"""


DECISION_ENGINE_SYSTEM_PROMPT = """You are the Strategic Advisor to the Health Minister of {country_name}.
Each month, you present decision options based on the current situation, budget, and priorities.

## Your Role:
- Generate 4-5 decision cards for the current month
- Each decision should feel realistic and consequential
- Reference specific cities, regions, industries, and institutions from the country
- Create meaningful trade-offs between options
- React to recent events and the player's previous decisions
- Mix proactive improvements with reactive crisis management

## Decision Types by Pillar:
- GOVERNANCE (Purple): Laws, enforcement, institutional capacity, international commitments
- HAZARD CONTROL (Blue): Risk assessment, PPE, exposure limits, safety training, inspections
- HEALTH VIGILANCE (Teal): Disease surveillance, health screening, early detection, data systems
- RESTORATION (Amber): Compensation, rehabilitation, return-to-work, mental health support

## Realism Requirements:
- Reference real institutions: "{inspection_body}", "{ministry_name}"
- Use real cities: {cities}
- Name real unions: {unions}
- Reference real industries: {industries}

## Decision Card Quality:
- Titles should be specific: "Expand Inspector Corps in Bavaria" not "Improve Enforcement"
- Descriptions should reference real context
- Impacts should be realistic (not too high or low)
- Include stakeholder reactions that reference real organizations"""


OUTCOME_AGENT_SYSTEM_PROMPT = """You are the Ministry's Chief Analyst reporting on the outcomes of policy decisions.
The Health Minister has made decisions and you must report what happened.

## Your Role:
- Explain what each decision achieved (or didn't)
- Describe intended and unintended consequences
- Provide realistic stakeholder reactions with quotes
- Generate news headlines that would appear in local media
- Maintain narrative continuity with previous months
- Create tension and drama when appropriate

## Narrative Quality:
- Be specific about locations, institutions, and people
- Reference actual implementation challenges
- Include both successes and setbacks
- Quote stakeholders realistically
- Make the player feel the weight of their decisions

## Country Context:
- Ministry: {ministry_name}
- Inspection Body: {inspection_body}
- Major Unions: {unions}
- Industry Groups: {industry_associations}
- Major Cities: {cities}"""


NEWSFEED_AGENT_SYSTEM_PROMPT = """You are a news wire service covering {country_name}'s occupational health developments.
Generate realistic news headlines and summaries for the current month.

## News Sources to Simulate:
- National newspapers (Der Spiegel, Le Monde, etc.)
- Wire services (Reuters, AFP, local equivalents)
- Ministry press releases
- Union statements
- Industry association responses
- International organizations (ILO, WHO)
- Local media from specific cities

## News Quality:
- Headlines should be realistic and punchy
- Summaries should be 2-3 sentences
- Reference specific locations, institutions, and people
- Vary sentiment (positive, negative, neutral)
- Connect to player decisions when relevant
- Include some background news not directly related to decisions

## Country Context:
{context}"""


# =============================================================================
# COUNTRY RESEARCH AGENT
# =============================================================================

async def generate_country_briefing(
    iso_code: str,
    db: Session,
    ai_config: Optional[AIConfig] = None,
) -> CountryBriefing:
    """
    Generate a comprehensive country briefing for game start.
    Uses web search and database data to create immersive context.
    """
    logger.info(f"Generating country briefing for {iso_code}")
    
    # Get country from database
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise ValueError(f"Country {iso_code} not found in database")
    
    # Get country context
    context = get_country_context(iso_code)
    if not context:
        context = generate_fallback_context(iso_code, country.name, "Unknown")
    
    # Extract metrics
    metrics = extract_country_metrics(country, db)
    metrics_text = format_metrics_for_llm(metrics)
    
    # Get intelligence data
    intelligence = db.query(CountryIntelligence).filter(
        CountryIntelligence.country_iso_code == iso_code
    ).first()
    
    # Build key statistics
    key_statistics = {
        "gdp_per_capita": intelligence.gdp_per_capita_ppp if intelligence else None,
        "population": intelligence.population_total if intelligence else None,
        "labor_force": intelligence.labor_force_participation if intelligence else None,
        "health_expenditure_pct": intelligence.health_expenditure_gdp_pct if intelligence else None,
        "life_expectancy": intelligence.life_expectancy_at_birth if intelligence else None,
        "unemployment_rate": intelligence.unemployment_rate if intelligence else None,
    }
    
    # Get pillar scores
    pillar_scores = {
        "governance": country.governance_score or 50,
        "hazardControl": country.pillar1_score or 50,
        "healthVigilance": country.pillar2_score or 50,
        "restoration": country.pillar3_score or 50,
    }
    
    ohi_score = country.maturity_score or 2.5
    
    # Calculate difficulty
    if ohi_score >= 3.5:
        difficulty = "Easy"
    elif ohi_score >= 2.5:
        difficulty = "Medium"
    elif ohi_score >= 1.5:
        difficulty = "Hard"
    else:
        difficulty = "Expert"
    
    # Calculate rank (simplified)
    all_countries = db.query(Country).filter(Country.maturity_score.isnot(None)).all()
    sorted_countries = sorted(all_countries, key=lambda c: c.maturity_score or 0, reverse=True)
    global_rank = next(
        (i + 1 for i, c in enumerate(sorted_countries) if c.iso_code == iso_code),
        len(sorted_countries)
    )
    
    # Context text for AI
    context_text = json.dumps(context.to_dict(), indent=2)
    
    # Try to get AI-generated content
    try:
        # Perform web search for recent articles
        search_queries = [
            f"{country.name} occupational health safety 2024 2025",
            f"{country.name} workplace safety legislation reform",
            f"{country.name} worker safety industrial accidents",
        ]
        
        research_results = []
        for query in search_queries[:2]:  # Limit to 2 searches
            results = await perform_web_search(query, max_results=3)
            if results:
                research_results.extend(results)
        
        research_text = "\n".join([
            f"- {r.get('title', 'Unknown')}: {r.get('snippet', r.get('content', ''))[:200]}"
            for r in research_results[:5]
        ]) if research_results else "No recent articles found."
        
        # Generate briefing with AI
        if ai_config:
            briefing_data = await _generate_briefing_with_ai(
                country_name=country.name,
                iso_code=iso_code,
                metrics_text=metrics_text,
                context_text=context_text,
                research_text=research_text,
                ai_config=ai_config,
                db=db,
            )
        else:
            briefing_data = _generate_fallback_briefing(
                country_name=country.name,
                iso_code=iso_code,
                context=context,
                pillar_scores=pillar_scores,
                ohi_score=ohi_score,
            )
            
    except Exception as e:
        logger.error(f"Error generating AI briefing: {e}")
        briefing_data = _generate_fallback_briefing(
            country_name=country.name,
            iso_code=iso_code,
            context=context,
            pillar_scores=pillar_scores,
            ohi_score=ohi_score,
        )
    
    # Build the full briefing
    flag_url = f"https://flagcdn.com/w160/{context.iso2_code.lower()}.png"
    
    # Parse AI response or use fallback
    pillar_insights = {}
    for pillar_id in ["governance", "hazardControl", "healthVigilance", "restoration"]:
        insight_data = briefing_data.get("pillar_insights", {}).get(pillar_id, {})
        pillar_insights[pillar_id] = PillarInsight(
            score=pillar_scores.get(pillar_id, 50),
            analysis=insight_data.get("analysis", f"Analysis of {pillar_id} for {country.name}"),
            key_issues=insight_data.get("key_issues", ["Limited data available"]),
            opportunities=insight_data.get("opportunities", ["Potential for improvement"]),
        )
    
    stakeholders = [
        Stakeholder(**s) for s in briefing_data.get("key_stakeholders", [
            {"name": "Minister of Labour", "role": "Government Lead", "institution": context.ministry_name, "stance": "supportive"},
            {"name": "Union Federation President", "role": "Worker Representative", "institution": context.major_unions[0] if context.major_unions else "National Union", "stance": "neutral"},
            {"name": "Employer Federation Chair", "role": "Industry Representative", "institution": context.employer_federation, "stance": "neutral"},
        ])
    ]
    
    articles = [
        ArticleSummary(**a) for a in briefing_data.get("recent_articles", [])
    ]
    
    return CountryBriefing(
        country_name=country.name,
        iso_code=iso_code,
        flag_url=flag_url,
        executive_summary=briefing_data.get("executive_summary", f"Welcome to {country.name}. As the new Health Minister, you face significant challenges in transforming the nation's occupational health system."),
        socioeconomic_context=briefing_data.get("socioeconomic_context", f"{country.name} has a diverse economy with key industries in {', '.join(context.key_industries[:3])}."),
        cultural_factors=briefing_data.get("cultural_factors", f"Work culture in {country.name} reflects {context.work_culture_notes[0] if context.work_culture_notes else 'local traditions'}."),
        future_outlook=briefing_data.get("future_outlook", f"The economy is expected to evolve, bringing new occupational health challenges."),
        key_statistics=key_statistics,
        ohi_score=ohi_score,
        pillar_scores=pillar_scores,
        global_rank=global_rank,
        pillar_insights=pillar_insights,
        key_challenges=briefing_data.get("key_challenges", ["Improving enforcement capacity", "Expanding coverage to informal sector", "Modernizing surveillance systems"]),
        key_stakeholders=stakeholders,
        recent_articles=articles,
        mission_statement=briefing_data.get("mission_statement", f"Transform {country.name}'s occupational health system into a world-class framework that protects every worker."),
        difficulty_rating=difficulty,
        country_context=context.to_dict(),
    )


async def _generate_briefing_with_ai(
    country_name: str,
    iso_code: str,
    metrics_text: str,
    context_text: str,
    research_text: str,
    ai_config: AIConfig,
    db: Session,
) -> Dict[str, Any]:
    """Generate briefing content using AI."""
    
    system_prompt = COUNTRY_RESEARCH_SYSTEM_PROMPT.format(
        country_name=country_name,
        context_data=context_text,
    )
    
    user_prompt = COUNTRY_RESEARCH_USER_PROMPT.format(
        country_name=country_name,
        iso_code=iso_code,
        metrics_text=metrics_text,
        context_text=context_text,
        research_text=research_text,
    )
    
    try:
        # Try OpenAI with web search if available
        if ai_config.provider == AIProvider.OPENAI:
            api_key = get_openai_api_key_from_config(ai_config, db)
            if api_key:
                response = await call_openai_with_web_search(
                    api_key=api_key,
                    model=ai_config.model_name or "gpt-4o",
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    search_context_size="medium",
                )
                if response:
                    # Parse JSON from response
                    try:
                        # Find JSON in response
                        json_start = response.find("{")
                        json_end = response.rfind("}") + 1
                        if json_start >= 0 and json_end > json_start:
                            return json.loads(response[json_start:json_end])
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse AI response as JSON")
        
        # Fallback to LangChain
        llm = get_llm_from_config(ai_config, db)
        if llm:
            from langchain_core.messages import HumanMessage, SystemMessage
            messages = [
                SystemMessage(content=system_prompt),
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
                    logger.warning("Failed to parse LangChain response as JSON")
                    
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
    
    return {}


def _generate_fallback_briefing(
    country_name: str,
    iso_code: str,
    context: CountryContext,
    pillar_scores: Dict[str, float],
    ohi_score: float,
) -> Dict[str, Any]:
    """Generate a fallback briefing without AI."""
    
    weakest_pillar = min(pillar_scores, key=pillar_scores.get)
    strongest_pillar = max(pillar_scores, key=pillar_scores.get)
    
    return {
        "executive_summary": f"{country_name} presents a {get_difficulty_text(ohi_score)} challenge for occupational health transformation. With an OHI Score of {ohi_score:.2f}, your immediate priority is strengthening {format_pillar_name(weakest_pillar)} while leveraging existing strengths in {format_pillar_name(strongest_pillar)}.",
        
        "socioeconomic_context": f"{country_name}'s economy is driven by {', '.join(context.key_industries[:3])}. The workforce faces particular risks in {', '.join(context.high_risk_sectors[:2])}. Key industrial regions include {', '.join(context.industrial_regions[:2])}, where concentrated industrial activity requires focused attention.",
        
        "cultural_factors": f"Work culture in {country_name} is characterized by: {'; '.join(context.work_culture_notes[:2])}. The typical work week is {context.typical_work_week}. Understanding these cultural factors is essential for effective policy implementation.",
        
        "future_outlook": f"Looking ahead, {country_name} faces evolving challenges including technological disruption, climate-related workplace hazards, and demographic shifts. The {context.key_industries[0]} sector will require particular attention as automation transforms traditional roles.",
        
        "pillar_insights": {
            pillar: {
                "analysis": f"Current {format_pillar_name(pillar)} score of {score:.0f} indicates {'strong foundation' if score >= 70 else 'significant room for improvement' if score >= 50 else 'critical gaps requiring immediate attention'}.",
                "key_issues": [f"Key challenge in {format_pillar_name(pillar)}"],
                "opportunities": [f"Opportunity to improve {format_pillar_name(pillar)}"],
            }
            for pillar, score in pillar_scores.items()
        },
        
        "key_challenges": [
            f"Strengthening {format_pillar_name(weakest_pillar)} (currently {pillar_scores[weakest_pillar]:.0f}/100)",
            f"Expanding coverage in the {context.high_risk_sectors[0]} sector",
            f"Building enforcement capacity at {context.labor_inspection_body}",
        ],
        
        "key_stakeholders": [
            {"name": "Minister of Labour", "role": "Government Lead", "institution": context.ministry_name, "stance": "supportive"},
            {"name": "Chief Labour Inspector", "role": "Enforcement Lead", "institution": context.labor_inspection_body, "stance": "supportive"},
            {"name": "Union Federation President", "role": "Worker Representative", "institution": context.major_unions[0] if context.major_unions else "National Union", "stance": "neutral"},
            {"name": "Employer Federation Chair", "role": "Industry Representative", "institution": context.employer_federation, "stance": "neutral"},
        ],
        
        "recent_articles": [],
        
        "mission_statement": f"As Health Minister of {country_name}, your mission is to transform the nation's occupational health system from an OHI Score of {ohi_score:.2f} to a leading position among your peers. Focus on {format_pillar_name(weakest_pillar)} while maintaining progress across all pillars.",
    }


def format_pillar_name(pillar_id: str) -> str:
    """Convert pillar ID to display name."""
    names = {
        "governance": "Governance",
        "hazardControl": "Hazard Control",
        "healthVigilance": "Health Vigilance",
        "restoration": "Restoration",
    }
    return names.get(pillar_id, pillar_id)


def get_difficulty_text(ohi_score: float) -> str:
    """Get difficulty description based on OHI score."""
    if ohi_score >= 3.5:
        return "manageable"
    elif ohi_score >= 2.5:
        return "moderate"
    elif ohi_score >= 1.5:
        return "significant"
    else:
        return "critical"


# =============================================================================
# DECISION ENGINE AGENT
# =============================================================================

async def generate_decision_cards(
    iso_code: str,
    country_name: str,
    current_month: int,
    current_year: int,
    pillar_scores: Dict[str, float],
    budget_remaining: int,
    recent_decisions: List[str],
    recent_events: List[str],
    context: CountryContext,
    ai_config: Optional[AIConfig] = None,
    db: Optional[Session] = None,
) -> List[DecisionCard]:
    """Generate contextual decision cards for the current turn."""
    
    # Determine which pillars need attention
    weakest_pillar = min(pillar_scores, key=pillar_scores.get)
    
    # Generate 4-5 decision cards
    decisions = []
    
    # Always include one decision for the weakest pillar
    decisions.append(_generate_pillar_decision(
        pillar=weakest_pillar,
        context=context,
        budget=budget_remaining,
        priority="high",
    ))
    
    # Add decisions for other pillars
    other_pillars = [p for p in pillar_scores.keys() if p != weakest_pillar]
    for pillar in other_pillars[:2]:
        decisions.append(_generate_pillar_decision(
            pillar=pillar,
            context=context,
            budget=budget_remaining,
            priority="medium",
        ))
    
    # Add a cross-cutting or special decision
    decisions.append(_generate_special_decision(context, current_month, current_year))
    
    return decisions


def _generate_pillar_decision(
    pillar: str,
    context: CountryContext,
    budget: int,
    priority: str,
) -> DecisionCard:
    """Generate a decision card for a specific pillar."""
    
    # Decision templates per pillar
    templates = {
        "governance": [
            ("Expand Inspectorate in {region}", "Recruit and train 50 new labor inspectors for {region}. This will strengthen enforcement capacity in high-risk industries.", 35),
            ("Launch OSH Awareness Campaign", "Partner with {unions} to launch a national workplace safety awareness campaign reaching 5 million workers.", 25),
            ("Establish Tripartite Council", "Create a new tripartite consultative council bringing together {ministry}, {unions}, and {employers} for policy dialogue.", 20),
        ],
        "hazardControl": [
            ("Mandate PPE Standards for {industry}", "Introduce mandatory personal protective equipment standards for all {industry} workers, with enforcement starting in 3 months.", 30),
            ("Deploy Mobile Inspection Units", "Launch mobile inspection teams targeting informal workplaces in {cities}. Expected to increase inspection coverage by 40%.", 40),
            ("Update Occupational Exposure Limits", "Align national exposure limits with ILO guidelines, particularly for carcinogens and respiratory hazards.", 25),
        ],
        "healthVigilance": [
            ("Expand Disease Registry", "Modernize the occupational disease reporting system with digital tools, enabling real-time surveillance across {region}.", 35),
            ("Launch Worker Health Screening", "Partner with {health_authority} to offer free health screenings for workers in {high_risk_sector}.", 30),
            ("Establish Early Warning System", "Implement AI-powered early warning system for emerging occupational health hazards, piloted in {cities}.", 45),
        ],
        "restoration": [
            ("Increase Compensation Rates", "Raise workers' compensation rates by 15% for occupational diseases, benefiting an estimated 50,000 affected workers.", 40),
            ("Open Rehabilitation Center in {city}", "Establish a new occupational rehabilitation center in {city}, providing return-to-work support for injured workers.", 50),
            ("Expand Mental Health Support", "Launch workplace mental health program through {social_insurance}, offering counseling and stress management.", 30),
        ],
    }
    
    # Select a template
    import random
    template_options = templates.get(pillar, templates["governance"])
    title_template, desc_template, base_cost = random.choice(template_options)
    
    # Fill in context
    region = random.choice(context.industrial_regions) if context.industrial_regions else context.capital
    city = random.choice(context.major_cities) if context.major_cities else context.capital
    industry = random.choice(context.key_industries) if context.key_industries else "manufacturing"
    high_risk = random.choice(context.high_risk_sectors) if context.high_risk_sectors else "construction"
    unions = context.major_unions[0] if context.major_unions else "national union federation"
    
    title = title_template.format(
        region=region,
        city=city,
        industry=industry,
        high_risk_sector=high_risk,
    )
    
    description = desc_template.format(
        region=region,
        cities=city,
        industry=industry,
        high_risk_sector=high_risk,
        unions=unions,
        ministry=context.ministry_abbreviation,
        employers=context.employer_federation,
        health_authority=context.health_authority,
        social_insurance=context.social_insurance_body,
    )
    
    # Calculate impacts
    primary_impact = random.randint(3, 8) if priority == "high" else random.randint(2, 5)
    impacts = {pillar: primary_impact}
    
    # Slight secondary effects
    if random.random() > 0.5:
        other_pillar = random.choice([p for p in ["governance", "hazardControl", "healthVigilance", "restoration"] if p != pillar])
        impacts[other_pillar] = random.randint(1, 2)
    
    return DecisionCard(
        id=f"dec_{uuid.uuid4().hex[:8]}",
        title=title,
        description=description,
        detailed_context=f"Implementation will be led by {context.labor_inspection_body} in coordination with {context.ministry_name}.",
        pillar=pillar,
        cost=base_cost,
        expected_impacts=impacts,
        risk_level="low" if base_cost < 30 else "medium" if base_cost < 45 else "high",
        time_to_effect="immediate" if base_cost < 25 else "3 months" if base_cost < 40 else "6 months",
        stakeholder_reactions={
            unions: "supportive" if pillar in ["governance", "restoration"] else "neutral",
            context.employer_federation: "cautious" if pillar == "hazardControl" else "neutral",
        },
        location=region,
        institution=context.labor_inspection_body,
    )


def _generate_special_decision(context: CountryContext, month: int, year: int) -> DecisionCard:
    """Generate a special cross-cutting or event-based decision."""
    
    import random
    
    special_options = [
        ("Host International OSH Conference", f"Host an international occupational health conference in {context.capital}, attracting global experts and raising {context.name}'s profile.", "governance", 45),
        ("Launch Digital Transformation Initiative", f"Digitize all workplace safety reporting through a new platform, piloted with {context.major_unions[0] if context.major_unions else 'major unions'}.", "healthVigilance", 40),
        ("Establish Research Partnership", f"Partner with universities in {context.major_cities[0] if context.major_cities else context.capital} to research emerging workplace hazards.", "hazardControl", 35),
    ]
    
    title, description, pillar, cost = random.choice(special_options)
    
    return DecisionCard(
        id=f"dec_{uuid.uuid4().hex[:8]}",
        title=title,
        description=description,
        detailed_context=f"This initiative supports {context.name}'s long-term occupational health strategy.",
        pillar=pillar,
        cost=cost,
        expected_impacts={pillar: random.randint(2, 4), "governance": 1},
        risk_level="medium",
        time_to_effect="6 months",
        stakeholder_reactions={
            "International organizations": "highly supportive",
            context.employer_federation: "supportive",
        },
        location=context.capital,
        institution=context.ministry_name,
    )


# =============================================================================
# NEWSFEED AGENT
# =============================================================================

def generate_news_items(
    context: CountryContext,
    month: int,
    year: int,
    recent_decisions: List[DecisionCard],
    pillar_changes: Dict[str, float],
    count: int = 3,
) -> List[NewsItem]:
    """Generate realistic news items for the current month."""
    
    import random
    
    news_items = []
    month_names = ["January", "February", "March", "April", "May", "June", 
                   "July", "August", "September", "October", "November", "December"]
    month_name = month_names[month - 1] if 1 <= month <= 12 else "January"
    
    # Generate news based on decisions
    for decision in recent_decisions[:2]:
        sentiment = "positive" if decision.expected_impacts.get(decision.pillar, 0) > 0 else "neutral"
        
        headlines = [
            f"{context.name} Announces {decision.title}",
            f"Government Launches New Initiative: {decision.title}",
            f"{context.ministry_abbreviation} Unveils {decision.title}",
        ]
        
        news_items.append(NewsItem(
            id=f"news_{uuid.uuid4().hex[:8]}",
            headline=random.choice(headlines),
            summary=f"{decision.description[:150]}... Implementation begins immediately under {context.ministry_name}.",
            source=random.choice(["National News Agency", "Government Press Office", context.statistics_office]),
            source_type="official",
            category=decision.pillar,
            sentiment=sentiment,
            location=decision.location or context.capital,
            timestamp=f"{month_name} {year}",
            related_decision=decision.id,
        ))
    
    # Add a background news item
    background_headlines = [
        (f"ILO Commends {context.name}'s Progress on Worker Safety", "positive", "governance"),
        (f"Industry Groups in {context.major_cities[0] if context.major_cities else context.capital} Call for Safety Reforms", "neutral", "hazardControl"),
        (f"{context.major_unions[0] if context.major_unions else 'Workers'} Union Highlights Ongoing Challenges", "neutral", "restoration"),
        (f"New Study Reveals Occupational Health Trends in {context.industrial_regions[0] if context.industrial_regions else context.name}", "neutral", "healthVigilance"),
    ]
    
    bg_headline, bg_sentiment, bg_category = random.choice(background_headlines)
    news_items.append(NewsItem(
        id=f"news_{uuid.uuid4().hex[:8]}",
        headline=bg_headline,
        summary=f"A new development in {context.name}'s occupational health landscape draws attention from stakeholders across the country.",
        source=random.choice(["Reuters", "Local Media", "Industry Publication"]),
        source_type="media",
        category=bg_category,
        sentiment=bg_sentiment,
        location=random.choice(context.major_cities) if context.major_cities else context.capital,
        timestamp=f"{month_name} {year}",
    ))
    
    return news_items[:count]
