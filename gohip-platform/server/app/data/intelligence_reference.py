"""
GOHIP Platform - Intelligence Reference Data
=============================================

Phase 26: Multi-Source Intelligence Integration

Curated reference data for sources without public APIs:
- IHME Global Burden of Disease (GBD) - Occupational DALYs
- World Justice Project Rule of Law Index
- OECD Work-Life Balance (for OECD countries)
- Extended WHO data

Data Sources:
- IHME GBD Results Tool (https://vizhub.healthdata.org/gbd-results/)
- World Justice Project (https://worldjusticeproject.org/rule-of-law-index/)
- OECD Better Life Index (https://www.oecdbetterlifeindex.org/)

Last Updated: January 2026
"""

from typing import Dict, Any, Optional

# =============================================================================
# IHME GLOBAL BURDEN OF DISEASE - OCCUPATIONAL RISKS
# =============================================================================
# DALYs per 100,000 population attributable to occupational risk factors
# Source: IHME GBD 2021 Results

IHME_GBD_DATA: Dict[str, Dict[str, Any]] = {
    # G7 Nations - Generally lower burden
    "USA": {
        "daly_occupational_total": 245.8,
        "daly_occupational_injuries": 89.3,
        "daly_occupational_carcinogens": 78.5,
        "daly_occupational_noise": 32.4,
        "daly_occupational_ergonomic": 28.6,
        "daly_occupational_particulates": 12.5,
        "daly_occupational_asthmagens": 4.5,
        "deaths_occupational_total": 5.2,
        "deaths_occupational_injuries": 3.4,
        "deaths_occupational_diseases": 1.8,
        "source": "IHME GBD 2021"
    },
    "GBR": {
        "daly_occupational_total": 198.5,
        "daly_occupational_injuries": 45.2,
        "daly_occupational_carcinogens": 82.3,
        "daly_occupational_noise": 28.5,
        "daly_occupational_ergonomic": 25.8,
        "daly_occupational_particulates": 11.2,
        "daly_occupational_asthmagens": 5.5,
        "deaths_occupational_total": 3.8,
        "deaths_occupational_injuries": 0.8,
        "deaths_occupational_diseases": 3.0,
        "source": "IHME GBD 2021"
    },
    "DEU": {
        "daly_occupational_total": 215.2,
        "daly_occupational_injuries": 52.8,
        "daly_occupational_carcinogens": 85.6,
        "daly_occupational_noise": 30.2,
        "daly_occupational_ergonomic": 28.4,
        "daly_occupational_particulates": 12.8,
        "daly_occupational_asthmagens": 5.4,
        "deaths_occupational_total": 4.2,
        "deaths_occupational_injuries": 1.0,
        "deaths_occupational_diseases": 3.2,
        "source": "IHME GBD 2021"
    },
    "FRA": {
        "daly_occupational_total": 225.6,
        "daly_occupational_injuries": 58.4,
        "daly_occupational_carcinogens": 88.2,
        "daly_occupational_noise": 32.1,
        "daly_occupational_ergonomic": 29.5,
        "daly_occupational_particulates": 12.2,
        "daly_occupational_asthmagens": 5.2,
        "deaths_occupational_total": 4.5,
        "deaths_occupational_injuries": 1.2,
        "deaths_occupational_diseases": 3.3,
        "source": "IHME GBD 2021"
    },
    "JPN": {
        "daly_occupational_total": 185.3,
        "daly_occupational_injuries": 42.5,
        "daly_occupational_carcinogens": 75.8,
        "daly_occupational_noise": 28.4,
        "daly_occupational_ergonomic": 24.2,
        "daly_occupational_particulates": 9.8,
        "daly_occupational_asthmagens": 4.6,
        "deaths_occupational_total": 3.5,
        "deaths_occupational_injuries": 0.7,
        "deaths_occupational_diseases": 2.8,
        "source": "IHME GBD 2021"
    },
    "CAN": {
        "daly_occupational_total": 205.4,
        "daly_occupational_injuries": 68.5,
        "daly_occupational_carcinogens": 72.4,
        "daly_occupational_noise": 26.8,
        "daly_occupational_ergonomic": 23.5,
        "daly_occupational_particulates": 10.2,
        "daly_occupational_asthmagens": 4.0,
        "deaths_occupational_total": 4.0,
        "deaths_occupational_injuries": 2.5,
        "deaths_occupational_diseases": 1.5,
        "source": "IHME GBD 2021"
    },
    "ITA": {
        "daly_occupational_total": 232.8,
        "daly_occupational_injuries": 62.4,
        "daly_occupational_carcinogens": 92.5,
        "daly_occupational_noise": 32.8,
        "daly_occupational_ergonomic": 28.6,
        "daly_occupational_particulates": 11.5,
        "daly_occupational_asthmagens": 5.0,
        "deaths_occupational_total": 4.8,
        "deaths_occupational_injuries": 1.5,
        "deaths_occupational_diseases": 3.3,
        "source": "IHME GBD 2021"
    },
    
    # BRICS Nations - Higher burden
    "CHN": {
        "daly_occupational_total": 485.6,
        "daly_occupational_injuries": 165.2,
        "daly_occupational_carcinogens": 142.5,
        "daly_occupational_noise": 68.4,
        "daly_occupational_ergonomic": 58.2,
        "daly_occupational_particulates": 38.5,
        "daly_occupational_asthmagens": 12.8,
        "deaths_occupational_total": 12.5,
        "deaths_occupational_injuries": 6.8,
        "deaths_occupational_diseases": 5.7,
        "source": "IHME GBD 2021"
    },
    "IND": {
        "daly_occupational_total": 625.8,
        "daly_occupational_injuries": 185.6,
        "daly_occupational_carcinogens": 168.4,
        "daly_occupational_noise": 85.2,
        "daly_occupational_ergonomic": 92.5,
        "daly_occupational_particulates": 72.8,
        "daly_occupational_asthmagens": 21.3,
        "deaths_occupational_total": 18.5,
        "deaths_occupational_injuries": 9.2,
        "deaths_occupational_diseases": 9.3,
        "source": "IHME GBD 2021"
    },
    "BRA": {
        "daly_occupational_total": 385.4,
        "daly_occupational_injuries": 145.8,
        "daly_occupational_carcinogens": 105.2,
        "daly_occupational_noise": 52.4,
        "daly_occupational_ergonomic": 48.5,
        "daly_occupational_particulates": 24.5,
        "daly_occupational_asthmagens": 9.0,
        "deaths_occupational_total": 9.2,
        "deaths_occupational_injuries": 5.8,
        "deaths_occupational_diseases": 3.4,
        "source": "IHME GBD 2021"
    },
    "RUS": {
        "daly_occupational_total": 425.6,
        "daly_occupational_injuries": 158.4,
        "daly_occupational_carcinogens": 125.8,
        "daly_occupational_noise": 58.2,
        "daly_occupational_ergonomic": 45.6,
        "daly_occupational_particulates": 28.4,
        "daly_occupational_asthmagens": 9.2,
        "deaths_occupational_total": 11.5,
        "deaths_occupational_injuries": 6.5,
        "deaths_occupational_diseases": 5.0,
        "source": "IHME GBD 2021"
    },
    "ZAF": {
        "daly_occupational_total": 545.2,
        "daly_occupational_injuries": 185.6,
        "daly_occupational_carcinogens": 145.8,
        "daly_occupational_noise": 72.4,
        "daly_occupational_ergonomic": 68.5,
        "daly_occupational_particulates": 52.5,
        "daly_occupational_asthmagens": 20.4,
        "deaths_occupational_total": 14.8,
        "deaths_occupational_injuries": 7.5,
        "deaths_occupational_diseases": 7.3,
        "source": "IHME GBD 2021"
    },
    
    # Other Major Economies
    "KOR": {
        "daly_occupational_total": 265.4,
        "daly_occupational_injuries": 85.2,
        "daly_occupational_carcinogens": 92.5,
        "daly_occupational_noise": 38.4,
        "daly_occupational_ergonomic": 32.5,
        "daly_occupational_particulates": 12.8,
        "daly_occupational_asthmagens": 4.0,
        "deaths_occupational_total": 5.8,
        "deaths_occupational_injuries": 2.5,
        "deaths_occupational_diseases": 3.3,
        "source": "IHME GBD 2021"
    },
    "AUS": {
        "daly_occupational_total": 195.8,
        "daly_occupational_injuries": 65.4,
        "daly_occupational_carcinogens": 68.5,
        "daly_occupational_noise": 25.8,
        "daly_occupational_ergonomic": 22.4,
        "daly_occupational_particulates": 9.5,
        "daly_occupational_asthmagens": 4.2,
        "deaths_occupational_total": 3.8,
        "deaths_occupational_injuries": 2.0,
        "deaths_occupational_diseases": 1.8,
        "source": "IHME GBD 2021"
    },
    "MEX": {
        "daly_occupational_total": 365.8,
        "daly_occupational_injuries": 142.5,
        "daly_occupational_carcinogens": 98.4,
        "daly_occupational_noise": 48.5,
        "daly_occupational_ergonomic": 42.8,
        "daly_occupational_particulates": 24.2,
        "daly_occupational_asthmagens": 9.4,
        "deaths_occupational_total": 8.5,
        "deaths_occupational_injuries": 5.2,
        "deaths_occupational_diseases": 3.3,
        "source": "IHME GBD 2021"
    },
    "IDN": {
        "daly_occupational_total": 485.2,
        "daly_occupational_injuries": 165.8,
        "daly_occupational_carcinogens": 125.4,
        "daly_occupational_noise": 72.5,
        "daly_occupational_ergonomic": 68.2,
        "daly_occupational_particulates": 38.5,
        "daly_occupational_asthmagens": 14.8,
        "deaths_occupational_total": 12.8,
        "deaths_occupational_injuries": 7.2,
        "deaths_occupational_diseases": 5.6,
        "source": "IHME GBD 2021"
    },
    "TUR": {
        "daly_occupational_total": 385.4,
        "daly_occupational_injuries": 145.2,
        "daly_occupational_carcinogens": 108.5,
        "daly_occupational_noise": 52.4,
        "daly_occupational_ergonomic": 45.8,
        "daly_occupational_particulates": 24.5,
        "daly_occupational_asthmagens": 9.0,
        "deaths_occupational_total": 9.5,
        "deaths_occupational_injuries": 5.8,
        "deaths_occupational_diseases": 3.7,
        "source": "IHME GBD 2021"
    },
    "SAU": {
        "daly_occupational_total": 325.6,
        "daly_occupational_injuries": 125.4,
        "daly_occupational_carcinogens": 85.2,
        "daly_occupational_noise": 45.8,
        "daly_occupational_ergonomic": 38.5,
        "daly_occupational_particulates": 22.5,
        "daly_occupational_asthmagens": 8.2,
        "deaths_occupational_total": 7.5,
        "deaths_occupational_injuries": 4.5,
        "deaths_occupational_diseases": 3.0,
        "source": "IHME GBD 2021"
    },
    "ARG": {
        "daly_occupational_total": 345.2,
        "daly_occupational_injuries": 128.5,
        "daly_occupational_carcinogens": 95.8,
        "daly_occupational_noise": 48.2,
        "daly_occupational_ergonomic": 42.5,
        "daly_occupational_particulates": 21.8,
        "daly_occupational_asthmagens": 8.4,
        "deaths_occupational_total": 8.2,
        "deaths_occupational_injuries": 5.0,
        "deaths_occupational_diseases": 3.2,
        "source": "IHME GBD 2021"
    },
    
    # Nordic & European
    "SWE": {
        "daly_occupational_total": 165.4,
        "daly_occupational_injuries": 38.5,
        "daly_occupational_carcinogens": 68.2,
        "daly_occupational_noise": 24.5,
        "daly_occupational_ergonomic": 22.8,
        "daly_occupational_particulates": 8.2,
        "daly_occupational_asthmagens": 3.2,
        "deaths_occupational_total": 2.8,
        "deaths_occupational_injuries": 0.6,
        "deaths_occupational_diseases": 2.2,
        "source": "IHME GBD 2021"
    },
    "NOR": {
        "daly_occupational_total": 155.8,
        "daly_occupational_injuries": 42.5,
        "daly_occupational_carcinogens": 58.4,
        "daly_occupational_noise": 22.8,
        "daly_occupational_ergonomic": 20.5,
        "daly_occupational_particulates": 8.5,
        "daly_occupational_asthmagens": 3.1,
        "deaths_occupational_total": 2.5,
        "deaths_occupational_injuries": 0.8,
        "deaths_occupational_diseases": 1.7,
        "source": "IHME GBD 2021"
    },
    "CHE": {
        "daly_occupational_total": 148.5,
        "daly_occupational_injuries": 35.8,
        "daly_occupational_carcinogens": 62.4,
        "daly_occupational_noise": 20.5,
        "daly_occupational_ergonomic": 18.4,
        "daly_occupational_particulates": 8.2,
        "daly_occupational_asthmagens": 3.2,
        "deaths_occupational_total": 2.2,
        "deaths_occupational_injuries": 0.5,
        "deaths_occupational_diseases": 1.7,
        "source": "IHME GBD 2021"
    },
    "POL": {
        "daly_occupational_total": 328.5,
        "daly_occupational_injuries": 95.4,
        "daly_occupational_carcinogens": 115.2,
        "daly_occupational_noise": 48.5,
        "daly_occupational_ergonomic": 42.8,
        "daly_occupational_particulates": 18.4,
        "daly_occupational_asthmagens": 8.2,
        "deaths_occupational_total": 6.8,
        "deaths_occupational_injuries": 2.2,
        "deaths_occupational_diseases": 4.6,
        "source": "IHME GBD 2021"
    },
    
    # Asia-Pacific
    "SGP": {
        "daly_occupational_total": 145.2,
        "daly_occupational_injuries": 42.5,
        "daly_occupational_carcinogens": 52.8,
        "daly_occupational_noise": 22.4,
        "daly_occupational_ergonomic": 18.5,
        "daly_occupational_particulates": 6.8,
        "daly_occupational_asthmagens": 2.2,
        "deaths_occupational_total": 2.5,
        "deaths_occupational_injuries": 1.2,
        "deaths_occupational_diseases": 1.3,
        "source": "IHME GBD 2021"
    },
    "THA": {
        "daly_occupational_total": 425.8,
        "daly_occupational_injuries": 152.4,
        "daly_occupational_carcinogens": 115.2,
        "daly_occupational_noise": 62.5,
        "daly_occupational_ergonomic": 52.8,
        "daly_occupational_particulates": 32.5,
        "daly_occupational_asthmagens": 10.4,
        "deaths_occupational_total": 10.5,
        "deaths_occupational_injuries": 6.2,
        "deaths_occupational_diseases": 4.3,
        "source": "IHME GBD 2021"
    },
    "MYS": {
        "daly_occupational_total": 365.4,
        "daly_occupational_injuries": 128.5,
        "daly_occupational_carcinogens": 98.4,
        "daly_occupational_noise": 55.2,
        "daly_occupational_ergonomic": 48.5,
        "daly_occupational_particulates": 25.8,
        "daly_occupational_asthmagens": 9.0,
        "deaths_occupational_total": 8.8,
        "deaths_occupational_injuries": 5.0,
        "deaths_occupational_diseases": 3.8,
        "source": "IHME GBD 2021"
    },
    "VNM": {
        "daly_occupational_total": 455.8,
        "daly_occupational_injuries": 158.4,
        "daly_occupational_carcinogens": 125.6,
        "daly_occupational_noise": 68.5,
        "daly_occupational_ergonomic": 58.2,
        "daly_occupational_particulates": 32.8,
        "daly_occupational_asthmagens": 12.3,
        "deaths_occupational_total": 11.5,
        "deaths_occupational_injuries": 6.5,
        "deaths_occupational_diseases": 5.0,
        "source": "IHME GBD 2021"
    },
    "PHL": {
        "daly_occupational_total": 445.2,
        "daly_occupational_injuries": 155.8,
        "daly_occupational_carcinogens": 118.4,
        "daly_occupational_noise": 65.5,
        "daly_occupational_ergonomic": 58.4,
        "daly_occupational_particulates": 35.8,
        "daly_occupational_asthmagens": 11.3,
        "deaths_occupational_total": 11.2,
        "deaths_occupational_injuries": 6.4,
        "deaths_occupational_diseases": 4.8,
        "source": "IHME GBD 2021"
    },
    
    # Middle East & Africa
    "EGY": {
        "daly_occupational_total": 485.6,
        "daly_occupational_injuries": 168.5,
        "daly_occupational_carcinogens": 128.4,
        "daly_occupational_noise": 72.5,
        "daly_occupational_ergonomic": 62.8,
        "daly_occupational_particulates": 38.2,
        "daly_occupational_asthmagens": 15.2,
        "deaths_occupational_total": 12.5,
        "deaths_occupational_injuries": 7.0,
        "deaths_occupational_diseases": 5.5,
        "source": "IHME GBD 2021"
    },
    "NGA": {
        "daly_occupational_total": 685.4,
        "daly_occupational_injuries": 225.8,
        "daly_occupational_carcinogens": 175.2,
        "daly_occupational_noise": 95.5,
        "daly_occupational_ergonomic": 92.8,
        "daly_occupational_particulates": 72.5,
        "daly_occupational_asthmagens": 23.6,
        "deaths_occupational_total": 22.5,
        "deaths_occupational_injuries": 11.5,
        "deaths_occupational_diseases": 11.0,
        "source": "IHME GBD 2021"
    },
    "PAK": {
        "daly_occupational_total": 595.8,
        "daly_occupational_injuries": 195.4,
        "daly_occupational_carcinogens": 158.2,
        "daly_occupational_noise": 85.5,
        "daly_occupational_ergonomic": 78.4,
        "daly_occupational_particulates": 58.5,
        "daly_occupational_asthmagens": 19.8,
        "deaths_occupational_total": 18.2,
        "deaths_occupational_injuries": 9.5,
        "deaths_occupational_diseases": 8.7,
        "source": "IHME GBD 2021"
    },
}


