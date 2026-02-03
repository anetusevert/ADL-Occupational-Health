/**
 * Unsplash Service
 * 
 * Fetches country-specific images from Unsplash API.
 * Provides images for:
 * - Culture & traditions
 * - Famous landmarks
 * - Industry & economy
 * - Cityscapes & development
 * - People & workers
 * - Government & political buildings
 * 
 * Features:
 * - Caching to reduce API calls
 * - Fallback images for API failures
 * - Category-specific search queries
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CountryImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  altDescription: string;
  photographer: string;
  photographerUrl: string;
}

export interface CountryImageSet {
  culture: CountryImage | null;
  landmarks: CountryImage | null;
  industry: CountryImage | null;
  cityscape: CountryImage | null;
  people: CountryImage | null;
  political: CountryImage | null;
}

export type ImageCategory = keyof CountryImageSet;

// ============================================================================
// CONSTANTS
// ============================================================================

// Unsplash API access key (demo key for development - replace with env var in production)
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || "demo";

// Search queries for each category
const CATEGORY_QUERIES: Record<ImageCategory, (country: string) => string> = {
  culture: (country) => `${country} traditional culture festival`,
  landmarks: (country) => `${country} famous landmark monument`,
  industry: (country) => `${country} industry factory workers`,
  cityscape: (country) => `${country} city skyline downtown`,
  people: (country) => `${country} people street life`,
  political: (country) => `${country} government parliament building`,
};

// Category display names and descriptions
export const CATEGORY_INFO: Record<ImageCategory, { title: string; description: string; icon: string }> = {
  culture: { title: "Culture & Society", description: "Traditions, festivals, and cultural heritage", icon: "🎭" },
  landmarks: { title: "Famous Landmarks", description: "Iconic monuments and tourist attractions", icon: "🏛️" },
  industry: { title: "Industry & Economy", description: "Manufacturing, trade, and economic activity", icon: "🏭" },
  cityscape: { title: "Urban Development", description: "Modern cities and infrastructure", icon: "🌆" },
  people: { title: "People & Community", description: "Daily life and social dynamics", icon: "👥" },
  political: { title: "Political System", description: "Government and administrative structures", icon: "🏛️" },
};

// Fallback images per category (high-quality Unsplash photos with known IDs)
const FALLBACK_IMAGES: Record<ImageCategory, CountryImage> = {
  culture: {
    id: "fallback-culture",
    url: "https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=400&q=60",
    altDescription: "Cultural celebration",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
  },
  landmarks: {
    id: "fallback-landmarks",
    url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=60",
    altDescription: "Famous landmark",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
  },
  industry: {
    id: "fallback-industry",
    url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=60",
    altDescription: "Industrial facility",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
  },
  cityscape: {
    id: "fallback-cityscape",
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=60",
    altDescription: "City skyline",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
  },
  people: {
    id: "fallback-people",
    url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=60",
    altDescription: "Group of people",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
  },
  political: {
    id: "fallback-political",
    url: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=400&q=60",
    altDescription: "Government building",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
  },
};

// Country-specific curated images (hand-picked for quality)
const CURATED_COUNTRY_IMAGES: Record<string, Partial<CountryImageSet>> = {
  USA: {
    landmarks: {
      id: "usa-landmarks",
      url: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&q=60",
      altDescription: "Statue of Liberty, New York",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    cityscape: {
      id: "usa-cityscape",
      url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=60",
      altDescription: "New York City skyline",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    political: {
      id: "usa-political",
      url: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=400&q=60",
      altDescription: "US Capitol Building",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
  SAU: {
    landmarks: {
      id: "sau-landmarks",
      url: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=400&q=60",
      altDescription: "Masjid al-Haram, Mecca",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    cityscape: {
      id: "sau-cityscape",
      url: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=400&q=60",
      altDescription: "Riyadh skyline",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    culture: {
      id: "sau-culture",
      url: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&q=60",
      altDescription: "Saudi Arabian culture",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
  DEU: {
    landmarks: {
      id: "deu-landmarks",
      url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=60",
      altDescription: "Brandenburg Gate, Berlin",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    industry: {
      id: "deu-industry",
      url: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&q=60",
      altDescription: "German automotive industry",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
  GBR: {
    landmarks: {
      id: "gbr-landmarks",
      url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=60",
      altDescription: "London Tower Bridge",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    political: {
      id: "gbr-political",
      url: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&q=60",
      altDescription: "Houses of Parliament, London",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
  JPN: {
    landmarks: {
      id: "jpn-landmarks",
      url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=60",
      altDescription: "Mount Fuji with cherry blossoms",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    culture: {
      id: "jpn-culture",
      url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=60",
      altDescription: "Japanese temple and garden",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
    cityscape: {
      id: "jpn-cityscape",
      url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=60",
      altDescription: "Tokyo cityscape at night",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
  FRA: {
    landmarks: {
      id: "fra-landmarks",
      url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=60",
      altDescription: "Eiffel Tower, Paris",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
  AUS: {
    landmarks: {
      id: "aus-landmarks",
      url: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&q=60",
      altDescription: "Sydney Opera House",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
  SGP: {
    cityscape: {
      id: "sgp-cityscape",
      url: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=60",
      altDescription: "Singapore Marina Bay",
      photographer: "Unsplash",
      photographerUrl: "https://unsplash.com",
    },
  },
};

// ============================================================================
// CACHE
// ============================================================================

const imageCache: Record<string, CountryImageSet> = {};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Fetch a single image from Unsplash API
 */
