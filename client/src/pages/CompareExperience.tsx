/**
 * Compare Experience Page
 * 
 * Premium AI-powered country comparison experience.
 * Features cached reports, McKinsey-grade analysis, and animated visualizations.
 * 
 * Flow:
 * 1. Selection Phase - Choose comparison country (Saudi Arabia is locked)
 * 2. Loading Phase - Generate or fetch cached report
 * 3. Report Phase - Display comprehensive comparison
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Loader2, 
  Search,
  Filter,
  Globe,
  Star,
  ChevronRight,
  Crown,
  X,
} from "lucide-react";
import { 
  fetchComparisonCountries, 
  fetchComparisonReport,
  generateComparisonReport,
  regenerateComparisonReport,
} from "../services/api";
import { ComparisonLoader, ComparisonReport } from "../components/compare-v3";
import { cn, getCountryFlag, getApiBaseUrl } from "../lib/utils";
import type { Country } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

type Phase = "selection" | "loading" | "report";

interface FilterState {
  region: string | null;
  searchQuery: string;
  scoreRange: [number, number];
}

// ============================================================================
// COUNTRY SELECTION MODAL
// ============================================================================

interface CountrySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
  selectedIso: string;
  onSelect: (iso: string) => void;
}

function CountrySelectionModal({
  isOpen,
  onClose,
  countries,
  selectedIso,
  onSelect,
}: CountrySelectionModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    region: null,
    searchQuery: "",
    scoreRange: [0, 100],
  });

  // Get unique regions
  const regions = useMemo(() => {
    const regionSet = new Set<string>();
    countries.forEach((c) => {
      if (c.region) regionSet.add(c.region);
    });
    return Array.from(regionSet).sort();
  }, [countries]);

  // Filter countries
  const filteredCountries = useMemo(() => {
    return countries
      .filter((c) => c.iso_code !== "SAU") // Exclude Saudi Arabia
      .filter((c) => {
        // Region filter
        if (filters.region && c.region !== filters.region) return false;
        
        // Search filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          if (!c.name.toLowerCase().includes(query) && 
              !c.iso_code.toLowerCase().includes(query)) {
            return false;
          }
        }
        
        // Score filter
        const score = c.maturity_score || 0;
        if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => (b.maturity_score || 0) - (a.maturity_score || 0));
  }, [countries, filters]);

  // Maturity tier labels
  const getMaturityTier = (score: number) => {
    if (score >= 75) return { label: "Advanced", color: "emerald" };
    if (score >= 50) return { label: "Established", color: "cyan" };
    if (score >= 25) return { label: "Developing", color: "amber" };
    return { label: "Nascent", color: "red" };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-4 md:inset-10 lg:inset-16 z-50 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Select Comparison Country</h2>
              <p className="text-sm text-slate-400">Compare Saudi Arabia against {countries.length - 1} countries</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex-shrink-0 p-4 border-b border-slate-700/50 bg-slate-800/30">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="Search countries..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Region Filter */}
            <select
              value={filters.region || ""}
              onChange={(e) => setFilters({ ...filters, region: e.target.value || null })}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            {/* Score Range Buttons */}
            <div className="flex items-center gap-2">
              {[
                { label: "All", range: [0, 100] as [number, number] },
                { label: "Advanced", range: [75, 100] as [number, number] },
                { label: "Established", range: [50, 75] as [number, number] },
                { label: "Developing", range: [25, 50] as [number, number] },
              ].map(({ label, range }) => (
                <button
                  key={label}
                  onClick={() => setFilters({ ...filters, scoreRange: range })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    filters.scoreRange[0] === range[0] && filters.scoreRange[1] === range[1]
                      ? "bg-purple-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Countries Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCountries.map((country, index) => {
              const tier = getMaturityTier(country.maturity_score || 0);
              const isSelected = country.iso_code === selectedIso;
              
              return (
                <motion.button
                  key={country.iso_code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    onSelect(country.iso_code);
                    onClose();
                  }}
                  className={cn(
                    "relative p-4 rounded-xl text-left transition-all group",
                    "border hover:scale-[1.02]",
                    isSelected
                      ? "bg-purple-500/20 border-purple-500/50"
                      : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                  )}
                >
                  {/* Top Leader Badge */}
                  {(country.maturity_score || 0) >= 80 && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                  )}

                  {/* Flag & Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-7 rounded overflow-hidden border border-slate-600 flex items-center justify-center bg-slate-700">
                      {country.flag_url ? (
                        <img
                          src={`${getApiBaseUrl()}${country.flag_url}`}
                          alt={country.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{country.name}</h4>
                      <p className="text-xs text-slate-500">{country.iso_code}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      `bg-${tier.color}-500/20 text-${tier.color}-400`
                    )}>
                      {tier.label}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {country.maturity_score?.toFixed(0) || "—"}
                    </span>
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight className="absolute right-2 bottom-2 w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              );
            })}
          </div>

          {filteredCountries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Filter className="w-12 h-12 mb-4 opacity-50" />
              <p>No countries match your filters</p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// SELECTION PHASE
// ============================================================================

interface SelectionPhaseProps {
  saudiCountry: Country | null;
  comparisonCountry: Country | null;
  countries: Country[];
  onSelectComparison: (iso: string) => void;
  onProceed: () => void;
}

function SelectionPhase({
  saudiCountry,
  comparisonCountry,
  countries,
  onSelectComparison,
  onProceed,
}: SelectionPhaseProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center"
          >
            <Crown className="w-8 h-8 text-purple-400" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Strategic Country Comparison
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Compare Saudi Arabia's occupational health framework against global benchmarks 
            with AI-powered analysis
          </p>
        </div>

        {/* Country Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Saudi Arabia (Locked) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 relative"
          >
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              Primary
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/30 flex items-center justify-center bg-slate-700">
                {saudiCountry?.flag_url ? (
                  <img
                    src={`${getApiBaseUrl()}${saudiCountry.flag_url}`}
                    alt="Saudi Arabia"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">🇸🇦</span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Saudi Arabia</h3>
                <p className="text-sm text-slate-400">GOSI Focus Country</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">OHI Score</span>
              <span className="text-2xl font-bold text-emerald-400">
                {saudiCountry?.maturity_score?.toFixed(1) || "—"}
              </span>
            </div>
          </motion.div>

          {/* Comparison Country (Selectable) */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-800/50 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 relative text-left transition-all hover:border-purple-500/50 group"
          >
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
              Click to Change
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-12 rounded-xl overflow-hidden border-2 border-purple-500/30 flex items-center justify-center bg-slate-700">
                {comparisonCountry?.flag_url ? (
                  <img
                    src={`${getApiBaseUrl()}${comparisonCountry.flag_url}`}
                    alt={comparisonCountry.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{getCountryFlag(comparisonCountry?.iso_code || "DEU")}</span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {comparisonCountry?.name || "Select Country"}
                </h3>
                <p className="text-sm text-slate-400">Benchmark Country</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">OHI Score</span>
              <span className="text-2xl font-bold text-purple-400">
                {comparisonCountry?.maturity_score?.toFixed(1) || "—"}
              </span>
            </div>

            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        </div>

        {/* Proceed Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onProceed}
            disabled={!comparisonCountry}
            className={cn(
              "px-8 py-4 rounded-xl font-semibold text-lg transition-all",
              "bg-gradient-to-r from-purple-600 to-purple-500 text-white",
              "hover:from-purple-500 hover:to-purple-400",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg shadow-purple-500/25"
            )}
          >
            Generate Comparison Report
          </motion.button>
          <p className="mt-4 text-sm text-slate-500">
            Powered by McKinsey-grade AI analysis
          </p>
        </motion.div>
      </motion.div>

      {/* Country Selection Modal */}
      <CountrySelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        countries={countries}
        selectedIso={comparisonCountry?.iso_code || "DEU"}
        onSelect={onSelectComparison}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompareExperience() {
  const queryClient = useQueryClient();
  
  // Phase state
  const [phase, setPhase] = useState<Phase>("selection");
  
  // Country selection state
  const [comparisonIso, setComparisonIso] = useState<string>("DEU");

  // Fetch all countries
  const { 
    data: comparisonData, 
    isLoading: countriesLoading, 
    error: countriesError 
  } = useQuery({
    queryKey: ["comparison-countries"],
    queryFn: fetchComparisonCountries,
    staleTime: 5 * 60 * 1000,
  });

  // Countries map
  const countriesMap = useMemo(() => {
    if (!comparisonData?.countries) return new Map<string, Country>();
    return new Map(comparisonData.countries.map((c) => [c.iso_code, c]));
  }, [comparisonData]);

  const countries = useMemo(() => comparisonData?.countries || [], [comparisonData]);
  const saudiCountry = countriesMap.get("SAU") || null;
  const comparisonCountry = countriesMap.get(comparisonIso) || null;

  // Fetch cached report
  const { 
    data: cachedReport, 
    isLoading: reportLoading,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["comparison-report", comparisonIso],
    queryFn: () => fetchComparisonReport(comparisonIso),
    enabled: phase === "loading" || phase === "report",
    staleTime: Infinity, // Reports don't go stale
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: (iso: string) => generateComparisonReport(iso),
    onSuccess: (data) => {
      queryClient.setQueryData(["comparison-report", comparisonIso], data);
      setPhase("report");
    },
    onError: (error) => {
      console.error("Failed to generate report:", error);
      setPhase("selection");
    },
  });

  // Regenerate report mutation (admin only)
  const regenerateMutation = useMutation({
    mutationFn: (iso: string) => regenerateComparisonReport(iso),
    onSuccess: (data) => {
      queryClient.setQueryData(["comparison-report", comparisonIso], data);
    },
  });

  // Handle proceeding to comparison
  const handleProceed = async () => {
    setPhase("loading");
    
    // First check if report is already cached
    try {
      const existing = await fetchComparisonReport(comparisonIso);
      if (existing) {
        queryClient.setQueryData(["comparison-report", comparisonIso], existing);
        setPhase("report");
        return;
      }
    } catch {
      // No cached report, generate new one
    }
    
    // Generate new report
    generateMutation.mutate(comparisonIso);
  };

  // Handle regeneration
  const handleRegenerate = () => {
    regenerateMutation.mutate(comparisonIso);
  };

  // Loading state
  if (countriesLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  // Error state
  if (countriesError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white">Failed to load countries</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Selection Phase */}
      {phase === "selection" && (
        <SelectionPhase
          saudiCountry={saudiCountry}
          comparisonCountry={comparisonCountry}
          countries={countries}
          onSelectComparison={setComparisonIso}
          onProceed={handleProceed}
        />
      )}

      {/* Loading Phase */}
      <AnimatePresence>
        {phase === "loading" && (
          <ComparisonLoader
            primaryIso="SAU"
            primaryName="Saudi Arabia"
            comparisonIso={comparisonIso}
            comparisonName={comparisonCountry?.name || comparisonIso}
            primaryFlagUrl={saudiCountry?.flag_url}
            comparisonFlagUrl={comparisonCountry?.flag_url}
          />
        )}
      </AnimatePresence>

      {/* Report Phase */}
      {phase === "report" && cachedReport && (
        <ComparisonReport
          report={cachedReport}
          primaryCountry={{
            iso_code: "SAU",
            name: "Saudi Arabia",
            flag_url: saudiCountry?.flag_url,
            maturity_score: saudiCountry?.maturity_score,
          }}
          comparisonCountry={{
            iso_code: comparisonIso,
            name: comparisonCountry?.name || comparisonIso,
            flag_url: comparisonCountry?.flag_url,
            maturity_score: comparisonCountry?.maturity_score,
          }}
          onBack={() => setPhase("selection")}
          onRegenerate={handleRegenerate}
          isRegenerating={regenerateMutation.isPending}
        />
      )}
    </>
  );
}

export default CompareExperience;
