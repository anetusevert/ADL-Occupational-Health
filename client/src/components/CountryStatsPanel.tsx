/**
 * Arthur D. Little - Global Health Platform
 * Country Statistics Panel
 * Displays economic, demographic, and socio-political information from World Bank API
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Briefcase,
  TrendingUp,
  MapPin,
  Loader2,
  Globe,
  ExternalLink,
} from "lucide-react";
import {
  fetchCountryWorldBankData,
  formatIndicatorValue,
  type IndicatorType,
} from "../services/worldBankApi";
import { StatsComparisonModal } from "./StatsComparisonModal";
import { cn } from "../lib/utils";

interface CountryStatsPanelProps {
  isoCode: string;
  countryName: string;
  className?: string;
}

// Stats tile configuration
const STATS_TILES: {
  id: IndicatorType;
  label: string;
  icon: typeof DollarSign;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  textColor: string;
}[] = [
  {
    id: "GDP_TOTAL",
    label: "GDP Total",
    icon: DollarSign,
    gradientFrom: "from-emerald-500/10",
    gradientTo: "to-emerald-600/5",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-400",
  },
  {
    id: "GDP_PER_CAPITA",
    label: "GDP/Capita",
    icon: TrendingUp,
    gradientFrom: "from-cyan-500/10",
    gradientTo: "to-cyan-600/5",
    borderColor: "border-cyan-500/20",
    textColor: "text-cyan-400",
  },
  {
    id: "POPULATION",
    label: "Population",
    icon: Users,
    gradientFrom: "from-purple-500/10",
    gradientTo: "to-purple-600/5",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-400",
  },
  {
    id: "LABOR_FORCE",
    label: "Labor Force",
    icon: Briefcase,
    gradientFrom: "from-amber-500/10",
    gradientTo: "to-amber-600/5",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
  },
];

export function CountryStatsPanel({ isoCode, countryName, className = "" }: CountryStatsPanelProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType | null>(null);

  // Fetch World Bank data
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["world-bank-country", isoCode],
    queryFn: () => fetchCountryWorldBankData(isoCode),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Get value for an indicator
  const getValue = (indicator: IndicatorType): number | null => {
    if (!stats) return null;
    switch (indicator) {
      case "GDP_TOTAL": return stats.gdpTotal;
      case "GDP_PER_CAPITA": return stats.gdpPerCapita;
      case "POPULATION": return stats.population;
      case "LABOR_FORCE": return stats.laborForce;
      default: return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-2 text-sm text-white/50">Loading World Bank data...</span>
        </div>
      </div>
    );
  }

  // Error or no data state
  if (isError || !stats) {
    return (
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4", className)}>
        <div className="text-center py-6">
          <Globe className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Country statistics not available</p>
          <p className="text-xs text-white/30 mt-1">Unable to fetch from World Bank API</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden", className)}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-adl-accent" />
            <span className="text-sm font-medium text-white">Country Profile</span>
            <span className="text-xs text-white/40 ml-auto">{stats.region}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-3 space-y-3">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 gap-2">
            {STATS_TILES.map((tile, index) => {
              const Icon = tile.icon;
              const value = getValue(tile.id);
              
              return (
                <motion.button
                  key={tile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setSelectedIndicator(tile.id)}
                  className={cn(
                    "bg-gradient-to-br rounded-lg p-3 border text-left",
                    "cursor-pointer transition-all duration-200",
                    "hover:scale-[1.02] hover:brightness-110",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
                    tile.gradientFrom,
                    tile.gradientTo,
                    tile.borderColor
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-3.5 h-3.5", tile.textColor)} />
                    <span className="text-[10px] text-white/50 uppercase">{tile.label}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-white/30 ml-auto" />
                  </div>
                  <div className={cn("text-lg font-bold", tile.textColor)}>
                    {formatIndicatorValue(value, tile.id)}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Income Group Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg"
          >
            <span className="text-xs text-white/50">Income Classification</span>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded",
              stats.incomeLevel.includes("High") ? "bg-emerald-500/20 text-emerald-400" :
              stats.incomeLevel.includes("Upper") ? "bg-cyan-500/20 text-cyan-400" :
              stats.incomeLevel.includes("Lower") ? "bg-amber-500/20 text-amber-400" :
              "bg-red-500/20 text-red-400"
            )}>
              {stats.incomeLevel}
            </span>
          </motion.div>

          {/* Data Year Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-center"
          >
            <span className="text-[10px] text-white/30">
              Data: World Bank ({stats.dataYear}) • Click tiles for global comparison
            </span>
          </motion.div>
        </div>
      </div>

      {/* Stats Comparison Modal */}
      {selectedIndicator && (
        <StatsComparisonModal
          isOpen={selectedIndicator !== null}
          onClose={() => setSelectedIndicator(null)}
          indicatorType={selectedIndicator}
          countryIsoCode={isoCode}
          countryName={countryName}
          currentValue={getValue(selectedIndicator)}
        />
      )}
    </>
  );
}

export default CountryStatsPanel;
