/**
 * Arthur D. Little - Global Health Platform
 * Pillar Detail Modal Component
 * 
 * Full-screen modal for deep-dive into a specific pillar's metrics
 * Uses Framework-style animations (matching StatCardModal)
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  AlertOctagon,
  Eye,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { cn, formatNumber, getApiBaseUrl, getCountryFlag } from "../../lib/utils";
import type { Country } from "../../types/country";
import type { LucideIcon } from "lucide-react";
import type { PillarId } from "./CompactPillarTile";

// ============================================================================
// TYPES
// ============================================================================

interface MetricRow {
  id: string;
  metric: string;
  leftValue: string | number | boolean | null | undefined;
  rightValue: string | number | boolean | null | undefined;
  lowerIsBetter?: boolean;
  suffix?: string;
  isHighlightMetric?: boolean;
}

interface PillarMetricConfig {
  id: PillarId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  getMetrics: (left: Country, right: Country) => MetricRow[];
}

// ============================================================================
// PILLAR METRIC CONFIGURATIONS
// ============================================================================

const PILLAR_METRIC_CONFIGS: Record<PillarId, PillarMetricConfig> = {
  governance: {
    id: "governance",
    title: "Governance Layer",
    subtitle: "Strategic Capacity & Policy",
    icon: Shield,
    color: "purple",
    getMetrics: (left, right) => [
      { id: "ilo_c187", metric: "ILO C187 Ratified", leftValue: left.governance?.ilo_c187_status, rightValue: right.governance?.ilo_c187_status },
      { id: "ilo_c155", metric: "ILO C155 Ratified", leftValue: left.governance?.ilo_c155_status, rightValue: right.governance?.ilo_c155_status },
      { id: "inspector_density", metric: "Inspector Density", leftValue: left.governance?.inspector_density, rightValue: right.governance?.inspector_density, suffix: "/10k" },
      { id: "mental_health", metric: "Mental Health Policy", leftValue: left.governance?.mental_health_policy, rightValue: right.governance?.mental_health_policy },
      { id: "strategic_capacity", metric: "Strategic Capacity", leftValue: left.governance?.strategic_capacity_score, rightValue: right.governance?.strategic_capacity_score, suffix: "%" },
    ],
  },
  pillar1: {
    id: "pillar1",
    title: "Pillar 1: Hazard Control",
    subtitle: "Occupational Risk Management",
    icon: AlertOctagon,
    color: "red",
    getMetrics: (left, right) => [
      { id: "fatal_rate", metric: "Fatal Accident Rate", leftValue: left.pillar_1_hazard?.fatal_accident_rate, rightValue: right.pillar_1_hazard?.fatal_accident_rate, lowerIsBetter: true, suffix: "/100k", isHighlightMetric: true },
      { id: "carcinogen", metric: "Carcinogen Exposure", leftValue: left.pillar_1_hazard?.carcinogen_exposure_pct, rightValue: right.pillar_1_hazard?.carcinogen_exposure_pct, lowerIsBetter: true, suffix: "%" },
      { id: "heat_stress", metric: "Heat Stress Regulation", leftValue: left.pillar_1_hazard?.heat_stress_reg_type, rightValue: right.pillar_1_hazard?.heat_stress_reg_type },
      { id: "oel_compliance", metric: "OEL Compliance", leftValue: left.pillar_1_hazard?.oel_compliance_pct, rightValue: right.pillar_1_hazard?.oel_compliance_pct, suffix: "%", isHighlightMetric: true },
      { id: "nihl_rate", metric: "NIHL Rate", leftValue: left.pillar_1_hazard?.noise_induced_hearing_loss_rate, rightValue: right.pillar_1_hazard?.noise_induced_hearing_loss_rate, lowerIsBetter: true, suffix: "/100k" },
      { id: "safety_training", metric: "Safety Training", leftValue: left.pillar_1_hazard?.safety_training_hours_avg, rightValue: right.pillar_1_hazard?.safety_training_hours_avg, suffix: "hrs/yr" },
      { id: "control_maturity", metric: "Control Maturity", leftValue: left.pillar_1_hazard?.control_maturity_score, rightValue: right.pillar_1_hazard?.control_maturity_score, suffix: "%" },
    ],
  },
  pillar2: {
    id: "pillar2",
    title: "Pillar 2: Health Vigilance",
    subtitle: "Surveillance & Detection",
    icon: Eye,
    color: "cyan",
    getMetrics: (left, right) => [
      { id: "surveillance", metric: "Surveillance Logic", leftValue: left.pillar_2_vigilance?.surveillance_logic, rightValue: right.pillar_2_vigilance?.surveillance_logic },
      { id: "disease_detection", metric: "Disease Detection", leftValue: left.pillar_2_vigilance?.disease_detection_rate, rightValue: right.pillar_2_vigilance?.disease_detection_rate, suffix: "%" },
      { id: "vulnerability", metric: "Vulnerability Index", leftValue: left.pillar_2_vigilance?.vulnerability_index, rightValue: right.pillar_2_vigilance?.vulnerability_index, lowerIsBetter: true, suffix: "/100" },
      { id: "migrant_worker", metric: "Migrant Workforce", leftValue: left.pillar_2_vigilance?.migrant_worker_pct, rightValue: right.pillar_2_vigilance?.migrant_worker_pct, suffix: "%", isHighlightMetric: true },
      { id: "lead_screening", metric: "Lead Screening Rate", leftValue: left.pillar_2_vigilance?.lead_exposure_screening_rate, rightValue: right.pillar_2_vigilance?.lead_exposure_screening_rate, suffix: "%" },
      { id: "disease_reporting", metric: "Disease Reporting", leftValue: left.pillar_2_vigilance?.occupational_disease_reporting_rate, rightValue: right.pillar_2_vigilance?.occupational_disease_reporting_rate, suffix: "%" },
    ],
  },
  pillar3: {
    id: "pillar3",
    title: "Pillar 3: Restoration",
    subtitle: "Compensation & Rehabilitation",
    icon: HeartPulse,
    color: "emerald",
    getMetrics: (left, right) => [
      { id: "payer", metric: "Payer Mechanism", leftValue: left.pillar_3_restoration?.payer_mechanism, rightValue: right.pillar_3_restoration?.payer_mechanism },
      { id: "reintegration", metric: "Reintegration Law", leftValue: left.pillar_3_restoration?.reintegration_law, rightValue: right.pillar_3_restoration?.reintegration_law },
      { id: "sickness_absence", metric: "Sickness Absence", leftValue: left.pillar_3_restoration?.sickness_absence_days, rightValue: right.pillar_3_restoration?.sickness_absence_days, suffix: "days/yr" },
      { id: "rehab_access", metric: "Rehab Access Score", leftValue: left.pillar_3_restoration?.rehab_access_score, rightValue: right.pillar_3_restoration?.rehab_access_score, suffix: "/100" },
      { id: "rtw_success", metric: "RTW Success Rate", leftValue: left.pillar_3_restoration?.return_to_work_success_pct, rightValue: right.pillar_3_restoration?.return_to_work_success_pct, suffix: "%", isHighlightMetric: true },
      { id: "claim_settlement", metric: "Claim Settlement", leftValue: left.pillar_3_restoration?.avg_claim_settlement_days, rightValue: right.pillar_3_restoration?.avg_claim_settlement_days, lowerIsBetter: true, suffix: "days" },
      { id: "rehab_participation", metric: "Rehab Participation", leftValue: left.pillar_3_restoration?.rehab_participation_rate, rightValue: right.pillar_3_restoration?.rehab_participation_rate, suffix: "%" },
    ],
  },
};

// ============================================================================
// PROPS
// ============================================================================

interface PillarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillarId: PillarId | null;
  leftCountry: Country;
  rightCountry: Country;
  onMetricClick: (
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

export function PillarDetailModal({
  isOpen,
  onClose,
  pillarId,
  leftCountry,
  rightCountry,
  onMetricClick,
}: PillarDetailModalProps) {
  if (!pillarId) return null;

  const config = PILLAR_METRIC_CONFIGS[pillarId];
  if (!config) return null;

  const Icon = config.icon;
  const metrics = config.getMetrics(leftCountry, rightCountry);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="fixed inset-2 sm:inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] lg:w-[800px] max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] md:max-h-[80vh] bg-slate-900 border border-slate-700/50 rounded-xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div
              className={cn(
                "relative px-6 py-5 border-b border-slate-700/50",
                `bg-gradient-to-r from-${config.color}-500/20 to-transparent`
              )}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.2,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    `bg-${config.color}-500/20 border border-${config.color}-500/30`
                  )}
                >
                  <Icon className={cn("w-7 h-7", `text-${config.color}-400`)} />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white">{config.title}</h2>
                  <p className="text-sm text-slate-400">{config.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Country Headers */}
            <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/30">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm font-medium text-slate-500">Metric</div>
                <CountryHeader country={leftCountry} />
                <CountryHeader country={rightCountry} />
              </div>
            </div>

            {/* Metrics Table */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <div className="space-y-1">
                {metrics.map((row, index) => (
                  <motion.div
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.03, duration: 0.3 }}
                  >
                    <MetricTableRow
                      row={row}
                      pillarName={config.title}
                      pillarColor={config.color}
                      onMetricClick={onMetricClick}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 bg-slate-800/30 border-t border-slate-700/30">
              <p className="text-xs text-slate-500 text-center">
                Click any metric row for detailed explanation and benchmarks
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// COUNTRY HEADER
// ============================================================================

function CountryHeader({ country }: { country: Country }) {
  const flagUrl = country.flag_url
    ? `${getApiBaseUrl()}${country.flag_url}`
    : null;

  return (
    <div className="flex items-center justify-center gap-2">
      {flagUrl ? (
        <img
          src={flagUrl}
          alt={country.name}
          className="w-6 h-4 object-cover rounded shadow-sm"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      ) : (
        <span className="text-lg">{getCountryFlag(country.iso_code)}</span>
      )}
      <span className="text-sm font-medium text-white">{country.iso_code}</span>
    </div>
  );
}

// ============================================================================
// METRIC TABLE ROW
// ============================================================================

interface MetricTableRowProps {
  row: MetricRow;
  pillarName: string;
  pillarColor: string;
  onMetricClick: (
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

function MetricTableRow({
  row,
  pillarName,
  pillarColor,
  onMetricClick,
}: MetricTableRowProps) {
  // Determine winner
  let leftWins = false;
  let rightWins = false;
  let isCriticalGap = false;

  if (typeof row.leftValue === "number" && typeof row.rightValue === "number") {
    if (row.lowerIsBetter) {
      leftWins = row.leftValue < row.rightValue;
      rightWins = row.rightValue < row.leftValue;
    } else {
      leftWins = row.leftValue > row.rightValue;
      rightWins = row.rightValue > row.leftValue;
    }

    // Calculate gap
    const max = Math.max(row.leftValue, row.rightValue);
    const min = Math.min(row.leftValue, row.rightValue);
    if (min > 0) {
      const gapRatio = max / min;
      isCriticalGap = gapRatio > 2.0;
    } else if (max > 0 && min === 0) {
      isCriticalGap = true;
    }
  } else if (typeof row.leftValue === "boolean" && typeof row.rightValue === "boolean") {
    leftWins = row.leftValue && !row.rightValue;
    rightWins = row.rightValue && !row.leftValue;
  }

  const isMigrantMetric = row.id === "migrant_worker";

  const formatValue = (val: string | number | boolean | null | undefined): React.ReactNode => {
    if (val === null || val === undefined) return <span className="text-slate-500">N/A</span>;
    if (typeof val === "boolean") {
      return val ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 mx-auto" />
      );
    }
    if (typeof val === "number") {
      return (
        <span>
          {formatNumber(val)}
          {row.suffix && <span className="text-slate-500 text-xs ml-0.5">{row.suffix}</span>}
        </span>
      );
    }
    return <span>{val}</span>;
  };

  const handleClick = () => {
    onMetricClick(
      row.id,
      row.metric,
      row.leftValue,
      row.rightValue,
      row.suffix || "",
      row.lowerIsBetter || false,
      pillarName,
      pillarColor
    );
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "grid grid-cols-3 gap-4 py-3 px-2 rounded-lg cursor-pointer transition-colors",
        "hover:bg-slate-800/50",
        isCriticalGap && row.isHighlightMetric && "bg-red-500/10"
      )}
    >
      {/* Metric Name */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">{row.metric}</span>
        {isCriticalGap && row.isHighlightMetric && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/30 rounded text-[10px] font-semibold text-red-400">
            <Zap className="w-2.5 h-2.5" />
            GAP
          </span>
        )}
      </div>

      {/* Left Value */}
      <div
        className={cn(
          "text-center text-sm font-medium flex items-center justify-center gap-1",
          leftWins && !isMigrantMetric && "text-emerald-400",
          rightWins && !isMigrantMetric && "text-red-400",
          !leftWins && !rightWins && "text-white"
        )}
      >
        {formatValue(row.leftValue)}
        {leftWins && !isMigrantMetric && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        {rightWins && !isMigrantMetric && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>

      {/* Right Value */}
      <div
        className={cn(
          "text-center text-sm font-medium flex items-center justify-center gap-1",
          rightWins && !isMigrantMetric && "text-emerald-400",
          leftWins && !isMigrantMetric && "text-red-400",
          !leftWins && !rightWins && "text-white"
        )}
      >
        {formatValue(row.rightValue)}
        {rightWins && !isMigrantMetric && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        {leftWins && !isMigrantMetric && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>
    </div>
  );
}

export default PillarDetailModal;
