/**
 * Economic Quadrant Component
 * 
 * Displays 4 animated tiles with key economic indicators:
 * - Labor Force
 * - GDP per Capita
 * - Population
 * - Unemployment Rate
 * 
 * Enhanced with global/regional relative positioning.
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Globe2, TrendingUp, Briefcase, X, Building2, Factory, Wheat, ShoppingBag, BarChart3 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CountryIntelligence } from "../../pages/CountryDashboard";

// ============================================================================
// GLOBAL BENCHMARKS (World Bank/ILO Data 2023)
// ============================================================================

interface GlobalBenchmark {
  min: number;
  max: number;
  avg: number;
  median: number;
  p25: number;  // 25th percentile
  p75: number;  // 75th percentile
  unit: string;
  higherIsBetter: boolean;
}

const GLOBAL_BENCHMARKS: Record<string, GlobalBenchmark> = {
  labor_force_participation: {
    min: 35, max: 88, avg: 60.3, median: 61, p25: 52, p75: 68,
    unit: "%", higherIsBetter: true
  },
  gdp_per_capita_ppp: {
    min: 800, max: 140000, avg: 18500, median: 14200, p25: 5800, p75: 35000,
    unit: "$", higherIsBetter: true
  },
  population_total: {
    min: 10000, max: 1400000000, avg: 40000000, median: 8500000, p25: 2000000, p75: 30000000,
    unit: "", higherIsBetter: false // neutral
  },
  unemployment_rate: {
    min: 0.5, max: 35, avg: 6.8, median: 5.5, p25: 3.5, p75: 9,
    unit: "%", higherIsBetter: false
  },
  youth_unemployment_rate: {
    min: 1, max: 65, avg: 15.5, median: 13, p25: 8, p75: 22,
    unit: "%", higherIsBetter: false
  },
  informal_employment_pct: {
    min: 2, max: 95, avg: 45, median: 42, p25: 18, p75: 70,
    unit: "%", higherIsBetter: false
  },
  gdp_growth_rate: {
    min: -15, max: 25, avg: 3.2, median: 3, p25: 1.5, p75: 5,
    unit: "%", higherIsBetter: true
  },
  urban_population_pct: {
    min: 12, max: 100, avg: 56, median: 58, p25: 38, p75: 78,
    unit: "%", higherIsBetter: false // neutral
  },
  median_age: {
    min: 15, max: 48, avg: 31, median: 30, p25: 22, p75: 40,
    unit: " years", higherIsBetter: false // neutral
  },
  life_expectancy_at_birth: {
    min: 52, max: 85, avg: 72.5, median: 74, p25: 66, p75: 80,
    unit: " years", higherIsBetter: true
  },
  healthy_life_expectancy: {
    min: 45, max: 75, avg: 63.5, median: 65, p25: 57, p75: 70,
    unit: " years", higherIsBetter: true
  }
};

// Calculate percentile position (0-100, where 100 = best)
function calculatePercentile(value: number | null, benchmark: GlobalBenchmark): number | null {
  if (value === null) return null;
  
  const { min, max, higherIsBetter } = benchmark;
  const clamped = Math.max(min, Math.min(max, value));
  const rawPercentile = ((clamped - min) / (max - min)) * 100;
  
  // If lower is better, invert the percentile
  return higherIsBetter ? rawPercentile : (100 - rawPercentile);
}

// Get position label based on percentile
function getPositionLabel(percentile: number | null): { label: string; color: string; bgColor: string } {
  if (percentile === null) return { label: "No Data", color: "text-slate-400", bgColor: "bg-slate-500/20" };
  if (percentile >= 75) return { label: "Top 25%", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
  if (percentile >= 50) return { label: "Above Avg", color: "text-cyan-400", bgColor: "bg-cyan-500/20" };
  if (percentile >= 25) return { label: "Below Avg", color: "text-amber-400", bgColor: "bg-amber-500/20" };
  return { label: "Bottom 25%", color: "text-red-400", bgColor: "bg-red-500/20" };
}

interface EconomicQuadrantProps {
  country: {
    iso_code: string;
    name: string;
  };
  intelligence: CountryIntelligence | null;
  onTileClick?: (category: "labor-force" | "gdp-per-capita" | "population" | "unemployment") => void;
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

function AnimatedCounter({ value, duration = 1500, decimals = 0, prefix = "", suffix = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(value * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1) + "B";
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + "M";
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + "K";
    }
    return num.toFixed(decimals);
  };

  return (
    <span>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
}

interface EconomicTileProps {
  title: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  onClick: () => void;
  delay: number;
}

function EconomicTile({ title, value, icon: Icon, color, bgColor, prefix, suffix, decimals = 0, onClick, delay }: EconomicTileProps) {
  // Calculate percentile for quick badge display
  const benchmarkKey = title === "Labor Force" ? "labor_force_participation" 
    : title === "GDP per Capita" ? "gdp_per_capita_ppp"
    : title === "Unemployment" ? "unemployment_rate"
    : "population_total";
  
  const benchmark = GLOBAL_BENCHMARKS[benchmarkKey];
  const percentile = benchmark ? calculatePercentile(value, benchmark) : null;
  const position = getPositionLabel(percentile);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-xl border transition-all overflow-hidden group h-full",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border-white/10 hover:border-white/20",
        "text-left flex flex-col"
      )}
    >
      {/* Background glow on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        bgColor
      )} />
      
      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("p-1.5 rounded-lg", bgColor)}>
            <Icon className={cn("w-4 h-4", color)} />
          </div>
          {/* Position badge */}
          {percentile !== null && (
            <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", position.bgColor, position.color)}>
              {position.label}
            </span>
          )}
        </div>
        
        <p className="text-[10px] text-white/50 mb-0.5 uppercase tracking-wider">{title}</p>
        
        {value !== null ? (
          <p className={cn("text-xl font-bold", color)}>
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          </p>
        ) : (
          <p className="text-base text-white/30">No data</p>
        )}
        
        {/* Mini position bar */}
        {benchmark && value !== null && (
          <div className="mt-auto pt-2">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, ((value - benchmark.min) / (benchmark.max - benchmark.min)) * 100))}%` }}
                transition={{ duration: 0.8, delay: delay + 0.3 }}
                className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Click indicator */}
      <div className="absolute bottom-1.5 right-1.5 text-[8px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
        Details →
      </div>
    </motion.button>
  );
}

interface EconomicDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "labor" | "gdp" | "population" | "unemployment";
  country: { name: string };
  intelligence: CountryIntelligence | null;
}

// Relative position bar component - Compact version
function RelativePositionBar({ 
  value, 
  benchmarkKey, 
  label,
  color 
}: { 
  value: number | null; 
  benchmarkKey: string; 
  label: string;
  color: string;
}) {
  const benchmark = GLOBAL_BENCHMARKS[benchmarkKey];
  if (!benchmark || value === null) return null;
  
  const percentile = calculatePercentile(value, benchmark);
  const position = getPositionLabel(percentile);
  
  // Calculate where the value falls on the visual bar (0-100 scale)
  const visualPosition = Math.max(0, Math.min(100, 
    ((value - benchmark.min) / (benchmark.max - benchmark.min)) * 100
  ));
  
  // Calculate where the global average falls
  const avgPosition = ((benchmark.avg - benchmark.min) / (benchmark.max - benchmark.min)) * 100;
  
  return (
    <div className="mb-2 sm:mb-3">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] sm:text-[10px] text-white/60 truncate pr-2">{label}</span>
        <span className={cn("text-[8px] sm:text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap", position.bgColor, position.color)}>
          {position.label}
        </span>
      </div>
      
      <div className="relative h-2 sm:h-2.5 bg-white/10 rounded-full overflow-hidden">
        {/* Gradient background showing the range */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-amber-500/30 to-emerald-500/30" />
        
        {/* Global average marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/40"
          style={{ left: `${avgPosition}%` }}
        />
        
        {/* Country position marker */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${visualPosition}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={cn("absolute top-0 bottom-0 w-1 -ml-0.5 rounded-full shadow-lg", color.replace("text-", "bg-"))}
        />
      </div>
    </div>
  );
}

function EconomicDetailModal({ isOpen, onClose, type, country, intelligence }: EconomicDetailModalProps) {
  // Primary metrics with global positioning
  const positioningMetrics = useMemo(() => {
    const configs: Record<string, { key: keyof CountryIntelligence; benchmarkKey: string; label: string; color: string }[]> = {
      labor: [
        { key: "labor_force_participation", benchmarkKey: "labor_force_participation", label: "Labor Force Participation", color: "text-emerald-400" },
        { key: "unemployment_rate", benchmarkKey: "unemployment_rate", label: "Unemployment Rate", color: "text-amber-400" },
        { key: "youth_unemployment_rate", benchmarkKey: "youth_unemployment_rate", label: "Youth Unemployment", color: "text-orange-400" },
      ],
      gdp: [
        { key: "gdp_per_capita_ppp", benchmarkKey: "gdp_per_capita_ppp", label: "GDP per Capita (PPP)", color: "text-cyan-400" },
        { key: "gdp_growth_rate", benchmarkKey: "gdp_growth_rate", label: "GDP Growth Rate", color: "text-blue-400" },
      ],
      population: [
        { key: "life_expectancy_at_birth", benchmarkKey: "life_expectancy_at_birth", label: "Life Expectancy", color: "text-purple-400" },
        { key: "healthy_life_expectancy", benchmarkKey: "healthy_life_expectancy", label: "Healthy Life Expectancy", color: "text-violet-400" },
        { key: "urban_population_pct", benchmarkKey: "urban_population_pct", label: "Urban Population", color: "text-indigo-400" },
      ],
      unemployment: [
        { key: "unemployment_rate", benchmarkKey: "unemployment_rate", label: "Unemployment Rate", color: "text-amber-400" },
        { key: "youth_unemployment_rate", benchmarkKey: "youth_unemployment_rate", label: "Youth Unemployment", color: "text-orange-400" },
        { key: "informal_employment_pct", benchmarkKey: "informal_employment_pct", label: "Informal Employment", color: "text-red-400" },
      ],
    };
    return configs[type] || [];
  }, [type]);

  const configs = {
    labor: {
      title: "Labor Force",
      icon: Briefcase,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      metrics: [
        { label: "Labor Force Participation", value: intelligence?.labor_force_participation, suffix: "%" },
        { label: "Working Age Population", value: intelligence?.population_working_age, format: "number" },
        { label: "Unemployment Rate", value: intelligence?.unemployment_rate, suffix: "%" },
        { label: "Youth Unemployment", value: intelligence?.youth_unemployment_rate, suffix: "%" },
        { label: "Informal Employment", value: intelligence?.informal_employment_pct, suffix: "%" },
      ],
    },
    gdp: {
      title: "Economic Output",
      icon: Globe2,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/20",
      metrics: [
        { label: "GDP per Capita (PPP)", value: intelligence?.gdp_per_capita_ppp, prefix: "$", format: "number" },
        { label: "GDP Growth Rate", value: intelligence?.gdp_growth_rate, suffix: "%" },
        { label: "Industry % of GDP", value: intelligence?.industry_pct_gdp, suffix: "%" },
        { label: "Manufacturing % of GDP", value: intelligence?.manufacturing_pct_gdp, suffix: "%" },
        { label: "Services % of GDP", value: intelligence?.services_pct_gdp, suffix: "%" },
        { label: "Agriculture % of GDP", value: intelligence?.agriculture_pct_gdp, suffix: "%" },
      ],
    },
    population: {
      title: "Demographics",
      icon: Users,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      metrics: [
        { label: "Total Population", value: intelligence?.population_total, format: "number" },
        { label: "Working Age (15-64)", value: intelligence?.population_working_age, format: "number" },
        { label: "Urban Population", value: intelligence?.urban_population_pct, suffix: "%" },
        { label: "Median Age", value: intelligence?.median_age, suffix: " years" },
        { label: "Life Expectancy", value: intelligence?.life_expectancy_at_birth, suffix: " years" },
        { label: "Healthy Life Expectancy", value: intelligence?.healthy_life_expectancy, suffix: " years" },
      ],
    },
    unemployment: {
      title: "Employment Status",
      icon: TrendingUp,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
      metrics: [
        { label: "Unemployment Rate", value: intelligence?.unemployment_rate, suffix: "%" },
        { label: "Youth Unemployment", value: intelligence?.youth_unemployment_rate, suffix: "%" },
        { label: "Labor Force Participation", value: intelligence?.labor_force_participation, suffix: "%" },
        { label: "Informal Employment", value: intelligence?.informal_employment_pct, suffix: "%" },
      ],
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  const formatValue = (value: number | null | undefined, format?: string, prefix?: string, suffix?: string) => {
    if (value === null || value === undefined) return "No data";
    if (format === "number") {
      if (value >= 1_000_000_000) return `${prefix || ""}${(value / 1_000_000_000).toFixed(1)}B${suffix || ""}`;
      if (value >= 1_000_000) return `${prefix || ""}${(value / 1_000_000).toFixed(1)}M${suffix || ""}`;
      if (value >= 1_000) return `${prefix || ""}${(value / 1_000).toFixed(1)}K${suffix || ""}`;
      return `${prefix || ""}${value.toLocaleString()}${suffix || ""}`;
    }
    return `${prefix || ""}${value.toFixed(1)}${suffix || ""}`;
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal - Responsive sizing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-2 sm:inset-4 md:inset-6 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[600px] lg:max-h-[90vh] bg-slate-800 rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header - Compact */}
            <div className={cn("flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10", config.bgColor)}>
              <div className="flex items-center gap-2 sm:gap-3">
                <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", config.color)} />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{config.title}</h3>
                  <p className="text-[10px] sm:text-xs text-white/60">{country.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
              </button>
            </div>
            
            {/* Content - Two column layout on larger screens */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Left: Global Positioning */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Global Position</h4>
                    <span className="text-[9px] text-white/40 ml-auto">vs 195</span>
                  </div>
                  
                  {positioningMetrics.map((metric) => (
                    <RelativePositionBar
                      key={metric.key}
                      value={intelligence?.[metric.key] as number | null}
                      benchmarkKey={metric.benchmarkKey}
                      label={metric.label}
                      color={metric.color}
                    />
                  ))}
                </motion.div>
                
                {/* Right: Key Metrics Grid */}
                <div>
                  <h4 className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {config.metrics.slice(0, 4).map((metric, i) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-2 rounded-lg bg-white/5 border border-white/5"
                      >
                        <span className="text-[9px] sm:text-[10px] text-white/50 block truncate">{metric.label}</span>
                        <span className={cn("text-sm sm:text-base font-semibold block", metric.value !== null ? config.color : "text-white/30")}>
                          {formatValue(metric.value, metric.format, metric.prefix, metric.suffix)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Additional metrics if more than 4 */}
                  {config.metrics.length > 4 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {config.metrics.slice(4).map((metric, i) => (
                        <motion.div
                          key={metric.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (i + 4) * 0.05 }}
                          className="p-2 rounded-lg bg-white/5 border border-white/5"
                        >
                          <span className="text-[9px] sm:text-[10px] text-white/50 block truncate">{metric.label}</span>
                          <span className={cn("text-sm sm:text-base font-semibold block", metric.value !== null ? config.color : "text-white/30")}>
                            {formatValue(metric.value, metric.format, metric.prefix, metric.suffix)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Industry breakdown visual for GDP - Compact horizontal */}
              {type === "gdp" && intelligence && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <h4 className="text-xs font-semibold text-white mb-2">GDP Composition</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Services", value: intelligence.services_pct_gdp, color: "bg-cyan-500" },
                      { label: "Industry", value: intelligence.industry_pct_gdp, color: "bg-blue-500" },
                      { label: "Manufacturing", value: intelligence.manufacturing_pct_gdp, color: "bg-purple-500" },
                      { label: "Agriculture", value: intelligence.agriculture_pct_gdp, color: "bg-emerald-500" },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value || 0}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={cn("h-full rounded-full", item.color)}
                          />
                        </div>
                        <span className="text-[9px] text-white/50 block">{item.label}</span>
                        <span className="text-xs text-white/80 font-medium">{item.value?.toFixed(0) || "N/A"}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function EconomicQuadrant({ country, intelligence, onTileClick }: EconomicQuadrantProps) {
  const [selectedTile, setSelectedTile] = useState<"labor" | "gdp" | "population" | "unemployment" | null>(null);

  // Handle tile click - use onTileClick callback if provided, otherwise use internal modal
  const handleTileClick = (tile: "labor" | "gdp" | "population" | "unemployment") => {
    if (onTileClick) {
      // Map internal tile names to InsightCategory types
      const categoryMap: Record<string, "labor-force" | "gdp-per-capita" | "population" | "unemployment"> = {
        labor: "labor-force",
        gdp: "gdp-per-capita",
        population: "population",
        unemployment: "unemployment"
      };
      onTileClick(categoryMap[tile]);
    } else {
      setSelectedTile(tile);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Economic Overview
          </h3>
          <span className="text-[9px] text-white/30">vs Global</span>
        </div>
      </div>
      
      {/* Tiles Grid - Fixed height with no overflow */}
      <div className="flex-1 p-2 grid grid-cols-2 grid-rows-2 gap-2 min-h-0">
        <EconomicTile
          title="Labor Force"
          value={intelligence?.labor_force_participation ?? null}
          icon={Briefcase}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          suffix="%"
          decimals={1}
          onClick={() => handleTileClick("labor")}
          delay={0.1}
        />
        
        <EconomicTile
          title="GDP per Capita"
          value={intelligence?.gdp_per_capita_ppp ?? null}
          icon={Globe2}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
          prefix="$"
          onClick={() => handleTileClick("gdp")}
          delay={0.2}
        />
        
        <EconomicTile
          title="Population"
          value={intelligence?.population_total ?? null}
          icon={Users}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
          onClick={() => handleTileClick("population")}
          delay={0.3}
        />
        
        <EconomicTile
          title="Unemployment"
          value={intelligence?.unemployment_rate ?? null}
          icon={TrendingUp}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
          suffix="%"
          decimals={1}
          onClick={() => handleTileClick("unemployment")}
          delay={0.4}
        />
      </div>
      
      {/* Detail Modal - Only shown if onTileClick is not provided */}
      {!onTileClick && (
        <EconomicDetailModal
          isOpen={selectedTile !== null}
          onClose={() => setSelectedTile(null)}
          type={selectedTile || "labor"}
          country={country}
          intelligence={intelligence}
        />
      )}
    </div>
  );
}

export default EconomicQuadrant;
