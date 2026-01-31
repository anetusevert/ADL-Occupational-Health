"""
Simple Agent Runner Service
============================

Runs any agent with provided variables. Simple, fast, effective.
"""

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.agent import Agent
from app.models.ai_config import AIConfig
from app.services.ai_orchestrator import get_llm_from_config

logger = logging.getLogger(__name__)


class AgentRunner:
    """
    Runs any agent with provided context variables.
    
    Simple usage:
        runner = AgentRunner(db)
        result = await runner.run("report-generation", {
            "COUNTRY_NAME": "Germany",
            "TOPIC": "Governance",
            "METRICS_DATA": "...",
            "INTELLIGENCE_DATA": "..."
        })
    """
    
    def __init__(self, db: Session, ai_config: Optional[AIConfig] = None):
        self.db = db
        self.ai_config = ai_config or self._get_active_config()
    
    def _get_active_config(self) -> Optional[AIConfig]:
        """Get the active AI configuration."""
        try:
            return self.db.query(AIConfig).filter(AIConfig.is_active == True).first()
        except Exception as e:
            logger.warning(f"Could not get AI config: {e}")
            return None
    
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
        update_stats: bool = True
    ) -> dict:
        """
        Run an agent with the provided variables.
        
        Args:
            agent_id: ID of the agent to run
            variables: Dict of template variables (e.g., {"COUNTRY_NAME": "Germany"})
            update_stats: Whether to update execution count and last_run_at
            
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
            
            # 3. Fill templates with variables
            system_prompt = self._fill_template(agent.system_prompt or "", variables)
            user_prompt = self._fill_template(agent.user_prompt_template or "", variables)
            
            if not user_prompt:
                return {
                    "success": False,
                    "output": None,
                    "error": "Agent has no user prompt template"
                }
            
            # 4. Get LLM and invoke
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
            
            logger.info(f"Running agent '{agent_id}' with {len(variables)} variables")
            
            response = await llm.ainvoke(messages)
            output = response.content
            
            # 5. Update agent stats
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
    
    def run_sync(self, agent_id: str, variables: dict) -> dict:
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
        
        return loop.run_until_complete(self.run(agent_id, variables))


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def run_agent(
    db: Session,
    agent_id: str,
    variables: dict,
    ai_config: Optional[AIConfig] = None
) -> dict:
    """
    Convenience function to run an agent.
    
    Example:
        result = await run_agent(db, "report-generation", {
            "COUNTRY_NAME": "Germany",
            "TOPIC": "Governance",
            "METRICS_DATA": metrics_text
        })
        
        if result["success"]:
            report = result["output"]
        else:
            error = result["error"]
    """
    runner = AgentRunner(db, ai_config)
    return await runner.run(agent_id, variables)
