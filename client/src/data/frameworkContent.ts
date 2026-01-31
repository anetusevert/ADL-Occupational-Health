/**
 * GOHIP Platform - ADL Occupational Health Framework
 * Framework Content Data Definition
 * 
 * Phase 6: Interactive Framework Visualization
 */

import type { LucideIcon } from "lucide-react";
import { Crown, Shield, Eye, Heart } from "lucide-react";

export interface ScoringCriteria {
  level: string;
  score: string;
  description: string;
}

export interface FrameworkBlock {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  icon: LucideIcon;
  description: string;
  relevance: string;
  dataSources: string[];
  keyMetrics: string[];
  // Extended detail fields
  coreObjective: string;
  keyQuestions: string[];
  bestPracticeExamples: { country: string; practice: string }[];
  commonChallenges: string[];
  scoringCriteria: ScoringCriteria[];
  interactionWithOtherPillars: string;
}

export interface FrameworkData {
  governance: FrameworkBlock;
  pillars: FrameworkBlock[];
}

/**
 * The ADL Occupational Health Framework
 * Visual "Temple" Structure:
 * - Roof: Governance (Overarching Driver)
 * - Columns: 3 Operational Pillars (Hazard, Vigilance, Restoration)
 */
export const frameworkContent: FrameworkData = {
  governance: {
    id: "governance",
    title: "Governance Ecosystem",
    subtitle: "The Overarching Driver",
    color: "purple",
    gradientFrom: "from-purple-500/30",
    gradientTo: "to-purple-600/10",
    glowColor: "shadow-purple-500/30",
    icon: Crown,
    description:
      "The brain and law that drives the entire occupational health system. This layer establishes the regulatory framework, enforcement mechanisms, and institutional capacity that make everything else possible. Without strong governance, all other pillars operate in a vacuum of accountability.",
    relevance:
      "Without enforcement, rules are just paper. This layer defines the culture of workplace safety and determines whether organizations treat OH as a compliance checkbox or a core value. Strong governance correlates directly with lower fatality rates and better health outcomes.",
    coreObjective:
      "Establish a comprehensive legal and institutional framework that mandates, monitors, and enforces occupational health standards across all sectors of the economy.",
    keyQuestions: [
      "Has the country ratified ILO Convention C187 (Promotional Framework for OSH)?",
      "What is the ratio of labor inspectors to workers?",
      "Are there legal protections for whistleblowers reporting safety violations?",
      "Does a tripartite body (government, employers, workers) oversee OH policy?",
      "What percentage of the national budget is allocated to OH enforcement?",
    ],
    bestPracticeExamples: [
      {
        country: "Germany",
        practice: "Berufsgenossenschaften (BGs) - sector-specific insurance associations that combine prevention, insurance, and rehabilitation under one roof with employer funding.",
      },
      {
        country: "Sweden",
        practice: "Strong tripartite cooperation through the Swedish Work Environment Authority with legally mandated worker safety representatives in every workplace.",
      },
      {
        country: "Singapore",
        practice: "Workplace Safety and Health Act with escalating penalties and a 'Name and Shame' public registry for repeat offenders.",
      },
    ],
    commonChallenges: [
      "Informal economy workers fall outside regulatory coverage",
      "Insufficient inspector numbers to cover all workplaces (ILO recommends 1:10,000)",
      "Weak penalty enforcement - fines too low to deter violations",
      "Fragmented responsibility across multiple government agencies",
      "Lack of political will to prioritize OH over economic growth",
    ],
    scoringCriteria: [
      { level: "Leading (76-100)", score: "76-100", description: "C187 ratified, inspector ratio >1:10,000, strong whistleblower laws, active tripartite body, >0.1% GDP on enforcement" },
      { level: "Advancing (51-75)", score: "51-75", description: "C187 ratified, inspector ratio 1:15,000-1:10,000, basic whistleblower protection, functioning tripartite consultation" },
      { level: "Developing (26-50)", score: "26-50", description: "Basic OSH law exists, inspector ratio <1:15,000, limited enforcement capacity, informal sector largely uncovered" },
      { level: "Critical (0-25)", score: "0-25", description: "No comprehensive OSH law, minimal inspection capacity, no whistleblower protection, governance fragmented or absent" },
    ],
    interactionWithOtherPillars:
      "Governance is the enabler of all other pillars. Without legal mandates, prevention programs are voluntary. Without enforcement, surveillance data has no consequences. Without regulatory backing, compensation systems lack teeth. Strong governance creates the accountability loop that makes the entire framework functional.",
    dataSources: [
      "ILO Convention C187 Ratification Status",
      "Inspector Density per 10,000 Workers (ILOSTAT)",
      "Whistleblower Protection Index",
      "Regulatory Enforcement Budget (% GDP)",
      "Tripartite Consultation Mechanisms",
    ],
    keyMetrics: [
      "C187 Ratification",
      "Inspector Coverage Ratio",
      "Enforcement Actions/Year",
      "Penalty Collection Rate",
    ],
  },

  pillars: [
    {
      id: "pillar-1",
      title: "Hazard Prevention",
      subtitle: "Pillar I — Prevention",
      color: "blue",
      gradientFrom: "from-blue-500/30",
      gradientTo: "to-blue-600/10",
      glowColor: "shadow-blue-500/30",
      icon: Shield,
      description:
        "The proactive shield against workplace dangers. This pillar focuses on identifying, assessing, and eliminating hazards before they cause harm. It encompasses exposure limits, safety training, equipment standards, and risk assessment protocols that form the first line of defense.",
      relevance:
        "Prevention is exponentially more cost-effective than treatment. Every dollar invested in hazard prevention saves $4-6 in downstream healthcare costs and lost productivity. This pillar transforms safety from reactive firefighting to strategic risk management.",
      coreObjective:
        "Systematically identify, assess, and eliminate or control workplace hazards before they cause injury or illness, using the hierarchy of controls (elimination > substitution > engineering > administrative > PPE).",
      keyQuestions: [
        "Are Occupational Exposure Limits (OELs) legally established for major hazardous substances?",
        "What percentage of workers receive mandatory safety training annually?",
        "Are employers legally required to conduct and document risk assessments?",
        "Is there a national registry of hazardous substances used in workplaces?",
        "What is the PPE compliance rate in high-risk industries?",
      ],
      bestPracticeExamples: [
        {
          country: "Netherlands",
          practice: "Arbocatalogus - sector-specific catalogs of solutions developed jointly by employers and unions, providing practical hazard control measures.",
        },
        {
          country: "Japan",
          practice: "OSHMS (Occupational Safety and Health Management System) certification with government incentives for companies achieving certification.",
        },
        {
          country: "Australia",
          practice: "Safe Work Australia's model codes of practice providing detailed, industry-specific guidance on hazard identification and control.",
        },
      ],
      commonChallenges: [
        "SMEs lack resources for comprehensive risk assessments",
        "Emerging hazards (nanomaterials, psychosocial risks) not yet regulated",
        "Resistance to 'costly' prevention measures during economic downturns",
        "Training programs often check-the-box rather than behavior-changing",
        "Global supply chains make hazard tracking across borders difficult",
      ],
      scoringCriteria: [
        { level: "Leading (76-100)", score: "76-100", description: "Comprehensive OELs aligned with international standards, >90% training coverage, mandatory risk assessments with audits, robust chemical registry" },
        { level: "Advancing (51-75)", score: "51-75", description: "OELs for major substances, 60-90% training coverage, risk assessments required but inconsistently enforced" },
        { level: "Developing (26-50)", score: "26-50", description: "Basic OELs exist, <60% training coverage, risk assessments voluntary or poorly documented" },
        { level: "Critical (0-25)", score: "0-25", description: "No or outdated OELs, minimal training requirements, no systematic hazard identification" },
      ],
      interactionWithOtherPillars:
        "Prevention reduces the burden on Surveillance (fewer cases to detect) and Restoration (fewer claims to process). Governance mandates and enforces prevention standards. Effective prevention is measured by declining injury/illness rates captured through Surveillance systems.",
      dataSources: [
        "Chemical Exposure Limits (PELs/OELs)",
        "Safety Training Coverage Rate",
        "PPE Compliance Audits",
        "Risk Assessment Documentation",
        "Hazardous Substance Registry",
      ],
      keyMetrics: [
        "Exposure Limit Compliance",
        "Training Hours/Worker",
        "Hazard Reports Filed",
        "Prevention Investment Ratio",
      ],
    },
    {
      id: "pillar-2",
      title: "Surveillance & Detection",
      subtitle: "Pillar II — Vigilance",
      color: "emerald",
      gradientFrom: "from-emerald-500/30",
      gradientTo: "to-emerald-600/10",
      glowColor: "shadow-emerald-500/30",
      icon: Eye,
      description:
        "The watchful eye that never blinks. Continuous health monitoring and early detection systems that catch occupational diseases before they become chronic. This pillar includes medical surveillance, biomarker tracking, and incident reporting systems that provide real-time health intelligence.",
      relevance:
        "Early detection of occupational disease can reduce treatment costs by 60% and prevent permanent disability. A robust surveillance system acts as an early warning radar, allowing interventions when they're most effective and least expensive.",
      coreObjective:
        "Establish comprehensive systems for monitoring worker health, detecting occupational diseases early, and collecting incident data to identify patterns and emerging risks across industries.",
      keyQuestions: [
        "What percentage of workers in hazardous occupations receive periodic health examinations?",
        "Is there a national occupational disease registry with mandatory reporting?",
        "How quickly are workplace incidents reported and investigated (reporting latency)?",
        "Are biomarker monitoring programs in place for workers exposed to specific hazards?",
        "Is health surveillance data linked to exposure records for epidemiological analysis?",
      ],
      bestPracticeExamples: [
        {
          country: "Finland",
          practice: "Finnish Institute of Occupational Health (FIOH) maintains comprehensive exposure and health registries enabling long-term epidemiological studies.",
        },
        {
          country: "South Korea",
          practice: "Special Health Examinations (SHE) mandatory for workers in 179 hazardous job categories, with results reported to government database.",
        },
        {
          country: "United Kingdom",
          practice: "RIDDOR (Reporting of Injuries, Diseases and Dangerous Occurrences Regulations) creates standardized incident reporting with public data access.",
        },
      ],
      commonChallenges: [
        "Occupational diseases have long latency periods (e.g., mesothelioma: 20-50 years)",
        "Under-reporting due to fear of job loss or lack of awareness",
        "Difficulty attributing multi-factorial diseases to workplace exposure",
        "Fragmented data systems that don't communicate across agencies",
        "Privacy concerns limiting data sharing for research purposes",
      ],
      scoringCriteria: [
        { level: "Leading (76-100)", score: "76-100", description: ">90% examination coverage in hazardous jobs, comprehensive disease registry, <7 day reporting latency, active biomarker programs" },
        { level: "Advancing (51-75)", score: "51-75", description: "60-90% examination coverage, functional disease registry, 7-30 day reporting latency" },
        { level: "Developing (26-50)", score: "26-50", description: "<60% examination coverage, incomplete disease registry, >30 day reporting latency" },
        { level: "Critical (0-25)", score: "0-25", description: "No systematic health surveillance, no disease registry, incident reporting ad-hoc or absent" },
      ],
      interactionWithOtherPillars:
        "Surveillance provides the data that informs Prevention priorities and validates Governance enforcement. Detection of disease clusters triggers investigation and regulatory response. Surveillance data feeds into Restoration systems by documenting work-relatedness of claims.",
      dataSources: [
        "Occupational Health Examination Coverage",
        "Disease Registry Completeness",
        "Incident Reporting Rate (RIDDOR equivalents)",
        "Biomarker Monitoring Programs",
        "Health Surveillance Frequency",
      ],
      keyMetrics: [
        "Medical Exam Coverage %",
        "Disease Detection Rate",
        "Reporting Latency (days)",
        "Surveillance Investment/Worker",
      ],
    },
    {
      id: "pillar-3",
      title: "Restoration & Compensation",
      subtitle: "Pillar III — Restoration",
      color: "amber",
      gradientFrom: "from-amber-500/30",
      gradientTo: "to-amber-600/10",
      glowColor: "shadow-amber-500/30",
      icon: Heart,
      description:
        "The safety net that catches fallen workers. When prevention fails and harm occurs, this pillar ensures fair compensation, medical treatment, rehabilitation, and return-to-work support. It encompasses workers' compensation systems, disability benefits, and no-fault insurance mechanisms.",
      relevance:
        "A strong restoration system is the ultimate test of a society's commitment to worker dignity. No-fault compensation removes adversarial litigation, speeds recovery, and maintains the social contract between labor and capital. It transforms workplace injuries from personal tragedies into systemic learning opportunities.",
      coreObjective:
        "Ensure that workers who suffer occupational injuries or diseases receive prompt, fair compensation and access to medical treatment and rehabilitation services that maximize their chances of returning to productive work.",
      keyQuestions: [
        "What percentage of the workforce is covered by workers' compensation insurance?",
        "Is the compensation system based on no-fault principles (no need to prove employer negligence)?",
        "What is the average time from claim filing to benefit payment?",
        "Are comprehensive rehabilitation services (medical, vocational, social) available?",
        "What percentage of injured workers successfully return to work?",
      ],
      bestPracticeExamples: [
        {
          country: "Germany",
          practice: "Integrated 'everything from one source' model where Berufsgenossenschaften handle prevention, acute care, rehabilitation, and compensation seamlessly.",
        },
        {
          country: "Canada (Ontario)",
          practice: "WSIB's 'Return to Work' program with employer obligations to accommodate injured workers and financial incentives for successful reintegration.",
        },
        {
          country: "New Zealand",
          practice: "ACC (Accident Compensation Corporation) provides universal no-fault coverage for all injuries (work and non-work), eliminating litigation entirely.",
        },
      ],
      commonChallenges: [
        "Informal sector workers have no compensation coverage",
        "Adversarial systems lead to lengthy litigation and delayed benefits",
        "Mental health conditions and chronic diseases harder to compensate than acute injuries",
        "Return-to-work programs underfunded or employer resistance",
        "Benefit adequacy eroded by inflation over time",
      ],
      scoringCriteria: [
        { level: "Leading (76-100)", score: "76-100", description: ">95% workforce coverage, no-fault system, <30 day claim processing, comprehensive rehabilitation, >80% RTW success" },
        { level: "Advancing (51-75)", score: "51-75", description: "70-95% coverage, mostly no-fault with some litigation, 30-90 day processing, basic rehabilitation available" },
        { level: "Developing (26-50)", score: "26-50", description: "40-70% coverage, fault-based system common, >90 day processing delays, limited rehabilitation" },
        { level: "Critical (0-25)", score: "0-25", description: "<40% coverage, litigation-heavy system, severe delays, no systematic rehabilitation" },
      ],
      interactionWithOtherPillars:
        "Restoration is the 'last line of defense' when Prevention and Surveillance fail. Compensation claim data feeds back into Surveillance systems to identify hazard patterns. Governance sets the legal framework for compensation entitlements and employer obligations.",
      dataSources: [
        "Workers' Compensation Coverage Rate",
        "Average Claim Settlement Time",
        "Rehabilitation Service Availability",
        "Return-to-Work Success Rate",
        "No-Fault Insurance Adoption",
      ],
      keyMetrics: [
        "Coverage Rate %",
        "Claim Processing Days",
        "Benefit Adequacy Ratio",
        "RTW Success Rate",
      ],
    },
  ],
};

