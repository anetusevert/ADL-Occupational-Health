"""
GOHIP Platform - AI Service
============================

Simple AI service for generating content using configured LLM.
Used by various endpoints that need AI-generated text.
"""

import logging
from typing import Optional
from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.user import AIConfig
from app.services.ai_orchestrator import get_llm_from_config

logger = logging.getLogger(__name__)


async def call_ai_api(
    db: Session,
    ai_config: AIConfig,
    prompt: str,
    agent_id: str = "generic-agent",
    user_email: Optional[str] = None,
    system_prompt: Optional[str] = None,
) -> str:
    """
    Simple async wrapper to call the configured AI provider.
    
    Args:
        db: Database session
        ai_config: Active AI configuration
        prompt: The user prompt to send
        agent_id: Identifier for logging/tracing
        user_email: Optional user email for tracing
        system_prompt: Optional system message
        
    Returns:
        The AI response as a string
    """
    if not ai_config:
        raise ValueError("AI configuration is required")
    
    logger.info(f"[AI Service] Calling AI for agent '{agent_id}' with provider {ai_config.provider.value}")
    
    try:
        # Get LLM from config
        llm = get_llm_from_config(ai_config)
        
        # Build messages
        messages = []
        
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        
        messages.append(HumanMessage(content=prompt))
        
        # Call LLM
        logger.info(f"[AI Service] Sending request to {ai_config.model_name}...")
        response = await llm.ainvoke(messages)
        
        # Extract content
        result = response.content if hasattr(response, 'content') else str(response)
        
        logger.info(f"[AI Service] Received response ({len(result)} chars)")
        
        return result
        
    except Exception as e:
        logger.error(f"[AI Service] Error calling AI: {e}")
        raise


def call_ai_api_sync(
    db: Session,
    ai_config: AIConfig,
    prompt: str,
    agent_id: str = "generic-agent",
    user_email: Optional[str] = None,
    system_prompt: Optional[str] = None,
) -> str:
    """
    Synchronous version of call_ai_api for non-async contexts.
    """
    if not ai_config:
        raise ValueError("AI configuration is required")
    
    logger.info(f"[AI Service] Calling AI (sync) for agent '{agent_id}' with provider {ai_config.provider.value}")
    
    try:
        # Get LLM from config
        llm = get_llm_from_config(ai_config)
        
        # Build messages
        messages = []
        
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        
        messages.append(HumanMessage(content=prompt))
        
        # Call LLM synchronously
        logger.info(f"[AI Service] Sending request to {ai_config.model_name}...")
        response = llm.invoke(messages)
        
        # Extract content
        result = response.content if hasattr(response, 'content') else str(response)
        
        logger.info(f"[AI Service] Received response ({len(result)} chars)")
        
        return result
        
    except Exception as e:
        logger.error(f"[AI Service] Error calling AI: {e}")
        raise
