/**
 * Arthur D. Little - Global Health Platform
 * Saudi Arabia Labor Force Personas
 * 
 * Research-backed persona definitions representing key labor force segments
 * Based on Q2 2025 GASTAT data, GOSI coverage regulations, and Vision 2030 reports
 */

import { 
  Briefcase, 
  Users, 
  HardHat, 
  Home, 
  GraduationCap,
  type LucideIcon 
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface PersonaSource {
  title: string;
  url: string;
  type: 'official' | 'academic' | 'news';
  date: string;
}

export interface PersonaJourneyStep {
  title: string;
  description: string;
  duration: string;
  icon: string;
}

export interface PersonaDemographics {
  populationShare: number;
  participationRate: number;
  unemploymentRate: number;
  keyAgeGroup: string;
  primarySectors: string[];
}

export interface PersonaCoverage {
  annuities: boolean;
  occupationalHazards: boolean;
  contributionRate: string;
  payer: 'employer' | 'shared' | 'none';
  gaps: string[];
}

export interface PersonaOHJourney {
  steps: PersonaJourneyStep[];
  totalDuration: string;
  outcome: string;
}

export interface PersonaResearch {
  keyRisks: string[];
  challenges: string[];
  recentChanges: string[];
  sources: PersonaSource[];
}

export interface Persona {
  id: string;
  name: string;
  arabicName: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  color: string;
  gradient: string;
  icon: LucideIcon;
  demographics: PersonaDemographics;
  coverage: PersonaCoverage;
  ohJourney: PersonaOHJourney;
  research: PersonaResearch;
}

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

export const personas: Persona[] = [
  {
    id: "saudi-male-professional",
    name: "Saudi Male Professional",
    arabicName: "الموظف السعودي",
    tagline: "The Backbone of Saudization",
    description: "Full-time Saudi national working in the private or government sector. Represents the primary beneficiary of Nitaqat policies and Vision 2030 workforce nationalization efforts.",
    avatarUrl: "/personas/saudi-male-professional.png",
    color: "purple",
    gradient: "from-purple-500/20 to-violet-600/20",
    icon: Briefcase,
    demographics: {
      populationShare: 24,
      participationRate: 64.0,
      unemploymentRate: 4.3,
      keyAgeGroup: "25-54",
      primarySectors: ["Government", "Finance & Banking", "Oil & Gas", "Technology", "Healthcare"],
    },
    coverage: {
      annuities: true,
      occupationalHazards: true,
      contributionRate: "22% (phased by 2028)",
      payer: "shared",
      gaps: [
        "Mental health coverage still developing",
        "Long-term disability support varies by sector",
      ],
    },
    ohJourney: {
      steps: [
        {
          title: "Incident Report",
          description: "POSITIVE: Legal requirement ensures timely documentation. Worker must report within 24 hours to employer, who has 3 days to notify GOSI. Medical attention prioritized immediately. Digital reporting via GOSI portal streamlines process. CHALLENGE: Some workers delay reporting due to fear of employer reaction or job security concerns.",
          duration: "1-2 days",
          icon: "FileText",
        },
        {
          title: "GOSI Notification",
          description: "POSITIVE: Employer bears administrative burden - worker doesn't file directly. Electronic submission ensures tracking and transparency. GOSI assigns case manager within 48 hours. CHALLENGE: Employer non-compliance can delay benefits. Workers may be unaware of their rights if employer fails to file.",
          duration: "3-5 days",
          icon: "Send",
        },
        {
          title: "Medical Treatment",
          description: "POSITIVE: Comprehensive coverage at GOSI-approved hospitals and rehabilitation centers. Zero out-of-pocket costs including surgeries, medications, and prosthetics. Access to specialist care without referral delays. INSIGHT: Saudi nationals can choose from extensive network of facilities. Quality of care is generally high in urban areas.",
          duration: "Varies",
          icon: "Stethoscope",
        },
        {
          title: "Wage Replacement",
          description: "EXCELLENT BENEFIT: 100% salary continuation during entire recovery period - among the most generous globally. Paid directly by GOSI, not employer, ensuring reliability. Continues for up to 12 months of temporary disability. If permanent, transitions to disability pension. IMPACT: Financial security allows focus on recovery without economic stress.",
          duration: "Up to 12 months",
          icon: "Wallet",
        },
        {
          title: "Rehabilitation",
          description: "POSITIVE: Access to physical therapy, occupational therapy, and vocational rehabilitation. Prosthetics and assistive devices fully covered. Psychological support increasingly available. OPPORTUNITY: Gradual return-to-work programs help smooth transition. CHALLENGE: Services better in major cities; rural access limited. Mental health rehab still developing.",
          duration: "1-6 months",
          icon: "HeartPulse",
        },
        {
          title: "Return to Work",
          description: "STRONG PROTECTION: Job is legally protected during recovery. Employer cannot terminate due to occupational injury. Modified duties must be offered if medically advised. PERMANENT DISABILITY: If unable to return, GOSI provides disability pension (up to 100% of salary for total disability). CHALLENGE: Reintegration can be difficult if workplace culture is unsupportive.",
          duration: "Ongoing",
          icon: "Building2",
        },
      ],
      totalDuration: "2-18 months typical",
      outcome: "Strong protection with full wage replacement and rehabilitation access",
    },
    research: {
      keyRisks: [
        "Musculoskeletal disorders from desk work",
        "Work-related stress and burnout",
        "Eye strain from screen exposure",
        "Cardiovascular issues from sedentary work",
      ],
      challenges: [
        "Mental health stigma in workplace",
        "Limited ergonomic awareness",
        "Work-life balance pressures",
        "Career progression anxiety",
      ],
      recentChanges: [
        "New Social Insurance Law (2024) with enhanced benefits",
        "Increased contribution rates phased through 2028",
        "Mental health initiatives under Vision 2030",
        "Remote work policies post-pandemic",
      ],
      sources: [
        {
          title: "GASTAT Labor Market Statistics Q2 2025",
          url: "https://www.stats.gov.sa/en/w/labour-force-survey",
          type: "official",
          date: "2025-06",
        },
        {
          title: "GOSI Social Insurance Law",
          url: "https://www.gosi.gov.sa",
          type: "official",
          date: "2024-07",
        },
        {
          title: "Vision 2030 Labor Market Reforms",
          url: "https://www.vision2030.gov.sa",
          type: "official",
          date: "2024",
        },
      ],
    },
  },
  {
    id: "saudi-female-professional",
    name: "Saudi Female Professional",
    arabicName: "الموظفة السعودية",
    tagline: "Vision 2030's Rising Force",
    description: "Saudi women entering the workforce at unprecedented rates. A key driver of Vision 2030's goal to increase female labor participation to 30%+.",
    avatarUrl: "/personas/saudi-female-professional.png",
    color: "cyan",
    gradient: "from-cyan-500/20 to-teal-600/20",
    icon: Users,
    demographics: {
      populationShare: 12,
      participationRate: 34.5,
      unemploymentRate: 11.3,
      keyAgeGroup: "25-44",
      primarySectors: ["Education", "Healthcare", "Retail", "Finance", "Tourism"],
    },
    coverage: {
      annuities: true,
      occupationalHazards: true,
      contributionRate: "22% (phased by 2028)",
      payer: "shared",
      gaps: [
        "Maternity leave coordination with GOSI",
        "Workplace harassment protections developing",
        "Childcare support limited",
      ],
    },
    ohJourney: {
      steps: [
        {
          title: "Incident Report",
          description: "POSITIVE: Identical rights and process as male colleagues - no gender discrimination in GOSI. Equal 24-hour reporting requirement. BENEFIT: Female-only medical facilities available in some regions if preferred. CHALLENGE: Workplace harassment incidents may be underreported due to cultural sensitivities.",
          duration: "1-2 days",
          icon: "FileText",
        },
        {
          title: "GOSI Notification",
          description: "POSITIVE: Same employer obligations apply. SPECIAL PROTECTION: Pregnant workers have additional safeguards - injury during pregnancy triggers enhanced monitoring. Maternity-related complications during work are covered. IMPORTANT: Occupational injury benefits are separate from and in addition to maternity leave entitlements.",
          duration: "3-5 days",
          icon: "Send",
        },
        {
          title: "Medical Treatment",
          description: "COMPREHENSIVE: Full coverage includes gender-specific health needs. OB/GYN consultations covered if injury affects reproductive health. Female doctors available on request in most facilities. POSITIVE: Recent reforms have expanded women's healthcare access significantly. INSIGHT: Mental health support for work-related stress increasingly available.",
          duration: "Varies",
          icon: "Stethoscope",
        },
        {
          title: "Wage Replacement",
          description: "EXCELLENT: 100% salary continuation - same as male workers. KEY DISTINCTION: These benefits are completely separate from maternity leave (90 days paid). A woman injured at work AND pregnant receives BOTH benefit streams. EMPOWERMENT: Financial independence maintained during recovery, crucial for single-income households.",
          duration: "Up to 12 months",
          icon: "Wallet",
        },
        {
          title: "Rehabilitation",
          description: "POSITIVE: Equal access to all rehabilitation services. Female-focused programs emerging in major cities. FLEXIBILITY: Schedules can accommodate childcare responsibilities where needed. CHALLENGE: Transportation to rehab centers was historically difficult; post-2018 driving reforms have significantly improved access.",
          duration: "1-6 months",
          icon: "HeartPulse",
        },
        {
          title: "Return to Work",
          description: "STRONG PROTECTION: Same job protection as male workers. Remote work options increasingly available for suitable roles. PROGRESSIVE: Vision 2030 has created more female-friendly workplace policies. OPPORTUNITY: Part-time return options help balance recovery with family needs. CHALLENGE: Career progression concerns during extended absence.",
          duration: "Ongoing",
          icon: "Building2",
        },
      ],
      totalDuration: "2-18 months typical",
      outcome: "Equal coverage with additional gender-specific protections",
    },
    research: {
      keyRisks: [
        "Workplace harassment and discrimination",
        "Work-related stress from dual responsibilities",
        "Ergonomic issues in new work environments",
        "Transportation-related safety concerns",
      ],
      challenges: [
        "Balancing career with family expectations",
        "Limited senior role representation",
        "Workplace culture adaptation",
        "Childcare availability",
      ],
      recentChanges: [
        "Women driving reform (2018) enabling transportation independence",
        "Anti-harassment legislation strengthened",
        "Remote work policies benefiting working mothers",
        "Female participation rate doubled since 2016",
      ],
      sources: [
        {
          title: "GASTAT Labor Market Statistics Q2 2025",
          url: "https://www.stats.gov.sa/en/w/labour-force-survey",
          type: "official",
          date: "2025-06",
        },
        {
          title: "Vision 2030 Female Empowerment Report",
          url: "https://www.vision2030.gov.sa",
          type: "official",
          date: "2024",
        },
        {
          title: "ILO Women at Work Report - Saudi Arabia",
          url: "https://www.ilo.org",
          type: "academic",
          date: "2024",
        },
      ],
    },
  },
  {
    id: "migrant-construction-worker",
    name: "Migrant Construction Worker",
    arabicName: "العامل المهاجر",
    tagline: "Building the Kingdom",
    description: "Expatriate workers forming approximately 76% of the private sector workforce. Essential to Saudi Arabia's infrastructure development but with limited social protections.",
    avatarUrl: "/personas/migrant-construction-worker.png",
    color: "amber",
    gradient: "from-amber-500/20 to-orange-600/20",
    icon: HardHat,
    demographics: {
      populationShare: 45,
      participationRate: 95.0,
      unemploymentRate: 0.5,
      keyAgeGroup: "20-45",
      primarySectors: ["Construction", "Manufacturing", "Transportation", "Utilities", "Mining"],
    },
    coverage: {
      annuities: false,
      occupationalHazards: true,
      contributionRate: "2% employer only",
      payer: "employer",
      gaps: [
        "No retirement/pension benefits",
        "No unemployment insurance",
        "End-of-service benefits only",
        "Limited legal recourse for disputes",
      ],
    },
    ohJourney: {
      steps: [
        {
          title: "Incident Report",
          description: "CHALLENGE: Reporting depends entirely on employer cooperation. Language barriers (Arabic/English vs. Urdu/Hindi/Bengali) create significant obstacles. Some workers fear reporting due to potential deportation concerns. POSITIVE: Labor reforms now require employers to provide safety training in native languages. Emergency hotlines available in multiple languages.",
          duration: "1-3 days",
          icon: "FileText",
        },
        {
          title: "GOSI Claim",
          description: "CRITICAL DEPENDENCY: Worker cannot file directly - only employer can submit to GOSI. This creates vulnerability if employer is uncooperative or attempts to avoid premium increases. POSITIVE: GOSI now allows anonymous complaints against non-compliant employers. Wage Protection System creates paper trail. RISK: Undocumented injuries go unreported.",
          duration: "5-10 days",
          icon: "Send",
        },
        {
          title: "Medical Treatment",
          description: "POSITIVE: When properly filed, GOSI covers all medical expenses including emergency surgery. Treatment at approved hospitals regardless of nationality. REALITY: Quality varies significantly - major city hospitals excellent, remote site clinics basic. CHALLENGE: Follow-up care difficult if worker transferred to different site or repatriated.",
          duration: "Varies",
          icon: "Stethoscope",
        },
        {
          title: "Wage Replacement",
          description: "PARTIAL BENEFIT: Unlike Saudi workers, migrant workers receive only partial wage replacement (typically 75% of basic salary). Duration limited compared to nationals. PRESSURE: Many workers report employer pressure to return to work before full recovery due to project deadlines. POSITIVE: Recent reforms strengthening enforcement of wage protection.",
          duration: "Limited",
          icon: "Wallet",
        },
        {
          title: "Recovery Period",
          description: "CHALLENGE: Limited access to specialized rehabilitation services. Worker typically remains in employer-provided housing during recovery. Physical therapy options minimal at labor camps. IMPROVEMENT: Major projects now required to have on-site medical facilities. Mental health support virtually non-existent. Family support impossible due to distance.",
          duration: "Variable",
          icon: "HeartPulse",
        },
        {
          title: "Outcome",
          description: "TWO PATHS: Either return to work on same project, OR repatriation if unable to work. PERMANENT DISABILITY: May receive lump-sum compensation but no ongoing pension. Repatriation often means worker bears cost of continued care at home. REFORM NEEDED: No pathway to remain in Saudi Arabia for long-term rehabilitation. End-of-service benefits may help but are often inadequate for lifetime disability.",
          duration: "Varies",
          icon: "Plane",
        },
      ],
      totalDuration: "Highly variable",
      outcome: "Basic coverage with significant gaps in long-term support",
    },
    research: {
      keyRisks: [
        "Falls from height (leading cause of death)",
        "Heat stress and dehydration",
        "Machinery and equipment injuries",
        "Respiratory hazards from dust/chemicals",
        "Electrical hazards",
      ],
      challenges: [
        "Language barriers affecting safety training",
        "Kafala (sponsorship) system limitations",
        "Overcrowded living conditions",
        "Limited access to legal support",
        "Wage theft and delayed payments",
      ],
      recentChanges: [
        "Labor reform initiatives reducing Kafala restrictions",
        "Wage Protection System (WPS) implementation",
        "Heat work ban during summer midday hours",
        "Insurance product for unpaid wages (2024)",
      ],
      sources: [
        {
          title: "GOSI Occupational Hazards Coverage Guide",
          url: "https://www.gosi.gov.sa",
          type: "official",
          date: "2024",
        },
        {
          title: "HRSD Expatriate Worker Insurance Guidelines",
          url: "https://www.hrsd.gov.sa",
          type: "official",
          date: "2024",
        },
        {
          title: "ILO Migration and Occupational Safety Report",
          url: "https://www.ilo.org",
          type: "academic",
          date: "2024",
        },
      ],
    },
  },
  {
    id: "domestic-worker",
    name: "Domestic Worker",
    arabicName: "العامل المنزلي",
    tagline: "The Invisible Workforce",
    description: "Housemaids, drivers, and gardeners working in private households. Explicitly excluded from GOSI coverage, representing the most vulnerable segment of the labor force.",
    avatarUrl: "/personas/domestic-worker.png",
    color: "rose",
    gradient: "from-rose-500/20 to-pink-600/20",
    icon: Home,
    demographics: {
      populationShare: 15,
      participationRate: 98.0,
      unemploymentRate: 0.2,
      keyAgeGroup: "25-50",
      primarySectors: ["Private Households"],
    },
    coverage: {
      annuities: false,
      occupationalHazards: false,
      contributionRate: "None",
      payer: "none",
      gaps: [
        "Completely excluded from GOSI",
        "No occupational injury coverage",
        "No pension or retirement benefits",
        "Dependent on employer goodwill",
        "Limited healthcare access",
      ],
    },
    ohJourney: {
      steps: [
        {
          title: "Incident Occurs",
          description: "Injury in household. No formal reporting system exists.",
          duration: "Immediate",
          icon: "AlertTriangle",
        },
        {
          title: "Employer Decision",
          description: "Treatment depends entirely on employer's willingness to pay.",
          duration: "Variable",
          icon: "User",
        },
        {
          title: "Medical Care",
          description: "May be taken to hospital. Costs borne by employer or worker.",
          duration: "Variable",
          icon: "Stethoscope",
        },
        {
          title: "Recovery",
          description: "No wage replacement. May continue working injured or lose job.",
          duration: "Variable",
          icon: "Bed",
        },
        {
          title: "Outcome",
          description: "Return to work, termination, or repatriation. No formal protections.",
          duration: "Variable",
          icon: "HelpCircle",
        },
      ],
      totalDuration: "Entirely dependent on employer",
      outcome: "No formal protections - highest vulnerability",
    },
    research: {
      keyRisks: [
        "Physical abuse and violence",
        "Chemical exposure from cleaning products",
        "Falls and lifting injuries",
        "Burns from cooking",
        "Psychological stress and isolation",
        "Excessive working hours",
      ],
      challenges: [
        "No GOSI coverage whatsoever",
        "Isolated working conditions",
        "Passport confiscation (illegal but common)",
        "Limited mobility and communication",
        "Difficult to report abuse",
        "Cultural and language barriers",
      ],
      recentChanges: [
        "Musaned platform for contract transparency",
        "Standard employment contract introduction",
        "Domestic worker hotline established",
        "Basic insurance product available (voluntary)",
      ],
      sources: [
        {
          title: "GOSI Coverage Exclusions - Official FAQ",
          url: "https://www.gosi.gov.sa",
          type: "official",
          date: "2024",
        },
        {
          title: "Musaned Domestic Worker Platform",
          url: "https://www.musaned.com.sa",
          type: "official",
          date: "2024",
        },
        {
          title: "ILO Domestic Workers Convention Report",
          url: "https://www.ilo.org",
          type: "academic",
          date: "2023",
        },
      ],
    },
  },
  {
    id: "young-saudi-worker",
    name: "Young Saudi Worker",
    arabicName: "الشاب السعودي",
    tagline: "Tomorrow's Workforce",
    description: "Saudi youth (15-24) entering the workforce. Facing high unemployment but benefiting from Saudization programs and digital job platforms like Jadarat.",
    avatarUrl: "/personas/young-saudi-worker.png",
    color: "emerald",
    gradient: "from-emerald-500/20 to-green-600/20",
    icon: GraduationCap,
    demographics: {
      populationShare: 8,
      participationRate: 31.6,
      unemploymentRate: 28.0,
      keyAgeGroup: "15-24",
      primarySectors: ["Retail", "Hospitality", "Food Service", "Customer Service", "Gig Economy"],
    },
    coverage: {
      annuities: true,
      occupationalHazards: true,
      contributionRate: "22% when employed (phased by 2028)",
      payer: "shared",
      gaps: [
        "High unemployment limits coverage access",
        "Gig economy workers often unregistered",
        "Part-time work may not qualify",
        "Training period protections unclear",
      ],
    },
    ohJourney: {
      steps: [
        {
          title: "Employment Start",
          description: "Must be formally registered with GOSI by employer to access benefits.",
          duration: "First day",
          icon: "UserPlus",
        },
        {
          title: "Incident Report",
          description: "Same process as other Saudi workers when formally employed.",
          duration: "1-2 days",
          icon: "FileText",
        },
        {
          title: "GOSI Claim",
          description: "Employer files claim. First-time workers may be unfamiliar with process.",
          duration: "3-5 days",
          icon: "Send",
        },
        {
          title: "Treatment",
          description: "Full medical coverage if registered. Training on safety protocols important.",
          duration: "Varies",
          icon: "Stethoscope",
        },
        {
          title: "Recovery",
          description: "Full wage replacement during recovery period.",
          duration: "As needed",
          icon: "HeartPulse",
        },
        {
          title: "Return to Work",
          description: "Job protection and reintegration support available.",
          duration: "Ongoing",
          icon: "Building2",
        },
      ],
      totalDuration: "Standard GOSI timeline when employed",
      outcome: "Full protection when formally employed; gaps for informal/gig work",
    },
    research: {
      keyRisks: [
        "Inexperience leading to workplace accidents",
        "Inadequate safety training",
        "Night shift and irregular hours",
        "Physical strain in retail/hospitality",
        "Mental health from job insecurity",
      ],
      challenges: [
        "28% unemployment rate",
        "Skills mismatch with job market",
        "Competition with experienced workers",
        "Gig economy work often unprotected",
        "Expectations vs. available positions",
      ],
      recentChanges: [
        "Jadarat national employment platform launched",
        "Hafiz unemployment support program",
        "Vocational training initiatives expanded",
        "Nitaqat quotas supporting youth employment",
      ],
      sources: [
        {
          title: "GASTAT Youth Employment Statistics Q2 2025",
          url: "https://www.stats.gov.sa/en/w/labour-force-survey",
          type: "official",
          date: "2025-06",
        },
        {
          title: "Jadarat Employment Platform",
          url: "https://jadarat.sa",
          type: "official",
          date: "2025",
        },
        {
          title: "HRSD Youth Employment Programs",
          url: "https://www.hrsd.gov.sa",
          type: "official",
          date: "2024",
        },
      ],
    },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPersonaById(id: string): Persona | undefined {
  return personas.find(p => p.id === id);
}

export function getPersonaColor(color: string): string {
  const colorMap: Record<string, string> = {
    purple: "#a855f7",
    cyan: "#06b6d4",
    amber: "#f59e0b",
    rose: "#f43f5e",
    emerald: "#10b981",
  };
  return colorMap[color] || "#06b6d4";
}

export function getCoverageStatus(persona: Persona): 'full' | 'partial' | 'none' {
  if (persona.coverage.annuities && persona.coverage.occupationalHazards) {
    return 'full';
  } else if (persona.coverage.occupationalHazards) {
    return 'partial';
  }
  return 'none';
}

export function getCoverageLabel(status: 'full' | 'partial' | 'none'): string {
  const labels = {
    full: "Full GOSI Coverage",
    partial: "Partial Coverage",
    none: "No Coverage",
  };
  return labels[status];
}
