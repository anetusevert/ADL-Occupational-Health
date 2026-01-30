/**
 * GOHIP Platform - GlobalMap Component
 * Interactive vector map showing country data with click navigation
 * Phase 23: Dynamic metric selection with maturity score as default
 */

import { useState, memo, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { cn, getApiBaseUrl } from "../lib/utils";
import type { MapCountryData, MapMetric, MapMetricConfig } from "../types/country";
import { ADLIcon } from "./ADLLogo";

// TopoJSON world map (using Natural Earth data)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Comprehensive ISO Alpha-2 to Alpha-3 mapping for all 196 countries
const ISO_ALPHA2_TO_ALPHA3: Record<string, string> = {
  // A
  AF: "AFG", AL: "ALB", DZ: "DZA", AD: "AND", AO: "AGO", AG: "ATG", AR: "ARG",
  AM: "ARM", AU: "AUS", AT: "AUT", AZ: "AZE",
  // B
  BS: "BHS", BH: "BHR", BD: "BGD", BB: "BRB", BY: "BLR", BE: "BEL", BZ: "BLZ",
  BJ: "BEN", BT: "BTN", BO: "BOL", BA: "BIH", BW: "BWA", BR: "BRA", BN: "BRN",
  BG: "BGR", BF: "BFA", BI: "BDI",
  // C
  CV: "CPV", KH: "KHM", CM: "CMR", CA: "CAN", CF: "CAF", TD: "TCD", CL: "CHL",
  CN: "CHN", CO: "COL", KM: "COM", CG: "COG", CD: "COD", CR: "CRI", CI: "CIV",
  HR: "HRV", CU: "CUB", CY: "CYP", CZ: "CZE",
  // D
  DK: "DNK", DJ: "DJI", DM: "DMA", DO: "DOM",
  // E
  EC: "ECU", EG: "EGY", SV: "SLV", GQ: "GNQ", ER: "ERI", EE: "EST", SZ: "SWZ",
  ET: "ETH",
  // F
  FJ: "FJI", FI: "FIN", FR: "FRA",
  // G
  GA: "GAB", GM: "GMB", GE: "GEO", DE: "DEU", GH: "GHA", GR: "GRC", GD: "GRD",
  GT: "GTM", GN: "GIN", GW: "GNB", GY: "GUY",
  // H
  HT: "HTI", HN: "HND", HU: "HUN",
  // I
  IS: "ISL", IN: "IND", ID: "IDN", IR: "IRN", IQ: "IRQ", IE: "IRL", IL: "ISR",
  IT: "ITA",
  // J
  JM: "JAM", JP: "JPN", JO: "JOR",
  // K
  KZ: "KAZ", KE: "KEN", KI: "KIR", KP: "PRK", KR: "KOR", KW: "KWT", KG: "KGZ",
  // L
  LA: "LAO", LV: "LVA", LB: "LBN", LS: "LSO", LR: "LBR", LY: "LBY", LI: "LIE",
  LT: "LTU", LU: "LUX",
  // M
  MG: "MDG", MW: "MWI", MY: "MYS", MV: "MDV", ML: "MLI", MT: "MLT", MH: "MHL",
  MR: "MRT", MU: "MUS", MX: "MEX", FM: "FSM", MD: "MDA", MC: "MCO", MN: "MNG",
  ME: "MNE", MA: "MAR", MZ: "MOZ", MM: "MMR",
  // N
  NA: "NAM", NR: "NRU", NP: "NPL", NL: "NLD", NZ: "NZL", NI: "NIC", NE: "NER",
  NG: "NGA", MK: "MKD", NO: "NOR",
  // O
  OM: "OMN",
  // P
  PK: "PAK", PW: "PLW", PS: "PSE", PA: "PAN", PG: "PNG", PY: "PRY", PE: "PER",
  PH: "PHL", PL: "POL", PT: "PRT",
  // Q
  QA: "QAT",
  // R
  RO: "ROU", RU: "RUS", RW: "RWA",
  // S
  KN: "KNA", LC: "LCA", VC: "VCT", WS: "WSM", SM: "SMR", ST: "STP", SA: "SAU",
  SN: "SEN", RS: "SRB", SC: "SYC", SL: "SLE", SG: "SGP", SK: "SVK", SI: "SVN",
  SB: "SLB", SO: "SOM", ZA: "ZAF", SS: "SSD", ES: "ESP", LK: "LKA", SD: "SDN",
  SR: "SUR", SE: "SWE", CH: "CHE", SY: "SYR",
  // T
  TW: "TWN", TJ: "TJK", TZ: "TZA", TH: "THA", TL: "TLS", TG: "TGO", TO: "TON",
  TT: "TTO", TN: "TUN", TR: "TUR", TM: "TKM", TV: "TUV",
  // U
  UG: "UGA", UA: "UKR", AE: "ARE", GB: "GBR", US: "USA", UY: "URY", UZ: "UZB",
  // V
  VU: "VUT", VA: "VAT", VE: "VEN", VN: "VNM",
  // Y
  YE: "YEM",
  // Z
  ZM: "ZMB", ZW: "ZWE",
};

// Comprehensive country name to ISO Alpha-3 mapping (fallback for name-based matching)
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  // A
  "Afghanistan": "AFG", "Albania": "ALB", "Algeria": "DZA", "Andorra": "AND",
  "Angola": "AGO", "Antigua and Barbuda": "ATG", "Argentina": "ARG", "Armenia": "ARM",
  "Australia": "AUS", "Austria": "AUT", "Azerbaijan": "AZE",
  // B
  "Bahamas": "BHS", "Bahrain": "BHR", "Bangladesh": "BGD", "Barbados": "BRB",
  "Belarus": "BLR", "Belgium": "BEL", "Belize": "BLZ", "Benin": "BEN",
  "Bhutan": "BTN", "Bolivia": "BOL", "Bosnia and Herzegovina": "BIH", "Bosnia and Herz.": "BIH",
  "Botswana": "BWA", "Brazil": "BRA", "Brunei": "BRN", "Bulgaria": "BGR",
  "Burkina Faso": "BFA", "Burundi": "BDI",
  // C
  "Cabo Verde": "CPV", "Cape Verde": "CPV", "Cambodia": "KHM", "Cameroon": "CMR",
  "Canada": "CAN", "Central African Republic": "CAF", "Central African Rep.": "CAF",
  "Chad": "TCD", "Chile": "CHL", "China": "CHN", "Colombia": "COL", "Comoros": "COM",
  "Congo": "COG", "Democratic Republic of the Congo": "COD", "Dem. Rep. Congo": "COD",
  "Costa Rica": "CRI", "Côte d'Ivoire": "CIV", "Ivory Coast": "CIV", "Croatia": "HRV",
  "Cuba": "CUB", "Cyprus": "CYP", "Czechia": "CZE", "Czech Republic": "CZE",
  // D
  "Denmark": "DNK", "Djibouti": "DJI", "Dominica": "DMA", "Dominican Republic": "DOM",
  "Dominican Rep.": "DOM",
  // E
  "Ecuador": "ECU", "Egypt": "EGY", "El Salvador": "SLV", "Equatorial Guinea": "GNQ",
  "Eq. Guinea": "GNQ", "Eritrea": "ERI", "Estonia": "EST", "Eswatini": "SWZ",
  "Swaziland": "SWZ", "Ethiopia": "ETH",
  // F
  "Fiji": "FJI", "Finland": "FIN", "France": "FRA",
  // G
  "Gabon": "GAB", "Gambia": "GMB", "Georgia": "GEO", "Germany": "DEU", "Ghana": "GHA",
  "Greece": "GRC", "Grenada": "GRD", "Guatemala": "GTM", "Guinea": "GIN",
  "Guinea-Bissau": "GNB", "Guyana": "GUY",
  // H
  "Haiti": "HTI", "Honduras": "HND", "Hungary": "HUN",
  // I
  "Iceland": "ISL", "India": "IND", "Indonesia": "IDN", "Iran": "IRN",
  "Iraq": "IRQ", "Ireland": "IRL", "Israel": "ISR", "Italy": "ITA",
  // J
  "Jamaica": "JAM", "Japan": "JPN", "Jordan": "JOR",
  // K
  "Kazakhstan": "KAZ", "Kenya": "KEN", "Kiribati": "KIR", "North Korea": "PRK",
  "South Korea": "KOR", "Korea": "KOR", "Kuwait": "KWT", "Kyrgyzstan": "KGZ",
  // L
  "Laos": "LAO", "Lao PDR": "LAO", "Latvia": "LVA", "Lebanon": "LBN",
  "Lesotho": "LSO", "Liberia": "LBR", "Libya": "LBY", "Liechtenstein": "LIE",
  "Lithuania": "LTU", "Luxembourg": "LUX",
  // M
  "Madagascar": "MDG", "Malawi": "MWI", "Malaysia": "MYS", "Maldives": "MDV",
  "Mali": "MLI", "Malta": "MLT", "Marshall Islands": "MHL", "Marshall Is.": "MHL",
  "Mauritania": "MRT", "Mauritius": "MUS", "Mexico": "MEX", "Micronesia": "FSM",
  "Moldova": "MDA", "Monaco": "MCO", "Mongolia": "MNG", "Montenegro": "MNE",
  "Morocco": "MAR", "Mozambique": "MOZ", "Myanmar": "MMR", "Burma": "MMR",
  // N
  "Namibia": "NAM", "Nauru": "NRU", "Nepal": "NPL", "Netherlands": "NLD",
  "New Zealand": "NZL", "Nicaragua": "NIC", "Niger": "NER", "Nigeria": "NGA",
  "North Macedonia": "MKD", "Macedonia": "MKD", "Norway": "NOR",
  // O
  "Oman": "OMN",
  // P
  "Pakistan": "PAK", "Palau": "PLW", "Palestine": "PSE", "Panama": "PAN",
  "Papua New Guinea": "PNG", "Paraguay": "PRY", "Peru": "PER", "Philippines": "PHL",
  "Poland": "POL", "Portugal": "PRT",
  // Q
  "Qatar": "QAT",
  // R
  "Romania": "ROU", "Russia": "RUS", "Rwanda": "RWA",
  // S
  "Saint Kitts and Nevis": "KNA", "St. Kitts and Nevis": "KNA",
  "Saint Lucia": "LCA", "St. Lucia": "LCA",
  "Saint Vincent and the Grenadines": "VCT", "St. Vin. and Gren.": "VCT",
  "Samoa": "WSM", "San Marino": "SMR", "Sao Tome and Principe": "STP",
  "Saudi Arabia": "SAU", "Senegal": "SEN", "Serbia": "SRB", "Seychelles": "SYC",
  "Sierra Leone": "SLE", "Singapore": "SGP", "Slovakia": "SVK", "Slovenia": "SVN",
  "Solomon Islands": "SLB", "Solomon Is.": "SLB", "Somalia": "SOM",
  "South Africa": "ZAF", "South Sudan": "SSD", "S. Sudan": "SSD",
  "Spain": "ESP", "Sri Lanka": "LKA", "Sudan": "SDN", "Suriname": "SUR",
  "Sweden": "SWE", "Switzerland": "CHE", "Syria": "SYR",
  // T
  "Taiwan": "TWN", "Tajikistan": "TJK", "Tanzania": "TZA", "Thailand": "THA",
  "Timor-Leste": "TLS", "East Timor": "TLS", "Togo": "TGO", "Tonga": "TON",
  "Trinidad and Tobago": "TTO", "Tunisia": "TUN", "Turkey": "TUR", "Türkiye": "TUR",
  "Turkmenistan": "TKM", "Tuvalu": "TUV",
  // U
  "Uganda": "UGA", "Ukraine": "UKR", "United Arab Emirates": "ARE",
  "United Kingdom": "GBR", "United States of America": "USA", "United States": "USA",
  "Uruguay": "URY", "Uzbekistan": "UZB",
  // V
  "Vanuatu": "VUT", "Vatican City": "VAT", "Vatican": "VAT", "Venezuela": "VEN",
  "Vietnam": "VNM", "Viet Nam": "VNM",
  // Y
  "Yemen": "YEM",
  // Z
  "Zambia": "ZMB", "Zimbabwe": "ZWE",
};

