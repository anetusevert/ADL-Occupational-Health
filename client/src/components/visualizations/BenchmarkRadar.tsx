/**
 * Arthur D. Little - Global Health Platform
 * Benchmark Radar Chart Visualization
 * 
 * Recharts radar chart with 5 dimensions comparing:
 * - Current country
 * - Comparison country (or global benchmark)
 */

import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "../../lib/utils";
import type { RadarDataPoint } from "../../lib/frameworkVisualization";

interface BenchmarkRadarProps {
  data: RadarDataPoint[];
  countryName: string;
  comparisonName: string;
  className?: string;
}

export function BenchmarkRadar({ 
  data, 
  countryName, 
  comparisonName, 
  className 
}: BenchmarkRadarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          {/* Grid */}
          <PolarGrid 
            stroke="rgba(255,255,255,0.1)" 
            strokeDasharray="3 3"
          />
          
          {/* Axis labels */}
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 500 }}
            tickLine={false}
          />
          
          {/* Radius axis */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
            tickCount={5}
            axisLine={false}
          />
          
          {/* Comparison country radar */}
          <Radar
            name={comparisonName}
            dataKey={comparisonName}
            stroke="rgb(168, 85, 247)"
            fill="rgb(168, 85, 247)"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: "rgb(168, 85, 247)", strokeWidth: 0, r: 3 }}
          />
          
          {/* Current country radar */}
          <Radar
            name={countryName}
            dataKey={countryName}
            stroke="rgb(6, 182, 212)"
            fill="rgb(6, 182, 212)"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ fill: "rgb(6, 182, 212)", strokeWidth: 0, r: 4 }}
          />
          
          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}
            itemStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
            formatter={(value: number) => [`${value.toFixed(0)}%`, undefined]}
          />
          
          {/* Legend */}
          <Legend
            wrapperStyle={{ paddingTop: "10px" }}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-xs text-white/70">{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Dimension labels with values */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {data.map((point) => (
          <div 
            key={point.dimension}
            className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700/50"
          >
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">
              {point.dimension}
            </p>
            <div className="flex justify-center gap-2">
              <span className="text-xs font-bold text-cyan-400">
                {(point[countryName] as number).toFixed(0)}
              </span>
              <span className="text-xs text-white/30">vs</span>
              <span className="text-xs font-bold text-purple-400">
                {(point[comparisonName] as number).toFixed(0)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default BenchmarkRadar;
