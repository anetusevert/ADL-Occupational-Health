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
  TrendingUp,
  CheckCircle,
  Database,
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
  ArrowRight,
  Calendar,
  Zap,
  DollarSign,
  Star,
  AlertTriangle,
  Target,
  ExternalLink,
} from "lucide-react";
import { guideSlides, type GuideSlide, elementInsights, type ElementInsight } from "../../data/frameworkContent";
import { cn } from "../../lib/utils";
import { 
  CinematicLoader, 
  ParticleField, 
  NumberCounter,
  GlowOrb,
  FloatingGlowOrb,
  IconGlow,
  HeroReveal,
  ScaleReveal,
  DramaticTextReveal,
  ShimmerOverlay,
  PulseRing,
  // Consulting deck layouts
  HeroSlideLayout,
  DataImpactLayout,
  FrameworkLayout,
  ComponentLayout,
  EvidenceLayout,
  ConsultingSlideHeader,
  StatGrid,
  InsightBox,
  KeyPointsList,
  SlideBody,
  LogoBar,
  SectionDivider,
  EvidenceCard,
} from "./premium-visuals";

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
  red: { bg: "bg-red-500/20", bgSolid: "bg-red-600", border: "border-red-500/30", text: "text-red-400", hex: "#ef4444", glow: "shadow-red-500/40" },
  teal: { bg: "bg-teal-500/20", bgSolid: "bg-teal-600", border: "border-teal-500/30", text: "text-teal-400", hex: "#14b8a6", glow: "shadow-teal-500/40" },
  rose: { bg: "bg-rose-500/20", bgSolid: "bg-rose-600", border: "border-rose-500/30", text: "text-rose-400", hex: "#f43f5e", glow: "shadow-rose-500/40" },
  orange: { bg: "bg-orange-500/20", bgSolid: "bg-orange-600", border: "border-orange-500/30", text: "text-orange-400", hex: "#f97316", glow: "shadow-orange-500/40" },
};

