/**
 * Arthur D. Little - Global Health Platform
 * Data Coverage Calculation Utility
 * 
 * Shared function to calculate data coverage score consistently
 * across the application (Country Profile, Leaderboard, etc.)
 */

import type { Country } from "../types/country";

/**
 * Fields used to calculate data coverage per pillar
 */
const GOVERNANCE_FIELDS = [
  'ilo_c187_status', 'ilo_c155_status', 'inspector_density',
  'mental_health_policy', 'strategic_capacity_score'
];

const PILLAR1_FIELDS = [
  'fatal_accident_rate', 'carcinogen_exposure_pct', 'heat_stress_reg_type',
  'oel_compliance_pct', 'noise_induced_hearing_loss_rate', 'safety_training_hours_avg',
  'control_maturity_score'
];

const PILLAR2_FIELDS = [
  'surveillance_logic', 'disease_detection_rate', 'vulnerability_index',
  'migrant_worker_pct', 'lead_exposure_screening_rate', 'occupational_disease_reporting_rate'
];

const PILLAR3_FIELDS = [
  'payer_mechanism', 'reintegration_law', 'sickness_absence_days', 'rehab_access_score',
  'return_to_work_success_pct', 'avg_claim_settlement_days', 'rehab_participation_rate'
];

/**
 * Total number of tracked fields
 */
export const TOTAL_COVERAGE_FIELDS = 
  GOVERNANCE_FIELDS.length + 
  PILLAR1_FIELDS.length + 
  PILLAR2_FIELDS.length + 
  PILLAR3_FIELDS.length;

/**
 * Count populated fields in an object
 */
function countPopulatedFields(obj: Record<string, unknown> | null | undefined, fields: string[]): number {
  if (!obj) return 0;
  return fields.filter(f => obj[f] !== null && obj[f] !== undefined).length;
}

/**
 * Calculate data coverage score for a country (0-100%)
 * 
 * This function counts how many of the expected data fields
 * are populated with actual values.
 */
export function calculateDataCoverage(country: Country | null | undefined): number {
  if (!country) return 0;

  let populatedFields = 0;

  populatedFields += countPopulatedFields(
    country.governance as Record<string, unknown> | null, 
    GOVERNANCE_FIELDS
  );
  populatedFields += countPopulatedFields(
    country.pillar_1_hazard as Record<string, unknown> | null, 
    PILLAR1_FIELDS
  );
  populatedFields += countPopulatedFields(
    country.pillar_2_vigilance as Record<string, unknown> | null, 
    PILLAR2_FIELDS
  );
  populatedFields += countPopulatedFields(
    country.pillar_3_restoration as Record<string, unknown> | null, 
    PILLAR3_FIELDS
  );

  return Math.round((populatedFields / TOTAL_COVERAGE_FIELDS) * 100);
}

/**
 * Get confidence level details based on coverage percentage
 */
export function getConfidenceLevel(coverage: number): {
  level: "high" | "medium" | "low" | "unknown";
  label: string;
  color: string;
  bgColor: string;
} {
  if (coverage >= 80) {
    return {
      level: "high",
      label: "High Confidence",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    };
  } else if (coverage >= 50) {
    return {
      level: "medium",
      label: "Medium",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    };
  } else if (coverage > 0) {
    return {
      level: "low",
      label: "Low",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    };
  } else {
    return {
      level: "unknown",
      label: "Unknown",
      color: "text-slate-400",
      bgColor: "bg-slate-500/10",
    };
  }
}
