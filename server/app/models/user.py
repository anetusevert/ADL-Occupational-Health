"""
GOHIP Platform - User and AI Configuration Models
=================================================

Phase 26: Authentication & AI Orchestration Management

Models:
- User: Authentication and authorization
- AIConfig: AI provider configuration (API keys, model selection)
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


# ============================================================================
# ENUMS
# ============================================================================

class UserRole(str, enum.Enum):
    """User role types."""
    admin = "admin"
    user = "user"
    viewer = "viewer"


class AIProvider(str, enum.Enum):
    """Supported AI providers."""
    openai = "openai"
    anthropic = "anthropic"
    google = "google"
    local = "local"
    azure_openai = "azure_openai"
    mistral = "mistral"
    cohere = "cohere"
    ollama = "ollama"


# ============================================================================
# USER MODEL
# ============================================================================

class User(Base):
    """
    User model for authentication and authorization.
    
    Supports role-based access control:
    - admin: Full access including user management and AI config
    - user: Access to all features except admin functions
    - viewer: Read-only access
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile
    full_name = Column(String(255), nullable=True)
    
    # Authorization
    role = Column(
        Enum(UserRole, name='userrole', create_type=False),
        default=UserRole.user,
        nullable=False,
        comment="User role for access control"
    )
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.value}')>"

    @property
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        return self.role == UserRole.admin


# ============================================================================
# AI CONFIGURATION MODEL
# ============================================================================

class AIConfig(Base):
    """
    AI Configuration model for storing provider settings.
    
    Stores encrypted API keys and model preferences for the AI orchestration layer.
    Only admins can modify these settings.
    """
    __tablename__ = "ai_config"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Provider Selection
    provider = Column(
        Enum(AIProvider, values_callable=lambda x: [e.value for e in x]),
        default=AIProvider.openai,
        nullable=False,
        comment="Selected AI provider"
    )
    
    # Model Configuration
    model_name = Column(
        String(100),
        default="gpt-4o",
        nullable=False,
        comment="Model identifier (e.g., gpt-4o, claude-3-opus, gemini-pro)"
    )
    
    # API Configuration (encrypted)
    api_key_encrypted = Column(
        Text,
        nullable=True,
        comment="Encrypted API key for the provider"
    )
    
    # Optional: API endpoint for custom/local deployments
    api_endpoint = Column(
        String(500),
        nullable=True,
        comment="Custom API endpoint URL (for Azure, local models, etc.)"
    )
    
    # Model Parameters
    temperature = Column(Float, default=0.7, nullable=False)
    max_tokens = Column(Integer, default=4096, nullable=True)
    
    # Additional provider-specific settings
    extra_settings = Column(
        JSONB,
        nullable=True,
        comment="Additional provider-specific configuration"
    )
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_configured = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    configured_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    configured_by_user = relationship("User", foreign_keys=[configured_by])

    def __repr__(self):
        return f"<AIConfig(id={self.id}, provider='{self.provider.value}', model='{self.model_name}')>"


# ============================================================================
# METRIC EXPLANATION MODEL (Phase 26.5)
# ============================================================================

class MetricExplanation(Base):
    """
    Stores AI-generated metric explanations permanently.
    
    Generated by admin using the Metric Explanation Agent.
    Displayed to all users when hovering over metrics.
    """
    __tablename__ = "metric_explanations"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Country and Pillar Reference
    country_iso_code = Column(String(3), nullable=False, index=True)
    pillar_id = Column(String(20), nullable=False, index=True)  # governance, pillar1, pillar2, pillar3
    metric_name = Column(String(100), nullable=False)
    
    # Metric Values
    metric_value = Column(String(100), nullable=True)  # Current country value
    global_average = Column(Float, nullable=True)  # Global benchmark
    percentile_rank = Column(Float, nullable=True)  # 0-100 percentile
    
    # AI-Generated Content
    explanation = Column(Text, nullable=False)  # What is this metric about
    performance_analysis = Column(Text, nullable=True)  # How country performs
    performance_rating = Column(String(20), nullable=False, default="moderate")  # excellent/good/moderate/concerning/critical
    
    # Visual data for charts
    comparison_data = Column(JSONB, nullable=True)  # {regional_avg, best_performer, worst_performer, etc.}
    
    # Metadata
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    ai_provider = Column(String(50), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint per country/pillar/metric
    __table_args__ = (
        UniqueConstraint('country_iso_code', 'pillar_id', 'metric_name', name='uq_metric_explanation'),
    )
    
    # Relationships
    generated_by_user = relationship("User", foreign_keys=[generated_by])
    
    def __repr__(self):
        return f"<MetricExplanation(country='{self.country_iso_code}', pillar='{self.pillar_id}', metric='{self.metric_name}')>"


# ============================================================================
# SUPPORTED MODELS REFERENCE
# ============================================================================

SUPPORTED_MODELS = {
    AIProvider.openai: [
        {"id": "gpt-5", "name": "GPT-5", "description": "Latest and most advanced OpenAI model"},
        {"id": "gpt-4o", "name": "GPT-4o", "description": "Most capable GPT-4 model"},
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "Fast and affordable"},
        {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "description": "Powerful with vision"},
        {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "description": "Fast and cost-effective"},
    ],
    AIProvider.anthropic: [
        {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "description": "Most capable Claude model"},
        {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "description": "Balanced performance"},
        {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "description": "Fast and affordable"},
        {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "description": "Latest and most capable"},
    ],
    AIProvider.google: [
        {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "description": "Advanced reasoning"},
        {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "description": "Fast responses"},
        {"id": "gemini-pro", "name": "Gemini Pro", "description": "General purpose"},
    ],
    AIProvider.azure_openai: [
        {"id": "gpt-4o", "name": "Azure GPT-4o", "description": "Enterprise GPT-4o"},
        {"id": "gpt-4", "name": "Azure GPT-4", "description": "Enterprise GPT-4"},
    ],
    AIProvider.mistral: [
        {"id": "mistral-large-latest", "name": "Mistral Large", "description": "Most capable Mistral"},
        {"id": "mistral-medium-latest", "name": "Mistral Medium", "description": "Balanced"},
        {"id": "mistral-small-latest", "name": "Mistral Small", "description": "Fast"},
    ],
    AIProvider.ollama: [
        {"id": "llama3.1:70b", "name": "Llama 3.1 70B", "description": "Large local model"},
        {"id": "llama3.1:8b", "name": "Llama 3.1 8B", "description": "Fast local model"},
        {"id": "mixtral:8x7b", "name": "Mixtral 8x7B", "description": "MoE local model"},
        {"id": "codellama:34b", "name": "Code Llama 34B", "description": "Code-focused"},
    ],
    AIProvider.local: [
        {"id": "custom", "name": "Custom Model", "description": "Your own deployment"},
    ],
    AIProvider.cohere: [
        {"id": "command-r-plus", "name": "Command R+", "description": "Most capable Cohere"},
        {"id": "command-r", "name": "Command R", "description": "Balanced performance"},
    ],
}