// Safe color getter with fallback to prevent undefined errors
const getColor = (color: string | undefined) => colors[color || "cyan"] || colors.cyan;

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

          {/* Panel - No scroll, fits viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-3 sm:inset-6 md:inset-10 lg:inset-16 z-40 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "h-full w-full rounded-xl sm:rounded-2xl border backdrop-blur-xl",
              "bg-slate-900/90 border-white/10",
              "flex flex-col overflow-hidden"
            )}>
              {/* Header - Compact */}
              <div className={cn("flex items-center justify-between p-2 sm:p-3 border-b border-white/10 flex-shrink-0", c.bg)}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center", c.bgSolid)}
                  >
                    <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-[clamp(0.875rem,2vw,1.125rem)] font-bold text-white leading-tight">{insight.label}</h3>
                    <p className={cn("text-[clamp(0.6rem,1vw,0.7rem)]", c.text)}>Interactive Insight</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Content - Grid layout, no scroll */}
              <div className="flex-1 min-h-0 p-2 sm:p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 overflow-hidden">
                {/* Data Point - Hero stat */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col", c.bg, c.border)}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0", c.bgSolid)}>
                      <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[clamp(0.5rem,0.9vw,0.65rem)] font-semibold uppercase tracking-wider mb-0.5", c.text)}>Key Data Point</p>
                      <p className="text-[clamp(0.7rem,1.2vw,0.875rem)] text-white font-medium leading-snug line-clamp-3">{insight.dataPoint}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Perspective */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex flex-col"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[clamp(0.5rem,0.9vw,0.65rem)] font-semibold uppercase tracking-wider mb-0.5 text-white/50">Perspective</p>
                      <p className="text-[clamp(0.7rem,1.2vw,0.875rem)] text-white/90 leading-snug line-clamp-3">{insight.perspective}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Quote */}
                {insight.quote && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-white/5 to-transparent border-l-2 border-white/30 flex flex-col"
                  >
                    <div className="flex items-start gap-2">
                      <Quote className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <p className="text-[clamp(0.7rem,1.2vw,0.875rem)] text-white/80 italic leading-snug line-clamp-3">"{insight.quote}"</p>
                    </div>
                  </motion.div>
                )}

                {/* Example */}
                {insight.example && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col", c.bg, c.border)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0", c.bgSolid)}>
                        <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[clamp(0.5rem,0.9vw,0.65rem)] font-semibold uppercase tracking-wider mb-0.5", c.text)}>Best Practice</p>
                        <p className="text-[clamp(0.7rem,1.2vw,0.875rem)] text-white/90 leading-snug line-clamp-3">{insight.example}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer - Compact */}
              <div className="flex-shrink-0 p-2 sm:p-3 border-t border-white/10 bg-slate-800/50 flex items-center justify-between gap-2">
                {/* Source */}
                {insight.source && (
                  <div className="flex items-center gap-1.5 text-[clamp(0.5rem,0.9vw,0.65rem)] text-white/40 min-w-0">
                    <BookOpen className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{insight.source}</span>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className={cn(
                    "px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-white flex items-center justify-center gap-1.5 text-[clamp(0.7rem,1.2vw,0.875rem)] flex-shrink-0",
                    c.bgSolid,
                    "hover:brightness-110 transition-all"
                  )}
                >
                  <span>Got it</span>
                  <CheckCircle className="w-3.5 h-3.5" />
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
// INTRO VISUAL - Cinematic ADL Logo reveal with premium animations
// ============================================================================

function IntroVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Premium particle field */}
      <ParticleField count={50} color="mixed" speed="slow" />
      
      {/* Floating glow orbs for depth */}
      <FloatingGlowOrb color="purple" size="xl" position="top-left" delay={0} />
      <FloatingGlowOrb color="cyan" size="lg" position="bottom-right" delay={1} />
      
      {/* Cinematic orbiting rings with blur reveal */}
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.3, filter: "blur(20px)" }}
          animate={{ 
            opacity: [0, 0.4, 0.3], 
            scale: 1, 
            filter: "blur(0px)",
            rotate: i % 2 === 0 ? 360 : -360 
          }}
          transition={{ 
            opacity: { delay: i * 0.15, duration: 0.8 },
            scale: { delay: i * 0.15, duration: 0.8, type: "spring" },
            filter: { delay: i * 0.15, duration: 0.6 },
            rotate: { duration: 25 + i * 8, repeat: Infinity, ease: "linear" }
          }}
          className={cn(
            "absolute rounded-full border",
            i === 1 && "w-40 h-40 border-cyan-400/50 border-2",
            i === 2 && "w-64 h-64 border-purple-500/40",
            i === 3 && "w-80 h-80 border-cyan-500/25",
            i === 4 && "w-[26rem] h-[26rem] border-purple-500/15",
          )}
        >
          {/* Orbital dots */}
          {i <= 2 && (
            <motion.div
              animate={{ rotate: i % 2 === 0 ? -360 : 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className={cn(
                "absolute w-2 h-2 rounded-full -top-1",
                i === 1 ? "bg-cyan-400 left-1/2 -translate-x-1/2" : "bg-purple-400 left-1/2 -translate-x-1/2",
                "shadow-lg",
                i === 1 ? "shadow-cyan-400/50" : "shadow-purple-400/50"
              )} />
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Center content with blur-to-focus */}
      <div className="relative z-10 text-center">
        {/* Main logo container with glow orb */}
        <ScaleReveal delay={0.2} initialScale={0.6}>
          <div className="relative">
            {/* Pulsing glow behind logo */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 60px rgba(6,182,212,0.3), 0 0 120px rgba(139,92,246,0.2)",
                  "0 0 100px rgba(6,182,212,0.5), 0 0 200px rgba(139,92,246,0.3)",
                  "0 0 60px rgba(6,182,212,0.3), 0 0 120px rgba(139,92,246,0.2)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl"
            />
            
            {/* Logo with shimmer */}
            <div className="relative w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-white/10 flex items-center justify-center overflow-hidden backdrop-blur-sm">
              <ShimmerOverlay delay={1} duration={2.5} />
              <motion.img 
                src="/adl-logo.png" 
                alt="ADL" 
                className="h-20 object-contain relative z-10"
                animate={{
                  filter: [
                    "drop-shadow(0 0 20px rgba(6,182,212,0.4))",
                    "drop-shadow(0 0 40px rgba(6,182,212,0.6))",
                    "drop-shadow(0 0 20px rgba(6,182,212,0.4))",
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            </div>
          </div>
        </ScaleReveal>
        
        {/* Title with dramatic text reveal */}
        <HeroReveal delay={0.6} direction="up" blur={15}>
          <div className="mt-8">
            <DramaticTextReveal
              text="Arthur D. Little"
              className="text-2xl font-bold text-white"
              delay={0.8}
              glow
              glowColor="rgba(6, 182, 212, 0.4)"
            />
          </div>
        </HeroReveal>

        {/* Subtitle with reveal */}
        <HeroReveal delay={1.2} direction="up" blur={10}>
          <p className="text-cyan-400 text-sm mt-2 font-medium tracking-wide">
            Global Health Intelligence Platform
          </p>
        </HeroReveal>

        {/* Partnership indicator */}
        <HeroReveal delay={1.6} direction="up">
          <div className="mt-8 flex items-center justify-center gap-4">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10"
            >
              <img src="/adl-logo.png" alt="ADL" className="h-5 object-contain" />
              <div className="w-8 h-px bg-gradient-to-r from-purple-500 to-cyan-500" />
              <img src="/gosi-logo.png" alt="GOSI" className="h-5 object-contain" />
            </motion.div>
          </div>
        </HeroReveal>

        {/* Framework badge */}
        <HeroReveal delay={2} direction="up">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full border border-cyan-500/20"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-white/70 text-sm">ADL Occupational Health Framework v2.0</span>
          </motion.div>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLE OVERVIEW VISUAL - Cinematic temple build with premium animations
// ============================================================================

function TempleOverviewVisual() {
  const pillars = [
    { icon: Shield, label: "Prevention", sublabel: "Hazard Control", color: "blue", delay: 0.8, metrics: 7 },
    { icon: Eye, label: "Vigilance", sublabel: "Surveillance", color: "emerald", delay: 1.0, metrics: 6 },
    { icon: Heart, label: "Restoration", sublabel: "Compensation", color: "amber", delay: 1.2, metrics: 6 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      {/* Premium particle field */}
      <ParticleField count={40} color="mixed" speed="slow" />
      
      {/* Floating accent orbs */}
      <FloatingGlowOrb color="purple" size="lg" position="top-left" delay={0} />
      <FloatingGlowOrb color="cyan" size="lg" position="bottom-right" delay={0.5} />
      
      <div className="relative w-full max-w-lg">
        {/* Animated measurement ruler - Left side */}
        <HeroReveal delay={1.8} direction="left">
          <div className="absolute -left-10 top-0 bottom-0 flex flex-col items-center justify-between py-4">
            <motion.div 
              className="w-px h-full bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent relative"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 2, duration: 1 }}
            >
              {[0, 25, 50, 75, 100].map((tick, i) => (
                <motion.div
                  key={tick}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 2.2 + i * 0.1, type: "spring" }}
                  className="absolute right-0 flex items-center gap-1"
                  style={{ top: `${100 - tick}%`, transform: 'translateY(-50%)' }}
                >
                  <span className="text-[9px] text-cyan-400/70 w-5 text-right font-mono">{tick}</span>
                  <div className="w-3 h-px bg-cyan-500/50" />
                </motion.div>
              ))}
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="text-[9px] text-cyan-400/60 -rotate-90 origin-center whitespace-nowrap mt-4"
            >
              Maturity Score
            </motion.span>
          </div>
        </HeroReveal>

        {/* Premium score badge */}
        <ScaleReveal delay={2.4} initialScale={0.5}>
          <motion.div
            animate={{
              boxShadow: [
                "0 0 30px rgba(6,182,212,0.3), 0 0 60px rgba(147,51,234,0.2)",
                "0 0 50px rgba(6,182,212,0.5), 0 0 100px rgba(147,51,234,0.3)",
                "0 0 30px rgba(6,182,212,0.3), 0 0 60px rgba(147,51,234,0.2)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -right-4 top-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl p-3 border border-white/20 overflow-hidden"
          >
            <ShimmerOverlay delay={2.6} duration={3} />
            <p className="text-[9px] text-white/90 uppercase tracking-wider font-medium">Total Score</p>
            <p className="text-2xl font-bold text-white">0-100</p>
            <p className="text-[9px] text-white/70">25 Metrics</p>
          </motion.div>
        </ScaleReveal>

        {/* Governance Roof - Cinematic descent */}
        <HeroReveal delay={0.2} direction="down" blur={25}>
          <div className="relative mb-8">
            <motion.div 
              className="h-28 bg-gradient-to-b from-purple-500/60 to-purple-600/40 rounded-xl border-2 border-purple-400/60 flex items-center justify-between px-5 relative overflow-hidden"
              animate={{ 
                boxShadow: [
                  "0 0 30px rgba(147,51,234,0.3), 0 4px 20px rgba(147,51,234,0.2)",
                  "0 0 50px rgba(147,51,234,0.5), 0 4px 30px rgba(147,51,234,0.3)",
                  "0 0 30px rgba(147,51,234,0.3), 0 4px 20px rgba(147,51,234,0.2)",
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <ShimmerOverlay delay={0.8} duration={3} />
              
              <div className="flex items-center gap-4 relative z-10">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Crown className="w-12 h-12 text-purple-200" />
                </motion.div>
                <div className="text-left">
                  <DramaticTextReveal
                    text="GOVERNANCE"
                    className="text-white font-bold text-xl tracking-wide"
                    delay={0.5}
                    glow
                    glowColor="rgba(147, 51, 234, 0.5)"
                  />
                  <p className="text-purple-300 text-sm mt-1">The Overarching Driver</p>
                </div>
              </div>
              
              {/* Score badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, type: "spring" }}
                className="bg-purple-500/40 rounded-lg px-4 py-2 border border-purple-400/40 relative z-10"
              >
                <p className="text-[10px] text-purple-200 uppercase font-medium">Score</p>
                <p className="text-lg font-bold text-white">0-100</p>
                <p className="text-[9px] text-purple-300/70">6 metrics</p>
              </motion.div>
            </motion.div>
            
            {/* Animated energy flow connections */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-12"
            >
              {[
                { color: "blue", glow: "rgba(37,99,235,0.6)" },
                { color: "emerald", glow: "rgba(5,150,105,0.6)" },
                { color: "amber", glow: "rgba(245,158,11,0.6)" },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 24 }}
                    transition={{ delay: 1.1 + i * 0.1, type: "spring" }}
                    className={cn(
                      "w-1 rounded-full",
                      item.color === "blue" && "bg-gradient-to-b from-blue-400 to-blue-500/50",
                      item.color === "emerald" && "bg-gradient-to-b from-emerald-400 to-emerald-500/50",
                      item.color === "amber" && "bg-gradient-to-b from-amber-400 to-amber-500/50",
                    )}
                  />
                  {/* Energy particle */}
                  <motion.div
                    animate={{ y: [0, 20, 0], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                    style={{ boxShadow: `0 0 10px ${item.glow}` }}
                    className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full",
                      item.color === "blue" && "bg-blue-400",
                      item.color === "emerald" && "bg-emerald-400",
                      item.color === "amber" && "bg-amber-400",
                    )}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </HeroReveal>

        {/* Three Pillars - Rising from foundation */}
        <div className="flex gap-4 mt-10">
          {pillars.map((pillar, i) => (
            <HeroReveal key={i} delay={pillar.delay} direction="up" blur={20}>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "flex-1 rounded-xl border-2 flex flex-col items-center justify-between py-4 relative overflow-hidden cursor-pointer",
                  pillar.color === "blue" && "bg-gradient-to-b from-blue-500/30 to-blue-600/20 border-blue-400/60",
                  pillar.color === "emerald" && "bg-gradient-to-b from-emerald-500/30 to-emerald-600/20 border-emerald-400/60",
                  pillar.color === "amber" && "bg-gradient-to-b from-amber-500/30 to-amber-600/20 border-amber-400/60",
                )}
              >
                {/* Glow effect */}
                <motion.div
                  animate={{
                    boxShadow: pillar.color === "blue" 
                      ? ["0 0 20px rgba(37,99,235,0.2)", "0 0 40px rgba(37,99,235,0.4)", "0 0 20px rgba(37,99,235,0.2)"]
                      : pillar.color === "emerald"
                      ? ["0 0 20px rgba(5,150,105,0.2)", "0 0 40px rgba(5,150,105,0.4)", "0 0 20px rgba(5,150,105,0.2)"]
                      : ["0 0 20px rgba(245,158,11,0.2)", "0 0 40px rgba(245,158,11,0.4)", "0 0 20px rgba(245,158,11,0.2)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute inset-0 rounded-xl"
                />
                
                <ShimmerOverlay delay={pillar.delay + 0.3} duration={3} />
                
                {/* Fill bar animation */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "100%" }}
                  transition={{ delay: pillar.delay + 0.5, duration: 1.2, ease: "easeOut" }}
                  className={cn(
                    "absolute bottom-0 left-0 right-0 opacity-30",
                    pillar.color === "blue" && "bg-gradient-to-t from-blue-500 to-transparent",
                    pillar.color === "emerald" && "bg-gradient-to-t from-emerald-500 to-transparent",
                    pillar.color === "amber" && "bg-gradient-to-t from-amber-500 to-transparent",
                  )}
                />
                
                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  >
                    <pillar.icon className={cn(
                      "w-10 h-10 mx-auto",
                      pillar.color === "blue" && "text-blue-300",
                      pillar.color === "emerald" && "text-emerald-300",
                      pillar.color === "amber" && "text-amber-300",
                    )} />
                  </motion.div>
                  <span className="text-sm font-bold text-white mt-2 block">{pillar.label}</span>
                  <span className="text-[10px] text-white/60">{pillar.sublabel}</span>
                </div>
                
                {/* Metrics badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: pillar.delay + 1, type: "spring" }}
                  className={cn(
                    "relative z-10 mt-3 px-3 py-1.5 rounded-lg text-center",
                    pillar.color === "blue" && "bg-blue-500/40 border border-blue-400/40",
                    pillar.color === "emerald" && "bg-emerald-500/40 border border-emerald-400/40",
                    pillar.color === "amber" && "bg-amber-500/40 border border-amber-400/40",
                  )}
                >
                  <p className={cn(
                    "text-xs font-bold",
                    pillar.color === "blue" && "text-blue-200",
                    pillar.color === "emerald" && "text-emerald-200",
                    pillar.color === "amber" && "text-amber-200",
                  )}>0-100</p>
                  <p className="text-[9px] text-white/60">{pillar.metrics} metrics</p>
                </motion.div>
              </motion.div>
            </HeroReveal>
          ))}
        </div>

        {/* Foundation with premium styling */}
        <HeroReveal delay={1.6} direction="up">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.7, duration: 0.6 }}
            className="mt-5 h-8 bg-gradient-to-r from-slate-600/20 via-slate-500/40 to-slate-600/20 rounded-lg flex items-center justify-center gap-3 border border-white/10 relative overflow-hidden"
          >
            <ShimmerOverlay delay={2} duration={4} />
            <Database className="w-4 h-4 text-slate-300" />
            <span className="text-[10px] text-slate-300 font-medium">180+ Global Data Sources</span>
          </motion.div>
        </HeroReveal>

        {/* Maturity levels with premium animation */}
        <HeroReveal delay={2} direction="up">
          <div className="mt-5 flex justify-center gap-2">
            {[
              { level: "Critical", range: "0-25", color: "red" },
              { level: "Developing", range: "26-50", color: "amber" },
              { level: "Advancing", range: "51-75", color: "blue" },
              { level: "Leading", range: "76-100", color: "emerald" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 + i * 0.1, type: "spring" }}
                whileHover={{ scale: 1.1, y: -3 }}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-center cursor-pointer transition-colors",
                  item.color === "red" && "bg-red-500/30 border-red-500/50 hover:bg-red-500/40",
                  item.color === "amber" && "bg-amber-500/30 border-amber-500/50 hover:bg-amber-500/40",
                  item.color === "blue" && "bg-blue-500/30 border-blue-500/50 hover:bg-blue-500/40",
                  item.color === "emerald" && "bg-emerald-500/30 border-emerald-500/50 hover:bg-emerald-500/40",
                )}
              >
                <p className="text-[9px] text-white/90 font-medium">{item.level}</p>
                <p className="text-[8px] text-white/60">{item.range}</p>
              </motion.div>
            ))}
          </div>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// GOVERNANCE VISUAL - Cinematic crown with orbiting elements
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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Premium particle field */}
      <ParticleField count={45} color="purple" speed="slow" />
      
      {/* Floating glow accents */}
      <FloatingGlowOrb color="purple" size="xl" position="top-right" delay={0} />
      <FloatingGlowOrb color="cyan" size="lg" position="bottom-left" delay={0.5} />
      
      {/* Cinematic orbiting rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
          animate={{ 
            opacity: 0.3, 
            scale: 1, 
            filter: "blur(0px)",
            rotate: i % 2 === 0 ? 360 : -360 
          }}
          transition={{ 
            opacity: { delay: i * 0.2, duration: 0.6 },
            scale: { delay: i * 0.2, duration: 0.6 },
            filter: { delay: i * 0.2, duration: 0.5 },
            rotate: { duration: 30 + i * 10, repeat: Infinity, ease: "linear" }
          }}
          className={cn(
            "absolute rounded-full border",
            i === 1 && "w-52 h-52 border-purple-400/50",
            i === 2 && "w-72 h-72 border-purple-500/30",
            i === 3 && "w-96 h-96 border-purple-500/15",
          )}
        />
      ))}
      
      {/* Central crown with premium glow */}
      <ScaleReveal delay={0.2} initialScale={0.5}>
        <div className="relative z-10">
          <motion.div
            onClick={() => onInsightClick?.("governance-central")}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            <GlowOrb color="purple" size="lg" intensity="intense" pulse>
              <Crown className="w-16 h-16 text-white" />
            </GlowOrb>
          </motion.div>
          
          <HeroReveal delay={0.6} direction="up">
            <div className="text-center mt-4">
              <DramaticTextReveal
                text="Governance"
                className="text-purple-300 font-bold text-lg"
                delay={0.8}
                glow
                glowColor="rgba(147, 51, 234, 0.4)"
              />
              <p className="text-purple-400/70 text-xs mt-1">The Overarching Driver</p>
              <motion.p
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] text-purple-400/50 mt-2"
              >
                Click to explore
              </motion.p>
            </div>
          </HeroReveal>
        </div>
      </ScaleReveal>

      {/* Enhanced orbiting elements */}
      {elements.map((el, i) => (
        <CinematicOrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          sublabel={el.sublabel}
          color="purple"
          index={i}
          total={elements.length}
          delay={0.4}
          radius={160}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}

      {/* Animated connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(147,51,234,0.5)" />
            <stop offset="100%" stopColor="rgba(147,51,234,0.1)" />
          </linearGradient>
        </defs>
        {elements.map((_, i) => {
          const angle = (i / elements.length) * Math.PI * 2 - Math.PI / 2;
          const endX = 50 + Math.cos(angle) * 28;
          const endY = 50 + Math.sin(angle) * 28;
          return (
            <motion.line
              key={i}
              x1="50%"
              y1="50%"
              x2={`${endX}%`}
              y2={`${endY}%`}
              stroke="url(#purpleGradient)"
              strokeWidth="2"
              strokeDasharray="8 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.2 + i * 0.15, duration: 0.6 }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// Cinematic orbiting element with enhanced animations
function CinematicOrbitingElement({
  Icon,
  label,
  sublabel,
  color,
  index,
  total,
  delay = 0,
  radius = 150,
  insightId,
  onInsightClick,
}: {
  Icon: React.ElementType;
  label: string;
  sublabel?: string;
  color: string;
  index: number;
  total: number;
  delay?: number;
  radius?: number;
  insightId?: string;
  onInsightClick?: (insightId: string) => void;
}) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const c = colors[color] || colors.cyan;
  const isClickable = !!insightId && !!onInsightClick;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, filter: "blur(15px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ delay: delay + index * 0.12, duration: 0.6, type: "spring" }}
      className="absolute z-10"
      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
        className="flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div 
          onClick={() => isClickable && onInsightClick?.(insightId!)}
          whileHover={{ scale: 1.15, rotate: 5 }}
          whileTap={isClickable ? { scale: 0.95 } : undefined}
          className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden",
            c.bgSolid,
            isClickable && "cursor-pointer"
          )}
        >
          <ShimmerOverlay delay={delay + index * 0.2} duration={3} />
          <motion.div
            animate={{
              boxShadow: [
                `0 0 20px ${c.hex}40`,
                `0 0 40px ${c.hex}60`,
                `0 0 20px ${c.hex}40`,
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
            className="absolute inset-0 rounded-xl"
          />
          <Icon className="w-8 h-8 text-white relative z-10" />
          
          {isClickable && (
            <motion.div
              className={cn("absolute inset-0 rounded-xl border-2", c.border)}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + index * 0.15 + 0.3 }}
          className="mt-2 text-center"
        >
          <span className="text-[11px] font-semibold text-white/90 block max-w-20 leading-tight">
            {label}
          </span>
          {sublabel && (
            <span className="text-[9px] text-white/50 block">{sublabel}</span>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// HAZARD PREVENTION VISUAL (Pillar 1) - Cinematic shield
// ============================================================================

function HazardPreventionVisual({ onInsightClick }: VisualProps) {
  const elements = [
    { icon: Beaker, label: "Hazard Registry", sublabel: "Physical/Chemical", insightId: "hazard-registry" },
    { icon: HardHat, label: "Control Maturity", sublabel: "Engineering > PPE", insightId: "control-maturity" },
    { icon: Thermometer, label: "Climate Defense", sublabel: "Heat Protocols", insightId: "climate-defense" },
    { icon: FileCheck, label: "Risk Assessment", sublabel: "Documentation", insightId: "risk-assessment" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <ParticleField count={45} color="blue" speed="slow" />
      
      <FloatingGlowOrb color="blue" size="xl" position="top-left" delay={0} />
      <FloatingGlowOrb color="cyan" size="lg" position="bottom-right" delay={0.5} />
      
      {/* Protective shield waves */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.6, scale: 0.4 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
          className="absolute w-36 h-36 rounded-full border-2 border-blue-400/40"
        />
      ))}
      
      <ScaleReveal delay={0.2} initialScale={0.5}>
        <div className="relative z-10">
          <motion.div
            onClick={() => onInsightClick?.("prevention-central")}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            <GlowOrb color="blue" size="lg" intensity="intense" pulse>
              <Shield className="w-16 h-16 text-white" />
            </GlowOrb>
          </motion.div>
          
          <HeroReveal delay={0.6} direction="up">
            <div className="text-center mt-4">
              <DramaticTextReveal
                text="Prevention"
                className="text-blue-300 font-bold text-lg"
                delay={0.8}
                glow
                glowColor="rgba(37, 99, 235, 0.4)"
              />
              <p className="text-blue-400/70 text-xs mt-1">$1 invested saves $4-6</p>
              <motion.p
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] text-blue-400/50 mt-2"
              >
                Click to explore
              </motion.p>
            </div>
          </HeroReveal>
        </div>
      </ScaleReveal>

      {elements.map((el, i) => (
        <CinematicOrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          sublabel={el.sublabel}
          color="blue"
          index={i}
          total={elements.length}
          delay={0.4}
          radius={160}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SURVEILLANCE VISUAL (Pillar 2) - Cinematic watchful eye
// ============================================================================

function SurveillanceVisual({ onInsightClick }: VisualProps) {
  const elements = [
    { icon: Stethoscope, label: "Active Surveillance", sublabel: "Biomarkers", insightId: "active-surveillance" },
    { icon: UserCheck, label: "Vulnerability Index", sublabel: "At-Risk Groups", insightId: "vulnerability-index" },
    { icon: Bell, label: "Early Warning", sublabel: "Predictive Analytics", insightId: "early-warning" },
    { icon: Activity, label: "Health Monitoring", sublabel: "Continuous", insightId: "health-monitoring" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <ParticleField count={45} color="emerald" speed="slow" />
      
      <FloatingGlowOrb color="emerald" size="xl" position="top-right" delay={0} />
      <FloatingGlowOrb color="cyan" size="lg" position="bottom-left" delay={0.5} />
      
      {/* Radar/scanning pulse waves */}
      <PulseRing color="emerald" size="w-40 h-40" count={4} duration={2.5} />
      
      {/* Scanning line effect */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute w-48 h-48"
      >
        <motion.div
          className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-emerald-400 to-transparent origin-left"
          style={{ transform: 'translateY(-50%)' }}
        />
      </motion.div>
      
      <ScaleReveal delay={0.2} initialScale={0.5}>
        <div className="relative z-10">
          <motion.div
            onClick={() => onInsightClick?.("surveillance-central")}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            <GlowOrb color="emerald" size="lg" intensity="intense" pulse>
              <Eye className="w-16 h-16 text-white" />
            </GlowOrb>
          </motion.div>
          
          <HeroReveal delay={0.6} direction="up">
            <div className="text-center mt-4">
              <DramaticTextReveal
                text="Vigilance"
                className="text-emerald-300 font-bold text-lg"
                delay={0.8}
                glow
                glowColor="rgba(5, 150, 105, 0.4)"
              />
              <p className="text-emerald-400/70 text-xs mt-1">60% early detection savings</p>
              <motion.p
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] text-emerald-400/50 mt-2"
              >
                Click to explore
              </motion.p>
            </div>
          </HeroReveal>
        </div>
      </ScaleReveal>

      {elements.map((el, i) => (
        <CinematicOrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          sublabel={el.sublabel}
          color="emerald"
          index={i}
          total={elements.length}
          delay={0.4}
          radius={160}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// RESTORATION VISUAL (Pillar 3) - Cinematic healing heart
// ============================================================================

function RestorationVisual({ onInsightClick }: VisualProps) {
  const elements = [
    { icon: Wallet, label: "Payer Mechanism", sublabel: "No-Fault Insurance", insightId: "payer-mechanism" },
    { icon: Building2, label: "Rehabilitation", sublabel: "Clinics/Training", insightId: "rehabilitation" },
    { icon: RefreshCcw, label: "Return to Work", sublabel: "RTW Policy", insightId: "return-to-work" },
    { icon: Briefcase, label: "Compensation", sublabel: "Fair Benefits", insightId: "compensation" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <ParticleField count={45} color="amber" speed="slow" />
      
      <FloatingGlowOrb color="amber" size="xl" position="top-left" delay={0} />
      <FloatingGlowOrb color="purple" size="lg" position="bottom-right" delay={0.5} />
      
      {/* Heartbeat pulse waves */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.6, scale: 0.5 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: i * 0.5,
            ease: "easeOut" 
          }}
          className="absolute w-32 h-32 rounded-full border-2 border-amber-400/50"
        />
      ))}
      
      <ScaleReveal delay={0.2} initialScale={0.5}>
        <div className="relative z-10">
          <motion.div
            onClick={() => onInsightClick?.("restoration-central")}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            {/* Heartbeat animation on the orb */}
            <motion.div
              animate={{ scale: [1, 1.05, 1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <GlowOrb color="amber" size="lg" intensity="intense" pulse>
                <Heart className="w-16 h-16 text-white" />
              </GlowOrb>
            </motion.div>
          </motion.div>
          
          <HeroReveal delay={0.6} direction="up">
            <div className="text-center mt-4">
              <DramaticTextReveal
                text="Restoration"
                className="text-amber-300 font-bold text-lg"
                delay={0.8}
                glow
                glowColor="rgba(245, 158, 11, 0.4)"
              />
              <p className="text-amber-400/70 text-xs mt-1">The Safety Net</p>
              <motion.p
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] text-amber-400/50 mt-2"
              >
                Click to explore
              </motion.p>
            </div>
          </HeroReveal>
        </div>
      </ScaleReveal>

      {elements.map((el, i) => (
        <CinematicOrbitingElement
          key={i}
          Icon={el.icon}
          label={el.label}
          sublabel={el.sublabel}
          color="amber"
          index={i}
          total={elements.length}
          delay={0.4}
          radius={160}
          insightId={el.insightId}
          onInsightClick={onInsightClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// INTEGRATION VISUAL - Cinematic data flow animation
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
    { icon: Shield, color: "blue", label: "Prevention", bgColor: "bg-blue-600", glowColor: "rgba(37,99,235,0.6)", controls: pillar1Controls },
    { icon: Eye, color: "emerald", label: "Vigilance", bgColor: "bg-emerald-600", glowColor: "rgba(5,150,105,0.6)", controls: pillar2Controls },
    { icon: Heart, color: "amber", label: "Restoration", bgColor: "bg-amber-500", glowColor: "rgba(245,158,11,0.6)", controls: pillar3Controls },
  ];

  const triggerFeedbackAnimation = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    setAnimationPhase(1);
    await governanceControls.start({
      scale: [1, 1.25, 1],
      boxShadow: ["0 0 30px rgba(147,51,234,0.3)", "0 0 80px rgba(147,51,234,0.9)", "0 0 30px rgba(147,51,234,0.3)"],
      transition: { duration: 0.7 }
    });
    
    setAnimationPhase(2);
    await arrowControls.start({
      y: [0, 20, 0],
      opacity: [0.5, 1, 0.5],
      transition: { duration: 0.5 }
    });
    
    setAnimationPhase(3);
    await pillar1Controls.start({
      scale: [1, 1.3, 1],
      boxShadow: ["0 0 25px rgba(37,99,235,0.3)", "0 0 70px rgba(37,99,235,0.9)", "0 0 25px rgba(37,99,235,0.3)"],
      transition: { duration: 0.6 }
    });
    
    setAnimationPhase(4);
    await pillar2Controls.start({
      scale: [1, 1.3, 1],
      boxShadow: ["0 0 25px rgba(5,150,105,0.3)", "0 0 70px rgba(5,150,105,0.9)", "0 0 25px rgba(5,150,105,0.3)"],
      transition: { duration: 0.6 }
    });
    
    setAnimationPhase(5);
    await pillar3Controls.start({
      scale: [1, 1.3, 1],
      boxShadow: ["0 0 25px rgba(245,158,11,0.3)", "0 0 70px rgba(245,158,11,0.9)", "0 0 25px rgba(245,158,11,0.3)"],
      transition: { duration: 0.6 }
    });
    
    setAnimationPhase(6);
    await governanceControls.start({
      scale: [1, 1.2, 1],
      boxShadow: ["0 0 30px rgba(147,51,234,0.3)", "0 0 60px rgba(147,51,234,0.7)", "0 0 40px rgba(147,51,234,0.5)"],
      transition: { duration: 0.7 }
    });
    
    setAnimationPhase(0);
    setIsAnimating(false);
    onInsightClick?.("feedback-loop");
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      <ParticleField count={50} color="mixed" speed="slow" />
      
      <FloatingGlowOrb color="cyan" size="xl" position="top-right" delay={0} />
      <FloatingGlowOrb color="purple" size="lg" position="bottom-left" delay={0.5} />
      
      <div className="relative w-full max-w-md z-10">
        {/* Governance at top with premium styling */}
        <ScaleReveal delay={0.2} initialScale={0.5}>
          <div className="mx-auto relative">
            <motion.div
              animate={governanceControls}
              className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-2xl relative overflow-hidden"
            >
              <ShimmerOverlay delay={0.5} duration={3} />
              <Crown className="w-12 h-12 text-white relative z-10" />
              
              {animationPhase === 1 && (
                <motion.div
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: 2, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0 rounded-2xl border-3 border-purple-300"
                />
              )}
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-2 text-purple-300 font-semibold text-sm"
            >
              Governance
            </motion.p>
          </div>
        </ScaleReveal>

        {/* Energy flow arrows with particle trail */}
        <HeroReveal delay={0.5} direction="none">
          <div className="flex justify-center my-6 relative">
            {/* Energy particles flowing down */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, 40, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-b from-purple-400 to-cyan-400"
                style={{ 
                  left: `calc(50% + ${(i - 1) * 25}px)`,
                  boxShadow: "0 0 10px rgba(147,51,234,0.6)"
                }}
              />
            ))}
            
            <motion.div
              animate={isAnimating ? arrowControls : { y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: isAnimating ? 0 : Infinity }}
            >
              <ArrowDown className={cn(
                "w-10 h-10 transition-all duration-300",
                animationPhase === 2 ? "text-cyan-300 scale-125" : "text-purple-400"
              )} />
            </motion.div>
          </div>
        </HeroReveal>

        {/* Three pillars with premium styling */}
        <div className="flex justify-center gap-6">
          {pillars.map((p, i) => (
            <HeroReveal key={i} delay={0.6 + i * 0.1} direction="up">
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={p.controls}
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden",
                    p.bgColor
                  )}
                >
                  <ShimmerOverlay delay={0.8 + i * 0.15} duration={3} />
                  <p.icon className="w-10 h-10 text-white relative z-10" />
                  
                  {/* Highlight during animation */}
                  {animationPhase === 3 + i && (
                    <motion.div
                      initial={{ scale: 1, opacity: 0 }}
                      animate={{ scale: 1.8, opacity: [0, 0.8, 0] }}
                      transition={{ duration: 0.6 }}
                      className={cn(
                        "absolute inset-0 rounded-2xl border-3",
                        p.color === "blue" && "border-blue-300",
                        p.color === "emerald" && "border-emerald-300",
                        p.color === "amber" && "border-amber-300",
                      )}
                    />
                  )}
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className={cn(
                    "text-xs font-medium mt-2",
                    p.color === "blue" && "text-blue-300",
                    p.color === "emerald" && "text-emerald-300",
                    p.color === "amber" && "text-amber-300",
                  )}
                >
                  {p.label}
                </motion.p>
                
                {/* Connecting energy trails between pillars */}
                {i < 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: animationPhase >= 3 + i ? 1 : 0.3 }}
                    className="absolute top-1/2 -right-4 w-4 h-0.5 bg-gradient-to-r from-current to-transparent"
                    style={{ 
                      color: animationPhase === 3 + i ? "#22d3ee" : "rgba(255,255,255,0.3)" 
                    }}
                  />
                )}
              </div>
            </HeroReveal>
          ))}
        </div>

        {/* Premium feedback loop button */}
        <HeroReveal delay={1.2} direction="up">
          <motion.div
            onClick={triggerFeedbackAnimation}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "mt-10 p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden",
              isAnimating 
                ? "bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400/70 shadow-xl shadow-cyan-500/30" 
                : "bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/40 hover:border-cyan-400/60"
            )}
          >
            <ShimmerOverlay delay={1.5} duration={4} />
            
            <div className="flex items-center justify-center gap-4 relative z-10">
              <motion.div
                animate={{ rotate: isAnimating ? 720 : 360 }}
                transition={{ 
                  duration: isAnimating ? 1.5 : 6, 
                  repeat: Infinity, 
                  ease: isAnimating ? "easeInOut" : "linear" 
                }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  isAnimating ? "bg-cyan-500/40" : "bg-cyan-500/20"
                )}
              >
                <RefreshCcw className={cn(
                  "w-7 h-7 transition-colors",
                  isAnimating ? "text-cyan-200" : "text-cyan-400"
                )} />
              </motion.div>
              
              <div className="text-left">
                <DramaticTextReveal
                  text="Continuous Feedback Loop"
                  className="text-cyan-300 font-bold"
                  delay={1.4}
                  glow
                  glowColor="rgba(6, 182, 212, 0.3)"
                />
                <p className="text-cyan-400/70 text-xs mt-1">
                  {isAnimating ? "Energy flows through the system..." : "Click to visualize data flow"}
                </p>
              </div>
            </div>
            
            {!isAnimating && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ pointerEvents: 'none' }}
              />
            )}
          </motion.div>
        </HeroReveal>

        {/* Database foundation with premium styling */}
        <HeroReveal delay={1.6} direction="up">
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mt-6 flex items-center justify-center gap-3 px-4 py-2 bg-slate-800/50 rounded-full border border-white/10"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 text-sm">Global OH Database & Intelligence Engine</span>
          </motion.div>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// CONCLUSION VISUAL - Grand Finale with orbiting pillars
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
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Premium particle field with mixed colors for celebration */}
      <ParticleField count={70} color="mixed" speed="normal" />
      
      {/* Multiple floating glow orbs for grand effect */}
      <FloatingGlowOrb color="cyan" size="xl" position="top-left" delay={0} />
      <FloatingGlowOrb color="purple" size="xl" position="top-right" delay={0.3} />
      <FloatingGlowOrb color="emerald" size="lg" position="bottom-left" delay={0.6} />
      <FloatingGlowOrb color="amber" size="lg" position="bottom-right" delay={0.9} />
      
      {/* Orbiting rings */}
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 0.25, 
            scale: 1, 
            rotate: i % 2 === 0 ? 360 : -360 
          }}
          transition={{ 
            opacity: { delay: i * 0.2, duration: 0.8 },
            scale: { delay: i * 0.2, duration: 0.8 },
            rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" }
          }}
          className={cn(
            "absolute rounded-full border",
            i === 1 && "w-56 h-56 border-cyan-400/40",
            i === 2 && "w-72 h-72 border-purple-500/30",
            i === 3 && "w-96 h-96 border-cyan-500/20",
            i === 4 && "w-[28rem] h-[28rem] border-purple-500/10",
          )}
        />
      ))}
      
      <div className="relative z-10 text-center">
        {/* Central CTA with grand glow effect */}
        <ScaleReveal delay={0.2} initialScale={0.4}>
          <motion.div
            onClick={onCloseAndExplore}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="relative cursor-pointer"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 60px rgba(6,182,212,0.4), 0 0 120px rgba(147,51,234,0.3)",
                  "0 0 100px rgba(6,182,212,0.6), 0 0 200px rgba(147,51,234,0.4)",
                  "0 0 60px rgba(6,182,212,0.4), 0 0 120px rgba(147,51,234,0.3)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-40 h-40 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 via-purple-600 to-cyan-500 flex items-center justify-center relative overflow-hidden"
            >
              <ShimmerOverlay delay={0.5} duration={3} />
              
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Layers className="w-20 h-20 text-white" />
              </motion.div>
              
              {/* Multiple pulse rings */}
              <PulseRing color="cyan" size="w-40 h-40" count={3} duration={2.5} />
            </motion.div>
          </motion.div>
        </ScaleReveal>
        
        {/* Title with dramatic reveal */}
        <HeroReveal delay={0.6} direction="up" blur={20}>
          <div className="mt-10">
            <DramaticTextReveal
              text="Begin Your Journey"
              className="text-3xl font-bold text-white"
              delay={0.8}
              glow
              glowColor="rgba(6, 182, 212, 0.5)"
            />
          </div>
        </HeroReveal>
        
        <HeroReveal delay={1} direction="up">
          <p className="text-cyan-400/90 mt-3 text-lg">
            Explore the complete framework
          </p>
        </HeroReveal>

        {/* Orbiting pillar icons */}
        <div className="mt-12 relative h-24">
          {pillars.map((item, i) => {
            const angle = (i / pillars.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 100;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.4; // Flattened orbit
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.15, type: "spring" }}
                className="absolute left-1/2 top-1/2"
                style={{ 
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` 
                }}
              >
                <motion.div
                  onClick={() => onNavigate?.(item.blockId)}
                  whileHover={{ scale: 1.25, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ 
                    y: { duration: 2, repeat: Infinity, delay: i * 0.3 }
                  }}
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer relative",
                    getColor(item.color).bgSolid,
                    "shadow-xl"
                  )}
                >
                  <ShimmerOverlay delay={1.5 + i * 0.2} duration={3} />
                  
                  <motion.div
                    animate={{
                      boxShadow: [
                        `0 0 20px ${getColor(item.color).hex}40`,
                        `0 0 40px ${getColor(item.color).hex}60`,
                        `0 0 20px ${getColor(item.color).hex}40`,
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className="absolute inset-0 rounded-2xl"
                  />
                  
                  <item.icon className="w-8 h-8 text-white relative z-10" />
                  
                  {/* Label on hover */}
                  <motion.div 
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none"
                    whileHover={{ opacity: 1 }}
                  >
                    <span className={cn(
                      "text-xs font-medium whitespace-nowrap px-2 py-1 rounded-lg",
                      getColor(item.color).bg,
                      getColor(item.color).text
                    )}>
                      {item.label}
                    </span>
                  </motion.div>
                  
                  {/* Pulse ring */}
                  <motion.div
                    className={cn("absolute inset-0 rounded-2xl border-2", getColor(item.color).border)}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.25 }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
        
        {/* CTA button */}
        <HeroReveal delay={1.8} direction="up">
          <motion.button
            onClick={onCloseAndExplore}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="mt-10 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-white font-bold text-lg shadow-xl shadow-cyan-500/30 relative overflow-hidden"
          >
            <ShimmerOverlay delay={2} duration={3} />
            <span className="relative z-10 flex items-center gap-3">
              <Play className="w-5 h-5" />
              Start Exploring
            </span>
          </motion.button>
        </HeroReveal>
        
        {/* Hint */}
        <HeroReveal delay={2.2} direction="up">
          <motion.p
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mt-6 text-xs text-white/50"
          >
            Click any pillar to explore its detailed metrics
          </motion.p>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// GLOBAL CHALLENGE VISUAL - Premium animated crisis model with research data
// ============================================================================

function GlobalChallengeVisual() {
  // Research-backed comparison data (ILO Global Estimates 2024)
  const comparisons = [
    { label: "Road Accidents", deaths: "1.35M", icon: "🚗", comparison: "2.1x more" },
    { label: "Malaria", deaths: "0.62M", icon: "🦟", comparison: "4.7x more" },
    { label: "HIV/AIDS", deaths: "0.65M", icon: "🎗️", comparison: "4.5x more" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Dramatic amber/red particle field */}
      <ParticleField count={50} color="amber" speed="normal" />
      
      {/* Danger glow orbs */}
      <FloatingGlowOrb color="amber" size="lg" position="top-right" delay={0.5} />
      <FloatingGlowOrb color="amber" size="md" position="bottom-left" delay={1} />
      
      <div className="relative z-10 w-full max-w-3xl">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          
          {/* Left: Animated Crisis Globe Model */}
          <div className="flex-shrink-0">
            <ScaleReveal delay={0} initialScale={0.5}>
              <div className="relative">
                {/* Outer danger rings */}
                <PulseRing color="amber" size="w-44 h-44 sm:w-52 sm:h-52" count={3} duration={3} />
                
                {/* 3D-style globe with rotating layers */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 40px rgba(245,158,11,0.3), 0 0 80px rgba(239,68,68,0.2)",
                      "0 0 60px rgba(245,158,11,0.5), 0 0 120px rgba(239,68,68,0.3)",
                      "0 0 40px rgba(245,158,11,0.3), 0 0 80px rgba(239,68,68,0.2)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-500/50 flex items-center justify-center relative overflow-hidden"
                >
                  {/* Grid lines overlay */}
                  <div className="absolute inset-0 rounded-full opacity-20">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute border border-amber-500/30 rounded-full"
                        style={{
                          inset: `${i * 15}%`,
                        }}
                        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                        transition={{ duration: 30 + i * 5, repeat: Infinity, ease: "linear" }}
                      />
                    ))}
                  </div>
                  
                  {/* Rotating globe icon */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  >
                    <Globe className="w-20 h-20 sm:w-24 sm:h-24 text-amber-400/80" />
                  </motion.div>
                  
                  {/* Crisis indicator dots */}
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-red-500"
                      style={{
                        left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 55}px)`,
                        top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 55}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      animate={{ 
                        scale: [1, 1.5, 1], 
                        opacity: [0.4, 1, 0.4],
                        boxShadow: [
                          "0 0 5px rgba(239,68,68,0.5)",
                          "0 0 15px rgba(239,68,68,0.8)",
                          "0 0 5px rgba(239,68,68,0.5)"
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
                
                {/* Central death counter */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ 
                        textShadow: [
                          "0 0 20px rgba(245,158,11,0.3)",
                          "0 0 30px rgba(245,158,11,0.5)",
                          "0 0 20px rgba(245,158,11,0.3)",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-3xl sm:text-4xl font-bold text-amber-400"
                    >
                      <NumberCounter value={2.9} suffix="M" decimals={1} duration={2} delay={0.8} />
                    </motion.div>
                    <p className="text-white/60 text-xs mt-1">Deaths/Year</p>
                  </div>
                </motion.div>
              </div>
            </ScaleReveal>
          </div>
          
          {/* Right: Research perspective & comparisons */}
          <div className="flex-1 min-w-0">
            {/* Main headline */}
            <HeroReveal delay={0.4} direction="left" blur={15}>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                The <span className="text-amber-400">Silent Pandemic</span>
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Occupational accidents and diseases represent a global health crisis that exceeds many widely recognized causes of death.
              </p>
            </HeroReveal>
            
            {/* Comparison cards */}
            <div className="space-y-2 mb-4">
              {comparisons.map((item, i) => (
                <HeroReveal key={i} delay={0.7 + i * 0.15} direction="left">
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-3 p-2 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <span className="text-lg sm:text-xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-medium">{item.label}</p>
                      <p className="text-white/50 text-[10px] sm:text-xs">{item.deaths} deaths/year</p>
                    </div>
                    <span className="text-amber-400 text-xs sm:text-sm font-bold whitespace-nowrap">{item.comparison}</span>
                  </motion.div>
                </HeroReveal>
              ))}
            </div>
            
            {/* Key stats row */}
            <HeroReveal delay={1.2} direction="up">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 395, suffix: "M", label: "Injuries/Year", color: "blue" },
                  { value: 4, suffix: "%", label: "GDP Lost", color: "purple" },
                  { value: 33, suffix: "%", label: "C187 Ratified", color: "cyan" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.03 }}
                    className={cn(
                      "p-2 sm:p-3 rounded-lg border backdrop-blur-sm text-center",
                      getColor(stat.color).bg,
                      getColor(stat.color).border
                    )}
                  >
                    <p className={cn("text-lg sm:text-xl font-bold", getColor(stat.color).text)}>
                      <NumberCounter value={stat.value} suffix={stat.suffix} duration={1.5} delay={1.3 + i * 0.1} />
                    </p>
                    <p className="text-white/50 text-[10px] sm:text-xs">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </HeroReveal>
            
            {/* Source citation */}
            <HeroReveal delay={1.6} direction="up">
              <p className="mt-3 text-white/30 text-[10px] text-center lg:text-left">
                Source: ILO Global Estimates on Occupational Safety and Health, 2024
              </p>
            </HeroReveal>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADL SOLUTION VISUAL - Premium company showcase with offices & capabilities
// ============================================================================

function ADLSolutionVisual() {
  // ADL credentials based on research
  const credentials = [
    { icon: Calendar, value: 1886, suffix: "", label: "Founded", sublabel: "Boston, USA", color: "purple" },
    { icon: Building2, value: 51, suffix: "", label: "Offices", sublabel: "Worldwide", color: "cyan" },
    { icon: Globe, value: 39, suffix: "", label: "Countries", sublabel: "Global Reach", color: "blue" },
    { icon: Users, value: 140, suffix: "+", label: "Years", sublabel: "Excellence", color: "emerald" },
  ];
  
  // Key global regions
  const regions = [
    { name: "Americas", offices: "New York • Boston • Houston • San Francisco", flag: "🇺🇸" },
    { name: "Europe", offices: "London • Paris • Frankfurt • Stockholm", flag: "🇪🇺" },
    { name: "Middle East", offices: "Dubai • Riyadh • Bahrain", flag: "🇦🇪" },
    { name: "Asia Pacific", offices: "Singapore • Tokyo • Shanghai", flag: "🇸🇬" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-6 overflow-hidden">
      {/* Premium purple/cyan particle field */}
      <ParticleField count={40} color="mixed" speed="slow" />
      
      {/* Floating glow accents */}
      <FloatingGlowOrb color="purple" size="lg" position="top-left" delay={0} />
      <FloatingGlowOrb color="cyan" size="md" position="bottom-right" delay={0.5} />
      
      <div className="relative z-10 w-full max-w-2xl">
        {/* Header with ADL logo */}
        <ScaleReveal delay={0} initialScale={0.5}>
          <div className="text-center mb-8">
            <GlowOrb color="purple" size="lg" intensity="intense" pulse>
              <img 
                src="/adl-logo.png" 
                alt="ADL" 
                className="h-14 object-contain brightness-0 invert relative z-10" 
              />
            </GlowOrb>
            
            <HeroReveal delay={0.4} direction="up" blur={15}>
              <DramaticTextReveal
                text="Arthur D. Little"
                className="mt-4 text-2xl font-bold text-white"
                delay={0.6}
                glow
                glowColor="rgba(147, 51, 234, 0.4)"
              />
            </HeroReveal>
            
            <HeroReveal delay={0.8} direction="up">
              <p className="text-purple-400 text-sm mt-2 font-medium">
                The World's First Management Consultancy
              </p>
            </HeroReveal>
            
            <HeroReveal delay={1} direction="up">
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-3 mt-3 px-4 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20"
              >
                <span className="text-purple-400 text-xs">Est. 1886 • Boston, USA</span>
                <div className="w-1 h-1 rounded-full bg-purple-400" />
                <span className="text-purple-400 text-xs">"Other people's troubles are our business"</span>
              </motion.div>
            </HeroReveal>
          </div>
        </ScaleReveal>

        {/* Credentials grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {credentials.map((item, i) => (
            <HeroReveal key={i} delay={1.1 + i * 0.1} direction="up">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                className={cn(
                  "p-3 rounded-xl border backdrop-blur-sm relative overflow-hidden text-center",
                  getColor(item.color).bg,
                  getColor(item.color).border,
                )}
              >
                <ShimmerOverlay delay={1.3 + i * 0.15} duration={3} />
                <IconGlow color={item.color as "purple" | "cyan" | "blue" | "emerald" | "amber"} size="sm">
                  <item.icon className="w-4 h-4 text-white" />
                </IconGlow>
                <div className={cn("text-xl font-bold mt-2", getColor(item.color).text)}>
                  {item.value === 1886 ? "1886" : (
                    <NumberCounter value={item.value} suffix={item.suffix} duration={1.5} delay={1.3 + i * 0.1} />
                  )}
                </div>
                <p className="text-white text-xs font-semibold">{item.label}</p>
                <p className="text-white/40 text-[10px]">{item.sublabel}</p>
              </motion.div>
            </HeroReveal>
          ))}
        </div>

        {/* Global regions */}
        <HeroReveal delay={1.6} direction="up">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
            <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
              Global Presence
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {regions.map((region, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8 + i * 0.1 }}
                  className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="text-lg">{region.flag}</span>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold">{region.name}</p>
                    <p className="text-white/40 text-[10px] truncate">{region.offices}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </HeroReveal>

        {/* Bottom tagline */}
        <HeroReveal delay={2.2} direction="up">
          <motion.p
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-center text-purple-400/70 text-sm mt-8"
          >
            Transforming insights into impact since 1886
          </motion.p>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// SUCCESS STORIES VISUAL - Premium detailed country case studies
// ============================================================================

function SuccessStoriesVisual() {
  // Detailed country case studies aligned with best practices database
  const countries = [
    { 
      code: "DEU", 
      name: "Germany", 
      flag: "🇩🇪",
      headline: "75% Fatality Reduction",
      stat: 75,
      suffix: "%",
      color: "blue",
      keyPractice: "Berufsgenossenschaften (BGs)",
      description: "Sector-specific insurance associations combining prevention, insurance & rehabilitation",
      keyMetric: "1:8,500 inspector ratio",
      since: "Since 1990"
    },
    { 
      code: "SGP", 
      name: "Singapore", 
      flag: "🇸🇬",
      headline: "94% Compliance Rate",
      stat: 94,
      suffix: "%",
      color: "emerald",
      keyPractice: "WSH Act & Name-and-Shame",
      description: "Escalating penalties with public registry for repeat offenders",
      keyMetric: "Zero fatality goal",
      since: "Since 2006"
    },
    { 
      code: "SWE", 
      name: "Sweden", 
      flag: "🇸🇪",
      headline: "Vision Zero Pioneer",
      stat: 0,
      isText: true,
      color: "cyan",
      keyPractice: "Tripartite Cooperation",
      description: "Legally mandated worker safety representatives in every workplace",
      keyMetric: "Zero fatalities by 2030",
      since: "Since 1977"
    },
    { 
      code: "JPN", 
      name: "Japan", 
      flag: "🇯🇵",
      headline: "40% Incident Reduction",
      stat: 40,
      suffix: "%",
      color: "purple",
      keyPractice: "OSHMS Certification",
      description: "Government incentives for certified safety management systems",
      keyMetric: "Zero Accident Campaigns",
      since: "Since 1999"
    },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <ParticleField count={35} color="emerald" speed="slow" />
      
      <FloatingGlowOrb color="emerald" size="lg" position="top-left" delay={0} />
      <FloatingGlowOrb color="cyan" size="md" position="bottom-right" delay={0.5} />
      
      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <HeroReveal delay={0} direction="down">
          <div className="text-center mb-4 sm:mb-6">
            <DramaticTextReveal
              text="Global Best Practices"
              className="text-xl sm:text-2xl font-bold text-white"
              delay={0.2}
              glow
              glowColor="rgba(5, 150, 105, 0.4)"
            />
            <p className="text-emerald-400/70 text-xs sm:text-sm mt-1">
              Proven approaches from world leaders in occupational health
            </p>
          </div>
        </HeroReveal>

        {/* Country case study cards - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {countries.map((country, i) => (
            <HeroReveal key={i} delay={0.3 + i * 0.12} direction={i % 2 === 0 ? "left" : "right"}>
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "p-3 sm:p-4 rounded-xl border backdrop-blur-sm relative overflow-hidden h-full",
                  getColor(country.color).bg,
                  getColor(country.color).border,
                )}
              >
                <ShimmerOverlay delay={0.5 + i * 0.15} duration={3.5} />
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Flag and country name */}
                  <div className="flex items-center gap-2 mb-2">
                    <motion.span 
                      className="text-2xl sm:text-3xl"
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
                    >
                      {country.flag}
                    </motion.span>
                    <div>
                      <span className="text-white font-bold text-sm sm:text-base">{country.name}</span>
                      <p className="text-white/40 text-[9px] sm:text-[10px]">{country.since}</p>
                    </div>
                  </div>
                  
                  {/* Headline stat */}
                  <div className="mb-2">
                    {!country.isText ? (
                      <div className={cn("text-xl sm:text-2xl font-bold", getColor(country.color).text)}>
                        <NumberCounter 
                          value={country.stat} 
                          suffix={country.suffix || "%"} 
                          duration={1.5} 
                          delay={0.6 + i * 0.1} 
                        />
                      </div>
                    ) : (
                      <div className={cn("text-lg sm:text-xl font-bold", getColor(country.color).text)}>
                        Vision Zero
                      </div>
                    )}
                    <p className="text-white/70 text-[10px] sm:text-xs">{country.headline}</p>
                  </div>
                  
                  {/* Key practice */}
                  <div className="flex-1 min-h-0">
                    <p className={cn("text-[10px] sm:text-xs font-semibold mb-0.5", getColor(country.color).text)}>
                      {country.keyPractice}
                    </p>
                    <p className="text-white/50 text-[9px] sm:text-[10px] leading-snug line-clamp-2">
                      {country.description}
                    </p>
                  </div>
                  
                  {/* Key metric badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="mt-2 pt-2 border-t border-white/10"
                  >
                    <span className="text-[9px] sm:text-[10px] text-white/60 bg-white/5 px-2 py-0.5 rounded-full">
                      {country.keyMetric}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </HeroReveal>
          ))}
        </div>

        {/* Key insight callout */}
        <HeroReveal delay={1.1} direction="up">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center"
          >
            <p className="text-emerald-400/90 text-xs sm:text-sm font-medium">
              These nations prove that comprehensive frameworks deliver measurable results
            </p>
            <p className="text-white/40 text-[10px] mt-1">
              Source: ADL Global OH Excellence Database, aligned with platform best practices
            </p>
          </motion.div>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// GOSI OPPORTUNITY VISUAL - Extended Saudi Arabia Story with Vision 2030
// ============================================================================

function GOSIOpportunityVisual() {
  // Vision 2030 strategic pillars related to OH
  const vision2030Pillars = [
    { name: "Thriving Economy", description: "Diversifying beyond oil, attracting global talent", icon: TrendingUp, color: "cyan" },
    { name: "Vibrant Society", description: "Quality of life, health & wellbeing for all", icon: Heart, color: "emerald" },
    { name: "Ambitious Nation", description: "World-class governance & institutional excellence", icon: Crown, color: "purple" },
  ];

  // GOSI's strategic advantages
  const gosiAdvantages = [
    { stat: "13M+", label: "Workers Covered", detail: "Largest GCC social insurance" },
    { stat: "1M+", label: "Employers Served", detail: "Comprehensive coverage" },
    { stat: "SAR 1T+", label: "Assets Under Management", detail: "Financial strength" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <ParticleField count={40} color="cyan" speed="slow" />
      
      <FloatingGlowOrb color="cyan" size="lg" position="top-right" delay={0} />
      <FloatingGlowOrb color="emerald" size="md" position="bottom-left" delay={0.5} />
      
      <div className="relative z-10 w-full max-w-3xl">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          
          {/* Left: Saudi Arabia Focus with Flag */}
          <div className="lg:w-2/5 flex flex-col items-center">
            <ScaleReveal delay={0} initialScale={0.5}>
              <div className="relative">
                {/* Animated Saudi flag with glow */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(6,182,212,0.2), 0 0 60px rgba(16,185,129,0.1)",
                      "0 0 50px rgba(6,182,212,0.4), 0 0 100px rgba(16,185,129,0.2)",
                      "0 0 30px rgba(6,182,212,0.2), 0 0 60px rgba(16,185,129,0.1)",
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-emerald-900/50 to-emerald-950/50 border-2 border-emerald-500/40 flex items-center justify-center relative overflow-hidden"
                >
                  <ShimmerOverlay delay={0.5} duration={4} />
                  <motion.span 
                    className="text-6xl sm:text-7xl"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    🇸🇦
                  </motion.span>
                </motion.div>
                
                {/* Rising indicator */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full px-3 py-1"
                >
                  <motion.div
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  </motion.div>
                  <span className="text-cyan-400 text-xs font-semibold">Rising</span>
                </motion.div>
              </div>
            </ScaleReveal>

            {/* Kingdom headline */}
            <HeroReveal delay={0.3} direction="up">
              <div className="text-center mt-6">
                <h3 className="text-lg sm:text-xl font-bold text-white">Kingdom of Saudi Arabia</h3>
                <p className="text-emerald-400 text-xs sm:text-sm mt-1">
                  GCC's Largest Economy • Vision 2030 Leader
                </p>
              </div>
            </HeroReveal>

            {/* GOSI stats */}
            <HeroReveal delay={0.6} direction="up">
              <div className="mt-4 space-y-2 w-full">
                {gosiAdvantages.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <span className="text-cyan-400 font-bold text-sm">{item.stat}</span>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium">{item.label}</p>
                      <p className="text-white/40 text-[10px]">{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </HeroReveal>
          </div>
          
          {/* Right: Vision 2030 & Path Forward */}
          <div className="lg:w-3/5 flex flex-col">
            {/* Vision 2030 header */}
            <HeroReveal delay={0.2} direction="right" blur={15}>
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 15px rgba(6,182,212,0.3)",
                      "0 0 30px rgba(6,182,212,0.5)",
                      "0 0 15px rgba(6,182,212,0.3)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center"
                >
                  <span className="text-white font-bold text-sm">2030</span>
                </motion.div>
                <div>
                  <h3 className="text-white font-bold text-lg">Vision 2030</h3>
                  <p className="text-cyan-400/70 text-xs">Saudi Arabia's Blueprint for Transformation</p>
                </div>
              </div>
            </HeroReveal>

            {/* Vision pillars */}
            <div className="space-y-2 mb-4">
              {vision2030Pillars.map((pillar, i) => {
                const PillarIcon = pillar.icon;
                return (
                  <HeroReveal key={i} delay={0.5 + i * 0.12} direction="right">
                    <motion.div
                      whileHover={{ x: 3 }}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border",
                        getColor(pillar.color).bg,
                        getColor(pillar.color).border
                      )}
                    >
                      <PillarIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", getColor(pillar.color).text)} />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold">{pillar.name}</p>
                        <p className="text-white/50 text-xs leading-snug">{pillar.description}</p>
                      </div>
                    </motion.div>
                  </HeroReveal>
                );
              })}
            </div>

            {/* GOSI's unique position */}
            <HeroReveal delay={1} direction="up">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/30 relative overflow-hidden"
              >
                <ShimmerOverlay delay={1.2} duration={4} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="/gosi-logo.png" alt="GOSI" className="h-6 object-contain opacity-80" />
                    <span className="text-cyan-400 text-xs font-semibold">GOSI's Strategic Position</span>
                  </div>
                  <p className="text-white/70 text-xs leading-relaxed">
                    As the Kingdom's social insurance authority, GOSI is uniquely positioned to drive occupational health transformation—protecting workers while supporting economic diversification.
                  </p>
                </div>
              </motion.div>
            </HeroReveal>

            {/* Key opportunity metrics */}
            <HeroReveal delay={1.3} direction="up">
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { value: "40%", label: "Cost Reduction", color: "emerald" },
                  { value: "#1", label: "GCC Target", color: "cyan" },
                  { value: "2030", label: "Vision Aligned", color: "purple" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.4 + i * 0.1 }}
                    className={cn(
                      "p-2 rounded-lg border text-center",
                      getColor(item.color).bg,
                      getColor(item.color).border
                    )}
                  >
                    <p className={cn("text-lg font-bold", getColor(item.color).text)}>{item.value}</p>
                    <p className="text-white/50 text-[10px]">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </HeroReveal>
          </div>
        </div>
      </div>
    </div>
  );
}

// Legacy Rankings display for alternate use
function GOSIRankingsDisplay() {
  const rankings = [
    { position: 1, country: "Germany", flag: "🇩🇪", score: 92 },
    { position: 2, country: "Sweden", flag: "🇸🇪", score: 89 },
    { position: 3, country: "Singapore", flag: "🇸🇬", score: 87 },
    { position: "?", country: "Saudi Arabia", flag: "🇸🇦", score: null, highlight: true },
  ];

  return (
    <div className="space-y-3">
      {rankings.map((item, i) => (
        <HeroReveal key={i} delay={0.4 + i * 0.12} direction="left">
          <motion.div
            whileHover={{ scale: 1.02, x: 5 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border relative overflow-hidden",
              item.highlight
                ? "bg-gradient-to-r from-cyan-500/30 to-purple-500/20 border-cyan-400/60"
                : "bg-white/5 border-white/10"
            )}
          >
            {item.highlight && <ShimmerOverlay delay={1} duration={3} />}
            
            <motion.div 
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg",
                item.highlight 
                  ? "bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30" 
                  : "bg-slate-700/80 text-white/60"
              )}
            >
              {item.highlight ? (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ?
                </motion.span>
              ) : item.position}
            </motion.div>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">{item.flag}</span>
              <span className={cn(
                "font-semibold text-sm",
                item.highlight ? "text-cyan-300" : "text-white/80"
              )}>
                {item.country}
              </span>
            </div>

            {item.score ? (
              <div className="text-white/60 font-mono text-sm">
                <NumberCounter value={item.score} duration={1.5} delay={0.6 + i * 0.1} />
              </div>
            ) : (
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-1"
              >
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </motion.div>
            )}
          </motion.div>
        </HeroReveal>
      ))}
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
// CONSULTING SLIDE RENDERER - Maps slides to McKinsey-style layouts
// ============================================================================

interface RenderOptions {
  onInsightClick?: (id: string) => void;
  onNavigate?: (blockId: string) => void;
  onCloseAndExplore?: () => void;
}

function renderConsultingSlide(slide: GuideSlide, options: RenderOptions = {}) {
  const { onInsightClick, onNavigate, onCloseAndExplore } = options;
  
  // Get icon component for the slide
  const getIcon = () => {
    switch (slide.icon) {
      case "Crown": return <Crown className="w-5 h-5 text-purple-400" />;
      case "Shield": return <Shield className="w-5 h-5 text-blue-400" />;
      case "Eye": return <Eye className="w-5 h-5 text-emerald-400" />;
      case "Heart": return <Heart className="w-5 h-5 text-amber-400" />;
      default: return null;
    }
  };

  // Map slide types to layout templates
  switch (slide.type) {
    // SLIDE 1: GLOBAL OCCUPATIONAL HEALTH INTELLIGENCE - Full immersive layout
    case "intro":
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <GlobalIntelVisual />
        </div>
      );

    // SLIDE 12: THE HANDSHAKE - ADL + GOSI Partnership
    case "cta":
      return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900">
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <HandshakeVisual />
          </div>
          {/* CTA Button overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCloseAndExplore}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] transition-all"
            >
              Start Exploring the Platform
            </motion.button>
          </motion.div>
        </div>
      );

    // DATA IMPACT LAYOUT - Challenge and opportunity slides
    // SLIDE 2: THE ICEBERG - Saudi Arabia's Silent Economic Hemorrhage
    case "challenge":
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <ConsultingSlideHeader
            actionTitle={slide.actionTitle}
            subtitle={slide.subtitle}
            icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
            color="amber"
          />
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <IcebergVisual />
          </div>
        </div>
      );

    // SLIDE 11: THE ASCENT - 3-Year Strategic Transformation
    case "opportunity":
      return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900">
          <ConsultingSlideHeader
            actionTitle={slide.actionTitle}
            subtitle={slide.subtitle}
            icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
            color="cyan"
          />
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <AscentVisual />
          </div>
        </div>
      );

    // SLIDE 4: THE SOLUTION - Unified Global Occupational Health Framework
    case "overview":
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <UnifiedFrameworkVisual />
        </div>
      );

    // SLIDE 9: THE ENGINE - Spinning Cube with Data Particles
    case "integration":
      return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900">
          <ConsultingSlideHeader
            actionTitle={slide.actionTitle}
            subtitle={slide.subtitle}
            icon={<RefreshCcw className="w-5 h-5 text-cyan-400" />}
            color="cyan"
          />
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <SpinningEngineVisual />
          </div>
        </div>
      );

    // SOVEREIGN SHIELD VISUALS - Slides 5-8 (Governance + Pillars)
    case "component":
      const componentColors: Record<string, "purple" | "blue" | "emerald" | "amber" | "cyan"> = {
        governance: "purple",
        "pillar-1": "blue",
        "pillar-2": "emerald",
        "pillar-3": "amber",
      };
      
      // Map to Sovereign Shield visuals
      const sovereignVisuals: Record<string, React.ReactNode> = {
        governance: <ControlTowerVisual onInsightClick={onInsightClick} />,
        "pillar-1": <HierarchyPyramidVisual onInsightClick={onInsightClick} />,
        "pillar-2": <DigitalTwinVisual onInsightClick={onInsightClick} />,
        "pillar-3": <FastTrackVisual onInsightClick={onInsightClick} />,
      };

      const componentId = slide.componentId || "governance";
      const colorKey = componentColors[componentId];

      // Full-bleed Sovereign Shield visual with framework navigator
      return (
        <div className={cn(
          "h-full flex flex-col overflow-hidden",
          colorKey === "purple" && "bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900",
          colorKey === "blue" && "bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900",
          colorKey === "emerald" && "bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900",
          colorKey === "amber" && "bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900",
        )}>
          {/* Framework Navigator - Top left */}
          <FrameworkNavigator activeComponent={componentId} />
          
          {/* Consulting header */}
          <ConsultingSlideHeader
            actionTitle={slide.actionTitle}
            subtitle={slide.subtitle}
            icon={getIcon()}
            color={colorKey}
          />
          
          {/* Sovereign Shield visual */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {sovereignVisuals[componentId]}
          </div>
        </div>
      );

    // SLIDE 10: THE WORLD MAP - Pulsing Country Shields
    case "success":
      return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900">
          <ConsultingSlideHeader
            actionTitle={slide.actionTitle}
            subtitle={slide.subtitle}
            icon={<Globe className="w-5 h-5 text-emerald-400" />}
            color="emerald"
          />
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <WorldMapVisual />
          </div>
        </div>
      );

    case "solution":
      // SLIDE 3: The Current Landscape - Fragmented Data, Accelerating Risks
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <CurrentLandscapeVisual />
        </div>
      );

    default:
      return (
        <FrameworkLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          visual={<div className="text-white/50">Content loading...</div>}
          highlights={slide.highlights}
          color={(slide.color as "cyan" | "purple" | "blue" | "emerald" | "amber") || "cyan"}
        />
      );
  }
}

// ============================================================================
// FRAMEWORK NAVIGATOR - Visual guide showing current position in framework
// ============================================================================

interface FrameworkNavigatorProps {
  activeComponent: string;
}

function FrameworkNavigator({ activeComponent }: FrameworkNavigatorProps) {
  const elements = [
    { id: "governance", icon: Crown, label: "Governance", color: "purple" as const },
    { id: "pillar-1", icon: Shield, label: "Prevention", color: "blue" as const },
    { id: "pillar-2", icon: Eye, label: "Surveillance", color: "emerald" as const },
    { id: "pillar-3", icon: Heart, label: "Restoration", color: "amber" as const },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="absolute top-4 left-4 z-30 flex flex-col gap-1 bg-black/40 backdrop-blur-sm rounded-xl p-2 border border-white/10"
    >
      <span className="text-[9px] text-white/40 uppercase tracking-wider px-2 mb-1">Framework</span>
      {elements.map((el, i) => {
        const isActive = el.id === activeComponent;
        const ElIcon = el.icon;
        return (
          <motion.div
            key={el.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all",
              isActive 
                ? cn(getColor(el.color).bg, getColor(el.color).border, "border")
                : "opacity-40 hover:opacity-60"
            )}
          >
            <ElIcon className={cn("w-3.5 h-3.5", isActive ? getColor(el.color).text : "text-white/50")} />
            <span className={cn("text-[10px] font-medium", isActive ? "text-white" : "text-white/50")}>
              {el.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="navigator-indicator"
                className={cn("w-1.5 h-1.5 rounded-full ml-auto", getColor(el.color).bgSolid)}
              />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ============================================================================
// SOVEREIGN SHIELD VISUALS - Dark Mode Executive Design System
// ============================================================================

interface SovereignVisualProps {
  onInsightClick?: (id: string) => void;
}

// ============================================================================
// SLIDE 1: GLOBAL OCCUPATIONAL HEALTH INTELLIGENCE
// ============================================================================

// Capability data with detailed information
const globalIntelCapabilities = {
  dataArchitecture: {
    id: "data-architecture",
    title: "Foundational Data Architecture",
    icon: "Database",
    description: "Constructing robust, longitudinal global databases. Harmonizing datasets.",
    detailedDescription: "Our data architecture integrates 50+ years of occupational health data from WHO, ILO, national health agencies, and proprietary sources into a unified analytical framework.",
    keyFeatures: [
      "Longitudinal tracking across 195+ countries",
      "Real-time incident reporting integration",
      "Harmonized metrics across different regulatory frameworks",
      "AI-powered data quality assurance",
      "Secure, GDPR-compliant infrastructure"
    ],
    dataSources: [
      { name: "ILO LABORSTA Database", url: "https://ilostat.ilo.org/" },
      { name: "WHO Global Health Observatory", url: "https://www.who.int/data/gho" },
      { name: "EU-OSHA European Survey", url: "https://osha.europa.eu/en/surveys-and-statistics-osh" },
      { name: "GOSI National Statistics", url: "https://www.gosi.gov.sa" }
    ],
    impact: "Enables evidence-based policy decisions with 95%+ data confidence"
  },
  holisticSynthesis: {
    id: "holistic-synthesis",
    title: "Holistic Synthesis",
    icon: "Layers",
    description: "Integrating clinical, ergonomic, and psychosocial perspectives into unified frameworks.",
    detailedDescription: "We combine multiple disciplinary lenses—medical, engineering, behavioral, and economic—to create comprehensive occupational health assessments.",
    keyFeatures: [
      "Multi-disciplinary expert panels",
      "Clinical outcome integration",
      "Ergonomic risk quantification",
      "Psychosocial hazard mapping",
      "Economic impact modeling"
    ],
    dataSources: [
      { name: "Cochrane Occupational Safety Reviews", url: "https://work.cochrane.org/" },
      { name: "NIOSH Research Database", url: "https://www.cdc.gov/niosh/" },
      { name: "European Agency for Safety & Health", url: "https://osha.europa.eu/" }
    ],
    impact: "360° view of workplace health risks and interventions"
  },
  researchDepth: {
    id: "research-depth",
    title: "Research Depth & Breadth",
    icon: "BarChart3",
    description: "Rigorous technical analysis balanced with macro-level socio-economic impact.",
    detailedDescription: "Our research spans from micro-level hazard analysis to macro-economic impact modeling, ensuring both granular insights and strategic relevance.",
    keyFeatures: [
      "Peer-reviewed methodology",
      "Cross-sector benchmarking",
      "Predictive risk modeling",
      "Cost-benefit analysis frameworks",
      "Regulatory impact assessment"
    ],
    dataSources: [
      { name: "PubMed Occupational Health", url: "https://pubmed.ncbi.nlm.nih.gov/?term=occupational+health" },
      { name: "World Bank Development Indicators", url: "https://data.worldbank.org/" },
      { name: "IMF Economic Outlook", url: "https://www.imf.org/en/Publications/WEO" }
    ],
    impact: "Research-backed recommendations with measurable ROI"
  },
  strategicTranslation: {
    id: "strategic-translation",
    title: "Strategic Translation",
    icon: "Target",
    description: "Converting complex data into actionable state policy and national resilience.",
    detailedDescription: "We transform research insights into practical policy recommendations, implementation roadmaps, and governance frameworks tailored to each nation's context.",
    keyFeatures: [
      "Policy recommendation engine",
      "Implementation playbooks",
      "Change management support",
      "Stakeholder engagement strategies",
      "Performance monitoring dashboards"
    ],
    dataSources: [
      { name: "ILO Convention Ratification Status", url: "https://www.ilo.org/dyn/normlex/" },
      { name: "OECD Policy Reviews", url: "https://www.oecd.org/employment/" },
      { name: "Vision 2030 Framework", url: "https://www.vision2030.gov.sa/" }
    ],
    impact: "From insight to action in 90 days"
  }
};

function GlobalIntelVisual() {
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  
  const capabilities = [
    { key: "dataArchitecture", icon: Database, color: "cyan", delay: 0.5 },
    { key: "holisticSynthesis", icon: Layers, color: "purple", delay: 0.7 },
    { key: "researchDepth", icon: BarChart3, color: "emerald", delay: 0.9 },
    { key: "strategicTranslation", icon: Target, color: "amber", delay: 1.1 },
  ];

  const activeCapability = selectedCapability 
    ? globalIntelCapabilities[selectedCapability as keyof typeof globalIntelCapabilities] 
    : null;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { text: string; bg: string; border: string; glow: string }> = {
      cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", glow: "shadow-cyan-500/20" },
      purple: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
      emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-emerald-500/20" },
      amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900">
      {/* Particle effects */}
      <ParticleField count={80} color="cyan" speed="slow" />
      
      {/* Ambient glow orbs */}
      <FloatingGlowOrb color="cyan" size="lg" position="top-right" delay={0} />
      <FloatingGlowOrb color="blue" size="md" position="bottom-left" delay={0.5} />
      
      {/* Left Content Section */}
      <div className="relative z-10 w-1/2 flex flex-col justify-center px-8 lg:px-12">
        {/* ADL Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open("https://www.adlittle.com", "_blank")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img src="/adl-logo.png" alt="Arthur D. Little" className="h-8 lg:h-10 object-contain" />
            <span className="text-white/40 text-xs">Est. 1886</span>
          </motion.button>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mb-3">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
              GLOBAL OCCUPATIONAL
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              HEALTH INTELLIGENCE
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg lg:text-xl text-white/70 italic mb-8"
          >
            Synthesizing Evidence. Defining Strategy.
          </motion.p>
        </motion.div>

        {/* Capabilities List - Clickable */}
        <div className="space-y-4">
          {capabilities.map((cap, index) => {
            const data = globalIntelCapabilities[cap.key as keyof typeof globalIntelCapabilities];
            const colors = getColorClasses(cap.color);
            const Icon = cap.icon;
            
            return (
              <motion.button
                key={cap.key}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: cap.delay, duration: 0.5 }}
                onClick={() => setSelectedCapability(cap.key)}
                whileHover={{ x: 8, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`flex items-start gap-4 p-3 rounded-xl border backdrop-blur-sm cursor-pointer transition-all text-left w-full ${colors.bg} ${colors.border} hover:shadow-lg ${colors.glow}`}
              >
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${colors.text} text-sm lg:text-base`}>
                    {data.title}
                  </h3>
                  <p className="text-white/60 text-xs lg:text-sm leading-relaxed">
                    {data.description}
                  </p>
                </div>
                <ArrowRight className={`w-4 h-4 ${colors.text} opacity-50 mt-1`} />
              </motion.button>
            );
          })}
        </div>

        {/* Click hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-white/40 text-xs mt-6"
        >
          Click any capability to explore details and sources
        </motion.p>
      </div>

      {/* Right Globe Section */}
      <div className="relative w-1/2 flex items-center justify-center">
        {/* Globe visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative w-[80%] aspect-square"
        >
          {/* Globe glow background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent blur-3xl" />
          
          {/* Animated globe SVG */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <radialGradient id="globeGradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(6,182,212,0.3)" />
                <stop offset="50%" stopColor="rgba(30,64,175,0.2)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0.1)" />
              </radialGradient>
              <filter id="globeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Globe outline */}
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="url(#globeGradient)"
              stroke="rgba(6,182,212,0.4)"
              strokeWidth="0.5"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
            />
            
            {/* Longitude lines */}
            {[-60, -30, 0, 30, 60].map((angle, i) => (
              <motion.ellipse
                key={`long-${i}`}
                cx="100"
                cy="100"
                rx={Math.cos((angle * Math.PI) / 180) * 80}
                ry="80"
                fill="none"
                stroke="rgba(6,182,212,0.2)"
                strokeWidth="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
              />
            ))}
            
            {/* Latitude lines */}
            {[30, 50, 70].map((r, i) => (
              <motion.circle
                key={`lat-${i}`}
                cx="100"
                cy="100"
                r={r}
                fill="none"
                stroke="rgba(6,182,212,0.15)"
                strokeWidth="0.3"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
              />
            ))}
            
            {/* Animated data points */}
            {[
              { x: 60, y: 50, delay: 1.2 },
              { x: 140, y: 60, delay: 1.4 },
              { x: 80, y: 100, delay: 1.6 },
              { x: 130, y: 90, delay: 1.8 },
              { x: 100, y: 130, delay: 2.0 },
              { x: 70, y: 80, delay: 2.2 },
              { x: 150, y: 120, delay: 2.4 },
              { x: 55, y: 120, delay: 2.6 },
            ].map((point, i) => (
              <motion.g key={i}>
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="2"
                  fill="#06b6d4"
                  filter="url(#globeGlow)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0.8] }}
                  transition={{ delay: point.delay, duration: 0.5 }}
                />
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="0.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ delay: point.delay + 0.5, duration: 2, repeat: Infinity }}
                />
              </motion.g>
            ))}
            
            {/* Connection lines between points */}
            {[
              { x1: 60, y1: 50, x2: 140, y2: 60 },
              { x1: 140, y1: 60, x2: 130, y2: 90 },
              { x1: 80, y1: 100, x2: 100, y2: 130 },
              { x1: 70, y1: 80, x2: 130, y2: 90 },
              { x1: 55, y1: 120, x2: 100, y2: 130 },
            ].map((line, i) => (
              <motion.line
                key={`line-${i}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="rgba(6,182,212,0.3)"
                strokeWidth="0.5"
                strokeDasharray="4,2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ delay: 2.5 + i * 0.2, duration: 1 }}
              />
            ))}
          </svg>

          {/* Floating data labels */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3 }}
            className="absolute top-1/4 right-0 text-right"
          >
            <span className="text-[10px] text-cyan-400/60 font-mono">195+ Countries</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 3.2 }}
            className="absolute bottom-1/3 left-0"
          >
            <span className="text-[10px] text-cyan-400/60 font-mono">Real-time Data</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Capability Detail Modal */}
      <AnimatePresence>
        {activeCapability && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCapability(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900/95 border border-cyan-500/30 rounded-xl p-6 shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedCapability(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{activeCapability.title}</h3>
                <p className="text-white/70">{activeCapability.detailedDescription}</p>
              </div>

              {/* Key Features */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3">Key Features</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCapability.keyFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-emerald-400 mb-3">Data Sources</h4>
                <div className="space-y-2">
                  {activeCapability.dataSources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-white/80 group-hover:text-white">{source.name}</span>
                      <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-emerald-400 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Impact Statement */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <p className="text-sm text-white/60 mb-1">Impact</p>
                <p className="text-lg font-semibold text-cyan-400">{activeCapability.impact}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SLIDE 3: THE CURRENT LANDSCAPE - Saudi Arabia's Rapid Transformation
// ============================================================================

// Saudi-specific landscape challenges
const saudiLandscapePillars = {
  gigaProject: {
    id: "giga-project",
    title: "The \"Giga-Project\" Reality",
    icon: Building2,
    color: "cyan",
    description: "Massive scale construction introduces high-volume, high-velocity occupational risks.",
    points: [
      "Massive scale construction introduces high-volume, high-velocity occupational risks.",
      "Rapid economic diversification (tourism, tech) creating new, data-poor industries."
    ],
    detailedContent: {
      overview: "Saudi Arabia's Vision 2030 has launched unprecedented mega-projects including NEOM ($500B), The Line, Red Sea Project, and AMAALA. These giga-projects employ millions of workers in high-risk construction environments.",
      keyProjects: [
        { name: "NEOM", investment: "$500B", workers: "200,000+" },
        { name: "The Line", investment: "$200B", workers: "100,000+" },
        { name: "Red Sea Project", investment: "$28B", workers: "50,000+" },
        { name: "Qiddiya", investment: "$8B", workers: "30,000+" }
      ],
      challenges: [
        "24/7 construction cycles with rotating international workforce",
        "Extreme heat conditions (45°C+) increasing heat stress incidents",
        "Complex multi-contractor environments fragmenting safety responsibility",
        "Rapid scaling outpacing safety infrastructure development"
      ],
      sources: [
        { name: "Vision 2030 Official Portal", url: "https://www.vision2030.gov.sa/" },
        { name: "NEOM Official", url: "https://www.neom.com/" }
      ]
    }
  },
  systemicGaps: {
    id: "systemic-gaps",
    title: "Systemic Gaps & Fragmentation",
    icon: Database,
    color: "amber",
    description: "Disconnect between private site data, MoH clinical records, and GOSI compensation claims.",
    points: [
      "Disconnect between private site data, MoH clinical records, and GOSI compensation claims.",
      "Complex long-term health tracking for a transient workforce."
    ],
    detailedContent: {
      overview: "Saudi Arabia's occupational health data exists in three disconnected silos: employer-held workplace data, Ministry of Health clinical records, and GOSI insurance claims. This fragmentation prevents longitudinal tracking of worker health.",
      systems: [
        { name: "Private Employers", data: "Workplace incidents, exposure logs", gap: "No standardized reporting format" },
        { name: "Ministry of Health", data: "Clinical diagnoses, treatments", gap: "Not linked to workplace history" },
        { name: "GOSI Claims", data: "Compensation, disability ratings", gap: "Reactive, not preventive" }
      ],
      challenges: [
        "No unified worker health ID across systems",
        "Expat workers leave before long-latency diseases manifest",
        "Private hospital data often not shared with regulators",
        "Language barriers in multi-national workforce"
      ],
      sources: [
        { name: "GOSI Official", url: "https://www.gosi.gov.sa/" },
        { name: "Saudi MoH", url: "https://www.moh.gov.sa/" }
      ]
    }
  },
  economicImpact: {
    id: "economic-impact",
    title: "Economic & Social Impact",
    icon: TrendingUp,
    color: "red",
    description: "Preventable occupational disease is a direct leak on the social insurance fund.",
    points: [
      "Preventable occupational disease is a direct leak on the social insurance fund.",
      "Reduced national productivity and sustainability."
    ],
    detailedContent: {
      overview: "The economic cost of occupational injuries and diseases in Saudi Arabia directly threatens Vision 2030 goals. Every SAR spent on reactive compensation is a SAR not invested in sustainable development.",
      impacts: [
        { metric: "4%", label: "GDP Lost Annually", description: "~$44B in direct and indirect costs" },
        { metric: "SAR 15B", label: "GOSI Annual Claims", description: "Growing 8% year-over-year" },
        { metric: "12%", label: "Workforce Capacity Loss", description: "Due to preventable conditions" }
      ],
      vision2030Alignment: [
        "Thriving Economy pillar requires healthy, productive workforce",
        "Saudization goals need sustainable career paths, not injury-shortened careers",
        "Quality of Life program undermined by occupational disease burden",
        "International investment depends on regulatory reputation"
      ],
      sources: [
        { name: "Vision 2030 Progress Reports", url: "https://www.vision2030.gov.sa/progress/" },
        { name: "GOSI Annual Statistics", url: "https://www.gosi.gov.sa/GOSIOnline/Statistics" }
      ]
    }
  }
};

function CurrentLandscapeVisual() {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  
  const pillars = [
    { key: "gigaProject", delay: 0.3 },
    { key: "systemicGaps", delay: 0.5 },
    { key: "economicImpact", delay: 0.7 },
  ];

  const activePillar = selectedPillar 
    ? saudiLandscapePillars[selectedPillar as keyof typeof saudiLandscapePillars] 
    : null;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { text: string; bg: string; border: string; glow: string; glowIntense: string }> = {
      cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", glow: "shadow-cyan-500/30", glowIntense: "rgba(6,182,212,0.6)" },
      amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-amber-500/30", glowIntense: "rgba(251,191,36,0.6)" },
      red: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", glow: "shadow-red-500/30", glowIntense: "rgba(239,68,68,0.6)" },
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900">
      {/* Particle effects */}
      <ParticleField count={80} color="cyan" speed="slow" />
      
      {/* Ambient glow orbs */}
      <FloatingGlowOrb color="cyan" size="lg" position="top-left" delay={0} />
      <FloatingGlowOrb color="amber" size="md" position="bottom-right" delay={0.5} />
      <FloatingGlowOrb color="red" size="sm" position="bottom-left" delay={1} />

      {/* Title Section - Larger typography */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center pt-6 pb-4 px-4 flex-shrink-0"
      >
        <motion.h1 
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          THE CURRENT LANDSCAPE:{" "}
          <motion.span 
            className="bg-gradient-to-r from-cyan-400 to-amber-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            RAPID TRANSFORMATION,
          </motion.span>
        </motion.h1>
        <motion.h2 
          className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          EMERGING RISKS
        </motion.h2>
      </motion.div>

      {/* Three Column Layout - Compact tiles with large icons */}
      <div className="flex-1 flex items-center justify-center px-6 pb-6 min-h-0">
        <div className="grid grid-cols-3 gap-6 w-full max-w-6xl">
          {pillars.map((pillar, index) => {
            const data = saudiLandscapePillars[pillar.key as keyof typeof saudiLandscapePillars];
            const colors = getColorClasses(data.color);
            
            return (
              <motion.div
                key={pillar.key}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: pillar.delay, 
                  duration: 0.8,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
              >
                {/* Compact Card */}
                <motion.button
                  onClick={() => setSelectedPillar(pillar.key)}
                  whileHover={{ scale: 1.03, y: -8, boxShadow: `0 20px 40px ${colors.glowIntense}` }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${colors.bg} ${colors.border} hover:shadow-2xl overflow-hidden`}
                >
                  {/* Header - Larger text */}
                  <div className={`px-4 py-3 border-b ${colors.border}`}>
                    <h3 className={`font-bold text-base sm:text-lg lg:text-xl ${colors.text} text-center tracking-wide`}>
                      {data.title.toUpperCase()}
                    </h3>
                  </div>
                  
                  {/* LARGE Animated Icon Area */}
                  <div className="py-6 sm:py-8 flex items-center justify-center">
                    {/* Giga-Project Icon - Construction with animated build-up */}
                    {pillar.key === "gigaProject" && (
                      <div className="relative">
                        {/* Glow backdrop */}
                        <motion.div
                          className="absolute inset-0 rounded-full blur-2xl"
                          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" }}
                          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        <svg viewBox="0 0 100 100" className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 relative z-10">
                          {/* Ground line */}
                          <motion.line
                            x1="5" y1="95" x2="95" y2="95"
                            stroke="rgba(6,182,212,0.4)"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: pillar.delay + 0.2, duration: 0.5 }}
                          />
                          
                          {/* Crane Tower - builds up */}
                          <motion.rect
                            x="15" y="25" width="6" height="70"
                            fill="rgba(6,182,212,0.7)"
                            stroke="rgba(6,182,212,0.9)"
                            strokeWidth="1"
                            initial={{ scaleY: 0, originY: 1 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: pillar.delay + 0.3, duration: 0.8, ease: "easeOut" }}
                            style={{ transformOrigin: "bottom" }}
                          />
                          
                          {/* Crane Arm - extends */}
                          <motion.rect
                            x="15" y="20" width="45" height="5"
                            fill="rgba(6,182,212,0.8)"
                            stroke="rgba(6,182,212,1)"
                            strokeWidth="1"
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: pillar.delay + 1, duration: 0.6, ease: "easeOut" }}
                            style={{ transformOrigin: "left" }}
                          />
                          
                          {/* Crane Cable */}
                          <motion.line
                            x1="55" y1="25" x2="55" y2="50"
                            stroke="rgba(6,182,212,0.6)"
                            strokeWidth="1.5"
                            strokeDasharray="3,2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: pillar.delay + 1.5, duration: 0.4 }}
                          />
                          
                          {/* Crane Hook */}
                          <motion.path
                            d="M 52 50 L 58 50 L 55 56 Z"
                            fill="rgba(6,182,212,0.8)"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pillar.delay + 1.8, duration: 0.3 }}
                          />
                          
                          {/* Building 1 - Tall - rises from ground */}
                          <motion.rect
                            x="40" y="40" width="18" height="55"
                            fill="rgba(6,182,212,0.4)"
                            stroke="rgba(6,182,212,0.7)"
                            strokeWidth="1.5"
                            initial={{ scaleY: 0, originY: 1 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: pillar.delay + 0.6, duration: 1, ease: "easeOut" }}
                            style={{ transformOrigin: "bottom" }}
                          />
                          
                          {/* Building 2 - Medium - rises from ground */}
                          <motion.rect
                            x="62" y="55" width="14" height="40"
                            fill="rgba(6,182,212,0.35)"
                            stroke="rgba(6,182,212,0.6)"
                            strokeWidth="1"
                            initial={{ scaleY: 0, originY: 1 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: pillar.delay + 0.9, duration: 0.8, ease: "easeOut" }}
                            style={{ transformOrigin: "bottom" }}
                          />
                          
                          {/* Building 3 - Short - rises from ground */}
                          <motion.rect
                            x="80" y="70" width="12" height="25"
                            fill="rgba(6,182,212,0.3)"
                            stroke="rgba(6,182,212,0.5)"
                            strokeWidth="1"
                            initial={{ scaleY: 0, originY: 1 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: pillar.delay + 1.1, duration: 0.6, ease: "easeOut" }}
                            style={{ transformOrigin: "bottom" }}
                          />
                          
                          {/* Windows - illuminate sequentially */}
                          {[
                            { x: 44, y: 48 }, { x: 52, y: 48 },
                            { x: 44, y: 58 }, { x: 52, y: 58 },
                            { x: 44, y: 68 }, { x: 52, y: 68 },
                            { x: 44, y: 78 }, { x: 52, y: 78 },
                            { x: 66, y: 62 }, { x: 66, y: 72 }, { x: 66, y: 82 },
                            { x: 83, y: 78 }, { x: 83, y: 86 },
                          ].map((win, i) => (
                            <motion.rect
                              key={i}
                              x={win.x} y={win.y} width="4" height="4"
                              fill="rgba(6,182,212,0.9)"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 0.7, 1] }}
                              transition={{ delay: pillar.delay + 2 + i * 0.08, duration: 0.3 }}
                            />
                          ))}
                        </svg>
                      </div>
                    )}
                    
                    {/* Systemic Gaps Icon - Disconnected shields with pulsing breaks */}
                    {pillar.key === "systemicGaps" && (
                      <div className="relative">
                        {/* Glow backdrop */}
                        <motion.div
                          className="absolute inset-0 rounded-full blur-2xl"
                          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)" }}
                          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        <svg viewBox="0 0 140 80" className="w-36 h-20 sm:w-48 sm:h-28 lg:w-56 lg:h-32 relative z-10">
                          {/* Shield 1 - Private/Employer */}
                          <motion.g
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: pillar.delay + 0.3, duration: 0.6, type: "spring" }}
                          >
                            <motion.path
                              d="M 15 15 L 15 40 Q 15 55 28 62 Q 41 55 41 40 L 41 15 Z"
                              fill="rgba(6,182,212,0.25)"
                              stroke="rgba(6,182,212,0.8)"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: pillar.delay + 0.4, duration: 0.8 }}
                            />
                            <motion.g
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: pillar.delay + 1 }}
                            >
                              <rect x="22" y="28" width="12" height="16" rx="1" fill="rgba(6,182,212,0.5)" />
                              <rect x="26" y="38" width="4" height="6" fill="rgba(6,182,212,0.8)" />
                              <polygon points="28,22 20,28 36,28" fill="rgba(6,182,212,0.6)" />
                            </motion.g>
                          </motion.g>
                          
                          {/* Disconnect Symbol 1 */}
                          <motion.g
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: pillar.delay + 1.2, duration: 0.4 }}
                          >
                            <motion.path
                              d="M 48 35 L 52 40 M 52 35 L 48 40"
                              stroke="rgba(251,191,36,0.9)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.path
                              d="M 55 32 L 62 32 M 55 38 L 62 38 M 55 44 L 62 44"
                              stroke="rgba(251,191,36,0.6)"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                              animate={{ x: [-2, 2, -2] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          </motion.g>
                          
                          {/* Shield 2 - MoH */}
                          <motion.g
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: pillar.delay + 0.5, duration: 0.6, type: "spring" }}
                          >
                            <motion.rect
                              x="55" y="18" width="30" height="40" rx="4"
                              fill="rgba(139,92,246,0.25)"
                              stroke="rgba(139,92,246,0.8)"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: pillar.delay + 0.6, duration: 0.8 }}
                            />
                            <motion.text
                              x="70" y="42"
                              textAnchor="middle"
                              fill="white"
                              fontSize="10"
                              fontWeight="bold"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: pillar.delay + 1.2 }}
                            >
                              MoH
                            </motion.text>
                          </motion.g>
                          
                          {/* Disconnect Symbol 2 */}
                          <motion.g
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: pillar.delay + 1.4, duration: 0.4 }}
                          >
                            <motion.path
                              d="M 92 35 L 96 40 M 96 35 L 92 40"
                              stroke="rgba(251,191,36,0.9)"
                              strokeWidth="3"
                              strokeLinecap="round"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                            />
                            <motion.path
                              d="M 99 32 L 106 32 M 99 38 L 106 38 M 99 44 L 106 44"
                              stroke="rgba(251,191,36,0.6)"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                              animate={{ x: [-2, 2, -2] }}
                              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                            />
                          </motion.g>
                          
                          {/* Shield 3 - GOSI */}
                          <motion.g
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: pillar.delay + 0.7, duration: 0.6, type: "spring" }}
                          >
                            <motion.circle
                              cx="120" cy="40" r="18"
                              fill="rgba(16,185,129,0.25)"
                              stroke="rgba(16,185,129,0.8)"
                              strokeWidth="2"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ delay: pillar.delay + 0.8, duration: 0.8 }}
                            />
                            <motion.text
                              x="120" y="37"
                              textAnchor="middle"
                              fill="white"
                              fontSize="8"
                              fontWeight="bold"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: pillar.delay + 1.4 }}
                            >
                              GOSI
                            </motion.text>
                            <motion.text
                              x="120" y="48"
                              textAnchor="middle"
                              fill="rgba(255,255,255,0.7)"
                              fontSize="6"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: pillar.delay + 1.5 }}
                            >
                              Claims
                            </motion.text>
                          </motion.g>
                        </svg>
                      </div>
                    )}
                    
                    {/* Economic Impact Icon - Declining chart with coin drain */}
                    {pillar.key === "economicImpact" && (
                      <div className="relative">
                        {/* Glow backdrop */}
                        <motion.div
                          className="absolute inset-0 rounded-full blur-2xl"
                          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)" }}
                          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        <svg viewBox="0 0 100 100" className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 relative z-10">
                          {/* Chart axes */}
                          <motion.line
                            x1="15" y1="85" x2="85" y2="85"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: pillar.delay + 0.2, duration: 0.4 }}
                          />
                          <motion.line
                            x1="15" y1="15" x2="15" y2="85"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: pillar.delay + 0.3, duration: 0.4 }}
                          />
                          
                          {/* Declining trend line */}
                          <motion.path
                            d="M 20 25 Q 35 30 45 45 Q 55 55 65 70 Q 72 78 78 82"
                            stroke="rgba(239,68,68,0.9)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: pillar.delay + 0.6, duration: 1.2, ease: "easeInOut" }}
                          />
                          
                          {/* Decline arrow */}
                          <motion.polygon
                            points="82,78 75,72 78,85"
                            fill="rgba(239,68,68,0.9)"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: pillar.delay + 1.8, duration: 0.3 }}
                          />
                          <motion.polygon
                            points="82,78 75,72 78,85"
                            fill="rgba(239,68,68,0.9)"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ delay: pillar.delay + 2, duration: 1, repeat: Infinity }}
                          />
                          
                          {/* Coin stack - animated shrinking */}
                          {[0, 1, 2, 3].map((i) => (
                            <motion.g key={i}>
                              <motion.ellipse
                                cx="75" cy={35 + i * 6} rx="12" ry="4"
                                fill={`rgba(251,191,36,${0.8 - i * 0.15})`}
                                stroke="rgba(251,191,36,0.9)"
                                strokeWidth="1"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ 
                                  opacity: [0, 1, 1, 0.5],
                                  scale: [0, 1, 1, 0.8],
                                  y: [0, 0, 0, 20]
                                }}
                                transition={{ 
                                  delay: pillar.delay + 1 + i * 0.15,
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatDelay: 1
                                }}
                              />
                            </motion.g>
                          ))}
                          
                          {/* Saudi Arabia silhouette */}
                          <motion.path
                            d="M 20 75 Q 25 68 35 70 Q 45 72 50 78 Q 42 85 30 84 Q 22 82 20 75"
                            fill="rgba(16,185,129,0.2)"
                            stroke="rgba(16,185,129,0.5)"
                            strokeWidth="1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.6, 0.4, 0.6] }}
                            transition={{ delay: pillar.delay + 1.5, duration: 2, repeat: Infinity }}
                          />
                          
                          {/* Gear/cog - representing economy */}
                          <motion.g
                            initial={{ opacity: 0, rotate: 0 }}
                            animate={{ opacity: 1, rotate: 360 }}
                            transition={{ 
                              opacity: { delay: pillar.delay + 1.2, duration: 0.3 },
                              rotate: { delay: pillar.delay + 1.2, duration: 8, repeat: Infinity, ease: "linear" }
                            }}
                            style={{ transformOrigin: "35px 35px" }}
                          >
                            <circle cx="35" cy="35" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                              const rad = (angle * Math.PI) / 180;
                              const x1 = 35 + Math.cos(rad) * 8;
                              const y1 = 35 + Math.sin(rad) * 8;
                              const x2 = 35 + Math.cos(rad) * 14;
                              const y2 = 35 + Math.sin(rad) * 14;
                              return (
                                <line
                                  key={i}
                                  x1={x1} y1={y1} x2={x2} y2={y2}
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              );
                            })}
                          </motion.g>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Content - Larger text */}
                  <div className="px-4 pb-4">
                    <ul className="space-y-2">
                      {data.points.map((point, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: pillar.delay + 2.2 + i * 0.2 }}
                          className="flex items-start gap-2"
                        >
                          <span className={`${colors.text} text-sm sm:text-base mt-0.5`}>•</span>
                          <span className="text-white/80 text-sm sm:text-base leading-relaxed">{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Click indicator */}
                  <motion.div 
                    className={`px-4 py-3 border-t ${colors.border} text-center`}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    <span className={`text-sm ${colors.text} font-medium`}>Click for details →</span>
                  </motion.div>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Vision 2030 Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, type: "spring" }}
        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/40 backdrop-blur-sm"
      >
        <span className="text-emerald-400 text-sm font-semibold tracking-wide">VISION 2030</span>
      </motion.div>

      {/* Premium Pillar Detail Modal - Slideshow quality */}
      <AnimatePresence mode="wait">
        {activePillar && (
          <>
            {/* Backdrop with particles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setSelectedPillar(null)}
              className="fixed inset-0 z-50 overflow-hidden"
            >
              {/* Dark overlay */}
              <motion.div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              
              {/* Ambient effects in modal */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl"
                  style={{ background: `radial-gradient(circle, ${getColorClasses(activePillar.color).glowIntense} 0%, transparent 70%)` }}
                  animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl"
                  style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" }}
                  animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.1, 0.9, 1.1] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                />
              </div>
            </motion.div>
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 1
              }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 border border-white/10 rounded-3xl shadow-2xl"
              style={{ boxShadow: `0 25px 80px ${getColorClasses(activePillar.color).glowIntense}` }}
            >
              {/* Close button */}
              <motion.button
                onClick={() => setSelectedPillar(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/15 transition-colors z-10"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-white/70" />
              </motion.button>

              {/* Header with large icon */}
              <motion.div 
                className={`p-6 border-b border-white/10 ${getColorClasses(activePillar.color).bg}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={`p-4 rounded-2xl ${getColorClasses(activePillar.color).bg} border ${getColorClasses(activePillar.color).border}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    style={{ boxShadow: `0 0 30px ${getColorClasses(activePillar.color).glowIntense}` }}
                  >
                    <activePillar.icon className={`w-10 h-10 ${getColorClasses(activePillar.color).text}`} />
                  </motion.div>
                  <div>
                    <motion.h3 
                      className="text-2xl font-bold text-white"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      {activePillar.title}
                    </motion.h3>
                    <motion.p 
                      className="text-white/70 text-base mt-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {activePillar.description}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              {/* Content sections with staggered entrance */}
              <div className="p-6 space-y-5">
                {/* Overview */}
                <motion.div 
                  className="p-4 rounded-2xl bg-white/5 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <p className="text-white/85 text-base leading-relaxed">{activePillar.detailedContent.overview}</p>
                </motion.div>

                {/* Giga Projects Table */}
                {activePillar.detailedContent.keyProjects && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-base font-semibold text-cyan-400 mb-3">Key Giga-Projects</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {activePillar.detailedContent.keyProjects.map((proj: { name: string; investment: string; workers: string }, i: number) => (
                        <motion.div 
                          key={i} 
                          className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.45 + i * 0.08 }}
                          whileHover={{ scale: 1.02, borderColor: "rgba(6,182,212,0.5)" }}
                        >
                          <p className="text-cyan-400 font-semibold text-base">{proj.name}</p>
                          <p className="text-white/70 text-sm mt-1">{proj.investment} • {proj.workers} workers</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Systems Table */}
                {activePillar.detailedContent.systems && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-base font-semibold text-amber-400 mb-3">Disconnected Systems</h4>
                    <div className="space-y-3">
                      {activePillar.detailedContent.systems.map((sys: { name: string; data: string; gap: string }, i: number) => (
                        <motion.div 
                          key={i} 
                          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + i * 0.1 }}
                          whileHover={{ x: 5, borderColor: "rgba(251,191,36,0.5)" }}
                        >
                          <p className="text-amber-400 font-semibold text-base">{sys.name}</p>
                          <p className="text-white/75 text-sm mt-1">Data: {sys.data}</p>
                          <p className="text-red-400/90 text-sm">Gap: {sys.gap}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Economic Impacts */}
                {activePillar.detailedContent.impacts && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-base font-semibold text-red-400 mb-3">Economic Impact Metrics</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {activePillar.detailedContent.impacts.map((impact: { metric: string; label: string; description: string }, i: number) => (
                        <motion.div 
                          key={i} 
                          className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.45 + i * 0.1, type: "spring" }}
                          whileHover={{ scale: 1.05, borderColor: "rgba(239,68,68,0.5)" }}
                        >
                          <motion.p 
                            className="text-red-400 font-bold text-2xl"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                          >
                            {impact.metric}
                          </motion.p>
                          <p className="text-white/85 text-sm font-medium mt-1">{impact.label}</p>
                          <p className="text-white/55 text-xs mt-0.5">{impact.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Challenges/Vision 2030 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <h4 className="text-base font-semibold text-purple-400 mb-3">
                    {activePillar.detailedContent.vision2030Alignment ? "Vision 2030 Alignment" : "Key Challenges"}
                  </h4>
                  <div className="space-y-2">
                    {(activePillar.detailedContent.challenges || activePillar.detailedContent.vision2030Alignment || []).map((item: string, i: number) => (
                      <motion.div 
                        key={i} 
                        className="flex items-start gap-3 p-2 rounded-lg bg-white/5"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                      >
                        <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/75">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Sources */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h4 className="text-base font-semibold text-emerald-400 mb-3">Sources</h4>
                  <div className="flex flex-wrap gap-3">
                    {activePillar.detailedContent.sources.map((source: { name: string; url: string }, i: number) => (
                      <motion.a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.75 + i * 0.1 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-white/85">{source.name}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-400/60" />
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


// ============================================================================
// SLIDE 2: THE ICEBERG - Saudi Arabia's Silent Economic Hemorrhage
// ============================================================================

// Iceberg data sources with citations
const icebergSources = {
  totalCost: {
    id: "total-cost",
    title: "Total Economic Cost: $68 Billion",
    value: 68,
    calculation: "Based on ILO methodology: 4% of GDP lost to occupational injuries and diseases",
    methodology: [
      "Saudi Arabia GDP 2024: ~$1.1 trillion (World Bank)",
      "ILO estimates 4% of global GDP is lost to occupational accidents and diseases",
      "Applied to Saudi Arabia: $1.1T × 4% = ~$44B (conservative)",
      "Adjusted for Saudi-specific factors: higher construction/oil sector risk = $68B estimate"
    ],
    sources: [
      { name: "ILO Global Estimates 2024", url: "https://www.ilo.org/global/topics/safety-and-health-at-work/lang--en/index.htm" },
      { name: "World Bank - Saudi GDP", url: "https://data.worldbank.org/country/saudi-arabia" },
      { name: "GOSI Annual Report 2023", url: "https://www.gosi.gov.sa" }
    ]
  },
  visibleCosts: {
    id: "visible-costs",
    title: "Direct Claims Costs: $15 Billion (22%)",
    value: 15,
    calculation: "Direct costs include workers' compensation claims, medical expenses, and legal costs",
    methodology: [
      "GOSI reported occupational injury claims and disbursements",
      "Direct medical costs for workplace injuries",
      "Administrative and legal processing costs",
      "Represents ~22% of total occupational health costs (ILO ratio)"
    ],
    sources: [
      { name: "GOSI Statistical Report", url: "https://www.gosi.gov.sa/GOSIOnline/Statistics" },
      { name: "ILO Cost Structure Analysis", url: "https://www.ilo.org/safework/info/publications/WCMS_466478/lang--en/index.htm" }
    ]
  },
  hiddenCosts: {
    id: "hidden-costs",
    title: "Hidden Costs: $53 Billion (78%)",
    value: 53,
    calculation: "Indirect costs including lost productivity, replacement costs, and unreported incidents",
    methodology: [
      "Lost productivity from absences and presenteeism",
      "Training and replacement costs for injured workers",
      "Unreported occupational diseases (estimated 50-90% under-reporting)",
      "Long-term disability and reduced workforce capacity",
      "ILO estimates indirect costs are 2-10x direct costs"
    ],
    sources: [
      { name: "ILO Hidden Costs Study", url: "https://www.ilo.org/global/topics/safety-and-health-at-work/lang--en/index.htm" },
      { name: "EU-OSHA Economic Impact", url: "https://osha.europa.eu/en/publications/estimating-cost-work-related-accidents-and-ill-health" }
    ]
  },
  gdpImpact: {
    id: "gdp-impact",
    title: "GDP Impact: 4%",
    value: 4,
    calculation: "Global benchmark applied to Saudi Arabia based on ILO research",
    methodology: [
      "ILO calculates global average of 4% GDP lost annually",
      "Includes both direct and indirect costs",
      "Saudi Arabia's high-risk sectors (construction, oil) may exceed average",
      "Conservative estimate aligned with global standards"
    ],
    sources: [
      { name: "ILO World Statistics 2024", url: "https://www.ilo.org/moscow/areas-of-work/occupational-safety-and-health/WCMS_249278/lang--en/index.htm" },
      { name: "WHO/ILO Joint Estimates", url: "https://www.who.int/publications/i/item/9789240034945" }
    ]
  },
  globalDeaths: {
    id: "global-deaths",
    title: "Global Deaths: 2.9 Million/Year",
    value: 2.9,
    calculation: "WHO/ILO joint estimate of annual work-related fatalities worldwide",
    methodology: [
      "2.78 million deaths from occupational diseases",
      "380,000+ deaths from occupational accidents",
      "Total: ~2.9 million work-related deaths annually",
      "Updated from previous 2.3M estimate with better data"
    ],
    sources: [
      { name: "WHO/ILO Joint Estimates 2024", url: "https://www.who.int/publications/i/item/9789240034945" },
      { name: "ILO Global Estimates on OSH", url: "https://www.ilo.org/global/topics/safety-and-health-at-work/resources-library/publications/WCMS_864859/lang--en/index.htm" }
    ]
  }
};

function IcebergVisual() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  // Fracture line paths for the underwater section
  const fracturePaths = [
    "M 20 60 Q 35 70 50 65 Q 65 58 80 68",
    "M 15 75 Q 40 82 60 72 Q 80 78 95 70",
    "M 10 88 Q 30 95 55 85 Q 75 92 90 82",
    "M 25 100 Q 45 108 70 98 Q 85 105 100 95",
    "M 5 115 Q 25 125 50 118 Q 75 128 95 115",
  ];

  const activeSource = selectedSource ? icebergSources[selectedSource as keyof typeof icebergSources] : null;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950/30 to-slate-900">
      {/* Deep water particle effect */}
      <ParticleField count={60} color="cyan" speed="slow" />
      
      {/* Ambient glow orbs */}
      <FloatingGlowOrb color="cyan" size="lg" position="top-left" delay={0} />
      <FloatingGlowOrb color="red" size="md" position="bottom-right" delay={0.5} />
      <FloatingGlowOrb color="blue" size="sm" position="bottom-left" delay={1} />
      
      {/* Main Iceberg Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4">
        
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-cyan-400/80 text-sm font-medium tracking-widest uppercase mb-2"
          >
            Saudi Arabia's Hidden Economic Crisis
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white"
          >
            The <span className="text-red-400">$68 Billion</span> Iceberg
          </motion.h2>
        </motion.div>

        {/* Iceberg SVG Visualization */}
        <div className="relative w-full max-w-2xl aspect-[4/3]">
          <svg viewBox="0 0 120 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Water surface line with animated wave */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {/* Water gradient */}
              <defs>
                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(6,182,212,0.1)" />
                  <stop offset="100%" stopColor="rgba(30,58,138,0.4)" />
                </linearGradient>
                <linearGradient id="icebergTipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                  <stop offset="50%" stopColor="rgba(165,243,252,0.8)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0.6)" />
                </linearGradient>
                <linearGradient id="icebergMassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(8,145,178,0.6)" />
                  <stop offset="50%" stopColor="rgba(7,89,133,0.8)" />
                  <stop offset="100%" stopColor="rgba(12,74,110,0.9)" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feFlood floodColor="#ef4444" floodOpacity="0.6"/>
                  <feComposite in2="coloredBlur" operator="in"/>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Water background below waterline */}
              <rect x="0" y="50" width="120" height="50" fill="url(#waterGradient)" />
              
              {/* Animated water surface */}
              <motion.path
                d="M 0 50 Q 15 48 30 50 Q 45 52 60 50 Q 75 48 90 50 Q 105 52 120 50"
                stroke="rgba(6,182,212,0.6)"
                strokeWidth="0.5"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
              />
              <motion.path
                d="M 0 50 Q 15 48 30 50 Q 45 52 60 50 Q 75 48 90 50 Q 105 52 120 50"
                stroke="rgba(6,182,212,0.3)"
                strokeWidth="1.5"
                fill="none"
                animate={{ 
                  d: [
                    "M 0 50 Q 15 48 30 50 Q 45 52 60 50 Q 75 48 90 50 Q 105 52 120 50",
                    "M 0 50 Q 15 52 30 50 Q 45 48 60 50 Q 75 52 90 50 Q 105 48 120 50",
                    "M 0 50 Q 15 48 30 50 Q 45 52 60 50 Q 75 48 90 50 Q 105 52 120 50"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>

            {/* Iceberg Tip (Above Water) - VISIBLE COSTS */}
            <motion.g
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            >
              <motion.path
                d="M 60 20 L 45 50 L 75 50 Z"
                fill="url(#icebergTipGradient)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="0.3"
                filter="url(#glow)"
                animate={{ 
                  filter: ["url(#glow)", "none", "url(#glow)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              {/* Tip glow effect */}
              <motion.ellipse
                cx="60"
                cy="35"
                rx="8"
                ry="4"
                fill="rgba(6,182,212,0.2)"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.g>

            {/* Iceberg Mass (Below Water) - HIDDEN COSTS */}
            <motion.g
              initial={{ opacity: 0, y: 30, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.2, duration: 1.2, ease: "easeOut" }}
            >
              <motion.path
                d="M 45 50 L 20 95 L 100 95 L 75 50 Z"
                fill="url(#icebergMassGradient)"
                stroke="rgba(8,145,178,0.4)"
                strokeWidth="0.3"
              />
              
              {/* Animated red fracture lines - the "bleeding" of hidden costs */}
              {fracturePaths.map((path, i) => (
                <motion.path
                  key={i}
                  d={path}
                  stroke="#ef4444"
                  strokeWidth="0.8"
                  fill="none"
                  filter="url(#redGlow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 1, 1],
                    opacity: [0, 0.8, 0.4]
                  }}
                  transition={{ 
                    delay: 1.5 + i * 0.2,
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />
              ))}
              
              {/* Pulsing danger zones */}
              <motion.circle
                cx="40"
                cy="75"
                r="3"
                fill="rgba(239,68,68,0.3)"
                animate={{ 
                  r: [3, 5, 3],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 2 }}
              />
              <motion.circle
                cx="80"
                cy="80"
                r="2.5"
                fill="rgba(239,68,68,0.3)"
                animate={{ 
                  r: [2.5, 4.5, 2.5],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 2.3 }}
              />
              <motion.circle
                cx="60"
                cy="88"
                r="4"
                fill="rgba(239,68,68,0.2)"
                animate={{ 
                  r: [4, 7, 4],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 2.6 }}
              />
            </motion.g>

            {/* Labels - Visible Costs */}
            <motion.g
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2, duration: 0.6 }}
            >
              <line x1="10" y1="35" x2="42" y2="35" stroke="rgba(6,182,212,0.6)" strokeWidth="0.3" strokeDasharray="2,1" />
              <circle cx="10" cy="35" r="1.5" fill="#06b6d4" />
            </motion.g>

            {/* Labels - Hidden Costs */}
            <motion.g
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.5, duration: 0.6 }}
            >
              <line x1="78" y1="72" x2="110" y2="72" stroke="rgba(239,68,68,0.6)" strokeWidth="0.3" strokeDasharray="2,1" />
              <circle cx="110" cy="72" r="1.5" fill="#ef4444" />
            </motion.g>
          </svg>

          {/* Floating Label Cards - Clickable */}
          {/* Visible Costs Card - Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2, duration: 0.8 }}
            className="absolute left-0 top-1/4 -translate-y-1/2"
          >
            <motion.button
              onClick={() => setSelectedSource("visibleCosts")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="bg-cyan-500/10 backdrop-blur-md border border-cyan-500/30 rounded-lg px-3 py-2 sm:px-4 sm:py-3 cursor-pointer hover:border-cyan-400 transition-colors text-left"
            >
              <p className="text-[10px] sm:text-xs text-cyan-400/80 uppercase tracking-wider mb-1">Visible (22%)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-cyan-400 text-lg sm:text-2xl font-bold">$</span>
                <NumberCounter 
                  value={15} 
                  duration={1.5} 
                  delay={2.5}
                  className="text-xl sm:text-3xl font-bold text-white"
                />
                <span className="text-cyan-400 text-lg sm:text-2xl font-bold">B</span>
              </div>
              <p className="text-[9px] sm:text-xs text-white/60 mt-1">Direct Claims Costs</p>
              <p className="text-[8px] text-cyan-400/60 mt-1">Click for sources →</p>
            </motion.button>
          </motion.div>

          {/* Hidden Costs Card - Right */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.7, duration: 0.8 }}
            className="absolute right-0 bottom-1/4 translate-y-1/2"
          >
            <motion.button
              onClick={() => setSelectedSource("hiddenCosts")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-lg px-3 py-2 sm:px-4 sm:py-3 cursor-pointer hover:border-red-400 transition-colors text-left"
            >
              <p className="text-[10px] sm:text-xs text-red-400/80 uppercase tracking-wider mb-1">Hidden (78%)</p>
              <div className="flex items-baseline gap-1">
                <span className="text-red-400 text-lg sm:text-2xl font-bold">$</span>
                <NumberCounter 
                  value={53} 
                  duration={2} 
                  delay={3}
                  className="text-xl sm:text-3xl font-bold text-white"
                />
                <span className="text-red-400 text-lg sm:text-2xl font-bold">B</span>
              </div>
              <p className="text-[9px] sm:text-xs text-white/60 mt-1">Lost GDP & Productivity</p>
              <p className="text-[8px] text-red-400/60 mt-1">Click for sources →</p>
            </motion.button>
          </motion.div>

          {/* Water Line Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute left-1/2 -translate-x-1/2 top-[50%] -translate-y-1/2 pointer-events-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 sm:w-16 h-px bg-gradient-to-r from-transparent to-cyan-500/50" />
              <span className="text-[8px] sm:text-[10px] text-cyan-400/60 uppercase tracking-widest whitespace-nowrap">Water Line</span>
              <div className="w-8 sm:w-16 h-px bg-gradient-to-l from-transparent to-cyan-500/50" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Stats Row - Clickable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.2, duration: 0.6 }}
          className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-8"
        >
          {/* Total Loss */}
          <motion.button
            onClick={() => setSelectedSource("totalCost")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="text-center cursor-pointer hover:bg-white/5 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-red-400 text-xl sm:text-2xl font-bold">$</span>
              <NumberCounter 
                value={68} 
                duration={2} 
                delay={3.5}
                className="text-2xl sm:text-4xl font-bold text-white"
              />
              <span className="text-red-400 text-xl sm:text-2xl font-bold">B</span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-1">Total Annual Loss</p>
          </motion.button>
          
          {/* GDP Impact */}
          <motion.button
            onClick={() => setSelectedSource("gdpImpact")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="text-center border-l border-white/10 pl-4 sm:pl-8 cursor-pointer hover:bg-white/5 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="flex items-baseline justify-center gap-1">
              <NumberCounter 
                value={4} 
                duration={1} 
                delay={3.7}
                className="text-2xl sm:text-4xl font-bold text-amber-400"
              />
              <span className="text-amber-400 text-xl sm:text-2xl font-bold">%</span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-1">of Saudi GDP</p>
          </motion.button>
          
          {/* Global Deaths */}
          <motion.button
            onClick={() => setSelectedSource("globalDeaths")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="text-center border-l border-white/10 pl-4 sm:pl-8 cursor-pointer hover:bg-white/5 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="flex items-baseline justify-center gap-1">
              <NumberCounter 
                value={2.9} 
                duration={1.5} 
                delay={3.9}
                decimals={1}
                className="text-2xl sm:text-4xl font-bold text-purple-400"
              />
              <span className="text-purple-400 text-xl sm:text-2xl font-bold">M</span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-1">Global Deaths/Year</p>
          </motion.button>
        </motion.div>

        {/* Quote / Context */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 0.8 }}
          className="mt-6 max-w-xl text-center"
        >
          <p className="text-xs sm:text-sm text-white/70 italic leading-relaxed">
            "Saudi Arabia's economic growth is silently taxed by preventable workplace incidents.
            <span className="text-red-400 font-medium"> 78% of these costs remain invisible</span>—hidden in lost productivity, 
            unreported illnesses, and diminished workforce potential."
          </p>
          <p className="text-[10px] sm:text-xs text-white/40 mt-2">— ILO Global Estimates, World Bank, GOSI Annual Reports</p>
        </motion.div>
      </div>

      {/* Source Detail Modal */}
      <AnimatePresence>
        {activeSource && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSource(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-lg max-h-[80vh] overflow-y-auto bg-slate-900/95 border border-cyan-500/30 rounded-xl p-6 shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedSource(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{activeSource.title}</h3>
                <p className="text-sm text-white/60 mt-1">{activeSource.calculation}</p>
              </div>

              {/* Methodology */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">Methodology</h4>
                <ul className="space-y-1">
                  {activeSource.methodology.map((item, i) => (
                    <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sources with Links */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">Sources</h4>
                <div className="space-y-2">
                  {activeSource.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                      <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-white/80 group-hover:text-white">{source.name}</span>
                      <ArrowRight className="w-3 h-3 text-white/40 group-hover:text-emerald-400 ml-auto" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-white/40 mt-4 pt-4 border-t border-white/10">
                Note: Figures are estimates based on ILO methodology and may vary based on data availability. 
                Saudi-specific data from GOSI and national statistics where available.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SLIDE 4: THE SOLUTION - ADL Framework Temple with Animated Data Sources
// ============================================================================

// Data sources that feed into the framework
interface DataPoint {
  label: string;
  target: 'governance' | 'pillar1' | 'pillar2' | 'pillar3';
}

interface FrameworkDataSource {
  id: string;
  name: string;
  shortName: string;
  accentColor: string; // Color for small indicator only
  feedsInto: ('governance' | 'pillar1' | 'pillar2' | 'pillar3')[];
  description: string;
  dataPoints: DataPoint[]; // Specific metrics that fly into pillars
  url: string;
}

const frameworkDataSources: FrameworkDataSource[] = [
  {
    id: "ilo",
    name: "International Labour Organization (ILOSTAT)",
    shortName: "ILO",
    accentColor: "blue",
    feedsInto: ["governance", "pillar1"],
    description: "Official global labor statistics including fatal and non-fatal occupational injury rates, inspector density, and social security coverage.",
    dataPoints: [
      { label: "C187 Status", target: "governance" },
      { label: "C155 Status", target: "governance" },
      { label: "Inspector Density", target: "governance" },
      { label: "Fatal Accident Rate", target: "pillar1" },
    ],
    url: "https://ilostat.ilo.org/data/"
  },
  {
    id: "who",
    name: "World Health Organization (GHO)",
    shortName: "WHO",
    accentColor: "cyan",
    feedsInto: ["pillar2"],
    description: "Global Health Observatory data including UHC Service Coverage Index, health workforce density, and mortality metrics.",
    dataPoints: [
      { label: "UHC Coverage", target: "pillar2" },
      { label: "Health Workers", target: "pillar2" },
    ],
    url: "https://www.who.int/data/gho"
  },
  {
    id: "worldbank",
    name: "World Bank Open Data (WDI)",
    shortName: "World Bank",
    accentColor: "amber",
    feedsInto: ["governance", "pillar3"],
    description: "World Development Indicators including governance effectiveness, regulatory quality, health expenditure, and labor market statistics.",
    dataPoints: [
      { label: "Gov Effectiveness", target: "governance" },
      { label: "Regulatory Quality", target: "governance" },
      { label: "Health Expenditure", target: "pillar3" },
      { label: "Social Protection", target: "pillar3" },
    ],
    url: "https://data.worldbank.org/"
  },
  {
    id: "ti",
    name: "Transparency International (CPI)",
    shortName: "CPI",
    accentColor: "rose",
    feedsInto: ["governance"],
    description: "Corruption Perception Index measuring perceived levels of public sector corruption. Critical for assessing inspector integrity.",
    dataPoints: [
      { label: "CPI Score", target: "governance" },
      { label: "Inspector Integrity", target: "governance" },
    ],
    url: "https://www.transparency.org/cpi"
  },
  {
    id: "undp",
    name: "UNDP Human Development Report",
    shortName: "HDI",
    accentColor: "emerald",
    feedsInto: ["pillar3"],
    description: "Human Development Index combining life expectancy, education, and income indicators for rehabilitation capacity.",
    dataPoints: [
      { label: "HDI Score", target: "pillar3" },
      { label: "Rehab Capacity", target: "pillar3" },
    ],
    url: "https://hdr.undp.org/data-center"
  },
  {
    id: "ihme",
    name: "IHME Global Burden of Disease",
    shortName: "IHME GBD",
    accentColor: "orange",
    feedsInto: ["pillar1", "pillar2"],
    description: "Comprehensive disease burden data including DALYs from occupational carcinogens, noise, ergonomic factors, and injuries.",
    dataPoints: [
      { label: "Carcinogen Exposure", target: "pillar1" },
      { label: "Occupational DALYs", target: "pillar1" },
      { label: "Disease Detection", target: "pillar2" },
    ],
    url: "https://www.healthdata.org/gbd"
  },
  {
    id: "wjp",
    name: "World Justice Project",
    shortName: "WJP",
    accentColor: "indigo",
    feedsInto: ["governance"],
    description: "Rule of law measurements including regulatory enforcement capacity and civil justice effectiveness.",
    dataPoints: [
      { label: "Rule of Law", target: "governance" },
      { label: "Enforcement", target: "governance" },
    ],
    url: "https://worldjusticeproject.org/"
  },
  {
    id: "epi",
    name: "Yale Environmental Performance Index",
    shortName: "EPI",
    accentColor: "teal",
    feedsInto: ["pillar1"],
    description: "Environmental performance rankings including air quality, heavy metals exposure, and environmental health scores.",
    dataPoints: [
      { label: "Air Quality", target: "pillar1" },
      { label: "Env Health", target: "pillar1" },
    ],
    url: "https://epi.yale.edu/"
  },
];

// Framework temple blocks
interface FrameworkBlock {
  id: 'governance' | 'pillar1' | 'pillar2' | 'pillar3';
  title: string;
  subtitle: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: React.ElementType;
  description: string;
  keyMetrics: string[];
  dataSources: string[];
}

const frameworkBlocks: FrameworkBlock[] = [
  {
    id: "governance",
    title: "Governance Ecosystem",
    subtitle: "The Overarching Driver",
    color: "purple",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/40",
    glowColor: "shadow-purple-500/40",
    icon: Crown,
    description: "The brain and law that drives the entire occupational health system. Establishes regulatory frameworks, enforcement mechanisms, and institutional capacity.",
    keyMetrics: ["ILO C187 Ratification", "Inspector Coverage Ratio", "Enforcement Actions/Year"],
    dataSources: ["ILO", "World Bank", "CPI", "WJP"]
  },
  {
    id: "pillar1",
    title: "Hazard Prevention",
    subtitle: "Pillar I — Prevention",
    color: "blue",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/40",
    glowColor: "shadow-blue-500/40",
    icon: Shield,
    description: "The proactive shield against workplace dangers. Focuses on identifying, assessing, and eliminating hazards before they cause harm.",
    keyMetrics: ["Fatal Accident Rate", "OEL Compliance", "Safety Training Hours"],
    dataSources: ["ILO", "IHME GBD", "EPI"]
  },
  {
    id: "pillar2",
    title: "Surveillance & Detection",
    subtitle: "Pillar II — Vigilance",
    color: "emerald",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/40",
    glowColor: "shadow-emerald-500/40",
    icon: Eye,
    description: "The early warning system for occupational health. Continuous monitoring to detect emerging threats and patterns before they become epidemics.",
    keyMetrics: ["Disease Detection Rate", "Screening Coverage", "Biomarker Monitoring"],
    dataSources: ["WHO", "IHME GBD"]
  },
  {
    id: "pillar3",
    title: "Restoration & Compensation",
    subtitle: "Pillar III — Restoration",
    color: "amber",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/40",
    glowColor: "shadow-amber-500/40",
    icon: Heart,
    description: "The safety net that catches workers when prevention and surveillance fail. Ensures swift, fair compensation and rehabilitation support.",
    keyMetrics: ["Coverage Rate", "Claim Settlement Time", "RTW Success Rate"],
    dataSources: ["World Bank", "HDI"]
  },
];

function UnifiedFrameworkVisual() {
  const [selectedBlock, setSelectedBlock] = useState<FrameworkBlock | null>(null);
  const [selectedSource, setSelectedSource] = useState<FrameworkDataSource | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'framework' | 'cycling'>('framework');
  const [spotlightIndex, setSpotlightIndex] = useState(-1); // -1 means no spotlight active
  const [isPaused, setIsPaused] = useState(false); // Pause cycling when modal is open

  // Pause/resume cycling when modal opens/closes
  useEffect(() => {
    setIsPaused(selectedSource !== null || selectedBlock !== null);
  }, [selectedSource, selectedBlock]);

  // Animation: Framework builds, then continuously cycle through sources one at a time
  useEffect(() => {
    const FRAMEWORK_BUILD_TIME = 2000;
    
    // Start cycling phase after framework builds
    const startCycling = setTimeout(() => {
      setAnimationPhase('cycling');
      setSpotlightIndex(0);
    }, FRAMEWORK_BUILD_TIME);

    return () => {
      clearTimeout(startCycling);
    };
  }, []);

  // Continuous cycling through sources - extended duration for data point animations
  useEffect(() => {
    if (animationPhase !== 'cycling' || isPaused) return;
    
    // Longer cycle: source appears (0.4s) + data points spawn & fly (2.5s) + linger (0.8s) + fade (0.3s)
    const SPOTLIGHT_DURATION = 4000;
    const TOTAL_SOURCES = frameworkDataSources.length;
    
    const cycleTimer = setInterval(() => {
      setSpotlightIndex(current => (current + 1) % TOTAL_SOURCES);
    }, SPOTLIGHT_DURATION);

    return () => clearInterval(cycleTimer);
  }, [animationPhase, isPaused]);

  // Helper to get color values for glow effects
  const getColorRgba = (color: string, alpha: number) => {
    const colors: Record<string, string> = {
      blue: `rgba(59,130,246,${alpha})`,
      purple: `rgba(168,85,247,${alpha})`,
      amber: `rgba(245,158,11,${alpha})`,
      rose: `rgba(244,63,94,${alpha})`,
      emerald: `rgba(16,185,129,${alpha})`,
      orange: `rgba(249,115,22,${alpha})`,
      indigo: `rgba(99,102,241,${alpha})`,
      teal: `rgba(20,184,166,${alpha})`,
      cyan: `rgba(6,182,212,${alpha})`,
    };
    return colors[color] || `rgba(6,182,212,${alpha})`;
  };

  // Get position for data source badge (arranged in tighter arc above framework)
  const getSourcePosition = (index: number, total: number) => {
    const startAngle = -150;
    const endAngle = -30;
    const angle = startAngle + (index / (total - 1)) * (endAngle - startAngle);
    const radians = (angle * Math.PI) / 180;
    const radius = 32;
    return {
      x: 50 + radius * Math.cos(radians),
      y: 28 + radius * Math.sin(radians) * 0.4,
    };
  };

  // Get position for framework blocks (centered in viewport)
  const getBlockPosition = (blockId: string) => {
    const positions: Record<string, { x: number; y: number }> = {
      governance: { x: 50, y: 52 },
      pillar1: { x: 25, y: 72 },
      pillar2: { x: 50, y: 72 },
      pillar3: { x: 75, y: 72 },
    };
    return positions[blockId] || { x: 50, y: 50 };
  };

  // Calculate SVG path between source and target with smooth curves
  const calculateFlowPath = (sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }) => {
    const controlY = sourcePos.y + (targetPos.y - sourcePos.y) * 0.4;
    return `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x} ${controlY} ${targetPos.x} ${controlY} ${targetPos.x} ${targetPos.y}`;
  };

  // Check if a source should be visible (only the current spotlighted source)
  const isSourceVisible = (sourceIndex: number) => {
    if (animationPhase === 'cycling') return sourceIndex === spotlightIndex;
    return false;
  };

  // Check if a source's flow should be animating (only the current spotlighted source)
  const isFlowActive = (sourceIndex: number) => {
    if (animationPhase === 'cycling') return sourceIndex === spotlightIndex;
    return false;
  };

  // Check if a framework block is receiving data from the current spotlight source
  const isBlockReceiving = (blockId: string) => {
    if (animationPhase !== 'cycling' || spotlightIndex < 0) return false;
    const currentSource = frameworkDataSources[spotlightIndex];
    return currentSource?.feedsInto.includes(blockId as 'governance' | 'pillar1' | 'pillar2' | 'pillar3');
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900">
      {/* Particle effects */}
      <ParticleField count={50} color="purple" speed="slow" />
      
      {/* Ambient glow orbs */}
      <FloatingGlowOrb color="purple" size="lg" position="top-left" delay={0} />
      <FloatingGlowOrb color="blue" size="md" position="bottom-right" delay={0.3} />
      <FloatingGlowOrb color="amber" size="sm" position="bottom-left" delay={0.6} />

      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="text-center pt-2 pb-1 px-4 flex-shrink-0"
      >
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-0.5">
          THE SOLUTION: <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">THE ADL FRAMEWORK</span>
        </h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 text-xs sm:text-sm"
        >
          Global Data Sources Powering Integrated Intelligence
        </motion.p>
      </motion.div>

      {/* Main Visualization Area - CENTERED */}
      <div className="flex-1 relative min-h-0 flex items-center justify-center">

        {/* Data Source Badges - Neutral styling with accent indicators */}
        <div className="absolute inset-0">
          {frameworkDataSources.map((source, index) => {
            const pos = getSourcePosition(index, frameworkDataSources.length);
            const isVisible = isSourceVisible(index);
            const isSpotlit = animationPhase === 'cycling' && spotlightIndex === index;
            
            return (
              <motion.button
                key={source.id}
                initial={{ opacity: 0, scale: 0.5, y: -15 }}
                animate={isVisible ? { 
                  opacity: 1, 
                  scale: 1, 
                  y: 0 
                } : { 
                  opacity: 0, 
                  scale: 0.6, 
                  y: -10 
                }}
                transition={{ 
                  duration: 0.4, 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 22 
                }}
                whileHover={isVisible ? { scale: 1.08, zIndex: 50 } : {}}
                whileTap={isVisible ? { scale: 0.98 } : {}}
                onClick={() => isVisible && setSelectedSource(source)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 ${isVisible ? 'cursor-pointer' : 'cursor-default pointer-events-none'}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                {/* Neutral source badge with small accent dot */}
                <motion.div
                  className="relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-slate-800/90 border border-slate-600/60 backdrop-blur-md shadow-lg"
                >
                  {/* Small colored accent dot */}
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getColorRgba(source.accentColor, 1) }}
                  />
                  <span className="font-semibold text-sm sm:text-base text-white/90 whitespace-nowrap">
                    {source.shortName}
                  </span>
                </motion.div>
                
                {/* Source full name label */}
                <AnimatePresence>
                  {isSpotlit && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, delay: 0.1 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap"
                    >
                      <span className="text-[10px] sm:text-xs text-white/70 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/50">
                        {source.name.split('(')[0].trim()}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
        
        {/* Data Point Chips - Flying from source to framework pillars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {frameworkDataSources.map((source, sourceIndex) => {
            const sourcePos = getSourcePosition(sourceIndex, frameworkDataSources.length);
            const isActive = isFlowActive(sourceIndex);
            
            // Get pillar color for styling
            const getPillarColor = (targetId: string) => {
              const pillarColors: Record<string, string> = {
                governance: 'purple',
                pillar1: 'blue',
                pillar2: 'emerald',
                pillar3: 'amber'
              };
              return pillarColors[targetId] || 'cyan';
            };
            
            // Get target position adjusted for the framework layout
            const getTargetDisplayPos = (targetId: string) => {
              // These match the visual positions of the framework blocks on screen
              const positions: Record<string, { x: number; y: number }> = {
                governance: { x: 50, y: 45 },  // Center top - governance block
                pillar1: { x: 30, y: 68 },     // Left - Hazard Prevention
                pillar2: { x: 50, y: 68 },     // Center - Surveillance
                pillar3: { x: 70, y: 68 },     // Right - Restoration
              };
              return positions[targetId] || { x: 50, y: 50 };
            };
            
            return source.dataPoints.map((dataPoint, dpIndex) => {
              const targetPos = getTargetDisplayPos(dataPoint.target);
              const pillarColor = getPillarColor(dataPoint.target);
              const chipDelay = 0.4 + dpIndex * 0.3;
              
              return (
                <AnimatePresence key={`${source.id}-${dataPoint.label}`}>
                  {isActive && (
                    <motion.div
                      initial={{ 
                        left: `${sourcePos.x}%`,
                        top: `${sourcePos.y}%`,
                        opacity: 0, 
                        scale: 0.5,
                        x: '-50%',
                        y: '-50%'
                      }}
                      animate={{ 
                        left: [`${sourcePos.x}%`, `${sourcePos.x}%`, `${targetPos.x}%`],
                        top: [`${sourcePos.y}%`, `${sourcePos.y + 5}%`, `${targetPos.y}%`],
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0.5, 1, 1, 0.9, 0.6],
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ 
                        duration: 2,
                        delay: chipDelay,
                        ease: [0.4, 0, 0.2, 1],
                        times: [0, 0.15, 0.8, 0.95, 1]
                      }}
                      className="absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-500/70 shadow-2xl z-30"
                      style={{
                        boxShadow: `0 0 20px 4px ${getColorRgba(pillarColor, 0.4)}`
                      }}
                    >
                      {/* Pillar color indicator dot */}
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ 
                          backgroundColor: getColorRgba(pillarColor, 1),
                          boxShadow: `0 0 8px 2px ${getColorRgba(pillarColor, 0.7)}`
                        }}
                      />
                      <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                        {dataPoint.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            });
          })}
        </div>

        {/* Framework Temple Structure - CENTERED */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-16 sm:pt-20">
          {/* Governance - Roof with dramatic entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            className="w-full max-w-md px-4 mb-3"
          >
            <motion.button
              onClick={() => setSelectedBlock(frameworkBlocks[0])}
              whileHover={{ scale: 1.03, y: -4, boxShadow: `0 0 30px 8px ${getColorRgba('purple', 0.4)}` }}
              whileTap={{ scale: 0.97 }}
              className={`w-full relative p-3 sm:p-4 rounded-2xl ${frameworkBlocks[0].bgColor} ${frameworkBlocks[0].borderColor} border-2 backdrop-blur-md cursor-pointer transition-all`}
              style={{ perspective: '1000px' }}
            >
              {/* Glow effect - ONLY when receiving data */}
              <AnimatePresence>
                {isBlockReceiving('governance') && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      boxShadow: [
                        `0 0 25px 6px ${getColorRgba('purple', 0.5)}`,
                        `0 0 45px 12px ${getColorRgba('purple', 0.7)}`,
                        `0 0 25px 6px ${getColorRgba('purple', 0.5)}`,
                      ],
                      scale: [1, 1.02, 1],
                    }}
                    exit={{ opacity: 0, scale: 1 }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                )}
              </AnimatePresence>
              
              {/* Roof decorative top beam */}
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent rounded-full" 
              />
              
              <div className="flex items-center justify-center gap-3 relative z-10">
                <div className="p-2.5 rounded-xl bg-purple-500/40 backdrop-blur-sm border border-purple-400/30">
                  <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-purple-300" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm sm:text-lg font-bold text-purple-200">{frameworkBlocks[0].title}</h3>
                  <p className="text-[10px] sm:text-xs text-purple-300/70">{frameworkBlocks[0].subtitle}</p>
                </div>
              </div>
              
              {/* Animated connecting lines to pillars */}
              {[0.25, 0.5, 0.75].map((pos, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: 1.0 + i * 0.1, duration: 0.3 }}
                  className="absolute -bottom-5 w-0.5 h-5 bg-gradient-to-b from-purple-400/70 to-purple-400/10 origin-top"
                  style={{ left: `${pos * 100}%`, transform: `translateX(-50%)` }}
                />
              ))}
            </motion.button>
          </motion.div>

          {/* Pillars Row - Rise from bottom */}
          <div className="w-full max-w-xl px-3 sm:px-4 grid grid-cols-3 gap-3 sm:gap-4">
            {frameworkBlocks.slice(1).map((block, index) => {
              const Icon = block.icon;
              const pillarDelay = 0.6 + index * 0.2;
              return (
                <motion.button
                  key={block.id}
                  initial={{ opacity: 0, y: 60, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: pillarDelay, duration: 0.6, type: "spring", stiffness: 120, damping: 15 }}
                  whileHover={{ scale: 1.05, y: -5, boxShadow: `0 0 25px 6px ${getColorRgba(block.color, 0.4)}` }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedBlock(block)}
                  className={`relative p-3 sm:p-4 rounded-2xl ${block.bgColor} ${block.borderColor} border-2 backdrop-blur-md cursor-pointer transition-all`}
                >
                  {/* Glow effect - ONLY when receiving data */}
                  <AnimatePresence>
                    {isBlockReceiving(block.id) && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1,
                          boxShadow: [
                            `0 0 25px 6px ${getColorRgba(block.color, 0.5)}`,
                            `0 0 45px 12px ${getColorRgba(block.color, 0.7)}`,
                            `0 0 25px 6px ${getColorRgba(block.color, 0.5)}`,
                          ],
                          scale: [1, 1.03, 1],
                        }}
                        exit={{ opacity: 0, scale: 1 }}
                        transition={{ duration: 0.4, repeat: Infinity }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Pillar top decoration with draw-in */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: pillarDelay + 0.3, duration: 0.4 }}
                    className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3/4 h-1.5 rounded-full ${
                      block.color === "blue" ? "bg-blue-400/60" :
                      block.color === "emerald" ? "bg-emerald-400/60" :
                      "bg-amber-400/60"
                    }`} 
                  />
                  
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${block.bgColor} border ${block.borderColor}`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${block.textColor}`} />
                    </div>
                    <div className="text-center">
                      <h3 className={`text-[11px] sm:text-sm font-bold ${block.textColor} leading-tight`}>
                        {block.title}
                      </h3>
                      <p className="text-[8px] sm:text-[10px] text-white/50 mt-0.5">
                        {block.subtitle}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Legend with pillar color mapping */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3"
        >
          <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-2 border border-slate-700/50">
            <p className="text-[8px] sm:text-[10px] text-white/50 mb-1.5">Data flows to:</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[8px] sm:text-[10px] text-white/70">Governance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[8px] sm:text-[10px] text-white/70">Hazard Prevention</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[8px] sm:text-[10px] text-white/70">Surveillance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[8px] sm:text-[10px] text-white/70">Restoration</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Current source indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-right"
        >
          {animationPhase === 'cycling' && spotlightIndex >= 0 && (
            <motion.div
              key={spotlightIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-1"
            >
              <span className="text-[9px] sm:text-xs text-white/70 bg-slate-900/80 px-2 py-1 rounded border border-slate-700/50">
                {frameworkDataSources[spotlightIndex]?.shortName}: {frameworkDataSources[spotlightIndex]?.dataPoints.length} metrics
              </span>
            </motion.div>
          )}
          <p className="text-[8px] sm:text-[10px] text-white/40">Click any element for details</p>
        </motion.div>
      </div>

      {/* Data Source Detail Modal - PREMIUM ANIMATION */}
      <AnimatePresence>
        {selectedSource && (
          <>
            {/* Backdrop with blur animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedSource(null)}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ backdropFilter: 'blur(0px)' }}
                animate={{ backdropFilter: 'blur(12px)' }}
                exit={{ backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
            
            {/* Modal with 3D entrance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 60, rotateX: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40, rotateX: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ perspective: '1200px' }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-lg max-h-[75vh] overflow-hidden rounded-3xl shadow-2xl"
            >
              {/* Subtle border glow */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                animate={{
                  boxShadow: [
                    `0 0 15px 3px ${getColorRgba(selectedSource.accentColor, 0.2)}`,
                    `0 0 25px 6px ${getColorRgba(selectedSource.accentColor, 0.3)}`,
                    `0 0 15px 3px ${getColorRgba(selectedSource.accentColor, 0.2)}`,
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 border border-slate-700/50 rounded-3xl overflow-hidden">
                {/* Modal Header - Neutral with accent */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-5 bg-slate-800/50 border-b border-slate-700/50"
                >
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedSource(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/80" />
                  </motion.button>
                  
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
                    className="flex items-center gap-4"
                  >
                    <div className="p-3 rounded-2xl bg-slate-700/50 border border-slate-600/50">
                      <div 
                        className="w-2 h-2 rounded-full mb-2 mx-auto"
                        style={{ backgroundColor: getColorRgba(selectedSource.accentColor, 1) }}
                      />
                      <Database className="w-7 h-7 text-white/80" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        {selectedSource.shortName}
                      </h3>
                      <p className="text-white/60 text-sm">{selectedSource.name}</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Modal Content with staggered sections */}
                <div className="p-5 space-y-5 overflow-y-auto max-h-[50vh]">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <p className="text-white/80 text-sm leading-relaxed">{selectedSource.description}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <h4 className="text-white/90 text-sm font-semibold mb-3">Data Points Provided</h4>
                    <div className="space-y-2">
                      {selectedSource.dataPoints.map((dp, i) => {
                        const targetBlock = frameworkBlocks.find(b => b.id === dp.target);
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.05 }}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                          >
                            <span className="text-sm text-white/80">{dp.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${targetBlock?.bgColor || 'bg-slate-700'} ${targetBlock?.textColor || 'text-white/70'}`}>
                              → {targetBlock?.title.split(' ')[0] || dp.target}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <h4 className="text-white/90 text-sm font-semibold mb-3">Feeds Into Framework</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSource.feedsInto.map((targetId, i) => {
                        const targetBlock = frameworkBlocks.find(b => b.id === targetId);
                        if (!targetBlock) return null;
                        return (
                          <motion.span
                            key={targetId}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45 + i * 0.05 }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium ${targetBlock.bgColor} ${targetBlock.textColor} ${targetBlock.borderColor} border`}
                          >
                            {targetBlock.title}
                          </motion.span>
                        );
                      })}
                    </div>
                  </motion.div>

                  <motion.a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all"
                  >
                    <ExternalLink className="w-5 h-5 text-white/70" />
                    <span className="text-sm font-medium text-white/80">Visit Official Source</span>
                    <ArrowRight className="w-5 h-5 text-white/70 ml-auto" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Framework Block Detail Modal - PREMIUM ANIMATION */}
      <AnimatePresence>
        {selectedBlock && (
          <>
            {/* Backdrop with blur animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedBlock(null)}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ backdropFilter: 'blur(0px)' }}
                animate={{ backdropFilter: 'blur(12px)' }}
                exit={{ backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
            
            {/* Modal with 3D entrance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 60, rotateX: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40, rotateX: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ perspective: '1200px' }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-lg max-h-[75vh] overflow-hidden rounded-3xl shadow-2xl"
            >
              {/* Animated border glow */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                animate={{
                  boxShadow: [
                    `0 0 20px 5px ${getColorRgba(selectedBlock.color, 0.3)}`,
                    `0 0 40px 10px ${getColorRgba(selectedBlock.color, 0.5)}`,
                    `0 0 20px 5px ${getColorRgba(selectedBlock.color, 0.3)}`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="relative bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 border border-white/10 rounded-3xl overflow-hidden">
                {/* Modal Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-5 ${selectedBlock.bgColor} border-b border-white/10`}
                >
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedBlock(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/80" />
                  </motion.button>
                  
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
                    className="flex items-center gap-4"
                  >
                    <motion.div 
                      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className={`p-3 rounded-2xl ${selectedBlock.bgColor} ${selectedBlock.borderColor} border-2`}
                    >
                      <selectedBlock.icon className={`w-7 h-7 ${selectedBlock.textColor}`} />
                    </motion.div>
                    <div>
                      <h3 className={`text-lg sm:text-xl font-bold ${selectedBlock.textColor}`}>
                        {selectedBlock.title}
                      </h3>
                      <p className="text-white/60 text-sm">{selectedBlock.subtitle}</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Modal Content with staggered sections */}
                <div className="p-5 space-y-5 overflow-y-auto max-h-[50vh]">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <p className="text-white/80 text-sm leading-relaxed">{selectedBlock.description}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <h4 className="text-white/90 text-sm font-semibold mb-3">Key Metrics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBlock.keyMetrics.map((metric, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.35 + i * 0.05 }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${selectedBlock.bgColor} ${selectedBlock.textColor} ${selectedBlock.borderColor} border`}
                        >
                          {metric}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <h4 className="text-white/90 text-sm font-semibold mb-3">Data Sources</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedBlock.dataSources.map((sourceName, i) => {
                        const source = frameworkDataSources.find(s => s.shortName === sourceName);
                        if (!source) return null;
                        return (
                          <motion.button
                            key={source.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 + i * 0.08 }}
                            whileHover={{ scale: 1.03, x: 3 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setSelectedBlock(null);
                              setTimeout(() => setSelectedSource(source), 250);
                            }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${source.bgColor} ${source.borderColor} border-2 hover:bg-white/10 transition-all`}
                          >
                            <Database className={`w-4 h-4 ${source.textColor}`} />
                            <span className={`text-xs font-medium ${source.textColor}`}>{source.shortName}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SLIDE 5: THE CONTROL TOWER - Mission Control Interface
// ============================================================================

function ControlTowerVisual({ onInsightClick }: SovereignVisualProps) {
  const dataPoints = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 15 + Math.random() * 70,
    risk: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
  }));

  return (
    <div className="relative w-full h-full flex flex-col p-4 sm:p-6 overflow-hidden">
      <ParticleField count={25} color="purple" speed="slow" />
      
      {/* Header */}
      <HeroReveal delay={0} direction="down">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 mb-2">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-purple-400 text-xs font-medium">MISSION CONTROL ACTIVE</span>
          </div>
        </div>
      </HeroReveal>

      {/* Main dashboard area */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
        {/* Saudi Arabia Map with data points */}
        <HeroReveal delay={0.2} direction="left" className="col-span-2">
          <div className="h-full rounded-xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-sm p-3 relative overflow-hidden">
            {/* Glassmorphism effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
            
            {/* Map placeholder with grid */}
            <div className="relative h-full">
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-px opacity-20">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-purple-500/30" />
                ))}
              </div>
              
              {/* Data points */}
              {dataPoints.map((point, i) => (
                <motion.div
                  key={point.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="absolute"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      point.risk === "high" && "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
                      point.risk === "medium" && "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]",
                      point.risk === "low" && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                    )}
                  />
                </motion.div>
              ))}
              
              {/* KSA Label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <span className="text-purple-400/40 text-3xl font-bold">KSA</span>
              </motion.div>
            </div>
          </div>
        </HeroReveal>
        
        {/* Control panels */}
        <div className="flex flex-col gap-3">
          {/* Toggle switch */}
          <HeroReveal delay={0.4} direction="right">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => onInsightClick?.("inspection-toggle")}
              className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-sm"
            >
              <p className="text-white/60 text-[10px] mb-2">INSPECTION MODE</p>
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-[9px] line-through opacity-50">Random</span>
                <motion.div
                  className="flex-1 h-6 rounded-full bg-gradient-to-r from-red-500/20 to-emerald-500/20 p-1"
                >
                  <motion.div
                    animate={{ x: [0, 32, 32] }}
                    transition={{ duration: 1.5, delay: 1 }}
                    className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                  />
                </motion.div>
                <span className="text-emerald-400 text-[9px] font-semibold">AI-Targeted</span>
              </div>
            </motion.button>
          </HeroReveal>
          
          {/* Stats */}
          <HeroReveal delay={0.6} direction="right">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-sm">
              <p className="text-white/60 text-[10px] mb-2">FATALITY REDUCTION</p>
              <div className="flex items-end gap-1">
                <NumberCounter end={47} duration={2} className="text-3xl font-bold text-purple-400" />
                <span className="text-purple-400 text-lg mb-1">%</span>
              </div>
              <p className="text-white/40 text-[9px]">vs baseline</p>
            </div>
          </HeroReveal>
          
          {/* Benchmark */}
          <HeroReveal delay={0.8} direction="right">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🇩🇪</span>
                <div>
                  <p className="text-white text-xs font-semibold">DGUV Model</p>
                  <p className="text-purple-400/60 text-[9px]">German Benchmark</p>
                </div>
              </div>
              <div className="h-1 rounded-full bg-purple-500/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ delay: 1.2, duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                />
              </div>
            </div>
          </HeroReveal>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 6: THE HIERARCHY - Inverted Pyramid with ROI Funnel
// ============================================================================

function HierarchyPyramidVisual({ onInsightClick }: SovereignVisualProps) {
  const levels = [
    { id: "elimination", label: "Elimination", desc: "Remove the hazard entirely", intensity: 1 },
    { id: "substitution", label: "Substitution", desc: "Replace with safer alternative", intensity: 0.85 },
    { id: "engineering", label: "Engineering", desc: "Isolate people from hazard", intensity: 0.7 },
    { id: "administrative", label: "Administrative", desc: "Change the way people work", intensity: 0.5 },
    { id: "ppe", label: "PPE", desc: "Protect the worker (last resort)", intensity: 0.3 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
      <ParticleField count={30} color="blue" speed="slow" />
      
      <div className="relative z-10 flex items-center gap-8 w-full max-w-3xl">
        {/* Inverted Pyramid */}
        <div className="flex-1 flex flex-col items-center">
          <HeroReveal delay={0} direction="down">
            <p className="text-blue-400 text-xs font-medium tracking-wider mb-4">HIERARCHY OF CONTROLS</p>
          </HeroReveal>
          
          <div className="relative w-full max-w-xs">
            {levels.map((level, i) => {
              const width = 100 - i * 15;
              return (
                <HeroReveal key={level.id} delay={0.2 + i * 0.15} direction="down">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => onInsightClick?.(level.id)}
                    className="relative w-full mb-1"
                    style={{ paddingLeft: `${(100 - width) / 2}%`, paddingRight: `${(100 - width) / 2}%` }}
                  >
                    <motion.div
                      animate={{ 
                        opacity: [level.intensity, level.intensity + 0.1, level.intensity],
                        boxShadow: i === 0 ? [
                          "0 0 20px rgba(59,130,246,0.3)",
                          "0 0 40px rgba(59,130,246,0.5)",
                          "0 0 20px rgba(59,130,246,0.3)",
                        ] : undefined
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={cn(
                        "py-2 px-3 rounded-lg border backdrop-blur-sm transition-all",
                        i === 0 
                          ? "bg-blue-500/30 border-blue-400 text-white" 
                          : i === levels.length - 1
                            ? "bg-slate-800/50 border-slate-600/50 text-white/50"
                            : "bg-blue-500/10 border-blue-500/30 text-white/80"
                      )}
                    >
                      <p className="font-semibold text-xs">{level.label}</p>
                      <p className="text-[9px] opacity-60">{level.desc}</p>
                    </motion.div>
                  </motion.button>
                </HeroReveal>
              );
            })}
          </div>
        </div>
        
        {/* ROI Funnel */}
        <HeroReveal delay={1} direction="right">
          <div className="flex flex-col items-center">
            <p className="text-emerald-400 text-xs font-medium tracking-wider mb-4">ROI MULTIPLIER</p>
            
            <div className="relative">
              {/* Input coin */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex items-center gap-2 mb-4"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                >
                  <DollarSign className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-amber-400 font-bold">$1</span>
              </motion.div>
              
              {/* Funnel */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="w-16 h-20 relative mx-auto"
                style={{ transformOrigin: "top" }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/30 to-emerald-500/30 rounded-t-xl border border-blue-500/30" 
                     style={{ clipPath: "polygon(10% 0%, 90% 0%, 70% 100%, 30% 100%)" }} />
              </motion.div>
              
              {/* Output coins */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="flex items-center justify-center gap-1 mt-2"
              >
                {[1, 2, 3, 4, 5, 6].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2 + i * 0.1 }}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  >
                    <DollarSign className="w-4 h-4 text-white" />
                  </motion.div>
                ))}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="text-emerald-400 font-bold text-lg mt-2 text-center"
              >
                $4-6
              </motion.p>
            </div>
          </div>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 7: THE DIGITAL TWIN - Holographic Body Scan
// ============================================================================

function DigitalTwinVisual({ onInsightClick }: SovereignVisualProps) {
  const bodyZones = [
    { id: "lungs", label: "Lungs", risk: "high", top: "35%", left: "50%", desc: "Respiratory hazards" },
    { id: "joints", label: "Joints", risk: "medium", top: "55%", left: "35%", desc: "Musculoskeletal stress" },
    { id: "hearing", label: "Hearing", risk: "medium", top: "15%", left: "60%", desc: "Noise exposure" },
    { id: "skin", label: "Skin", risk: "low", top: "45%", left: "65%", desc: "Chemical contact" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
      <ParticleField count={35} color="emerald" speed="slow" />
      
      <div className="relative z-10 flex items-center gap-8 w-full max-w-3xl">
        {/* Holographic Body */}
        <HeroReveal delay={0} direction="left">
          <div className="relative w-48 h-72 mx-auto">
            {/* Body silhouette with wireframe effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              {/* Hologram container */}
              <div className="relative w-full h-full">
                {/* Scan lines */}
                <motion.div
                  animate={{ y: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-emerald-400/50 to-transparent"
                />
                
                {/* Body outline */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Head */}
                    <motion.div
                      animate={{ boxShadow: ["0 0 20px rgba(16,185,129,0.3)", "0 0 40px rgba(16,185,129,0.5)", "0 0 20px rgba(16,185,129,0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-14 rounded-full border-2 border-emerald-400/50 mx-auto"
                    />
                    {/* Torso */}
                    <div className="w-20 h-28 border-2 border-emerald-400/40 rounded-t-xl mt-2 mx-auto relative">
                      {/* Lung heatmap */}
                      <motion.div
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute top-4 left-2 right-2 h-12 rounded bg-gradient-to-b from-red-500/40 to-amber-500/20"
                      />
                    </div>
                    {/* Legs */}
                    <div className="flex justify-center gap-2 mt-1">
                      <div className="w-6 h-24 border-2 border-emerald-400/30 rounded-b-lg" />
                      <div className="w-6 h-24 border-2 border-emerald-400/30 rounded-b-lg" />
                    </div>
                    {/* Arms */}
                    <div className="absolute top-16 -left-6 w-4 h-20 border-2 border-emerald-400/30 rounded-lg" />
                    <div className="absolute top-16 -right-6 w-4 h-20 border-2 border-emerald-400/30 rounded-lg" />
                  </div>
                </div>
                
                {/* Heatmap zones */}
                {bodyZones.map((zone, i) => (
                  <motion.button
                    key={zone.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.2 }}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => onInsightClick?.(zone.id)}
                    className="absolute"
                    style={{ top: zone.top, left: zone.left, transform: "translate(-50%, -50%)" }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        zone.risk === "high" && "bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.8)]",
                        zone.risk === "medium" && "bg-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.6)]",
                        zone.risk === "low" && "bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
                      )}
                    >
                      <span className="text-white text-[8px] font-bold">!</span>
                    </motion.div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </HeroReveal>
        
        {/* Diagnosis Timeline */}
        <HeroReveal delay={0.5} direction="right">
          <div className="flex-1 max-w-xs">
            <p className="text-emerald-400 text-xs font-medium tracking-wider mb-4">DIAGNOSIS ACCELERATION</p>
            
            {/* Timeline comparison */}
            <div className="space-y-4">
              {/* Before */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-red-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-400 text-xs font-medium">BEFORE</span>
                  <span className="text-red-400 text-lg font-bold">30 days</span>
                </div>
                <div className="h-2 rounded-full bg-red-500/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1, duration: 1.5 }}
                    className="h-full rounded-full bg-red-500"
                  />
                </div>
              </div>
              
              {/* Arrow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="flex justify-center"
              >
                <ArrowDown className="w-6 h-6 text-emerald-400" />
              </motion.div>
              
              {/* After */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-400 text-xs font-medium">REAL-TIME</span>
                  <span className="text-emerald-400 text-lg font-bold">&lt;7 days</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-500/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "23%" }}
                    transition={{ delay: 2.5, duration: 0.5 }}
                    className="h-full rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  />
                </div>
              </div>
              
              {/* Impact stat */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 }}
                className="text-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
              >
                <p className="text-emerald-400 text-2xl font-bold">60%</p>
                <p className="text-white/60 text-xs">Cost Reduction</p>
              </motion.div>
            </div>
          </div>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 8: THE FAST TRACK - Litigation vs No-Fault Flowcharts
// ============================================================================

function FastTrackVisual({ onInsightClick }: SovereignVisualProps) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-4">
      <ParticleField count={25} color="amber" speed="slow" />
      
      <div className="relative z-10 w-full max-w-2xl space-y-6">
        {/* Old Way - Litigation */}
        <HeroReveal delay={0} direction="left">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-semibold text-sm">OLD WAY: Litigation System</p>
                <p className="text-white/40 text-xs">Average resolution: 2+ years</p>
              </div>
            </div>
            
            {/* Tangled flowchart */}
            <div className="relative h-16 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 400 60">
                <motion.path
                  d="M 20,30 Q 60,10 80,30 T 120,30 Q 140,50 160,30 T 200,30 Q 220,10 240,30 T 280,30 Q 300,50 320,30 T 360,30 Q 380,10 400,30"
                  stroke="rgb(239,68,68)"
                  strokeWidth="3"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.3 }}
                />
                {/* Knot points */}
                {[80, 160, 240, 320].map((x, i) => (
                  <motion.circle
                    key={i}
                    cx={x}
                    cy={30}
                    r={6}
                    fill="rgb(239,68,68)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.2 }}
                  />
                ))}
              </svg>
              {/* Labels */}
              <div className="absolute inset-0 flex justify-between items-center px-6 text-[9px] text-red-400/60">
                <span>Incident</span>
                <span>Lawyer</span>
                <span>Discovery</span>
                <span>Trial</span>
                <span>Appeal</span>
              </div>
            </div>
          </div>
        </HeroReveal>
        
        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="flex justify-center"
        >
          <ArrowDown className="w-8 h-8 text-emerald-400" />
        </motion.div>
        
        {/* New Way - No-Fault */}
        <HeroReveal delay={0.5} direction="right">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-semibold text-sm">NEW WAY: No-Fault System</p>
                <p className="text-white/40 text-xs">Average processing: 45 days</p>
              </div>
            </div>
            
            {/* Straight laser line */}
            <div className="relative h-16 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 400 60">
                {/* Glow effect */}
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <motion.line
                  x1="20"
                  y1="30"
                  x2="380"
                  y2="30"
                  stroke="rgb(16,185,129)"
                  strokeWidth="4"
                  filter="url(#glow)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 2.5 }}
                />
                {/* Checkpoints */}
                {[20, 140, 260, 380].map((x, i) => (
                  <motion.circle
                    key={i}
                    cx={x}
                    cy={30}
                    r={8}
                    fill="rgb(16,185,129)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2.5 + i * 0.15 }}
                  />
                ))}
              </svg>
              {/* Labels */}
              <div className="absolute inset-0 flex justify-between items-center px-2 text-[9px] text-emerald-400/80 font-medium">
                <span>Incident</span>
                <span>Report</span>
                <span>Assess</span>
                <span>Payment</span>
              </div>
            </div>
          </div>
        </HeroReveal>
        
        {/* Key stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
          className="flex justify-center"
        >
          <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/30 backdrop-blur-sm">
            <p className="text-amber-400 text-3xl font-bold text-center">70%</p>
            <p className="text-white/60 text-xs text-center">Faster Claims Processing</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 9: THE ENGINE - Spinning Cube with Data Particles
// ============================================================================

function SpinningEngineVisual() {
  const quadrants = [
    { id: "governance", label: "GOV", color: "purple" },
    { id: "prevention", label: "PRV", color: "blue" },
    { id: "surveillance", label: "SRV", color: "emerald" },
    { id: "restoration", label: "RST", color: "amber" },
  ];

  // Data particles flying between quadrants
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    startQuadrant: i % 4,
    delay: i * 0.3,
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <ParticleField count={50} color="cyan" speed="fast" />
      
      <FloatingGlowOrb color="cyan" size="lg" position="top-right" delay={0} />
      <FloatingGlowOrb color="purple" size="md" position="bottom-left" delay={0.5} />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Spinning Cube */}
        <motion.div
          animate={{ rotateY: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="relative w-56 h-56 sm:w-72 sm:h-72"
          style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
          {/* Cube grid */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-2">
            {quadrants.map((quad, i) => (
              <motion.div
                key={quad.id}
                animate={{ 
                  boxShadow: [
                    `0 0 20px ${quad.color === "purple" ? "rgba(168,85,247,0.3)" : quad.color === "blue" ? "rgba(59,130,246,0.3)" : quad.color === "emerald" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                    `0 0 40px ${quad.color === "purple" ? "rgba(168,85,247,0.6)" : quad.color === "blue" ? "rgba(59,130,246,0.6)" : quad.color === "emerald" ? "rgba(16,185,129,0.6)" : "rgba(245,158,11,0.6)"}`,
                    `0 0 20px ${quad.color === "purple" ? "rgba(168,85,247,0.3)" : quad.color === "blue" ? "rgba(59,130,246,0.3)" : quad.color === "emerald" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                className={cn(
                  "rounded-xl backdrop-blur-md border flex items-center justify-center",
                  "bg-gradient-to-br",
                  quad.color === "purple" && "from-purple-500/30 to-purple-900/50 border-purple-500/50",
                  quad.color === "blue" && "from-blue-500/30 to-blue-900/50 border-blue-500/50",
                  quad.color === "emerald" && "from-emerald-500/30 to-emerald-900/50 border-emerald-500/50",
                  quad.color === "amber" && "from-amber-500/30 to-amber-900/50 border-amber-500/50",
                )}
              >
                <span className={cn(
                  "text-lg font-bold",
                  getColor(quad.color).text
                )}>{quad.label}</span>
              </motion.div>
            ))}
          </div>
          
          {/* Data particles flying between quadrants */}
          {particles.map((particle) => {
            const paths = [
              "M 25% 25% Q 50% 50% 75% 25%",
              "M 75% 25% Q 50% 50% 75% 75%",
              "M 75% 75% Q 50% 50% 25% 75%",
              "M 25% 75% Q 50% 50% 25% 25%",
            ];
            return (
              <motion.div
                key={particle.id}
                className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                initial={{ opacity: 0 }}
                animate={{
                  offsetPath: `path('${paths[particle.startQuadrant]}')`,
                  offsetDistance: ["0%", "100%"],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: "easeInOut",
                }}
              />
            );
          })}
          
          {/* Center hub */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.2, 1], rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="w-12 h-12 rounded-full bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)]">
              <RefreshCcw className="w-6 h-6 text-cyan-400" />
            </div>
          </motion.div>
        </motion.div>
        
        {/* Feedback loop labels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6 flex items-center gap-2 text-xs text-white/60"
        >
          <span className="text-amber-400">Incident</span>
          <ArrowRight className="w-4 h-4 text-cyan-400" />
          <span className="text-emerald-400">Surveillance</span>
          <ArrowRight className="w-4 h-4 text-cyan-400" />
          <span className="text-blue-400">Prevention</span>
          <ArrowRight className="w-4 h-4 text-cyan-400" />
          <span className="text-purple-400">Governance</span>
        </motion.div>
        
        {/* Key stat */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-4 px-6 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30"
        >
          <p className="text-cyan-400 text-sm font-semibold">40% Lower Fatality Rates in Integrated Systems</p>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 10: THE WORLD MAP - Pulsing Country Shields
// ============================================================================

function WorldMapVisual() {
  const countries = [
    { id: "germany", name: "Germany", flag: "🇩🇪", achievement: "75% Fatality Reduction", color: "blue", x: 52, y: 35 },
    { id: "singapore", name: "Singapore", flag: "🇸🇬", achievement: "Zero Fatality Goal", color: "emerald", x: 75, y: 55 },
    { id: "newzealand", name: "New Zealand", flag: "🇳🇿", achievement: "Universal No-Fault", color: "amber", x: 90, y: 75 },
    { id: "sweden", name: "Sweden", flag: "🇸🇪", achievement: "Vision Zero Pioneer", color: "cyan", x: 55, y: 25 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
      <ParticleField count={30} color="emerald" speed="slow" />
      
      <div className="relative z-10 w-full max-w-3xl">
        {/* World map container */}
        <div className="relative w-full aspect-[2/1] bg-slate-900/50 rounded-2xl border border-emerald-500/20 backdrop-blur-sm overflow-hidden">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <line key={`v-${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="currentColor" className="text-emerald-500" />
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <line key={`h-${i}`} x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="currentColor" className="text-emerald-500" />
              ))}
            </svg>
          </div>
          
          {/* Continents placeholder (simplified shapes) */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 50">
            {/* Europe */}
            <ellipse cx="50" cy="18" rx="8" ry="6" fill="currentColor" className="text-emerald-500" />
            {/* Asia */}
            <ellipse cx="70" cy="22" rx="15" ry="10" fill="currentColor" className="text-emerald-500" />
            {/* Australia/NZ */}
            <ellipse cx="82" cy="38" rx="6" ry="4" fill="currentColor" className="text-emerald-500" />
            {/* Americas */}
            <ellipse cx="25" cy="25" rx="10" ry="15" fill="currentColor" className="text-emerald-500" />
            {/* Africa */}
            <ellipse cx="50" cy="32" rx="6" ry="8" fill="currentColor" className="text-emerald-500" />
          </svg>
          
          {/* Country shields */}
          {countries.map((country, i) => (
            <motion.div
              key={country.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.2 }}
              className="absolute"
              style={{ left: `${country.x}%`, top: `${country.y}%`, transform: "translate(-50%, -50%)" }}
            >
              {/* Pulsing shield */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    `0 0 20px ${country.color === "blue" ? "rgba(59,130,246,0.5)" : country.color === "emerald" ? "rgba(16,185,129,0.5)" : country.color === "amber" ? "rgba(245,158,11,0.5)" : "rgba(6,182,212,0.5)"}`,
                    `0 0 40px ${country.color === "blue" ? "rgba(59,130,246,0.8)" : country.color === "emerald" ? "rgba(16,185,129,0.8)" : country.color === "amber" ? "rgba(245,158,11,0.8)" : "rgba(6,182,212,0.8)"}`,
                    `0 0 20px ${country.color === "blue" ? "rgba(59,130,246,0.5)" : country.color === "emerald" ? "rgba(16,185,129,0.5)" : country.color === "amber" ? "rgba(245,158,11,0.5)" : "rgba(6,182,212,0.5)"}`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  country.color === "blue" && "bg-blue-500/30 border-2 border-blue-400",
                  country.color === "emerald" && "bg-emerald-500/30 border-2 border-emerald-400",
                  country.color === "amber" && "bg-amber-500/30 border-2 border-amber-400",
                  country.color === "cyan" && "bg-cyan-500/30 border-2 border-cyan-400",
                )}
              >
                <span className="text-xl">{country.flag}</span>
              </motion.div>
              
              {/* Floating glass card */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.2 }}
                className={cn(
                  "absolute top-full mt-2 left-1/2 -translate-x-1/2 w-32 p-2 rounded-lg backdrop-blur-md border",
                  "bg-slate-900/80",
                  country.color === "blue" && "border-blue-500/40",
                  country.color === "emerald" && "border-emerald-500/40",
                  country.color === "amber" && "border-amber-500/40",
                  country.color === "cyan" && "border-cyan-500/40",
                )}
              >
                <p className="text-white font-semibold text-xs text-center">{country.name}</p>
                <p className={cn(
                  "text-[9px] text-center",
                  getColor(country.color).text
                )}>{country.achievement}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 11: THE ASCENT - 3-Year Staircase to Vision 2030
// ============================================================================

function AscentVisual() {
  const steps = [
    { year: "Year 1", title: "Foundation", desc: "Baseline Assessment & Gap Analysis", color: "blue" },
    { year: "Year 2", title: "Optimization", desc: "System Integration & Quick Wins", color: "emerald" },
    { year: "Year 3", title: "Excellence", desc: "Regional Leadership Position", color: "purple" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
      <ParticleField count={40} color="cyan" speed="slow" />
      
      <FloatingGlowOrb color="purple" size="lg" position="top-right" delay={0} />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl">
        {/* Vision 2030 Star at the top */}
        <HeroReveal delay={0} direction="down">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 30px rgba(168,85,247,0.5)",
                "0 0 60px rgba(168,85,247,0.8)",
                "0 0 30px rgba(168,85,247,0.5)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-8 p-4 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border-2 border-purple-400"
          >
            <Star className="w-12 h-12 text-purple-400" fill="currentColor" />
          </motion.div>
          <p className="text-purple-400 font-bold text-lg mb-8 tracking-wider">VISION 2030</p>
        </HeroReveal>
        
        {/* Staircase */}
        <div className="relative w-full">
          {/* Connection line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <motion.path
              d="M 15% 90% L 35% 60% L 65% 60% L 85% 30%"
              stroke="url(#stairGradient)"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <defs>
              <linearGradient id="stairGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(59,130,246)" />
                <stop offset="50%" stopColor="rgb(16,185,129)" />
                <stop offset="100%" stopColor="rgb(168,85,247)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Steps */}
          <div className="relative flex justify-between items-end h-48">
            {steps.map((step, i) => (
              <HeroReveal key={step.year} delay={0.5 + i * 0.3} direction="up">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={cn(
                    "relative p-4 rounded-xl backdrop-blur-md border w-40",
                    "bg-slate-900/80",
                    step.color === "blue" && "border-blue-500/40",
                    step.color === "emerald" && "border-emerald-500/40",
                    step.color === "purple" && "border-purple-500/40",
                  )}
                  style={{ 
                    marginBottom: `${i * 30}%`,
                  }}
                >
                  {/* Step indicator */}
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        `0 0 15px ${step.color === "blue" ? "rgba(59,130,246,0.5)" : step.color === "emerald" ? "rgba(16,185,129,0.5)" : "rgba(168,85,247,0.5)"}`,
                        `0 0 30px ${step.color === "blue" ? "rgba(59,130,246,0.8)" : step.color === "emerald" ? "rgba(16,185,129,0.8)" : "rgba(168,85,247,0.8)"}`,
                        `0 0 15px ${step.color === "blue" ? "rgba(59,130,246,0.5)" : step.color === "emerald" ? "rgba(16,185,129,0.5)" : "rgba(168,85,247,0.5)"}`,
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    className={cn(
                      "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold",
                      step.color === "blue" && "bg-blue-500 text-white",
                      step.color === "emerald" && "bg-emerald-500 text-white",
                      step.color === "purple" && "bg-purple-500 text-white",
                    )}
                  >
                    {step.year}
                  </motion.div>
                  
                  <p className={cn(
                    "font-bold text-sm mt-2",
                    getColor(step.color).text
                  )}>{step.title}</p>
                  <p className="text-white/60 text-xs mt-1">{step.desc}</p>
                </motion.div>
              </HeroReveal>
            ))}
          </div>
        </div>
        
        {/* GOSI starting point */}
        <HeroReveal delay={1.5} direction="up">
          <div className="mt-8 flex items-center gap-3">
            <img src="/gosi-logo.png" alt="GOSI" className="h-8 object-contain opacity-80" />
            <span className="text-white/60 text-sm">Ready to Ascend</span>
          </div>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// SLIDE 12: THE HANDSHAKE - ADL + GOSI Connected Logos
// ============================================================================

function HandshakeVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <ParticleField count={30} color="cyan" speed="slow" />
      
      <FloatingGlowOrb color="cyan" size="lg" position="top-left" delay={0} />
      <FloatingGlowOrb color="purple" size="md" position="bottom-right" delay={0.5} />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo connection */}
        <div className="flex items-center gap-8">
          {/* ADL Logo */}
          <HeroReveal delay={0} direction="left">
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 30px rgba(168,85,247,0.3)",
                  "0 0 50px rgba(168,85,247,0.5)",
                  "0 0 30px rgba(168,85,247,0.3)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="p-6 rounded-2xl bg-slate-900/80 border border-purple-500/40 backdrop-blur-md"
            >
              <img src="/adl-logo.png" alt="Arthur D. Little" className="h-16 object-contain" />
            </motion.div>
          </HeroReveal>
          
          {/* Connecting data line */}
          <div className="relative w-32">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              style={{ transformOrigin: "left" }}
            />
            
            {/* Data particles along the line */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                animate={{ x: [0, 128, 0] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: 1 + i * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* GOSI Logo */}
          <HeroReveal delay={0.3} direction="right">
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 30px rgba(16,185,129,0.3)",
                  "0 0 50px rgba(16,185,129,0.5)",
                  "0 0 30px rgba(16,185,129,0.3)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/40 backdrop-blur-md"
            >
              <img src="/gosi-logo.png" alt="GOSI" className="h-16 object-contain" />
            </motion.div>
          </HeroReveal>
        </div>
        
        {/* Next Step CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-12 text-center"
        >
          <p className="text-white/40 text-xs tracking-widest mb-2">NEXT STEP</p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 backdrop-blur-md"
          >
            <p className="text-cyan-400 font-bold text-lg">The National Baseline Assessment</p>
            <p className="text-white/60 text-sm mt-1">Comprehensive gap analysis against global leaders</p>
          </motion.div>
        </motion.div>
        
        {/* Defining the future tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-8 text-white/30 text-xs tracking-[0.3em]"
        >
          DEFINING THE FUTURE OF WORK
        </motion.p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VISUALS - Simplified versions for consulting layouts
// ============================================================================

function CompactIntroVisual() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Central logo glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <GlowOrb color="cyan" size="xl" intensity="intense">
          <div className="flex items-center gap-3">
            <img src="/adl-logo.png" alt="ADL" className="h-12 object-contain" />
          </div>
        </GlowOrb>
      </motion.div>
      
      {/* Orbiting rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute border border-cyan-500/20 rounded-full"
          style={{ 
            width: `${180 + i * 40}px`, 
            height: `${180 + i * 40}px`,
          }}
          animate={{ rotate: 360, opacity: [0.2, 0.5, 0.2] }}
          transition={{ 
            rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3, repeat: Infinity }
          }}
        />
      ))}
    </div>
  );
}

function CompactConclusionVisual() {
  const pillars = [
    { icon: Crown, color: "purple", label: "Governance" },
    { icon: Shield, color: "blue", label: "Prevention" },
    { icon: Eye, color: "emerald", label: "Surveillance" },
    { icon: Heart, color: "amber", label: "Restoration" },
  ];
  
  return (
    <div className="relative w-80 h-40 flex items-center justify-center">
      <div className="flex gap-6">
        {pillars.map((p, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.15, type: "spring" }}
            className="flex flex-col items-center gap-2"
          >
            <IconGlow color={p.color as "purple" | "cyan" | "blue" | "emerald" | "amber"}>
              <p.icon className="w-6 h-6 text-white" />
            </IconGlow>
            <span className="text-xs text-white/60">{p.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CompactGlobeVisual() {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <GlowOrb color="amber" size="lg" intensity="medium">
          <Globe className="w-10 h-10 text-white" />
        </GlowOrb>
      </motion.div>
      <PulseRing color="amber" delay={0} />
      <PulseRing color="amber" delay={1} />
    </div>
  );
}

function CompactSaudiVisual() {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlowOrb color="cyan" size="lg" intensity="intense">
          <span className="text-4xl">🇸🇦</span>
        </GlowOrb>
      </motion.div>
      <motion.div
        className="absolute -top-2 -right-2"
        animate={{ y: [-2, 2, -2], rotate: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <TrendingUp className="w-6 h-6 text-cyan-400" />
      </motion.div>
    </div>
  );
}

function CompactTempleVisual() {
  return (
    <div className="relative w-full max-w-md">
      {/* Governance roof */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto w-3/4 h-16 bg-gradient-to-b from-purple-500/30 to-purple-600/10 border border-purple-500/40 rounded-t-lg flex items-center justify-center"
      >
        <Crown className="w-8 h-8 text-purple-400" />
        <span className="ml-2 text-purple-300 font-semibold">Governance</span>
      </motion.div>
      
      {/* Pillars */}
      <div className="flex justify-center gap-4 mt-2">
        {[
          { icon: Shield, color: "blue", label: "Prevention" },
          { icon: Eye, color: "emerald", label: "Surveillance" },
          { icon: Heart, color: "amber", label: "Restoration" },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            className={cn(
              "w-24 h-28 rounded-lg border flex flex-col items-center justify-center gap-2",
              `bg-${p.color}-500/20 border-${p.color}-500/40`
            )}
            style={{
              background: p.color === "blue" ? "rgba(37,99,235,0.2)" : 
                          p.color === "emerald" ? "rgba(16,185,129,0.2)" : 
                          "rgba(245,158,11,0.2)",
              borderColor: p.color === "blue" ? "rgba(37,99,235,0.4)" : 
                           p.color === "emerald" ? "rgba(16,185,129,0.4)" : 
                           "rgba(245,158,11,0.4)"
            }}
          >
            <p.icon className={cn("w-6 h-6", 
              p.color === "blue" ? "text-blue-400" : 
              p.color === "emerald" ? "text-emerald-400" : 
              "text-amber-400"
            )} />
            <span className="text-xs text-white/70">{p.label}</span>
          </motion.div>
        ))}
      </div>
      
      {/* Foundation */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="mt-2 h-6 bg-slate-700/50 rounded border border-white/10 flex items-center justify-center"
      >
        <Database className="w-4 h-4 text-slate-400" />
        <span className="ml-2 text-xs text-slate-400">Data Foundation</span>
      </motion.div>
    </div>
  );
}

function CompactIntegrationVisual() {
  const nodes = [
    { angle: -90, icon: Crown, color: "purple" as const, label: "Governance" },
    { angle: 0, icon: Shield, color: "blue" as const, label: "Prevention" },
    { angle: 90, icon: Eye, color: "emerald" as const, label: "Surveillance" },
    { angle: 180, icon: Heart, color: "amber" as const, label: "Restoration" },
  ];
  
  const radius = 90;
  
  return (
    <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center">
      {/* Outer rotating ring */}
      <motion.div
        className="absolute w-full h-full border-2 border-cyan-500/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner rotating ring (opposite direction) */}
      <motion.div
        className="absolute w-3/4 h-3/4 border border-purple-500/20 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Central hub - pulsing */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="absolute z-20"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            boxShadow: [
              "0 0 20px rgba(6,182,212,0.3)",
              "0 0 40px rgba(6,182,212,0.5)",
              "0 0 20px rgba(6,182,212,0.3)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <GlowOrb color="cyan" size="lg" intensity="intense">
            <RefreshCcw className="w-8 h-8 text-white" />
          </GlowOrb>
        </motion.div>
      </motion.div>
      
      {/* Connected nodes */}
      {nodes.map((node, i) => {
        const x = Math.cos((node.angle * Math.PI) / 180) * radius;
        const y = Math.sin((node.angle * Math.PI) / 180) * radius;
        const NodeIcon = node.icon;
        
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 200 }}
            className="absolute flex flex-col items-center z-10"
            style={{ 
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <motion.div
              whileHover={{ scale: 1.15 }}
              animate={{ 
                y: [0, -3, 0],
              }}
              transition={{ 
                y: { duration: 2, repeat: Infinity, delay: i * 0.3 },
              }}
            >
              <IconGlow color={node.color}>
                <NodeIcon className="w-6 h-6 text-white" />
              </IconGlow>
            </motion.div>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="text-[11px] text-white/70 mt-2 font-medium"
            >
              {node.label}
            </motion.span>
          </motion.div>
        );
      })}
      
      {/* Connection lines with animated flow */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.5)" />
            <stop offset="50%" stopColor="rgba(147,51,234,0.5)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.5)" />
          </linearGradient>
        </defs>
        {nodes.map((node, i) => {
          const nextNode = nodes[(i + 1) % 4];
          const x1 = 140 + Math.cos((node.angle * Math.PI) / 180) * radius * 0.7;
          const y1 = 140 + Math.sin((node.angle * Math.PI) / 180) * radius * 0.7;
          const x2 = 140 + Math.cos((nextNode.angle * Math.PI) / 180) * radius * 0.7;
          const y2 = 140 + Math.sin((nextNode.angle * Math.PI) / 180) * radius * 0.7;
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1 + i * 0.15, duration: 0.6 }}
            />
          );
        })}
        {/* Lines to center */}
        {nodes.map((node, i) => {
          const x1 = 140 + Math.cos((node.angle * Math.PI) / 180) * radius * 0.5;
          const y1 = 140 + Math.sin((node.angle * Math.PI) / 180) * radius * 0.5;
          return (
            <motion.line
              key={`center-${i}`}
              x1={140} y1={140} x2={x1} y2={y1}
              stroke={`rgba(${node.color === "purple" ? "147,51,234" : node.color === "blue" ? "37,99,235" : node.color === "emerald" ? "16,185,129" : "245,158,11"},0.4)`}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.5 + i * 0.1, duration: 0.4 }}
            />
          );
        })}
      </svg>
      
      {/* Floating data particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400/50"
          initial={{ 
            x: 140, 
            y: 140,
            scale: 0 
          }}
          animate={{ 
            x: [140, 140 + Math.cos(i * 60 * Math.PI / 180) * 120, 140],
            y: [140, 140 + Math.sin(i * 60 * Math.PI / 180) * 120, 140],
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

interface CompactGovernanceVisualProps {
  onInsightClick?: (id: string) => void;
}

function CompactGovernanceVisual({ onInsightClick }: CompactGovernanceVisualProps) {
  const elements = [
    { id: "legislative-backbone", icon: FileCheck, label: "Legislative" },
    { id: "enforcement", icon: Scale, label: "Enforcement" },
    { id: "national-culture", icon: Users, label: "Culture" },
    { id: "strategic-capacity", icon: Briefcase, label: "Capacity" },
  ];
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Central crown */}
      <GlowOrb color="purple" size="lg" intensity="intense">
        <Crown className="w-8 h-8 text-white" />
      </GlowOrb>
      
      {/* Elements grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {elements.map((el, i) => (
          <motion.button
            key={el.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onInsightClick?.(el.id)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-left"
          >
            <el.icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-xs text-white/80">{el.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

interface CompactPillarVisualProps {
  pillar: "prevention" | "surveillance" | "restoration";
  onInsightClick?: (id: string) => void;
}

function CompactPillarVisual({ pillar, onInsightClick }: CompactPillarVisualProps) {
  const config = {
    prevention: {
      icon: Shield,
      color: "blue" as const,
      elements: [
        { id: "hazard-registry", icon: Beaker, label: "Hazard Registry" },
        { id: "control-maturity", icon: HardHat, label: "Control Maturity" },
        { id: "risk-assessment", icon: Activity, label: "Risk Assessment" },
        { id: "climate-defense", icon: Thermometer, label: "Climate Defense" },
      ],
    },
    surveillance: {
      icon: Eye,
      color: "emerald" as const,
      elements: [
        { id: "active-surveillance", icon: Activity, label: "Active Monitoring" },
        { id: "health-monitoring", icon: Stethoscope, label: "Health Exams" },
        { id: "vulnerability-index", icon: Users, label: "Vulnerability" },
        { id: "early-warning", icon: Bell, label: "Early Warning" },
      ],
    },
    restoration: {
      icon: Heart,
      color: "amber" as const,
      elements: [
        { id: "payer-mechanism", icon: Wallet, label: "Payer System" },
        { id: "rehabilitation", icon: Activity, label: "Rehabilitation" },
        { id: "return-to-work", icon: UserCheck, label: "Return to Work" },
        { id: "compensation", icon: Building2, label: "Compensation" },
      ],
    },
  };
  
  const { icon: MainIcon, color, elements } = config[pillar];
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Central icon */}
      <GlowOrb color={color} size="lg" intensity="intense">
        <MainIcon className="w-8 h-8 text-white" />
      </GlowOrb>
      
      {/* Elements grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {elements.map((el, i) => (
          <motion.button
            key={el.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onInsightClick?.(el.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-left border",
              color === "blue" && "bg-blue-500/10 border-blue-500/30",
              color === "emerald" && "bg-emerald-500/10 border-emerald-500/30",
              color === "amber" && "bg-amber-500/10 border-amber-500/30"
            )}
          >
            <el.icon className={cn(
              "w-4 h-4 flex-shrink-0",
              color === "blue" && "text-blue-400",
              color === "emerald" && "text-emerald-400",
              color === "amber" && "text-amber-400"
            )} />
            <span className="text-xs text-white/80">{el.label}</span>
          </motion.button>
        ))}
      </div>
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

          {/* Immersive Full-Screen Experience - Like intro flows, no modal feel */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col"
          >
            {/* Loader - Premium 3-phase cinematic opening */}
            <AnimatePresence>
              {showLoader && (
                <CinematicLoader onComplete={handleLoaderComplete} skipEnabled />
              )}
            </AnimatePresence>

            {/* Top controls bar - Subtle, floating */}
            {!showLoader && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-4 right-4 z-20 flex items-center gap-2"
              >
                {/* Auto-advance toggle */}
                <motion.button
                  onClick={() => setIsAutoAdvance(!isAutoAdvance)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-sm backdrop-blur-sm border",
                    isAutoAdvance 
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60 hover:text-white"
                  )}
                >
                  {isAutoAdvance ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
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
                <motion.button
                  onClick={toggleFullscreen}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all"
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
                </motion.button>

                {/* Close */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>
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

            {/* Main Content - Immersive Full-Screen Experience */}
            {!showLoader && slide && (
              <div className="flex-1 min-h-0 overflow-hidden relative pb-24">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    {renderConsultingSlide(slide, {
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

                {/* Slide number - Elegant bottom right */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-20 right-6 z-10 flex items-baseline gap-1"
                >
                  <span className={cn("text-3xl font-bold tracking-tight", c.text)}>
                    {String(currentSlide + 1).padStart(2, '0')}
                  </span>
                  <span className="text-white/20 text-lg font-light">
                    /{String(guideSlides.length).padStart(2, '0')}
                  </span>
                </motion.div>
              </div>
            )}

            {/* Immersive Navigation - Minimal, elegant */}
            {!showLoader && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-shrink-0 px-4 sm:px-8 py-4 sm:py-5 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-between absolute bottom-0 left-0 right-0 z-20"
              >
                {/* Previous */}
                <motion.button
                  onClick={prevSlide}
                  disabled={currentSlide === 0}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
                    currentSlide === 0
                      ? "opacity-20 cursor-not-allowed text-slate-600"
                      : "bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Previous</span>
                </motion.button>

                {/* Progress dots - Elegant minimal */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {guideSlides.map((s, i) => {
                    const dotColor = colors[s.color || "cyan"];
                    return (
                      <motion.button
                        key={i}
                        onClick={() => goToSlide(i)}
                        whileHover={{ scale: 1.3 }}
                        className={cn(
                          "rounded-full transition-all duration-300",
                          i === currentSlide
                            ? cn(dotColor.bgSolid, "w-3 h-3 shadow-lg", `shadow-${s.color || "cyan"}-500/50`)
                            : i < currentSlide
                              ? "w-2 h-2 bg-white/40"
                              : "w-2 h-2 bg-white/20 hover:bg-white/40"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Next - Premium CTA */}
                <motion.button
                  onClick={nextSlide}
                  whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${c.hex}40` }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium",
                    "bg-gradient-to-r from-cyan-500 to-purple-600",
                    "text-white shadow-xl shadow-cyan-500/20 border border-white/10"
                  )}
                >
                  <span className="text-sm">
                    {currentSlide === guideSlides.length - 1 ? "Explore" : "Continue"}
                  </span>
                  {currentSlide === guideSlides.length - 1 ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* Subtle bottom info bar */}
            {!showLoader && (
              <div className="flex-shrink-0 px-4 sm:px-8 py-2 bg-black/80 flex items-center justify-between text-[10px] sm:text-xs text-white/30">
                <button onClick={onClose} className="hover:text-white/60 transition-colors">
                  Skip Briefing
                </button>
                <div className="hidden sm:flex items-center gap-4">
                  <span>← → Navigate</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">Space</kbd>
                    <span>Auto</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">F</kbd>
                    <span>Fullscreen</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-[9px]">Esc</kbd>
                    <span>Close</span>
                  </span>
                </div>
                <div className="sm:hidden text-[9px]">
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
