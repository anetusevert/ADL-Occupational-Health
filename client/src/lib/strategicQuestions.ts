/**
 * Arthur D. Little - Global Health Platform
 * Strategic Questions Framework
 * 
 * Defines the 4 key strategic questions for each pillar
 * that a management consultant would ask to assess a country's
 * occupational health system.
 */

import { Crown, Shield, Eye, HeartPulse, type LucideIcon } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export type PillarId = "governance" | "hazard-control" | "vigilance" | "restoration";

export interface StrategicQuestion {
  id: string;
  title: string;
  question: string;
  description: string;
  dataFields: string[];  // Database fields relevant to this question
  researchTopics: string[];  // Topics for web research
  assessmentCriteria: {
    complete: string;
    partial: string;
    gap: string;
  };
}

export interface PillarDefinition {
  id: PillarId;
  name: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  scoreField: string;
  questions: StrategicQuestion[];
}

// ============================================================================
// GOVERNANCE QUESTIONS
// ============================================================================

const GOVERNANCE_QUESTIONS: StrategicQuestion[] = [
  {
    id: "legal-foundation",
    title: "Legal Foundation",
    question: "Does the country have comprehensive OH legislation aligned with ILO conventions?",
    description: "Assesses the legal and regulatory framework underpinning occupational health, including ratification of key ILO conventions and national legislation.",
    dataFields: [
      "ilo_c155_status",
      "ilo_c187_status",
      "ilo_c161_status",
      "national_oh_law_exists",
      "oh_law_year",
    ],
    researchTopics: [
      "ILO convention ratification status",
      "National occupational health legislation",
      "Recent legal reforms in OH",
      "Regulatory framework coverage",
    ],
    assessmentCriteria: {
      complete: "Comprehensive OH legislation with ILO C155 and C187 ratified, regularly updated legal framework",
      partial: "Basic legislation exists but missing key ILO ratifications or outdated provisions",
      gap: "No dedicated OH legislation or major gaps in legal framework",
    },
  },
  {
    id: "institutional-architecture",
    title: "Institutional Architecture",
    question: "Are there dedicated institutions with clear mandates for OH policy and enforcement?",
    description: "Evaluates the presence and effectiveness of institutions responsible for occupational health governance, including ministries, agencies, and tripartite bodies.",
    dataFields: [
      "oh_authority_exists",
      "tripartite_body_exists",
      "strategic_capacity_score",
      "governance_score",
    ],
    researchTopics: [
      "Ministry of Labor structure",
      "Occupational health authority mandate",
      "Tripartite consultation mechanisms",
      "Institutional coordination",
    ],
    assessmentCriteria: {
      complete: "Dedicated OH authority with clear mandate, functional tripartite bodies, strong inter-agency coordination",
      partial: "OH functions exist but fragmented across agencies or weak coordination",
      gap: "No dedicated OH institution or unclear mandates",
    },
  },
  {
    id: "enforcement-capacity",
    title: "Enforcement Capacity",
    question: "Does the country have sufficient inspection resources to enforce OH standards?",
    description: "Measures the capacity of labor inspection services to effectively enforce occupational health regulations across all sectors.",
    dataFields: [
      "inspector_density",
      "inspection_coverage",
      "penalty_framework_exists",
      "enforcement_score",
    ],
    researchTopics: [
      "Labor inspector to worker ratio",
      "Inspection frequency and coverage",
      "Enforcement mechanisms and penalties",
      "Inspector training programs",
    ],
    assessmentCriteria: {
      complete: "ILO-recommended inspector ratio (1:10,000), comprehensive coverage, effective penalties",
      partial: "Below-target inspector ratio or limited sector coverage",
      gap: "Severe inspector shortage or minimal enforcement activity",
    },
  },
  {
    id: "strategic-planning",
    title: "Strategic Planning",
    question: "Is there a current national OH strategy with measurable targets?",
    description: "Assesses whether the country has a coherent national strategy for occupational health with clear objectives, timelines, and monitoring mechanisms.",
    dataFields: [
      "national_oh_policy_exists",
      "oh_action_plan_exists",
      "oh_targets_defined",
      "reporting_mechanism_exists",
    ],
    researchTopics: [
      "National occupational health policy",
      "OH action plans and strategies",
      "Target setting and monitoring",
      "Progress reporting mechanisms",
    ],
    assessmentCriteria: {
      complete: "Current national OH strategy with measurable targets, regular progress reporting",
      partial: "Strategy exists but outdated or lacks measurable targets",
      gap: "No national OH strategy or policy framework",
    },
  },
];

