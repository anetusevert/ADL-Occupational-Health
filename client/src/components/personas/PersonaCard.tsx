/**
 * Arthur D. Little - Global Health Platform
 * PersonaCard Component
 * 
 * Animated persona card with avatar, key stats, and coverage indicator.
 * Uses Framer Motion for entrance and hover animations.
 */

import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { type Persona, getCoverageStatus } from "../../data/personas";
import { PersonaAvatar } from "./PersonaAvatar";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface PersonaCardProps {
  persona: Persona;
  index: number;
  onClick: () => void;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 40, 
    filter: "blur(10px)",
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    scale: 1,
    transition: { 
      duration: 0.6, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    }
  },
  hover: { 
    y: -8,
    transition: { 
      duration: 0.3, 
      ease: "easeOut" 
    }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const glowVariants = {
  initial: { opacity: 0 },
  hover: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

const arrowVariants = {
  initial: { x: 0, opacity: 0.5 },
  hover: { 
    x: 4, 
    opacity: 1,
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CoverageBadge({ status }: { status: 'full' | 'partial' | 'none' }) {
  const config = {
    full: { 
      icon: CheckCircle2, 
      label: "Full Coverage",
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10", 
      border: "border-emerald-500/30",
      glow: "shadow-emerald-500/20"
    },
    partial: { 
      icon: AlertTriangle, 
      label: "Partial",
      color: "text-amber-400", 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/30",
      glow: "shadow-amber-500/20"
    },
    none: { 
      icon: XCircle, 
      label: "No Coverage",
      color: "text-rose-400", 
      bg: "bg-rose-500/10", 
      border: "border-rose-500/30",
      glow: "shadow-rose-500/20"
    },
  };
  
  const { icon: Icon, label, color, bg, border } = config[status];
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
      bg, border, "border"
    )}>
      <Icon className={cn("w-3 h-3", color)} />
      <span className={color}>{label}</span>
    </div>
  );
}

function StatPill({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ElementType; 
  value: string | number; 
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <Icon className={cn("w-3 h-3", color)} />
      <span className="text-white/70">{label}:</span>
      <span className={cn("font-semibold", color)}>{value}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PersonaCard({ persona, index, onClick }: PersonaCardProps) {
  const Icon = persona.icon;
  const coverageStatus = getCoverageStatus(persona);
  
  // Color mapping for gradient borders
  const colorConfig: Record<string, { ring: string; glow: string; accent: string }> = {
    purple: { 
      ring: "group-hover:ring-purple-500/50", 
      glow: "from-purple-500/30 via-transparent to-transparent",
      accent: "text-purple-400"
    },
    cyan: { 
      ring: "group-hover:ring-cyan-500/50", 
      glow: "from-cyan-500/30 via-transparent to-transparent",
      accent: "text-cyan-400"
    },
    amber: { 
      ring: "group-hover:ring-amber-500/50", 
      glow: "from-amber-500/30 via-transparent to-transparent",
      accent: "text-amber-400"
    },
    rose: { 
      ring: "group-hover:ring-rose-500/50", 
      glow: "from-rose-500/30 via-transparent to-transparent",
      accent: "text-rose-400"
    },
    emerald: { 
      ring: "group-hover:ring-emerald-500/50", 
      glow: "from-emerald-500/30 via-transparent to-transparent",
      accent: "text-emerald-400"
    },
  };
  
  const colors = colorConfig[persona.color] || colorConfig.cyan;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${persona.name} - ${getCoverageStatus(persona) === 'full' ? 'Full GOSI coverage' : getCoverageStatus(persona) === 'partial' ? 'Partial coverage' : 'No coverage'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative cursor-pointer",
        "rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-slate-800/90 to-slate-900/90",
        "border border-white/10",
        "ring-2 ring-transparent transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
        colors.ring
      )}
      style={{ 
        animationDelay: `${index * 0.1}s` 
      }}
    >
      {/* Hover Glow Effect */}
      <motion.div 
        variants={glowVariants}
        className={cn(
          "absolute -inset-1 rounded-2xl opacity-0 blur-xl -z-10",
          `bg-gradient-to-br ${colors.glow}`
        )}
      />

      {/* Card Content */}
      <div className="relative p-5 flex flex-col h-full min-h-[320px]">
        {/* Header: Coverage Badge */}
        <div className="flex items-center justify-between mb-4">
          <CoverageBadge status={coverageStatus} />
          <div className={cn(
            "p-1.5 rounded-lg",
            `bg-${persona.color}-500/10 border border-${persona.color}-500/20`
          )}>
            <Icon className={cn("w-4 h-4", colors.accent)} />
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex-shrink-0 mb-4 flex justify-center">
          <PersonaAvatar 
            persona={persona} 
            size="lg" 
          />
        </div>

        {/* Name and Tagline */}
        <div className="text-center mb-3">
          <h3 className="text-base font-bold text-white mb-1 group-hover:text-white transition-colors">
            {persona.name}
          </h3>
          <p className={cn("text-[11px] font-medium", colors.accent)}>
            {persona.tagline}
          </p>
        </div>

        {/* Key Stats */}
        <div className="flex-1 flex flex-col justify-end gap-2 mt-auto">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-white/5 space-y-1.5">
            <StatPill 
              icon={TrendingUp}
              value={`${persona.demographics.participationRate}%`}
              label="Participation"
              color={colors.accent}
            />
            <StatPill 
              icon={Percent}
              value={`${persona.demographics.populationShare}%`}
              label="Labor Force"
              color="text-white/60"
            />
          </div>

          {/* Explore CTA */}
          <motion.div 
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white/50 group-hover:text-white/80 transition-colors"
          >
            <span>Explore Journey</span>
            <motion.div variants={arrowVariants}>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative gradient line at bottom */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          `bg-gradient-to-r from-transparent via-${persona.color}-500 to-transparent`
        )} />
      </div>
    </motion.div>
  );
}

export default PersonaCard;
