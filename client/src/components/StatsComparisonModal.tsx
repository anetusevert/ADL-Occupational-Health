/**
 * Arthur D. Little - Global Health Platform
 * Stats Comparison Modal
 * Displays global rankings and comparisons for country statistics
 * 
 * Compact design - no scrolling required, instant loading from database
 */

import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  TrendingDown,
  Globe,
  AlertCircle,
  Medal,
  Database,
} from "lucide-react";
import {
  fetchDatabaseRankings,
  INDICATOR_TO_METRIC,
  type CountryRankEntry,
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
 * Format a value based on unit type - compact version
 */
function formatValue(value: number | null, unit: string): string {
  if (value === null || value === undefined) return "N/A";
  
  switch (unit) {
    case "USD":
      if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    case "%":
      return `${value.toFixed(1)}%`;
    case "years":
      return `${value.toFixed(1)}`;
    case "":
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
      if (value < 1) return value.toFixed(3);
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
  const metricName = INDICATOR_TO_METRIC[indicatorType] || indicatorType.toLowerCase();

  // Fetch rankings with infinite staleTime for instant display
  const { data: rankingData, isError } = useQuery({
    queryKey: ["database-rankings", metricName, countryIsoCode],
    queryFn: () => fetchDatabaseRankings(metricName, countryIsoCode),
    enabled: isOpen,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  const meta = INDICATOR_META[indicatorType];

  // Get top 5 and bottom 5 for compact display
  const top5 = rankingData?.top_10?.slice(0, 5) || [];
  const bottom5 = rankingData?.bottom_10?.slice(-5) || [];

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

          {/* Modal - Inset positioning for proper containment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-20 xl:inset-28 m-auto max-w-lg h-fit max-h-[calc(100vh-2rem)] bg-slate-900 rounded-xl border border-slate-700/50 z-[101] shadow-2xl flex flex-col"
          >
            {/* Compact Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-slate-700/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {rankingData?.metric_label || meta?.shortLabel || "Global Ranking"}
                    </h2>
                    <p className="text-[10px] text-slate-400">Global Comparison</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>

            {/* Content - No scroll needed */}
            <div className="flex-1 p-4">
              {isError ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs">Failed to load rankings</p>
                  </div>
                </div>
              ) : rankingData ? (
                <div className="space-y-3">
                  {/* Current Country Card - Compact */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/30 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{countryName}</h3>
                        <p className="text-slate-400 text-xs">
                          {rankingData.current_country
                            ? `${getOrdinalSuffix(rankingData.current_country.rank)} of ${rankingData.total_countries}`
                            : "Not ranked"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-cyan-400">
                          {formatValue(rankingData.current_country?.value ?? currentValue, rankingData.unit)}
                        </div>
                      </div>
                    </div>

                    {/* Compact Percentile Bar */}
                    {rankingData.current_country && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Percentile</span>
                          <span className="text-cyan-400 font-medium">
                            Top {(100 - rankingData.current_country.percentile).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rankingData.current_country.percentile}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rankings - Side by Side, Top 5 / Bottom 5 */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Top 5 */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <h4 className="text-xs font-semibold text-white">Top 5</h4>
                      </div>
                      <div className="space-y-0.5">
                        {top5.map((country) => (
                          <CompactRankingRow
                            key={country.iso_code}
                            country={country}
                            unit={rankingData.unit}
                            isTop={true}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bottom 5 */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-2.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
                        <h4 className="text-xs font-semibold text-white">Bottom 5</h4>
                      </div>
                      <div className="space-y-0.5">
                        {bottom5.map((country) => (
                          <CompactRankingRow
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
              ) : null}
            </div>

            {/* Compact Footer */}
            <div className="flex-shrink-0 px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Database className="w-3 h-3" />
                <span>
                  {rankingData?.data_source || "ADL Database"} • {rankingData?.total_countries || "—"} countries
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Compact Ranking Row Component
function CompactRankingRow({
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
        "flex items-center gap-1 px-1.5 py-1 rounded transition-colors",
        country.is_current
          ? "bg-cyan-500/20 border border-cyan-500/30"
          : "hover:bg-slate-700/30"
      )}
    >
      <div className="w-5 text-center flex-shrink-0">
        {isTop && country.rank <= 3 ? (
          <Medal className={cn("w-3 h-3", getMedalColor(country.rank))} />
        ) : (
          <span className="text-[9px] text-slate-500">{country.rank}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-[10px] truncate block",
            country.is_current ? "text-cyan-300 font-medium" : "text-slate-300"
          )}
        >
          {country.name}
        </span>
      </div>
      <div className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">
        {formatValue(country.value, unit)}
      </div>
    </div>
  );
}

export default StatsComparisonModal;
