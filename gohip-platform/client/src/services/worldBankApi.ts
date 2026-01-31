/**
 * Arthur D. Little - Global Health Platform
 * World Bank API Integration Service
 * Fetches country statistics from World Bank Open Data API
 */

// World Bank API indicator codes
export const WORLD_BANK_INDICATORS = {
  GDP_TOTAL: "NY.GDP.MKTP.CD",        // GDP (current US$)
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD",   // GDP per capita (current US$)
  POPULATION: "SP.POP.TOTL",          // Population, total
  LABOR_FORCE: "SL.TLF.TOTL.IN",      // Labor force, total
} as const;

export type IndicatorType = keyof typeof WORLD_BANK_INDICATORS;

// Mapping for display purposes
export const INDICATOR_META: Record<IndicatorType, {
  label: string;
  shortLabel: string;
  unit: string;
  format: "currency" | "number" | "population";
  sourceUrl: string;
}> = {
  GDP_TOTAL: {
    label: "GDP (Current US$)",
    shortLabel: "GDP Total",
    unit: "USD",
    format: "currency",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD",
  },
  GDP_PER_CAPITA: {
    label: "GDP Per Capita (Current US$)",
    shortLabel: "GDP/Capita",
    unit: "USD",
    format: "currency",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
  },
  POPULATION: {
    label: "Population, Total",
    shortLabel: "Population",
    unit: "",
    format: "population",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
  },
  LABOR_FORCE: {
    label: "Labor Force, Total",
    shortLabel: "Labor Force",
    unit: "",
    format: "population",
    sourceUrl: "https://data.worldbank.org/indicator/SL.TLF.TOTL.IN",
  },
};

// World Bank API response types
interface WorldBankCountryData {
  id: string;
  iso2Code: string;
  name: string;
  region: {
    id: string;
    iso2code: string;
    value: string;
  };
  incomeLevel: {
    id: string;
    iso2code: string;
    value: string;
  };
  capitalCity: string;
}

