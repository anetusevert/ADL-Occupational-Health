"""
GOHIP Platform - Database Explorer API
========================================

Admin-only endpoint to explore database structure, sources, and usage.
Provides metadata about all tables, fields, and data sources.

Endpoints:
- GET /api/v1/admin/database - Get database overview
- GET /api/v1/admin/database/{table_name} - Get table details
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.models.user import User

# Create router
router = APIRouter(prefix="/admin/database", tags=["Admin - Database Explorer"])

logger.info("Database Explorer router initialized")


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class FieldInfo(BaseModel):
    """Information about a database field."""
    name: str
    type: str
    nullable: bool
    primary_key: bool = False
    foreign_key: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None
    ui_usage: List[str] = []


class TableInfo(BaseModel):
    """Information about a database table."""
    name: str
    row_count: int
    fields: List[FieldInfo]
    description: Optional[str] = None
    data_sources: List[str] = []
    last_updated: Optional[str] = None
    ui_pages: List[str] = []


class DatabaseOverview(BaseModel):
    """Overview of the entire database."""
    total_tables: int
    total_records: int
    tables: List[TableInfo]
    data_sources: Dict[str, Any]
    generated_at: str


# =============================================================================
# DATA SOURCE MAPPINGS
# =============================================================================

# Mapping of tables to their data sources
TABLE_SOURCES: Dict[str, List[str]] = {
    "countries": ["World Bank", "ILO", "Internal"],
    "governance_layer": ["ILO NORMLEX", "World Justice Project", "Transparency International", "WHO"],
    "pillar_1_hazard": ["ILOSTAT", "IHME GBD", "WHO GHO", "Yale EPI"],
    "pillar_2_vigilance": ["WHO GHO", "ILOSTAT", "World Bank"],
    "pillar_3_restoration": ["ILOSTAT", "World Bank", "UNDP", "OECD"],
    "country_intelligence": ["ILOSTAT", "World Bank", "WHO", "IHME GBD", "Yale EPI", "CPI", "WJP", "UNDP", "OECD"],
    "country_deep_dives": ["AI Generated", "Internal Research"],
    "best_practices": ["AI Generated", "ILO Publications", "WHO Guidelines"],
    "country_best_practices": ["AI Generated", "Country Research"],
    "users": ["Internal"],
    "agents": ["Internal"],
    "ai_config": ["Internal"],
    "metric_definitions": ["Internal Framework"],
    "maturity_scoring_rules": ["Internal Framework"],
}

# Mapping of tables to UI pages where they're used
TABLE_UI_USAGE: Dict[str, List[str]] = {
    "countries": ["Global Overview", "Country Data", "Compare", "Leaderboard"],
    "governance_layer": ["Country Profile", "Framework", "Compare"],
    "pillar_1_hazard": ["Country Profile", "Framework", "Compare"],
    "pillar_2_vigilance": ["Country Profile", "Framework", "Compare"],
    "pillar_3_restoration": ["Country Profile", "Framework", "Compare"],
    "country_intelligence": ["Country Data", "Deep Dive", "Reports"],
    "country_deep_dives": ["Deep Dive", "Reports"],
    "best_practices": ["Best Practices"],
    "country_best_practices": ["Best Practices"],
    "users": ["User Management"],
    "agents": ["AI Orchestration"],
    "ai_config": ["AI Configuration"],
    "metric_definitions": ["Scoring", "Framework"],
    "maturity_scoring_rules": ["Scoring"],
}

# Mapping of fields to their data sources
FIELD_SOURCES: Dict[str, Dict[str, str]] = {
    "country_intelligence": {
        "corruption_perception_index": "Transparency International CPI",
        "rule_of_law_index": "World Justice Project",
        "government_effectiveness": "World Bank WGI",
        "social_security_coverage_pct": "ILOSTAT",
        "dalys_occupational_injuries": "IHME GBD",
        "dalys_carcinogens": "IHME GBD",
        "dalys_noise": "IHME GBD",
        "dalys_ergonomic": "IHME GBD",
        "dalys_particulates": "IHME GBD",
        "dalys_asthmagens": "IHME GBD",
        "epi_score": "Yale Environmental Performance Index",
        "air_quality_score": "Yale EPI",
        "nonfatal_occ_injury_rate": "ILOSTAT",
        "fatal_occ_injury_rate": "ILOSTAT",
        "uhc_service_coverage_index": "WHO GHO",
        "health_worker_density": "WHO GHO",
        "hospital_beds_per_1000": "WHO GHO",
        "health_expenditure_pct_gdp": "WHO GHO",
        "hdi_value": "UNDP Human Development Reports",
        "expected_years_schooling": "UNDP HDI",
        "mean_years_schooling": "UNDP HDI",
        "gdp_per_capita_ppp": "World Bank WDI",
        "population_total": "World Bank WDI",
        "labor_force_total": "ILOSTAT",
        "labor_force_participation_rate": "ILOSTAT",
        "unemployment_rate": "ILOSTAT",
        "agriculture_pct_gdp": "World Bank WDI",
        "industry_pct_gdp": "World Bank WDI",
        "services_pct_gdp": "World Bank WDI",
        "work_life_balance_score": "OECD Better Life Index",
    },
    "governance_layer": {
        "ilo_c187_status": "ILO NORMLEX Database",
        "ilo_c155_status": "ILO NORMLEX Database",
        "inspector_density": "ILOSTAT Labour Inspection",
        "mental_health_policy": "WHO Mental Health Atlas",
        "strategic_capacity_score": "Calculated from indicators",
    },
    "pillar_1_hazard": {
        "fatal_accident_rate": "ILOSTAT Occupational Injuries",
        "carcinogen_exposure_pct": "IHME GBD Risk Factors",
        "heat_stress_reg_type": "ILO Country Reports",
        "oel_compliance_pct": "Estimated from ILO data",
        "noise_induced_hearing_loss_rate": "IHME GBD",
        "safety_training_hours_avg": "ILO/National Reports",
        "control_maturity_score": "Calculated from indicators",
    },
    "pillar_2_vigilance": {
        "surveillance_logic": "ILO/WHO Country Assessments",
        "disease_detection_rate": "WHO GHO Disease Reporting",
        "vulnerability_index": "Calculated composite index",
        "migrant_worker_pct": "ILOSTAT Migration Statistics",
        "lead_exposure_screening_rate": "WHO/National Health Reports",
        "occupational_disease_reporting_rate": "ILOSTAT/WHO",
    },
    "pillar_3_restoration": {
        "payer_mechanism": "ILO Social Security Reports",
        "reintegration_law": "ILO Legal Database",
        "sickness_absence_days": "ILOSTAT/National Statistics",
        "rehab_access_score": "Calculated from coverage data",
        "return_to_work_success_pct": "ILOSTAT/OECD",
        "avg_claim_settlement_days": "National Insurance Reports",
        "rehab_participation_rate": "OECD/National Reports",
    },
}

# Table descriptions
TABLE_DESCRIPTIONS: Dict[str, str] = {
    "countries": "Core country data including ISO codes, names, flags, and overall framework scores",
    "governance_layer": "Governance and financing indicators including ILO ratification status and inspection capacity",
    "pillar_1_hazard": "Hazard control metrics including accident rates, exposure levels, and safety training",
    "pillar_2_vigilance": "Health surveillance metrics including disease detection and vulnerable worker monitoring",
    "pillar_3_restoration": "Compensation and rehabilitation metrics including RTW rates and benefit adequacy",
    "country_intelligence": "Multi-source aggregated intelligence data from ILOSTAT, World Bank, WHO, IHME, and other sources",
    "country_deep_dives": "AI-generated strategic analysis reports for countries",
    "best_practices": "Global best practice overviews for each strategic question",
    "country_best_practices": "Country-specific best practice implementations",
    "users": "Platform user accounts and authentication",
    "agents": "AI agent configurations and prompts",
    "ai_config": "AI provider settings (OpenAI, Anthropic, etc.)",
    "metric_definitions": "Framework metric definitions, formulas, and thresholds",
    "maturity_scoring_rules": "Rules for calculating maturity scores",
    "cached_pillar_reports": "Cached AI-generated pillar analysis reports",
    "cached_summary_reports": "Cached AI-generated summary reports",
    "ai_call_traces": "Logs of AI API calls for debugging and monitoring",
    "metric_explanations": "AI-generated metric explanations and analysis",
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_table_row_count(db: Session, table_name: str) -> int:
    """Get the row count for a table."""
    try:
        result = db.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
        return result.scalar() or 0
    except Exception as e:
        logger.warning(f"Could not get row count for {table_name}: {e}")
        return 0


def get_table_fields(db: Session, table_name: str) -> List[FieldInfo]:
    """Get field information for a table."""
    inspector = inspect(db.get_bind())
    fields = []
    
    try:
        columns = inspector.get_columns(table_name)
        pk_columns = [c["name"] for c in inspector.get_pk_constraint(table_name).get("constrained_columns", [])]
        fk_info = {fk["constrained_columns"][0]: f"{fk['referred_table']}.{fk['referred_columns'][0]}" 
                   for fk in inspector.get_foreign_keys(table_name) 
                   if fk.get("constrained_columns")}
        
        for col in columns:
            field = FieldInfo(
                name=col["name"],
                type=str(col["type"]),
                nullable=col.get("nullable", True),
                primary_key=col["name"] in pk_columns,
                foreign_key=fk_info.get(col["name"]),
                source=FIELD_SOURCES.get(table_name, {}).get(col["name"]),
                ui_usage=[]
            )
            fields.append(field)
    except Exception as e:
        logger.warning(f"Could not get fields for {table_name}: {e}")
    
    return fields


def get_last_update_timestamp(db: Session, table_name: str) -> Optional[str]:
    """Try to get the last update timestamp for a table."""
    try:
        # Check if table has updated_at column
        result = db.execute(text(f'SELECT MAX(updated_at) FROM "{table_name}"'))
        timestamp = result.scalar()
        if timestamp:
            return timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp)
    except:
        pass
    
    try:
        # Check if table has created_at column
        result = db.execute(text(f'SELECT MAX(created_at) FROM "{table_name}"'))
        timestamp = result.scalar()
        if timestamp:
            return timestamp.isoformat() if hasattr(timestamp, 'isoformat') else str(timestamp)
    except:
        pass
    
    return None


# =============================================================================
# API ENDPOINTS
# =============================================================================

@router.get(
    "",
    response_model=DatabaseOverview,
)
async def get_database_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Get an overview of the entire database structure.
    
    Admin only. Shows all tables, row counts, data sources, and UI usage.
    """
    logger.info(f"Database overview requested by {current_user.email}")
    
    inspector = inspect(db.get_bind())
    table_names = inspector.get_table_names()
    
    tables = []
    total_records = 0
    all_sources = set()
    
    for table_name in sorted(table_names):
        row_count = get_table_row_count(db, table_name)
        total_records += row_count
        
        fields = get_table_fields(db, table_name)
        sources = TABLE_SOURCES.get(table_name, [])
        all_sources.update(sources)
        
        table_info = TableInfo(
            name=table_name,
            row_count=row_count,
            fields=fields,
            description=TABLE_DESCRIPTIONS.get(table_name),
            data_sources=sources,
            last_updated=get_last_update_timestamp(db, table_name),
            ui_pages=TABLE_UI_USAGE.get(table_name, []),
        )
        tables.append(table_info)
    
    # Build data sources summary
    data_sources_summary = {
        "internal": ["Internal Framework", "AI Generated", "Internal"],
        "external": {
            "ILO": ["ILOSTAT", "ILO NORMLEX", "ILO Publications"],
            "World Bank": ["World Bank WDI", "World Bank WGI"],
            "WHO": ["WHO GHO", "WHO Guidelines", "WHO Mental Health Atlas"],
            "IHME": ["IHME GBD"],
            "UNDP": ["UNDP Human Development Reports"],
            "Yale": ["Yale Environmental Performance Index"],
            "Other": ["Transparency International CPI", "World Justice Project", "OECD Better Life Index"],
        },
    }
    
    return DatabaseOverview(
        total_tables=len(tables),
        total_records=total_records,
        tables=tables,
        data_sources=data_sources_summary,
        generated_at=datetime.utcnow().isoformat(),
    )


@router.get(
    "/{table_name}",
    response_model=TableInfo,
)
async def get_table_details(
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Get detailed information about a specific table.
    
    Admin only. Shows all fields, their types, sources, and sample data.
    """
    logger.info(f"Table details requested for {table_name} by {current_user.email}")
    
    inspector = inspect(db.get_bind())
    table_names = inspector.get_table_names()
    
    if table_name not in table_names:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Table '{table_name}' not found"
        )
    
    row_count = get_table_row_count(db, table_name)
    fields = get_table_fields(db, table_name)
    
    return TableInfo(
        name=table_name,
        row_count=row_count,
        fields=fields,
        description=TABLE_DESCRIPTIONS.get(table_name),
        data_sources=TABLE_SOURCES.get(table_name, []),
        last_updated=get_last_update_timestamp(db, table_name),
        ui_pages=TABLE_UI_USAGE.get(table_name, []),
    )
