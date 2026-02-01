/**
 * Arthur D. Little - Global Health Platform
 * Country Profile Page - Full-Screen Tab-Based Visualization Dashboard
 * 
 * Features:
 * - Full-screen single view (no scrolling)
 * - Tab navigation between views
 * - AI-powered deep analysis panel
 * - Enhanced comparison selector with Top 5 Leaders
 * 
 * Views:
 * 1. layers - Onion Model (Policy → Infrastructure → Workplace)
 * 2. flow - System Flow (Input → Process → Outcome)
 * 3. radar - Benchmark Radar (5-dimension comparison)
 * 4. summary - Summary Table (data verification)
 */

import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  Layers,
  GitBranch,
  Radar,
  Table2,
} from "lucide-react";
import { CountryFlag } from "../components";
import { ADLLoader } from "../components/ADLLoader";
import { ADLScoreBadge } from "../components/compare/ADLScoreBadge";
import {
  OnionModel,
  SystemFlowChart,
  BenchmarkRadar,
  SummaryTable,
} from "../components/visualizations";
import { fetchCountryWithMockFallback, fetchComparisonCountries } from "../services/api";
import { cn, getEffectiveOHIScore } from "../lib/utils";
import {
  generateOnionData,
  generateSystemFlowData,
  generateRadarData,
  generateSummaryTableData,
  calculateGlobalAverages,
} from "../lib/frameworkVisualization";
import type { Country } from "../types/country";
import type { ViewType } from "../components/ViewSelectionModal";
import { ViewAnalysisPanel } from "../components/ViewAnalysisPanel";

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

interface TabConfig {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const TABS: TabConfig[] = [
  { id: "layers", label: "System Layers", icon: Layers, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  { id: "flow", label: "Logic Flow", icon: GitBranch, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  { id: "radar", label: "Benchmark", icon: Radar, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  { id: "summary", label: "Summary", icon: Table2, color: "text-amber-400", bgColor: "bg-amber-500/20" },
];

// ============================================================================
// TAB NAVIGATION
// ============================================================================

interface TabNavProps {
  activeTab: ViewType;
  onTabChange: (tab: ViewType) => void;
}

function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              "text-sm font-medium",
              isActive
                ? cn("text-white", tab.bgColor)
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? tab.color : "")} />
            <span className="hidden sm:inline">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className={cn("absolute inset-0 rounded-lg -z-10", tab.bgColor)}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// ENHANCED COUNTRY SELECTOR WITH TOP 5 LEADERS
// ============================================================================

interface EnhancedCountrySelectorProps {
  countries: Country[];
  selectedIso: string | null;
  onSelect: (iso: string | null) => void;
  currentCountryIso: string;
}

function EnhancedCountrySelector({ 
  countries, 
  selectedIso, 
  onSelect,
  currentCountryIso 
}: EnhancedCountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate top 5 leaders by OHI score
  const top5Leaders = useMemo(() => {
    return countries
      .filter(c => c.iso_code !== currentCountryIso && c.maturity_score !== null)
      .sort((a, b) => (b.maturity_score ?? 0) - (a.maturity_score ?? 0))
      .slice(0, 5);
  }, [countries, currentCountryIso]);

  // All other countries (excluding top 5 and current)
  const otherCountries = useMemo(() => {
    const top5Isos = new Set(top5Leaders.map(c => c.iso_code));
    return countries
      .filter(c => c.iso_code !== currentCountryIso && !top5Isos.has(c.iso_code))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, currentCountryIso, top5Leaders]);

  const selectedCountry = countries.find(c => c.iso_code === selectedIso);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all min-w-[200px]",
          "bg-slate-800/70 border-slate-600/50 hover:border-cyan-500/50",
          "text-sm text-white shadow-lg"
        )}
      >
        {selectedCountry ? (
          <>
            <CountryFlag isoCode={selectedCountry.iso_code} size="sm" />
            <span className="flex-1 text-left">{selectedCountry.name}</span>
            <span className="text-xs text-cyan-400 font-medium">
              {selectedCountry.maturity_score?.toFixed(1) ?? "N/A"}
            </span>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-[8px] font-bold text-white">
              GL
            </div>
            <span className="flex-1 text-left text-white/70">Global Benchmark</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute right-0 z-50 mt-2 w-80 max-h-[400px] overflow-y-auto",
                "bg-slate-800 border border-slate-600 rounded-xl shadow-2xl"
              )}
            >
              {/* Global benchmark option */}
              <div className="p-2 border-b border-slate-700/50">
                <button
                  onClick={() => { onSelect(null); setIsOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
                    "hover:bg-white/5 transition-colors",
                    selectedIso === null && "bg-cyan-500/10 ring-1 ring-cyan-500/30"
                  )}
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-[9px] font-bold text-white">
                    GL
                  </div>
                  <span className="flex-1 text-left text-white">Global Benchmark</span>
                  {selectedIso === null && (
                    <span className="text-xs text-cyan-400">Selected</span>
                  )}
                </button>
              </div>
              
