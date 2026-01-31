/**
 * Sovereign Health: Policy Definitions
 * 48 policy intervention cards across all 4 pillars
 */

import type { PolicyDefinition, PillarId } from '../components/simulator/types';

// ============================================================================
// GOVERNANCE POLICIES (12)
// ============================================================================

const GOVERNANCE_POLICIES: PolicyDefinition[] = [
  { id: 'gov_osh_law', name: 'National OSH Law', description: 'Establish comprehensive OSH legislation', pillar: 'governance', tier: 1, baseCost: 15, maxLevel: 3, impactPerLevel: { governance: 3, hazardControl: 1, healthVigilance: 0.5, restoration: 0.5 }, prerequisites: [], unlockYear: 2025, icon: 'ScrollText', tags: ['legal'] },
  { id: 'gov_ilo_c155', name: 'Ratify ILO C155', description: 'Ratify the ILO OSH Convention', pillar: 'governance', tier: 1, baseCost: 10, maxLevel: 1, impactPerLevel: { governance: 5, hazardControl: 1, healthVigilance: 1, restoration: 1 }, prerequisites: ['gov_osh_law'], unlockYear: 2025, icon: 'Globe', tags: ['convention'] },
  { id: 'gov_ilo_c187', name: 'Ratify ILO C187', description: 'Ratify the Promotional Framework Convention', pillar: 'governance', tier: 1, baseCost: 10, maxLevel: 1, impactPerLevel: { governance: 5, hazardControl: 1, healthVigilance: 1, restoration: 1 }, prerequisites: ['gov_ilo_c155'], unlockYear: 2025, icon: 'Globe2', tags: ['convention'] },
  { id: 'gov_inspectors', name: 'Expand Inspectors', description: 'Increase labor inspector workforce', pillar: 'governance', tier: 1, baseCost: 25, maxLevel: 5, impactPerLevel: { governance: 2.5, hazardControl: 2, healthVigilance: 0.5, restoration: 0 }, prerequisites: ['gov_osh_law'], unlockYear: 2025, icon: 'Users', tags: ['enforcement'] },
  { id: 'gov_tripartite', name: 'Tripartite Council', description: 'Establish national OSH dialogue body', pillar: 'governance', tier: 2, baseCost: 20, maxLevel: 3, impactPerLevel: { governance: 3, hazardControl: 0.5, healthVigilance: 0.5, restoration: 1 }, prerequisites: ['gov_osh_law'], unlockYear: 2030, icon: 'Users2', tags: ['dialogue'] },
  { id: 'gov_whistleblower', name: 'Whistleblower Protection', description: 'Legal protections for safety reporters', pillar: 'governance', tier: 2, baseCost: 15, maxLevel: 3, impactPerLevel: { governance: 2, hazardControl: 2, healthVigilance: 1, restoration: 0 }, prerequisites: ['gov_osh_law'], unlockYear: 2030, icon: 'Megaphone', tags: ['protection'] },
  { id: 'gov_digital_platform', name: 'Digital Enforcement', description: 'Digital inspection and compliance system', pillar: 'governance', tier: 2, baseCost: 30, maxLevel: 4, impactPerLevel: { governance: 2, hazardControl: 1.5, healthVigilance: 1, restoration: 0.5 }, prerequisites: ['gov_inspectors'], unlockYear: 2030, icon: 'MonitorSmartphone', tags: ['technology'] },
  { id: 'gov_national_agency', name: 'National OSH Agency', description: 'Create dedicated national agency', pillar: 'governance', tier: 2, baseCost: 35, maxLevel: 3, impactPerLevel: { governance: 4, hazardControl: 1, healthVigilance: 1, restoration: 1 }, prerequisites: ['gov_tripartite', 'gov_inspectors'], unlockYear: 2030, icon: 'Building2', tags: ['institution'] },
  { id: 'gov_penalty_reform', name: 'Penalty Reform', description: 'Increase violation penalties', pillar: 'governance', tier: 3, baseCost: 20, maxLevel: 3, impactPerLevel: { governance: 3, hazardControl: 3, healthVigilance: 0, restoration: 0 }, prerequisites: ['gov_national_agency'], unlockYear: 2035, icon: 'Gavel', tags: ['enforcement'] },
  { id: 'gov_public_registry', name: 'Public Registry', description: 'Public violation database', pillar: 'governance', tier: 3, baseCost: 15, maxLevel: 2, impactPerLevel: { governance: 2, hazardControl: 2, healthVigilance: 0.5, restoration: 0 }, prerequisites: ['gov_digital_platform'], unlockYear: 2035, icon: 'FileSearch', tags: ['transparency'] },
  { id: 'gov_research_institute', name: 'OSH Research Institute', description: 'National research institution', pillar: 'governance', tier: 3, baseCost: 40, maxLevel: 3, impactPerLevel: { governance: 2, hazardControl: 2, healthVigilance: 3, restoration: 1 }, prerequisites: ['gov_national_agency'], unlockYear: 2035, icon: 'FlaskConical', tags: ['research'] },
  { id: 'gov_international_leader', name: 'International Leadership', description: 'Global OSH leadership role', pillar: 'governance', tier: 3, baseCost: 25, maxLevel: 2, impactPerLevel: { governance: 4, hazardControl: 1, healthVigilance: 1, restoration: 1 }, prerequisites: ['gov_ilo_c187', 'gov_national_agency'], unlockYear: 2040, icon: 'Flag', tags: ['international'] },
];

