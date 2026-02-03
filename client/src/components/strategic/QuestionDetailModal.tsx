/**
 * Arthur D. Little - Global Health Platform
 * Question Detail Modal Component - Premium Redesign
 * 
 * A premium 2/3-width centered modal with:
 * - Staged Framer Motion reveal animations
 * - Question loader with animated entry
 * - Leaders with flags on the LEFT
 * - Scrollable document reader on the RIGHT
 * - Linear positioning bar showing country's standing
 * - Stacked sub-modal for best practice detail
 * 
 * Version: 3.0.0 - Premium Redesign
 * Build: 2026-02-03
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Database,
  Globe2,
  ExternalLink,
  BookOpen,
  Trophy,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CountryFlag } from "../CountryFlag";
import type { StrategicQuestion } from "../../lib/strategicQuestions";
import type { QuestionAnswer, BestPracticeLeader } from "./StrategicQuestionCard";

// ============================================================================
// TYPES
// ============================================================================

interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: StrategicQuestion;
  answer: QuestionAnswer;
  bestPractices: BestPracticeLeader[];
  questionIndex: number;
  pillarName: string;
  pillarColor: string;
  pillarBgColor: string;
  pillarBorderColor: string;
  countryName: string;
  countryIso?: string;
  questionId?: string;
  onLeaderClick?: (leader: BestPracticeLeader) => void;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 40 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      type: "spring",
      damping: 25,
      stiffness: 300,
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
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.2, duration: 0.5, ease: "easeOut" }
  }
};

const loaderVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { delay: 0.4, duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { delay: 0.6, duration: 0.4, staggerChildren: 0.1 }
  }
};

const leaderCardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({ 
    opacity: 1, 
    x: 0,
    transition: { delay: 0.7 + i * 0.1, duration: 0.3, ease: "easeOut" }
  })
};

const analysisVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { delay: 0.7, duration: 0.4, ease: "easeOut" }
  }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: QuestionAnswer["status"] }) {
  const config = {
    complete: {
      icon: CheckCircle2,
      text: "Complete",
      bg: "bg-emerald-500/20",
      border: "border-emerald-500/30",
      color: "text-emerald-400",
    },
    partial: {
      icon: AlertCircle,
      text: "Partial",
      bg: "bg-amber-500/20",
      border: "border-amber-500/30",
      color: "text-amber-400",
    },
    gap: {
      icon: XCircle,
      text: "Gap",
      bg: "bg-red-500/20",
      border: "border-red-500/30",
      color: "text-red-400",
    },
  };

  const { icon: Icon, text, bg, border, color } = config[status];

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
      bg, border, color
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span>{text}</span>
    </div>
  );
}

function CitationBadge({ citation }: { citation: QuestionAnswer["citations"][0] }) {
  const Icon = citation.source === "database" ? Database : Globe2;
  const color = citation.source === "database" ? "text-cyan-400" : "text-purple-400";
  const bg = citation.source === "database" ? "bg-cyan-500/10" : "bg-purple-500/10";
  const border = citation.source === "database" ? "border-cyan-500/20" : "border-purple-500/20";

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] border",
      bg, border, color
    )}>
      <Icon className="w-3 h-3" />
      <span className="font-medium">{citation.reference}</span>
    </span>
  );
}

// Positioning Bar - Shows where the current country stands relative to leaders
function PositioningBar({ 
  leaders, 
  currentCountry,
  pillarColor 
}: { 
  leaders: BestPracticeLeader[];
  currentCountry: { name: string; score: number };
  pillarColor: string;
}) {
  const position = currentCountry.score;
  const bestScore = leaders.length > 0 ? Math.max(...leaders.map(l => l.score)) : 100;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.4 }}
      className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-white/5"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
          Relative Position
        </span>
        <span className={cn("text-xs font-bold", pillarColor)}>
          {currentCountry.score.toFixed(0)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-3 bg-gradient-to-r from-red-500/30 via-amber-500/30 to-emerald-500/30 rounded-full overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-emerald-500/10" />
        
        {/* Leader markers */}
        {leaders.slice(0, 3).map((leader, idx) => (
          <motion.div
            key={leader.country_iso}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 + idx * 0.1 }}
            className="absolute top-0 h-full w-0.5 bg-emerald-400/80"
            style={{ left: `${leader.score}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400 whitespace-nowrap">
              {idx === 0 && "Best"}
            </div>
          </motion.div>
        ))}
        
        {/* Current country marker */}
        <motion.div
          initial={{ scale: 0, left: "0%" }}
          animate={{ scale: 1, left: `${position}%` }}
          transition={{ delay: 1.5, duration: 0.6, type: "spring", damping: 15 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg border-2 border-amber-400 z-10"
        >
          <div className="absolute inset-0 rounded-full animate-ping bg-amber-400/40" />
        </motion.div>
        
        {/* Filled portion up to current country */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${position}%` }}
          transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
          className={cn(
            "absolute top-0 h-full rounded-full",
            position >= 70 ? "bg-gradient-to-r from-emerald-600/60 to-emerald-500/60" :
            position >= 40 ? "bg-gradient-to-r from-amber-600/60 to-amber-500/60" :
            "bg-gradient-to-r from-red-600/60 to-red-500/60"
          )}
        />
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-[9px] text-white/40">
        <span>0%</span>
        <span className="text-white/60 font-medium">{currentCountry.name}</span>
        <span>100%</span>
      </div>
    </motion.div>
  );
}

