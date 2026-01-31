"""
GOHIP Platform - AI Configuration API Endpoints
================================================

Phase 26: AI Orchestration Management (Admin Only)

Endpoints for managing AI provider configuration:
- GET /ai-config - Get current AI configuration
- PUT /ai-config - Update AI configuration
- POST /ai-config/test - Test AI connection
- GET /ai-config/providers - List available providers and models
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import encrypt_api_key, decrypt_api_key
from app.core.dependencies import get_current_admin_user
from app.models.user import User, AIConfig, AIProvider, SUPPORTED_MODELS

# Create router
router = APIRouter(prefix="/ai-config", tags=["AI Configuration"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class AIConfigUpdate(BaseModel):
    """Schema for updating AI configuration."""
    provider: AIProvider
    model_name: str
    api_key: Optional[str] = Field(None, description="API key (will be encrypted)")
    api_endpoint: Optional[str] = Field(None, description="Custom API endpoint URL")
    temperature: float = Field(0.7, ge=0, le=2)
    max_tokens: Optional[int] = Field(4096, ge=100, le=128000)
    extra_settings: Optional[dict] = None


class AIConfigResponse(BaseModel):
    """AI configuration response (API key masked)."""
    id: int
    provider: AIProvider
    model_name: str
    api_key_configured: bool
    api_key_preview: Optional[str]  # Last 4 chars only
    api_endpoint: Optional[str]
    temperature: float
    max_tokens: Optional[int]
    extra_settings: Optional[dict]
    is_active: bool
    is_configured: bool
    configured_by: Optional[int]

    class Config:
        from_attributes = True


class ModelInfo(BaseModel):
    """Information about a specific model."""
    id: str
    name: str
    description: str


class ProviderInfo(BaseModel):
    """Information about an AI provider."""
    id: AIProvider
    name: str
    requires_api_key: bool
    requires_endpoint: bool
    models: List[ModelInfo]


class ProvidersListResponse(BaseModel):
    """Response listing all available providers."""
    providers: List[ProviderInfo]


class AITestRequest(BaseModel):
    """Request to test AI connection."""
    provider: Optional[AIProvider] = None
    model_name: Optional[str] = None
    api_key: Optional[str] = None
    prompt: str = "Hello, respond with just 'OK' if you can read this."


class AITestResponse(BaseModel):
    """Response from AI test."""
    success: bool
    message: str
    response: Optional[str] = None
    latency_ms: Optional[int] = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_or_create_config(db: Session, admin_id: int) -> AIConfig:
    """
    Get the current AI config or create a default one.
    
    We maintain a single active config record.
    """
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not config:
        config = AIConfig(
            provider=AIProvider.openai,
            model_name="gpt-4o",
            is_active=True,
            is_configured=False,
            configured_by=admin_id,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def mask_api_key(encrypted_key: Optional[str]) -> Optional[str]:
    """Decrypt and mask API key, showing only last 4 chars."""
    if not encrypted_key:
        return None
    
    decrypted = decrypt_api_key(encrypted_key)
    if not decrypted:
        return None
    
    if len(decrypted) <= 4:
        return "****"
    
    return f"{'*' * (len(decrypted) - 4)}{decrypted[-4:]}"


def config_to_response(config: AIConfig) -> AIConfigResponse:
    """Convert AIConfig to response schema with masked API key."""
    return AIConfigResponse(
        id=config.id,
        provider=config.provider,
        model_name=config.model_name,
        api_key_configured=bool(config.api_key_encrypted),
        api_key_preview=mask_api_key(config.api_key_encrypted),
        api_endpoint=config.api_endpoint,
        temperature=config.temperature,
        max_tokens=config.max_tokens,
        extra_settings=config.extra_settings,
        is_active=config.is_active,
        is_configured=config.is_configured,
        configured_by=config.configured_by,
    )


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get(
    "/",
    response_model=AIConfigResponse,
    summary="Get AI Configuration",
    description="Get the current AI provider configuration. API key is masked."
)
async def get_ai_config(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> AIConfigResponse:
    """
    Get current AI configuration.
    """
    config = get_or_create_config(db, admin.id)
    return config_to_response(config)


@router.put(
    "/",
    response_model=AIConfigResponse,
    summary="Update AI Configuration",
    description="Update the AI provider configuration. Only admins can modify."
)
async def update_ai_config(
    update_data: AIConfigUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> AIConfigResponse:
    """
    Update AI configuration.
    """
    config = get_or_create_config(db, admin.id)
    
    # Update fields
    config.provider = update_data.provider
    config.model_name = update_data.model_name
    config.temperature = update_data.temperature
    config.max_tokens = update_data.max_tokens
    config.api_endpoint = update_data.api_endpoint
    config.extra_settings = update_data.extra_settings
    config.configured_by = admin.id
    
    # Update API key if provided
    if update_data.api_key:
        config.api_key_encrypted = encrypt_api_key(update_data.api_key)
        config.is_configured = True
    
    # For local/Ollama models, API key is optional
    if update_data.provider in [AIProvider.local, AIProvider.ollama]:
        config.is_configured = True
    
    db.commit()
    db.refresh(config)
    
    return config_to_response(config)


@router.get(
    "/providers",
    response_model=ProvidersListResponse,
    summary="List AI Providers",
    description="Get a list of all supported AI providers and their models."
)
async def list_providers(
    admin: User = Depends(get_current_admin_user)
) -> ProvidersListResponse:
    """
    List all supported AI providers and their models.
    """
    providers = [
        ProviderInfo(
            id=AIProvider.openai,
            name="OpenAI",
            requires_api_key=True,
            requires_endpoint=False,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.openai]]
        ),
        ProviderInfo(
            id=AIProvider.anthropic,
            name="Anthropic (Claude)",
            requires_api_key=True,
            requires_endpoint=False,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.anthropic]]
        ),
        ProviderInfo(
            id=AIProvider.google,
            name="Google (Gemini)",
            requires_api_key=True,
            requires_endpoint=False,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.google]]
        ),
        ProviderInfo(
            id=AIProvider.azure_openai,
            name="Azure OpenAI",
            requires_api_key=True,
            requires_endpoint=True,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.azure_openai]]
        ),
        ProviderInfo(
            id=AIProvider.mistral,
            name="Mistral AI",
            requires_api_key=True,
            requires_endpoint=False,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.mistral]]
        ),
        ProviderInfo(
            id=AIProvider.cohere,
            name="Cohere",
            requires_api_key=True,
            requires_endpoint=False,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.cohere]]
        ),
        ProviderInfo(
            id=AIProvider.ollama,
            name="Ollama (Local)",
            requires_api_key=False,
            requires_endpoint=True,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.ollama]]
        ),
        ProviderInfo(
            id=AIProvider.local,
            name="Custom Local Model",
            requires_api_key=False,
            requires_endpoint=True,
            models=[ModelInfo(**m) for m in SUPPORTED_MODELS[AIProvider.local]]
        ),
    ]
    
    return ProvidersListResponse(providers=providers)


@router.post(
    "/test",
    response_model=AITestResponse,
    summary="Test AI Connection",
    description="Test the AI connection with a simple prompt."
)
async def test_ai_connection(
    test_request: AITestRequest,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> AITestResponse:
    """
    Test AI connection by sending a simple prompt.
    
    If provider/model/api_key not provided, uses saved config.
    """
    import time
    
    config = get_or_create_config(db, admin.id)
    
    # Use request params or fall back to saved config
    provider = test_request.provider or config.provider
    model_name = test_request.model_name or config.model_name
    
    # Get API key
    if test_request.api_key:
        api_key = test_request.api_key
    elif config.api_key_encrypted:
        api_key = decrypt_api_key(config.api_key_encrypted)
    else:
        api_key = None
    
    # Validate API key requirement
    if provider not in [AIProvider.local, AIProvider.ollama] and not api_key:
        return AITestResponse(
            success=False,
            message=f"API key required for {provider.value}",
        )
    
    try:
        start_time = time.time()
        
        # Test based on provider
        if provider == AIProvider.openai:
            response_text = await _test_openai(api_key, model_name, test_request.prompt)
        elif provider == AIProvider.anthropic:
            response_text = await _test_anthropic(api_key, model_name, test_request.prompt)
        elif provider == AIProvider.google:
            response_text = await _test_google(api_key, model_name, test_request.prompt)
        elif provider == AIProvider.ollama:
            endpoint = test_request.api_key or config.api_endpoint or "http://localhost:11434"
            response_text = await _test_ollama(endpoint, model_name, test_request.prompt)
        else:
            return AITestResponse(
                success=False,
                message=f"Testing not implemented for {provider.value}",
            )
        
        latency = int((time.time() - start_time) * 1000)
        
        return AITestResponse(
            success=True,
            message="Connection successful!",
            response=response_text,
            latency_ms=latency,
        )
        
    except Exception as e:
        return AITestResponse(
            success=False,
            message=f"Connection failed: {str(e)}",
        )


# =============================================================================
# PROVIDER TEST FUNCTIONS
# =============================================================================

async def _test_openai(api_key: str, model: str, prompt: str) -> str:
    """Test OpenAI connection."""
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage
    
    llm = ChatOpenAI(model=model, api_key=api_key, max_tokens=50)
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content


async def _test_anthropic(api_key: str, model: str, prompt: str) -> str:
    """Test Anthropic connection."""
    from langchain_anthropic import ChatAnthropic
    from langchain_core.messages import HumanMessage
    
    llm = ChatAnthropic(model=model, api_key=api_key, max_tokens=50)
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content


async def _test_google(api_key: str, model: str, prompt: str) -> str:
    """Test Google connection."""
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage
    
    llm = ChatGoogleGenerativeAI(model=model, google_api_key=api_key, max_output_tokens=50)
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content


async def _test_ollama(endpoint: str, model: str, prompt: str) -> str:
    """Test Ollama connection."""
    import httpx
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{endpoint}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=30,
        )
        response.raise_for_status()
        return response.json().get("response", "")
