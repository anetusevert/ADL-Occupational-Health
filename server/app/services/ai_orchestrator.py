"""
GOHIP Platform - AI Orchestration Layer (Deep Dive Analysis)
============================================================

Phase 26: Full Multi-Agent AI System with Dynamic Configuration

This service implements a sophisticated multi-agent architecture using LangChain:
1. ResearchAgent: Web research for qualitative policy insights (SerpAPI)
2. DataAgent: Internal database queries for metrics
3. Orchestrator: Synthesizes both into strategic narratives

Supports multiple AI providers:
- OpenAI (GPT-4o, GPT-4 Turbo, GPT-3.5)
- Anthropic (Claude 3 Opus, Sonnet, Haiku)
- Google (Gemini Pro, Flash)
- Azure OpenAI
- Mistral
- Ollama (local models)
"""

import logging
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decrypt_api_key
from app.models.country import (
    Country,
    GovernanceLayer,
    Pillar1Hazard,
    Pillar2Vigilance,
    Pillar3Restoration,
)
from app.models.user import AIConfig, AIProvider
from app.services.ai_call_tracer import AICallTracer, trace_ai_call

# Configure logging
logger = logging.getLogger(__name__)


# =============================================================================
# DATA CLASSES & TYPES
# =============================================================================

class AgentStatus(str, Enum):
    """Status indicators for agent activity."""
    STARTING = "starting"
    RESEARCHING = "researching"
    QUERYING = "querying"
    ANALYZING = "analyzing"
    SYNTHESIZING = "synthesizing"
    COMPLETE = "complete"
    ERROR = "error"


@dataclass
class AgentLogEntry:
    """A single entry in the agent activity log."""
    timestamp: str
    agent: str
    status: AgentStatus
    message: str
    emoji: str = "📍"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "agent": self.agent,
            "status": self.status.value,
            "message": self.message,
            "emoji": self.emoji,
        }


@dataclass
class SWOTAnalysis:
    """SWOT Analysis structure."""
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)
    threats: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, List[str]]:
        return asdict(self)


@dataclass
class DeepDiveResult:
    """Complete Deep Dive analysis result."""
    strategy_name: str
    country_name: str
    iso_code: str
    topic: str
    key_findings: List[str]
    swot_analysis: SWOTAnalysis
    recommendation: str
    executive_summary: str
    data_sources: Dict[str, Any]
    agent_log: List[AgentLogEntry]
    generated_at: str
    source: str  # Provider name

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy_name": self.strategy_name,
            "country_name": self.country_name,
            "iso_code": self.iso_code,
            "topic": self.topic,
            "key_findings": self.key_findings,
            "swot_analysis": self.swot_analysis.to_dict(),
            "recommendation": self.recommendation,
            "executive_summary": self.executive_summary,
            "data_sources": self.data_sources,
            "agent_log": [entry.to_dict() for entry in self.agent_log],
            "generated_at": self.generated_at,
            "source": self.source,
        }


# =============================================================================
# AGENT PROMPTS
# =============================================================================

ORCHESTRATOR_PROMPT = """You are a Senior Strategic Consultant for Occupational Health Ministers.
Your role is to synthesize research findings and data metrics into actionable strategic intelligence.

You must generate a comprehensive analysis with:
1. A compelling strategy name (e.g., "The Return-to-Work Revolution")
2. 5-7 key findings as bullet points
3. Complete SWOT analysis
4. A 2-3 sentence strategic recommendation
5. A concise executive summary (3-4 sentences)

Communication style:
- Be direct and insight-driven
- Reference specific metrics and findings
- Compare to global benchmarks
- Focus on actionable intelligence
- Write for C-suite executives

Output MUST be valid JSON matching this schema:
{
    "strategy_name": "string",
    "key_findings": ["string"],
    "swot_analysis": {
        "strengths": ["string"],
        "weaknesses": ["string"],
        "opportunities": ["string"],
        "threats": ["string"]
    },
    "recommendation": "string",
    "executive_summary": "string"
}"""


# =============================================================================
# DATA EXTRACTION HELPERS
# =============================================================================

def extract_country_metrics(country: Country) -> Dict[str, Any]:
    """Extract comprehensive metrics from a Country object."""
    metrics = {
        "country_name": country.name,
        "iso_code": country.iso_code,
        "maturity_score": country.maturity_score,
        "strategic_summary": country.strategic_summary_text,
        "governance": {},
        "pillar_1_hazard": {},
        "pillar_2_vigilance": {},
        "pillar_3_restoration": {},
    }
    
    if country.governance:
        gov = country.governance
        metrics["governance"] = {
            "ilo_c187_ratified": gov.ilo_c187_status,
            "ilo_c155_ratified": gov.ilo_c155_status,
            "inspector_density": gov.inspector_density,
            "mental_health_policy": gov.mental_health_policy,
            "strategic_capacity_score": gov.strategic_capacity_score,
        }
    
    if country.pillar_1_hazard:
        p1 = country.pillar_1_hazard
        metrics["pillar_1_hazard"] = {
            "fatal_accident_rate": p1.fatal_accident_rate,
            "carcinogen_exposure_pct": p1.carcinogen_exposure_pct,
            "heat_stress_reg_type": p1.heat_stress_reg_type if p1.heat_stress_reg_type else None,
            "oel_compliance_pct": p1.oel_compliance_pct,
            "control_maturity_score": p1.control_maturity_score,
        }
    
    if country.pillar_2_vigilance:
        p2 = country.pillar_2_vigilance
        metrics["pillar_2_vigilance"] = {
            "surveillance_logic": p2.surveillance_logic if p2.surveillance_logic else None,
            "disease_detection_rate": p2.disease_detection_rate,
            "vulnerability_index": p2.vulnerability_index,
            "migrant_worker_pct": p2.migrant_worker_pct,
        }
    
    if country.pillar_3_restoration:
        p3 = country.pillar_3_restoration
        metrics["pillar_3_restoration"] = {
            "payer_mechanism": p3.payer_mechanism if p3.payer_mechanism else None,
            "reintegration_law": p3.reintegration_law,
            "sickness_absence_days": p3.sickness_absence_days,
            "rehab_access_score": p3.rehab_access_score,
            "return_to_work_success_pct": p3.return_to_work_success_pct,
        }
    
    return metrics