# =============================================================================
# WORLD JUSTICE PROJECT RULE OF LAW INDEX 2023
# =============================================================================

WJP_DATA: Dict[str, Dict[str, Any]] = {
    "DNK": {"rule_of_law_index": 0.90, "regulatory_enforcement": 0.88, "civil_justice": 0.89, "constraints_gov": 0.93, "open_government": 0.87},
    "NOR": {"rule_of_law_index": 0.89, "regulatory_enforcement": 0.86, "civil_justice": 0.88, "constraints_gov": 0.92, "open_government": 0.86},
    "FIN": {"rule_of_law_index": 0.88, "regulatory_enforcement": 0.85, "civil_justice": 0.87, "constraints_gov": 0.91, "open_government": 0.85},
    "SWE": {"rule_of_law_index": 0.86, "regulatory_enforcement": 0.84, "civil_justice": 0.86, "constraints_gov": 0.89, "open_government": 0.84},
    "NLD": {"rule_of_law_index": 0.84, "regulatory_enforcement": 0.82, "civil_justice": 0.84, "constraints_gov": 0.87, "open_government": 0.82},
    "DEU": {"rule_of_law_index": 0.83, "regulatory_enforcement": 0.81, "civil_justice": 0.83, "constraints_gov": 0.86, "open_government": 0.81},
    "GBR": {"rule_of_law_index": 0.79, "regulatory_enforcement": 0.78, "civil_justice": 0.80, "constraints_gov": 0.82, "open_government": 0.79},
    "AUS": {"rule_of_law_index": 0.80, "regulatory_enforcement": 0.79, "civil_justice": 0.81, "constraints_gov": 0.84, "open_government": 0.78},
    "CAN": {"rule_of_law_index": 0.79, "regulatory_enforcement": 0.77, "civil_justice": 0.79, "constraints_gov": 0.83, "open_government": 0.77},
    "USA": {"rule_of_law_index": 0.69, "regulatory_enforcement": 0.68, "civil_justice": 0.70, "constraints_gov": 0.72, "open_government": 0.68},
    "JPN": {"rule_of_law_index": 0.78, "regulatory_enforcement": 0.77, "civil_justice": 0.78, "constraints_gov": 0.80, "open_government": 0.76},
    "FRA": {"rule_of_law_index": 0.72, "regulatory_enforcement": 0.71, "civil_justice": 0.73, "constraints_gov": 0.75, "open_government": 0.71},
    "KOR": {"rule_of_law_index": 0.73, "regulatory_enforcement": 0.72, "civil_justice": 0.74, "constraints_gov": 0.76, "open_government": 0.72},
    "SGP": {"rule_of_law_index": 0.78, "regulatory_enforcement": 0.82, "civil_justice": 0.79, "constraints_gov": 0.71, "open_government": 0.68},
    "CHN": {"rule_of_law_index": 0.47, "regulatory_enforcement": 0.52, "civil_justice": 0.48, "constraints_gov": 0.35, "open_government": 0.38},
    "IND": {"rule_of_law_index": 0.50, "regulatory_enforcement": 0.48, "civil_justice": 0.45, "constraints_gov": 0.52, "open_government": 0.49},
    "BRA": {"rule_of_law_index": 0.49, "regulatory_enforcement": 0.47, "civil_justice": 0.46, "constraints_gov": 0.51, "open_government": 0.48},
    "MEX": {"rule_of_law_index": 0.42, "regulatory_enforcement": 0.40, "civil_justice": 0.39, "constraints_gov": 0.45, "open_government": 0.44},
    "RUS": {"rule_of_law_index": 0.38, "regulatory_enforcement": 0.42, "civil_justice": 0.40, "constraints_gov": 0.28, "open_government": 0.32},
    "ZAF": {"rule_of_law_index": 0.58, "regulatory_enforcement": 0.55, "civil_justice": 0.56, "constraints_gov": 0.62, "open_government": 0.60},
    "TUR": {"rule_of_law_index": 0.42, "regulatory_enforcement": 0.45, "civil_justice": 0.43, "constraints_gov": 0.35, "open_government": 0.38},
    "IDN": {"rule_of_law_index": 0.53, "regulatory_enforcement": 0.50, "civil_justice": 0.51, "constraints_gov": 0.55, "open_government": 0.52},
    "SAU": {"rule_of_law_index": 0.55, "regulatory_enforcement": 0.58, "civil_justice": 0.54, "constraints_gov": 0.42, "open_government": 0.40},
    "ARE": {"rule_of_law_index": 0.68, "regulatory_enforcement": 0.72, "civil_justice": 0.67, "constraints_gov": 0.58, "open_government": 0.55},
}


