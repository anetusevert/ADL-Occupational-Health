/**
 * Pillar Quadrant Component
 * 
 * Displays 4 framework pillar tiles:
 * - Governance
 * - Hazard Control
 * - Vigilance
 * - Restoration
 * 
 * Each tile shows score with progress ring and status.
 * Click to open pillar detail overlay.
 */

import { motion } from "framer-motion";
import { Crown, Shield, Eye, HeartPulse } from "lucide-react";
import { cn } from "../../lib/utils";
import type { PillarType } from "../../pages/CountryDashboard";

interface PillarQuadrantProps {
  country: {
    iso_code: string;
    name: string;
    governance_score?: number | null;
    pillar1_score?: number | null;
    pillar2_score?: number | null;
    pillar3_score?: number | null;
  };
  onPillarClick: (pillar: PillarType) => void;
}

interface PillarConfig {
  id: PillarType;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  scoreField: "governance_score" | "pillar1_score" | "pillar2_score" | "pillar3_score";
}

const PILLARS: PillarConfig[] = [
  {
    id: "governance",
    name: "Governance",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    scoreField: "governance_score",
  },
  {
    id: "hazard-control",
    name: "Hazard Control",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/20",
    scoreField: "pillar1_score",
  },
  {
    id: "vigilance",
    name: "Vigilance",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    glowColor: "shadow-teal-500/20",
    scoreField: "pillar2_score",
  },
  {
    id: "restoration",
    name: "Restoration",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/20",
    scoreField: "pillar3_score",
  },
];

interface ProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}

function ProgressRing({ score, size = 80, strokeWidth = 6, color }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Background ring */}
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={color}
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm sm:text-base md:text-lg font-bold text-white"
        >
          {score.toFixed(0)}
        </motion.span>
      </div>
    </div>
  );
}

function getScoreStatus(score: number | null): { label: string; color: string } {
  if (score === null) return { label: "No Data", color: "text-white/40" };
  if (score >= 70) return { label: "Strong", color: "text-emerald-400" };
  if (score >= 50) return { label: "Moderate", color: "text-amber-400" };
  if (score >= 30) return { label: "Developing", color: "text-orange-400" };
  return { label: "Critical", color: "text-red-400" };
}

interface PillarTileProps {
  pillar: PillarConfig;
  score: number | null;
  onClick: () => void;
  delay: number;
}

function PillarTile({ pillar, score, onClick, delay }: PillarTileProps) {
  const Icon = pillar.icon;
  const status = getScoreStatus(score);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-2 sm:p-3 rounded-xl border transition-all overflow-hidden group h-full",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        pillar.borderColor,
        "hover:shadow-lg",
        pillar.glowColor,
        "flex flex-col"
      )}
    >
      {/* Animated background gradient on hover */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          pillar.bgColor
        )}
      />
      
      <div className="relative z-10 flex flex-col items-center text-center flex-1 justify-center">
        {/* Icon - responsive */}
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-1 sm:mb-2", pillar.bgColor)}
        >
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6", pillar.color)} />
        </motion.div>
        
        {/* Pillar name - responsive */}
        <h4 className="text-[10px] sm:text-xs md:text-sm font-medium text-white mb-1 sm:mb-2">{pillar.name}</h4>
        
        {/* Progress Ring with Score - responsive sizes */}
        {score !== null ? (
          <ProgressRing 
            score={score} 
            size={50} 
            strokeWidth={4}
            color={pillar.color} 
          />
        ) : (
          <div className="w-[50px] h-[50px] rounded-full border-2 border-dashed border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-white/40">N/A</span>
          </div>
        )}
        
        {/* Status label - compact */}
        <p className={cn("text-[9px] sm:text-[10px] md:text-xs mt-1 font-medium", status.color)}>
          {status.label}
        </p>
      </div>
      
      {/* Explore indicator - hidden on small screens */}
      <div className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
        Click to explore
      </div>
    </motion.button>
  );
}

export function PillarQuadrant({ country, onPillarClick }: PillarQuadrantProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Compact */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/10">
        <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
          Framework Pillars
        </h3>
      </div>
      
      {/* Pillars Grid - Fixed 2x2 with no overflow */}
      <div className="flex-1 p-2 grid grid-cols-2 grid-rows-2 gap-2 min-h-0">
        {PILLARS.map((pillar, index) => (
          <PillarTile
            key={pillar.id}
            pillar={pillar}
            score={country[pillar.scoreField] ?? null}
            onClick={() => onPillarClick(pillar.id)}
            delay={0.1 + index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

export default PillarQuadrant;