def format_metrics_for_llm(metrics: Dict[str, Any]) -> str:
    """Format metrics dict into readable text for LLM consumption."""
    lines = [
        f"COUNTRY: {metrics['country_name']} ({metrics['iso_code']})",
        f"MATURITY SCORE: {metrics.get('maturity_score', 'N/A')}",
        "",
        "=== GOVERNANCE LAYER ===",
    ]
    
    gov = metrics.get("governance", {})
    lines.extend([
        f"- ILO C187 Ratified: {'Yes' if gov.get('ilo_c187_ratified') else 'No'}",
        f"- ILO C155 Ratified: {'Yes' if gov.get('ilo_c155_ratified') else 'No'}",
        f"- Inspector Density: {gov.get('inspector_density', 'N/A')} per 10,000 workers",
        f"- Mental Health Policy: {'Yes' if gov.get('mental_health_policy') else 'No'}",
        f"- Strategic Capacity Score: {gov.get('strategic_capacity_score', 'N/A')}",
        "",
        "=== PILLAR 1: HAZARD CONTROL ===",
    ])
    
    p1 = metrics.get("pillar_1_hazard", {})
    lines.extend([
        f"- Fatal Accident Rate: {p1.get('fatal_accident_rate', 'N/A')} per 100,000",
        f"- Carcinogen Exposure: {p1.get('carcinogen_exposure_pct', 'N/A')}%",
        f"- Heat Stress Regulation: {p1.get('heat_stress_reg_type', 'N/A')}",
        f"- OEL Compliance: {p1.get('oel_compliance_pct', 'N/A')}%",
        f"- Control Maturity Score: {p1.get('control_maturity_score', 'N/A')}",
        "",
        "=== PILLAR 2: HEALTH VIGILANCE ===",
    ])
    
    p2 = metrics.get("pillar_2_vigilance", {})
    lines.extend([
        f"- Surveillance Logic: {p2.get('surveillance_logic', 'N/A')}",
        f"- Disease Detection Rate: {p2.get('disease_detection_rate', 'N/A')} per 100,000",
        f"- Vulnerability Index: {p2.get('vulnerability_index', 'N/A')}",
        f"- Migrant Worker %: {p2.get('migrant_worker_pct', 'N/A')}%",
        "",
        "=== PILLAR 3: RESTORATION ===",
    ])
    
    p3 = metrics.get("pillar_3_restoration", {})
    lines.extend([
        f"- Payer Mechanism: {p3.get('payer_mechanism', 'N/A')}",
        f"- Reintegration Law: {'Yes' if p3.get('reintegration_law') else 'No'}",
        f"- Rehab Access Score: {p3.get('rehab_access_score', 'N/A')}",
        f"- Return-to-Work Success: {p3.get('return_to_work_success_pct', 'N/A')}%",
    ])
    
    return "\n".join(lines)


# =============================================================================
# WEB SEARCH (Tavily + Multi-Source Fallback)
# =============================================================================

def perform_web_search(query: str, num_results: int = 10) -> str:
    """
    Perform web search with intelligent fallback chain.
    
    Priority order:
    1. Tavily (if configured - FREE 1000/month, most reliable for AI)
    2. SerpAPI (if configured - 100/month free)
    3. Bing/Google/DuckDuckGo scraping (may be blocked)
    4. Knowledge base fallback
    
    Args:
        query: Search query string
        num_results: Number of results to return
        
    Returns:
        Formatted search results as text
    """
    # Try Tavily first (FREE, most reliable, designed for AI)
    tavily_key = settings.TAVILY_API_KEY
    if tavily_key:
        result = _tavily_search(query, num_results, tavily_key)
        if result and "[Search failed" not in result:
            return result
    
    # Try SerpAPI if configured
    serpapi_key = settings.SERPAPI_KEY
    if serpapi_key:
        result = _serpapi_search(query, num_results, serpapi_key)
        if result and "[Search failed" not in result:
            return result
    
    # Try Bing Search (scraping, may be blocked)
    result = _bing_search(query, num_results)
    if result and "[No results" not in result and "[Search failed" not in result:
        return result
    
    # Try Google Search (scraping, often blocked)
    result = _google_search(query, num_results)
    if result and "[No results" not in result and "[Search failed" not in result:
        return result
    
    # Try DuckDuckGo as final scraping option
    result = _duckduckgo_search(query, num_results)
    if result and "[No search results" not in result and "[Search failed" not in result:
        return result
    
    # Final fallback to knowledge base
    return _generate_fallback_research(query)


def _tavily_search(query: str, num_results: int, api_key: str) -> str:
    """
    Perform search using Tavily API (FREE tier: 1000 searches/month).
    
    Tavily is specifically designed for AI applications and provides
    high-quality, structured search results optimized for LLM consumption.
    
    Args:
        query: Search query string
        num_results: Number of results to return
        api_key: Tavily API key
        
    Returns:
        Formatted search results as text
    """
    try:
        from tavily import TavilyClient
        
        logger.info(f"[ResearchAgent] Tavily search for: {query[:60]}...")
        
        client = TavilyClient(api_key=api_key)
        
        # Use search_depth="advanced" for more comprehensive results
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=num_results,
            include_answer=True,
            include_raw_content=False
        )
        
        results = response.get("results", [])
        answer = response.get("answer", "")
        
        if not results:
            logger.warning(f"[ResearchAgent] Tavily returned no results")
            return f"[Search failed: No results from Tavily]"
        
        # Format results
        formatted = [f"=== Tavily Web Research ===\nQuery: {query}\n"]
        
        if answer:
            formatted.append(f"AI Summary: {answer}\n")
        
        for i, result in enumerate(results, 1):
            title = result.get("title", "No title")
            content = result.get("content", "")[:300]
            url = result.get("url", "")
            score = result.get("score", 0)
            
            formatted.append(f"{i}. {title}")
            if content:
                formatted.append(f"   {content}")
            formatted.append(f"   Source: {url}")
            formatted.append(f"   Relevance: {score:.2f}")
            formatted.append("")
        
        logger.info(f"[ResearchAgent] Tavily search completed: {len(results)} results")
        return "\n".join(formatted)
        
    except ImportError:
        logger.error("[ResearchAgent] tavily-python not installed")
        return "[Search failed: tavily-python not installed]"
    except Exception as e:
        logger.error(f"[ResearchAgent] Tavily search failed: {e}")
        return f"[Search failed: {str(e)}]"


