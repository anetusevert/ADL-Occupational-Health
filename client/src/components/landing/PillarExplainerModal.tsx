/**
 * Arthur D. Little - Pillar Explainer Modal
 * Detailed modal explaining each framework pillar
 * Uses data from frameworkContent.ts
 */

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, HelpCircle, CheckCircle2, AlertTriangle, BarChart3, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import { getBlockById, type FrameworkBlock } from "../../data/frameworkContent";
import { DATA_SOURCES } from "./DataSourcesLogos";

export type PillarId = "governance" | "pillar-1" | "pillar-2" | "pillar-3";

interface PillarExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillarId: PillarId | null;
}

// Map pillar IDs to landing page IDs
const PILLAR_ID_MAP: Record<string, PillarId> = {
  governance: "governance",
  prevention: "pillar-1",
  vigilance: "pillar-2",
  restoration: "pillar-3",
};

export function PillarExplainerModal({ isOpen, onClose, pillarId }: PillarExplainerModalProps) {
  const block = pillarId ? getBlockById(pillarId) : null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  if (!block) return null;

  const Icon = block.icon;

  return (
    <AnimatePresence>
      {isOpen && block && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed inset-4 sm:inset-6 md:inset-10 lg:inset-16 m-auto",
              "max-w-3xl max-h-[90vh] overflow-auto",
              "bg-slate-900/95 backdrop-blur-xl rounded-2xl border shadow-2xl z-[101]",
              `border-${block.color}-500/30`
            )}
          >
            {/* Header */}
            <div className={cn(
              "sticky top-0 z-10 px-5 py-4 border-b border-white/10",
              "bg-gradient-to-r",
              block.gradientFrom,
              block.gradientTo
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    `bg-${block.color}-500/20`
                  )}>
                    <Icon className={cn("w-6 h-6", `text-${block.color}-400`)} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{block.title}</h2>
                    <p className="text-xs text-white/50">{block.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Description */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-white/70 leading-relaxed">
                  {block.description}
                </p>
              </div>

              {/* Core Objective */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-adl-accent" />
                  Core Objective
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {block.coreObjective}
                </p>
              </div>

              {/* Key Questions */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  Key Assessment Questions
                </h3>
                <ul className="space-y-2">
                  {block.keyQuestions.slice(0, 4).map((question, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="text-adl-accent mt-0.5">•</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best Practices */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Global Best Practices
                </h3>
                <div className="space-y-2">
                  {block.bestPracticeExamples.slice(0, 2).map((example, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <span className="text-xs font-semibold text-white">{example.country}:</span>
                      <p className="text-xs text-white/50 mt-1">{example.practice}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Challenges */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Common Challenges
                </h3>
                <ul className="space-y-1.5">
                  {block.commonChallenges.slice(0, 3).map((challenge, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                      <span className="text-amber-400 mt-0.5">!</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Scoring Criteria */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  Maturity Levels
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {block.scoringCriteria.map((criteria, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg p-2 text-xs",
                        i === 0 && "bg-cyan-500/10 border border-cyan-500/20",
                        i === 1 && "bg-emerald-500/10 border border-emerald-500/20",
                        i === 2 && "bg-amber-500/10 border border-amber-500/20",
                        i === 3 && "bg-red-500/10 border border-red-500/20"
                      )}
                    >
                      <span className={cn(
                        "font-semibold",
                        i === 0 && "text-cyan-400",
                        i === 1 && "text-emerald-400",
                        i === 2 && "text-amber-400",
                        i === 3 && "text-red-400"
                      )}>
                        {criteria.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Data Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {DATA_SOURCES.slice(0, 4).map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md",
                        "bg-white/5 border border-white/10",
                        "hover:bg-white/10 hover:border-white/20",
                        "transition-all duration-200"
                      )}
                    >
                      <img
                        src={source.logoUrl}
                        alt={source.name}
                        className="w-4 h-4 object-contain filter brightness-0 invert opacity-70"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className={cn("text-[10px] font-medium", source.color)}>
                        {source.name}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-white/30" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-5 py-3 bg-slate-900/90 border-t border-white/10">
              <button
                onClick={onClose}
                className={cn(
                  "w-full py-2 rounded-lg font-medium text-white text-sm",
                  "bg-white/10 hover:bg-white/20",
                  "transition-all duration-200"
                )}
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { PILLAR_ID_MAP };
export default PillarExplainerModal;
