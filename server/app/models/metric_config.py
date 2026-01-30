"""
GOHIP Platform - Metric Configuration Models
Admin-configurable metrics for dynamic scoring

This module provides:
- MetricDefinition: Core metric definitions with formulas
- MetricWeight: Configurable weights for scoring
- PillarSummaryConfig: Summary metrics per pillar
"""

import enum
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    Column,
    String,
    Float,
    Boolean,
    Text,
    JSON,
    DateTime,
    Enum,
    Integer,
)
from app.core.database import Base
import uuid


class MetricCategory(str, enum.Enum):
    """Categories for metric classification."""
    GOVERNANCE = "governance"
    PILLAR_1_HAZARD = "pillar_1_hazard"
    PILLAR_2_VIGILANCE = "pillar_2_vigilance"
    PILLAR_3_RESTORATION = "pillar_3_restoration"
    COMPOSITE = "composite"


class MetricType(str, enum.Enum):
    """Types of metrics."""
    RATE = "rate"              # Per 100k workers
    PERCENTAGE = "percentage"   # 0-100%
    SCORE = "score"            # 0-100 or custom scale
    BOOLEAN = "boolean"        # True/False
    ENUM = "enum"              # Categorical
    INDEX = "index"            # Composite index


class MetricDefinition(Base):
    """
    Core metric definitions with calculation formulas.
    
    Stores all configurable aspects of each metric:
    - Basic info (name, description, category)
    - Calculation formula and parameters
    - Display settings (unit, format, color thresholds)
    - Weight in composite scores
    """
    __tablename__ = "metric_definitions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Basic identification
    metric_key = Column(String(100), unique=True, nullable=False, index=True,
                        comment="Unique key for the metric (e.g., 'fatal_accident_rate')")
    name = Column(String(200), nullable=False,
                  comment="Human-readable metric name")
    description = Column(Text, nullable=True,
                        comment="Detailed description of what the metric measures")
    
    # Classification
    category = Column(Enum(MetricCategory), nullable=False,
                      comment="Which pillar/category this metric belongs to")
    metric_type = Column(Enum(MetricType), nullable=False,
                         comment="Type of metric (rate, percentage, score, etc.)")
    
    # Calculation configuration
    formula = Column(Text, nullable=True,
                    comment="Formula description or calculation logic")
    source_fields = Column(JSON, nullable=True,
                          comment="List of source fields used in calculation")
    default_value = Column(Float, nullable=True,
                          comment="Default value when data is missing")
    
    # Weighting for composite scores
    weight_in_pillar = Column(Float, default=1.0,
                              comment="Weight of this metric within its pillar (0-1)")
    weight_in_maturity = Column(Float, default=0.0,
                                comment="Direct contribution to maturity score")
    
    # Thresholds for scoring/coloring
    thresholds = Column(JSON, nullable=True,
                       comment="Threshold configuration for scoring")
    """
    Example thresholds structure:
    {
        "critical": {"max": 3.0},
        "warning": {"min": 3.0, "max": 5.0},
        "good": {"min": 5.0, "max": 10.0},
        "excellent": {"min": 10.0}
    }
    """
    
    # Display configuration
    unit = Column(String(50), nullable=True,
                  comment="Display unit (e.g., 'per 100k', '%', 'points')")
    format_pattern = Column(String(50), default="{:.1f}",
                           comment="Python format pattern for display")
    lower_is_better = Column(Boolean, default=False,
                            comment="True if lower values indicate better performance")
    
    # Color coding
    color_scale = Column(JSON, nullable=True,
                        comment="Color scale configuration for visualization")
    """
    Example color_scale:
    {
        "min": 0, "max": 100,
        "colors": ["#ef4444", "#f97316", "#eab308", "#22c55e"]
    }
    """
    
    # Metadata
    is_active = Column(Boolean, default=True,
                      comment="Whether this metric is currently active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(100), nullable=True,
                       comment="User who last updated this metric")
    
    def __repr__(self):
        return f"<MetricDefinition({self.metric_key}: {self.name})>"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "metric_key": self.metric_key,
            "name": self.name,
            "description": self.description,
            "category": self.category.value if self.category else None,
            "metric_type": self.metric_type.value if self.metric_type else None,
            "formula": self.formula,
            "source_fields": self.source_fields,
            "default_value": self.default_value,
            "weight_in_pillar": self.weight_in_pillar,
            "weight_in_maturity": self.weight_in_maturity,
            "thresholds": self.thresholds,
            "unit": self.unit,
            "format_pattern": self.format_pattern,
            "lower_is_better": self.lower_is_better,
            "color_scale": self.color_scale,
            "is_active": self.is_active,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class MaturityScoringRule(Base):
    """
    Configurable rules for maturity score calculation.
    
    Each rule defines a condition and its impact on the maturity score.
    Rules are evaluated in order of priority.
    """
    __tablename__ = "maturity_scoring_rules"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Rule identification
    rule_key = Column(String(100), unique=True, nullable=False, index=True,
                      comment="Unique identifier for this rule")
    name = Column(String(200), nullable=False,
                  comment="Human-readable rule name")
    description = Column(Text, nullable=True,
                        comment="Detailed description of the rule")
    
    # Classification
    pillar = Column(Enum(MetricCategory), nullable=False,
                   comment="Which pillar this rule applies to")
    priority = Column(Integer, default=100,
                     comment="Order of rule evaluation (lower = earlier)")
    
    # Condition configuration
    condition_type = Column(String(50), nullable=False,
                           comment="Type of condition (threshold, boolean, enum)")
    """
    Condition types:
    - "threshold": Compare metric against threshold value
    - "boolean": Check if boolean metric is true/false
    - "enum": Check if enum metric equals specific value
    - "compound": Multiple conditions combined (AND/OR)
    """
    
    condition_config = Column(JSON, nullable=False,
                             comment="Condition parameters")
    """
    Example condition_config for different types:
    
    Threshold: {
        "metric": "fatal_accident_rate",
        "operator": "<",
        "value": 1.0,
        "and": {
            "metric": "inspector_density",
            "operator": ">",
            "value": 1.0
        }
    }
    
    Boolean: {
        "metric": "reintegration_law",
        "equals": true
    }
    
    Enum: {
        "metric": "surveillance_logic",
        "equals": "Risk-Based"
    }
    """
    
    # Impact configuration
    impact_type = Column(String(50), default="add",
                        comment="How this rule affects the score (add, multiply, cap)")
    impact_value = Column(Float, nullable=False,
                         comment="Value to add/multiply/cap")
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<MaturityScoringRule({self.rule_key}: {self.impact_type} {self.impact_value})>"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "rule_key": self.rule_key,
            "name": self.name,
            "description": self.description,
            "pillar": self.pillar.value if self.pillar else None,
            "priority": self.priority,
            "condition_type": self.condition_type,
            "condition_config": self.condition_config,
            "impact_type": self.impact_type,
            "impact_value": self.impact_value,
            "is_active": self.is_active,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PillarSummaryMetric(Base):
    """
    Summary metrics for each pillar.
    
    Defines how pillar-level summary scores are calculated
    from individual metrics.
    """
    __tablename__ = "pillar_summary_metrics"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Identification
    pillar = Column(Enum(MetricCategory), nullable=False, unique=True,
                   comment="Which pillar this summary is for")
    name = Column(String(200), nullable=False,
                  comment="Summary metric name")
    description = Column(Text, nullable=True)
    
    # Calculation configuration
    calculation_method = Column(String(50), default="weighted_average",
                               comment="How to aggregate metrics (weighted_average, min, max, sum)")
    
    # Component metrics and their weights
    component_weights = Column(JSON, nullable=False,
                              comment="Metrics and weights for this summary")
    """
    Example component_weights:
    {
        "fatal_accident_rate": {"weight": 0.4, "normalize": true, "invert": true},
        "inspector_density": {"weight": 0.3, "normalize": true, "invert": false},
        "oel_compliance_pct": {"weight": 0.3, "normalize": false, "invert": false}
    }
    """
    
    # Normalization settings
    output_min = Column(Float, default=0.0,
                       comment="Minimum output value")
    output_max = Column(Float, default=100.0,
                       comment="Maximum output value")
    
    # Display
    unit = Column(String(50), default="points")
    lower_is_better = Column(Boolean, default=False)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<PillarSummaryMetric({self.pillar.value}: {self.name})>"
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "pillar": self.pillar.value if self.pillar else None,
            "name": self.name,
            "description": self.description,
            "calculation_method": self.calculation_method,
            "component_weights": self.component_weights,
            "output_min": self.output_min,
            "output_max": self.output_max,
            "unit": self.unit,
            "lower_is_better": self.lower_is_better,
            "is_active": self.is_active,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# Default metric definitions to seed the database
