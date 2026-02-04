"""
GOHIP Platform - AI Service
============================

Simple AI service for generating content using configured LLM.
Used by various endpoints that need AI-generated text.

Uses synchronous LLM calls wrapped in asyncio for better compatibility
with all LangChain LLM providers.

IMPORTANT: This module extracts config values BEFORE passing to thread pool
to avoid SQLAlchemy session/thread-safety issues.
"""

import logging
import asyncio
from typing import Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.orm import Session
from langchain_core.messages import SystemMessage, HumanMessage

from app.models.user import AIConfig, AIProvider
from app.core.security import decrypt_api_key

logger = logging.getLogger(__name__)

# Thread pool for running sync LLM calls in async context
_executor = ThreadPoolExecutor(max_workers=4)


def _create_llm_from_values(
    provider: AIProvider,
    model_name: str,
    api_key: str,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    api_endpoint: Optional[str] = None,
):
    """
    Create LangChain LLM from plain Python values (thread-safe).
    
    This mirrors the pattern used in the working test connection.
    """
    # For reasoning models (GPT-5, o1, o3), need much higher max_tokens
    if 'gpt-5' in model_name.lower() or 'o1' in model_name.lower() or 'o3' in model_name.lower():
        max_tokens = max(max_tokens, 16384)
        logger.info(f"[AI Service] Reasoning model detected - using max_tokens={max_tokens}")
    
    logger.info(f"[AI Service] Creating LLM: provider={provider.value}, model={model_name}")
    
    if provider == AIProvider.openai:
        from langchain_openai import ChatOpenAI
        if not api_key:
            raise ValueError("OpenAI API key is required")
        return ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=api_key,
            max_tokens=max_tokens,
            request_timeout=120,
        )
    
    elif provider == AIProvider.anthropic:
        from langchain_anthropic import ChatAnthropic
        if not api_key:
            raise ValueError("Anthropic API key is required")
        return ChatAnthropic(
            model=model_name,
            temperature=temperature,
            api_key=api_key,
            max_tokens=max_tokens,
            timeout=120,
        )
    
    elif provider == AIProvider.google:
        from langchain_google_genai import ChatGoogleGenerativeAI
        if not api_key:
            raise ValueError("Google API key is required")
        return ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=api_key,
            max_output_tokens=max_tokens,
        )
    
    elif provider == AIProvider.azure_openai:
        from langchain_openai import AzureChatOpenAI
        if not api_key:
            raise ValueError("Azure OpenAI API key is required")
        return AzureChatOpenAI(
            deployment_name=model_name,
            temperature=temperature,
            api_key=api_key,
            azure_endpoint=api_endpoint,
            api_version="2024-02-01",
            request_timeout=120,
        )
    
    elif provider == AIProvider.mistral:
        from langchain_mistralai import ChatMistralAI
        if not api_key:
            raise ValueError("Mistral API key is required")
        return ChatMistralAI(
            model=model_name,
            temperature=temperature,
            api_key=api_key,
            max_tokens=max_tokens,
        )
    
    elif provider == AIProvider.cohere:
        from langchain_cohere import ChatCohere
        if not api_key:
            raise ValueError("Cohere API key is required")
        return ChatCohere(
            model=model_name,
            temperature=temperature,
            cohere_api_key=api_key,
            max_tokens=max_tokens,
        )
    
    elif provider == AIProvider.ollama:
        from langchain_ollama import ChatOllama
        base_url = api_endpoint or "http://localhost:11434"
        return ChatOllama(
            model=model_name,
            temperature=temperature,
            base_url=base_url,
        )
    
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")


def _call_llm_sync_safe(
    config_data: Dict[str, Any],
    prompt: str,
    system_prompt: Optional[str] = None,
) -> str:
    """
    Thread-safe synchronous LLM call using plain dict values.
    
    This avoids SQLAlchemy session issues by not accessing model objects.
    """
    # Decrypt API key (safe - no SQLAlchemy access)
    api_key = None
    if config_data.get("api_key_encrypted"):
        api_key = decrypt_api_key(config_data["api_key_encrypted"])
        if api_key:
            logger.info(f"[AI Service] API key decrypted (length: {len(api_key)})")
        else:
            logger.error("[AI Service] API key decryption returned None")
            raise ValueError("Failed to decrypt API key")
    
    # Create LLM from plain values
    llm = _create_llm_from_values(
        provider=config_data["provider"],
        model_name=config_data["model_name"],
        api_key=api_key,
        temperature=config_data.get("temperature", 0.7),
        max_tokens=config_data.get("max_tokens", 4096),
        api_endpoint=config_data.get("api_endpoint"),
    )
    
    # Build messages
    messages = []
    if system_prompt:
        messages.append(SystemMessage(content=system_prompt))
    messages.append(HumanMessage(content=prompt))
    
    # Call LLM synchronously
    logger.info(f"[AI Service] Sending request to {config_data['model_name']}...")
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
    
    IMPORTANT: Extracts config values BEFORE passing to thread pool
    to avoid SQLAlchemy session/thread-safety issues.
    
    Args:
        db: Database session (not used in thread pool)
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
    
    # CRITICAL: Extract all values from SQLAlchemy object BEFORE passing to thread pool
    # This prevents session/thread-safety issues
    config_data = {
        "provider": ai_config.provider,
        "model_name": ai_config.model_name,
        "api_key_encrypted": ai_config.api_key_encrypted,
        "temperature": ai_config.temperature if ai_config.temperature is not None else 0.7,
        "max_tokens": ai_config.max_tokens if ai_config.max_tokens is not None else 4096,
        "api_endpoint": getattr(ai_config, 'api_endpoint', None),
    }
    
    logger.info(f"[AI Service] Config extracted: provider={config_data['provider'].value}, model={config_data['model_name']}")
    
    try:
        # Use get_running_loop() for modern Python (3.10+)
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(
            _executor,
            _call_llm_sync_safe,
            config_data,
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
    
    # Extract config values (same pattern as async version)
    config_data = {
        "provider": ai_config.provider,
        "model_name": ai_config.model_name,
        "api_key_encrypted": ai_config.api_key_encrypted,
        "temperature": ai_config.temperature if ai_config.temperature is not None else 0.7,
        "max_tokens": ai_config.max_tokens if ai_config.max_tokens is not None else 4096,
        "api_endpoint": getattr(ai_config, 'api_endpoint', None),
    }
    
    try:
        result = _call_llm_sync_safe(config_data, prompt, system_prompt)
        logger.info(f"[AI Service] Received response ({len(result)} chars)")
        return result
        
    except Exception as e:
        logger.error(f"[AI Service] Error calling AI: {e}", exc_info=True)
        raise
