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
};

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
  const c = colors[color];
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
                    colors[item.color].bgSolid,
                    "shadow-xl"
                  )}
                >
                  <ShimmerOverlay delay={1.5 + i * 0.2} duration={3} />
                  
                  <motion.div
                    animate={{
                      boxShadow: [
                        `0 0 20px ${colors[item.color].hex}40`,
                        `0 0 40px ${colors[item.color].hex}60`,
                        `0 0 20px ${colors[item.color].hex}40`,
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
                      colors[item.color].bg,
                      colors[item.color].text
                    )}>
                      {item.label}
                    </span>
                  </motion.div>
                  
                  {/* Pulse ring */}
                  <motion.div
                    className={cn("absolute inset-0 rounded-2xl border-2", colors[item.color].border)}
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
// GLOBAL CHALLENGE VISUAL - Dramatic crisis statistics
// ============================================================================

function GlobalChallengeVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      {/* Dramatic amber/red particle field */}
      <ParticleField count={60} color="amber" speed="normal" />
      
      {/* Danger glow orbs */}
      <FloatingGlowOrb color="amber" size="xl" position="top-right" delay={0.5} />
      <FloatingGlowOrb color="amber" size="lg" position="bottom-left" delay={1} />
      
      <div className="relative z-10 text-center w-full max-w-lg">
        {/* Dramatic globe with crisis aura */}
        <ScaleReveal delay={0} initialScale={0.5}>
          <div className="relative mb-10">
            {/* Danger pulse rings */}
            <PulseRing color="amber" size="w-48 h-48" count={4} duration={2.5} />
            
            {/* Main globe with intense glow */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 50px rgba(245,158,11,0.3), 0 0 100px rgba(239,68,68,0.2)",
                  "0 0 80px rgba(245,158,11,0.5), 0 0 160px rgba(239,68,68,0.3)",
                  "0 0 50px rgba(245,158,11,0.3), 0 0 100px rgba(239,68,68,0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-amber-500/40 via-amber-600/30 to-red-600/20 border-2 border-amber-500/50 flex items-center justify-center relative overflow-hidden"
            >
              <ShimmerOverlay delay={0.5} duration={3} />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <Globe className="w-24 h-24 text-amber-400" />
              </motion.div>
              
              {/* Crisis indicator */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute top-4 right-4 w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50"
              />
            </motion.div>
          </div>
        </ScaleReveal>

        {/* Hero stat - Deaths */}
        <HeroReveal delay={0.4} direction="scale" blur={25}>
          <div className="mb-8">
            <motion.div
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(245,158,11,0.3)",
                  "0 0 40px rgba(245,158,11,0.5)",
                  "0 0 20px rgba(245,158,11,0.3)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl md:text-6xl font-bold text-amber-400 mb-2"
            >
              <NumberCounter value={2.9} suffix="M" decimals={1} duration={2.5} delay={0.6} />
            </motion.div>
            <p className="text-white/80 text-lg font-medium">Deaths Annually</p>
            <p className="text-amber-400/60 text-sm mt-1">More than road accidents, malaria & HIV combined</p>
          </div>
        </HeroReveal>

        {/* Secondary stats grid */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 395, suffix: "M", label: "Injuries", color: "blue", delay: 0.8 },
            { value: 4, suffix: "%", label: "GDP Lost", color: "purple", delay: 1 },
            { value: 3.94, suffix: "T", label: "USD Cost", decimals: 2, color: "amber", delay: 1.2 },
          ].map((stat, i) => (
            <HeroReveal key={i} delay={stat.delay} direction="up">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className={cn(
                  "p-4 rounded-xl border backdrop-blur-sm relative overflow-hidden",
                  colors[stat.color].bg,
                  colors[stat.color].border
                )}
              >
                <ShimmerOverlay delay={stat.delay + 0.5} duration={2} />
                <p className={cn("text-2xl font-bold mb-1", colors[stat.color].text)}>
                  <NumberCounter 
                    value={stat.value} 
                    suffix={stat.suffix} 
                    decimals={stat.decimals || 0}
                    duration={2} 
                    delay={stat.delay + 0.3} 
                  />
                </p>
                <p className="text-white/60 text-xs">{stat.label}</p>
              </motion.div>
            </HeroReveal>
          ))}
        </div>

        {/* Call to action */}
        <HeroReveal delay={1.6} direction="up">
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mt-8 text-amber-400/80 text-sm font-medium"
          >
            A preventable crisis demanding systematic action
          </motion.p>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// ADL SOLUTION VISUAL - Premium company credentials showcase
// ============================================================================

function ADLSolutionVisual() {
  const credentials = [
    { icon: TrendingUp, value: 100, suffix: "+", label: "Years", sublabel: "Consulting Excellence", color: "purple" },
    { icon: Globe, value: 40, suffix: "+", label: "Countries", sublabel: "Global Presence", color: "cyan" },
    { icon: Database, value: 180, suffix: "+", label: "Nations", sublabel: "Data Coverage", color: "blue" },
    { icon: Zap, value: 24, suffix: "/7", label: "Real-Time", sublabel: "Analytics Platform", color: "emerald" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      {/* Premium purple/cyan particle field */}
      <ParticleField count={50} color="mixed" speed="slow" />
      
      {/* Floating glow accents */}
      <FloatingGlowOrb color="purple" size="xl" position="top-left" delay={0} />
      <FloatingGlowOrb color="cyan" size="lg" position="bottom-right" delay={0.5} />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Central ADL logo with premium glow */}
        <ScaleReveal delay={0} initialScale={0.5}>
          <div className="text-center mb-10">
            <GlowOrb color="purple" size="lg" intensity="intense" pulse>
              <img 
                src="/adl-logo.png" 
                alt="ADL" 
                className="h-16 object-contain brightness-0 invert relative z-10" 
              />
            </GlowOrb>
            
            {/* Company name with dramatic reveal */}
            <HeroReveal delay={0.4} direction="up" blur={15}>
              <DramaticTextReveal
                text="Arthur D. Little"
                className="mt-6 text-xl font-bold text-white"
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
            
            {/* Year badge */}
            <HeroReveal delay={1} direction="up">
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20"
              >
                <span className="text-purple-400 text-xs">Est. 1886</span>
                <div className="w-1 h-1 rounded-full bg-purple-400" />
                <span className="text-purple-400 text-xs">Boston, USA</span>
              </motion.div>
            </HeroReveal>
          </div>
        </ScaleReveal>

        {/* Credentials grid with 3D flip cards */}
        <div className="grid grid-cols-2 gap-4">
          {credentials.map((item, i) => (
            <HeroReveal 
              key={i} 
              delay={1.2 + i * 0.15} 
              direction={i % 2 === 0 ? "left" : "right"}
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  z: 50,
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "p-4 rounded-xl border backdrop-blur-sm relative overflow-hidden cursor-pointer",
                  "bg-gradient-to-br",
                  colors[item.color].bg,
                  colors[item.color].border,
                  "hover:shadow-lg transition-shadow"
                )}
                style={{ transformStyle: "preserve-3d" }}
              >
                <ShimmerOverlay delay={1.4 + i * 0.2} duration={2.5} />
                
                <div className="flex items-start gap-3">
                  <IconGlow color={item.color as "purple" | "cyan" | "blue" | "emerald" | "amber"}>
                    <item.icon className="w-6 h-6 text-white" />
                  </IconGlow>
                  
                  <div className="flex-1">
                    <div className={cn("text-2xl font-bold", colors[item.color].text)}>
                      <NumberCounter 
                        value={item.value} 
                        suffix={item.suffix} 
                        duration={2} 
                        delay={1.4 + i * 0.15} 
                      />
                    </div>
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    <p className="text-white/50 text-xs mt-0.5">{item.sublabel}</p>
                  </div>
                </div>
              </motion.div>
            </HeroReveal>
          ))}
        </div>

        {/* Bottom tagline */}
        <HeroReveal delay={2} direction="up">
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
// SUCCESS STORIES VISUAL - Premium country achievement cards
// ============================================================================

function SuccessStoriesVisual() {
  const countries = [
    { code: "DEU", name: "Germany", achievement: "75% fatality reduction", stat: 75, color: "blue", flag: "🇩🇪" },
    { code: "SGP", name: "Singapore", achievement: "94% compliance rate", stat: 94, color: "emerald", flag: "🇸🇬" },
    { code: "SWE", name: "Sweden", achievement: "Vision Zero pioneer", stat: 0, isText: true, color: "cyan", flag: "🇸🇪" },
    { code: "JPN", name: "Japan", achievement: "OSHMS excellence", stat: 40, suffix: "%", color: "purple", flag: "🇯🇵" },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      <ParticleField count={45} color="emerald" speed="slow" />
      
      <FloatingGlowOrb color="emerald" size="xl" position="top-left" delay={0} />
      <FloatingGlowOrb color="cyan" size="lg" position="bottom-right" delay={0.5} />
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <HeroReveal delay={0} direction="down">
          <div className="text-center mb-8">
            <DramaticTextReveal
              text="Global Success Stories"
              className="text-xl font-bold text-white"
              delay={0.2}
              glow
              glowColor="rgba(5, 150, 105, 0.4)"
            />
            <p className="text-emerald-400/70 text-sm mt-2">
              Leaders in Occupational Health Excellence
            </p>
          </div>
        </HeroReveal>

        {/* Country cards with 3D effect */}
        <div className="grid grid-cols-2 gap-5">
          {countries.map((country, i) => (
            <HeroReveal key={i} delay={0.4 + i * 0.15} direction={i % 2 === 0 ? "left" : "right"}>
              <motion.div
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  rotateY: 5,
                  rotateX: -5,
                }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "p-5 rounded-2xl border backdrop-blur-sm cursor-pointer relative overflow-hidden",
                  colors[country.color].bg,
                  colors[country.color].border,
                  "hover:shadow-xl transition-all"
                )}
                style={{ transformStyle: "preserve-3d" }}
              >
                <ShimmerOverlay delay={0.6 + i * 0.2} duration={3} />
                
                {/* Glow effect */}
                <motion.div
                  animate={{
                    boxShadow: [
                      `0 0 20px ${colors[country.color].hex}30`,
                      `0 0 40px ${colors[country.color].hex}50`,
                      `0 0 20px ${colors[country.color].hex}30`,
                    ]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute inset-0 rounded-2xl"
                />
                
                <div className="relative z-10">
                  {/* Flag and name */}
                  <div className="flex items-center gap-3 mb-3">
                    <motion.span 
                      className="text-3xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    >
                      {country.flag}
                    </motion.span>
                    <span className="text-white font-bold">{country.name}</span>
                  </div>
                  
                  {/* Stat */}
                  {!country.isText && (
                    <div className={cn("text-3xl font-bold mb-1", colors[country.color].text)}>
                      <NumberCounter 
                        value={country.stat} 
                        suffix={country.suffix || "%"} 
                        duration={2} 
                        delay={0.8 + i * 0.15} 
                      />
                    </div>
                  )}
                  
                  {/* Achievement */}
                  <p className="text-white/70 text-sm">
                    {country.achievement}
                  </p>
                </div>
              </motion.div>
            </HeroReveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <HeroReveal delay={1.4} direction="up">
          <motion.p
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-center text-emerald-400/80 text-sm mt-8"
          >
            Learn from the world's leading OH systems
          </motion.p>
        </HeroReveal>
      </div>
    </div>
  );
}

// ============================================================================
// GOSI OPPORTUNITY VISUAL - Saudi Arabia's rise with premium animations
// ============================================================================

function GOSIOpportunityVisual() {
  const rankings = [
    { position: 1, country: "Germany", flag: "🇩🇪", score: 92 },
    { position: 2, country: "Sweden", flag: "🇸🇪", score: 89 },
    { position: 3, country: "Singapore", flag: "🇸🇬", score: 87 },
    { position: "?", country: "Saudi Arabia", flag: "🇸🇦", score: null, highlight: true },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 overflow-hidden">
      <ParticleField count={50} color="cyan" speed="slow" />
      
      <FloatingGlowOrb color="cyan" size="xl" position="top-right" delay={0} />
      <FloatingGlowOrb color="purple" size="lg" position="bottom-left" delay={0.5} />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <HeroReveal delay={0} direction="down">
          <div className="text-center mb-8">
            <DramaticTextReveal
              text="GOSI's Path Forward"
              className="text-xl font-bold text-white"
              delay={0.2}
              glow
              glowColor="rgba(6, 182, 212, 0.4)"
            />
            <p className="text-cyan-400/70 text-sm mt-2">
              Regional Leadership Opportunity
            </p>
          </div>
        </HeroReveal>

        {/* Ranking visualization with premium styling */}
        <div className="space-y-4">
          {rankings.map((item, i) => (
            <HeroReveal key={i} delay={0.4 + i * 0.12} direction="left">
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border relative overflow-hidden",
                  item.highlight
                    ? "bg-gradient-to-r from-cyan-500/30 to-purple-500/20 border-cyan-400/60"
                    : "bg-white/5 border-white/10"
                )}
              >
                {item.highlight && <ShimmerOverlay delay={1} duration={3} />}
                
                {/* Position badge */}
                <motion.div 
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl relative",
                    item.highlight 
                      ? "bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30" 
                      : "bg-slate-700/80 text-white/60"
                  )}
                  animate={item.highlight ? {
                    boxShadow: [
                      "0 0 20px rgba(6,182,212,0.3)",
                      "0 0 40px rgba(6,182,212,0.5)",
                      "0 0 20px rgba(6,182,212,0.3)",
                    ]
                  } : undefined}
                  transition={{ duration: 2, repeat: Infinity }}
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

                {/* Country info */}
                <div className="flex items-center gap-3 flex-1">
                  <motion.span 
                    className="text-2xl"
                    animate={item.highlight ? { scale: [1, 1.15, 1] } : undefined}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {item.flag}
                  </motion.span>
                  <span className={cn(
                    "font-semibold text-lg",
                    item.highlight ? "text-cyan-300" : "text-white/80"
                  )}>
                    {item.country}
                  </span>
                </div>

                {/* Score or rising indicator */}
                {item.score ? (
                  <div className="text-white/60 font-mono text-lg">
                    <NumberCounter value={item.score} duration={1.5} delay={0.6 + i * 0.1} />
                  </div>
                ) : (
                  <motion.div
                    animate={{ y: [-8, 8, -8], rotate: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                    <span className="text-cyan-400 text-sm font-medium">Rising</span>
                  </motion.div>
                )}
              </motion.div>
            </HeroReveal>
          ))}
        </div>

        {/* Vision 2030 card with premium styling */}
        <HeroReveal delay={1.2} direction="up">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-purple-500/15 to-cyan-500/20 border border-cyan-500/40 relative overflow-hidden"
          >
            <ShimmerOverlay delay={1.5} duration={4} />
            
            <div className="flex items-center gap-4 relative z-10">
              <motion.div 
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(6,182,212,0.3), 0 0 40px rgba(147,51,234,0.2)",
                    "0 0 40px rgba(6,182,212,0.5), 0 0 80px rgba(147,51,234,0.3)",
                    "0 0 20px rgba(6,182,212,0.3), 0 0 40px rgba(147,51,234,0.2)",
                  ]
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center"
              >
                <span className="text-white font-bold text-lg">2030</span>
              </motion.div>
              <div>
                <DramaticTextReveal
                  text="Vision 2030 Aligned"
                  className="text-white font-bold text-lg"
                  delay={1.4}
                  glow
                  glowColor="rgba(6, 182, 212, 0.3)"
                />
                <p className="text-cyan-400/80 text-sm mt-1">Quality of Life Program</p>
              </div>
            </div>
          </motion.div>
        </HeroReveal>
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
    // HERO LAYOUT - Intro and CTA slides
    case "intro":
      return (
        <HeroSlideLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          description={slide.content}
          highlights={slide.highlights}
          color={(slide.color as "cyan" | "purple" | "blue" | "emerald" | "amber") || "cyan"}
          showLogos={true}
          visual={<CompactIntroVisual />}
        />
      );

    case "cta":
      return (
        <HeroSlideLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          description={slide.content}
          highlights={slide.highlights}
          color={(slide.color as "cyan" | "purple" | "blue" | "emerald" | "amber") || "cyan"}
          showLogos={true}
          visual={<CompactConclusionVisual />}
          ctaButton={{
            label: "Start Exploring",
            onClick: onCloseAndExplore || (() => {}),
          }}
        />
      );

    // DATA IMPACT LAYOUT - Challenge and opportunity slides
    case "challenge":
      return (
        <DataImpactLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          stats={[
            { value: 2.9, suffix: "M", label: "Annual Deaths", color: "amber" },
            { value: 4, suffix: "%", label: "Global GDP Lost", color: "purple" },
            { value: 395, suffix: "M", label: "Injuries/Year", color: "blue" },
          ]}
          highlights={slide.highlights}
          insight="Occupational accidents and diseases claim more lives than road accidents, malaria, and HIV/AIDS combined."
          insightSource="ILO Global Estimates, 2024"
          color="amber"
          icon={<Globe className="w-5 h-5 text-amber-400" />}
          visual={<CompactGlobeVisual />}
        />
      );

    case "opportunity":
      return (
        <DataImpactLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          stats={[
            { value: 40, suffix: "%", label: "Cost Reduction Potential", color: "emerald" },
            { value: "#1", label: "GCC Leadership Target", color: "cyan" },
            { value: 2030, label: "Vision Alignment", color: "purple" },
          ]}
          highlights={slide.highlights}
          insight="With GOSI's institutional strength and Vision 2030 alignment, Saudi Arabia can become the regional benchmark."
          color="cyan"
          icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
          visual={<CompactSaudiVisual />}
        />
      );

    // FRAMEWORK LAYOUT - Overview and integration slides  
    case "overview":
      return (
        <FrameworkLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          visual={<CompactTempleVisual />}
          highlights={slide.highlights}
          insight="25 key performance indicators across 4 maturity levels provide comprehensive assessment."
          color="purple"
          icon={<Layers className="w-5 h-5 text-purple-400" />}
        />
      );

    case "integration":
      return (
        <FrameworkLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          visual={<CompactIntegrationVisual />}
          highlights={slide.highlights}
          insight="Countries with integrated systems show 40% lower fatality rates than those with fragmented approaches."
          color="cyan"
          icon={<RefreshCcw className="w-5 h-5 text-cyan-400" />}
        />
      );

    // COMPONENT LAYOUT - Governance and pillar slides
    case "component":
      const componentColors: Record<string, "purple" | "blue" | "emerald" | "amber" | "cyan"> = {
        governance: "purple",
        "pillar-1": "blue",
        "pillar-2": "emerald",
        "pillar-3": "amber",
      };
      
      const componentInsights: Record<string, string> = {
        governance: "Strong governance correlates directly with lower fatality rates and better health outcomes.",
        "pillar-1": "Every dollar invested in prevention saves $4-6 in downstream healthcare costs and lost productivity.",
        "pillar-2": "Early detection can reduce treatment costs by 60% and prevent permanent disability.",
        "pillar-3": "No-fault systems process claims 70% faster and achieve 80% return-to-work rates.",
      };
      
      const componentVisuals: Record<string, React.ReactNode> = {
        governance: <CompactGovernanceVisual onInsightClick={onInsightClick} />,
        "pillar-1": <CompactPillarVisual pillar="prevention" onInsightClick={onInsightClick} />,
        "pillar-2": <CompactPillarVisual pillar="surveillance" onInsightClick={onInsightClick} />,
        "pillar-3": <CompactPillarVisual pillar="restoration" onInsightClick={onInsightClick} />,
      };

      return (
        <ComponentLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          description={slide.content}
          visual={componentVisuals[slide.componentId || "governance"]}
          highlights={slide.highlights}
          insight={componentInsights[slide.componentId || "governance"]}
          color={componentColors[slide.componentId || "governance"]}
          icon={getIcon()}
        />
      );

    // EVIDENCE LAYOUT - Success stories and solution slides
    case "success":
      return (
        <EvidenceLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          description={slide.content}
          evidence={[
            { flag: "🇩🇪", title: "Germany", achievement: "75% fatality reduction", detail: "Berufsgenossenschaften model since 1990" },
            { flag: "🇸🇬", title: "Singapore", achievement: "94% compliance rate", detail: "WSH Act with escalating penalties" },
            { flag: "🇸🇪", title: "Sweden", achievement: "Vision Zero pioneer", detail: "Zero fatalities goal by 2030" },
            { flag: "🇯🇵", title: "Japan", achievement: "OSHMS excellence", detail: "40% fewer incidents with certification" },
          ]}
          highlights={slide.highlights?.slice(0, 2)}
          insight="These nations demonstrate that comprehensive frameworks deliver measurable results."
          color="emerald"
          icon={<Globe className="w-5 h-5 text-emerald-400" />}
        />
      );

    case "solution":
      return (
        <EvidenceLayout
          actionTitle={slide.actionTitle}
          subtitle={slide.subtitle}
          description={slide.content}
          evidence={[
            { title: "100+ Years", achievement: "Consulting Excellence", detail: "Founded in 1886" },
            { title: "40+ Countries", achievement: "Global Presence", detail: "Worldwide expertise" },
            { title: "Healthcare", achievement: "Deep Expertise", detail: "Public sector specialists" },
            { title: "Proprietary", achievement: "Data Methodology", detail: "Evidence-based insights" },
          ]}
          highlights={slide.highlights?.slice(0, 2)}
          color="purple"
          icon={<Briefcase className="w-5 h-5 text-purple-400" />}
          gridColumns={4}
        />
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
  return (
    <div className="relative w-full max-w-md h-48 flex items-center justify-center">
      {/* Central hub */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute"
      >
        <GlowOrb color="cyan" size="md" intensity="medium">
          <RefreshCcw className="w-6 h-6 text-white" />
        </GlowOrb>
      </motion.div>
      
      {/* Connected nodes */}
      {[
        { angle: 0, icon: Crown, color: "purple", label: "Governance" },
        { angle: 90, icon: Shield, color: "blue", label: "Prevention" },
        { angle: 180, icon: Eye, color: "emerald", label: "Surveillance" },
        { angle: 270, icon: Heart, color: "amber", label: "Restoration" },
      ].map((node, i) => {
        const radius = 80;
        const x = Math.cos((node.angle * Math.PI) / 180) * radius;
        const y = Math.sin((node.angle * Math.PI) / 180) * radius;
        return (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="absolute flex flex-col items-center"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <IconGlow color={node.color as "purple" | "cyan" | "blue" | "emerald" | "amber"}>
              <node.icon className="w-5 h-5 text-white" />
            </IconGlow>
            <span className="text-[10px] text-white/50 mt-1">{node.label}</span>
          </motion.div>
        );
      })}
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: "translate(50%, 50%)" }}>
        {[0, 1, 2, 3].map((i) => {
          const angle1 = i * 90;
          const angle2 = ((i + 1) % 4) * 90;
          const radius = 80;
          const x1 = Math.cos((angle1 * Math.PI) / 180) * radius;
          const y1 = Math.sin((angle1 * Math.PI) / 180) * radius;
          const x2 = Math.cos((angle2 * Math.PI) / 180) * radius;
          const y2 = Math.sin((angle2 * Math.PI) / 180) * radius;
          return (
            <motion.line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(6,182,212,0.3)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
            />
          );
        })}
      </svg>
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

            {/* Main Content - Full-width Consulting Deck Layout */}
            {!showLoader && slide && (
              <div className="flex-1 min-h-0 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
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

                {/* Slide number - Bottom right */}
                <div className="absolute bottom-4 right-4 z-10 flex items-baseline gap-1 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <span className={cn("text-2xl font-bold", c.text)}>
                    {String(currentSlide + 1).padStart(2, '0')}
                  </span>
                  <span className="text-slate-500 text-base">
                    /{String(guideSlides.length).padStart(2, '0')}
                  </span>
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