DEFAULT_METRIC_DEFINITIONS = [
    # =========================================================================
    # GOVERNANCE METRICS
    # =========================================================================
    {
        "metric_key": "strategic_capacity_score",
        "name": "Strategic Capacity Score",
        "description": "Overall governance capacity for occupational health management",
        "category": MetricCategory.GOVERNANCE,
        "metric_type": MetricType.SCORE,
        "formula": "Weighted combination of ILO ratifications, inspector density, and policy presence",
        "source_fields": ["ilo_c187_status", "ilo_c155_status", "inspector_density", "mental_health_policy"],
        "weight_in_pillar": 1.0,
        "thresholds": {"critical": {"max": 25}, "warning": {"min": 25, "max": 50}, "good": {"min": 50, "max": 75}, "excellent": {"min": 75}},
        "unit": "points",
        "lower_is_better": False,
        "color_scale": {"min": 0, "max": 100, "colors": ["#ef4444", "#f97316", "#eab308", "#22c55e"]},
    },
    {
        "metric_key": "inspector_density",
        "name": "Inspector Density",
        "description": "Number of labor inspectors per 10,000 workers",
        "category": MetricCategory.GOVERNANCE,
        "metric_type": MetricType.RATE,
        "formula": "Total inspectors / (Workforce / 10000)",
        "weight_in_pillar": 0.3,
        "weight_in_maturity": 1.0,
        "thresholds": {"critical": {"max": 0.5}, "warning": {"min": 0.5, "max": 1.0}, "good": {"min": 1.0, "max": 2.0}, "excellent": {"min": 2.0}},
        "unit": "per 10k workers",
        "lower_is_better": False,
    },
    # =========================================================================
    # PILLAR 1: HAZARD CONTROL METRICS
    # =========================================================================
    {
        "metric_key": "fatal_accident_rate",
        "name": "Fatal Accident Rate",
        "description": "Fatal occupational accidents per 100,000 workers annually",
        "category": MetricCategory.PILLAR_1_HAZARD,
        "metric_type": MetricType.RATE,
        "formula": "Fatal accidents / (Workforce / 100000)",
        "weight_in_pillar": 0.4,
        "weight_in_maturity": 1.0,
        "thresholds": {"excellent": {"max": 1.0}, "good": {"min": 1.0, "max": 3.0}, "warning": {"min": 3.0, "max": 5.0}, "critical": {"min": 5.0}},
        "unit": "per 100k",
        "lower_is_better": True,
        "color_scale": {"min": 0, "max": 10, "colors": ["#22c55e", "#eab308", "#f97316", "#ef4444"]},
    },
    {
        "metric_key": "oel_compliance_pct",
        "name": "OEL Compliance Rate",
        "description": "Percentage of workplaces meeting Occupational Exposure Limits",
        "category": MetricCategory.PILLAR_1_HAZARD,
        "metric_type": MetricType.PERCENTAGE,
        "weight_in_pillar": 0.2,
        "thresholds": {"critical": {"max": 50}, "warning": {"min": 50, "max": 70}, "good": {"min": 70, "max": 90}, "excellent": {"min": 90}},
        "unit": "%",
        "lower_is_better": False,
    },
    {
        "metric_key": "control_maturity_score",
        "name": "Hazard Control Maturity",
        "description": "Overall maturity of hazard control systems",
        "category": MetricCategory.PILLAR_1_HAZARD,
        "metric_type": MetricType.SCORE,
        "formula": "0.6 * (100 - fatal_rate * 8) + 0.4 * oel_compliance_pct",
        "weight_in_pillar": 1.0,
        "unit": "points",
        "lower_is_better": False,
    },
    # =========================================================================
    # PILLAR 2: HEALTH VIGILANCE METRICS
    # =========================================================================
    {
        "metric_key": "vulnerability_index",
        "name": "Vulnerability Index",
        "description": "Combined index of worker vulnerability factors (lower is better)",
        "category": MetricCategory.PILLAR_2_VIGILANCE,
        "metric_type": MetricType.INDEX,
        "formula": "Weighted combination of migrant worker %, informal sector %, exposure risks",
        "weight_in_pillar": 0.4,
        "thresholds": {"excellent": {"max": 20}, "good": {"min": 20, "max": 40}, "warning": {"min": 40, "max": 60}, "critical": {"min": 60}},
        "unit": "index",
        "lower_is_better": True,
        "color_scale": {"min": 0, "max": 100, "colors": ["#22c55e", "#eab308", "#f97316", "#ef4444"]},
    },
    {
        "metric_key": "disease_detection_rate",
        "name": "Disease Detection Rate",
        "description": "Percentage of occupational diseases detected through surveillance",
        "category": MetricCategory.PILLAR_2_VIGILANCE,
        "metric_type": MetricType.PERCENTAGE,
        "weight_in_pillar": 0.3,
        "thresholds": {"critical": {"max": 30}, "warning": {"min": 30, "max": 50}, "good": {"min": 50, "max": 70}, "excellent": {"min": 70}},
        "unit": "%",
        "lower_is_better": False,
    },
    {
        "metric_key": "surveillance_coverage_score",
        "name": "Surveillance Coverage Score",
        "description": "Overall health surveillance system effectiveness",
        "category": MetricCategory.PILLAR_2_VIGILANCE,
        "metric_type": MetricType.SCORE,
        "formula": "Based on surveillance logic type and detection rates",
        "weight_in_pillar": 1.0,
        "unit": "points",
        "lower_is_better": False,
    },
    # =========================================================================
    # PILLAR 3: RESTORATION METRICS
    # =========================================================================
    {
        "metric_key": "rehab_access_score",
        "name": "Rehabilitation Access Score",
        "description": "Accessibility and quality of rehabilitation services",
        "category": MetricCategory.PILLAR_3_RESTORATION,
        "metric_type": MetricType.SCORE,
        "formula": "Weighted combination of rehab availability, coverage, and outcomes",
        "weight_in_pillar": 0.4,
        "thresholds": {"critical": {"max": 25}, "warning": {"min": 25, "max": 50}, "good": {"min": 50, "max": 75}, "excellent": {"min": 75}},
        "unit": "points",
        "lower_is_better": False,
        "color_scale": {"min": 0, "max": 100, "colors": ["#ef4444", "#f97316", "#eab308", "#22c55e"]},
    },
    {
        "metric_key": "return_to_work_success_pct",
        "name": "Return-to-Work Success Rate",
        "description": "Percentage of injured workers successfully returning to work",
        "category": MetricCategory.PILLAR_3_RESTORATION,
        "metric_type": MetricType.PERCENTAGE,
        "weight_in_pillar": 0.3,
        "thresholds": {"critical": {"max": 40}, "warning": {"min": 40, "max": 60}, "good": {"min": 60, "max": 80}, "excellent": {"min": 80}},
        "unit": "%",
        "lower_is_better": False,
    },
    {
        "metric_key": "restoration_maturity_score",
        "name": "Restoration Maturity Score",
        "description": "Overall maturity of worker restoration systems",
        "category": MetricCategory.PILLAR_3_RESTORATION,
        "metric_type": MetricType.SCORE,
        "formula": "Based on reintegration law, payer mechanism, and outcomes",
        "weight_in_pillar": 1.0,
        "unit": "points",
        "lower_is_better": False,
    },
    # =========================================================================
    # COMPOSITE METRICS
    # =========================================================================
    {
        "metric_key": "maturity_score",
        "name": "Maturity Score",
        "description": "Overall OH system maturity (1.0-4.0 scale)",
        "category": MetricCategory.COMPOSITE,
        "metric_type": MetricType.SCORE,
        "formula": "Rule-based calculation using pillar metrics",
        "weight_in_pillar": 1.0,
        "thresholds": {"critical": {"max": 2.0}, "warning": {"min": 2.0, "max": 3.0}, "good": {"min": 3.0, "max": 3.5}, "excellent": {"min": 3.5}},
        "unit": "score",
        "lower_is_better": False,
        "color_scale": {"min": 1, "max": 4, "colors": ["#ef4444", "#f97316", "#84cc16", "#22c55e"]},
    },
]