interface WorldBankIndicatorData {
  indicator: {
    id: string;
    value: string;
  };
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

// Our normalized data structures
export interface CountryWorldBankStats {
  isoCode: string;
  countryName: string;
  region: string;
  incomeLevel: string;
  gdpTotal: number | null;
  gdpPerCapita: number | null;
  population: number | null;
  laborForce: number | null;
  dataYear: string;
}

export interface CountryRanking {
  rank: number;
  isoCode: string;
  countryName: string;
  value: number;
  isCurrentCountry?: boolean;
}

export interface RankingData {
  indicator: IndicatorType;
  indicatorCode: string;
  totalCountries: number;
  currentCountry: CountryRanking | null;
  topCountries: CountryRanking[];
  bottomCountries: CountryRanking[];
  percentile: number;
  sourceUrl: string;
  dataYear: string;
}

const WORLD_BANK_BASE_URL = "https://api.worldbank.org/v2";

// Cache for API responses
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Convert ISO3 code to ISO2 code for World Bank API
 * World Bank prefers ISO2 codes
 */
function iso3ToIso2(iso3: string): string {
  const mapping: Record<string, string> = {
    DEU: "DE", GBR: "GB", USA: "US", SAU: "SA", POL: "PL",
    JPN: "JP", CHN: "CN", IND: "IN", BRA: "BR", AUS: "AU",
    FRA: "FR", ITA: "IT", CAN: "CA", KOR: "KR", MEX: "MX",
    IDN: "ID", TUR: "TR", NLD: "NL", CHE: "CH", ESP: "ES",
    SWE: "SE", NOR: "NO", DNK: "DK", FIN: "FI", AUT: "AT",
    BEL: "BE", IRL: "IE", PRT: "PT", GRC: "GR", CZE: "CZ",
    HUN: "HU", ROU: "RO", BGR: "BG", HRV: "HR", SVK: "SK",
    SVN: "SI", EST: "EE", LVA: "LV", LTU: "LT", LUX: "LU",
    MLT: "MT", CYP: "CY", RUS: "RU", UKR: "UA", ZAF: "ZA",
    EGY: "EG", NGA: "NG", KEN: "KE", ETH: "ET", TZA: "TZ",
    GHA: "GH", MAR: "MA", DZA: "DZ", TUN: "TN", AGO: "AO",
    PAK: "PK", BGD: "BD", VNM: "VN", THA: "TH", MYS: "MY",
    SGP: "SG", PHL: "PH", MMR: "MM", KHM: "KH", LAO: "LA",
    ARE: "AE", QAT: "QA", KWT: "KW", BHR: "BH", OMN: "OM",
    IRQ: "IQ", IRN: "IR", ISR: "IL", JOR: "JO", LBN: "LB",
    ARG: "AR", CHL: "CL", COL: "CO", PER: "PE", VEN: "VE",
    ECU: "EC", BOL: "BO", PRY: "PY", URY: "UY", NZL: "NZ",
  };
  return mapping[iso3.toUpperCase()] || iso3.substring(0, 2);
}

/**
 * Fetch data for a single indicator for a country
 */
async function fetchIndicatorData(
  isoCode: string,
  indicatorCode: string
): Promise<WorldBankIndicatorData | null> {
  const cacheKey = `indicator_${isoCode}_${indicatorCode}`;
  const cached = getCachedData<WorldBankIndicatorData>(cacheKey);
  if (cached) return cached;

  try {
    const iso2 = iso3ToIso2(isoCode);
    // Get the most recent year's data
    const url = `${WORLD_BANK_BASE_URL}/country/${iso2}/indicator/${indicatorCode}?format=json&per_page=1&mrnev=1`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // World Bank returns [metadata, data[]]
    if (Array.isArray(data) && data.length === 2 && Array.isArray(data[1]) && data[1].length > 0) {
      const result = data[1][0] as WorldBankIndicatorData;
      setCachedData(cacheKey, result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch indicator ${indicatorCode} for ${isoCode}:`, error);
    return null;
  }
}

/**
 * Fetch country metadata from World Bank
 */
async function fetchCountryMeta(isoCode: string): Promise<WorldBankCountryData | null> {
  const cacheKey = `country_meta_${isoCode}`;
  const cached = getCachedData<WorldBankCountryData>(cacheKey);
  if (cached) return cached;

  try {
    const iso2 = iso3ToIso2(isoCode);
    const url = `${WORLD_BANK_BASE_URL}/country/${iso2}?format=json`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length === 2 && Array.isArray(data[1]) && data[1].length > 0) {
      const result = data[1][0] as WorldBankCountryData;
      setCachedData(cacheKey, result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch country meta for ${isoCode}:`, error);
    return null;
  }
}

/**
 * Fetch all World Bank statistics for a country
 */
export async function fetchCountryWorldBankData(
  isoCode: string
): Promise<CountryWorldBankStats | null> {
  const cacheKey = `country_full_${isoCode}`;
  const cached = getCachedData<CountryWorldBankStats>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch all data in parallel
    const [countryMeta, gdpTotal, gdpPerCapita, population, laborForce] = await Promise.all([
      fetchCountryMeta(isoCode),
      fetchIndicatorData(isoCode, WORLD_BANK_INDICATORS.GDP_TOTAL),
      fetchIndicatorData(isoCode, WORLD_BANK_INDICATORS.GDP_PER_CAPITA),
      fetchIndicatorData(isoCode, WORLD_BANK_INDICATORS.POPULATION),
      fetchIndicatorData(isoCode, WORLD_BANK_INDICATORS.LABOR_FORCE),
    ]);

    const result: CountryWorldBankStats = {
      isoCode: isoCode.toUpperCase(),
      countryName: countryMeta?.name || gdpTotal?.country?.value || isoCode,
      region: countryMeta?.region?.value || "Unknown",
      incomeLevel: countryMeta?.incomeLevel?.value || "Unknown",
      gdpTotal: gdpTotal?.value || null,
      gdpPerCapita: gdpPerCapita?.value || null,
      population: population?.value || null,
      laborForce: laborForce?.value || null,
      dataYear: gdpTotal?.date || gdpPerCapita?.date || population?.date || "Unknown",
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Failed to fetch World Bank data for ${isoCode}:`, error);
    return null;
  }
}

/**
 * Fetch all countries' data for a specific indicator to create rankings
 */
export async function fetchGlobalRankings(
  indicatorType: IndicatorType,
  currentIsoCode: string
): Promise<RankingData | null> {
  const indicatorCode = WORLD_BANK_INDICATORS[indicatorType];
  const cacheKey = `rankings_${indicatorType}`;
  
  // Check cache
  const cached = getCachedData<{ rankings: CountryRanking[]; year: string }>(cacheKey);
  
  let rankings: CountryRanking[];
  let dataYear: string;

  if (cached) {
    rankings = cached.rankings;
    dataYear = cached.year;
  } else {
    try {
      // Fetch data for all countries (World Bank supports pagination)
      // mrnev=1 gets most recent non-empty value
      const url = `${WORLD_BANK_BASE_URL}/country/all/indicator/${indicatorCode}?format=json&per_page=300&mrnev=1`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
        throw new Error("Invalid response format");
      }

      const indicatorData = data[1] as WorldBankIndicatorData[];
      
      // Filter out null values and aggregates (regions, etc.)
      // World Bank includes aggregates with codes like "WLD", "EUU", etc.
      const aggregateCodes = new Set([
        "WLD", "EUU", "OED", "EAS", "ECS", "LCN", "MEA", "NAC", "SAS", "SSF",
        "AFE", "AFW", "ARB", "CEB", "CSS", "EAP", "EAR", "ECA", "EMU", "FCS",
        "HIC", "HPC", "IBD", "IBT", "IDA", "IDB", "IDX", "LAC", "LDC", "LIC",
        "LMC", "LMY", "LTE", "MIC", "MNA", "OEC", "OSS", "PRE", "PSS", "PST",
        "SXZ", "TEA", "TEC", "TLA", "TMN", "TSA", "TSS", "UMC", "WLD"
      ]);

      const validData = indicatorData.filter(
        d => d.value !== null && 
             d.countryiso3code && 
             !aggregateCodes.has(d.countryiso3code)
      );

      // Sort by value descending (highest first)
      validData.sort((a, b) => (b.value || 0) - (a.value || 0));

      rankings = validData.map((d, index) => ({
        rank: index + 1,
        isoCode: d.countryiso3code,
        countryName: d.country.value,
        value: d.value || 0,
      }));

      dataYear = validData[0]?.date || "Unknown";
      
      setCachedData(cacheKey, { rankings, year: dataYear });
    } catch (error) {
      console.error(`Failed to fetch global rankings for ${indicatorType}:`, error);
      return null;
    }
  }

  // Find current country in rankings
  const currentCountryIndex = rankings.findIndex(
    r => r.isoCode.toUpperCase() === currentIsoCode.toUpperCase()
  );
  
  const currentCountry = currentCountryIndex >= 0 
    ? { ...rankings[currentCountryIndex], isCurrentCountry: true }
    : null;

  const totalCountries = rankings.length;
  const percentile = currentCountry 
    ? Math.round(((totalCountries - currentCountry.rank + 1) / totalCountries) * 100)
    : 0;

  // Get top 10 and bottom 10
  const topCountries = rankings.slice(0, 10).map(r => ({
    ...r,
    isCurrentCountry: r.isoCode.toUpperCase() === currentIsoCode.toUpperCase()
  }));

  const bottomCountries = rankings.slice(-10).map(r => ({
    ...r,
    isCurrentCountry: r.isoCode.toUpperCase() === currentIsoCode.toUpperCase()
  }));

  return {
    indicator: indicatorType,
    indicatorCode,
    totalCountries,
    currentCountry,
    topCountries,
    bottomCountries,
    percentile,
    sourceUrl: INDICATOR_META[indicatorType].sourceUrl,
    dataYear,
  };
}

/**
 * Format a value based on indicator type
 */
export function formatIndicatorValue(
  value: number | null,
  indicatorType: IndicatorType
): string {
  if (value === null) return "N/A";
  
  const meta = INDICATOR_META[indicatorType];
  
  switch (meta.format) {
    case "currency":
      if (indicatorType === "GDP_TOTAL") {
        // GDP Total is in current US$, format as trillions/billions
        if (value >= 1e12) {
          return `$${(value / 1e12).toFixed(2)}T`;
        } else if (value >= 1e9) {
          return `$${(value / 1e9).toFixed(1)}B`;
        } else if (value >= 1e6) {
          return `$${(value / 1e6).toFixed(1)}M`;
        }
        return `$${value.toLocaleString()}`;
      } else {
        // GDP per capita
        return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      }
    
    case "population":
      // Format as millions/billions
      if (value >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
      } else if (value >= 1e6) {
        return `${(value / 1e6).toFixed(1)}M`;
      } else if (value >= 1e3) {
        return `${(value / 1e3).toFixed(1)}K`;
      }
      return value.toLocaleString();
    
    default:
      return value.toLocaleString();
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
