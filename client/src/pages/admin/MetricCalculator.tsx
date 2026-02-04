/**
 * GOHIP Platform - Metric Calculator
 * Admin Configuration for Framework-Aligned Scoring
 * 
 * Features:
 * - Visual score flow diagram showing metric → pillar → OHI flow
 * - Interactive calculation preview with sample data
 * - Weight configuration with animated sliders
 * - Maturity scoring rules visualization
 * - Live preview of score calculations
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Calculator,
  RefreshCw,
  Check,
  AlertTriangle,
  Save,
  Loader2,
  Target,
  Sliders,
  BarChart3,
  Shield,
  Activity,
  Heart,
  Zap,
  Info,
  X,
  Settings,
  FileText,
  Play,
  Workflow,
} from "lucide-react";
import { apiClient } from "../../services/api";
import { cn } from "../../lib/utils";

// Import new scoring components
import {
  ScoreFlowDiagram,
  CalculationPreview,
  PillarWeightChart,
  AnimatedWeightBars,
  EnhancedWeightSlider,
  MaturityRuleVisualizer,
} from "../../components/scoring";

// =============================================================================
// TYPES
// =============================================================================

interface MetricDefinition {
  id: string;
  metric_key: string;
  name: string;
  description: string | null;
  category: string;
  metric_type: string;
  formula: string | null;
  source_fields: string[] | null;
  weight_in_pillar: number;
  weight_in_maturity: number;
  thresholds: Record<string, { min?: number; max?: number }> | null;
  unit: string | null;
  lower_is_better: boolean;
  color_scale: Record<string, any> | null;
  is_active: boolean;
  updated_at: string | null;
}

interface MaturityRule {
  id: string;
  rule_key: string;
  name: string;
  description: string | null;
  pillar: string;
  priority: number;
  condition_type: string;
  condition_config: Record<string, any>;
  impact_type: "add" | "multiply" | "cap" | "set";
  impact_value: number;
  is_active: boolean;
  updated_at: string | null;
}

interface PillarSummary {
  id: string;
  pillar: string;
  name: string;
  description: string | null;
  calculation_method: string;
  component_weights: Record<string, { weight: number; invert?: boolean; max_value?: number }>;
  output_min: number;
  output_max: number;
  unit: string;
  lower_is_better: boolean;
  is_active: boolean;
}

interface MetricConfigOverview {
  metrics: MetricDefinition[];
  rules: MaturityRule[];
  pillar_summaries: PillarSummary[];
  statistics: {
    total_metrics: number;
    active_metrics: number;
    total_rules: number;
    active_rules: number;
    metrics_by_category: Record<string, number>;
  };
}

interface RecalculationResult {
  status: string;
  countries_updated: number;
  score_distribution: Record<string, number>;
  execution_time_ms: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

const initializeMetricConfig = async () => {
  const response = await apiClient.post("/api/v1/admin/metric-config/initialize");
  return response.data;
};

const getMetricOverview = async (): Promise<MetricConfigOverview> => {
  const response = await apiClient.get("/api/v1/admin/metric-config/overview");
  return response.data;
};

const updatePillarSummary = async (pillar: string, update: Partial<PillarSummary>) => {
  const response = await apiClient.put(`/api/v1/admin/metric-config/pillar-summaries/${pillar}`, update);
  return response.data;
};

const recalculateAllScores = async (): Promise<RecalculationResult> => {
  const response = await apiClient.post("/api/v1/admin/metric-config/recalculate");
  return response.data;
};

// =============================================================================
// VIEW TYPES
// =============================================================================

type ViewType = "overview" | "configure" | "rules" | "simulate";

const viewConfig: Record<ViewType, {
  icon: typeof Workflow;
  label: string;
  description: string;
}> = {
  overview: {
    icon: Workflow,
    label: "Overview",
    description: "Visual score flow and calculation structure",
  },
  configure: {
    icon: Settings,
    label: "Configure",
    description: "Adjust pillar weights and metrics",
  },
  rules: {
    icon: FileText,
    label: "Rules",
    description: "Maturity scoring rules and conditions",
  },
  simulate: {
    icon: Play,
    label: "Simulate",
    description: "Preview calculations with sample data",
  },
};

// =============================================================================
// PILLAR CONFIGURATION
// =============================================================================

type PillarKey = "governance" | "pillar_1_hazard" | "pillar_2_vigilance" | "pillar_3_restoration" | "composite";

const pillarConfig: Record<PillarKey, { 
  icon: typeof Shield; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  colorKey: "purple" | "red" | "amber" | "emerald" | "cyan";
  label: string;
  shortLabel: string;
  weight: number;
  description: string;
}> = {
  governance: {
    icon: Shield,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    colorKey: "purple",
    label: "Governance",
    shortLabel: "GOV",
    weight: 0.20,
    description: "Regulatory framework, institutional capacity, and policy implementation",
  },
  pillar_1_hazard: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
    colorKey: "red",
    label: "Hazard Control",
    shortLabel: "P1",
    weight: 0.35,
    description: "Prevention and control of workplace hazards and accidents",
  },
  pillar_2_vigilance: {
    icon: Activity,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    colorKey: "amber",
    label: "Health Vigilance",
    shortLabel: "P2",
    weight: 0.25,
    description: "Health surveillance, disease detection, and early intervention",
  },
  pillar_3_restoration: {
    icon: Heart,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    colorKey: "emerald",
    label: "Restoration",
    shortLabel: "P3",
    weight: 0.20,
    description: "Rehabilitation, return-to-work programs, and worker recovery",
  },
  composite: {
    icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    colorKey: "cyan",
    label: "ADL OHI Score",
    shortLabel: "OHI",
    weight: 1.0,
    description: "Arthur D. Little Occupational Health Index (1.0-4.0 scale)",
  },
};

const PILLAR_HEX: Record<Exclude<PillarKey, "composite">, string> = {
  governance: "#a855f7",
  pillar_1_hazard: "#ef4444",
  pillar_2_vigilance: "#f59e0b",
  pillar_3_restoration: "#10b981",
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
  exit: { opacity: 0, y: -20 },
};

const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20, filter: "blur(10px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MetricCalculator() {
  const queryClient = useQueryClient();
  
  // State
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const [activePillar, setActivePillar] = useState<PillarKey>("governance");
  const [editingWeights, setEditingWeights] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recalcResult, setRecalcResult] = useState<RecalculationResult | null>(null);

  // Queries
  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["metric-config-overview"],
    queryFn: getMetricOverview,
    retry: false,
  });

  // Mutations
  const initMutation = useMutation({
    mutationFn: initializeMetricConfig,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["metric-config-overview"] });
      try {
        const result = await recalculateAllScores();
        setRecalcResult(result);
        queryClient.invalidateQueries({ queryKey: ["countries"] });
        queryClient.invalidateQueries({ queryKey: ["geojson-metadata"] });
      } catch (error) {
        console.error("Failed to recalculate after init:", error);
      }
    },
  });

  const updatePillarMutation = useMutation({
    mutationFn: ({ pillar, update }: { pillar: string; update: Partial<PillarSummary> }) =>
      updatePillarSummary(pillar, update),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["metric-config-overview"] });
      setEditingWeights({});
      setHasUnsavedChanges(false);
      try {
        const result = await recalculateAllScores();
        setRecalcResult(result);
        queryClient.invalidateQueries({ queryKey: ["countries"] });
        queryClient.invalidateQueries({ queryKey: ["geojson-metadata"] });
      } catch (error) {
        console.error("Failed to recalculate after weight change:", error);
      }
    },
  });

  const recalcMutation = useMutation({
    mutationFn: recalculateAllScores,
    onSuccess: (result) => {
      setRecalcResult(result);
      queryClient.invalidateQueries({ queryKey: ["countries"] });
      queryClient.invalidateQueries({ queryKey: ["geojson-metadata"] });
    },
  });

  // Get current pillar summary
  const currentPillarSummary = useMemo(() => {
    if (!overview) return null;
    return overview.pillar_summaries.find(s => s.pillar === activePillar);
  }, [overview, activePillar]);

  // Get metrics for current pillar
  // Calculate total weight for current pillar
  const totalWeight = useMemo(() => {
    if (!currentPillarSummary) return 0;
    const merged: Record<string, number | { weight: number }> = {
      ...currentPillarSummary.component_weights,
    };

    for (const [key, value] of Object.entries(editingWeights)) {
      merged[key] = value;
    }

    return Object.values(merged).reduce<number>((sum, value) => {
      const w = typeof value === "number" ? value : value.weight;
      return sum + (w || 0);
    }, 0);
  }, [currentPillarSummary, editingWeights]);

  // Get component weights for chart
  const componentWeightsForChart = useMemo(() => {
    if (!overview) return {};
    const weights: Record<string, Record<string, { weight: number; invert?: boolean }>> = {};
    overview.pillar_summaries.forEach((ps) => {
      weights[ps.pillar] = ps.component_weights;
    });
    return weights;
  }, [overview]);

  // Handle weight change
  const handleWeightChange = (metricKey: string, newWeight: number) => {
    setEditingWeights(prev => ({
      ...prev,
      [metricKey]: newWeight
    }));
    setHasUnsavedChanges(true);
  };

  // Save weights
  const handleSaveWeights = () => {
    if (!currentPillarSummary) return;
    
    const updatedWeights = { ...currentPillarSummary.component_weights };
    Object.entries(editingWeights).forEach(([key, weight]) => {
      if (updatedWeights[key]) {
        updatedWeights[key] = { ...updatedWeights[key], weight };
      }
    });
    
    updatePillarMutation.mutate({
      pillar: activePillar,
      update: { component_weights: updatedWeights }
    });
  };

  // Handle 404 OR empty data - need to initialize
  const needsInit = (isError && (error as any)?.response?.status === 404) || 
    (overview && overview.metrics.length === 0 && overview.rules.length === 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
          </div>
          <span className="text-white/60">Loading scoring configuration...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-[#0a0a1a] p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Calculator className="w-7 h-7 text-amber-400" />
              </div>
              <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Scoring Configuration</h1>
              <p className="text-white/40 text-sm">
                Configure weights, formulas, and rules for the OHI framework
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {needsInit && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => initMutation.mutate()}
                disabled={initMutation.isPending}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors flex items-center gap-2"
              >
                {initMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Initialize Configuration
              </motion.button>
            )}
            
            {hasUnsavedChanges && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveWeights}
                disabled={updatePillarMutation.isPending}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
              >
                {updatePillarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => recalcMutation.mutate()}
              disabled={recalcMutation.isPending || !overview}
              className={cn(
                "px-4 py-2 rounded-lg flex items-center gap-2 transition-colors",
                recalcMutation.isPending
                  ? "bg-white/5 text-white/40 cursor-not-allowed"
                  : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              )}
            >
              {recalcMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Recalculate All
            </motion.button>
          </div>
        </motion.div>

        {/* Recalculation Result */}
        <AnimatePresence>
          {recalcResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium">
                      Scores recalculated for {recalcResult.countries_updated} countries
                    </p>
                    <p className="text-white/60 text-sm">
                      Execution time: {recalcResult.execution_time_ms}ms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <ScoreDistributionBadge label="Reactive" count={recalcResult.score_distribution.reactive} color="bg-red-500" />
                  <ScoreDistributionBadge label="Compliant" count={recalcResult.score_distribution.compliant} color="bg-orange-500" />
                  <ScoreDistributionBadge label="Proactive" count={recalcResult.score_distribution.proactive} color="bg-lime-500" />
                  <ScoreDistributionBadge label="Resilient" count={recalcResult.score_distribution.resilient} color="bg-emerald-500" />
                </div>
                <button onClick={() => setRecalcResult(null)} className="text-white/40 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {overview && (
          <>
            {/* View Navigation */}
            <motion.div variants={fadeInUp} className="flex gap-2 p-1 bg-white/5 rounded-xl">
              {(Object.keys(viewConfig) as ViewType[]).map((view) => {
                const config = viewConfig[view];
                const Icon = config.icon;
                const isActive = activeView === view;

                return (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{config.label}</span>
                  </button>
                );
              })}
            </motion.div>

            {/* View Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Overview View */}
                {activeView === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Score Flow Diagram */}
                    <div className="lg:col-span-2 bg-white/5 rounded-xl border border-white/10 p-6">
                      <ScoreFlowDiagram
                        componentWeights={componentWeightsForChart}
                        onPillarClick={(pillarId) => {
                          setActivePillar(pillarId as PillarKey);
                          setActiveView("configure");
                        }}
                      />
                    </div>

                    {/* Pillar Weight Distribution */}
                    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-white/40" />
                        Pillar Weight Distribution
                      </h3>
                      <PillarWeightChart className="mb-6" />
                      
                      {/* Statistics */}
                      <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-sm">Active Metrics</span>
                          <span className="text-white font-mono">{overview.statistics.active_metrics}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-sm">Active Rules</span>
                          <span className="text-white font-mono">{overview.statistics.active_rules}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/50 text-sm">Total Pillars</span>
                          <span className="text-white font-mono">{overview.pillar_summaries.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Pillar Cards */}
                    <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {(Object.keys(pillarConfig) as PillarKey[])
                        .filter((key) => key !== "composite")
                        .map((key, index) => {
                          const config = pillarConfig[key];
                          const metricsCount = overview.metrics.filter((m) => m.category === key).length;

                          return (
                            <motion.button
                              key={key}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -4 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setActivePillar(key);
                                setActiveView("configure");
                              }}
                              className={cn(
                                "p-4 rounded-xl border text-left transition-colors",
                                config.bgColor,
                                config.borderColor,
                                "hover:bg-white/10"
                              )}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                                  <config.icon className={cn("w-5 h-5", config.color)} />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{config.label}</p>
                                  <p className="text-white/40 text-xs">{metricsCount} metrics</p>
                                </div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className={cn("text-2xl font-bold font-mono", config.color)}>
                                  {(config.weight * 100).toFixed(0)}%
                                </span>
                                <span className="text-white/40 text-sm">weight</span>
                              </div>
                            </motion.button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Configure View */}
                {activeView === "configure" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pillar Tabs */}
                    <div className="lg:col-span-3">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {(Object.keys(pillarConfig) as PillarKey[])
                          .filter((key) => key !== "composite")
                          .map((key) => {
                            const config = pillarConfig[key];
                            const Icon = config.icon;
                            const isActive = activePillar === key;
                            
                            return (
                              <button
                                key={key}
                                onClick={() => setActivePillar(key)}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-3 rounded-xl transition-all min-w-fit",
                                  isActive
                                    ? `${config.bgColor} ${config.borderColor} border-2`
                                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                                )}
                              >
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                                  <Icon className={cn("w-4 h-4", config.color)} />
                                </div>
                                <div className="text-left">
                                  <p className={cn("font-medium", isActive ? "text-white" : "text-white/60")}>
                                    {config.label}
                                  </p>
                                  <p className="text-xs text-white/40">
                                    {(config.weight * 100).toFixed(0)}% of maturity
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {/* Weight Configuration */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Pillar Header */}
                      <div className={cn(
                        "rounded-xl p-6 border",
                        pillarConfig[activePillar].bgColor,
                        pillarConfig[activePillar].borderColor
                      )}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-white mb-1">
                              {pillarConfig[activePillar].label} Index
                            </h2>
                            <p className="text-white/60 text-sm">
                              {pillarConfig[activePillar].description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-white">0-100</p>
                            <p className="text-white/40 text-sm">Output Range</p>
                          </div>
                        </div>
                        
                        {/* Total Weight Indicator */}
                        {currentPillarSummary && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white/60 text-sm">Total Component Weight</span>
                              <span className={cn(
                                "font-mono font-bold",
                                Math.abs(totalWeight - 1.0) < 0.001 ? "text-emerald-400" : "text-amber-400"
                              )}>
                                {(totalWeight * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                className={cn(
                                  "h-full transition-all duration-300",
                                  Math.abs(totalWeight - 1.0) < 0.001 ? "bg-emerald-500" : "bg-amber-500"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(totalWeight * 100, 100)}%` }}
                              />
                            </div>
                            {Math.abs(totalWeight - 1.0) > 0.001 && (
                              <p className="text-amber-400 text-xs mt-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Weights should sum to 100%
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Component Weights with Enhanced Sliders */}
                      {currentPillarSummary && 
                        currentPillarSummary.component_weights && 
                        Object.keys(currentPillarSummary.component_weights).length > 0 ? (
                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="px-4 py-3 border-b border-white/10">
                            <h3 className="text-white font-medium flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-white/40" />
                              Component Weights
                            </h3>
                            <p className="text-white/40 text-xs mt-1">
                              Adjust the contribution of each metric to the pillar score
                            </p>
                          </div>
                          
                          <div className="divide-y divide-white/5">
                            {Object.entries(currentPillarSummary.component_weights).map(([metricKey, config]) => {
                              const currentWeight = editingWeights[metricKey] ?? config.weight;
                              const metric = overview.metrics.find(m => m.metric_key === metricKey);
                              
                              return (
                                <EnhancedWeightSlider
                                  key={metricKey}
                                  metricKey={metricKey}
                                  metricName={metric?.name || metricKey.replace(/_/g, " ")}
                                  description={metric?.description || null}
                                  weight={currentWeight}
                                  defaultWeight={config.weight}
                                  isInverted={config.invert || false}
                                  maxValue={config.max_value}
                                  unit={metric?.unit || null}
                                  lowerIsBetter={metric?.lower_is_better || false}
                                  onChange={(newWeight) => handleWeightChange(metricKey, newWeight)}
                                  onReset={() => handleWeightChange(metricKey, config.weight)}
                                  pillarColor={pillarConfig[activePillar].color}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
                          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                          <p className="text-white font-medium text-lg">Configuration Not Initialized</p>
                          <p className="text-white/60 text-sm mt-2 mb-4">
                            No component weights are configured for this pillar yet.
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => initMutation.mutate()}
                            disabled={initMutation.isPending}
                            className="px-6 py-2.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors flex items-center gap-2 mx-auto"
                          >
                            {initMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                            Initialize Configuration
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {/* Info Panel */}
                    <div className="space-y-4">
                      {/* Scoring Methodology */}
                      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4 text-white/40" />
                          Scoring Methodology
                        </h3>
                        <div className="space-y-3 text-sm text-white/60">
                          <p>The <span className="text-white">{pillarConfig[activePillar].label}</span> index uses a weighted average:</p>
                          <div className="bg-white/5 rounded-lg p-3 font-mono text-xs">
                            Score = Σ(metric × weight)
                          </div>
                          <p>Each metric is normalized to 0-100 before weighting. Inverted metrics (where lower is better) are calculated as: <span className="font-mono">100 - normalized_value</span></p>
                        </div>
                      </div>

                      {/* Weight Distribution Chart */}
                      {currentPillarSummary && (
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-white/40" />
                            Weight Distribution
                          </h3>
                          <AnimatedWeightBars
                            segments={Object.entries(currentPillarSummary.component_weights)
                              .map(([key, config]) => ({
                                id: key,
                                label: key.split("_").slice(0, 3).join(" "),
                                weight: editingWeights[key] ?? config.weight,
                                color:
                                  activePillar === "composite"
                                    ? "#06b6d4"
                                    : PILLAR_HEX[activePillar],
                              }))}
                            maxWidth={250}
                          />
                        </div>
                      )}

                      {/* Expert Guidance */}
                      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-4">
                        <h3 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          WHO/ILO Guidance
                        </h3>
                        <p className="text-white/60 text-sm">
                          Default weights follow WHO/ILO occupational health system assessment frameworks. 
                          Hazard Control (35%) is weighted highest as prevention is the primary goal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rules View */}
                {activeView === "rules" && (
                  <MaturityRuleVisualizer
                    rules={overview.rules}
                    showInactive={false}
                  />
                )}

                {/* Simulate View */}
                {activeView === "simulate" && (
                  <CalculationPreview
                    countryName="Sample Country"
                    countryCode="XX"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* Empty State */}
        {!overview && !isLoading && !needsInit && (
          <motion.div
            variants={fadeInUp}
            className="bg-white/5 rounded-xl p-8 text-center"
          >
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Unable to load metric configuration</p>
            <p className="text-white/40 text-sm mb-4">
              There was an error loading the configuration. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// SCORE DISTRIBUTION BADGE
// =============================================================================

function ScoreDistributionBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-3 h-3 rounded", color)} />
      <span className="text-white/60">{label}: {count}</span>
    </div>
  );
}

export default MetricCalculator;
