/**
 * Central Insight Modal Component
 * 
 * Premium, centered modal with different layouts:
 * - Economic tiles: Charts and data comparison (no images)
 * - Country insights: Images with "[Country] [Topic]" + "OH Perspective" format
 * 
 * Features:
 * - Framer Motion animations throughout
 * - Recharts visualizations for economic data
 * - Admin-only regenerate button
 * - Persistent data via backend API
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronLeft, ChevronRight, RefreshCw, Loader2,
  Briefcase, Globe2, Users, TrendingUp, Info,
  Crown, Shield, Eye, HeartPulse, Activity,
  Lightbulb, Building2, Factory, MapPin, UserCheck, Landmark,
  AlertTriangle, Heart, DollarSign, BarChart3, TrendingDown, Minus
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine
} from "recharts";
import { cn } from "../../lib/utils";

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
  isAdmin: boolean;
  onRegenerate?: () => void;
  // Economic data from parent
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
}

interface KeyStat {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface InsightData {
  images: { url: string; alt: string }[];
  whatIsAnalysis: string;
  ohImplications: string;
  keyStats: KeyStat[];
  status: "pending" | "generating" | "completed" | "error";
  generatedAt?: string;
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
  youth_unemployment_rate: {
    min: 1, max: 65, avg: 15.5, median: 13, p25: 8, p75: 22,
    unit: "%", higherIsBetter: false, label: "Youth Unemployment"
  },
  informal_employment_pct: {
    min: 2, max: 95, avg: 45, median: 42, p25: 18, p75: 70,
    unit: "%", higherIsBetter: false, label: "Informal Employment"
  },
  gdp_growth_rate: {
    min: -15, max: 25, avg: 3.2, median: 3, p25: 1.5, p75: 5,
    unit: "%", higherIsBetter: true, label: "GDP Growth"
  },
  urban_population_pct: {
    min: 12, max: 100, avg: 56, median: 58, p25: 38, p75: 78,
    unit: "%", higherIsBetter: false, label: "Urban Population"
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
  relatedMetrics: { key: string; benchmarkKey: string; label: string }[];
}

const ECONOMIC_METRIC_CONFIGS: Record<string, EconomicMetricConfig> = {
  "labor-force": {
    key: "laborForce",
    benchmarkKey: "labor_force_participation",
    label: "Labor Force Participation Rate",
    format: (v) => `${v.toFixed(1)}%`,
    relatedMetrics: [
      { key: "informalEmployment", benchmarkKey: "informal_employment_pct", label: "Informal Employment" },
      { key: "urbanPopulation", benchmarkKey: "urban_population_pct", label: "Urban Population" },
    ],
  },
  "gdp-per-capita": {
    key: "gdpPerCapita",
    benchmarkKey: "gdp_per_capita_ppp",
    label: "GDP per Capita (PPP)",
    format: (v) => `$${(v / 1000).toFixed(1)}K`,
    relatedMetrics: [
      { key: "gdpGrowth", benchmarkKey: "gdp_growth_rate", label: "GDP Growth Rate" },
    ],
  },
  "population": {
    key: "population",
    benchmarkKey: "population_total",
    label: "Total Population",
    format: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`,
    relatedMetrics: [
      { key: "medianAge", benchmarkKey: "median_age", label: "Median Age" },
      { key: "urbanPopulation", benchmarkKey: "urban_population_pct", label: "Urban Population %" },
    ],
  },
  "unemployment": {
    key: "unemploymentRate",
    benchmarkKey: "unemployment_rate",
    label: "Unemployment Rate",
    format: (v) => `${v.toFixed(1)}%`,
    relatedMetrics: [
      { key: "youthUnemployment", benchmarkKey: "youth_unemployment_rate", label: "Youth Unemployment" },
      { key: "informalEmployment", benchmarkKey: "informal_employment_pct", label: "Informal Employment" },
    ],
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
// COUNTRY INSIGHT IMAGES (Curated per country/category)
// ============================================================================

const COUNTRY_IMAGES: Record<string, Record<string, string[]>> = {
  IRN: {
    culture: [
      "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&q=80", // Iranian architecture
      "https://images.unsplash.com/photo-1576834252613-8bd91e19c3c7?w=600&q=80", // Persian culture
    ],
    "oh-infrastructure": [
      "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&q=80", // Hospital
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80", // Medical facility
    ],
    industry: [
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&q=80", // Oil refinery
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", // Construction
    ],
    urban: [
      "https://images.unsplash.com/photo-1562594980-47ab4adfa6d1?w=600&q=80", // Tehran
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80", // Iranian city
    ],
    workforce: [
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80", // Workers
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&q=80", // Office
    ],
    political: [
      "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&q=80", // Government
      "https://images.unsplash.com/photo-1575540325855-4b5c1ad86a7a?w=600&q=80", // Parliament
    ],
  },
  SAU: {
    culture: [
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&q=80", // Saudi culture
      "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=600&q=80", // Mecca
    ],
    "oh-infrastructure": [
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80", // Hospital
      "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80", // Medical center
    ],
    industry: [
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&q=80", // Oil refinery
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", // Construction
    ],
    urban: [
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=600&q=80", // Riyadh
      "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=600&q=80", // Saudi city
    ],
    workforce: [
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80", // Workers
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&q=80", // Office
    ],
    political: [
      "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&q=80", // Government
      "https://images.unsplash.com/photo-1575540325855-4b5c1ad86a7a?w=600&q=80", // Official building
    ],
  },
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  culture: ["https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=600&q=80"],
  "oh-infrastructure": ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80"],
  industry: ["https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80"],
  urban: ["https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80"],
  workforce: ["https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80"],
  political: ["https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&q=80"],
};

function getCountryImages(countryIso: string, category: string): string[] {
  const countryData = COUNTRY_IMAGES[countryIso];
  if (countryData?.[category]) return countryData[category];
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.culture;
}

// ============================================================================
// COUNTRY INSIGHT CONTENT
// ============================================================================

function getCountryInsightContent(
  category: InsightCategory,
  countryIso: string,
  countryName: string
): { whatIs: string; ohMeaning: string; keyStats: KeyStat[] } {
  // Default content - would be replaced by AI-generated content from backend
  const defaultContent: Record<string, { whatIs: string; ohMeaning: string; keyStats: KeyStat[] }> = {
    industry: {
      whatIs: `${countryName}'s industrial composition reflects its economic development stage and resource endowments. The primary sectors include manufacturing, construction, extractive industries, and services. Each sector presents distinct employment patterns and economic contributions.

Industrial activity is concentrated in major urban centers and specialized economic zones. The manufacturing sector includes both traditional industries and emerging high-tech sectors. Construction activity supports ongoing infrastructure development and urbanization.

The extractive sector (mining, oil & gas where applicable) often represents a significant portion of GDP and export revenues. These industries typically employ specialized workforces with specific skill requirements and occupational health considerations.

The service sector has grown substantially, now employing a significant portion of the workforce in retail, hospitality, finance, and professional services.`,
      ohMeaning: `The industrial composition of ${countryName} directly determines occupational health priorities and resource allocation. High-risk sectors including construction, manufacturing, and extractive industries present elevated injury and illness rates requiring targeted interventions.

Construction workers face multiple hazards including falls, struck-by incidents, and musculoskeletal disorders. The sector typically records the highest fatality rates across most economies, requiring robust safety management systems.

Manufacturing environments present machinery hazards, chemical exposures, and ergonomic risks. Process industries require comprehensive hazard communication and engineering controls. Repetitive motion injuries are common in assembly operations.

Service sector growth introduces different hazard profiles including ergonomic issues from sedentary work, psychosocial stressors, and customer interaction risks. The transition from industrial to service employment shifts OH priorities toward mental health and wellness programs.`,
      keyStats: [
        { label: "High-Risk Sectors", value: "3+", icon: AlertTriangle, color: "text-red-400" },
        { label: "Key Industry", value: "Variable", icon: Factory, color: "text-cyan-400" },
        { label: "Growth Trend", value: "Positive", icon: TrendingUp, color: "text-emerald-400" },
        { label: "OH Priority", value: "High", icon: Shield, color: "text-blue-400" },
      ],
    },
    culture: {
      whatIs: `${countryName}'s cultural landscape shapes workplace norms, safety attitudes, and health-seeking behaviors. Social structures, family values, and religious practices influence how workers perceive and respond to occupational health programs.

Workplace hierarchy and communication styles affect safety reporting and participation in health initiatives. Power distance influences whether workers feel comfortable raising safety concerns with supervisors.

Community networks and family support systems can complement formal occupational health services. Traditional practices may coexist with modern medical approaches, requiring culturally sensitive program design.

Work-life balance expectations and attitudes toward overtime affect fatigue-related safety risks. Cultural norms around masculinity may discourage injury reporting or use of protective equipment in some settings.`,
      ohMeaning: `Cultural factors in ${countryName} directly impact occupational health program effectiveness. Understanding local norms is essential for designing interventions that achieve high participation and compliance rates.

Safety communication must align with local communication styles and hierarchy expectations. Training materials should be culturally appropriate and available in relevant languages.

Health programs that incorporate family involvement often achieve better outcomes in cultures with strong family orientation. Workplace wellness initiatives should respect religious observances and dietary practices.

Addressing stigma around mental health and workplace injuries requires culturally informed approaches. Peer support programs may be more effective than individual counseling in collectivist cultures.`,
      keyStats: [
        { label: "Cultural Factor", value: "Significant", icon: Lightbulb, color: "text-rose-400" },
        { label: "Language Need", value: "Local", icon: Users, color: "text-purple-400" },
        { label: "Family Role", value: "Important", icon: Heart, color: "text-pink-400" },
        { label: "Adaptation", value: "Required", icon: Activity, color: "text-amber-400" },
      ],
    },
  };

  return defaultContent[category] || defaultContent.industry;
}

// ============================================================================
// COMPONENTS
// ============================================================================

function KeyStatTile({ stat, index }: { stat: KeyStat; index: number }) {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-3.5 h-3.5", stat.color)} />
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</span>
      </div>
      <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
    </motion.div>
  );
}

function ImageSlideshow({ images, category }: { images: string[]; category: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center">
        <Info className="w-8 h-8 text-white/20" />
      </div>
    );
  }

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
                src={images[currentIndex]}
                alt={`${category} - image ${currentIndex + 1}`}
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

// Economic comparison chart component
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

// Position indicator component
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
      
      {/* Visual bar */}
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-3">
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
          style={{ left: `${50}%` }}
        />
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

      {/* Stats */}
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
  isAdmin,
  onRegenerate,
  economicData,
}: CentralInsightModalProps) {
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isEconomicCategory = category ? ECONOMIC_CATEGORIES.includes(category) : false;
  const isCountryInsightCategory = category ? COUNTRY_INSIGHT_CATEGORIES.includes(category) : false;

  // Get economic metric config for economic categories
  const economicMetricConfig = useMemo(() => {
    if (!category || !isEconomicCategory) return null;
    return ECONOMIC_METRIC_CONFIGS[category];
  }, [category, isEconomicCategory]);

  // Get current value and benchmark for economic categories
  const economicMetricData = useMemo(() => {
    if (!economicMetricConfig || !economicData) return null;
    const value = economicData[economicMetricConfig.key as keyof typeof economicData] as number | null;
    const benchmark = GLOBAL_BENCHMARKS[economicMetricConfig.benchmarkKey];
    if (value === null || value === undefined || !benchmark) return null;
    
    const percentile = getPercentilePosition(value, benchmark);
    return { value, benchmark, percentile };
  }, [economicMetricConfig, economicData]);

  useEffect(() => {
    if (!category || !isOpen) return;
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      if (isCountryInsightCategory) {
        const content = getCountryInsightContent(category, countryIso, countryName);
        const images = getCountryImages(countryIso, category);
        setInsightData({
          images: images.map((url, i) => ({ url, alt: `${category} image ${i + 1}` })),
          whatIsAnalysis: content.whatIs,
          ohImplications: content.ohMeaning,
          keyStats: content.keyStats,
          status: "completed",
          generatedAt: new Date().toISOString(),
        });
      } else {
        setInsightData({
          images: [],
          whatIsAnalysis: "",
          ohImplications: "",
          keyStats: [],
          status: "completed",
          generatedAt: new Date().toISOString(),
        });
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [category, countryIso, countryName, isOpen, isCountryInsightCategory]);

  const handleRegenerate = async () => {
    if (!category) return;
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
      onRegenerate?.();
    }, 1500);
  };

  if (!category) return null;

  const config = CATEGORY_CONFIGS[category];
  const Icon = config.icon;

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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 400, mass: 0.8 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Decorative gradient */}
            <div className={cn("absolute top-0 left-0 right-0 h-32 bg-gradient-to-b opacity-50 pointer-events-none", config.gradient)} />

            {/* Header - Different format for country insights */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative flex items-center justify-between px-5 py-4 border-b border-white/10"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className={cn("p-2.5 rounded-xl", config.bgColor, config.borderColor, "border")}
                >
                  <Icon className={cn("w-5 h-5", config.color)} />
                </motion.div>
                <div>
                  {isCountryInsightCategory ? (
                    <>
                      <h2 className="text-lg font-bold text-white">{countryName} {config.title}</h2>
                      <p className="text-xs text-cyan-400 font-medium">Occupational Health Perspective</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold text-white">{config.title}</h2>
                      <p className="text-xs text-white/50">{countryName} • Global Comparison</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
                    <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
                  </motion.button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>
            </motion.div>

            {/* Content */}
            <div className="relative flex-1 overflow-hidden">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : isEconomicCategory && economicMetricData ? (
                // ECONOMIC CATEGORY LAYOUT - Charts and data, no images
                <div className="h-full p-5 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: Position and Chart */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
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

                    {/* Right: Analysis */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      {/* Key metrics */}
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

                      {/* OH Implications for economic data */}
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

                      {/* Data source */}
                      <div className="text-[10px] text-white/30 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Source: World Bank, ILO (2023 data)
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : isCountryInsightCategory && insightData ? (
                // COUNTRY INSIGHT LAYOUT - Images and analysis
                <div className="h-full flex flex-col lg:flex-row gap-4 p-5 overflow-y-auto">
                  {/* Left: Image + Stats */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:w-2/5 flex flex-col gap-4"
                  >
                    <div className="h-48 lg:h-56">
                      <ImageSlideshow images={insightData.images.map(i => i.url)} category={config.title} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {insightData.keyStats.map((stat, i) => (
                        <KeyStatTile key={stat.label} stat={stat} index={i} />
                      ))}
                    </div>
                  </motion.div>

                  {/* Right: Analysis */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:w-3/5 flex flex-col overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                      <section>
                        <h3 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", config.color)}>
                          <span className={cn("w-1 h-4 rounded-full", config.bgColor.replace("/20", ""))} />
                          What is {countryName}'s {config.title}?
                        </h3>
                        <div className="text-[13px] text-white/75 leading-relaxed space-y-3">
                          {insightData.whatIsAnalysis.split("\n\n").map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-cyan-400">
                          <span className="w-1 h-4 rounded-full bg-cyan-500" />
                          Occupational Health Perspective
                        </h3>
                        <div className="text-[13px] text-white/75 leading-relaxed space-y-3">
                          {insightData.ohImplications.split("\n\n").map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="pt-3 mt-3 border-t border-white/10 text-[10px] text-white/30">
                      Generated: {new Date(insightData.generatedAt || "").toLocaleDateString()} • AI-powered analysis
                    </div>
                  </motion.div>
                </div>
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
