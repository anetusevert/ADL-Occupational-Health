/**
 * GOHIP Platform - TypeScript Type Definitions
 * ADL Occupational Health Framework v2.0
 * 
 * These types match the backend Pydantic schemas for type-safe API communication.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type HeatStressRegulationType = "Strict" | "Advisory" | "None";
export type SurveillanceLogicType = "Risk-Based" | "Mandatory" | "None";
export type PayerMechanismType = "No-Fault" | "Litigation";

// ============================================================================
// GOVERNANCE LAYER
// ============================================================================

export interface GovernanceLayer {
  ilo_c187_status: boolean | null;
  ilo_c155_status: boolean | null;
  inspector_density: number | null;
  mental_health_policy: boolean | null;
  strategic_capacity_score: number | null;
  source_urls: Record<string, string> | null;
}

// ============================================================================
// PILLAR 1: HAZARD CONTROL
// ============================================================================

export interface Pillar1Hazard {
  fatal_accident_rate: number | null;
  carcinogen_exposure_pct: number | null;
  heat_stress_reg_type: HeatStressRegulationType | null;
  // === NEW DENSIFIED METRICS ===
  oel_compliance_pct: number | null;
  noise_induced_hearing_loss_rate: number | null;
  safety_training_hours_avg: number | null;
  control_maturity_score: number | null;
  source_urls: Record<string, string> | null;
}

// ============================================================================
// PILLAR 2: HEALTH VIGILANCE
// ============================================================================

export interface Pillar2Vigilance {
  surveillance_logic: SurveillanceLogicType | null;
  disease_detection_rate: number | null;
  vulnerability_index: number | null;
  // === NEW DENSIFIED METRICS ===
  migrant_worker_pct: number | null;
  lead_exposure_screening_rate: number | null;
  occupational_disease_reporting_rate: number | null;
  source_urls: Record<string, string> | null;
}

// ============================================================================
// PILLAR 3: RESTORATION
// ============================================================================

export interface Pillar3Restoration {
  payer_mechanism: PayerMechanismType | null;
  reintegration_law: boolean | null;
  sickness_absence_days: number | null;
  rehab_access_score: number | null;
  // === NEW DENSIFIED METRICS ===
  return_to_work_success_pct: number | null;
  avg_claim_settlement_days: number | null;
  rehab_participation_rate: number | null;
  source_urls: Record<string, string> | null;
}

// ============================================================================
// COUNTRY (Complete Response with Nested Layers)
// ============================================================================

export interface Country {
  iso_code: string;
  name: string;
  maturity_score: number | null;
  strategic_summary_text?: string | null;
  data_coverage_score?: number | null;
  flag_url?: string | null;
  created_at: string;
  updated_at: string | null;
  governance: GovernanceLayer | null;
  pillar_1_hazard: Pillar1Hazard | null;
  pillar_2_vigilance: Pillar2Vigilance | null;
  pillar_3_restoration: Pillar3Restoration | null;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface CountryListItem {
  iso_code: string;
  name: string;
  maturity_score: number | null;
  flag_url?: string | null;
  has_assessment: boolean;
}

/**
 * Response from GET /api/v1/countries/comparison/all
 */
export interface ComparisonCountriesResponse {
  total: number;
  countries: Country[];
}

export interface CountryListResponse {
  total: number;
  countries: CountryListItem[];
}

export interface AssessmentResponse {
  success: boolean;
  iso_code: string;
  country_name: string | null;
  assessment: string | null;
  source: "openai" | "mock" | null;
  error: string | null;
}

// ============================================================================
// MAP DATA - Framework-Aligned (Governance + 3 Pillars + Maturity)
// ============================================================================

export interface MapCountryData {
  iso_code: string;
  name: string;
  // ADL OHI Score (1.0-4.0 scale)
  maturity_score: number | null;
  // Governance Index (0-100)
  governance_score: number | null;
  // Pillar 1: Hazard Control Index (0-100)
  pillar1_score: number | null;
  // Pillar 2: Health Vigilance Index (0-100)
  pillar2_score: number | null;
  // Pillar 3: Restoration Index (0-100)
  pillar3_score: number | null;
  flag_url?: string | null;
}

// Framework-Aligned Map Metrics
export type MapMetric = 
  | "maturity_score"      // ADL OHI Score (1-4)
  | "governance_score"    // Governance Index (0-100)
  | "pillar1_score"       // Hazard Control (0-100)
  | "pillar2_score"       // Health Vigilance (0-100)
  | "pillar3_score";      // Restoration (0-100)

export interface MapMetricConfig {
  key: MapMetric;
  label: string;
  unit: string;
  ranges: {
    value: number;
    color: string;
    label: string;
  }[];
  higherIsBetter: boolean;
}

// ============================================================================
// GEOJSON METADATA (Phase 20.2 - Optimized for Global Map with ALL metrics)
// ============================================================================

/**
 * Visual status classification for map rendering.
 * Matches backend CountryStatus enum.
 * Derived from maturity_score (1.0-4.0 scale).
 */
export type CountryStatus = 
  | "resilient"    // Maturity >= 3.5 - Green
  | "good"         // Maturity 3.0-3.4 - Lime
  | "concerning"   // Maturity 2.0-2.9 - Orange
  | "critical"     // Maturity < 2.0 - Red
  | "data_gap"     // No maturity_score - Amber (Investigation Needed)
  | "ghost";       // Not in DB - Dark Slate

/**
 * Lightweight country metadata for GeoJSON feature enrichment.
 * Framework-Aligned: Governance + 3 Pillars + Maturity
 * ~90% smaller payload than full CountryResponse.
 */
export interface GeoJSONCountryMetadata {
  iso_code: string;
  name: string;
  // === Framework-Aligned Scores ===
  maturity_score: number | null;         // Overall (1.0-4.0)
  governance_score: number | null;       // Governance Index (0-100)
  pillar1_score: number | null;          // Hazard Control (0-100)
  pillar2_score: number | null;          // Health Vigilance (0-100)
  pillar3_score: number | null;          // Restoration (0-100)
  // === Derived Status ===
  status: CountryStatus;
  flag_url?: string | null;
}

/**
 * Response from GET /api/v1/countries/geojson-metadata
 */
export interface GeoJSONMetadataResponse {
  total: number;
  countries: GeoJSONCountryMetadata[];
}
