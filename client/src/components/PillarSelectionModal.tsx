/**
 * Arthur D. Little - Global Health Platform
 * Pillar Selection Modal
 * 
 * Modal shown when user clicks a country, allowing them to choose
 * which Framework Pillar to analyze or view the Overall Summary.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Shield, Eye, HeartPulse, FileText, Loader2, PlayCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CountryFlag } from "./CountryFlag";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { aiApiClient } from "../services/api";
import type { Country } from "../types/country";

export type PillarType = "governance" | "hazard-control" | "vigilance" | "restoration" | "summary";

interface PillarOption {
  id: PillarType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  score?: number | null;
  isWide?: boolean;
}

const PILLAR_OPTIONS: Omit<PillarOption, "score">[] = [
  {
    id: "governance",
    title: "Governance",
    subtitle: "Strategic Capacity",
    description: "Policy framework, ILO conventions, institutional capacity",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: "hazard-control",
    title: "Hazard Control",
    subtitle: "Prevention & Risk",
    description: "Workplace safety, exposure limits, inspection systems",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "vigilance",
    title: "Vigilance",
    subtitle: "Surveillance & Detection",
    description: "Disease monitoring, health screening, reporting systems",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
  },
  {
    id: "restoration",
    title: "Restoration",
    subtitle: "Compensation & Recovery",
    description: "Payer systems, rehabilitation chain, return-to-work",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "summary",
    title: "Overall Summary",
    subtitle: "Strategic Assessment",
    description: "Comprehensive McKinsey-grade analysis across all pillars",
    icon: FileText,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    isWide: true,
  },
];

interface PillarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: {
    iso_code: string;
    name: string;
    flag_url?: string;
    governance_score?: number | null;
    pillar1_score?: number | null;
    pillar2_score?: number | null;
    pillar3_score?: number | null;
  } | null;
}

interface BatchGenerationStatus {
  iso_code: string;
  total: number;
  completed: number;
  in_progress: string;
  results: Record<string, string>;
  message: string;
}

export function PillarSelectionModal({
  isOpen,
  onClose,
  country,
}: PillarSelectionModalProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<BatchGenerationStatus | null>(null);

  if (!country) return null;

  // Batch generate all reports
  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    setGenerationStatus(null);
    
    try {
      const response = await aiApiClient.post<BatchGenerationStatus>(
        `/api/v1/batch-generate/${country.iso_code}`,
        {},
        { timeout: 600000 } // 10 minutes for all reports
      );
      setGenerationStatus(response.data);
    } catch (error: any) {
      console.error("Batch generation error:", error);
      setGenerationStatus({
        iso_code: country.iso_code,
        total: 5,
        completed: 0,
        in_progress: "",
        results: {},
        message: error.response?.data?.detail || "Failed to generate reports"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Map scores to pillars
  const getPillarScore = (pillarId: PillarType): number | null => {
    switch (pillarId) {
      case "governance":
        return country.governance_score ?? null;
      case "hazard-control":
        return country.pillar1_score ?? null;
      case "vigilance":
        return country.pillar2_score ?? null;
      case "restoration":
        return country.pillar3_score ?? null;
      default:
        return null;
    }
  };

  const handleSelectPillar = (pillarId: PillarType) => {
    navigate(`/country/${country.iso_code}/${pillarId}`);
    onClose();
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <CountryFlag
                    isoCode={country.iso_code}
                    flagUrl={country.flag_url}
                    size="lg"
                    className="shadow-lg"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white">{country.name}</h2>
                    <p className="text-sm text-white/50">Select a Framework Pillar to Analyze</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Pillar Options Grid */}
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* First 4 pillars */}
                  {PILLAR_OPTIONS.slice(0, 4).map((pillar, index) => {
                    const Icon = pillar.icon;
                    const score = getPillarScore(pillar.id);
                    
                    return (
                      <motion.button
                        key={pillar.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectPillar(pillar.id)}
                        className={cn(
                          "group relative p-5 rounded-xl border text-left transition-all duration-200",
                          "hover:scale-[1.02] hover:shadow-lg",
                          pillar.bgColor,
                          pillar.borderColor,
                          "hover:border-opacity-60"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          {/* Icon */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            pillar.bgColor,
                            "border",
                            pillar.borderColor
                          )}>
                            <Icon className={cn("w-5 h-5", pillar.color)} />
                          </div>
                          
                          {/* Score */}
                          {score !== null && (
                            <div className={cn(
                              "px-2 py-1 rounded-lg text-sm font-bold",
                              pillar.bgColor,
                              pillar.color
                            )}>
                              {score.toFixed(0)}%
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <h3 className="text-base font-semibold text-white mb-1">
                          {pillar.title}
                        </h3>
                        <p className={cn("text-xs font-medium mb-2", pillar.color)}>
                          {pillar.subtitle}
                        </p>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {pillar.description}
                        </p>

                        {/* Hover indicator */}
                        <div className={cn(
                          "absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity",
                          "text-xs font-medium",
                          pillar.color
                        )}>
                          Analyze →
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Overall Summary - Full Width */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleSelectPillar("summary")}
                  className={cn(
                    "group relative w-full mt-4 p-5 rounded-xl border text-left transition-all duration-200",
                    "hover:scale-[1.01] hover:shadow-lg",
                    "bg-gradient-to-r from-cyan-500/10 to-purple-500/10",
                    "border-cyan-500/30",
                    "hover:border-cyan-500/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Overall Summary
                      </h3>
                      <p className="text-sm text-white/50">
                        Comprehensive McKinsey-grade strategic assessment across all pillars
                      </p>
                    </div>
                    <div className="text-cyan-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      View Full Report →
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 space-y-3">
                {/* Admin: Batch Generation */}
                {isAdmin && (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleBatchGenerate}
                      disabled={isGenerating}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20",
                        "border border-emerald-500/30 hover:border-emerald-500/50",
                        "text-emerald-400 hover:text-emerald-300",
                        isGenerating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating All Reports...</span>
                        </>
                      ) : generationStatus?.completed === 5 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>All Reports Ready</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>Generate All Reports</span>
                        </>
                      )}
                    </button>
                    
                    {/* Progress indicator */}
                    {(isGenerating || generationStatus) && (
                      <div className="text-xs text-white/50">
                        {isGenerating && generationStatus?.in_progress && (
                          <span>Processing: {generationStatus.in_progress}</span>
                        )}
                        {generationStatus && !isGenerating && (
                          <span>{generationStatus.completed}/{generationStatus.total} complete</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hint */}
                <p className="text-xs text-white/30 text-center">
                  Each pillar includes strategic analysis, best practices, and benchmark comparisons
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PillarSelectionModal;
