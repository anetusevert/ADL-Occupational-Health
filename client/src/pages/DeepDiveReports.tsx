/**
 * Arthur D. Little - Global Health Platform
 * Deep Dive Reports Dashboard
 * 
 * Real-time dashboard showing:
 * - Global generation statistics
 * - Country cards with completion status
 * - Topic-level progress tracking
 * - Inline report viewing
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Globe,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  FileText,
  Search,
  Activity,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react";
import {
  getStrategicDeepDiveCountries,
  getStrategicDeepDiveReport,
  getCountryTopicStatuses,
  type CountryDeepDiveItem,
  type TopicStatus,
} from "../services/api";
import { cn } from "../lib/utils";

// =============================================================================
// CONSTANTS
// =============================================================================

const CONTINENT_ORDER = ["GCC", "Europe", "Americas", "Asia", "Africa", "Oceania"];

const CONTINENT_MAP: Record<string, string> = {
  // GCC countries
  BHR: "GCC", KWT: "GCC", OMN: "GCC", QAT: "GCC", SAU: "GCC", ARE: "GCC",
  // Africa
  DZA: "Africa", AGO: "Africa", BEN: "Africa", BWA: "Africa", BFA: "Africa",
  BDI: "Africa", CPV: "Africa", CMR: "Africa", CAF: "Africa", TCD: "Africa",
  COM: "Africa", COG: "Africa", COD: "Africa", CIV: "Africa", DJI: "Africa",
  EGY: "Africa", GNQ: "Africa", ERI: "Africa", SWZ: "Africa", ETH: "Africa",
  GAB: "Africa", GMB: "Africa", GHA: "Africa", GIN: "Africa", GNB: "Africa",
  KEN: "Africa", LSO: "Africa", LBR: "Africa", LBY: "Africa", MDG: "Africa",
  MWI: "Africa", MLI: "Africa", MRT: "Africa", MUS: "Africa", MAR: "Africa",
  MOZ: "Africa", NAM: "Africa", NER: "Africa", NGA: "Africa", RWA: "Africa",
  STP: "Africa", SEN: "Africa", SYC: "Africa", SLE: "Africa", SOM: "Africa",
  ZAF: "Africa", SSD: "Africa", SDN: "Africa", TZA: "Africa", TGO: "Africa",
  TUN: "Africa", UGA: "Africa", ZMB: "Africa", ZWE: "Africa",
  // Americas
  ATG: "Americas", ARG: "Americas", BHS: "Americas", BRB: "Americas", BLZ: "Americas",
  BOL: "Americas", BRA: "Americas", CAN: "Americas", CHL: "Americas", COL: "Americas",
  CRI: "Americas", CUB: "Americas", DMA: "Americas", DOM: "Americas", ECU: "Americas",
  SLV: "Americas", GRD: "Americas", GTM: "Americas", GUY: "Americas", HTI: "Americas",
  HND: "Americas", JAM: "Americas", MEX: "Americas", NIC: "Americas", PAN: "Americas",
  PRY: "Americas", PER: "Americas", KNA: "Americas", LCA: "Americas", VCT: "Americas",
  SUR: "Americas", TTO: "Americas", USA: "Americas", URY: "Americas", VEN: "Americas",
  // Asia
  AFG: "Asia", ARM: "Asia", AZE: "Asia", BGD: "Asia", BTN: "Asia",
  BRN: "Asia", KHM: "Asia", CHN: "Asia", CYP: "Asia", GEO: "Asia", IND: "Asia",
  IDN: "Asia", IRN: "Asia", IRQ: "Asia", ISR: "Asia", JPN: "Asia", JOR: "Asia",
  KAZ: "Asia", KGZ: "Asia", LAO: "Asia", LBN: "Asia", MYS: "Asia",
  MDV: "Asia", MNG: "Asia", MMR: "Asia", NPL: "Asia", PRK: "Asia",
  PAK: "Asia", PHL: "Asia", SGP: "Asia", KOR: "Asia",
  LKA: "Asia", SYR: "Asia", TJK: "Asia", THA: "Asia", TLS: "Asia", TKM: "Asia",
  UZB: "Asia", VNM: "Asia", YEM: "Asia", PSE: "Asia", TWN: "Asia",
  // Europe
  ALB: "Europe", AND: "Europe", AUT: "Europe", BLR: "Europe", BEL: "Europe",
  BIH: "Europe", BGR: "Europe", HRV: "Europe", CZE: "Europe", DNK: "Europe",
  EST: "Europe", FIN: "Europe", FRA: "Europe", DEU: "Europe", GRC: "Europe",
  HUN: "Europe", ISL: "Europe", IRL: "Europe", ITA: "Europe", LVA: "Europe",
  LIE: "Europe", LTU: "Europe", LUX: "Europe", MLT: "Europe", MDA: "Europe",
  MCO: "Europe", MNE: "Europe", NLD: "Europe", MKD: "Europe", NOR: "Europe",
  POL: "Europe", PRT: "Europe", ROU: "Europe", RUS: "Europe", SMR: "Europe",
  SRB: "Europe", SVK: "Europe", SVN: "Europe", ESP: "Europe", SWE: "Europe",
  CHE: "Europe", TUR: "Europe", UKR: "Europe", GBR: "Europe", VAT: "Europe",
  // Oceania
  AUS: "Oceania", FJI: "Oceania", KIR: "Oceania", MHL: "Oceania", FSM: "Oceania",
  NRU: "Oceania", NZL: "Oceania", PLW: "Oceania", PNG: "Oceania", WSM: "Oceania",
  SLB: "Oceania", TON: "Oceania", TUV: "Oceania", VUT: "Oceania",
};

// ISO3 to ISO2 mapping for flag URLs
const ISO3_TO_ISO2: Record<string, string> = {
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

function getFlagUrl(iso3: string): string {
  const iso2 = ISO3_TO_ISO2[iso3.toUpperCase()] || iso3.slice(0, 2).toLowerCase();
  return `https://flagcdn.com/w40/${iso2}.png`;
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          Complete
        </span>
      );
    case "processing":
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
          <Loader2 className="w-3 h-3 animate-spin" />
          Generating
        </span>
      );
    case "pending":
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
          <Clock className="w-3 h-3" />
          Queued
        </span>
      );
    case "failed":
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return null;
  }
}

interface CountryCardProps {
  country: CountryDeepDiveItem;
  isExpanded: boolean;
  onToggle: () => void;
  onViewReport: (topic: string) => void;
  topicStatuses: Record<string, TopicStatus>;
  isLoadingTopics: boolean;
}

function CountryCard({ 
  country, 
  isExpanded, 
  onToggle, 
  onViewReport,
  topicStatuses,
  isLoadingTopics,
}: CountryCardProps) {
  const completedCount = country.completed_reports || 0;
  const totalTopics = 13;
  const hasProcessing = country.deep_dive_status === "processing";
  
  return (
    <motion.div
      layout
      className={cn(
        "bg-slate-800/50 border rounded-xl overflow-hidden transition-colors",
        isExpanded ? "border-adl-accent/50" : "border-slate-700/50 hover:border-slate-600"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <img
          src={getFlagUrl(country.iso_code)}
          alt={country.name}
          className="w-8 h-5 object-cover rounded shadow-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{country.name}</span>
            {hasProcessing && (
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{country.iso_code}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className={cn(
              "text-xs",
              completedCount === totalTopics ? "text-emerald-400" : "text-slate-400"
            )}>
              {completedCount}/{totalTopics} reports
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {isLoadingTopics ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-adl-accent animate-spin" />
                </div>
              ) : Object.keys(topicStatuses).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No reports generated yet
                </p>
              ) : (
                Object.entries(topicStatuses).map(([topic, status]) => (
                  <button
                    key={topic}
                    onClick={() => status.has_report && onViewReport(topic)}
                    disabled={!status.has_report}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      status.has_report 
                        ? "hover:bg-slate-700/50 cursor-pointer" 
                        : "cursor-default opacity-60"
                    )}
                  >
                    {status.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : status.status === "processing" ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                    ) : status.status === "pending" ? (
                      <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-sm text-slate-300 truncate">{topic}</span>
                    {status.has_report && (
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ReportViewerProps {
  country: CountryDeepDiveItem;
  topic: string;
  onClose: () => void;
}

function ReportViewer({ country, topic, onClose }: ReportViewerProps) {
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["deep-dive-report", country.iso_code, topic],
    queryFn: () => getStrategicDeepDiveReport(country.iso_code, topic),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <img
              src={getFlagUrl(country.iso_code)}
              alt={country.name}
              className="w-8 h-5 object-cover rounded shadow-sm"
            />
            <div>
              <h2 className="text-white font-semibold">{country.name}</h2>
              <p className="text-xs text-slate-400">{topic}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-adl-accent animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400">Failed to load report</p>
            </div>
          ) : reportData?.report ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div 
                className="text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: reportData.report
                    .replace(/^# /gm, '<h1 class="text-2xl font-bold text-white mb-4">')
                    .replace(/^## /gm, '<h2 class="text-xl font-semibold text-white mt-6 mb-3">')
                    .replace(/^### /gm, '<h3 class="text-lg font-medium text-slate-200 mt-4 mb-2">')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\n\n/g, '</p><p class="mb-4">')
                    .replace(/^- /gm, '<li class="ml-4">• ')
                }}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No report content available</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DeepDiveReports() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State from navigation (when redirected from wizard)
  const navigationState = location.state as { 
    queuedCountry?: string; 
    queuedTopic?: string;
    message?: string;
  } | null;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCountry, setExpandedCountry] = useState<string | null>(
    navigationState?.queuedCountry || null
  );
  const [selectedReport, setSelectedReport] = useState<{
    country: CountryDeepDiveItem;
    topic: string;
  } | null>(null);
  const [showMessage, setShowMessage] = useState(!!navigationState?.message);

  // Clear navigation state after showing message
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  // Fetch countries with polling
  const {
    data: countriesResponse,
    isLoading: isLoadingCountries,
    refetch: refetchCountries,
  } = useQuery({
    queryKey: ["deep-dive-countries-dashboard"],
    queryFn: getStrategicDeepDiveCountries,
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000, // Poll every 5 seconds
  });

  // Fetch topic statuses for expanded country
  const { data: topicStatusesData, isLoading: isLoadingTopics } = useQuery({
    queryKey: ["deep-dive-topics", expandedCountry],
    queryFn: () => expandedCountry ? getCountryTopicStatuses(expandedCountry) : null,
    enabled: !!expandedCountry,
    staleTime: 5 * 1000,
    refetchInterval: expandedCountry ? 5 * 1000 : false,
  });

  const countries = countriesResponse?.countries ?? [];
  const stats = countriesResponse?.stats;
  const topicStatuses = topicStatusesData?.topics ?? {};

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.iso_code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  // Group countries by continent
  const groupedCountries = useMemo(() => {
    const groups: Record<string, CountryDeepDiveItem[]> = {};
    
    for (const country of filteredCountries) {
      const continent = CONTINENT_MAP[country.iso_code] || "Other";
      if (!groups[continent]) groups[continent] = [];
      groups[continent].push(country);
    }
    
    // Sort continents by CONTINENT_ORDER
    const sortedGroups: Record<string, CountryDeepDiveItem[]> = {};
    for (const continent of CONTINENT_ORDER) {
      if (groups[continent]) {
        sortedGroups[continent] = groups[continent].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      }
    }
    if (groups["Other"]) {
      sortedGroups["Other"] = groups["Other"];
    }
    
    return sortedGroups;
  }, [filteredCountries]);

  // Calculate processing count
  const processingCount = useMemo(() => {
    return countries.filter(c => c.deep_dive_status === "processing").length;
  }, [countries]);

  const handleToggleCountry = useCallback((isoCode: string) => {
    setExpandedCountry(prev => prev === isoCode ? null : isoCode);
  }, []);

  const handleViewReport = useCallback((country: CountryDeepDiveItem, topic: string) => {
    setSelectedReport({ country, topic });
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/deep-dive")}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Deep Dive Reports
            </h1>
            <p className="text-white/40 text-sm">
              Real-time generation status
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {processingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-sm text-amber-400">{processingCount} generating</span>
            </div>
          )}
          <button
            onClick={() => refetchCountries()}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Success message from navigation */}
      <AnimatePresence>
        {showMessage && navigationState?.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
          >
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-300">{navigationState.message}</span>
            <button 
              onClick={() => setShowMessage(false)}
              className="ml-auto p-1 hover:bg-slate-700/50 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Stats Bar */}
      {stats && (
        <div className="flex-shrink-0 grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Completed</span>
            </div>
            <span className="text-2xl font-bold text-emerald-400">{stats.completed || 0}</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Processing</span>
            </div>
            <span className="text-2xl font-bold text-amber-400">{stats.processing || 0}</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Pending</span>
            </div>
            <span className="text-2xl font-bold text-blue-400">{stats.pending || 0}</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-adl-accent" />
              <span className="text-xs text-slate-400">Total</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {(stats.completed || 0) + (stats.processing || 0) + (stats.pending || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex-shrink-0 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-adl-accent/50"
          />
        </div>
      </div>

      {/* Countries Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingCountries ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-adl-accent animate-spin" />
          </div>
        ) : Object.keys(groupedCountries).length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No countries found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCountries).map(([continent, continentCountries]) => (
              <div key={continent}>
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {continent}
                  <span className="text-slate-500">({continentCountries.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {continentCountries.map((country) => (
                    <CountryCard
                      key={country.iso_code}
                      country={country}
                      isExpanded={expandedCountry === country.iso_code}
                      onToggle={() => handleToggleCountry(country.iso_code)}
                      onViewReport={(topic) => handleViewReport(country, topic)}
                      topicStatuses={expandedCountry === country.iso_code ? topicStatuses : {}}
                      isLoadingTopics={isLoadingTopics && expandedCountry === country.iso_code}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      <AnimatePresence>
        {selectedReport && (
          <ReportViewer
            country={selectedReport.country}
            topic={selectedReport.topic}
            onClose={() => setSelectedReport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default DeepDiveReports;
