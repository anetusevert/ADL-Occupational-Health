"""
GOHIP Platform - Intelligence Data Client
==========================================

Phase 26: Multi-Source Intelligence Integration

Aggregates data from multiple sources for deep country intelligence:
- UNDP Human Development Index
- Transparency International CPI
- World Justice Project Rule of Law
- Our World in Data (aggregated sources)
- Extended World Bank indicators
- Yale EPI (via static data - no public API)
- IHME GBD (via Our World in Data aggregations)

Note: Some sources don't have public APIs, so we use:
1. Direct API calls where available
2. Our World in Data as an aggregator
3. Curated reference data for sources without APIs
"""

import logging
import time
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)

# Rate limiting - reduced for faster processing
RATE_LIMIT_DELAY = 0.05  # 50ms between calls

# Complete ISO3 to ISO2 mapping for all 195 countries
ISO3_TO_ISO2_WB: Dict[str, str] = {
    # Africa
    "DZA": "DZ", "AGO": "AO", "BEN": "BJ", "BWA": "BW", "BFA": "BF", "BDI": "BI",
    "CPV": "CV", "CMR": "CM", "CAF": "CF", "TCD": "TD", "COM": "KM", "COG": "CG",
    "COD": "CD", "CIV": "CI", "DJI": "DJ", "EGY": "EG", "GNQ": "GQ", "ERI": "ER",
    "SWZ": "SZ", "ETH": "ET", "GAB": "GA", "GMB": "GM", "GHA": "GH", "GIN": "GN",
    "GNB": "GW", "KEN": "KE", "LSO": "LS", "LBR": "LR", "LBY": "LY", "MDG": "MG",
    "MWI": "MW", "MLI": "ML", "MRT": "MR", "MUS": "MU", "MAR": "MA", "MOZ": "MZ",
    "NAM": "NA", "NER": "NE", "NGA": "NG", "RWA": "RW", "STP": "ST", "SEN": "SN",
    "SYC": "SC", "SLE": "SL", "SOM": "SO", "ZAF": "ZA", "SSD": "SS", "SDN": "SD",
    "TZA": "TZ", "TGO": "TG", "TUN": "TN", "UGA": "UG", "ZMB": "ZM", "ZWE": "ZW",
    # Americas
    "ATG": "AG", "ARG": "AR", "BHS": "BS", "BRB": "BB", "BLZ": "BZ", "BOL": "BO",
    "BRA": "BR", "CAN": "CA", "CHL": "CL", "COL": "CO", "CRI": "CR", "CUB": "CU",
    "DMA": "DM", "DOM": "DO", "ECU": "EC", "SLV": "SV", "GRD": "GD", "GTM": "GT",
    "GUY": "GY", "HTI": "HT", "HND": "HN", "JAM": "JM", "MEX": "MX", "NIC": "NI",
    "PAN": "PA", "PRY": "PY", "PER": "PE", "KNA": "KN", "LCA": "LC", "VCT": "VC",
    "SUR": "SR", "TTO": "TT", "USA": "US", "URY": "UY", "VEN": "VE",
    # Asia
    "AFG": "AF", "ARM": "AM", "AZE": "AZ", "BHR": "BH", "BGD": "BD", "BTN": "BT",
    "BRN": "BN", "KHM": "KH", "CHN": "CN", "CYP": "CY", "GEO": "GE", "IND": "IN",
    "IDN": "ID", "IRN": "IR", "IRQ": "IQ", "ISR": "IL", "JPN": "JP", "JOR": "JO",
    "KAZ": "KZ", "KWT": "KW", "KGZ": "KG", "LAO": "LA", "LBN": "LB", "MYS": "MY",
    "MDV": "MV", "MNG": "MN", "MMR": "MM", "NPL": "NP", "PRK": "KP", "OMN": "OM",
    "PAK": "PK", "PHL": "PH", "QAT": "QA", "SAU": "SA", "SGP": "SG", "KOR": "KR",
    "LKA": "LK", "SYR": "SY", "TJK": "TJ", "THA": "TH", "TLS": "TL", "TKM": "TM",
    "ARE": "AE", "UZB": "UZ", "VNM": "VN", "YEM": "YE", "PSE": "PS", "TWN": "TW",
    # Europe
    "ALB": "AL", "AND": "AD", "AUT": "AT", "BLR": "BY", "BEL": "BE", "BIH": "BA",
    "BGR": "BG", "HRV": "HR", "CZE": "CZ", "DNK": "DK", "EST": "EE", "FIN": "FI",
    "FRA": "FR", "DEU": "DE", "GRC": "GR", "HUN": "HU", "ISL": "IS", "IRL": "IE",
    "ITA": "IT", "LVA": "LV", "LIE": "LI", "LTU": "LT", "LUX": "LU", "MLT": "MT",
    "MDA": "MD", "MCO": "MC", "MNE": "ME", "NLD": "NL", "MKD": "MK", "NOR": "NO",
    "POL": "PL", "PRT": "PT", "ROU": "RO", "RUS": "RU", "SMR": "SM", "SRB": "RS",
    "SVK": "SK", "SVN": "SI", "ESP": "ES", "SWE": "SE", "CHE": "CH", "UKR": "UA",
    "GBR": "GB", "VAT": "VA",
    # Oceania
    "AUS": "AU", "FJI": "FJ", "KIR": "KI", "MHL": "MH", "FSM": "FM", "NRU": "NR",
    "NZL": "NZ", "PLW": "PW", "PNG": "PG", "WSM": "WS", "SLB": "SB", "TON": "TO",
    "TUV": "TV", "VUT": "VU",
}


