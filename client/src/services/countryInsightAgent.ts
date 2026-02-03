/**
 * Country Insight AI Agent Service
 * 
 * Generates rich, contextual content about countries for the Country Insights feature.
 * Now aligned with OH-focused categories:
 * - Culture & Society (workplace culture, social norms)
 * - OH Infrastructure (rehab centers, institutions)
 * - Industry & Economy (high-risk sectors)
 * - Urban Development (facility distribution)
 * - Workforce Demographics (migrant workers, vulnerable populations)
 * - Political Capacity (government ability to drive change)
 * 
 * Features:
 * - Consulting-style analysis format
 * - "What is X?" and "What does this mean for OH?" sections
 * - Pre-generated content for major countries
 * - API integration for persistence
 */

import type { ImageCategory } from "./unsplashService";
import type { CountryIntelligence } from "../pages/CountryDashboard";
import { apiClient } from "./api";

// ============================================================================
// TYPES
// ============================================================================

export interface CountryInsightContent {
  category: ImageCategory;
  countryIso: string;
  whatIsAnalysis: string;     // "What is X?" - 3-4 paragraphs
  ohImplications: string;     // "What does this mean for OH?" - 3-4 paragraphs
  // Legacy fields for backwards compatibility
  overview: string;
  keyPoints: string[];
  context: string;
  generatedAt: string;
  status: "pending" | "generating" | "completed" | "error";
}

// API response type
interface InsightApiResponse {
  id: number;
  country_iso: string;
  category: string;
  images: { url: string; thumbnail_url?: string; alt: string; photographer?: string }[];
  what_is_analysis: string | null;
  oh_implications: string | null;
  status: string;
  error_message: string | null;
  generated_at: string | null;
}

// ============================================================================
// CACHE
// ============================================================================

const insightCache: Record<string, CountryInsightContent> = {};

// ============================================================================
// PRE-GENERATED CONTENT
// ============================================================================

interface CountryInsightData {
  culture: { overview: string; keyPoints: string[]; context: string };
  landmarks: { overview: string; keyPoints: string[]; context: string };
  industry: { overview: string; keyPoints: string[]; context: string };
  cityscape: { overview: string; keyPoints: string[]; context: string };
  people: { overview: string; keyPoints: string[]; context: string };
  political: { overview: string; keyPoints: string[]; context: string };
}

