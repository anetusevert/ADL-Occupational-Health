/**
 * Arthur D. Little - Global Health Platform
 * Strategic Question Card Component
 * 
 * Compact card for displaying a strategic question in the 2x2 grid.
 * Shows question title, brief answer summary, status, and score.
 * Clicking opens the detail modal.
 */

import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  ChevronRight,
  Loader2,
  Database,
  Globe2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { StrategicQuestion } from "../../lib/strategicQuestions";

// ============================================================================
// TYPES
// ============================================================================

export type QuestionStatus = "complete" | "partial" | "gap";

export interface QuestionAnswer {
  summary: string;
  detailed: string[];
  citations: Array<{
    text: string;
    source: "database" | "research";
    reference: string;
  }>;
  status: QuestionStatus;
  score: number;
}

export interface BestPracticeLeader {
  country_iso: string;
  country_name: string;
  flag_url?: string;
  score: number;
  what_they_do: string;
  how_they_do_it: string;
  key_lesson: string;
  sources: string[];
}

export interface StrategicQuestionCardProps {
  question: StrategicQuestion;
  answer: QuestionAnswer | null;
  questionIndex: number;
  isLoading: boolean;
  pillarColor: string;
  pillarBgColor: string;
  pillarBorderColor: string;
  onClick: () => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: QuestionStatus }) {
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
      "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium",
      bg, border, color
    )}>
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </div>
  );
}

function CitationIndicator({ citations }: { citations: QuestionAnswer["citations"] }) {
  const dbCount = citations.filter(c => c.source === "database").length;
  const researchCount = citations.filter(c => c.source === "research").length;

  return (
    <div className="flex items-center gap-2 text-[10px] text-white/40">
      {dbCount > 0 && (
        <span className="flex items-center gap-0.5">
          <Database className="w-3 h-3" />
          {dbCount}
        </span>
      )}
      {researchCount > 0 && (
        <span className="flex items-center gap-0.5">
          <Globe2 className="w-3 h-3" />
          {researchCount}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StrategicQuestionCard({
  question,
  answer,
  questionIndex,
  isLoading,
  pillarColor,
  pillarBgColor,
  pillarBorderColor,
  onClick,
}: StrategicQuestionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "group relative h-full p-4 rounded-xl border text-left transition-all",
        "bg-slate-800/60 hover:bg-slate-800/80",
        pillarBorderColor,
        "hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Question Number */}
      <div className={cn(
        "absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center",
        "text-sm font-bold shadow-lg",
        pillarBgColor,
        "border",
        pillarBorderColor,
        pillarColor
      )}>
        {questionIndex + 1}
      </div>

      {/* Content */}
      <div className="flex flex-col h-full pt-2">
        {/* Title */}
        <h3 className={cn("text-sm font-semibold mb-1", pillarColor)}>
          {question.title}
        </h3>
        
        {/* Question */}
        <p className="text-xs text-white/60 mb-3 line-clamp-2">
          {question.question}
        </p>

        {/* Answer Summary or Loading */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </div>
          ) : answer ? (
            <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
              {answer.summary}
            </p>
          ) : (
            <p className="text-xs text-white/40 italic">
              Click to generate analysis
            </p>
          )}
        </div>

        {/* Footer: Status, Score, Citations */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          {answer ? (
            <>
              <StatusBadge status={answer.status} />
              <div className="flex items-center gap-3">
                <CitationIndicator citations={answer.citations} />
                <div className={cn(
                  "text-lg font-bold",
                  answer.score >= 70 ? "text-emerald-400" :
                  answer.score >= 40 ? "text-amber-400" : "text-red-400"
                )}>
                  {answer.score.toFixed(0)}%
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1" />
          )}
          
          {/* Hover Indicator */}
          <ChevronRight className={cn(
            "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-2",
            pillarColor
          )} />
        </div>
      </div>
    </motion.button>
  );
}

export default StrategicQuestionCard;
