/**
 * Arthur D. Little - Global Health Platform
 * Country Statistics Panel
 * Displays economic, demographic, and socio-political information from database
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Briefcase,
  MapPin,
  Globe,
  Heart,
  Building2,
  GraduationCap,
  Info,
} from "lucide-react";
import { fetchCountryIntelligence, type CountryIntelligenceResponse } from "../services/api";
import { type IndicatorType } from "../services/worldBankApi";
import { ADLLoader } from "./ADLLoader";
import { StatsComparisonModal } from "./StatsComparisonModal";
import { cn } from "../lib/utils";

interface CountryStatsPanelProps {
  isoCode: string;
  countryName: string;
  className?: string;
}

// Stats tile configuration - mapped to database fields and World Bank indicators
type StatTileConfig = {
  id: string;
  label: string;
  icon: typeof DollarSign;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  textColor: string;
  getValue: (data: CountryIntelligenceResponse) => number | null;
  format: (value: number | null) => string;
  indicatorType: IndicatorType; // World Bank indicator for global comparison
};

const STATS_TILES: StatTileConfig[] = [
  {
    id: "gdp_per_capita",
    label: "GDP/Capita",
    icon: DollarSign,
    gradientFrom: "from-emerald-500/10",
    gradientTo: "to-emerald-600/5",
    borderColor: "border-emerald-500/20",
    textColor: "text-emerald-400",
    getValue: (data) => data.economic.gdp_per_capita_ppp,
    format: (value) => value ? `$${Math.round(value).toLocaleString()}` : "N/A",
    indicatorType: "GDP_PER_CAPITA",
  },
  {
    id: "population",
    label: "Population",
    icon: Users,
    gradientFrom: "from-purple-500/10",
    gradientTo: "to-purple-600/5",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-400",
    getValue: (data) => data.economic.population_total,
    format: (value) => {
      if (!value) return "N/A";
      if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return value.toLocaleString();
    },
    indicatorType: "POPULATION",
  },
  {
    id: "labor_force",
    label: "Labor Force",
    icon: Briefcase,
    gradientFrom: "from-amber-500/10",
    gradientTo: "to-amber-600/5",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-400",
    getValue: (data) => data.restoration.labor_force_participation,
    format: (value) => value ? `${value.toFixed(1)}%` : "N/A",
    indicatorType: "LABOR_FORCE",
  },
  {
    id: "life_expectancy",
    label: "Life Expectancy",
    icon: Heart,
    gradientFrom: "from-rose-500/10",
    gradientTo: "to-rose-600/5",
    borderColor: "border-rose-500/20",
    textColor: "text-rose-400",
    getValue: (data) => data.vigilance.life_expectancy_at_birth,
    format: (value) => value ? `${value.toFixed(1)} yrs` : "N/A",
    indicatorType: "LIFE_EXPECTANCY",
  },
  {
    id: "urban_population",
    label: "Urban Pop.",
    icon: Building2,
    gradientFrom: "from-cyan-500/10",
    gradientTo: "to-cyan-600/5",
    borderColor: "border-cyan-500/20",
    textColor: "text-cyan-400",
    getValue: (data) => data.economic.urban_population_pct,
    format: (value) => value ? `${value.toFixed(1)}%` : "N/A",
    indicatorType: "URBAN_POPULATION",
  },
  {
    id: "hdi_score",
    label: "HDI Score",
    icon: GraduationCap,
    gradientFrom: "from-indigo-500/10",
    gradientTo: "to-indigo-600/5",
    borderColor: "border-indigo-500/20",
    textColor: "text-indigo-400",
    getValue: (data) => data.restoration.hdi_score,
    format: (value) => value ? value.toFixed(3) : "N/A",
    indicatorType: "HDI_SCORE",
  },
];

export function CountryStatsPanel({ isoCode, countryName, className = "" }: CountryStatsPanelProps) {
  // Modal state for global comparison
  const [selectedTile, setSelectedTile] = useState<StatTileConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch intelligence data from database
  const { data: intelligence, isLoading, isError } = useQuery({
    queryKey: ["country-intelligence", isoCode],
    queryFn: () => fetchCountryIntelligence(isoCode),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Handle stat tile click
  const handleTileClick = (tile: StatTileConfig) => {
    setSelectedTile(tile);
    setIsModalOpen(true);
  };

  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTile(null);
  };

  // Loading state with ADL branded loader
  if (isLoading) {
    return (
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex items-center justify-center", className)}>
        <ADLLoader 
          size="sm" 
          message="Loading country data" 
          subtitle="Fetching from database..."
          showProgress={true}
        />
      </div>
    );
  }

  // Error or no data state
  if (isError || !intelligence) {
    return (
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4", className)}>
        <div className="text-center py-6">
          <Globe className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Country statistics not available</p>
          <p className="text-xs text-white/30 mt-1">No intelligence data found for {countryName}</p>
        </div>
      </div>
    );
  }

  // Determine region from country name or fallback
  const getIncomeLevel = () => {
    const hdi = intelligence.restoration.hdi_score;
    if (!hdi) return "Unknown";
    if (hdi >= 0.8) return "High income";
    if (hdi >= 0.7) return "Upper middle income";
    if (hdi >= 0.55) return "Lower middle income";
    return "Low income";
  };

  const incomeLevel = getIncomeLevel();

  return (
    <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-adl-accent" />
          <span className="text-sm font-medium text-white">Country Profile</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-3 space-y-3">
        {/* Key Metrics - 2x3 Grid */}
        <div className="grid grid-cols-2 gap-2">
          {STATS_TILES.map((tile, index) => {
            const Icon = tile.icon;
            const value = tile.getValue(intelligence);
            const displayValue = tile.format(value);
            
            return (
              <motion.button
                key={tile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => handleTileClick(tile)}
                className={cn(
                  "bg-gradient-to-br rounded-lg p-3 border text-left overflow-hidden",
                  "transition-all duration-200 cursor-pointer group",
                  "hover:scale-[1.02] hover:brightness-110 hover:shadow-lg",
                  tile.gradientFrom,
                  tile.gradientTo,
                  tile.borderColor
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", tile.textColor)} />
                    <span className="text-[10px] text-white/50 uppercase truncate">{tile.label}</span>
                  </div>
                  <Info className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0 ml-1" />
                </div>
                <div className={cn("text-lg font-bold", tile.textColor)}>
                  {displayValue}
                </div>
                <div className="text-[9px] text-white/30 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click for global ranking
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Income Level Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg"
        >
          <span className="text-xs text-white/50">Income Classification</span>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded",
            incomeLevel.includes("High") ? "bg-emerald-500/20 text-emerald-400" :
            incomeLevel.includes("Upper") ? "bg-cyan-500/20 text-cyan-400" :
            incomeLevel.includes("Lower") ? "bg-amber-500/20 text-amber-400" :
            "bg-red-500/20 text-red-400"
          )}>
            {incomeLevel}
          </span>
        </motion.div>

        {/* Data Source Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center"
        >
          <span className="text-[10px] text-white/30">
            Data: ADL Intelligence Database • Multiple sources
          </span>
        </motion.div>
      </div>

      {/* Global Comparison Modal */}
      {selectedTile && (
        <StatsComparisonModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          indicatorType={selectedTile.indicatorType}
          countryIsoCode={isoCode}
          countryName={countryName}
          currentValue={intelligence ? selectedTile.getValue(intelligence) : null}
        />
      )}
    </div>
  );
}

export default CountryStatsPanel;
