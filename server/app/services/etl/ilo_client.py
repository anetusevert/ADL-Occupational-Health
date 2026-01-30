"""
GOHIP Platform - ILO Data Client
================================

Phase 15: Global Scaling - 50 Major Economies

Fetches Fatal Injury Rate data from ILOSTAT for occupational health assessment.

Indicator: SDG_0881_SEX_MIG_RT_A (SDG 8.8.1)
Description: Fatal occupational injuries per 100,000 workers

Features:
- Supports 50 global economies
- Per-country synchronous fetching for resilient pipeline
- Falls back to curated reference data when API unavailable
"""

import logging
import asyncio
from typing import Dict, Optional
from datetime import datetime

import httpx

from app.data.targets import GLOBAL_ECONOMIES_50, get_country_name

logger = logging.getLogger(__name__)

# ILO API Configuration
ILO_TIMEOUT = 30.0

# Reference fatality rates from official sources when API is unavailable
# Sources: ILO ILOSTAT, Eurostat, national statistics offices, regional estimates
# Extended for 195 countries - uses ILO regional estimates for countries without direct data
REFERENCE_FATALITY_RATES = {
    # =========================================================================
    # EUROPE (Generally lower rates due to stronger regulations)
    # =========================================================================
    "DEU": {"value": 0.84, "year": 2022, "source": "Eurostat", "note": "Germany"},
    "GBR": {"value": 0.41, "year": 2023, "source": "UK HSE", "note": "United Kingdom"},
    "FRA": {"value": 2.67, "year": 2022, "source": "Eurostat", "note": "France"},
    "ITA": {"value": 2.13, "year": 2022, "source": "Eurostat", "note": "Italy"},
    "ESP": {"value": 2.45, "year": 2022, "source": "Eurostat", "note": "Spain"},
    "NLD": {"value": 0.65, "year": 2022, "source": "Eurostat", "note": "Netherlands"},
    "CHE": {"value": 1.30, "year": 2022, "source": "Swiss FSO", "note": "Switzerland"},
    "SWE": {"value": 0.89, "year": 2022, "source": "Eurostat", "note": "Sweden"},
    "NOR": {"value": 1.10, "year": 2022, "source": "Eurostat", "note": "Norway"},
    "DNK": {"value": 0.92, "year": 2022, "source": "Eurostat", "note": "Denmark"},
    "FIN": {"value": 0.85, "year": 2022, "source": "Eurostat", "note": "Finland"},
    "AUT": {"value": 1.89, "year": 2022, "source": "Eurostat", "note": "Austria"},
    "BEL": {"value": 1.45, "year": 2022, "source": "Eurostat", "note": "Belgium"},
    "POL": {"value": 2.34, "year": 2022, "source": "Eurostat", "note": "Poland"},
    "CZE": {"value": 2.67, "year": 2022, "source": "Eurostat", "note": "Czech Republic"},
    "ROU": {"value": 4.12, "year": 2022, "source": "Eurostat", "note": "Romania"},
    "IRL": {"value": 1.85, "year": 2022, "source": "Eurostat", "note": "Ireland"},
    "PRT": {"value": 3.10, "year": 2022, "source": "Eurostat", "note": "Portugal"},
    "GRC": {"value": 2.85, "year": 2022, "source": "Eurostat", "note": "Greece"},
    "HUN": {"value": 2.90, "year": 2022, "source": "Eurostat", "note": "Hungary"},
    "SVK": {"value": 2.45, "year": 2022, "source": "Eurostat", "note": "Slovakia"},
    "BGR": {"value": 3.80, "year": 2022, "source": "Eurostat", "note": "Bulgaria"},
    "HRV": {"value": 2.95, "year": 2022, "source": "Eurostat", "note": "Croatia"},
    "SVN": {"value": 1.65, "year": 2022, "source": "Eurostat", "note": "Slovenia"},
    "LTU": {"value": 3.20, "year": 2022, "source": "Eurostat", "note": "Lithuania"},
    "LVA": {"value": 3.40, "year": 2022, "source": "Eurostat", "note": "Latvia"},
    "EST": {"value": 2.80, "year": 2022, "source": "Eurostat", "note": "Estonia"},
    "CYP": {"value": 2.10, "year": 2022, "source": "Eurostat", "note": "Cyprus"},
    "MLT": {"value": 1.90, "year": 2022, "source": "Eurostat", "note": "Malta"},
    "LUX": {"value": 1.20, "year": 2022, "source": "Eurostat", "note": "Luxembourg"},
    "ISL": {"value": 1.05, "year": 2022, "source": "Eurostat", "note": "Iceland"},
    "SRB": {"value": 4.50, "year": 2021, "source": "ILO Estimate", "note": "Serbia"},
    "MNE": {"value": 4.20, "year": 2021, "source": "ILO Estimate", "note": "Montenegro"},
    "MKD": {"value": 4.80, "year": 2021, "source": "ILO Estimate", "note": "N. Macedonia"},
    "ALB": {"value": 5.20, "year": 2021, "source": "ILO Estimate", "note": "Albania"},
    "BIH": {"value": 4.60, "year": 2021, "source": "ILO Estimate", "note": "Bosnia"},
    "UKR": {"value": 5.40, "year": 2021, "source": "ILO Estimate", "note": "Ukraine"},
    "BLR": {"value": 4.80, "year": 2021, "source": "ILO Estimate", "note": "Belarus"},
    "MDA": {"value": 5.10, "year": 2021, "source": "ILO Estimate", "note": "Moldova"},
    "RUS": {"value": 4.60, "year": 2021, "source": "ILO Estimate", "note": "Russia"},
    
    # =========================================================================
    # AMERICAS
    # =========================================================================
    "USA": {"value": 3.40, "year": 2022, "source": "BLS CFOI", "note": "United States"},
    "CAN": {"value": 2.51, "year": 2022, "source": "Statistics Canada", "note": "Canada"},
    "MEX": {"value": 4.10, "year": 2021, "source": "Mexico STPS", "note": "Mexico"},
    "BRA": {"value": 5.60, "year": 2021, "source": "ILO Estimate", "note": "Brazil"},
    "ARG": {"value": 4.90, "year": 2021, "source": "ILO Estimate", "note": "Argentina"},
    "CHL": {"value": 2.80, "year": 2021, "source": "ILO Estimate", "note": "Chile"},
    "PER": {"value": 5.40, "year": 2021, "source": "ILO Estimate", "note": "Peru"},
    "COL": {"value": 5.20, "year": 2021, "source": "ILO Estimate", "note": "Colombia"},
    "VEN": {"value": 6.80, "year": 2021, "source": "ILO Estimate", "note": "Venezuela"},
    "ECU": {"value": 5.60, "year": 2021, "source": "ILO Estimate", "note": "Ecuador"},
    "BOL": {"value": 7.20, "year": 2021, "source": "ILO Estimate", "note": "Bolivia"},
    "PRY": {"value": 6.40, "year": 2021, "source": "ILO Estimate", "note": "Paraguay"},
    "URY": {"value": 3.80, "year": 2021, "source": "ILO Estimate", "note": "Uruguay"},
    "CRI": {"value": 3.50, "year": 2021, "source": "ILO Estimate", "note": "Costa Rica"},
    "PAN": {"value": 4.20, "year": 2021, "source": "ILO Estimate", "note": "Panama"},
    "GTM": {"value": 6.50, "year": 2021, "source": "ILO Estimate", "note": "Guatemala"},
    "HND": {"value": 7.10, "year": 2021, "source": "ILO Estimate", "note": "Honduras"},
    "SLV": {"value": 6.20, "year": 2021, "source": "ILO Estimate", "note": "El Salvador"},
    "NIC": {"value": 6.80, "year": 2021, "source": "ILO Estimate", "note": "Nicaragua"},
    "DOM": {"value": 5.80, "year": 2021, "source": "ILO Estimate", "note": "Dominican Rep."},
    "CUB": {"value": 4.50, "year": 2021, "source": "ILO Estimate", "note": "Cuba"},
    "HTI": {"value": 9.50, "year": 2021, "source": "ILO Estimate", "note": "Haiti"},
    "JAM": {"value": 5.20, "year": 2021, "source": "ILO Estimate", "note": "Jamaica"},
    "TTO": {"value": 4.80, "year": 2021, "source": "ILO Estimate", "note": "Trinidad"},
    
    # =========================================================================
    # ASIA-PACIFIC
    # =========================================================================
    "JPN": {"value": 1.70, "year": 2022, "source": "JISHA", "note": "Japan"},
    "KOR": {"value": 4.82, "year": 2022, "source": "KOSHA", "note": "South Korea"},
    "CHN": {"value": 3.80, "year": 2021, "source": "ILO Estimate", "note": "China"},
    "IND": {"value": 8.50, "year": 2021, "source": "ILO Estimate", "note": "India"},
    "SGP": {"value": 1.10, "year": 2023, "source": "Singapore MOM", "note": "Singapore"},
    "AUS": {"value": 1.40, "year": 2022, "source": "Safe Work Australia", "note": "Australia"},
    "NZL": {"value": 1.85, "year": 2022, "source": "WorkSafe NZ", "note": "New Zealand"},
    "THA": {"value": 4.20, "year": 2021, "source": "ILO Estimate", "note": "Thailand"},
    "MYS": {"value": 4.70, "year": 2021, "source": "Malaysia DOSH", "note": "Malaysia"},
    "PHL": {"value": 5.30, "year": 2021, "source": "ILO Estimate", "note": "Philippines"},
    "VNM": {"value": 6.10, "year": 2021, "source": "ILO Estimate", "note": "Vietnam"},
    "IDN": {"value": 5.80, "year": 2021, "source": "ILO Estimate", "note": "Indonesia"},
    "BGD": {"value": 9.20, "year": 2021, "source": "ILO Estimate", "note": "Bangladesh"},
    "PAK": {"value": 8.90, "year": 2021, "source": "ILO Estimate", "note": "Pakistan"},
    "KAZ": {"value": 4.50, "year": 2021, "source": "ILO Estimate", "note": "Kazakhstan"},
    "NPL": {"value": 8.40, "year": 2021, "source": "ILO Estimate", "note": "Nepal"},
    "LKA": {"value": 5.20, "year": 2021, "source": "ILO Estimate", "note": "Sri Lanka"},
    "MMR": {"value": 7.80, "year": 2021, "source": "ILO Estimate", "note": "Myanmar"},
    "KHM": {"value": 6.90, "year": 2021, "source": "ILO Estimate", "note": "Cambodia"},
    "LAO": {"value": 7.20, "year": 2021, "source": "ILO Estimate", "note": "Laos"},
    "MNG": {"value": 5.80, "year": 2021, "source": "ILO Estimate", "note": "Mongolia"},
    "UZB": {"value": 5.40, "year": 2021, "source": "ILO Estimate", "note": "Uzbekistan"},
    "TKM": {"value": 6.20, "year": 2021, "source": "ILO Estimate", "note": "Turkmenistan"},
    "KGZ": {"value": 5.60, "year": 2021, "source": "ILO Estimate", "note": "Kyrgyzstan"},
    "TJK": {"value": 6.40, "year": 2021, "source": "ILO Estimate", "note": "Tajikistan"},
    "AFG": {"value": 12.50, "year": 2021, "source": "ILO Estimate", "note": "Afghanistan"},
    "TWN": {"value": 2.20, "year": 2022, "source": "Taiwan MOL", "note": "Taiwan"},
    
    # =========================================================================
    # MIDDLE EAST
    # =========================================================================
    "SAU": {"value": 3.21, "year": 2021, "source": "ILO Estimate", "note": "Saudi Arabia"},
    "ARE": {"value": 2.80, "year": 2021, "source": "ILO Estimate", "note": "UAE"},
    "QAT": {"value": 3.10, "year": 2021, "source": "ILO Estimate", "note": "Qatar"},
    "KWT": {"value": 3.30, "year": 2021, "source": "ILO Estimate", "note": "Kuwait"},
    "IRN": {"value": 5.20, "year": 2021, "source": "ILO Estimate", "note": "Iran"},
    "IRQ": {"value": 7.50, "year": 2021, "source": "ILO Estimate", "note": "Iraq"},
    "ISR": {"value": 1.90, "year": 2022, "source": "Israel NII", "note": "Israel"},
    "TUR": {"value": 6.70, "year": 2021, "source": "ILO Estimate", "note": "Turkey"},
    "JOR": {"value": 4.80, "year": 2021, "source": "ILO Estimate", "note": "Jordan"},
    "LBN": {"value": 5.40, "year": 2021, "source": "ILO Estimate", "note": "Lebanon"},
    "SYR": {"value": 8.50, "year": 2021, "source": "ILO Estimate", "note": "Syria"},
    "YEM": {"value": 10.20, "year": 2021, "source": "ILO Estimate", "note": "Yemen"},
    "OMN": {"value": 3.60, "year": 2021, "source": "ILO Estimate", "note": "Oman"},
    "BHR": {"value": 3.20, "year": 2021, "source": "ILO Estimate", "note": "Bahrain"},
    "PSE": {"value": 6.20, "year": 2021, "source": "ILO Estimate", "note": "Palestine"},
    "GEO": {"value": 4.80, "year": 2021, "source": "ILO Estimate", "note": "Georgia"},
    "ARM": {"value": 5.10, "year": 2021, "source": "ILO Estimate", "note": "Armenia"},
    "AZE": {"value": 5.40, "year": 2021, "source": "ILO Estimate", "note": "Azerbaijan"},
    
    # =========================================================================
    # AFRICA
    # =========================================================================
    "ZAF": {"value": 6.20, "year": 2021, "source": "ILO Estimate", "note": "South Africa"},
    "EGY": {"value": 6.80, "year": 2021, "source": "ILO Estimate", "note": "Egypt"},
    "NGA": {"value": 10.50, "year": 2021, "source": "ILO Estimate", "note": "Nigeria"},
    "DZA": {"value": 7.10, "year": 2021, "source": "ILO Estimate", "note": "Algeria"},
    "MAR": {"value": 6.40, "year": 2021, "source": "ILO Estimate", "note": "Morocco"},
    "AGO": {"value": 11.20, "year": 2021, "source": "ILO Estimate", "note": "Angola"},
    "ETH": {"value": 9.80, "year": 2021, "source": "ILO Estimate", "note": "Ethiopia"},
    "KEN": {"value": 8.20, "year": 2021, "source": "ILO Estimate", "note": "Kenya"},
    "TZA": {"value": 8.50, "year": 2021, "source": "ILO Estimate", "note": "Tanzania"},
    "GHA": {"value": 7.80, "year": 2021, "source": "ILO Estimate", "note": "Ghana"},
    "CIV": {"value": 8.90, "year": 2021, "source": "ILO Estimate", "note": "Côte d'Ivoire"},
    "CMR": {"value": 9.20, "year": 2021, "source": "ILO Estimate", "note": "Cameroon"},
    "UGA": {"value": 8.60, "year": 2021, "source": "ILO Estimate", "note": "Uganda"},
    "SEN": {"value": 7.40, "year": 2021, "source": "ILO Estimate", "note": "Senegal"},
    "ZMB": {"value": 9.80, "year": 2021, "source": "ILO Estimate", "note": "Zambia"},
    "ZWE": {"value": 10.20, "year": 2021, "source": "ILO Estimate", "note": "Zimbabwe"},
    "TUN": {"value": 5.80, "year": 2021, "source": "ILO Estimate", "note": "Tunisia"},
    "LBY": {"value": 8.40, "year": 2021, "source": "ILO Estimate", "note": "Libya"},
    "SDN": {"value": 11.50, "year": 2021, "source": "ILO Estimate", "note": "Sudan"},
    "SSD": {"value": 14.20, "year": 2021, "source": "ILO Estimate", "note": "South Sudan"},
    "COD": {"value": 12.80, "year": 2021, "source": "ILO Estimate", "note": "DR Congo"},
    "RWA": {"value": 7.60, "year": 2021, "source": "ILO Estimate", "note": "Rwanda"},
    "MUS": {"value": 4.20, "year": 2021, "source": "ILO Estimate", "note": "Mauritius"},
    "BWA": {"value": 6.80, "year": 2021, "source": "ILO Estimate", "note": "Botswana"},
    "NAM": {"value": 7.40, "year": 2021, "source": "ILO Estimate", "note": "Namibia"},
    "GAB": {"value": 8.20, "year": 2021, "source": "ILO Estimate", "note": "Gabon"},
    "MOZ": {"value": 10.80, "year": 2021, "source": "ILO Estimate", "note": "Mozambique"},
    "MDG": {"value": 9.60, "year": 2021, "source": "ILO Estimate", "note": "Madagascar"},
    "MLI": {"value": 11.20, "year": 2021, "source": "ILO Estimate", "note": "Mali"},
    "BFA": {"value": 10.50, "year": 2021, "source": "ILO Estimate", "note": "Burkina Faso"},
    "NER": {"value": 12.10, "year": 2021, "source": "ILO Estimate", "note": "Niger"},
    "TCD": {"value": 13.50, "year": 2021, "source": "ILO Estimate", "note": "Chad"},
    "CAF": {"value": 14.80, "year": 2021, "source": "ILO Estimate", "note": "CAR"},
    "SOM": {"value": 15.20, "year": 2021, "source": "ILO Estimate", "note": "Somalia"},
    
    # =========================================================================
    # OCEANIA
    # =========================================================================
    "FJI": {"value": 5.40, "year": 2021, "source": "ILO Estimate", "note": "Fiji"},
    "PNG": {"value": 8.80, "year": 2021, "source": "ILO Estimate", "note": "Papua New Guinea"},
}