              {/* Top 5 Leaders */}
              <div className="p-2 border-b border-slate-700/50">
                <p className="px-2 py-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                  Top 5 Global Leaders
                </p>
                {top5Leaders.map((country, index) => (
                  <button
                    key={country.iso_code}
                    onClick={() => { onSelect(country.iso_code); setIsOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                      "hover:bg-white/5 transition-colors",
                      selectedIso === country.iso_code && "bg-cyan-500/10 ring-1 ring-cyan-500/30"
                    )}
                  >
                    <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <CountryFlag isoCode={country.iso_code} size="sm" />
                    <span className="flex-1 text-left text-white truncate">{country.name}</span>
                    <span className="text-xs text-emerald-400 font-medium">
                      {country.maturity_score?.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* All other countries */}
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  All Countries
                </p>
                {otherCountries.map(country => (
                  <button
                    key={country.iso_code}
                    onClick={() => { onSelect(country.iso_code); setIsOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
                      "hover:bg-white/5 transition-colors",
                      selectedIso === country.iso_code && "bg-cyan-500/10 ring-1 ring-cyan-500/30"
                    )}
                  >
                    <CountryFlag isoCode={country.iso_code} size="sm" />
                    <span className="flex-1 text-left text-white truncate">{country.name}</span>
                    <span className="text-xs text-white/40">
                      {country.maturity_score?.toFixed(1) ?? "N/A"}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// VIEW CONTENT COMPONENTS
// ============================================================================

interface ViewContentProps {
  country: Country;
  comparisonCountry: Country | null;
  comparisonIso: string | null;
  visualizationData: ReturnType<typeof generateVisualizationData>;
  viewType: ViewType;
}

function LayersView({ country, comparisonIso, visualizationData }: ViewContentProps) {
  return (
    <div className="h-full flex">
      {/* Visualization - Left Side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <OnionModel data={visualizationData.onion} className="max-w-3xl w-full" />
      </div>
      
      {/* Analysis Panel - Right Side */}
      <div className="w-96 flex-shrink-0 p-4 border-l border-slate-700/50 overflow-hidden">
        <ViewAnalysisPanel
          isoCode={country.iso_code}
          viewType="layers"
          comparisonIso={comparisonIso}
          className="h-full"
        />
      </div>
    </div>
  );
}

function FlowView({ country, comparisonIso, visualizationData }: ViewContentProps) {
  return (
    <div className="h-full flex">
      {/* Visualization - Left Side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <SystemFlowChart data={visualizationData.flow} />
        </div>
      </div>
      
      {/* Analysis Panel - Right Side */}
      <div className="w-96 flex-shrink-0 p-4 border-l border-slate-700/50 overflow-hidden">
        <ViewAnalysisPanel
          isoCode={country.iso_code}
          viewType="flow"
          comparisonIso={comparisonIso}
          className="h-full"
        />
      </div>
    </div>
  );
}

function RadarView({ country, comparisonIso, visualizationData }: ViewContentProps) {
  return (
    <div className="h-full flex">
      {/* Visualization - Left Side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <BenchmarkRadar
            data={visualizationData.radar}
            countryName={visualizationData.countryName}
            comparisonName={visualizationData.comparisonName}
          />
        </div>
      </div>
      
      {/* Analysis Panel - Right Side */}
      <div className="w-96 flex-shrink-0 p-4 border-l border-slate-700/50 overflow-hidden">
        <ViewAnalysisPanel
          isoCode={country.iso_code}
          viewType="radar"
          comparisonIso={comparisonIso}
          className="h-full"
        />
      </div>
    </div>
  );
}

function SummaryView({ country, comparisonIso, visualizationData }: ViewContentProps) {
  return (
    <div className="h-full flex">
      {/* Visualization - Left Side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <SummaryTable
            data={visualizationData.summaryTable}
            countryName={visualizationData.countryName}
            comparisonName={visualizationData.comparisonName}
          />
        </div>
      </div>
      
      {/* Analysis Panel - Right Side */}
      <div className="w-96 flex-shrink-0 p-4 border-l border-slate-700/50 overflow-hidden">
        <ViewAnalysisPanel
          isoCode={country.iso_code}
          viewType="summary"
          comparisonIso={comparisonIso}
          className="h-full"
        />
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateVisualizationData(
  country: Country,
  comparisonCountry: Country | null,
  globalAverages: Record<string, number>
) {
  const countryName = country.name;
  const comparisonName = comparisonCountry?.name ?? "Global Avg";

  return {
    onion: generateOnionData(country),
    flow: generateSystemFlowData(country),
    radar: generateRadarData(country, comparisonCountry, countryName, comparisonName),
    summaryTable: generateSummaryTableData(country, comparisonCountry, globalAverages),
    countryName,
    comparisonName,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CountryProfile() {
  const { iso } = useParams<{ iso: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [comparisonIso, setComparisonIso] = useState<string | null>(null);

  // Get initial tab from URL query param
  const initialTab = (searchParams.get("view") as ViewType) || "layers";
  const [activeTab, setActiveTab] = useState<ViewType>(initialTab);

  // Update URL when tab changes
  const handleTabChange = (tab: ViewType) => {
    setActiveTab(tab);
    setSearchParams({ view: tab });
  };

  // Sync tab with URL on mount
  useEffect(() => {
    const viewParam = searchParams.get("view") as ViewType;
    if (viewParam && TABS.some(t => t.id === viewParam)) {
      setActiveTab(viewParam);
    }
  }, [searchParams]);

  // Fetch current country data
  const {
    data: country,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["country", iso],
    queryFn: () => fetchCountryWithMockFallback(iso!),
    enabled: !!iso,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // Fetch all countries for comparison and global averages
  const { data: allCountriesData } = useQuery({
    queryKey: ["comparison-countries"],
    queryFn: fetchComparisonCountries,
    staleTime: 5 * 60 * 1000,
  });

  // Get comparison country
  const comparisonCountry = useMemo(() => {
    if (!comparisonIso || !allCountriesData?.countries) return null;
    return allCountriesData.countries.find(c => c.iso_code === comparisonIso) ?? null;
  }, [comparisonIso, allCountriesData]);

  // Calculate global averages
  const globalAverages = useMemo(() => {
    if (!allCountriesData?.countries) return {};
    return calculateGlobalAverages(allCountriesData.countries);
  }, [allCountriesData]);

  // Generate visualization data
  const visualizationData = useMemo(() => {
    if (!country) return null;
    return generateVisualizationData(country, comparisonCountry, globalAverages);
  }, [country, comparisonCountry, globalAverages]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <ADLLoader 
          size="lg" 
          message="Loading Country Profile" 
          subtitle={`Fetching data for ${iso?.toUpperCase()}...`}
        />
      </div>
    );
  }

  // Error state
  if (error || !country) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Country Not Found</h2>
          <p className="text-slate-400 mb-4">Could not load data for: {iso}</p>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Link>
        </div>
      </div>
    );
  }

  // Calculate OHI score
  const effectiveOHI = getEffectiveOHIScore(
    country.maturity_score,
    country.governance?.strategic_capacity_score ?? null,
    country.pillar_1_hazard?.control_maturity_score ?? null,
    country.pillar_2_vigilance?.disease_detection_rate ?? null,
    country.pillar_3_restoration?.rehab_access_score ?? null
  );

  const viewProps: ViewContentProps = {
    country,
    comparisonCountry,
    comparisonIso,
    visualizationData: visualizationData!,
    viewType: activeTab,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Row */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4">
        {/* Left: Back + Country Info */}
        <div className="flex items-center gap-4">
          <Link
            to="/home"
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60 hover:text-white" />
          </Link>
          
          <CountryFlag 
            isoCode={country.iso_code} 
            flagUrl={country.flag_url} 
            size="lg" 
            className="shadow-lg"
          />
          
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {country.name}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-white/40">{country.iso_code}</span>
              <ADLScoreBadge score={effectiveOHI} size="sm" showStage />
            </div>
          </div>
        </div>

        {/* Right: Compare Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/50 hidden sm:inline">Compare:</span>
          <EnhancedCountrySelector
            countries={allCountriesData?.countries ?? []}
            selectedIso={comparisonIso}
            onSelect={setComparisonIso}
            currentCountryIso={iso!}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex justify-center mb-4">
        <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* View Content - Full Height, No Scroll */}
      <div className="flex-1 min-h-0 bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {visualizationData && (
              <>
                {activeTab === "layers" && <LayersView {...viewProps} />}
                {activeTab === "flow" && <FlowView {...viewProps} />}
                {activeTab === "radar" && <RadarView {...viewProps} />}
                {activeTab === "summary" && <SummaryView {...viewProps} />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CountryProfile;
