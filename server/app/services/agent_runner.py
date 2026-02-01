"""
Enhanced Agent Runner Service
==============================

Runs any agent with automatic database context injection and optional web search.
Provides all agents with comprehensive country knowledge baseline.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.agent import Agent
from app.models.user import AIConfig
from app.services.ai_orchestrator import get_llm_from_config
from app.services.country_data_provider import CountryDataProvider, detect_country_from_name

logger = logging.getLogger(__name__)


class AgentRunner:
    """
    Runs any agent with automatic context injection.
    
    Features:
    - Auto-detects country from variables and injects full database context
    - Optional web search for real-time information
    - Template variable substitution
    - Execution tracking
    
    Simple usage:
        runner = AgentRunner(db)
        result = await runner.run("report-generation", {
            "ISO_CODE": "DEU",
            "TOPIC": "Governance",
        })
        # All database context is automatically injected!
    """
    
    def __init__(self, db: Session, ai_config: Optional[AIConfig] = None):
        self.db = db
        self.ai_config = ai_config or self._get_active_config()
        self.country_provider = CountryDataProvider(db)
    
    def _get_active_config(self) -> Optional[AIConfig]:
        """Get the active AI configuration."""
        try:
            return self.db.query(AIConfig).filter(AIConfig.is_active == True).first()
        except Exception as e:
            logger.warning(f"Could not get AI config: {e}")
            return None
    
    def _detect_country(self, variables: dict) -> Optional[str]:
        """
        Detect ISO code from variables.
        
        Checks for:
        - ISO_CODE directly
        - COUNTRY_NAME that can be resolved
        - COUNTRY that can be resolved
        """
        # Direct ISO code
        if variables.get("ISO_CODE"):
            return variables["ISO_CODE"].upper()
        
        # Try to detect from country name
        country_name = variables.get("COUNTRY_NAME") or variables.get("COUNTRY")
        if country_name:
            iso_code = detect_country_from_name(self.db, country_name)
            if iso_code:
                return iso_code
        
        return None
    
    def _inject_country_context(self, variables: dict) -> dict:
        """
        Inject country database context into variables.
        
        If a country is detected, fetches all database data and injects it.
        User-provided variables take precedence over auto-injected ones.
        """
        iso_code = self._detect_country(variables)
        if not iso_code:
            return variables
        
        # Fetch country context
        context = self.country_provider.get_country_context(iso_code)
        if not context:
            logger.warning(f"Could not fetch context for country: {iso_code}")
            return variables
        
        # Merge: context first, then user variables (user vars override)
        merged = {**context, **variables}
        
        logger.info(f"Injected database context for {context.get('COUNTRY_NAME', iso_code)}")
        return merged
    
    async def _perform_web_search(self, variables: dict) -> str:
        """
        Perform web search for additional context.
        
        Uses the existing web search infrastructure (Tavily, SerpAPI, etc.)
        """
        try:
            from app.services.ai_orchestrator import perform_extended_research
            
            country = variables.get("COUNTRY_NAME", "")
            topic = variables.get("TOPIC", "occupational health")
            
            # Build search query
            query = f"{country} {topic} occupational health safety 2024 2025 2026"
            
            logger.info(f"Performing web search: {query[:50]}...")
            
            # Perform search
            results = perform_extended_research(query, max_queries=3)
            
            if not results:
                return "No web search results available."
            
            # Format results
            formatted = ["## WEB RESEARCH RESULTS", ""]
            for i, result in enumerate(results[:10], 1):
                title = result.get("title", "No title")
                snippet = result.get("snippet", result.get("content", ""))[:300]
                url = result.get("url", "")
                formatted.append(f"{i}. **{title}**")
                formatted.append(f"   {snippet}")
                if url:
                    formatted.append(f"   Source: {url}")
                formatted.append("")
            
            return "\n".join(formatted)
            
        except Exception as e:
            logger.warning(f"Web search failed: {e}")
            return f"Web search unavailable: {str(e)}"
    
    def _fill_template(self, template: str, variables: dict) -> str:
        """Fill template variables in the prompt."""
        if not template:
            return ""
        
        result = template
        for key, value in variables.items():
            # Support both {VAR} and {{VAR}} formats
            result = result.replace(f"{{{key}}}", str(value))
            result = result.replace(f"{{{{{key}}}}}", str(value))
        
        return result
    
    async def run(
        self, 
        agent_id: str, 
        variables: dict,
        update_stats: bool = True,
        enable_web_search: bool = False,
    ) -> dict:
        """
        Run an agent with the provided variables.
        
        Args:
            agent_id: ID of the agent to run
            variables: Dict of template variables (e.g., {"ISO_CODE": "DEU", "TOPIC": "Governance"})
            update_stats: Whether to update execution count and last_run_at
            enable_web_search: Whether to perform web search for additional context
            
        Returns:
            Dict with 'success', 'output', and 'error' keys
        """
        try:
            # 1. Load agent from database
            agent = self.db.query(Agent).filter(Agent.id == agent_id).first()
            if not agent:
                return {
                    "success": False,
                    "output": None,
                    "error": f"Agent '{agent_id}' not found"
                }
            
            if not agent.is_active:
                return {
                    "success": False,
                    "output": None,
                    "error": f"Agent '{agent_id}' is not active"
                }
            
            # 2. Check AI config
            if not self.ai_config:
                return {
                    "success": False,
                    "output": None,
                    "error": "No AI configuration found. Please configure AI settings first."
                }
            
            # 3. Auto-inject country context
            enriched_variables = self._inject_country_context(variables)
            
            # 4. Optionally perform web search
            if enable_web_search or variables.get("ENABLE_WEB_SEARCH"):
                web_results = await self._perform_web_search(enriched_variables)
                enriched_variables["WEB_RESEARCH"] = web_results
            
            # 5. Fill templates with variables
            system_prompt = self._fill_template(agent.system_prompt or "", enriched_variables)
            user_prompt = self._fill_template(agent.user_prompt_template or "", enriched_variables)
            
            if not user_prompt:
                return {
                    "success": False,
                    "output": None,
                    "error": "Agent has no user prompt template"
                }
            
            # 6. Get LLM and invoke
            try:
                llm = get_llm_from_config(self.ai_config)
            except ValueError as e:
                return {
                    "success": False,
                    "output": None,
                    "error": f"LLM configuration error: {str(e)}"
                }
            
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=user_prompt))
            
            logger.info(f"Running agent '{agent_id}' with {len(enriched_variables)} variables")
            
            response = await llm.ainvoke(messages)
            output = response.content
            
            # Log the LLM output for debugging
            logger.info(f"[AgentRunner] LLM response type: {type(output)}")
            logger.info(f"[AgentRunner] LLM response length: {len(output) if output else 0}")
            logger.info(f"[AgentRunner] LLM response sample: {str(output)[:300] if output else 'None'}...")
            
            # 7. Update agent stats
            if update_stats:
                try:
                    agent.execution_count = (agent.execution_count or 0) + 1
                    agent.last_run_at = datetime.utcnow()
                    self.db.commit()
                except Exception as e:
                    logger.warning(f"Could not update agent stats: {e}")
                    self.db.rollback()
            
            logger.info(f"Agent '{agent_id}' completed successfully")
            
            return {
                "success": True,
                "output": output,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error running agent '{agent_id}': {e}", exc_info=True)
            return {
                "success": False,
                "output": None,
                "error": str(e)
            }
    
    def run_sync(self, agent_id: str, variables: dict, enable_web_search: bool = False) -> dict:
        """
        Synchronous version of run() for non-async contexts.
        Uses asyncio to run the async method.
        """
        import asyncio
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(self.run(agent_id, variables, enable_web_search=enable_web_search))


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def run_agent(
    db: Session,
    agent_id: str,
    variables: dict,
    ai_config: Optional[AIConfig] = None,
    enable_web_search: bool = False,
) -> dict:
    """
    Convenience function to run an agent with automatic context injection.
    
    Example:
        # Minimal usage - just specify country and topic
        result = await run_agent(db, "report-generation", {
            "ISO_CODE": "DEU",
            "TOPIC": "Governance",
        })
        
        # With web search
        result = await run_agent(db, "report-generation", {
            "ISO_CODE": "DEU",
            "TOPIC": "Governance",
        }, enable_web_search=True)
        
        if result["success"]:
            report = result["output"]
        else:
            error = result["error"]
    """
    runner = AgentRunner(db, ai_config)
    return await runner.run(agent_id, variables, enable_web_search=enable_web_search)