// ============================================================================
// HAZARD CONTROL POLICIES (12)
// ============================================================================

const HAZARD_CONTROL_POLICIES: PolicyDefinition[] = [
  { id: 'haz_risk_assessment', name: 'Mandatory Risk Assessments', description: 'Required workplace risk assessments', pillar: 'hazardControl', tier: 1, baseCost: 20, maxLevel: 4, impactPerLevel: { governance: 0.5, hazardControl: 3, healthVigilance: 1, restoration: 0 }, prerequisites: [], unlockYear: 2025, icon: 'ClipboardCheck', tags: ['assessment'] },
  { id: 'haz_oel_standards', name: 'OEL Standards', description: 'Occupational exposure limits', pillar: 'hazardControl', tier: 1, baseCost: 15, maxLevel: 3, impactPerLevel: { governance: 0.5, hazardControl: 3.5, healthVigilance: 0.5, restoration: 0 }, prerequisites: [], unlockYear: 2025, icon: 'Gauge', tags: ['standards'] },
  { id: 'haz_safety_training', name: 'Safety Training', description: 'Mandatory worker training', pillar: 'hazardControl', tier: 1, baseCost: 25, maxLevel: 5, impactPerLevel: { governance: 0, hazardControl: 2.5, healthVigilance: 0.5, restoration: 0 }, prerequisites: [], unlockYear: 2025, icon: 'GraduationCap', tags: ['training'] },
  { id: 'haz_ppe_program', name: 'PPE Program', description: 'PPE provision requirements', pillar: 'hazardControl', tier: 1, baseCost: 20, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 2.5, healthVigilance: 0, restoration: 0.5 }, prerequisites: [], unlockYear: 2025, icon: 'HardHat', tags: ['equipment'] },
  { id: 'haz_chemical_registry', name: 'Chemical Registry', description: 'National hazardous substance database', pillar: 'hazardControl', tier: 2, baseCost: 25, maxLevel: 3, impactPerLevel: { governance: 1, hazardControl: 3, healthVigilance: 2, restoration: 0 }, prerequisites: ['haz_oel_standards'], unlockYear: 2030, icon: 'FlaskConical', tags: ['chemical'] },
  { id: 'haz_heat_stress', name: 'Heat Stress Regulations', description: 'Outdoor work heat protections', pillar: 'hazardControl', tier: 2, baseCost: 15, maxLevel: 3, impactPerLevel: { governance: 0.5, hazardControl: 3, healthVigilance: 0.5, restoration: 0 }, prerequisites: ['haz_risk_assessment'], unlockYear: 2030, icon: 'Thermometer', tags: ['climate'] },
  { id: 'haz_ergonomics', name: 'Ergonomics Standards', description: 'Musculoskeletal disorder prevention', pillar: 'hazardControl', tier: 2, baseCost: 20, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 2.5, healthVigilance: 1, restoration: 1 }, prerequisites: ['haz_risk_assessment'], unlockYear: 2030, icon: 'Armchair', tags: ['ergonomics'] },
  { id: 'haz_sme_grants', name: 'SME Safety Grants', description: 'Financial aid for small businesses', pillar: 'hazardControl', tier: 2, baseCost: 30, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 2, healthVigilance: 0.5, restoration: 0.5 }, prerequisites: ['haz_ppe_program'], unlockYear: 2030, icon: 'Wallet', tags: ['financial'] },
  { id: 'haz_carcinogen_ban', name: 'Carcinogen Phase-Out', description: 'Ban dangerous carcinogens', pillar: 'hazardControl', tier: 3, baseCost: 35, maxLevel: 3, impactPerLevel: { governance: 1, hazardControl: 4, healthVigilance: 2, restoration: 0 }, prerequisites: ['haz_chemical_registry'], unlockYear: 2035, icon: 'Ban', tags: ['elimination'] },
  { id: 'haz_automation', name: 'Hazardous Work Automation', description: 'Robotics for dangerous tasks', pillar: 'hazardControl', tier: 3, baseCost: 45, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 3, healthVigilance: 0.5, restoration: 1 }, prerequisites: ['haz_risk_assessment'], unlockYear: 2035, icon: 'Bot', tags: ['technology'] },
  { id: 'haz_psychosocial', name: 'Psychosocial Risk Management', description: 'Mental health hazard controls', pillar: 'hazardControl', tier: 3, baseCost: 25, maxLevel: 4, impactPerLevel: { governance: 0.5, hazardControl: 2, healthVigilance: 2.5, restoration: 1 }, prerequisites: ['haz_risk_assessment', 'haz_ergonomics'], unlockYear: 2035, icon: 'Brain', tags: ['mental'] },
  { id: 'haz_zero_fatality', name: 'Vision Zero Program', description: 'Zero fatality campaign', pillar: 'hazardControl', tier: 3, baseCost: 40, maxLevel: 3, impactPerLevel: { governance: 2, hazardControl: 4, healthVigilance: 1, restoration: 0 }, prerequisites: ['haz_safety_training', 'haz_sme_grants'], unlockYear: 2040, icon: 'Target', tags: ['campaign'] },
];

