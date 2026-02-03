/**
 * Arthur D. Little - Global Health Platform
 * CoverageTimeline Component
 * 
 * Visual timeline showing the occupational health journey
 * from incident to recovery/outcome.
 */

import { motion } from "framer-motion";
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
// TYPES
// ============================================================================

interface CoverageTimelineProps {
  steps: PersonaJourneyStep[];
  outcome: string;
  personaColor: string;
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
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const stepVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const lineVariants = {
  initial: { scaleY: 0 },
  animate: {
    scaleY: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const dotVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TimelineStep({ 
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
        {/* Dot */}
        <motion.div
          variants={dotVariants}
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

        {/* Connecting Line */}
        {!isLast && (
          <motion.div
            variants={lineVariants}
            className={cn(
              "w-0.5 flex-1 min-h-[60px] origin-top",
              `bg-gradient-to-b ${colors.line}`,
              "opacity-30"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 pb-8",
        isLast && "pb-0"
      )}>
        <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded",
                  colors.bg,
                  colors.text
                )}>
                  Step {index + 1}
                </span>
                <h4 className="text-base font-semibold text-white">
                  {step.title}
                </h4>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                {step.description}
              </p>
            </div>
            
            {/* Duration Badge */}
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
// MAIN COMPONENT
// ============================================================================

export function CoverageTimeline({ steps, outcome, personaColor }: CoverageTimelineProps) {
  const colors = colorConfig[personaColor] || colorConfig.cyan;

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
          <TimelineStep
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
        <div className={cn(
          "p-5 rounded-xl border",
          colors.bg,
          colors.border
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              colors.bg
            )}>
              <CheckCircle2 className={cn("w-5 h-5", colors.text)} />
            </div>
            <div>
              <h4 className={cn("text-sm font-semibold mb-1", colors.text)}>
                Expected Outcome
              </h4>
              <p className="text-sm text-white/70">
                {outcome}
              </p>
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
