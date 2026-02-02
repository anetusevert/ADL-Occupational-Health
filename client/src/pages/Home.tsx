/**
 * Arthur D. Little - Global Health Platform
 * Home Page - Global Intelligence Overview
 * Viewport-fit design with no scrolling
 * 
 * Phase 20.2: Uses optimized /geojson-metadata endpoint for map data
 * Phase 21: Enhanced stat modals + Quick Access filters
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Globe2, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  Loader2, 
  Activity,
  X,
  Filter,
  ArrowUpDown,
  MapPin,
  BarChart3,
  ExternalLink,
  Gauge,
  Shield,
  Eye,
  HeartPulse
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalMap } from "../components";
import { ADLIcon } from "../components/ADLLogo";
import { PillarSelectionModal } from "../components/PillarSelectionModal";
import { apiClient } from "../services/api";
import { cn, getApiBaseUrl, getEffectiveOHIScore } from "../lib/utils";
import { useGeneration } from "../contexts/GenerationContext";
import type { MapCountryData, MapMetric, GeoJSONMetadataResponse } from "../types/country";

// =============================================================================
// CONTINENT MAPPING
// =============================================================================

const CONTINENT_MAP: Record<string, string> = {
  // Africa
  DZA: "Africa", AGO: "Africa", BEN: "Africa", BWA: "Africa", BFA: "Africa",
  BDI: "Africa", CPV: "Africa", CMR: "Africa", CAF: "Africa", TCD: "Africa",
  COM: "Africa", COG: "Africa", COD: "Africa", CIV: "Africa", DJI: "Africa",
  EGY: "Africa", GNQ: "Africa", ERI: "Africa", SWZ: "Africa", ETH: "Africa",
  GAB: "Africa", GMB: "Africa", GHA: "Africa", GIN: "Africa", GNB: "Africa",
  KEN: "Africa", LSO: "Africa", LBR: "Africa", LBY: "Africa", MDG: "Africa",
  MWI: "Africa", MLI: "Africa", MRT: "Africa", MUS: "Africa", MAR: "Africa",
  MOZ: "Africa", NAM: "Africa", NER: "Africa", NGA: "Africa", RWA: "Africa",
  SEN: "Africa", SYC: "Africa", SLE: "Africa", SOM: "Africa", ZAF: "Africa",
  SSD: "Africa", SDN: "Africa", TZA: "Africa", TGO: "Africa", TUN: "Africa",
  UGA: "Africa", ZMB: "Africa", ZWE: "Africa",
  // Americas
  ARG: "Americas", BHS: "Americas", BRB: "Americas", BLZ: "Americas", BOL: "Americas",
  BRA: "Americas", CAN: "Americas", CHL: "Americas", COL: "Americas", CRI: "Americas",
  CUB: "Americas", DOM: "Americas", ECU: "Americas", SLV: "Americas", GTM: "Americas",
  GUY: "Americas", HTI: "Americas", HND: "Americas", JAM: "Americas", MEX: "Americas",
  NIC: "Americas", PAN: "Americas", PRY: "Americas", PER: "Americas", SUR: "Americas",
  TTO: "Americas", USA: "Americas", URY: "Americas", VEN: "Americas",
  // Asia
  AFG: "Asia", ARM: "Asia", AZE: "Asia", BHR: "Asia", BGD: "Asia", BTN: "Asia",
  BRN: "Asia", KHM: "Asia", CHN: "Asia", CYP: "Asia", GEO: "Asia", IND: "Asia",
  IDN: "Asia", IRN: "Asia", IRQ: "Asia", ISR: "Asia", JPN: "Asia", JOR: "Asia",
  KAZ: "Asia", KWT: "Asia", KGZ: "Asia", LAO: "Asia", LBN: "Asia", MYS: "Asia",
  MDV: "Asia", MNG: "Asia", MMR: "Asia", NPL: "Asia", PRK: "Asia", OMN: "Asia",
  PAK: "Asia", PHL: "Asia", QAT: "Asia", SAU: "Asia", SGP: "Asia", KOR: "Asia",
  LKA: "Asia", SYR: "Asia", TWN: "Asia", TJK: "Asia", THA: "Asia", TLS: "Asia",
  TUR: "Asia", TKM: "Asia", ARE: "Asia", UZB: "Asia", VNM: "Asia", YEM: "Asia",
  // Europe
  ALB: "Europe", AND: "Europe", AUT: "Europe", BLR: "Europe", BEL: "Europe",
  BIH: "Europe", BGR: "Europe", HRV: "Europe", CZE: "Europe", DNK: "Europe",
  EST: "Europe", FIN: "Europe", FRA: "Europe", DEU: "Europe", GRC: "Europe",
  HUN: "Europe", ISL: "Europe", IRL: "Europe", ITA: "Europe", LVA: "Europe",
  LIE: "Europe", LTU: "Europe", LUX: "Europe", MLT: "Europe", MDA: "Europe",
  MCO: "Europe", MNE: "Europe", NLD: "Europe", MKD: "Europe", NOR: "Europe",
  POL: "Europe", PRT: "Europe", ROU: "Europe", RUS: "Europe", SMR: "Europe",
  SRB: "Europe", SVK: "Europe", SVN: "Europe", ESP: "Europe", SWE: "Europe",
  CHE: "Europe", UKR: "Europe", GBR: "Europe", VAT: "Europe",
  // Oceania
  AUS: "Oceania", FJI: "Oceania", KIR: "Oceania", MHL: "Oceania", FSM: "Oceania",
  NRU: "Oceania", NZL: "Oceania", PLW: "Oceania", PNG: "Oceania", WSM: "Oceania",
  SLB: "Oceania", TON: "Oceania", TUV: "Oceania", VUT: "Oceania",
};

const CONTINENTS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania"];

type SortOption = "name-asc" | "name-desc" | "score-high" | "score-low";
type MaturityFilter = "all" | "resilient" | "proactive" | "compliant" | "reactive";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "score-high", label: "Score (High→Low)" },
  { value: "score-low", label: "Score (Low→High)" },
];

const MATURITY_FILTERS: { value: MaturityFilter; label: string; color: string }[] = [
  { value: "all", label: "All Stages", color: "text-white" },
  { value: "resilient", label: "Resilient (≥3.5)", color: "text-emerald-400" },
  { value: "proactive", label: "Proactive (3.0-3.4)", color: "text-lime-400" },
  { value: "compliant", label: "Compliant (2.0-2.9)", color: "text-orange-400" },
  { value: "reactive", label: "Reactive (<2.0)", color: "text-red-400" },
];

// =============================================================================
// MODAL TYPES
// =============================================================================

type ModalType = "countries" | "maturity" | "data" | null;

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeGenerations, isGenerating } = useGeneration();
  const [selectedMetric, setSelectedMetric] = useState<MapMetric>("maturity_score");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [hoveredCountry, setHoveredCountry] = useState<MapCountryData | null>(null);
  
  // View Selection Modal state
  const [viewSelectionCountry, setViewSelectionCountry] = useState<MapCountryData | null>(null);
  
  // Pending pillar modal ISO code (set from navigation state)
  const [pendingPillarModalIso, setPendingPillarModalIso] = useState<string | null>(null);
  
  // Quick Access Filters
  const [continentFilter, setContinentFilter] = useState<string>("All");
  const [maturityFilter, setMaturityFilter] = useState<MaturityFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch map data from optimized geojson-metadata endpoint
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ["geojson-metadata"],
    queryFn: async (): Promise<GeoJSONMetadataResponse> => {
      const response = await apiClient.get<GeoJSONMetadataResponse>("/api/v1/countries/geojson-metadata");
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds - refresh more often
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Transform GeoJSON metadata to MapCountryData format (Framework-Aligned)
  // Uses calculated OHI score from pillar scores for consistency
  const mapCountries: MapCountryData[] = useMemo(() => 
    (data?.countries || []).map((c) => ({
      iso_code: c.iso_code,
      name: c.name,
      // Calculate OHI score from pillar scores for accuracy
      maturity_score: getEffectiveOHIScore(
        c.maturity_score,
        c.governance_score,
        c.pillar1_score,
        c.pillar2_score,
        c.pillar3_score
      ),
      governance_score: c.governance_score,
      pillar1_score: c.pillar1_score,
      pillar2_score: c.pillar2_score,
      pillar3_score: c.pillar3_score,
      flag_url: c.flag_url,
    })),
    [data]
  );
  
  // Check for navigation state to open pillar selection modal
  // Combined effect: tries to open immediately if data available, otherwise sets pending
  useEffect(() => {
    const state = location.state as { openPillarModal?: string } | null;
    if (state?.openPillarModal) {
      const isoToOpen = state.openPillarModal;
      
      // Clear the navigation state immediately to prevent re-processing
      window.history.replaceState({}, document.title);
      
      // If data is already loaded, open modal immediately
      if (mapCountries.length > 0) {
        const country = mapCountries.find(c => c.iso_code === isoToOpen);
        if (country) {
          setViewSelectionCountry(country);
          return; // Done - modal opened
        }
      }
      
      // Data not loaded yet - set pending and let the fallback effect handle it
      setPendingPillarModalIso(isoToOpen);
    }
  }, [location.state, mapCountries]);
  
  // Fallback: Open modal when data loads and we have a pending ISO
  useEffect(() => {
    if (pendingPillarModalIso && mapCountries.length > 0) {
      const country = mapCountries.find(c => c.iso_code === pendingPillarModalIso);
      if (country) {
        setViewSelectionCountry(country);
      }
      // Always clear pending, even if country not found (prevents infinite loops)
      setPendingPillarModalIso(null);
    }
  }, [pendingPillarModalIso, mapCountries]);

  // Stats calculations
  const totalCountries = mapCountries.length;
  const avgMaturity = useMemo(() => {
    const validScores = mapCountries.filter(c => c.maturity_score !== null);
    if (validScores.length === 0) return 0;
    return validScores.reduce((sum, c) => sum + (c.maturity_score || 0), 0) / validScores.length;
  }, [mapCountries]);
  
  // Maturity breakdown
  const maturityBreakdown = useMemo(() => {
    const breakdown = { resilient: 0, proactive: 0, compliant: 0, reactive: 0, noData: 0 };
    mapCountries.forEach(c => {
      if (c.maturity_score === null) breakdown.noData++;
      else if (c.maturity_score >= 3.5) breakdown.resilient++;
      else if (c.maturity_score >= 3.0) breakdown.proactive++;
      else if (c.maturity_score >= 2.0) breakdown.compliant++;
      else breakdown.reactive++;
    });
    return breakdown;
  }, [mapCountries]);

  // Continent breakdown
  const continentBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    mapCountries.forEach(c => {
      const continent = CONTINENT_MAP[c.iso_code] || "Unknown";
      breakdown[continent] = (breakdown[continent] || 0) + 1;
    });
    return breakdown;
  }, [mapCountries]);

  // Filtered and sorted countries for Quick Access
  const filteredCountries = useMemo(() => {
    let filtered = [...mapCountries];
    
    // Continent filter
    if (continentFilter !== "All") {
      filtered = filtered.filter(c => CONTINENT_MAP[c.iso_code] === continentFilter);
    }
    
    // Maturity filter
    if (maturityFilter !== "all") {
      filtered = filtered.filter(c => {
        const score = c.maturity_score;
        if (score === null) return false;
        switch (maturityFilter) {
          case "resilient": return score >= 3.5;
          case "proactive": return score >= 3.0 && score < 3.5;
          case "compliant": return score >= 2.0 && score < 3.0;
          case "reactive": return score < 2.0;
          default: return true;
        }
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "score-high": return (b.maturity_score ?? -1) - (a.maturity_score ?? -1);
        case "score-low": return (a.maturity_score ?? 999) - (b.maturity_score ?? 999);
        default: return 0;
      }
    });
    
    return filtered;
  }, [mapCountries, continentFilter, maturityFilter, sortOption]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header - Fixed */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Global Intelligence Overview
          </h1>
          <p className="text-white/50 text-sm mt-0.5">
            Sovereign occupational health status across nations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-adl-accent/10 border border-adl-accent/20 rounded-lg">
            <Activity className="w-3.5 h-3.5 text-adl-accent animate-pulse" />
            <span className="text-xs text-adl-accent font-medium">Live Data</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <Globe2 className="w-3.5 h-3.5 text-white/60" />
            <span className="text-xs text-white/60 font-medium">
              {totalCountries} Countries
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Flexible */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Map Section - Takes most space */}
        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-adl-navy/80 z-10">
                <div className="flex items-center gap-3 text-adl-accent">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-medium">Loading intelligence data...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-6">
                  <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400 font-medium">Failed to load country data</p>
                  <p className="text-sm text-white/40 mt-1">
                    Ensure backend server is running
                  </p>
                </div>
              </div>
            )}

            {!error && (
              <GlobalMap
                countries={mapCountries}
                onCountryClick={(iso) => {
                  const country = mapCountries.find(c => c.iso_code === iso);
                  if (country) {
                    setViewSelectionCountry(country);
                  }
                }}
                onHoverCountry={setHoveredCountry}
                showLabels={false}
                className="h-full"
                selectedMetric={selectedMetric}
                onMetricChange={setSelectedMetric}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Stats & Quick Access */}
        <div className="lg:w-72 xl:w-80 flex flex-col gap-4 lg:h-full">
          {/* Stats Cards - Compact Row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal("countries")}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-adl-accent/30 transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-adl-accent/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="w-4 h-4 text-adl-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{totalCountries}</p>
                  <p className="text-[10px] text-white/40">Countries</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setActiveModal("maturity")}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:border-emerald-500/30 transition-all text-left group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ADLIcon size="xs" animate={false} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">
                    {avgMaturity > 0 ? avgMaturity.toFixed(1) : "—"}
                  </p>
                  <p className="text-[10px] text-white/40">OHI Score</p>
                </div>
              </div>
            </button>
          </div>

          {/* Quick Access - With Filters or Dynamic Country Profile */}
          {mapCountries.length > 0 && (
            <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
              {/* Header with Filter Toggle */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  {hoveredCountry ? "Country Profile" : "Quick Access"}
                </h2>
                {!hoveredCountry && (
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      showFilters ? "bg-adl-accent/20 text-adl-accent" : "text-white/40 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Dynamic Country Profile on Hover */}
              <AnimatePresence mode="wait">
                {hoveredCountry && (
                  <motion.div
                    key="country-profile"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 overflow-auto p-4"
                  >
                    {/* Country Header */}
                    <div className="flex items-center gap-3 mb-4">
                      {hoveredCountry.flag_url && (
                        <img 
                          src={`${getApiBaseUrl()}${hoveredCountry.flag_url}`}
                          alt={hoveredCountry.name}
                          className="w-10 h-7 object-cover rounded shadow-lg border border-white/20"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{hoveredCountry.name}</p>
                        <p className="text-xs text-white/40">
                          {hoveredCountry.iso_code} • {CONTINENT_MAP[hoveredCountry.iso_code] || "Unknown"}
                        </p>
                      </div>
                    </div>
                    
                    {/* ADL OHI Score - Prominent */}
                    <div className="bg-gradient-to-r from-adl-accent/20 to-cyan-500/10 rounded-lg p-3 mb-4 border border-adl-accent/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ADLIcon size="xs" animate={false} />
                          <span className="text-xs text-white/60">OHI Score</span>
                        </div>
                        <span className={cn(
                          "text-xl font-bold",
                          hoveredCountry.maturity_score !== null && hoveredCountry.maturity_score >= 3.5 ? "text-emerald-400"
                          : hoveredCountry.maturity_score !== null && hoveredCountry.maturity_score >= 3.0 ? "text-lime-400"
                          : hoveredCountry.maturity_score !== null && hoveredCountry.maturity_score >= 2.0 ? "text-orange-400"
                          : "text-red-400"
                        )}>
                          {hoveredCountry.maturity_score?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Framework Pillar Scores */}
                    <div className="space-y-2.5">
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">Framework Scores</p>
                      
                      {/* Governance */}
                      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-7 h-7 bg-amber-500/20 rounded flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/80">Governance</p>
                        </div>
                        <span className="text-sm font-semibold text-amber-400">
                          {hoveredCountry.governance_score?.toFixed(0) || "—"}
                        </span>
                      </div>
                      
                      {/* Pillar 1: Hazard Control */}
                      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-7 h-7 bg-red-500/20 rounded flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/80">Hazard Control</p>
                        </div>
                        <span className="text-sm font-semibold text-red-400">
                          {hoveredCountry.pillar1_score?.toFixed(0) || "—"}
                        </span>
                      </div>
                      
                      {/* Pillar 2: Health Vigilance */}
                      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-7 h-7 bg-cyan-500/20 rounded flex items-center justify-center">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/80">Health Vigilance</p>
                        </div>
                        <span className="text-sm font-semibold text-cyan-400">
                          {hoveredCountry.pillar2_score?.toFixed(0) || "—"}
                        </span>
                      </div>
                      
                      {/* Pillar 3: Restoration */}
                      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="w-7 h-7 bg-pink-500/20 rounded flex items-center justify-center">
                          <HeartPulse className="w-3.5 h-3.5 text-pink-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/80">Restoration</p>
                        </div>
                        <span className="text-sm font-semibold text-pink-400">
                          {hoveredCountry.pillar3_score?.toFixed(0) || "—"}
                        </span>
                      </div>
                    </div>
                    
                    {/* View Full Profile Link */}
                    <button
                      onClick={() => setViewSelectionCountry(hoveredCountry)}
                      className="w-full mt-4 py-2.5 px-4 bg-adl-accent/20 hover:bg-adl-accent/30 text-adl-accent text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      View Full Profile
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Quick Access List - Shows when not hovering on a country */}
              {!hoveredCountry && (
                <>
                  {/* Filters Panel */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex-shrink-0 border-b border-white/5 overflow-hidden"
                      >
                        <div className="p-3 space-y-3">
                          {/* Continent Filter */}
                          <div>
                            <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Continent
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {CONTINENTS.map(c => (
                                <button
                                  key={c}
                                  onClick={() => setContinentFilter(c)}
                                  className={cn(
                                    "px-2 py-1 text-[10px] rounded transition-colors",
                                    continentFilter === c
                                      ? "bg-adl-accent text-white"
                                      : "bg-white/5 text-white/60 hover:bg-white/10"
                                  )}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Maturity Filter */}
                          <div>
                            <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" /> OHI Stage
                            </label>
                            <select
                              value={maturityFilter}
                              onChange={(e) => setMaturityFilter(e.target.value as MaturityFilter)}
                              className="w-full px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white appearance-none cursor-pointer"
                            >
                              {MATURITY_FILTERS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Sort */}
                          <div>
                            <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <ArrowUpDown className="w-3 h-3" /> Sort By
                            </label>
                            <select
                              value={sortOption}
                              onChange={(e) => setSortOption(e.target.value as SortOption)}
                              className="w-full px-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-white appearance-none cursor-pointer"
                            >
                              {SORT_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Results Count */}
                  <div className="flex-shrink-0 px-4 py-2 text-[10px] text-white/30 border-b border-white/5">
                    Showing {filteredCountries.length} of {mapCountries.length} countries
                  </div>
                  
                  {/* Scrollable List */}
                  <div className="flex-1 overflow-auto scrollbar-thin p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {filteredCountries.slice(0, 50).map((country) => {
                        const value = country[selectedMetric];
                        const score = country.maturity_score;
                        const hasActiveGeneration = isGenerating(country.iso_code);
                        return (
                          <button
                            key={country.iso_code}
                            onClick={() => setViewSelectionCountry(country)}
                            className={cn(
                              "p-3 rounded-lg transition-all duration-200 text-left",
                              "bg-white/5 hover:bg-white/10 border border-transparent hover:border-adl-accent/30",
                              "group",
                              hasActiveGeneration && "ring-1 ring-cyan-500/50 bg-cyan-500/5"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-white font-medium group-hover:text-adl-accent transition-colors truncate">
                                    {country.name}
                                  </p>
                                  {hasActiveGeneration && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/20 rounded text-[9px] text-cyan-400 font-medium">
                                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                      Generating
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-white/30">
                                  {country.iso_code} • {CONTINENT_MAP[country.iso_code] || "Unknown"}
                                </p>
                              </div>
                              {value !== null && value !== undefined && (
                                <span className={cn(
                                  "text-xs font-semibold px-2 py-0.5 rounded ml-2",
                                  selectedMetric === "maturity_score"
                                    ? score !== null && score >= 3.5 ? "bg-emerald-500/20 text-emerald-400" 
                                    : score !== null && score >= 3.0 ? "bg-lime-500/20 text-lime-400" 
                                    : score !== null && score >= 2.0 ? "bg-orange-500/20 text-orange-400" 
                                    : "bg-red-500/20 text-red-400"
                                    : value >= 75 ? "bg-emerald-500/20 text-emerald-400"
                                    : value >= 50 ? "bg-lime-500/20 text-lime-400"
                                    : value >= 25 ? "bg-orange-500/20 text-orange-400"
                                    : "bg-red-500/20 text-red-400"
                                )}>
                                  {value.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Modals */}
      <AnimatePresence>
        {activeModal && (
          <StatsModal
            type={activeModal}
            onClose={() => setActiveModal(null)}
            mapCountries={mapCountries}
            maturityBreakdown={maturityBreakdown}
            continentBreakdown={continentBreakdown}
            selectedMetric={selectedMetric}
            dataUpdatedAt={dataUpdatedAt}
          />
        )}
      </AnimatePresence>

      {/* Pillar Selection Modal */}
      <PillarSelectionModal
        isOpen={!!viewSelectionCountry}
        onClose={() => setViewSelectionCountry(null)}
        country={viewSelectionCountry ? {
          iso_code: viewSelectionCountry.iso_code,
          name: viewSelectionCountry.name,
          flag_url: viewSelectionCountry.flag_url,
          governance_score: viewSelectionCountry.governance_score,
          pillar1_score: viewSelectionCountry.pillar1_score,
          pillar2_score: viewSelectionCountry.pillar2_score,
          pillar3_score: viewSelectionCountry.pillar3_score,
        } : null}
      />
    </div>
  );
}

// =============================================================================
// STATS MODAL COMPONENT
// =============================================================================

interface StatsModalProps {
  type: ModalType;
  onClose: () => void;
  mapCountries: MapCountryData[];
  maturityBreakdown: { resilient: number; proactive: number; compliant: number; reactive: number; noData: number };
  continentBreakdown: Record<string, number>;
  selectedMetric: MapMetric;
  dataUpdatedAt: number | undefined;
}

function StatsModal({ 
  type, 
  onClose, 
  mapCountries, 
  maturityBreakdown, 
  continentBreakdown,
  dataUpdatedAt 
}: StatsModalProps) {
  const navigate = useNavigate();
  
  const titles: Record<NonNullable<ModalType>, string> = {
    countries: "Countries Tracked",
    maturity: "ADL OHI Score Distribution",
    data: "Data Coverage Analysis",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {type === "maturity" && <ADLIcon size="sm" animate={false} />}
            <h2 className="text-xl font-semibold text-white">{titles[type!]}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {type === "countries" && (
            <div className="space-y-6">
              {/* Continent Breakdown */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">By Continent</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(continentBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([continent, count]) => (
                      <div key={continent} className="bg-white/5 rounded-lg p-3">
                        <p className="text-2xl font-bold text-white">{count}</p>
                        <p className="text-xs text-white/40">{continent}</p>
                      </div>
                    ))}
                </div>
              </div>
              
              {/* Country List */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">All Countries</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-auto">
                  {mapCountries
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(c => (
                      <button
                        key={c.iso_code}
                        onClick={() => { setViewSelectionCountry(c); onClose(); }}
                        className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <p className="text-sm text-white truncate">{c.name}</p>
                        <p className="text-[10px] text-white/30">{c.iso_code}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {type === "maturity" && (
            <div className="space-y-6">
              {/* Visual Breakdown */}
              <div className="space-y-3">
                {[
                  { key: "resilient", label: "Resilient (≥3.5)", count: maturityBreakdown.resilient, color: "bg-emerald-500" },
                  { key: "proactive", label: "Proactive (3.0-3.4)", count: maturityBreakdown.proactive, color: "bg-lime-500" },
                  { key: "compliant", label: "Compliant (2.0-2.9)", count: maturityBreakdown.compliant, color: "bg-orange-500" },
                  { key: "reactive", label: "Reactive (<2.0)", count: maturityBreakdown.reactive, color: "bg-red-500" },
                  { key: "noData", label: "No Data", count: maturityBreakdown.noData, color: "bg-slate-500" },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className={cn("w-4 h-4 rounded", item.color)} />
                    <span className="text-sm text-white flex-1">{item.label}</span>
                    <span className="text-xl font-bold text-white">{item.count}</span>
                    <span className="text-xs text-white/40 w-12 text-right">
                      {((item.count / mapCountries.length) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Bar Chart Visual */}
              <div className="h-8 rounded-lg overflow-hidden flex">
                {maturityBreakdown.resilient > 0 && (
                  <div 
                    className="bg-emerald-500 h-full" 
                    style={{ width: `${(maturityBreakdown.resilient / mapCountries.length) * 100}%` }}
                  />
                )}
                {maturityBreakdown.proactive > 0 && (
                  <div 
                    className="bg-lime-500 h-full" 
                    style={{ width: `${(maturityBreakdown.proactive / mapCountries.length) * 100}%` }}
                  />
                )}
                {maturityBreakdown.compliant > 0 && (
                  <div 
                    className="bg-orange-500 h-full" 
                    style={{ width: `${(maturityBreakdown.compliant / mapCountries.length) * 100}%` }}
                  />
                )}
                {maturityBreakdown.reactive > 0 && (
                  <div 
                    className="bg-red-500 h-full" 
                    style={{ width: `${(maturityBreakdown.reactive / mapCountries.length) * 100}%` }}
                  />
                )}
                {maturityBreakdown.noData > 0 && (
                  <div 
                    className="bg-slate-500 h-full" 
                    style={{ width: `${(maturityBreakdown.noData / mapCountries.length) * 100}%` }}
                  />
                )}
              </div>
            </div>
          )}

          {type === "data" && (
            <div className="space-y-6">
              {/* Metric Coverage */}
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">Data Coverage by Metric</h3>
                <div className="space-y-3">
                  {[
                    { key: "maturity_score", label: "ADL OHI Score" },
                    { key: "governance_score", label: "Governance Index" },
                    { key: "pillar1_score", label: "Hazard Control" },
                    { key: "pillar2_score", label: "Health Vigilance" },
                    { key: "pillar3_score", label: "Restoration" },
                  ].map(metric => {
                    const withData = mapCountries.filter(c => c[metric.key as MapMetric] !== null).length;
                    const pct = (withData / mapCountries.length) * 100;
                    return (
                      <div key={metric.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">{metric.label}</span>
                          <span className="text-white/60">{withData}/{mapCountries.length} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Last Updated */}
              {dataUpdatedAt && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40">
                    Last updated: {new Date(dataUpdatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Home;
