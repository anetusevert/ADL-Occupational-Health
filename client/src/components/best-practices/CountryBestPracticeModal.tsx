/**
 * Arthur D. Little - Global Health Platform
 * Country Best Practice Modal - Country-specific case study
 * 
 * Shows detailed analysis of how a specific country
 * implements best practices for a question.
 */

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronLeft, RefreshCw, Loader2, 
  Flag, Award, TrendingUp, BookOpen, 
  ArrowRight, FileText, Target
} from "lucide-react";
import { cn } from "../../lib/utils";

interface KeyMetric {
  metric: string;
  value: string;
  context: string;
}

interface PolicyHighlight {
  policy: string;
  description: string;
  year_enacted?: string;
}

interface CountryBestPracticeData {
  country_iso_code: string;
  country_name: string;
  question_id: string;
  question_title: string;
  pillar: string;
  rank?: number;
  score?: number;
  status: string;
  approach_description?: string;
  why_best_practice?: string;
  key_metrics: KeyMetric[];
  policy_highlights: PolicyHighlight[];
  lessons_learned?: string;
  transferability?: string;
  flag_url?: string;
  generated_at?: string;
}

interface CountryBestPracticeModalProps {
  isOpen: boolean;
  data: CountryBestPracticeData | null;
  isLoading: boolean;
  isGenerating: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onGenerate: () => void;
}

export function CountryBestPracticeModal({
  isOpen,
  data,
  isLoading,
  isGenerating,
  isAdmin,
  onClose,
  onGenerate,
}: CountryBestPracticeModalProps) {
  const hasContent = data?.status === "completed" && data?.approach_description;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-start justify-center overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 shadow-2xl my-4"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Flag */}
                    {data?.flag_url ? (
                      <img
                        src={data.flag_url}
                        alt={data.country_name}
                        className="w-14 h-10 object-cover rounded-lg shadow-lg border-2 border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-10 bg-slate-700 rounded-lg flex items-center justify-center border-2 border-slate-600">
                        <Flag className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {data?.country_name || "Loading..."}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {data?.question_title || "Best Practice Case Study"}
                      </p>
                    </div>
                    
                    {/* Rank Badge */}
                    {data?.rank && (
                      <div className={cn(
                        "px-3 py-1.5 rounded-lg font-bold text-sm",
                        data.rank === 1 ? "bg-amber-500/20 text-amber-400" :
                        data.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                        data.rank === 3 ? "bg-orange-700/20 text-orange-400" :
                        "bg-slate-700/50 text-slate-400"
                      )}>
                        Rank #{data.rank}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Admin Regenerate */}
                    {isAdmin && (
                      <motion.button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          isGenerating
                            ? "bg-amber-500/20 text-amber-400 cursor-not-allowed"
                            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                        )}
                        whileHover={!isGenerating ? { scale: 1.02 } : undefined}
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>{hasContent ? "Regenerate" : "Generate"}</span>
                      </motion.button>
                    )}
                    
                    {/* Close Button */}
                    <motion.button
                      onClick={onClose}
                      className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Loading */}
                {isLoading && (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
                      <p className="text-slate-400">Loading case study...</p>
                    </div>
                  </div>
                )}

                {/* Generating */}
                {isGenerating && (
                  <div className="text-center py-16">
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white mb-2">Generating Case Study</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                      Analyzing {data?.country_name}'s approach to best practices...
                    </p>
                  </div>
                )}

                {/* No Content */}
                {!isLoading && !isGenerating && !hasContent && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Case Study Not Available</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                      {isAdmin 
                        ? "Click Generate to create a detailed case study for this country."
                        : "The case study for this country has not been generated yet."}
                    </p>
                  </div>
                )}

                {/* Content Display */}
                {hasContent && (
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* Approach Description */}
                    <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        How They Address It
                      </h3>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {data.approach_description}
                      </p>
                    </div>

                    {/* Why Best Practice */}
                    {data.why_best_practice && (
                      <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Why It's Best Practice
                        </h3>
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {data.why_best_practice}
                        </p>
                      </div>
                    )}

                    {/* Key Metrics */}
                    {data.key_metrics && data.key_metrics.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-purple-400" />
                          Key Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {data.key_metrics.map((metric, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50"
                            >
                              <div className="text-sm text-slate-400 mb-1">{metric.metric}</div>
                              <div className="text-xl font-bold text-white mb-1">{metric.value}</div>
                              <div className="text-xs text-slate-500">{metric.context}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Policy Highlights */}
                    {data.policy_highlights && data.policy_highlights.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-amber-400" />
                          Notable Policies
                        </h3>
                        <div className="space-y-3">
                          {data.policy_highlights.map((policy, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-white">{policy.policy}</h4>
                                {policy.year_enacted && (
                                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                                    {policy.year_enacted}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-400">{policy.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lessons & Transferability */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.lessons_learned && (
                        <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                            Lessons Learned
                          </h3>
                          <p className="text-sm text-slate-400 whitespace-pre-wrap">
                            {data.lessons_learned}
                          </p>
                        </div>
                      )}

                      {data.transferability && (
                        <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-emerald-400" />
                            How to Adopt
                          </h3>
                          <p className="text-sm text-slate-400 whitespace-pre-wrap">
                            {data.transferability}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Generated timestamp */}
                    {data.generated_at && (
                      <p className="text-center text-xs text-slate-500">
                        Generated: {new Date(data.generated_at).toLocaleString()}
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CountryBestPracticeModal;
