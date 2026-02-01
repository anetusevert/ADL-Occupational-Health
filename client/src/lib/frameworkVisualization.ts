/**
 * Arthur D. Little - Global Health Platform
 * Framework Visualization Utilities
 * 
 * Data transformation, dimension calculation, and insight generation
 * for the Country Profile visualization dashboard.
 */

import type { Country } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

export interface FrameworkDimensions {
  governance: number | null;
  financing: number | null;
  capacity: number | null;
  implementation: number | null;
  impact: number | null;
}

export interface OnionLayerData {
  layer: "policy" | "infrastructure" | "workplace";
  label: string;
  score: number | null;
  metrics: { label: string; value: string | number | boolean | null; isGood: boolean | null }[];
  // Optional AI-generated insights for enhanced display
  insight?: string;
  strength?: { label: string; detail: string };
  gap?: { label: string; detail: string };
}

export interface SystemFlowItem {
  label: string;
  value: string | number | null;
  score: number | null;
  lowerIsBetter?: boolean;
}

export interface SystemFlowStageInsight {
  insight: string;
  strength?: { label: string; detail: string };
  gap?: { label: string; detail: string };
}

export interface SystemFlowData {
  inputs: SystemFlowItem[];
  processes: SystemFlowItem[];
  outcomes: SystemFlowItem[];
  // Optional AI-generated insights per stage
  stageInsights?: {
    inputs?: SystemFlowStageInsight;
    processes?: SystemFlowStageInsight;
    outcomes?: SystemFlowStageInsight;
  };
}

