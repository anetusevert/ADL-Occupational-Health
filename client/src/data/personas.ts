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
          description: "Injury reported to employer within 24 hours. Medical attention sought immediately.",
          duration: "1-2 days",
          icon: "FileText",
        },
        {
          title: "GOSI Notification",
          description: "Employer files occupational injury claim with GOSI. Documentation submitted.",
          duration: "3-5 days",
          icon: "Send",
        },
        {
          title: "Medical Treatment",
          description: "Full medical coverage through GOSI-approved facilities. No out-of-pocket costs.",
          duration: "Varies",
          icon: "Stethoscope",
        },
        {
          title: "Wage Replacement",
          description: "100% salary continuation during recovery period. Paid by GOSI.",
          duration: "Up to 12 months",
          icon: "Wallet",
        },
        {
          title: "Rehabilitation",
          description: "Access to rehabilitation services. Gradual return-to-work program available.",
          duration: "1-6 months",
          icon: "HeartPulse",
        },
        {
          title: "Return to Work",
          description: "Reintegration support with job protection. Disability assessment if permanent.",
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
          description: "Same process as male colleagues. Equal treatment under GOSI regulations.",
          duration: "1-2 days",
          icon: "FileText",
        },
        {
          title: "GOSI Notification",
          description: "Employer files claim. Additional protections for pregnant workers.",
          duration: "3-5 days",
          icon: "Send",
        },
        {
          title: "Medical Treatment",
          description: "Full coverage including gender-specific health needs.",
          duration: "Varies",
          icon: "Stethoscope",
        },
        {
          title: "Wage Replacement",
          description: "100% salary continuation. Maternity benefits separate from injury benefits.",
          duration: "Up to 12 months",
          icon: "Wallet",
        },
        {
          title: "Rehabilitation",
          description: "Access to rehabilitation with consideration for family responsibilities.",
          duration: "1-6 months",
          icon: "HeartPulse",
        },
        {
          title: "Return to Work",
          description: "Flexible return options. Job protection guaranteed.",
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
          description: "Injury reported through employer. Language barriers may cause delays.",
          duration: "1-3 days",
          icon: "FileText",
        },
        {
          title: "GOSI Claim",
          description: "Employer must file claim. Worker has limited direct access to system.",
          duration: "5-10 days",
          icon: "Send",
        },
        {
          title: "Medical Treatment",
          description: "Covered by GOSI for occupational injuries. Quality varies by facility.",
          duration: "Varies",
          icon: "Stethoscope",
        },
        {
          title: "Wage Replacement",
          description: "Partial wage replacement during recovery. May face pressure to return early.",
          duration: "Limited",
          icon: "Wallet",
        },
        {
          title: "Recovery Period",
          description: "Limited rehabilitation services. Housing provided by employer typically.",
          duration: "Variable",
          icon: "HeartPulse",
        },
        {
          title: "Outcome",
          description: "Return to work or repatriation. Permanent disability may result in return home.",
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
