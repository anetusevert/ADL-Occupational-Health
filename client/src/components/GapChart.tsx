/**
 * GOHIP Platform - GapChart Component
 * Bar chart comparing country metrics vs global average using Recharts
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { cn } from "../lib/utils";

interface GapChartProps {
  countryName: string;
  countryValue: number | null;
  globalAverage: number;
  metric: string;
  unit?: string;
  className?: string;
  lowerIsBetter?: boolean;
}

export function GapChart({
  countryName,
  countryValue,
  globalAverage,
  metric,
  unit = "",
  className,
  lowerIsBetter = true,
}: GapChartProps) {
  if (countryValue === null) {
    return (
      <div className={cn("bg-slate-800/50 rounded-xl border border-slate-700/50 p-6", className)}>
        <h3 className="text-lg font-semibold text-white mb-4">{metric} Comparison</h3>
        <p className="text-slate-400">No data available</p>
      </div>
    );
  }

  const data = [
    {
      name: countryName,
      value: countryValue,
      fill: lowerIsBetter
        ? countryValue <= globalAverage
          ? "#10b981" // Green - better
          : "#ef4444" // Red - worse
        : countryValue >= globalAverage
        ? "#10b981"
        : "#ef4444",
    },
    {
      name: "Global Average",
      value: globalAverage,
      fill: "#64748b", // Slate for reference
    },
  ];

  const gap = countryValue - globalAverage;
  const gapPercent = ((gap / globalAverage) * 100).toFixed(1);
  const isBetter = lowerIsBetter ? gap < 0 : gap > 0;

  return (
    <div className={cn("bg-slate-800/50 rounded-xl border border-slate-700/50 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{metric} Comparison</h3>
        <div
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            isBetter
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          )}
        >
          {isBetter ? "↓" : "↑"} {Math.abs(gap).toFixed(2)} {unit} ({Math.abs(Number(gapPercent))}%)
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              type="number"
              domain={[0, Math.max(countryValue, globalAverage) * 1.2]}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "#475569" }}
              tickLine={{ stroke: "#475569" }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#e2e8f0", fontSize: 13, fontWeight: 500 }}
              axisLine={{ stroke: "#475569" }}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              formatter={(value) => [`${Number(value).toFixed(2)} ${unit}`, metric]}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
            />
            <ReferenceLine
              x={globalAverage}
              stroke="#64748b"
              strokeDasharray="5 5"
              label={{
                value: `Avg: ${globalAverage}`,
                fill: "#94a3b8",
                fontSize: 11,
                position: "top",
              }}
            />
            <Bar dataKey="value" name={metric} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gap Analysis */}
      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
        <p className="text-sm text-slate-300">
          <span className="font-medium">{countryName}</span> has a{" "}
          <span className={isBetter ? "text-emerald-400" : "text-red-400"}>
            {Math.abs(gap).toFixed(2)} {unit}
          </span>{" "}
          {lowerIsBetter ? (gap < 0 ? "lower" : "higher") : gap > 0 ? "higher" : "lower"}{" "}
          {metric.toLowerCase()} compared to the global average.
          {!isBetter && (
            <span className="text-red-400 ml-1">
              This represents a {Math.abs(Number(gapPercent))}% gap that requires attention.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MULTI-METRIC GAP CHART
// ============================================================================

interface MultiGapChartProps {
  countryName: string;
  metrics: Array<{
    name: string;
    countryValue: number | null;
    globalAverage: number;
    unit?: string;
    lowerIsBetter?: boolean;
  }>;
  className?: string;
}

export function MultiGapChart({ countryName, metrics, className }: MultiGapChartProps) {
  const data = metrics
    .filter((m) => m.countryValue !== null)
    .map((m) => {
      const gap = (m.countryValue! - m.globalAverage) / m.globalAverage * 100;
      const isBetter = m.lowerIsBetter !== false ? gap < 0 : gap > 0;
      
      return {
        name: m.name,
        gap: gap,
        countryValue: m.countryValue,
        globalAverage: m.globalAverage,
        isBetter,
        fill: isBetter ? "#10b981" : "#ef4444",
      };
    });

  if (data.length === 0) {
    return (
      <div className={cn("bg-slate-800/50 rounded-xl border border-slate-700/50 p-6", className)}>
        <h3 className="text-lg font-semibold text-white mb-4">Performance Gap Analysis</h3>
        <p className="text-slate-400">No data available for comparison</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-slate-800/50 rounded-xl border border-slate-700/50 p-6", className)}>
      <h3 className="text-lg font-semibold text-white mb-4">
        {countryName} - Performance Gap Analysis
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        Percentage difference from global average (negative = better for most metrics)
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 40, left: 120, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "#475569" }}
              tickFormatter={(value) => `${value > 0 ? "+" : ""}${value.toFixed(0)}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#e2e8f0", fontSize: 12 }}
              axisLine={{ stroke: "#475569" }}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
              }}
              formatter={(value, _name, props) => {
                const numValue = Number(value);
                const item = props.payload as { countryValue?: number; globalAverage?: number };
                return [
                  `${numValue > 0 ? "+" : ""}${numValue.toFixed(1)}% (${item.countryValue?.toFixed(2)} vs ${item.globalAverage})`,
                  "Gap",
                ];
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} />
            <Bar dataKey="gap" name="Gap %" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GapChart;