// ============================================================================
// HEALTH VIGILANCE POLICIES (12)
// ============================================================================

const HEALTH_VIGILANCE_POLICIES: PolicyDefinition[] = [
  { id: 'vig_health_exams', name: 'Health Examinations', description: 'Periodic worker health checks', pillar: 'healthVigilance', tier: 1, baseCost: 25, maxLevel: 5, impactPerLevel: { governance: 0, hazardControl: 0.5, healthVigilance: 3, restoration: 1 }, prerequisites: [], unlockYear: 2025, icon: 'Stethoscope', tags: ['medical'] },
  { id: 'vig_disease_registry', name: 'Disease Registry', description: 'National occupational disease database', pillar: 'healthVigilance', tier: 1, baseCost: 20, maxLevel: 3, impactPerLevel: { governance: 1, hazardControl: 0.5, healthVigilance: 3.5, restoration: 0.5 }, prerequisites: [], unlockYear: 2025, icon: 'Database', tags: ['registry'] },
  { id: 'vig_incident_reporting', name: 'Incident Reporting', description: 'Standardized incident reporting system', pillar: 'healthVigilance', tier: 1, baseCost: 15, maxLevel: 4, impactPerLevel: { governance: 0.5, hazardControl: 1.5, healthVigilance: 2.5, restoration: 0 }, prerequisites: [], unlockYear: 2025, icon: 'FileWarning', tags: ['reporting'] },
  { id: 'vig_exposure_monitoring', name: 'Exposure Monitoring', description: 'Workplace air quality monitoring', pillar: 'healthVigilance', tier: 1, baseCost: 20, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 2, healthVigilance: 2.5, restoration: 0 }, prerequisites: [], unlockYear: 2025, icon: 'Wind', tags: ['monitoring'] },
  { id: 'vig_biomarker', name: 'Biomarker Monitoring', description: 'Biological exposure monitoring', pillar: 'healthVigilance', tier: 2, baseCost: 30, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 1, healthVigilance: 3.5, restoration: 0.5 }, prerequisites: ['vig_health_exams', 'vig_exposure_monitoring'], unlockYear: 2030, icon: 'TestTube', tags: ['biological'] },
  { id: 'vig_mental_screening', name: 'Mental Health Screening', description: 'Workplace mental health assessments', pillar: 'healthVigilance', tier: 2, baseCost: 20, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 0.5, healthVigilance: 2.5, restoration: 1.5 }, prerequisites: ['vig_health_exams'], unlockYear: 2030, icon: 'HeartPulse', tags: ['mental'] },
  { id: 'vig_mobile_units', name: 'Mobile Health Units', description: 'Outreach health screening', pillar: 'healthVigilance', tier: 2, baseCost: 25, maxLevel: 3, impactPerLevel: { governance: 0, hazardControl: 0.5, healthVigilance: 2.5, restoration: 1 }, prerequisites: ['vig_health_exams'], unlockYear: 2030, icon: 'Truck', tags: ['access'] },
  { id: 'vig_digital_health', name: 'Digital Health Records', description: 'Integrated health tracking system', pillar: 'healthVigilance', tier: 2, baseCost: 35, maxLevel: 3, impactPerLevel: { governance: 1, hazardControl: 0.5, healthVigilance: 3, restoration: 1 }, prerequisites: ['vig_disease_registry', 'vig_incident_reporting'], unlockYear: 2030, icon: 'FileHeart', tags: ['technology'] },
  { id: 'vig_ai_detection', name: 'AI Disease Detection', description: 'AI-powered pattern recognition', pillar: 'healthVigilance', tier: 3, baseCost: 40, maxLevel: 3, impactPerLevel: { governance: 0.5, hazardControl: 1, healthVigilance: 4, restoration: 0.5 }, prerequisites: ['vig_digital_health', 'vig_biomarker'], unlockYear: 2035, icon: 'Cpu', tags: ['ai'] },
  { id: 'vig_sentinel', name: 'Sentinel Network', description: 'Advanced epidemiological surveillance', pillar: 'healthVigilance', tier: 3, baseCost: 30, maxLevel: 3, impactPerLevel: { governance: 1, hazardControl: 1.5, healthVigilance: 3, restoration: 0.5 }, prerequisites: ['vig_disease_registry'], unlockYear: 2035, icon: 'Radar', tags: ['surveillance'] },
  { id: 'vig_cross_border', name: 'Cross-Border Records', description: 'International health data sharing', pillar: 'healthVigilance', tier: 3, baseCost: 25, maxLevel: 2, impactPerLevel: { governance: 1.5, hazardControl: 0.5, healthVigilance: 2.5, restoration: 1 }, prerequisites: ['vig_digital_health'], unlockYear: 2035, icon: 'Globe', tags: ['international'] },
  { id: 'vig_predictive', name: 'Predictive Analytics', description: 'Big data health forecasting', pillar: 'healthVigilance', tier: 3, baseCost: 45, maxLevel: 3, impactPerLevel: { governance: 0.5, hazardControl: 2, healthVigilance: 3.5, restoration: 0.5 }, prerequisites: ['vig_ai_detection'], unlockYear: 2040, icon: 'TrendingUp', tags: ['analytics'] },
];

