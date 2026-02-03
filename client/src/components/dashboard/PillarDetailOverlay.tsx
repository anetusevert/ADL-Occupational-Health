/**
 * Pillar Detail Overlay Component
 * 
 * Full-screen overlay showing 4 strategic questions for a pillar.
 * Includes best practice insights and navigation to full analysis.
 * 
 * Features:
 * - Dynamic global leaders per selected question
 * - Real country flags using CountryFlag component
 * - Click-through navigation to best practices page
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Award, Lightbulb, Target, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { PILLAR_DEFINITIONS, type PillarId, type StrategicQuestion } from "../../lib/strategicQuestions";
import { CountryFlag } from "../CountryFlag";
import type { PillarType } from "../../pages/CountryDashboard";

interface PillarDetailOverlayProps {
  isOpen: boolean;
  pillar: PillarType | null;
  country: {
    iso_code: string;
    name: string;
    governance_score?: number | null;
    pillar1_score?: number | null;
    pillar2_score?: number | null;
    pillar3_score?: number | null;
  };
  onClose: () => void;
  onNavigateToFullPage: (pillar: PillarType) => void;
}

// Global leaders with ISO codes for each strategic question
interface GlobalLeader {
  isoCode: string;
  countryName: string;
  score: number;
  insight: string;
}

// Leaders data by question with proper ISO codes
const GLOBAL_LEADERS_BY_QUESTION: Record<string, GlobalLeader[]> = {
  // GOVERNANCE QUESTIONS
  "legal-foundation": [
    { isoCode: "DEU", countryName: "Germany", score: 95, insight: "Comprehensive dual system with employer liability insurance and strong legal framework" },
    { isoCode: "SWE", countryName: "Sweden", score: 92, insight: "Work Environment Authority with broad mandate and ILO convention leadership" },
    { isoCode: "NLD", countryName: "Netherlands", score: 89, insight: "Strong tripartite governance model with systematic risk assessment requirements" },
  ],
  "institutional-architecture": [
    { isoCode: "FIN", countryName: "Finland", score: 94, insight: "FIOH serves as the global benchmark for occupational health research institutions" },
    { isoCode: "JPN", countryName: "Japan", score: 91, insight: "JISHA drives comprehensive industry safety standards and certification" },
    { isoCode: "AUS", countryName: "Australia", score: 88, insight: "Safe Work Australia provides national policy coordination excellence" },
  ],
  "enforcement-capacity": [
    { isoCode: "SGP", countryName: "Singapore", score: 96, insight: "Highest inspector density globally with technology-enabled enforcement" },
    { isoCode: "GBR", countryName: "United Kingdom", score: 90, insight: "HSE provides comprehensive coverage with sector-specific expertise" },
    { isoCode: "CAN", countryName: "Canada", score: 87, insight: "Provincial enforcement excellence with federal coordination" },
  ],
  "strategic-planning": [
    { isoCode: "KOR", countryName: "South Korea", score: 93, insight: "KOSHA leads strategic OH planning with measurable 5-year targets" },
    { isoCode: "DEU", countryName: "Germany", score: 91, insight: "Joint Declaration on OH with clear targets and monitoring" },
    { isoCode: "NOR", countryName: "Norway", score: 88, insight: "Tripartite IA Agreement with specific outcome targets" },
  ],
  // HAZARD CONTROL QUESTIONS
  "exposure-standards": [
    { isoCode: "DEU", countryName: "Germany", score: 95, insight: "MAK Commission sets science-based OELs with regular updates" },
    { isoCode: "USA", countryName: "United States", score: 92, insight: "OSHA PELs with ACGIH TLV recommendations for comprehensive coverage" },
    { isoCode: "JPN", countryName: "Japan", score: 89, insight: "Strict carcinogen controls with mandatory substitution requirements" },
  ],
  "risk-assessment": [
    { isoCode: "NLD", countryName: "Netherlands", score: 94, insight: "RI&E system with mandatory certified assessments for all employers" },
    { isoCode: "GBR", countryName: "United Kingdom", score: 91, insight: "Proportionate risk assessment framework with sector guidance" },
    { isoCode: "DNK", countryName: "Denmark", score: 88, insight: "APV system integrated with workplace assessment tools" },
  ],
  "prevention-infrastructure": [
    { isoCode: "FIN", countryName: "Finland", score: 96, insight: "Universal OH service access including SMEs through shared services" },
    { isoCode: "FRA", countryName: "France", score: 92, insight: "Mandatory médecine du travail coverage for all workers" },
    { isoCode: "BEL", countryName: "Belgium", score: 89, insight: "External prevention services ensure universal access" },
  ],
  "safety-outcomes": [
    { isoCode: "GBR", countryName: "United Kingdom", score: 95, insight: "Among lowest fatality rates globally with sustained improvement" },
    { isoCode: "NLD", countryName: "Netherlands", score: 93, insight: "Consistent injury rate reduction over two decades" },
    { isoCode: "SWE", countryName: "Sweden", score: 91, insight: "Vision Zero approach with excellent outcome tracking" },
  ],
  // VIGILANCE QUESTIONS
  "surveillance-architecture": [
    { isoCode: "FIN", countryName: "Finland", score: 96, insight: "FIOH surveillance system serves as global benchmark for disease detection" },
    { isoCode: "KOR", countryName: "South Korea", score: 93, insight: "KOSHA digital surveillance platform with real-time analytics" },
    { isoCode: "DEU", countryName: "Germany", score: 90, insight: "BK notification system with comprehensive disease registry" },
  ],
  "detection-capacity": [
    { isoCode: "FIN", countryName: "Finland", score: 95, insight: "Highest occupational disease recognition rates globally" },
    { isoCode: "DNK", countryName: "Denmark", score: 92, insight: "Strong physician training in occupational medicine attribution" },
    { isoCode: "SWE", countryName: "Sweden", score: 89, insight: "Integrated health and work data enabling attribution" },
  ],
  "data-quality": [
    { isoCode: "FIN", countryName: "Finland", score: 96, insight: "Comprehensive data quality with policy integration excellence" },
    { isoCode: "NOR", countryName: "Norway", score: 93, insight: "NOA registry with high completeness and regular publication" },
    { isoCode: "DNK", countryName: "Denmark", score: 91, insight: "Danish Working Environment Authority data excellence" },
  ],
  "vulnerable-populations": [
    { isoCode: "ESP", countryName: "Spain", score: 88, insight: "Progressive migrant worker inclusion and informal economy programs" },
    { isoCode: "PRT", countryName: "Portugal", score: 85, insight: "ACT coverage extension to vulnerable worker populations" },
    { isoCode: "ITA", countryName: "Italy", score: 83, insight: "INAIL programs for agricultural and informal workers" },
  ],
  // RESTORATION QUESTIONS
  "payer-architecture": [
    { isoCode: "DEU", countryName: "Germany", score: 96, insight: "Berufsgenossenschaften model with universal coverage and prevention incentives" },
    { isoCode: "AUT", countryName: "Austria", score: 93, insight: "AUVA combines insurance with prevention excellence" },
    { isoCode: "CHE", countryName: "Switzerland", score: 91, insight: "Suva model with comprehensive coverage and rehabilitation" },
  ],
  "benefit-adequacy": [
    { isoCode: "DEU", countryName: "Germany", score: 95, insight: "Full wage replacement with comprehensive medical coverage" },
    { isoCode: "NOR", countryName: "Norway", score: 93, insight: "100% income replacement during rehabilitation period" },
    { isoCode: "SWE", countryName: "Sweden", score: 91, insight: "Strong benefit adequacy with vocational rehabilitation support" },
  ],
  "rehabilitation-chain": [
    { isoCode: "DEU", countryName: "Germany", score: 96, insight: "BG clinics provide integrated medical and vocational rehabilitation" },
    { isoCode: "CAN", countryName: "Canada", score: 93, insight: "Provincial WCB return-to-work programs with case management" },
    { isoCode: "AUS", countryName: "Australia", score: 90, insight: "Early intervention RTW schemes with employer engagement" },
  ],
  "recovery-outcomes": [
    { isoCode: "DEU", countryName: "Germany", score: 94, insight: "85%+ return-to-work rates with sustained employment outcomes" },
    { isoCode: "DNK", countryName: "Denmark", score: 92, insight: "Flexicurity model enables job transitions during recovery" },
    { isoCode: "NLD", countryName: "Netherlands", score: 90, insight: "Wet Poortwachter ensures systematic RTW support" },
  ],
};

// Default leaders per pillar (used when no question is selected)
const DEFAULT_LEADERS_BY_PILLAR: Record<PillarId, GlobalLeader[]> = {
  governance: [
    { isoCode: "DEU", countryName: "Germany", score: 95, insight: "Comprehensive dual system with employer liability and strong tripartite governance" },
    { isoCode: "SWE", countryName: "Sweden", score: 92, insight: "Work Environment Authority with broad mandate and high inspector density" },
    { isoCode: "AUS", countryName: "Australia", score: 88, insight: "Safe Work Australia as national policy body with state enforcement" },
  ],
  "hazard-control": [
    { isoCode: "NLD", countryName: "Netherlands", score: 94, insight: "Risk-based certification system for hazardous industries" },
    { isoCode: "SGP", countryName: "Singapore", score: 92, insight: "WSH Council driving industry-led safety innovation" },
    { isoCode: "JPN", countryName: "Japan", score: 89, insight: "Mandatory OSHMS with sector-specific guidelines" },
  ],
  vigilance: [
    { isoCode: "FIN", countryName: "Finland", score: 96, insight: "FIOH as global model for occupational disease surveillance" },
    { isoCode: "KOR", countryName: "South Korea", score: 93, insight: "KOSHA's integrated digital surveillance platform" },
    { isoCode: "FRA", countryName: "France", score: 90, insight: "Mandatory periodic examinations with exposure tracking" },
  ],
  restoration: [
    { isoCode: "DEU", countryName: "Germany", score: 96, insight: "Berufsgenossenschaften combining prevention with rehabilitation" },
    { isoCode: "CAN", countryName: "Canada", score: 93, insight: "Provincial WCBs with strong return-to-work mandates" },
    { isoCode: "DNK", countryName: "Denmark", score: 91, insight: "Flexicurity model supporting job transitions during recovery" },
  ],
};

interface QuestionCardProps {
  question: StrategicQuestion;
  index: number;
  pillarColor: string;
  pillarBgColor: string;
  onClick: () => void;
  isExpanded: boolean;
  isSelected: boolean;
}

function QuestionCard({ question, index, pillarColor, pillarBgColor, onClick, isExpanded, isSelected }: QuestionCardProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all",
        "bg-slate-800/50 border-white/10",
        "hover:border-white/20 hover:bg-slate-800/80",
        isExpanded && "ring-1 ring-cyan-500/50",
        isSelected && "ring-1 ring-amber-500/50 bg-slate-800/80"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Question number - Compact */}
        <div className={cn(
          "flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center font-bold text-xs sm:text-sm",
          pillarBgColor,
          pillarColor
        )}>
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title - Compact */}
          <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1">
            <span className="truncate">{question.title}</span>
            <ChevronRight className={cn(
              "w-3 h-3 text-white/40 transition-transform flex-shrink-0",
              isExpanded && "rotate-90"
            )} />
          </h4>
          
          {/* Question - Shortened on mobile */}
          <p className="text-[10px] sm:text-xs text-white/60 leading-snug line-clamp-2">
            {question.question}
          </p>
          
          {/* Expanded content - Compact */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 pt-2 border-t border-white/10"
              >
                {/* Assessment Criteria - Inline */}
                <div className="flex flex-wrap gap-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Complete
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Partial
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Gap
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}

