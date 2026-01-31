/**
 * Arthur D. Little - Global Health Platform
 * Metric Detail Modal - Detailed metric comparison view
 * 
 * Enhanced with:
 * - Flag images from database
 * - Premium animations matching Framework screen
 * - ADL branding elements
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  BarChart3,
  Globe,
  Users,
  Zap,
} from "lucide-react";
import { cn, formatNumber, getApiBaseUrl, getCountryFlag } from "../../lib/utils";
import type { Country } from "../../types/country";

// ============================================================================
// METRIC DESCRIPTIONS DATABASE
// ============================================================================

const METRIC_DESCRIPTIONS: Record<string, {
  fullName: string;
  description: string;
  interpretation: string;
  source: string;
  benchmark?: string;
  lowerIsBetter?: boolean;
}> = {
  // Governance Layer
  ilo_c187: {
    fullName: "ILO Convention C187 Ratification",
    description: "The ILO Promotional Framework for Occupational Safety and Health Convention (C187) establishes the national policy and system for OSH.",
    interpretation: "Countries that have ratified C187 have committed to developing and maintaining national OSH policies, systems, and programs.",
    source: "International Labour Organization (ILO) NORMLEX Database",
    benchmark: "Ratified = Compliant with international OSH framework standards",
  },
  ilo_c155: {
    fullName: "ILO Convention C155 Ratification",
    description: "The Occupational Safety and Health Convention (C155) requires ratifying states to formulate, implement, and periodically review a coherent national policy on OSH.",
    interpretation: "Ratification indicates commitment to comprehensive workplace safety legislation and enforcement.",
    source: "International Labour Organization (ILO) NORMLEX Database",
    benchmark: "Ratified = Strong legal foundation for worker protection",
  },
  inspector_density: {
    fullName: "Labor Inspector Density",
    description: "Number of labor inspectors per 10,000 employed workers. This metric indicates the enforcement capacity of a country's OSH system.",
    interpretation: "Higher density generally correlates with better enforcement and workplace safety outcomes.",
    source: "ILO Labor Administration Statistics",
    benchmark: "ILO recommends 1 inspector per 10,000 workers in developed economies",
  },
  mental_health: {
    fullName: "Workplace Mental Health Policy",
    description: "Indicates whether the country has a national policy addressing mental health in the workplace.",
    interpretation: "Presence of policy suggests recognition of psychosocial risks and commitment to comprehensive worker wellbeing.",
    source: "WHO Mental Health Atlas & National Policy Reviews",
    benchmark: "Policy presence = Proactive mental health approach",
  },
  strategic_capacity: {
    fullName: "Strategic Capacity Score",
    description: "Composite score measuring a country's governance effectiveness in implementing OSH policies (0-100 scale).",
    interpretation: "Higher scores indicate stronger institutional capacity, policy coherence, and implementation effectiveness.",
    source: "World Bank Governance Indicators & ILO Assessments",
    benchmark: "80+ = Strong capacity, 50-80 = Moderate, <50 = Needs strengthening",
  },
  // Pillar 1: Hazard Control
  fatal_rate: {
    fullName: "Fatal Occupational Accident Rate",
    description: "Number of fatal workplace accidents per 100,000 workers per year. Primary indicator of workplace safety performance.",
    interpretation: "Lower rates indicate better hazard control and safer working conditions.",
    source: "ILO ILOSTAT SDG Indicator 8.8.1",
    benchmark: "<1.0 = Excellent, 1-2 = Good, 2-3 = Concerning, >3 = Critical",
    lowerIsBetter: true,
  },
  carcinogen: {
    fullName: "Carcinogen Exposure Rate",
    description: "Percentage of workforce exposed to occupational carcinogens (chemicals, radiation, asbestos, etc.).",
    interpretation: "Lower exposure rates indicate better chemical hazard management and worker protection.",
    source: "IARC, WHO Global Burden of Disease",
    benchmark: "<5% = Low risk, 5-10% = Moderate, >10% = High exposure",
    lowerIsBetter: true,
  },
  heat_stress: {
    fullName: "Heat Stress Regulation Type",
    description: "Classification of national regulations for heat stress protection: Strict (mandatory limits), Advisory (guidelines only), or None.",
    interpretation: "Strict regulations provide enforceable protection; Advisory provides guidance; None leaves workers vulnerable.",
    source: "National OSH Legislation Reviews, ILO Working Conditions",
    benchmark: "Strict = Best protection for heat-exposed workers",
  },
  oel_compliance: {
    fullName: "Occupational Exposure Limit Compliance",
    description: "Percentage of workplaces meeting national Occupational Exposure Limits (OELs) for hazardous substances.",
    interpretation: "Higher compliance indicates effective monitoring and enforcement of chemical exposure standards.",
    source: "National OSH Authority Compliance Reports",
    benchmark: "90%+ = Excellent, 70-90% = Good, <70% = Needs improvement",
  },
  nihl_rate: {
    fullName: "Noise-Induced Hearing Loss Rate",
    description: "Rate of occupational hearing loss diagnoses per 100,000 workers.",
    interpretation: "Lower rates indicate better noise control measures and hearing protection programs.",
    source: "WHO, National Occupational Disease Registries",
    benchmark: "<10 = Low, 10-25 = Moderate, >25 = High",
    lowerIsBetter: true,
  },
  safety_training: {
    fullName: "Average Safety Training Hours",
    description: "Average annual hours of safety training per worker across industries.",
    interpretation: "More training hours correlate with better safety awareness and incident prevention.",
    source: "National OSH Surveys, Industry Reports",
    benchmark: "20+ hours/year = Comprehensive, 10-20 = Adequate, <10 = Insufficient",
  },
  control_maturity: {
    fullName: "Hazard Control Maturity Score",
    description: "Composite score measuring overall hazard identification and control effectiveness (0-100 scale).",
    interpretation: "Higher scores indicate systematic hazard management across industries.",
    source: "GOHIP Framework Assessment",
    benchmark: "80+ = Mature systems, 50-80 = Developing, <50 = Early stage",
  },
  // Pillar 2: Health Vigilance
  surveillance: {
    fullName: "Surveillance Logic Type",
    description: "Classification of occupational health surveillance approach: Risk-Based (targeted), Mandatory (universal), or None.",
    interpretation: "Risk-Based is efficient for high-risk exposures; Mandatory ensures comprehensive coverage.",
    source: "National OSH Legislation & WHO Guidelines",
    benchmark: "Risk-Based or Mandatory = Active surveillance systems",
  },
  disease_detection: {
    fullName: "Occupational Disease Detection Rate",
    description: "Number of occupational diseases diagnosed per 100,000 workers annually.",
    interpretation: "Higher rates may indicate better detection systems OR higher actual disease burden - context matters.",
    source: "National Disease Registries, EUROSTAT",
    benchmark: "Varies by country - trend analysis more meaningful than absolute values",
  },
  vulnerability: {
    fullName: "Worker Vulnerability Index",
    description: "Composite index measuring workforce vulnerability based on informal employment, precarious work, and access to protection (0-100 scale).",
    interpretation: "Lower scores indicate more protected workforce; higher scores indicate vulnerable populations.",
    source: "World Bank Vulnerable Employment Data, ILO",
    benchmark: "<20 = Low vulnerability, 20-50 = Moderate, >50 = High vulnerability",
    lowerIsBetter: true,
  },
  migrant_worker: {
    fullName: "Migrant Workforce Percentage",
    description: "Percentage of workforce comprised of migrant workers.",
    interpretation: "High migrant percentages require specialized surveillance programs and multilingual outreach. Not inherently good or bad.",
    source: "UN Migration Statistics, ILO",
    benchmark: "Context-dependent - indicates need for targeted health programs",
  },
  lead_screening: {
    fullName: "Lead Exposure Screening Rate",
    description: "Percentage of workers in lead-exposed industries receiving regular blood lead level screening.",
    interpretation: "Higher screening rates indicate better occupational health program implementation.",
    source: "National Occupational Health Programs",
    benchmark: "90%+ = Excellent coverage, 70-90% = Good, <70% = Gaps in coverage",
  },
  disease_reporting: {
    fullName: "Occupational Disease Reporting Rate",
    description: "Percentage of occupational diseases that are officially reported and recorded.",
    interpretation: "Higher rates indicate better reporting systems and less underreporting.",
    source: "National Disease Notification Systems",
    benchmark: "90%+ = Robust reporting, <50% = Significant underreporting likely",
  },
  // Pillar 3: Restoration
  payer: {
    fullName: "Compensation Payer Mechanism",
    description: "Primary mechanism for workers' compensation: No-Fault (insurance-based) or Litigation (court-based).",
    interpretation: "No-Fault systems provide faster, more certain compensation; Litigation systems may provide higher awards but with delays.",
    source: "National Workers' Compensation Laws",
    benchmark: "No-Fault = Streamlined access to compensation",
  },
  reintegration: {
    fullName: "Reintegration Law Status",
    description: "Indicates whether mandatory return-to-work legislation exists requiring employers to accommodate injured workers.",
    interpretation: "Presence of law supports worker rehabilitation and reduces long-term disability.",
    source: "National Labor Legislation",
    benchmark: "Law present = Legal framework for worker reintegration",
  },
  sickness_absence: {
    fullName: "Average Sickness Absence Days",
    description: "Average number of sickness absence days per worker per year.",
    interpretation: "Context-dependent - low rates may indicate healthier workforce OR underreporting/presenteeism.",
    source: "National Health Insurance Data, OECD",
    benchmark: "Varies by region - EU average ~15 days/year",
  },
  rehab_access: {
    fullName: "Rehabilitation Access Score",
    description: "Score measuring access to occupational rehabilitation services (0-100 scale).",
    interpretation: "Higher scores indicate better availability and coverage of rehabilitation programs.",
    source: "WHO Health System Data, National Insurance Reports",
    benchmark: "80+ = Universal access, 50-80 = Good, <50 = Limited access",
  },
  rtw_success: {
    fullName: "Return-to-Work Success Rate",
    description: "Percentage of injured workers who successfully return to work within one year.",
    interpretation: "Higher rates indicate effective rehabilitation and employer accommodation programs.",
    source: "Workers' Compensation Insurance Data",
    benchmark: "80%+ = Excellent, 60-80% = Good, <60% = Needs improvement",
  },
  claim_settlement: {
    fullName: "Average Claim Settlement Time",
    description: "Average number of days to settle a workers' compensation claim.",
    interpretation: "Shorter times indicate more efficient administrative processes and faster worker support.",
    source: "National Workers' Compensation Authorities",
    benchmark: "<60 days = Efficient, 60-120 = Average, >120 = Slow",
    lowerIsBetter: true,
  },
  rehab_participation: {
    fullName: "Rehabilitation Participation Rate",
    description: "Percentage of eligible injured workers who participate in rehabilitation programs.",
    interpretation: "Higher participation indicates better program accessibility and worker engagement.",
    source: "Rehabilitation Program Reports",
    benchmark: "70%+ = High engagement, 40-70% = Moderate, <40% = Low uptake",
  },
};

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricId: string | null;
  metricName: string;
  leftCountry: Country;
  rightCountry: Country;
  leftValue: string | number | boolean | null | undefined;
  rightValue: string | number | boolean | null | undefined;
  suffix?: string;
  lowerIsBetter?: boolean;
  pillarName?: string;
  pillarColor?: string;
}

// ============================================================================
// COUNTRY FLAG COMPONENT
// ============================================================================

function CountryFlag({ country, size = "md" }: { country: Country; size?: "sm" | "md" | "lg" }) {
  const flagUrl = country.flag_url ? `${getApiBaseUrl()}${country.flag_url}` : null;
  
  const sizeClasses = {
    sm: "w-6 h-4",
    md: "w-8 h-6",
    lg: "w-10 h-7",
  };

  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={country.name}
        className={cn(sizeClasses[size], "object-cover rounded shadow-sm")}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          const nextSibling = target.nextElementSibling;
          if (nextSibling) {
            (nextSibling as HTMLElement).style.display = "inline";
          }
        }}
      />
    );
  }

  return (
    <span className={cn(size === "sm" ? "text-lg" : size === "md" ? "text-xl" : "text-2xl")}>
      {getCountryFlag(country.iso_code)}
    </span>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MetricDetailModal({
  isOpen,
  onClose,
  metricId,
  metricName,
  leftCountry,
  rightCountry,
  leftValue,
  rightValue,
  suffix = "",
  lowerIsBetter = false,
  pillarName = "Metric",
  pillarColor = "cyan",
}: MetricDetailModalProps) {
  const metricInfo = metricId ? METRIC_DESCRIPTIONS[metricId] : null;

  // Calculate gap and winner
  let gapPercent = 0;
  let leftWins = false;
  let rightWins = false;
  let hasNumericComparison = false;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    hasNumericComparison = true;
    const max = Math.max(leftValue, rightValue);
    const min = Math.min(leftValue, rightValue);
    if (min > 0) {
      gapPercent = ((max - min) / min) * 100;
    } else if (max > 0) {
      gapPercent = 100;
    }

    if (lowerIsBetter) {
      leftWins = leftValue < rightValue;
      rightWins = rightValue < leftValue;
    } else {
      leftWins = leftValue > rightValue;
      rightWins = rightValue > leftValue;
    }
  }

  const formatDisplayValue = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return "N/A";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "number") return `${formatNumber(val)}${suffix}`;
    return String(val);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
            className="fixed inset-2 sm:inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] lg:w-[700px] max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] md:max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className={cn(
              "relative px-6 py-5 border-b border-slate-700/50",
              `bg-gradient-to-r from-${pillarColor}-500/20 to-transparent`
            )}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: 0.2,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    `bg-${pillarColor}-500/20 border border-${pillarColor}-500/30`
                  )}
                >
                  <BarChart3 className={cn("w-6 h-6", `text-${pillarColor}-400`)} />
                </motion.div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{pillarName}</p>
                  <h2 className="text-xl font-bold text-white">
                    {metricInfo?.fullName || metricName}
                  </h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Comparison Values with Flags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                {/* Left Country */}
                <div className={cn(
                  "p-4 rounded-xl border",
                  leftWins ? "bg-emerald-500/10 border-emerald-500/30" : 
                  rightWins ? "bg-red-500/10 border-red-500/30" : 
                  "bg-slate-800/50 border-slate-700/50"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <CountryFlag country={leftCountry} size="md" />
                    <div className="flex-1">
                      <span className="text-xs text-slate-500">{leftCountry.iso_code}</span>
                      <p className="text-sm font-medium text-white">{leftCountry.name}</p>
                    </div>
                    {leftWins && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                    {rightWins && <TrendingDown className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className={cn(
                    "text-3xl font-bold",
                    leftWins ? "text-emerald-400" : rightWins ? "text-red-400" : "text-white"
                  )}>
                    {formatDisplayValue(leftValue)}
                  </div>
                </div>

                {/* Right Country */}
                <div className={cn(
                  "p-4 rounded-xl border",
                  rightWins ? "bg-emerald-500/10 border-emerald-500/30" : 
                  leftWins ? "bg-red-500/10 border-red-500/30" : 
                  "bg-slate-800/50 border-slate-700/50"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <CountryFlag country={rightCountry} size="md" />
                    <div className="flex-1">
                      <span className="text-xs text-slate-500">{rightCountry.iso_code}</span>
                      <p className="text-sm font-medium text-white">{rightCountry.name}</p>
                    </div>
                    {rightWins && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                    {leftWins && <TrendingDown className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className={cn(
                    "text-3xl font-bold",
                    rightWins ? "text-emerald-400" : leftWins ? "text-red-400" : "text-white"
                  )}>
                    {formatDisplayValue(rightValue)}
                  </div>
                </div>
              </motion.div>

              {/* Gap Analysis */}
              {hasNumericComparison && gapPercent > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className={cn(
                    "p-4 rounded-xl border",
                    gapPercent > 100 ? "bg-red-500/10 border-red-500/30" : 
                    gapPercent > 50 ? "bg-yellow-500/10 border-yellow-500/30" :
                    "bg-slate-800/50 border-slate-700/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={cn(
                      "w-5 h-5",
                      gapPercent > 100 ? "text-red-400" : gapPercent > 50 ? "text-yellow-400" : "text-slate-400"
                    )} />
                    <span className="text-sm font-semibold text-white">Gap Analysis</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      gapPercent > 100 ? "text-red-400" : gapPercent > 50 ? "text-yellow-400" : "text-slate-300"
                    )}>
                      {gapPercent.toFixed(0)}%
                    </span>
                    <span className="text-sm text-slate-400">difference between countries</span>
                  </div>
                  {gapPercent > 100 && (
                    <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Critical gap detected - significant policy divergence
                    </p>
                  )}
                </motion.div>
              )}

              {/* Metric Description */}
              {metricInfo && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <Info className="w-4 h-4" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide">Description</h4>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {metricInfo.description}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide">Interpretation</h4>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {metricInfo.interpretation}
                    </p>
                  </motion.div>

                  {metricInfo.benchmark && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35, duration: 0.3 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-slate-300">
                        <BarChart3 className="w-4 h-4" />
                        <h4 className="text-sm font-semibold uppercase tracking-wide">Benchmark</h4>
                      </div>
                      <div className={cn(
                        "p-3 rounded-lg border",
                        `bg-${pillarColor}-500/10 border-${pillarColor}-500/20`
                      )}>
                        <p className="text-sm text-slate-200">{metricInfo.benchmark}</p>
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <Globe className="w-4 h-4" />
                      <h4 className="text-sm font-semibold uppercase tracking-wide">Data Source</h4>
                    </div>
                    <p className="text-slate-500 text-xs">{metricInfo.source}</p>
                  </motion.div>
                </>
              )}

              {/* Migrant Workforce Context (special handling) */}
              {metricId === "migrant_worker" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.3 }}
                  className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Migrant Workforce Context</p>
                      <p className="text-sm text-slate-300 mt-1">
                        {typeof leftValue === "number" && typeof rightValue === "number" && Math.abs(leftValue - rightValue) > 40 ? (
                          <>
                            The significant difference in migrant workforce composition ({Math.abs(leftValue - rightValue).toFixed(0)}% gap) 
                            indicates fundamentally different labor market structures. Countries with high migrant percentages 
                            require specialized occupational health surveillance programs, multilingual communications, 
                            and targeted outreach for vulnerable worker populations.
                          </>
                        ) : (
                          <>
                            Migrant workforce percentages affect health surveillance program design, 
                            communication strategies, and access to occupational health services.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MetricDetailModal;
