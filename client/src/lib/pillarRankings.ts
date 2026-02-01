/**
 * Arthur D. Little - Global Health Platform
 * Pillar Rankings Utility
 * 
 * Functions for extracting pillar scores, ranking countries,
 * and identifying leaders for each framework pillar.
 */

import type { Country } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

export type PillarType = "governance" | "hazard_control" | "vigilance" | "restoration";

export interface PillarScores {
  governance: number | null;
  hazard_control: number | null;
  vigilance: number | null;
  restoration: number | null;
}

export interface RankedCountry {
  iso_code: string;
  name: string;
  flag_url: string | null;
  score: number;
  rank: number;
  country: Country;
}

export interface PillarRankingResult {
  pillar: PillarType;
  currentCountry: RankedCountry | null;
  leaders: RankedCountry[];
  totalCountries: number;
}

export interface PillarMetricComparison {
  metric: string;
  label: string;
  currentValue: string | number | boolean | null;
  leaderValue: string | number | boolean | null;
  gap: number | null; // Percentage gap (positive = leader is better)
  lowerIsBetter?: boolean;
}

// ============================================================================
// PILLAR CONFIGURATION
// ============================================================================

export const PILLAR_CONFIG: Record<PillarType, {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  scoreField: string;
}> = {
  governance: {
    label: "Governance",
    shortLabel: "Gov",
    description: "Strategic capacity and policy framework for occupational health oversight",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    scoreField: "strategic_capacity_score",
  },
  hazard_control: {
    label: "Hazard Control",
    shortLabel: "Hazard",
    description: "Risk management systems for workplace hazards and safety controls",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    scoreField: "control_maturity_score",
  },
  vigilance: {
    label: "Health Vigilance",
    shortLabel: "Vigilance",
    description: "Surveillance and detection systems for occupational health risks",
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    scoreField: "vulnerability_index",
  },
  restoration: {
    label: "Restoration",
    shortLabel: "Restore",
    description: "Compensation, rehabilitation, and return-to-work support systems",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    scoreField: "rehab_access_score",
  },
};

// ============================================================================
// SCORE EXTRACTION
// ============================================================================

/**
 * Extract all pillar scores from a country
 */
export function extractPillarScores(country: Country): PillarScores {
  return {
    governance: country.governance?.strategic_capacity_score ?? null,
    hazard_control: country.pillar_1_hazard?.control_maturity_score ?? null,
    // Vigilance: invert vulnerability index (lower vulnerability = higher score)
    vigilance: country.pillar_2_vigilance?.vulnerability_index != null
      ? Math.round(100 - country.pillar_2_vigilance.vulnerability_index)
      : null,
    restoration: country.pillar_3_restoration?.rehab_access_score ?? null,
  };
}

/**
 * Get a specific pillar score from a country
 */
export function getPillarScore(country: Country, pillar: PillarType): number | null {
  const scores = extractPillarScores(country);
  return scores[pillar];
}

// ============================================================================
// RANKING FUNCTIONS
// ============================================================================

/**
 * Rank all countries by a specific pillar score
 * Returns sorted array with rank numbers
 */
export function rankCountriesByPillar(
  countries: Country[],
  pillar: PillarType
): RankedCountry[] {
  // Filter countries that have a score for this pillar
  const countriesWithScore = countries
    .map((country) => ({
      iso_code: country.iso_code,
      name: country.name,
      flag_url: country.flag_url ?? null,
      score: getPillarScore(country, pillar),
      country,
    }))
    .filter((c): c is { iso_code: string; name: string; flag_url: string | null; score: number; country: Country } => 
      c.score !== null
    );

  // Sort by score descending (higher is better)
  const sorted = countriesWithScore.sort((a, b) => b.score - a.score);

  // Add rank numbers
  return sorted.map((c, index) => ({
    ...c,
    rank: index + 1,
  }));
}

/**
 * Get pillar ranking result for a specific country
 * Includes the country's rank and top N leaders
 */
export function getPillarRanking(
  countries: Country[],
  currentIsoCode: string,
  pillar: PillarType,
  topN: number = 3
): PillarRankingResult {
  const ranked = rankCountriesByPillar(countries, pillar);
  
  const currentCountry = ranked.find((c) => c.iso_code === currentIsoCode) ?? null;
  
  // Get top N leaders (excluding current country if it's in top N)
  const leaders = ranked
    .filter((c) => c.iso_code !== currentIsoCode)
    .slice(0, topN);

  return {
    pillar,
    currentCountry,
    leaders,
    totalCountries: ranked.length,
  };
}

/**
 * Get the top leader for a pillar
 */
export function getTopLeader(
  countries: Country[],
  pillar: PillarType,
  excludeIsoCode?: string
): RankedCountry | null {
  const ranked = rankCountriesByPillar(countries, pillar);
  
  if (excludeIsoCode) {
    return ranked.find((c) => c.iso_code !== excludeIsoCode) ?? null;
  }
  
  return ranked[0] ?? null;
}

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