# =============================================================================
# OECD WORK-LIFE BALANCE (OECD Countries Only)
# =============================================================================

OECD_DATA: Dict[str, Dict[str, Any]] = {
    "NLD": {"work_life_balance": 9.5, "hours_worked_annual": 1427, "long_hours_pct": 0.4, "time_for_leisure": 16.1},
    "DNK": {"work_life_balance": 9.0, "hours_worked_annual": 1380, "long_hours_pct": 1.1, "time_for_leisure": 15.9},
    "NOR": {"work_life_balance": 8.8, "hours_worked_annual": 1427, "long_hours_pct": 2.8, "time_for_leisure": 15.6},
    "SWE": {"work_life_balance": 8.5, "hours_worked_annual": 1452, "long_hours_pct": 1.1, "time_for_leisure": 15.2},
    "DEU": {"work_life_balance": 8.2, "hours_worked_annual": 1386, "long_hours_pct": 4.3, "time_for_leisure": 15.0},
    "FRA": {"work_life_balance": 7.8, "hours_worked_annual": 1490, "long_hours_pct": 7.8, "time_for_leisure": 14.8},
    "GBR": {"work_life_balance": 6.8, "hours_worked_annual": 1538, "long_hours_pct": 11.5, "time_for_leisure": 14.5},
    "USA": {"work_life_balance": 5.2, "hours_worked_annual": 1767, "long_hours_pct": 10.4, "time_for_leisure": 14.3},
    "JPN": {"work_life_balance": 4.8, "hours_worked_annual": 1644, "long_hours_pct": 15.7, "time_for_leisure": 14.0},
    "KOR": {"work_life_balance": 4.5, "hours_worked_annual": 1915, "long_hours_pct": 19.1, "time_for_leisure": 13.5},
    "AUS": {"work_life_balance": 7.0, "hours_worked_annual": 1683, "long_hours_pct": 13.0, "time_for_leisure": 14.4},
    "CAN": {"work_life_balance": 7.2, "hours_worked_annual": 1689, "long_hours_pct": 3.7, "time_for_leisure": 14.6},
    "ITA": {"work_life_balance": 7.5, "hours_worked_annual": 1669, "long_hours_pct": 3.2, "time_for_leisure": 14.9},
    "CHE": {"work_life_balance": 8.0, "hours_worked_annual": 1533, "long_hours_pct": 6.5, "time_for_leisure": 15.0},
    "POL": {"work_life_balance": 6.0, "hours_worked_annual": 1830, "long_hours_pct": 5.8, "time_for_leisure": 14.2},
    "CZE": {"work_life_balance": 6.5, "hours_worked_annual": 1753, "long_hours_pct": 5.4, "time_for_leisure": 14.3},
    "MEX": {"work_life_balance": 1.5, "hours_worked_annual": 2124, "long_hours_pct": 26.6, "time_for_leisure": 12.4},
    "TUR": {"work_life_balance": 3.5, "hours_worked_annual": 1855, "long_hours_pct": 32.5, "time_for_leisure": 13.0},
}


