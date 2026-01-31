/**
 * Arthur D. Little - Global Health Platform
 * Topic Selection Step - Immersive Visual Gallery
 * 
 * Step 2 of the Deep Dive Wizard - Framework-themed topic picker
 * Re-applied: 2026-01-31
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Shield, Eye, Heart, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Sparkles, ArrowRight, Brain } from "lucide-react";
import { type CountryDeepDiveItem, type TopicStatus } from "../../services/api";
import { cn } from "../../lib/utils";
import { FloatingParticles, GradientOrbs, PulseWaves } from "./shared";

const FRAMEWORK_LAYERS = [
  {
    id: "governance",
    name: "Governance Ecosystem",
    description: "Strategic capacity & policy foundations",
    icon: Crown,
    color: "purple",
    topics: [
      { id: "gov-policy", name: "Policy & Regulatory Framework", description: "National OH policies, legislation & ILO compliance" },
      { id: "gov-enforcement", name: "Inspection & Enforcement Capacity", description: "Inspector density, enforcement mechanisms" },
      { id: "gov-tripartite", name: "Tripartite Governance & Social Dialogue", description: "Employer-worker-government collaboration" },
    ],
  },
  {
    id: "hazard",
    name: "Hazard Prevention",
    description: "Pillar I — Prevention & Control",
    icon: Shield,
    color: "blue",
    topics: [
      { id: "haz-chemical", name: "Chemical & Carcinogen Exposure Control", description: "OEL compliance, hazardous substance management" },
      { id: "haz-physical", name: "Physical Hazards & Ergonomics", description: "Noise, vibration, ergonomic risk management" },
      { id: "haz-climate", name: "Heat Stress & Climate Adaptation", description: "Thermal regulations, outdoor worker protection" },
    ],
  },
  {
    id: "vigilance",
    name: "Surveillance & Detection",
    description: "Pillar II — Health Vigilance",
    icon: Eye,
    color: "emerald",
    topics: [
      { id: "vig-disease", name: "Occupational Disease Surveillance", description: "Disease detection, reporting systems" },
      { id: "vig-mental", name: "Workplace Mental Health Programs", description: "Psychosocial risk assessment, EAPs" },
      { id: "vig-screening", name: "Health Screening & Medical Surveillance", description: "Pre-employment & periodic examinations" },
    ],
  },
  {
    id: "restoration",
    name: "Restoration & Compensation",
    description: "Pillar III — Recovery & Support",
    icon: Heart,
    color: "amber",
    topics: [
      { id: "rest-compensation", name: "Workers' Compensation Systems", description: "Insurance coverage, claim processes" },
      { id: "rest-rtw", name: "Return-to-Work & Rehabilitation", description: "Vocational rehab, workplace accommodation" },
      { id: "rest-migrant", name: "Migrant & Informal Worker Protection", description: "Coverage gaps, portability" },
    ],
  },
];

interface TopicSelectionStepProps {
  selectedCountries: Array<{ iso_code: string; name: string; flag_url: string | null }>;
  topicStatusMap: Record<string, TopicStatus>;
  onSelectTopic: (topic: string) => void;
  onBack: () => void;
}

export function TopicSelectionStep({ selectedCountries, topicStatusMap, onSelectTopic, onBack }: TopicSelectionStepProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const hasReport = useCallback((topicName: string) => topicStatusMap[topicName]?.status === "completed", [topicStatusMap]);
  const isProcessing = useCallback((topicName: string) => topicStatusMap[topicName]?.status === "processing", [topicStatusMap]);
  const getCompletedCount = useCallback((layer: typeof FRAMEWORK_LAYERS[0]) => layer.topics.filter((t) => hasReport(t.name)).length, [hasReport]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <GradientOrbs count={4} />
      <FloatingParticles color="purple" count={30} />

      {/* Header */}
      <motion.div className="flex-shrink-0 px-8 py-6 relative z-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all" whileHover={{ scale: 1.02, x: -3 }} whileTap={{ scale: 0.98 }}>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </motion.button>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {selectedCountries.slice(0, 5).map((country, i) => (
                  <motion.div key={country.iso_code} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }} className="relative" style={{ zIndex: 5 - i }}>
                    {country.flag_url ? <img src={country.flag_url} alt={country.name} className="w-8 h-6 object-cover rounded shadow-lg border-2 border-slate-800" /> : <div className="w-8 h-6 bg-slate-700 rounded border-2 border-slate-800 flex items-center justify-center"><span className="text-[8px] text-slate-400">{country.iso_code}</span></div>}
                  </motion.div>
                ))}
                {selectedCountries.length > 5 && <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="w-8 h-6 bg-slate-700 rounded border-2 border-slate-800 flex items-center justify-center"><span className="text-[9px] text-slate-300">+{selectedCountries.length - 5}</span></motion.div>}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{selectedCountries.length === 1 ? selectedCountries[0].name : `${selectedCountries.length} Countries`}</h2>
                <p className="text-xs text-slate-400">Select an analysis topic</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
        <motion.div className="max-w-6xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {/* Comprehensive Assessment Hero */}
          <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <motion.button onClick={() => onSelectTopic("Comprehensive Occupational Health Assessment")} className="w-full group relative overflow-hidden rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all text-left" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-cyan-900/30" />
              <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
              <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2"><PulseWaves color="purple" count={3} size={200} duration={3} /></div>
              <div className="relative p-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <motion.div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/40 flex items-center justify-center" animate={{ boxShadow: ["0 0 30px rgba(147, 51, 234, 0.3)", "0 0 60px rgba(147, 51, 234, 0.5)", "0 0 30px rgba(147, 51, 234, 0.3)"] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Brain className="w-10 h-10 text-purple-400" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">Comprehensive Assessment</h3>
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}><Sparkles className="w-6 h-6 text-amber-400" /></motion.div>
                    </div>
                    <p className="text-slate-400 max-w-md">Complete analysis across all framework pillars</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {hasReport("Comprehensive Occupational Health Assessment") && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-sm font-medium text-emerald-400">Report Ready</span></motion.div>}
                  {isProcessing("Comprehensive Occupational Health Assessment") && <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl"><Loader2 className="w-5 h-5 text-amber-400 animate-spin" /><span className="text-sm font-medium text-amber-400">Generating...</span></div>}
                  <motion.div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors" whileHover={{ scale: 1.1 }}><ArrowRight className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" /></motion.div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 opacity-50" />
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div className="flex items-center gap-4 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Specialized Topics</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </motion.div>

          {/* Framework Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FRAMEWORK_LAYERS.map((layer, layerIndex) => {
              const Icon = layer.icon;
              const isExpanded = expandedPillar === layer.id;
              const completedCount = getCompletedCount(layer);

              const colorStyles: Record<string, { border: string; iconBg: string; text: string; badge: string }> = {
                purple: { border: isExpanded ? "border-purple-500/50 ring-2 ring-purple-500/20" : "border-purple-500/30 hover:border-purple-500/50", iconBg: "from-purple-500/30 to-purple-600/20 border-purple-500/40", text: "text-purple-400", badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400" },
                blue: { border: isExpanded ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-blue-500/30 hover:border-blue-500/50", iconBg: "from-blue-500/30 to-blue-600/20 border-blue-500/40", text: "text-blue-400", badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400" },
                emerald: { border: isExpanded ? "border-emerald-500/50 ring-2 ring-emerald-500/20" : "border-emerald-500/30 hover:border-emerald-500/50", iconBg: "from-emerald-500/30 to-emerald-600/20 border-emerald-500/40", text: "text-emerald-400", badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-teal-500/20 text-teal-400" },
                amber: { border: isExpanded ? "border-amber-500/50 ring-2 ring-amber-500/20" : "border-amber-500/30 hover:border-amber-500/50", iconBg: "from-amber-500/30 to-amber-600/20 border-amber-500/40", text: "text-amber-400", badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400" },
              };
              const styles = colorStyles[layer.color] || colorStyles.purple;

              return (
                <motion.div key={layer.id} className={cn("relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all bg-gradient-to-br from-slate-800/40 to-slate-900/40", styles.border)} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + layerIndex * 0.1 }} layout>
                  <motion.button onClick={() => setExpandedPillar(isExpanded ? null : layer.id)} className="w-full p-5 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br border flex items-center justify-center", styles.iconBg)}><Icon className={cn("w-7 h-7", styles.text)} /></div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-0.5">{layer.name}</h4>
                          <p className="text-sm text-slate-400">{layer.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("px-3 py-1.5 rounded-lg text-xs font-medium", styles.badge)}>{completedCount}/3 ready</span>
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-slate-500"><ChevronRight className="w-5 h-5" /></motion.div>
                      </div>
                    </div>
                  </motion.button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-3">
                          {layer.topics.map((topic, topicIndex) => (
                            <motion.button key={topic.id} onClick={() => onSelectTopic(topic.name)} className={cn("w-full text-left p-4 rounded-xl border transition-all group bg-slate-800/50 border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-600/60", hasReport(topic.name) && "border-l-4 border-l-emerald-500")} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: topicIndex * 0.1 }} whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.99 }}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-sm font-medium text-white group-hover:text-white/90">{topic.name}</h5>
                                  <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasReport(topic.name) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></motion.div>}
                                  {isProcessing(topic.name) && <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center"><Loader2 className="w-4 h-4 text-amber-400 animate-spin" /></div>}
                                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all" />
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default TopicSelectionStep;
