"""
GOHIP Platform - Metric Configuration API Endpoints
Admin-only endpoints for managing metric calculations and weightings

These endpoints allow administrators to:
- View and modify metric definitions
- Adjust scoring rules and weights
- Configure pillar summary calculations
- Trigger score recalculation across all countries
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user, get_current_user
from app.models.user import User
from app.models.metric_config import (
    MetricDefinition,
    MaturityScoringRule,
    PillarSummaryMetric,
    MetricCategory,
    MetricType,
    DEFAULT_METRIC_DEFINITIONS,
    DEFAULT_MATURITY_RULES,
    DEFAULT_PILLAR_SUMMARIES,
)

router = APIRouter()


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class MetricDefinitionBase(BaseModel):
    """Base schema for metric definitions."""
    metric_key: str
    name: str
    description: Optional[str] = None
    category: str
    metric_type: str
    formula: Optional[str] = None
    source_fields: Optional[List[str]] = None
    default_value: Optional[float] = None
    weight_in_pillar: float = 1.0
    weight_in_maturity: float = 0.0
    thresholds: Optional[Dict[str, Any]] = None
    unit: Optional[str] = None
    format_pattern: str = "{:.1f}"
    lower_is_better: bool = False
    color_scale: Optional[Dict[str, Any]] = None
    is_active: bool = True


class MetricDefinitionResponse(MetricDefinitionBase):
    """Response schema for metric definitions."""
    id: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class MaturityRuleBase(BaseModel):
    """Base schema for maturity scoring rules."""
    rule_key: str
    name: str
    description: Optional[str] = None
    pillar: str
    priority: int = 100
    condition_type: str
    condition_config: Dict[str, Any]
    impact_type: str = "add"
    impact_value: float
    is_active: bool = True


class MaturityRuleResponse(MaturityRuleBase):
    """Response schema for maturity rules."""
    id: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class PillarSummaryBase(BaseModel):
    """Base schema for pillar summaries."""
    pillar: str
    name: str
    description: Optional[str] = None
    calculation_method: str = "weighted_average"
    component_weights: Dict[str, Any]
    output_min: float = 0.0
    output_max: float = 100.0
    unit: str = "points"
    lower_is_better: bool = False
    is_active: bool = True


class PillarSummaryResponse(PillarSummaryBase):
    """Response schema for pillar summaries."""
    id: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class MetricConfigOverview(BaseModel):
    """Complete overview of metric configuration."""
    metrics: List[MetricDefinitionResponse]
    rules: List[MaturityRuleResponse]
    pillar_summaries: List[PillarSummaryResponse]
    statistics: Dict[str, Any]


class RecalculationResult(BaseModel):
    """Result of score recalculation."""
    status: str
    countries_updated: int
    score_distribution: Dict[str, int]
    execution_time_ms: int
    details: Optional[Dict[str, Any]] = None


class MetricUpdateRequest(BaseModel):
    """Request to update a metric definition."""
    weight_in_pillar: Optional[float] = None
    weight_in_maturity: Optional[float] = None
    thresholds: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    lower_is_better: Optional[bool] = None
    color_scale: Optional[Dict[str, Any]] = None


class RuleUpdateRequest(BaseModel):
    """Request to update a maturity scoring rule."""
    condition_config: Optional[Dict[str, Any]] = None
    impact_value: Optional[float] = None
    impact_type: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


# =============================================================================
# INITIALIZATION / SEED ENDPOINTS
# =============================================================================

@router.post(
    "/initialize",
    summary="Initialize Metric Configuration",
    description="Seeds the database with default metric definitions, rules, and pillar summaries."
)
async def initialize_metric_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Initialize metric configuration with defaults."""
    created = {"metrics": 0, "rules": 0, "summaries": 0}
    
    # Seed metric definitions
    for metric_data in DEFAULT_METRIC_DEFINITIONS:
        existing = db.query(MetricDefinition).filter(
            MetricDefinition.metric_key == metric_data["metric_key"]
        ).first()
        
        if not existing:
            metric = MetricDefinition(
                metric_key=metric_data["metric_key"],
                name=metric_data["name"],
                description=metric_data.get("description"),
                category=metric_data["category"],
                metric_type=metric_data["metric_type"],
                formula=metric_data.get("formula"),
                source_fields=metric_data.get("source_fields"),
                default_value=metric_data.get("default_value"),
                weight_in_pillar=metric_data.get("weight_in_pillar", 1.0),
                weight_in_maturity=metric_data.get("weight_in_maturity", 0.0),
                thresholds=metric_data.get("thresholds"),
                unit=metric_data.get("unit"),
                format_pattern=metric_data.get("format_pattern", "{:.1f}"),
                lower_is_better=metric_data.get("lower_is_better", False),
                color_scale=metric_data.get("color_scale"),
                is_active=True,
            )
            db.add(metric)
            created["metrics"] += 1
    
    # Seed maturity rules
    for rule_data in DEFAULT_MATURITY_RULES:
        existing = db.query(MaturityScoringRule).filter(
            MaturityScoringRule.rule_key == rule_data["rule_key"]
        ).first()
        
        if not existing:
            rule = MaturityScoringRule(
                rule_key=rule_data["rule_key"],
                name=rule_data["name"],
                description=rule_data.get("description"),
                pillar=rule_data["pillar"],
                priority=rule_data.get("priority", 100),
                condition_type=rule_data["condition_type"],
                condition_config=rule_data["condition_config"],
                impact_type=rule_data.get("impact_type", "add"),
                impact_value=rule_data["impact_value"],
                is_active=True,
            )
            db.add(rule)
            created["rules"] += 1
    
    # Seed pillar summaries
    for summary_data in DEFAULT_PILLAR_SUMMARIES:
        existing = db.query(PillarSummaryMetric).filter(
            PillarSummaryMetric.pillar == summary_data["pillar"]
        ).first()
        
        if not existing:
            summary = PillarSummaryMetric(
                pillar=summary_data["pillar"],
                name=summary_data["name"],
                description=summary_data.get("description"),
                calculation_method=summary_data.get("calculation_method", "weighted_average"),
                component_weights=summary_data["component_weights"],
                output_min=summary_data.get("output_min", 0.0),
                output_max=summary_data.get("output_max", 100.0),
                unit=summary_data.get("unit", "points"),
                lower_is_better=summary_data.get("lower_is_better", False),
                is_active=True,
            )
            db.add(summary)
            created["summaries"] += 1
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Metric configuration initialized",
        "created": created,
    }


