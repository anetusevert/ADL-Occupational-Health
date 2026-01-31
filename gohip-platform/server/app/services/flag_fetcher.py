"""
GOHIP Platform - Flag Fetcher Service
======================================

Fetches country flag images from Wikipedia/Wikimedia Commons
and stores them locally for use in the application.

Phase 25: Visual Enhancement - Country Flags
Phase 27: Enhanced flag fetching for all 195 countries with DB check
"""

import os
import httpx
import asyncio
from pathlib import Path
from typing import Optional, Dict, List
import logging

# Import complete country names from targets
from app.data.targets import COUNTRY_NAMES

logger = logging.getLogger(__name__)

# Directory for storing flag images
FLAGS_DIR = Path(__file__).parent.parent.parent / "static" / "flags"

# Wikipedia API endpoint for querying images
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

# Wikipedia article name overrides for countries with non-standard names
# These override the names from COUNTRY_NAMES for Wikipedia lookups
WIKIPEDIA_NAME_OVERRIDES: Dict[str, str] = {
    "CIV": "Ivory Coast",  # Côte d'Ivoire
    "COD": "the Democratic Republic of the Congo",
    "PRK": "North Korea",
    "KOR": "South Korea", 
    "LAO": "Laos",
    "FSM": "the Federated States of Micronesia",
    "MKD": "North Macedonia",
    "PSE": "Palestine",
    "TWN": "Taiwan",
    "VAT": "Vatican City",
    "VNM": "Vietnam",
    "SWZ": "Eswatini",  # Wikipedia uses Eswatini
    "TLS": "East Timor",  # Timor-Leste
    "MMR": "Myanmar",
    "BRN": "Brunei",
    "GMB": "the Gambia",
    "BHS": "the Bahamas",
    "COM": "the Comoros",
    "MHL": "the Marshall Islands",
    "SLB": "the Solomon Islands",
    "PHL": "the Philippines",
    "NLD": "the Netherlands",
    "ARE": "the United Arab Emirates",
    "GBR": "the United Kingdom",
    "USA": "the United States",
    "CZE": "the Czech Republic",
    "CAF": "the Central African Republic",
    "DOM": "the Dominican Republic",
}


def ensure_flags_directory():
    """Ensure the flags directory exists."""
    FLAGS_DIR.mkdir(parents=True, exist_ok=True)


def get_flag_path(iso_code: str) -> Path:
    """Get the local file path for a country's flag."""
    return FLAGS_DIR / f"{iso_code.lower()}.svg"


def get_flag_url(iso_code: str) -> str:
    """Get the URL path for serving a country's flag."""
    return f"/static/flags/{iso_code.lower()}.svg"


def get_wikipedia_name(iso_code: str, country_name: Optional[str] = None) -> str:
    """
    Get the Wikipedia article name for a country.
    
    Priority:
    1. WIKIPEDIA_NAME_OVERRIDES (for special cases)
    2. Provided country_name
    3. COUNTRY_NAMES from targets.py
    4. ISO code as fallback
    """
    # Check overrides first (highest priority for Wikipedia-specific naming)
    if iso_code in WIKIPEDIA_NAME_OVERRIDES:
        return WIKIPEDIA_NAME_OVERRIDES[iso_code]
    
    # Use provided name or lookup from complete country list
    name = country_name or COUNTRY_NAMES.get(iso_code, iso_code)
    return name


async def fetch_flag_from_wikipedia(iso_code: str, country_name: Optional[str] = None) -> Optional[str]:
    """
    Fetch a country's flag SVG from Wikipedia/Wikimedia Commons.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        country_name: Optional country name (uses lookup if not provided)
        
    Returns:
        Local URL path to the flag image, or None if failed
    """
    ensure_flags_directory()
    
    # Get the Wikipedia article name for this country
    wiki_name = get_wikipedia_name(iso_code, country_name)
    
    flag_path = get_flag_path(iso_code)
    
    # Skip if flag already exists
    if flag_path.exists():
        logger.debug(f"Flag already exists for {iso_code}")
        return get_flag_url(iso_code)
    
    try:
        headers = {
            "User-Agent": "GOHIP-Platform/1.0 (Occupational Health Intelligence; https://github.com/gohip)",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=30.0, headers=headers) as client:
            # Step 1: Get the flag image filename from Wikipedia
            # Query for the country's flag file name
            params = {
                "action": "query",
                "titles": f"Flag of {wiki_name}",
                "prop": "images",
                "format": "json",
            }
            
            response = await client.get(WIKIPEDIA_API, params=params)
            data = response.json()
            
            # Find the SVG flag file
            pages = data.get("query", {}).get("pages", {})
            flag_filename = None
            
            for page in pages.values():
                images = page.get("images", [])
                for img in images:
                    title = img.get("title", "")
                    # Look for SVG flags
                    if "Flag" in title and title.endswith(".svg"):
                        flag_filename = title.replace("File:", "")
                        break
                if flag_filename:
                    break
            
            if not flag_filename:
                # Try alternative: direct flag file name
                flag_filename = f"Flag_of_{wiki_name.replace(' ', '_')}.svg"
            
            # Step 2: Get the actual image URL from Wikimedia Commons
            params = {
                "action": "query",
                "titles": f"File:{flag_filename}",
                "prop": "imageinfo",
                "iiprop": "url",
                "format": "json",
            }
            
            response = await client.get(WIKIPEDIA_API, params=params)
            data = response.json()
            
            # Extract the image URL
            pages = data.get("query", {}).get("pages", {})
            image_url = None
            
            for page in pages.values():
                imageinfo = page.get("imageinfo", [])
                if imageinfo:
                    image_url = imageinfo[0].get("url")
                    break
            
            if not image_url:
                logger.warning(f"Could not find flag URL for {iso_code} ({wiki_name})")
                return None
            
            # Step 3: Download the flag image
            response = await client.get(image_url)
            
            if response.status_code == 200:
                # Save the SVG file
                flag_path.write_bytes(response.content)
                logger.info(f"Downloaded flag for {iso_code}")
                return get_flag_url(iso_code)
            else:
                logger.warning(f"Failed to download flag for {iso_code}: HTTP {response.status_code}")
                return None
                
    except Exception as e:
        logger.error(f"Error fetching flag for {iso_code}: {e}")
        return None


