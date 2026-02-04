/**
 * ScoreFlowDiagram - Animated visualization of scoring flow
 * 
 * Shows how individual metrics flow into pillar scores,
 * and how pillar scores combine into the final OHI maturity score.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  Activity,
  Heart,
  BarChart3,
  Users,
  FileCheck,
  Gauge,
  Brain,
  Target,
  Skull,
  GraduationCap,
  Radiation,
  Eye,
  Stethoscope,
  FileText,
  TestTube,
  Accessibility,
  Briefcase,
  UserCheck,
  Clock,
  ChevronRight,
  Info,
  ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Types
interface MetricNode {
  id: string;
  name: string;
  shortName: string;
  weight: number;
  inverted?: boolean;
  icon: React.ElementType;
}

interface PillarNode {
  id: string;
  name: string;
  shortName: string;
  weight: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  metrics: MetricNode[];
}

interface ScoreFlowDiagramProps {
  pillarWeights?: Record<string, number>;
  componentWeights?: Record<string, Record<string, { weight: number; invert?: boolean }>>;
  onPillarClick?: (pillarId: string) => void;
  onMetricClick?: (pillarId: string, metricId: string) => void;
  selectedPillar?: string | null;
  className?: string;
}

// Default pillar structure with metrics
const DEFAULT_PILLARS: PillarNode[] = [
  {
    id: "governance",
    name: "Governance Index",
    shortName: "GOV",
    weight: 0.20,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/40",
    icon: Shield,
    metrics: [
      { id: "inspector_density", name: "Inspector Density", shortName: "Inspectors", weight: 0.30, icon: Users },
      { id: "ilo_c187_status", name: "ILO C187 Ratification", shortName: "C187", weight: 0.20, icon: FileCheck },
      { id: "ilo_c155_status", name: "ILO C155 Ratification", shortName: "C155", weight: 0.20, icon: FileCheck },
      { id: "mental_health_policy", name: "Mental Health Policy", shortName: "Mental", weight: 0.15, icon: Brain },
      { id: "strategic_capacity_score", name: "Strategic Capacity", shortName: "Capacity", weight: 0.15, icon: Target },
    ],
  },
  {
    id: "pillar_1_hazard",
    name: "Hazard Control",
    shortName: "P1",
    weight: 0.35,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/40",
    icon: AlertTriangle,
    metrics: [
      { id: "fatal_accident_rate", name: "Fatal Accident Rate", shortName: "Fatal Rate", weight: 0.40, inverted: true, icon: Skull },
      { id: "oel_compliance_pct", name: "OEL Compliance", shortName: "OEL", weight: 0.25, icon: Gauge },
      { id: "safety_training_hours_avg", name: "Safety Training Hours", shortName: "Training", weight: 0.20, icon: GraduationCap },
      { id: "carcinogen_exposure_pct", name: "Carcinogen Exposure", shortName: "Carcinogen", weight: 0.15, inverted: true, icon: Radiation },
    ],
  },
  {
    id: "pillar_2_vigilance",
    name: "Health Vigilance",
    shortName: "P2",
    weight: 0.25,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/40",
    icon: Activity,
    metrics: [
      { id: "vulnerability_index", name: "Vulnerability Index", shortName: "Vulnerability", weight: 0.30, inverted: true, icon: Eye },
      { id: "disease_detection_rate", name: "Disease Detection Rate", shortName: "Detection", weight: 0.30, icon: Stethoscope },
      { id: "occupational_disease_reporting_rate", name: "Disease Reporting", shortName: "Reporting", weight: 0.20, icon: FileText },
      { id: "lead_exposure_screening_rate", name: "Lead Screening Rate", shortName: "Lead Screen", weight: 0.20, icon: TestTube },
    ],
  },
  {
    id: "pillar_3_restoration",
    name: "Restoration",
    shortName: "P3",
    weight: 0.20,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/40",
    icon: Heart,
    metrics: [
      { id: "rehab_access_score", name: "Rehab Access Score", shortName: "Rehab", weight: 0.30, icon: Accessibility },
      { id: "return_to_work_success_pct", name: "Return to Work Success", shortName: "RTW", weight: 0.30, icon: Briefcase },
      { id: "rehab_participation_rate", name: "Rehab Participation", shortName: "Participation", weight: 0.20, icon: UserCheck },
      { id: "avg_claim_settlement_days", name: "Claim Settlement Days", shortName: "Claims", weight: 0.20, inverted: true, icon: Clock },
    ],
  },
];

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const nodeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
    },
  },
};

const pulseTransition = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut",
} as const;

export function ScoreFlowDiagram({
  pillarWeights,
  componentWeights,
  onPillarClick,
  onMetricClick,
  selectedPillar,
  className,
}: ScoreFlowDiagramProps) {
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<{ pillar: string; metric: string } | null>(null);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // Merge default weights with provided weights
  const pillars = useMemo(() => {
    return DEFAULT_PILLARS.map((pillar) => {
      const updatedMetrics = pillar.metrics.map((metric) => {
        const weightConfig = componentWeights?.[pillar.id]?.[metric.id];
        return {
          ...metric,
          weight: weightConfig?.weight ?? metric.weight,
          inverted: weightConfig?.invert ?? metric.inverted,
        };
      });
      return {
        ...pillar,
        weight: pillarWeights?.[pillar.id] ?? pillar.weight,
        metrics: updatedMetrics,
      };
    });
  }, [pillarWeights, componentWeights]);

  const handlePillarClick = (pillarId: string) => {
    setExpandedPillar(expandedPillar === pillarId ? null : pillarId);
    onPillarClick?.(pillarId);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("relative", className)}
    >
      {/* Title */}
      <motion.div variants={nodeVariants} className="text-center mb-8">
        <h3 className="text-lg font-semibold text-white mb-2">Score Calculation Flow</h3>
        <p className="text-white/50 text-sm">
          Click on any pillar to see its component metrics and weights
        </p>
      </motion.div>

      {/* Main Flow Container */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12">
        {/* Pillars Section */}
        <div className="flex flex-col gap-4 flex-1 w-full max-w-2xl">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            const isExpanded = expandedPillar === pillar.id;
            const isSelected = selectedPillar === pillar.id;
            const isHovered = hoveredPillar === pillar.id;

            return (
              <motion.div
                key={pillar.id}
                variants={nodeVariants}
                custom={index}
                className="relative"
              >
                {/* Pillar Card */}
                <motion.button
                  onClick={() => handlePillarClick(pillar.id)}
                  onMouseEnter={() => setHoveredPillar(pillar.id)}
                  onMouseLeave={() => setHoveredPillar(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: isHovered ? "0 0 30px rgba(255,255,255,0.08)" : "0 0 0px rgba(255,255,255,0)",
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border backdrop-blur-sm transition-all duration-300",
                    "flex items-center justify-between gap-4",
                    pillar.bgColor,
                    pillar.borderColor,
                    (isExpanded || isSelected) && "ring-2 ring-white/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", pillar.bgColor)}>
                      <Icon className={cn("w-5 h-5", pillar.color)} />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{pillar.name}</p>
                      <p className="text-white/50 text-sm">{pillar.metrics.length} metrics</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold font-mono", pillar.color)}>
                        {(pillar.weight * 100).toFixed(0)}%
                      </p>
                      <p className="text-white/40 text-xs">of OHI</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    </motion.div>
                  </div>
                </motion.button>

                {/* Expanded Metrics */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pl-6 space-y-2">
                        {pillar.metrics.map((metric, metricIndex) => {
                          const MetricIcon = metric.icon;
                          const isMetricHovered =
                            hoveredMetric?.pillar === pillar.id &&
                            hoveredMetric?.metric === metric.id;

                          return (
                            <motion.div
                              key={metric.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: metricIndex * 0.05 }}
                              onMouseEnter={() =>
                                setHoveredMetric({ pillar: pillar.id, metric: metric.id })
                              }
                              onMouseLeave={() => setHoveredMetric(null)}
                              onClick={() => onMetricClick?.(pillar.id, metric.id)}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg",
                                "bg-white/5 border border-white/10 cursor-pointer",
                                "hover:bg-white/10 transition-colors",
                                isMetricHovered && "ring-1 ring-white/20"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <MetricIcon className="w-4 h-4 text-white/50" />
                                <div>
                                  <p className="text-white/80 text-sm">{metric.name}</p>
                                  {metric.inverted && (
                                    <span className="text-xs text-blue-400">↓ Lower is better</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn("font-mono font-bold", pillar.color)}>
                                  {(metric.weight * 100).toFixed(0)}%
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}

                        {/* Formula Preview */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10"
                        >
                          <p className="text-white/40 text-xs mb-2 flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Calculation Formula
                          </p>
                          <code className="text-xs text-white/70 font-mono">
                            {pillar.shortName} = Σ(metric × weight)
                          </code>
                          <p className="text-white/40 text-xs mt-1">
                            Each metric normalized to 0-100 before weighting
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Flow Arrow */}
        <motion.div
          variants={nodeVariants}
          className="hidden lg:flex flex-col items-center gap-2"
        >
          <div className="h-px w-24 bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight className="w-6 h-6 text-white/40" />
          </motion.div>
          <div className="h-px w-24 bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
        </motion.div>

        {/* Mobile Arrow */}
        <motion.div
          variants={nodeVariants}
          className="lg:hidden flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="rotate-90"
          >
            <ArrowRight className="w-6 h-6 text-white/40" />
          </motion.div>
        </motion.div>

        {/* OHI Score Result */}
        <motion.div
          variants={nodeVariants}
          className="relative"
        >
          {/* Pulse rings */}
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
            transition={pulseTransition}
            className="absolute inset-0 rounded-2xl bg-cyan-500/10"
          />
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
            transition={{ ...pulseTransition, delay: 0.5 }}
            className="absolute inset-0 rounded-2xl bg-cyan-500/5"
          />

          {/* Main OHI Card */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={cn(
              "relative p-6 rounded-2xl border backdrop-blur-sm",
              "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
              "border-cyan-500/40"
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-cyan-500/30 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-center">
                <p className="text-white/60 text-sm">ADL OHI Score</p>
                <p className="text-4xl font-bold text-cyan-400 font-mono">1.0-4.0</p>
                <p className="text-white/40 text-xs mt-1">Maturity Scale</p>
              </div>

              {/* Maturity Stages */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs w-full">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-white/50">1.0-1.9 Reactive</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-white/50">2.0-2.9 Compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-lime-500" />
                  <span className="text-white/50">3.0-3.5 Proactive</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white/50">3.6-4.0 Resilient</span>
                </div>
              </div>

              {/* Formula */}
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 w-full">
                <p className="text-white/40 text-xs mb-1">Formula</p>
                <code className="text-xs text-cyan-400 font-mono">
                  OHI = 1.0 + (Σ pillar×weight / 100) × 3.0
                </code>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Legend */}
      <motion.div
        variants={nodeVariants}
        className="mt-8 flex flex-wrap justify-center gap-4 text-sm"
      >
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.id} className="flex items-center gap-2">
              <div className={cn("w-6 h-6 rounded flex items-center justify-center", pillar.bgColor)}>
                <Icon className={cn("w-3 h-3", pillar.color)} />
              </div>
              <span className="text-white/60">{pillar.shortName}: {(pillar.weight * 100).toFixed(0)}%</span>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export default ScoreFlowDiagram;
