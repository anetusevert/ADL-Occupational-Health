"""
GOHIP Platform - Comparison Report Schemas
Pydantic models for API request/response validation.
"""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


# ============================================================================
# NESTED SCHEMAS
# ============================================================================

class PillarMetric(BaseModel):
    """Individual metric within a pillar."""
    name: str
    saudi: str
    comparison: str
    gap: Optional[str] = None


class PillarAnalysis(BaseModel):
    """Analysis for a single pillar."""
    pillar: str
    pillar_id: Optional[str] = None
    saudi_score: float
    comparison_score: float
    gap_percentage: Optional[float] = None
    headline: Optional[str] = None
    saudi_assessment: Optional[str] = None
    comparison_assessment: Optional[str] = None
    key_differences: Optional[List[str]] = None
    priority_actions: Optional[List[str]] = None
    key_metrics: Optional[List[PillarMetric]] = None


class SocioeconomicMetric(BaseModel):
    """Individual socioeconomic metric."""
    name: str
    saudi: str
    comparison: str
    insight: Optional[str] = None


class SocioeconomicComparison(BaseModel):
    """Socioeconomic comparison section."""
    summary: Optional[str] = None
    metrics: Optional[List[SocioeconomicMetric]] = None


class MetricComparison(BaseModel):
    """Detailed metric comparison."""
    metric_id: Optional[str] = None
    metric_name: str
    pillar: Optional[str] = None
    saudi_value: str
    comparison_value: str
    gap_percentage: Optional[float] = None
    gap_direction: Optional[str] = None
    significance: Optional[str] = None
    benchmark_practice: Optional[str] = None


class StrategicRecommendation(BaseModel):
    """AI-generated strategic recommendation."""
    priority: int
    title: str
    recommendation: str
    rationale: Optional[str] = None
    expected_impact: Optional[str] = None
    complexity: Optional[str] = None  # high, medium, low
    timeline: Optional[str] = None  # Short-term, Medium-term, Long-term
    quick_win: Optional[bool] = None


# ============================================================================
# REQUEST SCHEMAS
# ============================================================================

class GenerateReportRequest(BaseModel):
    """Request to generate a comparison report."""
    force: bool = Field(False, description="Force regeneration even if cached")


# ============================================================================
# RESPONSE SCHEMAS
# ============================================================================

class ComparisonReportResponse(BaseModel):
    """Full comparison report response."""
    id: str
    primary_iso: str
    comparison_iso: str
    executive_summary: Optional[str] = None
    framework_analysis: Optional[List[PillarAnalysis]] = None
    socioeconomic_comparison: Optional[SocioeconomicComparison] = None
    metric_comparisons: Optional[List[MetricComparison]] = None
    strategic_recommendations: Optional[List[StrategicRecommendation]] = None
    sources_cited: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: int = 1
    generation_time_seconds: Optional[float] = None
    primary_name: Optional[str] = "Saudi Arabia"
    comparison_name: Optional[str] = None

    class Config:
        from_attributes = True


class ComparisonReportSummary(BaseModel):
    """Summary of a comparison report for listing."""
    id: str
    comparison_iso: str
    comparison_name: Optional[str] = None
    created_at: Optional[datetime] = None
    version: int = 1


class ReportListResponse(BaseModel):
    """List of all cached reports."""
    total: int
    reports: List[ComparisonReportSummary]