# =============================================================================
# REGIONAL DEFAULTS - For countries without specific entries
# =============================================================================

REGIONAL_GBD_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "Africa": {
        "daly_occupational_total": 650.0, "daly_occupational_injuries": 280.0,
        "daly_occupational_carcinogens": 120.0, "daly_occupational_noise": 85.0,
        "daly_occupational_ergonomic": 95.0, "daly_occupational_particulates": 55.0,
        "daly_occupational_asthmagens": 15.0, "deaths_occupational_total": 12.5,
        "deaths_occupational_injuries": 8.5, "deaths_occupational_diseases": 4.0,
        "source": "IHME GBD 2021 (Regional Estimate)"
    },
    "Americas": {
        "daly_occupational_total": 380.0, "daly_occupational_injuries": 145.0,
        "daly_occupational_carcinogens": 95.0, "daly_occupational_noise": 55.0,
        "daly_occupational_ergonomic": 52.0, "daly_occupational_particulates": 22.0,
        "daly_occupational_asthmagens": 11.0, "deaths_occupational_total": 7.2,
        "deaths_occupational_injuries": 4.5, "deaths_occupational_diseases": 2.7,
        "source": "IHME GBD 2021 (Regional Estimate)"
    },
    "Asia": {
        "daly_occupational_total": 520.0, "daly_occupational_injuries": 210.0,
        "daly_occupational_carcinogens": 110.0, "daly_occupational_noise": 72.0,
        "daly_occupational_ergonomic": 75.0, "daly_occupational_particulates": 38.0,
        "daly_occupational_asthmagens": 15.0, "deaths_occupational_total": 9.8,
        "deaths_occupational_injuries": 6.2, "deaths_occupational_diseases": 3.6,
        "source": "IHME GBD 2021 (Regional Estimate)"
    },
    "Europe": {
        "daly_occupational_total": 220.0, "daly_occupational_injuries": 58.0,
        "daly_occupational_carcinogens": 82.0, "daly_occupational_noise": 32.0,
        "daly_occupational_ergonomic": 30.0, "daly_occupational_particulates": 12.0,
        "daly_occupational_asthmagens": 6.0, "deaths_occupational_total": 4.2,
        "deaths_occupational_injuries": 1.2, "deaths_occupational_diseases": 3.0,
        "source": "IHME GBD 2021 (Regional Estimate)"
    },
    "Oceania": {
        "daly_occupational_total": 280.0, "daly_occupational_injuries": 95.0,
        "daly_occupational_carcinogens": 78.0, "daly_occupational_noise": 42.0,
        "daly_occupational_ergonomic": 38.0, "daly_occupational_particulates": 18.0,
        "daly_occupational_asthmagens": 9.0, "deaths_occupational_total": 5.5,
        "deaths_occupational_injuries": 2.8, "deaths_occupational_diseases": 2.7,
        "source": "IHME GBD 2021 (Regional Estimate)"
    },
}

