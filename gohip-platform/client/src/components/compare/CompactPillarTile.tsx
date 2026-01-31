/**
 * Arthur D. Little - Global Health Platform
 * Compact Pillar Tile Component
 * 
 * Displays a compact view of a pillar with key metrics preview
 * Click to expand into PillarDetailModal
 */

import { motion } from "framer-motion";
import {
  Shield,
  AlertOctagon,
  Eye,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import { cn, formatNumber } from "../../lib/utils";
import type { Country } from "../../types/country";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type PillarId = "governance" | "pillar1" | "pillar2" | "pillar3";

interface KeyMetric {
  id: string;
  label: string;
  leftValue: number | null | undefined;
  rightValue: number | null | undefined;
  suffix?: string;
  lowerIsBetter?: boolean;
}

interface PillarConfig {
  id: PillarId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  keyMetrics: (left: Country, right: Country) => KeyMetric[];
}

// ============================================================================
// PILLAR CONFIGURATIONS
// ============================================================================

export const PILLAR_CONFIGS: PillarConfig[] = [
  {
    id: "governance",
    title: "Governance",
    subtitle: "Strategic Capacity & Policy",
    icon: Shield,
    color: "purple",
    gradientFrom: "from-purple-500/20",
    gradientTo: "to-purple-900/10",
    keyMetrics: (left, right) => [
      {
        id: "inspector_density",
        label: "Inspector Density",
        leftValue: left.governance?.inspector_density,
        rightValue: right.governance?.inspector_density,
        suffix: "/10k",
      },
      {
        id: "strategic_capacity",
        label: "Strategic Capacity",
        leftValue: left.governance?.strategic_capacity_score,
        rightValue: right.governance?.strategic_capacity_score,
        suffix: "%",
      },
    ],
  },
  {
    id: "pillar1",
    title: "Hazard Control",
    subtitle: "Occupational Risk Management",
    icon: AlertOctagon,
    color: "red",
    gradientFrom: "from-red-500/20",
    gradientTo: "to-red-900/10",
    keyMetrics: (left, right) => [
      {
        id: "fatal_rate",
        label: "Fatal Rate",
        leftValue: left.pillar_1_hazard?.fatal_accident_rate,
        rightValue: right.pillar_1_hazard?.fatal_accident_rate,
        suffix: "/100k",
        lowerIsBetter: true,
      },
      {
        id: "oel_compliance",
        label: "OEL Compliance",
        leftValue: left.pillar_1_hazard?.oel_compliance_pct,
        rightValue: right.pillar_1_hazard?.oel_compliance_pct,
        suffix: "%",
      },
    ],
  },
  {
    id: "pillar2",
    title: "Health Vigilance",
    subtitle: "Surveillance & Detection",
    icon: Eye,
    color: "cyan",
    gradientFrom: "from-cyan-500/20",
    gradientTo: "to-cyan-900/10",
    keyMetrics: (left, right) => [
      {
        id: "vulnerability",
        label: "Vulnerability Index",
        leftValue: left.pillar_2_vigilance?.vulnerability_index,
        rightValue: right.pillar_2_vigilance?.vulnerability_index,
        suffix: "/100",
        lowerIsBetter: true,
      },
      {
        id: "disease_reporting",
        label: "Disease Reporting",
        leftValue: left.pillar_2_vigilance?.occupational_disease_reporting_rate,
        rightValue: right.pillar_2_vigilance?.occupational_disease_reporting_rate,
        suffix: "%",
      },
    ],
  },
  {
    id: "pillar3",
    title: "Restoration",
    subtitle: "Compensation & Rehabilitation",
    icon: HeartPulse,
    color: "emerald",
    gradientFrom: "from-emerald-500/20",
    gradientTo: "to-emerald-900/10",
    keyMetrics: (left, right) => [
      {
        id: "rtw_success",
        label: "RTW Success",
        leftValue: left.pillar_3_restoration?.return_to_work_success_pct,
        rightValue: right.pillar_3_restoration?.return_to_work_success_pct,
        suffix: "%",
      },
      {
        id: "rehab_access",
        label: "Rehab Access",
        leftValue: left.pillar_3_restoration?.rehab_access_score,
        rightValue: right.pillar_3_restoration?.rehab_access_score,
        suffix: "/100",
      },
    ],
  },
];

// ============================================================================
// PROPS
// ============================================================================

interface CompactPillarTileProps {
  pillarId: PillarId;
  leftCountry: Country;
  rightCountry: Country;
  onClick: () => void;
  index?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompactPillarTile({
  pillarId,
  leftCountry,
  rightCountry,
  onClick,
  index = 0,
}: CompactPillarTileProps) {
  const config = PILLAR_CONFIGS.find((p) => p.id === pillarId);
  if (!config) return null;

  const Icon = config.icon;
  const keyMetrics = config.keyMetrics(leftCountry, rightCountry);

  // Calculate overall pillar winner
  let leftWins = 0;
  let rightWins = 0;
  keyMetrics.forEach((metric) => {
    if (
      typeof metric.leftValue === "number" &&
      typeof metric.rightValue === "number"
    ) {
      if (metric.lowerIsBetter) {
        if (metric.leftValue < metric.rightValue) leftWins++;
        if (metric.rightValue < metric.leftValue) rightWins++;
      } else {
        if (metric.leftValue > metric.rightValue) leftWins++;
        if (metric.rightValue > metric.leftValue) rightWins++;
      }
    }
  });

  const overallWinner = leftWins > rightWins ? "left" : rightWins > leftWins ? "right" : "tie";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1 + index * 0.05,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl border backdrop-blur-md overflow-hidden",
        "bg-gradient-to-b",
        config.gradientFrom,
        config.gradientTo,
        "border-white/10 hover:border-white/20",
        `hover:shadow-lg hover:shadow-${config.color}-500/10`,
        "transition-all duration-300 group"
      )}
    >
      {/* Hover glow effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          `bg-gradient-to-t from-${config.color}-500/10 to-transparent`
        )}
      />

      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                `bg-${config.color}-500/20`
              )}
            >
              <Icon className={cn("w-5 h-5", `text-${config.color}-400`)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{config.title}</h3>
              <p className="text-[10px] text-slate-400">{config.subtitle}</p>
            </div>
          </div>
          <ChevronRight
            className={cn(
              "w-4 h-4 text-slate-500 group-hover:text-white",
              "transform group-hover:translate-x-1 transition-all duration-200"
            )}
          />
        </div>

        {/* Key Metrics Preview */}
        <div className="flex-1 space-y-2">
          {keyMetrics.map((metric) => (
            <MetricPreviewRow
              key={metric.id}
              metric={metric}
              leftCode={leftCountry.iso_code}
              rightCode={rightCountry.iso_code}
            />
          ))}
        </div>

        {/* Overall Winner Indicator */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall</span>
            <div className="flex items-center gap-2">
              {overallWinner === "left" && (
                <>
                  <span className="text-emerald-400 font-medium">
                    {leftCountry.iso_code}
                  </span>
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                </>
              )}
              {overallWinner === "right" && (
                <>
                  <span className="text-emerald-400 font-medium">
                    {rightCountry.iso_code}
                  </span>
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                </>
              )}
              {overallWinner === "tie" && (
                <>
                  <span className="text-slate-400 font-medium">Tie</span>
                  <Minus className="w-3 h-3 text-slate-400" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// METRIC PREVIEW ROW
// ============================================================================

function MetricPreviewRow({
  metric,
  leftCode,
  rightCode,
}: {
  metric: KeyMetric;
  leftCode: string;
  rightCode: string;
}) {
  const leftVal = metric.leftValue;
  const rightVal = metric.rightValue;

  let leftWins = false;
  let rightWins = false;

  if (typeof leftVal === "number" && typeof rightVal === "number") {
    if (metric.lowerIsBetter) {
      leftWins = leftVal < rightVal;
      rightWins = rightVal < leftVal;
    } else {
      leftWins = leftVal > rightVal;
      rightWins = rightVal > leftVal;
    }
  }

  const formatValue = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "--";
    return formatNumber(val);
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400 truncate flex-1">{metric.label}</span>
      <div className="flex items-center gap-3">
        {/* Left Value */}
        <div className="flex items-center gap-1 min-w-[50px] justify-end">
          <span
            className={cn(
              "font-mono",
              leftWins
                ? "text-emerald-400 font-medium"
                : rightWins
                ? "text-red-400"
                : "text-white"
            )}
          >
            {formatValue(leftVal)}
          </span>
          {leftWins && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
          {rightWins && (
            <TrendingDown className="w-2.5 h-2.5 text-red-400" />
          )}
        </div>

        {/* Separator */}
        <span className="text-slate-600">|</span>

        {/* Right Value */}
        <div className="flex items-center gap-1 min-w-[50px]">
          {rightWins && <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />}
          {leftWins && <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
          <span
            className={cn(
              "font-mono",
              rightWins
                ? "text-emerald-400 font-medium"
                : leftWins
                ? "text-red-400"
                : "text-white"
            )}
          >
            {formatValue(rightVal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CompactPillarTile;