def _bing_search(query: str, num_results: int = 10) -> str:
    """
    Perform Bing search using web scraping (free, no API key).
    
    Bing is more scraping-friendly than Google.
    
    Args:
        query: Search query string
        num_results: Number of results to return
        
    Returns:
        Formatted search results as text
    """
    import requests
    from bs4 import BeautifulSoup
    import urllib.parse
    import time
    import random
    
    logger.info(f"[ResearchAgent] Bing search for: {query[:60]}...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }
    
    try:
        encoded_query = urllib.parse.quote_plus(query)
        url = f"https://www.bing.com/search?q={encoded_query}&count={num_results}"
        
        time.sleep(random.uniform(0.3, 0.8))
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        results = []
        
        # Bing search result selectors
        search_results = soup.find_all('li', class_='b_algo')
        
        for item in search_results[:num_results]:
            try:
                # Extract title and URL
                title_elem = item.find('h2')
                if title_elem:
                    link = title_elem.find('a')
                    title = link.get_text() if link else None
                    url = link.get('href') if link else None
                else:
                    continue
                
                # Extract description
                desc_elem = item.find('p') or item.find('div', class_='b_caption')
                description = desc_elem.get_text() if desc_elem else ''
                
                if title and url:
                    results.append({
                        'title': title.strip(),
                        'url': url,
                        'description': description[:300].strip() if description else ''
                    })
            except Exception:
                continue
        
        if not results:
            logger.warning(f"[ResearchAgent] Bing returned no results for: {query}")
            return f"[No results from Bing]\nQuery: {query}"
        
        # Format results
        formatted = [f"=== Bing Search Results ===\nQuery: {query}\n"]
        
        for i, result in enumerate(results, 1):
            formatted.append(f"{i}. {result['title']}")
            if result['description']:
                formatted.append(f"   {result['description']}")
            formatted.append(f"   Source: {result['url']}")
            formatted.append("")
        
        logger.info(f"[ResearchAgent] Bing search completed: {len(results)} results")
        return "\n".join(formatted)
        
    except Exception as e:
        logger.error(f"[ResearchAgent] Bing search failed: {e}")
        return f"[Search failed: {str(e)}]"


def _google_search(query: str, num_results: int = 10) -> str:
    """
    Perform Google search using direct HTTP requests with proper headers.
    
    Uses web scraping with realistic browser headers to avoid blocks.
    
    Args:
        query: Search query string
        num_results: Number of results to return
        
    Returns:
        Formatted search results as text
    """
    import requests
    from bs4 import BeautifulSoup
    import urllib.parse
    import time
    import random
    
    logger.info(f"[ResearchAgent] Google search for: {query[:60]}...")
    
    # Realistic browser headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    try:
        # Encode query for URL
        encoded_query = urllib.parse.quote_plus(query)
        url = f"https://www.google.com/search?q={encoded_query}&num={num_results}&hl=en"
        
        # Add small random delay to appear more human-like
        time.sleep(random.uniform(0.5, 1.5))
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        results = []
        
        # Try multiple selectors for Google search results
        # Google frequently changes their HTML structure
        search_divs = soup.find_all('div', class_='g') or soup.find_all('div', {'data-hveid': True})
        
        for div in search_divs[:num_results]:
            try:
                # Extract title
                title_elem = div.find('h3')
                title = title_elem.get_text() if title_elem else None
                
                # Extract URL
                link_elem = div.find('a', href=True)
                url = link_elem['href'] if link_elem else None
                
                # Clean URL (remove Google redirect wrapper)
                if url and url.startswith('/url?'):
                    url = urllib.parse.parse_qs(urllib.parse.urlparse(url).query).get('q', [url])[0]
                
                # Extract description/snippet
                desc_elem = div.find('div', class_='VwiC3b') or div.find('span', class_='st') or div.find('div', {'data-sncf': True})
                description = desc_elem.get_text() if desc_elem else ''
                
                if title and url and not url.startswith('/search'):
                    results.append({
                        'title': title,
                        'url': url,
                        'description': description[:300] if description else ''
                    })
            except Exception:
                continue
        
        if not results:
            logger.warning(f"[ResearchAgent] Google returned no parseable results for: {query}")
            return f"[No results from Google]\nQuery: {query}"
        
        # Format results
        formatted = [f"=== Google Search Results ===\nQuery: {query}\n"]
        
        for i, result in enumerate(results, 1):
            formatted.append(f"{i}. {result['title']}")
            if result['description']:
                formatted.append(f"   {result['description']}")
            formatted.append(f"   Source: {result['url']}")
            formatted.append("")
        
        logger.info(f"[ResearchAgent] Google search completed: {len(results)} results")
        return "\n".join(formatted)
        
    except requests.exceptions.Timeout:
        logger.error("[ResearchAgent] Google search timed out")
        return "[Search failed: timeout]"
    except requests.exceptions.RequestException as e:
        logger.error(f"[ResearchAgent] Google search request failed: {e}")
        return f"[Search failed: {str(e)}]"
    except Exception as e:
        logger.error(f"[ResearchAgent] Google search failed: {e}")
        return f"[Search failed: {str(e)}]"


def _serpapi_search(query: str, num_results: int, api_key: str) -> str:
    """
    Perform Google search using SerpAPI (paid, requires API key).
    
    Args:
        query: Search query string
        num_results: Number of results to return
        api_key: SerpAPI API key
        
    Returns:
        Formatted search results as text
    """
    try:
        from serpapi import GoogleSearch
        
        logger.info(f"[ResearchAgent] SerpAPI search for: {query[:60]}...")
        
        search = GoogleSearch({
            "q": query,
            "api_key": api_key,
            "num": num_results,
        })
        
        results = search.get_dict()
        
        # Format organic results
        formatted = [f"=== SerpAPI Google Results ===\nQuery: {query}\n"]
        
        if "organic_results" in results:
            for i, result in enumerate(results["organic_results"][:num_results], 1):
                title = result.get("title", "No title")
                snippet = result.get("snippet", "")
                link = result.get("link", "")
                formatted.append(f"{i}. {title}")
                if snippet:
                    formatted.append(f"   {snippet}")
                if link:
                    formatted.append(f"   Source: {link}")
                formatted.append("")
        
        if "answer_box" in results:
            answer = results["answer_box"]
            if "answer" in answer:
                formatted.insert(2, f"Quick Answer: {answer['answer']}\n")
            elif "snippet" in answer:
                formatted.insert(2, f"Quick Answer: {answer['snippet']}\n")
        
        logger.info(f"[ResearchAgent] SerpAPI search completed: {len(results.get('organic_results', []))} results")
        return "\n".join(formatted)
        
    except ImportError:
        logger.warning("[ResearchAgent] SerpAPI not installed")
        return "[Search failed: SerpAPI not installed]"
    except Exception as e:
        logger.warning(f"[ResearchAgent] SerpAPI failed: {e}")
        return f"[Search failed: {str(e)}]"


def _duckduckgo_search(query: str, num_results: int = 10) -> str:
    """
    Perform web search using DuckDuckGo (free, no API key required).
    
    Args:
        query: Search query string
        num_results: Number of results to return
        
    Returns:
        Formatted search results as text
    """
    try:
        from duckduckgo_search import DDGS
        
        logger.info(f"[ResearchAgent] DuckDuckGo search for: {query[:60]}...")
        
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=num_results))
        
        if not results:
            logger.warning(f"[ResearchAgent] DuckDuckGo returned no results")
            return f"[No search results from DuckDuckGo]\nQuery: {query}"
        
        # Format results
        formatted = [f"=== DuckDuckGo Results ===\nQuery: {query}\n"]
        
        for i, result in enumerate(results, 1):
            title = result.get("title", "No title")
            body = result.get("body", "")
            link = result.get("href", "")
            formatted.append(f"{i}. {title}")
            if body:
                formatted.append(f"   {body}")
            if link:
                formatted.append(f"   Source: {link}")
            formatted.append("")
        
        logger.info(f"[ResearchAgent] DuckDuckGo completed: {len(results)} results")
        return "\n".join(formatted)
        
    except ImportError:
        logger.error("[ResearchAgent] duckduckgo-search not installed")
        return "[Search failed: duckduckgo-search not installed]"
    except Exception as e:
        logger.error(f"[ResearchAgent] DuckDuckGo failed: {e}")
        return f"[Search failed: {str(e)}]"


