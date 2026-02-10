/**
 * Arthur D. Little - Global Health Platform
 * Personas Page
 * 
 * Interactive exploration of Saudi Arabia's labor force personas
 * from an occupational health perspective. Features animated cards,
 * detailed modal views, and AI-powered research integration.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users2, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe2,
} from "lucide-react";
import { personas, getCoverageStatus, getCoverageLabel, type Persona } from "../data/personas";
import { PersonaCard } from "../components/personas/PersonaCard";
import { PersonaDetailModal } from "../components/personas/PersonaDetailModal";
import { cn } from "../lib/utils";

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 0.4,
      staggerChildren: 0.1, 
      delayChildren: 0.2 
    }
  },
  exit: { opacity: 0 }
};

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const gridVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.12,
      delayChildren: 0.3
    }
  }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CoverageIndicator({ status }: { status: 'full' | 'partial' | 'none' }) {
  const config = {
    full: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
    partial: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
    none: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  };
  
  const { icon: Icon, color, bg, border } = config[status];
  
  return (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", bg, border, "border")}>
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span className={color}>{getCoverageLabel(status)}</span>
    </div>
  );
}

function StatsOverview() {
  const stats = [
    { 
      label: "Total Personas", 
      value: personas.length,
      icon: Users2,
      color: "text-cyan-400"
    },
    { 
      label: "Full Coverage", 
      value: personas.filter(p => getCoverageStatus(p) === 'full').length,
      icon: CheckCircle2,
      color: "text-emerald-400"
    },
    { 
      label: "Partial Coverage", 
      value: personas.filter(p => getCoverageStatus(p) === 'partial').length,
      icon: AlertTriangle,
      color: "text-amber-400"
    },
    { 
      label: "No Coverage", 
      value: personas.filter(p => getCoverageStatus(p) === 'none').length,
      icon: XCircle,
      color: "text-rose-400"
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="flex items-center gap-4"
    >
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10"
        >
          <stat.icon className={cn("w-4 h-4", stat.color)} />
          <span className="text-white/70 text-xs">{stat.label}:</span>
          <span className={cn("font-semibold text-sm", stat.color)}>{stat.value}</span>
        </div>
      ))}
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Personas() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Header */}
      <motion.header 
        variants={headerVariants}
        className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Title and Description */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
                <Users2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                  The Workforce
                  <span className="hidden sm:inline text-xs font-normal text-white/40">|</span>
                  <span className="hidden sm:inline text-sm font-medium text-white/60">Five Personas. Five Realities.</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-white/40 mt-0.5">
                  Each segment of Saudi Arabia's 13M workforce faces distinct occupational health risks and coverage realities.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Data Badge */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Global Data Badge */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-800/60 border border-white/10">
              <Globe2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs text-white/50">Q2 2025 Data</span>
            </div>
          </div>
        </div>

        {/* Stats Row - Hidden on mobile */}
        <div className="mt-3 sm:mt-4 hidden sm:block">
          <StatsOverview />
        </div>
      </motion.header>

      {/* Main Content - Persona Cards Grid */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <motion.div 
          variants={gridVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 max-w-[1800px] mx-auto"
        >
          {personas.map((persona, index) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              index={index}
              onClick={() => setSelectedPersona(persona)}
            />
          ))}
        </motion.div>

        {/* Coverage Legend */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Shield className="w-4 h-4" />
            <span>GOSI Coverage Status</span>
          </div>
          <div className="flex items-center gap-4">
            <CoverageIndicator status="full" />
            <CoverageIndicator status="partial" />
            <CoverageIndicator status="none" />
          </div>
          <p className="text-[10px] text-white/30 text-center max-w-md mt-2">
            Select any persona to explore their hazard profile, coverage status, 
            and journey through the occupational health system — with sourced evidence.
          </p>
        </motion.div>
      </main>

      {/* Persona Detail Modal */}
      <AnimatePresence>
        {selectedPersona && (
          <PersonaDetailModal
            persona={selectedPersona}
            onClose={() => setSelectedPersona(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Personas;
