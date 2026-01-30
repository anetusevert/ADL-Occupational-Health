"""
GOHIP Platform - WHO Global Health Observatory Client
======================================================

Phase 22: 5-Point Dragnet - Data Fusion Strategy

Fetches health & safety proxy indicators from the WHO GHO OData API
to fill gaps when primary ILO data is unavailable.

Indicators:
- UHC_INDEX_REPORTED: Universal Health Coverage Index (maps to Pillar 2: Disease Detection)
- RS_198: Road Traffic Death Rate (proxy for industrial safety culture when ILO data is missing)

Data Mapping Strategy:
======================
If ILO Fatal Rate is missing, we use WHO Road Safety / 10 as a rough proxy for 
industrial safety culture. Rationale: Countries with poor road safety enforcement 
tend to have weaker occupational safety enforcement. The /10 factor normalizes 
road deaths (per 100k population) to approximate occupational fatalities (per 100k workers).

Example: Nigeria has RS_198 = 23.6 road deaths per 100k → ~2.4 proxy fatal rate
         (Still underestimates true OH risk, but provides a baseline signal)

API Documentation: https://ghoapi.azureedge.net/api
"""

import logging
import asyncio
from typing import Dict, Optional
from datetime import datetime

import httpx

from app.data.targets import GLOBAL_ECONOMIES_50, get_country_name

logger = logging.getLogger(__name__)

# WHO GHO OData API Configuration
WHO_BASE_URL = "https://ghoapi.azureedge.net/api"
WHO_TIMEOUT = 30.0

# WHO Indicator Codes
WHO_INDICATORS = {
    "uhc_index": "UHC_INDEX_REPORTED",       # Universal Health Coverage Index (0-100)
    "road_safety": "RS_198",                  # Road traffic death rate per 100,000 population
}

# ISO-2 to ISO-3 mapping (WHO uses ISO-2, we use ISO-3)
ISO2_TO_ISO3 = {
    "US": "USA", "GB": "GBR", "DE": "DEU", "FR": "FRA", "IT": "ITA",
    "JP": "JPN", "CA": "CAN", "CN": "CHN", "IN": "IND", "BR": "BRA",
    "RU": "RUS", "ZA": "ZAF", "KR": "KOR", "AU": "AUS", "MX": "MEX",
    "ID": "IDN", "TR": "TUR", "SA": "SAU", "AR": "ARG", "CH": "CHE",
    "SE": "SWE", "PL": "POL", "BE": "BEL", "AT": "AUT", "NO": "NOR",
    "DK": "DNK", "RO": "ROU", "CZ": "CZE", "AE": "ARE", "QA": "QAT",
    "KW": "KWT", "IR": "IRN", "EG": "EGY", "DZ": "DZA", "MA": "MAR",
    "IQ": "IRQ", "SG": "SGP", "TH": "THA", "MY": "MYS", "PH": "PHL",
    "VN": "VNM", "BD": "BGD", "PK": "PAK", "KZ": "KAZ", "CL": "CHL",
    "PE": "PER", "NG": "NGA", "AO": "AGO", "IL": "ISR", "IE": "IRL",
}

# Reverse mapping
ISO3_TO_ISO2 = {v: k for k, v in ISO2_TO_ISO3.items()}