def perform_extended_research(
    country_name: str, 
    topic: str, 
    num_queries: int = 3,
    results_per_query: int = 8
) -> str:
    """
    Perform extended multi-query research for comprehensive analysis.
    
    Generates multiple targeted queries to gather diverse sources:
    1. Policy and regulations query
    2. Statistics and data query
    3. Recent developments query
    
    Args:
        country_name: Name of the country to research
        topic: Analysis topic/focus area
        num_queries: Number of different queries to run (default 3)
        results_per_query: Results per query (default 8)
        
    Returns:
        Aggregated and deduplicated research results
    """
    logger.info(f"[ResearchAgent] Starting extended research for {country_name} - {topic}")
    
    # Generate targeted search queries
    queries = [
        f"{country_name} {topic} policy regulations legislation",
        f"{country_name} {topic} statistics data reports",
        f"{country_name} {topic} latest developments 2025 2024",
    ]
    
    # Add topic-specific queries
    if "health" in topic.lower() or "occupational" in topic.lower():
        queries.append(f"{country_name} occupational health safety ILO WHO")
    if "compensation" in topic.lower() or "worker" in topic.lower():
        queries.append(f"{country_name} workers compensation insurance system")
    if "hazard" in topic.lower() or "safety" in topic.lower():
        queries.append(f"{country_name} workplace safety hazard prevention")
    
    # Limit to requested number of queries
    queries = queries[:num_queries]
    
    all_results = []
    seen_urls = set()
    
    for i, query in enumerate(queries, 1):
        logger.info(f"[ResearchAgent] Query {i}/{len(queries)}: {query[:50]}...")
        
        # Perform search with fallback
        result = perform_web_search(query, num_results=results_per_query)
        
        # Parse and deduplicate results
        if result and "[Search failed" not in result and "[No " not in result:
            # Extract unique entries
            lines = result.split("\n")
            current_entry = []
            
            for line in lines:
                if line.startswith("Source: "):
                    url = line.replace("Source: ", "").strip()
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        current_entry.append(line)
                        all_results.append("\n".join(current_entry))
                    current_entry = []
                elif line.strip() and not line.startswith("===") and not line.startswith("Query:"):
                    current_entry.append(line)
    
    # Compile final research document
    if all_results:
        header = f"""
================================================================================
EXTENDED WEB RESEARCH: {country_name.upper()} - {topic.upper()}
================================================================================
Queries performed: {len(queries)}
Unique sources found: {len(seen_urls)}
Research timestamp: {datetime.utcnow().isoformat()}Z

"""
        formatted_results = []
        for i, entry in enumerate(all_results, 1):
            formatted_results.append(f"[Source {i}]\n{entry}\n")
        
        logger.info(f"[ResearchAgent] Extended research complete: {len(seen_urls)} unique sources")
        return header + "\n".join(formatted_results)
    else:
        logger.warning(f"[ResearchAgent] Extended research found no results")
        return _generate_fallback_research(f"{country_name} {topic}")