# Default maturity scoring rules
DEFAULT_MATURITY_RULES = [
    {
        "rule_key": "base_score",
        "name": "Base Score",
        "description": "Starting score for all countries",
        "pillar": MetricCategory.COMPOSITE,
        "priority": 1,
        "condition_type": "always",
        "condition_config": {},
        "impact_type": "set",
        "impact_value": 1.0,
    },
    {
        "rule_key": "pillar1_fatal_rate_cap",
        "name": "High Fatal Rate Cap",
        "description": "Cap score at 2.0 if fatal accident rate exceeds threshold",
        "pillar": MetricCategory.PILLAR_1_HAZARD,
        "priority": 10,
        "condition_type": "threshold",
        "condition_config": {
            "metric": "fatal_accident_rate",
            "operator": ">",
            "value": 3.0
        },
        "impact_type": "cap",
        "impact_value": 2.0,
    },
    {
        "rule_key": "pillar1_excellence_bonus",
        "name": "Pillar 1 Excellence Bonus",
        "description": "Bonus for low fatal rate combined with high inspector density",
        "pillar": MetricCategory.PILLAR_1_HAZARD,
        "priority": 20,
        "condition_type": "compound",
        "condition_config": {
            "operator": "AND",
            "conditions": [
                {"metric": "fatal_accident_rate", "operator": "<", "value": 1.0},
                {"metric": "inspector_density", "operator": ">", "value": 1.0}
            ]
        },
        "impact_type": "add",
        "impact_value": 1.0,
    },
    {
        "rule_key": "pillar2_surveillance_bonus",
        "name": "Risk-Based Surveillance Bonus",
        "description": "Bonus for implementing risk-based health surveillance",
        "pillar": MetricCategory.PILLAR_2_VIGILANCE,
        "priority": 30,
        "condition_type": "enum",
        "condition_config": {
            "metric": "surveillance_logic",
            "equals": "Risk-Based"
        },
        "impact_type": "add",
        "impact_value": 0.5,
    },
    {
        "rule_key": "pillar3_reintegration_bonus",
        "name": "Reintegration Law Bonus",
        "description": "Bonus for mandatory reintegration/rehabilitation laws",
        "pillar": MetricCategory.PILLAR_3_RESTORATION,
        "priority": 40,
        "condition_type": "boolean",
        "condition_config": {
            "metric": "reintegration_law",
            "equals": True
        },
        "impact_type": "add",
        "impact_value": 1.0,
    },
    {
        "rule_key": "pillar3_nofault_bonus",
        "name": "No-Fault Insurance Bonus",
        "description": "Bonus for no-fault compensation mechanisms",
        "pillar": MetricCategory.PILLAR_3_RESTORATION,
        "priority": 50,
        "condition_type": "enum",
        "condition_config": {
            "metric": "payer_mechanism",
            "equals": "No-Fault"
        },
        "impact_type": "add",
        "impact_value": 0.5,
    },
]