const COUNTRY_INSIGHTS: Record<string, CountryInsightData> = {
  USA: {
    culture: {
      overview: "The United States is a cultural melting pot, blending influences from Native American heritage, European colonization, African traditions, and waves of immigration from around the world. American culture emphasizes individualism, innovation, and diversity, manifested through its globally influential entertainment industry, sports traditions, and regional cuisines.",
      keyPoints: [
        "Hollywood and the entertainment industry shape global popular culture",
        "Diverse regional cultures from New England to the Deep South to the West Coast",
        "Strong tradition of philanthropy and volunteerism",
        "Major contributions to music including jazz, blues, rock, and hip-hop"
      ],
      context: "Cultural diversity drives workplace dynamics and occupational health considerations across different communities."
    },
    landmarks: {
      overview: "From the Statue of Liberty welcoming immigrants to New York Harbor to the Grand Canyon's ancient geological wonder, American landmarks represent both natural beauty and human achievement. National parks, historic monuments, and modern architectural marvels attract millions of visitors annually.",
      keyPoints: [
        "Grand Canyon, Yellowstone, and 62 other national parks preserve natural heritage",
        "Statue of Liberty symbolizes freedom and immigration history",
        "Mount Rushmore commemorates presidential leadership",
        "Golden Gate Bridge represents engineering excellence"
      ],
      context: "Tourism and hospitality represent significant employment sectors with unique occupational health challenges."
    },
    industry: {
      overview: "The United States has the world's largest economy by nominal GDP, driven by advanced technology, financial services, healthcare, and manufacturing sectors. Silicon Valley leads global tech innovation, while traditional industries like automotive, aerospace, and energy continue to evolve.",
      keyPoints: [
        "Technology sector drives economic growth with companies like Apple, Google, Microsoft",
        "Healthcare represents 18% of GDP with complex workforce needs",
        "Advanced manufacturing increasingly relies on automation and robotics",
        "Energy sector transitioning with significant renewable growth"
      ],
      context: "Industry diversification creates varied occupational health requirements across sectors."
    },
    cityscape: {
      overview: "American cities showcase the evolution from industrial powerhouses to modern service economies. New York's skyline, Chicago's architecture, Los Angeles's sprawl, and emerging tech hubs like Austin demonstrate urban diversity. Cities face challenges of infrastructure renewal, housing affordability, and sustainable development.",
      keyPoints: [
        "New York City serves as the global financial capital",
        "Major cities experiencing urban renewal and smart city initiatives",
        "Suburban growth continues alongside urban density increases",
        "Infrastructure investment addressing aging systems"
      ],
      context: "Urban development patterns influence commute patterns, air quality, and workplace distribution."
    },
    people: {
      overview: "With over 330 million people, the U.S. workforce is one of the world's most productive. The population is aging, diversifying, and increasingly educated. Labor markets show strong entrepreneurship, gig economy growth, and ongoing debates about work-life balance and worker protections.",
      keyPoints: [
        "Workforce increasingly diverse with 40% minority representation",
        "Rising educational attainment with 37% holding bachelor's degrees",
        "Gig economy represents 36% of workforce in some capacity",
        "Aging workforce with 23% over 55 years old"
      ],
      context: "Workforce demographics directly impact occupational health priorities and service delivery approaches."
    },
    political: {
      overview: "The United States operates as a federal constitutional republic with a strong separation of powers. The political system features checks and balances between executive, legislative, and judicial branches at both federal and state levels, affecting regulatory frameworks including occupational health and safety.",
      keyPoints: [
        "OSHA establishes and enforces workplace safety standards",
        "State-level variation in worker protection laws",
        "Ongoing policy debates on healthcare and worker benefits",
        "Federal-state coordination in enforcement"
      ],
      context: "Political dynamics influence occupational health policy development and enforcement priorities."
    }
  },
  SAU: {
    culture: {
      overview: "Saudi Arabia's culture is deeply rooted in Islamic traditions and Arab heritage. The Kingdom is the custodian of Islam's two holiest sites, Mecca and Medina. Vision 2030 is driving cultural transformation, opening entertainment sectors, promoting tourism, and celebrating Saudi heritage while maintaining Islamic values.",
      keyPoints: [
        "Custodian of Islam's holiest sites welcomes millions of pilgrims annually",
        "Vision 2030 driving cultural entertainment and tourism development",
        "Traditional hospitality and family values remain central",
        "Growing arts and entertainment sector with concerts and events"
      ],
      context: "Cultural transformation creates new industries while traditional values inform workplace expectations."
    },
    landmarks: {
      overview: "Saudi Arabia features ancient archaeological wonders like Mada'in Saleh (Al-Ula), the historic Diriyah district, and modern marvels including the under-construction NEOM megacity. The Kingdom is developing tourism infrastructure to showcase its diverse heritage from desert landscapes to Red Sea coastlines.",
      keyPoints: [
        "Mada'in Saleh (Hegra) is a UNESCO World Heritage Site with Nabataean tombs",
        "Diriyah, birthplace of the Saudi state, undergoing major restoration",
        "NEOM representing futuristic urban development vision",
        "Red Sea Project developing sustainable luxury tourism"
      ],
      context: "Tourism development creates new employment sectors requiring occupational health frameworks."
    },
    industry: {
      overview: "Saudi Arabia is transforming from an oil-dependent economy to a diversified powerhouse under Vision 2030. While petroleum remains significant, investments in technology, entertainment, tourism, and manufacturing are creating new economic pillars. ARAMCO remains the world's most valuable company.",
      keyPoints: [
        "Oil sector transitioning with focus on downstream petrochemicals",
        "NEOM, Red Sea, and giga-projects driving diversification",
        "Manufacturing localization through 'Made in Saudi' initiatives",
        "Technology sector growth with cloud computing investments"
      ],
      context: "Economic diversification requires adapting occupational health frameworks to emerging industries."
    },
    cityscape: {
      overview: "Saudi cities are experiencing unprecedented transformation. Riyadh aims to become a top 10 global city, while Jeddah serves as the commercial gateway and NEOM represents futuristic urban vision. Smart city technologies and sustainable development guide new projects.",
      keyPoints: [
        "Riyadh targeting 15 million population as global business hub",
        "Jeddah developing waterfront and historic district",
        "NEOM's THE LINE project reimagining urban living",
        "Massive infrastructure investment in transportation and utilities"
      ],
      context: "Rapid urbanization intensifies need for comprehensive workplace safety in construction and services."
    },
    people: {
      overview: "Saudi Arabia's population of 35 million includes 12 million expatriate workers essential to the economy. Saudization policies aim to increase national workforce participation, particularly among women whose employment has grown dramatically. Youth unemployment remains a policy focus.",
      keyPoints: [
        "Women's workforce participation increased from 17% to 33% since 2017",
        "Youth represent 70% of population, driving workforce growth",
        "Saudization targets increasing in most sectors",
        "Significant investment in education and skills development"
      ],
      context: "Workforce nationalization and women's participation create evolving occupational health priorities."
    },
    political: {
      overview: "Saudi Arabia is an absolute monarchy with King Salman as head of state and Crown Prince Mohammed bin Salman driving modernization through Vision 2030. GOSI (General Organization for Social Insurance) plays a central role in worker protection and compensation.",
      keyPoints: [
        "Vision 2030 establishing ambitious reform agenda",
        "GOSI modernizing occupational health and insurance systems",
        "Labor law reforms improving worker protections",
        "Regulatory modernization across all sectors"
      ],
      context: "Political commitment to reform drives significant occupational health system improvements."
    }
  },
  DEU: {
    culture: {
      overview: "Germany combines rich cultural heritage with modern innovation. From classical music and philosophy to engineering excellence and environmental leadership, German culture values precision, quality, and social responsibility. Strong traditions of craftsmanship and the dual education system shape workforce culture.",
      keyPoints: [
        "Engineering excellence and 'Made in Germany' quality reputation",
        "Strong environmental consciousness and sustainability culture",
        "Dual education system combining apprenticeship with schooling",
        "Rich traditions in music, philosophy, and arts"
      ],
      context: "Cultural emphasis on quality and training creates strong occupational health awareness."
    },
    landmarks: {
      overview: "Germany features diverse landmarks from medieval castles to modern architectural achievements. The Brandenburg Gate symbolizes reunification, Neuschwanstein Castle inspired Disney, and the Cologne Cathedral represents Gothic mastery. Industrial heritage sites showcase Germany's manufacturing history.",
      keyPoints: [
        "Brandenburg Gate symbolizes German reunification",
        "46 UNESCO World Heritage Sites across the country",
        "Industrial heritage preserved in Ruhr region",
        "Berlin's museums and memorials attract millions"
      ],
      context: "Heritage preservation and tourism create diverse employment and safety considerations."
    },
    industry: {
      overview: "Germany is Europe's largest economy and a global manufacturing powerhouse. The automotive industry (Volkswagen, BMW, Daimler), machinery, chemicals, and increasingly digital industries drive growth. The Mittelstand (mid-sized companies) form the backbone of industrial strength.",
      keyPoints: [
        "Automotive industry employs 800,000+ directly",
        "Machinery and equipment leading export sector",
        "Industry 4.0 driving digital manufacturing transformation",
        "Mittelstand companies drive innovation and employment"
      ],
      context: "Advanced manufacturing requires sophisticated occupational health systems and expertise."
    },
    cityscape: {
      overview: "German cities balance historic preservation with modern development. Berlin serves as the reunified capital, Munich combines tradition with tech, and Frankfurt is the financial center. Cities prioritize public transport, cycling infrastructure, and sustainable development.",
      keyPoints: [
        "Berlin emerging as major startup and tech hub",
        "Frankfurt serves as European financial center",
        "Munich combines traditional industry with tech innovation",
        "Strong urban planning and public transportation"
      ],
      context: "Urban planning and transport infrastructure influence commuting patterns and workplace access."
    },
    people: {
      overview: "Germany's 83 million population faces demographic challenges with an aging workforce. High skill levels, strong labor unions, and comprehensive social protections characterize the labor market. Immigration addresses workforce gaps while integration remains a policy focus.",
      keyPoints: [
        "Highly skilled workforce with strong vocational training",
        "Demographic challenge with aging population",
        "Strong labor union representation and co-determination",
        "Immigration addressing labor shortages"
      ],
      context: "Aging workforce and high skill levels shape occupational health priorities."
    },
    political: {
      overview: "Germany operates as a federal parliamentary republic with strong social market economy principles. The Berufsgenossenschaften (BG) system provides world-leading occupational health insurance combining prevention, rehabilitation, and compensation.",
      keyPoints: [
        "Berufsgenossenschaften system as global OH best practice model",
        "Strong worker co-determination in company governance",
        "Federal system with state-level variations",
        "Comprehensive social protection framework"
      ],
      context: "Germany's BG system is a global benchmark for occupational health governance."
    }
  }
};

