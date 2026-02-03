/**
 * Arthur D. Little - GOSI Pitch Tool
 * Saudi Analysis Panel Component
 * 
 * Displays AI-generated deep comparative analysis between Saudi Arabia
 * and a benchmark country with dynamic bar charts and strategic insights.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn, getApiBaseUrl } from "../../lib/utils";

// Types
interface PillarComparison {
  pillar: string;
  saudi_score: number;
  benchmark_score: number;
  gap: number;
  saudi_assessment: string;
  benchmark_assessment: string;
  key_differences: string[];
  transferable_lessons: string[];
  priority_actions: string[];
}

interface StrategicRecommendation {
  priority: number;
  recommendation: string;
  rationale: string;
  expected_impact: string;
  complexity: string;
  timeline: string;
}

interface SaudiAnalysisData {
  analysis_title: string;
  executive_overview: string;
  overall_comparison: {
    saudi_score: number;
    benchmark_score: number;
    gap_percentage: number;
    gap_interpretation: string;
  };
  pillar_analysis: PillarComparison[];
  strategic_recommendations: StrategicRecommendation[];
  implementation_roadmap: string;
  conclusion: string;
  comparison_country_name: string;
}

interface SaudiAnalysisPanelProps {
  comparisonIso: string;
  comparisonName: string;
  isVisible: boolean;
  onToggle: () => void;
}

// API fetch function
async function fetchSaudiAnalysis(comparisonIso: string): Promise<SaudiAnalysisData> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/saudi-analysis/${comparisonIso}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force_regenerate: false }),
  });
  
  if (!response.ok) {
    // Try fallback endpoint
    const fallbackResponse = await fetch(
      `${getApiBaseUrl()}/api/v1/saudi-analysis/${comparisonIso}/fallback`
    );
    if (!fallbackResponse.ok) {
      throw new Error("Failed to fetch analysis");
    }
    return fallbackResponse.json();
  }
  
  return response.json();
}

// Pillar colors
const PILLAR_COLORS: Record<string, string> = {
  "Governance": "purple",
  "Hazard Control": "red",
  "Vigilance": "cyan",
  "Restoration": "emerald",
};

export function SaudiAnalysisPanel({
  comparisonIso,
  comparisonName,
  isVisible,
  onToggle,
}: SaudiAnalysisPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["saudi-analysis", comparisonIso],
    queryFn: () => fetchSaudiAnalysis(comparisonIso),
    enabled: isVisible && !!comparisonIso,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">Strategic Analysis</h3>
            <p className="text-xs text-slate-400">
              Saudi Arabia vs {comparisonName} • Powered by Arthur D. Little
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isVisible ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 max-h-[600px] overflow-y-auto">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="ml-3 text-slate-300">
                    Preparing analysis...
                  </span>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="flex items-center justify-center py-8 text-red-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>Failed to load analysis. Please try again.</span>
                </div>
              )}

              {/* Content */}
              {data && !isLoading && (
                <>
                  {/* Overall Score Comparison */}
                  <OverallScoreComparison
                    saudiScore={data.overall_comparison.saudi_score}
                    benchmarkScore={data.overall_comparison.benchmark_score}
                    benchmarkName={data.comparison_country_name}
                    gapPercentage={data.overall_comparison.gap_percentage}
                  />

                  {/* Executive Overview */}
                  <CollapsibleSection
                    title="Executive Overview"
                    icon={<Sparkles className="w-4 h-4" />}
                    isExpanded={expandedSection === "overview"}
                    onToggle={() => setExpandedSection(expandedSection === "overview" ? null : "overview")}
                  >
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {data.executive_overview}
                    </p>
                  </CollapsibleSection>

                  {/* Pillar Comparison Bars */}
                  <CollapsibleSection
                    title="Pillar-by-Pillar Comparison"
                    icon={<Target className="w-4 h-4" />}
                    isExpanded={expandedSection === "pillars"}
                    onToggle={() => setExpandedSection(expandedSection === "pillars" ? null : "pillars")}
                  >
                    <div className="space-y-4">
                      {data.pillar_analysis.map((pillar, index) => (
                        <PillarComparisonBar
                          key={pillar.pillar}
                          pillar={pillar}
                          benchmarkName={data.comparison_country_name}
                          index={index}
                        />
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Strategic Recommendations */}
                  <CollapsibleSection
                    title="Strategic Recommendations"
                    icon={<Lightbulb className="w-4 h-4" />}
                    isExpanded={expandedSection === "recommendations"}
                    onToggle={() => setExpandedSection(expandedSection === "recommendations" ? null : "recommendations")}
                  >
                    <div className="space-y-3">
                      {data.strategic_recommendations.slice(0, 5).map((rec, index) => (
                        <RecommendationCard key={index} recommendation={rec} />
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Implementation Roadmap */}
                  <CollapsibleSection
                    title="Implementation Roadmap"
                    icon={<ArrowRight className="w-4 h-4" />}
                    isExpanded={expandedSection === "roadmap"}
                    onToggle={() => setExpandedSection(expandedSection === "roadmap" ? null : "roadmap")}
                  >
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {data.implementation_roadmap}
                    </p>
                  </CollapsibleSection>

                  {/* Conclusion */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-300">{data.conclusion}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Overall Score Comparison Component
function OverallScoreComparison({
  saudiScore,
  benchmarkScore,
  benchmarkName,
  gapPercentage,
}: {
  saudiScore: number;
  benchmarkScore: number;
  benchmarkName: string;
  gapPercentage: number;
}) {
  const gap = benchmarkScore - saudiScore;
  const isPositive = gap < 0;

  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-400 uppercase tracking-wider">Overall OHI Score</span>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(gapPercentage).toFixed(1)}% {isPositive ? "ahead" : "gap"}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Saudi Arabia */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white font-medium">Saudi Arabia</span>
            <span className="text-lg font-bold text-white">{saudiScore.toFixed(1)}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${saudiScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            />
          </div>
        </div>

        <div className="text-slate-500 text-xl">vs</div>

        {/* Benchmark */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white font-medium">{benchmarkName}</span>
            <span className="text-lg font-bold text-white">{benchmarkScore.toFixed(1)}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${benchmarkScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Pillar Comparison Bar Component
function PillarComparisonBar({
  pillar,
  benchmarkName,
  index,
}: {
  pillar: PillarComparison;
  benchmarkName: string;
  index: number;
}) {
  const color = PILLAR_COLORS[pillar.pillar] || "cyan";
  const gap = pillar.benchmark_score - pillar.saudi_score;
  const isLeading = gap < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-slate-900/30 rounded-lg p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-sm font-medium",
          color === "purple" && "text-purple-400",
          color === "red" && "text-red-400",
          color === "cyan" && "text-cyan-400",
          color === "emerald" && "text-emerald-400",
        )}>
          {pillar.pillar}
        </span>
        <div className="flex items-center gap-2">
          {isLeading ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Leading
            </span>
          ) : gap > 20 ? (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Critical gap
            </span>
          ) : gap > 0 ? (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              -{gap.toFixed(0)} pts
            </span>
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Minus className="w-3 h-3" />
              Parity
            </span>
          )}
        </div>
      </div>

      {/* Comparison bars */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-16">Saudi</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pillar.saudi_score}%` }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={cn(
                "h-full rounded-full",
                color === "purple" && "bg-purple-500",
                color === "red" && "bg-red-500",
                color === "cyan" && "bg-cyan-500",
                color === "emerald" && "bg-emerald-500",
              )}
            />
          </div>
          <span className="text-xs text-white w-10 text-right">{pillar.saudi_score.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 w-16 truncate">{benchmarkName.split(" ")[0]}</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pillar.benchmark_score}%` }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
              className="h-full bg-slate-400 rounded-full"
            />
          </div>
          <span className="text-xs text-slate-400 w-10 text-right">{pillar.benchmark_score.toFixed(0)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ recommendation }: { recommendation: StrategicRecommendation }) {
  const complexityColors: Record<string, string> = {
    low: "text-emerald-400 bg-emerald-500/20",
    medium: "text-amber-400 bg-amber-500/20",
    high: "text-red-400 bg-red-500/20",
  };

  return (
    <div className="bg-slate-900/30 rounded-lg p-3">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-emerald-400">{recommendation.priority}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white mb-1">{recommendation.recommendation}</h4>
          <p className="text-xs text-slate-400 mb-2">{recommendation.rationale}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium",
              complexityColors[recommendation.complexity.toLowerCase()] || complexityColors.medium
            )}>
              {recommendation.complexity}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-700 text-[10px] text-slate-300">
              {recommendation.timeline}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaudiAnalysisPanel;
