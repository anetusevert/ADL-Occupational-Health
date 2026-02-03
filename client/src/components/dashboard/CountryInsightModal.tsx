/**
 * Country Insight Modal Component
 * 
 * Full-screen modal showing detailed information about a country aspect.
 * Features:
 * - Large background image
 * - AI-generated content about the category
 * - Relevant statistics from intelligence data
 * - ADL OHI Score breakdown for OH Perspective
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Loader2, BarChart3, Users, Building2,
  Globe2, Heart, TrendingUp, Factory, Landmark, UserCircle2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CATEGORY_INFO, type ImageCategory } from "../../services/unsplashService";
import { generateCountryInsight, type CountryInsightContent } from "../../services/countryInsightAgent";
import type { CountryIntelligence } from "../../pages/CountryDashboard";

interface CountryInsightModalProps {
  isOpen: boolean;
  category: ImageCategory;
  country: {
    iso_code: string;
    name: string;
    governance_score?: number | null;
    pillar1_score?: number | null;
    pillar2_score?: number | null;
    pillar3_score?: number | null;
    maturity_score?: number | null;
  };
  intelligence: CountryIntelligence | null;
  imageUrl: string;
  onClose: () => void;
}

// Category icons mapping
const CATEGORY_ICONS: Record<ImageCategory, typeof Globe2> = {
  culture: Heart,
  landmarks: Landmark,
  industry: Factory,
  cityscape: Building2,
  people: UserCircle2,
  political: Globe2,
};

// Get relevant statistics for each category
function getCategoryStats(category: ImageCategory, intelligence: CountryIntelligence | null): Array<{ label: string; value: string }> {
  if (!intelligence) return [];

  const formatNumber = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return "N/A";
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(1);
  };

  const formatPercent = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return "N/A";
    return `${n.toFixed(1)}%`;
  };

  switch (category) {
    case "culture":
      return [
        { label: "Life Expectancy", value: `${intelligence.life_expectancy_at_birth?.toFixed(0) || "N/A"} years` },
        { label: "HDI Score", value: intelligence.hdi_score?.toFixed(3) || "N/A" },
        { label: "Median Age", value: `${intelligence.median_age?.toFixed(0) || "N/A"} years` },
      ];
    case "landmarks":
      return [
        { label: "Urban Population", value: formatPercent(intelligence.urban_population_pct) },
        { label: "Total Population", value: formatNumber(intelligence.population_total) },
      ];
    case "industry":
      return [
        { label: "Industry % of GDP", value: formatPercent(intelligence.industry_pct_gdp) },
        { label: "Manufacturing", value: formatPercent(intelligence.manufacturing_pct_gdp) },
        { label: "Services", value: formatPercent(intelligence.services_pct_gdp) },
        { label: "Agriculture", value: formatPercent(intelligence.agriculture_pct_gdp) },
      ];
    case "cityscape":
      return [
        { label: "GDP per Capita", value: `$${formatNumber(intelligence.gdp_per_capita_ppp)}` },
        { label: "GDP Growth", value: formatPercent(intelligence.gdp_growth_rate) },
        { label: "Urban Population", value: formatPercent(intelligence.urban_population_pct) },
      ];
    case "people":
      return [
        { label: "Labor Participation", value: formatPercent(intelligence.labor_force_participation) },
        { label: "Unemployment", value: formatPercent(intelligence.unemployment_rate) },
        { label: "Youth Unemployment", value: formatPercent(intelligence.youth_unemployment_rate) },
        { label: "Working Age Pop", value: formatNumber(intelligence.population_working_age) },
      ];
    case "political":
      return [
        { label: "HDI Rank", value: intelligence.hdi_rank ? `#${intelligence.hdi_rank}` : "N/A" },
        { label: "Health Expenditure", value: formatPercent(intelligence.health_expenditure_gdp_pct) },
      ];
    default:
      return [];
  }
}

export function CountryInsightModal({
  isOpen,
  category,
  country,
  intelligence,
  imageUrl,
  onClose,
}: CountryInsightModalProps) {
  const [content, setContent] = useState<CountryInsightContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const info = CATEGORY_INFO[category];
  const Icon = CATEGORY_ICONS[category];
  const stats = getCategoryStats(category, intelligence);

  // Calculate OHI score
  const ohiScore = country.maturity_score || (
    country.governance_score && country.pillar1_score && country.pillar2_score && country.pillar3_score
      ? ((country.governance_score + country.pillar1_score + country.pillar2_score + country.pillar3_score) / 4) / 25
      : null
  );

  // Generate content when modal opens
  useEffect(() => {
    if (isOpen && category) {
      setIsLoading(true);
      generateCountryInsight(country.iso_code, country.name, category, intelligence)
        .then(result => {
          setContent(result);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, category, country.iso_code, country.name, intelligence]);

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
            className="fixed inset-0 bg-black/85 backdrop-blur-lg z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-12 bg-slate-900 rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/70" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{info.title}</h2>
                      <p className="text-sm text-white/60">{country.name} • {info.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* AI Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-400 font-medium">AI Insight</span>
                    </div>

                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl">
                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative mb-4">
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-purple-500/30"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                      </div>
                      <p className="text-white/60">Generating insight...</p>
                    </div>
                  )}

                  {/* Content */}
                  {!isLoading && content && (
                    <div className="space-y-6">
                      {/* Main Description */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-xl bg-slate-800/50 border border-white/10"
                      >
                        <p className="text-white/90 text-lg leading-relaxed">
                          {content.overview}
                        </p>
                      </motion.div>

                      {/* Key Points */}
                      {content.keyPoints && content.keyPoints.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="p-5 rounded-xl bg-slate-800/50 border border-white/10"
                        >
                          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-400" />
                            Key Highlights
                          </h3>
                          <div className="space-y-3">
                            {content.keyPoints.map((point, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                                  {index + 1}
                                </span>
                                <p className="text-white/80 text-sm leading-relaxed">{point}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Statistics Grid */}
                      {stats.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-amber-400" />
                            Key Statistics
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {stats.map((stat, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-slate-800/50 border border-white/10"
                              >
                                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className="text-lg font-bold text-cyan-400">{stat.value}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* OHI Score Section (for political/OH perspective) */}
                      {(category === "political" || category === "industry") && ohiScore !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="p-5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20"
                        >
                          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            ADL Occupational Health Index
                          </h3>
                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-4xl font-bold text-cyan-400">{ohiScore.toFixed(1)}</p>
                              <p className="text-xs text-white/50">OHI Score</p>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/10">
                                <p className="text-xs text-white/50">Governance</p>
                                <p className="text-sm font-semibold text-purple-400">{country.governance_score?.toFixed(0) || "N/A"}%</p>
                              </div>
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <p className="text-xs text-white/50">Hazard Control</p>
                                <p className="text-sm font-semibold text-blue-400">{country.pillar1_score?.toFixed(0) || "N/A"}%</p>
                              </div>
                              <div className="p-2 rounded-lg bg-teal-500/10">
                                <p className="text-xs text-white/50">Vigilance</p>
                                <p className="text-sm font-semibold text-teal-400">{country.pillar2_score?.toFixed(0) || "N/A"}%</p>
                              </div>
                              <div className="p-2 rounded-lg bg-amber-500/10">
                                <p className="text-xs text-white/50">Restoration</p>
                                <p className="text-sm font-semibold text-amber-400">{country.pillar3_score?.toFixed(0) || "N/A"}%</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Context */}
                      {content.context && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="p-4 rounded-xl bg-white/5 border border-white/5"
                        >
                          <p className="text-sm text-white/60 leading-relaxed italic">
                            {content.context}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CountryInsightModal;
