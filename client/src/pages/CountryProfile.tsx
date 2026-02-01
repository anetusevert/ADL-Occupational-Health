/**
 * Arthur D. Little - Global Health Platform
 * Country Profile Page - Framework Visualization Dashboard
 * 
 * Features three distinct visual representations:
 * 1. Onion Model - Concentric layers (Policy → Infrastructure → Workplace)
 * 2. System Flow - Input → Process → Outcome flow
 * 3. Benchmark Radar - 5-dimension comparison chart
 * 
 * Plus strategic insights and summary table for data verification.
 */

import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
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
  StrategicInsight,
  SummaryTable,
} from "../components/visualizations";
import { fetchCountryWithMockFallback, fetchComparisonCountries } from "../services/api";
import { cn, getEffectiveOHIScore } from "../lib/utils";
import {
  generateOnionData,
  generateSystemFlowData,
  generateRadarData,
  generateOnionInsight,
  generateFlowInsight,
  generateRadarInsight,
  generateSummaryTableData,
  calculateGlobalAverages,
} from "../lib/frameworkVisualization";
import type { Country } from "../types/country";

// ============================================================================
// SECTION HEADER COMPONENT
// ============================================================================

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}

function SectionHeader({ icon: Icon, title, subtitle, color }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        "bg-gradient-to-br",
        color
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/50">{subtitle}</p>
      </div>
    </div>
  );
}

// ============================================================================
// COUNTRY SELECTOR COMPONENT
// ============================================================================

interface CountrySelectorProps {
  countries: Country[];
  selectedIso: string | null;
  onSelect: (iso: string | null) => void;
  currentCountryIso: string;
}

function CountrySelector({ 
  countries, 
  selectedIso, 
  onSelect,
  currentCountryIso 
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter out current country and sort by name
  const availableCountries = useMemo(() => 
    countries
      .filter(c => c.iso_code !== currentCountryIso)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [countries, currentCountryIso]
  );

  const selectedCountry = availableCountries.find(c => c.iso_code === selectedIso);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
          "bg-slate-800/50 border-slate-700/50 hover:border-slate-600",
          "text-sm text-white"
        )}
      >
        {selectedCountry ? (
          <>
            <CountryFlag isoCode={selectedCountry.iso_code} size="sm" />
            <span>{selectedCountry.name}</span>
          </>
        ) : (
          <span className="text-white/50">Select comparison country...</span>
        )}
        <ChevronDown className={cn(
          "w-4 h-4 text-white/40 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "absolute z-50 mt-1 w-64 max-h-64 overflow-y-auto",
              "bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
            )}
          >
            {/* Global benchmark option */}
            <button
              onClick={() => { onSelect(null); setIsOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                "hover:bg-white/5 transition-colors",
                selectedIso === null && "bg-cyan-500/10 text-cyan-400"
              )}
            >
              <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-[8px] font-bold text-white">
                GL
              </div>
              <span>Global Benchmark</span>
            </button>
            
            <div className="h-px bg-slate-700 my-1" />
            
            {availableCountries.map(country => (
              <button
                key={country.iso_code}
                onClick={() => { onSelect(country.iso_code); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                  "hover:bg-white/5 transition-colors",
                  selectedIso === country.iso_code && "bg-cyan-500/10 text-cyan-400"
                )}
              >
                <CountryFlag isoCode={country.iso_code} size="sm" />
                <span className="truncate">{country.name}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CountryProfile() {
  const { iso } = useParams<{ iso: string }>();
  const [comparisonIso, setComparisonIso] = useState<string | null>(null);

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

    const countryName = country.name;
    const comparisonName = comparisonCountry?.name ?? "Global Avg";

    return {
      onion: generateOnionData(country),
      flow: generateSystemFlowData(country),
      radar: generateRadarData(country, comparisonCountry, countryName, comparisonName),
      onionInsight: generateOnionInsight(country),
      flowInsight: generateFlowInsight(country),
      radarInsight: generateRadarInsight(country, comparisonCountry, comparisonName),
      summaryTable: generateSummaryTableData(country, comparisonCountry, globalAverages),
      countryName,
      comparisonName,
    };
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Overview
        </Link>

        {/* Country Info + Comparison Selector */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <CountryFlag 
              isoCode={country.iso_code} 
              flagUrl={country.flag_url} 
              size="lg" 
              className="shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {country.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-white/40">{country.iso_code}</span>
                <ADLScoreBadge score={effectiveOHI} size="sm" showStage />
              </div>
            </div>
          </div>

          {/* Comparison Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50">Compare with:</span>
            <CountrySelector
              countries={allCountriesData?.countries ?? []}
              selectedIso={comparisonIso}
              onSelect={setComparisonIso}
              currentCountryIso={iso!}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6">
        {visualizationData && (
          <>
            {/* SECTION 1: Onion Model */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5"
            >
              <SectionHeader
                icon={Layers}
                title="National OH System Layers"
                subtitle="Hierarchical view from national policy to workplace implementation"
                color="from-purple-500 to-purple-600"
              />
              
              <OnionModel data={visualizationData.onion} />
              
              <StrategicInsight 
                insight={visualizationData.onionInsight}
                type="info"
                delay={0.3}
                className="mt-4"
              />
            </motion.section>

            {/* SECTION 2: System Flow */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5"
            >
              <SectionHeader
                icon={GitBranch}
                title="System Logic Flow"
                subtitle="Input resources → Operational processes → Health outcomes"
                color="from-blue-500 to-cyan-500"
              />
              
              <SystemFlowChart data={visualizationData.flow} />
              
              <StrategicInsight 
                insight={visualizationData.flowInsight}
                type="info"
                delay={0.3}
                className="mt-4"
              />
            </motion.section>

            {/* SECTION 3: Benchmark Radar */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5"
            >
              <SectionHeader
                icon={Radar}
                title="Comparative Benchmark"
                subtitle={`5-dimension comparison: ${visualizationData.countryName} vs ${visualizationData.comparisonName}`}
                color="from-cyan-500 to-emerald-500"
              />
              
              <BenchmarkRadar
                data={visualizationData.radar}
                countryName={visualizationData.countryName}
                comparisonName={visualizationData.comparisonName}
              />
              
              <StrategicInsight 
                insight={visualizationData.radarInsight}
                type={comparisonCountry ? "opportunity" : "info"}
                delay={0.3}
                className="mt-4"
              />
            </motion.section>

            {/* SECTION 4: Summary Table */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pb-4"
            >
              <SectionHeader
                icon={Table2}
                title="Summary Comparison"
                subtitle="Key metrics side-by-side for quick data verification"
                color="from-amber-500 to-orange-500"
              />
              
              <SummaryTable
                data={visualizationData.summaryTable}
                countryName={visualizationData.countryName}
                comparisonName={visualizationData.comparisonName}
              />
            </motion.section>
          </>
        )}
      </div>
    </div>
  );
}

export default CountryProfile;
