/**
 * Arthur D. Little - Global Health Platform
 * Architecture Definitions
 * 
 * ILO-based component structures for each framework pillar.
 * These define the architecture maps showing what infrastructure
 * is needed to deliver occupational health outcomes.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ArchitectureComponent {
  id: string;
  name: string;
  description: string;
  dataField: string | null;  // Maps to country data field
  scoreType: "boolean" | "percentage" | "enum" | "number" | "derived";
  enumValues?: string[];  // For enum type
  thresholds: {
    complete: number;  // >= this is green
    partial: number;   // >= this is yellow, below is red
  };
  subQuestions: string[];  // "Who pays?", "Who operates?"
}

export interface ArchitectureSection {
  id: string;
  name: string;
  description: string;
  components: ArchitectureComponent[];
  isChain?: boolean;  // If true, display as a flow/chain
}

export interface PillarArchitecture {
  pillarId: string;
  name: string;
  description: string;
  color: string;
  sections: ArchitectureSection[];
}

// ============================================================================
// GOVERNANCE ARCHITECTURE
// ============================================================================

export const GOVERNANCE_ARCHITECTURE: PillarArchitecture = {
  pillarId: "governance",
  name: "Governance Architecture",
  description: "Strategic capacity and institutional framework for OH",
  color: "purple",
  sections: [
    {
      id: "international",
      name: "International Alignment",
      description: "ILO conventions and international standards",
      components: [
        {
          id: "ilo_c187",
          name: "ILO C187 Ratification",
          description: "Promotional Framework for Occupational Safety and Health",
          dataField: "ilo_c187_status",
          scoreType: "boolean",
          thresholds: { complete: 1, partial: 0 },
          subQuestions: ["Year ratified", "Implementation status"],
        },
        {
          id: "ilo_c155",
          name: "ILO C155 Ratification",
          description: "Occupational Safety and Health Convention",
          dataField: "ilo_c155_status",
          scoreType: "boolean",
          thresholds: { complete: 1, partial: 0 },
          subQuestions: ["Year ratified", "Implementation status"],
        },
      ],
    },
    {
      id: "institutional",
      name: "Institutional Capacity",
      description: "Enforcement and regulatory infrastructure",
      components: [
        {
          id: "inspector_density",
          name: "Inspector Density",
          description: "Labor inspectors per 10,000 workers (ILO: 1.0 recommended)",
          dataField: "inspector_density",
          scoreType: "number",
          thresholds: { complete: 1.0, partial: 0.5 },
          subQuestions: ["Total inspectors", "Coverage by sector"],
        },
        {
          id: "strategic_capacity",
          name: "Strategic Capacity Score",
          description: "Overall governance effectiveness index",
          dataField: "strategic_capacity_score",
          scoreType: "percentage",
          thresholds: { complete: 70, partial: 40 },
          subQuestions: ["Key agencies", "Budget allocation"],
        },
      ],
    },
    {
      id: "policy",
      name: "Policy Framework",
      description: "Laws and policy instruments",
      components: [
        {
          id: "mental_health",
          name: "Mental Health Policy",
          description: "Workplace mental health legislation exists",
          dataField: "mental_health_policy",
          scoreType: "boolean",
          thresholds: { complete: 1, partial: 0 },
          subQuestions: ["Coverage scope", "Enforcement mechanism"],
        },
      ],
    },
  ],
};

// ============================================================================
// HAZARD CONTROL ARCHITECTURE (PILLAR 1)
// ============================================================================

export const HAZARD_CONTROL_ARCHITECTURE: PillarArchitecture = {
  pillarId: "hazard-control",
  name: "Hazard Control Architecture",
  description: "Prevention and risk management infrastructure",
  color: "blue",
  sections: [
    {
      id: "standards",
      name: "Exposure Standards",
      description: "Occupational exposure limits and regulations",
      components: [
        {
          id: "oel_compliance",
          name: "OEL Compliance",
          description: "Compliance with Occupational Exposure Limits",
          dataField: "oel_compliance_pct",
          scoreType: "percentage",
          thresholds: { complete: 80, partial: 50 },
          subQuestions: ["Chemical coverage", "Enforcement rate"],
        },
        {
          id: "heat_stress",
          name: "Heat Stress Regulation",
          description: "Regulatory approach to heat exposure",
          dataField: "heat_stress_reg_type",
          scoreType: "enum",
          enumValues: ["Mandatory", "Advisory", "None"],
          thresholds: { complete: 100, partial: 50 },
          subQuestions: ["Threshold limits", "Industry coverage"],
        },
      ],
    },
    {
      id: "monitoring",
      name: "Exposure Monitoring",
      description: "Hazard tracking and measurement",
      components: [
        {
          id: "carcinogen_exposure",
          name: "Carcinogen Exposure Rate",
          description: "Percentage of workers exposed to carcinogens",
          dataField: "carcinogen_exposure_pct",
          scoreType: "percentage",
          thresholds: { complete: 5, partial: 15 },  // Lower is better
          subQuestions: ["Main carcinogens", "High-risk sectors"],
        },
        {
          id: "nihl_rate",
          name: "Noise-Induced Hearing Loss",
          description: "NIHL prevalence rate",
          dataField: "nihl_rate",
          scoreType: "percentage",
          thresholds: { complete: 5, partial: 15 },  // Lower is better
          subQuestions: ["Screening programs", "PPE requirements"],
        },
      ],
    },
    {
      id: "prevention",
      name: "Prevention Systems",
      description: "Proactive safety measures",
      components: [
        {
          id: "control_maturity",
          name: "Control Maturity Score",
          description: "Overall hazard control effectiveness",
          dataField: "control_maturity_score",
          scoreType: "percentage",
          thresholds: { complete: 70, partial: 40 },
          subQuestions: ["Risk assessment coverage", "Improvement trends"],
        },
        {
          id: "safety_training",
          name: "Safety Training Hours",
          description: "Average annual training hours per worker",
          dataField: "safety_training_hours",
          scoreType: "number",
          thresholds: { complete: 16, partial: 8 },
          subQuestions: ["Mandatory vs voluntary", "Certification requirements"],
        },
      ],
    },
    {
      id: "outcomes",
      name: "Safety Outcomes",
      description: "Accident and injury rates",
      components: [
        {
          id: "fatal_rate",
          name: "Fatal Accident Rate",
          description: "Fatalities per 100,000 workers (lower is better)",
          dataField: "fatal_accident_rate",
          scoreType: "number",
          thresholds: { complete: 1.5, partial: 4.0 },  // Lower is better
          subQuestions: ["Trend direction", "High-risk sectors"],
        },
      ],
    },
  ],
};

// ============================================================================
// VIGILANCE ARCHITECTURE (PILLAR 2)
// ============================================================================

export const VIGILANCE_ARCHITECTURE: PillarArchitecture = {
  pillarId: "vigilance",
  name: "Vigilance Architecture",
  description: "Health surveillance and disease detection infrastructure",
  color: "teal",
  sections: [
    {
      id: "surveillance",
      name: "Surveillance System",
      description: "Approach to health monitoring",
      components: [
        {
          id: "surveillance_logic",
          name: "Surveillance Approach",
          description: "System logic: Risk-Based, Mandatory, or None",
          dataField: "surveillance_logic",
          scoreType: "enum",
          enumValues: ["Risk-Based", "Mandatory", "None"],
          thresholds: { complete: 100, partial: 50 },
          subQuestions: ["Coverage scope", "Frequency requirements"],
        },
        {
          id: "disease_reporting",
          name: "Disease Reporting Rate",
          description: "Occupational disease reporting compliance",
          dataField: "occupational_disease_reporting_rate",
          scoreType: "percentage",
          thresholds: { complete: 80, partial: 40 },
          subQuestions: ["Reporting mechanism", "Disease registry"],
        },
      ],
    },
    {
      id: "detection",
      name: "Detection Capacity",
      description: "Screening and diagnostic programs",
      components: [
        {
          id: "disease_detection",
          name: "Disease Detection Rate",
          description: "Detection rate for occupational diseases",
          dataField: "disease_detection_rate",
          scoreType: "percentage",
          thresholds: { complete: 70, partial: 40 },
          subQuestions: ["Screening programs", "Diagnostic capacity"],
        },
        {
          id: "lead_screening",
          name: "Lead Screening Rate",
          description: "Blood lead screening coverage",
          dataField: "lead_screening_rate",
          scoreType: "percentage",
          thresholds: { complete: 80, partial: 40 },
          subQuestions: ["High-risk worker coverage", "Follow-up protocols"],
        },
      ],
    },
    {
      id: "vulnerable",
      name: "Vulnerable Populations",
      description: "Tracking at-risk worker groups",
      components: [
        {
          id: "vulnerability_index",
          name: "Vulnerability Index",
          description: "Composite vulnerability measure",
          dataField: "vulnerability_index",
          scoreType: "percentage",
          thresholds: { complete: 30, partial: 60 },  // Lower is better
          subQuestions: ["Key vulnerable groups", "Protection programs"],
        },
        {
          id: "migrant_workers",
          name: "Migrant Worker Coverage",
          description: "Percentage of migrant workers in workforce",
          dataField: "migrant_worker_pct",
          scoreType: "percentage",
          thresholds: { complete: 100, partial: 50 },  // Higher awareness is better
          subQuestions: ["Legal protections", "Access to services"],
        },
      ],
    },
  ],
};

// ============================================================================
// RESTORATION ARCHITECTURE (PILLAR 3) - ILO-Based
// ============================================================================

export const RESTORATION_ARCHITECTURE: PillarArchitecture = {
  pillarId: "restoration",
  name: "Restoration Architecture",
  description: "Compensation and rehabilitation infrastructure based on ILO standards",
  color: "amber",
  sections: [
    {
      id: "payer",
      name: "Payer Architecture",
      description: "Who pays for workers' compensation and how",
      components: [
        {
          id: "payer_mechanism",
          name: "Payer Mechanism",
          description: "Primary compensation funding model",
          dataField: "payer_mechanism",
          scoreType: "enum",
          enumValues: ["No-Fault", "Social Insurance", "Litigation", "Mixed", "Out-of-Pocket"],
          thresholds: { complete: 100, partial: 50 },
          subQuestions: ["Who pays premiums?", "Coverage scope", "Benefit levels"],
        },
        {
          id: "claims_process",
          name: "Claims Settlement",
          description: "Average days to settle compensation claims",
          dataField: "avg_claim_settlement_days",
          scoreType: "number",
          thresholds: { complete: 30, partial: 90 },  // Lower is better
          subQuestions: ["Filing process", "Appeal mechanism", "Payment timeline"],
        },
      ],
    },
    {
      id: "legal",
      name: "Legal Framework",
      description: "Laws supporting worker recovery",
      components: [
        {
          id: "reintegration_law",
          name: "Reintegration Law",
          description: "Mandatory return-to-work legislation exists",
          dataField: "reintegration_law",
          scoreType: "boolean",
          thresholds: { complete: 1, partial: 0 },
          subQuestions: ["Employer obligations", "Worker rights", "Enforcement"],
        },
      ],
    },
    {
      id: "rehab_chain",
      name: "Rehabilitation Chain",
      description: "Journey from accident to full recovery",
      isChain: true,
      components: [
        {
          id: "acute_care",
          name: "Acute Care",
          description: "Immediate medical treatment",
          dataField: null,  // Derived
          scoreType: "derived",
          thresholds: { complete: 70, partial: 40 },
          subQuestions: ["Who pays?", "Who provides?", "Access time"],
        },
        {
          id: "medical_rehab",
          name: "Medical Rehabilitation",
          description: "Physical and occupational therapy",
          dataField: "rehab_access_score",
          scoreType: "percentage",
          thresholds: { complete: 70, partial: 40 },
          subQuestions: ["Who pays?", "Provider network", "Duration limits"],
        },
        {
          id: "vocational_rehab",
          name: "Vocational Rehabilitation",
          description: "Job retraining and skills development",
          dataField: "rehab_participation_rate",
          scoreType: "percentage",
          thresholds: { complete: 60, partial: 30 },
          subQuestions: ["Who pays?", "Program types", "Success metrics"],
        },
        {
          id: "social_reintegration",
          name: "Social Reintegration",
          description: "Return to work and community",
          dataField: "return_to_work_success_pct",
          scoreType: "percentage",
          thresholds: { complete: 70, partial: 50 },
          subQuestions: ["Workplace adaptations", "Support services", "Follow-up"],
        },
      ],
    },
    {
      id: "outcomes",
      name: "Recovery Outcomes",
      description: "System effectiveness measures",
      components: [
        {
          id: "rtw_success",
          name: "RTW Success Rate",
          description: "Successful return-to-work percentage",
          dataField: "return_to_work_success_pct",
          scoreType: "percentage",
          thresholds: { complete: 70, partial: 50 },
          subQuestions: ["Measurement method", "Follow-up period"],
        },
        {
          id: "sickness_absence",
          name: "Sickness Absence Days",
          description: "Average days lost per worker per year",
          dataField: "sickness_absence_days",
          scoreType: "number",
          thresholds: { complete: 5, partial: 12 },  // Lower is better
          subQuestions: ["Tracking method", "Trend direction"],
        },
      ],
    },
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

export const ALL_ARCHITECTURES: Record<string, PillarArchitecture> = {
  governance: GOVERNANCE_ARCHITECTURE,
  "hazard-control": HAZARD_CONTROL_ARCHITECTURE,
  vigilance: VIGILANCE_ARCHITECTURE,
  restoration: RESTORATION_ARCHITECTURE,
};

export function getArchitecture(pillarId: string): PillarArchitecture | null {
  return ALL_ARCHITECTURES[pillarId] ?? null;
}

export function getAllComponents(pillarId: string): ArchitectureComponent[] {
  const arch = getArchitecture(pillarId);
  if (!arch) return [];
  return arch.sections.flatMap(s => s.components);
}