class IntelligenceClient:
    """
    Unified client for fetching intelligence data from multiple sources.
    
    Provides normalized data access across:
    - UNDP Human Development Reports
    - World Bank Extended Indicators
    - Our World in Data (OWID) aggregations
    
    Optimized for batch processing with minimal rate limiting.
    """
    
    def __init__(self):
        self.base_urls = {
            "owid": "https://raw.githubusercontent.com/owid/owid-datasets/master/datasets",
            "worldbank": "https://api.worldbank.org/v2",
            "undp": "https://hdr.undp.org/data-center/specific-country-data",
        }
        self.timeout = 15.0  # Reduced timeout for faster failure
        self.headers = {
            "User-Agent": "GOHIP-Platform/1.0 (Occupational Health Intelligence)",
            "Accept": "application/json",
        }
    
    # =========================================================================
    # WORLD BANK EXTENDED INDICATORS
    # =========================================================================
    
    def fetch_wb_indicator_sync(self, iso_code: str, indicator: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a World Bank indicator for a country.
        
        Args:
            iso_code: ISO Alpha-3 country code
            indicator: World Bank indicator code (e.g., 'NY.GDP.PCAP.PP.CD')
            
        Returns:
            Dict with value and metadata, or None if not available
        """
        # Convert ISO Alpha-3 to Alpha-2 for World Bank API
        iso2 = ISO3_TO_ISO2_WB.get(iso_code, iso_code[:2])
        
        url = f"{self.base_urls['worldbank']}/country/{iso2}/indicator/{indicator}?format=json&date=2018:2023&per_page=10"
        
        try:
            with httpx.Client(timeout=self.timeout, headers=self.headers) as client:
                response = client.get(url)
                
                if response.status_code != 200:
                    return None
                
                data = response.json()
                
                if not data or len(data) < 2 or not data[1]:
                    return None
                
                # Get most recent non-null value
                for entry in data[1]:
                    if entry.get("value") is not None:
                        return {
                            "value": entry["value"],
                            "year": entry.get("date"),
                            "indicator": indicator,
                            "source": f"https://data.worldbank.org/indicator/{indicator}"
                        }
                
                return None
                
        except Exception as e:
            logger.debug(f"WB indicator {indicator} for {iso_code}: {e}")
            return None
    
    def fetch_governance_indicators(self, iso_code: str, skip_api: bool = False) -> Dict[str, Any]:
        """
        Fetch World Bank Worldwide Governance Indicators.
        
        Args:
            iso_code: ISO Alpha-3 country code
            skip_api: If True, skip API calls (for faster processing)
        
        Returns dict with governance indicators.
        """
        if skip_api:
            return {}
            
        indicators = {
            "government_effectiveness": "GE.EST",
            "regulatory_quality": "RQ.EST",
            "rule_of_law_wb": "RL.EST",
            "control_of_corruption_wb": "CC.EST",
            "political_stability": "PV.EST",
            "voice_accountability": "VA.EST",
        }
        
        results = {}
        for field, indicator in indicators.items():
            time.sleep(RATE_LIMIT_DELAY)
            data = self.fetch_wb_indicator_sync(iso_code, indicator)
            if data:
                results[field] = data["value"]
        
        return results
    
    def fetch_economic_indicators(self, iso_code: str, skip_api: bool = False) -> Dict[str, Any]:
        """
        Fetch World Bank economic indicators.
        
        Args:
            iso_code: ISO Alpha-3 country code
            skip_api: If True, skip API calls (for faster processing)
        """
        if skip_api:
            return {}
            
        indicators = {
            "gdp_per_capita_ppp": "NY.GDP.PCAP.PP.CD",
            "gdp_growth_rate": "NY.GDP.MKTP.KD.ZG",
            "industry_pct_gdp": "NV.IND.TOTL.ZS",
            "manufacturing_pct_gdp": "NV.IND.MANF.ZS",
            "services_pct_gdp": "NV.SRV.TOTL.ZS",
            "agriculture_pct_gdp": "NV.AGR.TOTL.ZS",
        }
        
        results = {}
        for field, indicator in indicators.items():
            time.sleep(RATE_LIMIT_DELAY)
            data = self.fetch_wb_indicator_sync(iso_code, indicator)
            if data:
                results[field] = data["value"]
        
        return results
    
    def fetch_labor_indicators(self, iso_code: str, skip_api: bool = False) -> Dict[str, Any]:
        """
        Fetch World Bank labor market indicators.
        
        Args:
            iso_code: ISO Alpha-3 country code
            skip_api: If True, skip API calls (for faster processing)
        """
        if skip_api:
            return {}
            
        indicators = {
            "labor_force_participation": "SL.TLF.CACT.ZS",
            "unemployment_rate": "SL.UEM.TOTL.ZS",
            "youth_unemployment_rate": "SL.UEM.1524.ZS",
            "informal_employment_pct": "SL.ISV.IFRM.ZS",
        }
        
        results = {}
        for field, indicator in indicators.items():
            time.sleep(RATE_LIMIT_DELAY)
            data = self.fetch_wb_indicator_sync(iso_code, indicator)
            if data:
                results[field] = data["value"]
        
        return results
    
    def fetch_health_indicators(self, iso_code: str, skip_api: bool = False) -> Dict[str, Any]:
        """
        Fetch World Bank health indicators.
        
        Args:
            iso_code: ISO Alpha-3 country code
            skip_api: If True, skip API calls (for faster processing)
        """
        if skip_api:
            return {}
            
        indicators = {
            "health_expenditure_gdp_pct": "SH.XPD.CHEX.GD.ZS",
            "health_expenditure_per_capita": "SH.XPD.CHEX.PC.CD",
            "out_of_pocket_health_pct": "SH.XPD.OOPC.CH.ZS",
            "life_expectancy_at_birth": "SP.DYN.LE00.IN",
        }
        
        results = {}
        for field, indicator in indicators.items():
            time.sleep(RATE_LIMIT_DELAY)
            data = self.fetch_wb_indicator_sync(iso_code, indicator)
            if data:
                results[field] = data["value"]
        
        return results
    
    def fetch_population_indicators(self, iso_code: str, skip_api: bool = False) -> Dict[str, Any]:
        """
        Fetch World Bank population indicators.
        
        Args:
            iso_code: ISO Alpha-3 country code
            skip_api: If True, skip API calls (for faster processing)
        """
        if skip_api:
            return {}
            
        indicators = {
            "population_total": "SP.POP.TOTL",
            "urban_population_pct": "SP.URB.TOTL.IN.ZS",
        }
        
        results = {}
        for field, indicator in indicators.items():
            time.sleep(RATE_LIMIT_DELAY)
            data = self.fetch_wb_indicator_sync(iso_code, indicator)
            if data:
                results[field] = data["value"]
        
        return results
    
    # =========================================================================
    # AGGREGATED FETCH
    # =========================================================================
    
    def fetch_all_intelligence(self, iso_code: str, fast_mode: bool = True) -> Dict[str, Any]:
        """
        Fetch all available intelligence data for a country.
        
        Args:
            iso_code: ISO Alpha-3 country code
            fast_mode: If True, skip slow World Bank API calls (default True for 195 countries)
        
        Returns comprehensive dict with data from all World Bank indicators.
        """
        results = {
            "iso_code": iso_code,
            "sources_used": [],
        }
        
        if fast_mode:
            # In fast mode, skip World Bank API calls entirely
            # The pipeline will use reference data instead
            logger.debug(f"Fast mode: Skipping WB API for {iso_code}")
            return results
        
        logger.info(f"Fetching WB intelligence data for {iso_code}...")
        
        # Governance indicators
        gov_data = self.fetch_governance_indicators(iso_code)
        if gov_data:
            results.update(gov_data)
            results["sources_used"].append("WB_GOVERNANCE")
        
        # Economic indicators
        econ_data = self.fetch_economic_indicators(iso_code)
        if econ_data:
            results.update(econ_data)
            results["sources_used"].append("WB_ECONOMIC")
        
        # Labor indicators
        labor_data = self.fetch_labor_indicators(iso_code)
        if labor_data:
            results.update(labor_data)
            results["sources_used"].append("WB_LABOR")
        
        # Health indicators
        health_data = self.fetch_health_indicators(iso_code)
        if health_data:
            results.update(health_data)
            results["sources_used"].append("WB_HEALTH")
        
        # Population indicators
        pop_data = self.fetch_population_indicators(iso_code)
        if pop_data:
            results.update(pop_data)
            results["sources_used"].append("WB_POPULATION")
        
        return results


# Curated reference data for sources without public APIs
# These are updated periodically from official publications
# Extended for all 195 countries where data is available

# Transparency International CPI 2023 (180 countries)
CPI_DATA = {
    # Top performers (70+)
    "DNK": {"score": 90, "rank": 1}, "FIN": {"score": 87, "rank": 2}, "NZL": {"score": 85, "rank": 3},
    "NOR": {"score": 84, "rank": 4}, "SGP": {"score": 83, "rank": 5}, "SWE": {"score": 82, "rank": 6},
    "CHE": {"score": 82, "rank": 7}, "NLD": {"score": 79, "rank": 8}, "DEU": {"score": 78, "rank": 9},
    "LUX": {"score": 78, "rank": 10}, "IRL": {"score": 77, "rank": 11}, "EST": {"score": 76, "rank": 12},
    "AUS": {"score": 75, "rank": 14}, "CAN": {"score": 74, "rank": 15}, "GBR": {"score": 71, "rank": 20},
    "JPN": {"score": 73, "rank": 16}, "BEL": {"score": 73, "rank": 17}, "AUT": {"score": 71, "rank": 20},
    "FRA": {"score": 71, "rank": 21}, "USA": {"score": 69, "rank": 24}, "ARE": {"score": 68, "rank": 26},
    # Medium-high (50-69)
    "CHL": {"score": 66, "rank": 29}, "ISR": {"score": 62, "rank": 35}, "KOR": {"score": 63, "rank": 32},
    "PRT": {"score": 61, "rank": 36}, "QAT": {"score": 58, "rank": 40}, "CZE": {"score": 57, "rank": 42},
    "LTU": {"score": 56, "rank": 44}, "ITA": {"score": 56, "rank": 44}, "POL": {"score": 54, "rank": 47},
    "LVA": {"score": 53, "rank": 49}, "SAU": {"score": 52, "rank": 52}, "MYS": {"score": 50, "rank": 57},
    # Medium (35-49)
    "ROU": {"score": 46, "rank": 63}, "KWT": {"score": 46, "rank": 63}, "HRV": {"score": 44, "rank": 70},
    "CHN": {"score": 42, "rank": 76}, "VNM": {"score": 41, "rank": 83}, "ZAF": {"score": 41, "rank": 83},
    "IND": {"score": 39, "rank": 93}, "KAZ": {"score": 39, "rank": 93}, "MAR": {"score": 38, "rank": 97},
    "ARG": {"score": 37, "rank": 98}, "BRA": {"score": 36, "rank": 104}, "PER": {"score": 36, "rank": 104},
    "THA": {"score": 35, "rank": 108}, "EGY": {"score": 35, "rank": 108},
    # Medium-low (25-34)
    "TUR": {"score": 34, "rank": 115}, "IDN": {"score": 34, "rank": 115}, "PHL": {"score": 34, "rank": 115},
    "DZA": {"score": 33, "rank": 118}, "AGO": {"score": 33, "rank": 121}, "MEX": {"score": 31, "rank": 126},
    "ECU": {"score": 30, "rank": 128}, "PAK": {"score": 29, "rank": 133}, "NPL": {"score": 28, "rank": 135},
    "RUS": {"score": 26, "rank": 141}, "NGA": {"score": 25, "rank": 145}, "BGD": {"score": 24, "rank": 149},
    "IRN": {"score": 24, "rank": 149}, "IRQ": {"score": 23, "rank": 154}, "VEN": {"score": 14, "rank": 177},
    # Additional countries
    "ESP": {"score": 60, "rank": 35}, "GRC": {"score": 49, "rank": 60}, "BGR": {"score": 43, "rank": 75},
    "SRB": {"score": 36, "rank": 101}, "COL": {"score": 39, "rank": 91}, "UKR": {"score": 33, "rank": 116},
    "BLR": {"score": 39, "rank": 91}, "GEO": {"score": 53, "rank": 49}, "ARM": {"score": 46, "rank": 63},
    "AZE": {"score": 23, "rank": 154}, "UZB": {"score": 31, "rank": 126}, "TKM": {"score": 18, "rank": 171},
    "KGZ": {"score": 26, "rank": 140}, "TJK": {"score": 20, "rank": 164}, "MNG": {"score": 33, "rank": 116},
    "MDA": {"score": 42, "rank": 76}, "ALB": {"score": 35, "rank": 108}, "MNE": {"score": 45, "rank": 67},
    "MKD": {"score": 40, "rank": 87}, "BIH": {"score": 34, "rank": 110}, "SVK": {"score": 54, "rank": 47},
    "SVN": {"score": 56, "rank": 43}, "HUN": {"score": 42, "rank": 76}, "CYP": {"score": 52, "rank": 52},
    "MLT": {"score": 51, "rank": 55}, "ISL": {"score": 83, "rank": 5}, "LBN": {"score": 24, "rank": 149},
    "JOR": {"score": 46, "rank": 63}, "OMN": {"score": 52, "rank": 52}, "BHR": {"score": 42, "rank": 76},
    "LKA": {"score": 34, "rank": 115}, "MMR": {"score": 23, "rank": 154}, "KHM": {"score": 22, "rank": 157},
    "LAO": {"score": 28, "rank": 136}, "GHA": {"score": 43, "rank": 72}, "KEN": {"score": 31, "rank": 126},
    "TZA": {"score": 38, "rank": 97}, "UGA": {"score": 26, "rank": 141}, "RWA": {"score": 53, "rank": 49},
    "ETH": {"score": 37, "rank": 98}, "SEN": {"score": 43, "rank": 72}, "CIV": {"score": 37, "rank": 99},
    "CMR": {"score": 26, "rank": 141}, "ZMB": {"score": 33, "rank": 116}, "ZWE": {"score": 23, "rank": 154},
    "TUN": {"score": 40, "rank": 87}, "BOL": {"score": 29, "rank": 133}, "PRY": {"score": 28, "rank": 135},
    "URY": {"score": 71, "rank": 18}, "CRI": {"score": 55, "rank": 45}, "PAN": {"score": 36, "rank": 101},
    "DOM": {"score": 32, "rank": 120}, "GTM": {"score": 23, "rank": 154}, "HND": {"score": 23, "rank": 154},
    "NIC": {"score": 17, "rank": 172}, "SLV": {"score": 31, "rank": 126}, "CUB": {"score": 42, "rank": 76},
    "HTI": {"score": 17, "rank": 172}, "JAM": {"score": 44, "rank": 69}, "TTO": {"score": 40, "rank": 87},
    "BWA": {"score": 55, "rank": 45}, "NAM": {"score": 49, "rank": 57}, "MUS": {"score": 50, "rank": 55},
}

# UNDP Human Development Index 2023 (193 countries)
HDI_DATA = {
    # Very High HDI (0.80+)
    "CHE": {"score": 0.962, "rank": 1}, "NOR": {"score": 0.961, "rank": 2}, "ISL": {"score": 0.959, "rank": 3},
    "DNK": {"score": 0.952, "rank": 4}, "SWE": {"score": 0.952, "rank": 5}, "IRL": {"score": 0.950, "rank": 6},
    "DEU": {"score": 0.950, "rank": 7}, "NLD": {"score": 0.946, "rank": 8}, "FIN": {"score": 0.942, "rank": 9},
    "AUS": {"score": 0.946, "rank": 10}, "SGP": {"score": 0.949, "rank": 9}, "BEL": {"score": 0.942, "rank": 12},
    "NZL": {"score": 0.939, "rank": 13}, "CAN": {"score": 0.935, "rank": 18}, "GBR": {"score": 0.940, "rank": 15},
    "USA": {"score": 0.927, "rank": 21}, "AUT": {"score": 0.926, "rank": 22}, "ISR": {"score": 0.915, "rank": 26},
    "JPN": {"score": 0.920, "rank": 24}, "KOR": {"score": 0.929, "rank": 19}, "LUX": {"score": 0.930, "rank": 18},
    "FRA": {"score": 0.910, "rank": 28}, "SVN": {"score": 0.918, "rank": 25}, "ESP": {"score": 0.905, "rank": 30},
    "CZE": {"score": 0.895, "rank": 32}, "ITA": {"score": 0.906, "rank": 30}, "MLT": {"score": 0.915, "rank": 27},
    "EST": {"score": 0.899, "rank": 31}, "GRC": {"score": 0.893, "rank": 33}, "CYP": {"score": 0.907, "rank": 29},
    "POL": {"score": 0.881, "rank": 34}, "LTU": {"score": 0.879, "rank": 35}, "ARE": {"score": 0.937, "rank": 17},
    "SAU": {"score": 0.875, "rank": 35}, "PRT": {"score": 0.874, "rank": 37}, "SVK": {"score": 0.860, "rank": 43},
    "LVA": {"score": 0.866, "rank": 39}, "HRV": {"score": 0.871, "rank": 38}, "QAT": {"score": 0.875, "rank": 36},
    "CHL": {"score": 0.860, "rank": 44}, "HUN": {"score": 0.851, "rank": 46}, "ARG": {"score": 0.849, "rank": 48},
    "TUR": {"score": 0.855, "rank": 45}, "MNE": {"score": 0.844, "rank": 49}, "KWT": {"score": 0.831, "rank": 51},
    "BHR": {"score": 0.888, "rank": 34}, "RUS": {"score": 0.821, "rank": 56}, "ROU": {"score": 0.827, "rank": 53},
    "OMN": {"score": 0.816, "rank": 58}, "BLR": {"score": 0.808, "rank": 60}, "KAZ": {"score": 0.811, "rank": 61},
    "BGR": {"score": 0.799, "rank": 67}, "SRB": {"score": 0.806, "rank": 62}, "GEO": {"score": 0.814, "rank": 59},
    "MYS": {"score": 0.807, "rank": 63}, "URY": {"score": 0.830, "rank": 52}, "CRI": {"score": 0.806, "rank": 62},
    "PAN": {"score": 0.820, "rank": 57}, "MUS": {"score": 0.802, "rank": 64},
    # High HDI (0.70-0.79)
    "THA": {"score": 0.800, "rank": 66}, "CHN": {"score": 0.788, "rank": 75}, "MEX": {"score": 0.781, "rank": 77},
    "BRA": {"score": 0.760, "rank": 89}, "COL": {"score": 0.758, "rank": 90}, "IRN": {"score": 0.780, "rank": 78},
    "PER": {"score": 0.762, "rank": 87}, "ECU": {"score": 0.765, "rank": 85}, "UKR": {"score": 0.773, "rank": 80},
    "AZE": {"score": 0.760, "rank": 88}, "DZA": {"score": 0.745, "rank": 91}, "TUN": {"score": 0.732, "rank": 97},
    "ARM": {"score": 0.786, "rank": 76}, "ALB": {"score": 0.789, "rank": 74}, "JOR": {"score": 0.736, "rank": 95},
    "DOM": {"score": 0.767, "rank": 83}, "LBN": {"score": 0.723, "rank": 102}, "LKA": {"score": 0.782, "rank": 77},
    "MDA": {"score": 0.763, "rank": 86}, "VNM": {"score": 0.726, "rank": 107}, "EGY": {"score": 0.728, "rank": 105},
    "IDN": {"score": 0.713, "rank": 112}, "PHL": {"score": 0.710, "rank": 116}, "ZAF": {"score": 0.717, "rank": 109},
    "BWA": {"score": 0.708, "rank": 118}, "JAM": {"score": 0.706, "rank": 119}, "PRY": {"score": 0.724, "rank": 101},
    "BOL": {"score": 0.698, "rank": 118}, "MAR": {"score": 0.698, "rank": 120},
    # Medium HDI (0.55-0.69)
    "IRQ": {"score": 0.686, "rank": 123}, "KHM": {"score": 0.600, "rank": 140}, "LAO": {"score": 0.620, "rank": 137},
    "BGD": {"score": 0.670, "rank": 129}, "NPL": {"score": 0.602, "rank": 143}, "MMR": {"score": 0.585, "rank": 149},
    "KEN": {"score": 0.601, "rank": 145}, "PAK": {"score": 0.540, "rank": 164}, "GHA": {"score": 0.632, "rank": 133},
    "CMR": {"score": 0.587, "rank": 148}, "CIV": {"score": 0.550, "rank": 159}, "ZMB": {"score": 0.565, "rank": 154},
    "TZA": {"score": 0.549, "rank": 160}, "SEN": {"score": 0.517, "rank": 168}, "UGA": {"score": 0.550, "rank": 159},
    "RWA": {"score": 0.548, "rank": 161}, "ETH": {"score": 0.498, "rank": 175}, "AGO": {"score": 0.586, "rank": 148},
    "NGA": {"score": 0.548, "rank": 161}, "IND": {"score": 0.644, "rank": 134}, "ZWE": {"score": 0.550, "rank": 156},
    # Low HDI (<0.55)
    "HTI": {"score": 0.535, "rank": 163}, "SDN": {"score": 0.516, "rank": 169}, "YEM": {"score": 0.455, "rank": 183},
    "AFG": {"score": 0.462, "rank": 182}, "SOM": {"score": 0.380, "rank": 191}, "TCD": {"score": 0.394, "rank": 190},
    "CAF": {"score": 0.387, "rank": 190}, "SSD": {"score": 0.385, "rank": 191}, "NER": {"score": 0.400, "rank": 189},
    "MLI": {"score": 0.428, "rank": 186}, "BFA": {"score": 0.449, "rank": 184}, "MRT": {"score": 0.556, "rank": 158},
    "BDI": {"score": 0.426, "rank": 187}, "LBR": {"score": 0.481, "rank": 178}, "SLE": {"score": 0.477, "rank": 179},
    "GIN": {"score": 0.465, "rank": 181}, "BEN": {"score": 0.504, "rank": 173}, "TGO": {"score": 0.547, "rank": 162},
    "MDG": {"score": 0.501, "rank": 173}, "MOZ": {"score": 0.456, "rank": 183}, "MWI": {"score": 0.512, "rank": 170},
    "COD": {"score": 0.479, "rank": 179}, "COG": {"score": 0.571, "rank": 153}, "GAB": {"score": 0.706, "rank": 119},
}

# Yale EPI 2022 (Environmental Performance Index - 180 countries)
EPI_DATA = {
    # Top performers (60+)
    "DNK": {"score": 77.9, "rank": 1, "air_quality": 89.5}, "GBR": {"score": 77.7, "rank": 2, "air_quality": 79.4},
    "FIN": {"score": 76.5, "rank": 3, "air_quality": 81.2}, "MLT": {"score": 75.2, "rank": 4, "air_quality": 65.2},
    "SWE": {"score": 72.7, "rank": 8, "air_quality": 77.8}, "LUX": {"score": 72.3, "rank": 6, "air_quality": 55.4},
    "SVN": {"score": 67.3, "rank": 7, "air_quality": 58.2}, "AUT": {"score": 66.5, "rank": 8, "air_quality": 61.5},
    "CHE": {"score": 65.9, "rank": 7, "air_quality": 71.3}, "NOR": {"score": 71.3, "rank": 10, "air_quality": 82.1},
    "ISL": {"score": 62.8, "rank": 11, "air_quality": 92.5}, "FRA": {"score": 62.5, "rank": 12, "air_quality": 60.8},
    "DEU": {"score": 62.4, "rank": 13, "air_quality": 65.4}, "NLD": {"score": 57.7, "rank": 21, "air_quality": 51.2},
    "IRL": {"score": 57.4, "rank": 22, "air_quality": 72.5}, "EST": {"score": 61.4, "rank": 14, "air_quality": 78.2},
    "AUS": {"score": 60.1, "rank": 17, "air_quality": 68.5}, "NZL": {"score": 56.7, "rank": 23, "air_quality": 85.6},
    # Medium-high (45-60)
    "JPN": {"score": 57.2, "rank": 25, "air_quality": 59.3}, "KOR": {"score": 57.0, "rank": 26, "air_quality": 38.2},
    "ESP": {"score": 56.8, "rank": 27, "air_quality": 48.5}, "BEL": {"score": 56.5, "rank": 28, "air_quality": 42.5},
    "ITA": {"score": 52.8, "rank": 38, "air_quality": 48.5}, "CAN": {"score": 50.3, "rank": 49, "air_quality": 68.2},
    "USA": {"score": 51.1, "rank": 43, "air_quality": 55.4}, "SGP": {"score": 50.9, "rank": 44, "air_quality": 46.8},
    "MEX": {"score": 52.6, "rank": 39, "air_quality": 49.5}, "CRI": {"score": 52.0, "rank": 40, "air_quality": 58.2},
    "GRC": {"score": 50.5, "rank": 48, "air_quality": 52.4}, "PRT": {"score": 50.2, "rank": 49, "air_quality": 54.8},
    "HRV": {"score": 49.5, "rank": 52, "air_quality": 58.5}, "CZE": {"score": 48.2, "rank": 55, "air_quality": 45.2},
    "POL": {"score": 45.5, "rank": 68, "air_quality": 35.4}, "HUN": {"score": 47.1, "rank": 60, "air_quality": 42.5},
    "BRA": {"score": 44.7, "rank": 81, "air_quality": 54.2}, "CHL": {"score": 44.5, "rank": 82, "air_quality": 42.8},
    "URY": {"score": 45.2, "rank": 72, "air_quality": 62.5}, "ARG": {"score": 43.8, "rank": 86, "air_quality": 52.1},
    # Medium (30-45)
    "TUR": {"score": 42.6, "rank": 89, "air_quality": 42.1}, "ZAF": {"score": 35.9, "rank": 116, "air_quality": 43.2},
    "RUS": {"score": 37.5, "rank": 112, "air_quality": 45.8}, "UKR": {"score": 35.5, "rank": 118, "air_quality": 42.5},
    "ARE": {"score": 35.6, "rank": 117, "air_quality": 38.9}, "EGY": {"score": 32.5, "rank": 138, "air_quality": 28.5},
    "SAU": {"score": 30.7, "rank": 152, "air_quality": 35.6}, "THA": {"score": 35.2, "rank": 120, "air_quality": 32.5},
    "MYS": {"score": 36.5, "rank": 108, "air_quality": 35.8}, "VNM": {"score": 33.4, "rank": 130, "air_quality": 25.5},
    "PHL": {"score": 32.8, "rank": 135, "air_quality": 28.4}, "COL": {"score": 40.5, "rank": 92, "air_quality": 45.2},
    "PER": {"score": 38.2, "rank": 102, "air_quality": 42.5}, "IRN": {"score": 30.5, "rank": 153, "air_quality": 28.5},
    # Low (<30)
    "CHN": {"score": 28.4, "rank": 160, "air_quality": 18.9}, "IDN": {"score": 28.2, "rank": 164, "air_quality": 27.8},
    "IND": {"score": 18.9, "rank": 180, "air_quality": 8.7}, "PAK": {"score": 24.6, "rank": 172, "air_quality": 12.5},
    "BGD": {"score": 23.1, "rank": 177, "air_quality": 10.2}, "NGA": {"score": 26.5, "rank": 168, "air_quality": 32.5},
    "IRQ": {"score": 21.2, "rank": 179, "air_quality": 22.5}, "NPL": {"score": 28.5, "rank": 162, "air_quality": 18.5},
}


def get_cpi_data(iso_code: str) -> Optional[Dict[str, Any]]:
    """Get Transparency International CPI data for a country."""
    return CPI_DATA.get(iso_code)


def get_hdi_data(iso_code: str) -> Optional[Dict[str, Any]]:
    """Get UNDP HDI data for a country."""
    return HDI_DATA.get(iso_code)


def get_epi_data(iso_code: str) -> Optional[Dict[str, Any]]:
    """Get Yale EPI data for a country."""
    return EPI_DATA.get(iso_code)