// Animated Loader with question
function QuestionLoader({ question, pillarColor }: { question: string; pillarColor: string }) {
  return (
    <motion.div 
      variants={loaderVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col items-center justify-center py-8"
    >
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1.5, repeat: Infinity }
        }}
        className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", "bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10")}
      >
        <Sparkles className={cn("w-6 h-6", pillarColor)} />
      </motion.div>
      <motion.p 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-sm text-white/60"
      >
        Analyzing...
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuestionDetailModal({
  isOpen,
  onClose,
  question,
  answer,
  bestPractices,
  questionIndex,
  pillarName,
  pillarColor,
  pillarBgColor,
  pillarBorderColor,
  countryName,
  countryIso,
  questionId,
  onLeaderClick,
}: QuestionDetailModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [selectedLeaderForSubModal, setSelectedLeaderForSubModal] = useState<BestPracticeLeader | null>(null);

  // Staged reveal - show content after question animates
  useEffect(() => {
    if (isOpen) {
      setShowContent(false);
      const timer = setTimeout(() => setShowContent(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (selectedLeaderForSubModal) {
          setSelectedLeaderForSubModal(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, selectedLeaderForSubModal]);

  // Handle leader click - either use callback or open sub-modal
  const handleLeaderClick = (leader: BestPracticeLeader) => {
    if (onLeaderClick) {
      onLeaderClick(leader);
    } else {
      setSelectedLeaderForSubModal(leader);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
          {/* Backdrop with blur */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => {
              if (selectedLeaderForSubModal) {
                setSelectedLeaderForSubModal(null);
              } else {
                onClose();
              }
            }}
            className={cn(
              "absolute inset-0 backdrop-blur-md transition-colors",
              selectedLeaderForSubModal ? "bg-black/80" : "bg-black/70"
            )}
          />

          {/* Main Modal - 2/3 width, centered */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border shadow-2xl overflow-hidden",
              selectedLeaderForSubModal ? "opacity-50 scale-95 pointer-events-none" : "",
              "border-white/10"
            )}
          >
            {/* Glassmorphism border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            {/* Question Header - Animated entry at top */}
            <motion.div 
              variants={questionVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                "relative px-6 py-5 border-b",
                "bg-gradient-to-r from-slate-800/90 to-slate-900/90",
                pillarBorderColor
              )}
            >
              {/* Top row: Pillar info + Close */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    "text-lg font-bold",
                    pillarBgColor,
                    "border",
                    pillarBorderColor,
                    pillarColor
                  )}>
                    Q{questionIndex + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-semibold", pillarColor)}>
                        {pillarName}
                      </span>
                      <span className="text-white/30">•</span>
                      <span className="text-sm text-white/50">{countryName}</span>
                    </div>
                    <h3 className="text-sm text-white/70 font-medium">{question.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={answer.status} />
                  <div className={cn(
                    "text-2xl font-bold tabular-nums",
                    answer.score >= 70 ? "text-emerald-400" :
                    answer.score >= 40 ? "text-amber-400" : "text-red-400"
                  )}>
                    {answer.score.toFixed(0)}%
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </motion.button>
                </div>
              </div>
              
              {/* Strategic Question - Main focus */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className={cn(
                  "p-4 rounded-xl border",
                  pillarBgColor,
                  pillarBorderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <Target className={cn("w-5 h-5 mt-0.5 flex-shrink-0", pillarColor)} />
                  <p className="text-base text-white font-medium leading-relaxed">
                    {question.question}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Content Area */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {!showContent ? (
                  <QuestionLoader question={question.question} pillarColor={pillarColor} />
                ) : (
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-[280px_1fr] max-h-[55vh]"
                  >
                    {/* LEFT: Leaders with flags + Positioning bar */}
                    <motion.div 
                      variants={analysisVariants}
                      className="p-4 border-r border-white/5 bg-slate-800/30 overflow-y-auto"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">Global Leaders</h3>
                      </div>
                      
                      {/* Leader cards */}
                      <div className="space-y-2">
                        {bestPractices.slice(0, 3).map((leader, idx) => (
                          <motion.button
                            key={leader.country_iso}
                            custom={idx}
                            variants={leaderCardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleLeaderClick(leader)}
                            className={cn(
                              "w-full p-3 rounded-xl border text-left transition-all group",
                              "bg-slate-800/60 border-white/5",
                              "hover:bg-slate-700/60 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-2.5 mb-2">
                              {/* Rank badge */}
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0",
                                idx === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950" :
                                idx === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900" :
                                "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-950"
                              )}>
                                {idx + 1}
                              </div>
                              
                              {/* Flag */}
                              <CountryFlag
                                isoCode={leader.country_iso}
                                size="sm"
                                className="rounded shadow-sm flex-shrink-0 ring-1 ring-white/10"
                              />
                              
                              {/* Country name */}
                              <span className="text-sm font-medium text-white truncate flex-1">
                                {leader.country_name}
                              </span>
                              
                              {/* Score */}
                              <span className={cn("text-sm font-bold flex-shrink-0", pillarColor)}>
                                {leader.score}%
                              </span>
                            </div>
                            
                            {/* Key insight */}
                            <p className="text-[11px] text-white/50 line-clamp-2 leading-relaxed group-hover:text-white/70 transition-colors">
                              {leader.key_lesson}
                            </p>
                            
                            {/* Click indicator */}
                            <div className="flex items-center justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-white/40 flex items-center gap-1">
                                View details
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      
                      {/* Positioning Bar */}
                      <PositioningBar 
                        leaders={bestPractices} 
                        currentCountry={{ name: countryName, score: answer.score }}
                        pillarColor={pillarColor}
                      />
                    </motion.div>

                    {/* RIGHT: Scrollable Analysis Reader */}
                    <motion.div 
                      variants={analysisVariants}
                      className="p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
                    >
                      {/* Executive Summary Header */}
                      <div className="flex items-center gap-2 mb-4">
                        <BookOpen className={cn("w-4 h-4", pillarColor)} />
                        <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
                        <span className="text-[10px] text-white/40 ml-auto">
                          {answer.detailed.length} sections
                        </span>
                      </div>
                      
                      {/* Analysis Content - Document reader style */}
                      <div className="space-y-4 pr-2">
                        {/* Summary highlight */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                          className={cn(
                            "p-4 rounded-xl border-l-4",
                            pillarBorderColor.replace("border-", "border-l-"),
                            "bg-gradient-to-r from-slate-800/60 to-transparent"
                          )}
                        >
                          <p className="text-sm text-white/90 leading-relaxed font-medium">
                            {answer.summary}
                          </p>
                        </motion.div>
                        
                        {/* Strategic Analysis Section */}
                        <div className="mt-6">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-cyan-400" />
                            <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                              Strategic Analysis
                            </h4>
                          </div>
                          
                          {/* Analysis paragraphs */}
                          <div className="space-y-3">
                            {answer.detailed.map((para, i) => (
                              <motion.p 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 + i * 0.1 }}
                                className="text-sm text-white/70 leading-relaxed"
                              >
                                {para}
                              </motion.p>
                            ))}
                          </div>
                        </div>

                        {/* Citations */}
                        {answer.citations.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="pt-4 mt-4 border-t border-white/10"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                                Sources & Citations
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {answer.citations.slice(0, 8).map((citation, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 1.3 + i * 0.05 }}
                                >
                                  <CitationBadge citation={citation} />
                                </motion.div>
                              ))}
                              {answer.citations.length > 8 && (
                                <span className="text-[11px] text-white/40 self-center">
                                  +{answer.citations.length - 8} more
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="px-5 py-3 border-t border-white/5 bg-slate-900/50 flex items-center justify-between"
            >
              <div className="text-[10px] text-white/30 flex items-center gap-2">
                <Database className="w-3 h-3" />
                Analysis based on database metrics and research findings
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-medium transition-all",
                  "bg-gradient-to-r",
                  pillarBgColor,
                  "border",
                  pillarBorderColor,
                  pillarColor,
                  "hover:shadow-lg hover:shadow-current/10"
                )}
              >
                Close Analysis
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Sub-modal for Best Practice Detail (stacked) */}
          <AnimatePresence>
            {selectedLeaderForSubModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute inset-4 sm:inset-8 z-60 flex items-center justify-center"
              >
                <motion.div
                  className="w-full max-w-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sub-modal Header */}
                  <div className="px-6 py-4 bg-slate-800/80 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CountryFlag
                          isoCode={selectedLeaderForSubModal.country_iso}
                          size="lg"
                          className="rounded-lg shadow-lg ring-2 ring-white/10"
                        />
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            {selectedLeaderForSubModal.country_name}
                          </h2>
                          <p className="text-sm text-white/50">
                            Best Practice Leader • {question.title}
                          </p>
                        </div>
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg font-bold text-sm",
                          "bg-amber-500/20 text-amber-400"
                        )}>
                          #{bestPractices.findIndex(l => l.country_iso === selectedLeaderForSubModal.country_iso) + 1}
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedLeaderForSubModal(null)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5 text-white/60" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Sub-modal Content */}
                  <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Score */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "text-4xl font-bold tabular-nums",
                        selectedLeaderForSubModal.score >= 90 ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {selectedLeaderForSubModal.score}%
                      </div>
                      <div className="text-sm text-white/50">
                        Performance Score for this Strategic Question
                      </div>
                    </div>
                    
                    {/* What They Do */}
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5">
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-cyan-400" />
                        What They Do
                      </h3>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {selectedLeaderForSubModal.what_they_do || "This country has established comprehensive systems and frameworks that serve as a global benchmark for this area of occupational health."}
                      </p>
                    </div>
                    
                    {/* How They Do It */}
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5">
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        How They Do It
                      </h3>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {selectedLeaderForSubModal.how_they_do_it || "Through systematic policy implementation, strong institutional frameworks, and continuous improvement mechanisms that ensure sustainable results."}
                      </p>
                    </div>
                    
                    {/* Key Lesson */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Key Lesson
                      </h3>
                      <p className="text-sm text-white/80 leading-relaxed">
                        {selectedLeaderForSubModal.key_lesson}
                      </p>
                    </div>
                    
                    {/* Sources */}
                    {selectedLeaderForSubModal.sources && selectedLeaderForSubModal.sources.length > 0 && (
                      <div className="pt-3 border-t border-white/10">
                        <h4 className="text-xs font-medium text-white/40 mb-2">Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedLeaderForSubModal.sources.map((source, i) => (
                            <span key={i} className="text-[11px] text-white/50 bg-slate-800/60 px-2 py-1 rounded">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Sub-modal Footer */}
                  <div className="px-6 py-3 border-t border-white/5 bg-slate-900/50 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedLeaderForSubModal(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                    >
                      Back to Analysis
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}

export default QuestionDetailModal;
