/**
 * GOHIP Platform - Region Definitions
 * Geographic and Economic Regional Groupings for Country Selection
 * 
 * Includes:
 * - GCC (Gulf Cooperation Council) - Special focus region
 * - Geographic regions (Africa, Americas, Asia, Europe, Oceania)
 * - EU (European Union) member states
 */

// =============================================================================
// GCC COUNTRIES (Special Focus Region)
// =============================================================================
export const GCC_COUNTRIES = ["SAU", "ARE", "QAT", "KWT", "BHR", "OMN"] as const;

// =============================================================================
// EU MEMBER STATES (27 countries)
// =============================================================================
export const EU_COUNTRIES = [
  "AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA",
  "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD",
  "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE"
] as const;

// =============================================================================
// GEOGRAPHIC REGIONS
// =============================================================================

export const AFRICA_COUNTRIES = [
  "DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CPV", "CMR", "CAF", "TCD",
  "COM", "COG", "COD", "CIV", "DJI", "EGY", "GNQ", "ERI", "SWZ", "ETH",
  "GAB", "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "LBY", "MDG",
  "MWI", "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA",
  "STP", "SEN", "SYC", "SLE", "SOM", "ZAF", "SSD", "SDN", "TZA", "TGO",
  "TUN", "UGA", "ZMB", "ZWE"
] as const;

export const AMERICAS_COUNTRIES = [
  "ATG", "ARG", "BHS", "BRB", "BLZ", "BOL", "BRA", "CAN", "CHL", "COL",
  "CRI", "CUB", "DMA", "DOM", "ECU", "SLV", "GRD", "GTM", "GUY", "HTI",
  "HND", "JAM", "MEX", "NIC", "PAN", "PRY", "PER", "KNA", "LCA", "VCT",
  "SUR", "TTO", "USA", "URY", "VEN"
] as const;

export const ASIA_COUNTRIES = [
  "AFG", "ARM", "AZE", "BHR", "BGD", "BTN", "BRN", "KHM", "CHN", "CYP",
  "GEO", "IND", "IDN", "IRN", "IRQ", "ISR", "JPN", "JOR", "KAZ", "KWT",
  "KGZ", "LAO", "LBN", "MYS", "MDV", "MNG", "MMR", "NPL", "PRK", "OMN",
  "PAK", "PHL", "QAT", "SAU", "SGP", "KOR", "LKA", "SYR", "TJK", "THA",
  "TLS", "TKM", "ARE", "UZB", "VNM", "YEM", "PSE", "TWN"
] as const;

export const EUROPE_COUNTRIES = [
  "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK",
  "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA",
  "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR",
  "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE",
  "CHE", "UKR", "GBR", "VAT"
] as const;

export const OCEANIA_COUNTRIES = [
  "AUS", "FJI", "KIR", "MHL", "FSM", "NRU", "NZL", "PLW", "PNG", "WSM",
  "SLB", "TON", "TUV", "VUT"
] as const;

// =============================================================================
// REGION INTERFACE & DEFINITIONS (Icon names as strings)
// =============================================================================

export type RegionIconName = "landmark" | "building2" | "compass" | "globe" | "mapPin" | "palmtree";

export interface RegionDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  countries: readonly string[];
  iconName: RegionIconName;
  color: string;
  gradient: string;
  glowColor: string;
  order: number;
}

export const REGIONS: Record<string, RegionDefinition> = {
  gcc: {
    id: "gcc",
    name: "Gulf Cooperation Council",
    shortName: "GCC",
    description: "Strategic focus region with 6 member states",
    countries: GCC_COUNTRIES,
    iconName: "landmark",
    color: "slate",
    gradient: "from-slate-700 to-slate-800",
    glowColor: "shadow-slate-500/5",
    order: 0,
  },
  europe: {
    id: "europe",
    name: "Europe",
    shortName: "Europe",
    description: "44 European nations including EU members",
    countries: EUROPE_COUNTRIES,
    iconName: "building2",
    color: "slate",
    gradient: "from-slate-700 to-slate-800",
    glowColor: "shadow-slate-500/5",
    order: 1,
  },
  asia: {
    id: "asia",
    name: "Asia & Pacific",
    shortName: "Asia",
    description: "48 countries across Asia and the Pacific Rim",
    countries: ASIA_COUNTRIES,
    iconName: "compass",
    color: "slate",
    gradient: "from-slate-700 to-slate-800",
    glowColor: "shadow-slate-500/5",
    order: 2,
  },
  americas: {
    id: "americas",
    name: "Americas",
    shortName: "Americas",
    description: "35 nations of North, Central, and South America",
    countries: AMERICAS_COUNTRIES,
    iconName: "globe",
    color: "slate",
    gradient: "from-slate-700 to-slate-800",
    glowColor: "shadow-slate-500/5",
    order: 3,
  },
  africa: {
    id: "africa",
    name: "Africa",
    shortName: "Africa",
    description: "54 African nations",
    countries: AFRICA_COUNTRIES,
    iconName: "mapPin",
    color: "slate",
    gradient: "from-slate-700 to-slate-800",
    glowColor: "shadow-slate-500/5",
    order: 4,
  },
  oceania: {
    id: "oceania",
    name: "Oceania",
    shortName: "Oceania",
    description: "14 Pacific island nations",
    countries: OCEANIA_COUNTRIES,
    iconName: "palmtree",
    color: "slate",
    gradient: "from-slate-700 to-slate-800",
    glowColor: "shadow-slate-500/5",
    order: 5,
  },
};

// Sorted regions array for consistent ordering
export const SORTED_REGIONS = Object.values(REGIONS).sort((a, b) => a.order - b.order);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Find which region(s) a country belongs to
 */
export function getCountryRegions(isoCode: string): RegionDefinition[] {
  return Object.values(REGIONS).filter(region => 
    region.countries.includes(isoCode)
  );
}

/**
 * Check if a country is in the GCC
 */
export function isGccCountry(isoCode: string): boolean {
  return GCC_COUNTRIES.includes(isoCode as typeof GCC_COUNTRIES[number]);
}

/**
 * Check if a country is in the EU
 */
export function isEuCountry(isoCode: string): boolean {
  return EU_COUNTRIES.includes(isoCode as typeof EU_COUNTRIES[number]);
}

/**
 * Get all unique countries across all regions
 */
export function getAllCountryCodes(): string[] {
  const allCodes = new Set<string>();
  Object.values(REGIONS).forEach(region => {
    region.countries.forEach(code => allCodes.add(code));
  });
  return Array.from(allCodes);
}

/**
 * Get the count of countries in each region
 */
export function getRegionCounts(): Record<string, number> {
  return Object.fromEntries(
    Object.entries(REGIONS).map(([key, region]) => [key, region.countries.length])
  );
}
