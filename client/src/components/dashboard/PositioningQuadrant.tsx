/**
 * Positioning Quadrant Component
 * 
 * Visual comparison bars showing country position:
 * - Overall ADL OHI Score
 * - Governance Score
 * - Hazard Control Score
 * - Vigilance Score
 * - Restoration Score
 * 
 * Shows percentile rank and comparison to global average.
 */

import { motion } from "framer-motion";
import { BarChart3, Crown, Shield, Eye, HeartPulse, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";

interface PositioningQuadrantProps {
  country: {
    iso_code: string;
    name: string;
    governance_score?: number | null;
    pillar1_score?: number | null;
    pillar2_score?: number | null;
    pillar3_score?: number | null;
  };
  globalAverages: {
    governance: number | null;
    hazardControl: number | null;
    vigilance: number | null;
    restoration: number | null;
    getPercentile: (score: number | null, field: string) => number | null;
    totalCountries: number;
  } | null;
  ohiScore: number | null;
}

interface ScoreBarProps {
  label: string;
  score: number | null;
  globalAverage: number | null;
  percentile: number | null;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  delay: number;
}

function ScoreBar({ label, score, globalAverage, percentile, icon: Icon, color, bgColor, delay }: ScoreBarProps) {
  const diff = score !== null && globalAverage !== null ? score - globalAverage : null;
  const isAboveAverage = diff !== null && diff > 0;
  const isBelowAverage = diff !== null && diff < -5;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", color)} />
          <span className="text-xs font-medium text-white">{label}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Score value */}
          {score !== null ? (
            <span className={cn("text-sm font-bold", color)}>{score.toFixed(0)}%</span>
          ) : (
            <span className="text-sm text-white/30">N/A</span>
          )}
          
          {/* Trend indicator */}
          {diff !== null && (
            <div className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
              isAboveAverage ? "bg-emerald-500/20 text-emerald-400" :
              isBelowAverage ? "bg-red-500/20 text-red-400" :
              "bg-slate-500/20 text-slate-400"
            )}>
              {isAboveAverage ? <TrendingUp className="w-3 h-3" /> :
               isBelowAverage ? <TrendingDown className="w-3 h-3" /> :
               <Minus className="w-3 h-3" />}
              <span>{isAboveAverage ? "+" : ""}{diff.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        {/* Global average marker */}
        {globalAverage !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
            style={{ left: `${globalAverage}%` }}
          />
        )}
        
        {/* Score bar */}
        {score !== null && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              bgColor
            )}
          />
        )}
      </div>
      
      {/* Percentile badge */}
      {percentile !== null && (
        <div className="flex justify-end">
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full",
            percentile >= 75 ? "bg-emerald-500/20 text-emerald-400" :
            percentile >= 50 ? "bg-cyan-500/20 text-cyan-400" :
            percentile >= 25 ? "bg-amber-500/20 text-amber-400" :
            "bg-red-500/20 text-red-400"
          )}>
            Top {100 - percentile}%
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function PositioningQuadrant({ country, globalAverages, ohiScore }: PositioningQuadrantProps) {
  // Calculate OHI global average and percentile
  const ohiGlobalAverage = globalAverages ? (
    (globalAverages.governance ?? 0) + 
    (globalAverages.hazardControl ?? 0) + 
    (globalAverages.vigilance ?? 0) + 
    (globalAverages.restoration ?? 0)
  ) / 4 : null;

  const metrics = [
    {
      label: "ADL OHI Score",
      score: ohiScore,
      globalAverage: ohiGlobalAverage,
      percentile: null, // Would need separate calculation
      icon: BarChart3,
      color: "text-cyan-400",
      bgColor: "bg-gradient-to-r from-cyan-500 to-cyan-400",
    },
    {
      label: "Governance",
      score: country.governance_score ?? null,
      globalAverage: globalAverages?.governance ?? null,
      percentile: globalAverages?.getPercentile(country.governance_score ?? null, "governance_score") ?? null,
      icon: Crown,
      color: "text-purple-400",
      bgColor: "bg-gradient-to-r from-purple-500 to-purple-400",
    },
    {
      label: "Hazard Control",
      score: country.pillar1_score ?? null,
      globalAverage: globalAverages?.hazardControl ?? null,
      percentile: globalAverages?.getPercentile(country.pillar1_score ?? null, "pillar1_score") ?? null,
      icon: Shield,
      color: "text-blue-400",
      bgColor: "bg-gradient-to-r from-blue-500 to-blue-400",
    },
    {
      label: "Vigilance",
      score: country.pillar2_score ?? null,
      globalAverage: globalAverages?.vigilance ?? null,
      percentile: globalAverages?.getPercentile(country.pillar2_score ?? null, "pillar2_score") ?? null,
      icon: Eye,
      color: "text-teal-400",
      bgColor: "bg-gradient-to-r from-teal-500 to-teal-400",
    },
    {
      label: "Restoration",
      score: country.pillar3_score ?? null,
      globalAverage: globalAverages?.restoration ?? null,
      percentile: globalAverages?.getPercentile(country.pillar3_score ?? null, "pillar3_score") ?? null,
      icon: HeartPulse,
      color: "text-amber-400",
      bgColor: "bg-gradient-to-r from-amber-500 to-amber-400",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Relative Positioning
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              vs Global Average ({globalAverages?.totalCountries || 0} countries)
            </p>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white/40 rounded-full" />
              <span className="text-[10px] text-white/40">Global Avg</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Score Bars */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {metrics.map((metric, index) => (
          <ScoreBar
            key={metric.label}
            label={metric.label}
            score={metric.score}
            globalAverage={metric.globalAverage}
            percentile={metric.percentile}
            icon={metric.icon}
            color={metric.color}
            bgColor={metric.bgColor}
            delay={index * 0.1}
          />
        ))}
      </div>
      
      {/* Summary */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Overall Performance</span>
          <div className="flex items-center gap-2">
            {ohiScore !== null && ohiGlobalAverage !== null && (
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded",
                ohiScore >= ohiGlobalAverage + 10 ? "bg-emerald-500/20 text-emerald-400" :
                ohiScore >= ohiGlobalAverage - 10 ? "bg-cyan-500/20 text-cyan-400" :
                "bg-amber-500/20 text-amber-400"
              )}>
                {ohiScore >= ohiGlobalAverage + 10 ? "Above Average" :
                 ohiScore >= ohiGlobalAverage - 10 ? "Near Average" :
                 "Below Average"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PositioningQuadrant;
