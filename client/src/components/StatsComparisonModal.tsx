/**
 * Arthur D. Little - Global Health Platform
 * Stats Comparison Modal
 * Displays global rankings and comparisons for country statistics
 * 
 * Updated: Uses database-backed rankings instead of live World Bank API calls
 */

import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  TrendingDown,
  Globe,
  Loader2,
  AlertCircle,
  Medal,
  Database,
} from "lucide-react";
import {
  fetchDatabaseRankings,
  INDICATOR_TO_METRIC,
  type CountryRankEntry,
  type GlobalRankingsResponse,
} from "../services/api";
import { type IndicatorType, INDICATOR_META } from "../services/worldBankApi";
import { cn } from "../lib/utils";

interface StatsComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorType: IndicatorType;
  countryIsoCode: string;
  countryName: string;
  currentValue: number | null;
}

/**
 * Format a value based on unit type
 */
function formatValue(value: number | null, unit: string): string {
  if (value === null || value === undefined) return "N/A";
  
  switch (unit) {
    case "USD":
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    case "%":
      return `${value.toFixed(1)}%`;
    case "years":
      return `${value.toFixed(1)} yrs`;
    case "":
      // For HDI or population
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      if (value < 1) return value.toFixed(3); // HDI
      return value.toLocaleString();
    default:
      return value.toLocaleString();
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function StatsComparisonModal({
  isOpen,
  onClose,
  indicatorType,
  countryIsoCode,
  countryName,
  currentValue,
}: StatsComparisonModalProps) {
  // Map indicator type to database metric name
  const metricName = INDICATOR_TO_METRIC[indicatorType] || indicatorType.toLowerCase();

  // Fetch global rankings from database
  const {
    data: rankingData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["database-rankings", metricName, countryIsoCode],
    queryFn: () => fetchDatabaseRankings(metricName, countryIsoCode),
    enabled: isOpen,
    staleTime: 10 * 60 * 1000, // 10 minutes (database data is stable)
    retry: 2,
  });

  // Keyboard handler for escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Get metadata from worldBankApi for display labels (fallback)
  const meta = INDICATOR_META[indicatorType];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal - Fixed positioning that works with sidebar layouts */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl max-h-[90vh] bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700/50 z-[101] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {rankingData?.metric_label || meta?.shortLabel || "Global Ranking"}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {rankingData?.metric_label || meta?.label || "Country Comparison"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {isLoading && (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading global rankings...</p>
                  </div>
                </div>
              )}

              {isError && (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium mb-1">Failed to load rankings</p>
                    <p className="text-slate-400 text-sm">
                      {error instanceof Error ? error.message : "Please try again later"}
                    </p>
                  </div>
                </div>
              )}

              {rankingData && (
                <div className="space-y-6">
                  {/* Current Country Card */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/30 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{countryName}</h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {rankingData.current_country
                            ? `${getOrdinalSuffix(rankingData.current_country.rank)} of ${rankingData.total_countries} countries`
                            : "Ranking not available"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">
                          {formatValue(
                            rankingData.current_country?.value ?? currentValue,
                            rankingData.unit
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Source: {rankingData.data_source}
                        </div>
                      </div>
                    </div>

                    {/* Percentile Bar */}
                    {rankingData.current_country && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Global Percentile</span>
                          <span className="text-cyan-400 font-medium">
                            Top {(100 - rankingData.current_country.percentile).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rankingData.current_country.percentile}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Lower</span>
                          <span>Higher</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rankings Lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Top Countries */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-semibold text-white">Top 10</h4>
                      </div>
                      <div className="space-y-1">
                        {rankingData.top_10.map((country) => (
                          <RankingRow
                            key={country.iso_code}
                            country={country}
                            unit={rankingData.unit}
                            isTop={true}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Countries */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-white">Bottom 10</h4>
                      </div>
                      <div className="space-y-1">
                        {rankingData.bottom_10.map((country) => (
                          <RankingRow
                            key={country.iso_code}
                            country={country}
                            unit={rankingData.unit}
                            isTop={false}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 bg-slate-800/50 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Database className="w-3 h-3" />
                  <span>
                    Data: {rankingData?.data_source || "ADL Intelligence Database"}
                    {rankingData?.total_countries && ` (${rankingData.total_countries} countries)`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Ranking Row Component
function RankingRow({
  country,
  unit,
  isTop,
}: {
  country: CountryRankEntry;
  unit: string;
  isTop: boolean;
}) {
  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-amber-400";
    if (rank === 2) return "text-slate-300";
    if (rank === 3) return "text-amber-600";
    return "text-slate-500";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors",
        country.is_current
          ? "bg-cyan-500/20 border border-cyan-500/30"
          : "hover:bg-slate-700/30"
      )}
    >
      <div className="w-6 text-center flex-shrink-0">
        {isTop && country.rank <= 3 ? (
          <Medal className={cn("w-4 h-4", getMedalColor(country.rank))} />
        ) : (
          <span className="text-[10px] text-slate-500">{country.rank}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-xs truncate block",
            country.is_current ? "text-cyan-300 font-medium" : "text-slate-300"
          )}
        >
          {country.name}
        </span>
      </div>
      <div className="text-xs text-slate-400 tabular-nums flex-shrink-0">
        {formatValue(country.value, unit)}
      </div>
    </div>
  );
}

export default StatsComparisonModal;
