"""
GOHIP Platform - Image Service
==============================

Dynamic image fetching from Unsplash API for country insights.
Falls back to curated images when API is unavailable.
"""

import os
import logging
from typing import List, Dict, Optional
import httpx

logger = logging.getLogger(__name__)

# Unsplash API configuration
UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"

# Category-specific search queries for better image relevance
CATEGORY_QUERIES = {
    "culture": "culture society people tradition landmark",
    "industry": "industry factory manufacturing industrial plant",
    "oh-infrastructure": "hospital healthcare medical facility clinic",
    "political": "government parliament politics administration building",
    "urban": "city skyline urban development cityscape architecture",
    "workforce": "workers employees workforce office factory labor",
    # Economic categories
    "labor-force": "workforce employment workers office business",
    "gdp-per-capita": "economy business finance trade commerce",
    "population": "people crowd city urban population",
    "unemployment": "job employment career business workplace",
    # Framework pillars
    "governance": "government regulation policy administration law",
    "hazard-control": "safety workplace industrial protection equipment",
    "vigilance": "monitoring surveillance health medical checkup",
    "restoration": "rehabilitation recovery medical therapy healthcare",
}

# Curated high-quality fallback images by country
CURATED_COUNTRY_IMAGES = {
    "SAU": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80", "alt": "Riyadh skyline", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80", "alt": "Saudi architecture", "photographer": "Unsplash"},
        ],
        "industry": [
            {"url": "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80", "alt": "Oil refinery", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "Industrial facility", "photographer": "Unsplash"},
        ],
    },
    "MEX": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80", "alt": "Mexico City", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1547995886-6dc09384c6e6?w=800&q=80", "alt": "Mexican architecture", "photographer": "Unsplash"},
        ],
        "industry": [
            {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "Manufacturing", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80", "alt": "Auto industry", "photographer": "Unsplash"},
        ],
    },
    "DEU": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80", "alt": "German cityscape", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1554072675-66db59dba46f?w=800&q=80", "alt": "German architecture", "photographer": "Unsplash"},
        ],
        "industry": [
            {"url": "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80", "alt": "German manufacturing", "photographer": "Unsplash"},
        ],
    },
    "USA": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80", "alt": "New York skyline", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80", "alt": "American cityscape", "photographer": "Unsplash"},
        ],
        "industry": [
            {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "US manufacturing", "photographer": "Unsplash"},
        ],
    },
    "GBR": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80", "alt": "London skyline", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&q=80", "alt": "British architecture", "photographer": "Unsplash"},
        ],
    },
    "CAN": {
        "culture": [
            {"url": "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80", "alt": "Toronto skyline", "photographer": "Unsplash"},
            {"url": "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80", "alt": "Canadian landscape", "photographer": "Unsplash"},
        ],
    },
}