// ============================================================================
// DATA SOURCE DETAILS - Enhanced metadata for each data source
// ============================================================================

export interface DataSourceDetail {
  id: string;
  name: string;
  description: string;
  sourceType: 'international' | 'government' | 'registry' | 'survey' | 'research';
  organization: string;
  logoUrl: string;  // Organization logo URL (external or local)
  feedsInto: string[];
  updateFrequency: string;
  coverage: string;
  reliability: 'High' | 'Medium' | 'Variable';
  url: string;  // Required URL to the source
}

// Organization logo URLs (using official sources where possible)
const ORG_LOGOS = {
  ILO: "https://www.ilo.org/images/logo.svg",
  WHO: "https://www.who.int/images/default-source/infographics/who-emblem.png",
  WORLDBANK: "https://www.worldbank.org/content/dam/wbr-redesign/logos/logo-wb-header-en.svg",
  OECD: "https://www.oecd.org/media/oecdorg/styleassets/images/logo_en.svg",
  TRANSPARENCY: "https://images.transparencycdn.org/images/TI_logo_stacked_black.svg",
  UNDP: "https://www.undp.org/sites/g/files/zskgke326/files/2021-07/UNDP_Logo-Blue-Medium.png",
  YALE: "https://epi.yale.edu/themes/custom/epi_theme/logo.svg",
  IHME: "https://www.healthdata.org/sites/default/files/IHME_logo_rgb.png",
  EUROSTAT: "https://ec.europa.eu/eurostat/documents/747709/753176/logo_RGB.jpg",
  ACGIH: "https://www.acgih.org/images/logo.png",
};

