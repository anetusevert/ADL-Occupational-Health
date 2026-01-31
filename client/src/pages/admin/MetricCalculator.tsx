/**
 * GOHIP Platform - Metric Calculator
 * Admin Configuration for Framework-Aligned Scoring
 * 
 * Features:
 * - Visual weight sliders for each metric component
 * - Score breakdown visualization per pillar
 * - Expert-level WHO/ILO aligned default weights
 * - Live preview of score calculations
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Save,
  Loader2,
  Scale,
  Target,
  Sliders,
  BarChart3,
  Shield,
  Activity,
  Heart,
  Zap,
  Info,
  Edit2,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { apiClient } from "../../services/api";
import { cn } from "../../lib/utils";

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
  impact_type: string;
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

const updateMetric = async (metricKey: string, update: Partial<MetricDefinition>) => {
  const response = await apiClient.put(`/api/v1/admin/metric-config/metrics/${metricKey}`, update);
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
// PILLAR CONFIGURATION
// =============================================================================

type PillarKey = "governance" | "pillar_1_hazard" | "pillar_2_vigilance" | "pillar_3_restoration" | "composite";

const pillarConfig: Record<PillarKey, { 
  icon: typeof Shield; 
  color: string; 
  bgColor: string; 
  borderColor: string;
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
    label: "ADL OHI Score",
    shortLabel: "OHI",
    weight: 1.0,
    description: "Arthur D. Little Occupational Health Index (1.0-4.0 scale)",
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MetricCalculator() {
  const queryClient = useQueryClient();
  
  // State
  const [activePillar, setActivePillar] = useState<PillarKey>("governance");
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
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
      // Auto-recalculate all scores after initialization
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
      // Auto-recalculate all scores after weight changes
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
  const currentMetrics = useMemo(() => {
    if (!overview) return [];
    return overview.metrics.filter(m => m.category === activePillar);
  }, [overview, activePillar]);

  // Calculate total weight for current pillar
  const totalWeight = useMemo(() => {
    if (!currentPillarSummary) return 0;
    const weights = { ...currentPillarSummary.component_weights, ...editingWeights };
    return Object.values(weights).reduce((sum, config) => {
      const w = typeof config === 'object' ? config.weight : config;
      return sum + (w || 0);
    }, 0);
  }, [currentPillarSummary, editingWeights]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading metric configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Metric Calculator</h1>
              <p className="text-white/40 text-sm">
                Configure scoring weights and formulas for framework pillars
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
        </div>

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
            {/* Pillar Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(Object.keys(pillarConfig) as PillarKey[]).map((key) => {
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
                        {key === "composite" ? "1.0-4.0 scale" : `${(config.weight * 100).toFixed(0)}% of maturity`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pillar Content - Responsive grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Breakdown Panel */}
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
                      <p className="text-3xl font-bold text-white">
                        {activePillar === "composite" ? "1-4" : "0-100"}
                      </p>
                      <p className="text-white/40 text-sm">Output Range</p>
                    </div>
                  </div>
                  
                  {/* Total Weight Indicator */}
                  {currentPillarSummary && activePillar !== "composite" && (
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
                        <div 
                          className={cn(
                            "h-full transition-all duration-300",
                            Math.abs(totalWeight - 1.0) < 0.001 ? "bg-emerald-500" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(totalWeight * 100, 100)}%` }}
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

                {/* Component Weights with Sliders */}
                {activePillar !== "composite" && (
                  currentPillarSummary && 
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
                            <WeightSlider
                              key={metricKey}
                              metricKey={metricKey}
                              metricName={metric?.name || metricKey.replace(/_/g, " ")}
                              description={metric?.description || null}
                              weight={currentWeight}
                              isInverted={config.invert || false}
                              maxValue={config.max_value}
                              unit={metric?.unit || null}
                              lowerIsBetter={metric?.lower_is_better || false}
                              onChange={(newWeight) => handleWeightChange(metricKey, newWeight)}
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
                        Click the button below to initialize default weights based on WHO/ILO guidance.
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
                  )
                )}

                {/* Maturity Scoring Rules (for composite tab) */}
                {activePillar === "composite" && (
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <h3 className="text-white font-medium flex items-center gap-2">
                        <Scale className="w-4 h-4 text-white/40" />
                        Maturity Scoring Rules
                      </h3>
                      <p className="text-white/40 text-xs mt-1">
                        Rules that determine the overall maturity score (1.0-4.0)
                      </p>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                      {overview.rules.map((rule) => (
                        <MaturityRuleRow key={rule.id} rule={rule} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="space-y-4">
                {/* Pillar Overview */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-white/40" />
                    Scoring Methodology
                  </h3>
                  
                  {activePillar === "composite" ? (
                    <div className="space-y-3 text-sm text-white/60">
                      <p>The <span className="text-white">Maturity Score</span> uses a rule-based calculation:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 font-mono">1.0</span>
                          <span>Base score (Reactive)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-mono">+1.0</span>
                          <span>Low fatal rate & high inspector density</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-amber-400 font-mono">+0.5</span>
                          <span>Risk-based surveillance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-mono">+1.0</span>
                          <span>Reintegration law in place</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-mono">+0.5</span>
                          <span>No-fault compensation</span>
                        </li>
                      </ul>
                      <p className="pt-2 border-t border-white/10">
                        Maximum score: <span className="text-white font-mono">4.0</span> (Resilient)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm text-white/60">
                      <p>The <span className="text-white">{pillarConfig[activePillar].label}</span> index uses a weighted average:</p>
                      <div className="bg-white/5 rounded-lg p-3 font-mono text-xs">
                        Score = Σ(metric × weight)
                      </div>
                      <p>Each metric is normalized to 0-100 before weighting. Inverted metrics (where lower is better) are calculated as: <span className="font-mono">100 - normalized_value</span></p>
                    </div>
                  )}
                </div>

                {/* Weight Distribution Chart */}
                {currentPillarSummary && activePillar !== "composite" && (
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-white/40" />
                      Weight Distribution
                    </h3>
                    
                    <div className="space-y-2">
                      {Object.entries(currentPillarSummary.component_weights)
                        .sort((a, b) => b[1].weight - a[1].weight)
                        .map(([key, config]) => {
                          const currentWeight = editingWeights[key] ?? config.weight;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <div className="w-20 text-xs text-white/40 truncate">
                                {key.split("_").slice(0, 2).join(" ")}
                              </div>
                              <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full", pillarConfig[activePillar].bgColor.replace("/20", ""))}
                                  style={{ width: `${currentWeight * 100}%` }}
                                />
                              </div>
                              <div className="w-12 text-xs text-white/60 text-right font-mono">
                                {(currentWeight * 100).toFixed(0)}%
                              </div>
                            </div>
                          );
                        })}
                    </div>
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
          </>
        )}

        {/* Empty State */}
        {!overview && !isLoading && !needsInit && (
          <div className="bg-white/5 rounded-xl p-8 text-center">
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
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WEIGHT SLIDER COMPONENT
// =============================================================================

function WeightSlider({
  metricKey,
  metricName,
  description,
  weight,
  isInverted,
  maxValue,
  unit,
  lowerIsBetter,
  onChange,
  pillarColor,
}: {
  metricKey: string;
  metricName: string;
  description: string | null;
  weight: number;
  isInverted: boolean;
  maxValue?: number;
  unit: string | null;
  lowerIsBetter: boolean;
  onChange: (weight: number) => void;
  pillarColor: string;
}) {
  return (
    <div className="px-4 py-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium">{metricName}</p>
            {isInverted && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Inverted
              </span>
            )}
          </div>
          {description && (
            <p className="text-white/40 text-sm mt-0.5 line-clamp-1">{description}</p>
          )}
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-bold font-mono", pillarColor)}>
            {(weight * 100).toFixed(0)}%
          </p>
          {unit && <p className="text-white/40 text-xs">{unit}</p>}
        </div>
      </div>
      
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={weight * 100}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-grab"
        />
        {/* Track fill */}
        <div 
          className="absolute top-0 left-0 h-2 rounded-full pointer-events-none bg-gradient-to-r from-white/20 to-white/40"
          style={{ width: `${weight * 100}%` }}
        />
      </div>
      
      {/* Scale markers */}
      <div className="flex justify-between mt-1 text-xs text-white/30">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// =============================================================================
// MATURITY RULE ROW COMPONENT
// =============================================================================

function MaturityRuleRow({ rule }: { rule: MaturityRule }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = pillarConfig[rule.pillar as PillarKey] || pillarConfig.composite;
  const Icon = config.icon;

  const impactDisplay = rule.impact_type === "cap" 
    ? `Cap at ${rule.impact_value}` 
    : rule.impact_type === "set"
    ? `Set to ${rule.impact_value}`
    : `${rule.impact_value >= 0 ? "+" : ""}${rule.impact_value}`;

  return (
    <div className="px-4 py-3 hover:bg-white/5 transition-colors">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
          <div>
            <p className="text-white font-medium">{rule.name}</p>
            <p className="text-white/40 text-sm">{rule.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "text-lg font-bold font-mono",
            rule.impact_type === "cap" ? "text-red-400" : 
            rule.impact_value >= 0 ? "text-emerald-400" : "text-red-400"
          )}>
            {impactDisplay}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-white/40 text-xs mb-2">Condition</p>
              <div className="bg-white/5 rounded-lg p-3 font-mono text-xs text-white/60">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(rule.condition_config, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