// Default content generator for countries without specific data
function generateDefaultContent(
  countryName: string,
  category: ImageCategory,
  intelligence: CountryIntelligence | null
): CountryInsightData[ImageCategory] {
  const defaults: Record<ImageCategory, CountryInsightData[ImageCategory]> = {
    culture: {
      overview: `${countryName} has a rich cultural heritage shaped by its history, geography, and people. Traditional values blend with modern influences, creating a unique national identity that influences social norms, workplace culture, and community life.`,
      keyPoints: [
        "Cultural heritage influences workplace dynamics and expectations",
        "Traditional and modern values coexist in contemporary society",
        "Community and family play important roles in social structure",
        "Cultural events and traditions strengthen national identity"
      ],
      context: "Understanding cultural context is essential for effective occupational health programs."
    },
    landmarks: {
      overview: `${countryName} features distinctive landmarks that reflect its history and natural beauty. These sites attract visitors, support tourism industries, and serve as sources of national pride and identity.`,
      keyPoints: [
        "Historic and natural landmarks define national heritage",
        "Tourism sector creates employment opportunities",
        "Heritage preservation supports cultural identity",
        "Infrastructure development enhances accessibility"
      ],
      context: "Tourism and heritage sectors present specific occupational health considerations."
    },
    industry: {
      overview: `${countryName}'s economy encompasses various sectors contributing to national development. ${intelligence?.services_pct_gdp && intelligence.services_pct_gdp > 50 ? "Services lead the economy" : "Multiple sectors drive growth"}, with ongoing efforts to enhance productivity and competitiveness.`,
      keyPoints: [
        "Economic diversification efforts continue",
        "Key sectors drive employment and growth",
        "Technology adoption increasing across industries",
        "International trade relationships support development"
      ],
      context: "Industrial composition shapes occupational health priorities and requirements."
    },
    cityscape: {
      overview: `${countryName}'s cities reflect the nation's development trajectory, combining traditional areas with modern infrastructure. ${intelligence?.urban_population_pct ? `With ${intelligence.urban_population_pct.toFixed(0)}% urban population` : "Urbanization"} drives demand for services, housing, and transportation.`,
      keyPoints: [
        "Urban centers serve as economic and cultural hubs",
        "Infrastructure development supports growth",
        "Housing and transportation shape daily life",
        "Smart city initiatives emerging"
      ],
      context: "Urban development patterns influence workplace distribution and commuting."
    },
    people: {
      overview: `${countryName}'s workforce represents the nation's human capital foundation. ${intelligence?.labor_force_participation ? `With ${intelligence.labor_force_participation.toFixed(0)}% labor participation` : "Labor markets"} and demographic factors shape economic potential and social development priorities.`,
      keyPoints: [
        "Workforce composition evolving with demographic changes",
        "Education and skills development priorities",
        "Employment patterns reflect economic structure",
        "Social protection systems supporting workers"
      ],
      context: "Workforce characteristics directly impact occupational health needs and approaches."
    },
    political: {
      overview: `${countryName}'s political system provides the framework for governance, regulation, and public policy. Labor laws, social protection, and occupational health standards are shaped by political priorities and institutional capacity.`,
      keyPoints: [
        "Regulatory framework guides workplace standards",
        "Social protection policies support workers",
        "International commitments inform domestic policy",
        "Institutional capacity shapes enforcement"
      ],
      context: "Political and regulatory environment determines occupational health governance."
    }
  };

  return defaults[category];
}

