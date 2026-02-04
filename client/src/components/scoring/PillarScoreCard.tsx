/**
 * PillarScoreCard - Enhanced pillar summary card
 * 
 * Displays pillar score with animated counter,
 * metric composition breakdown, and expand/collapse details.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform, useInView } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  Activity,
  Heart,
  ChevronDown,
  TrendingDown,
  Info,
  Gauge,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Types
interface MetricDetail {
  id: string;
  name: string;
  value: number | null;
  weight: number;
  contribution: number | null;
  inverted?: boolean;
  unit?: string;
}

interface PillarScoreCardProps {
  pillarId: string;
  pillarName: string;
  shortName: string;
  description?: string;
  score: number | null;
  metrics: MetricDetail[];
  weight: number;
  color?: "purple" | "red" | "amber" | "emerald" | "cyan";
  isExpanded?: boolean;
  onExpand?: () => void;
  onMetricClick?: (metricId: string) => void;
  showProgress?: boolean;
  animated?: boolean;
  delay?: number;
  className?: string;
}

// Color configuration
const colorConfig = {
  purple: {
    text: "text-purple-400",
    bg: "bg-purple-500/20",
    ring: "#a855f7",
    border: "border-purple-500/40",
    gradient: "from-purple-500/20 to-purple-600/20",
    icon: Shield,
  },
  red: {
    text: "text-red-400",
    bg: "bg-red-500/20",
    ring: "#ef4444",
    border: "border-red-500/40",
    gradient: "from-red-500/20 to-red-600/20",
    icon: AlertTriangle,
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/20",
    ring: "#f59e0b",
    border: "border-amber-500/40",
    gradient: "from-amber-500/20 to-amber-600/20",
    icon: Activity,
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/20",
    ring: "#10b981",
    border: "border-emerald-500/40",
    gradient: "from-emerald-500/20 to-emerald-600/20",
    icon: Heart,
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/20",
    ring: "#06b6d4",
    border: "border-cyan-500/40",
    gradient: "from-cyan-500/20 to-cyan-600/20",
    icon: Gauge,
  },
};

// Animation variants
const cardVariants: Variants = {
  initial: { opacity: 0, y: 30, filter: "blur(10px)", scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  hover: {
    y: -4,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

const metricsVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.3, delay: 0.1 },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      opacity: { duration: 0.1 },
      height: { duration: 0.2 },
    },
  },
};

const metricItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  }),
};

// Animated number counter
function AnimatedScore({
  value,
  decimals = 1,
  className,
  animated = true,
}: {
  value: number;
  decimals?: number;
  className?: string;
  animated?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  
  const spring = useSpring(0, { duration: 1500, bounce: 0.2 });
  const display = useTransform(spring, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (isInView && animated) {
      spring.set(value);
    } else if (!animated) {
      spring.set(value);
    }
  }, [isInView, value, spring, animated]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </motion.span>
  );
}

// Progress ring component
function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color,
  animated = true,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  animated?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const springProgress = useSpring(0, { duration: 1500, bounce: 0 });
  const strokeDashoffset = useTransform(
    springProgress,
    (v) => circumference - (v / 100) * circumference
  );

  useEffect(() => {
    if (animated) {
      springProgress.set(progress);
    } else {
      springProgress.set(progress);
    }
  }, [progress, springProgress, animated]);

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset }}
      />
    </svg>
  );
}

export function PillarScoreCard({
  pillarId,
  pillarName,
  shortName,
  description,
  score,
  metrics,
  weight,
  color = "cyan",
  isExpanded: controlledExpanded,
  onExpand,
  onMetricClick,
  showProgress = true,
  animated = true,
  delay = 0,
  className,
}: PillarScoreCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;
  
  const colors = colorConfig[color];
  const Icon = colors.icon;

  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Calculate total metric weight
  const totalMetricWeight = useMemo(() => {
    return metrics.reduce((sum, m) => sum + m.weight, 0);
  }, [metrics]);

  const isWeightValid = Math.abs(totalMetricWeight - 1.0) < 0.001;

  // Get score status
  const getScoreStatus = (score: number | null) => {
    if (score === null) return { label: "No data", status: "neutral" };
    if (score >= 80) return { label: "Excellent", status: "success" };
    if (score >= 60) return { label: "Good", status: "good" };
    if (score >= 40) return { label: "Fair", status: "warning" };
    return { label: "Needs attention", status: "danger" };
  };

  const scoreStatus = getScoreStatus(score);

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ delay }}
      data-pillar-id={pillarId}
      className={cn(
        "rounded-xl border backdrop-blur-sm overflow-hidden",
        colors.bg,
        colors.border,
        className
      )}
    >
      {/* Card Header */}
      <button
        onClick={handleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Icon with progress ring */}
          <div className="relative">
            {showProgress && score !== null && (
              <ProgressRing
                progress={score}
                size={56}
                strokeWidth={3}
                color={colors.ring}
                animated={animated}
              />
            )}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                !showProgress && "relative w-12 h-12 rounded-xl",
                !showProgress && colors.bg
              )}
            >
              <Icon className={cn("w-5 h-5", colors.text)} />
            </div>
          </div>

          {/* Title and description */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold">{pillarName}</p>
              <span className={cn("text-xs px-2 py-0.5 rounded", colors.bg, colors.text)}>
                {shortName}
              </span>
            </div>
            {description && (
              <p className="text-white/50 text-sm line-clamp-1">{description}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white/40 text-xs">{metrics.length} metrics</span>
              <span className="text-white/20">•</span>
              <span className="text-white/40 text-xs">{(weight * 100).toFixed(0)}% of OHI</span>
            </div>
          </div>
        </div>

        {/* Score display */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              {score !== null ? (
                <>
                  <AnimatedScore
                    value={score}
                    decimals={1}
                    className={cn("text-3xl font-bold font-mono", colors.text)}
                    animated={animated}
                  />
                  <span className="text-white/40 text-sm">/100</span>
                </>
              ) : (
                <span className="text-white/40 text-2xl">—</span>
              )}
            </div>
            <p className={cn(
              "text-xs",
              scoreStatus.status === "success" && "text-emerald-400",
              scoreStatus.status === "good" && "text-lime-400",
              scoreStatus.status === "warning" && "text-amber-400",
              scoreStatus.status === "danger" && "text-red-400",
              scoreStatus.status === "neutral" && "text-white/40"
            )}>
              {scoreStatus.label}
            </p>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Metrics */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={metricsVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-3">
              {/* Weight validation */}
              <div className={cn(
                "flex items-center gap-2 text-sm p-2 rounded-lg",
                isWeightValid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
              )}>
                {isWeightValid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>
                  Total weight: {(totalMetricWeight * 100).toFixed(0)}%
                  {!isWeightValid && " (should be 100%)"}
                </span>
              </div>

              {/* Metrics list */}
              <div className="space-y-2">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.id}
                    variants={metricItemVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    onClick={() => onMetricClick?.(metric.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      "bg-white/5 border border-white/10",
                      onMetricClick && "cursor-pointer hover:bg-white/10 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white/80 text-sm truncate">{metric.name}</p>
                          {metric.inverted && (
                            <span className="flex items-center gap-1 text-xs text-blue-400 shrink-0">
                              <TrendingDown className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <span>Weight: {(metric.weight * 100).toFixed(0)}%</span>
                          {metric.unit && (
                            <>
                              <span>•</span>
                              <span>{metric.unit}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Normalized value */}
                      <div className="text-right">
                        <p className="text-white font-mono text-sm">
                          {metric.value !== null ? metric.value.toFixed(0) : "—"}
                        </p>
                        <p className="text-white/30 text-xs">normalized</p>
                      </div>

                      {/* Contribution */}
                      <div className="text-right min-w-[60px]">
                        <p className={cn("font-mono text-sm font-semibold", colors.text)}>
                          {metric.contribution !== null ? `+${metric.contribution.toFixed(1)}` : "—"}
                        </p>
                        <p className="text-white/30 text-xs">contribution</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary formula */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-white/40" />
                  <span className="text-white/60 text-sm">Pillar Score Calculation</span>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-white/50 text-xs font-mono">
                    {shortName} = Σ(normalized × weight)
                  </code>
                  <span className={cn("text-lg font-bold font-mono", colors.text)}>
                    = {score !== null ? score.toFixed(1) : "—"}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact variant for grid layouts
export function PillarScoreCardCompact({
  pillarName,
  shortName,
  score,
  weight,
  color = "cyan",
  onClick,
  className,
}: {
  pillarName: string;
  shortName: string;
  score: number | null;
  weight: number;
  color?: "purple" | "red" | "amber" | "emerald" | "cyan";
  onClick?: () => void;
  className?: string;
}) {
  const colors = colorConfig[color];
  const Icon = colors.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border text-left transition-colors",
        colors.bg,
        colors.border,
        "hover:bg-white/10",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-white font-medium text-sm">{pillarName}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded", colors.bg, colors.text)}>
              {shortName}
            </span>
          </div>
          <p className="text-white/40 text-xs">{(weight * 100).toFixed(0)}% weight</p>
        </div>
      </div>

      <div className="flex items-baseline gap-1">
        {score !== null ? (
          <>
            <AnimatedScore
              value={score}
              className={cn("text-2xl font-bold font-mono", colors.text)}
            />
            <span className="text-white/40 text-sm">/100</span>
          </>
        ) : (
          <span className="text-white/40 text-xl">—</span>
        )}
      </div>
    </motion.button>
  );
}

export default PillarScoreCard;