class WHOClient:
    """
    Client for fetching health indicators from WHO Global Health Observatory.
    
    Provides proxy data for occupational health assessment when primary
    sources (ILO) are unavailable.
    
    Data Philosophy:
    ----------------
    - UHC Index → Proxy for healthcare system capacity (affects disease detection)
    - Road Safety → Proxy for overall safety culture (when ILO fatal rate missing)
    """
    
    def __init__(self, timeout: float = WHO_TIMEOUT):
        self.base_url = WHO_BASE_URL
        self.timeout = timeout
        self.target_countries = GLOBAL_ECONOMIES_50
    
    def _get_iso2_code(self, iso3_code: str) -> Optional[str]:
        """Convert ISO-3 to ISO-2 code for WHO API."""
        return ISO3_TO_ISO2.get(iso3_code)
    
    async def _fetch_indicator(
        self,
        indicator_code: str,
        country_iso3: str,
        indicator_name: str = "unknown"
    ) -> Optional[dict]:
        """
        Fetch a specific WHO indicator for a country.
        
        WHO OData API returns data in a specific format with 'value' array.
        We filter for the most recent year with non-null data.
        
        Args:
            indicator_code: WHO indicator code (e.g., "UHC_INDEX_REPORTED")
            country_iso3: ISO 3166-1 alpha-3 country code
            indicator_name: Human-readable name for logging
            
        Returns:
            Dict with value, year, source or None if unavailable
        """
        iso2 = self._get_iso2_code(country_iso3)
        if not iso2:
            logger.debug(f"No ISO-2 mapping for {country_iso3}")
            return None
        
        # WHO GHO OData endpoint with filter
        url = f"{self.base_url}/{indicator_code}"
        params = {
            "$filter": f"SpatialDim eq '{iso2}'",
            "$orderby": "TimeDim desc",  # Most recent first
            "$top": 10  # Get last 10 years of data
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(url, params=params)
                
                if response.status_code == 404:
                    logger.debug(f"No WHO {indicator_name} data for {country_iso3}")
                    return None
                
                response.raise_for_status()
                data = response.json()
                
                return self._parse_odata_response(data, country_iso3, indicator_code, indicator_name)
                
        except httpx.TimeoutException:
            logger.error(f"Timeout fetching WHO {indicator_name} for {country_iso3}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching WHO data for {country_iso3}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching WHO data for {country_iso3}: {e}")
            return None
    
    def _parse_odata_response(
        self,
        data: dict,
        country_iso3: str,
        indicator_code: str,
        indicator_name: str
    ) -> Optional[dict]:
        """
        Parse WHO GHO OData response to extract the most recent value.
        
        Response format:
        {
            "value": [
                {"SpatialDim": "US", "TimeDim": 2021, "NumericValue": 83.2, ...},
                ...
            ]
        }
        """
        try:
            records = data.get("value", [])
            if not records:
                logger.debug(f"No records in WHO response for {country_iso3}")
                return None
            
            # Find most recent non-null value
            for record in records:
                value = record.get("NumericValue")
                year = record.get("TimeDim")
                
                if value is not None and year is not None:
                    return {
                        "value": round(float(value), 2),
                        "year": int(year),
                        "indicator": indicator_code,
                        "source": f"https://www.who.int/data/gho/data/indicators/indicator-details/GHO/{indicator_code}",
                        "source_name": f"WHO GHO {indicator_name} ({year})"
                    }
            
            logger.debug(f"No non-null values in WHO response for {country_iso3}")
            return None
            
        except Exception as e:
            logger.error(f"Error parsing WHO response for {country_iso3}: {e}")
            return None
    
    async def fetch_uhc_index(self, country_iso3: str) -> Optional[dict]:
        """
        Fetch Universal Health Coverage Index for a country.
        
        Maps to: Pillar 2 - Disease Detection Rate (proxy)
        
        UHC Index (0-100) measures essential health service coverage:
        - Higher values = better healthcare access = likely better OH surveillance
        
        Args:
            country_iso3: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value (0-100), year, source or None
        """
        return await self._fetch_indicator(
            WHO_INDICATORS["uhc_index"],
            country_iso3,
            "UHC Index"
        )
    
    async def fetch_road_safety(self, country_iso3: str) -> Optional[dict]:
        """
        Fetch Road Traffic Death Rate for a country.
        
        Maps to: Pillar 1 - Fatal Accident Rate (PROXY when ILO is null)
        
        Road deaths per 100k population is used as a proxy for:
        - Overall safety enforcement culture
        - Government capacity for safety regulation
        
        CRITICAL NOTE:
        We divide by 10 to normalize road deaths to occupational fatality scale:
        - Road deaths: ~5-30 per 100k population
        - Occupational fatalities: ~0.5-10 per 100k workers
        
        Args:
            country_iso3: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value, year, source or None
        """
        result = await self._fetch_indicator(
            WHO_INDICATORS["road_safety"],
            country_iso3,
            "Road Safety"
        )
        
        # Mark as proxy data
        if result:
            result["is_proxy"] = True
            result["proxy_note"] = "Road safety used as proxy for industrial safety culture"
        
        return result
    
    def fetch_uhc_index_sync(self, country_iso3: str) -> Optional[dict]:
        """Synchronous wrapper for UHC Index fetch."""
        return self._run_async(self.fetch_uhc_index(country_iso3))
    
    def fetch_road_safety_sync(self, country_iso3: str) -> Optional[dict]:
        """Synchronous wrapper for Road Safety fetch."""
        return self._run_async(self.fetch_road_safety(country_iso3))
    
    def _run_async(self, coro):
        """Helper to run async code in sync context."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        
        if loop and loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
        else:
            return asyncio.run(coro)
    
    async def fetch_all_indicators(self, country_iso3: str) -> Dict[str, Optional[dict]]:
        """
        Fetch all WHO indicators for a single country.
        
        Args:
            country_iso3: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with 'uhc_index' and 'road_safety' results
        """
        uhc_result = await self.fetch_uhc_index(country_iso3)
        road_result = await self.fetch_road_safety(country_iso3)
        
        return {
            "uhc_index": uhc_result,
            "road_safety": road_result
        }
    
    def fetch_all_indicators_sync(self, country_iso3: str) -> Dict[str, Optional[dict]]:
        """Synchronous wrapper to fetch all WHO indicators for a country."""
        return self._run_async(self.fetch_all_indicators(country_iso3))


def calculate_proxy_fatal_rate(road_safety_value: float) -> float:
    """
    Convert WHO road safety rate to a proxy occupational fatal rate.
    
    Formula: proxy_fatal_rate = road_safety / 10
    
    Rationale:
    - Road deaths are per 100k population
    - Occupational deaths are per 100k workers
    - Workforce is ~40-50% of population
    - Road deaths capture general safety culture
    - Dividing by 10 provides conservative occupational proxy
    
    Example:
        Nigeria: 23.6 road deaths → 2.36 proxy fatal rate
        Germany: 3.7 road deaths → 0.37 proxy fatal rate
    
    Args:
        road_safety_value: Road traffic deaths per 100k population
        
    Returns:
        Estimated occupational fatal rate per 100k workers
    """
    return round(road_safety_value / 10, 2)


# Standalone test
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    client = WHOClient()
    
    # Test with a few countries
    test_countries = ["DEU", "USA", "NGA", "SAU"]
    
    print("\n=== WHO GHO Data Test ===")
    for iso3 in test_countries:
        print(f"\n{iso3}:")
        
        uhc = client.fetch_uhc_index_sync(iso3)
        if uhc:
            print(f"  UHC Index: {uhc['value']} ({uhc['year']})")
        else:
            print(f"  UHC Index: N/A")
        
        road = client.fetch_road_safety_sync(iso3)
        if road:
            print(f"  Road Safety: {road['value']} per 100k ({road['year']})")
            print(f"  → Proxy Fatal Rate: {calculate_proxy_fatal_rate(road['value'])}")
        else:
            print(f"  Road Safety: N/A")
