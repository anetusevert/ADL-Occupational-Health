"""
GOHIP Platform - AI Service
============================

Simple AI service for generating content using configured LLM.
Used by various endpoints that need AI-generated text.

Uses synchronous LLM calls wrapped in asyncio for better compatibility
with all LangChain LLM providers.
"""

import logging
import asyncio
from typing import Optional
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.user import AIConfig
from app.services.ai_orchestrator import get_llm_from_config

logger = logging.getLogger(__name__)

# Thread pool for running sync LLM calls in async context
_executor = ThreadPoolExecutor(max_workers=4)


def _call_llm_sync(
    ai_config: AIConfig,
    prompt: str,
    system_prompt: Optional[str] = None,
) -> str:
    """
    Internal synchronous LLM call.
    """
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
    
    return result


async def call_ai_api(
    db: Session,
    ai_config: AIConfig,
    prompt: str,
    agent_id: str = "generic-agent",
    user_email: Optional[str] = None,
    system_prompt: Optional[str] = None,
) -> str:
    """
    Async wrapper to call the configured AI provider.
    
    Uses a thread pool to run sync LLM calls, ensuring compatibility
    with all LangChain providers.
    
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
        # Run sync LLM call in thread pool for async compatibility
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            _executor,
            _call_llm_sync,
            ai_config,
            prompt,
            system_prompt
        )
        
        logger.info(f"[AI Service] Received response ({len(result)} chars)")
        
        return result
        
    except Exception as e:
        logger.error(f"[AI Service] Error calling AI: {e}", exc_info=True)
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
        result = _call_llm_sync(ai_config, prompt, system_prompt)
        logger.info(f"[AI Service] Received response ({len(result)} chars)")
        return result
        
    except Exception as e:
        logger.error(f"[AI Service] Error calling AI: {e}", exc_info=True)
        raise
