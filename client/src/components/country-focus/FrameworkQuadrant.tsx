/**
 * Framework Quadrant Component
 * 
 * Displays a single pillar with 4 strategic questions in horizontal layout.
 * Each tile shows the full question, real metric data points, and colored bars.
 * Compact design optimized for zero-scroll experience.
 * Each question tile is clickable for AI-powered deep analysis.
 */

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/utils";
import { PILLAR_DEFINITIONS, type PillarId, type StrategicQuestion } from "../../lib/strategicQuestions";
import type { Country } from "../../types/country";

// ============================================================================
// TYPES
// ============================================================================

interface PillarData {
  score: number | null;
  globalAvg: number;
  percentile: number | null;
  diffFromAvg: number | null;
}

interface FrameworkQuadrantProps {
  pillarId: PillarId;
  pillarData: PillarData | null;
  country: {
    iso_code: string;
    name: string;
  } | null;
  countryData: Country | null;
  globalStats: {
    totalCountries: number;
  } | null;
  onQuestionClick: (questionId: string) => void;
}

interface MetricIndicator {
  label: string;
  value: string;
  color?: string;
}

// ============================================================================
// METRIC MAPPING
// ============================================================================

/**
 * Maps each strategic question to 2-3 real data points from the Country object.
 * Returns formatted metric indicators for display.
 */
