/**
 * Arthur D. Little - Global Health Platform
 * Framework Introduction & Explainer Modal
 * 
 * Professional animated walkthrough of the ADL Occupational Health Framework
 * Layout: Content (40% left) | Dynamic Animated Visualization (60% right)
 * Right side dynamically builds animated explanations for each slide
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield,
  Eye,
  Heart,
  Play,
  Scale,
  Users,
  Thermometer,
  Beaker,
  HardHat,
  Stethoscope,
  UserCheck,
  Bell,
  Wallet,
  Building2,
  RefreshCcw,
  Zap,
  TrendingUp,
  CheckCircle,
  Database,
  Info,
  ArrowRight,
  Layers,
  FileCheck,
  Activity,
  Briefcase,
  Quote,
  Lightbulb,
  Globe,
  BookOpen,
  BarChart3,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { guideSlides, type GuideSlide, elementInsights, type ElementInsight } from "../../data/frameworkContent";
import { cn } from "../../lib/utils";
import { CinematicLoader } from "./premium-visuals";

interface InteractionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToBlock?: (blockId: string) => void;
}

// Color system
const colors: Record<string, {
  bg: string;
  bgSolid: string;
  border: string;
  text: string;
  hex: string;
  glow: string;
}> = {
  purple: { bg: "bg-purple-500/20", bgSolid: "bg-purple-600", border: "border-purple-500/30", text: "text-purple-400", hex: "#9333ea", glow: "shadow-purple-500/40" },
  blue: { bg: "bg-blue-500/20", bgSolid: "bg-blue-600", border: "border-blue-500/30", text: "text-blue-400", hex: "#2563eb", glow: "shadow-blue-500/40" },
  emerald: { bg: "bg-emerald-500/20", bgSolid: "bg-emerald-600", border: "border-emerald-500/30", text: "text-emerald-400", hex: "#059669", glow: "shadow-emerald-500/40" },
  amber: { bg: "bg-amber-500/20", bgSolid: "bg-amber-500", border: "border-amber-500/30", text: "text-amber-400", hex: "#f59e0b", glow: "shadow-amber-500/40" },
  cyan: { bg: "bg-cyan-500/20", bgSolid: "bg-cyan-500", border: "border-cyan-500/30", text: "text-cyan-400", hex: "#06b6d4", glow: "shadow-cyan-500/40" },
  slate: { bg: "bg-slate-500/20", bgSolid: "bg-slate-600", border: "border-slate-500/30", text: "text-slate-400", hex: "#475569", glow: "shadow-slate-500/40" },
};

// ============================================================================
// FLOATING PARTICLES BACKGROUND
// ============================================================================

function FloatingParticles({ color = "cyan", count = 20 }: { color?: string; count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: "100%", x: `${Math.random() * 100}%` }}
          animate={{ 
            opacity: [0, 0.4, 0],
            y: "-10%",
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          className={cn(
            "absolute w-1 h-1 rounded-full",
            color === "purple" && "bg-purple-400",
            color === "blue" && "bg-blue-400",
            color === "emerald" && "bg-emerald-400",
            color === "amber" && "bg-amber-400",
            color === "cyan" && "bg-cyan-400",
          )}
        />
      ))}
    </div>
  );
}

// ============================================================================
// INSIGHT OVERLAY - Glassmorphic panel for element insights
// ============================================================================

interface InsightOverlayProps {
  insight: ElementInsight | null;
  onClose: () => void;
  color?: string;
}

function InsightOverlay({ insight, onClose, color = "cyan" }: InsightOverlayProps) {
  const c = colors[color] || colors.cyan;

  // Handle escape key
  useEffect(() => {
    if (!insight) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [insight, onClose]);

  return (
    <AnimatePresence>
      {insight && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-4 sm:inset-8 md:inset-12 z-40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "h-full w-full rounded-2xl border backdrop-blur-xl",
              "bg-slate-900/90 border-white/10",
              "flex flex-col overflow-hidden"
            )}>
              {/* Header */}
              <div className={cn("flex items-center justify-between p-4 border-b border-white/10", c.bg)}>
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bgSolid)}
                  >
                    <Lightbulb className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{insight.label}</h3>
                    <p className={cn("text-xs", c.text)}>Interactive Insight</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-5 space-y-5">
                {/* Data Point - Hero stat */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className={cn("p-4 rounded-xl border", c.bg, c.border)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", c.bgSolid)}>
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", c.text)}>Key Data Point</p>
                      <p className="text-white font-medium leading-relaxed">{insight.dataPoint}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Perspective */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-white/80" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-white/50">Perspective</p>
                      <p className="text-white/90 leading-relaxed">{insight.perspective}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Quote */}
                {insight.quote && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border-l-2 border-white/30"
                  >
                    <div className="flex items-start gap-3">
                      <Quote className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
                      <p className="text-white/80 italic leading-relaxed">"{insight.quote}"</p>
                    </div>
                  </motion.div>
                )}

                {/* Example */}
                {insight.example && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className={cn("p-4 rounded-xl border", c.bg, c.border)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", c.bgSolid)}>
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1", c.text)}>Best Practice Example</p>
                        <p className="text-white/90 leading-relaxed">{insight.example}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Source */}
                {insight.source && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="flex items-center gap-2 text-xs text-white/40"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Source: {insight.source}</span>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-800/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className={cn(
                    "w-full py-2.5 rounded-xl font-medium text-white flex items-center justify-center gap-2",
                    c.bgSolid,
                    "hover:brightness-110 transition-all"
                  )}
                >
                  <span>Got it</span>
                  <CheckCircle className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// ORBITING ELEMENT
// ============================================================================

interface OrbitingElementProps {
  Icon: React.ElementType;
  label: string;
  color: string;
  index: number;
  total: number;
  delay?: number;
  radius?: number;
  insightId?: string;
  onInsightClick?: (insightId: string) => void;
}

function OrbitingElement({ Icon, label, color, index, total, delay = 0, radius = 130, insightId, onInsightClick }: OrbitingElementProps) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const c = colors[color];
  const isClickable = !!insightId && !!onInsightClick;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (insightId && onInsightClick) {
      onInsightClick(insightId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + index * 0.15, duration: 0.5, type: "spring" }}
      className="absolute"
      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3 }}
        className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div 
          onClick={handleClick}
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg relative",
            c.bgSolid, c.glow,
            isClickable && "cursor-pointer"
          )}
          whileHover={{ scale: 1.15 }}
          whileTap={isClickable ? { scale: 0.95 } : undefined}
        >
          <Icon className="w-7 h-7 text-white" />
          
          {/* Clickable indicator - subtle pulse ring */}
          {isClickable && (
            <motion.div
              className={cn("absolute inset-0 rounded-xl border-2", c.border)}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
        <span className={cn(
          "mt-2 text-[11px] font-medium text-white/80 text-center max-w-20 leading-tight",
          isClickable && "group-hover:text-white"
        )}>
          {label}
        </span>
        
        {/* Click hint */}
        {isClickable && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + index * 0.15 + 1 }}
            className="mt-1 text-[9px] text-white/40"
          >
            Click to explore
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// INTRO VISUAL - ADL Logo with animated rings
// ============================================================================

function IntroVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <FloatingParticles color="cyan" count={25} />
      
      {/* Orbiting rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 1, rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ 
            opacity: { delay: i * 0.2, duration: 0.5 },
            scale: { delay: i * 0.2, duration: 0.5 },
            rotate: { duration: 20 + i * 10, repeat: Infinity, ease: "linear" }
          }}
          className={cn(
            "absolute rounded-full border-2",
            i === 1 && "w-48 h-48 border-cyan-500/40",
            i === 2 && "w-72 h-72 border-purple-500/30",
            i === 3 && "w-96 h-96 border-cyan-500/20",
          )}
        />
      ))}

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ 
            filter: ["drop-shadow(0 0 30px rgba(6,182,212,0.3))", "drop-shadow(0 0 50px rgba(6,182,212,0.5))", "drop-shadow(0 0 30px rgba(6,182,212,0.3))"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src="/adl-logo.png" alt="ADL" className="h-20 mx-auto" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <p className="text-xl font-bold text-white">Arthur D. Little</p>
          <p className="text-cyan-400 text-sm mt-1">Global Health Intelligence</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex items-center justify-center gap-2 text-white/50 text-sm"
        >
          <Layers className="w-4 h-4" />
          <span>ADL Occupational Health Framework v2.0</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// TEMPLE OVERVIEW VISUAL - Building the temple with measurement rulers
// ============================================================================

function TempleOverviewVisual() {
  const pillars = [
    { icon: Shield, label: "Prevention", sublabel: "Hazard Control", color: "blue", delay: 0.6, score: "0-100", metrics: 7 },
    { icon: Eye, label: "Vigilance", sublabel: "Surveillance", color: "emerald", delay: 0.75, score: "0-100", metrics: 6 },
    { icon: Heart, label: "Restoration", sublabel: "Compensation", color: "amber", delay: 0.9, score: "0-100", metrics: 6 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <FloatingParticles color="purple" count={15} />
      
      <div className="relative w-full max-w-lg">
        {/* Measurement ruler - Left side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute -left-8 top-0 bottom-0 flex flex-col items-center justify-between py-4"
        >
          <div className="w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent relative">
            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick, i) => (
              <motion.div
                key={tick}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.6 + i * 0.1 }}
                className="absolute right-0 flex items-center gap-1"
                style={{ top: `${100 - tick}%`, transform: 'translateY(-50%)' }}
              >
                <span className="text-[8px] text-white/40 w-4 text-right">{tick}</span>
                <div className="w-2 h-px bg-white/30" />
              </motion.div>
            ))}
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-[8px] text-white/40 -rotate-90 origin-center whitespace-nowrap mt-4"
          >
            Maturity Score
          </motion.span>
        </motion.div>

        {/* Total score badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.2, type: "spring" }}
          className="absolute -right-4 top-4 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl p-3 shadow-lg shadow-cyan-500/30"
        >
          <p className="text-[8px] text-white/80 uppercase tracking-wider">Total</p>
          <p className="text-xl font-bold text-white">0-100</p>
          <p className="text-[8px] text-white/60">25 Metrics</p>
        </motion.div>

        {/* Governance Roof */}
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
          className="relative mb-6"
        >
          <motion.div 
            className="h-24 bg-gradient-to-b from-purple-500/50 to-purple-600/30 rounded-xl border-2 border-purple-400/50 flex items-center justify-between px-4 shadow-lg shadow-purple-500/20"
            animate={{ boxShadow: ["0 0 20px rgba(147,51,234,0.2)", "0 0 40px rgba(147,51,234,0.4)", "0 0 20px rgba(147,51,234,0.2)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <Crown className="w-10 h-10 text-purple-300" />
              <div className="text-left">
                <span className="text-white font-bold text-lg">GOVERNANCE</span>
                <p className="text-purple-300 text-xs">The Overarching Driver</p>
              </div>
            </div>
            {/* Score badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, type: "spring" }}
              className="bg-purple-500/30 rounded-lg px-3 py-1.5 border border-purple-400/30"
            >
              <p className="text-[8px] text-purple-300 uppercase">Score</p>
              <p className="text-sm font-bold text-purple-200">0-100</p>
              <p className="text-[8px] text-purple-300/60">6 metrics</p>
            </motion.div>
          </motion.div>
          
          {/* Connecting arrows with data flow animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-8"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 20 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className={cn(
                    "w-0.5 rounded-full",
                    i === 0 && "bg-blue-400/60",
                    i === 1 && "bg-emerald-400/60",
                    i === 2 && "bg-amber-400/60",
                  )}
                />
                {/* Data flow dot */}
                <motion.div
                  animate={{ y: [0, 16, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                    i === 0 && "bg-blue-400",
                    i === 1 && "bg-emerald-400",
                    i === 2 && "bg-amber-400",
                  )}
                />
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Three Pillars with metrics */}
        <div className="flex gap-3 mt-8">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pillar.delay, duration: 0.5, type: "spring" }}
              className={cn(
                "flex-1 rounded-xl border-2 flex flex-col items-center justify-between py-3 shadow-lg relative overflow-hidden",
                pillar.color === "blue" && "bg-blue-500/20 border-blue-400/50 shadow-blue-500/20",
                pillar.color === "emerald" && "bg-emerald-500/20 border-emerald-400/50 shadow-emerald-500/20",
                pillar.color === "amber" && "bg-amber-500/20 border-amber-400/50 shadow-amber-500/20",
              )}
            >
              {/* Fill bar animation */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ delay: pillar.delay + 0.5, duration: 1, ease: "easeOut" }}
                className={cn(
                  "absolute bottom-0 left-0 right-0 opacity-20",
                  pillar.color === "blue" && "bg-blue-400",
                  pillar.color === "emerald" && "bg-emerald-400",
                  pillar.color === "amber" && "bg-amber-400",
                )}
              />
              
              <div className="relative z-10 text-center">
                <pillar.icon className={cn(
                  "w-8 h-8 mx-auto",
                  pillar.color === "blue" && "text-blue-300",
                  pillar.color === "emerald" && "text-emerald-300",
                  pillar.color === "amber" && "text-amber-300",
                )} />
                <span className="text-xs font-bold text-white mt-1 block">{pillar.label}</span>
                <span className="text-[9px] text-white/50">{pillar.sublabel}</span>
              </div>
              
              {/* Metrics badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: pillar.delay + 0.8 }}
                className={cn(
                  "relative z-10 mt-2 px-2 py-1 rounded-md text-center",
                  pillar.color === "blue" && "bg-blue-500/30",
                  pillar.color === "emerald" && "bg-emerald-500/30",
                  pillar.color === "amber" && "bg-amber-500/30",
                )}
              >
                <p className={cn(
                  "text-[10px] font-bold",
                  pillar.color === "blue" && "text-blue-200",
                  pillar.color === "emerald" && "text-emerald-200",
                  pillar.color === "amber" && "text-amber-200",
                )}>{pillar.score}</p>
                <p className="text-[8px] text-white/50">{pillar.metrics} metrics</p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Foundation with data indicator */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-4 h-6 bg-gradient-to-r from-slate-600/30 via-slate-500/50 to-slate-600/30 rounded-lg flex items-center justify-center gap-2"
        >
          <Database className="w-3 h-3 text-slate-400" />
          <span className="text-[9px] text-slate-400">180+ Data Sources</span>
        </motion.div>

        {/* Maturity levels indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="mt-4 flex justify-center gap-2"
        >
          {[
            { level: "Critical", range: "0-25", color: "bg-red-500/40 border-red-500/50" },
            { level: "Developing", range: "26-50", color: "bg-amber-500/40 border-amber-500/50" },
            { level: "Advancing", range: "51-75", color: "bg-blue-500/40 border-blue-500/50" },
            { level: "Leading", range: "76-100", color: "bg-emerald-500/40 border-emerald-500/50" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.9 + i * 0.1 }}
              className={cn("px-2 py-1 rounded-md border text-center", item.color)}
            >
              <p className="text-[8px] text-white/80 font-medium">{item.level}</p>
              <p className="text-[7px] text-white/50">{item.range}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// GOVERNANCE VISUAL - Key governance elements orbiting
// ============================================================================

interface VisualProps {
  onInsightClick?: (insightId: string) => void;
}

function GovernanceVisual({ onInsightClick }: VisualProps) {
  const elements = [
    { icon: Scale, label: "Legislative Backbone", sublabel: "ILO/National Laws", insightId: "legislative-backbone" },
    { icon: Users, label: "Enforcement", sublabel: "Inspectorate", insightId: "enforcement" },
    { icon: Heart, label: "National Culture", sublabel: "Just Culture Safety", insightId: "national-culture" },
    { icon: TrendingUp, label: "Strategic Capacity", sublabel: "Research & Professionals", insightId: "strategic-capacity" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <FloatingParticles color="purple" count={20} />
      
      {/* Central crown - clickable */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-10"
      >
        <motion.div
          onClick={() => onInsightClick?.("governance-central")}
          animate={{ 
            boxShadow: ["0 0 40px rgba(147,51,234,0.3)", "0 0 60px rgba(147,51,234,0.5)", "0 0 40px rgba(147,51,234,0.3)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-xl cursor-pointer relative"
        >
          <Crown className="w-14 h-14 text-white" />
          {/* Pulse ring for clickability */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-purple-300/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-3 text-purple-300 font-semibold"
        >
          Governance
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] text-purple-400/60"
        >
          Click to explore
        </motion.p>
      </motion.div>

      {/* Orbiting elements */}
      {elements.map((el, i) => (
        <OrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          color="purple"
          index={i}
          total={elements.length}
          delay={0.3}
          radius={150}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {elements.map((_, i) => {
          const angle = (i / elements.length) * Math.PI * 2 - Math.PI / 2;
          const endX = 50 + Math.cos(angle) * 25;
          const endY = 50 + Math.sin(angle) * 25;
          return (
            <motion.line
              key={i}
              x1="50%"
              y1="50%"
              x2={`${endX}%`}
              y2={`${endY}%`}
              stroke="rgba(147,51,234,0.3)"
              strokeWidth="2"
              strokeDasharray="6 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// HAZARD PREVENTION VISUAL (Pillar 1)
// ============================================================================

function HazardPreventionVisual({ onInsightClick }: VisualProps) {
  const elements = [
    { icon: Beaker, label: "Hazard Registry", sublabel: "Physical/Chemical", insightId: "hazard-registry" },
    { icon: HardHat, label: "Control Maturity", sublabel: "Engineering > PPE", insightId: "control-maturity" },
    { icon: Thermometer, label: "Climate Defense", sublabel: "Heat Protocols", insightId: "climate-defense" },
    { icon: FileCheck, label: "Risk Assessment", sublabel: "Documentation", insightId: "risk-assessment" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <FloatingParticles color="blue" count={20} />
      
      {/* Central shield - clickable */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-10"
      >
        <motion.div
          onClick={() => onInsightClick?.("prevention-central")}
          animate={{ 
            boxShadow: ["0 0 40px rgba(37,99,235,0.3)", "0 0 60px rgba(37,99,235,0.5)", "0 0 40px rgba(37,99,235,0.3)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl cursor-pointer relative"
        >
          <Shield className="w-14 h-14 text-white" />
          {/* Pulse ring for clickability */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-blue-300/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-3"
        >
          <p className="text-blue-300 font-semibold">Prevention</p>
          <p className="text-blue-400/60 text-xs">$1 saves $4-6</p>
          <p className="text-[10px] text-blue-400/50 mt-1">Click to explore</p>
        </motion.div>
      </motion.div>

      {/* Orbiting elements */}
      {elements.map((el, i) => (
        <OrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          color="blue"
          index={i}
          total={elements.length}
          delay={0.3}
          radius={150}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SURVEILLANCE VISUAL (Pillar 2)
// ============================================================================

function SurveillanceVisual({ onInsightClick }: VisualProps) {
  const elements = [
    { icon: Stethoscope, label: "Active Surveillance", sublabel: "Biomarkers", insightId: "active-surveillance" },
    { icon: UserCheck, label: "Vulnerability Index", sublabel: "At-Risk Groups", insightId: "vulnerability-index" },
    { icon: Bell, label: "Early Warning", sublabel: "Predictive Analytics", insightId: "early-warning" },
    { icon: Activity, label: "Health Monitoring", sublabel: "Continuous", insightId: "health-monitoring" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <FloatingParticles color="emerald" count={20} />
      
      {/* Pulse waves */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5, scale: 0.3 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8 }}
          className="absolute w-40 h-40 rounded-full border-2 border-emerald-400/40"
        />
      ))}
      
      {/* Central eye - clickable */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-10"
      >
        <motion.div
          onClick={() => onInsightClick?.("surveillance-central")}
          animate={{ 
            boxShadow: ["0 0 40px rgba(5,150,105,0.3)", "0 0 60px rgba(5,150,105,0.5)", "0 0 40px rgba(5,150,105,0.3)"]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl cursor-pointer relative"
        >
          <Eye className="w-14 h-14 text-white" />
          {/* Pulse ring for clickability */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-emerald-300/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-3"
        >
          <p className="text-emerald-300 font-semibold">Vigilance</p>
          <p className="text-emerald-400/60 text-xs">60% cost reduction</p>
          <p className="text-[10px] text-emerald-400/50 mt-1">Click to explore</p>
        </motion.div>
      </motion.div>

      {/* Orbiting elements */}
      {elements.map((el, i) => (
        <OrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          color="emerald"
          index={i}
          total={elements.length}
          delay={0.3}
          radius={150}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// RESTORATION VISUAL (Pillar 3)
// ============================================================================

function RestorationVisual({ onInsightClick }: VisualProps) {
  const elements = [
    { icon: Wallet, label: "Payer Mechanism", sublabel: "No-Fault Insurance", insightId: "payer-mechanism" },
    { icon: Building2, label: "Rehabilitation", sublabel: "Clinics/Training", insightId: "rehabilitation" },
    { icon: RefreshCcw, label: "Return to Work", sublabel: "RTW Policy", insightId: "return-to-work" },
    { icon: Briefcase, label: "Compensation", sublabel: "Fair Benefits", insightId: "compensation" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <FloatingParticles color="amber" count={20} />
      
      {/* Central heart - clickable */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative z-10"
      >
        <motion.div
          onClick={() => onInsightClick?.("restoration-central")}
          animate={{ 
            scale: [1, 1.05, 1],
            boxShadow: ["0 0 40px rgba(245,158,11,0.3)", "0 0 60px rgba(245,158,11,0.5)", "0 0 40px rgba(245,158,11,0.3)"]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl cursor-pointer relative"
        >
          <Heart className="w-14 h-14 text-white" />
          {/* Pulse ring for clickability */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-amber-300/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-3"
        >
          <p className="text-amber-300 font-semibold">Restoration</p>
          <p className="text-amber-400/60 text-xs">Safety Net</p>
          <p className="text-[10px] text-amber-400/50 mt-1">Click to explore</p>
        </motion.div>
      </motion.div>

      {/* Orbiting elements */}
      {elements.map((el, i) => (
        <OrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          color="amber"
          index={i}
          total={elements.length}
          delay={0.3}
          radius={150}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// INTEGRATION VISUAL - All components connected with animated feedback loop
// ============================================================================

function IntegrationVisual({ onInsightClick }: VisualProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  const governanceControls = useAnimationControls();
  const pillar1Controls = useAnimationControls();
  const pillar2Controls = useAnimationControls();
  const pillar3Controls = useAnimationControls();
  const arrowControls = useAnimationControls();

  const pillars = [
    { icon: Shield, color: "blue", bgColor: "bg-blue-600", shadowColor: "shadow-blue-500/30", glowColor: "rgba(37,99,235,0.6)", controls: pillar1Controls },
    { icon: Eye, color: "emerald", bgColor: "bg-emerald-600", shadowColor: "shadow-emerald-500/30", glowColor: "rgba(5,150,105,0.6)", controls: pillar2Controls },
    { icon: Heart, color: "amber", bgColor: "bg-amber-500", shadowColor: "shadow-amber-500/30", glowColor: "rgba(245,158,11,0.6)", controls: pillar3Controls },
  ];

  const triggerFeedbackAnimation = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // Phase 1: Highlight Governance
    setAnimationPhase(1);
    await governanceControls.start({
      scale: [1, 1.2, 1],
      boxShadow: ["0 0 20px rgba(147,51,234,0.3)", "0 0 60px rgba(147,51,234,0.8)", "0 0 20px rgba(147,51,234,0.3)"],
      transition: { duration: 0.6 }
    });
    
    // Phase 2: Arrow pulses down
    setAnimationPhase(2);
    await arrowControls.start({
      y: [0, 15, 0],
      opacity: [0.5, 1, 0.5],
      transition: { duration: 0.4 }
    });
    
    // Phase 3: Highlight pillars sequentially (Prevention → Surveillance → Restoration)
    setAnimationPhase(3);
    await pillar1Controls.start({
      scale: [1, 1.25, 1],
      boxShadow: ["0 0 20px rgba(37,99,235,0.3)", "0 0 50px rgba(37,99,235,0.8)", "0 0 20px rgba(37,99,235,0.3)"],
      transition: { duration: 0.5 }
    });
    
    setAnimationPhase(4);
    await pillar2Controls.start({
      scale: [1, 1.25, 1],
      boxShadow: ["0 0 20px rgba(5,150,105,0.3)", "0 0 50px rgba(5,150,105,0.8)", "0 0 20px rgba(5,150,105,0.3)"],
      transition: { duration: 0.5 }
    });
    
    setAnimationPhase(5);
    await pillar3Controls.start({
      scale: [1, 1.25, 1],
      boxShadow: ["0 0 20px rgba(245,158,11,0.3)", "0 0 50px rgba(245,158,11,0.8)", "0 0 20px rgba(245,158,11,0.3)"],
      transition: { duration: 0.5 }
    });
    
    // Phase 4: Back to Governance (completing the loop)
    setAnimationPhase(6);
    await governanceControls.start({
      scale: [1, 1.15, 1],
      boxShadow: ["0 0 20px rgba(147,51,234,0.3)", "0 0 50px rgba(147,51,234,0.8)", "0 0 30px rgba(147,51,234,0.4)"],
      transition: { duration: 0.6 }
    });
    
    setAnimationPhase(0);
    setIsAnimating(false);
    
    // Show insight after animation
    onInsightClick?.("feedback-loop");
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <FloatingParticles color="cyan" count={25} />
      
      <div className="relative w-full max-w-sm">
        {/* Governance at top */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mx-auto w-20 h-20 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 relative"
        >
          <motion.div
            animate={governanceControls}
            className="absolute inset-0 rounded-xl bg-purple-600"
          />
          <Crown className="w-10 h-10 text-white relative z-10" />
          
          {/* Highlight ring during animation */}
          {animationPhase === 1 && (
            <motion.div
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0, 0.8, 0] }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-xl border-2 border-purple-300"
            />
          )}
        </motion.div>

        {/* Flow arrows */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center my-4"
        >
          <motion.div
            animate={isAnimating ? arrowControls : { y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: isAnimating ? 0 : Infinity }}
          >
            <ArrowDown className={cn(
              "w-8 h-8 transition-colors duration-300",
              animationPhase === 2 ? "text-cyan-300" : "text-purple-400"
            )} />
          </motion.div>
        </motion.div>

        {/* Three pillars */}
        <div className="flex justify-center gap-4">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.15, type: "spring" }}
              className="relative"
            >
              <motion.div
                animate={p.controls}
                className={cn("w-16 h-16 rounded-xl flex items-center justify-center shadow-lg", p.bgColor, p.shadowColor)}
              >
                <p.icon className="w-8 h-8 text-white" />
              </motion.div>
              
              {/* Connecting arrows between pillars during animation */}
              {animationPhase >= 3 && animationPhase <= 5 && i < 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: animationPhase >= 3 + i ? 1 : 0, x: 0 }}
                  className="absolute top-1/2 -right-3 transform -translate-y-1/2"
                >
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Feedback loop - CLICKABLE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          onClick={triggerFeedbackAnimation}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "mt-8 p-4 rounded-xl border cursor-pointer transition-all",
            isAnimating 
              ? "bg-cyan-500/20 border-cyan-400/60 shadow-lg shadow-cyan-500/20" 
              : "bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/15 hover:border-cyan-400/50"
          )}
        >
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: isAnimating ? 720 : 360 }}
              transition={{ 
                duration: isAnimating ? 1 : 4, 
                repeat: Infinity, 
                ease: isAnimating ? "easeInOut" : "linear" 
              }}
            >
              <RefreshCcw className={cn(
                "w-6 h-6 transition-colors",
                isAnimating ? "text-cyan-300" : "text-cyan-400"
              )} />
            </motion.div>
            <div className="text-center">
              <p className="text-cyan-300 font-semibold text-sm">Continuous Feedback Loop</p>
              <p className="text-cyan-400/60 text-xs">
                {isAnimating ? "Watch the data flow..." : "Click to see the interaction"}
              </p>
            </div>
          </div>
          
          {/* Pulsing border hint */}
          {!isAnimating && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-cyan-400/50"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </motion.div>

        {/* Database foundation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm"
        >
          <Database className="w-4 h-4" />
          <span>Global OH Database & Intelligence Engine</span>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// CONCLUSION VISUAL - Ready to explore
// ============================================================================

interface ConclusionVisualProps {
  onNavigate?: (blockId: string) => void;
  onCloseAndExplore?: () => void;
}

function ConclusionVisual({ onNavigate, onCloseAndExplore }: ConclusionVisualProps) {
  const pillars = [
    { icon: Crown, label: "Governance", color: "purple", blockId: "governance" },
    { icon: Shield, label: "Prevention", color: "blue", blockId: "pillar-1" },
    { icon: Eye, label: "Vigilance", color: "emerald", blockId: "pillar-2" },
    { icon: Heart, label: "Restoration", color: "amber", blockId: "pillar-3" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <FloatingParticles color="cyan" count={30} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="text-center"
      >
        {/* Animated framework icon - Clickable to explore full framework */}
        <motion.div
          onClick={onCloseAndExplore}
          animate={{ 
            y: [0, -15, 0],
            boxShadow: ["0 0 40px rgba(6,182,212,0.2)", "0 0 60px rgba(6,182,212,0.4)", "0 0 40px rgba(6,182,212,0.2)"]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-36 h-36 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 via-purple-500 to-cyan-600 flex items-center justify-center shadow-2xl cursor-pointer relative"
        >
          <Layers className="w-20 h-20 text-white" />
          {/* Pulse ring for clickability */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-cyan-300/50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <p className="text-2xl font-bold text-white">Ready to Explore</p>
          <p className="text-cyan-400 mt-2">Click any component to dive deeper</p>
        </motion.div>

        {/* Pillar navigation buttons - Click to navigate directly to pillar details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex justify-center gap-4"
        >
          {pillars.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
              onClick={() => onNavigate?.(item.blockId)}
              whileHover={{ scale: 1.15, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer relative group",
                colors[item.color].bgSolid,
                "shadow-lg hover:shadow-xl transition-shadow"
              )}
            >
              <item.icon className="w-6 h-6 text-white" />
              
              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[10px] text-white/70 whitespace-nowrap bg-slate-800/80 px-2 py-1 rounded">
                  {item.label}
                </span>
              </div>
              
              {/* Pulse indicator */}
              <motion.div
                className={cn("absolute inset-0 rounded-xl border-2", colors[item.color].border)}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-6 text-xs text-white/40"
        >
          Click a pillar icon to jump directly to its details
        </motion.p>
      </motion.div>
    </div>
  );
}

// ============================================================================
// GLOBAL CHALLENGE VISUAL - Statistics about the problem
// ============================================================================

function GlobalChallengeVisual() {
  const stats = [
    { value: "2.9M", label: "Deaths Annually", color: "amber", delay: 0.3 },
    { value: "395M", label: "Workplace Injuries", color: "blue", delay: 0.5 },
    { value: "4%", label: "GDP Lost", color: "purple", delay: 0.7 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <FloatingParticles color="amber" count={30} />
      
      <div className="relative z-10 text-center">
        {/* Pulsing world visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          {/* Globe representation */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 40px rgba(245,158,11,0.2), 0 0 80px rgba(245,158,11,0.1)",
                "0 0 60px rgba(245,158,11,0.4), 0 0 120px rgba(245,158,11,0.2)",
                "0 0 40px rgba(245,158,11,0.2), 0 0 80px rgba(245,158,11,0.1)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-amber-500/30 to-amber-700/20 border-2 border-amber-500/40 flex items-center justify-center"
          >
            <Globe className="w-20 h-20 text-amber-400/80" />
          </motion.div>
          
          {/* Pulse rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-amber-500/30"
            />
          ))}
        </motion.div>

        {/* Stats */}
        <div className="flex justify-center gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay, duration: 0.6 }}
              className={cn(
                "px-4 py-3 rounded-xl border backdrop-blur-sm",
                colors[stat.color].bg,
                colors[stat.color].border
              )}
            >
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: stat.delay + 0.2, type: "spring" }}
                className={cn("text-2xl font-bold", colors[stat.color].text)}
              >
                {stat.value}
              </motion.p>
              <p className="text-white/60 text-xs mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-amber-400/70 text-sm"
        >
          A preventable crisis requiring systematic action
        </motion.p>
      </div>
    </div>
  );
}

// ============================================================================
// ADL SOLUTION VISUAL - Company credentials
// ============================================================================

function ADLSolutionVisual() {
  const credentials = [
    { icon: TrendingUp, label: "100+ Years", sublabel: "Consulting Excellence" },
    { icon: Globe, label: "40+ Countries", sublabel: "Global Presence" },
    { icon: Database, label: "180+ Nations", sublabel: "Data Coverage" },
    { icon: Zap, label: "Real-Time", sublabel: "Analytics Platform" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <FloatingParticles color="purple" count={25} />
      
      <div className="relative z-10">
        {/* Central ADL logo with glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              filter: [
                "drop-shadow(0 0 30px rgba(147,51,234,0.3))",
                "drop-shadow(0 0 50px rgba(147,51,234,0.5))",
                "drop-shadow(0 0 30px rgba(147,51,234,0.3))",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-700/20 border-2 border-purple-500/40 flex items-center justify-center"
          >
            <img src="/adl-logo.png" alt="ADL" className="h-16 object-contain brightness-0 invert" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-white font-bold text-lg"
          >
            Arthur D. Little
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-purple-400 text-sm"
          >
            The World's First Management Consultancy
          </motion.p>
        </motion.div>

        {/* Credentials grid */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          {credentials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-purple-400/70 text-xs">{item.sublabel}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUCCESS STORIES VISUAL - Country cards with achievements
// ============================================================================

function SuccessStoriesVisual() {
  const countries = [
    { code: "DEU", name: "Germany", achievement: "75% fatality reduction", color: "blue", flag: "🇩🇪" },
    { code: "SGP", name: "Singapore", achievement: "94% compliance rate", color: "emerald", flag: "🇸🇬" },
    { code: "SWE", name: "Sweden", achievement: "Vision Zero pioneer", color: "cyan", flag: "🇸🇪" },
    { code: "JPN", name: "Japan", achievement: "OSHMS excellence", color: "purple", flag: "🇯🇵" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <FloatingParticles color="emerald" count={20} />
      
      <div className="relative z-10 w-full max-w-md">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-white/60 text-sm mb-6"
        >
          Leaders in Occupational Health Excellence
        </motion.p>

        <div className="grid grid-cols-2 gap-4">
          {countries.map((country, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, rotateY: 90 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.6, type: "spring" }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={cn(
                "p-4 rounded-xl border backdrop-blur-sm cursor-pointer",
                colors[country.color].bg,
                colors[country.color].border,
                "hover:shadow-lg transition-shadow"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{country.flag}</span>
                <span className="text-white font-semibold text-sm">{country.name}</span>
              </div>
              <p className={cn("text-xs", colors[country.color].text)}>
                {country.achievement}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-emerald-400/70 text-xs mt-6"
        >
          Click cards to explore detailed success factors
        </motion.p>
      </div>
    </div>
  );
}

// ============================================================================
// GOSI OPPORTUNITY VISUAL - Saudi Arabia rising
// ============================================================================

function GOSIOpportunityVisual() {
  const rankings = [
    { position: 1, country: "Germany", flag: "🇩🇪", score: 92 },
    { position: 2, country: "Sweden", flag: "🇸🇪", score: 89 },
    { position: 3, country: "Singapore", flag: "🇸🇬", score: 87 },
    { position: "?", country: "Saudi Arabia", flag: "🇸🇦", score: null, highlight: true },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <FloatingParticles color="cyan" count={30} />
      
      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <p className="text-cyan-400 font-semibold text-sm">Regional Leadership Opportunity</p>
        </motion.div>

        {/* Ranking visualization */}
        <div className="space-y-3">
          {rankings.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl border",
                item.highlight
                  ? "bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                  : "bg-white/5 border-white/10"
              )}
            >
              {/* Position */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                item.highlight ? "bg-cyan-500 text-white" : "bg-slate-700 text-white/60"
              )}>
                {item.position}
              </div>

              {/* Country */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xl">{item.flag}</span>
                <span className={cn(
                  "font-medium",
                  item.highlight ? "text-cyan-300" : "text-white/80"
                )}>
                  {item.country}
                </span>
              </div>

              {/* Score or arrow */}
              {item.score ? (
                <div className="text-white/60 font-mono text-sm">
                  {item.score}
                </div>
              ) : (
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Vision 2030 alignment */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">2030</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Vision 2030 Aligned</p>
              <p className="text-cyan-400/70 text-xs">Quality of Life Program</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// GET VISUAL FOR SLIDE
// ============================================================================

interface GetVisualOptions {
  onInsightClick?: (insightId: string) => void;
  onNavigate?: (blockId: string) => void;
  onCloseAndExplore?: () => void;
}

function getVisualForSlide(slideId: string, options: GetVisualOptions = {}) {
  const { onInsightClick, onNavigate, onCloseAndExplore } = options;
  
  switch (slideId) {
    case "intro": return <IntroVisual />;
    case "global-challenge": return <GlobalChallengeVisual />;
    case "adl-solution": return <ADLSolutionVisual />;
    case "overview": return <TempleOverviewVisual />;
    case "governance": return <GovernanceVisual onInsightClick={onInsightClick} />;
    case "pillar-1": return <HazardPreventionVisual onInsightClick={onInsightClick} />;
    case "pillar-2": return <SurveillanceVisual onInsightClick={onInsightClick} />;
    case "pillar-3": return <RestorationVisual onInsightClick={onInsightClick} />;
    case "integration": return <IntegrationVisual onInsightClick={onInsightClick} />;
    case "success-stories": return <SuccessStoriesVisual />;
    case "gosi-opportunity": return <GOSIOpportunityVisual />;
    case "conclusion": return <ConclusionVisual onNavigate={onNavigate} onCloseAndExplore={onCloseAndExplore} />;
    default: return <IntroVisual />;
  }
}

// ============================================================================
// CONTENT PANEL - Left Side
// ============================================================================

function ContentPanel({ slide }: { slide: GuideSlide }) {
  const c = colors[slide.color || "cyan"];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6">
      {/* ADL Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex-shrink-0"
      >
        <img 
          src="/adl-logo.png" 
          alt="Arthur D. Little" 
          className="h-8 object-contain"
        />
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0"
      >
        <h2 className="text-2xl font-bold text-white mb-1">{slide.title}</h2>
        {slide.subtitle && (
          <p className={cn("text-sm font-medium", c.text)}>{slide.subtitle}</p>
        )}
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className={cn("h-0.5 my-4 origin-left flex-shrink-0", c.bgSolid, "opacity-30")}
      />

      {/* Main content */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-300 leading-relaxed text-sm flex-shrink-0"
      >
        {slide.content}
      </motion.p>

      {/* Key points */}
      {slide.highlights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex-1 overflow-auto"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className={cn("w-4 h-4", c.text)} />
            <span className={cn("text-xs font-semibold uppercase tracking-wider", c.text)}>
              Key Elements
            </span>
          </div>
          <div className="space-y-2">
            {slide.highlights.map((highlight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.08 }}
                className={cn("flex items-start gap-3 p-3 rounded-lg", c.bg, c.border, "border")}
              >
                <CheckCircle className={cn("w-4 h-4 mt-0.5 flex-shrink-0", c.text)} />
                <span className="text-sm text-white/90">{highlight}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats display for challenge/opportunity slides */}
      {slide.stats && slide.stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex-shrink-0"
        >
          <div className="grid grid-cols-3 gap-2">
            {slide.stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className={cn(
                  "p-3 rounded-lg text-center border",
                  colors[stat.color || slide.color || "cyan"].bg,
                  colors[stat.color || slide.color || "cyan"].border
                )}
              >
                <p className={cn("text-xl font-bold", colors[stat.color || slide.color || "cyan"].text)}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-white/60 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Relevance quote for component slides */}
      {slide.type === "component" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-auto pt-4 border-t border-slate-700/50 flex-shrink-0"
        >
          <div className="flex items-start gap-2">
            <TrendingUp className={cn("w-4 h-4 mt-0.5", c.text)} />
            <p className="text-xs text-slate-400 italic">
              {slide.id === "governance" && "Strong governance correlates directly with lower fatality rates."}
              {slide.id === "pillar-1" && "Every $1 in prevention saves $4-6 in downstream costs."}
              {slide.id === "pillar-2" && "Early detection reduces treatment costs by 60%."}
              {slide.id === "pillar-3" && "The ultimate test of commitment to worker dignity."}
            </p>
          </div>
        </motion.div>
      )}

      {/* Visual guide hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 flex-shrink-0"
      >
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs", c.bg, c.border, "border")}>
          <Info className={cn("w-3.5 h-3.5", c.text)} />
          <span className="text-white/60">Watch the animated visualization on the right</span>
        </div>
      </motion.div>
    </div>
  );
}

// CinematicLoader is now imported from premium-visuals

// ============================================================================
// MAIN MODAL
// ============================================================================

export function InteractionGuideModal({ isOpen, onClose, onNavigateToBlock }: InteractionGuideModalProps) {
  const [showLoader, setShowLoader] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeInsight, setActiveInsight] = useState<ElementInsight | null>(null);
  
  // Enhanced navigation features
  const [isAutoAdvance, setIsAutoAdvance] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const modalRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Store ref for fullscreen operations
      (window as unknown as { __guideModalRef?: HTMLDivElement }).__guideModalRef = node;
    }
  }, []);

  // Auto-advance timing per slide (in seconds)
  const slideTimings: Record<string, number> = {
    "intro": 8,
    "global-challenge": 10,
    "adl-solution": 10,
    "overview": 12,
    "governance": 12,
    "pillar-1": 10,
    "pillar-2": 10,
    "pillar-3": 10,
    "integration": 12,
    "success-stories": 10,
    "gosi-opportunity": 12,
    "conclusion": 15,
  };

  useEffect(() => {
    if (isOpen) {
      setShowLoader(true);
      setCurrentSlide(0);
      setActiveInsight(null);
      setIsAutoAdvance(false);
    }
  }, [isOpen]);

  // Reset insight when changing slides
  useEffect(() => {
    setActiveInsight(null);
  }, [currentSlide]);

  // Auto-advance timer
  useEffect(() => {
    if (!isAutoAdvance || showLoader || activeInsight) return;
    
    const slide = guideSlides[currentSlide];
    const duration = (slideTimings[slide?.id] || 8) * 1000;
    
    const timer = setTimeout(() => {
      if (currentSlide < guideSlides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else {
        setIsAutoAdvance(false);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [isAutoAdvance, showLoader, currentSlide, activeInsight]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const modalElement = (window as unknown as { __guideModalRef?: HTMLDivElement }).__guideModalRef;
    
    if (!isFullscreen) {
      if (modalElement?.requestFullscreen) {
        modalElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Touch gesture handling
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const handleLoaderComplete = useCallback(() => setShowLoader(false), []);

  const handleInsightClick = useCallback((insightId: string) => {
    const insight = elementInsights[insightId];
    if (insight) {
      setActiveInsight(insight);
      // Pause auto-advance when viewing insights
      if (isAutoAdvance) setIsAutoAdvance(false);
    }
  }, [isAutoAdvance]);

  const handleCloseInsight = useCallback(() => {
    setActiveInsight(null);
  }, []);

  const handleNavigateToBlock = useCallback((blockId: string) => {
    if (onNavigateToBlock) {
      onNavigateToBlock(blockId);
    }
  }, [onNavigateToBlock]);

  const handleCloseAndExplore = useCallback(() => {
    onClose();
  }, [onClose]);

  const goToSlide = useCallback((idx: number) => {
    if (idx >= 0 && idx < guideSlides.length) setCurrentSlide(idx);
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlide < guideSlides.length - 1) setCurrentSlide(currentSlide + 1);
    else onClose();
  }, [currentSlide, onClose]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  }, [currentSlide]);

  // Keyboard navigation with enhanced controls
  useEffect(() => {
    if (!isOpen || showLoader) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
      else if (e.key === ' ') { 
        e.preventDefault(); 
        // Space toggles auto-advance
        setIsAutoAdvance(prev => !prev);
      }
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key >= '1' && e.key <= '9') {
        const slideNum = parseInt(e.key) - 1;
        if (slideNum < guideSlides.length) goToSlide(slideNum);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showLoader, nextSlide, prevSlide, onClose, toggleFullscreen, goToSlide]);

  const slide = guideSlides[currentSlide];
  const c = colors[slide?.color || "cyan"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50"
          />

          {/* Modal - Full screen on mobile, centered on desktop */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={cn(
              "fixed bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700/50 z-50 overflow-hidden flex flex-col",
              isFullscreen ? "inset-0 rounded-none" : "inset-2 sm:inset-4 md:inset-6 lg:inset-10 xl:inset-12"
            )}
          >
            {/* Loader - Premium 3-phase cinematic opening */}
            <AnimatePresence>
              {showLoader && (
                <CinematicLoader onComplete={handleLoaderComplete} skipEnabled />
              )}
            </AnimatePresence>

            {/* Top controls bar */}
            {!showLoader && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                {/* Auto-advance toggle */}
                <motion.button
                  onClick={() => setIsAutoAdvance(!isAutoAdvance)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm",
                    isAutoAdvance 
                      ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                      : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                  )}
                >
                  {isAutoAdvance ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-cyan-400"
                      />
                      <span className="hidden sm:inline">Auto</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Auto</span>
                    </>
                  )}
                </motion.button>

                {/* Fullscreen toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                  title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
                >
                  {isFullscreen ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  )}
                </button>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Auto-advance progress bar */}
            {!showLoader && isAutoAdvance && (
              <motion.div
                key={currentSlide}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: slideTimings[slide?.id] || 8, 
                  ease: "linear" 
                }}
                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 z-30"
              />
            )}

            {/* Main Content - Stacked on mobile, side-by-side on desktop */}
            {!showLoader && slide && (
              <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                {/* Left - Content (full width mobile, 40% desktop) */}
                <div className="w-full lg:w-2/5 flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-slate-700/50 bg-slate-900 max-h-[50%] lg:max-h-none overflow-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 min-h-0 overflow-hidden"
                    >
                      <ContentPanel slide={slide} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right - Dynamic Animated Visualization (60%) */}
                <div className="w-3/5 relative bg-gradient-to-br from-slate-800/80 to-slate-900 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      {getVisualForSlide(slide.id, {
                        onInsightClick: handleInsightClick,
                        onNavigate: handleNavigateToBlock,
                        onCloseAndExplore: handleCloseAndExplore
                      })}
                    </motion.div>
                  </AnimatePresence>

                  {/* Insight Overlay - Shows when user clicks on visual elements */}
                  <InsightOverlay
                    insight={activeInsight}
                    onClose={handleCloseInsight}
                    color={slide?.color || "cyan"}
                  />

                  {/* Slide number */}
                  <div className="absolute bottom-4 right-4 flex items-baseline gap-1">
                    <span className={cn("text-3xl font-bold", c.text)}>
                      {String(currentSlide + 1).padStart(2, '0')}
                    </span>
                    <span className="text-slate-500 text-lg">
                      /{String(guideSlides.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Bar */}
            {!showLoader && (
              <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 bg-slate-800/80 border-t border-slate-700/50 flex items-center justify-between">
                {/* Previous */}
                <button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    currentSlide === 0
                      ? "opacity-30 cursor-not-allowed text-slate-500"
                      : "bg-slate-700/50 hover:bg-slate-600/50 text-white"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Previous</span>
                </button>

                {/* Progress dots */}
                <div className="flex items-center gap-2">
                  {guideSlides.map((s, i) => {
                    const dotColor = colors[s.color || "cyan"];
                    return (
                      <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === currentSlide
                            ? cn(dotColor.bgSolid, "scale-150")
                            : i < currentSlide
                              ? "bg-slate-500"
                              : "bg-slate-700 hover:bg-slate-600"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Next */}
                <button
                  onClick={nextSlide}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-lg transition-all font-medium",
                    c.bgSolid,
                    "text-white shadow-lg hover:shadow-xl"
                  )}
                >
                  <span className="text-sm">
                    {currentSlide === guideSlides.length - 1 ? "Start Exploring" : "Continue"}
                  </span>
                  {currentSlide === guideSlides.length - 1 ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Skip Tour Link and Keyboard Shortcuts */}
            {!showLoader && (
              <div className="flex-shrink-0 px-3 sm:px-6 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <button onClick={onClose} className="hover:text-white transition-colors">
                  Skip Briefing
                </button>
                <div className="hidden sm:flex items-center gap-4">
                  <span>← → Navigate</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">Space</kbd>
                    <span>Auto</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">F</kbd>
                    <span>Fullscreen</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">Esc</kbd>
                    <span>Close</span>
                  </span>
                </div>
                <div className="sm:hidden flex items-center gap-2 text-[10px]">
                  <span>Swipe to navigate</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default InteractionGuideModal;
