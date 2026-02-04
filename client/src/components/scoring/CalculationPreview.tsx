/**
 * CalculationPreview - Real-time formula visualization
 * 
 * Shows step-by-step calculation breakdown with sample country data,
 * including normalization, inversion, and weighting.
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Calculator,
  ChevronRight,
  ArrowRight,
  Info,
  TrendingDown,
  Zap,
  Globe,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Types
interface PillarCalculation {
  pillarId: string;
  pillarName: string;
  score: number | null;
  metrics: {
    id: string;
    name: string;
    rawValue: number | null;
    maxValue: number;
    normalized: number | null;
    weight: number;
    weighted: number | null;
    inverted: boolean;
    unit: string;
  }[];
}

interface CalculationPreviewProps {
  countryName?: string;
  countryCode?: string;
  pillarCalculations?: PillarCalculation[];
  ohiScore?: number | null;
  className?: string;
}

// Sample calculation data for demonstration
const SAMPLE_CALCULATIONS: PillarCalculation[] = [
  {
    pillarId: "governance",
    pillarName: "Governance",
    score: 62.5,
    metrics: [
      { id: "inspector_density", name: "Inspector Density", rawValue: 1.8, maxValue: 3.0, normalized: 60, weight: 0.30, weighted: 18, inverted: false, unit: "per 10k" },
      { id: "ilo_c187_status", name: "ILO C187", rawValue: 1, maxValue: 1, normalized: 100, weight: 0.20, weighted: 20, inverted: false, unit: "ratified" },
      { id: "ilo_c155_status", name: "ILO C155", rawValue: 1, maxValue: 1, normalized: 100, weight: 0.20, weighted: 20, inverted: false, unit: "ratified" },
      { id: "mental_health_policy", name: "Mental Health Policy", rawValue: 0, maxValue: 1, normalized: 0, weight: 0.15, weighted: 0, inverted: false, unit: "exists" },
      { id: "strategic_capacity_score", name: "Strategic Capacity", rawValue: 30, maxValue: 100, normalized: 30, weight: 0.15, weighted: 4.5, inverted: false, unit: "score" },
    ],
  },
  {
    pillarId: "pillar_1_hazard",
    pillarName: "Hazard Control",
    score: 71.25,
    metrics: [
      { id: "fatal_accident_rate", name: "Fatal Accident Rate", rawValue: 2.5, maxValue: 10, normalized: 75, weight: 0.40, weighted: 30, inverted: true, unit: "/100k" },
      { id: "oel_compliance_pct", name: "OEL Compliance", rawValue: 75, maxValue: 100, normalized: 75, weight: 0.25, weighted: 18.75, inverted: false, unit: "%" },
      { id: "safety_training_hours_avg", name: "Safety Training", rawValue: 24, maxValue: 40, normalized: 60, weight: 0.20, weighted: 12, inverted: false, unit: "hours" },
      { id: "carcinogen_exposure_pct", name: "Carcinogen Exposure", rawValue: 15, maxValue: 50, normalized: 70, weight: 0.15, weighted: 10.5, inverted: true, unit: "%" },
    ],
  },
  {
    pillarId: "pillar_2_vigilance",
    pillarName: "Health Vigilance",
    score: 58.0,
    metrics: [
      { id: "vulnerability_index", name: "Vulnerability Index", rawValue: 45, maxValue: 100, normalized: 55, weight: 0.30, weighted: 16.5, inverted: true, unit: "index" },
      { id: "disease_detection_rate", name: "Disease Detection", rawValue: 65, maxValue: 100, normalized: 65, weight: 0.30, weighted: 19.5, inverted: false, unit: "%" },
      { id: "occupational_disease_reporting_rate", name: "Disease Reporting", rawValue: 50, maxValue: 100, normalized: 50, weight: 0.20, weighted: 10, inverted: false, unit: "%" },
      { id: "lead_exposure_screening_rate", name: "Lead Screening", rawValue: 60, maxValue: 100, normalized: 60, weight: 0.20, weighted: 12, inverted: false, unit: "%" },
    ],
  },
  {
    pillarId: "pillar_3_restoration",
    pillarName: "Restoration",
    score: 55.0,
    metrics: [
      { id: "rehab_access_score", name: "Rehab Access", rawValue: 50, maxValue: 100, normalized: 50, weight: 0.30, weighted: 15, inverted: false, unit: "score" },
      { id: "return_to_work_success_pct", name: "RTW Success", rawValue: 60, maxValue: 100, normalized: 60, weight: 0.30, weighted: 18, inverted: false, unit: "%" },
      { id: "rehab_participation_rate", name: "Rehab Participation", rawValue: 45, maxValue: 100, normalized: 45, weight: 0.20, weighted: 9, inverted: false, unit: "%" },
      { id: "avg_claim_settlement_days", name: "Claim Settlement", rawValue: 120, maxValue: 365, normalized: 65, weight: 0.20, weighted: 13, inverted: true, unit: "days" },
    ],
  },
];

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
};

// Animated number component
function AnimatedNumber({ value, decimals = 1, className }: { value: number; decimals?: number; className?: string }) {
  const spring = useSpring(0, { duration: 1000, bounce: 0 });
  const display = useTransform(spring, (current) => current.toFixed(decimals));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className={className}>{display}</motion.span>;
}

export function CalculationPreview({
  countryName = "Sample Country",
  countryCode = "XX",
  pillarCalculations = SAMPLE_CALCULATIONS,
  ohiScore,
  className,
}: CalculationPreviewProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [showFormulas, setShowFormulas] = useState(true);

  // Calculate OHI score from pillars if not provided
  // Weights based on WHO/ILO framework - Hazard Control highest as prevention is primary goal
  const calculatedOHI = useMemo(() => {
    if (ohiScore !== undefined) return ohiScore;
    
    const pillarWeights: Record<string, number> = {
      governance: 0.20,        // 20% - Regulatory foundation
      pillar_1_hazard: 0.35,   // 35% - Prevention (highest priority)
      pillar_2_vigilance: 0.25, // 25% - Detection
      pillar_3_restoration: 0.20, // 20% - Recovery
    };

    let totalWeight = 0;
    let weightedSum = 0;

    pillarCalculations.forEach((pillar) => {
      if (pillar.score !== null) {
        const weight = pillarWeights[pillar.pillarId] || 0.25;
        weightedSum += pillar.score * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight === 0) return null;
    
    const normalizedAverage = weightedSum / totalWeight;
    return 1.0 + (normalizedAverage / 100) * 3.0;
  }, [pillarCalculations, ohiScore]);

  const getPillarColor = (pillarId: string) => {
    const colors: Record<string, { text: string; bg: string; border: string }> = {
      governance: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40" },
      pillar_1_hazard: { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40" },
      pillar_2_vigilance: { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/40" },
      pillar_3_restoration: { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
    };
    return colors[pillarId] || { text: "text-white", bg: "bg-white/20", border: "border-white/40" };
  };

  const getMaturityStage = (score: number | null) => {
    if (score === null) return { label: "N/A", color: "text-white/50" };
    if (score < 2.0) return { label: "Reactive", color: "text-red-400" };
    if (score < 3.0) return { label: "Compliant", color: "text-orange-400" };
    if (score < 3.6) return { label: "Proactive", color: "text-lime-400" };
    return { label: "Resilient", color: "text-emerald-400" };
  };

  const maturityStage = getMaturityStage(calculatedOHI);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Calculation Preview</h3>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Globe className="w-3 h-3" />
              <span>{countryName}</span>
              <span className="text-white/30">({countryCode})</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFormulas(!showFormulas)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/60"
        >
          <Info className="w-4 h-4" />
          {showFormulas ? "Hide" : "Show"} Formulas
        </button>
      </motion.div>

      {/* Pillar Calculations */}
      <div className="space-y-3">
        {pillarCalculations.map((pillar, index) => {
          const colors = getPillarColor(pillar.pillarId);
          const isExpanded = expandedPillar === pillar.pillarId;

          return (
            <motion.div
              key={pillar.pillarId}
              variants={itemVariants}
              custom={index}
              className={cn(
                "rounded-xl border overflow-hidden",
                colors.bg,
                colors.border
              )}
            >
              {/* Pillar Header */}
              <button
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.pillarId)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </motion.div>
                  <span className="text-white font-medium">{pillar.pillarName}</span>
                  <span className="text-white/40 text-sm">({pillar.metrics.length} metrics)</span>
                </div>

                <div className="flex items-center gap-4">
                  {showFormulas && (
                    <code className="text-white/30 text-xs font-mono hidden md:block">
                      Σ(metric × weight)
                    </code>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-white/40 text-sm">=</span>
                    <span className={cn("text-2xl font-bold font-mono", colors.text)}>
                      {pillar.score !== null ? pillar.score.toFixed(1) : "N/A"}
                    </span>
                    <span className="text-white/40 text-sm">/100</span>
                  </div>
                </div>
              </button>

              {/* Expanded Metrics Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {/* Column Headers */}
                      <div className="grid grid-cols-12 gap-2 text-xs text-white/40 pb-2 border-b border-white/10">
                        <div className="col-span-3">Metric</div>
                        <div className="col-span-2 text-center">Raw</div>
                        <div className="col-span-1 text-center hidden md:block"></div>
                        <div className="col-span-2 text-center">Normalized</div>
                        <div className="col-span-2 text-center">Weight</div>
                        <div className="col-span-2 text-center">Weighted</div>
                      </div>

                      {/* Metric Rows */}
                      {pillar.metrics.map((metric, metricIndex) => (
                        <motion.div
                          key={metric.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: metricIndex * 0.05 }}
                          className="grid grid-cols-12 gap-2 items-center py-2 hover:bg-white/5 rounded-lg px-2"
                        >
                          {/* Metric Name */}
                          <div className="col-span-3">
                            <p className="text-white/80 text-sm">{metric.name}</p>
                            {metric.inverted && (
                              <span className="flex items-center gap-1 text-xs text-blue-400">
                                <TrendingDown className="w-3 h-3" />
                                Inverted
                              </span>
                            )}
                          </div>

                          {/* Raw Value */}
                          <div className="col-span-2 text-center">
                            <span className="text-white/60 font-mono text-sm">
                              {metric.rawValue !== null ? metric.rawValue : "—"}
                            </span>
                            <span className="text-white/30 text-xs ml-1">{metric.unit}</span>
                          </div>

                          {/* Arrow */}
                          <div className="col-span-1 hidden md:flex justify-center">
                            <ArrowRight className="w-3 h-3 text-white/30" />
                          </div>

                          {/* Normalized */}
                          <div className="col-span-2 text-center">
                            <span className="text-white font-mono text-sm font-medium">
                              {metric.normalized !== null ? metric.normalized.toFixed(0) : "—"}
                            </span>
                          </div>

                          {/* Weight */}
                          <div className="col-span-2 text-center">
                            <span className="text-white/50 font-mono text-sm">
                              ×{(metric.weight * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Weighted Result */}
                          <div className="col-span-2 text-center">
                            <span className={cn("font-mono text-sm font-bold", colors.text)}>
                              {metric.weighted !== null ? metric.weighted.toFixed(1) : "—"}
                            </span>
                          </div>
                        </motion.div>
                      ))}

                      {/* Total Row */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-12 gap-2 items-center pt-3 border-t border-white/10"
                      >
                        <div className="col-span-8 text-right">
                          <span className="text-white/60 text-sm font-medium">Pillar Total =</span>
                        </div>
                        <div className="col-span-4 text-center">
                          <span className={cn("text-xl font-bold font-mono", colors.text)}>
                            {pillar.score !== null ? pillar.score.toFixed(1) : "N/A"}
                          </span>
                        </div>
                      </motion.div>

                      {/* Formula Explanation */}
                      {showFormulas && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <p className="text-white/40 text-xs">
                            <span className="text-white/60">Normalization:</span> raw ÷ max × 100
                            {" | "}
                            <span className="text-white/60">Inverted:</span> 100 - normalized
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Final OHI Calculation */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/40"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">Final OHI Score Calculation</span>
          </div>
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", maturityStage.color, "bg-white/5")}>
            {maturityStage.label}
          </span>
        </div>

        {/* Pillar Weights Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {pillarCalculations.map((pillar) => {
            const colors = getPillarColor(pillar.pillarId);
            const pillarWeights: Record<string, number> = {
              governance: 0.20,
              pillar_1_hazard: 0.35,
              pillar_2_vigilance: 0.25,
              pillar_3_restoration: 0.20,
            };
            const weight = pillarWeights[pillar.pillarId] || 0.25;

            return (
              <div key={pillar.pillarId} className="p-3 rounded-lg bg-white/5">
                <p className="text-white/40 text-xs">{pillar.pillarName}</p>
                <div className="flex items-baseline gap-1">
                  <span className={cn("font-bold font-mono", colors.text)}>
                    {pillar.score !== null ? pillar.score.toFixed(1) : "—"}
                  </span>
                  <span className="text-white/30 text-xs">× {(weight * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Formula */}
        {showFormulas && (
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
            <code className="text-white/60 text-sm font-mono">
              OHI = 1.0 + (weighted_avg / 100) × 3.0
            </code>
          </div>
        )}

        {/* Final Score */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-white/60">ADL OHI Score =</span>
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.5 }}
            className="text-5xl font-bold text-cyan-400 font-mono"
          >
            {calculatedOHI !== null ? (
              <AnimatedNumber value={Number(calculatedOHI.toFixed(1))} decimals={1} />
            ) : (
              "N/A"
            )}
          </motion.span>
          <span className="text-white/40">/4.0</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CalculationPreview;
