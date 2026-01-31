"""
GOHIP Platform - Metric Explanation Agent
==========================================

Phase 26.5: Dedicated Agent for Metric Explanations

This agent generates detailed explanations for each metric in the
Sovereign OH Integrity Framework, including:
- What the metric measures
- How the country performs against global benchmarks
- Visual comparison data for charts
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.country import Country
from app.models.user import MetricExplanation, AIConfig, User
from app.core.config import settings
from app.services.ai_call_tracer import AICallTracer

logger = logging.getLogger(__name__)


# ============================================================================
# METRIC EXPLANATION AGENT PROMPT
# ============================================================================

METRIC_EXPLANATION_SYSTEM_PROMPT = """You are an expert Occupational Health Data Analyst for a global intelligence platform.

Your role is to explain occupational health metrics in a clear, insightful way that helps policymakers and health professionals understand:
1. What each metric measures and why it matters
2. How a specific country performs relative to global benchmarks
3. The implications of the country's performance

Communication style:
- Use clear, professional language accessible to non-experts
- Be specific with numbers and comparisons
- Highlight both strengths and areas for improvement
- Use comparative language (e.g., "above average", "among the top 20%")
- Keep explanations concise but informative (2-4 sentences)"""


METRIC_EXPLANATION_PROMPT = """Generate an explanation for the following metric:

COUNTRY: {country_name} ({iso_code})
PILLAR: {pillar_name}
METRIC: {metric_name}
CURRENT VALUE: {metric_value}
GLOBAL AVERAGE: {global_average}
PERCENTILE RANK: {percentile_rank}% (higher is better)

Provide a JSON response with:
{{
    "explanation": "What this metric measures and why it matters (1-2 sentences)",
    "performance_analysis": "How {country_name} performs against this metric with specific comparison (2-3 sentences)",
    "performance_rating": "one of: excellent, good, moderate, concerning, critical",
    "comparison_data": {{
        "country_value": <number or null>,
        "global_average": <number or null>,
        "regional_average": <number or null>,
        "best_in_class": <number or null>,
        "percentile": <0-100 number>
    }}
}}

