/**
 * GOHIP Platform - Stat Card Modal Component
 * Modal for displaying detailed information about framework statistics
 * 
 * Displays content for: Components, Metrics, Best Practices, Maturity Levels
 */

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Crown,
  Shield,
  Eye,
  Heart,
  Layers,
  Target,
  Award,
  TrendingUp,
  ChevronRight,
  Loader2,
  Trophy,
} from "lucide-react";
import { statCardContent, type StatCardContent } from "../../data/frameworkContent";
import { cn, getEffectiveOHIScore, getMaturityStage } from "../../lib/utils";
import { fetchComparisonCountries } from "../../services/api";
import { CountryFlag } from "../CountryFlag";
import type { Country } from "../../types/country";

type StatCardType = "components" | "metrics" | "bestPractices" | "maturityLevels";

interface StatCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: StatCardType | null;
}

// Icon mapping for components
const iconMap: Record<string, React.ElementType> = {
  Crown,
  Shield,
  Eye,
  Heart,
};

// Color mapping
const colorMap: Record<string, {
  bg: string;
  border: string;
  text: string;
  glow: string;
}> = {
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
  },
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    text: "text-teal-400",
    glow: "shadow-teal-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    glow: "shadow-rose-500/20",
  },
  slate: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    text: "text-slate-400",
    glow: "shadow-slate-500/20",
  },
};

// Safe color getter with fallback
const getColor = (color: string | undefined) => colorMap[color || "cyan"] || colorMap.cyan;

// Modal header icon and color based on card type
const cardTypeConfig: Record<StatCardType, {
  icon: React.ElementType;
  color: string;
  gradient: string;
}> = {
  components: {
    icon: Layers,
    color: "cyan",
    gradient: "from-cyan-500/30 to-cyan-600/10",
  },
  metrics: {
    icon: Target,
    color: "emerald",
    gradient: "from-emerald-500/30 to-emerald-600/10",
  },
  bestPractices: {
    icon: Award,
    color: "amber",
    gradient: "from-amber-500/30 to-amber-600/10",
  },
  maturityLevels: {
    icon: TrendingUp,
    color: "purple",
    gradient: "from-purple-500/30 to-purple-600/10",
  },
};

/**
 * Component Card - For displaying framework components
 */
function ComponentCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const Icon = item.icon ? iconMap[item.icon] : Layers;
  const colors = getColor(item.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
      className={cn(
        "p-5 rounded-xl border backdrop-blur-sm transition-all duration-300",
        colors.bg,
        colors.border,
        "hover:shadow-lg",
        colors.glow
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          colors.bg,
          colors.border,
          "border"
        )}>
          <Icon className={cn("w-6 h-6", colors.text)} />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-white mb-2">{item.name}</h4>
          <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Metric Card - For displaying assessment metrics
 */
function MetricCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const colors = getColor(item.color);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 + index * 0.03, duration: 0.3 }}
      className={cn(
        "p-3 rounded-lg border backdrop-blur-sm",
        "bg-slate-800/50 border-slate-700/50",
        "hover:bg-slate-700/50 transition-colors"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-8 rounded-full",
            colors.bg.replace("/10", "/50")
          )} />
          <div>
            <h5 className="text-sm font-medium text-white">{item.name}</h5>
            <p className="text-xs text-slate-400">{item.description}</p>
          </div>
        </div>
        {item.value && (
          <span className={cn(
            "text-xs font-mono px-2 py-1 rounded",
            colors.bg,
            colors.text
          )}>
            {item.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Best Practice Card - For displaying country examples (legacy static content)
 */
function BestPracticeCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const colors = getColor(item.color);
  const [country, practice] = item.name.split(" - ");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
      className={cn(
        "p-4 rounded-xl border backdrop-blur-sm",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          "bg-slate-800/50"
        )}>
          <Award className={cn("w-5 h-5", colors.text)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-semibold", colors.text)}>{country}</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400">{practice}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Best Practice Country Card - For displaying top-ranked countries from leaderboard
 */
function BestPracticeCountryCard({ 
  country, 
  rank, 
  ohiScore,
  index 
}: { 
  country: Country; 
  rank: number;
  ohiScore: number;
  index: number;
}) {
  const maturityStage = getMaturityStage(ohiScore);
  
  // Get color based on rank
  const getRankColor = (rank: number) => {
    if (rank === 1) return { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400" };
    if (rank === 2) return { bg: "bg-slate-400/20", border: "border-slate-400/40", text: "text-slate-300" };
    if (rank === 3) return { bg: "bg-amber-600/20", border: "border-amber-600/40", text: "text-amber-600" };
    if (rank <= 5) return { bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400" };
    return { bg: "bg-slate-800/50", border: "border-slate-700/50", text: "text-slate-400" };
  };
  
  const colors = getRankColor(rank);
  
  // Get rank icon
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-400" />;
    if (rank === 2) return <Trophy className="w-4 h-4 text-slate-300" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-bold text-slate-400">#{rank}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.03, duration: 0.3 }}
      className={cn(
        "p-4 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.01]",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          "bg-slate-900/50 border",
          colors.border
        )}>
          {getRankIcon(rank)}
        </div>
        
        {/* Country Flag & Name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CountryFlag 
            isoCode={country.iso_code} 
            flagUrl={country.flag_url} 
            size="md" 
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{country.name}</h4>
            <p className="text-xs text-slate-400">{maturityStage.label}</p>
          </div>
        </div>
        
        {/* ADL OHI Score */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={cn("text-lg font-bold", colors.text)}>
            {ohiScore.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">OHI Score</span>
        </div>
      </div>
      
      {/* Strategic Summary Preview (if available) */}
      {country.strategic_summary_text && (
        <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2 pl-14">
          {country.strategic_summary_text}
        </p>
      )}
    </motion.div>
  );
}

/**
 * Best Practices Content - Fetches and displays top countries from leaderboard
 */
function BestPracticesContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["comparison-countries-best-practices"],
    queryFn: fetchComparisonCountries,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <span className="ml-3 text-slate-400">Loading top performers...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>Unable to load country data. Please try again.</p>
      </div>
    );
  }

  // Calculate OHI scores and sort by score (best to lowest)
  // Uses actual stored pillar scores (computed server-side) for accuracy
  const countriesWithScores = data.countries
    .map(country => {
      // Use the actual computed pillar scores from the country object
      const ohiScore = getEffectiveOHIScore(
        country.maturity_score,
        country.governance_score,
        country.pillar1_score,
        country.pillar2_score,
        country.pillar3_score
      );
      
      return { country, ohiScore };
    })
    .filter(item => item.ohiScore !== null && item.ohiScore > 0)
    .sort((a, b) => (b.ohiScore ?? 0) - (a.ohiScore ?? 0))
    .slice(0, 15); // Top 15 countries

  return (
    <div className="space-y-3">
      {countriesWithScores.map((item, index) => (
        <BestPracticeCountryCard
          key={item.country.iso_code}
          country={item.country}
          rank={index + 1}
          ohiScore={item.ohiScore!}
          index={index}
        />
      ))}
    </div>
  );
}

/**
 * Maturity Level Card - For displaying maturity stages
 */
function MaturityCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const colors = getColor(item.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.4, type: "spring" }}
      className={cn(
        "p-5 rounded-xl border backdrop-blur-sm relative overflow-hidden",
        colors.bg,
        colors.border
      )}
    >
      {/* Level Indicator Bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
        className={cn(
          "absolute top-0 left-0 right-0 h-1 origin-left",
          colors.bg.replace("/10", "/50")
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={cn("text-lg font-bold", colors.text)}>{item.name}</span>
            {item.value && (
              <span className={cn(
                "text-xs font-mono px-2 py-0.5 rounded",
                "bg-slate-800/50 text-slate-300"
              )}>
                Score: {item.value}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          colors.bg,
          colors.border,
          "border"
        )}>
          <TrendingUp className={cn("w-6 h-6", colors.text)} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Stat Card Modal Component
 */
export function StatCardModal({ isOpen, onClose, cardType }: StatCardModalProps) {
  if (!cardType) return null;

  const content = statCardContent[cardType];
  const config = cardTypeConfig[cardType];
  const Icon = config.icon;

  const renderContent = () => {
    switch (cardType) {
      case "components":
        return (
          <div className="space-y-4">
            {content.items.map((item, index) => (
              <ComponentCard key={item.name} item={item} index={index} />
            ))}
          </div>
        );
      case "metrics":
        return (
          <div className="grid grid-cols-1 gap-2">
            {content.items.map((item, index) => (
              <MetricCard key={item.name} item={item} index={index} />
            ))}
          </div>
        );
      case "bestPractices":
        return <BestPracticesContent />;
      case "maturityLevels":
        return (
          <div className="space-y-4">
            {content.items.map((item, index) => (
              <MaturityCard key={item.name} item={item} index={index} />
            ))}
          </div>
        );
      default:
        return null;
    }
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal - Full screen on mobile with small margins */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-2 sm:inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] lg:w-[700px] max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] md:max-h-[85vh] bg-slate-900/95 border border-slate-700/50 rounded-xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className={cn(
              "relative px-6 py-5 border-b border-slate-700/50 flex-shrink-0",
              `bg-gradient-to-r ${config.gradient}`
            )}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden",
                    colorMap[config.color].bg,
                    colorMap[config.color].border,
                    "border"
                  )}
                >
                  {cardType === "maturityLevels" ? (
                    <img 
                      src="/adl-logo.png" 
                      alt="ADL" 
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Icon className={cn("w-7 h-7", colorMap[config.color].text)} />
                  )}
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="text-xl font-bold text-white"
                  >
                    {content.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className={cn("text-sm", colorMap[config.color].text)}
                  >
                    {content.subtitle}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="text-slate-300 text-sm leading-relaxed mb-6"
              >
                {content.description}
              </motion.p>

              {/* Dynamic Content */}
              {renderContent()}
            </div>

            {/* Bottom Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={cn(
                "absolute bottom-0 left-0 right-0 h-32 pointer-events-none",
                `bg-gradient-to-t from-${config.color}-500/5 to-transparent`
              )}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default StatCardModal;