export interface StrategicInsightData {
  type: "strength" | "weakness" | "gap" | "opportunity";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface RadarDataPoint {
  dimension: string;
  fullMark: number;
  [key: string]: string | number;
}

// ============================================================================
// DIMENSION CALCULATION
// ============================================================================

/**
 * Calculate the 5 framework dimensions from country data
 * All values normalized to 0-100 scale
 */
export function calculateFrameworkDimensions(country: Country): FrameworkDimensions {
  // Governance: Strategic capacity score (already 0-100)
  const governance = country.governance?.strategic_capacity_score ?? null;

  // Financing: Estimate from governance infrastructure
  // In a real scenario, this would come from CountryIntelligence health_expenditure_gdp_pct
  // For now, derive from available data
  const financing = calculateFinancingScore(country);

  // Capacity: Inspector density + infrastructure proxies
  const capacity = calculateCapacityScore(country);

  // Implementation: OEL compliance + surveillance + training
  const implementation = calculateImplementationScore(country);

  // Impact: Inverse of fatal rate + disease detection (higher is better)
  const impact = calculateImpactScore(country);

  return { governance, financing, capacity, implementation, impact };
}

function calculateFinancingScore(country: Country): number | null {
  // Proxy: Use governance indicators as financing often correlates
  const hasILO = (country.governance?.ilo_c187_status ? 20 : 0) + 
                 (country.governance?.ilo_c155_status ? 20 : 0);
  const inspectorScore = country.governance?.inspector_density 
    ? Math.min(country.governance.inspector_density * 30, 60) 
    : null;
  
  if (inspectorScore === null) return hasILO > 0 ? hasILO : null;
  return Math.min(hasILO + inspectorScore, 100);
}

function calculateCapacityScore(country: Country): number | null {
  const inspectorDensity = country.governance?.inspector_density;
  if (inspectorDensity === null || inspectorDensity === undefined) return null;
  
  // ILO recommends 1 inspector per 10,000 workers
  // Score based on meeting/exceeding this threshold
  const inspectorScore = Math.min((inspectorDensity / 1.5) * 100, 100);
  
  // Add surveillance system quality
  const surveillanceBonus = country.pillar_2_vigilance?.surveillance_logic === "Risk-Based" ? 20 :
                            country.pillar_2_vigilance?.surveillance_logic === "Mandatory" ? 10 : 0;
  
  return Math.min(inspectorScore * 0.7 + surveillanceBonus * 1.5, 100);
}

function calculateImplementationScore(country: Country): number | null {
  const scores: number[] = [];
  
  // OEL Compliance
  if (country.pillar_1_hazard?.oel_compliance_pct !== null && 
      country.pillar_1_hazard?.oel_compliance_pct !== undefined) {
    scores.push(country.pillar_1_hazard.oel_compliance_pct);
  }
  
  // Control maturity
  if (country.pillar_1_hazard?.control_maturity_score !== null &&
      country.pillar_1_hazard?.control_maturity_score !== undefined) {
    scores.push(country.pillar_1_hazard.control_maturity_score);
  }
  
  // Disease reporting rate
  if (country.pillar_2_vigilance?.occupational_disease_reporting_rate !== null &&
      country.pillar_2_vigilance?.occupational_disease_reporting_rate !== undefined) {
    scores.push(country.pillar_2_vigilance.occupational_disease_reporting_rate);
  }
  
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calculateImpactScore(country: Country): number | null {
  const fatalRate = country.pillar_1_hazard?.fatal_accident_rate;
  if (fatalRate === null || fatalRate === undefined) return null;
  
  // Invert: lower fatal rate = higher score
  // Scale: 0 deaths = 100, 10+ deaths = 0
  const fatalScore = Math.max(0, Math.min(100, 100 - (fatalRate * 10)));
  
  // Add RTW success if available
  const rtwSuccess = country.pillar_3_restoration?.return_to_work_success_pct;
  if (rtwSuccess !== null && rtwSuccess !== undefined) {
    return (fatalScore * 0.6) + (rtwSuccess * 0.4);
  }
  
  return fatalScore;
}

// ============================================================================
// ONION MODEL DATA
// ============================================================================

/**
 * Generate data for the Onion Model (concentric layers)
 */
export function generateOnionData(country: Country): OnionLayerData[] {
  return [
    {
      layer: "policy",
      label: "National Policy",
      score: calculatePolicyScore(country),
      metrics: [
        {
          label: "ILO C187 Ratified",
          value: country.governance?.ilo_c187_status ?? null,
          isGood: country.governance?.ilo_c187_status ?? null,
        },
        {
          label: "ILO C155 Ratified",
          value: country.governance?.ilo_c155_status ?? null,
          isGood: country.governance?.ilo_c155_status ?? null,
        },
        {
          label: "Mental Health Policy",
          value: country.governance?.mental_health_policy ?? null,
          isGood: country.governance?.mental_health_policy ?? null,
        },
        {
          label: "Strategic Capacity",
          value: country.governance?.strategic_capacity_score 
            ? `${country.governance.strategic_capacity_score.toFixed(0)}%` 
            : null,
          isGood: (country.governance?.strategic_capacity_score ?? 0) >= 60 ? true :
                  (country.governance?.strategic_capacity_score ?? 0) >= 40 ? null : false,
        },
      ],
    },
    {
      layer: "infrastructure",
      label: "Institutional Infrastructure",
      score: calculateInfrastructureScore(country),
      metrics: [
        {
          label: "Inspector Density",
          value: country.governance?.inspector_density 
            ? `${country.governance.inspector_density.toFixed(2)}/10k` 
            : null,
          isGood: (country.governance?.inspector_density ?? 0) >= 1.0 ? true :
                  (country.governance?.inspector_density ?? 0) >= 0.5 ? null : false,
        },
        {
          label: "Surveillance System",
          value: country.pillar_2_vigilance?.surveillance_logic ?? null,
          isGood: country.pillar_2_vigilance?.surveillance_logic === "Risk-Based" ? true :
                  country.pillar_2_vigilance?.surveillance_logic === "None" ? false : null,
        },
        {
          label: "Payer Mechanism",
          value: country.pillar_3_restoration?.payer_mechanism ?? null,
          isGood: country.pillar_3_restoration?.payer_mechanism === "No-Fault" ? true : null,
        },
        {
          label: "Rehab Access",
          value: country.pillar_3_restoration?.rehab_access_score
            ? `${country.pillar_3_restoration.rehab_access_score.toFixed(0)}/100`
            : null,
          isGood: (country.pillar_3_restoration?.rehab_access_score ?? 0) >= 60 ? true :
                  (country.pillar_3_restoration?.rehab_access_score ?? 0) >= 40 ? null : false,
        },
      ],
    },
    {
      layer: "workplace",
      label: "Workplace Implementation",
      score: calculateWorkplaceScore(country),
      metrics: [
        {
          label: "OEL Compliance",
          value: country.pillar_1_hazard?.oel_compliance_pct
            ? `${country.pillar_1_hazard.oel_compliance_pct.toFixed(0)}%`
            : null,
          isGood: (country.pillar_1_hazard?.oel_compliance_pct ?? 0) >= 80 ? true :
                  (country.pillar_1_hazard?.oel_compliance_pct ?? 0) >= 50 ? null : false,
        },
        {
          label: "Fatal Rate",
          value: country.pillar_1_hazard?.fatal_accident_rate
            ? `${country.pillar_1_hazard.fatal_accident_rate.toFixed(1)}/100k`
            : null,
          isGood: (country.pillar_1_hazard?.fatal_accident_rate ?? 100) < 2 ? true :
                  (country.pillar_1_hazard?.fatal_accident_rate ?? 100) < 5 ? null : false,
        },
        {
          label: "RTW Success",
          value: country.pillar_3_restoration?.return_to_work_success_pct
            ? `${country.pillar_3_restoration.return_to_work_success_pct.toFixed(0)}%`
            : null,
          isGood: (country.pillar_3_restoration?.return_to_work_success_pct ?? 0) >= 70 ? true :
                  (country.pillar_3_restoration?.return_to_work_success_pct ?? 0) >= 50 ? null : false,
        },
        {
          label: "Disease Detection",
          value: country.pillar_2_vigilance?.disease_detection_rate
            ? `${country.pillar_2_vigilance.disease_detection_rate.toFixed(0)}%`
            : null,
          isGood: (country.pillar_2_vigilance?.disease_detection_rate ?? 0) >= 60 ? true :
                  (country.pillar_2_vigilance?.disease_detection_rate ?? 0) >= 40 ? null : false,
        },
      ],
    },
  ];
}

function calculatePolicyScore(country: Country): number | null {
  let score = 0;
  let count = 0;
  
  if (country.governance?.ilo_c187_status) { score += 25; count++; }
  else if (country.governance?.ilo_c187_status === false) { count++; }
  
  if (country.governance?.ilo_c155_status) { score += 25; count++; }
  else if (country.governance?.ilo_c155_status === false) { count++; }
  
  if (country.governance?.mental_health_policy) { score += 25; count++; }
  else if (country.governance?.mental_health_policy === false) { count++; }
  
  if (country.governance?.strategic_capacity_score !== null && 
      country.governance?.strategic_capacity_score !== undefined) {
    score += country.governance.strategic_capacity_score * 0.25;
    count++;
  }
  
  return count > 0 ? (score / count) * 4 : null;
}

function calculateInfrastructureScore(country: Country): number | null {
  const scores: number[] = [];
  
  if (country.governance?.inspector_density !== null && 
      country.governance?.inspector_density !== undefined) {
    scores.push(Math.min(country.governance.inspector_density * 50, 100));
  }
  
  if (country.pillar_2_vigilance?.surveillance_logic) {
    scores.push(
      country.pillar_2_vigilance.surveillance_logic === "Risk-Based" ? 100 :
      country.pillar_2_vigilance.surveillance_logic === "Mandatory" ? 70 : 30
    );
  }
  
  if (country.pillar_3_restoration?.rehab_access_score !== null &&
      country.pillar_3_restoration?.rehab_access_score !== undefined) {
    scores.push(country.pillar_3_restoration.rehab_access_score);
  }
  
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

function calculateWorkplaceScore(country: Country): number | null {
  const scores: number[] = [];
  
  if (country.pillar_1_hazard?.oel_compliance_pct !== null &&
      country.pillar_1_hazard?.oel_compliance_pct !== undefined) {
    scores.push(country.pillar_1_hazard.oel_compliance_pct);
  }
  
  if (country.pillar_1_hazard?.fatal_accident_rate !== null &&
      country.pillar_1_hazard?.fatal_accident_rate !== undefined) {
    scores.push(Math.max(0, 100 - country.pillar_1_hazard.fatal_accident_rate * 10));
  }
  
  if (country.pillar_3_restoration?.return_to_work_success_pct !== null &&
      country.pillar_3_restoration?.return_to_work_success_pct !== undefined) {
    scores.push(country.pillar_3_restoration.return_to_work_success_pct);
  }
  
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

// ============================================================================
// SYSTEM FLOW DATA
// ============================================================================

/**
 * Generate data for the System Flow visualization (Input -> Process -> Outcome)
 */
export function generateSystemFlowData(country: Country): SystemFlowData {
  return {
    inputs: [
      {
        label: "ILO Conventions",
        value: `${(country.governance?.ilo_c187_status ? 1 : 0) + (country.governance?.ilo_c155_status ? 1 : 0)}/2 ratified`,
        score: ((country.governance?.ilo_c187_status ? 50 : 0) + (country.governance?.ilo_c155_status ? 50 : 0)),
      },
      {
        label: "Strategic Capacity",
        value: country.governance?.strategic_capacity_score 
          ? `${country.governance.strategic_capacity_score.toFixed(0)}%` 
          : null,
        score: country.governance?.strategic_capacity_score ?? null,
      },
      {
        label: "Reintegration Law",
        value: country.pillar_3_restoration?.reintegration_law ? "Yes" : "No",
        score: country.pillar_3_restoration?.reintegration_law ? 100 : 0,
      },
    ],
    processes: [
      {
        label: "Inspector Density",
        value: country.governance?.inspector_density 
          ? `${country.governance.inspector_density.toFixed(2)}/10k` 
          : null,
        score: country.governance?.inspector_density 
          ? Math.min(country.governance.inspector_density * 50, 100) 
          : null,
      },
      {
        label: "Surveillance",
        value: country.pillar_2_vigilance?.surveillance_logic ?? null,
        score: country.pillar_2_vigilance?.surveillance_logic === "Risk-Based" ? 100 :
               country.pillar_2_vigilance?.surveillance_logic === "Mandatory" ? 70 : 30,
      },
      {
        label: "Rehab Access",
        value: country.pillar_3_restoration?.rehab_access_score
          ? `${country.pillar_3_restoration.rehab_access_score.toFixed(0)}/100`
          : null,
        score: country.pillar_3_restoration?.rehab_access_score ?? null,
      },
    ],
    outcomes: [
      {
        label: "Fatal Rate",
        value: country.pillar_1_hazard?.fatal_accident_rate
          ? `${country.pillar_1_hazard.fatal_accident_rate.toFixed(1)}/100k`
          : null,
        score: country.pillar_1_hazard?.fatal_accident_rate
          ? Math.max(0, 100 - country.pillar_1_hazard.fatal_accident_rate * 10)
          : null,
        lowerIsBetter: true,
      },
      {
        label: "Disease Detection",
        value: country.pillar_2_vigilance?.disease_detection_rate
          ? `${country.pillar_2_vigilance.disease_detection_rate.toFixed(0)}%`
          : null,
        score: country.pillar_2_vigilance?.disease_detection_rate ?? null,
      },
      {
        label: "RTW Success",
        value: country.pillar_3_restoration?.return_to_work_success_pct
          ? `${country.pillar_3_restoration.return_to_work_success_pct.toFixed(0)}%`
          : null,
        score: country.pillar_3_restoration?.return_to_work_success_pct ?? null,
      },
    ],
  };
}

// ============================================================================
// RADAR CHART DATA
// ============================================================================

/**
 * Generate radar chart data for country comparison
 */
export function generateRadarData(
  country: Country,
  comparisonCountry: Country | null,
  countryName: string,
  comparisonName: string
): RadarDataPoint[] {
  const dims = calculateFrameworkDimensions(country);
  const compDims = comparisonCountry ? calculateFrameworkDimensions(comparisonCountry) : null;

  return [
    {
      dimension: "Governance",
      [countryName]: dims.governance ?? 0,
      [comparisonName]: compDims?.governance ?? 0,
      fullMark: 100,
    },
    {
      dimension: "Financing",
      [countryName]: dims.financing ?? 0,
      [comparisonName]: compDims?.financing ?? 0,
      fullMark: 100,
    },
    {
      dimension: "Capacity",
      [countryName]: dims.capacity ?? 0,
      [comparisonName]: compDims?.capacity ?? 0,
      fullMark: 100,
    },
    {
      dimension: "Implementation",
      [countryName]: dims.implementation ?? 0,
      [comparisonName]: compDims?.implementation ?? 0,
      fullMark: 100,
    },
    {
      dimension: "Impact",
      [countryName]: dims.impact ?? 0,
      [comparisonName]: compDims?.impact ?? 0,
      fullMark: 100,
    },
  ];
}

// ============================================================================
// STRATEGIC INSIGHTS
// ============================================================================

/**
 * Generate strategic insights based on data patterns
 */
export function generateStrategicInsights(
  country: Country,
  comparisonCountry: Country | null
): StrategicInsightData[] {
  const insights: StrategicInsightData[] = [];
  const dims = calculateFrameworkDimensions(country);
  const onion = generateOnionData(country);

  // Pattern 1: Paper Tiger (high policy, low implementation)
  const policyScore = onion.find(l => l.layer === "policy")?.score ?? 0;
  const workplaceScore = onion.find(l => l.layer === "workplace")?.score ?? 0;
  
  if (policyScore && workplaceScore && policyScore > 60 && workplaceScore < 40) {
    insights.push({
      type: "gap",
      title: "Paper Tiger System",
      description: `Strong legal framework (${policyScore.toFixed(0)}%) but weak workplace implementation (${workplaceScore.toFixed(0)}%) suggests enforcement gaps and resource constraints.`,
      severity: "high",
    });
  }

  // Pattern 2: Resource Constrained (good processes but limited capacity)
  if (dims.implementation && dims.capacity && dims.implementation > 50 && dims.capacity < 40) {
    insights.push({
      type: "weakness",
      title: "Capacity Constraint",
      description: `Implementation efforts (${dims.implementation.toFixed(0)}%) are hindered by limited institutional capacity (${dims.capacity.toFixed(0)}%). Consider investing in inspector recruitment and training.`,
      severity: "medium",
    });
  }

  // Pattern 3: High Impact Achiever
  if (dims.impact && dims.impact > 70) {
    insights.push({
      type: "strength",
      title: "Strong Health Outcomes",
      description: `Excellent impact score (${dims.impact.toFixed(0)}%) indicates effective occupational health outcomes despite potential system gaps.`,
      severity: "low",
    });
  }

  // Pattern 4: Comparison insight
  if (comparisonCountry) {
    const compDims = calculateFrameworkDimensions(comparisonCountry);
    const gaps: string[] = [];
    
    if (dims.governance && compDims.governance && compDims.governance - dims.governance > 20) {
      gaps.push("governance");
    }
    if (dims.implementation && compDims.implementation && compDims.implementation - dims.implementation > 20) {
      gaps.push("implementation");
    }
    if (dims.impact && compDims.impact && compDims.impact - dims.impact > 20) {
      gaps.push("impact");
    }
    
    if (gaps.length > 0) {
      insights.push({
        type: "opportunity",
        title: "Benchmark Gap",
        description: `Significant gaps in ${gaps.join(", ")} compared to ${comparisonCountry.name}. Learning from their approaches could accelerate improvement.`,
        severity: "medium",
      });
    }
  }

  // Pattern 5: No major issues detected
  if (insights.length === 0) {
    const avgScore = [dims.governance, dims.financing, dims.capacity, dims.implementation, dims.impact]
      .filter(s => s !== null)
      .reduce((a, b) => a! + b!, 0) as number / 5;
    
    if (avgScore > 60) {
      insights.push({
        type: "strength",
        title: "Balanced System",
        description: `Well-balanced occupational health framework with consistent performance across dimensions. Focus on continuous improvement.`,
        severity: "low",
      });
    } else {
      insights.push({
        type: "weakness",
        title: "System Development Needed",
        description: `Multiple areas require attention. Prioritize governance and capacity building as foundations for broader improvement.`,
        severity: "medium",
      });
    }
  }

  return insights;
}

/**
 * Generate specific insight for the Onion Model
 */
export function generateOnionInsight(country: Country): string {
  const onion = generateOnionData(country);
  const policy = onion.find(l => l.layer === "policy")?.score ?? 0;
  const infra = onion.find(l => l.layer === "infrastructure")?.score ?? 0;
  const workplace = onion.find(l => l.layer === "workplace")?.score ?? 0;

  if (policy > 70 && workplace < 40) {
    return `Strong national policy framework but weak workplace implementation suggests an "enforcement gap" where laws exist but are not effectively applied at the workplace level.`;
  }
  if (infra < 40 && workplace < 50) {
    return `Limited institutional infrastructure is constraining workplace implementation. Prioritizing capacity building could have cascading positive effects.`;
  }
  if (policy > infra && infra > workplace) {
    return `Classic "implementation pyramid" pattern where effectiveness decreases from policy to practice. Strengthening the intermediate institutional layer is key.`;
  }
  if (workplace > infra) {
    return `Workplace practices exceed institutional framework capacity, suggesting strong private sector or informal initiatives compensating for public system gaps.`;
  }
  return `Analyze the layer balance to identify which level of the system requires the most attention for holistic improvement.`;
}

/**
 * Generate specific insight for the System Flow
 */
export function generateFlowInsight(country: Country): string {
  const flow = generateSystemFlowData(country);
  const avgInput = flow.inputs.reduce((a, b) => a + (b.score ?? 0), 0) / flow.inputs.length;
  const avgProcess = flow.processes.reduce((a, b) => a + (b.score ?? 0), 0) / flow.processes.length;
  const avgOutcome = flow.outcomes.reduce((a, b) => a + (b.score ?? 0), 0) / flow.outcomes.length;

  if (avgInput > 60 && avgOutcome < 40) {
    return `High inputs (laws, funding) but poor outcomes indicates significant "system leakage" - resources and regulations are not translating into worker protection.`;
  }
  if (avgProcess < 40 && avgInput > 50) {
    return `Process bottleneck detected: adequate inputs but weak operational capacity (inspections, services) is limiting effectiveness.`;
  }
  if (avgOutcome > 60) {
    return `Strong outcomes despite process limitations suggest efficient resource utilization or effective prioritization of high-impact interventions.`;
  }
  return `Review the input-to-outcome conversion efficiency to identify where system improvements would have the greatest impact.`;
}

/**
 * Generate specific insight for the Radar comparison
 */
export function generateRadarInsight(
  country: Country, 
  comparisonCountry: Country | null,
  comparisonName: string
): string {
  if (!comparisonCountry) {
    const dims = calculateFrameworkDimensions(country);
    const scores = Object.values(dims).filter(s => s !== null) as number[];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    
    if (max - min > 40) {
      return `Uneven profile with ${max.toFixed(0)}% maximum and ${min.toFixed(0)}% minimum indicates significant capability gaps requiring targeted investment.`;
    }
    return `Relatively balanced profile across dimensions with ${avg.toFixed(0)}% average score.`;
  }

  const dims = calculateFrameworkDimensions(country);
  const compDims = calculateFrameworkDimensions(comparisonCountry);
  
  const advantages: string[] = [];
  const gaps: string[] = [];
  
  if ((dims.governance ?? 0) > (compDims.governance ?? 0) + 10) advantages.push("governance");
  if ((dims.implementation ?? 0) > (compDims.implementation ?? 0) + 10) advantages.push("implementation");
  if ((dims.impact ?? 0) > (compDims.impact ?? 0) + 10) advantages.push("impact");
  
  if ((compDims.governance ?? 0) > (dims.governance ?? 0) + 10) gaps.push("governance");
  if ((compDims.implementation ?? 0) > (dims.implementation ?? 0) + 10) gaps.push("implementation");
  if ((compDims.impact ?? 0) > (dims.impact ?? 0) + 10) gaps.push("impact");
  
  if (advantages.length > 0 && gaps.length > 0) {
    return `Outperforms ${comparisonName} in ${advantages.join(", ")} but lags in ${gaps.join(", ")}. Cross-learning opportunities exist in both directions.`;
  }
  if (gaps.length > 0) {
    return `Significant gaps in ${gaps.join(", ")} compared to ${comparisonName}. Studying their approaches could inform improvement strategies.`;
  }
  if (advantages.length > 0) {
    return `Leads ${comparisonName} in ${advantages.join(", ")}. These practices could serve as benchmarks for other countries.`;
  }
  return `Similar performance profile to ${comparisonName} across most dimensions.`;
}

// ============================================================================
// SUMMARY TABLE DATA
// ============================================================================

export interface SummaryTableRow {
  metric: string;
  currentValue: string | number | null;
  comparisonValue: string | number | null;
  globalValue: string | number | null;
  lowerIsBetter?: boolean;
}

/**
 * Generate summary table data
 */
export function generateSummaryTableData(
  country: Country,
  comparisonCountry: Country | null,
  globalAverages: Record<string, number>
): SummaryTableRow[] {
  return [
    {
      metric: "Governance Score",
      currentValue: country.governance?.strategic_capacity_score 
        ? `${country.governance.strategic_capacity_score.toFixed(0)}%` 
        : "N/A",
      comparisonValue: comparisonCountry?.governance?.strategic_capacity_score
        ? `${comparisonCountry.governance.strategic_capacity_score.toFixed(0)}%`
        : "N/A",
      globalValue: globalAverages.governance ? `${globalAverages.governance.toFixed(0)}%` : "N/A",
    },
    {
      metric: "Fatal Accident Rate",
      currentValue: country.pillar_1_hazard?.fatal_accident_rate
        ? country.pillar_1_hazard.fatal_accident_rate.toFixed(1)
        : "N/A",
      comparisonValue: comparisonCountry?.pillar_1_hazard?.fatal_accident_rate
        ? comparisonCountry.pillar_1_hazard.fatal_accident_rate.toFixed(1)
        : "N/A",
      globalValue: globalAverages.fatalRate ? globalAverages.fatalRate.toFixed(1) : "N/A",
      lowerIsBetter: true,
    },
    {
      metric: "Inspector Density",
      currentValue: country.governance?.inspector_density
        ? country.governance.inspector_density.toFixed(2)
        : "N/A",
      comparisonValue: comparisonCountry?.governance?.inspector_density
        ? comparisonCountry.governance.inspector_density.toFixed(2)
        : "N/A",
      globalValue: globalAverages.inspectorDensity ? globalAverages.inspectorDensity.toFixed(2) : "N/A",
    },
    {
      metric: "OHI Score",
      currentValue: country.maturity_score
        ? country.maturity_score.toFixed(1)
        : "N/A",
      comparisonValue: comparisonCountry?.maturity_score
        ? comparisonCountry.maturity_score.toFixed(1)
        : "N/A",
      globalValue: globalAverages.ohiScore ? globalAverages.ohiScore.toFixed(1) : "N/A",
    },
    {
      metric: "Rehab Access",
      currentValue: country.pillar_3_restoration?.rehab_access_score
        ? `${country.pillar_3_restoration.rehab_access_score.toFixed(0)}/100`
        : "N/A",
      comparisonValue: comparisonCountry?.pillar_3_restoration?.rehab_access_score
        ? `${comparisonCountry.pillar_3_restoration.rehab_access_score.toFixed(0)}/100`
        : "N/A",
      globalValue: globalAverages.rehabAccess ? `${globalAverages.rehabAccess.toFixed(0)}/100` : "N/A",
    },
  ];
}

/**
 * Calculate global averages from all countries
 */
export function calculateGlobalAverages(countries: Country[]): Record<string, number> {
  const validGov = countries.filter(c => c.governance?.strategic_capacity_score != null);
  const validFatal = countries.filter(c => c.pillar_1_hazard?.fatal_accident_rate != null);
  const validInspector = countries.filter(c => c.governance?.inspector_density != null);
  const validOHI = countries.filter(c => c.maturity_score != null);
  const validRehab = countries.filter(c => c.pillar_3_restoration?.rehab_access_score != null);

  return {
    governance: validGov.length > 0
      ? validGov.reduce((a, c) => a + (c.governance?.strategic_capacity_score ?? 0), 0) / validGov.length
      : 0,
    fatalRate: validFatal.length > 0
      ? validFatal.reduce((a, c) => a + (c.pillar_1_hazard?.fatal_accident_rate ?? 0), 0) / validFatal.length
      : 0,
    inspectorDensity: validInspector.length > 0
      ? validInspector.reduce((a, c) => a + (c.governance?.inspector_density ?? 0), 0) / validInspector.length
      : 0,
    ohiScore: validOHI.length > 0
      ? validOHI.reduce((a, c) => a + (c.maturity_score ?? 0), 0) / validOHI.length
      : 0,
    rehabAccess: validRehab.length > 0
      ? validRehab.reduce((a, c) => a + (c.pillar_3_restoration?.rehab_access_score ?? 0), 0) / validRehab.length
      : 0,
  };
}
