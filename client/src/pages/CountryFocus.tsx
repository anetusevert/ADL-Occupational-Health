/**
 * Arthur D. Little - Global Health Platform
 * Country Focus Page
 * 
 * Premium 4-quadrant framework analysis for a single country.
 * Shows the architecture of the OH framework with Saudi Arabia as default.
 * Each quadrant represents a framework element (Governance, Hazard, Vigilance, Restoration)
 * with strategic questions and relative global positioning.
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Crown, Shield, Eye, HeartPulse, 
  ChevronDown, Sparkles, Target, TrendingUp, TrendingDown,
  ArrowRight, BarChart3, Globe2, Zap
} from "lucide-react";
import { apiClient } from "../services/api";
import { cn, getEffectiveOHIScore } from "../lib/utils";
import { CountryFlag } from "../components/CountryFlag";
import { PILLAR_DEFINITIONS, type PillarId } from "../lib/strategicQuestions";
import { FrameworkQuadrant } from "../components/country-focus/FrameworkQuadrant";
import { QuestionDetailModal } from "../components/country-focus/QuestionDetailModal";
import type { GeoJSONMetadataResponse } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

interface SelectedQuestion {
  pillarId: PillarId;
  questionId: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CountryFocus() {
  const [selectedCountry, setSelectedCountry] = useState("SAU"); // Saudi Arabia as default
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestion | null>(null);

  // Fetch all countries data
  const { data: geoData, isLoading } = useQuery({
    queryKey: ["geojson-metadata"],
    queryFn: async (): Promise<GeoJSONMetadataResponse> => {
      const response = await apiClient.get<GeoJSONMetadataResponse>("/api/v1/countries/geojson-metadata");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get current country data
  const currentCountry = useMemo(() => {
    if (!geoData?.countries) return null;
    return geoData.countries.find(c => c.iso_code === selectedCountry);
  }, [geoData, selectedCountry]);

  // Calculate global statistics for positioning
  const globalStats = useMemo(() => {
    if (!geoData?.countries) return null;
    
    const countries = geoData.countries.filter(c => 
      c.governance_score != null || c.pillar1_score != null || 
      c.pillar2_score != null || c.pillar3_score != null
    );

    const getStats = (field: keyof typeof countries[0]) => {
      const scores = countries
        .map(c => c[field] as number | null)
        .filter((s): s is number => s !== null)
        .sort((a, b) => a - b);
      
      if (scores.length === 0) return { avg: 0, min: 0, max: 100, percentile: 0 };
      
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      return {
        avg,
        min: scores[0],
        max: scores[scores.length - 1],
        scores,
      };
    };

    const getPercentile = (score: number | null, allScores: number[]) => {
      if (score === null || allScores.length === 0) return null;
      const belowCount = allScores.filter(s => s < score).length;
      return Math.round((belowCount / allScores.length) * 100);
    };

    const governance = getStats("governance_score");
    const hazard = getStats("pillar1_score");
    const vigilance = getStats("pillar2_score");
    const restoration = getStats("pillar3_score");

    return {
      governance,
      hazard,
      vigilance,
      restoration,
      getPercentile,
      totalCountries: countries.length,
    };
  }, [geoData]);

  // Calculate OHI score
  const ohiScore = useMemo(() => {
    if (!currentCountry) return null;
    return getEffectiveOHIScore(
      currentCountry.maturity_score,
      currentCountry.governance_score,
      currentCountry.pillar1_score,
      currentCountry.pillar2_score,
      currentCountry.pillar3_score
    );
  }, [currentCountry]);

  // Available countries for dropdown
  const availableCountries = useMemo(() => {
    if (!geoData?.countries) return [];
    return geoData.countries
      .filter(c => c.governance_score != null || c.pillar1_score != null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [geoData]);

  // Get score and percentile for each pillar
  const getPillarData = (pillarId: PillarId) => {
    if (!currentCountry || !globalStats) return null;
    
    const scoreMap: Record<PillarId, { score: number | null; stats: typeof globalStats.governance }> = {
      governance: { score: currentCountry.governance_score ?? null, stats: globalStats.governance },
      "hazard-control": { score: currentCountry.pillar1_score ?? null, stats: globalStats.hazard },
      vigilance: { score: currentCountry.pillar2_score ?? null, stats: globalStats.vigilance },
      restoration: { score: currentCountry.pillar3_score ?? null, stats: globalStats.restoration },
    };

    const data = scoreMap[pillarId];
    const percentile = globalStats.getPercentile(data.score, data.stats.scores || []);
    
    return {
      score: data.score,
      globalAvg: data.stats.avg,
      percentile,
      diffFromAvg: data.score !== null ? data.score - data.stats.avg : null,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading framework analysis...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Left: Title and Country Selector */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                <Target className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Country Focus</h1>
                <p className="text-xs text-white/50">Framework Architecture & Positioning</p>
              </div>
            </div>

            {/* Country Selector */}
            <div className="relative">
              <motion.button
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 hover:border-cyan-500/30 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {currentCountry && (
                  <CountryFlag
                    isoCode={currentCountry.iso_code}
                    flagUrl={currentCountry.flag_url}
                    size="sm"
                    className="rounded shadow-sm"
                  />
                )}
                <span className="text-white font-medium">
                  {currentCountry?.name || "Select Country"}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-white/50 transition-transform",
                  isCountryDropdownOpen && "rotate-180"
                )} />
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {isCountryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl bg-slate-800 border border-white/10 shadow-2xl z-50"
                  >
                    {availableCountries.map((country) => (
                      <button
                        key={country.iso_code}
                        onClick={() => {
                          setSelectedCountry(country.iso_code);
                          setIsCountryDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors",
                          country.iso_code === selectedCountry && "bg-cyan-500/10"
                        )}
                      >
                        <CountryFlag
                          isoCode={country.iso_code}
                          flagUrl={country.flag_url}
                          size="sm"
                          className="rounded shadow-sm"
                        />
                        <span className={cn(
                          "text-sm",
                          country.iso_code === selectedCountry ? "text-cyan-400 font-medium" : "text-white/80"
                        )}>
                          {country.name}
                        </span>
                        {country.iso_code === "SAU" && (
                          <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-400 rounded-full">
                            GOSI
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Score Badge and Indicators */}
          <div className="flex items-center gap-4">
            {/* Analysis Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">Advanced Analytics</span>
            </div>

            {/* OHI Score */}
            {ohiScore !== null && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
              >
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <div className="text-right">
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">OHI Score</p>
                  <p className="text-lg font-bold text-cyan-400">{ohiScore.toFixed(1)}</p>
                </div>
              </motion.div>
            )}

            {/* Global Comparison */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-white/10">
              <Globe2 className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/50">
                vs {globalStats?.totalCountries || 0} countries
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 4 Quadrants */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="h-full grid grid-cols-2 grid-rows-2 gap-4">
          {/* Governance Quadrant - Top Left */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-800/80 to-purple-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="governance"
              pillarData={getPillarData("governance")}
              country={currentCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "governance", questionId })}
            />
          </motion.div>

          {/* Hazard Control Quadrant - Top Right */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-800/80 to-blue-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="hazard-control"
              pillarData={getPillarData("hazard-control")}
              country={currentCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "hazard-control", questionId })}
            />
          </motion.div>

          {/* Vigilance Quadrant - Bottom Left */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-slate-800/80 to-teal-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="vigilance"
              pillarData={getPillarData("vigilance")}
              country={currentCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "vigilance", questionId })}
            />
          </motion.div>

          {/* Restoration Quadrant - Bottom Right */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-800/80 to-amber-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="restoration"
              pillarData={getPillarData("restoration")}
              country={currentCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "restoration", questionId })}
            />
          </motion.div>
        </div>
      </main>

      {/* Footer - Legend */}
      <footer className="flex-shrink-0 px-6 py-3 border-t border-white/10 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/40">Positioning Legend:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-white/60">Above Average</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-white/60">Near Average</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-white/60">Below Average</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Zap className="w-3 h-3 text-cyan-400" />
            Click any question tile for detailed analysis
          </div>
        </div>
      </footer>

      {/* Question Detail Modal */}
      <QuestionDetailModal
        isOpen={selectedQuestion !== null}
        pillarId={selectedQuestion?.pillarId || "governance"}
        questionId={selectedQuestion?.questionId || ""}
        country={currentCountry}
        globalStats={globalStats}
        onClose={() => setSelectedQuestion(null)}
      />
    </div>
  );
}

export default CountryFocus;