// ============================================================================
// API INTEGRATION
// ============================================================================

// Map frontend categories to API categories
const CATEGORY_TO_API: Record<ImageCategory, string> = {
  culture: "culture",
  landmarks: "oh-infrastructure",
  industry: "industry",
  cityscape: "urban",
  people: "workforce",
  political: "political",
};

/**
 * Fetch insight from backend API
 */
export async function fetchInsightFromApi(
  countryIso: string,
  category: ImageCategory
): Promise<InsightApiResponse | null> {
  try {
    const apiCategory = CATEGORY_TO_API[category];
    const response = await apiClient.get(`/api/v1/insights/${countryIso}/${apiCategory}`);
    return response.data;
  } catch (error) {
    console.warn("Failed to fetch insight from API:", error);
    return null;
  }
}

/**
 * Request insight regeneration (admin only)
 */
export async function regenerateInsight(
  countryIso: string,
  category: ImageCategory
): Promise<{ success: boolean; message: string }> {
  try {
    const apiCategory = CATEGORY_TO_API[category];
    const response = await apiClient.post(`/api/v1/insights/${countryIso}/${apiCategory}/regenerate`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to regenerate insight:", error);
    return {
      success: false,
      message: error.response?.data?.detail || "Failed to regenerate insight"
    };
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate insight content for a country and category
 * 
 * Priority:
 * 1. Try to fetch from backend API (persistent storage)
 * 2. Use pre-generated content if available
 * 3. Generate default content as fallback
 */
export async function generateCountryInsight(
  countryIso: string,
  countryName: string,
  category: ImageCategory,
  intelligence: CountryIntelligence | null
): Promise<CountryInsightContent> {
  const cacheKey = `${countryIso}-${category}`;
  
  // Return cached result if available
  if (insightCache[cacheKey]) {
    return insightCache[cacheKey];
  }

  // Try to fetch from API first
  try {
    const apiResponse = await fetchInsightFromApi(countryIso, category);
    if (apiResponse && apiResponse.status === "completed" && apiResponse.what_is_analysis) {
      const result: CountryInsightContent = {
        category,
        countryIso,
        whatIsAnalysis: apiResponse.what_is_analysis || "",
        ohImplications: apiResponse.oh_implications || "",
        // Legacy compatibility
        overview: apiResponse.what_is_analysis?.split("\n\n")[0] || "",
        keyPoints: [],
        context: apiResponse.oh_implications?.split("\n\n")[0] || "",
        generatedAt: apiResponse.generated_at || new Date().toISOString(),
        status: apiResponse.status as CountryInsightContent["status"],
      };
      insightCache[cacheKey] = result;
      return result;
    }
  } catch (error) {
    console.warn("API fetch failed, using local content:", error);
  }

  // Simulate API call delay for realistic UX when using local content
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

  // Get pre-generated content or generate default
  const countryData = COUNTRY_INSIGHTS[countryIso];
  const content = countryData 
    ? countryData[category]
    : generateDefaultContent(countryName, category, intelligence);
  
  // Convert to new format with whatIsAnalysis and ohImplications
  const whatIsAnalysis = `${content.overview}\n\n${content.keyPoints.slice(0, 2).map(p => `${p}.`).join(" ")}`;
  const ohImplications = `${content.context}\n\n${content.keyPoints.slice(2).map(p => `${p}.`).join(" ")}`;
  
  const result: CountryInsightContent = {
    category,
    countryIso,
    whatIsAnalysis,
    ohImplications,
    // Legacy compatibility
    overview: content.overview,
    keyPoints: content.keyPoints,
    context: content.context,
    generatedAt: new Date().toISOString(),
    status: "completed",
  };

  // Cache the result
  insightCache[cacheKey] = result;

  return result;
}

/**
 * Clear insight cache
 */
export function clearInsightCache(): void {
  Object.keys(insightCache).forEach(key => delete insightCache[key]);
}
