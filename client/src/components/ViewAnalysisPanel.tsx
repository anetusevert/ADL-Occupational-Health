/**
 * Arthur D. Little - Global Health Platform
 * View Analysis Panel
 * 
 * AI-powered deep qualitative analysis panel for Country Profile views.
 * Fetches analysis from the view-analysis API and displays rich content.
 */

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { ADLIcon } from "./ADLLogo";
import type { ViewType } from "./ViewSelectionModal";

// ============================================================================
// TYPES
// ============================================================================

interface KeyInsight {
  insight: string;
  implication: string;
}

interface Recommendation {
  action: string;
  rationale: string;
  expected_impact: string;
}

interface ViewAnalysisData {
  iso_code: string;
  country_name: string;
  view_type: string;
  title: string;
  analysis_paragraphs: string[];
  key_insights: KeyInsight[];
  recommendations: Recommendation[];
  comparison_note: string | null;
  generated_at: string;
  cached: boolean;
}

interface ViewAnalysisPanelProps {
  isoCode: string;
  viewType: ViewType;
  comparisonIso: string | null;
  className?: string;
}

// ============================================================================
// API FUNCTION
// ============================================================================

async function fetchViewAnalysis(
  isoCode: string,
  viewType: string,
  comparisonIso: string | null
): Promise<ViewAnalysisData> {
  // First try the fast fallback endpoint
  const fallbackUrl = `/api/v1/view-analysis/${isoCode}/${viewType}/fallback`;
  
  try {
    const response = await fetch(fallbackUrl);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback failed, continue to main endpoint
  }
  
  // Try the AI-powered endpoint
  const mainUrl = `/api/v1/view-analysis/${isoCode}/${viewType}`;
  const response = await fetch(mainUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comparison_iso: comparisonIso }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis: ${response.statusText}`);
  }
  
  return await response.json();
}

// ============================================================================
// LOADING STATE
// ============================================================================

function AnalysisLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <ADLIcon className="w-12 h-12 text-cyan-400" />
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">Generating Analysis</p>
        <p className="text-xs text-white/50">Powered by AI</p>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function AnalysisError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-red-400">Analysis Unavailable</p>
        <p className="text-xs text-white/50 mb-3">Unable to generate analysis at this time</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ViewAnalysisPanel({
  isoCode,
  viewType,
  comparisonIso,
  className,
}: ViewAnalysisPanelProps) {
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["view-analysis", isoCode, viewType, comparisonIso],
    queryFn: () => fetchViewAnalysis(isoCode, viewType, comparisonIso),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-b from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50",
        "backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Deep Analysis</h3>
          <p className="text-[10px] text-white/40">AI-powered expert insights</p>
        </div>
        {analysis?.cached && (
          <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 font-medium">
            Quick View
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-h-[300px] overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {isLoading && <AnalysisLoading key="loading" />}
          
          {error && <AnalysisError key="error" onRetry={() => refetch()} />}
          
          {analysis && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Title */}
              <h4 className="text-base font-semibold text-cyan-400">
                {analysis.title}
              </h4>

              {/* Analysis Paragraphs */}
              <div className="space-y-3">
                {analysis.analysis_paragraphs.map((para, idx) => (
                  <p key={idx} className="text-sm text-white/70 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              {/* Key Insights */}
              {analysis.key_insights.length > 0 && (
                <div className="pt-3 border-t border-slate-700/50">
                  <h5 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Key Insights
                  </h5>
                  <div className="space-y-2">
                    {analysis.key_insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-white/5 rounded-lg"
                      >
                        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-white font-medium">{insight.insight}</p>
                          <p className="text-[10px] text-white/50">{insight.implication}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="pt-3 border-t border-slate-700/50">
                  <h5 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                    Recommendations
                  </h5>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/20"
                      >
                        <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-white font-medium">{rec.action}</p>
                          <p className="text-[10px] text-white/50">{rec.rationale}</p>
                          <p className="text-[10px] text-emerald-400 mt-0.5">
                            Expected: {rec.expected_impact}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Note */}
              {analysis.comparison_note && (
                <div className="pt-3 border-t border-slate-700/50">
                  <p className="text-xs text-purple-400 italic">
                    {analysis.comparison_note}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default ViewAnalysisPanel;
