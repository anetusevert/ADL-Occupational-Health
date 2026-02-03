/**
 * Framework Quadrant Component
 * 
 * Displays a single pillar with 4 strategic questions in horizontal layout.
 * Compact design optimized for zero-scroll experience.
 * Each question tile is clickable for AI-powered deep analysis.
 */

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";
import { PILLAR_DEFINITIONS, type PillarId, type StrategicQuestion } from "../../lib/strategicQuestions";

// ============================================================================
// TYPES
// ============================================================================

interface PillarData {
  score: number | null;
  globalAvg: number;
  percentile: number | null;
  diffFromAvg: number | null;
}

interface FrameworkQuadrantProps {
  pillarId: PillarId;
  pillarData: PillarData | null;
  country: {
    iso_code: string;
    name: string;
  } | null;
  globalStats: {
    totalCountries: number;
  } | null;
  onQuestionClick: (questionId: string) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPositionStatus(percentile: number | null): { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof TrendingUp;
} {
  if (percentile === null) {
    return { label: "No Data", color: "text-white/40", bgColor: "bg-white/10", icon: Minus };
  }
  if (percentile >= 70) {
    return { label: "Leading", color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: TrendingUp };
  }
  if (percentile >= 40) {
    return { label: "Advancing", color: "text-amber-400", bgColor: "bg-amber-500/20", icon: Minus };
  }
  return { label: "Developing", color: "text-red-400", bgColor: "bg-red-500/20", icon: TrendingDown };
}

function getScoreColor(score: number | null): string {
  if (score === null) return "from-slate-500 to-slate-400";
  if (score >= 70) return "from-emerald-500 to-emerald-400";
  if (score >= 50) return "from-cyan-500 to-cyan-400";
  if (score >= 30) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

// ============================================================================
// COMPACT QUESTION TILE COMPONENT
// ============================================================================

interface QuestionTileProps {
  question: StrategicQuestion;
  index: number;
  pillarColor: string;
  pillarBgColor: string;
  onClick: () => void;
}

function QuestionTile({ question, index, pillarColor, pillarBgColor, onClick }: QuestionTileProps) {
  // Simulated score - in production, this would come from the database
  const mockScore = ((question.id.charCodeAt(0) * 7 + index * 13) % 60) + 30;
  const mockPercentile = ((question.id.charCodeAt(0) * 11 + index * 17) % 70) + 15;
  
  const status = getPositionStatus(mockPercentile);
  const StatusIcon = status.icon;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-0 text-left p-2.5 rounded-lg border transition-all group cursor-pointer",
        "bg-slate-800/30 border-white/5",
        "hover:bg-slate-800/60 hover:border-white/20 hover:shadow-lg hover:shadow-black/20"
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header: Q number + Status */}
      <div className="flex items-center justify-between mb-2">
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]",
          pillarBgColor, pillarColor
        )}>
          Q{index + 1}
        </div>
        <div className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium",
          status.bgColor, status.color
        )}>
          <StatusIcon className="w-2.5 h-2.5" />
          <span className="hidden sm:inline">{status.label}</span>
        </div>
      </div>

      {/* Title - truncated */}
      <h4 className="text-xs font-semibold text-white mb-2 line-clamp-2 leading-tight min-h-[2rem]">
        {question.title}
      </h4>

      {/* Position Bar */}
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
        {/* Global average marker */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-white/30 z-10"
          style={{ left: "50%" }}
        />
        {/* Score bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mockScore}%` }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
            getScoreColor(mockScore)
          )}
        />
      </div>

      {/* Score */}
      <div className="flex items-center justify-between text-[9px]">
        <span className="text-white/50">
          <span className="text-white/80 font-medium">{mockScore}%</span>
        </span>
        <span className={cn("font-medium", status.color)}>
          Top {100 - mockPercentile}%
        </span>
      </div>
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FrameworkQuadrant({
  pillarId,
  pillarData,
  country,
  globalStats,
  onQuestionClick,
}: FrameworkQuadrantProps) {
  const pillarDef = PILLAR_DEFINITIONS[pillarId];
  const Icon = pillarDef.icon;
  const status = getPositionStatus(pillarData?.percentile ?? null);
  const StatusIcon = status.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className={cn(
        "flex-shrink-0 px-3 py-2 border-b border-white/5",
        pillarDef.bgColor
      )}>
        <div className="flex items-center justify-between">
          {/* Left: Icon + Name */}
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={cn("p-1.5 rounded-lg border", pillarDef.bgColor, pillarDef.borderColor)}
            >
              <Icon className={cn("w-4 h-4", pillarDef.color)} />
            </motion.div>
            <div>
              <h3 className="text-sm font-bold text-white">{pillarDef.name}</h3>
              <p className="text-[9px] text-white/40">{pillarDef.subtitle}</p>
            </div>
          </div>

          {/* Right: Score + Status */}
          <div className="flex items-center gap-2">
            {pillarData?.score !== null && pillarData?.score !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={cn("text-lg font-bold", pillarDef.color)}>
                  {pillarData.score.toFixed(0)}%
                </span>
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium",
                  status.bgColor, status.color
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {pillarData.diffFromAvg !== null && (
                    <span>{pillarData.diffFromAvg > 0 ? "+" : ""}{pillarData.diffFromAvg.toFixed(0)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Position Bar */}
        <div className="mt-2">
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            {/* Global average marker */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-white/40 z-10"
              style={{ left: `${pillarData?.globalAvg || 50}%` }}
            />
            {/* Score bar */}
            {pillarData?.score !== null && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pillarData.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                  pillarDef.color.replace("text-", "from-").replace("-400", "-500"),
                  pillarDef.color.replace("text-", "to-").replace("-400", "-400")
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Questions - Horizontal Layout */}
      <div className="flex-1 p-2 overflow-hidden">
        <div className="h-full flex gap-2">
          {pillarDef.questions.map((question, index) => (
            <QuestionTile
              key={question.id}
              question={question}
              index={index}
              pillarColor={pillarDef.color}
              pillarBgColor={pillarDef.bgColor}
              onClick={() => onQuestionClick(question.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FrameworkQuadrant;