def _generate_fallback_research(query: str) -> str:
    """
    Generate comprehensive contextual research when web search is unavailable.
    Provides detailed occupational health context based on query analysis.
    """
    logger.warning(f"[ResearchAgent] Using enhanced fallback research for: {query}")
    
    # Parse query to extract country and topic
    query_lower = query.lower()
    
    # Detect topic focus
    topic_context = ""
    if "governance" in query_lower or "policy" in query_lower or "regulation" in query_lower:
        topic_context = """
GOVERNANCE & POLICY RESEARCH CONTEXT:

National OSH frameworks typically include:
- Constitutional provisions for worker protection
- Primary OSH legislation (often a single comprehensive act or multiple sector-specific laws)
- Implementing regulations and technical standards
- Tripartite consultation mechanisms (government, employers, workers)
- Enforcement agencies (labor inspectorates, OSH authorities)

Key indicators to analyze:
- ILO C155 (OSH Convention, 1981) ratification status
- ILO C187 (Promotional Framework, 2006) ratification status
- National OSH policy adoption date and revision cycle
- Inspector-to-worker ratio (ILO target: 1:10,000)
- Prosecution and penalty statistics
- Workplace inspection coverage rate

Regional benchmarks:
- EU countries: Framework Directive 89/391/EEC compliance
- OECD average: 85% of workers covered by OSH legislation
- Best practice: Annual policy review with tripartite input
"""
    elif "hazard" in query_lower or "safety" in query_lower or "prevention" in query_lower:
        topic_context = """
HAZARD PREVENTION RESEARCH CONTEXT:

Major occupational hazards by sector:
- Construction: Falls, struck-by, caught-between, electrocution
- Manufacturing: Machinery, chemicals, noise, ergonomics
- Mining: Cave-ins, dust, gas, heavy equipment
- Agriculture: Pesticides, machinery, heat, biological agents
- Healthcare: Biological hazards, sharps, ergonomics, violence

Key prevention frameworks:
- Hierarchy of Controls: Elimination > Substitution > Engineering > Administrative > PPE
- Risk Assessment methodologies (quantitative vs. qualitative)
- Occupational Exposure Limits (OELs) for chemicals
- Heat stress thresholds (WBGT monitoring)
- Noise exposure limits (typically 85 dB TWA)

Global statistics:
- 2.9 million work-related deaths annually (ILO 2024)
- 402 million non-fatal occupational injuries per year
- Construction and agriculture: highest fatality rates
- Asbestos-related diseases: 233,000 deaths annually
"""
    elif "surveillance" in query_lower or "detection" in query_lower or "monitoring" in query_lower:
        topic_context = """
HEALTH SURVEILLANCE RESEARCH CONTEXT:

Surveillance system components:
- Pre-employment health screening
- Periodic medical examinations
- Biological monitoring (blood lead, urinary metabolites)
- Disease notification and registry systems
- Return-to-work fitness assessments

Key surveillance indicators:
- Coverage rate of periodic examinations
- Occupational disease detection rate per 100,000
- Reporting completeness and timeliness
- Registry linkage with compensation systems
- Sentinel event monitoring

Occupational disease priorities:
- Respiratory diseases (pneumoconiosis, asthma, COPD)
- Musculoskeletal disorders (back pain, carpal tunnel)
- Hearing loss (NIHL)
- Mental health conditions (depression, anxiety, burnout)
- Occupational cancers (mesothelioma, lung cancer)

WHO/ILO benchmarks:
- UHC service coverage index target: >80
- Health workforce density: >4.45 per 1,000 population
- Disease notification within 48 hours of diagnosis
"""
    elif "compensation" in query_lower or "restoration" in query_lower or "return" in query_lower:
        topic_context = """
WORKERS' COMPENSATION & RESTORATION RESEARCH CONTEXT:

Compensation system types:
- Social insurance (employer contributions, state-managed)
- Private insurance (mandatory or voluntary)
- Litigation-based (tort system)
- No-fault systems (automatic compensation)
- Mixed/hybrid systems

Key performance indicators:
- Coverage rate (% of workforce)
- Replacement rate (% of pre-injury wages)
- Claim processing time
- Return-to-work rate within 12 months
- Permanent disability benefit adequacy

Return-to-work program elements:
- Early intervention (within first 4 weeks)
- Graduated return schedules
- Workplace accommodations
- Vocational rehabilitation
- Employer incentives/penalties

Global benchmarks:
- Best practice RTW rate: >70% within 6 months
- OECD average wage replacement: 60-80%
- Claim decision timeline: <30 days
- Rehabilitation access: within 2 weeks of injury
"""
    else:
        topic_context = """
COMPREHENSIVE OCCUPATIONAL HEALTH RESEARCH CONTEXT:

The GOHIP Framework analyzes countries across four pillars:

1. GOVERNANCE ECOSYSTEM
   - Legal frameworks and ratified ILO conventions
   - Institutional capacity and enforcement
   - Tripartite social dialogue mechanisms
   
2. HAZARD PREVENTION (Pillar I)
   - Risk identification and control systems
   - Sector-specific regulations
   - Fatal and non-fatal injury rates

3. HEALTH VIGILANCE (Pillar II)  
   - Surveillance and early detection
   - Occupational disease reporting
   - Health screening programs

4. RESTORATION & COMPENSATION (Pillar III)
   - Workers' compensation systems
   - Return-to-work programs
   - Rehabilitation services
"""

    return f"""
================================================================================
EXTENDED RESEARCH CONTEXT
================================================================================
Query: {query}
Research Mode: Internal Knowledge Base (Enhanced)

Note: Live web search unavailable. This analysis uses the GOHIP Platform's 
comprehensive occupational health knowledge base, incorporating global 
standards, benchmarks, and best practices.

To enable real-time Google search, configure SERPAPI_KEY in your environment.

{topic_context}

================================================================================
GLOBAL REFERENCE DATA
================================================================================

ILO CONVENTIONS & STANDARDS:
- C155: Occupational Safety and Health Convention (1981) - 74 ratifications
- C161: Occupational Health Services Convention (1985) - 36 ratifications  
- C187: Promotional Framework for OSH (2006) - 60 ratifications
- C190: Violence and Harassment Convention (2019) - 42 ratifications

GLOBAL BENCHMARKS (OECD/ILO/WHO):
- Fatal occupational injury rate: OECD average 2.0 per 100,000
- Non-fatal injury rate: ~2,500 per 100,000 workers
- Inspector density: ILO target 1 per 10,000 workers
- Health surveillance coverage: WHO target >80%
- RTW success rate: Best practice >70%

AUTHORITATIVE DATA SOURCES:
1. ILO ILOSTAT - Labor statistics and indicators
2. ILO NATLEX - Database of national labor legislation
3. ILO LEGOSH - Global database on OSH legislation
4. WHO Global Health Observatory - Health data and statistics
5. World Bank - Economic and labor force indicators
6. OECD.Stat - Comparative labor market data
7. EU-OSHA - European Agency data and reports

REGIONAL FRAMEWORKS:
- EU: Framework Directive 89/391/EEC + daughter directives
- ASEAN: ASEAN-OSHNET regional cooperation
- Africa: African Union Agenda 2063 labor provisions
- Americas: CIMT/OAS labor declarations
- GCC: Unified GCC labor law framework

================================================================================
RECOMMENDATION: For the most current country-specific data, consult the 
authoritative sources listed above or configure SerpAPI for live web research.
================================================================================
"""


# =============================================================================
# ERROR HANDLING UTILITIES
# =============================================================================

def get_detailed_error_info(error: Exception) -> Dict[str, Any]:
    """
    Extract detailed error information from an exception.
    
    Captures API error details, HTTP status codes, and rate limit info
    for better debugging of OpenAI and other provider errors.
    """
    error_info = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "is_rate_limit": False,
        "is_quota_exceeded": False,
        "is_invalid_model": False,
        "http_status": None,
        "retry_after": None,
    }
    
    error_str = str(error).lower()
    
    # Check for rate limit indicators
    if '429' in str(error) or 'rate' in error_str or 'ratelimit' in type(error).__name__.lower():
        error_info["is_rate_limit"] = True
    
    # Check for quota exceeded
    if 'quota' in error_str or 'billing' in error_str or 'exceeded' in error_str:
        error_info["is_quota_exceeded"] = True
    
    # Check for invalid model
    if 'model' in error_str and ('not found' in error_str or 'does not exist' in error_str or 'invalid' in error_str):
        error_info["is_invalid_model"] = True
    
    # Try to extract HTTP status code
    if hasattr(error, 'status_code'):
        error_info["http_status"] = error.status_code
    elif hasattr(error, 'response') and hasattr(error.response, 'status_code'):
        error_info["http_status"] = error.response.status_code
    
    # Try to extract retry-after header
    if hasattr(error, 'response') and hasattr(error.response, 'headers'):
        retry_after = error.response.headers.get('retry-after') or error.response.headers.get('x-ratelimit-reset-requests')
        if retry_after:
            error_info["retry_after"] = retry_after
    
    # Log detailed error info
    logger.error(f"[ErrorHandler] Detailed error info: {json.dumps(error_info, indent=2)}")
    
    return error_info


def format_error_for_user(error: Exception) -> str:
    """
    Format an error message for user display.
    
    Provides actionable guidance based on error type.
    """
    error_info = get_detailed_error_info(error)
    
    if error_info["is_invalid_model"]:
        return f"Invalid model specified. The model '{error}' does not exist. Please update your AI Configuration to use a valid model like 'gpt-4o' or 'gpt-4-turbo'."
    
    if error_info["is_quota_exceeded"]:
        return "OpenAI quota exceeded. Please check your billing at https://platform.openai.com/account/billing"
    
    if error_info["is_rate_limit"]:
        retry_msg = f" Retry after: {error_info['retry_after']}" if error_info["retry_after"] else ""
        return f"Rate limit hit. The system will retry automatically.{retry_msg}"
    
    return f"AI Error: {error_info['error_type']}: {error_info['error_message']}"