/**
 * Compare metrics between current country and leader for a pillar
 */
export function comparePillarMetrics(
  currentCountry: Country,
  leaderCountry: Country,
  pillar: PillarType
): PillarMetricComparison[] {
  const comparisons: PillarMetricComparison[] = [];

  switch (pillar) {
    case "governance":
      comparisons.push(
        {
          metric: "ilo_c187_status",
          label: "ILO C187 Ratified",
          currentValue: currentCountry.governance?.ilo_c187_status ?? null,
          leaderValue: leaderCountry.governance?.ilo_c187_status ?? null,
          gap: null,
        },
        {
          metric: "ilo_c155_status",
          label: "ILO C155 Ratified",
          currentValue: currentCountry.governance?.ilo_c155_status ?? null,
          leaderValue: leaderCountry.governance?.ilo_c155_status ?? null,
          gap: null,
        },
        {
          metric: "inspector_density",
          label: "Inspector Density",
          currentValue: currentCountry.governance?.inspector_density ?? null,
          leaderValue: leaderCountry.governance?.inspector_density ?? null,
          gap: calculateGap(
            currentCountry.governance?.inspector_density,
            leaderCountry.governance?.inspector_density
          ),
        },
        {
          metric: "mental_health_policy",
          label: "Mental Health Policy",
          currentValue: currentCountry.governance?.mental_health_policy ?? null,
          leaderValue: leaderCountry.governance?.mental_health_policy ?? null,
          gap: null,
        },
        {
          metric: "strategic_capacity_score",
          label: "Strategic Capacity",
          currentValue: currentCountry.governance?.strategic_capacity_score ?? null,
          leaderValue: leaderCountry.governance?.strategic_capacity_score ?? null,
          gap: calculateGap(
            currentCountry.governance?.strategic_capacity_score,
            leaderCountry.governance?.strategic_capacity_score
          ),
        }
      );
      break;

    case "hazard_control":
      comparisons.push(
        {
          metric: "fatal_accident_rate",
          label: "Fatal Accident Rate",
          currentValue: currentCountry.pillar_1_hazard?.fatal_accident_rate ?? null,
          leaderValue: leaderCountry.pillar_1_hazard?.fatal_accident_rate ?? null,
          gap: calculateGap(
            currentCountry.pillar_1_hazard?.fatal_accident_rate,
            leaderCountry.pillar_1_hazard?.fatal_accident_rate,
            true
          ),
          lowerIsBetter: true,
        },
        {
          metric: "carcinogen_exposure_pct",
          label: "Carcinogen Exposure",
          currentValue: currentCountry.pillar_1_hazard?.carcinogen_exposure_pct ?? null,
          leaderValue: leaderCountry.pillar_1_hazard?.carcinogen_exposure_pct ?? null,
          gap: calculateGap(
            currentCountry.pillar_1_hazard?.carcinogen_exposure_pct,
            leaderCountry.pillar_1_hazard?.carcinogen_exposure_pct,
            true
          ),
          lowerIsBetter: true,
        },
        {
          metric: "heat_stress_reg_type",
          label: "Heat Stress Regulation",
          currentValue: currentCountry.pillar_1_hazard?.heat_stress_reg_type ?? null,
          leaderValue: leaderCountry.pillar_1_hazard?.heat_stress_reg_type ?? null,
          gap: null,
        },
        {
          metric: "oel_compliance_pct",
          label: "OEL Compliance",
          currentValue: currentCountry.pillar_1_hazard?.oel_compliance_pct ?? null,
          leaderValue: leaderCountry.pillar_1_hazard?.oel_compliance_pct ?? null,
          gap: calculateGap(
            currentCountry.pillar_1_hazard?.oel_compliance_pct,
            leaderCountry.pillar_1_hazard?.oel_compliance_pct
          ),
        },
        {
          metric: "control_maturity_score",
          label: "Control Maturity",
          currentValue: currentCountry.pillar_1_hazard?.control_maturity_score ?? null,
          leaderValue: leaderCountry.pillar_1_hazard?.control_maturity_score ?? null,
          gap: calculateGap(
            currentCountry.pillar_1_hazard?.control_maturity_score,
            leaderCountry.pillar_1_hazard?.control_maturity_score
          ),
        }
      );
      break;

    case "vigilance":
      comparisons.push(
        {
          metric: "surveillance_logic",
          label: "Surveillance System",
          currentValue: currentCountry.pillar_2_vigilance?.surveillance_logic ?? null,
          leaderValue: leaderCountry.pillar_2_vigilance?.surveillance_logic ?? null,
          gap: null,
        },
        {
          metric: "disease_detection_rate",
          label: "Disease Detection Rate",
          currentValue: currentCountry.pillar_2_vigilance?.disease_detection_rate ?? null,
          leaderValue: leaderCountry.pillar_2_vigilance?.disease_detection_rate ?? null,
          gap: calculateGap(
            currentCountry.pillar_2_vigilance?.disease_detection_rate,
            leaderCountry.pillar_2_vigilance?.disease_detection_rate
          ),
        },
        {
          metric: "vulnerability_index",
          label: "Vulnerability Index",
          currentValue: currentCountry.pillar_2_vigilance?.vulnerability_index ?? null,
          leaderValue: leaderCountry.pillar_2_vigilance?.vulnerability_index ?? null,
          gap: calculateGap(
            currentCountry.pillar_2_vigilance?.vulnerability_index,
            leaderCountry.pillar_2_vigilance?.vulnerability_index,
            true
          ),
          lowerIsBetter: true,
        },
        {
          metric: "occupational_disease_reporting_rate",
          label: "Disease Reporting Rate",
          currentValue: currentCountry.pillar_2_vigilance?.occupational_disease_reporting_rate ?? null,
          leaderValue: leaderCountry.pillar_2_vigilance?.occupational_disease_reporting_rate ?? null,
          gap: calculateGap(
            currentCountry.pillar_2_vigilance?.occupational_disease_reporting_rate,
            leaderCountry.pillar_2_vigilance?.occupational_disease_reporting_rate
          ),
        }
      );
      break;

    case "restoration":
      comparisons.push(
        {
          metric: "payer_mechanism",
          label: "Payer Mechanism",
          currentValue: currentCountry.pillar_3_restoration?.payer_mechanism ?? null,
          leaderValue: leaderCountry.pillar_3_restoration?.payer_mechanism ?? null,
          gap: null,
        },
        {
          metric: "reintegration_law",
          label: "Reintegration Law",
          currentValue: currentCountry.pillar_3_restoration?.reintegration_law ?? null,
          leaderValue: leaderCountry.pillar_3_restoration?.reintegration_law ?? null,
          gap: null,
        },
        {
          metric: "rehab_access_score",
          label: "Rehab Access Score",
          currentValue: currentCountry.pillar_3_restoration?.rehab_access_score ?? null,
          leaderValue: leaderCountry.pillar_3_restoration?.rehab_access_score ?? null,
          gap: calculateGap(
            currentCountry.pillar_3_restoration?.rehab_access_score,
            leaderCountry.pillar_3_restoration?.rehab_access_score
          ),
        },
        {
          metric: "return_to_work_success_pct",
          label: "Return to Work Success",
          currentValue: currentCountry.pillar_3_restoration?.return_to_work_success_pct ?? null,
          leaderValue: leaderCountry.pillar_3_restoration?.return_to_work_success_pct ?? null,
          gap: calculateGap(
            currentCountry.pillar_3_restoration?.return_to_work_success_pct,
            leaderCountry.pillar_3_restoration?.return_to_work_success_pct
          ),
        },
        {
          metric: "sickness_absence_days",
          label: "Sickness Absence Days",
          currentValue: currentCountry.pillar_3_restoration?.sickness_absence_days ?? null,
          leaderValue: leaderCountry.pillar_3_restoration?.sickness_absence_days ?? null,
          gap: calculateGap(
            currentCountry.pillar_3_restoration?.sickness_absence_days,
            leaderCountry.pillar_3_restoration?.sickness_absence_days,
            true
          ),
          lowerIsBetter: true,
        }
      );
      break;
  }

  return comparisons;
}

