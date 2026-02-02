/**
 * Arthur D. Little - Global Health Platform
 * Question Detail Modal Component
 * 
 * Full detail modal for a strategic question.
 * Shows complete answer, citations, and best practice leaders.
 * NO SCROLLING - all content fits within viewport.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Database,
  Globe2,
  ExternalLink,
  BookOpen,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { StrategicQuestion } from "../../lib/strategicQuestions";
import type { QuestionAnswer, BestPracticeLeader } from "./StrategicQuestionCard";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: StrategicQuestion;
  answer: QuestionAnswer;
  bestPractices: BestPracticeLeader[];
  questionIndex: number;
  pillarName: string;
  pillarColor: string;
  pillarBgColor: string;
  pillarBorderColor: string;
  countryName: string;
  onLeaderClick?: (leader: BestPracticeLeader) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: QuestionAnswer["status"] }) {
  const config = {
    complete: {
      icon: CheckCircle2,
      text: "Complete",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      color: "text-emerald-400",
    },
    partial: {
      icon: AlertCircle,
      text: "Partial",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      color: "text-amber-400",
    },
    gap: {
      icon: XCircle,
      text: "Gap",
      bg: "bg-red-500/20",
      border: "border-red-500/30",
      color: "text-red-400",
    },
  };

  const { icon: Icon, text, bg, border, color } = config[status];

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium",
      bg, border, color
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  );
}

function CitationBadge({ citation }: { citation: QuestionAnswer["citations"][0] }) {
  const Icon = citation.source === "database" ? Database : Globe2;
  const color = citation.source === "database" ? "text-cyan-400" : "text-purple-400";
  const bg = citation.source === "database" ? "bg-cyan-500/10" : "bg-purple-500/10";
  const border = citation.source === "database" ? "border-cyan-500/20" : "border-purple-500/20";

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border",
      bg, border, color
    )}>
      <Icon className="w-2.5 h-2.5" />
      <span className="font-medium">{citation.reference}</span>
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionDetailModal({
  isOpen,
  onClose,
  question,
  answer,
  bestPractices,
  questionIndex,
  pillarName,
  pillarColor,
  pillarBgColor,
  pillarBorderColor,
  countryName,
  onLeaderClick,
}: QuestionDetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal - Compact, NO scrolling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
          >
            {/* Compact Header */}
            <div className={cn(
              "px-5 py-3 border-b",
              pillarBorderColor,
              "bg-gradient-to-r from-slate-800/80 to-slate-900"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Question Number */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    "text-sm font-bold",
                    pillarBgColor,
                    "border",
                    pillarBorderColor,
                    pillarColor
                  )}>
                    Q{questionIndex + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-medium", pillarColor)}>
                        {pillarName}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-xs text-white/50">{countryName}</span>
                    </div>
                    <h2 className="text-base font-semibold text-white">
                      {question.title}
                    </h2>
                  </div>
                </div>

                {/* Status, Score, Close */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={answer.status} />
                  <div className={cn(
                    "text-xl font-bold",
                    answer.score >= 70 ? "text-emerald-400" :
                    answer.score >= 40 ? "text-amber-400" : "text-red-400"
                  )}>
                    {answer.score.toFixed(0)}%
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>
              
              {/* Question text */}
              <p className="text-xs text-white/50 mt-1">
                {question.question}
              </p>
            </div>

            {/* Content - Two column, NO scrolling */}
            <div className="flex">
              {/* Left: Deep Analysis */}
              <div className="flex-1 p-5 border-r border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className={cn("w-4 h-4", pillarColor)} />
                  <h3 className="text-sm font-semibold text-white">Deep Analysis</h3>
                </div>
                
                {/* Analysis text - limited lines, no scroll */}
                <div className="space-y-3 mb-4">
                  {answer.detailed.slice(0, 2).map((para, i) => (
                    <p key={i} className="text-sm text-white/70 leading-relaxed line-clamp-4">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Citations */}
                {answer.citations.length > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-3 h-3 text-white/40" />
                      <h4 className="text-xs font-medium text-white/60">Sources</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {answer.citations.slice(0, 4).map((citation, i) => (
                        <CitationBadge key={i} citation={citation} />
                      ))}
                      {answer.citations.length > 4 && (
                        <span className="text-[10px] text-white/40">
                          +{answer.citations.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Best Practice Leaders - Compact grid */}
              <div className="w-[340px] p-5 bg-slate-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Best Practice Leaders</h3>
                </div>
                <p className="text-[10px] text-white/40 mb-3">Top 3 performing countries in this area</p>
                
                {/* Leaders - Compact cards */}
                <div className="space-y-2">
                  {bestPractices.slice(0, 3).map((leader, idx) => (
                    <button
                      key={leader.country_iso}
                      onClick={() => onLeaderClick?.(leader)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all group",
                        "bg-slate-800/50 border-slate-700",
                        onLeaderClick && "hover:bg-slate-700/50 hover:border-slate-600 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                          idx === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                          idx === 1 ? "bg-slate-500/20 text-slate-300 border border-slate-500/30" :
                          "bg-orange-900/20 text-orange-400 border border-orange-900/30"
                        )}>
                          #{idx + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white/60">{leader.country_iso}</span>
                              <span className="text-sm font-semibold text-white">{leader.country_name}</span>
                            </div>
                            <span className={cn("text-sm font-bold", pillarColor)}>
                              {leader.score}%
                            </span>
                          </div>
                          
                          {/* What they do - single line */}
                          <p className="text-xs text-white/60 mt-1 line-clamp-1">{leader.what_they_do}</p>
                          
                          {/* Key lesson - compact */}
                          <div className={cn(
                            "mt-2 p-2 rounded text-xs",
                            pillarBgColor,
                            "border",
                            pillarBorderColor
                          )}>
                            <p className={cn("text-[10px] uppercase tracking-wider mb-0.5", pillarColor)}>Key Lesson</p>
                            <p className="text-white/80 line-clamp-1">{leader.key_lesson}</p>
                          </div>
                        </div>
                        
                        {onLeaderClick && (
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compact Footer */}
            <div className="px-5 py-2 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
              <div className="text-[10px] text-white/30">
                Analysis based on database metrics and research findings
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  pillarBgColor,
                  "border",
                  pillarBorderColor,
                  pillarColor,
                  "hover:opacity-80"
                )}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default QuestionDetailModal;