# =============================================================================
# LLM INTEGRATION (MULTI-PROVIDER)
# =============================================================================

def get_llm_from_config(config: AIConfig, override_provider: str = None, override_model: str = None):
    """
    Get the appropriate LangChain LLM based on configuration.
    
    Args:
        config: AIConfig from database
        override_provider: Optional provider override (for per-agent LLM selection)
        override_model: Optional model override (for per-agent LLM selection)
        
    Returns:
        LangChain chat model instance
    """
    if not config:
        logger.error("[LLM Factory] No AI config provided")
        raise ValueError("AI configuration is required")
    
    # Decrypt API key
    api_key = None
    if config.api_key_encrypted:
        try:
            api_key = decrypt_api_key(config.api_key_encrypted)
            logger.info(f"[LLM Factory] API key decrypted successfully (length: {len(api_key) if api_key else 0})")
        except Exception as e:
            logger.error(f"[LLM Factory] Failed to decrypt API key: {e}")
            raise ValueError(f"Failed to decrypt API key: {e}")
    else:
        logger.warning("[LLM Factory] No encrypted API key found in config")
    
    # Use override values if provided, otherwise use config defaults
    if override_provider:
        provider = AIProvider(override_provider)
        logger.info(f"[LLM Factory] Using provider override: {override_provider}")
    else:
        provider = config.provider
    
    if override_model:
        model = override_model
        logger.info(f"[LLM Factory] Using model override: {override_model}")
    else:
        model = config.model_name
    
    temperature = config.temperature
    
    # For reasoning models (GPT-5, o1, o3), need much higher max_tokens
    # because reasoning tokens count against the limit
    base_max_tokens = config.max_tokens or 4096
    if 'gpt-5' in model.lower() or 'o1' in model.lower() or 'o3' in model.lower():
        # Reasoning models need 16k+ tokens (reasoning uses ~4-8k, output needs ~4k)
        max_tokens = max(base_max_tokens, 16384)
        logger.info(f"[LLM Factory] Reasoning model detected - increasing max_tokens to {max_tokens}")
    else:
        max_tokens = base_max_tokens
    
    logger.info(f"[LLM Factory] Creating LLM: provider={provider.value}, model={model}, temp={temperature}, max_tokens={max_tokens}")
    
    try:
        if provider == AIProvider.openai:
            from langchain_openai import ChatOpenAI
            if not api_key:
                raise ValueError("OpenAI API key is required")
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                api_key=api_key,
                max_tokens=max_tokens,
                request_timeout=120,  # 2 minute timeout
            )
        
        elif provider == AIProvider.anthropic:
            from langchain_anthropic import ChatAnthropic
            if not api_key:
                raise ValueError("Anthropic API key is required")
            return ChatAnthropic(
                model=model,
                temperature=temperature,
                api_key=api_key,
                max_tokens=max_tokens,
                timeout=120,  # 2 minute timeout
            )
        
        elif provider == AIProvider.google:
            from langchain_google_genai import ChatGoogleGenerativeAI
            if not api_key:
                raise ValueError("Google API key is required")
            return ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
                google_api_key=api_key,
                max_output_tokens=max_tokens,
            )
        
        elif provider == AIProvider.azure_openai:
            from langchain_openai import AzureChatOpenAI
            if not api_key:
                raise ValueError("Azure OpenAI API key is required")
            return AzureChatOpenAI(
                deployment_name=model,
                temperature=temperature,
                api_key=api_key,
                azure_endpoint=config.api_endpoint,
                api_version="2024-02-01",
                request_timeout=120,
            )
        
        elif provider == AIProvider.mistral:
            from langchain_mistralai import ChatMistralAI
            if not api_key:
                raise ValueError("Mistral API key is required")
            return ChatMistralAI(
                model=model,
                temperature=temperature,
                api_key=api_key,
            )
        
        elif provider == AIProvider.ollama:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=model,
                temperature=temperature,
                base_url=config.api_endpoint or "http://localhost:11434",
            )
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
            
    except ImportError as e:
        logger.error(f"[LLM Factory] Missing LangChain dependency for {provider.value}: {e}")
        raise ValueError(f"Missing dependency for {provider.value}. Install: pip install langchain-{provider.value}")
    except Exception as e:
        logger.error(f"[LLM Factory] Failed to create LLM for {provider.value}: {e}")
        raise