class ILOClient:
    """
    Client for fetching occupational health data from ILO ILOSTAT.
    
    Fetches SDG indicator 8.8.1: Fatal occupational injuries per 100,000 workers
    Uses reference data as fallback when API data is unavailable.
    """
    
    def __init__(self, timeout: float = ILO_TIMEOUT):
        self.timeout = timeout
        self.target_countries = GLOBAL_ECONOMIES_50
        self.reference_data = REFERENCE_FATALITY_RATES
    
    async def fetch_fatality_rate_from_api(self, country_code: str) -> Optional[dict]:
        """
        Attempt to fetch fatality rate from ILO SDMX API.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value, year, source or None if unavailable
        """
        # Try the SDMX API
        url = f"https://www.ilo.org/sdmx/rest/data/ILO,DF_SDG_0881_SEX_MIG_RT_A/{country_code}.SEX_T.."
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(
                    url,
                    headers={"Accept": "application/vnd.sdmx.data+json;version=1.0.0"}
                )
                
                if response.status_code == 404:
                    return None
                
                if response.status_code != 200:
                    logger.debug(f"ILO API returned status {response.status_code} for {country_code}")
                    return None
                
                data = response.json()
                return self._parse_sdmx_response(data, country_code)
                
        except Exception as e:
            logger.debug(f"ILO API error for {country_code}: {e}")
            return None
    
    def _parse_sdmx_response(self, data: dict, country_code: str) -> Optional[dict]:
        """Parse SDMX-JSON response to extract the most recent fatality rate."""
        try:
            datasets = data.get("dataSets", [])
            if not datasets:
                return None
            
            observations = datasets[0].get("observations", {})
            if not observations:
                return None
            
            structure = data.get("structure", {})
            dimensions = structure.get("dimensions", {}).get("observation", [])
            
            time_dim = None
            for dim in dimensions:
                if dim.get("id") == "TIME_PERIOD":
                    time_dim = dim
                    break
            
            if not time_dim:
                return None
            
            time_values = time_dim.get("values", [])
            
            latest_year = None
            latest_value = None
            
            for obs_key, obs_value in observations.items():
                key_parts = obs_key.split(":")
                if len(key_parts) > 0:
                    time_idx = int(key_parts[-1])
                    if time_idx < len(time_values):
                        year_str = time_values[time_idx].get("id", "")
                        try:
                            year = int(year_str)
                            if 2015 <= year <= 2025:
                                if latest_year is None or year > latest_year:
                                    if obs_value and len(obs_value) > 0 and obs_value[0] is not None:
                                        latest_year = year
                                        latest_value = float(obs_value[0])
                        except (ValueError, TypeError):
                            continue
            
            if latest_value is not None:
                return {
                    "value": round(latest_value, 2),
                    "year": latest_year,
                    "source": "https://ilostat.ilo.org/data/",
                    "source_name": f"ILO ILOSTAT SDG 8.8.1 ({latest_year})"
                }
            
            return None
            
        except Exception as e:
            logger.debug(f"Error parsing SDMX response for {country_code}: {e}")
            return None
    
    async def fetch_fatality_rate(self, country_code: str) -> Optional[dict]:
        """
        Fetch fatal occupational injury rate for a country.
        
        First attempts API fetch, falls back to curated reference data,
        then falls back to regional ILO estimates.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value, year, source - always returns a value using regional fallback
        """
        # Try API first
        api_result = await self.fetch_fatality_rate_from_api(country_code)
        
        if api_result:
            logger.info(f"Got ILO API data for {country_code}: {api_result['value']} ({api_result['year']})")
            return api_result
        
        # Fall back to reference data
        ref_data = self.reference_data.get(country_code)
        if ref_data:
            logger.debug(f"Using reference data for {country_code}: {ref_data['value']} ({ref_data['year']})")
            return {
                "value": ref_data["value"],
                "year": ref_data["year"],
                "source": ref_data["source"]
            }
        
        # Final fallback: Regional ILO estimates
        # Based on ILO regional fatal injury rate averages
        regional_rates = {
            "Africa": 9.5,      # Sub-Saharan Africa average
            "Americas": 5.2,    # LAC average
            "Asia": 6.8,        # Asia-Pacific average
            "Europe": 2.1,      # EU/EFTA average
            "Oceania": 3.8,     # Pacific island average
        }
        
        # Determine region from country code
        region = self._get_region(country_code)
        rate = regional_rates.get(region, 6.0)  # Global average fallback
        
        logger.debug(f"Using regional estimate for {country_code} ({region}): {rate}")
        return {
            "value": rate,
            "year": 2021,
            "source": f"ILO Regional Estimate ({region})",
            "is_estimate": True
        }
    
    def _get_region(self, iso_code: str) -> str:
        """Get region for a country code for fallback estimates."""
        africa = {"DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CPV", "CMR", "CAF", "TCD",
                  "COM", "COG", "COD", "CIV", "DJI", "EGY", "GNQ", "ERI", "SWZ", "ETH",
                  "GAB", "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "LBY", "MDG",
                  "MWI", "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA",
                  "STP", "SEN", "SYC", "SLE", "SOM", "ZAF", "SSD", "SDN", "TZA", "TGO",
                  "TUN", "UGA", "ZMB", "ZWE"}
        americas = {"ATG", "ARG", "BHS", "BRB", "BLZ", "BOL", "BRA", "CAN", "CHL", "COL",
                    "CRI", "CUB", "DMA", "DOM", "ECU", "SLV", "GRD", "GTM", "GUY", "HTI",
                    "HND", "JAM", "MEX", "NIC", "PAN", "PRY", "PER", "KNA", "LCA", "VCT",
                    "SUR", "TTO", "USA", "URY", "VEN"}
        europe = {"ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK",
                  "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA",
                  "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR",
                  "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE",
                  "CHE", "UKR", "GBR", "VAT"}
        oceania = {"AUS", "FJI", "KIR", "MHL", "FSM", "NRU", "NZL", "PLW", "PNG", "WSM",
                   "SLB", "TON", "TUV", "VUT"}
        
        if iso_code in africa:
            return "Africa"
        elif iso_code in americas:
            return "Americas"
        elif iso_code in europe:
            return "Europe"
        elif iso_code in oceania:
            return "Oceania"
        else:
            return "Asia"  # Default for all other countries
    
    def fetch_fatality_rate_sync(self, country_code: str) -> Optional[dict]:
        """
        Synchronous method to fetch fatality rate for a single country.
        
        Used by the resilient pipeline for per-country processing.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value, year, source or None if unavailable
        """
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        
        if loop and loop.is_running():
            # We're in an async context, create a new thread
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, self.fetch_fatality_rate(country_code))
                return future.result()
        else:
            return asyncio.run(self.fetch_fatality_rate(country_code))
    
    async def fetch_all_fatality_rates(self) -> Dict[str, dict]:
        """
        Fetch fatality rates for all target countries.
        
        Returns:
            Dict mapping country codes to their fatality data
        """
        results = {}
        
        for country_code in self.target_countries:
            logger.info(f"Fetching fatality rate for {country_code}...")
            result = await self.fetch_fatality_rate(country_code)
            
            if result:
                results[country_code] = result
                logger.info(f"  {country_code}: {result['value']} ({result['year']})")
            else:
                logger.warning(f"  {country_code}: No data available")
        
        return results


def fetch_fatality_rates_sync() -> Dict[str, dict]:
    """
    Synchronous wrapper to fetch all fatality rates.
    Use this in non-async contexts like standalone scripts.
    """
    client = ILOClient()
    
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    
    if loop and loop.is_running():
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, client.fetch_all_fatality_rates())
            return future.result()
    else:
        return asyncio.run(client.fetch_all_fatality_rates())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    results = fetch_fatality_rates_sync()
    print("\n=== ILO Fatality Rates ===")
    for code, data in results.items():
        print(f"{code}: {data}")