export const dataSourceDetails: Record<string, DataSourceDetail> = {
  // Governance Data Sources
  "ilo_c187_ratification": {
    id: "ilo_c187_ratification",
    name: "ILO Convention C187 Ratification Status",
    description: "Official ratification status of the Promotional Framework for Occupational Safety and Health Convention. This convention establishes the national policy and system for OSH, requiring countries to develop and maintain coherent national policies.",
    sourceType: "international",
    organization: "International Labour Organization (ILO)",
    logoUrl: ORG_LOGOS.ILO,
    feedsInto: ["Governance Score", "Policy Compliance Index", "International Standards Alignment"],
    updateFrequency: "Real-time (upon ratification)",
    coverage: "All ILO member states (187 countries)",
    reliability: "High",
    url: "https://www.ilo.org/normlex"
  },
  "inspector_density": {
    id: "inspector_density",
    name: "Inspector Density per 10,000 Workers",
    description: "The ratio of labor inspectors to employed workers, measuring enforcement capacity. ILO recommends 1 inspector per 10,000 workers in developed economies and 1:20,000 in transitioning economies.",
    sourceType: "international",
    organization: "ILOSTAT",
    logoUrl: ORG_LOGOS.ILO,
    feedsInto: ["Enforcement Capacity", "Governance Score", "Regulatory Effectiveness"],
    updateFrequency: "Annual",
    coverage: "120+ countries with reporting",
    reliability: "Medium",
    url: "https://ilostat.ilo.org"
  },
  "whistleblower_index": {
    id: "whistleblower_index",
    name: "Whistleblower Protection Index",
    description: "Composite index measuring the strength of legal protections for workers who report safety violations, including anti-retaliation provisions, anonymous reporting channels, and enforcement mechanisms.",
    sourceType: "research",
    organization: "Transparency International",
    logoUrl: ORG_LOGOS.TRANSPARENCY,
    feedsInto: ["Governance Score", "Worker Rights Index", "Reporting Culture"],
    updateFrequency: "Biennial",
    coverage: "OECD and major economies",
    reliability: "Medium",
    url: "https://www.transparency.org"
  },
  "enforcement_budget": {
    id: "enforcement_budget",
    name: "Regulatory Enforcement Budget (% GDP)",
    description: "National budget allocation for occupational health enforcement as a percentage of GDP, indicating government commitment to workplace safety oversight.",
    sourceType: "government",
    organization: "OECD",
    logoUrl: ORG_LOGOS.OECD,
    feedsInto: ["Governance Score", "Enforcement Capacity", "Political Commitment Index"],
    updateFrequency: "Annual",
    coverage: "OECD countries + major economies",
    reliability: "High",
    url: "https://stats.oecd.org"
  },
  "tripartite_mechanisms": {
    id: "tripartite_mechanisms",
    name: "Tripartite Consultation Mechanisms",
    description: "Assessment of formal structures for government, employer, and worker collaboration on OH policy, including national OH councils, advisory bodies, and collective bargaining frameworks.",
    sourceType: "international",
    organization: "ILO Social Dialogue Department",
    logoUrl: ORG_LOGOS.ILO,
    feedsInto: ["Governance Score", "Stakeholder Engagement", "Policy Legitimacy"],
    updateFrequency: "Periodic assessment",
    coverage: "ILO member states",
    reliability: "Medium",
    url: "https://www.ilo.org/dialogue"
  },
  
  // Pillar 1: Hazard Prevention Data Sources
  "chemical_exposure_limits": {
    id: "chemical_exposure_limits",
    name: "Chemical Exposure Limits (PELs/OELs)",
    description: "National permissible exposure limits for hazardous substances including chemicals, dust, and biological agents. Compared against international standards (ACGIH TLVs, EU OELs).",
    sourceType: "government",
    organization: "ACGIH",
    logoUrl: ORG_LOGOS.ACGIH,
    feedsInto: ["Hazard Prevention Score", "Chemical Safety Index", "Regulatory Completeness"],
    updateFrequency: "Varies by country (1-5 years)",
    coverage: "Industrialized nations (50+)",
    reliability: "High",
    url: "https://www.acgih.org"
  },
  "safety_training_coverage": {
    id: "safety_training_coverage",
    name: "Safety Training Coverage Rate",
    description: "Percentage of workers receiving mandatory safety training annually, measured through employer surveys and labor inspectorate audits.",
    sourceType: "survey",
    organization: "ILOSTAT",
    logoUrl: ORG_LOGOS.ILO,
    feedsInto: ["Hazard Prevention Score", "Training Effectiveness", "Worker Preparedness"],
    updateFrequency: "Annual",
    coverage: "Varies by country",
    reliability: "Variable",
    url: "https://ilostat.ilo.org"
  },
  "ppe_compliance": {
    id: "ppe_compliance",
    name: "PPE Compliance Audits",
    description: "Results from workplace inspections measuring personal protective equipment provision and usage rates in high-risk industries.",
    sourceType: "government",
    organization: "EUROSTAT",
    logoUrl: ORG_LOGOS.EUROSTAT,
    feedsInto: ["Hazard Prevention Score", "Control Effectiveness", "Employer Compliance"],
    updateFrequency: "Continuous (aggregated annually)",
    coverage: "Inspected workplaces",
    reliability: "High",
    url: "https://ec.europa.eu/eurostat"
  },
  "risk_assessment_docs": {
    id: "risk_assessment_docs",
    name: "Risk Assessment Documentation",
    description: "Compliance rates for mandatory workplace risk assessments, including hazard identification, control measures, and review schedules.",
    sourceType: "government",
    organization: "EUROSTAT",
    logoUrl: ORG_LOGOS.EUROSTAT,
    feedsInto: ["Hazard Prevention Score", "Systematic Prevention", "Documentation Quality"],
    updateFrequency: "Annual (inspection cycle)",
    coverage: "Regulated workplaces",
    reliability: "Medium",
    url: "https://ec.europa.eu/eurostat/web/health/data/database"
  },
  "hazardous_substance_registry": {
    id: "hazardous_substance_registry",
    name: "Hazardous Substance Registry",
    description: "National database of hazardous chemicals used in workplaces, including safety data sheets, exposure pathways, and required control measures.",
    sourceType: "registry",
    organization: "ECHA (European Chemicals Agency)",
    logoUrl: "https://echa.europa.eu/o/echa-theme/images/echa_logo.png",
    feedsInto: ["Hazard Prevention Score", "Chemical Tracking", "Exposure Prevention"],
    updateFrequency: "Continuous updates",
    coverage: "Registered chemicals",
    reliability: "High",
    url: "https://echa.europa.eu"
  },
  
  // Pillar 2: Surveillance & Detection Data Sources
  "health_examination_coverage": {
    id: "health_examination_coverage",
    name: "Occupational Health Examination Coverage",
    description: "Percentage of workers in hazardous occupations receiving periodic health examinations, including pre-employment, periodic, and exit examinations.",
    sourceType: "registry",
    organization: "World Health Organization (WHO)",
    logoUrl: ORG_LOGOS.WHO,
    feedsInto: ["Surveillance Score", "Early Detection Rate", "Worker Health Monitoring"],
    updateFrequency: "Annual",
    coverage: "Workers in regulated hazardous jobs",
    reliability: "High",
    url: "https://www.who.int/data/gho"
  },
  "disease_registry": {
    id: "disease_registry",
    name: "Disease Registry Completeness",
    description: "Completeness and quality of national occupational disease registries, measuring case capture rate, diagnostic accuracy, and exposure linkage.",
    sourceType: "registry",
    organization: "World Health Organization (WHO)",
    logoUrl: ORG_LOGOS.WHO,
    feedsInto: ["Surveillance Score", "Epidemiological Capacity", "Trend Analysis"],
    updateFrequency: "Continuous",
    coverage: "Reported cases",
    reliability: "Variable",
    url: "https://www.who.int/data/gho"
  },
  "incident_reporting": {
    id: "incident_reporting",
    name: "Incident Reporting Rate (RIDDOR equivalents)",
    description: "Workplace incident notification rates under mandatory reporting schemes, measuring both fatal and non-fatal injuries with standardized definitions.",
    sourceType: "government",
    organization: "EUROSTAT",
    logoUrl: ORG_LOGOS.EUROSTAT,
    feedsInto: ["Surveillance Score", "Incident Tracking", "Trend Identification"],
    updateFrequency: "Real-time with annual aggregation",
    coverage: "Formal sector workplaces",
    reliability: "Medium",
    url: "https://ec.europa.eu/eurostat/web/health/data/database"
  },
  "biomarker_monitoring": {
    id: "biomarker_monitoring",
    name: "Biomarker Monitoring Programs",
    description: "Biological monitoring programs tracking exposure through blood, urine, or other biomarkers for workers exposed to specific hazards (lead, benzene, etc.).",
    sourceType: "registry",
    organization: "IHME (Global Burden of Disease)",
    logoUrl: ORG_LOGOS.IHME,
    feedsInto: ["Surveillance Score", "Exposure Verification", "Health Outcome Prediction"],
    updateFrequency: "Per protocol (monthly to annual)",
    coverage: "High-risk exposed workers",
    reliability: "High",
    url: "https://www.healthdata.org/gbd"
  },
  "surveillance_frequency": {
    id: "surveillance_frequency",
    name: "Health Surveillance Frequency",
    description: "Frequency and regularity of health surveillance activities by sector and hazard type, measuring systematic monitoring coverage.",
    sourceType: "survey",
    organization: "ILOSTAT",
    logoUrl: ORG_LOGOS.ILO,
    feedsInto: ["Surveillance Score", "Program Coverage", "Detection Timeliness"],
    updateFrequency: "Annual assessment",
    coverage: "Monitored populations",
    reliability: "Medium",
    url: "https://ilostat.ilo.org"
  },
  
  // Pillar 3: Restoration & Compensation Data Sources
  "compensation_coverage": {
    id: "compensation_coverage",
    name: "Workers' Compensation Coverage Rate",
    description: "Percentage of workforce covered by workers' compensation insurance, including formal and informal sector coverage gaps.",
    sourceType: "government",
    organization: "International Labour Organization (ILO)",
    logoUrl: ORG_LOGOS.ILO,
    feedsInto: ["Restoration Score", "Social Protection", "Coverage Equity"],
    updateFrequency: "Annual",
    coverage: "National workforce",
    reliability: "High",
    url: "https://www.ilo.org/global/statistics-and-databases"
  },
  "claim_settlement_time": {
    id: "claim_settlement_time",
    name: "Average Claim Settlement Time",
    description: "Average duration from claim filing to benefit payment, measuring administrative efficiency and worker support timeliness.",
    sourceType: "government",
    organization: "OECD",
    logoUrl: ORG_LOGOS.OECD,
    feedsInto: ["Restoration Score", "Administrative Efficiency", "Worker Support"],
    updateFrequency: "Quarterly/Annual",
    coverage: "Processed claims",
    reliability: "High",
    url: "https://stats.oecd.org"
  },
  "rehabilitation_services": {
    id: "rehabilitation_services",
    name: "Rehabilitation Service Availability",
    description: "Availability and accessibility of medical, vocational, and social rehabilitation services for injured workers.",
    sourceType: "survey",
    organization: "World Health Organization (WHO)",
    logoUrl: ORG_LOGOS.WHO,
    feedsInto: ["Restoration Score", "Recovery Support", "Service Quality"],
    updateFrequency: "Periodic assessment",
    coverage: "Injured workers",
    reliability: "Medium",
    url: "https://www.who.int/data/gho"
  },
  "rtw_success_rate": {
    id: "rtw_success_rate",
    name: "Return-to-Work Success Rate",
    description: "Percentage of injured workers who successfully return to work within defined timeframes (typically 1 year), measuring rehabilitation effectiveness.",
    sourceType: "registry",
    organization: "OECD",
    logoUrl: ORG_LOGOS.OECD,
    feedsInto: ["Restoration Score", "Rehabilitation Effectiveness", "Economic Reintegration"],
    updateFrequency: "Annual",
    coverage: "Compensated injuries",
    reliability: "High",
    url: "https://stats.oecd.org"
  },
  "no_fault_adoption": {
    id: "no_fault_adoption",
    name: "No-Fault Insurance Adoption",
    description: "Assessment of whether the compensation system operates on no-fault principles, removing the need to prove employer negligence for benefits.",
    sourceType: "research",
    organization: "World Bank",
    logoUrl: ORG_LOGOS.WORLDBANK,
    feedsInto: ["Restoration Score", "Access to Justice", "System Efficiency"],
    updateFrequency: "Policy changes only",
    coverage: "National systems",
    reliability: "High",
    url: "https://data.worldbank.org"
  }
};

