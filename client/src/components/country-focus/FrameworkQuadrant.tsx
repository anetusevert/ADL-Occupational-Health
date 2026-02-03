/**
 * Framework Quadrant Component
 * 
 * Displays a single pillar's strategic questions with visual positioning bars.
 * Each question tile is clickable for detailed analysis.
 */

import { motion } from "framer-motion";
import { Crown, Shield, Eye, HeartPulse, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
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
// QUESTION TILE COMPONENT
// ============================================================================

interface QuestionTileProps {
  question: StrategicQuestion;
  index: number;
  pillarColor: string;
  pillarBgColor: string;
  onClick: () => void;
}

function QuestionTile({ question, index, pillarColor, pillarBgColor, onClick }: QuestionTileProps) {
  // Simulated score for demonstration - in production, this would come from the database
  // For now, we generate a consistent mock score based on question ID
  const mockScore = ((question.id.charCodeAt(0) * 7 + index * 13) % 60) + 30;
  const mockPercentile = ((question.id.charCodeAt(0) * 11 + index * 17) % 70) + 15;
  
  const status = getPositionStatus(mockPercentile);
  const StatusIcon = status.icon;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all group",
        "bg-slate-800/40 border-white/5",
        "hover:bg-slate-800/70 hover:border-white/20 hover:shadow-lg"
      )}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        {/* Question Number */}
        <div className={cn(
          "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
          pillarBgColor, pillarColor
        )}>
          Q{index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-white truncate pr-2">
              {question.title}
            </h4>
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0",
              status.bgColor, status.color
            )}>
              <StatusIcon className="w-3 h-3" />
              <span>{status.label}</span>
            </div>
          </div>

          {/* Position Bar */}
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mb-1.5">
            {/* Global average marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-10"
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

          {/* Score and Percentile */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-white/40">
              Score: <span className="text-white/70 font-medium">{mockScore}%</span>
            </span>
            <span className="text-white/40">
              Top <span className={cn("font-medium", status.color)}>{100 - mockPercentile}%</span> globally
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0 mt-1" />
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
      {/* Header */}
      <div className={cn(
        "flex-shrink-0 px-4 py-3 border-b border-white/5",
        pillarDef.bgColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={cn("p-2.5 rounded-xl border", pillarDef.bgColor, pillarDef.borderColor)}
            >
              <Icon className={cn("w-5 h-5", pillarDef.color)} />
            </motion.div>
            <div>
              <h3 className="text-base font-bold text-white">{pillarDef.name}</h3>
              <p className="text-[10px] text-white/40">{pillarDef.subtitle}</p>
            </div>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-2">
            {pillarData?.score !== null && pillarData?.score !== undefined && (
              <div className={cn(
                "px-3 py-1.5 rounded-lg border",
                pillarDef.bgColor, pillarDef.borderColor
              )}>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xl font-bold", pillarDef.color)}>
                    {pillarData.score.toFixed(0)}%
                  </span>
                  <div className={cn(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
                    status.bgColor, status.color
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {pillarData.diffFromAvg !== null && (
                      <span>{pillarData.diffFromAvg > 0 ? "+" : ""}{pillarData.diffFromAvg.toFixed(0)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overall Position Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
            <span>Global Position</span>
            <span>
              {pillarData?.percentile !== null ? (
                <>Top <span className={cn("font-medium", status.color)}>{100 - (pillarData?.percentile || 0)}%</span></>
              ) : "N/A"}
            </span>
          </div>
          <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
            {/* Global average marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
              style={{ left: `${pillarData?.globalAvg || 50}%` }}
              title="Global Average"
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

      {/* Questions Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-2">
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

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-white/5 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/30">
            4 Strategic Questions
          </span>
          <span className="text-[10px] text-white/30">
            vs {globalStats?.totalCountries || 0} countries
          </span>
        </div>
      </div>
    </div>
  );
}

export default FrameworkQuadrant;
