/**
 * Arthur D. Little - OHI Score Distribution
 * Visual histogram showing country distribution across maturity levels
 * Premium design for landing page
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

// Approximate distribution of 196 countries across maturity levels
// These are representative numbers for display purposes
const maturityLevels = [
  {
    id: "critical",
    label: "Critical",
    range: "1.0-1.9",
    count: 38,
    color: "bg-red-500",
    barColor: "from-red-500 to-red-600",
    textColor: "text-red-400",
  },
  {
    id: "developing",
    label: "Developing",
    range: "2.0-2.4",
    count: 72,
    color: "bg-amber-500",
    barColor: "from-amber-500 to-amber-600",
    textColor: "text-amber-400",
  },
  {
    id: "advancing",
    label: "Advancing",
    range: "2.5-3.4",
    count: 58,
    color: "bg-emerald-500",
    barColor: "from-emerald-500 to-emerald-600",
    textColor: "text-emerald-400",
  },
  {
    id: "leading",
    label: "Leading",
    range: "3.5-4.0",
    count: 28,
    color: "bg-cyan-500",
    barColor: "from-cyan-500 to-cyan-600",
    textColor: "text-cyan-400",
  },
];

// Calculate max for scaling
const maxCount = Math.max(...maturityLevels.map((l) => l.count));

interface OHIScoreDistributionProps {
  className?: string;
  delay?: number;
}

export function OHIScoreDistribution({ className, delay = 0 }: OHIScoreDistributionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn(
        "w-full max-w-md mx-auto px-6 py-5 rounded-2xl",
        "bg-white/[0.03] backdrop-blur-sm border border-white/10",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <img src="/adl-logo.png" alt="ADL" className="h-5 opacity-80" />
        <span className="text-sm font-semibold text-white tracking-wide">OHI Score Distribution</span>
      </div>

      {/* Histogram */}
      <div className="flex items-end justify-center gap-3 h-24 mb-4">
        {maturityLevels.map((level, index) => {
          const heightPercent = (level.count / maxCount) * 100;
          return (
            <motion.div
              key={level.id}
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{
                duration: 0.8,
                delay: delay + 0.2 + index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="relative flex-1 max-w-16"
            >
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 rounded-t-md",
                  "bg-gradient-to-t",
                  level.barColor,
                  "shadow-lg"
                )}
                style={{ height: "100%" }}
              />
              {/* Count tooltip on hover - positioned above */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.8 + index * 0.1 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2"
              >
                <span className={cn("text-xs font-bold", level.textColor)}>
                  {level.count}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-center gap-3">
        {maturityLevels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.6 + index * 0.05 }}
            className="flex-1 max-w-16 text-center"
          >
            <p className="text-[10px] font-medium text-white/70">{level.label}</p>
            <p className="text-[8px] text-white/40">{level.range}</p>
          </motion.div>
        ))}
      </div>

      {/* Gradient scale bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.5 }}
        className="mt-4 h-1.5 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 to-cyan-500 origin-left"
      />

      {/* Scale labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[9px] text-white/30">1.0</span>
        <span className="text-[9px] text-white/30">4.0</span>
      </div>
    </motion.div>
  );
}

export default OHIScoreDistribution;