/**
 * Get data source details by name (partial match)
 */
export function getDataSourceByName(name: string): DataSourceDetail | undefined {
  const normalizedName = name.toLowerCase();
  return Object.values(dataSourceDetails).find(
    ds => ds.name.toLowerCase().includes(normalizedName) || 
          normalizedName.includes(ds.name.toLowerCase().split(' ')[0])
  );
}

// ============================================================================
// STAT CARD MODAL CONTENT
// ============================================================================

export interface StatCardContent {
  title: string;
  subtitle: string;
  description: string;
  items: {
    name: string;
    description: string;
    color?: string;
    icon?: string;
    value?: string;
  }[];
}

export const statCardContent: Record<string, StatCardContent> = {
  components: {
    title: "Framework Components",
    subtitle: "The 4 pillars of occupational health excellence",
    description: "The ADL Occupational Health Framework is built on four interconnected components that work together to create a comprehensive system for worker protection.",
    items: [
      {
        name: "Governance Ecosystem",
        description: "The overarching driver that establishes regulatory frameworks, enforcement mechanisms, and institutional capacity. It creates the accountability loop that makes the entire framework functional.",
        color: "purple",
        icon: "Crown"
      },
      {
        name: "Hazard Prevention",
        description: "The proactive shield focusing on identifying, assessing, and eliminating hazards before they cause harm through exposure limits, training, and risk assessment protocols.",
        color: "blue",
        icon: "Shield"
      },
      {
        name: "Surveillance & Detection",
        description: "The watchful eye providing continuous health monitoring and early detection systems that catch occupational diseases before they become chronic.",
        color: "emerald",
        icon: "Eye"
      },
      {
        name: "Restoration & Compensation",
        description: "The safety net ensuring fair compensation, medical treatment, rehabilitation, and return-to-work support when prevention fails and harm occurs.",
        color: "amber",
        icon: "Heart"
      }
    ]
  },
  metrics: {
    title: "Assessment Metrics",
    subtitle: "25 indicators across all pillars",
    description: "The framework uses a comprehensive set of quantitative and qualitative metrics to assess national occupational health performance, sourced from international databases.",
    items: [
      // Governance Layer (5 metrics)
      { name: "ILO C187 Status", description: "Promotional Framework for OSH Convention ratification", color: "purple", value: "Binary" },
      { name: "ILO C155 Status", description: "Occupational Safety & Health Convention ratification", color: "purple", value: "Binary" },
      { name: "Inspector Density", description: "Labor inspectors per 10,000 workers", color: "purple", value: "Ratio" },
      { name: "Mental Health Policy", description: "National workplace mental health policy exists", color: "purple", value: "Binary" },
      { name: "Strategic Capacity Score", description: "Aggregate governance capacity index", color: "purple", value: "0-100" },
      // Pillar 1: Hazard Control (7 metrics)
      { name: "Fatal Accident Rate", description: "Fatal accidents per 100,000 workers", color: "blue", value: "Rate" },
      { name: "Carcinogen Exposure %", description: "Workforce exposed to carcinogens", color: "blue", value: "%" },
      { name: "Heat Stress Regulation", description: "Type of heat stress regulation (Strict/Advisory/None)", color: "blue", value: "Type" },
      { name: "OEL Compliance %", description: "Occupational Exposure Limit compliance rate", color: "blue", value: "%" },
      { name: "NIHL Rate", description: "Noise-induced hearing loss per 100,000 workers", color: "blue", value: "Rate" },
      { name: "Safety Training Hours", description: "Average annual training hours per worker", color: "blue", value: "Hours" },
      { name: "Control Maturity Score", description: "Hazard control maturity index", color: "blue", value: "0-100" },
      // Pillar 2: Health Vigilance (6 metrics)
      { name: "Surveillance Logic", description: "Surveillance system type (Risk-Based/Mandatory/etc.)", color: "emerald", value: "Type" },
      { name: "Disease Detection Rate", description: "Occupational disease early detection rate", color: "emerald", value: "Rate" },
      { name: "Vulnerability Index", description: "Worker vulnerability score", color: "emerald", value: "0-100" },
      { name: "Migrant Worker %", description: "Migrant workforce percentage", color: "emerald", value: "%" },
      { name: "Lead Screening Rate", description: "Lead exposure screening per 100,000 workers", color: "emerald", value: "Rate" },
      { name: "Disease Reporting Rate", description: "Occupational disease reporting compliance", color: "emerald", value: "%" },
      // Pillar 3: Restoration (7 metrics)
      { name: "Payer Mechanism", description: "Compensation system type (No-Fault/Litigation/etc.)", color: "amber", value: "Type" },
      { name: "Reintegration Law", description: "Mandatory return-to-work legislation exists", color: "amber", value: "Binary" },
      { name: "Sickness Absence Days", description: "Average sickness absence days per worker/year", color: "amber", value: "Days" },
      { name: "Rehab Access Score", description: "Rehabilitation access index", color: "amber", value: "0-100" },
      { name: "RTW Success Rate", description: "Return-to-work program success rate", color: "amber", value: "%" },
      { name: "Claim Settlement Days", description: "Average days to settle workers' comp claim", color: "amber", value: "Days" },
      { name: "Rehab Participation Rate", description: "Rehabilitation program participation rate", color: "amber", value: "%" }
    ]
  },
  bestPractices: {
    title: "Global Leaders",
    subtitle: "Top performers by ADL OHI Score",
    description: "Countries ranked by their ADL Occupational Health Index (OHI) score, demonstrating world-leading approaches to occupational health. These nations serve as benchmarks for the framework.",
    items: [] // Dynamic content loaded from leaderboard API
  },
  maturityLevels: {
    title: "ADL OHI Score",
    subtitle: "4 stages of occupational health development",
    description: "Countries are assessed on the ADL Occupational Health Index (OHI), a four-stage maturity model (1.0-4.0 scale) that reflects their progression from reactive to resilient occupational health systems.",
    items: [
      {
        name: "Leading (3.5-4.0)",
        description: "Comprehensive framework with strong enforcement, >1:10,000 inspector ratio, universal surveillance coverage. No-fault compensation with <30 day processing. >80% return-to-work success.",
        color: "emerald",
        value: "3.5-4.0"
      },
      {
        name: "Advancing (2.5-3.4)",
        description: "C187 ratified, functioning enforcement with moderate inspector density. Risk assessments required but inconsistently enforced. Compensation systems operational with some gaps.",
        color: "yellow",
        value: "2.5-3.4"
      },
      {
        name: "Developing (2.0-2.4)",
        description: "Basic OSH law exists, inspector ratio below ILO standards, limited enforcement capacity. Prevention efforts exist but inconsistent. Informal sector largely uncovered.",
        color: "orange",
        value: "2.0-2.4"
      },
      {
        name: "Critical (1.0-1.9)",
        description: "No comprehensive OSH law, minimal inspection capacity, no whistleblower protection, governance fragmented or absent. Ad-hoc responses to incidents with no systematic prevention.",
        color: "red",
        value: "1.0-1.9"
      }
    ]
  }
};

