/**
 * Arthur D. Little - Global Health Platform
 * CoverageTimeline Component
 * 
 * Visual timeline showing the occupational health journey
 * from incident to recovery/outcome.
 * 
 * Supports two variants:
 * - vertical (default): Traditional vertical timeline with full descriptions
 * - horizontal: Compact horizontal timeline for no-scroll layouts
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText,
  Send,
  Stethoscope,
  Wallet,
  HeartPulse,
  Building2,
  Plane,
  AlertTriangle,
  User,
  Bed,
  HelpCircle,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { type PersonaJourneyStep } from "../../data/personas";
import { cn } from "../../lib/utils";

// ============================================================================
// JOURNEY DESCRIPTION PARSER
// ============================================================================

function JourneyDescription({ description, colors }: { description: string; colors: typeof colorConfig.cyan }) {
  // Parse description into segments based on labels like POSITIVE:, CHALLENGE:, etc.
  const segments = description.split(/(?=POSITIVE:|CHALLENGE:|EXCELLENT|CRITICAL|BENEFIT:|IMPROVEMENT:|REALITY:|INSIGHT:|OPPORTUNITY:|DANGER:|KEY|REFORM|TWO PATHS:|THREE PATHS:|IF PROVIDED:|ZERO|COMPLETE|GLIMMER|PARTIAL|PRESSURE:|IMPORTANT:)/);
  
  if (segments.length <= 1) {
    // No special formatting needed
    return <p className="text-xs text-white/60 leading-relaxed">{description}</p>;
  }

  return (
    <div className="space-y-1.5 text-xs">
      {segments.map((segment, i) => {
        const trimmed = segment.trim();
        if (!trimmed) return null;

        // Determine segment type and styling
        let labelClass = "text-white/50";
        let textClass = "text-white/60";
        let label = "";
        let content = trimmed;

        if (trimmed.startsWith("POSITIVE:") || trimmed.startsWith("EXCELLENT") || trimmed.startsWith("BENEFIT:") || trimmed.startsWith("IMPROVEMENT:") || trimmed.startsWith("GLIMMER")) {
          labelClass = "text-emerald-400 font-semibold";
          textClass = "text-emerald-300/80";
          const colonIndex = trimmed.indexOf(":");
          if (colonIndex > -1) {
            label = trimmed.substring(0, colonIndex + 1);
            content = trimmed.substring(colonIndex + 1).trim();
          }
        } else if (trimmed.startsWith("CHALLENGE:") || trimmed.startsWith("CRITICAL") || trimmed.startsWith("DANGER:") || trimmed.startsWith("ZERO") || trimmed.startsWith("COMPLETE") || trimmed.startsWith("PRESSURE:")) {
          labelClass = "text-amber-400 font-semibold";
          textClass = "text-amber-300/80";
          const colonIndex = trimmed.indexOf(":");
          if (colonIndex > -1) {
            label = trimmed.substring(0, colonIndex + 1);
            content = trimmed.substring(colonIndex + 1).trim();
          }
        } else if (trimmed.startsWith("INSIGHT:") || trimmed.startsWith("REALITY:") || trimmed.startsWith("KEY") || trimmed.startsWith("IMPORTANT:") || trimmed.startsWith("IF PROVIDED:") || trimmed.startsWith("PARTIAL")) {
          labelClass = "text-cyan-400 font-semibold";
          textClass = "text-cyan-300/80";
          const colonIndex = trimmed.indexOf(":");
          if (colonIndex > -1) {
            label = trimmed.substring(0, colonIndex + 1);
            content = trimmed.substring(colonIndex + 1).trim();
          }
        } else if (trimmed.startsWith("OPPORTUNITY:") || trimmed.startsWith("REFORM") || trimmed.startsWith("TWO PATHS:") || trimmed.startsWith("THREE PATHS:")) {
          labelClass = "text-purple-400 font-semibold";
          textClass = "text-purple-300/80";
          const colonIndex = trimmed.indexOf(":");
          if (colonIndex > -1) {
            label = trimmed.substring(0, colonIndex + 1);
            content = trimmed.substring(colonIndex + 1).trim();
          }
        }

        return (
          <p key={i} className="leading-relaxed">
            {label && <span className={labelClass}>{label} </span>}
            <span className={textClass}>{content}</span>
          </p>
        );
      })}
    </div>
  );
}

// ============================================================================
// TYPES
// ============================================================================

interface CoverageTimelineProps {
  steps: PersonaJourneyStep[];
  outcome: string;
  personaColor: string;
  variant?: 'vertical' | 'horizontal';
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const iconMap: Record<string, React.ElementType> = {
  FileText,
  Send,
  Stethoscope,
  Wallet,
  HeartPulse,
  Building2,
  Plane,
  AlertTriangle,
  User,
  Bed,
  HelpCircle,
  UserPlus,
};

// ============================================================================
// COLOR CONFIG
// ============================================================================

const colorConfig: Record<string, { 
  line: string; 
  dot: string; 
  glow: string;
  bg: string;
  border: string;
  text: string;
}> = {
  purple: {
    line: "from-purple-500 to-violet-600",
    dot: "bg-purple-500",
    glow: "shadow-purple-500/50",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
  },
  cyan: {
    line: "from-cyan-500 to-teal-600",
    dot: "bg-cyan-500",
    glow: "shadow-cyan-500/50",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
  },
  amber: {
    line: "from-amber-500 to-orange-600",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/50",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
  rose: {
    line: "from-rose-500 to-pink-600",
    dot: "bg-rose-500",
    glow: "shadow-rose-500/50",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
  },
  emerald: {
    line: "from-emerald-500 to-green-600",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-500/50",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
  },
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const stepVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const horizontalStepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const tooltipVariants = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0, 
    y: 5, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

// ============================================================================
// VERTICAL TIMELINE COMPONENTS
// ============================================================================

function VerticalTimelineStep({ 
  step, 
  index, 
  isLast, 
  colors 
}: { 
  step: PersonaJourneyStep; 
  index: number; 
  isLast: boolean;
  colors: typeof colorConfig.cyan;
}) {
  const Icon = iconMap[step.icon] || FileText;

  return (
    <motion.div 
      variants={stepVariants}
      className="relative flex gap-4"
    >
      {/* Timeline Line and Dot */}
      <div className="flex flex-col items-center">
        <motion.div
          className={cn(
            "relative z-10 w-10 h-10 rounded-full flex items-center justify-center",
            colors.bg,
            colors.border,
            "border-2",
            "shadow-lg",
            colors.glow
          )}
        >
          <Icon className={cn("w-5 h-5", colors.text)} />
        </motion.div>

        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 min-h-[60px]",
            `bg-gradient-to-b ${colors.line}`,
            "opacity-30"
          )} />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded", colors.bg, colors.text)}>
                  Step {index + 1}
                </span>
                <h4 className="text-base font-semibold text-white">{step.title}</h4>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
            </div>
            <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-white/10">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-medium text-white">{step.duration}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// HORIZONTAL TIMELINE COMPONENTS