# Default pillar summary configurations
DEFAULT_PILLAR_SUMMARIES = [
    {
        "pillar": MetricCategory.GOVERNANCE,
        "name": "Governance Health Index",
        "description": "Overall governance capacity for occupational health",
        "calculation_method": "weighted_average",
        "component_weights": {
            "ilo_c187_status": {"weight": 0.2, "normalize": True, "invert": False, "max_value": 1},
            "ilo_c155_status": {"weight": 0.2, "normalize": True, "invert": False, "max_value": 1},
            "inspector_density": {"weight": 0.3, "normalize": True, "invert": False, "max_value": 3},
            "mental_health_policy": {"weight": 0.15, "normalize": True, "invert": False, "max_value": 1},
            "strategic_capacity_score": {"weight": 0.15, "normalize": True, "invert": False, "max_value": 100},
        },
        "output_min": 0,
        "output_max": 100,
        "unit": "points",
        "lower_is_better": False,
    },
    {
        "pillar": MetricCategory.PILLAR_1_HAZARD,
        "name": "Hazard Control Index",
        "description": "Overall effectiveness of hazard control measures",
        "calculation_method": "weighted_average",
        "component_weights": {
            "fatal_accident_rate": {"weight": 0.35, "normalize": True, "invert": True, "max_value": 10},
            "oel_compliance_pct": {"weight": 0.25, "normalize": True, "invert": False, "max_value": 100},
            "control_maturity_score": {"weight": 0.2, "normalize": True, "invert": False, "max_value": 100},
            "safety_training_hours_avg": {"weight": 0.1, "normalize": True, "invert": False, "max_value": 40},
            "carcinogen_exposure_pct": {"weight": 0.1, "normalize": True, "invert": True, "max_value": 50},
        },
        "output_min": 0,
        "output_max": 100,
        "unit": "points",
        "lower_is_better": False,
    },
    {
        "pillar": MetricCategory.PILLAR_2_VIGILANCE,
        "name": "Health Vigilance Index",
        "description": "Overall health surveillance and early detection capability",
        "calculation_method": "weighted_average",
        "component_weights": {
            "vulnerability_index": {"weight": 0.3, "normalize": True, "invert": True, "max_value": 100},
            "disease_detection_rate": {"weight": 0.3, "normalize": True, "invert": False, "max_value": 100},
            "occupational_disease_reporting_rate": {"weight": 0.2, "normalize": True, "invert": False, "max_value": 100},
            "lead_exposure_screening_rate": {"weight": 0.2, "normalize": True, "invert": False, "max_value": 100},
        },
        "output_min": 0,
        "output_max": 100,
        "unit": "points",
        "lower_is_better": False,
    },
    {
        "pillar": MetricCategory.PILLAR_3_RESTORATION,
        "name": "Restoration Effectiveness Index",
        "description": "Overall effectiveness of worker restoration and rehabilitation",
        "calculation_method": "weighted_average",
        "component_weights": {
            "rehab_access_score": {"weight": 0.3, "normalize": True, "invert": False, "max_value": 100},
            "return_to_work_success_pct": {"weight": 0.3, "normalize": True, "invert": False, "max_value": 100},
            "rehab_participation_rate": {"weight": 0.2, "normalize": True, "invert": False, "max_value": 100},
            "avg_claim_settlement_days": {"weight": 0.2, "normalize": True, "invert": True, "max_value": 365},
        },
        "output_min": 0,
        "output_max": 100,
        "unit": "points",
        "lower_is_better": False,
    },
]
