/**
 * Arthur D. Little - Global Health Platform
 * ADL Score Badge Component
 * 
 * Branded score display with ADL logo, score value, and stage label
 * Replaces the old "Maturity" badge throughout the Compare page
 */

import { motion } from "framer-motion";
import { cn, getMaturityStage } from "../../lib/utils";
import { ADLIcon } from "../ADLLogo";

interface ADLScoreBadgeProps {
  score: number | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showStage?: boolean;
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "gap-1.5 px-2 py-1",
    icon: "xs" as const,
    score: "text-sm font-bold",
    label: "text-[10px]",
    stage: "text-[10px] px-1.5 py-0.5",
  },
  md: {
    container: "gap-2 px-3 py-1.5",
    icon: "xs" as const,
    score: "text-base font-bold",
    label: "text-xs",
    stage: "text-xs px-2 py-0.5",
  },
  lg: {
    container: "gap-3 px-4 py-2",
    icon: "sm" as const,
    score: "text-xl font-bold",
    label: "text-sm",
    stage: "text-sm px-2.5 py-1",
  },
};

export function ADLScoreBadge({
  score,
  size = "md",
  showLabel = true,
  showStage = true,
  animate = true,
  className,
}: ADLScoreBadgeProps) {
  const config = sizeConfig[size];
  const stage = getMaturityStage(score);

  if (score === null || score === undefined) {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full bg-slate-800/50 border border-slate-700/50",
          config.container,
          className
        )}
      >
        <ADLIcon size={config.icon} animate={false} />
        <span className={cn("text-slate-500", config.score)}>--</span>
        {showLabel && (
          <span className={cn("text-slate-500", config.label)}>No data</span>
        )}
      </div>
    );
  }

  const MotionDiv = animate ? motion.div : "div";
  const animationProps = animate
    ? {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
      }
    : {};

  return (
    <MotionDiv
      {...animationProps}
      className={cn(
        "inline-flex items-center rounded-full border backdrop-blur-sm",
        stage.bgColor,
        stage.borderColor,
        config.container,
        className
      )}
    >
      {/* ADL Logo Icon */}
      <ADLIcon size={config.icon} animate={false} glowEffect={false} />

      {/* Score Value */}
      <span className={cn(stage.color, config.score)}>{score.toFixed(1)}</span>

      {/* Stage Label */}
      {showStage && (
        <span
          className={cn(
            "rounded-full font-medium",
            stage.bgColor,
            stage.color,
            config.stage
          )}
        >
          {stage.label}
        </span>
      )}

      {/* Optional "ADL Score" label */}
      {showLabel && !showStage && (
        <span className={cn("text-slate-400", config.label)}>ADL Score</span>
      )}
    </MotionDiv>
  );
}

/**
 * Compact version for use in tables and lists
 */
export function ADLScoreBadgeCompact({
  score,
  className,
}: {
  score: number | null | undefined;
  className?: string;
}) {
  const stage = getMaturityStage(score);

  if (score === null || score === undefined) {
    return (
      <span className={cn("text-slate-500 text-sm", className)}>--</span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-bold text-sm",
        stage.color,
        className
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}

/**
 * Large display version for country headers
 */
export function ADLScoreBadgeLarge({
  score,
  countryName,
  animate = true,
  className,
}: {
  score: number | null | undefined;
  countryName?: string;
  animate?: boolean;
  className?: string;
}) {
  const stage = getMaturityStage(score);

  const MotionDiv = animate ? motion.div : "div";
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.1 },
      }
    : {};

  return (
    <MotionDiv
      {...animationProps}
      className={cn(
        "flex flex-col items-center gap-2",
        className
      )}
    >
      {/* Score Display */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-sm",
          stage.bgColor,
          stage.borderColor
        )}
      >
        <ADLIcon size="sm" animate={false} glowEffect={false} />
        <div className="flex flex-col items-center">
          <span className={cn("text-2xl font-bold leading-none", stage.color)}>
            {score !== null && score !== undefined ? score.toFixed(1) : "--"}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            ADL Score
          </span>
        </div>
      </div>

      {/* Stage Badge */}
      {score !== null && score !== undefined && (
        <div
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold border",
            stage.bgColor,
            stage.borderColor,
            stage.color
          )}
        >
          Stage {stage.stage}: {stage.label}
        </div>
      )}
    </MotionDiv>
  );
}

export default ADLScoreBadge;
