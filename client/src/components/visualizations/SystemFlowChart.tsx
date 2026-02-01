/**
 * Arthur D. Little - Global Health Platform
 * System Flow Chart Visualization
 * 
 * Horizontal input-process-output flow diagram showing:
 * - Inputs: Funding, Laws, Resources
 * - Processes: Inspections, Services, Training
 * - Outcomes: Accidents, DALYs, Recovery
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { SystemFlowData } from "../../lib/frameworkVisualization";
import { ArrowRight, FileText, Settings, Target } from "lucide-react";

interface SystemFlowChartProps {
  data: SystemFlowData;
  className?: string;
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

export function SystemFlowChart({ data, className }: SystemFlowChartProps) {
  const stages = [
    { key: "inputs" as const, items: data.inputs },
    { key: "processes" as const, items: data.processes },
    { key: "outcomes" as const, items: data.outcomes },
  ];

  return (
    <div className={cn("flex items-stretch gap-4", className)}>
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
              "flex-1 rounded-xl border p-4",
              config.bgColor,
              config.borderColor
            )}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  config.bgColor,
                  "border",
                  config.borderColor
                )}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div>
                  <h4 className={cn("text-sm font-bold", config.color)}>{config.label}</h4>
                  <p className="text-[10px] text-white/40">{config.subtitle}</p>
                </div>
                <div className="ml-auto">
                  <span className={cn("text-lg font-bold", config.color)}>
                    {avgScore.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2">
                {stage.items.map((item, itemIndex) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: stageIndex * 0.15 + itemIndex * 0.05 + 0.2 }}
                    className="flex items-center justify-between py-1.5 px-2 bg-white/5 rounded-lg"
                  >
                    <span className="text-xs text-white/60">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">
                        {item.value ?? "N/A"}
                      </span>
                      {item.score !== null && (
                        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
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
                  <ArrowRight className={cn("w-6 h-6", config.arrowColor)} />
                  {/* Animated pulse */}
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-full",
                      config.bgColor
                    )}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: stageIndex * 0.5,
                    }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default SystemFlowChart;
