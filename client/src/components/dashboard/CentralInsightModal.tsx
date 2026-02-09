/**
 * Central Insight Modal Component
 * 
 * Premium, centered modal with different layouts:
 * - Economic tiles: Charts and data comparison (no images)
 * - Country insights: Images with "[Country] [Topic]" + "OH Perspective" format
 * 
 * Features:
 * - Fetches AI-generated content from backend API
 * - Admin can regenerate content via AI
 * - Recharts visualizations for economic data
 * - Persistent data storage
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronLeft, ChevronRight, RefreshCw, Loader2,
  Briefcase, Globe2, Users, TrendingUp, Info,
  Crown, Shield, Eye, HeartPulse, Activity,
  Lightbulb, Building2, Factory, MapPin, UserCheck, Landmark,
  AlertTriangle, Heart, DollarSign, BarChart3, TrendingDown, Sparkles
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine
} from "recharts";
import { cn } from "../../lib/utils";
import { apiClient, aiApiClient } from "../../services/api";
import { CountryFlag } from "../CountryFlag";

// Define InsightCategory locally to avoid circular dependency with CountryDashboard
export type InsightCategory = 
  // Economic tiles
  | "labor-force" | "gdp-per-capita" | "population" | "unemployment"
  // Framework pillars
  | "governance" | "hazard-control" | "vigilance" | "restoration"
  // Country insights
  | "culture" | "oh-infrastructure" | "industry" 
  | "urban" | "workforce" | "political";

// Economic categories that show charts instead of images
const ECONOMIC_CATEGORIES: InsightCategory[] = ["labor-force", "gdp-per-capita", "population", "unemployment"];
const PILLAR_CATEGORIES: InsightCategory[] = ["governance", "hazard-control", "vigilance", "restoration"];
const COUNTRY_INSIGHT_CATEGORIES: InsightCategory[] = ["culture", "oh-infrastructure", "industry", "urban", "workforce", "political"];

// ============================================================================
// TYPES
// ============================================================================

interface CentralInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: InsightCategory | null;
  countryIso: string;
  countryName: string;
  flagUrl?: string | null;
  isAdmin: boolean;
  economicData?: {
    laborForce?: number | null;
    gdpPerCapita?: number | null;
    population?: number | null;
    unemploymentRate?: number | null;
    youthUnemployment?: number | null;
    informalEmployment?: number | null;
    gdpGrowth?: number | null;
    urbanPopulation?: number | null;
    medianAge?: number | null;
    lifeExpectancy?: number | null;
  };
  pillarScores?: {
    governance?: number | null;
    hazardControl?: number | null;
    vigilance?: number | null;
    restoration?: number | null;
  };
}

interface KeyStat {
  label: string;
  value: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
  icon: React.ElementType;
  color: string;
}

interface ApiKeyStatData {
  label: string;
  value: string;
  description?: string;
  source?: string;
  source_url?: string;
}

interface ApiInsightData {
  id: number;
  country_iso: string;
  category: string;
  images: { url: string; thumbnail_url?: string; alt: string; photographer?: string }[];
  what_is_analysis: string | null;
  oh_implications: string | null;
  key_stats?: ApiKeyStatData[];
  status: string;
  error_message?: string | null;
  generated_at?: string | null;
}

interface InsightData {
  images: { url: string; alt: string; photographer?: string }[];
  whatIsAnalysis: string;
  ohImplications: string;
  keyStats: KeyStat[];
  status: "pending" | "generating" | "completed" | "error";
  generatedAt?: string;
  isFromApi: boolean;
}

// ============================================================================
// GLOBAL BENCHMARKS (World Bank/ILO Data 2023)
// ============================================================================

interface GlobalBenchmark {
  min: number;
  max: number;
  avg: number;
  median: number;
  p25: number;
  p75: number;
  unit: string;
  higherIsBetter: boolean;
  label: string;
}

const GLOBAL_BENCHMARKS: Record<string, GlobalBenchmark> = {
  labor_force_participation: {
    min: 35, max: 88, avg: 60.3, median: 61, p25: 52, p75: 68,
    unit: "%", higherIsBetter: true, label: "Labor Force Participation"
  },
  gdp_per_capita_ppp: {
    min: 800, max: 140000, avg: 18500, median: 14200, p25: 5800, p75: 35000,
    unit: "$", higherIsBetter: true, label: "GDP per Capita (PPP)"
  },
  population_total: {
    min: 10000, max: 1400000000, avg: 40000000, median: 8500000, p25: 2000000, p75: 30000000,
    unit: "", higherIsBetter: false, label: "Population"
  },
  unemployment_rate: {
    min: 0.5, max: 35, avg: 6.8, median: 5.5, p25: 3.5, p75: 9,
    unit: "%", higherIsBetter: false, label: "Unemployment Rate"
  },
};

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

interface CategoryConfig {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  chartColor: string;
}

const CATEGORY_CONFIGS: Record<InsightCategory, CategoryConfig> = {
  "labor-force": {
    title: "Labor Force",
    icon: Briefcase,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    chartColor: "#34d399",
  },
  "gdp-per-capita": {
    title: "Economic Output",
    icon: Globe2,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    chartColor: "#22d3ee",
  },
  "population": {
    title: "Demographics",
    icon: Users,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    gradient: "from-purple-500/20 to-purple-600/5",
    chartColor: "#a78bfa",
  },
  "unemployment": {
    title: "Employment Status",
    icon: TrendingUp,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    gradient: "from-amber-500/20 to-amber-600/5",
    chartColor: "#fbbf24",
  },
  "governance": {
    title: "Governance",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    gradient: "from-purple-500/20 to-purple-600/5",
    chartColor: "#a78bfa",
  },
  "hazard-control": {
    title: "Hazard Control",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    gradient: "from-blue-500/20 to-blue-600/5",
    chartColor: "#60a5fa",
  },
  "vigilance": {
    title: "Vigilance",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-500/30",
    gradient: "from-teal-500/20 to-teal-600/5",
    chartColor: "#2dd4bf",
  },
  "restoration": {
    title: "Restoration",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    gradient: "from-amber-500/20 to-amber-600/5",
    chartColor: "#fbbf24",
  },
  "culture": {
    title: "Culture & Society",
    icon: Lightbulb,
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    borderColor: "border-rose-500/30",
    gradient: "from-rose-500/20 to-rose-600/5",
    chartColor: "#fb7185",
  },
  "oh-infrastructure": {
    title: "OH Infrastructure",
    icon: Building2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    gradient: "from-blue-500/20 to-blue-600/5",
    chartColor: "#60a5fa",
  },
  "industry": {
    title: "Industry & Economy",
    icon: Factory,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    chartColor: "#22d3ee",
  },
  "urban": {
    title: "Urban Development",
    icon: MapPin,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    borderColor: "border-indigo-500/30",
    gradient: "from-indigo-500/20 to-indigo-600/5",
    chartColor: "#818cf8",
  },
  "workforce": {
    title: "Workforce Demographics",
    icon: UserCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    chartColor: "#34d399",
  },
  "political": {
    title: "Political Capacity",
    icon: Landmark,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    borderColor: "border-violet-500/30",
    gradient: "from-violet-500/20 to-violet-600/5",
    chartColor: "#8b5cf6",
  },
};

// ============================================================================
// ECONOMIC DATA HELPERS
// ============================================================================

interface EconomicMetricConfig {
  key: string;
  benchmarkKey: string;
  label: string;
  format: (v: number) => string;
}

const ECONOMIC_METRIC_CONFIGS: Record<string, EconomicMetricConfig> = {
  "labor-force": {
    key: "laborForce",
    benchmarkKey: "labor_force_participation",
    label: "Labor Force Participation Rate",
    format: (v) => `${v.toFixed(1)}%`,
  },
  "gdp-per-capita": {
    key: "gdpPerCapita",
    benchmarkKey: "gdp_per_capita_ppp",
    label: "GDP per Capita (PPP)",
    format: (v) => `$${(v / 1000).toFixed(1)}K`,
  },
  "population": {
    key: "population",
    benchmarkKey: "population_total",
    label: "Total Population",
    format: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`,
  },
  "unemployment": {
    key: "unemploymentRate",
    benchmarkKey: "unemployment_rate",
    label: "Unemployment Rate",
    format: (v) => `${v.toFixed(1)}%`,
  },
};

function getPercentilePosition(value: number, benchmark: GlobalBenchmark): number {
  const { min, max, higherIsBetter } = benchmark;
  const clamped = Math.max(min, Math.min(max, value));
  const rawPercentile = ((clamped - min) / (max - min)) * 100;
  return higherIsBetter ? rawPercentile : (100 - rawPercentile);
}

function getPositionLabel(percentile: number): { label: string; color: string; bgColor: string } {
  if (percentile >= 75) return { label: "Top 25%", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
  if (percentile >= 50) return { label: "Above Average", color: "text-cyan-400", bgColor: "bg-cyan-500/20" };
  if (percentile >= 25) return { label: "Below Average", color: "text-amber-400", bgColor: "bg-amber-500/20" };
  return { label: "Bottom 25%", color: "text-red-400", bgColor: "bg-red-500/20" };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function KeyStatTile({ stat, index }: { stat: KeyStat; index: number }) {
  const Icon = stat.icon;
  
  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stat.sourceUrl) {
      window.open(stat.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      className="group bg-white/5 rounded-lg p-2.5 sm:p-3 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all cursor-default"
      title={stat.description || stat.label}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
        <Icon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0", stat.color)} />
        <span className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider truncate">{stat.label}</span>
      </div>
      <p className={cn("text-sm sm:text-base lg:text-lg font-bold truncate", stat.color)}>{stat.value}</p>
      {stat.description && (
        <p className="text-[9px] sm:text-[10px] text-white/40 mt-0.5 line-clamp-2 hidden sm:block">{stat.description}</p>
      )}
      {/* Source Attribution */}
      {stat.source && (
        <button
          onClick={handleSourceClick}
          className={cn(
            "text-[8px] sm:text-[9px] mt-1 flex items-center gap-1 transition-colors",
            stat.sourceUrl 
              ? "text-white/30 hover:text-cyan-400 cursor-pointer" 
              : "text-white/25 cursor-default"
          )}
          title={stat.sourceUrl ? `View source: ${stat.source}` : stat.source}
        >
          <Info className="w-2.5 h-2.5" />
          <span className="truncate">{stat.source}</span>
        </button>
      )}
    </motion.div>
  );
}

