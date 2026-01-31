/**
 * Arthur D. Little - Global Health Platform
 * Report Viewer Modal Component
 * Displays full deep dive reports in a modal overlay
 */

import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Sparkles,
  Globe,
  Clock,
  Zap,
  Shield,
  ArrowRight,
  Target,
  Database,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import {
  getStrategicDeepDiveReport,
  type KeyFinding,
  type SWOTItem,
  type StrategicRecommendation,
} from "../services/api";
import { cn } from "../lib/utils";

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isoCode: string;
  topic: string;
  countryName: string;
}

export function ReportViewerModal({
  isOpen,
  onClose,
  isoCode,
  topic,
  countryName,
}: ReportViewerModalProps) {
  // Fetch report data
  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["strategic-deep-dive-report", isoCode, topic],
    queryFn: () => getStrategicDeepDiveReport(isoCode, topic),
    enabled: isOpen && !!isoCode && !!topic,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Keyboard handler for escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-2 sm:inset-4 md:inset-8 lg:inset-12 bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700/50 z-50 overflow-hidden flex flex-col shadow-2xl max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)]"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full animate-pulse" />
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-slate-400 text-sm mt-4">Loading report...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <AlertCircle className="w-12 h-12 text-red-400/70 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Report</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {error instanceof Error ? error.message : "Unable to fetch the report"}
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Report Content */}
            {!isLoading && !isError && report && (
              <>
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-sm border-b border-purple-500/30 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-purple-300 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          Strategic Deep Dive Report
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white truncate">
                        {report.strategy_name || `${countryName} Analysis`}
                      </h2>
                      <div className="flex items-center gap-3 text-[10px] text-purple-200/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {report.country_name || countryName}
                        </span>
                        {report.generated_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.generated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white/70" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
                  {/* Executive Summary */}
                  {report.executive_summary && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        Executive Summary
                      </h3>
                      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
                        <p className="text-slate-300 leading-relaxed text-sm">
                          {report.executive_summary}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Key Findings */}
                  {report.key_findings?.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Key Findings
                      </h3>
                      <div className="space-y-2">
                        {report.key_findings.map((finding: KeyFinding, idx: number) => (
                          <div
                            key={idx}
                            className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3"
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={cn(
                                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                  finding.impact_level === "high"
                                    ? "bg-red-500/20 text-red-400"
                                    : finding.impact_level === "medium"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-slate-500/20 text-slate-400"
                                )}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-xs font-medium text-white">{finding.title}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {finding.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* SWOT Analysis */}
                  {(report.strengths?.length > 0 || report.weaknesses?.length > 0) && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        SWOT Analysis
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <h4 className="text-xs font-semibold text-emerald-400">Strengths</h4>
                          </div>
                          <ul className="space-y-1">
                            {report.strengths?.map((item: SWOTItem, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                <span className="text-slate-300">{item.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                            <h4 className="text-xs font-semibold text-red-400">Weaknesses</h4>
                          </div>
                          <ul className="space-y-1">
                            {report.weaknesses?.map((item: SWOTItem, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                                <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                <span className="text-slate-300">{item.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                            <h4 className="text-xs font-semibold text-amber-400">Opportunities</h4>
                          </div>
                          <ul className="space-y-1">
                            {report.opportunities?.map((item: SWOTItem, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                                <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span className="text-slate-300">{item.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                            <h4 className="text-xs font-semibold text-purple-400">Threats</h4>
                          </div>
                          <ul className="space-y-1">
                            {report.threats?.map((item: SWOTItem, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                                <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                <span className="text-slate-300">{item.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Strategic Recommendations */}
                  {report.strategic_recommendations?.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        Strategic Recommendations
                      </h3>
                      <div className="space-y-2">
                        {report.strategic_recommendations.map(
                          (rec: StrategicRecommendation, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <p className="text-xs font-medium text-white">{rec.title}</p>
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0",
                                    rec.priority === "critical"
                                      ? "bg-red-500/20 text-red-400"
                                      : rec.priority === "high"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : "bg-slate-500/20 text-slate-400"
                                  )}
                                >
                                  {rec.priority}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">{rec.description}</p>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                  {/* Priority Interventions */}
                  {report.priority_interventions?.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-rose-400" />
                        Priority Interventions
                      </h3>
                      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                        <ol className="space-y-1.5">
                          {report.priority_interventions.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                              <span className="w-5 h-5 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-slate-300">{item}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </section>
                  )}

                  {/* Data Quality Notes */}
                  {report.data_quality_notes && (
                    <section className="border-t border-slate-700/40 pt-4">
                      <h3 className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        Data Quality Notes
                      </h3>
                      <p className="text-[11px] text-slate-500 italic">
                        {report.data_quality_notes}
                      </p>
                    </section>
                  )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-3 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500">
                    {report.ai_provider && `Generated by ${report.ai_provider}`}
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ReportViewerModal;
