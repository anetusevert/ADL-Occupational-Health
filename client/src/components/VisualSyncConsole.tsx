/**
 * GOHIP Platform - Visual Sync Console (Live Operations Center)
 * ==============================================================
 * 
 * Phase 17: Modern Visual Grid replacing the ASCII Terminal
 * Phase 25: Country Selection - User can select which countries to sync
 * Phase 26: Full-Screen Multi-Source Intelligence Display
 * 
 * Features:
 * - Full-screen dedicated modal for ETL monitoring
 * - 50 Country Cards with multi-metric display
 * - Real-time visibility of ALL data sources being fetched:
 *   ILO, WHO, World Bank, CPI, HDI, EPI, IHME GBD, WJP, OECD
 * - Country Selection UI before starting sync
 * - Real-time status updates via polling GET /api/v1/etl/status
 * - Framer Motion animations for each processing state
 * - Large prominent log feed showing all data fetching activity
 * - Wikipedia flag fetching integration
 * 
 * Card States:
 * - Pending: Gray card (waiting to be processed)
 * - Processing: Pulsing blue border + animated flag
 * - Success: Green border + metrics displayed
 * - Failed: Red border + error indicator
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Play,
  Activity,
  Globe,
  CheckSquare,
  Square,
  Flag,
  StopCircle,
  Eye
} from "lucide-react";
import { apiClient } from "../services/api";

// =============================================================================
// TYPES
// =============================================================================

interface CountryStatusItem {
  status: "pending" | "processing" | "success" | "failed";
  started_at?: string;
  finished_at?: string;
  metric?: number | null;
  error?: string | null;
}

interface PipelineStatusResponse {
  current_country: string | null;
  progress: string;
  progress_count: number;
  total_countries: number;
  completed_countries: string[];
  failed_countries: string[];
  country_data: Record<string, CountryStatusItem>;
  logs: string[];
  is_running: boolean;
  started_at: string | null;
  finished_at: string | null;
}

interface VisualSyncConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// COUNTRY DATA - All 193+ UN Member States
// =============================================================================

// ISO 3166-1 alpha-3 to alpha-2 mapping for flag emojis
const ISO3_TO_ISO2: Record<string, string> = {
  // Africa
  DZA: "DZ", AGO: "AO", BEN: "BJ", BWA: "BW", BFA: "BF", BDI: "BI", CPV: "CV",
  CMR: "CM", CAF: "CF", TCD: "TD", COM: "KM", COG: "CG", COD: "CD", CIV: "CI",
  DJI: "DJ", EGY: "EG", GNQ: "GQ", ERI: "ER", SWZ: "SZ", ETH: "ET", GAB: "GA",
  GMB: "GM", GHA: "GH", GIN: "GN", GNB: "GW", KEN: "KE", LSO: "LS", LBR: "LR",
  LBY: "LY", MDG: "MG", MWI: "MW", MLI: "ML", MRT: "MR", MUS: "MU", MAR: "MA",
  MOZ: "MZ", NAM: "NA", NER: "NE", NGA: "NG", RWA: "RW", STP: "ST", SEN: "SN",
  SYC: "SC", SLE: "SL", SOM: "SO", ZAF: "ZA", SSD: "SS", SDN: "SD", TZA: "TZ",
  TGO: "TG", TUN: "TN", UGA: "UG", ZMB: "ZM", ZWE: "ZW",
  // Americas
  ATG: "AG", ARG: "AR", BHS: "BS", BRB: "BB", BLZ: "BZ", BOL: "BO", BRA: "BR",
  CAN: "CA", CHL: "CL", COL: "CO", CRI: "CR", CUB: "CU", DMA: "DM", DOM: "DO",
  ECU: "EC", SLV: "SV", GRD: "GD", GTM: "GT", GUY: "GY", HTI: "HT", HND: "HN",
  JAM: "JM", MEX: "MX", NIC: "NI", PAN: "PA", PRY: "PY", PER: "PE", KNA: "KN",
  LCA: "LC", VCT: "VC", SUR: "SR", TTO: "TT", USA: "US", URY: "UY", VEN: "VE",
  // Asia
  AFG: "AF", ARM: "AM", AZE: "AZ", BHR: "BH", BGD: "BD", BTN: "BT", BRN: "BN",
  KHM: "KH", CHN: "CN", CYP: "CY", GEO: "GE", IND: "IN", IDN: "ID", IRN: "IR",
  IRQ: "IQ", ISR: "IL", JPN: "JP", JOR: "JO", KAZ: "KZ", KWT: "KW", KGZ: "KG",
  LAO: "LA", LBN: "LB", MYS: "MY", MDV: "MV", MNG: "MN", MMR: "MM", NPL: "NP",
  PRK: "KP", OMN: "OM", PAK: "PK", PHL: "PH", QAT: "QA", SAU: "SA", SGP: "SG",
  KOR: "KR", LKA: "LK", SYR: "SY", TJK: "TJ", THA: "TH", TLS: "TL", TKM: "TM",
  ARE: "AE", UZB: "UZ", VNM: "VN", YEM: "YE", PSE: "PS", TWN: "TW",
  // Europe
  ALB: "AL", AND: "AD", AUT: "AT", BLR: "BY", BEL: "BE", BIH: "BA", BGR: "BG",
  HRV: "HR", CZE: "CZ", DNK: "DK", EST: "EE", FIN: "FI", FRA: "FR", DEU: "DE",
  GRC: "GR", HUN: "HU", ISL: "IS", IRL: "IE", ITA: "IT", LVA: "LV", LIE: "LI",
  LTU: "LT", LUX: "LU", MLT: "MT", MDA: "MD", MCO: "MC", MNE: "ME", NLD: "NL",
  MKD: "MK", NOR: "NO", POL: "PL", PRT: "PT", ROU: "RO", RUS: "RU", SMR: "SM",
  SRB: "RS", SVK: "SK", SVN: "SI", ESP: "ES", SWE: "SE", CHE: "CH", UKR: "UA",
  GBR: "GB", VAT: "VA",
  // Oceania
  AUS: "AU", FJI: "FJ", KIR: "KI", MHL: "MH", FSM: "FM", NRU: "NR", NZL: "NZ",
  PLW: "PW", PNG: "PG", WSM: "WS", SLB: "SB", TON: "TO", TUV: "TV", VUT: "VU",
};

const COUNTRY_NAMES: Record<string, string> = {
  // Africa (54)
  DZA: "Algeria", AGO: "Angola", BEN: "Benin", BWA: "Botswana", BFA: "Burkina Faso",
  BDI: "Burundi", CPV: "Cabo Verde", CMR: "Cameroon", CAF: "Central African Republic",
  TCD: "Chad", COM: "Comoros", COG: "Congo", COD: "DR Congo", CIV: "Côte d'Ivoire",
  DJI: "Djibouti", EGY: "Egypt", GNQ: "Equatorial Guinea", ERI: "Eritrea", SWZ: "Eswatini",
  ETH: "Ethiopia", GAB: "Gabon", GMB: "Gambia", GHA: "Ghana", GIN: "Guinea", GNB: "Guinea-Bissau",
  KEN: "Kenya", LSO: "Lesotho", LBR: "Liberia", LBY: "Libya", MDG: "Madagascar", MWI: "Malawi",
  MLI: "Mali", MRT: "Mauritania", MUS: "Mauritius", MAR: "Morocco", MOZ: "Mozambique",
  NAM: "Namibia", NER: "Niger", NGA: "Nigeria", RWA: "Rwanda", STP: "São Tomé",
  SEN: "Senegal", SYC: "Seychelles", SLE: "Sierra Leone", SOM: "Somalia", ZAF: "South Africa",
  SSD: "South Sudan", SDN: "Sudan", TZA: "Tanzania", TGO: "Togo", TUN: "Tunisia",
  UGA: "Uganda", ZMB: "Zambia", ZWE: "Zimbabwe",
  // Americas (35)
  ATG: "Antigua & Barbuda", ARG: "Argentina", BHS: "Bahamas", BRB: "Barbados", BLZ: "Belize",
  BOL: "Bolivia", BRA: "Brazil", CAN: "Canada", CHL: "Chile", COL: "Colombia", CRI: "Costa Rica",
  CUB: "Cuba", DMA: "Dominica", DOM: "Dominican Rep.", ECU: "Ecuador", SLV: "El Salvador",
  GRD: "Grenada", GTM: "Guatemala", GUY: "Guyana", HTI: "Haiti", HND: "Honduras", JAM: "Jamaica",
  MEX: "Mexico", NIC: "Nicaragua", PAN: "Panama", PRY: "Paraguay", PER: "Peru",
  KNA: "St. Kitts & Nevis", LCA: "St. Lucia", VCT: "St. Vincent", SUR: "Suriname",
  TTO: "Trinidad & Tobago", USA: "United States", URY: "Uruguay", VEN: "Venezuela",
  // Asia (48)
  AFG: "Afghanistan", ARM: "Armenia", AZE: "Azerbaijan", BHR: "Bahrain", BGD: "Bangladesh",
  BTN: "Bhutan", BRN: "Brunei", KHM: "Cambodia", CHN: "China", CYP: "Cyprus", GEO: "Georgia",
  IND: "India", IDN: "Indonesia", IRN: "Iran", IRQ: "Iraq", ISR: "Israel", JPN: "Japan",
  JOR: "Jordan", KAZ: "Kazakhstan", KWT: "Kuwait", KGZ: "Kyrgyzstan", LAO: "Laos", LBN: "Lebanon",
  MYS: "Malaysia", MDV: "Maldives", MNG: "Mongolia", MMR: "Myanmar", NPL: "Nepal",
  PRK: "North Korea", OMN: "Oman", PAK: "Pakistan", PHL: "Philippines", QAT: "Qatar",
  SAU: "Saudi Arabia", SGP: "Singapore", KOR: "South Korea", LKA: "Sri Lanka", SYR: "Syria",
  TJK: "Tajikistan", THA: "Thailand", TLS: "Timor-Leste", TKM: "Turkmenistan", ARE: "UAE",
  UZB: "Uzbekistan", VNM: "Vietnam", YEM: "Yemen", PSE: "Palestine", TWN: "Taiwan",
  // Europe (44)
  ALB: "Albania", AND: "Andorra", AUT: "Austria", BLR: "Belarus", BEL: "Belgium",
  BIH: "Bosnia & Herz.", BGR: "Bulgaria", HRV: "Croatia", CZE: "Czech Republic", DNK: "Denmark",
  EST: "Estonia", FIN: "Finland", FRA: "France", DEU: "Germany", GRC: "Greece", HUN: "Hungary",
  ISL: "Iceland", IRL: "Ireland", ITA: "Italy", LVA: "Latvia", LIE: "Liechtenstein",
  LTU: "Lithuania", LUX: "Luxembourg", MLT: "Malta", MDA: "Moldova", MCO: "Monaco",
  MNE: "Montenegro", NLD: "Netherlands", MKD: "N. Macedonia", NOR: "Norway", POL: "Poland",
  PRT: "Portugal", ROU: "Romania", RUS: "Russia", SMR: "San Marino", SRB: "Serbia",
  SVK: "Slovakia", SVN: "Slovenia", ESP: "Spain", SWE: "Sweden", CHE: "Switzerland",
  UKR: "Ukraine", GBR: "United Kingdom", VAT: "Vatican City",
  // Oceania (14)
  AUS: "Australia", FJI: "Fiji", KIR: "Kiribati", MHL: "Marshall Islands", FSM: "Micronesia",
  NRU: "Nauru", NZL: "New Zealand", PLW: "Palau", PNG: "Papua New Guinea", WSM: "Samoa",
  SLB: "Solomon Islands", TON: "Tonga", TUV: "Tuvalu", VUT: "Vanuatu",
};

// All UN Member States organized by region
const COUNTRY_REGIONS: Record<string, string[]> = {
  "Africa": [
    "DZA", "AGO", "BEN", "BWA", "BFA", "BDI", "CPV", "CMR", "CAF", "TCD",
    "COM", "COG", "COD", "CIV", "DJI", "EGY", "GNQ", "ERI", "SWZ", "ETH",
    "GAB", "GMB", "GHA", "GIN", "GNB", "KEN", "LSO", "LBR", "LBY", "MDG",
    "MWI", "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM", "NER", "NGA", "RWA",
    "STP", "SEN", "SYC", "SLE", "SOM", "ZAF", "SSD", "SDN", "TZA", "TGO",
    "TUN", "UGA", "ZMB", "ZWE"
  ],
  "Americas": [
    "ATG", "ARG", "BHS", "BRB", "BLZ", "BOL", "BRA", "CAN", "CHL", "COL",
    "CRI", "CUB", "DMA", "DOM", "ECU", "SLV", "GRD", "GTM", "GUY", "HTI",
    "HND", "JAM", "MEX", "NIC", "PAN", "PRY", "PER", "KNA", "LCA", "VCT",
    "SUR", "TTO", "USA", "URY", "VEN"
  ],
  "Asia": [
    "AFG", "ARM", "AZE", "BHR", "BGD", "BTN", "BRN", "KHM", "CHN", "CYP",
    "GEO", "IND", "IDN", "IRN", "IRQ", "ISR", "JPN", "JOR", "KAZ", "KWT",
    "KGZ", "LAO", "LBN", "MYS", "MDV", "MNG", "MMR", "NPL", "PRK", "OMN",
    "PAK", "PHL", "QAT", "SAU", "SGP", "KOR", "LKA", "SYR", "TJK", "THA",
    "TLS", "TKM", "ARE", "UZB", "VNM", "YEM", "PSE", "TWN"
  ],
  "Europe": [
    "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK",
    "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA",
    "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR",
    "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE",
    "CHE", "UKR", "GBR", "VAT"
  ],
  "Oceania": [
    "AUS", "FJI", "KIR", "MHL", "FSM", "NRU", "NZL", "PLW", "PNG", "WSM",
    "SLB", "TON", "TUV", "VUT"
  ],
};

// All countries flattened
const ALL_COUNTRIES = Object.values(COUNTRY_REGIONS).flat();

// Convert ISO alpha-2 to flag emoji
function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// =============================================================================
// COUNTRY CARD COMPONENT
// =============================================================================

interface CountryCardProps {
  isoCode: string;
  status: "pending" | "processing" | "success" | "failed";
  metric?: number | null;
}

function CountryCard({ isoCode, status, metric }: CountryCardProps) {
  const iso2 = ISO3_TO_ISO2[isoCode] || "UN";
  const flag = getFlagEmoji(iso2);
  const name = COUNTRY_NAMES[isoCode] || isoCode;
  
  // Animation variants
  const cardVariants = {
    pending: {
      borderColor: "rgba(100, 116, 139, 0.3)",
      backgroundColor: "rgba(30, 41, 59, 0.5)",
      scale: 1,
    },
    processing: {
      borderColor: ["rgba(59, 130, 246, 0.5)", "rgba(59, 130, 246, 1)", "rgba(59, 130, 246, 0.5)"],
      backgroundColor: "rgba(30, 58, 138, 0.3)",
      scale: [1, 1.02, 1],
      transition: {
        borderColor: { duration: 1, repeat: Infinity },
        scale: { duration: 1, repeat: Infinity },
      }
    },
    success: {
      borderColor: "rgba(34, 197, 94, 0.6)",
      backgroundColor: "rgba(22, 78, 55, 0.3)",
      scale: 1,
    },
    failed: {
      borderColor: "rgba(239, 68, 68, 0.6)",
      backgroundColor: "rgba(127, 29, 29, 0.3)",
      scale: 1,
    }
  };

  const flagVariants = {
    pending: { opacity: 0.4, scale: 0.9 },
    processing: { 
      opacity: 1, 
      scale: [1, 1.15, 1],
      transition: { scale: { duration: 0.8, repeat: Infinity } }
    },
    success: { opacity: 1, scale: 1 },
    failed: { opacity: 0.6, scale: 1 }
  };

  return (
    <motion.div
      className="relative p-2 rounded-lg border-2 overflow-hidden"
      initial="pending"
      animate={status}
      variants={cardVariants}
      layout
    >
      {/* Flag */}
      <motion.div 
        className="text-2xl text-center mb-1"
        variants={flagVariants}
        animate={status}
      >
        {flag}
      </motion.div>
      
      {/* Country Code */}
      <div className={`text-[10px] font-mono text-center font-bold ${
        status === "processing" ? "text-blue-300" :
        status === "success" ? "text-green-300" :
        status === "failed" ? "text-red-300" :
        "text-slate-500"
      }`}>
        {isoCode}
      </div>
      
      {/* Metric (on success) */}
      <AnimatePresence>
        {status === "success" && metric !== null && metric !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[9px] text-center text-green-400 font-mono mt-0.5"
          >
            {metric.toFixed(2)}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Processing indicator */}
      {status === "processing" && (
        <motion.div 
          className="absolute inset-0 bg-blue-500/10"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      
      {/* Status icons */}
      <div className="absolute top-0.5 right-0.5">
        {status === "processing" && (
          <Loader2 className="w-2.5 h-2.5 text-blue-400 animate-spin" />
        )}
        {status === "success" && (
          <CheckCircle2 className="w-2.5 h-2.5 text-green-400" />
        )}
        {status === "failed" && (
          <AlertCircle className="w-2.5 h-2.5 text-red-400" />
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-slate-900/90 flex items-center justify-center transition-opacity rounded-lg">
        <span className="text-[9px] text-slate-300 text-center px-1">{name}</span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// DATA SOURCE BADGES
// =============================================================================

const DATA_SOURCE_BADGES = [
  { id: "ILO", label: "ILO", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", description: "Fatal Rates" },
  { id: "WHO", label: "WHO", className: "bg-purple-500/20 text-purple-400 border-purple-500/30", description: "UHC Coverage" },
  { id: "WB", label: "World Bank", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", description: "Governance (6 indicators)" },
  { id: "CPI", label: "CPI", className: "bg-rose-500/20 text-rose-400 border-rose-500/30", description: "Corruption Index" },
  { id: "HDI", label: "HDI", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", description: "Human Development" },
  { id: "EPI", label: "EPI", className: "bg-teal-500/20 text-teal-400 border-teal-500/30", description: "Environment" },
  { id: "GBD", label: "IHME GBD", className: "bg-orange-500/20 text-orange-400 border-orange-500/30", description: "Disease Burden (10 DALYs)" },
  { id: "WJP", label: "WJP", className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", description: "Rule of Law" },
  { id: "OECD", label: "OECD", className: "bg-sky-500/20 text-sky-400 border-sky-500/30", description: "Work-Life Balance" },
];

// =============================================================================
// LOG FEED COMPONENT (Full-Height Panel)
// =============================================================================

interface LogFeedProps {
  logs: string[];
  isRunning: boolean;
}

function LogFeed({ logs, isRunning }: LogFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [logs]);

  // Extract timestamp from log
  const parseLog = (log: string) => {
    const timestampMatch = log.match(/\[(\d{2}:\d{2}:\d{2})\.\d{3}\]/);
    const timestamp = timestampMatch ? timestampMatch[1] : "";
    const content = log.replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]\s*/, "").trim();
    return { timestamp, content };
  };

  // Determine log styling and icon based on content
  const getLogStyle = (log: string) => {
    if (log.includes("✓") || log.includes("SUCCESS") || log.includes("Saved") || log.includes("hits")) 
      return { color: "text-green-400", bg: "bg-green-500/10" };
    if (log.includes("✗") || log.includes("ERROR") || log.includes("FAILED") || log.includes("error")) 
      return { color: "text-red-400", bg: "bg-red-500/10" };
    if (log.includes("⚠") || log.includes("WARNING") || log.includes("PROXY")) 
      return { color: "text-yellow-400", bg: "bg-yellow-500/10" };
    if (log.includes("[PHASE]") || log.includes("DRAGNET") || log.includes("INTELLIGENCE") || log.includes("Starting")) 
      return { color: "text-cyan-400 font-bold", bg: "bg-cyan-500/20" };
    if (log.includes("ILO")) return { color: "text-blue-400", bg: "bg-blue-500/5" };
    if (log.includes("WHO")) return { color: "text-purple-400", bg: "bg-purple-500/5" };
    if (log.includes("World Bank") || log.includes("WB_")) return { color: "text-amber-400", bg: "bg-amber-500/5" };
    if (log.includes("CPI")) return { color: "text-rose-400", bg: "bg-rose-500/5" };
    if (log.includes("HDI") || log.includes("UNDP")) return { color: "text-emerald-400", bg: "bg-emerald-500/5" };
    if (log.includes("EPI")) return { color: "text-teal-400", bg: "bg-teal-500/5" };
    if (log.includes("GBD") || log.includes("IHME")) return { color: "text-orange-400", bg: "bg-orange-500/5" };
    if (log.includes("WJP")) return { color: "text-indigo-400", bg: "bg-indigo-500/5" };
    if (log.includes("OECD")) return { color: "text-sky-400", bg: "bg-sky-500/5" };
    if (log.includes("Fusion") || log.includes("Processing")) return { color: "text-emerald-400", bg: "" };
    if (log.includes("flag") || log.includes("Flag")) return { color: "text-pink-400", bg: "bg-pink-500/5" };
    return { color: "text-slate-400", bg: "" };
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Header with Data Source Badges */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-2 mb-3">
          <Activity className={`w-4 h-4 text-cyan-400 ${isRunning ? "animate-pulse" : ""}`} />
          <span className="text-sm text-cyan-400 font-semibold uppercase tracking-wider">
            Live Data Feed
          </span>
          {isRunning && (
            <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        
        {/* Data Source Badges */}
        <div className="flex flex-wrap gap-1.5">
          {DATA_SOURCE_BADGES.map((source) => (
            <div 
              key={source.id}
              className={`px-2 py-1 rounded text-[10px] font-medium border ${source.className}`}
              title={source.description}
            >
              {source.label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Log Entries */}
      <div 
        ref={feedRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs"
      >
        {logs.length === 0 && (
          <div className="text-slate-500 italic text-center py-8">
            Waiting for pipeline to start...
            <br />
            <span className="text-slate-600 text-[10px]">
              Data from 9+ sources will appear here
            </span>
          </div>
        )}
        
        {logs.map((log, idx) => {
          const { timestamp, content } = parseLog(log);
          const style = getLogStyle(content);
          
          return (
            <motion.div
              key={`${idx}-${log.slice(0, 30)}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex items-start gap-2 py-1 px-2 rounded ${style.bg}`}
            >
              {timestamp && (
                <span className="text-slate-600 flex-shrink-0 w-14">
                  {timestamp}
                </span>
              )}
              <span className={`${style.color} leading-relaxed`}>
                {content}
              </span>
            </motion.div>
          );
        })}
        
        {/* Auto-scroll anchor */}
        <div className="h-1" />
      </div>
      
      {/* Stats Footer */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-900/50 text-[10px] text-slate-500">
        {logs.length} log entries
      </div>
    </div>
  );
}

// =============================================================================
// COUNTRY SELECTION CARD COMPONENT
// =============================================================================

interface SelectableCountryCardProps {
  isoCode: string;
  isSelected: boolean;
  onToggle: (isoCode: string) => void;
}

function SelectableCountryCard({ isoCode, isSelected, onToggle }: SelectableCountryCardProps) {
  const iso2 = ISO3_TO_ISO2[isoCode] || "UN";
  const flag = getFlagEmoji(iso2);
  const name = COUNTRY_NAMES[isoCode] || isoCode;

  return (
    <motion.div
      onClick={() => onToggle(isoCode)}
      className={`relative p-2 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected 
          ? "border-cyan-500 bg-cyan-500/20" 
          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Selection checkbox */}
      <div className="absolute top-1 right-1">
        {isSelected ? (
          <CheckSquare className="w-3 h-3 text-cyan-400" />
        ) : (
          <Square className="w-3 h-3 text-slate-500" />
        )}
      </div>
      
      {/* Flag */}
      <div className={`text-2xl text-center mb-1 ${isSelected ? "opacity-100" : "opacity-60"}`}>
        {flag}
      </div>
      
      {/* Country Code */}
      <div className={`text-[10px] font-mono text-center font-bold ${
        isSelected ? "text-cyan-300" : "text-slate-500"
      }`}>
        {isoCode}
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-slate-900/90 flex items-center justify-center transition-opacity rounded-lg">
        <span className="text-[9px] text-slate-300 text-center px-1">{name}</span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

type ViewMode = "selection" | "processing";

export function VisualSyncConsole({ isOpen, onClose }: VisualSyncConsoleProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("selection");
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(ALL_COUNTRIES));
  const [fetchFlags, setFetchFlags] = useState(true);
  const hasInvalidatedRef = useRef(false); // Track if we've already invalidated after this sync
  const [status, setStatus] = useState<PipelineStatusResponse | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Group countries by region - all countries in database
  const countryGroups = useMemo(() => COUNTRY_REGIONS, []);

  // Toggle single country selection
  const toggleCountry = useCallback((isoCode: string) => {
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (next.has(isoCode)) {
        next.delete(isoCode);
      } else {
        next.add(isoCode);
      }
      return next;
    });
  }, []);

  // Select all countries
  const selectAll = useCallback(() => {
    setSelectedCountries(new Set(ALL_COUNTRIES));
  }, []);

  // Deselect all countries
  const deselectAll = useCallback(() => {
    setSelectedCountries(new Set());
  }, []);

  // Select countries by region
  const toggleRegion = useCallback((region: string) => {
    const regionCountries = countryGroups[region as keyof typeof countryGroups] || [];
    const allSelected = regionCountries.every(c => selectedCountries.has(c));
    
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (allSelected) {
        // Deselect all in region
        regionCountries.forEach(c => next.delete(c));
      } else {
        // Select all in region
        regionCountries.forEach(c => next.add(c));
      }
      return next;
    });
  }, [countryGroups, selectedCountries]);

  // Fetch status from API with retry logic
  const fetchStatus = useCallback(async () => {
    try {
      const response = await apiClient.get<PipelineStatusResponse>("/api/v1/etl/status", {
        timeout: 5000, // Short timeout for status polling
      });
      setStatus(response.data);
      setError(null); // Clear any previous errors on success
      
      // Stop polling if pipeline finished
      if (!response.data.is_running && response.data.finished_at && pollingRef.current) {
        // Invalidate all map-related queries to refresh data across the app
        if (!hasInvalidatedRef.current) {
          hasInvalidatedRef.current = true;
          console.log("[VisualSyncConsole] Pipeline finished - invalidating queries");
          queryClient.invalidateQueries({ queryKey: ["geojson-metadata"] });
          queryClient.invalidateQueries({ queryKey: ["countries"] });
          queryClient.invalidateQueries({ queryKey: ["source-registry"] });
        }
        
        // Keep polling a bit longer to catch final updates
        setTimeout(() => {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }, 2000);
      }
    } catch (err: any) {
      // Only log, don't stop polling - server might be temporarily busy
      console.warn("Status fetch failed (will retry):", err.message);
    }
  }, []);

  // Start the pipeline with retry logic
  const startPipeline = useCallback(async () => {
    if (selectedCountries.size === 0) {
      setError("Please select at least one country");
      return;
    }
    
    setIsStarting(true);
    setError(null);
    setViewMode("processing"); // Switch to processing view
    hasInvalidatedRef.current = false; // Reset invalidation flag for new run
    
    // Prepare request body with selected countries
    const requestBody = {
      countries: Array.from(selectedCountries),
      fetch_flags: fetchFlags
    };
    
    // Retry up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await apiClient.post("/api/v1/etl/run", requestBody, {
          timeout: 8000, // 8 second timeout for starting pipeline
        });
        
        if (response.data.success || response.status === 202) {
          // Start polling for status
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = setInterval(fetchStatus, 1500); // Poll every 1.5s
          
          // Initial fetch after short delay
          setTimeout(fetchStatus, 500);
          setIsStarting(false);
          return; // Success!
        } else {
          setError(response.data.message);
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 409) {
          // Pipeline already running - just start polling
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = setInterval(fetchStatus, 1500);
          setTimeout(fetchStatus, 500);
          setIsStarting(false);
          return;
        }
        
        if (attempt === 3) {
          setError(`Failed to connect to server after ${attempt} attempts. Is the backend running?`);
          console.error("Failed to start pipeline:", err);
          setViewMode("selection"); // Go back to selection on failure
        } else {
          console.warn(`Attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }
    
    setIsStarting(false);
  }, [fetchStatus, selectedCountries, fetchFlags]);

  // Check current ETL status manually
  const checkStatus = useCallback(async () => {
    try {
      const response = await apiClient.get<PipelineStatusResponse>("/api/v1/etl/status", {
        timeout: 5000,
      });
      setStatus(response.data);
      setError(null);
      
      // If pipeline is running, start polling
      if (response.data.is_running && !pollingRef.current) {
        pollingRef.current = setInterval(fetchStatus, 1500);
        setViewMode("processing");
      }
    } catch (err: any) {
      console.error("Status check failed:", err.message);
      setError("Failed to check status. Is the backend running?");
    }
  }, [fetchStatus]);

  // Stop the running pipeline
  const stopPipeline = useCallback(async () => {
    try {
      await apiClient.post("/api/v1/etl/stop", {}, {
        timeout: 5000,
      });
      // Immediately fetch updated status
      await fetchStatus();
    } catch (err: any) {
      console.error("Stop pipeline failed:", err.message);
      setError("Failed to stop pipeline");
    }
  }, [fetchStatus]);

  // Reset state when modal opens (don't auto-start anymore)
  useEffect(() => {
    if (isOpen) {
      // Reset to selection view when opening
      setViewMode("selection");
      setStatus(null);
      setError(null);
      // Keep previous selection or default to all
      if (selectedCountries.size === 0) {
        setSelectedCountries(new Set(ALL_COUNTRIES));
      }
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle close
  const handleClose = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStatus(null);
    setError(null);
    setViewMode("selection");
    onClose();
  };

  // Go back to selection view
  const goBackToSelection = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStatus(null);
    setError(null);
    setViewMode("selection");
  };

  // Get card status for a country
  const getCardStatus = (isoCode: string): "pending" | "processing" | "success" | "failed" => {
    if (!status) return "pending";
    
    if (status.current_country === isoCode) return "processing";
    if (status.completed_countries.includes(isoCode)) return "success";
    if (status.failed_countries.includes(isoCode)) return "failed";
    
    // Check country_data for more specific status
    const countryStatus = status.country_data[isoCode];
    if (countryStatus) {
      if (countryStatus.status === "processing") return "processing";
      if (countryStatus.status === "success") return "success";
      if (countryStatus.status === "failed") return "failed";
    }
    
    return "pending";
  };

  // Get metric for a country
  const getCardMetric = (isoCode: string): number | null | undefined => {
    if (!status?.country_data[isoCode]) return undefined;
    return status.country_data[isoCode].metric;
  };

  // Don't render if not open
  if (!isOpen) return null;

  const isRunning = status?.is_running ?? false;
  const isFinished = !isRunning && status?.finished_at !== null && viewMode === "processing";
  const progressPct = status ? (status.progress_count / status.total_countries) * 100 : 0;

  // Countries to display in processing view (only selected ones)
  const countriesToProcess = Array.from(selectedCountries);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/98 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Full-Screen Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative w-full h-full max-w-[98vw] max-h-[96vh] bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Live Operations Center</h2>
              <p className="text-xs text-slate-400">
                {viewMode === "selection" 
                  ? "Select countries to sync" 
                  : "Real-time ETL Pipeline Monitor"}
              </p>
            </div>
            
            {/* Status indicator */}
            {viewMode === "processing" && (
              <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-slate-800/50">
                {isStarting && (
                  <>
                    <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                    <span className="text-xs text-yellow-400">Initializing...</span>
                  </>
                )}
                {isRunning && !isStarting && (
                  <>
                    <motion.div 
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xs text-cyan-400">
                      Processing {status?.progress || `0/${selectedCountries.size}`}
                    </span>
                  </>
                )}
                {isFinished && (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">Complete</span>
                  </>
                )}
                {error && (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">Error</span>
                  </>
                )}
              </div>
            )}
            
            {viewMode === "selection" && (
              <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-slate-800/50">
                <Flag className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-cyan-400">
                  {selectedCountries.size} countries selected
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Back button (when processing) */}
            {viewMode === "processing" && isFinished && (
              <button
                onClick={goBackToSelection}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Back to Selection"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Progress Bar (only in processing mode) */}
        {viewMode === "processing" && (
          <div className="h-1 bg-slate-800">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        
        {/* ============================================================ */}
        {/* SELECTION VIEW */}
        {/* ============================================================ */}
        {viewMode === "selection" && (
          <>
            {/* Selection Controls */}
            <div className="px-6 py-3 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Deselect All
                </button>
                <div className="h-4 w-px bg-slate-700" />
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fetchFlags}
                    onChange={(e) => setFetchFlags(e.target.checked)}
                    className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Download flag images</span>
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Check Status Button */}
                <button
                  onClick={checkStatus}
                  className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Check current ETL status"
                >
                  <Eye className="w-4 h-4" />
                  Status
                </button>
                
                {/* Stop Button - only show if running */}
                {status?.is_running && (
                  <button
                    onClick={stopPipeline}
                    className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                    title="Stop running pipeline"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop
                  </button>
                )}
                
                {/* Start Button */}
                <button
                  onClick={startPipeline}
                  disabled={selectedCountries.size === 0 || isStarting || status?.is_running}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                    selectedCountries.size === 0 || status?.is_running
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-600 text-white"
                  }`}
                >
                  {isStarting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {status?.is_running ? "Running..." : `Start Sync (${selectedCountries.size})`}
                </button>
              </div>
            </div>
            
            {/* Country Selection Grid - Grouped by Region */}
            <div className="p-6 max-h-[55vh] overflow-y-auto">
              {Object.entries(countryGroups).map(([region, countries]) => {
                const regionSelected = countries.filter(c => selectedCountries.has(c)).length;
                const allSelected = regionSelected === countries.length;
                
                return (
                  <div key={region} className="mb-6 last:mb-0">
                    <div 
                      className="flex items-center gap-2 mb-3 cursor-pointer group"
                      onClick={() => toggleRegion(region)}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        allSelected 
                          ? "bg-cyan-500" 
                          : regionSelected > 0 
                            ? "bg-cyan-500/50" 
                            : "bg-slate-700"
                      }`}>
                        {allSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {!allSelected && regionSelected > 0 && (
                          <div className="w-2 h-2 bg-cyan-300 rounded-sm" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        {region}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({regionSelected}/{countries.length})
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-14 xl:grid-cols-18 gap-1">
                      {countries.map((isoCode) => (
                        <SelectableCountryCard
                          key={isoCode}
                          isoCode={isoCode}
                          isSelected={selectedCountries.has(isoCode)}
                          onToggle={toggleCountry}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        
        {/* ============================================================ */}
        {/* PROCESSING VIEW - Split Layout */}
        {/* ============================================================ */}
        {viewMode === "processing" && (
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT PANEL - Country Grid */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Country Grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                {error ? (
                  <div className="text-red-400 text-center p-8 border border-red-500/30 rounded-lg bg-red-950/20">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Pipeline Error</p>
                    <p className="text-sm opacity-70">{error}</p>
                    <button
                      onClick={goBackToSelection}
                      className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Back to Selection
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Current Country Highlight */}
                    {status?.current_country && (
                      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          <div>
                            <span className="text-blue-400 font-semibold">
                              Now Processing: {COUNTRY_NAMES[status.current_country] || status.current_country}
                            </span>
                            <span className="text-slate-400 text-sm ml-2">
                              ({status.current_country})
                            </span>
                          </div>
                          <div className="ml-auto text-sm text-slate-400">
                            {status.progress_count + 1} / {status.total_countries}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Country Grid */}
                    <div className="grid grid-cols-10 lg:grid-cols-14 xl:grid-cols-18 2xl:grid-cols-20 gap-1">
                      {countriesToProcess.map((isoCode) => (
                        <CountryCard
                          key={isoCode}
                          isoCode={isoCode}
                          status={getCardStatus(isoCode)}
                          metric={getCardMetric(isoCode)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Stats Footer */}
              <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500 bg-slate-900/50">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-medium">{status?.completed_countries.length || 0}</span> Success
                  </span>
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">{status?.failed_countries.length || 0}</span> Failed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400 font-medium">
                      {countriesToProcess.length - (status?.completed_countries.length || 0) - (status?.failed_countries.length || 0)}
                    </span> Pending
                  </span>
                </div>
                <span className="text-slate-600">Press ESC to close</span>
              </div>
            </div>
            
            {/* RIGHT PANEL - Live Log Feed (40% width) */}
            <div className="w-[40%] min-w-[400px] max-w-[600px] border-l border-slate-700/50 flex flex-col">
              <LogFeed logs={status?.logs || []} isRunning={isRunning} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default VisualSyncConsole;
