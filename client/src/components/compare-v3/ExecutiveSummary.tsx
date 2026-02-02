/**
 * Executive Summary Component
 * 
 * Displays the AI-generated executive summary with animated entrance.
 */

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

interface ExecutiveSummaryProps {
  summary: string;
  saudiScore?: number;
  comparisonScore?: number;
  comparisonName: string;
}

export function ExecutiveSummary({
  summary,
  saudiScore,
  comparisonScore,
  comparisonName,
}: ExecutiveSummaryProps) {
  const gap = saudiScore && comparisonScore 
    ? ((comparisonScore - saudiScore) / comparisonScore * 100)
    : 0;
  
  const isAhead = gap < 0;
  const gapAbs = Math.abs(gap);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Executive Summary</h3>
            <p className="text-xs text-slate-400">AI-Generated Strategic Overview</p>
          </div>
        </div>
        
        {/* Gap Indicator */}
        {saudiScore && comparisonScore && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              isAhead 
                ? "bg-emerald-500/20 border border-emerald-500/30" 
                : "bg-amber-500/20 border border-amber-500/30"
            )}
          >
            {isAhead ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : gapAbs > 0 ? (
              <TrendingDown className="w-4 h-4 text-amber-400" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
            <span className={cn(
              "text-sm font-medium",
              isAhead ? "text-emerald-400" : "text-amber-400"
            )}>
              {isAhead ? "Ahead" : "Behind"} by {gapAbs.toFixed(1)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Score Comparison Bar */}
      {saudiScore && comparisonScore && (
        <div className="mb-6 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-300">Saudi Arabia</span>
              <span className="text-sm font-bold text-emerald-400">{saudiScore.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-slate-300">{comparisonName}</span>
              <span className="text-sm font-bold text-purple-400">{comparisonScore.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(saudiScore / 100) * 50}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            />
            <div className="w-px bg-slate-600" />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(comparisonScore / 100) * 50}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
            />
          </div>
        </div>
      )}

      {/* Summary Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10"
      >
        <p className="text-slate-300 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default ExecutiveSummary;
