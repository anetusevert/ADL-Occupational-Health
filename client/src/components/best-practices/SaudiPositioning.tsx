/**
 * Arthur D. Little - GOSI Pitch Tool
 * Saudi Arabia Positioning Component
 * 
 * Shows Saudi Arabia's ranking and gap analysis compared to global leaders
 * for a specific best practice question.
 */

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Flag,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface TopCountry {
  iso_code: string;
  name: string;
  rank: number;
  score: number;
  summary: string;
  flag_url?: string;
  has_detail: boolean;
}

interface SaudiPositioningProps {
  topCountries: TopCountry[];
  saudiData?: TopCountry | null;
  onSelectSaudi?: () => void;
}

// Saudi Arabia ISO code
const SAUDI_ISO = "SAU";

export function SaudiPositioning({
  topCountries,
  saudiData,
  onSelectSaudi,
}: SaudiPositioningProps) {
  // Find Saudi Arabia in the list or use provided data
  const saudi = saudiData || topCountries.find(c => c.iso_code === SAUDI_ISO);
  
  // Get the top leader for comparison
  const leader = topCountries[0];
  
  if (!saudi || !leader) {
    return null;
  }
  
  // Calculate gap
  const gap = leader.score - saudi.score;
  const gapPercentage = leader.score > 0 ? (gap / leader.score) * 100 : 0;
  const isTopPerformer = saudi.rank <= 5;
  const isInTop10 = saudi.rank <= 10;
  const isInTop20 = saudi.rank <= 20;
  
  // Determine status color
  const getStatusColor = () => {
    if (isTopPerformer) return "emerald";
    if (isInTop10) return "cyan";
    if (isInTop20) return "amber";
    return "red";
  };
  
  const statusColor = getStatusColor();
  const statusColors = {
    emerald: {
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/40",
      text: "text-emerald-400",
    },
    cyan: {
      bg: "bg-cyan-500/20",
      border: "border-cyan-500/40",
      text: "text-cyan-400",
    },
    amber: {
      bg: "bg-amber-500/20",
      border: "border-amber-500/40",
      text: "text-amber-400",
    },
    red: {
      bg: "bg-red-500/20",
      border: "border-red-500/40",
      text: "text-red-400",
    },
  };
  
  const colors = statusColors[statusColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={cn(
        "rounded-xl border p-5",
        colors.bg,
        colors.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Flag className="w-5 h-5 text-emerald-400" />
          Saudi Arabia Positioning
        </h3>
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
          colors.bg,
          colors.text
        )}>
          GOSI Focus
        </span>
      </div>

      {/* Main Comparison */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Saudi Arabia Card */}
        <div className="bg-slate-800/60 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            {saudi.flag_url ? (
              <img
                src={saudi.flag_url}
                alt="Saudi Arabia"
                className="w-12 h-8 object-cover rounded shadow"
              />
            ) : (
              <div className="w-12 h-8 bg-emerald-500/30 rounded flex items-center justify-center">
                <Flag className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
          <h4 className="text-white font-medium text-sm mb-1">Saudi Arabia</h4>
          <div className="text-3xl font-bold text-white mb-1">{saudi.score}</div>
          <div className={cn("text-xs font-medium", colors.text)}>
            Rank #{saudi.rank}
          </div>
        </div>

        {/* Gap Indicator */}
        <div className="flex flex-col items-center justify-center">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-2",
            gap > 0 ? "bg-amber-500/20" : "bg-emerald-500/20"
          )}>
            {gap > 0 ? (
              <TrendingDown className="w-6 h-6 text-amber-400" />
            ) : (
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div className={cn(
            "text-2xl font-bold",
            gap > 0 ? "text-amber-400" : "text-emerald-400"
          )}>
            {gap > 0 ? `-${gap.toFixed(0)}` : `+${Math.abs(gap).toFixed(0)}`}
          </div>
          <div className="text-xs text-slate-400">
            {gapPercentage.toFixed(1)}% gap to leader
          </div>
        </div>

        {/* Leader Card */}
        <div className="bg-slate-800/60 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            {leader.flag_url ? (
              <img
                src={leader.flag_url}
                alt={leader.name}
                className="w-12 h-8 object-cover rounded shadow"
              />
            ) : (
              <div className="w-12 h-8 bg-amber-500/30 rounded flex items-center justify-center">
                <Flag className="w-4 h-4 text-amber-400" />
              </div>
            )}
          </div>
          <h4 className="text-white font-medium text-sm mb-1 truncate">{leader.name}</h4>
          <div className="text-3xl font-bold text-amber-400 mb-1">{leader.score}</div>
          <div className="text-xs text-amber-400 font-medium">
            #1 Leader
          </div>
        </div>
      </div>

      {/* Gap Analysis Summary */}
      <div className={cn(
        "rounded-lg p-4 mb-4",
        gap > 20 ? "bg-red-500/10 border border-red-500/20" :
        gap > 10 ? "bg-amber-500/10 border border-amber-500/20" :
        gap > 0 ? "bg-cyan-500/10 border border-cyan-500/20" :
        "bg-emerald-500/10 border border-emerald-500/20"
      )}>
        <div className="flex items-start gap-3">
          {gap > 20 ? (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          ) : gap > 10 ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Target className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className={cn(
              "font-medium text-sm mb-1",
              gap > 20 ? "text-red-400" :
              gap > 10 ? "text-amber-400" :
              gap > 0 ? "text-cyan-400" :
              "text-emerald-400"
            )}>
              {gap > 20 ? "Significant Gap Identified" :
               gap > 10 ? "Moderate Gap - Improvement Opportunity" :
               gap > 0 ? "Close to Leaders - Incremental Gains Possible" :
               "Leading Performance - Maintain Advantage"}
            </h4>
            <p className="text-xs text-slate-300">
              {gap > 20 
                ? `Saudi Arabia needs to close a ${gap}-point gap to reach global leader status. Key areas of focus should include learning from ${leader.name}'s approach and implementing targeted improvements.`
                : gap > 10
                ? `With a ${gap}-point gap, Saudi Arabia is well-positioned to reach top-tier performance through strategic enhancements based on best practice adoption.`
                : gap > 0
                ? `Saudi Arabia is close to global leaders with only a ${gap}-point gap. Focused refinements can achieve parity with ${leader.name}.`
                : `Saudi Arabia demonstrates leading practices in this area. Continued excellence and innovation will maintain this advantage.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Key Improvement Actions */}
      {gap > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Priority Actions for GOSI
          </h4>
          <div className="flex flex-wrap gap-2">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-xs text-slate-300 flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3" />
              Benchmark {leader.name}'s approach
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-xs text-slate-300 flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3" />
              Identify quick wins ({Math.min(5, gap).toFixed(0)} pts potential)
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-xs text-slate-300 flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3" />
              Develop implementation roadmap
            </motion.span>
          </div>
        </div>
      )}

      {/* Click to view details */}
      {onSelectSaudi && (
        <motion.button
          onClick={onSelectSaudi}
          className="w-full mt-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          View Saudi Arabia's Detailed Analysis
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}

export default SaudiPositioning;