// Framework-Aligned Metric Configurations
// Based on Sovereign OH Framework: Governance + 3 Pillars + ADL OHI Score
const METRIC_CONFIGS: Record<MapMetric, MapMetricConfig> = {
  // ADL OHI Score (1.0-4.0 scale) - The branded overall health index
  maturity_score: {
    key: "maturity_score",
    label: "ADL OHI Score",
    unit: "1-4",
    higherIsBetter: true,
    ranges: [
      { value: 3.5, color: "#10b981", label: "3.5-4.0 — Resilient" },
      { value: 3.0, color: "#84cc16", label: "3.0-3.4 — Proactive" },
      { value: 2.0, color: "#f97316", label: "2.0-2.9 — Compliant" },
      { value: 0, color: "#ef4444", label: "1.0-1.9 — Reactive" },
    ],
  },
  // Governance Index (0-100 scale)
  governance_score: {
    key: "governance_score",
    label: "Governance Index",
    unit: "0-100",
    higherIsBetter: true,
    ranges: [
      { value: 75, color: "#10b981", label: "≥ 75 — Strong" },
      { value: 50, color: "#84cc16", label: "50-74 — Developing" },
      { value: 25, color: "#f97316", label: "25-49 — Emerging" },
      { value: 0, color: "#ef4444", label: "< 25 — Nascent" },
    ],
  },
  // Pillar 1: Hazard Control Index (0-100 scale)
  pillar1_score: {
    key: "pillar1_score",
    label: "Hazard Control",
    unit: "0-100",
    higherIsBetter: true,
    ranges: [
      { value: 75, color: "#10b981", label: "≥ 75 — Excellent" },
      { value: 50, color: "#84cc16", label: "50-74 — Good" },
      { value: 25, color: "#f97316", label: "25-49 — Fair" },
      { value: 0, color: "#ef4444", label: "< 25 — Critical" },
    ],
  },
  // Pillar 2: Health Vigilance Index (0-100 scale)
  pillar2_score: {
    key: "pillar2_score",
    label: "Health Vigilance",
    unit: "0-100",
    higherIsBetter: true,
    ranges: [
      { value: 75, color: "#10b981", label: "≥ 75 — Excellent" },
      { value: 50, color: "#84cc16", label: "50-74 — Good" },
      { value: 25, color: "#f97316", label: "25-49 — Fair" },
      { value: 0, color: "#ef4444", label: "< 25 — Critical" },
    ],
  },
  // Pillar 3: Restoration Index (0-100 scale)
  pillar3_score: {
    key: "pillar3_score",
    label: "Restoration",
    unit: "0-100",
    higherIsBetter: true,
    ranges: [
      { value: 75, color: "#10b981", label: "≥ 75 — Excellent" },
      { value: 50, color: "#84cc16", label: "50-74 — Good" },
      { value: 25, color: "#f97316", label: "25-49 — Fair" },
      { value: 0, color: "#ef4444", label: "< 25 — Critical" },
    ],
  },
};

