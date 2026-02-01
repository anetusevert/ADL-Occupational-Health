/**
 * Arthur D. Little - Global Health Platform
 * Onion Model Visualization
 * 
 * Concentric ring SVG visualization showing:
 * - Outer: National Policy Layer
 * - Middle: Institutional Infrastructure
 * - Core: Workplace Implementation
 * 
 * Enhanced with AI insights, strengths, and gaps per layer.
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { OnionLayerData } from "../../lib/frameworkVisualization";
import { CheckCircle2, XCircle, Minus, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface OnionModelProps {
  data: OnionLayerData[];
  className?: string;
  showInsights?: boolean; // Show AI insights if available
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

// Generate fallback insights based on layer data
function generateLayerInsight(layer: OnionLayerData): { insight: string; strength: { label: string; detail: string } | undefined; gap: { label: string; detail: string } | undefined } {
  const goodMetrics = layer.metrics.filter(m => m.isGood === true);
  const badMetrics = layer.metrics.filter(m => m.isGood === false);
  
  let insight = "";
  let strength: { label: string; detail: string } | undefined;
  let gap: { label: string; detail: string } | undefined;
  
  if (layer.layer === "policy") {
    const iloStatus = layer.metrics.find(m => m.label === "ILO C187");
    const mentalHealth = layer.metrics.find(m => m.label === "Mental Health");
    insight = `${layer.score !== null ? `Policy layer at ${layer.score.toFixed(0)}% maturity. ` : ""}${goodMetrics.length > 0 ? `Strong in ${goodMetrics.map(m => m.label).join(", ").toLowerCase()}.` : ""} ${badMetrics.length > 0 ? `Gaps in ${badMetrics.map(m => m.label).join(", ").toLowerCase()}.` : ""}`.trim();
    
    if (mentalHealth?.isGood) {
      strength = { label: "Mental Health Policy", detail: "Legal framework for workplace mental health exists" };
    } else if (goodMetrics.length > 0) {
      strength = { label: goodMetrics[0].label, detail: `${goodMetrics[0].label} requirements in place` };
    }
    
    if (iloStatus && !iloStatus.isGood) {
      gap = { label: "ILO Conventions", detail: "Key ILO OH conventions not ratified" };
    } else if (badMetrics.length > 0) {
      gap = { label: badMetrics[0].label, detail: `${badMetrics[0].label} framework incomplete` };
    }
  } else if (layer.layer === "infrastructure") {
    const inspectorDensity = layer.metrics.find(m => m.label === "Inspectors/10k");
    insight = `${layer.score !== null ? `Infrastructure capacity at ${layer.score.toFixed(0)}%. ` : ""}${inspectorDensity ? `Inspector density: ${inspectorDensity.value}/10k workers.` : ""} ${goodMetrics.length > 0 ? "Surveillance systems operational." : ""}`.trim();
    
    if (inspectorDensity?.isGood) {
      strength = { label: "Inspection Capacity", detail: `${inspectorDensity.value}/10k meets ILO benchmark` };
    }
    
    if (inspectorDensity && !inspectorDensity.isGood) {
      gap = { label: "Inspector Shortage", detail: "Below ILO recommended 1.0/10k workers" };
    }
  } else {
    const fatalRate = layer.metrics.find(m => m.label === "Fatal Rate");
    insight = `${layer.score !== null ? `Workplace outcomes at ${layer.score.toFixed(0)}% effectiveness. ` : ""}${fatalRate ? `Fatal accident rate: ${fatalRate.value}/100k.` : ""} ${goodMetrics.length > 0 ? "Positive compliance indicators." : ""}`.trim();
    
    if (fatalRate?.isGood) {
      strength = { label: "Safety Outcomes", detail: `Fatal rate ${fatalRate.value}/100k below average` };
    }
    
    if (fatalRate && !fatalRate.isGood) {
      gap = { label: "Accident Prevention", detail: `Fatal rate ${fatalRate.value}/100k needs reduction` };
    }
  }
  
  return { insight: insight || "Analysis pending.", strength, gap };
}

export function OnionModel({ data, className, showInsights = true }: OnionModelProps) {
  const center = 160;
  const sortedData = [...data].sort((a, b) => 
    LAYER_CONFIG[b.layer].radius - LAYER_CONFIG[a.layer].radius
  );

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* SVG Visualization */}
      <div className="flex-shrink-0">
        <svg 
          width="280" 
          height="280" 
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

      {/* Layer Cards with Insights */}
      <div className="flex-1 space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin">
        {sortedData.map((layer, index) => {
          const config = LAYER_CONFIG[layer.layer];
          // Use provided insights or generate fallback
          const layerInsights = layer.insight 
            ? { insight: layer.insight, strength: layer.strength, gap: layer.gap }
            : generateLayerInsight(layer);
          
          return (
            <motion.div
              key={layer.layer}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
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
              
              {/* Key Metrics Row */}
              <div className="flex flex-wrap gap-2 mb-2">
                {layer.metrics.slice(0, 4).map((metric) => (
                  <div 
                    key={metric.label}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]",
                      metric.isGood === true && "bg-emerald-500/10 text-emerald-400",
                      metric.isGood === false && "bg-red-500/10 text-red-400",
                      metric.isGood === null && "bg-slate-700/50 text-white/50"
                    )}
                  >
                    {metric.isGood === true && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {metric.isGood === false && <XCircle className="w-2.5 h-2.5" />}
                    {metric.isGood === null && <Minus className="w-2.5 h-2.5" />}
                    <span>{metric.label}: {metric.value === null ? "N/A" : 
                           typeof metric.value === "boolean" ? (metric.value ? "Yes" : "No") :
                           metric.value}</span>
                  </div>
                ))}
              </div>

              {/* AI Insight */}
              {showInsights && layerInsights.insight && (
                <div className="mb-2 p-2 bg-slate-900/50 rounded border-l-2 border-cyan-500/50">
                  <div className="flex items-start gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-white/70 leading-relaxed">
                      {layerInsights.insight}
                    </p>
                  </div>
                </div>
              )}

              {/* Strength & Gap Indicators */}
              {showInsights && (layerInsights.strength || layerInsights.gap) && (
                <div className="grid grid-cols-2 gap-2">
                  {layerInsights.strength && (
                    <div className="flex items-start gap-1.5 p-1.5 bg-emerald-500/5 rounded border border-emerald-500/20">
                      <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-medium text-emerald-400">{layerInsights.strength.label}</p>
                        <p className="text-[8px] text-white/50 line-clamp-1">{layerInsights.strength.detail}</p>
                      </div>
                    </div>
                  )}
                  {layerInsights.gap && (
                    <div className="flex items-start gap-1.5 p-1.5 bg-amber-500/5 rounded border border-amber-500/20">
                      <TrendingDown className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-medium text-amber-400">{layerInsights.gap.label}</p>
                        <p className="text-[8px] text-white/50 line-clamp-1">{layerInsights.gap.detail}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default OnionModel;
