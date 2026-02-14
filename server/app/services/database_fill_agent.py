"""
GOHIP Platform - Database Fill Agent Service
=============================================

Orchestrates per-country AI-driven filling of NULL pillar fields.
Uses the database-fill-agent to enrich structured data with web-searched,
source-cited values.

Features:
- Identifies NULL fields per country across all 4 pillar tables + governance
- Invokes the AI agent with existing data context and list of NULL fields
- Validates and range-clamps returned values before DB write
- Stores source URLs in each pillar's source_urls JSONB column
- Skips fields that already have non-NULL values
- Tracks progress for polling by the admin UI
"""

import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.country import (
    Country,
    GovernanceLayer,
    Pillar1Hazard,
    Pillar2Vigilance,
    Pillar3Restoration,
    CountryIntelligence,
)
from app.models.user import AIConfig
from app.services.agent_runner import AgentRunner

logger = logging.getLogger(__name__)


# =============================================================================
# FIELD DEFINITIONS WITH VALIDATION RULES
# =============================================================================

FIELD_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    # --- Governance ---
    "ilo_c187_status": {
        "model": "GovernanceLayer",
        "type": "boolean",
    },
    "ilo_c155_status": {
        "model": "GovernanceLayer",
        "type": "boolean",
    },
    "inspector_density": {
        "model": "GovernanceLayer",
        "type": "float",
        "min": 0.0,
        "max": 5.0,
    },
    "mental_health_policy": {
        "model": "GovernanceLayer",
        "type": "boolean",
    },
    # --- Pillar 1: Hazard Control ---
    "carcinogen_exposure_pct": {
        "model": "Pillar1Hazard",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
    "heat_stress_reg_type": {
        "model": "Pillar1Hazard",
        "type": "enum",
        "allowed": ["Comprehensive", "Partial", "Basic", "None"],
    },
    "oel_compliance_pct": {
        "model": "Pillar1Hazard",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
    "noise_induced_hearing_loss_rate": {
        "model": "Pillar1Hazard",
        "type": "float",
        "min": 0.0,
        "max": 500.0,
    },
    "safety_training_hours_avg": {
        "model": "Pillar1Hazard",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
    # --- Pillar 2: Vigilance ---
    "surveillance_logic": {
        "model": "Pillar2Vigilance",
        "type": "enum",
        "allowed": ["Risk-Based", "Event-Based", "Sentinel", "Passive", "None"],
    },
    "migrant_worker_pct": {
        "model": "Pillar2Vigilance",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
    "lead_exposure_screening_rate": {
        "model": "Pillar2Vigilance",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
    "occupational_disease_reporting_rate": {
        "model": "Pillar2Vigilance",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
    # --- Pillar 3: Restoration ---
    "payer_mechanism": {
        "model": "Pillar3Restoration",
        "type": "enum",
        "allowed": ["No-Fault", "Employer-Liability", "Social-Insurance", "Hybrid", "None"],
    },
    "reintegration_law": {
        "model": "Pillar3Restoration",
        "type": "boolean",
    },
    "sickness_absence_days": {
        "model": "Pillar3Restoration",
        "type": "float",
        "min": 0.0,
        "max": 365.0,
    },
    "return_to_work_success_pct": {
        "model": "Pillar3Restoration",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
    "avg_claim_settlement_days": {
        "model": "Pillar3Restoration",
        "type": "float",
        "min": 0.0,
        "max": 1000.0,
    },
    "rehab_participation_rate": {
        "model": "Pillar3Restoration",
        "type": "float",
        "min": 0.0,
        "max": 100.0,
    },
}

MODEL_CLASSES = {
    "GovernanceLayer": GovernanceLayer,
    "Pillar1Hazard": Pillar1Hazard,
    "Pillar2Vigilance": Pillar2Vigilance,
    "Pillar3Restoration": Pillar3Restoration,
}


# =============================================================================
# PROGRESS TRACKING
# =============================================================================

_fill_status: Dict[str, Any] = {}


def get_fill_status() -> Dict[str, Any]:
    """Return the current fill status for the admin UI."""
    return dict(_fill_status)


def reset_fill_status():
    """Reset the fill status."""
    global _fill_status
    _fill_status = {}


# =============================================================================
# HELPERS
# =============================================================================

def _get_or_create_pillar_record(db: Session, model_cls, country_iso: str):
    """Get or create a pillar record for a country."""
    record = db.query(model_cls).filter(
        model_cls.country_iso_code == country_iso
    ).first()
    if not record:
        record = model_cls(
            id=str(uuid4()),
            country_iso_code=country_iso,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    return record


def _get_null_fields(db: Session, country_iso: str) -> Tuple[List[str], Dict[str, Any]]:
    """
    Identify which fields are NULL for a country and gather existing data.
    
    Returns:
        (null_field_names, existing_data_dict)
    """
    null_fields = []
    existing_data = {}

    for field_name, field_def in FIELD_DEFINITIONS.items():
        model_cls = MODEL_CLASSES[field_def["model"]]
        record = db.query(model_cls).filter(
            model_cls.country_iso_code == country_iso
        ).first()

        if record is None:
            # No record at all — all fields are NULL
            null_fields.append(field_name)
        else:
            value = getattr(record, field_name, None)
            if value is None:
                null_fields.append(field_name)
            else:
                existing_data[field_name] = value

    return null_fields, existing_data


def _validate_value(field_name: str, raw_value: Any) -> Any:
    """
    Validate and clamp a value according to its field definition.
    Returns the cleaned value or None if invalid.
    """
    field_def = FIELD_DEFINITIONS.get(field_name)
    if not field_def:
        return None

    if raw_value is None:
        return None

    field_type = field_def["type"]

    try:
        if field_type == "boolean":
            if isinstance(raw_value, bool):
                return raw_value
            if isinstance(raw_value, str):
                return raw_value.lower() in ("true", "yes", "1")
            return bool(raw_value)

        elif field_type == "float":
            val = float(raw_value)
            min_val = field_def.get("min", float("-inf"))
            max_val = field_def.get("max", float("inf"))
            return max(min_val, min(max_val, val))

        elif field_type == "enum":
            allowed = field_def.get("allowed", [])
            str_val = str(raw_value)
            # Case-insensitive match
            for option in allowed:
                if option.lower() == str_val.lower():
                    return option
            logger.warning(
                f"[DatabaseFill] Invalid enum value '{raw_value}' for {field_name}. "
                f"Allowed: {allowed}"
            )
            return None

    except (ValueError, TypeError) as e:
        logger.warning(f"[DatabaseFill] Validation error for {field_name}={raw_value}: {e}")
        return None

    return None


def _apply_filled_fields(
    db: Session,
    country_iso: str,
    filled_fields: Dict[str, Dict[str, Any]],
    force_overwrite: bool = False,
) -> Dict[str, int]:
    """
    Apply validated field values to the database.
    
    Args:
        force_overwrite: If True, overwrite existing non-NULL values.
    
    Returns dict with counts: {"written": N, "skipped": N, "invalid": N}
    """
    counts = {"written": 0, "skipped": 0, "invalid": 0}

    # Group fields by model
    model_fields: Dict[str, Dict[str, Any]] = {}
    model_sources: Dict[str, Dict[str, str]] = {}

    for field_name, field_data in filled_fields.items():
        if field_name not in FIELD_DEFINITIONS:
            counts["invalid"] += 1
            continue

        field_def = FIELD_DEFINITIONS[field_name]
        model_name = field_def["model"]

        # Extract and validate value
        raw_value = field_data.get("value") if isinstance(field_data, dict) else field_data
        validated = _validate_value(field_name, raw_value)

        if validated is None:
            counts["invalid"] += 1
            continue

        if model_name not in model_fields:
            model_fields[model_name] = {}
            model_sources[model_name] = {}

        model_fields[model_name][field_name] = validated

        # Track source URL
        if isinstance(field_data, dict) and field_data.get("source_url"):
            model_sources[model_name][field_name] = field_data["source_url"]

    # Write to each model
    for model_name, fields in model_fields.items():
        model_cls = MODEL_CLASSES[model_name]
        record = _get_or_create_pillar_record(db, model_cls, country_iso)

        for field_name, value in fields.items():
            # Skip if field already has a value and we're not forcing overwrite
            if not force_overwrite:
                current_value = getattr(record, field_name, None)
                if current_value is not None:
                    counts["skipped"] += 1
                    continue

            setattr(record, field_name, value)
            counts["written"] += 1

        # Update source_urls JSONB
        sources = model_sources.get(model_name, {})
        if sources:
            existing_sources = record.source_urls or {}
            existing_sources.update(sources)
            record.source_urls = existing_sources

    db.commit()
    return counts


# =============================================================================
# AI FILL ORCHESTRATION
# =============================================================================

# Cheaper model for batch operations (~15x cheaper, 2-3x faster than gpt-4o)
BATCH_FILL_MODEL = "gpt-4o-mini"


async def fill_country(
    db: Session,
    country_iso: str,
    ai_config: Optional[AIConfig] = None,
    force_regenerate: bool = False,
) -> Dict[str, Any]:
    """
    Fill NULL pillar fields for a single country using the AI agent.
    Single-endpoint version that uses a provided DB session.
    For batch operations, use fill_country_batch() instead.
    """
    country = db.query(Country).filter(Country.iso_code == country_iso).first()
    if not country:
        return {"country_iso": country_iso, "success": False, "error": f"Country not found: {country_iso}"}

    if force_regenerate:
        null_fields = list(FIELD_DEFINITIONS.keys())
        _, existing_data = _get_null_fields(db, country_iso)
    else:
        null_fields, existing_data = _get_null_fields(db, country_iso)

    if not null_fields:
        return {"country_iso": country_iso, "country_name": country.name, "success": True, "status": "already_complete", "null_fields": 0, "written": 0}

    existing_str = json.dumps(existing_data, indent=2, default=str) if existing_data else "No existing data."
    null_fields_str = "\n".join(f"- {f}" for f in null_fields)

    runner = AgentRunner(db, ai_config)
    try:
        result = await asyncio.wait_for(
            runner.run(agent_id="database-fill-agent", variables={"COUNTRY_NAME": country.name, "COUNTRY_ISO": country_iso, "ISO_CODE": country_iso, "EXISTING_DATA": existing_str, "NULL_FIELDS": null_fields_str}, enable_web_search=True),
            timeout=300,
        )
    except asyncio.TimeoutError:
        return {"country_iso": country_iso, "country_name": country.name, "success": False, "error": "AI agent timed out after 300 seconds"}
    except Exception as e:
        return {"country_iso": country_iso, "country_name": country.name, "success": False, "error": f"AI agent error: {type(e).__name__}: {e}"}

    if not result.get("success"):
        return {"country_iso": country_iso, "country_name": country.name, "success": False, "error": result.get("error", "AI agent returned failure")}

    output = result.get("output", "")
    try:
        parsed = _parse_agent_output(output)
    except Exception as e:
        return {"country_iso": country_iso, "country_name": country.name, "success": False, "error": f"Failed to parse AI output: {e}", "raw_output_preview": str(output)[:500]}

    filled_fields = parsed.get("filled_fields", {})
    if not filled_fields:
        return {"country_iso": country_iso, "country_name": country.name, "success": True, "status": "no_data_found", "null_fields": len(null_fields), "written": 0, "unfilled": parsed.get("unfilled_fields", null_fields)}

    counts = _apply_filled_fields(db, country_iso, filled_fields, force_overwrite=force_regenerate)
    return {"country_iso": country_iso, "country_name": country.name, "success": True, "status": "filled", "null_fields": len(null_fields), **counts, "unfilled": parsed.get("unfilled_fields", [])}


async def fill_country_batch(
    session_factory,
    country_iso: str,
    force_regenerate: bool = False,
) -> Dict[str, Any]:
    """
    Fill NULL pillar fields for a single country — batch-safe version.

    Uses 3-phase short-lived sessions to avoid session expiration during long AI calls:
      Phase A: Read data + build context (short-lived session, closed before AI call)
      Phase B: AI call (dedicated session for AgentRunner, closed after AI returns)
      Phase C: Write results to DB (short-lived session, closed after commit)
    """
    country_name = None

    # ══════════════════════════════════════════════════════════════════════
    # PHASE A: Short-lived DB read — extract data, close session
    # ══════════════════════════════════════════════════════════════════════
    try:
        db_read = session_factory()
        try:
            country = db_read.query(Country).filter(Country.iso_code == country_iso).first()
            if not country:
                return {"country_iso": country_iso, "success": False, "error": f"Country not found: {country_iso}"}
            country_name = country.name

            if force_regenerate:
                null_fields = list(FIELD_DEFINITIONS.keys())
                _, existing_data = _get_null_fields(db_read, country_iso)
                logger.info(f"[DatabaseFill] {country_iso}: force_regenerate=True, targeting all {len(null_fields)} fields")
            else:
                null_fields, existing_data = _get_null_fields(db_read, country_iso)
                logger.info(f"[DatabaseFill] {country_iso}: {len(null_fields)} NULL fields, {len(existing_data)} existing fields")

            if not null_fields:
                logger.info(f"[DatabaseFill] {country_iso}: SKIPPING - all fields have values")
                return {"country_iso": country_iso, "country_name": country_name, "success": True, "status": "already_complete", "null_fields": 0, "written": 0}

            # Snapshot data into plain Python strings before closing session
            existing_str = json.dumps(existing_data, indent=2, default=str) if existing_data else "No existing data."
            null_fields_str = "\n".join(f"- {f}" for f in null_fields)
            logger.info(f"[DatabaseFill] Phase A done: {country_iso} ({len(null_fields)} fields to fill)")
        finally:
            db_read.close()
    except Exception as e:
        return {"country_iso": country_iso, "country_name": country_name, "success": False, "error": f"Phase A error: {type(e).__name__}: {e}"}

    # ══════════════════════════════════════════════════════════════════════
    # PHASE B: AI call — dedicated session for AgentRunner, closed after
    # ══════════════════════════════════════════════════════════════════════
    try:
        db_ai = session_factory()
        try:
            runner = AgentRunner(db_ai)
            result = await asyncio.wait_for(
                runner.run(
                    agent_id="database-fill-agent",
                    variables={
                        "COUNTRY_NAME": country_name,
                        "COUNTRY_ISO": country_iso,
                        "ISO_CODE": country_iso,
                        "EXISTING_DATA": existing_str,
                        "NULL_FIELDS": null_fields_str,
                    },
                    enable_web_search=True,
                    override_model=BATCH_FILL_MODEL,
                ),
                timeout=300,
            )
        finally:
            db_ai.close()  # Close AI session immediately — do NOT reuse for writes
    except asyncio.TimeoutError:
        return {"country_iso": country_iso, "country_name": country_name, "success": False, "error": "AI agent timed out after 300 seconds"}
    except Exception as e:
        return {"country_iso": country_iso, "country_name": country_name, "success": False, "error": f"AI agent error: {type(e).__name__}: {e}"}

    if not result.get("success"):
        logger.error(f"[DatabaseFill] {country_iso}: AI agent returned failure: {result.get('error')}")
        return {"country_iso": country_iso, "country_name": country_name, "success": False, "error": result.get("error", "AI agent returned failure")}

    # Parse the AI output (no DB needed)
    output = result.get("output", "")
    logger.info(f"[DatabaseFill] {country_iso}: AI returned {len(output)} chars of output")
    try:
        parsed = _parse_agent_output(output)
    except Exception as e:
        logger.error(f"[DatabaseFill] {country_iso}: Failed to parse AI output: {e}. Preview: {str(output)[:300]}")
        return {"country_iso": country_iso, "country_name": country_name, "success": False, "error": f"Failed to parse AI output: {e}", "raw_output_preview": str(output)[:500]}

    filled_fields = parsed.get("filled_fields", {})
    if not filled_fields:
        logger.warning(f"[DatabaseFill] {country_iso}: AI returned no filled_fields. Preview: {str(output)[:300]}")
        return {"country_iso": country_iso, "country_name": country_name, "success": True, "status": "no_data_found", "null_fields": len(null_fields), "written": 0, "unfilled": parsed.get("unfilled_fields", null_fields)}

    # ══════════════════════════════════════════════════════════════════════
    # PHASE C: Short-lived DB write — apply results, commit, close
    # ══════════════════════════════════════════════════════════════════════
    try:
        db_write = session_factory()
        try:
            logger.info(f"[DatabaseFill] {country_iso}: Applying {len(filled_fields)} fields to DB (force_overwrite={force_regenerate})")
            counts = _apply_filled_fields(db_write, country_iso, filled_fields, force_overwrite=force_regenerate)
            logger.info(f"[DatabaseFill] Phase C done: {country_iso} — written={counts['written']}, skipped={counts['skipped']}")
        finally:
            db_write.close()
    except Exception as e:
        logger.error(f"[DatabaseFill] {country_iso}: Phase C COMMIT FAILED: {type(e).__name__}: {e}", exc_info=True)
        return {"country_iso": country_iso, "country_name": country_name, "success": False, "error": f"DB commit failed: {type(e).__name__}: {e}"}

    return {"country_iso": country_iso, "country_name": country_name, "success": True, "status": "filled", "null_fields": len(null_fields), **counts, "unfilled": parsed.get("unfilled_fields", [])}


def _parse_agent_output(output: str) -> Dict[str, Any]:
    """Parse the AI agent's JSON output, handling potential markdown wrapping."""
    if not output:
        return {}

    text = output.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json) and last line (```)
        if lines[-1].strip() == "```":
            lines = lines[1:-1]
        else:
            lines = lines[1:]
        text = "\n".join(lines).strip()

    return json.loads(text)


# =============================================================================
# BATCH FILL ORCHESTRATION
# =============================================================================

async def run_batch_fill(
    country_isos: List[str],
    db_url: str,
    delay_between: float = 2.0,
    force_regenerate: bool = False,
):
    """
    Run the database fill agent for multiple countries sequentially.
    Updates _fill_status for progress tracking.

    Uses 3-phase short-lived sessions per country (via fill_country_batch)
    to avoid session expiration during long AI calls.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    global _fill_status

    engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=300)
    SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    total = len(country_isos)
    _fill_status = {
        "status": "running",
        "total": total,
        "completed": 0,
        "failed": 0,
        "skipped": 0,
        "current_country": None,
        "fields_written": 0,
        "errors": [],
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "results": [],
    }

    for i, country_iso in enumerate(country_isos):
        _fill_status["current_country"] = country_iso

        try:
            result = await fill_country_batch(
                session_factory=SessionFactory,
                country_iso=country_iso,
                force_regenerate=force_regenerate,
            )
            _fill_status["results"].append(result)

            if result.get("success"):
                if result.get("status") == "already_complete":
                    _fill_status["skipped"] += 1
                elif result.get("status") == "no_data_found":
                    _fill_status["skipped"] += 1
                else:
                    _fill_status["completed"] += 1
                    _fill_status["fields_written"] += result.get("written", 0)
            else:
                _fill_status["failed"] += 1
                _fill_status["errors"].append({
                    "country_iso": country_iso,
                    "error": result.get("error", "Unknown error"),
                })

        except Exception as e:
            logger.error(f"[DatabaseFill] Unexpected error for {country_iso}: {type(e).__name__}: {e}", exc_info=True)
            _fill_status["failed"] += 1
            _fill_status["errors"].append({
                "country_iso": country_iso,
                "error": f"{type(e).__name__}: {e}",
            })

        # Rate limiting delay (skip after last country)
        if i < total - 1:
            await asyncio.sleep(delay_between)

    _fill_status["current_country"] = None

    logger.info(
        f"[DatabaseFill] Batch complete: {_fill_status['completed']} filled, "
        f"{_fill_status['failed']} failed, {_fill_status['skipped']} skipped, "
        f"{_fill_status['fields_written']} total fields written"
    )

    # Trigger automatic score recalculation after fill
    if _fill_status["fields_written"] > 0:
        _fill_status["status"] = "recalculating_scores"
        try:
            recalc_db = SessionFactory()
            recalc_count = recalculate_all_scores_standalone(recalc_db)
            recalc_db.close()
            _fill_status["scores_recalculated"] = recalc_count
            logger.info(f"[DatabaseFill] Score recalculation complete: {recalc_count} countries updated")
        except Exception as e:
            logger.error(f"[DatabaseFill] Score recalculation failed: {e}")
            _fill_status["recalculation_error"] = str(e)

    _fill_status["status"] = "completed"
    _fill_status["completed_at"] = datetime.utcnow().isoformat()

    try:
        engine.dispose()
    except Exception:
        pass


def recalculate_all_scores_standalone(db: Session) -> int:
    """
    Recalculate pillar scores and maturity scores for all countries.
    
    Standalone version that doesn't require FastAPI request context.
    Uses the same logic as the /recalculate endpoint in metric_config.py.
    """
    from sqlalchemy import text
    from app.models.metric_config import PillarSummaryMetric, MaturityScoringRule

    # Load pillar summary configurations
    pillar_summaries = db.query(PillarSummaryMetric).filter(
        PillarSummaryMetric.is_active == True
    ).all()
    pillar_weights = {s.pillar.value: s.component_weights for s in pillar_summaries}

    # Load active maturity rules
    rules = db.query(MaturityScoringRule).filter(
        MaturityScoringRule.is_active == True
    ).order_by(MaturityScoringRule.priority).all()
    rule_config = [r.to_dict() for r in rules]

    # Fetch all country data
    query = text("""
        SELECT 
            c.iso_code,
            g.ilo_c187_status, g.ilo_c155_status, g.inspector_density,
            g.mental_health_policy, g.strategic_capacity_score,
            p1.fatal_accident_rate, p1.oel_compliance_pct, p1.safety_training_hours_avg,
            p1.carcinogen_exposure_pct, p1.control_maturity_score,
            p2.vulnerability_index, p2.disease_detection_rate,
            p2.occupational_disease_reporting_rate, p2.lead_exposure_screening_rate,
            p2.surveillance_logic,
            p3.rehab_access_score, p3.return_to_work_success_pct,
            p3.rehab_participation_rate, p3.avg_claim_settlement_days,
            p3.reintegration_law, p3.payer_mechanism
        FROM countries c
        LEFT JOIN governance_layer g ON c.iso_code = g.country_iso_code
        LEFT JOIN pillar_1_hazard p1 ON c.iso_code = p1.country_iso_code
        LEFT JOIN pillar_2_vigilance p2 ON c.iso_code = p2.country_iso_code
        LEFT JOIN pillar_3_restoration p3 ON c.iso_code = p3.country_iso_code
    """)

    result = db.execute(query)
    rows = result.fetchall()

    updated = 0
    for row in rows:
        (iso_code,
         ilo_c187, ilo_c155, inspector_density_val, mental_health, strategic_cap,
         fatal_rate, oel_comp, safety_train, carcinogen_exp, control_mat,
         vuln_idx, disease_det, disease_rep, lead_screen, surveillance,
         rehab_access, rtw_success, rehab_part, claim_settle, reintegration, payer) = row

        # Calculate pillar scores using weighted average
        # Weights aligned with DEFAULT_PILLAR_SUMMARIES in metric_config.py
        gov_score = _safe_weighted_avg([
            (100.0 if ilo_c187 else (0.0 if ilo_c187 is not None else None), 0.20),
            (100.0 if ilo_c155 else (0.0 if ilo_c155 is not None else None), 0.20),
            (_safe_normalize(inspector_density_val, 3.0), 0.30),
            (100.0 if mental_health else (0.0 if mental_health is not None else None), 0.15),
            (strategic_cap, 0.15),
        ])

        p1_score = _safe_weighted_avg([
            (_safe_normalize(fatal_rate, 10.0, invert=True), 0.35),
            (oel_comp, 0.25),
            (control_mat, 0.20),
            (_safe_normalize(safety_train, 40.0), 0.10),
            (_safe_normalize(carcinogen_exp, 50.0, invert=True), 0.10),
        ])

        p2_score = _safe_weighted_avg([
            (_safe_normalize(vuln_idx, 100.0, invert=True), 0.30),
            (disease_det, 0.30),
            (disease_rep, 0.20),
            (lead_screen, 0.20),
        ])

        p3_score = _safe_weighted_avg([
            (rehab_access, 0.30),
            (rtw_success, 0.30),
            (rehab_part, 0.20),
            (_safe_normalize(claim_settle, 365.0, invert=True), 0.20),
        ])

        # Calculate maturity score (1.0 - 4.0)
        maturity = 1.0
        if fatal_rate is not None and fatal_rate < 1.0 and inspector_density_val is not None and inspector_density_val > 1.0:
            maturity += 1.0
        if fatal_rate is not None and fatal_rate > 3.0:
            maturity = min(maturity, 2.0)
        if surveillance is not None and surveillance == "Risk-Based":
            maturity += 0.5
        if reintegration is True:
            maturity += 1.0
        if payer is not None and payer == "No-Fault":
            maturity += 0.5
        maturity = round(max(1.0, min(4.0, maturity)), 1)

        update_q = text("""
            UPDATE countries 
            SET maturity_score = :maturity,
                governance_score = :gov,
                pillar1_score = :p1,
                pillar2_score = :p2,
                pillar3_score = :p3,
                updated_at = :now
            WHERE iso_code = :iso
        """)
        db.execute(update_q, {
            "maturity": maturity,
            "gov": gov_score,
            "p1": p1_score,
            "p2": p2_score,
            "p3": p3_score,
            "now": datetime.utcnow(),
            "iso": iso_code,
        })
        updated += 1

    db.commit()
    return updated


def _safe_normalize(value, max_val, invert=False):
    """Normalize a value to 0-100 scale."""
    if value is None:
        return None
    normalized = min(100.0, max(0.0, (value / max_val) * 100.0))
    if invert:
        normalized = 100.0 - normalized
    return round(normalized, 1)


def _safe_weighted_avg(items):
    """Calculate weighted average, skipping None values and redistributing weights."""
    total_weight = 0.0
    weighted_sum = 0.0
    for value, weight in items:
        if value is not None:
            weighted_sum += value * weight
            total_weight += weight
    if total_weight == 0:
        return None
    return round(weighted_sum / total_weight, 1)
