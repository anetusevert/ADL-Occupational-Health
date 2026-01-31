/**
 * Sovereign Health: Policy Definitions
 * 
 * 48 policy intervention cards across all 4 pillars
 * Each policy has costs, impacts, prerequisites, and unlock requirements
 */

import type { PolicyDefinition, PillarId } from '../components/simulator/types';

// ============================================================================
// GOVERNANCE POLICIES (12)
// ============================================================================

const GOVERNANCE_POLICIES: PolicyDefinition[] = [
  // Tier 1 - Basic
  {
    id: 'gov_osh_law',
    name: 'National OSH Law',
    description: 'Establish comprehensive occupational safety and health legislation as the foundation for all workplace protections.',
    pillar: 'governance',
    tier: 1,
    baseCost: 15,
    maxLevel: 3,
    impactPerLevel: { governance: 3, hazardControl: 1, healthVigilance: 0.5, restoration: 0.5 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'ScrollText',
    tags: ['legal', 'foundation'],
  },
  {
    id: 'gov_ilo_c155',
    name: 'Ratify ILO C155',
    description: 'Ratify the ILO Occupational Safety and Health Convention, signaling international commitment to worker protection.',
    pillar: 'governance',
    tier: 1,
    baseCost: 10,
    maxLevel: 1,
    impactPerLevel: { governance: 5, hazardControl: 1, healthVigilance: 1, restoration: 1 },
    prerequisites: ['gov_osh_law'],
    unlockYear: 2025,
    icon: 'Globe',
    tags: ['international', 'convention'],
  },
  {
    id: 'gov_ilo_c187',
    name: 'Ratify ILO C187',
    description: 'Ratify the Promotional Framework for OSH Convention, committing to continuous improvement of national OSH systems.',
    pillar: 'governance',
    tier: 1,
    baseCost: 10,
    maxLevel: 1,
    impactPerLevel: { governance: 5, hazardControl: 1, healthVigilance: 1, restoration: 1 },
    prerequisites: ['gov_ilo_c155'],
    unlockYear: 2025,
    icon: 'Globe2',
    tags: ['international', 'convention'],
  },
  {
    id: 'gov_inspectors',
    name: 'Expand Inspector Workforce',
    description: 'Recruit and train additional labor inspectors to increase enforcement capacity and workplace coverage.',
    pillar: 'governance',
    tier: 1,
    baseCost: 25,
    maxLevel: 5,
    impactPerLevel: { governance: 2.5, hazardControl: 2, healthVigilance: 0.5, restoration: 0 },
    prerequisites: ['gov_osh_law'],
    unlockYear: 2025,
    icon: 'Users',
    tags: ['enforcement', 'capacity'],
  },
  
  // Tier 2 - Advanced
  {
    id: 'gov_tripartite',
    name: 'Tripartite Council',
    description: 'Establish a national council with government, employer, and worker representatives for collaborative OSH policymaking.',
    pillar: 'governance',
    tier: 2,
    baseCost: 20,
    maxLevel: 3,
    impactPerLevel: { governance: 3, hazardControl: 0.5, healthVigilance: 0.5, restoration: 1 },
    prerequisites: ['gov_osh_law'],
    unlockYear: 2030,
    icon: 'Users2',
    tags: ['stakeholder', 'dialogue'],
  },
  {
    id: 'gov_whistleblower',
    name: 'Whistleblower Protection',
    description: 'Implement strong legal protections for workers who report safety violations, including anti-retaliation measures.',
    pillar: 'governance',
    tier: 2,
    baseCost: 15,
    maxLevel: 3,
    impactPerLevel: { governance: 2, hazardControl: 2, healthVigilance: 1, restoration: 0 },
    prerequisites: ['gov_osh_law'],
    unlockYear: 2030,
    icon: 'Megaphone',
    tags: ['protection', 'reporting'],
  },
  {
    id: 'gov_digital_platform',
    name: 'Digital Enforcement Platform',
    description: 'Deploy a digital system for inspection scheduling, violation tracking, and compliance monitoring.',
    pillar: 'governance',
    tier: 2,
    baseCost: 30,
    maxLevel: 4,
    impactPerLevel: { governance: 2, hazardControl: 1.5, healthVigilance: 1, restoration: 0.5 },
    prerequisites: ['gov_inspectors'],
    unlockYear: 2030,
    icon: 'MonitorSmartphone',
    tags: ['technology', 'enforcement'],
  },
  {
    id: 'gov_national_agency',
    name: 'National OSH Agency',
    description: 'Create a dedicated national agency for occupational health with authority, budget, and expert staff.',
    pillar: 'governance',
    tier: 2,
    baseCost: 35,
    maxLevel: 3,
    impactPerLevel: { governance: 4, hazardControl: 1, healthVigilance: 1, restoration: 1 },
    prerequisites: ['gov_tripartite', 'gov_inspectors'],
    unlockYear: 2030,
    icon: 'Building2',
    tags: ['institution', 'capacity'],
  },
  
  // Tier 3 - Elite
  {
    id: 'gov_penalty_reform',
    name: 'Penalty Reform',
    description: 'Increase penalties for safety violations with escalating fines and criminal prosecution for repeat offenders.',
    pillar: 'governance',
    tier: 3,
    baseCost: 20,
    maxLevel: 3,
    impactPerLevel: { governance: 3, hazardControl: 3, healthVigilance: 0, restoration: 0 },
    prerequisites: ['gov_national_agency'],
    unlockYear: 2035,
    icon: 'Gavel',
    tags: ['enforcement', 'deterrence'],
  },
  {
    id: 'gov_public_registry',
    name: 'Public Violation Registry',
    description: 'Create a publicly accessible database of workplace safety violations, enabling "name and shame" transparency.',
    pillar: 'governance',
    tier: 3,
    baseCost: 15,
    maxLevel: 2,
    impactPerLevel: { governance: 2, hazardControl: 2, healthVigilance: 0.5, restoration: 0 },
    prerequisites: ['gov_digital_platform'],
    unlockYear: 2035,
    icon: 'FileSearch',
    tags: ['transparency', 'accountability'],
  },
  {
    id: 'gov_research_institute',
    name: 'OSH Research Institute',
    description: 'Establish a national research institute dedicated to occupational health science and policy innovation.',
    pillar: 'governance',
    tier: 3,
    baseCost: 40,
    maxLevel: 3,
    impactPerLevel: { governance: 2, hazardControl: 2, healthVigilance: 3, restoration: 1 },
    prerequisites: ['gov_national_agency'],
    unlockYear: 2035,
    icon: 'FlaskConical',
    tags: ['research', 'innovation'],
  },
  {
    id: 'gov_international_leader',
    name: 'International Leadership',
    description: 'Position your country as a global leader in OSH, hosting conferences and sharing best practices worldwide.',
    pillar: 'governance',
    tier: 3,
    baseCost: 25,
    maxLevel: 2,
    impactPerLevel: { governance: 4, hazardControl: 1, healthVigilance: 1, restoration: 1 },
    prerequisites: ['gov_ilo_c187', 'gov_national_agency'],
    unlockYear: 2040,
    icon: 'Flag',
    tags: ['international', 'prestige'],
  },
];

// ============================================================================
// HAZARD CONTROL POLICIES (12)
// ============================================================================

const HAZARD_CONTROL_POLICIES: PolicyDefinition[] = [
  // Tier 1 - Basic
  {
    id: 'haz_risk_assessment',
    name: 'Mandatory Risk Assessments',
    description: 'Require all employers to conduct and document workplace risk assessments at regular intervals.',
    pillar: 'hazardControl',
    tier: 1,
    baseCost: 20,
    maxLevel: 4,
    impactPerLevel: { governance: 0.5, hazardControl: 3, healthVigilance: 1, restoration: 0 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'ClipboardCheck',
    tags: ['assessment', 'prevention'],
  },
  {
    id: 'haz_oel_standards',
    name: 'OEL Standards Update',
    description: 'Establish and regularly update Occupational Exposure Limits aligned with international best practices.',
    pillar: 'hazardControl',
    tier: 1,
    baseCost: 15,
    maxLevel: 3,
    impactPerLevel: { governance: 0.5, hazardControl: 3.5, healthVigilance: 0.5, restoration: 0 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'Gauge',
    tags: ['standards', 'chemical'],
  },
  {
    id: 'haz_safety_training',
    name: 'Mandatory Safety Training',
    description: 'Require annual safety training for all workers, with enhanced programs for high-risk industries.',
    pillar: 'hazardControl',
    tier: 1,
    baseCost: 25,
    maxLevel: 5,
    impactPerLevel: { governance: 0, hazardControl: 2.5, healthVigilance: 0.5, restoration: 0 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'GraduationCap',
    tags: ['training', 'education'],
  },
  {
    id: 'haz_ppe_program',
    name: 'PPE Provision Program',
    description: 'Establish programs to ensure adequate personal protective equipment availability across all sectors.',
    pillar: 'hazardControl',
    tier: 1,
    baseCost: 20,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 2.5, healthVigilance: 0, restoration: 0.5 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'HardHat',
    tags: ['equipment', 'protection'],
  },
  
  // Tier 2 - Advanced
  {
    id: 'haz_chemical_registry',
    name: 'Chemical Hazard Registry',
    description: 'Create a national database of hazardous chemicals used in workplaces with safety data sheets and controls.',
    pillar: 'hazardControl',
    tier: 2,
    baseCost: 25,
    maxLevel: 3,
    impactPerLevel: { governance: 1, hazardControl: 3, healthVigilance: 2, restoration: 0 },
    prerequisites: ['haz_oel_standards'],
    unlockYear: 2030,
    icon: 'FlaskConical',
    tags: ['chemical', 'database'],
  },
  {
    id: 'haz_heat_stress',
    name: 'Heat Stress Regulations',
    description: 'Implement mandatory work-rest cycles, hydration requirements, and temperature limits for outdoor work.',
    pillar: 'hazardControl',
    tier: 2,
    baseCost: 15,
    maxLevel: 3,
    impactPerLevel: { governance: 0.5, hazardControl: 3, healthVigilance: 0.5, restoration: 0 },
    prerequisites: ['haz_risk_assessment'],
    unlockYear: 2030,
    icon: 'Thermometer',
    tags: ['climate', 'outdoor'],
  },
  {
    id: 'haz_ergonomics',
    name: 'Ergonomics Standards',
    description: 'Mandate ergonomic assessments and interventions to prevent musculoskeletal disorders.',
    pillar: 'hazardControl',
    tier: 2,
    baseCost: 20,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 2.5, healthVigilance: 1, restoration: 1 },
    prerequisites: ['haz_risk_assessment'],
    unlockYear: 2030,
    icon: 'Armchair',
    tags: ['ergonomics', 'msd'],
  },
  {
    id: 'haz_sme_grants',
    name: 'SME Safety Grants',
    description: 'Provide financial assistance to small and medium enterprises for safety improvements and equipment.',
    pillar: 'hazardControl',
    tier: 2,
    baseCost: 30,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 2, healthVigilance: 0.5, restoration: 0.5 },
    prerequisites: ['haz_ppe_program'],
    unlockYear: 2030,
    icon: 'Wallet',
    tags: ['financial', 'sme'],
  },
  
  // Tier 3 - Elite
  {
    id: 'haz_carcinogen_ban',
    name: 'Carcinogen Phase-Out',
    description: 'Progressively ban or strictly control the most dangerous carcinogenic substances in workplaces.',
    pillar: 'hazardControl',
    tier: 3,
    baseCost: 35,
    maxLevel: 3,
    impactPerLevel: { governance: 1, hazardControl: 4, healthVigilance: 2, restoration: 0 },
    prerequisites: ['haz_chemical_registry'],
    unlockYear: 2035,
    icon: 'Ban',
    tags: ['carcinogen', 'elimination'],
  },
  {
    id: 'haz_automation',
    name: 'Hazardous Work Automation',
    description: 'Invest in robotics and automation to remove workers from the most dangerous tasks and environments.',
    pillar: 'hazardControl',
    tier: 3,
    baseCost: 45,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 3, healthVigilance: 0.5, restoration: 1 },
    prerequisites: ['haz_risk_assessment'],
    unlockYear: 2035,
    icon: 'Bot',
    tags: ['technology', 'automation'],
  },
  {
    id: 'haz_psychosocial',
    name: 'Psychosocial Risk Management',
    description: 'Mandate assessment and control of workplace stress, harassment, and mental health hazards.',
    pillar: 'hazardControl',
    tier: 3,
    baseCost: 25,
    maxLevel: 4,
    impactPerLevel: { governance: 0.5, hazardControl: 2, healthVigilance: 2.5, restoration: 1 },
    prerequisites: ['haz_risk_assessment', 'haz_ergonomics'],
    unlockYear: 2035,
    icon: 'Brain',
    tags: ['mental', 'psychosocial'],
  },
  {
    id: 'haz_zero_fatality',
    name: 'Vision Zero Program',
    description: 'Launch a national campaign with the goal of eliminating all workplace fatalities through systemic improvements.',
    pillar: 'hazardControl',
    tier: 3,
    baseCost: 40,
    maxLevel: 3,
    impactPerLevel: { governance: 2, hazardControl: 4, healthVigilance: 1, restoration: 0 },
    prerequisites: ['haz_safety_training', 'haz_sme_grants'],
    unlockYear: 2040,
    icon: 'Target',
    tags: ['campaign', 'elimination'],
  },
];

// ============================================================================
// HEALTH VIGILANCE POLICIES (12)
// ============================================================================

const HEALTH_VIGILANCE_POLICIES: PolicyDefinition[] = [
  // Tier 1 - Basic
  {
    id: 'vig_health_exams',
    name: 'Periodic Health Examinations',
    description: 'Mandate regular health examinations for workers in hazardous occupations to detect early signs of disease.',
    pillar: 'healthVigilance',
    tier: 1,
    baseCost: 25,
    maxLevel: 5,
    impactPerLevel: { governance: 0, hazardControl: 0.5, healthVigilance: 3, restoration: 1 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'Stethoscope',
    tags: ['medical', 'screening'],
  },
  {
    id: 'vig_disease_registry',
    name: 'Occupational Disease Registry',
    description: 'Create a national registry for occupational diseases with mandatory reporting by healthcare providers.',
    pillar: 'healthVigilance',
    tier: 1,
    baseCost: 20,
    maxLevel: 3,
    impactPerLevel: { governance: 1, hazardControl: 0.5, healthVigilance: 3.5, restoration: 0.5 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'Database',
    tags: ['registry', 'reporting'],
  },
  {
    id: 'vig_incident_reporting',
    name: 'Incident Reporting System',
    description: 'Implement standardized workplace incident and near-miss reporting with digital submission.',
    pillar: 'healthVigilance',
    tier: 1,
    baseCost: 15,
    maxLevel: 4,
    impactPerLevel: { governance: 0.5, hazardControl: 1.5, healthVigilance: 2.5, restoration: 0 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'FileWarning',
    tags: ['reporting', 'incidents'],
  },
  {
    id: 'vig_exposure_monitoring',
    name: 'Exposure Monitoring',
    description: 'Establish workplace air quality and exposure monitoring programs for hazardous substances.',
    pillar: 'healthVigilance',
    tier: 1,
    baseCost: 20,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 2, healthVigilance: 2.5, restoration: 0 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'Wind',
    tags: ['monitoring', 'exposure'],
  },
  
  // Tier 2 - Advanced
  {
    id: 'vig_biomarker',
    name: 'Biomarker Monitoring Program',
    description: 'Implement biological monitoring for workers exposed to specific hazards (lead, benzene, etc.).',
    pillar: 'healthVigilance',
    tier: 2,
    baseCost: 30,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 1, healthVigilance: 3.5, restoration: 0.5 },
    prerequisites: ['vig_health_exams', 'vig_exposure_monitoring'],
    unlockYear: 2030,
    icon: 'TestTube',
    tags: ['biological', 'monitoring'],
  },
  {
    id: 'vig_mental_screening',
    name: 'Mental Health Screening',
    description: 'Integrate mental health assessments into workplace health programs with confidential support services.',
    pillar: 'healthVigilance',
    tier: 2,
    baseCost: 20,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 0.5, healthVigilance: 2.5, restoration: 1.5 },
    prerequisites: ['vig_health_exams'],
    unlockYear: 2030,
    icon: 'HeartPulse',
    tags: ['mental', 'screening'],
  },
  {
    id: 'vig_mobile_units',
    name: 'Mobile Health Units',
    description: 'Deploy mobile clinics to reach workers in remote areas and informal sectors for health screenings.',
    pillar: 'healthVigilance',
    tier: 2,
    baseCost: 25,
    maxLevel: 3,
    impactPerLevel: { governance: 0, hazardControl: 0.5, healthVigilance: 2.5, restoration: 1 },
    prerequisites: ['vig_health_exams'],
    unlockYear: 2030,
    icon: 'Truck',
    tags: ['mobile', 'access'],
  },
  {
    id: 'vig_digital_health',
    name: 'Digital Health Records',
    description: 'Create an integrated digital system linking worker health records with exposure histories.',
    pillar: 'healthVigilance',
    tier: 2,
    baseCost: 35,
    maxLevel: 3,
    impactPerLevel: { governance: 1, hazardControl: 0.5, healthVigilance: 3, restoration: 1 },
    prerequisites: ['vig_disease_registry', 'vig_incident_reporting'],
    unlockYear: 2030,
    icon: 'FileHeart',
    tags: ['technology', 'records'],
  },
  
  // Tier 3 - Elite
  {
    id: 'vig_ai_detection',
    name: 'AI Disease Detection',
    description: 'Deploy artificial intelligence systems to analyze health data and identify early disease patterns.',
    pillar: 'healthVigilance',
    tier: 3,
    baseCost: 40,
    maxLevel: 3,
    impactPerLevel: { governance: 0.5, hazardControl: 1, healthVigilance: 4, restoration: 0.5 },
    prerequisites: ['vig_digital_health', 'vig_biomarker'],
    unlockYear: 2035,
    icon: 'Cpu',
    tags: ['ai', 'detection'],
  },
  {
    id: 'vig_sentinel',
    name: 'Sentinel Surveillance Network',
    description: 'Establish a network of sentinel workplaces for advanced epidemiological monitoring and research.',
    pillar: 'healthVigilance',
    tier: 3,
    baseCost: 30,
    maxLevel: 3,
    impactPerLevel: { governance: 1, hazardControl: 1.5, healthVigilance: 3, restoration: 0.5 },
    prerequisites: ['vig_disease_registry'],
    unlockYear: 2035,
    icon: 'Radar',
    tags: ['surveillance', 'research'],
  },
  {
    id: 'vig_cross_border',
    name: 'Cross-Border Health Records',
    description: 'Enable international sharing of worker health records for migrant workers and multinational companies.',
    pillar: 'healthVigilance',
    tier: 3,
    baseCost: 25,
    maxLevel: 2,
    impactPerLevel: { governance: 1.5, hazardControl: 0.5, healthVigilance: 2.5, restoration: 1 },
    prerequisites: ['vig_digital_health'],
    unlockYear: 2035,
    icon: 'Globe',
    tags: ['international', 'migrant'],
  },
  {
    id: 'vig_predictive',
    name: 'Predictive Analytics Platform',
    description: 'Use big data analytics to predict workplace health trends and guide preventive interventions.',
    pillar: 'healthVigilance',
    tier: 3,
    baseCost: 45,
    maxLevel: 3,
    impactPerLevel: { governance: 0.5, hazardControl: 2, healthVigilance: 3.5, restoration: 0.5 },
    prerequisites: ['vig_ai_detection'],
    unlockYear: 2040,
    icon: 'TrendingUp',
    tags: ['analytics', 'prediction'],
  },
];

// ============================================================================
// RESTORATION POLICIES (12)
// ============================================================================

const RESTORATION_POLICIES: PolicyDefinition[] = [
  // Tier 1 - Basic
  {
    id: 'res_compensation_law',
    name: 'Workers\' Compensation Law',
    description: 'Establish a comprehensive workers\' compensation system covering workplace injuries and diseases.',
    pillar: 'restoration',
    tier: 1,
    baseCost: 25,
    maxLevel: 4,
    impactPerLevel: { governance: 1, hazardControl: 0, healthVigilance: 0.5, restoration: 3 },
    prerequisites: [],
    unlockYear: 2025,
    icon: 'Scale',
    tags: ['legal', 'compensation'],
  },
  {
    id: 'res_claims_process',
    name: 'Streamlined Claims Processing',
    description: 'Simplify and accelerate the workers\' compensation claims process with clear timelines.',
    pillar: 'restoration',
    tier: 1,
    baseCost: 15,
    maxLevel: 4,
    impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0, restoration: 3 },
    prerequisites: ['res_compensation_law'],
    unlockYear: 2025,
    icon: 'FileCheck',
    tags: ['process', 'efficiency'],
  },
  {
    id: 'res_medical_care',
    name: 'Medical Care Coverage',
    description: 'Ensure injured workers have access to quality medical treatment without financial barriers.',
    pillar: 'restoration',
    tier: 1,
    baseCost: 30,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 1, restoration: 3 },
    prerequisites: ['res_compensation_law'],
    unlockYear: 2025,
    icon: 'Cross',
    tags: ['medical', 'access'],
  },
  {
    id: 'res_temp_benefits',
    name: 'Temporary Disability Benefits',
    description: 'Provide adequate income replacement benefits during recovery periods.',
    pillar: 'restoration',
    tier: 1,
    baseCost: 20,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 3 },
    prerequisites: ['res_compensation_law'],
    unlockYear: 2025,
    icon: 'Coins',
    tags: ['benefits', 'income'],
  },
  
  // Tier 2 - Advanced
  {
    id: 'res_no_fault',
    name: 'No-Fault Insurance Reform',
    description: 'Transition to a no-fault compensation system, removing the need to prove employer negligence.',
    pillar: 'restoration',
    tier: 2,
    baseCost: 35,
    maxLevel: 3,
    impactPerLevel: { governance: 1.5, hazardControl: 0, healthVigilance: 0, restoration: 4 },
    prerequisites: ['res_compensation_law', 'res_claims_process'],
    unlockYear: 2030,
    icon: 'Shield',
    tags: ['reform', 'no-fault'],
  },
  {
    id: 'res_rehab_centers',
    name: 'Rehabilitation Centers',
    description: 'Build specialized rehabilitation facilities for occupational injury and disease recovery.',
    pillar: 'restoration',
    tier: 2,
    baseCost: 40,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 1, restoration: 3.5 },
    prerequisites: ['res_medical_care'],
    unlockYear: 2030,
    icon: 'Building',
    tags: ['rehabilitation', 'facilities'],
  },
  {
    id: 'res_rtw_program',
    name: 'Return-to-Work Program',
    description: 'Establish structured programs to help injured workers return to suitable employment.',
    pillar: 'restoration',
    tier: 2,
    baseCost: 25,
    maxLevel: 4,
    impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0.5, restoration: 3.5 },
    prerequisites: ['res_temp_benefits'],
    unlockYear: 2030,
    icon: 'ArrowRight',
    tags: ['rtw', 'employment'],
  },
  {
    id: 'res_vocational',
    name: 'Vocational Retraining',
    description: 'Provide vocational training for workers who cannot return to their previous occupation.',
    pillar: 'restoration',
    tier: 2,
    baseCost: 30,
    maxLevel: 4,
    impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 3 },
    prerequisites: ['res_rtw_program'],
    unlockYear: 2030,
    icon: 'BookOpen',
    tags: ['training', 'retraining'],
  },
  
  // Tier 3 - Elite
  {
    id: 'res_informal_coverage',
    name: 'Informal Sector Coverage',
    description: 'Extend workers\' compensation coverage to informal sector workers and gig economy participants.',
    pillar: 'restoration',
    tier: 3,
    baseCost: 45,
    maxLevel: 4,
    impactPerLevel: { governance: 1, hazardControl: 0.5, healthVigilance: 0.5, restoration: 3.5 },
    prerequisites: ['res_no_fault'],
    unlockYear: 2035,
    icon: 'UsersRound',
    tags: ['informal', 'gig'],
  },
  {
    id: 'res_digital_claims',
    name: 'Digital Claims Platform',
    description: 'Create an online platform for claims submission, tracking, and appeal with AI-assisted processing.',
    pillar: 'restoration',
    tier: 3,
    baseCost: 30,
    maxLevel: 3,
    impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0.5, restoration: 3 },
    prerequisites: ['res_claims_process'],
    unlockYear: 2035,
    icon: 'Laptop',
    tags: ['technology', 'digital'],
  },
  {
    id: 'res_integrated',
    name: 'Integrated Care Model',
    description: 'Implement a German-style model where prevention, treatment, and compensation are unified.',
    pillar: 'restoration',
    tier: 3,
    baseCost: 50,
    maxLevel: 3,
    impactPerLevel: { governance: 2, hazardControl: 1.5, healthVigilance: 1.5, restoration: 4 },
    prerequisites: ['res_rehab_centers', 'res_rtw_program'],
    unlockYear: 2035,
    icon: 'Combine',
    tags: ['integration', 'model'],
  },
  {
    id: 'res_permanent_support',
    name: 'Lifetime Support Program',
    description: 'Ensure comprehensive lifetime support for workers with permanent disabilities from workplace injuries.',
    pillar: 'restoration',
    tier: 3,
    baseCost: 40,
    maxLevel: 3,
    impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0, restoration: 4 },
    prerequisites: ['res_rehab_centers', 'res_vocational'],
    unlockYear: 2040,
    icon: 'HeartHandshake',
    tags: ['disability', 'support'],
  },
];

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All policy definitions combined
 */
