"""
GOHIP Platform - World Bank API Client
======================================

Phase 22: 5-Point Dragnet - Data Fusion Strategy

Fetches economic and governance indicators from World Bank Open Data.

Core Indicators:
- NV.IND.TOTL.ZS: Industry value added (% of GDP) → Economic context
- GE.EST: Government Effectiveness → Governance: Strategic Capacity
- SL.EMP.VULN.ZS: Vulnerable Employment (%) → Pillar 2: Migrant/Vulnerable Score
- SH.XPD.CHEX.GD.ZS: Health Expenditure (% GDP) → Pillar 3: Rehab Access (Proxy)

Data Mapping Strategy:
======================
World Bank indicators provide essential context that correlates with OH outcomes:

1. Government Effectiveness (GE.EST): -2.5 to +2.5 scale
   → Normalized to 0-100 for strategic_capacity_score
   → Formula: score = (GE.EST + 2.5) / 5.0 * 100

2. Vulnerable Employment: % of total employment
   → High vulnerable employment = higher informal sector = poor OH coverage
   → Maps directly to vulnerability_index in Pillar 2

3. Health Expenditure (% GDP):
   → Higher spending = better rehab infrastructure
   → Maps to rehab_access_score proxy in Pillar 3

Features:
- Supports 195 countries (global coverage)
- Per-country synchronous fetching for resilient pipeline
- Handles API rate limits gracefully
"""

import logging
import asyncio
from typing import Dict, Optional
from datetime import datetime

import httpx

from app.data.targets import GLOBAL_ECONOMIES_50, get_country_name

logger = logging.getLogger(__name__)

# World Bank API Configuration
WB_BASE_URL = "http://api.worldbank.org/v2"
WB_TIMEOUT = 30.0

# Indicators we fetch - Phase 22 Expanded
INDICATORS = {
    "industry_pct_gdp": "NV.IND.TOTL.ZS",       # Industry value added % GDP
    "gov_effectiveness": "GE.EST",               # Government Effectiveness (-2.5 to +2.5)
    "vulnerable_employment": "SL.EMP.VULN.ZS",   # Vulnerable employment (% of total)
    "health_expenditure": "SH.XPD.CHEX.GD.ZS",   # Health expenditure (% of GDP)
}


