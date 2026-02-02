/**
 * Arthur D. Little - Global Health Platform
 * Pillar Grid Component - Best Practices Entry View
 * 
 * Displays the 4 framework pillars as interactive cards.
 * Entry point for the Best Practices Compendium.
 */

import { motion } from "framer-motion";
import { Crown, Shield, Eye, Heart, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

// Pillar definitions
const PILLARS = [
  {
    id: "governance",
    name: "Governance Ecosystem",
    description: "Strategic capacity & policy foundations",
    icon: Crown,
    color: "purple",
    gradient: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/30 hover:border-purple-500/50",
    iconBg: "bg-purple-500/20",
    textColor: "text-purple-400",
  },
  {
    id: "hazard",
    name: "Hazard Prevention",
    description: "Pillar I — Prevention & Control",
    icon: Shield,
    color: "blue",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30 hover:border-blue-500/50",
    iconBg: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  {
    id: "vigilance",
    name: "Surveillance & Detection",
    description: "Pillar II — Health Vigilance",
    icon: Eye,
    color: "emerald",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    iconBg: "bg-emerald-500/20",
    textColor: "text-emerald-400",
  },
  {
    id: "restoration",
    name: "Restoration & Compensation",
    description: "Pillar III — Recovery & Support",
    icon: Heart,
    color: "amber",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30 hover:border-amber-500/50",
    iconBg: "bg-amber-500/20",
    textColor: "text-amber-400",
  },
];

interface PillarStatus {
  id: string;
  question_count: number;
  completed_count: number;
}

interface PillarGridProps {
  pillarStatuses: PillarStatus[];
  isLoading: boolean;
  onSelectPillar: (pillarId: string) => void;
}

export function PillarGrid({ pillarStatuses, isLoading, onSelectPillar }: PillarGridProps) {
  const getStatus = (pillarId: string) => {
    return pillarStatuses.find((p) => p.id === pillarId) || { question_count: 4, completed_count: 0 };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {PILLARS.map((pillar, index) => {
        const Icon = pillar.icon;
        const status = getStatus(pillar.id);
        const isComplete = status.completed_count === status.question_count;
        
        return (
          <motion.button
            key={pillar.id}
            onClick={() => onSelectPillar(pillar.id)}
            className={cn(
              "relative group text-left p-6 rounded-2xl border backdrop-blur-sm transition-all overflow-hidden",
              "bg-gradient-to-br from-slate-800/60 to-slate-900/60",
              pillar.border
            )}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Background gradient */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", pillar.gradient)} />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center border",
                    pillar.iconBg,
                    `border-${pillar.color}-500/40`
                  )}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className={cn("w-7 h-7", pillar.textColor)} />
                </motion.div>
                
                {/* Status badge */}
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  isComplete 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                )}>
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isComplete ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : null}
                  <span>{status.completed_count}/{status.question_count} ready</span>
                </div>
              </div>
              
              {/* Title & Description */}
              <h3 className="text-xl font-semibold text-white mb-2">{pillar.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{pillar.description}</p>
              
              {/* Progress bar */}
              <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-4">
                <motion.div
                  className={cn("absolute inset-y-0 left-0 rounded-full", `bg-${pillar.color}-500`)}
                  initial={{ width: 0 }}
                  animate={{ width: `${(status.completed_count / status.question_count) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                />
              </div>
              
              {/* Explore link */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">4 strategic questions</span>
                <motion.div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors",
                    pillar.textColor
                  )}
                  whileHover={{ x: 4 }}
                >
                  <span>Explore</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </div>
            </div>
            
            {/* Hover glow effect */}
            <motion.div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-gradient-to-t from-transparent via-transparent to-white/5"
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

export default PillarGrid;
