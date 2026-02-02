/**
 * Arthur D. Little - Global Health Platform
 * Leader Detail Modal Component
 * 
 * Shows detailed information about a best practice leader country.
 * Opens when clicking on a leader in the QuestionDetailModal.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trophy,
  Target,
  Lightbulb,
  ArrowRight,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CountryFlag } from "../CountryFlag";
import type { BestPracticeLeader } from "./StrategicQuestionCard";

interface LeaderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: BestPracticeLeader | null;
  questionTitle: string;
  pillarName: string;
  pillarColor: string;
  pillarBgColor: string;
  pillarBorderColor: string;
  rank: number;
}

export function LeaderDetailModal({
  isOpen,
  onClose,
  leader,
  questionTitle,
  pillarName,
  pillarColor,
  pillarBgColor,
  pillarBorderColor,
  rank,
}: LeaderDetailModalProps) {
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

  if (!leader) return null;

  const rankColors = {
    1: { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400" },
    2: { bg: "bg-slate-400/20", border: "border-slate-400/30", text: "text-slate-300" },
    3: { bg: "bg-orange-600/20", border: "border-orange-600/30", text: "text-orange-400" },
  };
  const rankStyle = rankColors[rank as 1 | 2 | 3] || rankColors[3];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={cn(
              "px-6 py-4 border-b",
              pillarBorderColor,
              "bg-gradient-to-r from-slate-800/80 to-slate-900"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border",
                    rankStyle.bg,
                    rankStyle.border,
                    rankStyle.text
                  )}>
                    #{rank}
                  </div>
                  
                  {/* Country Info */}
                  <div className="flex items-center gap-3">
                    <CountryFlag 
                      isoCode={leader.country_iso} 
                      size="lg"
                      className="shadow-lg"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-white">{leader.country_name}</h2>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-medium", pillarColor)}>{pillarName}</span>
                        <span className="text-white/30">•</span>
                        <span className="text-xs text-white/50">{questionTitle}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score and Close */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "px-4 py-2 rounded-xl border text-center",
                    pillarBgColor,
                    pillarBorderColor
                  )}>
                    <div className={cn("text-2xl font-bold", pillarColor)}>{leader.score}%</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">Score</div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* What They Do */}
              <div className={cn(
                "p-4 rounded-xl border",
                pillarBgColor,
                pillarBorderColor
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className={cn("w-5 h-5", pillarColor)} />
                  <h3 className="text-sm font-semibold text-white">What They Do</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {leader.what_they_do}
                </p>
              </div>

              {/* How They Do It */}
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">How They Do It</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {leader.how_they_do_it}
                </p>
              </div>

              {/* Key Lesson */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-300">Key Lesson</h3>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  {leader.key_lesson}
                </p>
              </div>

              {/* Sources */}
              {leader.sources && leader.sources.length > 0 && (
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-white/40" />
                    <h4 className="text-xs font-medium text-white/60">Sources</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {leader.sources.map((source, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-800 border border-slate-700 text-white/60"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
              <div className="text-[10px] text-white/30">
                Best practice analysis from database and research
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
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

export default LeaderDetailModal;
