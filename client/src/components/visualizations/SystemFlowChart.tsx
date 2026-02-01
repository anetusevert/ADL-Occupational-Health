/**
 * Arthur D. Little - Global Health Platform
 * System Process Flow Chart Visualization
 * 
 * Horizontal input-process-output flow diagram showing:
 * - Inputs: Funding, Laws, Resources
 * - Processes: Inspections, Services, Training
 * - Outcomes: Accidents, DALYs, Recovery
 * 
 * Enhanced with AI insights, strengths, and gaps per stage.
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { SystemFlowData, SystemFlowItem, SystemFlowStageInsight } from "../../lib/frameworkVisualization";
import { ArrowRight, FileText, Settings, Target, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

interface SystemFlowChartProps {
  data: SystemFlowData;
  className?: string;
  showInsights?: boolean;
}

const STAGE_CONFIG = {
  inputs: {
    label: "INPUTS",
    subtitle: "Resources & Framework",
    icon: FileText,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    arrowColor: "text-purple-400",
  },
  processes: {
    label: "PROCESSES",
    subtitle: "Operations & Services",
    icon: Settings,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    arrowColor: "text-blue-400",
  },
  outcomes: {
    label: "OUTCOMES",
    subtitle: "Health Impact",
    icon: Target,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    arrowColor: "text-emerald-400",
  },
};

// Generate fallback insights for a stage
function generateStageInsight(stageKey: "inputs" | "processes" | "outcomes", items: SystemFlowItem[]): SystemFlowStageInsight {
  const avgScore = items.reduce((a, b) => a + (b.score ?? 0), 0) / items.length;
  const highItems = items.filter(i => (i.score ?? 0) >= 70);
  const lowItems = items.filter(i => (i.score ?? 0) < 40 && i.score !== null);
  
  let insight = "";
  let strength: { label: string; detail: string } | undefined;
  let gap: { label: string; detail: string } | undefined;
  
  if (stageKey === "inputs") {
    insight = `Input framework at ${avgScore.toFixed(0)}% effectiveness. ${highItems.length > 0 ? `Strong foundations in ${highItems[0].label.toLowerCase()}.` : ""} ${lowItems.length > 0 ? `Critical gaps in ${lowItems[0].label.toLowerCase()} need addressing.` : ""}`.trim();
    if (highItems.length > 0) {
      strength = { label: highItems[0].label, detail: `${highItems[0].value} supports system effectiveness` };
    }
    if (lowItems.length > 0) {
      gap = { label: lowItems[0].label, detail: `${lowItems[0].value || "Below target"} limits capacity` };
    }
  } else if (stageKey === "processes") {
    insight = `Operational processes at ${avgScore.toFixed(0)}% capacity. ${highItems.length > 0 ? `Effective ${highItems[0].label.toLowerCase()} operations.` : ""} ${lowItems.length > 0 ? `Process bottleneck in ${lowItems[0].label.toLowerCase()}.` : ""}`.trim();
    if (highItems.length > 0) {
      strength = { label: highItems[0].label, detail: `Operational excellence at ${highItems[0].score}%` };
    }
    if (lowItems.length > 0) {
      gap = { label: lowItems[0].label, detail: `Process efficiency only ${lowItems[0].score}%` };
    }
  } else {
    insight = `Health outcomes at ${avgScore.toFixed(0)}% achievement. ${highItems.length > 0 ? `Positive results in ${highItems[0].label.toLowerCase()}.` : ""} ${lowItems.length > 0 ? `Outcome gaps in ${lowItems[0].label.toLowerCase()}.` : ""}`.trim();
    if (highItems.length > 0) {
      strength = { label: highItems[0].label, detail: `${highItems[0].value} meets targets` };
    }
    if (lowItems.length > 0) {
      gap = { label: lowItems[0].label, detail: `${lowItems[0].value || "Below benchmark"} needs improvement` };
    }
  }
  
  return { insight: insight || "Analysis pending.", strength, gap };
}

export function SystemFlowChart({ data, className, showInsights = true }: SystemFlowChartProps) {
  const stages = [
    { key: "inputs" as const, items: data.inputs },
    { key: "processes" as const, items: data.processes },
    { key: "outcomes" as const, items: data.outcomes },
  ];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Flow Diagram Row */}
      <div className="flex items-stretch gap-4">
        {stages.map((stage, stageIndex) => {
          const config = STAGE_CONFIG[stage.key];
          const Icon = config.icon;
          const avgScore = stage.items.reduce((a, b) => a + (b.score ?? 0), 0) / stage.items.length;

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stageIndex * 0.15 }}
              className="flex-1 flex items-center"
            >
              {/* Stage Card */}
              <div className={cn(
                "flex-1 rounded-xl border p-3",
                config.bgColor,
                config.borderColor
              )}>
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    config.bgColor,
                    "border",
                    config.borderColor
                  )}>
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                  </div>
                  <div>
                    <h4 className={cn("text-xs font-bold", config.color)}>{config.label}</h4>
                    <p className="text-[9px] text-white/40">{config.subtitle}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={cn("text-base font-bold", config.color)}>
                      {avgScore.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-1.5">
                  {stage.items.slice(0, 3).map((item, itemIndex) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: stageIndex * 0.15 + itemIndex * 0.05 + 0.2 }}
                      className="flex items-center justify-between py-1 px-2 bg-white/5 rounded"
                    >
                      <span className="text-[10px] text-white/60 truncate">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-white">
                          {item.value ?? "N/A"}
                        </span>
                        {item.score !== null && (
                          <div className="w-10 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.score}%` }}
                              transition={{ delay: stageIndex * 0.15 + itemIndex * 0.05 + 0.4, duration: 0.5 }}
                              className={cn(
                                "h-full rounded-full",
                                item.score >= 70 ? "bg-emerald-500" :
                                item.score >= 40 ? "bg-amber-500" :
                                "bg-red-500"
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Arrow connector */}
              {stageIndex < stages.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stageIndex * 0.15 + 0.3 }}
                  className="flex-shrink-0 px-2"
                >
                  <div className="relative">
                    <ArrowRight className={cn("w-5 h-5", config.arrowColor)} />
                    <motion.div
                      className={cn("absolute inset-0 rounded-full", config.bgColor)}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: stageIndex * 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Insights Row - Below the flow diagram */}
      {showInsights && (
        <div className="grid grid-cols-3 gap-4">
          {stages.map((stage, stageIndex) => {
            const config = STAGE_CONFIG[stage.key];
            // Use provided insight or generate fallback
            const stageInsight = data.stageInsights?.[stage.key] ?? generateStageInsight(stage.key, stage.items);
            
            return (
              <motion.div
                key={`${stage.key}-insight`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: stageIndex * 0.1 + 0.5 }}
                className={cn(
                  "rounded-lg p-3 border",
                  config.bgColor,
                  config.borderColor
                )}
              >
                {/* Insight Header */}
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className={cn("w-3 h-3", config.color)} />
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider", config.color)}>
                    {config.label} Analysis
                  </span>
                </div>
                
                {/* Insight Text */}
                <p className="text-[10px] text-white/70 leading-relaxed mb-2 line-clamp-2">
                  {stageInsight.insight}
                </p>
                
                {/* Strength & Gap */}
                <div className="space-y-1.5">
                  {stageInsight.strength && (
                    <div className="flex items-start gap-1.5 p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-medium text-emerald-400">{stageInsight.strength.label}</p>
                        <p className="text-[8px] text-white/50 line-clamp-1">{stageInsight.strength.detail}</p>
                      </div>
                    </div>
                  )}
                  {stageInsight.gap && (
                    <div className="flex items-start gap-1.5 p-1.5 bg-amber-500/10 rounded border border-amber-500/20">
                      <TrendingDown className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-medium text-amber-400">{stageInsight.gap.label}</p>
                        <p className="text-[8px] text-white/50 line-clamp-1">{stageInsight.gap.detail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SystemFlowChart;
