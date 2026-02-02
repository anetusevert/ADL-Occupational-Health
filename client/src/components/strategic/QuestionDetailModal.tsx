/**
 * Arthur D. Little - Global Health Platform
 * Question Detail Modal Component
 * 
 * Full detail modal for a strategic question.
 * Shows complete answer, citations, and best practice leaders.
 * Modal can scroll internally while main page doesn't scroll.
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
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { StrategicQuestion } from "../../lib/strategicQuestions";
import type { QuestionAnswer, BestPracticeLeader } from "./StrategicQuestionCard";
import { BestPracticePanel } from "./BestPracticePanel";

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
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusBadgeLarge({ status }: { status: QuestionAnswer["status"] }) {
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
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium",
      bg, border, color
    )}>
      <Icon className="w-4 h-4" />
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
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border",
      bg, border, color
    )}>
      <Icon className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 px-6 py-4 border-b",
              pillarBorderColor,
              "bg-gradient-to-r",
              `from-${pillarBgColor.replace("bg-", "").replace("/10", "")}/20 to-transparent`
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Question Number */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    "text-lg font-bold",
                    pillarBgColor,
                    "border",
                    pillarBorderColor,
                    pillarColor
                  )}>
                    Q{questionIndex + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-medium", pillarColor)}>
                        {pillarName}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-xs text-white/50">{countryName}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-1">
                      {question.title}
                    </h2>
                    <p className="text-sm text-white/60">
                      {question.question}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Status and Score */}
              <div className="flex items-center gap-4 mt-4">
                <StatusBadgeLarge status={answer.status} />
                <div className={cn(
                  "text-2xl font-bold",
                  answer.score >= 70 ? "text-emerald-400" :
                  answer.score >= 40 ? "text-amber-400" : "text-red-400"
                )}>
                  {answer.score.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-5 gap-6">
                {/* Left: Detailed Answer (3 columns) */}
                <div className="col-span-3 space-y-6">
                  {/* Detailed Analysis */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className={cn("w-4 h-4", pillarColor)} />
                      <h3 className="text-sm font-semibold text-white">Deep Analysis</h3>
                    </div>
                    <div className="space-y-3">
                      {answer.detailed.map((para, i) => (
                        <p key={i} className="text-sm text-white/70 leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Citations */}
                  {answer.citations.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <ExternalLink className="w-4 h-4 text-white/50" />
                        <h3 className="text-sm font-semibold text-white">Sources</h3>
                      </div>
                      <div className="space-y-2">
                        {answer.citations.map((citation, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CitationBadge citation={citation} />
                            <span className="text-xs text-white/60 flex-1">
                              {citation.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Best Practices (2 columns) */}
                <div className="col-span-2">
                  <BestPracticePanel
                    leaders={bestPractices}
                    pillarColor={pillarColor}
                    pillarBgColor={pillarBgColor}
                    pillarBorderColor={pillarBorderColor}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
              <div className="text-[10px] text-white/30">
                Analysis based on database metrics and research findings
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pillarBgColor,
                  "border",
                  pillarBorderColor,
                  pillarColor,
                  "hover:bg-opacity-30"
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
