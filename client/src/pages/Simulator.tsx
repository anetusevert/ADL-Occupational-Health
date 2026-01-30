/**
 * Arthur D. Little - Global Health Platform
 * Policy Simulator - Sovereign Strategy War Room
 * Viewport-fit design with no scrolling
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  Building2,
  Shield,
  Eye,
  Heart,
  Rocket,
  Target,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllCountries, fetchCountryWithMockFallback } from "../services/api";
import type { Country, CountryListItem } from "../types/country";
import { cn, getCountryFlag, getMaturityStage } from "../lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SimulationMetrics {
  // Governance Layer
  strategicCapacity: number;
  inspectorDensity: number;
  iloC187Ratified: boolean;
  
  // Pillar 1: Hazard Control
  fatalAccidentRate: number;
  oelCompliance: number;
  airPollution: number;
  
  // Pillar 2: Health Vigilance
  diseaseDetectionRate: number;
  vulnerableEmpCoverage: number;
  
  // Pillar 3: Restoration
  rehabAccess: number;
  returnToWorkSuccess: number;
}

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCORDION_SECTIONS: AccordionSection[] = [
  {
    id: "governance",
    title: "Governance Layer",
    icon: Building2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: "pillar1",
    title: "Pillar 1: Hazard Control",
    icon: Shield,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
  },
  {
    id: "pillar2",
    title: "Pillar 2: Health Vigilance",
    icon: Eye,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    id: "pillar3",
    title: "Pillar 3: Restoration",
    icon: Heart,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
  },
];

// Pillar weights for score calculation (must sum to 1.0)
const PILLAR_WEIGHTS = {
  governance: 0.25,
  pillar1: 0.30,
  pillar2: 0.25,
  pillar3: 0.20,
};

// Default metrics for a "blank" country
const DEFAULT_METRICS: SimulationMetrics = {
  strategicCapacity: 50,
  inspectorDensity: 1.0,
  iloC187Ratified: false,
  fatalAccidentRate: 3.0,
  oelCompliance: 50,
  airPollution: 35,
  diseaseDetectionRate: 50,
  vulnerableEmpCoverage: 40,
  rehabAccess: 50,
  returnToWorkSuccess: 50,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract simulation metrics from a country's real data
 */
function extractMetricsFromCountry(country: Country | null): SimulationMetrics {
  if (!country) return DEFAULT_METRICS;
  
  return {
    // Governance
    strategicCapacity: country.governance?.strategic_capacity_score ?? 50,
    inspectorDensity: country.governance?.inspector_density ?? 1.0,
    iloC187Ratified: country.governance?.ilo_c187_status ?? false,
    
    // Pillar 1: Hazard Control
    fatalAccidentRate: country.pillar_1_hazard?.fatal_accident_rate ?? 3.0,
    oelCompliance: country.pillar_1_hazard?.oel_compliance_pct ?? 50,
    airPollution: 35, // Placeholder - not in current schema, would need PM2.5 data
    
    // Pillar 2: Health Vigilance  
    diseaseDetectionRate: country.pillar_2_vigilance?.disease_detection_rate 
      ? Math.min(100, country.pillar_2_vigilance.disease_detection_rate / 2) // Normalize from rate to %
      : 50,
    vulnerableEmpCoverage: country.pillar_2_vigilance?.vulnerability_index 
      ? 100 - country.pillar_2_vigilance.vulnerability_index // Invert: lower vulnerability = better coverage
      : 40,
    
    // Pillar 3: Restoration
    rehabAccess: country.pillar_3_restoration?.rehab_access_score ?? 50,
    returnToWorkSuccess: country.pillar_3_restoration?.return_to_work_success_pct ?? 50,
  };
}

/**
 * Calculate pillar scores from simulation metrics
 */