Respond ONLY with valid JSON. No markdown, no extra text."""


# ============================================================================
# GLOBAL BENCHMARKS DATA
# ============================================================================

GLOBAL_BENCHMARKS = {
    # Governance Layer
    "ilo_c187_status": {"global_avg": 0.45, "best": 1.0, "description": "ILO C187 Promotional Framework Ratification"},
    "ilo_c155_status": {"global_avg": 0.52, "best": 1.0, "description": "ILO C155 OSH Convention Ratification"},
    "inspector_density": {"global_avg": 0.5, "best": 2.5, "description": "Labor inspectors per 10,000 workers"},
    "mental_health_policy": {"global_avg": 0.35, "best": 1.0, "description": "Workplace mental health policy in place"},
    "strategic_capacity_score": {"global_avg": 55.0, "best": 95.0, "description": "Overall governance capacity score"},
    
    # Pillar 1: Hazard Control
    "fatal_accident_rate": {"global_avg": 3.2, "best": 0.5, "lower_better": True, "description": "Fatal workplace accidents per 100,000 workers"},
    "carcinogen_exposure_pct": {"global_avg": 12.0, "best": 3.0, "lower_better": True, "description": "Workforce exposed to carcinogens"},
    "heat_stress_reg_type": {"global_avg": 0.4, "best": 1.0, "description": "Heat stress regulation stringency"},
    "oel_compliance_pct": {"global_avg": 65.0, "best": 98.0, "description": "Occupational Exposure Limit compliance"},
    "control_maturity_score": {"global_avg": 50.0, "best": 95.0, "description": "Overall hazard control maturity"},
    
    # Pillar 2: Health Vigilance
    "surveillance_logic": {"global_avg": 0.5, "best": 1.0, "description": "Health surveillance system sophistication"},
    "disease_detection_rate": {"global_avg": 45.0, "best": 95.0, "description": "Occupational disease detection rate"},
    "vulnerability_index": {"global_avg": 40.0, "best": 10.0, "lower_better": True, "description": "Workforce vulnerability index"},
    "migrant_worker_pct": {"global_avg": 15.0, "best": None, "description": "Migrant worker population percentage"},
    
    # Pillar 3: Restoration
    "payer_mechanism": {"global_avg": 0.5, "best": 1.0, "description": "Compensation system type"},
    "reintegration_law": {"global_avg": 0.4, "best": 1.0, "description": "Return-to-work legislation in place"},
    "sickness_absence_days": {"global_avg": 12.0, "best": 5.0, "lower_better": True, "description": "Average sickness absence days per worker"},
    "rehab_access_score": {"global_avg": 45.0, "best": 95.0, "description": "Rehabilitation services accessibility"},
    "return_to_work_success_pct": {"global_avg": 55.0, "best": 90.0, "description": "Return-to-work program success rate"},
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_metric_value(country: Country, pillar_id: str, metric_name: str) -> tuple:
    """Extract metric value from country data."""
    value = None
    formatted_value = "N/A"
    
    if pillar_id == "governance" and country.governance:
        gov = country.governance
        if metric_name == "ilo_c187_status":
            value = 1.0 if gov.ilo_c187_status else 0.0
            formatted_value = "Yes" if gov.ilo_c187_status else "No"
        elif metric_name == "ilo_c155_status":
            value = 1.0 if gov.ilo_c155_status else 0.0
            formatted_value = "Yes" if gov.ilo_c155_status else "No"
        elif metric_name == "inspector_density":
            value = gov.inspector_density
            formatted_value = f"{value} per 10,000" if value else "N/A"
        elif metric_name == "mental_health_policy":
            value = 1.0 if gov.mental_health_policy else 0.0
            formatted_value = "Yes" if gov.mental_health_policy else "No"
        elif metric_name == "strategic_capacity_score":
            value = gov.strategic_capacity_score
            formatted_value = f"{value}%" if value else "N/A"
    
    elif pillar_id == "pillar1" and country.pillar_1_hazard:
        p1 = country.pillar_1_hazard
        if metric_name == "fatal_accident_rate":
            value = p1.fatal_accident_rate
            formatted_value = f"{value}/100,000" if value else "N/A"
        elif metric_name == "carcinogen_exposure_pct":
            value = p1.carcinogen_exposure_pct
            formatted_value = f"{value}%" if value else "N/A"
        elif metric_name == "heat_stress_reg_type":
            if p1.heat_stress_reg_type:
                value = {"None": 0, "Advisory": 0.3, "Moderate": 0.6, "Strict": 1.0}.get(p1.heat_stress_reg_type, 0.5)
                formatted_value = p1.heat_stress_reg_type
            else:
                formatted_value = "N/A"
        elif metric_name == "oel_compliance_pct":
            value = p1.oel_compliance_pct
            formatted_value = f"{value}%" if value else "N/A"
        elif metric_name == "control_maturity_score":
            value = p1.control_maturity_score
            formatted_value = f"{value}%" if value else "N/A"
    
    elif pillar_id == "pillar2" and country.pillar_2_vigilance:
        p2 = country.pillar_2_vigilance
        if metric_name == "surveillance_logic":
            if p2.surveillance_logic:
                value = {"None": 0, "Mandatory": 0.4, "Risk-Based": 0.7, "Predictive": 1.0}.get(p2.surveillance_logic, 0.5)
                formatted_value = p2.surveillance_logic
            else:
                formatted_value = "N/A"
        elif metric_name == "disease_detection_rate":
            value = p2.disease_detection_rate
            formatted_value = f"{value}%" if value else "N/A"
        elif metric_name == "vulnerability_index":
            value = p2.vulnerability_index
            formatted_value = f"{value}/100" if value else "N/A"
        elif metric_name == "migrant_worker_pct":
            value = p2.migrant_worker_pct
            formatted_value = f"{value}%" if value else "N/A"
    
    elif pillar_id == "pillar3" and country.pillar_3_restoration:
        p3 = country.pillar_3_restoration
        if metric_name == "payer_mechanism":
            if p3.payer_mechanism:
                value = {"Litigation": 0.2, "Private": 0.5, "Social": 0.7, "No-Fault": 1.0}.get(p3.payer_mechanism, 0.5)
                formatted_value = p3.payer_mechanism
            else:
                formatted_value = "N/A"
        elif metric_name == "reintegration_law":
            value = 1.0 if p3.reintegration_law else 0.0
            formatted_value = "Yes" if p3.reintegration_law else "No"
        elif metric_name == "sickness_absence_days":
            value = p3.sickness_absence_days
            formatted_value = f"{value} days" if value else "N/A"
        elif metric_name == "rehab_access_score":
            value = p3.rehab_access_score
            formatted_value = f"{value}/100" if value else "N/A"
        elif metric_name == "return_to_work_success_pct":
            value = p3.return_to_work_success_pct
            formatted_value = f"{value}%" if value else "N/A"
    
    return value, formatted_value


def calculate_percentile(value: float, benchmark: dict) -> float:
    """Calculate percentile rank based on value and benchmark."""
    if value is None:
        return 50.0  # Default to median if no value
    
    global_avg = benchmark.get("global_avg", 0)
    best = benchmark.get("best", 100)
    lower_better = benchmark.get("lower_better", False)
    
    if lower_better:
        # For metrics where lower is better (e.g., fatal_accident_rate)
        if value <= best:
            return 95.0
        elif value >= global_avg * 2:
            return 10.0
        else:
            # Linear interpolation
            range_val = (global_avg * 2) - best
            position = value - best
            return max(10, 95 - (position / range_val * 85))
    else:
        # For metrics where higher is better
        if value >= best:
            return 95.0
        elif value <= 0:
            return 5.0
        else:
            # Linear interpolation
            return min(95, max(5, (value / best) * 95))


def get_performance_rating(percentile: float, lower_better: bool = False) -> str:
    """Convert percentile to performance rating."""
    if percentile >= 80:
        return "excellent"
    elif percentile >= 60:
        return "good"
    elif percentile >= 40:
        return "moderate"
    elif percentile >= 20:
        return "concerning"
    else:
        return "critical"


# ============================================================================
# METRIC DEFINITIONS FOR UI
# ============================================================================

PILLAR_METRICS = {
    "governance": [
        {"id": "ilo_c187_status", "name": "ILO C187 (Promotional Framework)"},
        {"id": "ilo_c155_status", "name": "ILO C155 (OSH Convention)"},
        {"id": "inspector_density", "name": "Inspector Density"},
        {"id": "mental_health_policy", "name": "Mental Health Policy"},
        {"id": "strategic_capacity_score", "name": "Strategic Capacity Score"},
    ],
    "pillar1": [
        {"id": "fatal_accident_rate", "name": "Fatal Accident Rate"},
        {"id": "carcinogen_exposure_pct", "name": "Carcinogen Exposure"},
        {"id": "heat_stress_reg_type", "name": "Heat Stress Regulation"},
        {"id": "oel_compliance_pct", "name": "OEL Compliance"},
        {"id": "control_maturity_score", "name": "Control Maturity Score"},
    ],
    "pillar2": [
        {"id": "surveillance_logic", "name": "Surveillance Logic"},
        {"id": "disease_detection_rate", "name": "Disease Detection Rate"},
        {"id": "vulnerability_index", "name": "Vulnerability Index"},
        {"id": "migrant_worker_pct", "name": "Migrant Worker %"},
    ],
    "pillar3": [
        {"id": "payer_mechanism", "name": "Payer Mechanism"},
        {"id": "reintegration_law", "name": "Reintegration Law"},
        {"id": "sickness_absence_days", "name": "Sickness Absence Days"},
        {"id": "rehab_access_score", "name": "Rehab Access Score"},
        {"id": "return_to_work_success_pct", "name": "Return-to-Work Success"},
    ],
}

PILLAR_NAMES = {
    "governance": "Governance Layer",
    "pillar1": "Pillar 1: Hazard Control",
    "pillar2": "Pillar 2: Health Vigilance",
    "pillar3": "Pillar 3: Restoration",
}


# ============================================================================
# MAIN AGENT FUNCTIONS
# ============================================================================

def generate_metric_explanation_with_ai(
    country: Country,
    pillar_id: str,
    metric: dict,
    db: Session
) -> Optional[dict]:
    """Generate explanation using configured AI provider."""
    import time
    from app.services.ai_orchestrator import get_llm_from_config
    
    metric_id = metric["id"]
    metric_name = metric["name"]
    benchmark = GLOBAL_BENCHMARKS.get(metric_id, {})
    
    # Get metric value
    value, formatted_value = get_metric_value(country, pillar_id, metric_id)
    global_avg = benchmark.get("global_avg")
    percentile = calculate_percentile(value, benchmark) if value is not None else 50.0
    
    # Get AI config
    ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    
    start_time = time.time()
    success = False
    error_message = None
    
    try:
        llm = get_llm_from_config(ai_config)
        
        if llm:
            from langchain_core.messages import SystemMessage, HumanMessage
            
            prompt = METRIC_EXPLANATION_PROMPT.format(
                country_name=country.name,
                iso_code=country.iso_code,
                pillar_name=PILLAR_NAMES.get(pillar_id, pillar_id),
                metric_name=metric_name,
                metric_value=formatted_value,
                global_average=global_avg if global_avg else "Not available",
                percentile_rank=round(percentile, 1)
            )
            
            messages = [
                SystemMessage(content=METRIC_EXPLANATION_SYSTEM_PROMPT),
                HumanMessage(content=prompt)
            ]
            
            response = llm.invoke(messages)
            response_text = response.content.strip()
            
            # Clean markdown if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
            response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            success = True
            return {
                "metric_name": metric_name,
                "metric_value": formatted_value,
                "global_average": global_avg,
                "percentile_rank": percentile,
                "explanation": result.get("explanation", ""),
                "performance_analysis": result.get("performance_analysis", ""),
                "performance_rating": result.get("performance_rating", "moderate"),
                "comparison_data": result.get("comparison_data", {
                    "country_value": value,
                    "global_average": global_avg,
                    "percentile": percentile
                })
            }
    except Exception as e:
        logger.error(f"AI explanation generation failed for {metric_name}: {e}")
        error_message = str(e)
    finally:
        # Log the trace if AI was used
        if ai_config:
            latency_ms = int((time.time() - start_time) * 1000)
            try:
                AICallTracer.trace(
                    db=db,
                    provider=ai_config.provider.value,
                    model_name=ai_config.model_name,
                    operation_type="metric_explanation",
                    success=success,
                    latency_ms=latency_ms,
                    endpoint="/api/v1/admin/metric-explanations",
                    country_iso_code=country.iso_code,
                    topic=f"{pillar_id}/{metric_name}",
                    error_message=error_message,
                )
            except Exception as trace_error:
                logger.warning(f"Failed to log AI call trace: {trace_error}")
    
    # Fallback: Generate basic explanation without AI
    return generate_fallback_explanation(country, pillar_id, metric, benchmark, value, formatted_value, percentile)


def generate_fallback_explanation(
    country: Country,
    pillar_id: str,
    metric: dict,
    benchmark: dict,
    value: float,
    formatted_value: str,
    percentile: float
) -> dict:
    """Generate basic explanation without AI."""
    metric_name = metric["name"]
    description = benchmark.get("description", metric_name)
    rating = get_performance_rating(percentile)
    lower_better = benchmark.get("lower_better", False)
    global_avg = benchmark.get("global_avg")
    
    # Generate explanation
    explanation = f"{metric_name} measures {description.lower()}."
    
    # Generate performance analysis
    if value is not None and global_avg:
        if lower_better:
            comparison = "below" if value < global_avg else "above"
            quality = "better than" if value < global_avg else "worse than"
        else:
            comparison = "above" if value > global_avg else "below"
            quality = "better than" if value > global_avg else "below"
        
        performance_analysis = f"{country.name}'s value of {formatted_value} is {comparison} the global average of {global_avg}, ranking {quality} most countries at the {round(percentile)}th percentile."
    else:
        performance_analysis = f"{country.name}'s current status is {formatted_value}."
    
    return {
        "metric_name": metric_name,
        "metric_value": formatted_value,
        "global_average": global_avg,
        "percentile_rank": percentile,
        "explanation": explanation,
        "performance_analysis": performance_analysis,
        "performance_rating": rating,
        "comparison_data": {
            "country_value": value,
            "global_average": global_avg,
            "best_in_class": benchmark.get("best"),
            "percentile": percentile
        }
    }


def generate_and_store_explanations(
    iso_code: str,
    pillar_id: str,
    db: Session,
    user: User
) -> List[dict]:
    """Generate explanations for all metrics in a pillar and store them."""
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        raise ValueError(f"Country {iso_code} not found")
    
    metrics = PILLAR_METRICS.get(pillar_id, [])
    if not metrics:
        raise ValueError(f"Invalid pillar_id: {pillar_id}")
    
    results = []
    ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    provider_name = ai_config.provider.value if ai_config else "fallback"
    
    for metric in metrics:
        # Generate explanation
        explanation_data = generate_metric_explanation_with_ai(country, pillar_id, metric, db)
        
        if explanation_data:
            # Check if exists and update, or create new
            existing = db.query(MetricExplanation).filter(
                MetricExplanation.country_iso_code == iso_code,
                MetricExplanation.pillar_id == pillar_id,
                MetricExplanation.metric_name == metric["name"]
            ).first()
            
            if existing:
                # Update existing
                existing.metric_value = explanation_data["metric_value"]
                existing.global_average = explanation_data.get("global_average")
                existing.percentile_rank = explanation_data.get("percentile_rank")
                existing.explanation = explanation_data["explanation"]
                existing.performance_analysis = explanation_data.get("performance_analysis")
                existing.performance_rating = explanation_data["performance_rating"]
                existing.comparison_data = explanation_data.get("comparison_data")
                existing.generated_by = user.id
                existing.ai_provider = provider_name
                existing.updated_at = datetime.utcnow()
            else:
                # Create new
                new_explanation = MetricExplanation(
                    country_iso_code=iso_code,
                    pillar_id=pillar_id,
                    metric_name=metric["name"],
                    metric_value=explanation_data["metric_value"],
                    global_average=explanation_data.get("global_average"),
                    percentile_rank=explanation_data.get("percentile_rank"),
                    explanation=explanation_data["explanation"],
                    performance_analysis=explanation_data.get("performance_analysis"),
                    performance_rating=explanation_data["performance_rating"],
                    comparison_data=explanation_data.get("comparison_data"),
                    generated_by=user.id,
                    ai_provider=provider_name
                )
                db.add(new_explanation)
            
            results.append(explanation_data)
    
    db.commit()
    
    return results


def get_stored_explanations(iso_code: str, pillar_id: str, db: Session) -> List[dict]:
    """Retrieve stored explanations for a pillar."""
    explanations = db.query(MetricExplanation).filter(
        MetricExplanation.country_iso_code == iso_code,
        MetricExplanation.pillar_id == pillar_id
    ).all()
    
    return [
        {
            "metric_name": exp.metric_name,
            "metric_value": exp.metric_value,
            "global_average": exp.global_average,
            "percentile_rank": exp.percentile_rank,
            "explanation": exp.explanation,
            "performance_analysis": exp.performance_analysis,
            "performance_rating": exp.performance_rating,
            "comparison_data": exp.comparison_data or {}
        }
        for exp in explanations
    ]