function getQuestionMetrics(questionId: string, countryData: Country | null): MetricIndicator[] {
  if (!countryData) return [];

  const gov = countryData.governance;
  const p1 = countryData.pillar_1_hazard;
  const p2 = countryData.pillar_2_vigilance;
  const p3 = countryData.pillar_3_restoration;

  const fmt = (v: number | null | undefined, unit: string, decimals = 1): string => {
    if (v === null || v === undefined) return "N/A";
    return `${v.toFixed(decimals)}${unit}`;
  };

  const bool = (v: boolean | null | undefined): string => {
    if (v === null || v === undefined) return "N/A";
    return v ? "Yes" : "No";
  };

  const boolColor = (v: boolean | null | undefined): string => {
    if (v === null || v === undefined) return "text-white/40";
    return v ? "text-emerald-400" : "text-red-400";
  };

  const numColor = (v: number | null | undefined, goodThreshold: number, invert = false): string => {
    if (v === null || v === undefined) return "text-white/40";
    const isGood = invert ? v < goodThreshold : v >= goodThreshold;
    return isGood ? "text-emerald-400" : "text-amber-400";
  };

  const mapping: Record<string, MetricIndicator[]> = {
    // === GOVERNANCE ===
    "legal-foundation": [
      { label: "ILO C155", value: bool(gov?.ilo_c155_status), color: boolColor(gov?.ilo_c155_status) },
      { label: "ILO C187", value: bool(gov?.ilo_c187_status), color: boolColor(gov?.ilo_c187_status) },
    ],
    "institutional-architecture": [
      { label: "Strategic Capacity", value: fmt(gov?.strategic_capacity_score, "/100", 0), color: numColor(gov?.strategic_capacity_score, 60) },
      { label: "Mental Health Policy", value: bool(gov?.mental_health_policy), color: boolColor(gov?.mental_health_policy) },
    ],
    "enforcement-capacity": [
      { label: "Inspector Density", value: fmt(gov?.inspector_density, "/10k"), color: numColor(gov?.inspector_density, 1.0) },
      { label: "ILO Target (1.0)", value: gov?.inspector_density != null ? `${((gov.inspector_density / 1.0) * 100).toFixed(0)}%` : "N/A", color: numColor(gov?.inspector_density, 1.0) },
    ],
    "strategic-planning": [
      { label: "Capacity Score", value: fmt(gov?.strategic_capacity_score, "/100", 0), color: numColor(gov?.strategic_capacity_score, 60) },
      { label: "ILO C187 (Framework)", value: bool(gov?.ilo_c187_status), color: boolColor(gov?.ilo_c187_status) },
    ],

    // === HAZARD CONTROL ===
    "exposure-standards": [
      { label: "Carcinogen Exp.", value: fmt(p1?.carcinogen_exposure_pct, "%"), color: numColor(p1?.carcinogen_exposure_pct, 10, true) },
      { label: "OEL Compliance", value: fmt(p1?.oel_compliance_pct, "%", 0), color: numColor(p1?.oel_compliance_pct, 80) },
    ],
    "risk-assessment": [
      { label: "Heat Stress Reg.", value: p1?.heat_stress_reg_type ?? "N/A", color: p1?.heat_stress_reg_type === "Strict" ? "text-emerald-400" : "text-amber-400" },
      { label: "NIHL Rate", value: fmt(p1?.noise_induced_hearing_loss_rate, "/100k"), color: numColor(p1?.noise_induced_hearing_loss_rate, 15, true) },
    ],
    "prevention-infrastructure": [
      { label: "Training Hours", value: fmt(p1?.safety_training_hours_avg, "h/yr", 0), color: numColor(p1?.safety_training_hours_avg, 15) },
      { label: "Control Maturity", value: fmt(p1?.control_maturity_score, "/100", 0), color: numColor(p1?.control_maturity_score, 60) },
    ],
    "safety-outcomes": [
      { label: "Fatal Rate", value: fmt(p1?.fatal_accident_rate, "/100k"), color: numColor(p1?.fatal_accident_rate, 2.0, true) },
      { label: "Carcinogen Exp.", value: fmt(p1?.carcinogen_exposure_pct, "%"), color: numColor(p1?.carcinogen_exposure_pct, 10, true) },
    ],

    // === VIGILANCE ===
    "surveillance-architecture": [
      { label: "System Type", value: p2?.surveillance_logic ?? "N/A", color: p2?.surveillance_logic === "Risk-Based" ? "text-emerald-400" : "text-cyan-400" },
      { label: "Reporting Rate", value: fmt(p2?.occupational_disease_reporting_rate, "%"), color: numColor(p2?.occupational_disease_reporting_rate, 60) },
    ],
    "detection-capacity": [
      { label: "Detection Rate", value: fmt(p2?.disease_detection_rate, "/100k"), color: numColor(p2?.disease_detection_rate, 40) },
      { label: "Lead Screening", value: fmt(p2?.lead_exposure_screening_rate, "/100k", 0), color: numColor(p2?.lead_exposure_screening_rate, 60) },
    ],
    "data-quality": [
      { label: "Disease Reporting", value: fmt(p2?.occupational_disease_reporting_rate, "%"), color: numColor(p2?.occupational_disease_reporting_rate, 60) },
      { label: "Surveillance", value: p2?.surveillance_logic ?? "N/A", color: p2?.surveillance_logic ? "text-cyan-400" : "text-white/40" },
    ],
    "vulnerable-populations": [
      { label: "Migrant Workers", value: fmt(p2?.migrant_worker_pct, "%", 0), color: numColor(p2?.migrant_worker_pct, 30, true) },
      { label: "Vulnerability Idx", value: fmt(p2?.vulnerability_index, "/100"), color: numColor(p2?.vulnerability_index, 20, true) },
    ],

    // === RESTORATION ===
    "payer-architecture": [
      { label: "Payer Type", value: p3?.payer_mechanism ?? "N/A", color: p3?.payer_mechanism === "No-Fault" ? "text-emerald-400" : "text-amber-400" },
      { label: "Reintegration Law", value: bool(p3?.reintegration_law), color: boolColor(p3?.reintegration_law) },
    ],
    "benefit-adequacy": [
      { label: "Rehab Access", value: fmt(p3?.rehab_access_score, "/100", 0), color: numColor(p3?.rehab_access_score, 50) },
      { label: "Absence Days", value: fmt(p3?.sickness_absence_days, "d/yr"), color: numColor(p3?.sickness_absence_days, 10, true) },
    ],
    "rehabilitation-chain": [
      { label: "Rehab Participation", value: fmt(p3?.rehab_participation_rate, "%", 0), color: numColor(p3?.rehab_participation_rate, 50) },
      { label: "Claim Settlement", value: fmt(p3?.avg_claim_settlement_days, " days", 0), color: numColor(p3?.avg_claim_settlement_days, 90, true) },
    ],
    "recovery-outcomes": [
      { label: "RTW Success", value: fmt(p3?.return_to_work_success_pct, "%", 0), color: numColor(p3?.return_to_work_success_pct, 60) },
      { label: "Rehab Access", value: fmt(p3?.rehab_access_score, "/100", 0), color: numColor(p3?.rehab_access_score, 50) },
    ],
  };

  return mapping[questionId] || [];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPositionStatus(percentile: number | null): { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof TrendingUp;
} {
  if (percentile === null) {
    return { label: "No Data", color: "text-white/40", bgColor: "bg-white/10", icon: Minus };
  }
  if (percentile >= 70) {
    return { label: "Leading", color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: TrendingUp };
  }
  if (percentile >= 40) {
    return { label: "Advancing", color: "text-amber-400", bgColor: "bg-amber-500/20", icon: Minus };
  }
  return { label: "Developing", color: "text-red-400", bgColor: "bg-red-500/20", icon: TrendingDown };
}

function getScoreColor(score: number | null): string {
  if (score === null) return "from-slate-500 to-slate-400";
  if (score >= 70) return "from-emerald-500 to-emerald-400";
  if (score >= 50) return "from-cyan-500 to-cyan-400";
  if (score >= 30) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

// ============================================================================
// COMPACT QUESTION TILE COMPONENT
// ============================================================================

interface QuestionTileProps {
  question: StrategicQuestion;
  index: number;
  pillarColor: string;
  pillarBgColor: string;
  pillarScore: number | null;
  metrics: MetricIndicator[];
  onClick: () => void;
}

function QuestionTile({ question, index, pillarColor, pillarBgColor, pillarScore, metrics, onClick }: QuestionTileProps) {
  // Use the pillar score as representative score for all tiles in that quadrant
  const displayScore = pillarScore;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-0 text-left p-2.5 rounded-lg border transition-all group cursor-pointer flex flex-col",
        "bg-slate-800/30 border-white/5",
        "hover:bg-slate-800/60 hover:border-white/20 hover:shadow-lg hover:shadow-black/20"
      )}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Header: Q number + Status */}
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <div className={cn(
          "w-5 h-5 rounded flex items-center justify-center font-bold text-[9px]",
          pillarBgColor, pillarColor
        )}>
          Q{index + 1}
        </div>
        <div className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium",
          getPositionStatus(displayScore != null ? (displayScore >= 70 ? 75 : displayScore >= 40 ? 50 : 20) : null).bgColor,
          getPositionStatus(displayScore != null ? (displayScore >= 70 ? 75 : displayScore >= 40 ? 50 : 20) : null).color
        )}>
          {(() => {
            const s = getPositionStatus(displayScore != null ? (displayScore >= 70 ? 75 : displayScore >= 40 ? 50 : 20) : null);
            const Icon = s.icon;
            return <><Icon className="w-2.5 h-2.5" /><span>{s.label}</span></>;
          })()}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-[11px] font-semibold text-white mb-1 leading-tight flex-shrink-0">
        {question.title}
      </h4>

      {/* Full Question Text */}
      <p className="text-[9.5px] leading-[1.35] text-white/45 mb-auto flex-shrink-0">
        {question.question}
      </p>

      {/* Key Metrics */}
      {metrics.length > 0 && (
        <div className="mt-1.5 space-y-0.5 flex-shrink-0">
          {metrics.map((metric, i) => (
            <div key={i} className="flex items-center justify-between text-[9px]">
              <span className="text-white/35 truncate mr-1">{metric.label}</span>
              <span className={cn("font-semibold whitespace-nowrap", metric.color || "text-white/70")}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Position Bar */}
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mt-2 flex-shrink-0">
        {/* Global average marker */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-white/30 z-10"
          style={{ left: "50%" }}
        />
        {/* Score bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayScore ?? 0}%` }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
            getScoreColor(displayScore)
          )}
        />
      </div>

      {/* Score Footer */}
      <div className="flex items-center justify-between text-[8.5px] mt-1 flex-shrink-0">
        <span className="text-white/80 font-medium">
          {displayScore != null ? `${displayScore.toFixed(0)}%` : "N/A"}
        </span>
        <span className="text-white/35">
          vs avg
        </span>
      </div>
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FrameworkQuadrant({
  pillarId,
  pillarData,
  country,
  countryData,
  globalStats,
  onQuestionClick,
}: FrameworkQuadrantProps) {
  const pillarDef = PILLAR_DEFINITIONS[pillarId];
  const Icon = pillarDef.icon;
  const status = getPositionStatus(pillarData?.percentile ?? null);
  const StatusIcon = status.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className={cn(
        "flex-shrink-0 px-3 py-2 border-b border-white/5",
        pillarDef.bgColor
      )}>
        <div className="flex items-center justify-between">
          {/* Left: Icon + Name */}
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={cn("p-1.5 rounded-lg border", pillarDef.bgColor, pillarDef.borderColor)}
            >
              <Icon className={cn("w-4 h-4", pillarDef.color)} />
            </motion.div>
            <div>
              <h3 className="text-sm font-bold text-white">{pillarDef.name}</h3>
              <p className="text-[9px] text-white/40">{pillarDef.subtitle}</p>
            </div>
          </div>

          {/* Right: Score + Status */}
          <div className="flex items-center gap-2">
            {pillarData?.score !== null && pillarData?.score !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={cn("text-lg font-bold", pillarDef.color)}>
                  {pillarData.score.toFixed(0)}%
                </span>
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium",
                  status.bgColor, status.color
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {pillarData.diffFromAvg !== null && (
                    <span>{pillarData.diffFromAvg > 0 ? "+" : ""}{pillarData.diffFromAvg.toFixed(0)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Position Bar */}
        <div className="mt-2">
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            {/* Global average marker */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-white/40 z-10"
              style={{ left: `${pillarData?.globalAvg || 50}%` }}
            />
            {/* Score bar */}
            {pillarData?.score !== null && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pillarData.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                  pillarDef.color.replace("text-", "from-").replace("-400", "-500"),
                  pillarDef.color.replace("text-", "to-").replace("-400", "-400")
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Questions - Horizontal Layout */}
      <div className="flex-1 p-2 overflow-hidden">
        <div className="h-full flex gap-2">
          {pillarDef.questions.map((question, index) => (
            <QuestionTile
              key={question.id}
              question={question}
              index={index}
              pillarColor={pillarDef.color}
              pillarBgColor={pillarDef.bgColor}
              pillarScore={pillarData?.score ?? null}
              metrics={getQuestionMetrics(question.id, countryData)}
              onClick={() => onQuestionClick(question.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FrameworkQuadrant;