class WorldBankClient:
    """
    Client for fetching economic indicators from World Bank API.
    
    Provides context for occupational health risk assessment:
    - Industry composition affects workplace hazard profiles
    """
    
    def __init__(self, timeout: float = WB_TIMEOUT):
        self.base_url = WB_BASE_URL
        self.timeout = timeout
        self.target_countries = GLOBAL_ECONOMIES_50
    
    def _build_url(self, country_code: str, indicator: str) -> str:
        """Build World Bank API URL for a specific country and indicator."""
        return f"{self.base_url}/country/{country_code}/indicator/{indicator}"
    
    def _parse_response(self, data: list, country_code: str, indicator_name: str) -> Optional[dict]:
        """
        Parse World Bank API response to extract the most recent non-null value.
        
        World Bank returns [metadata, data_array] format
        """
        try:
            if not data or len(data) < 2:
                logger.debug(f"Invalid response format for {country_code}")
                return None
            
            records = data[1]
            if not records:
                logger.debug(f"No records found for {country_code}")
                return None
            
            # Find most recent non-null value
            for record in records:
                value = record.get("value")
                year = record.get("date")
                
                if value is not None:
                    return {
                        "value": round(float(value), 2),
                        "year": int(year),
                        "indicator": indicator_name,
                        "source": "https://data.worldbank.org/indicator/NV.IND.TOTL.ZS",
                        "source_name": f"World Bank WDI ({year})"
                    }
            
            logger.debug(f"No non-null values found for {country_code}")
            return None
            
        except Exception as e:
            logger.error(f"Error parsing World Bank response for {country_code}: {e}")
            return None
    
    async def fetch_indicator(
        self, 
        country_code: str, 
        indicator: str,
        indicator_name: str = "unknown"
    ) -> Optional[dict]:
        """
        Fetch a specific indicator for a single country.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            indicator: World Bank indicator code (e.g., "NV.IND.TOTL.ZS")
            indicator_name: Human-readable name for logging
            
        Returns:
            Dict with value, year, source or None if unavailable
        """
        url = self._build_url(country_code, indicator)
        params = {
            "format": "json",
            "per_page": 50,  # Get enough years to find recent data
            "mrv": 10,  # Most recent 10 values
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.get(url, params=params)
                
                if response.status_code == 404:
                    logger.debug(f"No {indicator_name} data for {country_code}")
                    return None
                
                response.raise_for_status()
                data = response.json()
                
                return self._parse_response(data, country_code, indicator_name)
                
        except httpx.TimeoutException:
            logger.error(f"Timeout fetching World Bank {indicator_name} for {country_code}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching World Bank data for {country_code}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching World Bank data for {country_code}: {e}")
            return None
    
    async def fetch_industry_pct_gdp(self, country_code: str) -> Optional[dict]:
        """Fetch Industry value added (% of GDP) for a country."""
        return await self.fetch_indicator(
            country_code, 
            INDICATORS["industry_pct_gdp"],
            "Industry % GDP"
        )
    
    async def fetch_governance_score(self, country_code: str) -> Optional[dict]:
        """
        Fetch Government Effectiveness score for a country.
        
        Maps to: Governance Layer - Strategic Capacity Score
        
        WB GE.EST ranges from -2.5 (weak) to +2.5 (strong).
        We normalize to 0-100 scale for consistency.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with normalized value (0-100), year, source or None
        """
        result = await self.fetch_indicator(
            country_code,
            INDICATORS["gov_effectiveness"],
            "Government Effectiveness"
        )
        
        if result:
            # Normalize from -2.5..+2.5 to 0..100
            raw_value = result["value"]
            normalized = round(((raw_value + 2.5) / 5.0) * 100, 1)
            result["raw_value"] = raw_value
            result["value"] = max(0, min(100, normalized))  # Clamp to 0-100
            result["source"] = "https://data.worldbank.org/indicator/GE.EST"
        
        return result
    
    async def fetch_vulnerable_employment(self, country_code: str) -> Optional[dict]:
        """
        Fetch Vulnerable Employment percentage for a country.
        
        Maps to: Pillar 2 - Migrant/Vulnerable Score
        
        Vulnerable employment = own-account + contributing family workers.
        High values indicate large informal sector with poor OH coverage.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value (0-100%), year, source or None
        """
        result = await self.fetch_indicator(
            country_code,
            INDICATORS["vulnerable_employment"],
            "Vulnerable Employment"
        )
        
        if result:
            result["source"] = "https://data.worldbank.org/indicator/SL.EMP.VULN.ZS"
        
        return result
    
    async def fetch_health_expenditure(self, country_code: str) -> Optional[dict]:
        """
        Fetch Health Expenditure as % of GDP for a country.
        
        Maps to: Pillar 3 - Rehab Access (Proxy)
        
        Higher health spending correlates with better rehabilitation
        infrastructure and occupational health services.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value (% GDP), year, source or None
        """
        result = await self.fetch_indicator(
            country_code,
            INDICATORS["health_expenditure"],
            "Health Expenditure"
        )
        
        if result:
            result["source"] = "https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS"
        
        return result
    
    def _run_async_sync(self, coro):
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
    
    def fetch_industry_pct_gdp_sync(self, country_code: str) -> Optional[dict]:
        """
        Synchronous method to fetch industry % GDP for a single country.
        
        Used by the resilient pipeline for per-country processing.
        
        Args:
            country_code: ISO 3166-1 alpha-3 country code
            
        Returns:
            Dict with value, year, source or None if unavailable
        """
        return self._run_async_sync(self.fetch_industry_pct_gdp(country_code))
    
    def fetch_governance_score_sync(self, country_code: str) -> Optional[dict]:
        """Synchronous wrapper for Government Effectiveness fetch."""
        return self._run_async_sync(self.fetch_governance_score(country_code))
    
    def fetch_vulnerable_employment_sync(self, country_code: str) -> Optional[dict]:
        """Synchronous wrapper for Vulnerable Employment fetch."""
        return self._run_async_sync(self.fetch_vulnerable_employment(country_code))
    
    def fetch_health_expenditure_sync(self, country_code: str) -> Optional[dict]:
        """Synchronous wrapper for Health Expenditure fetch."""
        return self._run_async_sync(self.fetch_health_expenditure(country_code))
    
    async def fetch_all_context_indicators(self, country_code: str) -> Dict[str, Optional[dict]]:
        """
        Fetch all contextual indicators for a country.
        
        Returns:
            Dict with all indicator results
        """
        return {
            "industry_pct_gdp": await self.fetch_industry_pct_gdp(country_code),
            "gov_effectiveness": await self.fetch_governance_score(country_code),
            "vulnerable_employment": await self.fetch_vulnerable_employment(country_code),
            "health_expenditure": await self.fetch_health_expenditure(country_code),
        }
    
    def fetch_all_context_indicators_sync(self, country_code: str) -> Dict[str, Optional[dict]]:
        """Synchronous wrapper to fetch all context indicators."""
        return self._run_async_sync(self.fetch_all_context_indicators(country_code))
    
    async def fetch_all_industry_data(self) -> Dict[str, dict]:
        """
        Fetch industry % GDP for all target countries.
        
        Returns:
            Dict mapping country codes to their industry data
            Example: {"DEU": {"value": 27.1, "year": 2022, "source": "..."}}
        """
        results = {}
        
        for country_code in self.target_countries:
            logger.info(f"Fetching World Bank industry data for {country_code}...")
            result = await self.fetch_industry_pct_gdp(country_code)
            
            if result:
                results[country_code] = result
                logger.info(f"  {country_code}: {result['value']}% ({result['year']})")
            else:
                logger.warning(f"  {country_code}: No data available")
        
        return results


# Synchronous wrapper for non-async contexts
def fetch_industry_data_sync() -> Dict[str, dict]:
    """
    Synchronous wrapper to fetch all industry data.
    Use this in non-async contexts like standalone scripts.
    """
    client = WorldBankClient()
    
    # Handle running loop in different contexts
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    
    if loop and loop.is_running():
        # We're in an async context, create a new thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, client.fetch_all_industry_data())
            return future.result()
    else:
        return asyncio.run(client.fetch_all_industry_data())


if __name__ == "__main__":
    # Test the client
    logging.basicConfig(level=logging.INFO)
    results = fetch_industry_data_sync()
    print("\n=== World Bank Industry Data ===")
    for code, data in results.items():
        print(f"{code}: {data}")