export const ALL_POLICIES: PolicyDefinition[] = [
  ...GOVERNANCE_POLICIES,
  ...HAZARD_CONTROL_POLICIES,
  ...HEALTH_VIGILANCE_POLICIES,
  ...RESTORATION_POLICIES,
];

/**
 * Get policies by pillar
 */
export function getPoliciesByPillar(pillar: PillarId): PolicyDefinition[] {
  return ALL_POLICIES.filter(p => p.pillar === pillar);
}

/**
 * Get policy by ID
 */
export function getPolicyById(id: string): PolicyDefinition | undefined {
  return ALL_POLICIES.find(p => p.id === id);
}

/**
 * Create a Map for efficient lookups
 */
export function createPolicyMap(): Map<string, PolicyDefinition> {
  return new Map(ALL_POLICIES.map(p => [p.id, p]));
}

/**
 * Get available policies for a given year (unlocked)
 */
export function getAvailablePolicies(year: number, activePolicyIds: string[]): PolicyDefinition[] {
  const activePolicies = new Set(activePolicyIds);
  
  return ALL_POLICIES.filter(policy => {
    // Check if unlocked by year
    if (policy.unlockYear > year) return false;
    
    // Check if prerequisites are met
    return policy.prerequisites.every(prereq => activePolicies.has(prereq));
  });
}

/**
 * Calculate total cost of current policy investments
 */
export function calculateTotalPolicyCost(
  policies: Array<{ policyId: string; currentLevel: number }>,
  policyMap: Map<string, PolicyDefinition>
): number {
  let total = 0;
  
  for (const p of policies) {
    const def = policyMap.get(p.policyId);
    if (!def) continue;
    
    // Cost per level with slight increase for higher levels
    for (let level = 1; level <= p.currentLevel; level++) {
      total += def.baseCost * (1 + (level - 1) * 0.1);
    }
  }
  
  return Math.round(total);
}

export default ALL_POLICIES;