# Default category images (fallback when no country-specific images)
DEFAULT_CATEGORY_IMAGES = {
    "culture": [
        {"url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", "alt": "Cultural scene", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80", "alt": "Society and culture", "photographer": "Unsplash"},
    ],
    "industry": [
        {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "Industrial facility", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80", "alt": "Manufacturing plant", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&q=80", "alt": "Oil and gas industry", "photographer": "Unsplash"},
    ],
    "oh-infrastructure": [
        {"url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", "alt": "Modern hospital", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&q=80", "alt": "Healthcare facility", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80", "alt": "Medical center", "photographer": "Unsplash"},
    ],
    "political": [
        {"url": "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800&q=80", "alt": "Government building", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1577416412292-747c6607f055?w=800&q=80", "alt": "Parliament", "photographer": "Unsplash"},
    ],
    "urban": [
        {"url": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", "alt": "City skyline", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80", "alt": "Urban development", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80", "alt": "Metropolitan area", "photographer": "Unsplash"},
    ],
    "workforce": [
        {"url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80", "alt": "Team collaboration", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80", "alt": "Professional workforce", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80", "alt": "Workers in industry", "photographer": "Unsplash"},
    ],
    # Economic categories
    "labor-force": [
        {"url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80", "alt": "Workforce", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80", "alt": "Employees", "photographer": "Unsplash"},
    ],
    "gdp-per-capita": [
        {"url": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80", "alt": "Business district", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", "alt": "Economy", "photographer": "Unsplash"},
    ],
    "population": [
        {"url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80", "alt": "City crowd", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80", "alt": "Urban population", "photographer": "Unsplash"},
    ],
    "unemployment": [
        {"url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", "alt": "Job search", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80", "alt": "Employment", "photographer": "Unsplash"},
    ],
    # Framework pillars
    "governance": [
        {"url": "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800&q=80", "alt": "Government", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1577416412292-747c6607f055?w=800&q=80", "alt": "Administration", "photographer": "Unsplash"},
    ],
    "hazard-control": [
        {"url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80", "alt": "Safety equipment", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80", "alt": "Industrial safety", "photographer": "Unsplash"},
    ],
    "vigilance": [
        {"url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80", "alt": "Health monitoring", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80", "alt": "Medical checkup", "photographer": "Unsplash"},
    ],
    "restoration": [
        {"url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", "alt": "Rehabilitation", "photographer": "Unsplash"},
        {"url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80", "alt": "Recovery center", "photographer": "Unsplash"},
    ],
}


async def search_unsplash(query: str, count: int = 3) -> List[Dict]:
    """
    Search Unsplash API for images matching query.
    
    Args:
        query: Search query string
        count: Number of images to return (max 30)
        
    Returns:
        List of image dictionaries with url, thumbnailUrl, alt, photographer
    """
    api_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not api_key:
        logger.warning("[ImageService] UNSPLASH_ACCESS_KEY not set - using fallback images. Set this env var for dynamic country-specific images.")
        return []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                UNSPLASH_API_URL,
                params={
                    "query": query,
                    "per_page": count,
                    "orientation": "landscape",
                },
                headers={"Authorization": f"Client-ID {api_key}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                if not results:
                    logger.debug(f"[ImageService] No Unsplash results for: {query}")
                    return []
                
                images = []
                for photo in results[:count]:
                    images.append({
                        "url": photo["urls"]["regular"],
                        "thumbnailUrl": photo["urls"]["small"],
                        "alt": photo.get("alt_description") or photo.get("description") or query,
                        "photographer": photo["user"]["name"],
                    })
                
                logger.info(f"[ImageService] Found {len(images)} Unsplash images for: {query}")
                return images
            
            elif response.status_code == 403:
                logger.warning("[ImageService] Unsplash API rate limit exceeded")
            else:
                logger.warning(f"[ImageService] Unsplash API error: {response.status_code}")
                
    except httpx.TimeoutException:
        logger.warning("[ImageService] Unsplash API timeout")
    except Exception as e:
        logger.error(f"[ImageService] Unsplash API error: {e}")
    
    return []


def get_fallback_images(country_iso: str, category: str, count: int = 3) -> List[Dict]:
    """
    Get fallback images from curated collections.
    
    Priority:
    1. Country-specific curated images
    2. Category default images
    3. Generic fallback
    """
    # Try country-specific images
    if country_iso in CURATED_COUNTRY_IMAGES:
        country_images = CURATED_COUNTRY_IMAGES[country_iso]
        if category in country_images:
            images = country_images[category][:count]
            if images:
                logger.debug(f"[ImageService] Using curated images for {country_iso}/{category}")
                return images
    
    # Try category defaults
    if category in DEFAULT_CATEGORY_IMAGES:
        images = DEFAULT_CATEGORY_IMAGES[category][:count]
        if images:
            logger.debug(f"[ImageService] Using default images for category: {category}")
            return images
    
    # Ultimate fallback
    logger.debug(f"[ImageService] Using generic fallback for {country_iso}/{category}")
    return [
        {"url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", "alt": "Business and economy", "photographer": "Unsplash"}
    ]


async def fetch_country_images(
    country_name: str,
    country_iso: str,
    category: str,
    count: int = 3
) -> List[Dict]:
    """
    Fetch images for a country/category combination.
    
    Tries Unsplash API first, falls back to curated images.
    
    Args:
        country_name: Full country name (e.g., "Saudi Arabia")
        country_iso: ISO code (e.g., "SAU")
        category: Insight category (e.g., "culture", "industry")
        count: Number of images to return
        
    Returns:
        List of image dictionaries
    """
    # Build search query
    category_keywords = CATEGORY_QUERIES.get(category, category.replace("-", " "))
    query = f"{country_name} {category_keywords}"
    
    logger.info(f"[ImageService] Fetching images for {country_name} ({country_iso}) - {category}")
    
    # Try Unsplash API first
    images = await search_unsplash(query, count)
    
    # Fallback to curated images if API fails or returns nothing
    if not images:
        logger.info(f"[ImageService] Using fallback images for {country_iso}/{category}")
        images = get_fallback_images(country_iso, category, count)
    else:
        logger.info(f"[ImageService] Successfully fetched {len(images)} images from Unsplash for {country_iso}/{category}")
    
    return images


# Synchronous wrapper for non-async contexts
def fetch_country_images_sync(
    country_name: str,
    country_iso: str,
    category: str,
    count: int = 3
) -> List[Dict]:
    """
    Synchronous version - just returns fallback images.
    Use async version when possible for API access.
    """
    return get_fallback_images(country_iso, category, count)