interface GlobalMapProps {
  countries: MapCountryData[];
  onCountryClick?: (isoCode: string) => void;
  onHoverCountry?: (country: MapCountryData | null) => void;
  className?: string;
  showLabels?: boolean;
  selectedMetric?: MapMetric;
  onMetricChange?: (metric: MapMetric) => void;
}

function GlobalMapComponent({
  countries,
  onCountryClick,
  onHoverCountry,
  className,
  showLabels = false,
  selectedMetric = "maturity_score",
  onMetricChange,
}: GlobalMapProps) {
  const navigate = useNavigate();
  const [tooltipContent, setTooltipContent] = useState<{
    name: string;
    iso: string;
    inDb: boolean;
    value?: number | null;
    flagUrl?: string | null;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const metricConfig = METRIC_CONFIGS[selectedMetric];

  // Create a Set of ISO codes in our database for quick lookup
  const countryIsoSet = new Set(countries.map((c) => c.iso_code));

  // Create a map for quick data lookup
  const countryDataMap = new Map(countries.map((c) => [c.iso_code, c]));

  // Sort countries alphabetically for the list
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name));
  }, [countries]);

  const getIsoCode = (geo: { properties: { name: string; ISO_A2?: string } }) => {
    const isoAlpha2 = geo.properties.ISO_A2;
    const name = geo.properties.name;
    let isoCode = isoAlpha2 ? ISO_ALPHA2_TO_ALPHA3[isoAlpha2] : undefined;
    if (!isoCode) {
      isoCode = COUNTRY_NAME_TO_ISO[name];
    }
    return isoCode;
  };

  const handleCountryClick = (geo: { properties: { name: string; ISO_A2?: string } }) => {
    const isoCode = getIsoCode(geo);
    if (isoCode && countryIsoSet.has(isoCode)) {
      if (onCountryClick) {
        onCountryClick(isoCode);
      } else {
        navigate(`/country/${isoCode}`);
      }
    }
  };

  const getMetricValue = (data: MapCountryData | undefined): number | null | undefined => {
    if (!data) return undefined;
    return data[selectedMetric];
  };

  const getCountryFill = (geo: { properties: { name: string; ISO_A2?: string } }) => {
    const isoCode = getIsoCode(geo);

    if (isoCode && countryIsoSet.has(isoCode)) {
      const data = countryDataMap.get(isoCode);
      const value = getMetricValue(data);

      if (value !== null && value !== undefined) {
        const { ranges, higherIsBetter } = metricConfig;
        
        if (higherIsBetter) {
          // Higher is better (maturity, capacity, rehab)
          for (const range of ranges) {
            if (value >= range.value) return range.color;
          }
          return ranges[ranges.length - 1].color;
        } else {
          // Lower is better (fatal rate, vulnerability)
          for (const range of ranges) {
            if (value < range.value) return range.color;
          }
          return ranges[ranges.length - 1].color;
        }
      }

      // DATA GAP: Country in DB but no data for this metric
      return "#f59e0b"; // Amber - Data Gap
    }

    // GHOST: Country not in DB - Dark Slate
    return "#1e293b";
  };

  const handleMouseEnter = (
    geo: { properties: { name: string; ISO_A2?: string } },
    event: React.MouseEvent
  ) => {
    const isoCode = getIsoCode(geo);
    const name = geo.properties.name;
    const inDb = isoCode ? countryIsoSet.has(isoCode) : false;
    const data = isoCode ? countryDataMap.get(isoCode) : undefined;

    setTooltipContent({
      name,
      iso: isoCode || "N/A",
      inDb,
      value: getMetricValue(data),
      flagUrl: data?.flag_url,
    });
    setTooltipPosition({ x: event.clientX, y: event.clientY });
    
    // Notify parent about hover for dynamic Quick Access panel
    if (onHoverCountry && data) {
      onHoverCountry(data);
    }
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
    // Clear hover state
    if (onHoverCountry) {
      onHoverCountry(null);
    }
  };

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    if (selectedMetric === "maturity_score") return value.toFixed(1);
    // All pillar scores and governance are 0-100 scale
    return value.toFixed(0);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Map Container */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [20, 30],
          }}
          style={{
            width: "100%",
            height: "auto",
          }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isoCode = getIsoCode(geo);
                  const isInDb = isoCode ? countryIsoSet.has(isoCode) : false;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryFill(geo)}
                      stroke="#334155"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none",
                          transition: "all 0.2s ease",
                        },
                        hover: {
                          fill: isInDb ? "#fbbf24" : "#475569",
                          outline: "none",
                          cursor: isInDb ? "pointer" : "default",
                        },
                        pressed: {
                          fill: isInDb ? "#d97706" : "#475569",
                          outline: "none",
                        },
                      }}
                      onClick={() => handleCountryClick(geo)}
                      onMouseEnter={(e) => handleMouseEnter(geo, e)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
          }}
        >
          <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 shadow-xl min-w-[180px]">
            {/* Flag + Name Header */}
            <div className="flex items-center gap-2 mb-1">
              {tooltipContent.flagUrl ? (
                <img 
                  src={`${getApiBaseUrl()}${tooltipContent.flagUrl}`}
                  alt={`${tooltipContent.name} flag`}
                  className="w-8 h-5 object-cover rounded shadow-sm border border-slate-600"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div>
                <p className="text-white font-medium">{tooltipContent.name}</p>
                <p className="text-xs text-slate-400">ISO: {tooltipContent.iso}</p>
              </div>
            </div>
            
            {tooltipContent.inDb ? (
              <>
                {tooltipContent.value !== null && tooltipContent.value !== undefined ? (
                  <>
                    <p className="text-xs text-emerald-400 mt-1">In Database</p>
                    <p className="text-xs text-slate-300">
                      {metricConfig.label}: <span className="font-mono">{formatValue(tooltipContent.value)}</span> {metricConfig.unit}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-amber-400 mt-1 font-medium">Data Gap</p>
                    <p className="text-xs text-slate-400">{metricConfig.label} not available</p>
                  </>
                )}
                <p className="text-xs text-amber-400 mt-1">Click to view profile →</p>
              </>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Not in database</p>
            )}
          </div>
        </div>
      )}

      {/* Metric Selector - Top Left */}
      <div className="absolute top-4 left-4 z-40">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between min-w-[200px] px-4 py-2.5 text-sm font-medium text-white bg-slate-800/95 backdrop-blur-sm border border-slate-600 hover:border-cyan-500/50 rounded-lg transition-all shadow-lg"
          >
            <div className="flex items-center gap-2">
              {selectedMetric === "maturity_score" ? (
                <ADLIcon size="xs" animate={false} className="opacity-90" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
              <span>{metricConfig.label}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 ml-3 text-slate-400 transition-transform", isDropdownOpen && "rotate-180")} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50">
              {Object.values(METRIC_CONFIGS).map((config) => (
                <button
                  key={config.key}
                  onClick={() => {
                    onMetricChange?.(config.key);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-sm text-left hover:bg-slate-700/50 transition-colors flex items-center gap-2",
                    selectedMetric === config.key ? "text-cyan-400 bg-cyan-500/10" : "text-slate-300"
                  )}
                >
                  {selectedMetric === config.key && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  {selectedMetric !== config.key && <div className="w-1.5 h-1.5" />}
                  {config.key === "maturity_score" && <ADLIcon size="xs" animate={false} className="opacity-80" />}
                  {config.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 z-30">
        <div className="flex items-center gap-2 mb-2">
          {selectedMetric === "maturity_score" && <ADLIcon size="xs" animate={false} className="opacity-80" />}
          <p className="text-xs font-medium text-slate-300">
            {metricConfig.label} ({metricConfig.unit})
          </p>
        </div>
        <div className="space-y-1.5">
          {metricConfig.ranges.map((range, idx) => (
            <LegendItem key={idx} color={range.color} label={range.label} />
          ))}
          <div className="border-t border-slate-600 my-1.5" />
          <LegendItem color="#f59e0b" label="Data Gap" />
          <LegendItem color="#1e293b" label="Not Tracked" />
        </div>
      </div>

      {/* Country Labels - Sorted Alphabetically & Clickable */}
      {showLabels && sortedCountries.length > 0 && (
        <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 max-h-80 overflow-y-auto">
          <p className="text-xs font-medium text-slate-300 mb-2">
            Countries in Database ({sortedCountries.length})
          </p>
          <div className="space-y-1">
            {sortedCountries.map((c) => (
              <button
                key={c.iso_code}
                onClick={() => navigate(`/country/${c.iso_code}`)}
                className="block w-full text-left text-xs text-amber-400 hover:text-amber-300 hover:bg-slate-700/50 px-2 py-1 rounded transition-colors"
              >
                {c.name} ({c.iso_code})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Legend Item Helper
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const GlobalMap = memo(GlobalMapComponent);
export default GlobalMap;