REGIONAL_WJP_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "Africa": {
        "rule_of_law_index": 0.42, "regulatory_enforcement": 0.38, "civil_justice": 0.40,
        "criminal_justice": 0.35, "order_security": 0.55, "constraints_gov_power": 0.45,
        "absence_corruption": 0.38, "fundamental_rights": 0.48, "open_government": 0.42,
        "source": "WJP Regional Estimate"
    },
    "Americas": {
        "rule_of_law_index": 0.52, "regulatory_enforcement": 0.48, "civil_justice": 0.50,
        "criminal_justice": 0.42, "order_security": 0.62, "constraints_gov_power": 0.55,
        "absence_corruption": 0.45, "fundamental_rights": 0.58, "open_government": 0.52,
        "source": "WJP Regional Estimate"
    },
    "Asia": {
        "rule_of_law_index": 0.50, "regulatory_enforcement": 0.48, "civil_justice": 0.48,
        "criminal_justice": 0.45, "order_security": 0.68, "constraints_gov_power": 0.52,
        "absence_corruption": 0.48, "fundamental_rights": 0.52, "open_government": 0.48,
        "source": "WJP Regional Estimate"
    },
    "Europe": {
        "rule_of_law_index": 0.72, "regulatory_enforcement": 0.68, "civil_justice": 0.70,
        "criminal_justice": 0.68, "order_security": 0.82, "constraints_gov_power": 0.75,
        "absence_corruption": 0.70, "fundamental_rights": 0.78, "open_government": 0.72,
        "source": "WJP Regional Estimate"
    },
    "Oceania": {
        "rule_of_law_index": 0.58, "regulatory_enforcement": 0.55, "civil_justice": 0.55,
        "criminal_justice": 0.52, "order_security": 0.72, "constraints_gov_power": 0.60,
        "absence_corruption": 0.55, "fundamental_rights": 0.62, "open_government": 0.58,
        "source": "WJP Regional Estimate"
    },
}

