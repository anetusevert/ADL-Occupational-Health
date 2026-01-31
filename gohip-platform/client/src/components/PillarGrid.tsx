/**
 * GOHIP Platform - PillarGrid Component
 * Grid layout displaying the 4 Framework Layers (Governance + 3 Pillars)
 */

import {
  Shield,
  AlertTriangle,
  Eye,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";
import { cn, getMaturityStage, formatNumber, formatBoolean } from "../lib/utils";
import type { Country } from "../types/country";

interface PillarGridProps {
  country: Country;
  className?: string;
}

export function PillarGrid({ country, className }: PillarGridProps) {
  return (
    <div className={cn("grid md:grid-cols-2 gap-6", className)}>
      {/* Governance Layer */}
      <GovernanceCard governance={country.governance} />

      {/* Pillar 1: Hazard Control */}
      <HazardControlCard pillar={country.pillar_1_hazard} />

      {/* Pillar 2: Health Vigilance */}
      <HealthVigilanceCard pillar={country.pillar_2_vigilance} />

      {/* Pillar 3: Restoration */}
      <RestorationCard pillar={country.pillar_3_restoration} />
    </div>
  );
}

// ============================================================================
// GOVERNANCE LAYER CARD
// ============================================================================

interface GovernanceCardProps {
  governance: Country["governance"];
}

function GovernanceCard({ governance }: GovernanceCardProps) {
  const maturity = getMaturityStage(governance?.strategic_capacity_score !== undefined ? governance.strategic_capacity_score : null);

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm p-6 transition-all duration-300 hover:border-purple-500/50",
        "bg-slate-800/50 border-slate-700/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Governance Layer</h3>
          <p className="text-xs text-slate-400">Strategic Capacity & Policy</p>
        </div>
        {governance?.strategic_capacity_score !== null && (
          <div className={cn("ml-auto px-3 py-1 rounded-full text-sm font-medium", maturity.bgColor, maturity.color)}>
            {formatNumber(governance?.strategic_capacity_score, 0)}%
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <MetricRow
          label="ILO C187 (Promotional Framework)"
          value={governance?.ilo_c187_status}
          type="boolean"
        />
        <MetricRow
          label="ILO C155 (OSH Convention)"
          value={governance?.ilo_c155_status}
          type="boolean"
        />
        <MetricRow
          label="Inspector Density"
          value={governance?.inspector_density}
          suffix="per 10,000 workers"
        />
        <MetricRow
          label="Mental Health Policy"
          value={governance?.mental_health_policy}
          type="boolean"
        />
      </div>
    </div>
  );
}

// ============================================================================
// PILLAR 1: HAZARD CONTROL CARD
// ============================================================================

interface HazardControlCardProps {
  pillar: Country["pillar_1_hazard"];
}

function HazardControlCard({ pillar }: HazardControlCardProps) {
  const maturity = getMaturityStage(pillar?.control_maturity_score !== undefined ? pillar.control_maturity_score : null);

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm p-6 transition-all duration-300 hover:border-red-500/50",
        "bg-slate-800/50 border-slate-700/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Pillar 1: Hazard Control</h3>
          <p className="text-xs text-slate-400">Occupational Risk Management</p>
        </div>
        {pillar?.control_maturity_score !== null && (
          <div className={cn("ml-auto px-3 py-1 rounded-full text-sm font-medium", maturity.bgColor, maturity.color)}>
            {formatNumber(pillar?.control_maturity_score, 0)}%
          </div>
        )}
      </div>

      {/* Metrics - DENSIFIED GRID */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetricRow
          label="Fatal Accident Rate"
          value={pillar?.fatal_accident_rate}
          suffix="per 100k"
          highlight={pillar?.fatal_accident_rate !== null && pillar?.fatal_accident_rate !== undefined && pillar.fatal_accident_rate > 2.0}
        />
        <MetricRow
          label="Carcinogen Exposure"
          value={pillar?.carcinogen_exposure_pct}
          suffix="%"
        />
        <MetricRow
          label="Heat Stress Reg."
          value={pillar?.heat_stress_reg_type}
          type="enum"
        />
        <MetricRow
          label="OEL Compliance"
          value={pillar?.oel_compliance_pct}
          suffix="%"
          highlight={pillar?.oel_compliance_pct !== null && pillar?.oel_compliance_pct !== undefined && pillar.oel_compliance_pct < 50}
        />
        <MetricRow
          label="NIHL Rate"
          value={pillar?.noise_induced_hearing_loss_rate}
          suffix="per 100k"
        />
        <MetricRow
          label="Training Hours"
          value={pillar?.safety_training_hours_avg}
          suffix="hrs/yr"
        />
      </div>
    </div>
  );
}

// ============================================================================
// PILLAR 2: HEALTH VIGILANCE CARD
// ============================================================================

interface HealthVigilanceCardProps {
  pillar: Country["pillar_2_vigilance"];
}

function HealthVigilanceCard({ pillar }: HealthVigilanceCardProps) {
  const vigilanceScore = pillar?.disease_detection_rate !== undefined ? pillar.disease_detection_rate : null;
  // Convert detection rate to a 0-100 score for maturity
  const maturity = getMaturityStage(vigilanceScore);

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm p-6 transition-all duration-300 hover:border-cyan-500/50",
        "bg-slate-800/50 border-slate-700/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-lg flex items-center justify-center">
          <Eye className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Pillar 2: Health Vigilance</h3>
          <p className="text-xs text-slate-400">Surveillance & Detection</p>
        </div>
        {pillar?.disease_detection_rate !== null && (
          <div className={cn("ml-auto px-3 py-1 rounded-full text-sm font-medium", maturity.bgColor, maturity.color)}>
            {formatNumber(pillar?.disease_detection_rate, 0)}%
          </div>
        )}
      </div>

      {/* Metrics - DENSIFIED GRID */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetricRow
          label="Surveillance Logic"
          value={pillar?.surveillance_logic}
          type="enum"
        />
        <MetricRow
          label="Disease Detection"
          value={pillar?.disease_detection_rate}
          suffix="%"
        />
        <MetricRow
          label="Vulnerability Index"
          value={pillar?.vulnerability_index}
          suffix="/100"
          highlight={pillar?.vulnerability_index !== null && pillar?.vulnerability_index !== undefined && pillar.vulnerability_index > 50}
        />
        <MetricRow
          label="Migrant Workforce"
          value={pillar?.migrant_worker_pct}
          suffix="%"
          highlight={pillar?.migrant_worker_pct !== null && pillar?.migrant_worker_pct !== undefined && pillar.migrant_worker_pct > 50}
        />
        <MetricRow
          label="Lead Screening"
          value={pillar?.lead_exposure_screening_rate}
          suffix="%"
        />
        <MetricRow
          label="Disease Reporting"
          value={pillar?.occupational_disease_reporting_rate}
          suffix="%"
        />
      </div>
    </div>
  );
}

// ============================================================================
// PILLAR 3: RESTORATION CARD
// ============================================================================

interface RestorationCardProps {
  pillar: Country["pillar_3_restoration"];
}

function RestorationCard({ pillar }: RestorationCardProps) {
  const maturity = getMaturityStage(pillar?.rehab_access_score !== undefined ? pillar.rehab_access_score : null);

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm p-6 transition-all duration-300 hover:border-emerald-500/50",
        "bg-slate-800/50 border-slate-700/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Pillar 3: Restoration</h3>
          <p className="text-xs text-slate-400">Compensation & Rehabilitation</p>
        </div>
        {pillar?.rehab_access_score !== null && (
          <div className={cn("ml-auto px-3 py-1 rounded-full text-sm font-medium", maturity.bgColor, maturity.color)}>
            {formatNumber(pillar?.rehab_access_score, 0)}%
          </div>
        )}
      </div>

      {/* Metrics - DENSIFIED GRID */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetricRow
          label="Payer Mechanism"
          value={pillar?.payer_mechanism}
          type="enum"
        />
        <MetricRow
          label="Reintegration Law"
          value={pillar?.reintegration_law}
          type="boolean"
        />
        <MetricRow
          label="Sickness Absence"
          value={pillar?.sickness_absence_days}
          suffix="days/yr"
        />
        <MetricRow
          label="Rehab Access"
          value={pillar?.rehab_access_score}
          suffix="/100"
        />
        <MetricRow
          label="RTW Success"
          value={pillar?.return_to_work_success_pct}
          suffix="%"
          highlight={pillar?.return_to_work_success_pct !== null && pillar?.return_to_work_success_pct !== undefined && pillar.return_to_work_success_pct < 50}
        />
        <MetricRow
          label="Claim Settlement"
          value={pillar?.avg_claim_settlement_days}
          suffix="days"
          highlight={pillar?.avg_claim_settlement_days !== null && pillar?.avg_claim_settlement_days !== undefined && pillar.avg_claim_settlement_days > 90}
        />
        <MetricRow
          label="Rehab Participation"
          value={pillar?.rehab_participation_rate}
          suffix="%"
        />
      </div>
    </div>
  );
}

// ============================================================================
// METRIC ROW COMPONENT
// ============================================================================

interface MetricRowProps {
  label: string;
  value: string | number | boolean | null | undefined;
  suffix?: string;
  type?: "number" | "boolean" | "enum";
  highlight?: boolean;
}

function MetricRow({ label, value, suffix, type = "number", highlight }: MetricRowProps) {
  let displayValue: React.ReactNode;
  let icon: React.ReactNode = null;

  if (value === null || value === undefined) {
    displayValue = "N/A";
    icon = <Minus className="w-3 h-3 text-slate-500" />;
  } else if (type === "boolean") {
    displayValue = formatBoolean(value as boolean);
    icon = value ? (
      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
    ) : (
      <XCircle className="w-3 h-3 text-red-400" />
    );
  } else if (type === "enum") {
    displayValue = String(value);
  } else {
    displayValue = typeof value === "number" ? formatNumber(value) : String(value);
  }

  return (
    <div className="flex flex-col py-1.5 border-b border-slate-700/30 last:border-0">
      <span className="text-xs text-slate-500 truncate">{label}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        {icon}
        <span
          className={cn(
            "text-sm font-medium truncate",
            highlight ? "text-red-400" : "text-white",
            value === null || value === undefined ? "text-slate-500" : ""
          )}
        >
          {displayValue}
          {suffix && value !== null && value !== undefined && (
            <span className="text-slate-500 text-xs ml-1">{suffix}</span>
          )}
        </span>
      </div>
    </div>
  );
}

export default PillarGrid;