// ============================================================================
// RESTORATION POLICIES (12)
// ============================================================================

const RESTORATION_POLICIES: PolicyDefinition[] = [
  { id: 'res_compensation_law', name: 'Compensation Law', description: 'Workers compensation framework', pillar: 'restoration', tier: 1, baseCost: 25, maxLevel: 4, impactPerLevel: { governance: 1, hazardControl: 0, healthVigilance: 0.5, restoration: 3 }, prerequisites: [], unlockYear: 2025, icon: 'Scale', tags: ['legal'] },
  { id: 'res_claims_process', name: 'Streamlined Claims', description: 'Fast claims processing', pillar: 'restoration', tier: 1, baseCost: 15, maxLevel: 4, impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0, restoration: 3 }, prerequisites: ['res_compensation_law'], unlockYear: 2025, icon: 'FileCheck', tags: ['process'] },
  { id: 'res_medical_care', name: 'Medical Care Coverage', description: 'Injury treatment coverage', pillar: 'restoration', tier: 1, baseCost: 30, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 1, restoration: 3 }, prerequisites: ['res_compensation_law'], unlockYear: 2025, icon: 'Cross', tags: ['medical'] },
  { id: 'res_temp_benefits', name: 'Disability Benefits', description: 'Income replacement during recovery', pillar: 'restoration', tier: 1, baseCost: 20, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 3 }, prerequisites: ['res_compensation_law'], unlockYear: 2025, icon: 'Coins', tags: ['benefits'] },
  { id: 'res_no_fault', name: 'No-Fault Insurance', description: 'Remove negligence requirements', pillar: 'restoration', tier: 2, baseCost: 35, maxLevel: 3, impactPerLevel: { governance: 1.5, hazardControl: 0, healthVigilance: 0, restoration: 4 }, prerequisites: ['res_compensation_law', 'res_claims_process'], unlockYear: 2030, icon: 'Shield', tags: ['reform'] },
  { id: 'res_rehab_centers', name: 'Rehabilitation Centers', description: 'Specialized recovery facilities', pillar: 'restoration', tier: 2, baseCost: 40, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 1, restoration: 3.5 }, prerequisites: ['res_medical_care'], unlockYear: 2030, icon: 'Building', tags: ['facilities'] },
  { id: 'res_rtw_program', name: 'Return-to-Work Program', description: 'Structured reintegration support', pillar: 'restoration', tier: 2, baseCost: 25, maxLevel: 4, impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0.5, restoration: 3.5 }, prerequisites: ['res_temp_benefits'], unlockYear: 2030, icon: 'ArrowRight', tags: ['rtw'] },
  { id: 'res_vocational', name: 'Vocational Retraining', description: 'Career transition support', pillar: 'restoration', tier: 2, baseCost: 30, maxLevel: 4, impactPerLevel: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 3 }, prerequisites: ['res_rtw_program'], unlockYear: 2030, icon: 'BookOpen', tags: ['training'] },
  { id: 'res_informal_coverage', name: 'Informal Sector Coverage', description: 'Extend to gig workers', pillar: 'restoration', tier: 3, baseCost: 45, maxLevel: 4, impactPerLevel: { governance: 1, hazardControl: 0.5, healthVigilance: 0.5, restoration: 3.5 }, prerequisites: ['res_no_fault'], unlockYear: 2035, icon: 'UsersRound', tags: ['informal'] },
  { id: 'res_digital_claims', name: 'Digital Claims Platform', description: 'Online claims management', pillar: 'restoration', tier: 3, baseCost: 30, maxLevel: 3, impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0.5, restoration: 3 }, prerequisites: ['res_claims_process'], unlockYear: 2035, icon: 'Laptop', tags: ['digital'] },
  { id: 'res_integrated', name: 'Integrated Care Model', description: 'Unified prevention-treatment system', pillar: 'restoration', tier: 3, baseCost: 50, maxLevel: 3, impactPerLevel: { governance: 2, hazardControl: 1.5, healthVigilance: 1.5, restoration: 4 }, prerequisites: ['res_rehab_centers', 'res_rtw_program'], unlockYear: 2035, icon: 'Combine', tags: ['integration'] },
  { id: 'res_permanent_support', name: 'Lifetime Support', description: 'Permanent disability support', pillar: 'restoration', tier: 3, baseCost: 40, maxLevel: 3, impactPerLevel: { governance: 0.5, hazardControl: 0, healthVigilance: 0, restoration: 4 }, prerequisites: ['res_rehab_centers', 'res_vocational'], unlockYear: 2040, icon: 'HeartHandshake', tags: ['support'] },
];

