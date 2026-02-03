/**
 * Question Detail Modal Component
 * 
 * Full-screen modal showing detailed AI-powered analysis for a strategic question.
 * Includes assessment criteria, global leaders, and actionable insights.
 */

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Target, CheckCircle2, AlertTriangle, 
  TrendingUp, TrendingDown, Minus, Award, Lightbulb,
  ArrowRight, ExternalLink, BarChart3
} from "lucide-react";
import { cn } from "../../lib/utils";
import { PILLAR_DEFINITIONS, type PillarId, getQuestionById } from "../../lib/strategicQuestions";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionDetailModalProps {
  isOpen: boolean;
  pillarId: PillarId;
  questionId: string;
  country: {
    iso_code: string;
    name: string;
  } | null;
  globalStats: {
    totalCountries: number;
  } | null;
  onClose: () => void;
}

// Mock data for best practice leaders
const MOCK_LEADERS: Record<string, Array<{
  country: string;
  flag: string;
  score: number;
  highlight: string;
}>> = {
  "legal-foundation": [
    { country: "Germany", flag: "🇩🇪", score: 95, highlight: "Comprehensive dual system with employer liability" },
    { country: "Sweden", flag: "🇸🇪", score: 92, highlight: "Work Environment Authority with broad mandate" },
    { country: "Netherlands", flag: "🇳🇱", score: 89, highlight: "Strong tripartite governance model" },
  ],
  "institutional-architecture": [
    { country: "Finland", flag: "🇫🇮", score: 94, highlight: "FIOH as global model institution" },
    { country: "Japan", flag: "🇯🇵", score: 91, highlight: "JISHA driving industry standards" },
    { country: "Australia", flag: "🇦🇺", score: 88, highlight: "Safe Work Australia coordination" },
  ],
  "enforcement-capacity": [
    { country: "Singapore", flag: "🇸🇬", score: 96, highlight: "Highest inspector density globally" },
    { country: "UK", flag: "🇬🇧", score: 90, highlight: "HSE comprehensive coverage" },
    { country: "Canada", flag: "🇨🇦", score: 87, highlight: "Provincial enforcement excellence" },
  ],
  "default": [
    { country: "Germany", flag: "🇩🇪", score: 92, highlight: "Comprehensive framework" },
    { country: "Sweden", flag: "🇸🇪", score: 90, highlight: "Strong institutional capacity" },
    { country: "Singapore", flag: "🇸🇬", score: 88, highlight: "Innovative approaches" },
  ],
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionDetailModal({
  isOpen,
  pillarId,
  questionId,
  country,
  globalStats,
  onClose,
}: QuestionDetailModalProps) {
  const pillarDef = PILLAR_DEFINITIONS[pillarId];
  const question = getQuestionById(pillarId, questionId);
  const Icon = pillarDef?.icon;
  
  // Get leaders for this question
  const leaders = MOCK_LEADERS[questionId] || MOCK_LEADERS["default"];

  // Mock assessment data
  const mockScore = 62;
  const mockPercentile = 45;
  const mockStatus = mockPercentile >= 70 ? "complete" : mockPercentile >= 40 ? "partial" : "gap";

  if (!question || !pillarDef) return null;

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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 px-6 py-4 border-b border-white/10",
              pillarDef.bgColor
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className={cn("p-3 rounded-xl border", pillarDef.bgColor, pillarDef.borderColor)}
                  >
                    <Icon className={cn("w-6 h-6", pillarDef.color)} />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-medium uppercase tracking-wider", pillarDef.color)}>
                        {pillarDef.name}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-xs text-white/50">{country?.name || "Country"}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{question.title}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Analytics Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">Deep Analysis</span>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Question Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Strategic Question */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-xl bg-slate-800/50 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Target className={cn("w-5 h-5", pillarDef.color)} />
                      <h3 className="text-lg font-semibold text-white">Strategic Question</h3>
                    </div>
                    <p className="text-white/80 text-lg leading-relaxed mb-4">
                      {question.question}
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {question.description}
                    </p>
                  </motion.div>

                  {/* Current Assessment */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 rounded-xl bg-slate-800/50 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-lg font-semibold text-white">Current Assessment</h3>
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative">
                        <svg className="w-24 h-24 -rotate-90">
                          <circle
                            cx="48" cy="48" r="40"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                          />
                          <motion.circle
                            cx="48" cy="48" r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - mockScore / 100) }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={cn(
                              mockScore >= 70 ? "text-emerald-400" :
                              mockScore >= 50 ? "text-cyan-400" :
                              mockScore >= 30 ? "text-amber-400" : "text-red-400"
                            )}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{mockScore}%</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-xs font-medium",
                            mockStatus === "complete" ? "bg-emerald-500/20 text-emerald-400" :
                            mockStatus === "partial" ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {mockStatus === "complete" ? "Complete" : mockStatus === "partial" ? "Partial" : "Gap"}
                          </span>
                          <span className="text-sm text-white/40">
                            Top {100 - mockPercentile}% globally
                          </span>
                        </div>
                        <p className="text-sm text-white/60">
                          {country?.name || "This country"} demonstrates{" "}
                          {mockStatus === "complete" ? "strong" : mockStatus === "partial" ? "moderate" : "limited"}{" "}
                          performance in this area compared to {globalStats?.totalCountries || 0} countries globally.
                        </p>
                      </div>
                    </div>

                    {/* Assessment Criteria */}
                    <div className="space-y-3">
                      <div className={cn(
                        "p-3 rounded-lg border-l-4",
                        mockStatus === "complete" ? "bg-emerald-500/10 border-emerald-500" : "bg-slate-700/30 border-slate-600"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className={cn("w-4 h-4", mockStatus === "complete" ? "text-emerald-400" : "text-white/30")} />
                          <span className={cn("text-sm font-medium", mockStatus === "complete" ? "text-emerald-400" : "text-white/40")}>
                            Complete
                          </span>
                        </div>
                        <p className="text-xs text-white/50 pl-6">{question.assessmentCriteria.complete}</p>
                      </div>

                      <div className={cn(
                        "p-3 rounded-lg border-l-4",
                        mockStatus === "partial" ? "bg-amber-500/10 border-amber-500" : "bg-slate-700/30 border-slate-600"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={cn("w-4 h-4", mockStatus === "partial" ? "text-amber-400" : "text-white/30")} />
                          <span className={cn("text-sm font-medium", mockStatus === "partial" ? "text-amber-400" : "text-white/40")}>
                            Partial
                          </span>
                        </div>
                        <p className="text-xs text-white/50 pl-6">{question.assessmentCriteria.partial}</p>
                      </div>

                      <div className={cn(
                        "p-3 rounded-lg border-l-4",
                        mockStatus === "gap" ? "bg-red-500/10 border-red-500" : "bg-slate-700/30 border-slate-600"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <X className={cn("w-4 h-4", mockStatus === "gap" ? "text-red-400" : "text-white/30")} />
                          <span className={cn("text-sm font-medium", mockStatus === "gap" ? "text-red-400" : "text-white/40")}>
                            Gap
                          </span>
                        </div>
                        <p className="text-xs text-white/50 pl-6">{question.assessmentCriteria.gap}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Key Insight */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      "p-5 rounded-xl border",
                      pillarDef.bgColor, pillarDef.borderColor
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className={cn("w-5 h-5", pillarDef.color)} />
                      <h3 className={cn("text-lg font-semibold", pillarDef.color)}>Key Insight</h3>
                    </div>
                    <p className="text-white/80 leading-relaxed">
                      Based on our analysis, {country?.name || "this country"} shows{" "}
                      {mockStatus === "complete" ? "exemplary" : mockStatus === "partial" ? "developing" : "significant opportunity for"}{" "}
                      progress in {question.title.toLowerCase()}. Key focus areas include{" "}
                      {question.researchTopics.slice(0, 2).join(" and ").toLowerCase()}.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-white/40">
                        Data Sources: {question.dataFields.slice(0, 3).join(", ")}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column - Leaders & Actions */}
                <div className="space-y-6">
                  {/* Global Leaders */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-xl bg-slate-800/50 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-semibold text-white">Global Leaders</h3>
                    </div>

                    <div className="space-y-3">
                      {leaders.map((leader, index) => (
                        <motion.div
                          key={leader.country}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="p-3 rounded-lg bg-slate-700/30 border border-white/5 hover:bg-slate-700/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold",
                              index === 0 ? "bg-amber-500/20 text-amber-400" :
                              index === 1 ? "bg-slate-400/20 text-slate-300" :
                              "bg-orange-700/20 text-orange-400"
                            )}>
                              {index + 1}
                            </span>
                            <span className="text-xl">{leader.flag}</span>
                            <span className="font-medium text-white">{leader.country}</span>
                            <span className={cn(
                              "ml-auto text-sm font-bold",
                              pillarDef.color
                            )}>
                              {leader.score}%
                            </span>
                          </div>
                          <p className="text-xs text-white/50 pl-9">{leader.highlight}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Research Topics */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-5 rounded-xl bg-slate-800/50 border border-white/10"
                  >
                    <h3 className="text-sm font-semibold text-white mb-3">Research Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {question.researchTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-lg bg-white/5 text-white/60 border border-white/10"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <button className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
                      "bg-gradient-to-r", 
                      pillarDef.bgColor.replace("/10", "/30"),
                      "border", pillarDef.borderColor,
                      "hover:shadow-lg"
                    )}>
                      <span className={pillarDef.color}>View Best Practices</span>
                      <ArrowRight className={cn("w-4 h-4", pillarDef.color)} />
                    </button>

                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all bg-slate-700/30 border border-white/10 text-white/60 hover:text-white hover:bg-slate-700/50">
                      <span>Compare with Leaders</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default QuestionDetailModal;
