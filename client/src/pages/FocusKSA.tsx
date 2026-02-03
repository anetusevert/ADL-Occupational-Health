/**
 * Arthur D. Little - Global Health Platform
 * Focus: KSA Page
 * 
 * Premium 4-quadrant framework analysis dedicated to Saudi Arabia.
 * Shows the architecture of the OH framework with KSA positioning.
 * Each quadrant represents a framework element (Governance, Hazard, Vigilance, Restoration)
 * with strategic questions and relative global positioning.
 * 
 * Features:
 * - Zero-scroll layout with horizontal question arrangement
 * - AI-powered deep analysis with McKinsey Partner persona
 * - Click-through to global leaders and best practices
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Loader2, Target, BarChart3, Globe2, Sparkles
} from "lucide-react";
import { apiClient } from "../services/api";
import { cn, getEffectiveOHIScore } from "../lib/utils";
import { CountryFlag } from "../components/CountryFlag";
import { type PillarId } from "../lib/strategicQuestions";
import { FrameworkQuadrant } from "../components/country-focus/FrameworkQuadrant";
import { KSADeepAnalysisModal } from "../components/country-focus/KSADeepAnalysisModal";
import type { GeoJSONMetadataResponse } from "../types/country";

// ============================================================================
// CONSTANTS
// ============================================================================

const KSA_ISO_CODE = "SAU";

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

export function FocusKSA() {
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

  // Get KSA country data (hardcoded)
  const ksaCountry = useMemo(() => {
    if (!geoData?.countries) return null;
    return geoData.countries.find(c => c.iso_code === KSA_ISO_CODE);
  }, [geoData]);

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
    if (!ksaCountry) return null;
    return getEffectiveOHIScore(
      ksaCountry.maturity_score,
      ksaCountry.governance_score,
      ksaCountry.pillar1_score,
      ksaCountry.pillar2_score,
      ksaCountry.pillar3_score
    );
  }, [ksaCountry]);

  // Get score and percentile for each pillar
  const getPillarData = (pillarId: PillarId) => {
    if (!ksaCountry || !globalStats) return null;
    
    const scoreMap: Record<PillarId, { score: number | null; stats: typeof globalStats.governance }> = {
      governance: { score: ksaCountry.governance_score ?? null, stats: globalStats.governance },
      "hazard-control": { score: ksaCountry.pillar1_score ?? null, stats: globalStats.hazard },
      vigilance: { score: ksaCountry.pillar2_score ?? null, stats: globalStats.vigilance },
      restoration: { score: ksaCountry.pillar3_score ?? null, stats: globalStats.restoration },
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
      {/* Header - Simplified for KSA Focus */}
      <header className="flex-shrink-0 px-6 py-3 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Left: Title with KSA Flag */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  Focus: KSA
                  <span className="text-xs font-normal text-white/40">|</span>
                  <span className="text-sm font-medium text-white/60">Strategic Framework Analysis</span>
                </h1>
              </div>
            </div>

            {/* KSA Badge */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/80 border border-emerald-500/20">
              {ksaCountry && (
                <CountryFlag
                  isoCode={ksaCountry.iso_code}
                  flagUrl={ksaCountry.flag_url}
                  size="md"
                  className="rounded shadow-sm"
                />
              )}
              <div>
                <p className="text-sm font-semibold text-white">Kingdom of Saudi Arabia</p>
                <p className="text-[10px] text-emerald-400/80">GOSI Occupational Health Initiative</p>
              </div>
            </div>
          </div>

          {/* Right: Score and Stats */}
          <div className="flex items-center gap-3">
            {/* Analysis Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium">Deep Analysis</span>
            </div>

            {/* OHI Score */}
            {ohiScore !== null && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <div className="text-right">
                  <p className="text-[9px] text-white/50 uppercase tracking-wider">OHI Score</p>
                  <p className="text-base font-bold text-cyan-400">{ohiScore.toFixed(1)}</p>
                </div>
              </motion.div>
            )}

            {/* Global Comparison */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-white/10">
              <Globe2 className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/50">
                vs {globalStats?.totalCountries || 0} countries
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 4 Quadrants (No Scroll) */}
      <main className="flex-1 p-3 overflow-hidden">
        <div className="h-full grid grid-cols-2 grid-rows-2 gap-3">
          {/* Governance Quadrant - Top Left */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-slate-800/80 to-purple-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="governance"
              pillarData={getPillarData("governance")}
              country={ksaCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "governance", questionId })}
            />
          </motion.div>

          {/* Hazard Control Quadrant - Top Right */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-slate-800/80 to-blue-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="hazard-control"
              pillarData={getPillarData("hazard-control")}
              country={ksaCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "hazard-control", questionId })}
            />
          </motion.div>

          {/* Vigilance Quadrant - Bottom Left */}
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-slate-800/80 to-teal-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="vigilance"
              pillarData={getPillarData("vigilance")}
              country={ksaCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "vigilance", questionId })}
            />
          </motion.div>

          {/* Restoration Quadrant - Bottom Right */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-800/80 to-amber-900/20 backdrop-blur-sm overflow-hidden"
          >
            <FrameworkQuadrant
              pillarId="restoration"
              pillarData={getPillarData("restoration")}
              country={ksaCountry}
              globalStats={globalStats}
              onQuestionClick={(questionId) => setSelectedQuestion({ pillarId: "restoration", questionId })}
            />
          </motion.div>
        </div>
      </main>

      {/* KSA Deep Analysis Modal */}
      <KSADeepAnalysisModal
        isOpen={selectedQuestion !== null}
        pillarId={selectedQuestion?.pillarId || "governance"}
        questionId={selectedQuestion?.questionId || ""}
        country={ksaCountry}
        globalStats={globalStats}
        onClose={() => setSelectedQuestion(null)}
      />
    </div>
  );
}

export default FocusKSA;