# =============================================================================
# OVERVIEW ENDPOINT (User-accessible, read-only)
# =============================================================================

@router.get(
    "/overview",
    response_model=MetricConfigOverview,
    summary="Get Complete Metric Configuration",
    description="Returns all metric definitions, scoring rules, and pillar summaries. Available to all authenticated users."
)
async def get_metric_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete overview of metric configuration."""
    # #region agent log
    import json, time as _t; _log_path = r"c:\Users\utena\Desktop\Projects\007 - Occupational Health\.cursor\debug.log"; _start = _t.time(); open(_log_path, "a").write(json.dumps({"location": "metric_config.py:263", "message": "overview_start", "data": {"user": current_user.email if current_user else None}, "timestamp": int(_t.time()*1000), "sessionId": "debug-session", "hypothesisId": "H1"}) + "\n")
    # #endregion
    metrics = db.query(MetricDefinition).order_by(MetricDefinition.category, MetricDefinition.metric_key).all()
    # #region agent log
    _t1 = _t.time(); open(_log_path, "a").write(json.dumps({"location": "metric_config.py:267", "message": "metrics_loaded", "data": {"count": len(metrics), "elapsed_ms": int((_t1-_start)*1000)}, "timestamp": int(_t.time()*1000), "sessionId": "debug-session", "hypothesisId": "H1"}) + "\n")
    # #endregion
    rules = db.query(MaturityScoringRule).order_by(MaturityScoringRule.priority).all()
    # #region agent log
    _t2 = _t.time(); open(_log_path, "a").write(json.dumps({"location": "metric_config.py:271", "message": "rules_loaded", "data": {"count": len(rules), "elapsed_ms": int((_t2-_start)*1000)}, "timestamp": int(_t.time()*1000), "sessionId": "debug-session", "hypothesisId": "H1"}) + "\n")
    # #endregion
    summaries = db.query(PillarSummaryMetric).all()
    # #region agent log
    _t3 = _t.time(); open(_log_path, "a").write(json.dumps({"location": "metric_config.py:275", "message": "summaries_loaded", "data": {"count": len(summaries), "elapsed_ms": int((_t3-_start)*1000)}, "timestamp": int(_t.time()*1000), "sessionId": "debug-session", "hypothesisId": "H1"}) + "\n")
    # #endregion
    
    # Calculate statistics
    stats = {
        "total_metrics": len(metrics),
        "active_metrics": len([m for m in metrics if m.is_active]),
        "total_rules": len(rules),
        "active_rules": len([r for r in rules if r.is_active]),
        "metrics_by_category": {},
    }
    
    for metric in metrics:
        cat = metric.category.value if metric.category else "unknown"
        if cat not in stats["metrics_by_category"]:
            stats["metrics_by_category"][cat] = 0
        stats["metrics_by_category"][cat] += 1
    
    # #region agent log
    _t4 = _t.time(); open(_log_path, "a").write(json.dumps({"location": "metric_config.py:296", "message": "building_response", "data": {"total_elapsed_ms": int((_t4-_start)*1000)}, "timestamp": int(_t.time()*1000), "sessionId": "debug-session", "hypothesisId": "H1"}) + "\n")
    # #endregion
    result = MetricConfigOverview(
        metrics=[MetricDefinitionResponse(**m.to_dict()) for m in metrics],
        rules=[MaturityRuleResponse(**r.to_dict()) for r in rules],
        pillar_summaries=[PillarSummaryResponse(**s.to_dict()) for s in summaries],
        statistics=stats,
    )
    # #region agent log
    _t5 = _t.time(); open(_log_path, "a").write(json.dumps({"location": "metric_config.py:305", "message": "overview_complete", "data": {"total_elapsed_ms": int((_t5-_start)*1000), "metrics": len(metrics), "rules": len(rules), "summaries": len(summaries)}, "timestamp": int(_t.time()*1000), "sessionId": "debug-session", "hypothesisId": "H1"}) + "\n")
    # #endregion
    return result


# =============================================================================
# METRIC DEFINITION ENDPOINTS
# =============================================================================

@router.get(
    "/metrics",
    response_model=List[MetricDefinitionResponse],
    summary="List All Metric Definitions"
)
async def list_metrics(
    category: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all metric definitions with optional filtering."""
    query = db.query(MetricDefinition)
    
    if category:
        try:
            cat_enum = MetricCategory(category)
            query = query.filter(MetricDefinition.category == cat_enum)
        except ValueError:
            pass
    
    if active_only:
        query = query.filter(MetricDefinition.is_active == True)
    
    metrics = query.order_by(MetricDefinition.category, MetricDefinition.metric_key).all()
    return [MetricDefinitionResponse(**m.to_dict()) for m in metrics]