export function PillarDetailOverlay({
  isOpen,
  pillar,
  country,
  onClose,
  onNavigateToFullPage,
}: PillarDetailOverlayProps) {
  const navigate = useNavigate();
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  
  if (!pillar) return null;
  
  const pillarDef = PILLAR_DEFINITIONS[pillar];
  const Icon = pillarDef.icon;
  
  // Get leaders based on selected question or default to pillar leaders
  const leaders = selectedQuestion 
    ? GLOBAL_LEADERS_BY_QUESTION[selectedQuestion] || DEFAULT_LEADERS_BY_PILLAR[pillar]
    : DEFAULT_LEADERS_BY_PILLAR[pillar];
  
  const scoreField = {
    governance: "governance_score",
    "hazard-control": "pillar1_score",
    vigilance: "pillar2_score",
    restoration: "pillar3_score",
  }[pillar] as keyof typeof country;
  
  const score = country[scoreField] as number | null;

  // Handle question click - expands and selects for dynamic leaders
  const handleQuestionClick = (questionId: string) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
    }
    setSelectedQuestion(questionId);
  };

  // Handle leader click - navigate to best practices page
  const handleLeaderClick = (isoCode: string) => {
    onClose();
    navigate("/deep-dive");
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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />
          
          {/* Overlay Panel - Responsive */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-12 sm:top-14 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-2xl sm:rounded-t-3xl border-t border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header - Compact */}
            <div className={cn(
              "flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10",
              pillarDef.bgColor
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl", pillarDef.bgColor, "border", pillarDef.borderColor)}>
                    <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", pillarDef.color)} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base md:text-lg font-bold text-white">{pillarDef.name}</h2>
                    <p className="text-[10px] sm:text-xs text-white/60 truncate">{country.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Score badge - Compact */}
                  {score !== null && (
                    <div className={cn(
                      "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border",
                      pillarDef.bgColor,
                      pillarDef.borderColor
                    )}>
                      <p className={cn("text-lg sm:text-xl font-bold", pillarDef.color)}>{score.toFixed(0)}%</p>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content - Responsive grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Questions Column - 2x2 grid on mobile */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs sm:text-sm font-semibold text-white">Strategic Questions</h3>
                    <span className="text-[9px] sm:text-[10px] text-white/40 ml-auto">(Click to explore)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pillarDef.questions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        pillarColor={pillarDef.color}
                        pillarBgColor={pillarDef.bgColor}
                        onClick={() => handleQuestionClick(question.id)}
                        isExpanded={expandedQuestion === question.id}
                        isSelected={selectedQuestion === question.id}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Best Practices Column - Compact */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs sm:text-sm font-semibold text-white">Leaders</h3>
                    {selectedQuestion && (
                      <span className="text-[9px] text-amber-400/80 ml-auto truncate max-w-[100px]">
                        {pillarDef.questions.find(q => q.id === selectedQuestion)?.title}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {leaders.map((leader, index) => (
                      <motion.button
                        key={`${leader.isoCode}-${selectedQuestion || 'default'}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        onClick={() => handleLeaderClick(leader.isoCode)}
                        className="w-full text-left p-2 sm:p-2.5 rounded-lg bg-slate-800/50 border border-white/10 hover:bg-slate-800/80 hover:border-white/20 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                            index === 0 ? "bg-amber-500/20 text-amber-400" :
                            index === 1 ? "bg-slate-400/20 text-slate-300" :
                            "bg-orange-700/20 text-orange-400"
                          )}>
                            {index + 1}
                          </span>
                          <CountryFlag
                            isoCode={leader.isoCode}
                            size="sm"
                            className="rounded shadow-sm flex-shrink-0"
                          />
                          <span className="text-xs font-medium text-white truncate">{leader.countryName}</span>
                          <span className={cn("ml-auto text-xs font-bold flex-shrink-0", pillarDef.color)}>
                            {leader.score}%
                          </span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-white/50 leading-snug mt-1 line-clamp-2">
                          {leader.insight}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                  
                  {/* Key Insight - Hidden on mobile */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={cn(
                      "hidden sm:block mt-2 p-2.5 rounded-lg border",
                      pillarDef.bgColor,
                      pillarDef.borderColor
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lightbulb className={cn("w-3.5 h-3.5", pillarDef.color)} />
                      <span className={cn("text-[10px] font-medium", pillarDef.color)}>Key Insight</span>
                    </div>
                    <p className="text-[9px] text-white/60 leading-snug line-clamp-2">
                      {pillarDef.description}
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Footer - Compact */}
            <div className="flex-shrink-0 px-3 sm:px-4 py-2 border-t border-white/10 bg-slate-900/50">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <p className="text-[9px] sm:text-xs text-white/40 hidden sm:block">
                  Click questions for details
                </p>
                
                <button
                  onClick={() => onNavigateToFullPage(pillar)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto",
                    "bg-gradient-to-r",
                    pillar === "governance" ? "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400" :
                    pillar === "hazard-control" ? "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400" :
                    pillar === "vigilance" ? "from-teal-500/20 to-teal-600/20 border-teal-500/30 text-teal-400" :
                    "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
                    "border hover:shadow-lg"
                  )}
                >
                  <span>Full Analysis</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PillarDetailOverlay;
