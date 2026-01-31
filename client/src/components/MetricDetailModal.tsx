/**
 * Arthur D. Little - Global Health Platform
 * Metric Detail Modal
 * Shows detailed explanation, relevance, and source for a metric
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Info,
  BookOpen,
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Globe,
  ExternalLink,
} from "lucide-react";
import { cn } from "../lib/utils";
import type { MetricData, PillarData } from "./FrameworkAnalysisModal";

// =============================================================================
// METRIC METADATA - Explanations and sources for each metric
// =============================================================================

interface MetricMeta {
  explanation: string;
  relevance: string;
  source: string;
  methodology?: string;
  goodValue?: string;
  interpretation?: string;
}

const METRIC_METADATA: Record<string, MetricMeta> = {
  // Governance Metrics
  ilo_c187_status: {
    explanation: "ILO Convention C187 (2006) - Promotional Framework for Occupational Safety and Health. This convention establishes the framework for a national OSH policy, system, and programme.",
    relevance: "Ratification indicates government commitment to establishing comprehensive OSH governance. Countries with C187 typically have stronger institutional frameworks for workplace safety.",
    source: "International Labour Organization (ILO) NORMLEX Database",
    goodValue: "Ratified (Yes)",
    interpretation: "Yes = Country has ratified the convention. No = Not yet ratified.",
  },
  ilo_c155_status: {
    explanation: "ILO Convention C155 (1981) - Occupational Safety and Health Convention. This foundational convention requires countries to formulate, implement, and periodically review a coherent national policy on OSH.",
    relevance: "One of the most important OSH conventions, indicating mature regulatory frameworks. Ratification demonstrates long-term commitment to worker protection.",
    source: "International Labour Organization (ILO) NORMLEX Database",
    goodValue: "Ratified (Yes)",
    interpretation: "Yes = Country has ratified the convention. No = Not yet ratified.",
  },
  inspector_density: {
    explanation: "Number of labor inspectors per 10,000 workers in the formal economy. This measures the enforcement capacity of the national labor inspection system.",
    relevance: "Higher inspector density enables better enforcement of OSH regulations. ILO recommends at least 1 inspector per 10,000 workers in industrial economies.",
    source: "ILO ILOSTAT, National Labor Inspection Reports",
    methodology: "Calculated as (Total Labor Inspectors / Total Workforce) × 10,000",
    goodValue: "≥ 1.0 per 10,000 workers",
    interpretation: "Higher values indicate better enforcement capacity.",
  },
  mental_health_policy: {
    explanation: "Indicates whether the country has a dedicated national mental health policy that includes workplace mental health provisions.",
    relevance: "Workplace mental health is increasingly recognized as critical. Countries with mental health policies are better positioned to address psychosocial hazards.",
    source: "WHO Mental Health Atlas, National Health Ministries",
    goodValue: "Yes",
  },
  strategic_capacity_score: {
    explanation: "Composite score measuring the overall strategic capacity for occupational health governance. Combines institutional strength, policy frameworks, and enforcement capabilities.",
    relevance: "Provides a holistic view of governance maturity. Higher scores indicate comprehensive, well-implemented OSH systems.",
    source: "ADL Occupational Health Framework Assessment",
    methodology: "Weighted average of governance indicators normalized to 0-100 scale",
    goodValue: "≥ 70%",
  },

  // Hazard Control Metrics (Pillar 1)
  fatal_accident_rate: {
    explanation: "Number of fatal occupational accidents per 100,000 workers per year. Measures the most severe outcome of workplace hazard exposure.",
    relevance: "A key indicator of workplace safety. Lower rates indicate better hazard prevention and control measures.",
    source: "ILO ILOSTAT, National Labor Statistics Offices, EUROSTAT",
    goodValue: "< 2.0 per 100,000",
    interpretation: "Lower is better. High-income countries typically have rates < 2.0.",
  },
  carcinogen_exposure_pct: {
    explanation: "Percentage of workers estimated to be exposed to known occupational carcinogens (e.g., asbestos, benzene, formaldehyde, silica dust).",
    relevance: "Carcinogen exposure is a leading cause of occupational cancer. Lower exposure rates indicate better hazard substitution and control.",
    source: "IHME Global Burden of Disease, CAREX International",
    goodValue: "< 5%",
    interpretation: "Lower percentages indicate better control of carcinogenic hazards.",
  },
  heat_stress_reg_type: {
    explanation: "Type of heat stress regulations in place: 'Strict' (mandatory limits), 'Moderate' (guidelines), 'Limited' (basic provisions), or 'None'.",
    relevance: "With climate change, heat stress is an emerging major hazard. Strong regulations protect vulnerable outdoor and industrial workers.",
    source: "National Labor Codes, ILO Working Conditions Database",
    goodValue: "Strict",
    interpretation: "Strict regulations provide mandatory limits and enforcement mechanisms.",
  },
  control_maturity_score: {
    explanation: "Composite score measuring the maturity of hazard control systems. Includes engineering controls, administrative measures, and PPE requirements.",
    relevance: "Indicates how effectively a country manages workplace hazards through the hierarchy of controls.",
    source: "ADL Occupational Health Framework Assessment",
    goodValue: "≥ 70%",
  },

  // Vigilance Metrics (Pillar 2)
  surveillance_logic: {
    explanation: "Type of occupational health surveillance system: 'Integrated' (unified national system), 'Fragmented' (multiple uncoordinated systems), or 'Limited' (minimal surveillance).",
    relevance: "Integrated systems enable better disease tracking, outbreak detection, and evidence-based policy making.",
    source: "WHO Health Systems Database, National Health Ministries",
    goodValue: "Integrated",
  },
  disease_detection_rate: {
    explanation: "Estimated percentage of occupational diseases that are detected and reported to national authorities.",
    relevance: "Higher detection rates indicate better surveillance systems. Most countries significantly under-report occupational diseases.",
    source: "ILO Estimates, National Occupational Disease Registries",
    methodology: "Estimated based on reported cases vs. epidemiological models",
    goodValue: "≥ 50%",
  },
  vulnerability_index: {
    explanation: "Composite index (0-100) measuring workforce vulnerability to occupational health risks based on demographics, informal employment, and access to healthcare.",
    relevance: "Higher vulnerability indicates greater need for targeted interventions and worker protection programs.",
    source: "ADL Vulnerability Assessment Model",
    goodValue: "< 30",
    interpretation: "Lower scores indicate less vulnerable workforce populations.",
  },

  // Restoration Metrics (Pillar 3)
  payer_mechanism: {
    explanation: "Primary mechanism for funding workers' compensation: 'Social Insurance' (public system), 'Private Insurance' (employer-purchased), 'Mixed' (hybrid), or 'None'.",
    relevance: "Social insurance systems typically provide more comprehensive and equitable coverage than purely private systems.",
    source: "ILO Social Protection Database, National Social Security Agencies",
    goodValue: "Social Insurance",
  },
  reintegration_law: {
    explanation: "Whether the country has laws requiring employers to support return-to-work and rehabilitation for injured workers.",
    relevance: "Legal requirements for reintegration improve outcomes for injured workers and reduce long-term disability costs.",
    source: "National Labor Codes, ILO NATLEX Database",
    goodValue: "Yes",
  },
  rehab_access_score: {
    explanation: "Score (0-100) measuring access to occupational rehabilitation services including physical therapy, vocational training, and workplace accommodations.",
    relevance: "Higher scores indicate better systems for helping injured workers return to productive employment.",
    source: "ADL Rehabilitation Access Assessment",
    goodValue: "≥ 60",
  },
  sickness_absence_days: {
    explanation: "Average number of sickness absence days per worker per year attributed to work-related health conditions.",
    relevance: "Indicator of both occupational health burden and compensation system generosity. Very low values may indicate under-reporting.",
    source: "EUROSTAT, National Social Security Statistics",
    interpretation: "Optimal range varies by country; extremely low may indicate access barriers.",
  },
};

// Default metadata for unknown metrics
const DEFAULT_METADATA: MetricMeta = {
  explanation: "This metric measures an aspect of occupational health performance in this country.",
  relevance: "This indicator contributes to the overall assessment of the country's occupational health framework.",
  source: "ADL Occupational Health Database",
};

// =============================================================================
// TYPES
// =============================================================================

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricData | null;
  pillar: PillarData | null;
  countryName: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MetricDetailModal({
  isOpen,
  onClose,
  metric,
  pillar,
  countryName,
}: MetricDetailModalProps) {
  if (!metric || !pillar) return null;

  // Get metadata for this metric
  const metricId = metric.id.toLowerCase().replace(/\s+/g, "_");
  const metadata = METRIC_METADATA[metricId] || DEFAULT_METADATA;

  // Format display value
  const displayValue = (() => {
    if (metric.value === null || metric.value === undefined) return "N/A";
    if (typeof metric.value === "boolean") return metric.value ? "Yes" : "No";
    return String(metric.value);
  })();

  // Determine value status
  const getValueStatus = () => {
    if (metric.value === null || metric.value === undefined) {
      return { icon: HelpCircle, color: "text-white/40", label: "No data available" };
    }
    if (typeof metric.value === "boolean") {
      return metric.value 
        ? { icon: CheckCircle, color: "text-emerald-400", label: "Positive indicator" }
        : { icon: AlertCircle, color: "text-amber-400", label: "Needs attention" };
    }
    return { icon: TrendingUp, color: "text-cyan-400", label: "Measured value" };
  };

  const valueStatus = getValueStatus();
  const StatusIcon = valueStatus.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60]",
              "w-[90vw] max-w-2xl max-h-[85vh]",
              "bg-slate-900 rounded-2xl border border-slate-700/50",
              "flex flex-col overflow-hidden",
              "shadow-2xl shadow-black/50"
            )}
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 px-6 py-4 border-b border-slate-700/50",
              "bg-gradient-to-r",
              pillar.gradientFrom,
              pillar.gradientTo
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/60 mb-1">{pillar.title} • {countryName}</p>
                  <h2 className="text-lg font-bold text-white">{metric.label}</h2>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Current Value Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl border",
                  "bg-gradient-to-br from-white/5 to-white/0",
                  "border-white/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    pillar.bgColor
                  )}>
                    <StatusIcon className={cn("w-6 h-6", valueStatus.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/50 mb-1">Current Value</p>
                    <p className={cn("text-2xl font-bold", valueStatus.color)}>
                      {displayValue}
                    </p>
                    <p className="text-xs text-white/40 mt-1">{valueStatus.label}</p>
                  </div>
                  {metadata.goodValue && (
                    <div className="text-right">
                      <p className="text-xs text-white/50 mb-1">Target</p>
                      <p className="text-sm font-medium text-emerald-400">
                        {metadata.goodValue}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Explanation Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-white/60">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">Explanation</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {metadata.explanation}
                </p>
              </motion.div>

              {/* Relevance Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-white/60">
                  <Info className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">Why It Matters</h3>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  {metadata.relevance}
                </p>
              </motion.div>

              {/* Methodology (if available) */}
              {metadata.methodology && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center gap-2 text-white/60 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide">Methodology</h3>
                  </div>
                  <p className="text-sm text-white/70">
                    {metadata.methodology}
                  </p>
                </motion.div>
              )}

              {/* Interpretation (if available) */}
              {metadata.interpretation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20"
                >
                  <div className="flex items-center gap-2 text-cyan-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide">How to Interpret</h3>
                  </div>
                  <p className="text-sm text-white/70">
                    {metadata.interpretation}
                  </p>
                </motion.div>
              )}

              {/* Source Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-white/60">
                  <Database className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide">Data Source</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-white/40" />
                  <p className="text-sm text-white/70">
                    {metadata.source}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700/50 bg-slate-900/80">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">
                  ADL Occupational Health Framework
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MetricDetailModal;
