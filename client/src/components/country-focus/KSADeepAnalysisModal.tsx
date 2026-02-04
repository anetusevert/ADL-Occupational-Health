/**
 * KSA Deep Analysis Modal Component - Premium Redesign
 * 
 * Features:
 * - Immediate visual positioning scale showing KSA's position
 * - Premium staged Framer Motion animations
 * - Global leaders synced from Best Practices API
 * - Stacked sub-modal for country best practice detail
 * - Gap indicator showing distance to global leadership
 * 
 * Version: 2.0.0 - Visual Scale Redesign
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Target, Award, BookOpen, TrendingUp, 
  Lightbulb, CheckCircle2, ArrowRight, Loader2, Globe2,
  AlertTriangle, ChevronRight, Zap, Flag
} from "lucide-react";
import { cn } from "../../lib/utils";
import { PILLAR_DEFINITIONS, type PillarId, getQuestionById } from "../../lib/strategicQuestions";
import { CountryFlag } from "../CountryFlag";
import { generateKSAAnalysis, type KSAAnalysisResult } from "../../services/ksaAnalysisAgent";
import { apiClient } from "../../services/api";

// ============================================================================
// TYPES
// ============================================================================

interface KSADeepAnalysisModalProps {
  isOpen: boolean;
  pillarId: PillarId;
  questionId: string;
  country: {
    iso_code: string;
    name: string;
    flag_url?: string | null;
  } | null;
  globalStats: {
    totalCountries: number;
  } | null;
  onClose: () => void;
}

interface TopCountry {
  iso_code: string;
  name: string;
  rank: number;
  score: number;
  summary?: string;
  flag_url?: string;
}

// Utility to generate flag URL from ISO code using flagcdn.com CDN
const getFlagUrl = (isoCode: string): string => {
  // Convert 3-letter ISO to 2-letter for flag service
  const iso2Map: Record<string, string> = {
    "DEU": "de", "SWE": "se", "NLD": "nl", "FIN": "fi", "JPN": "jp",
    "AUS": "au", "SGP": "sg", "GBR": "gb", "CAN": "ca", "KOR": "kr",
    "NOR": "no", "USA": "us", "DNK": "dk", "FRA": "fr", "BEL": "be",
    "ESP": "es", "PRT": "pt", "ITA": "it", "AUT": "at", "CHE": "ch",
    "SAU": "sa", "ARE": "ae", "QAT": "qa", "KWT": "kw", "BHR": "bh",
    "OMN": "om", "JOR": "jo", "EGY": "eg", "MAR": "ma", "TUN": "tn",
    "IND": "in", "CHN": "cn", "BRA": "br", "MEX": "mx", "ARG": "ar",
    "ZAF": "za", "NGA": "ng", "KEN": "ke", "GHA": "gh", "TZA": "tz",
  };
  const iso2 = iso2Map[isoCode] || isoCode.toLowerCase().substring(0, 2);
  // Use flagcdn.com for reliable flag images
  return `https://flagcdn.com/w80/${iso2}.png`;
};

interface BestPracticeData {
  top_countries: TopCountry[];
  best_practice_overview?: string;
  question_id?: string;
}

interface CountryBestPracticeDetail {
  country_iso_code: string;
  country_name: string;
  question_id: string;
  question_title: string;
  pillar: string;
  rank?: number;
  score?: number;
  status: string;
  approach_description?: string;
  why_best_practice?: string;
  key_metrics?: { metric: string; value: string; context: string }[];
  policy_highlights?: { policy: string; description: string; year_enacted?: string }[];
  lessons_learned?: string;
  transferability?: string;
  flag_url?: string;
}

// KSA scores by question (from database)
const KSA_SCORES: Record<string, number> = {
  "legal-foundation": 66,
  "institutional-architecture": 58,
  "enforcement-capacity": 43,
  "strategic-planning": 34,
  "exposure-standards": 77,
  "risk-assessment": 61,
  "prevention-infrastructure": 60,
  "safety-outcomes": 34,
  "surveillance-architecture": 55,
  "detection-capacity": 83,
  "data-quality": 36,
  "vulnerable-populations": 55,
  "payer-architecture": 34,
  "benefit-adequacy": 69,
  "rehabilitation-chain": 74,
  "recovery-outcomes": 87,
  "default": 50,
};

// Fallback leaders (used when API fails)
const FALLBACK_LEADERS: Record<string, TopCountry[]> = {
  "legal-foundation": [
    { iso_code: "DEU", name: "Germany", rank: 1, score: 95, summary: "Comprehensive dual system with employer liability insurance" },
    { iso_code: "SWE", name: "Sweden", rank: 2, score: 92, summary: "Work Environment Authority with broad mandate" },
    { iso_code: "NLD", name: "Netherlands", rank: 3, score: 89, summary: "Strong tripartite governance model" },
  ],
  "default": [
    { iso_code: "DEU", name: "Germany", rank: 1, score: 93, summary: "Comprehensive framework across all dimensions" },
    { iso_code: "FIN", name: "Finland", rank: 2, score: 91, summary: "Strong institutional capacity and surveillance" },
    { iso_code: "SGP", name: "Singapore", rank: 3, score: 89, summary: "Innovative enforcement and technology adoption" },
  ],
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      damping: 28, 
      stiffness: 350,
      duration: 0.4
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 }
  }
};

const questionVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.15, duration: 0.4, ease: "easeOut" }
  }
};

const scaleVariants = {
  hidden: { opacity: 0, scaleX: 0.8 },
  visible: { 
    opacity: 1, 
    scaleX: 1,
    transition: { delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const leaderMarkerVariants = {
  hidden: { scale: 0, y: 10 },
  visible: (i: number) => ({
    scale: 1,
    y: 0,
    transition: { delay: 0.4 + i * 0.08, type: "spring", damping: 15, stiffness: 300 }
  })
};

const ksaMarkerVariants = {
  hidden: { scale: 0, left: "0%" },
  visible: (position: number) => ({
    scale: 1,
    left: `${position}%`,
    transition: { 
      delay: 0.7, 
      type: "spring", 
      damping: 12, 
      stiffness: 200,
      duration: 0.8
    }
  })
};

const gapLineVariants = {
  hidden: { width: "0%" },
  visible: (gap: number) => ({
    width: `${gap}%`,
    transition: { delay: 1.0, duration: 0.8, ease: "easeOut" }
  })
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 1.2, duration: 0.4 }
  }
};

// ============================================================================
// POSITIONING SCALE COMPONENT
// ============================================================================

interface PositioningScaleProps {
  ksaScore: number;
  leaders: TopCountry[];
  pillarColor: string;
  pillarBgColor: string;
  questionTitle: string;
  onLeaderClick: (leader: TopCountry) => void;
}

function PositioningScale({ 
  ksaScore, 
  leaders, 
  pillarColor,
  pillarBgColor,
  questionTitle,
  onLeaderClick
}: PositioningScaleProps) {
  const bestScore = leaders.length > 0 ? Math.max(...leaders.map(l => l.score)) : 100;
  const gap = bestScore - ksaScore;
  
  // Scale markers
  const markers = [0, 25, 50, 75, 100];
  
  return (
    <motion.div 
      variants={scaleVariants}
      initial="hidden"
      animate="visible"
      className="relative mb-6"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Global Positioning</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10">
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-white/50">KSA:</span>
            <span className={cn("text-sm font-bold", pillarColor)}>{ksaScore}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-white/50">Gap:</span>
            <span className="text-sm font-bold text-amber-400">{gap} pts</span>
          </div>
        </div>
      </div>
      
      {/* Scale Container */}
      <div className="relative h-24 rounded-2xl bg-slate-800/40 border border-white/10 p-4 overflow-visible">
        {/* Background Gradient Track */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-4 rounded-full bg-gradient-to-r from-red-500/30 via-amber-500/30 to-emerald-500/30 overflow-hidden">
          {/* Filled portion */}
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${ksaScore}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className={cn(
              "absolute top-0 h-full rounded-full",
              ksaScore >= 70 ? "bg-gradient-to-r from-emerald-600/80 to-emerald-500/80" :
              ksaScore >= 40 ? "bg-gradient-to-r from-amber-600/80 to-amber-500/80" :
              "bg-gradient-to-r from-red-600/80 to-red-500/80"
            )}
          />
        </div>
        
        {/* Scale Markers */}
        {markers.map((mark) => (
          <div
            key={mark}
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `calc(${mark}% - ${mark === 0 ? 0 : mark === 100 ? 16 : 8}px + 16px)` }}
          >
            <div className="w-px h-6 bg-white/20" />
            <span className="text-[10px] text-white/40 mt-1">{mark}%</span>
          </div>
        ))}
        
        {/* Leader Position Markers */}
        {leaders.slice(0, 5).map((leader, index) => (
          <motion.button
            key={leader.iso_code}
            custom={index}
            variants={leaderMarkerVariants}
            initial="hidden"
            animate="visible"
            onClick={() => onLeaderClick(leader)}
            className="absolute top-1 flex flex-col items-center group cursor-pointer z-10"
            style={{ left: `calc(${leader.score}% - 16px + 16px)` }}
          >
            {/* Flag with rank badge */}
            <div className="relative">
              <div className={cn(
                "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold z-20",
                index === 0 ? "bg-amber-500 text-amber-950" :
                index === 1 ? "bg-slate-300 text-slate-800" :
                "bg-orange-600 text-orange-100"
              )}>
                {index + 1}
              </div>
              <div className="w-8 h-6 rounded overflow-hidden ring-2 ring-white/30 group-hover:ring-white/60 transition-all shadow-lg">
                <CountryFlag isoCode={leader.iso_code} flagUrl={leader.flag_url || getFlagUrl(leader.iso_code)} size="sm" className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Tooltip on hover */}
            <div className="absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
              <div className="bg-slate-900 border border-white/20 rounded-lg px-2 py-1 shadow-xl whitespace-nowrap">
                <span className="text-[10px] text-white font-medium">{leader.name}</span>
                <span className="text-[10px] text-emerald-400 ml-1">{leader.score}%</span>
              </div>
            </div>
          </motion.button>
        ))}
        
        {/* KSA Position Marker - Main Focus */}
        <motion.div
          custom={ksaScore}
          variants={ksaMarkerVariants}
          initial="hidden"
          animate="visible"
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-20"
          style={{ marginLeft: "-24px" }}
        >
          {/* Pulse animation */}
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-12 h-12 rounded-full bg-white/20"
          />
          {/* Flag container */}
          <div className="relative">
            <div className="w-12 h-9 rounded-lg overflow-hidden ring-4 ring-white shadow-2xl shadow-white/20">
              <CountryFlag isoCode="SAU" flagUrl={getFlagUrl("SAU")} size="md" className="w-full h-full object-cover" />
            </div>
            {/* KSA label */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-white text-slate-900 text-[10px] font-bold whitespace-nowrap shadow-lg">
              KSA
            </div>
          </div>
        </motion.div>
        
        {/* Gap Line from KSA to Best Leader */}
        {gap > 0 && (
          <motion.div
            custom={gap}
            variants={gapLineVariants}
            initial="hidden"
            animate="visible"
            className="absolute top-1/2 h-1 bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full z-5"
            style={{ 
              left: `calc(${ksaScore}% + 16px)`,
              transform: "translateY(-50%)"
            }}
          >
            {/* Gap arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1"
            >
              <ChevronRight className="w-3 h-3 text-emerald-400" />
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="flex items-center justify-center gap-6 mt-3"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white ring-2 ring-white/50" />
          <span className="text-[10px] text-white/50">Saudi Arabia (Current)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-white/50">Global Leaders</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-1 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" />
          <span className="text-[10px] text-white/50">Gap to Leadership</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// COUNTRY BEST PRACTICE SUB-MODAL
// ============================================================================

interface CountryBestPracticeSubModalProps {
  isOpen: boolean;
  countryIso: string;
  countryName: string;
  questionId: string;
  pillarId: string;
  onClose: () => void;
}

function CountryBestPracticeSubModal({
  isOpen,
  countryIso,
  countryName,
  questionId,
  pillarId,
  onClose,
}: CountryBestPracticeSubModalProps) {
  const [data, setData] = useState<CountryBestPracticeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch country best practice data
  useEffect(() => {
    if (isOpen && countryIso && questionId) {
      setIsLoading(true);
      apiClient.get(`/api/v1/best-practices/country/${countryIso}/${questionId}`)
        .then(response => {
          setData(response.data);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, countryIso, questionId]);
  
  const pillarDef = PILLAR_DEFINITIONS[pillarId as PillarId];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Sub-modal backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Sub-modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-[12%] left-[20%] right-[20%] bottom-[12%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 bg-slate-800/80 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-lg">
                    <CountryFlag isoCode={countryIso} flagUrl={getFlagUrl(countryIso)} size="lg" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{countryName}</h2>
                    <p className="text-sm text-white/50">Best Practice Case Study</p>
                  </div>
                  {data?.rank && (
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg font-bold text-sm",
                      data.rank === 1 ? "bg-amber-500/20 text-amber-400" :
                      data.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                      data.rank <= 5 ? "bg-orange-700/20 text-orange-400" :
                      "bg-slate-700/50 text-slate-400"
                    )}>
                      Rank #{data.rank}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                </div>
              ) : data?.status === "completed" && data.approach_description ? (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Score Display */}
                  {data.score && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/10">
                      <div className={cn(
                        "text-4xl font-bold tabular-nums",
                        data.score >= 90 ? "text-emerald-400" :
                        data.score >= 70 ? "text-cyan-400" : "text-amber-400"
                      )}>
                        {data.score}%
                      </div>
                      <div className="text-sm text-white/50">
                        Performance Score for this Strategic Question
                      </div>
                    </div>
                  )}
                  
                  {/* How They Address It */}
                  <div className="p-5 rounded-xl bg-slate-800/40 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-cyan-400" />
                      How They Address It
                    </h3>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                      {data.approach_description}
                    </p>
                  </div>
                  
                  {/* Why Best Practice */}
                  {data.why_best_practice && (
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Why It's Best Practice
                      </h3>
                      <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                        {data.why_best_practice}
                      </p>
                    </div>
                  )}
                  
                  {/* Key Metrics */}
                  {data.key_metrics && data.key_metrics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        Key Metrics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.key_metrics.map((metric, index) => (
                          <div key={index} className="p-4 rounded-xl bg-slate-800/40 border border-white/10">
                            <div className="text-sm text-white/50 mb-1">{metric.metric}</div>
                            <div className="text-xl font-bold text-white mb-1">{metric.value}</div>
                            <div className="text-xs text-white/40">{metric.context}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Lessons Learned */}
                  {data.lessons_learned && (
                    <div className="p-5 rounded-xl bg-slate-800/40 border border-white/10">
                      <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        Key Lessons
                      </h3>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">
                        {data.lessons_learned}
                      </p>
                    </div>
                  )}
                  
                  {/* Transferability */}
                  {data.transferability && (
                    <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <h3 className="text-base font-semibold text-purple-400 mb-2 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                        How to Adopt (For Saudi Arabia)
                      </h3>
                      <p className="text-sm text-white/70 whitespace-pre-wrap">
                        {data.transferability}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Case Study Coming Soon</h3>
                  <p className="text-sm text-white/50 max-w-md">
                    The detailed case study for {countryName} is being prepared. Please check back later.
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-3 bg-slate-900/50 border-t border-white/5 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                Back to Analysis
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function KSADeepAnalysisModal({
  isOpen,
  pillarId,
  questionId,
  country,
  globalStats,
  onClose,
}: KSADeepAnalysisModalProps) {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<KSAAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaders, setLeaders] = useState<TopCountry[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<TopCountry | null>(null);

  const pillarDef = PILLAR_DEFINITIONS[pillarId];
  const question = getQuestionById(pillarId, questionId);
  const Icon = pillarDef?.icon;
  
  // Get KSA score for this question
  const ksaScore = KSA_SCORES[questionId] || KSA_SCORES["default"];

  // Fetch leaders from Best Practices API
  useEffect(() => {
    if (isOpen && questionId) {
      setIsLoadingLeaders(true);
      
      // Map questionId to API format (e.g., "legal-foundation" -> "gov-q1")
      const questionIdMap: Record<string, string> = {
        "legal-foundation": "gov-q1",
        "institutional-architecture": "gov-q2",
        "enforcement-capacity": "gov-q3",
        "strategic-planning": "gov-q4",
        "exposure-standards": "haz-q1",
        "risk-assessment": "haz-q2",
        "prevention-infrastructure": "haz-q3",
        "safety-outcomes": "haz-q4",
        "surveillance-architecture": "vig-q1",
        "detection-capacity": "vig-q2",
        "data-quality": "vig-q3",
        "vulnerable-populations": "vig-q4",
        "payer-architecture": "res-q1",
        "benefit-adequacy": "res-q2",
        "rehabilitation-chain": "res-q3",
        "recovery-outcomes": "res-q4",
      };
      
      const apiQuestionId = questionIdMap[questionId] || questionId;
      
      apiClient.get(`/api/v1/best-practices/question/${apiQuestionId}`)
        .then(response => {
          const data: BestPracticeData = response.data;
          if (data.top_countries && data.top_countries.length > 0) {
            setLeaders(data.top_countries);
          } else {
            // Use fallback
            setLeaders(FALLBACK_LEADERS[questionId] || FALLBACK_LEADERS["default"]);
          }
          setIsLoadingLeaders(false);
        })
        .catch(() => {
          // Use fallback on error
          setLeaders(FALLBACK_LEADERS[questionId] || FALLBACK_LEADERS["default"]);
          setIsLoadingLeaders(false);
        });
    }
  }, [isOpen, questionId]);

  // Generate analysis when modal opens
  useEffect(() => {
    if (isOpen && questionId && pillarId) {
      setIsLoading(true);
      generateKSAAnalysis(pillarId, questionId)
        .then(result => {
          setAnalysis(result);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, questionId, pillarId]);

  // Handle leader click - open sub-modal
  const handleLeaderClick = (leader: TopCountry) => {
    setSelectedLeader(leader);
  };

  if (!question || !pillarDef) return null;

  // Map questionId to API format for sub-modal
  const getApiQuestionId = (qId: string) => {
    const map: Record<string, string> = {
      "legal-foundation": "gov-q1",
      "institutional-architecture": "gov-q2",
      "enforcement-capacity": "gov-q3",
      "strategic-planning": "gov-q4",
      "exposure-standards": "haz-q1",
      "risk-assessment": "haz-q2",
      "prevention-infrastructure": "haz-q3",
      "safety-outcomes": "haz-q4",
      "surveillance-architecture": "vig-q1",
      "detection-capacity": "vig-q2",
      "data-quality": "vig-q3",
      "vulnerable-populations": "vig-q4",
      "payer-architecture": "res-q1",
      "benefit-adequacy": "res-q2",
      "rehabilitation-chain": "res-q3",
      "recovery-outcomes": "res-q4",
    };
    return map[qId] || qId;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-lg z-50"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "fixed top-[8%] left-[16%] right-[16%] bottom-[8%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden",
              selectedLeader && "opacity-50 scale-[0.98] pointer-events-none"
            )}
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 px-6 py-4 border-b border-white/10",
              pillarDef.bgColor
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className={cn("p-3 rounded-xl border", pillarDef.bgColor, pillarDef.borderColor)}
                  >
                    <Icon className={cn("w-6 h-6", pillarDef.color)} />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-medium uppercase tracking-wider", pillarDef.color)}>
                        {pillarDef.name}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-xs text-white/50">Kingdom of Saudi Arabia</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{question.title}</h2>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            {/* Fixed Section - Strategic Question & Positioning Scale */}
            <div className="flex-shrink-0 px-6 pt-4 pb-2 border-b border-white/5">
              <div className="max-w-5xl mx-auto">
                {/* Strategic Question - Compact */}
                <motion.div
                  variants={questionVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-4 rounded-xl bg-slate-800/50 border border-white/10 mb-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className={cn("w-4 h-4", pillarDef.color)} />
                    <h3 className="text-sm font-semibold text-white">Strategic Question</h3>
                  </div>
                  <p className="text-white/90 text-base leading-relaxed">
                    {question.question}
                  </p>
                </motion.div>

                {/* POSITIONING SCALE - Always Visible */}
                {!isLoadingLeaders && leaders.length > 0 && (
                  <PositioningScale
                    ksaScore={ksaScore}
                    leaders={leaders}
                    pillarColor={pillarDef.color}
                    pillarBgColor={pillarDef.bgColor}
                    questionTitle={question.title}
                    onLeaderClick={handleLeaderClick}
                  />
                )}
              </div>
            </div>

            {/* Scrollable Content - Analysis & Leaders */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              <div className="p-6 pt-4">
                <div className="max-w-5xl mx-auto">
                  {/* Two Column Layout */}
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                  >
                    {/* Left Column - Report Content (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                      {/* Loading State */}
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-8 rounded-xl bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/20"
                        >
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="relative mb-4">
                              <motion.div
                                className="absolute inset-0 rounded-full border-2 border-purple-500/30"
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Preparing Deep Analysis</h4>
                            <p className="text-white/50 text-sm max-w-md">
                              Researching Saudi Arabia's position, global best practices, 
                              and strategic recommendations...
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Analysis Content */}
                      {!isLoading && analysis && (
                        <>
                          {/* Executive Summary */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                              "p-5 rounded-xl border-2",
                              pillarDef.bgColor,
                              pillarDef.borderColor
                            )}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Lightbulb className={cn("w-5 h-5", pillarDef.color)} />
                              <h3 className={cn("text-lg font-semibold", pillarDef.color)}>Executive Summary</h3>
                            </div>
                            <p className="text-white text-lg leading-relaxed font-medium">
                              {analysis.executiveSummary}
                            </p>
                          </motion.div>

                          {/* Deep Analysis Report */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-6 rounded-xl bg-slate-800/50 border border-white/10"
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <BookOpen className="w-5 h-5 text-cyan-400" />
                              <h3 className="text-lg font-semibold text-white">Strategic Analysis</h3>
                            </div>

                            <div className="prose prose-invert prose-sm max-w-none">
                              {/* Strategic Context */}
                              <div className="mb-6">
                                <h4 className="text-base font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                                  <Globe2 className="w-4 h-4" />
                                  Strategic Context
                                </h4>
                                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                                  {analysis.strategicContext}
                                </p>
                              </div>

                              {/* Current State Assessment */}
                              <div className="mb-6">
                                <h4 className="text-base font-semibold text-amber-400 mb-2 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Current State Assessment
                                </h4>
                                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                                  {analysis.currentState}
                                </p>
                              </div>

                              {/* Gap Analysis */}
                              <div className="mb-6">
                                <h4 className="text-base font-semibold text-red-400 mb-2">Gap Analysis</h4>
                                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                                  {analysis.gapAnalysis}
                                </p>
                              </div>

                              {/* Recommendations */}
                              <div className="mb-6">
                                <h4 className="text-base font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Strategic Recommendations
                                </h4>
                                <div className="space-y-3">
                                  {analysis.recommendations.map((rec, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">
                                        {index + 1}
                                      </span>
                                      <p className="text-white/80 text-sm leading-relaxed">{rec}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Implementation Pathway */}
                              <div>
                                <h4 className="text-base font-semibold text-purple-400 mb-2">Implementation Pathway</h4>
                                <p className="text-white/80 leading-relaxed whitespace-pre-line">
                                  {analysis.implementationPathway}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </div>

                    {/* Right Column - Global Leaders (1 col) */}
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 rounded-xl bg-slate-800/50 border border-white/10 sticky top-0"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="w-5 h-5 text-amber-400" />
                          <h3 className="text-base font-semibold text-white">Global Leaders</h3>
                        </div>

                        {isLoadingLeaders ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {leaders.slice(0, 5).map((leader, index) => (
                              <motion.button
                                key={leader.iso_code}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                onClick={() => handleLeaderClick(leader)}
                                className="w-full text-left p-3 rounded-lg bg-slate-700/30 border border-white/5 hover:bg-slate-700/60 hover:border-white/20 transition-all group cursor-pointer"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={cn(
                                    "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                                    index === 0 ? "bg-amber-500/20 text-amber-400" :
                                    index === 1 ? "bg-slate-400/20 text-slate-300" :
                                    "bg-orange-700/20 text-orange-400"
                                  )}>
                                    {leader.rank || index + 1}
                                  </span>
                                  <CountryFlag
                                    isoCode={leader.iso_code}
                                    flagUrl={leader.flag_url || getFlagUrl(leader.iso_code)}
                                    size="sm"
                                    className="rounded shadow-sm"
                                  />
                                  <span className="font-medium text-white text-sm flex-1">{leader.name}</span>
                                  <span className={cn("text-xs font-bold", pillarDef.color)}>
                                    {leader.score}%
                                  </span>
                                </div>
                                {leader.summary && (
                                  <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                                    {leader.summary}
                                  </p>
                                )}
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span>View Best Practices</span>
                                  <ArrowRight className="w-3 h-3" />
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        )}

                        {/* View All Leaders Button */}
                        <button
                          onClick={() => {
                            onClose();
                            navigate("/deep-dive");
                          }}
                          className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-700/30 border border-white/10 text-white/60 hover:text-white hover:bg-slate-700/50 transition-all text-sm"
                        >
                          <span>Explore All Best Practices</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Country Best Practice Sub-Modal */}
          {selectedLeader && (
            <CountryBestPracticeSubModal
              isOpen={true}
              countryIso={selectedLeader.iso_code}
              countryName={selectedLeader.name}
              questionId={getApiQuestionId(questionId)}
              pillarId={pillarId}
              onClose={() => setSelectedLeader(null)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default KSADeepAnalysisModal;
