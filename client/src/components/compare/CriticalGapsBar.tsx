/**
 * Arthur D. Little - Global Health Platform
 * Critical Gaps Bar Component
 * 
 * Compact horizontal indicators for critical gaps between countries
 * Designed for no-scroll layout footer
 */

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Users,
  HeartPulse,
  AlertOctagon,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Country } from "../../types/country";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface GapIndicator {
  id: string;
  label: string;
  leftValue: number;
  rightValue: number;
  gapPercent: number;
  leftBetter: boolean;
  icon: LucideIcon;
  lowerIsBetter: boolean;
  pillarName: string;
  pillarColor: string;
  suffix: string;
}

interface CriticalGapsBarProps {
  leftCountry: Country;
  rightCountry: Country;
  onGapClick: (
    metricId: string,
    metricName: string,
    leftValue: string | number | boolean | null | undefined,
    rightValue: string | number | boolean | null | undefined,
    suffix: string,
    lowerIsBetter: boolean,
    pillarName: string,
    pillarColor: string
  ) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CriticalGapsBar({
  leftCountry,
  rightCountry,
  onGapClick,
}: CriticalGapsBarProps) {
  // Calculate critical gaps
  const gaps: GapIndicator[] = [];

  // Fatal Accident Rate Gap
  const leftFatal = leftCountry.pillar_1_hazard?.fatal_accident_rate;
  const rightFatal = rightCountry.pillar_1_hazard?.fatal_accident_rate;
  if (leftFatal != null && rightFatal != null) {
    const max = Math.max(leftFatal, rightFatal);
    const min = Math.min(leftFatal, rightFatal);
    if (min > 0) {
      const gapPercent = ((max - min) / min) * 100;
      if (gapPercent > 50) {
        gaps.push({
          id: "fatal_rate",
          label: "Fatal Rate",
          leftValue: leftFatal,
          rightValue: rightFatal,
          gapPercent,
          leftBetter: leftFatal < rightFatal,
          icon: AlertTriangle,
          lowerIsBetter: true,
          pillarName: "Pillar 1: Hazard Control",
          pillarColor: "red",
          suffix: "/100k",
        });
      }
    }
  }

  // RTW Success Rate Gap
  const leftRTW = leftCountry.pillar_3_restoration?.return_to_work_success_pct;
  const rightRTW = rightCountry.pillar_3_restoration?.return_to_work_success_pct;
  if (leftRTW != null && rightRTW != null) {
    const max = Math.max(leftRTW, rightRTW);
    const min = Math.min(leftRTW, rightRTW);
    if (min > 0) {
      const gapPercent = ((max - min) / min) * 100;
      if (gapPercent > 50) {
        gaps.push({
          id: "rtw_success",
          label: "RTW Success",
          leftValue: leftRTW,
          rightValue: rightRTW,
          gapPercent,
          leftBetter: leftRTW > rightRTW,
          icon: HeartPulse,
          lowerIsBetter: false,
          pillarName: "Pillar 3: Restoration",
          pillarColor: "emerald",
          suffix: "%",
        });
      }
    }
  }

  // Migrant Workforce Gap
  const leftMigrant = leftCountry.pillar_2_vigilance?.migrant_worker_pct;
  const rightMigrant = rightCountry.pillar_2_vigilance?.migrant_worker_pct;
  if (leftMigrant != null && rightMigrant != null) {
    const max = Math.max(leftMigrant, rightMigrant);
    const min = Math.min(leftMigrant, rightMigrant);
    if (min > 0) {
      const gapPercent = ((max - min) / min) * 100;
      if (gapPercent > 50) {
        gaps.push({
          id: "migrant_worker",
          label: "Migrant %",
          leftValue: leftMigrant,
          rightValue: rightMigrant,
          gapPercent,
          leftBetter: false, // Not better/worse, just different
          icon: Users,
          lowerIsBetter: false,
          pillarName: "Pillar 2: Health Vigilance",
          pillarColor: "cyan",
          suffix: "%",
        });
      }
    }
  }

  // OEL Compliance Gap
  const leftOEL = leftCountry.pillar_1_hazard?.oel_compliance_pct;
  const rightOEL = rightCountry.pillar_1_hazard?.oel_compliance_pct;
  if ((leftOEL == null) !== (rightOEL == null)) {
    gaps.push({
      id: "oel_compliance",
      label: "OEL Data",
      leftValue: leftOEL ?? 0,
      rightValue: rightOEL ?? 0,
      gapPercent: 100,
      leftBetter: leftOEL != null,
      icon: AlertOctagon,
      lowerIsBetter: false,
      pillarName: "Pillar 1: Hazard Control",
      pillarColor: "red",
      suffix: "%",
    });
  } else if (leftOEL != null && rightOEL != null) {
    const max = Math.max(leftOEL, rightOEL);
    const min = Math.min(leftOEL, rightOEL);
    if (min > 0) {
      const gapPercent = ((max - min) / min) * 100;
      if (gapPercent > 50) {
        gaps.push({
          id: "oel_compliance",
          label: "OEL Compliance",
          leftValue: leftOEL,
          rightValue: rightOEL,
          gapPercent,
          leftBetter: leftOEL > rightOEL,
          icon: AlertOctagon,
          lowerIsBetter: false,
          pillarName: "Pillar 1: Hazard Control",
          pillarColor: "red",
          suffix: "%",
        });
      }
    }
  }

  if (gaps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
      >
        <span className="text-sm text-emerald-400">No critical gaps detected</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-medium text-white">
          Critical Gaps ({gaps.length})
        </span>
      </div>

      {/* Gap Indicators */}
      <div className="flex flex-wrap gap-2">
        {gaps.map((gap, index) => (
          <GapChip
            key={gap.id}
            gap={gap}
            leftCode={leftCountry.iso_code}
            rightCode={rightCountry.iso_code}
            index={index}
            onClick={() =>
              onGapClick(
                gap.id,
                gap.label,
                gap.leftValue,
                gap.rightValue,
                gap.suffix,
                gap.lowerIsBetter,
                gap.pillarName,
                gap.pillarColor
              )
            }
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// GAP CHIP
// ============================================================================

function GapChip({
  gap,
  leftCode,
  rightCode,
  index,
  onClick,
}: {
  gap: GapIndicator;
  leftCode: string;
  rightCode: string;
  index: number;
  onClick: () => void;
}) {
  const Icon = gap.icon;
  const isMigrant = gap.id === "migrant_worker";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + index * 0.05, duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
        "bg-slate-900/50 border-slate-700/50 hover:border-yellow-500/50"
      )}
    >
      <Icon className="w-4 h-4 text-yellow-400" />
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium text-white">{gap.label}</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span
            className={cn(
              "font-mono",
              !isMigrant && gap.leftBetter
                ? "text-emerald-400"
                : !isMigrant && !gap.leftBetter
                ? "text-red-400"
                : "text-white"
            )}
          >
            {leftCode}: {gap.leftValue.toFixed(1)}
          </span>
          <span className="text-slate-500">vs</span>
          <span
            className={cn(
              "font-mono",
              !isMigrant && !gap.leftBetter
                ? "text-emerald-400"
                : !isMigrant && gap.leftBetter
                ? "text-red-400"
                : "text-white"
            )}
          >
            {rightCode}: {gap.rightValue.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 rounded text-[10px] font-bold text-yellow-400">
        {gap.gapPercent.toFixed(0)}%
      </div>
    </motion.button>
  );
}

export default CriticalGapsBar;