def call_orchestrator_llm(
    config: AIConfig,
    research_context: str,
    metrics_context: str,
    country_name: str,
    topic: str,
    db: Optional[Session] = None,
    country_iso_code: Optional[str] = None,
    user_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """
    Call configured LLM to synthesize research and metrics into strategic analysis.
    """
    import time
    start_time = time.time()
    success = False
    error_message = None
    
    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        
        llm = get_llm_from_config(config)
        
        user_prompt = f"""Analyze the following information about {country_name}'s strategy for: {topic}

=== WEB RESEARCH FINDINGS ===
{research_context}

=== INTERNAL DATABASE METRICS ===
{metrics_context}

Generate a comprehensive strategic analysis as specified in your instructions.
Output ONLY valid JSON matching the required schema."""
        
        messages = [
            SystemMessage(content=ORCHESTRATOR_PROMPT),
            HumanMessage(content=user_prompt),
        ]
        
        response = llm.invoke(messages)
        
        # Parse JSON response
        content = response.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        
        result = json.loads(content)
        success = True
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        error_message = f"JSON parse error: {str(e)}"
        return None
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        error_message = str(e)
        return None
    finally:
        # Log the trace if db session is available
        if db:
            latency_ms = int((time.time() - start_time) * 1000)
            try:
                AICallTracer.trace(
                    db=db,
                    provider=config.provider.value,
                    model_name=config.model_name,
                    operation_type="orchestrator_synthesis",
                    success=success,
                    latency_ms=latency_ms,
                    endpoint="/api/v1/ai/deep-dive",
                    country_iso_code=country_iso_code,
                    topic=topic,
                    error_message=error_message,
                    user_id=user_id,
                )
            except Exception as trace_error:
                logger.warning(f"Failed to log AI call trace: {trace_error}")


# =============================================================================
# OPENAI RESPONSES API WITH NATIVE WEB SEARCH
# =============================================================================

def call_openai_with_web_search(
    system_prompt: str,
    user_prompt: str,
    country_iso_code: str,
    api_key: str,
    model: str = "gpt-4o",
    temperature: float = 0.7,
    db: Optional[Session] = None,
    topic: Optional[str] = None,
    user_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """
    Use OpenAI Responses API with native web_search tool.
    
    The model decides when to search the web and synthesizes results automatically.
    This provides more integrated and contextual web research compared to 
    separate Tavily/SerpAPI calls.
    
    Args:
        system_prompt: System instructions for the AI
        user_prompt: User prompt with data and analysis requirements
        country_iso_code: ISO 3166-1 alpha-3 code (e.g., 'USA', 'GBR')
        api_key: OpenAI API key
        model: Model to use (default: gpt-4o)
        temperature: Temperature for generation (default: 0.7)
        
    Returns:
        Parsed JSON response or None on failure
    """
    import time
    
    MAX_RETRIES = 3
    BASE_DELAY = 5
    start_time = time.time()
    success = False
    error_message = None
    
    try:
        from openai import OpenAI
        
        logger.info(f"[OpenAI Web Search] Initializing with model: {model}")
        
        client = OpenAI(api_key=api_key)
        
        # Map ISO-3 to ISO-2 country code for location hint
        # Common mappings (OpenAI expects 2-letter codes)
        iso3_to_iso2 = {
            "USA": "US", "GBR": "GB", "DEU": "DE", "FRA": "FR", "JPN": "JP",
            "CHN": "CN", "IND": "IN", "BRA": "BR", "CAN": "CA", "AUS": "AU",
            "MEX": "MX", "KOR": "KR", "ESP": "ES", "ITA": "IT", "NLD": "NL",
            "CHE": "CH", "SAU": "SA", "ARE": "AE", "SGP": "SG", "ZAF": "ZA",
            "NGA": "NG", "EGY": "EG", "TUR": "TR", "POL": "PL", "SWE": "SE",
            "NOR": "NO", "DNK": "DK", "FIN": "FI", "BEL": "BE", "AUT": "AT",
            "PRT": "PT", "GRC": "GR", "CZE": "CZ", "ROU": "RO", "HUN": "HU",
            "ISR": "IL", "THA": "TH", "MYS": "MY", "IDN": "ID", "PHL": "PH",
            "VNM": "VN", "PAK": "PK", "BGD": "BD", "ARG": "AR", "CHL": "CL",
            "COL": "CO", "PER": "PE", "VEN": "VE", "KEN": "KE", "ETH": "ET",
            "TZA": "TZ", "GHA": "GH", "UGA": "UG", "MAR": "MA", "DZA": "DZ",
            "RUS": "RU", "UKR": "UA", "KAZ": "KZ", "UZB": "UZ", "IRN": "IR",
            "IRQ": "IQ", "QAT": "QA", "KWT": "KW", "OMN": "OM", "BHR": "BH",
            "JOR": "JO", "LBN": "LB", "NZL": "NZ", "IRL": "IE", "LUX": "LU",
        }
        
        iso2_code = iso3_to_iso2.get(country_iso_code.upper(), country_iso_code[:2].upper())
        
        logger.info(f"[OpenAI Web Search] Using location hint: {iso2_code} (from {country_iso_code})")
        
        # Prepare the request with web_search tool
        response = None
        last_error = None
        
        # Check if model supports temperature parameter
        # Reasoning models (gpt-5, o1, o3) don't support temperature
        is_reasoning_model = any(x in model.lower() for x in ['gpt-5', 'o1', 'o3'])
        
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"[OpenAI Web Search] API call attempt {attempt + 1}/{MAX_RETRIES}")
                
                # Build request params
                request_params = {
                    "model": model,
                    "tools": [{
                        "type": "web_search",
                        "user_location": {
                            "type": "approximate",
                            "country": iso2_code
                        }
                    }],
                    "input": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                }
                
                # Only add temperature for non-reasoning models
                if not is_reasoning_model:
                    request_params["temperature"] = temperature
                    logger.info(f"[OpenAI Web Search] Using temperature={temperature}")
                else:
                    logger.info(f"[OpenAI Web Search] Reasoning model detected, skipping temperature parameter")
                
                response = client.responses.create(**request_params)
                
                break  # Success
                
            except Exception as e:
                error_str = str(e).lower()
                is_rate_limit = any(x in error_str for x in ['rate', '429', 'quota', 'limit'])
                
                if is_rate_limit and attempt < MAX_RETRIES - 1:
                    delay = BASE_DELAY * (2 ** attempt)
                    logger.warning(f"[OpenAI Web Search] Rate limit hit, waiting {delay}s...")
                    time.sleep(delay)
                    last_error = e
                else:
                    raise e
        
        if response is None:
            if last_error:
                raise last_error
            logger.error("[OpenAI Web Search] No response after retries")
            raise ValueError("OpenAI API returned no response after retries")
        
        # Extract the output text
        output_text = response.output_text
        
        if not output_text:
            logger.error("[OpenAI Web Search] Empty response from API")
            logger.error(f"[OpenAI Web Search] Full response object: {response}")
            raise ValueError("OpenAI API returned empty output. The model may have rejected the request or timed out.")
        
        logger.info(f"[OpenAI Web Search] Response received: {len(output_text)} chars")
        
        # Extract citations/sources from the response if available
        sources = []
        if hasattr(response, 'output') and response.output:
            for item in response.output:
                if hasattr(item, 'type') and item.type == 'web_search_call':
                    if hasattr(item, 'action') and hasattr(item.action, 'sources') and item.action.sources:
                        sources.extend(item.action.sources)
                elif hasattr(item, 'content') and item.content:
                    for content_item in item.content:
                        if hasattr(content_item, 'annotations') and content_item.annotations:
                            for annotation in content_item.annotations:
                                if hasattr(annotation, 'url'):
                                    sources.append({
                                        'url': annotation.url,
                                        'title': getattr(annotation, 'title', '')
                                    })
        
        if sources:
            logger.info(f"[OpenAI Web Search] Found {len(sources)} source citations")
        
        # Parse JSON from the response
        content = output_text.strip()
        
        # Handle markdown code blocks
        if content.startswith("```"):
            parts = content.split("```")
            if len(parts) >= 2:
                content = parts[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
        
        # Parse JSON
        result = json.loads(content)
        
        # Add sources to result if not already present
        if sources and 'source_urls' not in result:
            result['source_urls'] = [s.get('url', s) if isinstance(s, dict) else s for s in sources[:20]]
        
        logger.info(f"[OpenAI Web Search] Successfully parsed response with {len(result)} keys")
        success = True
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"[OpenAI Web Search] JSON parse error: {e}")
        logger.error(f"[OpenAI Web Search] Content: {content[:500] if content else 'EMPTY'}")
        error_message = f"JSON parse error: {str(e)}"
        raise ValueError(f"OpenAI returned non-JSON response. Content preview: {content[:200] if content else 'EMPTY'}")
    except ImportError as e:
        logger.error(f"[OpenAI Web Search] OpenAI package not installed or outdated: {e}")
        error_message = f"Import error: {str(e)}"
        raise ValueError(f"OpenAI package not installed or outdated: {e}")
    except Exception as e:
        logger.error(f"[OpenAI Web Search] API call failed: {type(e).__name__}: {e}")
        error_message = f"{type(e).__name__}: {str(e)}"
        raise ValueError(f"OpenAI API error: {type(e).__name__}: {str(e)[:200]}")
    finally:
        # Log the trace if db session is available
        if db:
            latency_ms = int((time.time() - start_time) * 1000)
            try:
                AICallTracer.trace(
                    db=db,
                    provider="openai",
                    model_name=model,
                    operation_type="openai_web_search",
                    success=success,
                    latency_ms=latency_ms,
                    endpoint="/api/v1/ai/deep-dive",
                    country_iso_code=country_iso_code,
                    topic=topic,
                    error_message=error_message,
                    user_id=user_id,
                )
            except Exception as trace_error:
                logger.warning(f"Failed to log AI call trace: {trace_error}")


def get_openai_api_key_from_config(config: AIConfig) -> Optional[str]:
    """
    Extract and decrypt OpenAI API key from config.
    
    Args:
        config: AIConfig object
        
    Returns:
        Decrypted API key or None
    """
    if not config or not config.api_key_encrypted:
        return None
    
    try:
        return decrypt_api_key(config.api_key_encrypted)
    except Exception as e:
        logger.error(f"[OpenAI Web Search] Failed to decrypt API key: {e}")
        return None


# =============================================================================
# DEEP DIVE ORCHESTRATOR CLASS
# =============================================================================

class DeepDiveOrchestrator:
    """
    Multi-Agent Orchestrator for Deep Dive Strategic Analysis.
    
    Coordinates three specialized agents:
    1. ResearchAgent - Web research via SerpAPI
    2. DataAgent - Internal database queries
    3. Orchestrator - LLM synthesis (multi-provider)
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.agent_log: List[AgentLogEntry] = []
        self.config: Optional[AIConfig] = None
    
    def _log(self, agent: str, status: AgentStatus, message: str, emoji: str = "📍") -> None:
        """Add an entry to the agent activity log."""
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
        """Get the active AI configuration from database."""
        config = self.db.query(AIConfig).filter(AIConfig.is_active == True).first()
        if not config or not config.is_configured:
            return None
        return config
    
    def run_analysis(self, iso_code: str, topic: str = "occupational health strategy") -> Dict[str, Any]:
        """
        Execute the full Deep Dive analysis pipeline.
        """
        iso_code = iso_code.upper()
        self.agent_log = []
        
        self._log("Orchestrator", AgentStatus.STARTING,
                  f"Initiating Deep Dive analysis for {iso_code} on topic: {topic}", "🚀")
        
        # Get AI configuration
        self.config = self._get_ai_config()
        if not self.config:
            self._log("Orchestrator", AgentStatus.ERROR,
                      "AI not configured. Admin must configure AI provider in settings.", "❌")
            return {
                "success": False,
                "error": "AI not configured. Please contact admin to configure AI settings.",
                "agent_log": [e.to_dict() for e in self.agent_log],
            }
        
        provider_name = f"{self.config.provider.value} ({self.config.model_name})"
        self._log("Orchestrator", AgentStatus.ANALYZING,
                  f"Using AI provider: {provider_name}", "🤖")
        
        # =====================================================================
        # STEP 1: DataAgent - Fetch Internal Metrics
        # =====================================================================
        self._log("DataAgent", AgentStatus.QUERYING,
                  "Connecting to GOHIP database for country metrics...", "📊")
        
        country = self.db.query(Country).filter(Country.iso_code == iso_code).first()
        
        if not country:
            self._log("DataAgent", AgentStatus.ERROR,
                      f"Country {iso_code} not found in database", "❌")
            return {
                "success": False,
                "error": f"Country with ISO code '{iso_code}' not found in database",
                "agent_log": [e.to_dict() for e in self.agent_log],
            }
        
        metrics = extract_country_metrics(country)
        metrics_text = format_metrics_for_llm(metrics)
        
        self._log("DataAgent", AgentStatus.COMPLETE,
                  f"Retrieved metrics for {country.name} across 4 pillars", "✅")
        
        # =====================================================================
        # STEP 2: ResearchAgent - Web Search
        # =====================================================================
        self._log("ResearchAgent", AgentStatus.RESEARCHING,
                  f"Searching web for '{country.name} {topic} occupational health'...", "🔍")
        
        search_query = f"{country.name} {topic} occupational health policy strategy"
        search_results = perform_web_search(search_query)
        
        self._log("ResearchAgent", AgentStatus.COMPLETE,
                  f"Retrieved web research for {country.name}", "✅")
        
        # =====================================================================
        # STEP 3: Orchestrator - AI Synthesis
        # =====================================================================
        self._log("Orchestrator", AgentStatus.SYNTHESIZING,
                  f"Synthesizing with {self.config.provider.value}...", "🧠")
        
        analysis = call_orchestrator_llm(
            config=self.config,
            research_context=search_results,
            metrics_context=metrics_text,
            country_name=country.name,
            topic=topic,
            db=self.db,
            country_iso_code=iso_code,
        )
        
        if not analysis:
            self._log("Orchestrator", AgentStatus.ERROR,
                      "AI synthesis failed. Check API key and configuration.", "❌")
            return {
                "success": False,
                "error": "AI synthesis failed. Please check AI configuration.",
                "agent_log": [e.to_dict() for e in self.agent_log],
            }
        
        self._log("Orchestrator", AgentStatus.COMPLETE,
                  f"Strategic analysis generated successfully via {self.config.provider.value}", "✨")
        
        # Build result
        swot = SWOTAnalysis(**analysis.get("swot_analysis", {}))
        
        result = DeepDiveResult(
            strategy_name=analysis["strategy_name"],
            country_name=country.name,
            iso_code=iso_code,
            topic=topic,
            key_findings=analysis["key_findings"],
            swot_analysis=swot,
            recommendation=analysis["recommendation"],
            executive_summary=analysis["executive_summary"],
            data_sources={
                "internal_metrics": metrics,
                "web_research_query": search_query,
            },
            agent_log=self.agent_log,
            generated_at=datetime.utcnow().isoformat() + "Z",
            source=provider_name,
        )
        
        return {
            "success": True,
            **result.to_dict(),
        }


# =============================================================================
# PUBLIC API
# =============================================================================

def run_deep_dive_analysis(iso_code: str, topic: str, db: Session) -> Dict[str, Any]:
    """
    Run a Deep Dive analysis for a country and topic.
    
    Main entry point for the Deep Dive feature.
    """
    orchestrator = DeepDiveOrchestrator(db)
    return orchestrator.run_analysis(iso_code, topic)