function calculatePillarScores(metrics: SimulationMetrics): {
  governance: number;
  pillar1: number;
  pillar2: number;
  pillar3: number;
} {
  // Governance Score (0-100)
  const governanceScore = (
    metrics.strategicCapacity * 0.5 +
    Math.min(metrics.inspectorDensity * 10, 100) * 0.3 +
    (metrics.iloC187Ratified ? 100 : 0) * 0.2
  );
  
  // Pillar 1: Hazard Control (0-100)
  // Fatal rate is inverted (lower is better, max 20 -> 0%)
  const fatalRateNormalized = Math.max(0, 100 - (metrics.fatalAccidentRate / 20) * 100);
  // Air pollution is inverted (lower is better, max 100 -> 0%)
  const airPollutionNormalized = Math.max(0, 100 - metrics.airPollution);
  
  const pillar1Score = (
    fatalRateNormalized * 0.4 +
    metrics.oelCompliance * 0.35 +
    airPollutionNormalized * 0.25
  );
  
  // Pillar 2: Health Vigilance (0-100)
  const pillar2Score = (
    metrics.diseaseDetectionRate * 0.5 +
    metrics.vulnerableEmpCoverage * 0.5
  );
  
  // Pillar 3: Restoration (0-100)
  const pillar3Score = (
    metrics.rehabAccess * 0.5 +
    metrics.returnToWorkSuccess * 0.5
  );
  
  return {
    governance: Math.round(governanceScore),
    pillar1: Math.round(pillar1Score),
    pillar2: Math.round(pillar2Score),
    pillar3: Math.round(pillar3Score),
  };
}

/**
 * Calculate overall maturity score (1.0 - 4.0 scale)
 */
