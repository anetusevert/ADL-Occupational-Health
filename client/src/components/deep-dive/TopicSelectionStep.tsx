/**
 * Arthur D. Little - Global Health Platform
 * Topic Selection Step
 * 
 * Step 2 of the Deep Dive Wizard - Framework-themed topic picker
 * Temple-style visualization with 4 pillars + comprehensive option
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Shield,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Zap,
  Brain,
} from "lucide-react";
import { type CountryDeepDiveItem, type TopicStatus } from "../../services/api";
import { cn } from "../../lib/utils";
import { FloatingParticles } from "./shared";

// Framework layers configuration
const FRAMEWORK_LAYERS = [
  {
    id: "governance",
    name: "Governance Ecosystem",
    description: "Strategic capacity & policy foundations",
    icon: Crown,
    color: "purple",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    hoverBorder: "hover:border-purple-500/50",
    glowClass: "shadow-purple-500/30",
    topics: [
      { id: "gov-policy", name: "Policy & Regulatory Framework", description: "National OH policies, legislation & ILO compliance" },
      { id: "gov-enforcement", name: "Inspection & Enforcement Capacity", description: "Inspector density, enforcement mechanisms & penalties" },
      { id: "gov-tripartite", name: "Tripartite Governance & Social Dialogue", description: "Employer-worker-government collaboration structures" },
    ],
  },
  {
    id: "hazard",
    name: "Hazard Prevention",
    description: "Pillar I — Prevention & Control",
    icon: Shield,
    color: "blue",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    hoverBorder: "hover:border-blue-500/50",
    glowClass: "shadow-blue-500/30",
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
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500/50",
    glowClass: "shadow-emerald-500/30",
    topics: [
      { id: "vig-disease", name: "Occupational Disease Surveillance", description: "Disease detection, reporting systems & registries" },
      { id: "vig-mental", name: "Workplace Mental Health Programs", description: "Psychosocial risk assessment, EAPs & support" },
      { id: "vig-screening", name: "Health Screening & Medical Surveillance", description: "Pre-employment & periodic health examinations" },
    ],
  },
  {
    id: "restoration",
    name: "Restoration & Compensation",
    description: "Pillar III — Recovery & Support",
    icon: Heart,
    color: "amber",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    hoverBorder: "hover:border-amber-500/50",
    glowClass: "shadow-amber-500/30",
    topics: [
      { id: "rest-compensation", name: "Workers' Compensation Systems", description: "Insurance coverage, claim processes & benefits" },
      { id: "rest-rtw", name: "Return-to-Work & Rehabilitation", description: "Vocational rehab, workplace accommodation programs" },
      { id: "rest-migrant", name: "Migrant & Informal Worker Protection", description: "Coverage gaps, portability & informal sector inclusion" },
    ],
  },
];

interface TopicSelectionStepProps {
  selectedCountry: CountryDeepDiveItem | null;
  topicStatusMap: Record<string, TopicStatus>;
  onSelectTopic: (topic: string) => void;
  onBack: () => void;
}

export function TopicSelectionStep({
  selectedCountry,
  topicStatusMap,
  onSelectTopic,
  onBack,
}: TopicSelectionStepProps) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  // Get topic status
  const getTopicStatus = useCallback((topicName: string) => {
    return topicStatusMap[topicName];
  }, [topicStatusMap]);

  // Check if topic has a completed report
  const hasReport = useCallback((topicName: string) => {
    const status = getTopicStatus(topicName);
    return status?.status === "completed";
  }, [getTopicStatus]);

  // Check if topic is processing
  const isProcessing = useCallback((topicName: string) => {
    const status = getTopicStatus(topicName);
    return status?.status === "processing";
  }, [getTopicStatus]);

  // Handle pillar click
  const handlePillarClick = useCallback((pillarId: string) => {
    setExpandedPillar(prev => prev === pillarId ? null : pillarId);
  }, []);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <FloatingParticles color="purple" count={25} />

      {/* Header with Country Info */}
      <motion.div
        className="flex-shrink-0 px-8 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          {/* Back Button & Country */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </motion.button>

            {selectedCountry && (
              <div className="flex items-center gap-3">
                {selectedCountry.flag_url ? (
                  <img
                    src={selectedCountry.flag_url}
                    alt={selectedCountry.name}
                    className="w-10 h-7 object-cover rounded shadow-lg"
                  />
                ) : (
                  <div className="w-10 h-7 bg-slate-700 rounded flex items-center justify-center">
                    <span className="text-xs text-slate-400">{selectedCountry.iso_code}</span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedCountry.name}</h2>
                  <p className="text-xs text-slate-400">Select an analysis topic</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            {selectedCountry && (
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
                selectedCountry.completed_reports >= 13
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-slate-800/50 border-slate-700/40"
              )}>
                <CheckCircle2 className={cn(
                  "w-4 h-4",
                  selectedCountry.completed_reports >= 13 ? "text-emerald-400" : "text-slate-500"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  selectedCountry.completed_reports >= 13 ? "text-emerald-400" : "text-slate-400"
                )}>
                  {selectedCountry.completed_reports}/13 reports
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content - Temple Visualization */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Comprehensive Assessment - Featured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <motion.button
              onClick={() => onSelectTopic("Comprehensive Occupational Health Assessment")}
              className="w-full group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 p-6 text-left transition-all hover:border-purple-500/50"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/40 flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(147, 51, 234, 0.3)",
                        "0 0 40px rgba(147, 51, 234, 0.5)",
                        "0 0 20px rgba(147, 51, 234, 0.3)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Brain className="w-7 h-7 text-purple-400" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white">Comprehensive Assessment</h3>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-sm text-slate-400">Full analysis of all framework pillars</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasReport("Comprehensive Occupational Health Assessment") && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-emerald-400">Ready</span>
                    </div>
                  )}
                  {isProcessing("Comprehensive Occupational Health Assessment") && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span className="text-xs text-amber-400">Generating</span>
                    </div>
                  )}
                  <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Framework Pillars - Temple Style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Or select a specific topic
            </h3>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {FRAMEWORK_LAYERS.map((layer, layerIndex) => {
              const Icon = layer.icon;
              const isExpanded = expandedPillar === layer.id;
              const completedTopics = layer.topics.filter(t => hasReport(t.name)).length;

              return (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + layerIndex * 0.1 }}
                  className="relative"
                >
                  {/* Pillar Card */}
                  <motion.button
                    onClick={() => handlePillarClick(layer.id)}
                    className={cn(
                      "w-full text-left rounded-xl border p-5 transition-all",
                      layer.bgClass,
                      layer.borderClass,
                      layer.hoverBorder,
                      isExpanded && `ring-2 ring-${layer.color}-500/30`
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    layout
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border",
                            layer.bgClass,
                            layer.borderClass
                          )}
                          animate={isExpanded ? {
                            boxShadow: [
                              `0 0 15px var(--tw-shadow-color)`,
                              `0 0 30px var(--tw-shadow-color)`,
                              `0 0 15px var(--tw-shadow-color)`,
                            ],
                          } : undefined}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{ "--tw-shadow-color": `var(--${layer.color}-500)` } as any}
                        >
                          <Icon className={cn(
                            "w-6 h-6",
                            layer.color === "purple" && "text-purple-400",
                            layer.color === "blue" && "text-blue-400",
                            layer.color === "emerald" && "text-emerald-400",
                            layer.color === "amber" && "text-amber-400",
                          )} />
                        </motion.div>
                        <div>
                          <h4 className="text-base font-semibold text-white">{layer.name}</h4>
                          <p className="text-xs text-slate-400">{layer.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-lg",
                          completedTopics === 3
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-700/50 text-slate-400"
                        )}>
                          {completedTopics}/3
                        </span>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>

                  {/* Expanded Topics */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 space-y-2 overflow-hidden"
                      >
                        {layer.topics.map((topic, topicIndex) => {
                          const topicHasReport = hasReport(topic.name);
                          const topicIsProcessing = isProcessing(topic.name);

                          return (
                            <motion.button
                              key={topic.id}
                              onClick={() => onSelectTopic(topic.name)}
                              onMouseEnter={() => setHoveredTopic(topic.id)}
                              onMouseLeave={() => setHoveredTopic(null)}
                              className={cn(
                                "w-full text-left p-4 rounded-xl border transition-all",
                                "bg-slate-800/50 border-slate-700/40",
                                "hover:bg-slate-800/80 hover:border-slate-600/50",
                                hoveredTopic === topic.id && `border-${layer.color}-500/40`
                              )}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: topicIndex * 0.1 }}
                              whileHover={{ scale: 1.01, x: 4 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-medium text-white truncate">
                                    {topic.name}
                                  </h5>
                                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    {topic.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  {topicHasReport && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    </motion.div>
                                  )}
                                  {topicIsProcessing && (
                                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                                      <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                    </div>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-slate-600" />
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
              <span>Report ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50" />
              <span>Generating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-600/30 border border-slate-600/50" />
              <span>Not generated</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default TopicSelectionStep;
