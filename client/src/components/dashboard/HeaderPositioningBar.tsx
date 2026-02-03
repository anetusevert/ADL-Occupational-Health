/**
 * Header Positioning Bar Component
 * 
 * Compact inline display of relative positioning metrics in the header.
 * Features:
 * - Mini colored bars showing 5 metrics (OHI, Gov, Hazard, Vigil, Rest)
 * - Hover reveals detailed popover with global avg, trend, percentile
 * - Click expands to larger view
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Crown, Shield, Eye, HeartPulse, 
  TrendingUp, TrendingDown, Minus, ChevronDown 
} from "lucide-react";
import { cn } from "../../lib/utils";

interface HeaderPositioningBarProps {
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
    totalCountries: number;
  } | null;
  ohiScore: number | null;
}

interface MetricData {
  id: string;
  label: string;
  shortLabel: string;
  score: number | null;
  globalAverage: number | null;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface MiniBarProps {
  metric: MetricData;
  onHover: (id: string | null) => void;
  isHovered: boolean;
}

function MiniBar({ metric, onHover, isHovered }: MiniBarProps) {
  const { id, shortLabel, score, globalAverage, icon: Icon, color, bgColor, borderColor } = metric;
  const diff = score !== null && globalAverage !== null ? score - globalAverage : null;
  const isAboveAverage = diff !== null && diff > 0;
  const isBelowAverage = diff !== null && diff < -5;

  return (
    <div
      className="relative"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all",
          "border backdrop-blur-sm",
          isHovered ? `${bgColor} ${borderColor}` : "bg-white/5 border-white/10 hover:border-white/20"
        )}
      >
        <Icon className={cn("w-3 h-3", color)} />
        <span className="text-[10px] font-medium text-white/70">{shortLabel}</span>
        {score !== null ? (
          <span className={cn("text-xs font-bold", color)}>{score.toFixed(0)}%</span>
        ) : (
          <span className="text-xs text-white/30">--</span>
        )}
        {diff !== null && (
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            isAboveAverage ? "bg-emerald-400" : isBelowAverage ? "bg-red-400" : "bg-slate-400"
          )} />
        )}
      </motion.div>

      {/* Hover Popover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] w-48"
          >
            <div className="bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-3 backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <Icon className={cn("w-4 h-4", color)} />
                <span className="text-sm font-semibold text-white">{metric.label}</span>
              </div>

              {/* Score */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">Score</span>
                {score !== null ? (
                  <span className={cn("text-sm font-bold", color)}>{score.toFixed(1)}%</span>
                ) : (
                  <span className="text-sm text-white/30">N/A</span>
                )}
              </div>

              {/* Global Average */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">Global Avg</span>
                {globalAverage !== null ? (
                  <span className="text-sm text-white/70">{globalAverage.toFixed(1)}%</span>
                ) : (
                  <span className="text-sm text-white/30">N/A</span>
                )}
              </div>

              {/* Difference */}
              {diff !== null && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/50">vs Average</span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    isAboveAverage ? "text-emerald-400" : isBelowAverage ? "text-red-400" : "text-slate-400"
                  )}>
                    {isAboveAverage ? <TrendingUp className="w-3 h-3" /> :
                     isBelowAverage ? <TrendingDown className="w-3 h-3" /> :
                     <Minus className="w-3 h-3" />}
                    <span>{isAboveAverage ? "+" : ""}{diff.toFixed(1)}</span>
                  </div>
                </div>
              )}

              {/* Visual Bar */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                {globalAverage !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                    style={{ left: `${Math.min(globalAverage, 100)}%` }}
                  />
                )}
                {score !== null && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(score, 100)}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn("absolute inset-y-0 left-0 rounded-full", bgColor)}
                  />
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-2 flex justify-center">
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full",
                  isAboveAverage ? "bg-emerald-500/20 text-emerald-400" :
                  isBelowAverage ? "bg-red-500/20 text-red-400" :
                  "bg-slate-500/20 text-slate-400"
                )}>
                  {isAboveAverage ? "Above Average" : isBelowAverage ? "Below Average" : "Near Average"}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-t border-l border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HeaderPositioningBar({ country, globalAverages, ohiScore }: HeaderPositioningBarProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate OHI global average
  const ohiGlobalAverage = globalAverages ? (
    (globalAverages.governance ?? 0) + 
    (globalAverages.hazardControl ?? 0) + 
    (globalAverages.vigilance ?? 0) + 
    (globalAverages.restoration ?? 0)
  ) / 4 : null;

  const metrics: MetricData[] = [
    {
      id: "ohi",
      label: "ADL OHI Score",
      shortLabel: "OHI",
      score: ohiScore,
      globalAverage: ohiGlobalAverage,
      icon: BarChart3,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      borderColor: "border-cyan-500/30",
    },
    {
      id: "governance",
      label: "Governance",
      shortLabel: "Gov",
      score: country.governance_score ?? null,
      globalAverage: globalAverages?.governance ?? null,
      icon: Crown,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
    },
    {
      id: "hazard",
      label: "Hazard Control",
      shortLabel: "Hazard",
      score: country.pillar1_score ?? null,
      globalAverage: globalAverages?.hazardControl ?? null,
      icon: Shield,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      id: "vigilance",
      label: "Vigilance",
      shortLabel: "Vigil",
      score: country.pillar2_score ?? null,
      globalAverage: globalAverages?.vigilance ?? null,
      icon: Eye,
      color: "text-teal-400",
      bgColor: "bg-teal-500/20",
      borderColor: "border-teal-500/30",
    },
    {
      id: "restoration",
      label: "Restoration",
      shortLabel: "Rest",
      score: country.pillar3_score ?? null,
      globalAverage: globalAverages?.restoration ?? null,
      icon: HeartPulse,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30",
    },
  ];

  // Calculate overall status
  const overallAbove = metrics.filter(m => 
    m.score !== null && m.globalAverage !== null && m.score > m.globalAverage
  ).length;
  const overallStatus = overallAbove >= 3 ? "Above" : overallAbove >= 2 ? "Mixed" : "Below";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      {/* Metrics Row */}
      <div className="flex items-center gap-1">
        {metrics.map((metric) => (
          <MiniBar
            key={metric.id}
            metric={metric}
            onHover={setHoveredMetric}
            isHovered={hoveredMetric === metric.id}
          />
        ))}
      </div>

      {/* Expand Button (optional) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "p-1 rounded-lg transition-colors",
          "text-white/40 hover:text-white/70 hover:bg-white/10"
        )}
        title="View detailed positioning"
      >
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Expanded Panel (if needed) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 border-t border-white/10 backdrop-blur-xl z-50"
          >
            <div className="max-w-7xl mx-auto p-4">
              <div className="grid grid-cols-5 gap-4">
                {metrics.map((metric) => (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <metric.icon className={cn("w-4 h-4", metric.color)} />
                      <span className="text-sm font-medium text-white">{metric.label}</span>
                    </div>
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      {metric.globalAverage !== null && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                          style={{ left: `${metric.globalAverage}%` }}
                        />
                      )}
                      {metric.score !== null && (
                        <div
                          className={cn("absolute inset-y-0 left-0 rounded-full", metric.bgColor)}
                          style={{ width: `${metric.score}%` }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">
                        {metric.score?.toFixed(0) ?? "N/A"}%
                      </span>
                      <span className="text-white/30">
                        Avg: {metric.globalAverage?.toFixed(0) ?? "N/A"}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default HeaderPositioningBar;