function calculateMaturityScore(pillarScores: ReturnType<typeof calculatePillarScores>): number {
  const weightedScore = 
    pillarScores.governance * PILLAR_WEIGHTS.governance +
    pillarScores.pillar1 * PILLAR_WEIGHTS.pillar1 +
    pillarScores.pillar2 * PILLAR_WEIGHTS.pillar2 +
    pillarScores.pillar3 * PILLAR_WEIGHTS.pillar3;
  
  // Convert from 0-100 to 1.0-4.0 scale
  return 1.0 + (weightedScore / 100) * 3.0;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Searchable Country Dropdown
 */
function CountrySelector({
  countries,
  selectedIso,
  onSelect,
  isLoading,
}: {
  countries: CountryListItem[];
  selectedIso: string | null;
  onSelect: (iso: string) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.iso_code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);
  
  const selectedCountry = countries.find((c) => c.iso_code === selectedIso);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3",
          "bg-slate-800/80 border border-slate-600/50 rounded-xl",
          "text-left transition-all duration-200",
          "hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
          isOpen && "border-cyan-500/50 ring-2 ring-cyan-500/30"
        )}
      >
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : selectedCountry ? (
            <>
              <span className="text-2xl">{getCountryFlag(selectedCountry.iso_code)}</span>
              <div>
                <p className="text-white font-medium">{selectedCountry.name}</p>
                <p className="text-xs text-slate-400">{selectedCountry.iso_code}</p>
              </div>
            </>
          ) : (
            <>
              <Search className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">Select a country to simulate...</span>
            </>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Country List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.iso_code}
                    onClick={() => {
                      onSelect(country.iso_code);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-slate-700/50",
                      selectedIso === country.iso_code && "bg-cyan-500/20"
                    )}
                  >
                    <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{country.name}</p>
                      <p className="text-xs text-slate-400">{country.iso_code}</p>
                    </div>
                    {country.maturity_score !== null && (
                      <span className="text-sm text-cyan-400 font-mono">
                        {country.maturity_score.toFixed(1)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Custom Slider Component
 */
function MetricSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  inverted = false,
  infoText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  inverted?: boolean;
  infoText?: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const gradientColor = inverted 
    ? `linear-gradient(to right, #10b981 0%, #f59e0b ${percentage}%, #334155 ${percentage}%)`
    : `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #334155 ${percentage}%)`;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300">{label}</span>
          {inverted && (
            <span className="text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
              ↓ Lower is better
            </span>
          )}
          {infoText && (
            <div className="group relative">
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {infoText}
              </div>
            </div>
          )}
        </div>
        <span className="text-sm font-mono text-cyan-400">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: gradientColor,
        }}
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/**
 * Toggle Switch Component
 */
function MetricToggle({
  label,
  checked,
  onChange,
  infoText,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  infoText?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">{label}</span>
        {infoText && (
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {infoText}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-12 h-6 rounded-full transition-colors duration-200",
          checked ? "bg-emerald-500" : "bg-slate-600"
        )}
      >
        <span
          className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
            checked ? "translate-x-7" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

/**
 * Accordion Section Component
 */
function AccordionPanel({
  section,
  isOpen,
  onToggle,
  children,
}: {
  section: AccordionSection;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = section.icon;
  
  return (
    <div className={cn("border rounded-xl overflow-hidden", section.borderColor)}>
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors",
          section.bgColor,
          "hover:brightness-110"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5", section.color)} />
          <span className={cn("font-semibold", section.color)}>{section.title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className={cn("w-5 h-5", section.color)} />
        ) : (
          <ChevronRight className={cn("w-5 h-5", section.color)} />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-slate-800/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Score Display Card
 */
function ScoreCard({
  title,
  baseline,
  projected,
  icon: Icon,
  isMaturityScore = false,
}: {
  title: string;
  baseline: number;
  projected: number;
  icon: React.ElementType;
  isMaturityScore?: boolean;
}) {
  const delta = projected - baseline;
  const improved = delta > 0;
  
  const baselineMaturity = isMaturityScore ? getMaturityStage(baseline) : null;
  const projectedMaturity = isMaturityScore ? getMaturityStage(projected) : null;
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400">{title}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Baseline</p>
          <p className={cn(
            "text-2xl font-bold",
            baselineMaturity?.color ?? "text-slate-300"
          )}>
            {baseline.toFixed(isMaturityScore ? 2 : 0)}
          </p>
          {baselineMaturity && (
            <p className={cn("text-xs", baselineMaturity.color)}>
              Stage {baselineMaturity.stage}: {baselineMaturity.label}
            </p>
          )}
        </div>
        
        <div className="text-center px-4">
          <TrendingUp className={cn(
            "w-6 h-6 mx-auto mb-1",
            improved ? "text-emerald-400" : "text-red-400"
          )} />
          <p className={cn(
            "text-sm font-bold",
            improved ? "text-emerald-400" : "text-red-400"
          )}>
            {improved ? "+" : ""}{delta.toFixed(isMaturityScore ? 2 : 0)}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Projected</p>
          <p className={cn(
            "text-2xl font-bold",
            projectedMaturity?.color ?? "text-cyan-400"
          )}>
            {projected.toFixed(isMaturityScore ? 2 : 0)}
          </p>
          {projectedMaturity && (
            <p className={cn("text-xs", projectedMaturity.color)}>
              Stage {projectedMaturity.stage}: {projectedMaturity.label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Simulator() {
  // State
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["governance"]));
  const [metrics, setMetrics] = useState<SimulationMetrics>(DEFAULT_METRICS);
  const [baselineMetrics, setBaselineMetrics] = useState<SimulationMetrics>(DEFAULT_METRICS);
  
  // Fetch all countries for dropdown
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries-list"],
    queryFn: fetchAllCountries,
    staleTime: 10 * 60 * 1000,
  });
  
  // Fetch selected country's full data
  const { data: selectedCountry, isLoading: isLoadingCountry } = useQuery({
    queryKey: ["country", selectedIso],
    queryFn: () => fetchCountryWithMockFallback(selectedIso!),
    enabled: !!selectedIso,
    staleTime: 5 * 60 * 1000,
  });
  
  // Hydrate metrics when country is loaded
  useEffect(() => {
    if (selectedCountry) {
      const extracted = extractMetricsFromCountry(selectedCountry);
      setMetrics(extracted);
      setBaselineMetrics(extracted);
    }
  }, [selectedCountry]);
  
  // Calculate scores
  const baselinePillarScores = useMemo(
    () => calculatePillarScores(baselineMetrics),
    [baselineMetrics]
  );
  
  const projectedPillarScores = useMemo(
    () => calculatePillarScores(metrics),
    [metrics]
  );
  
  const baselineMaturityScore = useMemo(
    () => calculateMaturityScore(baselinePillarScores),
    [baselinePillarScores]
  );
  
  const projectedMaturityScore = useMemo(
    () => calculateMaturityScore(projectedPillarScores),
    [projectedPillarScores]
  );
  
  // Radar chart data
  const radarData = useMemo(() => [
    {
      metric: "Governance",
      baseline: baselinePillarScores.governance,
      projected: projectedPillarScores.governance,
      fullMark: 100,
    },
    {
      metric: "Hazard Control",
      baseline: baselinePillarScores.pillar1,
      projected: projectedPillarScores.pillar1,
      fullMark: 100,
    },
    {
      metric: "Health Vigilance",
      baseline: baselinePillarScores.pillar2,
      projected: projectedPillarScores.pillar2,
      fullMark: 100,
    },
    {
      metric: "Restoration",
      baseline: baselinePillarScores.pillar3,
      projected: projectedPillarScores.pillar3,
      fullMark: 100,
    },
  ], [baselinePillarScores, projectedPillarScores]);
  
  // Handlers
  const toggleSection = useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);
  
  const updateMetric = useCallback(<K extends keyof SimulationMetrics>(
    key: K,
    value: SimulationMetrics[K]
  ) => {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  }, []);
  
  const resetToBaseline = useCallback(() => {
    setMetrics(baselineMetrics);
  }, [baselineMetrics]);
  
  const countries = countriesData?.countries ?? [];
  const delta = projectedMaturityScore - baselineMaturityScore;
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-adl-accent/20 rounded-xl flex items-center justify-center border border-adl-accent/30">
            <Target className="w-5 h-5 text-adl-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Policy Simulator
            </h1>
            <p className="text-white/40 text-sm">
              Model policy changes and project maturity improvements
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedCountry && (
            <button
              onClick={resetToBaseline}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          
          {/* Country Selector - Inline */}
          <div className="w-64">
            <CountrySelector
              countries={countries}
              selectedIso={selectedIso}
              onSelect={setSelectedIso}
              isLoading={isLoadingCountries || isLoadingCountry}
            />
          </div>
        </div>
      </div>
      
      {/* Main Split View - Flexible */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Panel: Control Deck */}
        <div className="flex flex-col min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <Sparkles className="w-4 h-4 text-adl-accent" />
            <h2 className="text-sm font-semibold text-white">Control Deck</h2>
          </div>
          <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-3">
          
          {!selectedIso ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Select a country to begin</p>
              </div>
            </div>
          ) : isLoadingCountry ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <Loader2 className="w-10 h-10 text-adl-accent mx-auto mb-3 animate-spin" />
                <p className="text-white/40 text-sm">Loading country data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Governance Accordion */}
              <AccordionPanel
                section={ACCORDION_SECTIONS[0]}
                isOpen={openSections.has("governance")}
                onToggle={() => toggleSection("governance")}
              >
                <MetricSlider
                  label="Strategic Capacity"
                  value={metrics.strategicCapacity}
                  onChange={(v) => updateMetric("strategicCapacity", v)}
                  min={0}
                  max={100}
                  infoText="Government's ability to develop and implement OH policies"
                />
                <MetricSlider
                  label="Inspector Density"
                  value={metrics.inspectorDensity}
                  onChange={(v) => updateMetric("inspectorDensity", v)}
                  min={0}
                  max={10}
                  step={0.1}
                  unit=" per 10k"
                  infoText="Labor inspectors per 10,000 workers"
                />
                <MetricToggle
                  label="ILO C187 Ratified"
                  checked={metrics.iloC187Ratified}
                  onChange={(v) => updateMetric("iloC187Ratified", v)}
                  infoText="Promotional Framework for Occupational Safety and Health"
                />
              </AccordionPanel>
              
              {/* Pillar 1: Hazard Control */}
              <AccordionPanel
                section={ACCORDION_SECTIONS[1]}
                isOpen={openSections.has("pillar1")}
                onToggle={() => toggleSection("pillar1")}
              >
                <MetricSlider
                  label="Fatal Accident Rate"
                  value={metrics.fatalAccidentRate}
                  onChange={(v) => updateMetric("fatalAccidentRate", v)}
                  min={0}
                  max={20}
                  step={0.1}
                  unit=" per 100k"
                  inverted
                  infoText="Fatal occupational accidents per 100,000 workers"
                />
                <MetricSlider
                  label="OEL Compliance"
                  value={metrics.oelCompliance}
                  onChange={(v) => updateMetric("oelCompliance", v)}
                  min={0}
                  max={100}
                  unit="%"
                  infoText="Occupational Exposure Limits compliance rate"
                />
                <MetricSlider
                  label="Air Pollution (PM2.5)"
                  value={metrics.airPollution}
                  onChange={(v) => updateMetric("airPollution", v)}
                  min={0}
                  max={100}
                  unit=" μg/m³"
                  inverted
                  infoText="Average workplace PM2.5 concentration"
                />
              </AccordionPanel>
              
              {/* Pillar 2: Health Vigilance */}
              <AccordionPanel
                section={ACCORDION_SECTIONS[2]}
                isOpen={openSections.has("pillar2")}
                onToggle={() => toggleSection("pillar2")}
              >
                <MetricSlider
                  label="Disease Detection Rate"
                  value={metrics.diseaseDetectionRate}
                  onChange={(v) => updateMetric("diseaseDetectionRate", v)}
                  min={0}
                  max={100}
                  unit="%"
                  infoText="Rate of occupational diseases detected and reported"
                />
                <MetricSlider
                  label="Vulnerable Employee Coverage"
                  value={metrics.vulnerableEmpCoverage}
                  onChange={(v) => updateMetric("vulnerableEmpCoverage", v)}
                  min={0}
                  max={100}
                  unit="%"
                  infoText="Coverage of health programs for vulnerable workers"
                />
              </AccordionPanel>
              
              {/* Pillar 3: Restoration */}
              <AccordionPanel
                section={ACCORDION_SECTIONS[3]}
                isOpen={openSections.has("pillar3")}
                onToggle={() => toggleSection("pillar3")}
              >
                <MetricSlider
                  label="Rehab Access"
                  value={metrics.rehabAccess}
                  onChange={(v) => updateMetric("rehabAccess", v)}
                  min={0}
                  max={100}
                  unit="%"
                  infoText="Access to occupational rehabilitation services"
                />
                <MetricSlider
                  label="Return-to-Work Success"
                  value={metrics.returnToWorkSuccess}
                  onChange={(v) => updateMetric("returnToWorkSuccess", v)}
                  min={0}
                  max={100}
                  unit="%"
                  infoText="Successful return-to-work program completion rate"
                />
              </AccordionPanel>
            </>
          )}
          </div>
        </div>
        
        {/* Right Panel: Impact Visualization */}
        <div className="flex flex-col min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <Rocket className="w-4 h-4 text-adl-accent" />
            <h2 className="text-sm font-semibold text-white">Impact Analysis</h2>
          </div>
          <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
          
          {/* Main Score Card */}
          <ScoreCard
            title="Sovereign Maturity Score"
            baseline={baselineMaturityScore}
            projected={projectedMaturityScore}
            icon={Target}
            isMaturityScore
          />
          
          {/* Delta Banner */}
          {selectedIso && (
            <motion.div
              key={delta.toFixed(2)}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "p-4 rounded-xl border text-center",
                delta > 0
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : delta < 0
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-slate-700/30 border-slate-600/30"
              )}
            >
              <p className="text-sm text-slate-400 mb-1">Projected Improvement</p>
              <p className={cn(
                "text-3xl font-bold",
                delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-slate-400"
              )}>
                {delta > 0 && "🚀 +"}{delta.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {delta > 0.5
                  ? "Significant improvement potential!"
                  : delta > 0
                  ? "Positive trajectory"
                  : delta === 0
                  ? "No change from baseline"
                  : "Regression from baseline"}
              </p>
            </motion.div>
          )}
          
          {/* Radar Chart */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-4">
              Pillar Comparison Radar
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  <Radar
                    name="Baseline"
                    dataKey="baseline"
                    stroke="#64748b"
                    fill="#64748b"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Projected"
                    dataKey="projected"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => (
                      <span className="text-slate-300 text-sm">{value}</span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                    itemStyle={{ color: "#94a3b8" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Pillar Score Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreCard
              title="Governance"
              baseline={baselinePillarScores.governance}
              projected={projectedPillarScores.governance}
              icon={Building2}
            />
            <ScoreCard
              title="Hazard Control"
              baseline={baselinePillarScores.pillar1}
              projected={projectedPillarScores.pillar1}
              icon={Shield}
            />
            <ScoreCard
              title="Health Vigilance"
              baseline={baselinePillarScores.pillar2}
              projected={projectedPillarScores.pillar2}
              icon={Eye}
            />
            <ScoreCard
              title="Restoration"
              baseline={baselinePillarScores.pillar3}
              projected={projectedPillarScores.pillar3}
              icon={Heart}
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Simulator;
