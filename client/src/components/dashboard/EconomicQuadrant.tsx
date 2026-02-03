/**
 * Economic Quadrant Component
 * 
 * Displays 4 animated tiles with key economic indicators:
 * - Labor Force
 * - GDP per Capita
 * - Population
 * - Unemployment Rate
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Globe2, TrendingUp, Briefcase, X, Building2, Factory, Wheat, ShoppingBag } from "lucide-react";
import { cn } from "../../lib/utils";
import type { CountryIntelligence } from "../../pages/CountryDashboard";

interface EconomicQuadrantProps {
  country: {
    iso_code: string;
    name: string;
  };
  intelligence: CountryIntelligence | null;
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
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border transition-all overflow-hidden group",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "border-white/10 hover:border-white/20",
        "text-left"
      )}
    >
      {/* Background glow on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        bgColor
      )} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2 rounded-lg", bgColor)}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 15 }}
            className="text-white/20"
          >
            <TrendingUp className="w-4 h-4" />
          </motion.div>
        </div>
        
        <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">{title}</p>
        
        {value !== null ? (
          <p className={cn("text-2xl font-bold", color)}>
            <AnimatedCounter
              value={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
            />
          </p>
        ) : (
          <p className="text-lg text-white/30">No data</p>
        )}
      </div>
      
      {/* Click indicator */}
      <div className="absolute bottom-2 right-2 text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
        Click for details
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

function EconomicDetailModal({ isOpen, onClose, type, country, intelligence }: EconomicDetailModalProps) {
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

  const industryIcons = {
    Industry: Factory,
    Manufacturing: Building2,
    Services: ShoppingBag,
    Agriculture: Wheat,
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
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-slate-800 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className={cn("flex items-center justify-between px-6 py-4 border-b border-white/10", config.bgColor)}>
              <div className="flex items-center gap-3">
                <Icon className={cn("w-6 h-6", config.color)} />
                <div>
                  <h3 className="text-lg font-bold text-white">{config.title}</h3>
                  <p className="text-xs text-white/60">{country.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {config.metrics.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                  >
                    <span className="text-sm text-white/70">{metric.label}</span>
                    <span className={cn("text-lg font-semibold", metric.value !== null ? config.color : "text-white/30")}>
                      {formatValue(metric.value, metric.format, metric.prefix, metric.suffix)}
                    </span>
                  </motion.div>
                ))}
              </div>
              
              {/* Industry breakdown visual for GDP */}
              {type === "gdp" && intelligence && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-4">GDP Composition</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Services", value: intelligence.services_pct_gdp, color: "bg-cyan-500" },
                      { label: "Industry", value: intelligence.industry_pct_gdp, color: "bg-blue-500" },
                      { label: "Manufacturing", value: intelligence.manufacturing_pct_gdp, color: "bg-purple-500" },
                      { label: "Agriculture", value: intelligence.agriculture_pct_gdp, color: "bg-emerald-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-white/60">{item.label}</span>
                          <span className="text-white/80">{item.value?.toFixed(1) || "N/A"}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value || 0}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={cn("h-full rounded-full", item.color)}
                          />
                        </div>
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

export function EconomicQuadrant({ country, intelligence }: EconomicQuadrantProps) {
  const [selectedTile, setSelectedTile] = useState<"labor" | "gdp" | "population" | "unemployment" | null>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          Economic Overview
        </h3>
        <p className="text-xs text-white/40 mt-0.5">Click any tile for details</p>
      </div>
      
      {/* Tiles Grid */}
      <div className="flex-1 p-3 grid grid-cols-2 gap-3">
        <EconomicTile
          title="Labor Force"
          value={intelligence?.labor_force_participation ?? null}
          icon={Briefcase}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
          suffix="%"
          decimals={1}
          onClick={() => setSelectedTile("labor")}
          delay={0.1}
        />
        
        <EconomicTile
          title="GDP per Capita"
          value={intelligence?.gdp_per_capita_ppp ?? null}
          icon={Globe2}
          color="text-cyan-400"
          bgColor="bg-cyan-500/10"
          prefix="$"
          onClick={() => setSelectedTile("gdp")}
          delay={0.2}
        />
        
        <EconomicTile
          title="Population"
          value={intelligence?.population_total ?? null}
          icon={Users}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
          onClick={() => setSelectedTile("population")}
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
          onClick={() => setSelectedTile("unemployment")}
          delay={0.4}
        />
      </div>
      
      {/* Detail Modal */}
      <EconomicDetailModal
        isOpen={selectedTile !== null}
        onClose={() => setSelectedTile(null)}
        type={selectedTile || "labor"}
        country={country}
        intelligence={intelligence}
      />
    </div>
  );
}

export default EconomicQuadrant;