// ============================================================================

function HorizontalTimelineStep({ 
  step, 
  index, 
  isLast,
  isFirst,
  colors,
  isSelected,
  onSelect
}: { 
  step: PersonaJourneyStep; 
  index: number; 
  isLast: boolean;
  isFirst: boolean;
  colors: typeof colorConfig.cyan;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = iconMap[step.icon] || FileText;

  return (
    <motion.div 
      variants={horizontalStepVariants}
      className="flex-1 flex flex-col items-center relative"
    >
      {/* Connecting Line */}
      {!isFirst && (
        <div className={cn(
          "absolute top-5 right-1/2 w-full h-0.5",
          `bg-gradient-to-r ${colors.line}`,
          "opacity-30"
        )} />
      )}

      {/* Step Node */}
      <motion.button
        onClick={onSelect}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all",
          isSelected ? [colors.bg, colors.border, "border-2", "ring-2", "ring-offset-2 ring-offset-slate-900", colors.glow.replace("shadow", "ring")] 
                     : [colors.bg, colors.border, "border", "hover:border-2"],
          "shadow-lg",
          colors.glow
        )}
      >
        <Icon className={cn("w-4 h-4", colors.text)} />
      </motion.button>

      {/* Step Label */}
      <div className="mt-2 text-center">
        <p className={cn(
          "text-[10px] font-medium",
          isSelected ? colors.text : "text-white/50"
        )}>
          Step {index + 1}
        </p>
        <p className={cn(
          "text-xs font-semibold mt-0.5 max-w-[80px] truncate",
          isSelected ? "text-white" : "text-white/70"
        )}>
          {step.title}
        </p>
      </div>
    </motion.div>
  );
}

