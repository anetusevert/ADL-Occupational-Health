import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the API base URL from environment or default
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
}

/**
 * Get the flag image URL for a country using external CDN
 * @param isoCode - The 3-letter ISO country code (e.g., "DEU", "USA")
 * @param _backendUrl - Deprecated, kept for backward compatibility
 */
export function getFlagImageUrl(isoCode: string, _backendUrl?: string): string {
  // Use external CDN for flags (more reliable than backend static files)
  const iso2 = getCountryISO2(isoCode);
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
}

/**
 * Convert ISO 3166-1 alpha-3 to alpha-2 code
 */
function getCountryISO2(iso3: string): string {
  const mapping: Record<string, string> = {
    'SAU': 'sa', 'ARE': 'ae', 'QAT': 'qa', 'KWT': 'kw', 'BHR': 'bh', 'OMN': 'om',
    'DEU': 'de', 'GBR': 'gb', 'USA': 'us', 'FRA': 'fr', 'ESP': 'es', 'ITA': 'it',
    'NLD': 'nl', 'BEL': 'be', 'AUT': 'at', 'CHE': 'ch', 'POL': 'pl', 'CZE': 'cz',
    'HUN': 'hu', 'ROU': 'ro', 'BGR': 'bg', 'GRC': 'gr', 'PRT': 'pt', 'SWE': 'se',
    'NOR': 'no', 'DNK': 'dk', 'FIN': 'fi', 'IRL': 'ie', 'SVK': 'sk', 'SVN': 'si',
    'HRV': 'hr', 'SRB': 'rs', 'BIH': 'ba', 'MKD': 'mk', 'ALB': 'al', 'MNE': 'me',
    'LVA': 'lv', 'LTU': 'lt', 'EST': 'ee', 'UKR': 'ua', 'BLR': 'by', 'MDA': 'md',
    'RUS': 'ru', 'ISL': 'is', 'LUX': 'lu', 'MLT': 'mt', 'CYP': 'cy', 'AND': 'ad',
    'JPN': 'jp', 'CHN': 'cn', 'KOR': 'kr', 'IND': 'in', 'AUS': 'au', 'NZL': 'nz',
    'BRA': 'br', 'MEX': 'mx', 'CAN': 'ca', 'ARG': 'ar', 'CHL': 'cl', 'COL': 'co',
    'ZAF': 'za', 'EGY': 'eg', 'NGA': 'ng', 'KEN': 'ke', 'MAR': 'ma', 'TUN': 'tn',
    'TUR': 'tr', 'ISR': 'il', 'JOR': 'jo', 'LBN': 'lb', 'SGP': 'sg', 'MYS': 'my',
    'THA': 'th', 'IDN': 'id', 'PHL': 'ph', 'VNM': 'vn',
  };
  const upper = iso3.toUpperCase();
  return mapping[upper] || iso3.slice(0, 2).toLowerCase();
}

/**
 * Get country flag emoji from ISO code
 * @param isoCode - The 2 or 3-letter ISO country code
 */