async function fetchUnsplashImage(query: string): Promise<CountryImage | null> {
  if (UNSPLASH_ACCESS_KEY === "demo") {
    // Return null to trigger fallback when no API key
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Unsplash API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const photo = data.results?.[0];

    if (!photo) {
      return null;
    }

    return {
      id: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      altDescription: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
    };
  } catch (error) {
    console.warn("Error fetching Unsplash image:", error);
    return null;
  }
}

/**
 * Get image for a specific category and country
 * Uses curated images first, then API, then fallback
 */
export async function getCountryImage(
  isoCode: string,
  category: ImageCategory,
  countryName: string
): Promise<CountryImage> {
  // Check curated images first
  const curated = CURATED_COUNTRY_IMAGES[isoCode]?.[category];
  if (curated) {
    return curated;
  }

  // Try Unsplash API
  const query = CATEGORY_QUERIES[category](countryName);
  const apiImage = await fetchUnsplashImage(query);
  if (apiImage) {
    return apiImage;
  }

  // Return fallback
  return FALLBACK_IMAGES[category];
}

/**
 * Get all images for a country
 * Fetches all categories in parallel with caching
 */
export async function getCountryImages(
  isoCode: string,
  countryName: string
): Promise<CountryImageSet> {
  // Check cache first
  if (imageCache[isoCode]) {
    return imageCache[isoCode];
  }

  // Fetch all categories in parallel
  const categories: ImageCategory[] = ["culture", "landmarks", "industry", "cityscape", "people", "political"];
  
  const results = await Promise.all(
    categories.map(category => getCountryImage(isoCode, category, countryName))
  );

  const imageSet: CountryImageSet = {
    culture: results[0],
    landmarks: results[1],
    industry: results[2],
    cityscape: results[3],
    people: results[4],
    political: results[5],
  };

  // Cache the results
  imageCache[isoCode] = imageSet;

  return imageSet;
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
  Object.keys(imageCache).forEach(key => delete imageCache[key]);
}

/**
 * Get a single category image URL (sync, uses curated or fallback)
 * Useful for immediate display without async
 */
export function getCountryImageSync(isoCode: string, category: ImageCategory): CountryImage {
  const curated = CURATED_COUNTRY_IMAGES[isoCode]?.[category];
  return curated || FALLBACK_IMAGES[category];
}
