/**
 * Arthur D. Little - Global Health Platform
 * Stats Comparison Modal
 * Displays global rankings and comparisons for country statistics
 */

import { useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  Trophy,
  TrendingDown,
  Globe,
  Loader2,
  AlertCircle,
  Medal,
} from "lucide-react";
import {
  fetchGlobalRankings,
  formatIndicatorValue,
  getOrdinalSuffix,
  INDICATOR_META,
  type IndicatorType,
  type CountryRanking,
} from "../services/worldBankApi";
import { cn } from "../lib/utils";

interface StatsComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorType: IndicatorType;
  countryIsoCode: string;
  countryName: string;
  currentValue: number | null;
}

export function StatsComparisonModal({
  isOpen,
  onClose,
  indicatorType,
  countryIsoCode,
  countryName,
  currentValue,
}: StatsComparisonModalProps) {
  // Fetch global rankings
  const {
    data: rankingData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["world-bank-rankings", indicatorType, countryIsoCode],
    queryFn: () => fetchGlobalRankings(indicatorType, countryIsoCode),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-8 md:inset-16 lg:inset-24 bg-slate-900 rounded-2xl border border-slate-700/50 z-50 overflow-hidden flex flex-col shadow-2xl max-w-3xl mx-auto"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{meta.shortLabel}</h2>
                    <p className="text-xs text-slate-400">{meta.label}</p>
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
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading global rankings...</p>
                  </div>
                </div>
              )}

              {isError && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-slate-300 font-medium mb-1">Failed to load rankings</p>
                    <p className="text-slate-400 text-sm">Please try again later</p>
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
                          {rankingData.currentCountry
                            ? `${getOrdinalSuffix(rankingData.currentCountry.rank)} of ${rankingData.totalCountries} countries`
                            : "Ranking not available"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">
                          {formatIndicatorValue(currentValue, indicatorType)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Data year: {rankingData.dataYear}
                        </div>
                      </div>
                    </div>

                    {/* Percentile Bar */}
                    {rankingData.currentCountry && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Global Percentile</span>
                          <span className="text-cyan-400 font-medium">
                            Top {100 - rankingData.percentile}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rankingData.percentile}%` }}
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
                  <div className="grid grid-cols-2 gap-4">
                    {/* Top Countries */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-semibold text-white">Top 10</h4>
                      </div>
                      <div className="space-y-1">
                        {rankingData.topCountries.map((country) => (
                          <RankingRow
                            key={country.isoCode}
                            country={country}
                            indicatorType={indicatorType}
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
                        {rankingData.bottomCountries.map((country) => (
                          <RankingRow
                            key={country.isoCode}
                            country={country}
                            indicatorType={indicatorType}
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
                <div className="text-xs text-slate-500">
                  Source: World Bank ({rankingData?.indicatorCode || meta.label})
                </div>
                <a
                  href={meta.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View on World Bank
                  <ExternalLink className="w-3 h-3" />
                </a>
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
  indicatorType,
  isTop,
}: {
  country: CountryRanking;
  indicatorType: IndicatorType;
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
        country.isCurrentCountry
          ? "bg-cyan-500/20 border border-cyan-500/30"
          : "hover:bg-slate-700/30"
      )}
    >
      <div className="w-6 text-center">
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
            country.isCurrentCountry ? "text-cyan-300 font-medium" : "text-slate-300"
          )}
        >
          {country.countryName}
        </span>
      </div>
      <div className="text-xs text-slate-400 tabular-nums">
        {formatIndicatorValue(country.value, indicatorType)}
      </div>
    </div>
  );
}

export default StatsComparisonModal;