export function getCountryFlag(isoCode: string): string {
  // Comprehensive ISO 3166-1 alpha-3 to alpha-2 mapping
  const alpha3ToAlpha2: Record<string, string> = {
    // A
    AFG: "AF", ALB: "AL", DZA: "DZ", ASM: "AS", AND: "AD", AGO: "AO", AIA: "AI", ATA: "AQ",
    ATG: "AG", ARG: "AR", ARM: "AM", ABW: "AW", AUS: "AU", AUT: "AT", AZE: "AZ",
    // B
    BHS: "BS", BHR: "BH", BGD: "BD", BRB: "BB", BLR: "BY", BEL: "BE", BLZ: "BZ", BEN: "BJ",
    BMU: "BM", BTN: "BT", BOL: "BO", BIH: "BA", BWA: "BW", BRA: "BR", BRN: "BN", BGR: "BG",
    BFA: "BF", BDI: "BI",
    // C
    CPV: "CV", KHM: "KH", CMR: "CM", CAN: "CA", CYM: "KY", CAF: "CF", TCD: "TD", CHL: "CL",
    CHN: "CN", COL: "CO", COM: "KM", COG: "CG", COD: "CD", CRI: "CR", CIV: "CI", HRV: "HR",
    CUB: "CU", CYP: "CY", CZE: "CZ",
    // D
    DNK: "DK", DJI: "DJ", DMA: "DM", DOM: "DO",
    // E
    ECU: "EC", EGY: "EG", SLV: "SV", GNQ: "GQ", ERI: "ER", EST: "EE", SWZ: "SZ", ETH: "ET",
    // F
    FJI: "FJ", FIN: "FI", FRA: "FR",
    // G
    GAB: "GA", GMB: "GM", GEO: "GE", DEU: "DE", GHA: "GH", GRC: "GR", GRD: "GD", GTM: "GT",
    GIN: "GN", GNB: "GW", GUY: "GY",
    // H
    HTI: "HT", HND: "HN", HKG: "HK", HUN: "HU",
    // I
    ISL: "IS", IND: "IN", IDN: "ID", IRN: "IR", IRQ: "IQ", IRL: "IE", ISR: "IL", ITA: "IT",
    // J
    JAM: "JM", JPN: "JP", JOR: "JO",
    // K
    KAZ: "KZ", KEN: "KE", KIR: "KI", PRK: "KP", KOR: "KR", KWT: "KW", KGZ: "KG",
    // L
    LAO: "LA", LVA: "LV", LBN: "LB", LSO: "LS", LBR: "LR", LBY: "LY", LIE: "LI", LTU: "LT", LUX: "LU",
    // M
    MAC: "MO", MDG: "MG", MWI: "MW", MYS: "MY", MDV: "MV", MLI: "ML", MLT: "MT", MHL: "MH",
    MRT: "MR", MUS: "MU", MEX: "MX", FSM: "FM", MDA: "MD", MCO: "MC", MNG: "MN", MNE: "ME",
    MAR: "MA", MOZ: "MZ", MMR: "MM", MKD: "MK",
    // N
    NAM: "NA", NRU: "NR", NPL: "NP", NLD: "NL", NZL: "NZ", NIC: "NI", NER: "NE", NGA: "NG",
    NOR: "NO",
    // O
    OMN: "OM",
    // P
    PAK: "PK", PLW: "PW", PSE: "PS", PAN: "PA", PNG: "PG", PRY: "PY", PER: "PE", PHL: "PH",
    POL: "PL", PRT: "PT",
    // Q
    QAT: "QA",
    // R
    ROU: "RO", RUS: "RU", RWA: "RW",
    // S
    KNA: "KN", LCA: "LC", VCT: "VC", WSM: "WS", SMR: "SM", STP: "ST", SAU: "SA", SEN: "SN",
    SRB: "RS", SYC: "SC", SLE: "SL", SGP: "SG", SVK: "SK", SVN: "SI", SLB: "SB", SOM: "SO",
    ZAF: "ZA", SSD: "SS", ESP: "ES", LKA: "LK", SDN: "SD", SUR: "SR", SWE: "SE", CHE: "CH",
    SYR: "SY",
    // T
    TWN: "TW", TJK: "TJ", TZA: "TZ", THA: "TH", TLS: "TL", TGO: "TG", TON: "TO", TTO: "TT",
    TUN: "TN", TUR: "TR", TKM: "TM", TUV: "TV",
    // U
    UGA: "UG", UKR: "UA", ARE: "AE", GBR: "GB", USA: "US", URY: "UY", UZB: "UZ",
    // V
    VUT: "VU", VAT: "VA", VEN: "VE", VNM: "VN",
    // Y
    YEM: "YE",
    // Z
    ZMB: "ZM", ZWE: "ZW",
    // European Union
    EUR: "EU",
  };
  
  const code = isoCode.toUpperCase();
  
  // If it's already a 2-letter code, use it directly
  const alpha2 = code.length === 2 ? code : alpha3ToAlpha2[code];
  
  if (!alpha2) {
    // Try to use the first 2 letters as fallback
    return "🏳️";
  }
  
  // Convert alpha-2 code to flag emoji
  const codePoints = alpha2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Pillar weights for ADL OHI Score calculation
 * Based on WHO/ILO occupational health framework priorities
 */
export const OHI_PILLAR_WEIGHTS = {
  governance: 0.30,      // 30% - Regulatory foundation
  hazardControl: 0.25,   // 25% - Prevention (Pillar 1)
  healthVigilance: 0.25, // 25% - Detection (Pillar 2)
  restoration: 0.20,     // 20% - Recovery (Pillar 3)
} as const;

/**
 * Calculate ADL OHI Score from pillar scores (0-100 scale each)
 * Returns a score on 1.0-4.0 scale
 * 
 * Formula: 1.0 + (weighted_average_of_pillars / 100) * 3.0
 * 
 * @param governance - Governance score (0-100)
 * @param pillar1 - Hazard Control score (0-100)
 * @param pillar2 - Health Vigilance score (0-100)
 * @param pillar3 - Restoration score (0-100)
 * @returns ADL OHI Score (1.0-4.0) or null if insufficient data
 */
export function calculateOHIScore(
  governance: number | null | undefined,
  pillar1: number | null | undefined,
  pillar2: number | null | undefined,
  pillar3: number | null | undefined
): number | null {
  // Require at least governance and one pillar to calculate
  const validScores: { key: keyof typeof OHI_PILLAR_WEIGHTS; value: number }[] = [];
  
  if (governance !== null && governance !== undefined) {
    validScores.push({ key: 'governance', value: governance });
  }
  if (pillar1 !== null && pillar1 !== undefined) {
    validScores.push({ key: 'hazardControl', value: pillar1 });
  }
  if (pillar2 !== null && pillar2 !== undefined) {
    validScores.push({ key: 'healthVigilance', value: pillar2 });
  }
  if (pillar3 !== null && pillar3 !== undefined) {
    validScores.push({ key: 'restoration', value: pillar3 });
  }
  
  // Need at least 2 pillars to calculate meaningful score
  if (validScores.length < 2) {
    return null;
  }
  
  // Calculate weighted average, normalizing weights for available pillars
  const totalWeight = validScores.reduce((sum, s) => sum + OHI_PILLAR_WEIGHTS[s.key], 0);
  const weightedSum = validScores.reduce(
    (sum, s) => sum + (s.value * OHI_PILLAR_WEIGHTS[s.key]), 
    0
  );
  
  const normalizedAverage = weightedSum / totalWeight;
  
  // Convert to 1.0-4.0 scale
  const ohiScore = 1.0 + (normalizedAverage / 100) * 3.0;
  
  // Round to 1 decimal place and clamp to valid range
  return Math.round(Math.min(Math.max(ohiScore, 1.0), 4.0) * 10) / 10;
}

/**
 * Get the best available OHI score - calculated from pillars if available,
 * otherwise fall back to stored maturity_score
 */
export function getEffectiveOHIScore(
  storedScore: number | null | undefined,
  governance: number | null | undefined,
  pillar1: number | null | undefined,
  pillar2: number | null | undefined,
  pillar3: number | null | undefined
): number | null {
  // Try to calculate from pillar scores first (more accurate)
  const calculatedScore = calculateOHIScore(governance, pillar1, pillar2, pillar3);
  
  if (calculatedScore !== null) {
    return calculatedScore;
  }
  
  // Fall back to stored score
  return storedScore ?? null;
}

/**
 * Get maturity stage label and color based on score
 * @param score - Maturity score (1.0-4.0 scale)
 * 
 * ADL OHI Score Stages:
 * - Stage 4 (3.5-4.0): Advanced - Leading maturity
 * - Stage 3 (2.5-3.49): Established - Strong systems in place
 * - Stage 2 (1.5-2.49): Developing - Growing capabilities
 * - Stage 1 (1.0-1.49): Nascent - Early stage
 */
export function getMaturityStage(score: number | null | undefined): {
  stage: number;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
} {
  if (score === null || score === undefined) {
    return {
      stage: 0,
      label: "Unknown",
      color: "text-slate-400",
      bgColor: "bg-slate-500/20",
      borderColor: "border-slate-500/30",
      textColor: "text-slate-400",
    };
  }

  // Score is on 1.0-4.0 scale
  if (score >= 3.5) {
    return {
      stage: 4,
      label: "Advanced",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-500/30",
      textColor: "text-emerald-400",
    };
  } else if (score >= 2.5) {
    return {
      stage: 3,
      label: "Established",
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-400",
    };
  } else if (score >= 1.5) {
    return {
      stage: 2,
      label: "Developing",
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-400",
    };
  } else {
    return {
      stage: 1,
      label: "Nascent",
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
    };
  }
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a boolean value as Yes/No
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return value ? "Yes" : "No";
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
}