async def fetch_flags_for_countries(iso_codes: list[str]) -> dict[str, Optional[str]]:
    """
    Fetch flags for multiple countries concurrently.
    
    Args:
        iso_codes: List of ISO 3166-1 alpha-3 country codes
        
    Returns:
        Dict mapping ISO codes to flag URLs (or None if failed)
    """
    ensure_flags_directory()
    
    results = {}
    
    # Process in batches to avoid overwhelming Wikipedia
    batch_size = 5
    for i in range(0, len(iso_codes), batch_size):
        batch = iso_codes[i:i + batch_size]
        tasks = [fetch_flag_from_wikipedia(code) for code in batch]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for code, result in zip(batch, batch_results):
            if isinstance(result, Exception):
                logger.error(f"Exception fetching flag for {code}: {result}")
                results[code] = None
            else:
                results[code] = result
        
        # Small delay between batches to be nice to Wikipedia
        if i + batch_size < len(iso_codes):
            await asyncio.sleep(0.5)
    
    return results


def get_existing_flag_url(iso_code: str) -> Optional[str]:
    """
    Get the URL for an existing flag (without fetching).
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        
    Returns:
        URL path if flag exists locally, None otherwise
    """
    flag_path = get_flag_path(iso_code)
    if flag_path.exists():
        return get_flag_url(iso_code)
    return None


async def fetch_flags_for_countries_smart(
    iso_codes: List[str], 
    db_session
) -> Dict[str, Optional[str]]:
    """
    Fetch flags only for countries that don't already have one.
    Checks both database and local files before fetching.
    
    This is the preferred method for ETL - it avoids redundant fetches
    for countries that already have flags in the database.
    
    Args:
        iso_codes: List of ISO 3166-1 alpha-3 country codes
        db_session: SQLAlchemy database session
        
    Returns:
        Dict mapping ISO codes to flag URLs (or None if failed)
    """
    from app.models.country import Country
    
    ensure_flags_directory()
    
    results = {}
    codes_to_fetch = []
    skipped_db = 0
    skipped_file = 0
    
    logger.info(f"Smart flag fetch: Checking {len(iso_codes)} countries...")
    
    for iso_code in iso_codes:
        # Check database first - if flag_url is set and file exists, skip
        country = db_session.query(Country).filter(Country.iso_code == iso_code).first()
        
        if country and country.flag_url:
            # Verify local file also exists
            flag_path = get_flag_path(iso_code)
            if flag_path.exists():
                results[iso_code] = country.flag_url
                skipped_db += 1
                continue  # Skip - already have flag in DB and file
        
        # Check local file even if DB doesn't have it
        flag_path = get_flag_path(iso_code)
        if flag_path.exists():
            results[iso_code] = get_flag_url(iso_code)
            skipped_file += 1
            continue  # Skip - file exists (will be saved to DB later)
        
        # Need to fetch this flag
        codes_to_fetch.append(iso_code)
    
    logger.info(f"Smart flag fetch: Skipped {skipped_db} (in DB), {skipped_file} (file only), fetching {len(codes_to_fetch)} new flags")
    
    # Fetch only missing flags
    if codes_to_fetch:
        fetched = await fetch_flags_for_countries(codes_to_fetch)
        results.update(fetched)
        
        # Count successful fetches
        success_count = sum(1 for url in fetched.values() if url)
        logger.info(f"Smart flag fetch: Successfully fetched {success_count}/{len(codes_to_fetch)} new flags")
    
    return results


def get_countries_missing_flags(db_session) -> List[str]:
    """
    Get list of country ISO codes that don't have flags in the database.
    
    Args:
        db_session: SQLAlchemy database session
        
    Returns:
        List of ISO codes for countries missing flags
    """
    from app.models.country import Country
    
    countries = db_session.query(Country).filter(
        (Country.flag_url == None) | (Country.flag_url == "")
    ).all()
    
    return [c.iso_code for c in countries]