function HorizontalTimeline({ 
  steps, 
  outcome, 
  colors 
}: { 
  steps: PersonaJourneyStep[]; 
  outcome: string;
  colors: typeof colorConfig.cyan;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedStep = steps[selectedIndex];
  const Icon = iconMap[selectedStep?.icon] || FileText;

  return (
    <div className="h-full flex flex-col">
      {/* Timeline Track */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex items-start justify-between px-4 mb-4"
      >
        {steps.map((step, index) => (
          <HorizontalTimelineStep
            key={step.title}
            step={step}
            index={index}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
            colors={colors}
            isSelected={selectedIndex === index}
            onSelect={() => setSelectedIndex(index)}
          />
        ))}
      </motion.div>

      {/* Selected Step Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          variants={tooltipVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 p-4 rounded-xl bg-slate-800/60 border border-white/10 overflow-auto"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn(
              "p-2.5 rounded-xl flex-shrink-0",
              colors.bg,
              colors.border,
              "border"
            )}>
              <Icon className={cn("w-5 h-5", colors.text)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", colors.bg, colors.text)}>
                    Step {selectedIndex + 1}
                  </span>
                  <h4 className="text-base font-semibold text-white">{selectedStep.title}</h4>
                </div>
                <div className="px-2 py-1 rounded-lg bg-slate-700/50 border border-white/10 flex-shrink-0">
                  <span className="text-[10px] text-white/60">Duration: </span>
                  <span className="text-xs font-medium text-white">{selectedStep.duration}</span>
                </div>
              </div>
              <JourneyDescription description={selectedStep.description} colors={colors} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Outcome */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "mt-3 p-3 rounded-lg border flex items-center gap-3",
          colors.bg,
          colors.border
        )}
      >
        <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0", colors.text)} />
        <div className="min-w-0">
          <span className={cn("text-xs font-semibold", colors.text)}>Expected Outcome: </span>
          <span className="text-xs text-white/70">{outcome}</span>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CoverageTimeline({ steps, outcome, personaColor, variant = 'vertical' }: CoverageTimelineProps) {
  const colors = colorConfig[personaColor] || colorConfig.cyan;

  if (variant === 'horizontal') {
    return <HorizontalTimeline steps={steps} outcome={outcome} colors={colors} />;
  }

  // Vertical Timeline (Default)
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="relative"
    >
      {/* Background Decoration */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

      {/* Timeline Steps */}
      <div className="space-y-0">
        {steps.map((step, index) => (
          <VerticalTimelineStep
            key={step.title}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
            colors={colors}
          />
        ))}
      </div>

      {/* Outcome Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: steps.length * 0.15 + 0.3, duration: 0.5 }}
        className="mt-6 ml-14"
      >
        <div className={cn("p-5 rounded-xl border", colors.bg, colors.border)}>
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", colors.bg)}>
              <CheckCircle2 className={cn("w-5 h-5", colors.text)} />
            </div>
            <div>
              <h4 className={cn("text-sm font-semibold mb-1", colors.text)}>Expected Outcome</h4>
              <p className="text-sm text-white/70">{outcome}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: steps.length * 0.15 + 0.5 }}
        className="text-[10px] text-white/30 mt-4 ml-14"
      >
        * Actual timelines may vary based on individual circumstances, employer compliance, and regulatory processes.
      </motion.p>
    </motion.div>
  );
}

export default CoverageTimeline;
