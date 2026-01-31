/**
 * Arthur D. Little - Global Health Platform
 * Topic Selection Step - Immersive Visual Gallery
 * 
 * Step 2 of the Deep Dive Wizard - Framework-themed topic picker
 * Features:
 * - Full-screen topic cards with 3D hover effects
 * - Comprehensive Assessment featured hero
 * - Framework pillars with distinct visual identity
 * - Topic previews on hover
 * - Dynamic gradient backgrounds
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
  Brain,
  FileText,
  TrendingUp,
  AlertTriangle,
  Target,
  Zap,
  Users,
  Thermometer,
  Stethoscope,
  Briefcase,
  Scale,
  Pill,
  Activity,
} from "lucide-react";
import { type CountryDeepDiveItem, type TopicStatus } from "../../services/api";
import { cn } from "../../lib/utils";
import { FloatingParticles, GradientOrbs, PulseWaves } from "./shared";

// Framework layers with enhanced metadata
const FRAMEWORK_LAYERS = [
  {
    id: "governance",
    name: "Governance Ecosystem",
    description: "Strategic capacity & policy foundations",
    icon: Crown,
    color: "purple",
    gradient: "from-purple-600 to-indigo-700",
    bgGlow: "purple",
    topics: [
      { 
        id: "gov-policy", 
        name: "Policy & Regulatory Framework", 
        description: "National OH policies, legislation & ILO compliance",
        icon: FileText,
        preview: "Analysis of national occupational health policies, legislative frameworks, and compliance with ILO conventions."
      },
      { 
        id: "gov-enforcement", 
        name: "Inspection & Enforcement Capacity", 
        description: "Inspector density, enforcement mechanisms & penalties",
        icon: Shield,
        preview: "Evaluation of labor inspection systems, enforcement effectiveness, and penalty structures."
      },
      { 
        id: "gov-tripartite", 
        name: "Tripartite Governance & Social Dialogue", 
        description: "Employer-worker-government collaboration structures",
        icon: Users,
        preview: "Assessment of social dialogue mechanisms and stakeholder collaboration in OH policy-making."
      },
    ],
  },
  {
    id: "hazard",
    name: "Hazard Prevention",
    description: "Pillar I — Prevention & Control",
    icon: Shield,
    color: "blue",
    gradient: "from-blue-600 to-cyan-700",
    bgGlow: "blue",
    topics: [
      { 
        id: "haz-chemical", 
        name: "Chemical & Carcinogen Exposure Control", 
        description: "OEL compliance, hazardous substance management",
        icon: Pill,
        preview: "Review of occupational exposure limits, chemical safety protocols, and carcinogen control measures."
      },
      { 
        id: "haz-physical", 
        name: "Physical Hazards & Ergonomics", 
        description: "Noise, vibration, ergonomic risk management",
        icon: Activity,
        preview: "Analysis of physical hazard controls including noise, vibration, and ergonomic interventions."
      },
      { 
        id: "haz-climate", 
        name: "Heat Stress & Climate Adaptation", 
        description: "Thermal regulations, outdoor worker protection",
        icon: Thermometer,
        preview: "Evaluation of heat stress policies, thermal work limits, and climate adaptation strategies."
      },
    ],
  },
  {
    id: "vigilance",
    name: "Surveillance & Detection",
    description: "Pillar II — Health Vigilance",
    icon: Eye,
    color: "emerald",
    gradient: "from-emerald-600 to-teal-700",
    bgGlow: "emerald",
    topics: [
      { 
        id: "vig-disease", 
        name: "Occupational Disease Surveillance", 
        description: "Disease detection, reporting systems & registries",
        icon: Target,
        preview: "Assessment of disease surveillance systems, notification protocols, and registry effectiveness."
      },
      { 
        id: "vig-mental", 
        name: "Workplace Mental Health Programs", 
        description: "Psychosocial risk assessment, EAPs & support",
        icon: Brain,
        preview: "Review of mental health initiatives, psychosocial risk management, and employee assistance programs."
      },
      { 
        id: "vig-screening", 
        name: "Health Screening & Medical Surveillance", 
        description: "Pre-employment & periodic health examinations",
        icon: Stethoscope,
        preview: "Evaluation of health screening protocols, medical surveillance programs, and fitness assessments."
      },
    ],
  },
  {
    id: "restoration",
    name: "Restoration & Compensation",
    description: "Pillar III — Recovery & Support",
    icon: Heart,
    color: "amber",
    gradient: "from-amber-600 to-orange-700",
    bgGlow: "amber",
    topics: [
      { 
        id: "rest-compensation", 
        name: "Workers' Compensation Systems", 
        description: "Insurance coverage, claim processes & benefits",
        icon: Scale,
        preview: "Analysis of workers' compensation schemes, benefit adequacy, and claims processing efficiency."
      },
      { 
        id: "rest-rtw", 
        name: "Return-to-Work & Rehabilitation", 
        description: "Vocational rehab, workplace accommodation programs",
        icon: TrendingUp,
        preview: "Assessment of rehabilitation services, return-to-work programs, and workplace accommodations."
      },
      { 
        id: "rest-migrant", 
        name: "Migrant & Informal Worker Protection", 
        description: "Coverage gaps, portability & informal sector inclusion",
        icon: Briefcase,
        preview: "Review of protections for migrant workers, informal sector coverage, and benefit portability."
      },
    ],
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

const topicCardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  }),
};

interface TopicSelectionStepProps {
  selectedCountries: Array<{ iso_code: string; name: string; flag_url: string | null }>;
  topicStatusMap: Record<string, TopicStatus>;
  onSelectTopic: (topic: string) => void;
  onBack: () => void;
}

export function TopicSelectionStep({
  selectedCountries,
  topicStatusMap,
  onSelectTopic,
  onBack,
}: TopicSelectionStepProps) {
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);
  const [hoveredTopic, setHoveredTopic] = useState<{ id: string; preview: string } | null>(null);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

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

  // Handle pillar click to expand/collapse
  const handlePillarClick = useCallback((pillarId: string) => {
    setExpandedPillar(prev => prev === pillarId ? null : pillarId);
  }, []);

  // Count completed topics per pillar
  const getCompletedCount = useCallback((layer: typeof FRAMEWORK_LAYERS[0]) => {
    return layer.topics.filter(t => hasReport(t.name)).length;
  }, [hasReport]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <GradientOrbs count={4} />
      <FloatingParticles color={hoveredPillar === "governance" ? "purple" : hoveredPillar === "hazard" ? "blue" : hoveredPillar === "vigilance" ? "emerald" : hoveredPillar === "restoration" ? "amber" : "cyan"} count={30} />

      {/* Header with Country Context */}
      <motion.div
        className="flex-shrink-0 px-8 py-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Back Button & Country Info */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all backdrop-blur-sm"
                whileHover={{ scale: 1.02, x: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </motion.button>

              {/* Selected Countries Display */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {selectedCountries.slice(0, 5).map((country, i) => (
                    <motion.div
                      key={country.iso_code}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="relative"
                      style={{ zIndex: 5 - i }}
                    >
                      {country.flag_url ? (
                        <img
                          src={country.flag_url}
                          alt={country.name}
                          className="w-8 h-6 object-cover rounded shadow-lg border-2 border-slate-800"
                        />
                      ) : (
                        <div className="w-8 h-6 bg-slate-700 rounded border-2 border-slate-800 flex items-center justify-center">
                          <span className="text-[8px] text-slate-400">{country.iso_code}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {selectedCountries.length > 5 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-8 h-6 bg-slate-700 rounded border-2 border-slate-800 flex items-center justify-center"
                    >
                      <span className="text-[9px] text-slate-300">+{selectedCountries.length - 5}</span>
                    </motion.div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedCountries.length === 1 
                      ? selectedCountries[0].name 
                      : `${selectedCountries.length} Countries`}
                  </h2>
                  <p className="text-xs text-slate-400">Select an analysis topic</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <motion.div
              className="flex items-center gap-4 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500" />
                <span className="text-slate-400">Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500" />
                <span className="text-slate-400">Generating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600/40 border border-slate-600" />
                <span className="text-slate-400">Not generated</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content - Topic Gallery */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 relative z-10">
        <motion.div
          className="max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Comprehensive Assessment - Hero Card */}
          <motion.div variants={cardVariants} className="mb-10">
            <ComprehensiveHeroCard
              onSelect={() => onSelectTopic("Comprehensive Occupational Health Assessment")}
              hasReport={hasReport("Comprehensive Occupational Health Assessment")}
              isProcessing={isProcessing("Comprehensive Occupational Health Assessment")}
            />
          </motion.div>

          {/* Section Divider */}
          <motion.div 
            variants={cardVariants}
            className="flex items-center gap-4 mb-8"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
              Specialized Topics
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </motion.div>

          {/* Framework Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FRAMEWORK_LAYERS.map((layer, layerIndex) => {
              const Icon = layer.icon;
              const isExpanded = expandedPillar === layer.id;
              const completedCount = getCompletedCount(layer);

              return (
                <motion.div
                  key={layer.id}
                  variants={cardVariants}
                  className="relative"
                  onMouseEnter={() => setHoveredPillar(layer.id)}
                  onMouseLeave={() => setHoveredPillar(null)}
                >
                  <PillarCard
                    layer={layer}
                    isExpanded={isExpanded}
                    completedCount={completedCount}
                    onToggleExpand={() => handlePillarClick(layer.id)}
                  >
                    {/* Topics */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-3">
                            {layer.topics.map((topic, topicIndex) => (
                              <TopicCard
                                key={topic.id}
                                topic={topic}
                                index={topicIndex}
                                color={layer.color}
                                hasReport={hasReport(topic.name)}
                                isProcessing={isProcessing(topic.name)}
                                onSelect={() => onSelectTopic(topic.name)}
                                onHover={() => setHoveredTopic({ id: topic.id, preview: topic.preview })}
                                onLeave={() => setHoveredTopic(null)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </PillarCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Topic Preview Tooltip */}
      <AnimatePresence>
        {hoveredTopic && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg"
          >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-3 shadow-2xl">
              <p className="text-sm text-slate-300">{hoveredTopic.preview}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Comprehensive Assessment Hero Card
interface ComprehensiveHeroCardProps {
  onSelect: () => void;
  hasReport: boolean;
  isProcessing: boolean;
}

function ComprehensiveHeroCard({ onSelect, hasReport, isProcessing }: ComprehensiveHeroCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className="w-full group relative overflow-hidden rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all text-left"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-cyan-900/30" />
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Pulse effect */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2">
        <PulseWaves color="purple" count={3} size={200} duration={3} />
      </div>

      {/* Content */}
      <div className="relative p-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/40 flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 30px rgba(147, 51, 234, 0.3)",
                "0 0 60px rgba(147, 51, 234, 0.5)",
                "0 0 30px rgba(147, 51, 234, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-10 h-10 text-purple-400" />
          </motion.div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-white">Comprehensive Assessment</h3>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-amber-400" />
              </motion.div>
            </div>
            <p className="text-slate-400 max-w-md">
              Complete analysis across all framework pillars — governance, prevention, surveillance, and restoration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasReport && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Report Ready</span>
            </motion.div>
          )}
          {isProcessing && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl">
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              <span className="text-sm font-medium text-amber-400">Generating...</span>
            </div>
          )}
          <motion.div
            className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
          >
            <ArrowRight className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 opacity-50" />
    </motion.button>
  );
}

// Pillar Card Component
interface PillarCardProps {
  layer: typeof FRAMEWORK_LAYERS[0];
  isExpanded: boolean;
  completedCount: number;
  onToggleExpand: () => void;
  children: React.ReactNode;
}

function PillarCard({ layer, isExpanded, completedCount, onToggleExpand, children }: PillarCardProps) {
  const Icon = layer.icon;

  const colorStyles = {
    purple: {
      border: isExpanded ? "border-purple-500/50 ring-2 ring-purple-500/20" : "border-purple-500/30 hover:border-purple-500/50",
      iconBg: "from-purple-500/30 to-purple-600/20 border-purple-500/40",
      text: "text-purple-400",
      badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400",
    },
    blue: {
      border: isExpanded ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-blue-500/30 hover:border-blue-500/50",
      iconBg: "from-blue-500/30 to-blue-600/20 border-blue-500/40",
      text: "text-blue-400",
      badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400",
    },
    emerald: {
      border: isExpanded ? "border-emerald-500/50 ring-2 ring-emerald-500/20" : "border-emerald-500/30 hover:border-emerald-500/50",
      iconBg: "from-emerald-500/30 to-emerald-600/20 border-emerald-500/40",
      text: "text-emerald-400",
      badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-teal-500/20 text-teal-400",
    },
    amber: {
      border: isExpanded ? "border-amber-500/50 ring-2 ring-amber-500/20" : "border-amber-500/30 hover:border-amber-500/50",
      iconBg: "from-amber-500/30 to-amber-600/20 border-amber-500/40",
      text: "text-amber-400",
      badge: completedCount === 3 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400",
    },
  };

  const styles = colorStyles[layer.color as keyof typeof colorStyles];

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all",
        "bg-gradient-to-br from-slate-800/40 to-slate-900/40",
        styles.border
      )}
      layout
    >
      {/* Header */}
      <motion.button
        onClick={onToggleExpand}
        className="w-full p-5 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className={cn(
                "w-14 h-14 rounded-xl bg-gradient-to-br border flex items-center justify-center",
                styles.iconBg
              )}
              animate={isExpanded ? {
                boxShadow: [
                  `0 0 20px rgba(var(--glow-color), 0.3)`,
                  `0 0 40px rgba(var(--glow-color), 0.5)`,
                  `0 0 20px rgba(var(--glow-color), 0.3)`,
                ],
              } : undefined}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className={cn("w-7 h-7", styles.text)} />
            </motion.div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-0.5">{layer.name}</h4>
              <p className="text-sm text-slate-400">{layer.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium",
              styles.badge
            )}>
              {completedCount}/3 ready
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-500"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </motion.button>

      {/* Expandable Content */}
      <div className="px-5 pb-5">
        {children}
      </div>
    </motion.div>
  );
}

// Topic Card Component
interface TopicCardProps {
  topic: typeof FRAMEWORK_LAYERS[0]["topics"][0];
  index: number;
  color: string;
  hasReport: boolean;
  isProcessing: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}

function TopicCard({
  topic,
  index,
  color,
  hasReport,
  isProcessing,
  onSelect,
  onHover,
  onLeave,
}: TopicCardProps) {
  const Icon = topic.icon;

  return (
    <motion.button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all group",
        "bg-slate-800/50 border-slate-700/40",
        "hover:bg-slate-800/80 hover:border-slate-600/60",
        hasReport && "border-l-4 border-l-emerald-500"
      )}
      custom={index}
      variants={topicCardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color === "purple" && "bg-purple-500/10 text-purple-400",
            color === "blue" && "bg-blue-500/10 text-blue-400",
            color === "emerald" && "bg-emerald-500/10 text-emerald-400",
            color === "amber" && "bg-amber-500/10 text-amber-400"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-sm font-medium text-white group-hover:text-white/90">
              {topic.name}
            </h5>
            <p className="text-xs text-slate-500 mt-0.5">
              {topic.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasReport && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </motion.div>
          )}
          {isProcessing && (
            <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </motion.button>
  );
}

export default TopicSelectionStep;
