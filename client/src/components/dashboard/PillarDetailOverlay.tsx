/**
 * Pillar Detail Overlay Component
 * 
 * Full-screen overlay showing 4 strategic questions for a pillar.
 * Includes best practice insights and navigation to full analysis.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ExternalLink, Award, Lightbulb, Target, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { PILLAR_DEFINITIONS, type PillarId, type StrategicQuestion } from "../../lib/strategicQuestions";
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

// Best practice leaders for each pillar (static data)
const BEST_PRACTICE_LEADERS: Record<PillarId, Array<{
  country: string;
  flag: string;
  insight: string;
}>> = {
  governance: [
    { country: "Germany", flag: "🇩🇪", insight: "Comprehensive dual system with employer liability and strong tripartite governance" },
    { country: "Sweden", flag: "🇸🇪", insight: "Work Environment Authority with broad mandate and high inspector density" },
    { country: "Australia", flag: "🇦🇺", insight: "Safe Work Australia as national policy body with state enforcement" },
  ],
  "hazard-control": [
    { country: "Netherlands", flag: "🇳🇱", insight: "Risk-based certification system for hazardous industries" },
    { country: "Singapore", flag: "🇸🇬", insight: "WSH Council driving industry-led safety innovation" },
    { country: "Japan", flag: "🇯🇵", insight: "Mandatory OSHMS with sector-specific guidelines" },
  ],
  vigilance: [
    { country: "Finland", flag: "🇫🇮", insight: "FIOH as global model for occupational disease surveillance" },
    { country: "South Korea", flag: "🇰🇷", insight: "KOSHA's integrated digital surveillance platform" },
    { country: "France", flag: "🇫🇷", insight: "Mandatory periodic examinations with exposure tracking" },
  ],
  restoration: [
    { country: "Germany", flag: "🇩🇪", insight: "Berufsgenossenschaften combining prevention with rehabilitation" },
    { country: "Canada", flag: "🇨🇦", insight: "Provincial WCBs with strong return-to-work mandates" },
    { country: "Denmark", flag: "🇩🇰", insight: "Flexicurity model supporting job transitions during recovery" },
  ],
};

interface QuestionCardProps {
  question: StrategicQuestion;
  index: number;
  pillarColor: string;
  pillarBgColor: string;
  onClick: () => void;
  isExpanded: boolean;
}

function QuestionCard({ question, index, pillarColor, pillarBgColor, onClick, isExpanded }: QuestionCardProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        "bg-slate-800/50 border-white/10",
        "hover:border-white/20 hover:bg-slate-800/80",
        isExpanded && "ring-2 ring-cyan-500/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Question number */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
          pillarBgColor,
          pillarColor
        )}>
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            {question.title}
            <ChevronRight className={cn(
              "w-4 h-4 text-white/40 transition-transform",
              isExpanded && "rotate-90"
            )} />
          </h4>
          
          {/* Question */}
          <p className="text-xs text-white/60 leading-relaxed">
            {question.question}
          </p>
          
          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-white/10"
              >
                <p className="text-xs text-white/50 mb-3">{question.description}</p>
                
                {/* Assessment Criteria */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-emerald-400/80">{question.assessmentCriteria.complete}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-amber-400/80">{question.assessmentCriteria.partial}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-red-400/80">{question.assessmentCriteria.gap}</p>
                  </div>
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
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  
  if (!pillar) return null;
  
  const pillarDef = PILLAR_DEFINITIONS[pillar];
  const Icon = pillarDef.icon;
  const leaders = BEST_PRACTICE_LEADERS[pillar];
  
  const scoreField = {
    governance: "governance_score",
    "hazard-control": "pillar1_score",
    vigilance: "pillar2_score",
    restoration: "pillar3_score",
  }[pillar] as keyof typeof country;
  
  const score = country[scoreField] as number | null;

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
          
          {/* Overlay Panel */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-16 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-3xl border-t border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 px-6 py-4 border-b border-white/10",
              pillarDef.bgColor
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", pillarDef.bgColor, "border", pillarDef.borderColor)}>
                    <Icon className={cn("w-6 h-6", pillarDef.color)} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{pillarDef.name}</h2>
                    <p className="text-sm text-white/60">{pillarDef.subtitle} • {country.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Score badge */}
                  {score !== null && (
                    <div className={cn(
                      "px-4 py-2 rounded-xl border",
                      pillarDef.bgColor,
                      pillarDef.borderColor
                    )}>
                      <p className="text-[10px] text-white/50 uppercase">Score</p>
                      <p className={cn("text-2xl font-bold", pillarDef.color)}>{score.toFixed(0)}%</p>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-white/60" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Questions Column */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Key Strategic Questions</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {pillarDef.questions.map((question, index) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        pillarColor={pillarDef.color}
                        pillarBgColor={pillarDef.bgColor}
                        onClick={() => setExpandedQuestion(
                          expandedQuestion === question.id ? null : question.id
                        )}
                        isExpanded={expandedQuestion === question.id}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Best Practices Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-semibold text-white">Best Practice Leaders</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {leaders.map((leader, index) => (
                      <motion.div
                        key={leader.country}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="p-4 rounded-xl bg-slate-800/50 border border-white/10"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{leader.flag}</span>
                          <span className="font-medium text-white">{leader.country}</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {leader.insight}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Key Insight */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className={cn(
                      "p-4 rounded-xl border",
                      pillarDef.bgColor,
                      pillarDef.borderColor
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className={cn("w-4 h-4", pillarDef.color)} />
                      <span className={cn("text-sm font-medium", pillarDef.color)}>Key Insight</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {pillarDef.description}. Analyzing these strategic questions reveals how {country.name} compares to global leaders in this dimension.
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 bg-slate-900/50">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <p className="text-sm text-white/50">
                  Click questions above to see assessment criteria
                </p>
                
                <button
                  onClick={() => onNavigateToFullPage(pillar)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                    "bg-gradient-to-r",
                    pillar === "governance" ? "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400" :
                    pillar === "hazard-control" ? "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400" :
                    pillar === "vigilance" ? "from-teal-500/20 to-teal-600/20 border-teal-500/30 text-teal-400" :
                    "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
                    "border hover:shadow-lg"
                  )}
                >
                  <span>View Full Analysis</span>
                  <ArrowRight className="w-4 h-4" />
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