@router.get(
    "/metrics/{metric_key}",
    response_model=MetricDefinitionResponse,
    summary="Get Metric Definition"
)
async def get_metric(
    metric_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get a specific metric definition by key."""
    metric = db.query(MetricDefinition).filter(
        MetricDefinition.metric_key == metric_key
    ).first()
    
    if not metric:
        raise HTTPException(status_code=404, detail=f"Metric '{metric_key}' not found")
    
    return MetricDefinitionResponse(**metric.to_dict())


@router.put(
    "/metrics/{metric_key}",
    response_model=MetricDefinitionResponse,
    summary="Update Metric Definition"
)
async def update_metric(
    metric_key: str,
    update: MetricUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a metric definition's configurable fields."""
    metric = db.query(MetricDefinition).filter(
        MetricDefinition.metric_key == metric_key
    ).first()
    
    if not metric:
        raise HTTPException(status_code=404, detail=f"Metric '{metric_key}' not found")
    
    # Update only provided fields
    if update.weight_in_pillar is not None:
        metric.weight_in_pillar = update.weight_in_pillar
    if update.weight_in_maturity is not None:
        metric.weight_in_maturity = update.weight_in_maturity
    if update.thresholds is not None:
        metric.thresholds = update.thresholds
    if update.is_active is not None:
        metric.is_active = update.is_active
    if update.lower_is_better is not None:
        metric.lower_is_better = update.lower_is_better
    if update.color_scale is not None:
        metric.color_scale = update.color_scale
    
    metric.updated_at = datetime.utcnow()
    metric.updated_by = current_user.email
    
    db.commit()
    db.refresh(metric)
    
    return MetricDefinitionResponse(**metric.to_dict())


# =============================================================================
# MATURITY RULE ENDPOINTS
# =============================================================================

@router.get(
    "/rules",
    response_model=List[MaturityRuleResponse],
    summary="List Maturity Scoring Rules"
)
async def list_rules(
    pillar: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all maturity scoring rules."""
    query = db.query(MaturityScoringRule)
    
    if pillar:
        try:
            pillar_enum = MetricCategory(pillar)
            query = query.filter(MaturityScoringRule.pillar == pillar_enum)
        except ValueError:
            pass
    
    if active_only:
        query = query.filter(MaturityScoringRule.is_active == True)
    
    rules = query.order_by(MaturityScoringRule.priority).all()
    return [MaturityRuleResponse(**r.to_dict()) for r in rules]


@router.get(
    "/rules/{rule_key}",
    response_model=MaturityRuleResponse,
    summary="Get Maturity Rule"
)
async def get_rule(
    rule_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get a specific maturity scoring rule."""
    rule = db.query(MaturityScoringRule).filter(
        MaturityScoringRule.rule_key == rule_key
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_key}' not found")
    
    return MaturityRuleResponse(**rule.to_dict())


@router.put(
    "/rules/{rule_key}",
    response_model=MaturityRuleResponse,
    summary="Update Maturity Rule"
)
async def update_rule(
    rule_key: str,
    update: RuleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a maturity scoring rule."""
    rule = db.query(MaturityScoringRule).filter(
        MaturityScoringRule.rule_key == rule_key
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_key}' not found")
    
    if update.condition_config is not None:
        rule.condition_config = update.condition_config
    if update.impact_value is not None:
        rule.impact_value = update.impact_value
    if update.impact_type is not None:
        rule.impact_type = update.impact_type
    if update.priority is not None:
        rule.priority = update.priority
    if update.is_active is not None:
        rule.is_active = update.is_active
    
    rule.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(rule)
    
    return MaturityRuleResponse(**rule.to_dict())


# =============================================================================
# PILLAR SUMMARY ENDPOINTS
# =============================================================================

@router.get(
    "/pillar-summaries",
    response_model=List[PillarSummaryResponse],
    summary="List Pillar Summary Configurations"
)
async def list_pillar_summaries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all pillar summary configurations."""
    summaries = db.query(PillarSummaryMetric).all()
    return [PillarSummaryResponse(**s.to_dict()) for s in summaries]


@router.put(
    "/pillar-summaries/{pillar}",
    response_model=PillarSummaryResponse,
    summary="Update Pillar Summary Configuration"
)
async def update_pillar_summary(
    pillar: str,
    update: PillarSummaryBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update a pillar summary configuration."""
    try:
        pillar_enum = MetricCategory(pillar)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid pillar: {pillar}")
    
    summary = db.query(PillarSummaryMetric).filter(
        PillarSummaryMetric.pillar == pillar_enum
    ).first()
    
    if not summary:
        raise HTTPException(status_code=404, detail=f"Pillar summary for '{pillar}' not found")
    
    summary.name = update.name
    summary.description = update.description
    summary.calculation_method = update.calculation_method
    summary.component_weights = update.component_weights
    summary.output_min = update.output_min
    summary.output_max = update.output_max
    summary.unit = update.unit
    summary.lower_is_better = update.lower_is_better
    summary.is_active = update.is_active
    summary.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(summary)
    
    return PillarSummaryResponse(**summary.to_dict())


# =============================================================================
# RECALCULATION ENDPOINTS
# =============================================================================

@router.post(
    "/recalculate",
    response_model=RecalculationResult,
    summary="Recalculate All Scores",
    description="Recalculates all pillar scores and maturity scores for all countries using current configuration."
)
async def recalculate_all_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Recalculate ALL scores for all countries:
    1. Calculate pillar scores using configurable weighted averages
    2. Calculate maturity scores using rule-based system
    3. Store all scores in the database
    
    Uses raw SQL to bypass ORM enum issues.
    """
    import time
    start_time = time.time()
    
    # Load pillar summary configurations for weighted average calculation
    pillar_summaries = db.query(PillarSummaryMetric).filter(
        PillarSummaryMetric.is_active == True
    ).all()
    pillar_weights = {s.pillar.value: s.component_weights for s in pillar_summaries}
    
    # Load active maturity rules
    rules = db.query(MaturityScoringRule).filter(
        MaturityScoringRule.is_active == True
    ).order_by(MaturityScoringRule.priority).all()
    rule_config = [r.to_dict() for r in rules]
    
    # Get ALL country data needed for both pillar and maturity scoring
    query = text("""
        SELECT 
            c.iso_code,
            -- Governance metrics
            g.ilo_c187_status,
            g.ilo_c155_status,
            g.inspector_density,
            g.mental_health_policy,
            g.strategic_capacity_score,
            -- Pillar 1: Hazard Control metrics
            p1.fatal_accident_rate,
            p1.oel_compliance_pct,
            p1.safety_training_hours_avg,
            p1.carcinogen_exposure_pct,
            p1.control_maturity_score,
            -- Pillar 2: Health Vigilance metrics
            p2.vulnerability_index,
            p2.disease_detection_rate,
            p2.occupational_disease_reporting_rate,
            p2.lead_exposure_screening_rate,
            p2.surveillance_logic,
            -- Pillar 3: Restoration metrics
            p3.rehab_access_score,
            p3.return_to_work_success_pct,
            p3.rehab_participation_rate,
            p3.avg_claim_settlement_days,
            p3.reintegration_law,
            p3.payer_mechanism
        FROM countries c
        LEFT JOIN governance_layer g ON c.iso_code = g.country_iso_code
        LEFT JOIN pillar_1_hazard p1 ON c.iso_code = p1.country_iso_code
        LEFT JOIN pillar_2_vigilance p2 ON c.iso_code = p2.country_iso_code
        LEFT JOIN pillar_3_restoration p3 ON c.iso_code = p3.country_iso_code
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    
    updated_count = 0
    maturity_scores = {}
    
    for row in rows:
        (iso_code,
         # Governance
         ilo_c187, ilo_c155, inspector_density, mental_health_policy, strategic_cap,
         # Pillar 1
         fatal_rate, oel_compliance, safety_training, carcinogen_exp, control_maturity,
         # Pillar 2
         vuln_idx, disease_detection, disease_reporting, lead_screening, surveillance,
         # Pillar 3
         rehab_access, rtw_success, rehab_participation, claim_settlement, reintegration, payer) = row
        
        # Calculate Governance Score (0-100)
        governance_score = calculate_pillar_score_from_weights(
            pillar_weights.get("governance", {}),
            {
                "ilo_c187_status": 100.0 if ilo_c187 else (0.0 if ilo_c187 is not None else None),
                "ilo_c155_status": 100.0 if ilo_c155 else (0.0 if ilo_c155 is not None else None),
                "inspector_density": safe_normalize(inspector_density, 3.0),
                "mental_health_policy": 100.0 if mental_health_policy else (0.0 if mental_health_policy is not None else None),
                "strategic_capacity_score": strategic_cap,
            }
        )
        
        # Calculate Pillar 1: Hazard Control Score (0-100)
        pillar1_score = calculate_pillar_score_from_weights(
            pillar_weights.get("pillar_1_hazard", {}),
            {
                "fatal_accident_rate": safe_normalize(fatal_rate, 10.0, invert=True),
                "oel_compliance_pct": oel_compliance,
                "safety_training_hours_avg": safe_normalize(safety_training, 40.0),
                "carcinogen_exposure_pct": safe_normalize(carcinogen_exp, 50.0, invert=True),
                "control_maturity_score": control_maturity,
            }
        )
        
        # Calculate Pillar 2: Health Vigilance Score (0-100)
        pillar2_score = calculate_pillar_score_from_weights(
            pillar_weights.get("pillar_2_vigilance", {}),
            {
                "vulnerability_index": safe_normalize(vuln_idx, 100.0, invert=True),
                "disease_detection_rate": disease_detection,
                "occupational_disease_reporting_rate": disease_reporting,
                "lead_exposure_screening_rate": lead_screening,
            }
        )
        
        # Calculate Pillar 3: Restoration Score (0-100)
        pillar3_score = calculate_pillar_score_from_weights(
            pillar_weights.get("pillar_3_restoration", {}),
            {
                "rehab_access_score": rehab_access,
                "return_to_work_success_pct": rtw_success,
                "rehab_participation_rate": rehab_participation,
                "avg_claim_settlement_days": safe_normalize(claim_settlement, 365.0, invert=True),
            }
        )
        
        # Calculate Maturity Score using rule-based system
        maturity_score = calculate_score_with_rules(
            rule_config,
            fatal_rate=fatal_rate,
            inspector_density=inspector_density,
            surveillance_logic=surveillance,
            reintegration_law=reintegration,
            payer_mechanism=payer
        )
        
        maturity_scores[iso_code] = maturity_score
        
        # Update ALL scores in database
        update_query = text("""
            UPDATE countries 
            SET maturity_score = :maturity_score,
                governance_score = :governance_score,
                pillar1_score = :pillar1_score,
                pillar2_score = :pillar2_score,
                pillar3_score = :pillar3_score,
                updated_at = :now
            WHERE iso_code = :iso_code
        """)
        db.execute(update_query, {
            "maturity_score": maturity_score,
            "governance_score": governance_score,
            "pillar1_score": pillar1_score,
            "pillar2_score": pillar2_score,
            "pillar3_score": pillar3_score,
            "now": datetime.utcnow(),
            "iso_code": iso_code
        })
        updated_count += 1
    
    db.commit()
    
    # Calculate distribution based on maturity scores
    distribution = {"reactive": 0, "compliant": 0, "proactive": 0, "resilient": 0}
    for score in maturity_scores.values():
        if score < 2.0:
            distribution["reactive"] += 1
        elif score < 3.0:
            distribution["compliant"] += 1
        elif score < 3.5:
            distribution["proactive"] += 1
        else:
            distribution["resilient"] += 1
    
    execution_time = int((time.time() - start_time) * 1000)
    
    return RecalculationResult(
        status="success",
        countries_updated=updated_count,
        score_distribution=distribution,
        execution_time_ms=execution_time,
        details={
            "rules_applied": len(rule_config),
            "pillar_configs_loaded": len(pillar_weights),
            "updated_by": current_user.email,
        }
    )


def safe_normalize(value: Optional[float], max_value: float, invert: bool = False) -> Optional[float]:
    """Safely normalize a value to 0-100 scale."""
    if value is None:
        return None
    normalized = min(100.0, max(0.0, (value / max_value) * 100))
    return 100.0 - normalized if invert else normalized


def calculate_pillar_score_from_weights(
    weight_config: Dict[str, Any],
    metric_values: Dict[str, Optional[float]]
) -> Optional[float]:
    """
    Calculate a pillar score using configurable weighted average.
    
    Args:
        weight_config: Dict of metric_key -> {weight, invert, max_value, normalize}
        metric_values: Dict of metric_key -> actual value (already normalized if needed)
    
    Returns:
        Weighted average score (0-100) or None if no valid values
    """
    if not weight_config:
        return None
    
    valid_components = []
    for metric_key, config in weight_config.items():
        value = metric_values.get(metric_key)
        if value is None:
            continue
        
        weight = config.get("weight", 0)
        if weight <= 0:
            continue
        
        # Apply inversion if specified in config (may already be inverted in metric_values)
        # We skip this as we handle inversion in safe_normalize above
        valid_components.append((value, weight))
    
    if not valid_components:
        return None
    
    # Redistribute weights for missing values
    total_weight = sum(w for _, w in valid_components)
    if total_weight == 0:
        return None
    
    weighted_sum = sum(v * (w / total_weight) for v, w in valid_components)
    return round(weighted_sum, 1)


def calculate_score_with_rules(
    rules: List[Dict],
    fatal_rate: Optional[float] = None,
    inspector_density: Optional[float] = None,
    surveillance_logic: Optional[str] = None,
    reintegration_law: Optional[bool] = None,
    payer_mechanism: Optional[str] = None
) -> float:
    """
    Calculate maturity score using configurable rules.
    
    This function evaluates each rule in priority order and applies
    the impact to the score based on conditions.
    """
    score = 1.0  # Base score
    capped = False
    cap_value = 4.0
    
    # Create metric lookup
    metrics = {
        "fatal_accident_rate": fatal_rate,
        "inspector_density": inspector_density,
        "surveillance_logic": surveillance_logic,
        "reintegration_law": reintegration_law,
        "payer_mechanism": payer_mechanism,
    }
    
    for rule in rules:
        if not rule.get("is_active", True):
            continue
        
        condition_type = rule.get("condition_type")
        condition_config = rule.get("condition_config", {})
        impact_type = rule.get("impact_type", "add")
        impact_value = rule.get("impact_value", 0)
        
        # Skip if already capped and this isn't a cap rule
        if capped and impact_type != "cap":
            continue
        
        # Evaluate condition
        condition_met = evaluate_condition(condition_type, condition_config, metrics)
        
        if condition_met:
            if impact_type == "set":
                score = impact_value
            elif impact_type == "add":
                score += impact_value
            elif impact_type == "multiply":
                score *= impact_value
            elif impact_type == "cap":
                capped = True
                cap_value = min(cap_value, impact_value)
    
    # Apply cap
    if capped:
        score = min(score, cap_value)
    
    # Ensure within bounds
    score = max(1.0, min(4.0, score))
    
    return round(score, 1)


def evaluate_condition(
    condition_type: str,
    config: Dict[str, Any],
    metrics: Dict[str, Any]
) -> bool:
    """Evaluate a single condition against metric values."""
    
    if condition_type == "always":
        return True
    
    if condition_type == "threshold":
        metric_key = config.get("metric")
        operator = config.get("operator", "==")
        value = config.get("value")
        metric_value = metrics.get(metric_key)
        
        if metric_value is None:
            return False
        
        result = compare_values(metric_value, operator, value)
        
        # Check for AND condition
        if result and "and" in config:
            and_config = config["and"]
            result = evaluate_condition("threshold", and_config, metrics)
        
        return result
    
    if condition_type == "boolean":
        metric_key = config.get("metric")
        expected = config.get("equals")
        metric_value = metrics.get(metric_key)
        return metric_value == expected
    
    if condition_type == "enum":
        metric_key = config.get("metric")
        expected = config.get("equals")
        metric_value = metrics.get(metric_key)
        
        if metric_value is None:
            return False
        
        # Handle enum comparison (might be stored as different formats)
        if isinstance(metric_value, str):
            return metric_value.lower().replace("-", "_").replace(" ", "_") == \
                   expected.lower().replace("-", "_").replace(" ", "_")
        return str(metric_value) == str(expected)
    
    if condition_type == "compound":
        operator = config.get("operator", "AND")
        conditions = config.get("conditions", [])
        
        results = []
        for cond in conditions:
            cond_type = "threshold" if "operator" in cond else "boolean"
            results.append(evaluate_condition(cond_type, cond, metrics))
        
        if operator == "AND":
            return all(results)
        elif operator == "OR":
            return any(results)
        
        return False
    
    return False


def compare_values(actual: Any, operator: str, expected: Any) -> bool:
    """Compare two values using the specified operator."""
    try:
        if operator == "==":
            return actual == expected
        elif operator == "!=":
            return actual != expected
        elif operator == "<":
            return actual < expected
        elif operator == "<=":
            return actual <= expected
        elif operator == ">":
            return actual > expected
        elif operator == ">=":
            return actual >= expected
        else:
            return False
    except (TypeError, ValueError):
        return False


# =============================================================================
# PREVIEW ENDPOINT
# =============================================================================

@router.post(
    "/preview-calculation",
    summary="Preview Score Calculation",
    description="Preview what score a country would get with current or modified rules."
)
async def preview_calculation(
    iso_code: str,
    rule_overrides: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Preview the score calculation for a specific country.
    Optionally apply rule overrides to see the impact of changes.
    """
    # Get country data
    query = text("""
        SELECT 
            c.iso_code,
            c.name,
            c.maturity_score as current_score,
            p1.fatal_accident_rate,
            g.inspector_density,
            p2.surveillance_logic,
            p3.reintegration_law,
            p3.payer_mechanism
        FROM countries c
        LEFT JOIN pillar_1_hazard p1 ON c.iso_code = p1.country_iso_code
        LEFT JOIN governance_layer g ON c.iso_code = g.country_iso_code
        LEFT JOIN pillar_2_vigilance p2 ON c.iso_code = p2.country_iso_code
        LEFT JOIN pillar_3_restoration p3 ON c.iso_code = p3.country_iso_code
        WHERE c.iso_code = :iso_code
    """)
    
    result = db.execute(query, {"iso_code": iso_code})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail=f"Country '{iso_code}' not found")
    
    iso, name, current_score, fatal_rate, inspector_density, surveillance, reintegration, payer = row
    
    # Load rules
    rules = db.query(MaturityScoringRule).filter(
        MaturityScoringRule.is_active == True
    ).order_by(MaturityScoringRule.priority).all()
    
    rule_config = [r.to_dict() for r in rules]
    
    # Apply any overrides
    if rule_overrides:
        for rule in rule_config:
            if rule["rule_key"] in rule_overrides:
                rule.update(rule_overrides[rule["rule_key"]])
    
    # Calculate new score
    new_score = calculate_score_with_rules(
        rule_config,
        fatal_rate=fatal_rate,
        inspector_density=inspector_density,
        surveillance_logic=surveillance,
        reintegration_law=reintegration,
        payer_mechanism=payer
    )
    
    # Build rule application breakdown
    breakdown = []
    for rule in rule_config:
        if not rule.get("is_active", True):
            continue
        
        condition_met = evaluate_condition(
            rule.get("condition_type"),
            rule.get("condition_config", {}),
            {
                "fatal_accident_rate": fatal_rate,
                "inspector_density": inspector_density,
                "surveillance_logic": surveillance,
                "reintegration_law": reintegration,
                "payer_mechanism": payer,
            }
        )
        
        breakdown.append({
            "rule_key": rule["rule_key"],
            "name": rule["name"],
            "condition_met": condition_met,
            "impact_type": rule.get("impact_type"),
            "impact_value": rule.get("impact_value") if condition_met else 0,
        })
    
    return {
        "iso_code": iso,
        "name": name,
        "current_score": current_score,
        "calculated_score": new_score,
        "score_change": round(new_score - (current_score or 0), 1),
        "input_values": {
            "fatal_accident_rate": fatal_rate,
            "inspector_density": inspector_density,
            "surveillance_logic": surveillance,
            "reintegration_law": reintegration,
            "payer_mechanism": payer,
        },
        "rule_breakdown": breakdown,
    }
