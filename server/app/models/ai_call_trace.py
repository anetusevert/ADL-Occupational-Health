"""
GOHIP Platform - AI Call Trace Model
=====================================

Stores persistent logs of all AI provider API calls for auditing,
debugging, and performance monitoring.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class AICallTrace(Base):
    """
    AI Call Trace model for persistent logging of AI API calls.
    
    Stores metadata about each AI provider call including:
    - Provider and model information
    - Request context (endpoint, operation type)
    - Performance metrics (latency, success/failure)
    - User tracking for audit purposes
    """
    __tablename__ = "ai_call_traces"

    # Primary key - UUID for uniqueness
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique identifier for the trace"
    )
    
    # Timestamp
    timestamp = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
        comment="When the API call was made"
    )
    
    # Provider information
    provider = Column(
        String(50),
        nullable=False,
        index=True,
        comment="AI provider (openai, anthropic, google, etc.)"
    )
    model_name = Column(
        String(100),
        nullable=False,
        comment="Model identifier (gpt-4o, claude-3-opus, etc.)"
    )
    
    # Request context
    endpoint = Column(
        String(200),
        nullable=True,
        comment="API endpoint that triggered the call"
    )
    operation_type = Column(
        String(50),
        nullable=False,
        comment="Type of operation (deep_dive, assessment, test, metric_explanation)"
    )
    country_iso_code = Column(
        String(3),
        nullable=True,
        index=True,
        comment="Country ISO code if applicable"
    )
    topic = Column(
        String(200),
        nullable=True,
        comment="Topic or subject of the AI call"
    )
    
    # Performance metrics
    latency_ms = Column(
        Integer,
        nullable=True,
        comment="Response time in milliseconds"
    )
    success = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        comment="Whether the call succeeded"
    )
    error_message = Column(
        Text,
        nullable=True,
        comment="Error message if the call failed"
    )
    
    # User tracking
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        comment="User who initiated the call"
    )
    
    # Relationship
    user = relationship("User", foreign_keys=[user_id])
    
    # Additional indexes for common query patterns
    __table_args__ = (
        Index('ix_ai_call_traces_timestamp_desc', timestamp.desc()),
        Index('ix_ai_call_traces_provider_timestamp', provider, timestamp),
    )

    def __repr__(self):
        return (
            f"<AICallTrace(id='{self.id[:8]}...', "
            f"provider='{self.provider}', "
            f"model='{self.model_name}', "
            f"success={self.success})>"
        )

    def to_dict(self) -> dict:
        """Convert trace to dictionary for API responses."""
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "provider": self.provider,
            "model_name": self.model_name,
            "endpoint": self.endpoint,
            "operation_type": self.operation_type,
            "country_iso_code": self.country_iso_code,
            "topic": self.topic,
            "latency_ms": self.latency_ms,
            "success": self.success,
            "error_message": self.error_message,
            "user_id": self.user_id,
        }
