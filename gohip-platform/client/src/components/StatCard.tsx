/**
 * GOHIP Platform - StatCard Component
 * Reusable metric card with visual status indicators
 */

import { cn, getMaturityStage } from "../lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number | null;
  subValue?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  score?: number | null; // 0-100 for color coding
  variant?: "default" | "large" | "compact";
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  score,
  variant = "default",
  className,
}: StatCardProps) {
  const maturity = score !== undefined ? getMaturityStage(score) : null;

  const displayValue = value === null ? "N/A" : value;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50",
        maturity ? `${maturity.bgColor} ${maturity.borderColor}` : "bg-slate-800/50 border-slate-700/50",
        variant === "large" && "p-6",
        variant === "compact" && "p-3",
        variant === "default" && "p-4",
        className
      )}
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header with icon and label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </span>
          {Icon && (
            <Icon
              className={cn(
                "w-4 h-4",
                maturity ? maturity.color : "text-slate-500"
              )}
            />
          )}
        </div>

        {/* Main value */}
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-bold tracking-tight",
              variant === "large" && "text-3xl",
              variant === "compact" && "text-xl",
              variant === "default" && "text-2xl",
              maturity ? maturity.color : "text-white"
            )}
          >
            {displayValue}
          </span>

          {/* Trend indicator */}
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-red-400",
                trend === "neutral" && "text-slate-400"
              )}
            >
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trend === "neutral" && "→"}
            </span>
          )}
        </div>

        {/* Sub-value / description */}
        {subValue && (
          <p className="mt-1 text-xs text-slate-400">{subValue}</p>
        )}

        {/* Maturity stage badge */}
        {maturity && maturity.stage > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                maturity.bgColor,
                maturity.color
              )}
            >
              Stage {maturity.stage}
            </div>
            <span className={cn("text-xs", maturity.color)}>
              {maturity.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SPECIALIZED STAT CARDS
// ============================================================================

interface FatalityCardProps {
  rate: number | null;
  globalAverage?: number;
  className?: string;
}

export function FatalityCard({ rate, globalAverage = 2.0, className }: FatalityCardProps) {
  const displayRate = rate !== null ? rate.toFixed(2) : "N/A";
  const comparison = rate !== null ? (rate < globalAverage ? "below" : "above") : null;
  
  // Convert rate to a score (inverse - lower is better)
  // Rate of 0 = 100 score, rate of 4+ = 0 score
  const score = rate !== null ? Math.max(0, Math.min(100, 100 - (rate * 25))) : null;

  return (
    <StatCard
      label="Fatal Accident Rate"
      value={displayRate}
      subValue={`per 100,000 workers${comparison ? ` (${comparison} global avg)` : ""}`}
      score={score}
      variant="large"
      className={className}
    />
  );
}

interface BooleanStatCardProps {
  label: string;
  value: boolean | null;
  trueLabel?: string;
  falseLabel?: string;
  icon?: LucideIcon;
  className?: string;
}

export function BooleanStatCard({
  label,
  value,
  trueLabel = "Yes",
  falseLabel = "No",
  icon,
  className,
}: BooleanStatCardProps) {
  const displayValue = value === null ? "N/A" : value ? trueLabel : falseLabel;
  const score = value === null ? null : value ? 100 : 25;

  return (
    <StatCard
      label={label}
      value={displayValue}
      score={score}
      icon={icon}
      className={className}
    />
  );
}

export default StatCard;