function ImageSlideshow({ images, category }: { images: { url: string; alt: string; photographer?: string }[]; category: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center">
        <Info className="w-8 h-8 text-white/20" />
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {imageError[currentIndex] ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <Info className="w-8 h-8 text-white/30" />
            </div>
          ) : (
            <>
              <img
                src={currentImage.url}
                alt={currentImage.alt}
                className="w-full h-full object-cover"
                onError={() => setImageError(prev => ({ ...prev, [currentIndex]: true }))}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn("h-1.5 rounded-full transition-all", i === currentIndex ? "bg-white w-4" : "bg-white/40 w-1.5")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// COUNTRY INSIGHT CONTENT - Premium Tabbed Layout with Enhanced Animations
// ============================================================================

interface CountryInsightContentProps {
  insightData: InsightData;
  config: CategoryConfig;
  countryName: string;
  Icon: React.ElementType;
}

function CountryInsightContent({ insightData, config, countryName, Icon }: CountryInsightContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'implications'>('overview');
  
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Info },
    { id: 'implications' as const, label: 'OH Implications', icon: HeartPulse },
  ];

  // Split content into paragraphs for staggered animation
  const overviewParagraphs = (insightData.whatIsAnalysis || "").split("\n\n").filter(p => p.trim());
  const implicationsParagraphs = (insightData.ohImplications || "").split("\n\n").filter(p => p.trim());

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const paragraphVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    },
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4 sm:p-5 overflow-hidden">
      {/* Left side: Image only (no stats) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: -30 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="lg:w-[30%] lg:max-w-[220px] flex-shrink-0"
      >
        {(insightData.images?.length ?? 0) > 0 ? (
          <motion.div 
            className="h-44 sm:h-52 lg:h-full lg:max-h-[400px] rounded-xl overflow-hidden relative"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <ImageSlideshow images={insightData.images} category={config.title} />
            {/* Decorative corner accent */}
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className={cn("absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center", config.bgColor, "backdrop-blur-sm")}
            >
              <Icon className={cn("w-4 h-4", config.color)} />
            </motion.div>
          </motion.div>
        ) : (
          <div className="h-44 sm:h-52 lg:h-full lg:max-h-[400px] bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="text-center"
            >
              <Icon className={cn("w-12 h-12 mx-auto mb-2", config.color)} />
              <p className="text-sm text-white/40">{config.title}</p>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Right side: Tabbed content */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4 relative flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors z-10",
                activeTab === tab.id ? "text-white" : "text-white/50 hover:text-white/70"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className={cn("absolute inset-0 rounded-lg", config.bgColor.replace("/20", "/30"))}
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {/* Section Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-5"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                    className={cn("w-1.5 h-8 rounded-full", config.bgColor.replace("/20", ""))}
                  />
                  <div>
                    <h3 className={cn("text-lg font-semibold", config.color)}>
                      What is {countryName}'s {config.title}?
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">Country-specific analysis</p>
                  </div>
                </motion.div>

                {/* Staggered Paragraphs */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {overviewParagraphs.map((paragraph, i) => (
                    <motion.p
                      key={i}
                      variants={paragraphVariants}
                      className="text-[15px] text-white/85 leading-relaxed text-justify"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="implications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {/* Section Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-5"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                    className="w-1.5 h-8 rounded-full bg-cyan-500"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-400">
                      Occupational Health Perspective
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">Impact on worker safety and health</p>
                  </div>
                </motion.div>

                {/* Staggered Paragraphs */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  {implicationsParagraphs.map((paragraph, i) => (
                    <motion.p
                      key={i}
                      variants={paragraphVariants}
                      className="text-[15px] text-white/85 leading-relaxed text-justify"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with generation info */}
        {insightData.generatedAt && insightData.isFromApi && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-3 mt-3 border-t border-white/10 text-[10px] sm:text-xs text-white/40 flex items-center gap-2"
          >
            <Sparkles className="w-3 h-3" />
            AI-generated: {new Date(insightData.generatedAt).toLocaleDateString()}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function EconomicComparisonChart({ 
  countryValue, 
  countryName,
  benchmark,
  config 
}: { 
  countryValue: number; 
  countryName: string;
  benchmark: GlobalBenchmark;
  config: CategoryConfig;
}) {
  const chartData = [
    { name: "Bottom 25%", value: benchmark.p25, fill: "#ef4444" },
    { name: "Global Avg", value: benchmark.avg, fill: "#64748b" },
    { name: countryName, value: countryValue, fill: config.chartColor },
    { name: "Top 25%", value: benchmark.p75, fill: "#22c55e" },
  ].sort((a, b) => a.value - b.value);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={80} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: number) => [benchmark.unit === "$" ? `$${value.toLocaleString()}` : `${value}${benchmark.unit}`, ""]}
          />
          <ReferenceLine x={benchmark.avg} stroke="#64748b" strokeDasharray="3 3" />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PositionIndicator({ percentile, benchmark, value, config }: {
  percentile: number;
  benchmark: GlobalBenchmark;
  value: number;
  config: CategoryConfig;
}) {
  const position = getPositionLabel(percentile);
  const diff = value - benchmark.avg;
  const isAbove = diff > 0;

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">Global Position</span>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", position.bgColor, position.color)}>
          {position.label}
        </span>
      </div>
      
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-3">
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10" style={{ left: `${50}%` }} />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentile}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", config.bgColor.replace("/20", ""))}
        />
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `${percentile}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-white/40 uppercase">Value</p>
          <p className={cn("text-sm font-bold", config.color)}>
            {benchmark.unit === "$" ? `$${(value/1000).toFixed(1)}K` : `${value.toFixed(1)}${benchmark.unit}`}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase">vs Avg</p>
          <p className={cn("text-sm font-bold flex items-center justify-center gap-1", isAbove ? "text-emerald-400" : "text-amber-400")}>
            {isAbove ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isAbove ? "+" : ""}{diff.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase">Percentile</p>
          <p className="text-sm font-bold text-white">{percentile.toFixed(0)}th</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CentralInsightModal({
  isOpen,
  onClose,
  category,
  countryIso,
  countryName,
  flagUrl,
  isAdmin,
  economicData,
  pillarScores,
}: CentralInsightModalProps) {
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEconomicCategory = category ? ECONOMIC_CATEGORIES.includes(category) : false;
  const isPillarCategory = category ? PILLAR_CATEGORIES.includes(category) : false;
  const isCountryInsightCategory = category ? COUNTRY_INSIGHT_CATEGORIES.includes(category) : false;

  const economicMetricConfig = useMemo(() => {
    if (!category || !isEconomicCategory) return null;
    return ECONOMIC_METRIC_CONFIGS[category];
  }, [category, isEconomicCategory]);

  const economicMetricData = useMemo(() => {
    if (!economicMetricConfig || !economicData) return null;
    const value = economicData[economicMetricConfig.key as keyof typeof economicData] as number | null;
    const benchmark = GLOBAL_BENCHMARKS[economicMetricConfig.benchmarkKey];
    if (value === null || value === undefined || !benchmark) return null;
    const percentile = getPercentilePosition(value, benchmark);
    return { value, benchmark, percentile };
  }, [economicMetricConfig, economicData]);

  // Get pillar score for pillar categories
  const pillarScore = useMemo(() => {
    if (!isPillarCategory || !pillarScores || !category) return null;
    const scoreMap: Record<string, number | null | undefined> = {
      "governance": pillarScores.governance,
      "hazard-control": pillarScores.hazardControl,
      "vigilance": pillarScores.vigilance,
      "restoration": pillarScores.restoration,
    };
    return scoreMap[category] ?? null;
  }, [isPillarCategory, pillarScores, category]);

  // Fetch insight data from API
  const fetchInsightFromApi = useCallback(async () => {
    if (!category || !countryIso) return null;
    
    try {
      const response = await apiClient.get<ApiInsightData | null>(
        `/api/v1/insights/${countryIso}/${category}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch insight from API:", error);
      return null;
    }
  }, [category, countryIso]);

  // Convert API response to InsightData
  const convertApiToInsightData = (apiData: ApiInsightData): InsightData => {
    const config = category ? CATEGORY_CONFIGS[category] : null;
    
    // Use API key_stats if available, otherwise extract from text
    let keyStats: KeyStat[];
    if (apiData.key_stats && apiData.key_stats.length > 0) {
      // Map API stats to KeyStat format with alternating colors and icons
      const icons = [Activity, DollarSign, Users, TrendingUp, Building2, HeartPulse];
      const colors = ["text-cyan-400", "text-emerald-400", "text-purple-400", "text-amber-400", "text-rose-400", "text-blue-400"];
      keyStats = apiData.key_stats.slice(0, 6).map((stat, i) => ({
        label: stat.label,
        value: stat.value,
        description: stat.description,
        source: stat.source,
        sourceUrl: stat.source_url,
        icon: icons[i % icons.length],
        color: colors[i % colors.length],
      }));
    } else {
      keyStats = extractKeyStats(apiData.what_is_analysis || "", config);
    }
    
    return {
      images: apiData.images?.map(img => ({
        url: img.url,
        alt: img.alt || `${category} image`,
        photographer: img.photographer,
      })) || [],
      whatIsAnalysis: apiData.what_is_analysis || "",
      ohImplications: apiData.oh_implications || "",
      keyStats,
      status: apiData.status as InsightData["status"],
      generatedAt: apiData.generated_at || undefined,
      isFromApi: true,
    };
  };

  // Extract key stats from analysis text (fallback when no structured stats)
  const extractKeyStats = (text: string, config: CategoryConfig | null): KeyStat[] => {
    const stats: KeyStat[] = [];
    const color = config?.color || "text-cyan-400";
    
    // Try to extract numbers and percentages
    const percentMatches = text.match(/(\d+(?:\.\d+)?)\s*%/g);
    const moneyMatches = text.match(/\$[\d,]+(?:\.\d+)?\s*(?:billion|million|B|M|K)?/gi);
    const numberMatches = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:million|billion|workers|employees|people)/gi);
    
    if (percentMatches && percentMatches.length > 0) {
      stats.push({ label: "Key Rate", value: percentMatches[0], icon: Activity, color });
    }
    if (moneyMatches && moneyMatches.length > 0) {
      stats.push({ label: "Economic Value", value: moneyMatches[0], icon: DollarSign, color: "text-emerald-400" });
    }
    if (numberMatches && numberMatches.length > 0) {
      const num = numberMatches[0].replace(/[^\d.,]/g, "");
      stats.push({ label: "Workforce", value: num, icon: Users, color: "text-purple-400" });
    }
    
    // Always add some default stats if we don't have enough
    if (stats.length < 2) {
      stats.push({ label: "Analysis", value: "AI-Generated", icon: Sparkles, color: "text-cyan-400" });
    }
    
    return stats.slice(0, 6);
  };

  // Load data when modal opens
  useEffect(() => {
    if (!category || !isOpen) return;
    
    setIsLoading(true);
    
    const loadData = async () => {
      // Try to fetch from API first
      const apiData = await fetchInsightFromApi();
      
      if (apiData && apiData.what_is_analysis) {
        // Use API data
        setInsightData(convertApiToInsightData(apiData));
      } else {
        // No API data available - show placeholder
        // Content will be auto-generated when admin visits the country page
        setInsightData({
          images: [],
          whatIsAnalysis: `AI-generated analysis for ${countryName}'s ${CATEGORY_CONFIGS[category]?.title || category} is being prepared.\n\n${isAdmin ? 'Content will be automatically generated. Use "Regenerate All" in the header to refresh all insights.' : 'Please wait while content is generated, or contact an administrator.'}`,
          ohImplications: isAdmin ? "AI analysis will appear here once generation completes. Check back shortly." : "This content will be available shortly.",
          keyStats: [],
          status: "pending",
          isFromApi: false,
        });
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [category, countryIso, countryName, isOpen, isAdmin, fetchInsightFromApi]);

  // NOTE: Individual regenerate removed - regeneration now happens via "Regenerate All" on CountryDashboard
  // The modal just displays cached content

  if (!category) return null;

  const config = CATEGORY_CONFIGS[category];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with animated blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />

          {/* Modal with enhanced spring animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 60, rotateX: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300, 
              mass: 0.8,
              opacity: { duration: 0.2 }
            }}
            style={{ perspective: 1000 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Animated glow effect */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={cn("absolute top-0 left-0 right-0 h-40 bg-gradient-to-b pointer-events-none", config.gradient)} 
            />
            
            {/* Decorative corner accents */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.3, x: 0 }}
              transition={{ delay: 0.3 }}
              className={cn("absolute top-0 left-0 w-32 h-32 bg-gradient-to-br rounded-br-full opacity-20 pointer-events-none", config.gradient)}
            />

            {/* Header with staggered animations */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative flex items-center justify-between px-5 py-4 border-b border-white/10"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  className={cn("p-2.5 rounded-xl", config.bgColor, config.borderColor, "border")}
                >
                  <Icon className={cn("w-5 h-5", config.color)} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                >
                  {isCountryInsightCategory ? (
                    <>
                      <h2 className="text-lg font-bold text-white">{countryName} {config.title}</h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="text-xs text-cyan-400 font-medium"
                      >
                        Occupational Health Perspective
                      </motion.p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold text-white">{config.title}</h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="text-xs text-white/50"
                      >
                        {countryName} • Global Comparison
                      </motion.p>
                    </>
                  )}
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                className="flex items-center gap-2"
              >
                <motion.button 
                  onClick={onClose} 
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Content */}
            <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-white/50">Loading...</p>
                  </div>
                </div>
              ) : isEconomicCategory && economicMetricData ? (
                // ECONOMIC CATEGORY LAYOUT
                <div className="h-full p-5 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      {/* Country Flag Display */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <CountryFlag 
                            isoCode={countryIso} 
                            flagUrl={flagUrl || undefined} 
                            size="lg" 
                            className="rounded-md shadow-lg"
                          />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">{countryName}</h4>
                          <p className="text-xs text-white/50">{config.title} Analysis</p>
                        </div>
                      </div>
                      
                      <PositionIndicator
                        percentile={economicMetricData.percentile}
                        benchmark={economicMetricData.benchmark}
                        value={economicMetricData.value}
                        config={config}
                      />
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-cyan-400" />
                          Global Comparison
                        </h4>
                        <EconomicComparisonChart
                          countryValue={economicMetricData.value}
                          countryName={countryName}
                          benchmark={economicMetricData.benchmark}
                          config={config}
                        />
                      </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-3">Key Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/60">{economicMetricConfig?.label}</span>
                            <span className={cn("text-sm font-bold", config.color)}>
                              {economicMetricConfig?.format(economicMetricData.value)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/60">Global Average</span>
                            <span className="text-sm text-white/70">
                              {economicMetricConfig?.format(economicMetricData.benchmark.avg)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-white/60">Global Median</span>
                            <span className="text-sm text-white/70">
                              {economicMetricConfig?.format(economicMetricData.benchmark.median)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                          <HeartPulse className="w-4 h-4" />
                          OH Implications
                        </h4>
                        <p className="text-[13px] text-white/70 leading-relaxed">
                          {category === "labor-force" && `With a labor force participation rate of ${economicMetricData.value.toFixed(1)}%, ${countryName} has ${economicMetricData.percentile >= 50 ? 'above average' : 'below average'} workforce engagement. This affects the scale of occupational health coverage requirements and the formal vs informal employment balance.`}
                          {category === "gdp-per-capita" && `At $${(economicMetricData.value/1000).toFixed(1)}K GDP per capita, ${countryName}'s economic capacity influences OH program funding, workplace safety investments, and workers' compensation systems. ${economicMetricData.percentile >= 50 ? 'Higher' : 'Lower'} economic output typically correlates with more developed OH infrastructure.`}
                          {category === "population" && `With a population of ${(economicMetricData.value/1000000).toFixed(1)}M, ${countryName} requires OH systems scaled to serve this workforce. Larger populations present challenges in achieving universal coverage and require decentralized service delivery networks.`}
                          {category === "unemployment" && `An unemployment rate of ${economicMetricData.value.toFixed(1)}% in ${countryName} affects OH priorities. ${economicMetricData.value > 8 ? 'Higher unemployment may increase informal work and reduce workers\' bargaining power for safety conditions.' : 'Lower unemployment typically correlates with better working conditions as employers compete for workers.'}`}
                        </p>
                      </div>

                      <div className="text-[10px] text-white/30 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Source: World Bank, ILO (2023 data)
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : isPillarCategory ? (
                // FRAMEWORK PILLAR LAYOUT - Score-based with AI analysis
                <div className="h-full p-5 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: Score and Position */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      {/* Score Display */}
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10 text-center">
                        <div className="relative inline-flex items-center justify-center mb-3">
                          <svg className="w-28 h-28 -rotate-90">
                            <circle
                              cx="56"
                              cy="56"
                              r="48"
                              fill="none"
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth="8"
                            />
                            <motion.circle
                              cx="56"
                              cy="56"
                              r="48"
                              fill="none"
                              stroke={config.chartColor}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${((pillarScore ?? 0) / 100) * 301.59} 301.59`}
                              initial={{ strokeDasharray: "0 301.59" }}
                              animate={{ strokeDasharray: `${((pillarScore ?? 0) / 100) * 301.59} 301.59` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={cn("text-3xl font-bold", config.color)}>{pillarScore ?? "N/A"}</span>
                          </div>
                        </div>
                        <p className="text-sm text-white/60">{config.title} Score</p>
                        <p className={cn("text-xs font-medium mt-1", 
                          (pillarScore ?? 0) >= 70 ? "text-emerald-400" :
                          (pillarScore ?? 0) >= 50 ? "text-amber-400" : "text-red-400"
                        )}>
                          {(pillarScore ?? 0) >= 70 ? "Strong Performance" :
                           (pillarScore ?? 0) >= 50 ? "Developing" : "Needs Attention"}
                        </p>
                      </div>

                      {/* Position Comparison */}
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-cyan-400" />
                          Global Position
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/60">Score</span>
                              <span className={config.color}>{pillarScore ?? 0}/100</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pillarScore ?? 0}%` }}
                                transition={{ duration: 0.8 }}
                                className={cn("h-full rounded-full", config.bgColor.replace("/20", ""))}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-white/50">
                            <span>Global Average: ~48</span>
                            <span>Top Performers: 85+</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Right: AI Analysis */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className={cn("text-sm font-medium mb-3 flex items-center gap-2", config.color)}>
                          <Icon className="w-4 h-4" />
                          What is {config.title}?
                        </h4>
                        <p className="text-[13px] text-white/70 leading-relaxed">
                          {category === "governance" && `Governance measures ${countryName}'s legal framework, institutional architecture, and strategic capacity for occupational health. This includes ILO convention ratification, dedicated OH legislation, regulatory bodies, and national OH strategies.`}
                          {category === "hazard-control" && `Hazard Control assesses ${countryName}'s systems for workplace risk prevention. This includes exposure standards, risk assessment requirements, safety management systems, and industry-specific regulations for high-risk sectors.`}
                          {category === "vigilance" && `Vigilance evaluates ${countryName}'s capacity for occupational disease surveillance and detection. This covers reporting systems, occupational health registries, monitoring programs, and data quality for policy decisions.`}
                          {category === "restoration" && `Restoration measures ${countryName}'s workers' compensation and rehabilitation systems. This includes injury compensation coverage, benefit adequacy, return-to-work programs, and rehabilitation service accessibility.`}
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                          <HeartPulse className="w-4 h-4" />
                          OH Implications
                        </h4>
                        <p className="text-[13px] text-white/70 leading-relaxed">
                          {category === "governance" && `With a score of ${pillarScore ?? "N/A"}, ${countryName}'s governance framework ${(pillarScore ?? 0) >= 50 ? 'provides a foundation for' : 'faces challenges in'} comprehensive OH policy implementation. ${(pillarScore ?? 0) >= 70 ? 'Strong legal frameworks support worker protection.' : 'Strengthening institutions and legislation could improve outcomes.'}`}
                          {category === "hazard-control" && `A score of ${pillarScore ?? "N/A"} indicates ${(pillarScore ?? 0) >= 50 ? 'developing' : 'limited'} hazard control capabilities. ${(pillarScore ?? 0) >= 70 ? 'Robust exposure standards help prevent occupational diseases.' : 'Enhanced risk assessment and control measures would benefit worker safety.'}`}
                          {category === "vigilance" && `${countryName}'s vigilance score of ${pillarScore ?? "N/A"} reflects ${(pillarScore ?? 0) >= 50 ? 'functional' : 'emerging'} disease surveillance capacity. ${(pillarScore ?? 0) >= 70 ? 'Comprehensive monitoring enables evidence-based policy.' : 'Improved data collection would strengthen preventive interventions.'}`}
                          {category === "restoration" && `With ${pillarScore ?? "N/A"} in restoration, ${countryName} ${(pillarScore ?? 0) >= 50 ? 'has established' : 'is developing'} compensation and rehabilitation systems. ${(pillarScore ?? 0) >= 70 ? 'Workers benefit from comprehensive injury support.' : 'Expanding coverage and benefits would improve worker protection.'}`}
                        </p>
                      </div>

                    </motion.div>
                  </div>
                </div>
              ) : isCountryInsightCategory && insightData ? (
                // COUNTRY INSIGHT LAYOUT - Premium tabbed design with enhanced animations
                <CountryInsightContent
                  insightData={insightData}
                  config={config}
                  countryName={countryName}
                  Icon={Icon}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40">No data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CentralInsightModal;
