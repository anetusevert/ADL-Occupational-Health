/**
 * Arthur D. Little - OHI Score Distribution
 * Visual histogram showing country distribution across maturity levels
 * Compact design for no-scroll landing page
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

// Approximate distribution of 196 countries across maturity levels
const maturityLevels = [
  {
    id: "critical",
    label: "Critical",
    range: "1.0-1.9",
    count: 38,
    barColor: "from-red-500 to-red-600",
    textColor: "text-red-400",
  },
  {
    id: "developing",
    label: "Developing",
    range: "2.0-2.4",
    count: 72,
    barColor: "from-amber-500 to-amber-600",
    textColor: "text-amber-400",
  },
  {
    id: "advancing",
    label: "Advancing",
    range: "2.5-3.4",
    count: 58,
    barColor: "from-emerald-500 to-emerald-600",
    textColor: "text-emerald-400",
  },
  {
    id: "leading",
    label: "Leading",
    range: "3.5-4.0",
    count: 28,
    barColor: "from-cyan-500 to-cyan-600",
    textColor: "text-cyan-400",
  },
];

const maxCount = Math.max(...maturityLevels.map((l) => l.count));

interface OHIScoreDistributionProps {
  className?: string;
  delay?: number;
}

export function OHIScoreDistribution({ className, delay = 0 }: OHIScoreDistributionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "w-full max-w-sm mx-auto px-4 py-3 rounded-xl",
        "bg-white/[0.03] backdrop-blur-sm border border-white/10",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <img src="/adl-logo.png" alt="ADL" className="h-4 opacity-80" />
        <span className="text-xs font-semibold text-white tracking-wide">OHI Score Distribution</span>
      </div>

      {/* Histogram */}
      <div className="flex items-end justify-center gap-2 h-14 mb-2">
        {maturityLevels.map((level, index) => {
          const heightPercent = (level.count / maxCount) * 100;
          return (
            <motion.div
              key={level.id}
              initial={{ height: 0 }}
              animate={{ height: `${heightPercent}%` }}
              transition={{
                duration: 0.6,
                delay: delay + 0.1 + index * 0.08,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="relative flex-1 max-w-12"
            >
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 rounded-t-sm",
                  "bg-gradient-to-t",
                  level.barColor
                )}
                style={{ height: "100%" }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5 + index * 0.05 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2"
              >
                <span className={cn("text-[10px] font-bold", level.textColor)}>
                  {level.count}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-center gap-2">
        {maturityLevels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 + index * 0.03 }}
            className="flex-1 max-w-12 text-center"
          >
            <p className="text-[8px] font-medium text-white/70 truncate">{level.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Gradient scale bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.3 }}
        className="mt-2 h-1 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 to-cyan-500 origin-left"
      />
    </motion.div>
  );
}

export default OHIScoreDistribution;
