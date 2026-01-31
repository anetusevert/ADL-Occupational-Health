"""
GOHIP Platform - AI Call Tracer Service
========================================

Provides persistent logging of all AI provider API calls.
Stores metadata including provider, model, latency, success/error status.
"""

import logging
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Generator

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.ai_call_trace import AICallTrace

logger = logging.getLogger(__name__)


class AICallTracer:
    """
    Service for tracing and persisting AI API calls.
    
    Usage:
        # Direct tracing
        tracer = AICallTracer()
        tracer.trace(db, provider="openai", model_name="gpt-4o", ...)
        
        # Context manager for automatic timing
        with tracer.trace_call(db, provider="openai", model_name="gpt-4o", operation_type="deep_dive") as trace_ctx:
            result = llm.invoke(prompt)
            trace_ctx.set_success(True)
    """
    
    @staticmethod
    def trace(
        db: Session,
        provider: str,
        model_name: str,
        operation_type: str,
        success: bool,
        latency_ms: Optional[int] = None,
        endpoint: Optional[str] = None,
        country_iso_code: Optional[str] = None,
        topic: Optional[str] = None,
        error_message: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> AICallTrace:
        """
        Create and persist a call trace.
        
        Args:
            db: Database session
            provider: AI provider name (openai, anthropic, google, etc.)
            model_name: Model identifier (gpt-4o, claude-3-opus, etc.)
            operation_type: Type of operation (deep_dive, assessment, test, etc.)
            success: Whether the call succeeded
            latency_ms: Response time in milliseconds
            endpoint: API endpoint that triggered the call
            country_iso_code: Country ISO code if applicable
            topic: Topic or subject of the AI call
            error_message: Error message if the call failed
            user_id: User who initiated the call
            
        Returns:
            The created AICallTrace record
        """
        trace = AICallTrace(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            provider=provider,
            model_name=model_name,
            operation_type=operation_type,
            success=success,
            latency_ms=latency_ms,
            endpoint=endpoint,
            country_iso_code=country_iso_code,
            topic=topic,
            error_message=error_message,
            user_id=user_id,
        )
        
        try:
            db.add(trace)
            db.commit()
            logger.debug(f"AI call trace saved: {provider}/{model_name} - {'success' if success else 'error'}")
        except Exception as e:
            logger.error(f"Failed to save AI call trace: {e}")
            db.rollback()
            
        return trace
    
    @staticmethod
    def get_traces(
        db: Session,
        limit: int = 100,
        offset: int = 0,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        success: Optional[bool] = None,
        country_iso_code: Optional[str] = None,
        operation_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[AICallTrace]:
        """
        Query call traces with filters.
        
        Args:
            db: Database session
            limit: Maximum number of results
            offset: Pagination offset
            provider: Filter by provider
            model_name: Filter by model name
            success: Filter by success status
            country_iso_code: Filter by country
            operation_type: Filter by operation type
            start_date: Filter by start date
            end_date: Filter by end date
            
        Returns:
            List of AICallTrace records
        """
        query = db.query(AICallTrace)
        
        # Apply filters
        if provider:
            query = query.filter(AICallTrace.provider == provider)
        if model_name:
            query = query.filter(AICallTrace.model_name == model_name)
        if success is not None:
            query = query.filter(AICallTrace.success == success)
        if country_iso_code:
            query = query.filter(AICallTrace.country_iso_code == country_iso_code)
        if operation_type:
            query = query.filter(AICallTrace.operation_type == operation_type)
        if start_date:
            query = query.filter(AICallTrace.timestamp >= start_date)
        if end_date:
            query = query.filter(AICallTrace.timestamp <= end_date)
        
        # Order by most recent first
        query = query.order_by(desc(AICallTrace.timestamp))
        
        # Apply pagination
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    @staticmethod
    def get_total_count(
        db: Session,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        success: Optional[bool] = None,
        country_iso_code: Optional[str] = None,
        operation_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> int:
        """Get total count of traces matching filters."""
        query = db.query(func.count(AICallTrace.id))
        
        if provider:
            query = query.filter(AICallTrace.provider == provider)
        if model_name:
            query = query.filter(AICallTrace.model_name == model_name)
        if success is not None:
            query = query.filter(AICallTrace.success == success)
        if country_iso_code:
            query = query.filter(AICallTrace.country_iso_code == country_iso_code)
        if operation_type:
            query = query.filter(AICallTrace.operation_type == operation_type)
        if start_date:
            query = query.filter(AICallTrace.timestamp >= start_date)
        if end_date:
            query = query.filter(AICallTrace.timestamp <= end_date)
        
        return query.scalar() or 0
    
    @staticmethod
    def get_stats(
        db: Session,
        days: int = 30,
    ) -> Dict[str, Any]:
        """
        Get summary statistics for AI calls.
        
        Args:
            db: Database session
            days: Number of days to include in stats
            
        Returns:
            Dictionary with statistics
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Base query for the time period
        base_query = db.query(AICallTrace).filter(AICallTrace.timestamp >= start_date)
        
        # Total calls
        total_calls = base_query.count()
        
        # Success rate
        success_count = base_query.filter(AICallTrace.success == True).count()
        success_rate = (success_count / total_calls * 100) if total_calls > 0 else 0
        
        # Average latency (excluding nulls)
        avg_latency = db.query(func.avg(AICallTrace.latency_ms)).filter(
            AICallTrace.timestamp >= start_date,
            AICallTrace.latency_ms.isnot(None)
        ).scalar() or 0
        
        # Calls by provider
        provider_stats = db.query(
            AICallTrace.provider,
            func.count(AICallTrace.id).label('count')
        ).filter(
            AICallTrace.timestamp >= start_date
        ).group_by(
            AICallTrace.provider
        ).all()
        
        calls_by_provider = {p.provider: p.count for p in provider_stats}
        
        # Calls by operation type
        operation_stats = db.query(
            AICallTrace.operation_type,
            func.count(AICallTrace.id).label('count')
        ).filter(
            AICallTrace.timestamp >= start_date
        ).group_by(
            AICallTrace.operation_type
        ).all()
        
        calls_by_operation = {o.operation_type: o.count for o in operation_stats}
        
        # Recent errors
        recent_errors = base_query.filter(
            AICallTrace.success == False
        ).order_by(
            desc(AICallTrace.timestamp)
        ).limit(5).all()
        
        return {
            "period_days": days,
            "total_calls": total_calls,
            "success_count": success_count,
            "error_count": total_calls - success_count,
            "success_rate": round(success_rate, 2),
            "avg_latency_ms": round(avg_latency, 0),
            "calls_by_provider": calls_by_provider,
            "calls_by_operation": calls_by_operation,
            "recent_errors": [
                {
                    "id": e.id,
                    "timestamp": e.timestamp.isoformat(),
                    "provider": e.provider,
                    "model_name": e.model_name,
                    "operation_type": e.operation_type,
                    "error_message": e.error_message[:200] if e.error_message else None,
                }
                for e in recent_errors
            ],
        }


class TraceContext:
    """Context for tracking an in-progress AI call."""
    
    def __init__(
        self,
        db: Session,
        provider: str,
        model_name: str,
        operation_type: str,
        endpoint: Optional[str] = None,
        country_iso_code: Optional[str] = None,
        topic: Optional[str] = None,
        user_id: Optional[int] = None,
    ):
        self.db = db
        self.provider = provider
        self.model_name = model_name
        self.operation_type = operation_type
        self.endpoint = endpoint
        self.country_iso_code = country_iso_code
        self.topic = topic
        self.user_id = user_id
        self.start_time = time.time()
        self._success = True
        self._error_message: Optional[str] = None
    
    def set_success(self, success: bool, error_message: Optional[str] = None):
        """Set the success status and optional error message."""
        self._success = success
        self._error_message = error_message
    
    def set_error(self, error_message: str):
        """Mark the call as failed with an error message."""
        self._success = False
        self._error_message = error_message
    
    def _save(self):
        """Save the trace to the database."""
        latency_ms = int((time.time() - self.start_time) * 1000)
        
        AICallTracer.trace(
            db=self.db,
            provider=self.provider,
            model_name=self.model_name,
            operation_type=self.operation_type,
            success=self._success,
            latency_ms=latency_ms,
            endpoint=self.endpoint,
            country_iso_code=self.country_iso_code,
            topic=self.topic,
            error_message=self._error_message,
            user_id=self.user_id,
        )


@contextmanager
def trace_ai_call(
    db: Session,
    provider: str,
    model_name: str,
    operation_type: str,
    endpoint: Optional[str] = None,
    country_iso_code: Optional[str] = None,
    topic: Optional[str] = None,
    user_id: Optional[int] = None,
) -> Generator[TraceContext, None, None]:
    """
    Context manager for tracing an AI call with automatic timing.
    
    Usage:
        with trace_ai_call(db, "openai", "gpt-4o", "deep_dive") as ctx:
            try:
                result = llm.invoke(prompt)
            except Exception as e:
                ctx.set_error(str(e))
                raise
    
    The trace is automatically saved when the context exits.
    """
    ctx = TraceContext(
        db=db,
        provider=provider,
        model_name=model_name,
        operation_type=operation_type,
        endpoint=endpoint,
        country_iso_code=country_iso_code,
        topic=topic,
        user_id=user_id,
    )
    
    try:
        yield ctx
    except Exception as e:
        ctx.set_error(str(e))
        raise
    finally:
        ctx._save()