// ============================================================================
// HAZARD CONTROL QUESTIONS
// ============================================================================

const HAZARD_CONTROL_QUESTIONS: StrategicQuestion[] = [
  {
    id: "exposure-standards",
    title: "Exposure Standards",
    question: "Are occupational exposure limits set and enforced for key hazards?",
    description: "Evaluates the comprehensiveness of occupational exposure limits (OELs) and their enforcement, particularly for carcinogens and high-risk substances.",
    dataFields: [
      "oel_coverage_score",
      "carcinogen_regulation_score",
      "chemical_safety_score",
      "hazard_registry_exists",
    ],
    researchTopics: [
      "Occupational exposure limits database",
      "Carcinogen regulations",
      "Chemical safety standards",
      "Hazardous substance controls",
    ],
    assessmentCriteria: {
      complete: "Comprehensive OELs aligned with international standards, strong carcinogen controls",
      partial: "OELs exist for major hazards but gaps in coverage or enforcement",
      gap: "Limited or no OEL framework, weak hazard controls",
    },
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment Systems",
    question: "Is workplace risk assessment mandatory and systematically implemented?",
    description: "Assesses whether risk assessment is legally required and effectively implemented across different workplace sizes and sectors.",
    dataFields: [
      "risk_assessment_mandatory",
      "risk_assessment_coverage",
      "sme_compliance_rate",
      "sector_coverage_score",
    ],
    researchTopics: [
      "Workplace risk assessment requirements",
      "Implementation rates by sector",
      "SME compliance challenges",
      "Risk assessment methodologies",
    ],
    assessmentCriteria: {
      complete: "Mandatory risk assessment with high compliance rates across all sectors",
      partial: "Legal requirement exists but low compliance, especially in SMEs",
      gap: "No mandatory risk assessment or minimal implementation",
    },
  },
  {
    id: "prevention-infrastructure",
    title: "Prevention Infrastructure",
    question: "Are prevention services available and accessible to all workplaces?",
    description: "Evaluates the availability and accessibility of occupational health services, particularly for small and medium enterprises.",
    dataFields: [
      "oh_service_coverage",
      "sme_access_score",
      "prevention_funding_score",
      "oh_professional_density",
    ],
    researchTopics: [
      "Occupational health service coverage",
      "SME access to OH services",
      "Prevention service funding",
      "OH professional availability",
    ],
    assessmentCriteria: {
      complete: "Universal access to OH services including SMEs, adequate prevention funding",
      partial: "Services available for large enterprises but limited SME access",
      gap: "Very limited OH service infrastructure or accessibility",
    },
  },
  {
    id: "safety-outcomes",
    title: "Safety Outcomes",
    question: "What is the country's performance on preventing workplace injuries and fatalities?",
    description: "Measures actual safety outcomes including fatal and non-fatal injury rates, trends over time, and sector-specific performance.",
    dataFields: [
      "fatal_accident_rate",
      "injury_rate",
      "injury_trend_5yr",
      "high_risk_sector_rate",
    ],
    researchTopics: [
      "Workplace fatality statistics",
      "Injury rate trends",
      "Sector-specific safety data",
      "International comparisons",
    ],
    assessmentCriteria: {
      complete: "Low fatality rates with improving trends, strong performance across sectors",
      partial: "Moderate rates with mixed trends or sector disparities",
      gap: "High fatality rates or worsening trends",
    },
  },
];

// ============================================================================
// VIGILANCE QUESTIONS
// ============================================================================

