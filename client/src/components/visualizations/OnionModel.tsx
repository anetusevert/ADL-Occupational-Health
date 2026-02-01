/**
 * Arthur D. Little - Global Health Platform
 * Onion Model Visualization
 * 
 * Concentric ring SVG visualization showing:
 * - Outer: National Policy Layer
 * - Middle: Institutional Infrastructure
 * - Core: Workplace Implementation
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { OnionLayerData } from "../../lib/frameworkVisualization";
import { CheckCircle2, XCircle, Minus } from "lucide-react";

interface OnionModelProps {
  data: OnionLayerData[];
  className?: string;
}

const LAYER_CONFIG = {
  policy: {
    color: "stroke-purple-400",
    fill: "fill-purple-500/10",
    hoverFill: "group-hover:fill-purple-500/20",
    textColor: "text-purple-400",
    radius: 140,
  },
  infrastructure: {
    color: "stroke-blue-400",
    fill: "fill-blue-500/10",
    hoverFill: "group-hover:fill-blue-500/20",
    textColor: "text-blue-400",
    radius: 100,
  },
  workplace: {
    color: "stroke-cyan-400",
    fill: "fill-cyan-500/10",
    hoverFill: "group-hover:fill-cyan-500/20",
    textColor: "text-cyan-400",
    radius: 55,
  },
};

export function OnionModel({ data, className }: OnionModelProps) {
  const center = 160;
  const sortedData = [...data].sort((a, b) => 
    LAYER_CONFIG[b.layer].radius - LAYER_CONFIG[a.layer].radius
  );

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* SVG Visualization */}
      <div className="flex-shrink-0">
        <svg 
          width="320" 
          height="320" 
          viewBox="0 0 320 320"
          className="overflow-visible"
        >
          {/* Background glow */}
          <defs>
            <radialGradient id="onion-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={center} cy={center} r="150" fill="url(#onion-glow)" />

          {/* Concentric rings */}
          {sortedData.map((layer, index) => {
            const config = LAYER_CONFIG[layer.layer];
            const score = layer.score ?? 0;
            
            return (
              <g key={layer.layer} className="group cursor-pointer">
                {/* Background ring */}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={config.radius}
                  className={cn(
                    config.fill,
                    config.hoverFill,
                    "transition-all duration-300"
                  )}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                />
                
                {/* Ring outline */}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={config.radius}
                  fill="none"
                  strokeWidth="2"
                  className={cn(config.color, "opacity-60")}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: index * 0.15 + 0.2, duration: 0.5 }}
                />

                {/* Score arc (if score available) */}
                {score > 0 && (
                  <motion.circle
                    cx={center}
                    cy={center}
                    r={config.radius}
                    fill="none"
                    strokeWidth="4"
                    className={config.color}
                    strokeDasharray={`${(score / 100) * 2 * Math.PI * config.radius} ${2 * Math.PI * config.radius}`}
                    strokeDashoffset={2 * Math.PI * config.radius * 0.25}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${2 * Math.PI * config.radius}` }}
                    animate={{ 
                      strokeDasharray: `${(score / 100) * 2 * Math.PI * config.radius} ${2 * Math.PI * config.radius}` 
                    }}
                    transition={{ delay: index * 0.15 + 0.4, duration: 0.8 }}
                  />
                )}
              </g>
            );
          })}

          {/* Center label */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              className="fill-white text-xs font-semibold"
            >
              WORKPLACE
            </text>
            <text
              x={center}
              y={center + 8}
              textAnchor="middle"
              className="fill-white/60 text-[10px]"
            >
              Implementation
            </text>
          </motion.g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-3">
        {sortedData.map((layer, index) => {
          const config = LAYER_CONFIG[layer.layer];
          
          return (
            <motion.div
              key={layer.layer}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
            >
              {/* Layer header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", config.fill, "border", config.color.replace("stroke", "border"))} />
                  <span className={cn("text-sm font-medium", config.textColor)}>{layer.label}</span>
                </div>
                {layer.score !== null && (
                  <span className={cn("text-sm font-bold", config.textColor)}>
                    {layer.score.toFixed(0)}%
                  </span>
                )}
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-1">
                {layer.metrics.slice(0, 4).map((metric) => (
                  <div 
                    key={metric.label}
                    className="flex items-center gap-1.5 text-[10px]"
                  >
                    {metric.isGood === true && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    )}
                    {metric.isGood === false && (
                      <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    )}
                    {metric.isGood === null && (
                      <Minus className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="text-white/50 truncate">{metric.label}:</span>
                    <span className="text-white/80 font-medium">
                      {metric.value === null ? "N/A" : 
                       typeof metric.value === "boolean" ? (metric.value ? "Yes" : "No") :
                       metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default OnionModel;
