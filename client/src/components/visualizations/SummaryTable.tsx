/**
 * Arthur D. Little - Global Health Platform
 * Summary Table Component
 * 
 * Comparative data table showing:
 * - Current country values
 * - Comparison country values
 * - Global averages
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SummaryTableRow } from "../../lib/frameworkVisualization";

interface SummaryTableProps {
  data: SummaryTableRow[];
  countryName: string;
  comparisonName: string;
  className?: string;
}

export function SummaryTable({ 
  data, 
  countryName, 
  comparisonName,
  className 
}: SummaryTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden",
        className
      )}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-900/30">
              <th className="text-left py-3 px-4 text-xs font-semibold text-white/60 uppercase tracking-wider">
                Metric
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                {countryName}
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                {comparisonName}
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
                Global Avg
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <motion.tr
                key={row.metric}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-700/30 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-sm text-white">
                  {row.metric}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm font-semibold text-cyan-400">
                    {row.currentValue}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm font-semibold text-purple-400">
                    {row.comparisonValue}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-sm text-white/50">
                    {row.globalValue}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <ComparisonIndicator 
                    currentValue={row.currentValue}
                    comparisonValue={row.comparisonValue}
                    lowerIsBetter={row.lowerIsBetter}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

interface ComparisonIndicatorProps {
  currentValue: string | number | null;
  comparisonValue: string | number | null;
  lowerIsBetter?: boolean;
}

function ComparisonIndicator({ 
  currentValue, 
  comparisonValue,
  lowerIsBetter 
}: ComparisonIndicatorProps) {
  // Parse numeric values
  const current = parseNumericValue(currentValue);
  const comparison = parseNumericValue(comparisonValue);

  if (current === null || comparison === null) {
    return <Minus className="w-4 h-4 text-slate-500 mx-auto" />;
  }

  // Determine if current is better
  let isBetter: boolean;
  if (lowerIsBetter) {
    isBetter = current < comparison;
  } else {
    isBetter = current > comparison;
  }

  const isEqual = Math.abs(current - comparison) < 0.1;

  if (isEqual) {
    return (
      <div className="flex items-center justify-center gap-1">
        <Minus className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-400">Equal</span>
      </div>
    );
  }

  if (isBetter) {
    return (
      <div className="flex items-center justify-center gap-1">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-emerald-400">Better</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <TrendingDown className="w-4 h-4 text-red-400" />
      <span className="text-xs text-red-400">Behind</span>
    </div>
  );
}

function parseNumericValue(value: string | number | null): number | null {
  if (value === null || value === "N/A") return null;
  if (typeof value === "number") return value;
  
  // Extract number from string like "72%", "2.1", "0.8/10k", etc.
  const match = String(value).match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  return null;
}

export default SummaryTable;