const VIGILANCE_QUESTIONS: StrategicQuestion[] = [
  {
    id: "surveillance-architecture",
    title: "Surveillance Architecture",
    question: "Is there a systematic approach to detecting and recording occupational diseases?",
    description: "Assesses the infrastructure for occupational disease surveillance, including notification systems, registries, and diagnostic capacity.",
    dataFields: [
      "disease_notification_system",
      "od_registry_exists",
      "diagnostic_capacity_score",
      "surveillance_coverage_score",
    ],
    researchTopics: [
      "Occupational disease notification systems",
      "Disease registry infrastructure",
      "Diagnostic laboratory capacity",
      "Surveillance system design",
    ],
    assessmentCriteria: {
      complete: "Comprehensive notification system with national registry and adequate diagnostic capacity",
      partial: "Basic notification exists but fragmented or incomplete coverage",
      gap: "No systematic surveillance or major infrastructure gaps",
    },
  },
  {
    id: "detection-capacity",
    title: "Detection Capacity",
    question: "How effectively are occupational diseases identified and attributed to work?",
    description: "Evaluates the ability to correctly identify and attribute diseases to occupational causes, including physician training and compensation claim patterns.",
    dataFields: [
      "disease_recognition_rate",
      "physician_training_score",
      "compensation_claim_rate",
      "underreporting_estimate",
    ],
    researchTopics: [
      "Occupational disease recognition rates",
      "Physician training in occupational medicine",
      "Compensation claim patterns",
      "Underreporting challenges",
    ],
    assessmentCriteria: {
      complete: "High recognition rates with trained physicians and appropriate claim volumes",
      partial: "Recognition capacity exists but significant underreporting",
      gap: "Very low recognition rates or severe underreporting",
    },
  },
  {
    id: "data-quality",
    title: "Data Quality",
    question: "Is OH surveillance data comprehensive, reliable, and used for policy?",
    description: "Assesses the quality, completeness, and policy relevance of occupational health surveillance data.",
    dataFields: [
      "data_completeness_score",
      "reporting_rate",
      "data_policy_integration",
      "data_publication_regular",
    ],
    researchTopics: [
      "Data completeness assessments",
      "Reporting compliance rates",
      "Evidence-based policy making",
      "Data publication practices",
    ],
    assessmentCriteria: {
      complete: "High-quality data regularly published and integrated into policy decisions",
      partial: "Data available but quality concerns or limited policy use",
      gap: "Poor data quality or minimal policy relevance",
    },
  },
  {
    id: "vulnerable-populations",
    title: "Vulnerable Populations",
    question: "Are high-risk and informal sector workers adequately monitored?",
    description: "Evaluates surveillance coverage of vulnerable worker populations including informal sector, migrant workers, and high-risk industries.",
    dataFields: [
      "informal_sector_coverage",
      "migrant_worker_inclusion",
      "high_risk_sector_monitoring",
      "vulnerability_index",
    ],
    researchTopics: [
      "Informal economy worker health",
      "Migrant worker health monitoring",
      "High-risk sector surveillance",
      "Vulnerable population programs",
    ],
    assessmentCriteria: {
      complete: "Comprehensive coverage including informal and migrant workers",
      partial: "Formal sector coverage good but gaps in vulnerable populations",
      gap: "Major surveillance gaps for vulnerable populations",
    },
  },
];

// ============================================================================
// RESTORATION QUESTIONS
// ============================================================================

