"""
Migration: Add CountryIntelligence table

Phase 26: Extended Multi-Source Intelligence Integration

Run: python migrations/add_intelligence_table.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine

# SQL for creating the country_intelligence table
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS country_intelligence (
    id VARCHAR(36) PRIMARY KEY,
    country_iso_code VARCHAR(3) NOT NULL UNIQUE REFERENCES countries(iso_code) ON DELETE CASCADE,
    
    -- Governance Intelligence
    corruption_perception_index DOUBLE PRECISION,
    corruption_rank DOUBLE PRECISION,
    rule_of_law_index DOUBLE PRECISION,
    regulatory_enforcement_score DOUBLE PRECISION,
    civil_justice_score DOUBLE PRECISION,
    constraints_on_gov_powers DOUBLE PRECISION,
    open_government_score DOUBLE PRECISION,
    government_effectiveness DOUBLE PRECISION,
    regulatory_quality DOUBLE PRECISION,
    rule_of_law_wb DOUBLE PRECISION,
    control_of_corruption_wb DOUBLE PRECISION,
    political_stability DOUBLE PRECISION,
    voice_accountability DOUBLE PRECISION,
    social_security_coverage_pct DOUBLE PRECISION,
    unemployment_insurance_coverage DOUBLE PRECISION,
    
    -- Hazard Intelligence
    daly_occupational_total DOUBLE PRECISION,
    daly_occupational_injuries DOUBLE PRECISION,
    daly_occupational_carcinogens DOUBLE PRECISION,
    daly_occupational_noise DOUBLE PRECISION,
    daly_occupational_ergonomic DOUBLE PRECISION,
    daly_occupational_particulates DOUBLE PRECISION,
    daly_occupational_asthmagens DOUBLE PRECISION,
    deaths_occupational_total DOUBLE PRECISION,
    deaths_occupational_injuries DOUBLE PRECISION,
    deaths_occupational_diseases DOUBLE PRECISION,
    epi_score DOUBLE PRECISION,
    epi_rank DOUBLE PRECISION,
    epi_air_quality DOUBLE PRECISION,
    epi_pm25_exposure DOUBLE PRECISION,
    epi_heavy_metals DOUBLE PRECISION,
    epi_lead_exposure DOUBLE PRECISION,
    epi_occupational_safety DOUBLE PRECISION,
    epi_sanitation DOUBLE PRECISION,
    non_fatal_injury_rate DOUBLE PRECISION,
    injury_frequency_rate DOUBLE PRECISION,
    days_lost_per_injury DOUBLE PRECISION,
    
    -- Health Vigilance Intelligence
    uhc_service_coverage_index DOUBLE PRECISION,
    health_workforce_density DOUBLE PRECISION,
    hospital_beds_density DOUBLE PRECISION,
    road_traffic_deaths_rate DOUBLE PRECISION,
    life_expectancy_at_birth DOUBLE PRECISION,
    healthy_life_expectancy DOUBLE PRECISION,
    health_expenditure_gdp_pct DOUBLE PRECISION,
    health_expenditure_per_capita DOUBLE PRECISION,
    out_of_pocket_health_pct DOUBLE PRECISION,
    
    -- Restoration Intelligence
    hdi_score DOUBLE PRECISION,
    hdi_rank DOUBLE PRECISION,
    education_index DOUBLE PRECISION,
    expected_years_schooling DOUBLE PRECISION,
    mean_years_schooling DOUBLE PRECISION,
    gni_per_capita DOUBLE PRECISION,
    inequality_adjusted_hdi DOUBLE PRECISION,
    oecd_work_life_balance DOUBLE PRECISION,
    oecd_hours_worked_annual DOUBLE PRECISION,
    oecd_long_hours_pct DOUBLE PRECISION,
    oecd_time_for_leisure DOUBLE PRECISION,
    labor_force_participation DOUBLE PRECISION,
    unemployment_rate DOUBLE PRECISION,
    youth_unemployment_rate DOUBLE PRECISION,
    informal_employment_pct DOUBLE PRECISION,
    
    -- Economic Context
    gdp_per_capita_ppp DOUBLE PRECISION,
    gdp_growth_rate DOUBLE PRECISION,
    industry_pct_gdp DOUBLE PRECISION,
    manufacturing_pct_gdp DOUBLE PRECISION,
    agriculture_pct_gdp DOUBLE PRECISION,
    services_pct_gdp DOUBLE PRECISION,
    population_total DOUBLE PRECISION,
    population_working_age DOUBLE PRECISION,
    urban_population_pct DOUBLE PRECISION,
    median_age DOUBLE PRECISION,
    
    -- Data Sources & Metadata
    data_sources JSONB,
    last_ilostat_update TIMESTAMP,
    last_worldbank_update TIMESTAMP,
    last_who_update TIMESTAMP,
    last_ihme_update TIMESTAMP,
    last_epi_update TIMESTAMP,
    last_cpi_update TIMESTAMP,
    last_wjp_update TIMESTAMP,
    last_undp_update TIMESTAMP,
    last_oecd_update TIMESTAMP,
    
    -- AI Summaries
    ai_deep_summary TEXT,
    ai_risk_assessment TEXT,
    ai_opportunity_areas TEXT,
    
    -- Computed Scores
    governance_intelligence_score DOUBLE PRECISION,
    hazard_intelligence_score DOUBLE PRECISION,
    vigilance_intelligence_score DOUBLE PRECISION,
    restoration_intelligence_score DOUBLE PRECISION,
    overall_intelligence_score DOUBLE PRECISION,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on country_iso_code
CREATE INDEX IF NOT EXISTS idx_country_intelligence_iso ON country_intelligence(country_iso_code);
"""


def run_migration():
    """Execute the migration."""
    print("Running migration: Add CountryIntelligence table...")
    
    with engine.connect() as conn:
        conn.execute(text(CREATE_TABLE_SQL))
        conn.commit()
    
    print("✅ Migration complete: country_intelligence table created")


if __name__ == "__main__":
    run_migration()