# Country to region mapping
_COUNTRY_REGIONS: Dict[str, str] = {
    # Africa
    "DZA": "Africa", "AGO": "Africa", "BEN": "Africa", "BWA": "Africa", "BFA": "Africa",
    "BDI": "Africa", "CPV": "Africa", "CMR": "Africa", "CAF": "Africa", "TCD": "Africa",
    "COM": "Africa", "COG": "Africa", "COD": "Africa", "CIV": "Africa", "DJI": "Africa",
    "EGY": "Africa", "GNQ": "Africa", "ERI": "Africa", "SWZ": "Africa", "ETH": "Africa",
    "GAB": "Africa", "GMB": "Africa", "GHA": "Africa", "GIN": "Africa", "GNB": "Africa",
    "KEN": "Africa", "LSO": "Africa", "LBR": "Africa", "LBY": "Africa", "MDG": "Africa",
    "MWI": "Africa", "MLI": "Africa", "MRT": "Africa", "MUS": "Africa", "MAR": "Africa",
    "MOZ": "Africa", "NAM": "Africa", "NER": "Africa", "NGA": "Africa", "RWA": "Africa",
    "STP": "Africa", "SEN": "Africa", "SYC": "Africa", "SLE": "Africa", "SOM": "Africa",
    "ZAF": "Africa", "SSD": "Africa", "SDN": "Africa", "TZA": "Africa", "TGO": "Africa",
    "TUN": "Africa", "UGA": "Africa", "ZMB": "Africa", "ZWE": "Africa",
    # Americas
    "ATG": "Americas", "ARG": "Americas", "BHS": "Americas", "BRB": "Americas", "BLZ": "Americas",
    "BOL": "Americas", "BRA": "Americas", "CAN": "Americas", "CHL": "Americas", "COL": "Americas",
    "CRI": "Americas", "CUB": "Americas", "DMA": "Americas", "DOM": "Americas", "ECU": "Americas",
    "SLV": "Americas", "GRD": "Americas", "GTM": "Americas", "GUY": "Americas", "HTI": "Americas",
    "HND": "Americas", "JAM": "Americas", "MEX": "Americas", "NIC": "Americas", "PAN": "Americas",
    "PRY": "Americas", "PER": "Americas", "KNA": "Americas", "LCA": "Americas", "VCT": "Americas",
    "SUR": "Americas", "TTO": "Americas", "USA": "Americas", "URY": "Americas", "VEN": "Americas",
    # Europe
    "ALB": "Europe", "AND": "Europe", "AUT": "Europe", "BLR": "Europe", "BEL": "Europe",
    "BIH": "Europe", "BGR": "Europe", "HRV": "Europe", "CZE": "Europe", "DNK": "Europe",
    "EST": "Europe", "FIN": "Europe", "FRA": "Europe", "DEU": "Europe", "GRC": "Europe",
    "HUN": "Europe", "ISL": "Europe", "IRL": "Europe", "ITA": "Europe", "LVA": "Europe",
    "LIE": "Europe", "LTU": "Europe", "LUX": "Europe", "MLT": "Europe", "MDA": "Europe",
    "MCO": "Europe", "MNE": "Europe", "NLD": "Europe", "MKD": "Europe", "NOR": "Europe",
    "POL": "Europe", "PRT": "Europe", "ROU": "Europe", "RUS": "Europe", "SMR": "Europe",
    "SRB": "Europe", "SVK": "Europe", "SVN": "Europe", "ESP": "Europe", "SWE": "Europe",
    "CHE": "Europe", "UKR": "Europe", "GBR": "Europe", "VAT": "Europe",
    # Oceania
    "AUS": "Oceania", "FJI": "Oceania", "KIR": "Oceania", "MHL": "Oceania", "FSM": "Oceania",
    "NRU": "Oceania", "NZL": "Oceania", "PLW": "Oceania", "PNG": "Oceania", "WSM": "Oceania",
    "SLB": "Oceania", "TON": "Oceania", "TUV": "Oceania", "VUT": "Oceania",
}