const RESTORATION_QUESTIONS: StrategicQuestion[] = [
  {
    id: "payer-architecture",
    title: "Payer Architecture",
    question: "Who finances workplace injury and disease compensation, and is coverage universal?",
    description: "Assesses the structure and coverage of workers' compensation systems, including funding mechanisms and coverage gaps.",
    dataFields: [
      "compensation_system_type",
      "coverage_rate",
      "funding_mechanism",
      "employer_contribution_rate",
    ],
    researchTopics: [
      "Workers compensation system design",
      "Coverage rates and gaps",
      "Funding mechanisms",
      "System sustainability",
    ],
    assessmentCriteria: {
      complete: "Universal coverage with sustainable funding and clear accountability",
      partial: "System exists but coverage gaps, especially for informal workers",
      gap: "Limited coverage or unsustainable funding model",
    },
  },
  {
    id: "benefit-adequacy",
    title: "Benefit Adequacy",
    question: "Are compensation benefits sufficient to maintain living standards during recovery?",
    description: "Evaluates whether compensation benefits adequately support injured workers through income replacement, medical coverage, and permanent disability provisions.",
    dataFields: [
      "wage_replacement_rate",
      "medical_coverage_score",
      "permanent_disability_provision",
      "benefit_adequacy_score",
    ],
    researchTopics: [
      "Wage replacement rates",
      "Medical benefit coverage",
      "Permanent disability provisions",
      "Benefit adequacy studies",
    ],
    assessmentCriteria: {
      complete: "Adequate wage replacement (≥70%), comprehensive medical coverage, fair disability provisions",
      partial: "Basic benefits but inadequate replacement rates or coverage gaps",
      gap: "Very low benefits or major coverage exclusions",
    },
  },
  {
    id: "rehabilitation-chain",
    title: "Rehabilitation Chain",
    question: "Is there an integrated pathway from injury through treatment to return-to-work?",
    description: "Assesses the continuity and integration of rehabilitation services from initial injury through full recovery and return to employment.",
    dataFields: [
      "rehabilitation_service_access",
      "rtw_program_exists",
      "case_management_score",
      "rehab_integration_score",
    ],
    researchTopics: [
      "Rehabilitation service availability",
      "Return-to-work programs",
      "Case management practices",
      "Rehabilitation pathway integration",
    ],
    assessmentCriteria: {
      complete: "Integrated rehabilitation pathway with case management and RTW support",
      partial: "Rehabilitation available but fragmented or limited RTW support",
      gap: "Minimal rehabilitation services or no coordinated pathway",
    },
  },
  {
    id: "recovery-outcomes",
    title: "Recovery Outcomes",
    question: "What percentage of injured workers successfully return to productive employment?",
    description: "Measures actual recovery outcomes including return-to-work rates, time to return, and sustained employment.",
    dataFields: [
      "rtw_rate",
      "time_to_return",
      "sustained_employment_rate",
      "outcome_tracking_exists",
    ],
    researchTopics: [
      "Return-to-work statistics",
      "Recovery outcome measures",
      "Long-term employment outcomes",
      "Best practice RTW programs",
    ],
    assessmentCriteria: {
      complete: "High RTW rates (≥80%) with sustained employment and outcome tracking",
      partial: "Moderate RTW rates or limited outcome tracking",
      gap: "Low RTW rates or no systematic outcome measurement",
    },
  },
];

// ============================================================================
// PILLAR DEFINITIONS
// ============================================================================

export const PILLAR_DEFINITIONS: Record<PillarId, PillarDefinition> = {
  governance: {
    id: "governance",
    name: "Governance",
    subtitle: "Strategic Capacity",
    description: "Establishes comprehensive legal and institutional framework for occupational health",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    scoreField: "governance_score",
    questions: GOVERNANCE_QUESTIONS,
  },
  "hazard-control": {
    id: "hazard-control",
    name: "Hazard Control",
    subtitle: "Prevention & Risk",
    description: "Prevents workplace injuries and illnesses through systematic hazard control",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    scoreField: "pillar1_score",
    questions: HAZARD_CONTROL_QUESTIONS,
  },
  vigilance: {
    id: "vigilance",
    name: "Vigilance",
    subtitle: "Surveillance & Detection",
    description: "Detects and monitors occupational diseases through systematic surveillance",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    scoreField: "pillar2_score",
    questions: VIGILANCE_QUESTIONS,
  },
  restoration: {
    id: "restoration",
    name: "Restoration",
    subtitle: "Compensation & Recovery",
    description: "Ensures injured workers receive adequate compensation and rehabilitation",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    scoreField: "pillar3_score",
    questions: RESTORATION_QUESTIONS,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPillarDefinition(pillarId: string): PillarDefinition | null {
  return PILLAR_DEFINITIONS[pillarId as PillarId] || null;
}

export function getPillarQuestions(pillarId: string): StrategicQuestion[] {
  return PILLAR_DEFINITIONS[pillarId as PillarId]?.questions || [];
}

export function getQuestionById(pillarId: string, questionId: string): StrategicQuestion | null {
  const questions = getPillarQuestions(pillarId);
  return questions.find(q => q.id === questionId) || null;
}

export function getAllPillars(): PillarDefinition[] {
  return Object.values(PILLAR_DEFINITIONS);
}