// ============================================================================
// INTERACTION GUIDE SLIDES
// ============================================================================

export interface GuideSlide {
  id: string;
  type: 'intro' | 'overview' | 'component' | 'integration';
  title: string;
  subtitle?: string;
  content: string;
  highlights?: string[];
  componentId?: string;
  color?: string;
  icon?: string;
}

export const guideSlides: GuideSlide[] = [
  {
    id: "intro",
    type: "intro",
    title: "ADL Occupational Health Framework",
    subtitle: "Welcome to the Interactive Guide",
    content: "This guide will walk you through the comprehensive framework developed by Arthur D. Little for assessing and improving national occupational health systems worldwide.",
    color: "cyan"
  },
  {
    id: "overview",
    type: "overview",
    title: "The Temple Structure",
    subtitle: "A Visual Architecture for Worker Protection",
    content: "The framework is visualized as a temple structure, where Governance forms the roof that protects and enables everything below, while three operational pillars support the entire system.",
    highlights: [
      "Governance acts as the overarching enabler",
      "Three pillars work in concert for comprehensive protection",
      "Each component has measurable metrics and scoring criteria"
    ],
    color: "purple"
  },
  {
    id: "governance",
    type: "component",
    title: "Governance Ecosystem",
    subtitle: "The Overarching Driver",
    content: "The brain and law that drives the entire occupational health system. This layer establishes the regulatory framework, enforcement mechanisms, and institutional capacity that make everything else possible.",
    highlights: [
      "ILO Convention ratification status",
      "Labor inspector density and enforcement",
      "Whistleblower protections",
      "Tripartite consultation mechanisms"
    ],
    componentId: "governance",
    color: "purple",
    icon: "Crown"
  },
  {
    id: "pillar-1",
    type: "component",
    title: "Hazard Prevention",
    subtitle: "Pillar I — The Proactive Shield",
    content: "The first line of defense focusing on identifying, assessing, and eliminating hazards before they cause harm. Every dollar invested in prevention saves $4-6 in downstream costs.",
    highlights: [
      "Occupational exposure limits (OELs)",
      "Safety training coverage",
      "Risk assessment requirements",
      "PPE compliance monitoring"
    ],
    componentId: "pillar-1",
    color: "blue",
    icon: "Shield"
  },
  {
    id: "pillar-2",
    type: "component",
    title: "Surveillance & Detection",
    subtitle: "Pillar II — The Watchful Eye",
    content: "Continuous health monitoring and early detection systems that catch occupational diseases before they become chronic. Early detection can reduce treatment costs by 60%.",
    highlights: [
      "Periodic health examinations",
      "Occupational disease registries",
      "Incident reporting systems",
      "Biomarker monitoring programs"
    ],
    componentId: "pillar-2",
    color: "emerald",
    icon: "Eye"
  },
  {
    id: "pillar-3",
    type: "component",
    title: "Restoration & Compensation",
    subtitle: "Pillar III — The Safety Net",
    content: "When prevention fails and harm occurs, this pillar ensures fair compensation, medical treatment, rehabilitation, and return-to-work support for affected workers.",
    highlights: [
      "Workers' compensation coverage",
      "No-fault insurance systems",
      "Rehabilitation services",
      "Return-to-work programs"
    ],
    componentId: "pillar-3",
    color: "amber",
    icon: "Heart"
  },
  {
    id: "integration",
    type: "integration",
    title: "Framework Integration",
    subtitle: "How Components Work Together",
    content: "The true power of the framework lies in how components interact. Governance enables all pillars. Prevention reduces burden on Surveillance and Restoration. Surveillance data informs Prevention priorities. Restoration claims feed back into hazard identification.",
    highlights: [
      "Governance creates the accountability loop",
      "Data flows between all components",
      "Continuous improvement through feedback",
      "Measurable outcomes at each level"
    ],
    color: "cyan"
  },
  {
    id: "conclusion",
    type: "overview",
    title: "Start Exploring",
    subtitle: "Your Journey Begins",
    content: "Click on any component in the framework visualization to explore detailed information, data sources, metrics, and best practices. Use the data sources tab to understand what information feeds each assessment.",
    highlights: [
      "Click components to see details",
      "Explore data sources for each pillar",
      "Review best practices from leading countries",
      "Understand scoring criteria and benchmarks"
    ],
    color: "cyan"
  }
];

/**
 * Get a specific block by ID
 */
export function getBlockById(id: string): FrameworkBlock | undefined {
  if (id === "governance") return frameworkContent.governance;
  return frameworkContent.pillars.find((p) => p.id === id);
}

/**
 * Get all blocks as a flat array (for iteration)
 */
export function getAllBlocks(): FrameworkBlock[] {
  return [
    frameworkContent.governance,
    ...frameworkContent.pillars,
  ];
}

export default frameworkContent;