/**
 * Calculate percentage gap between current and leader value
 * Positive gap means leader is better
 */
function calculateGap(
  currentValue: number | null | undefined,
  leaderValue: number | null | undefined,
  lowerIsBetter: boolean = false
): number | null {
  if (currentValue == null || leaderValue == null || leaderValue === 0) {
    return null;
  }

  if (lowerIsBetter) {
    // For metrics where lower is better (e.g., fatal accident rate)
    // Gap shows how much higher current is compared to leader
    return Math.round(((currentValue - leaderValue) / leaderValue) * 100);
  } else {
    // For metrics where higher is better
    // Gap shows how much lower current is compared to leader
    return Math.round(((leaderValue - currentValue) / leaderValue) * 100);
  }
}

/**
 * Get significant gaps (metrics where current country is notably behind)
 */
export function getSignificantGaps(
  comparisons: PillarMetricComparison[],
  threshold: number = 20
): PillarMetricComparison[] {
  return comparisons.filter(
    (c) => c.gap !== null && c.gap >= threshold
  );
}

/**
 * Get what leaders do better - areas where current country has significant gaps
 */
export function getLeaderAdvantages(
  currentCountry: Country,
  leaderCountry: Country,
  pillar: PillarType,
  gapThreshold: number = 10
): { metric: string; label: string; gap: number }[] {
  const comparisons = comparePillarMetrics(currentCountry, leaderCountry, pillar);
  
  return comparisons
    .filter((c) => c.gap !== null && c.gap >= gapThreshold)
    .map((c) => ({
      metric: c.metric,
      label: c.label,
      gap: c.gap!,
    }))
    .sort((a, b) => b.gap - a.gap);
}