// ============================================================================
// EXPORTS
// ============================================================================

export const ALL_POLICIES: PolicyDefinition[] = [
  ...GOVERNANCE_POLICIES,
  ...HAZARD_CONTROL_POLICIES,
  ...HEALTH_VIGILANCE_POLICIES,
  ...RESTORATION_POLICIES,
];

export function getPoliciesByPillar(pillar: PillarId): PolicyDefinition[] {
  return ALL_POLICIES.filter(p => p.pillar === pillar);
}

export function getPolicyById(id: string): PolicyDefinition | undefined {
  return ALL_POLICIES.find(p => p.id === id);
}

export function createPolicyMap(): Map<string, PolicyDefinition> {
  return new Map(ALL_POLICIES.map(p => [p.id, p]));
}

export function getAvailablePolicies(year: number, activePolicyIds: string[]): PolicyDefinition[] {
  const activePolicies = new Set(activePolicyIds);
  return ALL_POLICIES.filter(policy => {
    if (policy.unlockYear > year) return false;
    return policy.prerequisites.every(prereq => activePolicies.has(prereq));
  });
}

export function calculateTotalPolicyCost(
  policies: Array<{ policyId: string; currentLevel: number }>,
  policyMap: Map<string, PolicyDefinition>
): number {
  let total = 0;
  for (const p of policies) {
    const def = policyMap.get(p.policyId);
    if (!def) continue;
    for (let level = 1; level <= p.currentLevel; level++) {
      total += def.baseCost * (1 + (level - 1) * 0.1);
    }
  }
  return Math.round(total);
}

export default ALL_POLICIES;
