/**
 * KSA Deep Analysis Modal Component
 * 
 * Full-screen modal showing AI-powered McKinsey-style deep analysis.
 * Features:
 * - Strategic question display
 * - Executive summary (header answer)
 * - Deep McKinsey-style report with structured sections
 * - Global leaders with real country flags
 * - Click-through navigation to best practices
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Sparkles, Target, Award, BookOpen, TrendingUp, 
  Lightbulb, CheckCircle2, ArrowRight, Loader2, Globe2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { PILLAR_DEFINITIONS, type PillarId, getQuestionById } from "../../lib/strategicQuestions";
import { CountryFlag } from "../CountryFlag";
import { generateKSAAnalysis, type KSAAnalysisResult } from "../../services/ksaAnalysisAgent";

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

// Global leaders with ISO codes for navigation
interface GlobalLeader {
  isoCode: string;
  countryName: string;
  score: number;
  highlight: string;
}

// Leaders data by question with proper ISO codes
const GLOBAL_LEADERS: Record<string, GlobalLeader[]> = {
  "legal-foundation": [
    { isoCode: "DEU", countryName: "Germany", score: 95, highlight: "Comprehensive dual system with employer liability insurance and strong legal framework" },
    { isoCode: "SWE", countryName: "Sweden", score: 92, highlight: "Work Environment Authority with broad mandate and ILO convention leadership" },
    { isoCode: "NLD", countryName: "Netherlands", score: 89, highlight: "Strong tripartite governance model with systematic risk assessment requirements" },
  ],
  "institutional-architecture": [
    { isoCode: "FIN", countryName: "Finland", score: 94, highlight: "FIOH serves as the global benchmark for occupational health research institutions" },
    { isoCode: "JPN", countryName: "Japan", score: 91, highlight: "JISHA drives comprehensive industry safety standards and certification" },
    { isoCode: "AUS", countryName: "Australia", score: 88, highlight: "Safe Work Australia provides national policy coordination excellence" },
  ],
  "enforcement-capacity": [
    { isoCode: "SGP", countryName: "Singapore", score: 96, highlight: "Highest inspector density globally with technology-enabled enforcement" },
    { isoCode: "GBR", countryName: "United Kingdom", score: 90, highlight: "HSE provides comprehensive coverage with sector-specific expertise" },
    { isoCode: "CAN", countryName: "Canada", score: 87, highlight: "Provincial enforcement excellence with federal coordination" },
  ],
  "strategic-planning": [
    { isoCode: "KOR", countryName: "South Korea", score: 93, highlight: "KOSHA leads strategic OH planning with measurable 5-year targets" },
    { isoCode: "DEU", countryName: "Germany", score: 91, highlight: "Joint Declaration on OH with clear targets and monitoring" },
    { isoCode: "NOR", countryName: "Norway", score: 88, highlight: "Tripartite IA Agreement with specific outcome targets" },
  ],
  "exposure-standards": [
    { isoCode: "DEU", countryName: "Germany", score: 95, highlight: "MAK Commission sets science-based OELs with regular updates" },
    { isoCode: "USA", countryName: "United States", score: 92, highlight: "OSHA PELs with ACGIH TLV recommendations for comprehensive coverage" },
    { isoCode: "JPN", countryName: "Japan", score: 89, highlight: "Strict carcinogen controls with mandatory substitution requirements" },
  ],
  "risk-assessment": [
    { isoCode: "NLD", countryName: "Netherlands", score: 94, highlight: "RI&E system with mandatory certified assessments for all employers" },
    { isoCode: "GBR", countryName: "United Kingdom", score: 91, highlight: "Proportionate risk assessment framework with sector guidance" },
    { isoCode: "DNK", countryName: "Denmark", score: 88, highlight: "APV system integrated with workplace assessment tools" },
  ],
  "prevention-infrastructure": [
    { isoCode: "FIN", countryName: "Finland", score: 96, highlight: "Universal OH service access including SMEs through shared services" },
    { isoCode: "FRA", countryName: "France", score: 92, highlight: "Mandatory médecine du travail coverage for all workers" },
    { isoCode: "BEL", countryName: "Belgium", score: 89, highlight: "External prevention services ensure universal access" },
  ],
  "safety-outcomes": [
    { isoCode: "GBR", countryName: "United Kingdom", score: 95, highlight: "Among lowest fatality rates globally with sustained improvement" },
    { isoCode: "NLD", countryName: "Netherlands", score: 93, highlight: "Consistent injury rate reduction over two decades" },
    { isoCode: "SWE", countryName: "Sweden", score: 91, highlight: "Vision Zero approach with excellent outcome tracking" },
  ],
  "surveillance-architecture": [
    { isoCode: "FIN", countryName: "Finland", score: 96, highlight: "FIOH surveillance system serves as global benchmark for disease detection" },
    { isoCode: "KOR", countryName: "South Korea", score: 93, highlight: "KOSHA digital surveillance platform with real-time analytics" },
    { isoCode: "DEU", countryName: "Germany", score: 90, highlight: "BK notification system with comprehensive disease registry" },
  ],
  "detection-capacity": [
    { isoCode: "FIN", countryName: "Finland", score: 95, highlight: "Highest occupational disease recognition rates globally" },
    { isoCode: "DNK", countryName: "Denmark", score: 92, highlight: "Strong physician training in occupational medicine attribution" },
    { isoCode: "SWE", countryName: "Sweden", score: 89, highlight: "Integrated health and work data enabling attribution" },
  ],
  "data-quality": [
    { isoCode: "FIN", countryName: "Finland", score: 96, highlight: "Comprehensive data quality with policy integration excellence" },
    { isoCode: "NOR", countryName: "Norway", score: 93, highlight: "NOA registry with high completeness and regular publication" },
    { isoCode: "DNK", countryName: "Denmark", score: 91, highlight: "Danish Working Environment Authority data excellence" },
  ],
  "vulnerable-populations": [
    { isoCode: "ESP", countryName: "Spain", score: 88, highlight: "Progressive migrant worker inclusion and informal economy programs" },
    { isoCode: "PRT", countryName: "Portugal", score: 85, highlight: "ACT coverage extension to vulnerable worker populations" },
    { isoCode: "ITA", countryName: "Italy", score: 83, highlight: "INAIL programs for agricultural and informal workers" },
  ],
  "payer-architecture": [
    { isoCode: "DEU", countryName: "Germany", score: 96, highlight: "Berufsgenossenschaften model with universal coverage and prevention incentives" },
    { isoCode: "AUT", countryName: "Austria", score: 93, highlight: "AUVA combines insurance with prevention excellence" },
    { isoCode: "CHE", countryName: "Switzerland", score: 91, highlight: "Suva model with comprehensive coverage and rehabilitation" },
  ],
  "benefit-adequacy": [
    { isoCode: "DEU", countryName: "Germany", score: 95, highlight: "Full wage replacement with comprehensive medical coverage" },
    { isoCode: "NOR", countryName: "Norway", score: 93, highlight: "100% income replacement during rehabilitation period" },
    { isoCode: "SWE", countryName: "Sweden", score: 91, highlight: "Strong benefit adequacy with vocational rehabilitation support" },
  ],
  "rehabilitation-chain": [
    { isoCode: "DEU", countryName: "Germany", score: 96, highlight: "BG clinics provide integrated medical and vocational rehabilitation" },
    { isoCode: "CAN", countryName: "Canada", score: 93, highlight: "Provincial WCB return-to-work programs with case management" },
    { isoCode: "AUS", countryName: "Australia", score: 90, highlight: "Early intervention RTW schemes with employer engagement" },
  ],
  "recovery-outcomes": [
    { isoCode: "DEU", countryName: "Germany", score: 94, highlight: "85%+ return-to-work rates with sustained employment outcomes" },
    { isoCode: "DNK", countryName: "Denmark", score: 92, highlight: "Flexicurity model enables job transitions during recovery" },
    { isoCode: "NLD", countryName: "Netherlands", score: 90, highlight: "Wet Poortwachter ensures systematic RTW support" },
  ],
  "default": [
    { isoCode: "DEU", countryName: "Germany", score: 93, highlight: "Comprehensive framework across all dimensions" },
    { isoCode: "FIN", countryName: "Finland", score: 91, highlight: "Strong institutional capacity and surveillance" },
    { isoCode: "SGP", countryName: "Singapore", score: 89, highlight: "Innovative enforcement and technology adoption" },
  ],
};

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

  const pillarDef = PILLAR_DEFINITIONS[pillarId];
  const question = getQuestionById(pillarId, questionId);
  const Icon = pillarDef?.icon;
  
  // Get leaders for this question
  const leaders = GLOBAL_LEADERS[questionId] || GLOBAL_LEADERS["default"];

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

  // Handle leader click - navigate to best practices
  const handleLeaderClick = (isoCode: string) => {
    onClose();
    // Navigate to best practices page
    navigate("/deep-dive");
  };

  if (!question || !pillarDef) return null;

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
            className="fixed inset-3 md:inset-6 lg:inset-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
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

                <div className="flex items-center gap-3">
                  {/* AI Deep Analysis Badge */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-purple-400 font-semibold">Deep Analysis</span>
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Column - Report Content (3 cols) */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Strategic Question */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-xl bg-slate-800/50 border border-white/10"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Target className={cn("w-5 h-5", pillarDef.color)} />
                        <h3 className="text-lg font-semibold text-white">Strategic Question</h3>
                      </div>
                      <p className="text-white/90 text-lg leading-relaxed">
                        {question.question}
                      </p>
                    </motion.div>

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
                          <h4 className="text-lg font-semibold text-white mb-2">Generating Deep Analysis</h4>
                          <p className="text-white/50 text-sm max-w-md">
                            Our AI analyst is researching Saudi Arabia's position, global best practices, 
                            and strategic recommendations...
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Analysis Content */}
                    {!isLoading && analysis && (
                      <>
                        {/* Executive Summary - Header Answer */}
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

                      <div className="space-y-2">
                        {leaders.map((leader, index) => (
                          <motion.button
                            key={leader.isoCode}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            onClick={() => handleLeaderClick(leader.isoCode)}
                            className="w-full text-left p-3 rounded-lg bg-slate-700/30 border border-white/5 hover:bg-slate-700/60 hover:border-white/20 transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn(
                                "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                                index === 0 ? "bg-amber-500/20 text-amber-400" :
                                index === 1 ? "bg-slate-400/20 text-slate-300" :
                                "bg-orange-700/20 text-orange-400"
                              )}>
                                {index + 1}
                              </span>
                              <CountryFlag
                                isoCode={leader.isoCode}
                                size="sm"
                                className="rounded shadow-sm"
                              />
                              <span className="font-medium text-white text-sm flex-1">{leader.countryName}</span>
                              <span className={cn("text-xs font-bold", pillarDef.color)}>
                                {leader.score}%
                              </span>
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                              {leader.highlight}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400/70 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>View Best Practices</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </motion.button>
                        ))}
                      </div>

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
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default KSADeepAnalysisModal;
