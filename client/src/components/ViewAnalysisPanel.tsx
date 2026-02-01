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

// Client-side fallback when API is unavailable
function generateClientFallback(isoCode: string, viewType: string): ViewAnalysisData {
  const viewTitles: Record<string, string> = {
    layers: "National OH System Layer Analysis",
    flow: "System Logic Flow Analysis", 
    radar: "Comparative Benchmark Analysis",
    summary: "Comprehensive System Summary",
  };

  const viewDescriptions: Record<string, string[]> = {
    layers: [
      "This view analyzes the hierarchical structure of the occupational health system, from national policy frameworks down to workplace implementation.",
      "The three layers - National Policy, Institutional Infrastructure, and Workplace Implementation - represent the progressive translation of policy into practice.",
      "Gaps between layers often indicate enforcement challenges or resource constraints that prevent effective policy implementation at the ground level."
    ],
    flow: [
      "The system flow analysis examines how inputs (laws, funding, conventions) transform through operational processes into health outcomes.",
      "This input-process-outcome framework helps identify where system efficiency breaks down and resources fail to translate into worker protection.",
      "Key bottlenecks typically occur at process stages where institutional capacity limits the effectiveness of policy investments."
    ],
    radar: [
      "The radar chart provides a multi-dimensional view of system performance across Governance, Financing, Capacity, Implementation, and Impact.",
      "Comparing against benchmarks reveals specific areas where targeted improvement could yield the greatest returns.",
      "An unbalanced profile often indicates strategic priorities for resource allocation and policy focus."
    ],
    summary: [
      "This summary synthesizes key metrics and insights from all framework dimensions into a holistic system assessment.",
      "The comparative analysis highlights performance relative to regional peers and global leaders in occupational health.",
      "Strategic priorities emerge from identifying the dimensions with the greatest gap between current performance and achievable targets."
    ],
  };

  return {
    iso_code: isoCode,
    country_name: isoCode,
    view_type: viewType,
    title: viewTitles[viewType] || "System Analysis",
    analysis_paragraphs: viewDescriptions[viewType] || ["Analysis content is being generated."],
    key_insights: [
      { insight: "Multi-dimensional assessment available", implication: "Explore each view for detailed insights" },
      { insight: "Comparison features enabled", implication: "Select a comparison country for benchmarking" }
    ],
    recommendations: [
      { action: "Review all visualization views", rationale: "Complete picture requires multi-view analysis", expected_impact: "Comprehensive understanding of system architecture" }
    ],
    comparison_note: null,
    generated_at: new Date().toISOString(),
    cached: true,
  };
}

async function fetchViewAnalysis(
  isoCode: string,
  viewType: string,
  comparisonIso: string | null
): Promise<ViewAnalysisData> {
  // First try the fast fallback endpoint (GET)
  try {
    const fallbackUrl = `/api/v1/view-analysis/${isoCode}/${viewType}/fallback`;
    const response = await fetch(fallbackUrl);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback failed, continue to main endpoint
  }
  
  // Try the AI-powered endpoint (POST)
  try {
    const mainUrl = `/api/v1/view-analysis/${isoCode}/${viewType}`;
    const response = await fetch(mainUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comparison_iso: comparisonIso }),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // AI endpoint failed
  }
  
  // Return client-side fallback when API is unavailable
  console.log(`View analysis API unavailable, using client fallback for ${isoCode}/${viewType}`);
  return generateClientFallback(isoCode, viewType);
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

      {/* Content - Fixed height, no scrolling */}
      <div className="p-4 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {isLoading && <AnalysisLoading key="loading" />}
          
          {error && <AnalysisError key="error" onRetry={() => refetch()} />}
          
          {analysis && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Title */}
              <h4 className="text-sm font-semibold text-cyan-400 line-clamp-2">
                {analysis.title}
              </h4>

              {/* Analysis Paragraphs - Limited to 2 */}
              <div className="space-y-2">
                {analysis.analysis_paragraphs.slice(0, 2).map((para, idx) => (
                  <p key={idx} className="text-xs text-white/70 leading-relaxed line-clamp-3">
                    {para}
                  </p>
                ))}
              </div>

              {/* Key Insights - Limited to 2 */}
              {analysis.key_insights.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <h5 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                    Key Insights
                  </h5>
                  <div className="space-y-1.5">
                    {analysis.key_insights.slice(0, 2).map((insight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 p-1.5 bg-white/5 rounded-lg"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] text-white font-medium line-clamp-1">{insight.insight}</p>
                          <p className="text-[9px] text-white/50 line-clamp-1">{insight.implication}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Recommendation */}
              {analysis.recommendations.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-start gap-1.5 p-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                    <ArrowRight className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-white font-medium line-clamp-1">
                        {analysis.recommendations[0].action}
                      </p>
                      <p className="text-[9px] text-emerald-400 line-clamp-1">
                        {analysis.recommendations[0].expected_impact}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparison Note */}
              {analysis.comparison_note && (
                <div className="pt-2 border-t border-slate-700/50">
                  <p className="text-[10px] text-purple-400 italic line-clamp-2">
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
