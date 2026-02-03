/**
 * Arthur D. Little - Global Health Platform
 * Question Deep Dive Component - Best Practice Content & Top Countries
 * 
 * Shows best practice content for a question and the top 5 countries implementing it.
 * Order: Global Leaders → Saudi Positioning → Best Practice Report
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, 
  Loader2, AlertCircle, Lightbulb, Target, AlertTriangle,
  Trophy, Flag, Crown, Shield, Eye, Heart
} from "lucide-react";
import { cn } from "../../lib/utils";
import { SaudiPositioning } from "./SaudiPositioning";
import { ExportDropdown } from "./ExportDropdown";
import { 
  exportBestPracticeToPDF, 
  exportBestPracticeToWord,
  BestPracticeExportOptions 
} from "../../services/reportExport";

// Pillar icon mapping
const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  governance: Crown,
  hazard: Shield,
  vigilance: Eye,
  restoration: Heart,
};

const PILLAR_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  governance: { text: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/40" },
  hazard: { text: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40" },
  vigilance: { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40" },
  restoration: { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/40" },
};

interface KeyPrinciple {
  title: string;
  description: string;
}

interface ImplementationElement {
  element: string;
  description: string;
  examples?: string;
}

interface TopCountry {
  iso_code: string;
  name: string;
  rank: number;
  score: number;
  summary: string;
  flag_url?: string;
  has_detail: boolean;
}

interface BestPracticeData {
  question_id: string;
  question_title: string;
  question_text: string;
  pillar: string;
  status: string;
  best_practice_overview?: string;
  key_principles: KeyPrinciple[];
  implementation_elements: ImplementationElement[];
  success_factors: string[];
  common_pitfalls: string[];
  top_countries: TopCountry[];
  generated_at?: string;
}

interface QuestionDeepDiveProps {
  data: BestPracticeData | null;
  isLoading: boolean;
  isGenerating: boolean;
  isAdmin: boolean;
  error?: string | null;
  userName: string;
  onBack: () => void;
  onGenerate: () => void;
  onSelectCountry: (isoCode: string) => void;
}

export function QuestionDeepDive({
  data,
  isLoading,
  isGenerating,
  isAdmin,
  error,
  userName,
  onBack,
  onGenerate,
  onSelectCountry,
}: QuestionDeepDiveProps) {
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(null);
  
  const pillarId = data?.pillar || "governance";
  const Icon = PILLAR_ICONS[pillarId] || Crown;
  const colors = PILLAR_COLORS[pillarId] || PILLAR_COLORS.governance;
  
  const hasContent = data?.status === "completed" && data?.best_practice_overview;

  // Pillar display name mapping
  const pillarDisplayNames: Record<string, string> = {
    governance: "Governance & Financing",
    hazard: "Hazard Control",
    vigilance: "Vigilance",
    restoration: "Restoration & Compensation",
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (!data || !hasContent) return;
    
    const exportOptions: BestPracticeExportOptions = {
      userName,
      pillarName: pillarDisplayNames[pillarId] || pillarId,
      questionTitle: data.question_title,
      questionText: data.question_text,
      bestPracticeOverview: data.best_practice_overview || "",
      keyPrinciples: data.key_principles || [],
      implementationElements: data.implementation_elements || [],
      successFactors: data.success_factors || [],
      commonPitfalls: data.common_pitfalls || [],
      topCountries: (data.top_countries || []).map(c => ({
        name: c.name,
        rank: c.rank,
        score: c.score,
        summary: c.summary,
      })),
      generatedAt: data.generated_at,
    };
    
    await exportBestPracticeToPDF(exportOptions);
  };

  const handleExportWord = async () => {
    if (!data || !hasContent) return;
    
    const exportOptions: BestPracticeExportOptions = {
      userName,
      pillarName: pillarDisplayNames[pillarId] || pillarId,
      questionTitle: data.question_title,
      questionText: data.question_text,
      bestPracticeOverview: data.best_practice_overview || "",
      keyPrinciples: data.key_principles || [],
      implementationElements: data.implementation_elements || [],
      successFactors: data.success_factors || [],
      commonPitfalls: data.common_pitfalls || [],
      topCountries: (data.top_countries || []).map(c => ({
        name: c.name,
        rank: c.rank,
        score: c.score,
        summary: c.summary,
      })),
      generatedAt: data.generated_at,
    };
    
    await exportBestPracticeToWord(exportOptions);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all"
            whileHover={{ scale: 1.02, x: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Questions</span>
          </motion.button>
          
          <div className="flex items-center gap-3">
            {/* Export Dropdown - visible when content is available */}
            {hasContent && (
              <ExportDropdown
                onExportPDF={handleExportPDF}
                onExportWord={handleExportWord}
                disabled={isGenerating}
              />
            )}
            
            {/* Admin Regenerate Button - ONLY visible to admin */}
            {isAdmin && (
              <motion.button
                onClick={onGenerate}
                disabled={isGenerating}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  isGenerating
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 cursor-not-allowed"
                    : "bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30"
                )}
                whileHover={!isGenerating ? { scale: 1.02 } : undefined}
                whileTap={!isGenerating ? { scale: 0.98 } : undefined}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{isGenerating ? "Processing..." : hasContent ? "Refresh" : "Initialize"}</span>
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Question Header */}
        <div className="flex items-start gap-5">
          <motion.div
            className={cn("w-14 h-14 rounded-xl flex items-center justify-center border", colors.bg, colors.border)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Icon className={cn("w-7 h-7", colors.text)} />
          </motion.div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{data?.question_title || "Loading..."}</h1>
            <p className="text-slate-400 text-lg">{data?.question_text || ""}</p>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading best practices...</p>
          </div>
        </div>
      )}

      {/* Error State - Only show to admin */}
      {error && !isGenerating && isAdmin && (
        <motion.div
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-400 font-medium mb-1">Error</h4>
              <p className="text-red-300/80 text-sm">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Content State */}
      {!isLoading && !hasContent && !isGenerating && (
        <motion.div
          className="text-center py-16 px-8 rounded-2xl bg-slate-800/40 border border-slate-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lightbulb className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Content Coming Soon</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Best practice content for this question is being prepared. Please check back later.
          </p>
          {isAdmin && (
            <motion.button
              onClick={onGenerate}
              className="px-6 py-3 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400 font-medium hover:bg-purple-500/30 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Initialize Content
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Processing State - Only show to admin */}
      {isGenerating && isAdmin && (
        <motion.div
          className="text-center py-16 px-8 rounded-2xl bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-purple-500/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Processing Content</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Analyzing global data and preparing comprehensive best practice guidance...
          </p>
        </motion.div>
      )}

      {/* Non-admin sees loading during generation */}
      {isGenerating && !isAdmin && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading content...</p>
          </div>
        </div>
      )}

      {/* Content - Reordered: Global Leaders → Saudi Positioning → Report */}
      {hasContent && (
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* SECTION 1: Top 5 Countries / Global Leaders - NOW FIRST */}
          {data.top_countries && data.top_countries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Global Leaders
              </h2>
              <div className="space-y-3">
                {data.top_countries.map((country, index) => (
                  <motion.button
                    key={country.iso_code}
                    onClick={() => onSelectCountry(country.iso_code)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all group",
                      "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01, x: 6 }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                        index === 0 ? "bg-amber-500/20 text-amber-400" :
                        index === 1 ? "bg-slate-400/20 text-slate-300" :
                        index === 2 ? "bg-orange-700/20 text-orange-400" :
                        "bg-slate-700/50 text-slate-400"
                      )}>
                        #{country.rank}
                      </div>
                      
                      {/* Flag */}
                      {country.flag_url ? (
                        <img
                          src={country.flag_url}
                          alt={country.name}
                          className="w-10 h-7 object-cover rounded shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-7 bg-slate-700 rounded flex items-center justify-center">
                          <Flag className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                      
                      {/* Country Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white group-hover:text-white/90">
                          {country.name}
                        </h4>
                        <p className="text-sm text-slate-400 truncate">{country.summary}</p>
                      </div>
                      
                      {/* Score & Arrow */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">{country.score}</div>
                          <div className="text-xs text-slate-500">Score</div>
                        </div>
                        
                        <motion.div
                          className={cn("p-2 rounded-lg", colors.bg)}
                          whileHover={{ x: 4 }}
                        >
                          <ChevronRight className={cn("w-5 h-5", colors.text)} />
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SECTION 2: Saudi Arabia Positioning - NOW SECOND */}
          {data.top_countries && data.top_countries.length > 0 && (
            <SaudiPositioning
              topCountries={data.top_countries}
              onSelectSaudi={() => onSelectCountry("SAU")}
            />
          )}

          {/* SECTION 3: Overview Section - NOW AFTER POSITIONING */}
          <motion.div
            className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className={cn("w-5 h-5", colors.text)} />
              Best Practice Overview
            </h2>
            <div className="prose prose-invert prose-slate max-w-none">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {data.best_practice_overview}
              </p>
            </div>
          </motion.div>

          {/* Key Principles */}
          {data.key_principles && data.key_principles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className={cn("w-5 h-5", colors.text)} />
                Key Principles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.key_principles.map((principle, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all",
                      expandedPrinciple === index
                        ? "bg-slate-800/60 border-slate-600/50"
                        : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
                    )}
                    onClick={() => setExpandedPrinciple(expandedPrinciple === index ? null : index)}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                        colors.bg, colors.text
                      )}>
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-white mb-1">{principle.title}</h4>
                        <AnimatePresence>
                          {expandedPrinciple === index && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm text-slate-400"
                            >
                              {principle.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Implementation Elements */}
          {data.implementation_elements && data.implementation_elements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className={cn("w-5 h-5", colors.text)} />
                Implementation Guide
              </h2>
              <div className="space-y-3">
                {data.implementation_elements.map((elem, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30"
                  >
                    <h4 className="font-medium text-white mb-2">{elem.element}</h4>
                    <p className="text-sm text-slate-400 mb-2">{elem.description}</p>
                    {elem.examples && (
                      <p className="text-xs text-slate-500 italic">
                        <span className="font-medium">Examples:</span> {elem.examples}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Success Factors & Pitfalls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.success_factors && data.success_factors.length > 0 && (
              <motion.div
                className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Success Factors
                </h3>
                <ul className="space-y-2">
                  {data.success_factors.map((factor, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-emerald-400 mt-1">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {data.common_pitfalls && data.common_pitfalls.length > 0 && (
              <motion.div
                className="p-5 rounded-xl bg-red-500/10 border border-red-500/20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Common Pitfalls
                </h3>
                <ul className="space-y-2">
                  {data.common_pitfalls.map((pitfall, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-red-400 mt-1">•</span>
                      {pitfall}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default QuestionDeepDive;