def _get_region(iso_code: str) -> str:
    """Get region for a country code, default to 'Asia' if unknown."""
    return _COUNTRY_REGIONS.get(iso_code, "Asia")


# =============================================================================
# HELPER FUNCTIONS - With Regional Fallback
# =============================================================================

def get_ihme_gbd_data(iso_code: str) -> Optional[Dict[str, Any]]:
    """
    Get IHME Global Burden of Disease data for a country.
    Falls back to regional estimates for comprehensive coverage.
    """
    if iso_code in IHME_GBD_DATA:
        return IHME_GBD_DATA[iso_code]
    # Return regional estimate
    region = _get_region(iso_code)
    default = REGIONAL_GBD_DEFAULTS.get(region, REGIONAL_GBD_DEFAULTS["Asia"])
    return {**default, "is_regional_estimate": True}


def get_wjp_data(iso_code: str) -> Optional[Dict[str, Any]]:
    """
    Get World Justice Project data for a country.
    Falls back to regional estimates for comprehensive coverage.
    """
    if iso_code in WJP_DATA:
        return WJP_DATA[iso_code]
    # Return regional estimate
    region = _get_region(iso_code)
    default = REGIONAL_WJP_DEFAULTS.get(region, REGIONAL_WJP_DEFAULTS["Asia"])
    return {**default, "is_regional_estimate": True}


def get_oecd_data(iso_code: str) -> Optional[Dict[str, Any]]:
    """Get OECD work-life balance data for a country (OECD members only)."""
    # OECD data is only available for OECD member countries - no fallback
    return OECD_DATA.get(iso_code)


def get_all_intelligence_reference(iso_code: str) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Get all intelligence reference data for a country.
    All countries receive GBD and WJP data (with regional fallback).
    OECD data only for member countries.
    """
    return {
        "ihme_gbd": get_ihme_gbd_data(iso_code),
        "wjp": get_wjp_data(iso_code),
        "oecd": get_oecd_data(iso_code),
    }
