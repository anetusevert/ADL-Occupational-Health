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

interface InteractionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
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
// TEMPLE OVERVIEW VISUAL - Building the temple step by step
// ============================================================================

function TempleOverviewVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-8">
      <FloatingParticles color="purple" count={15} />
      
      <div className="relative w-full max-w-md">
        {/* Governance Roof */}
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
          className="relative mb-6"
        >
          <motion.div 
            className="h-24 bg-gradient-to-b from-purple-500/50 to-purple-600/30 rounded-xl border-2 border-purple-400/50 flex items-center justify-center gap-4 shadow-lg shadow-purple-500/20"
            animate={{ boxShadow: ["0 0 20px rgba(147,51,234,0.2)", "0 0 40px rgba(147,51,234,0.4)", "0 0 20px rgba(147,51,234,0.2)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-10 h-10 text-purple-300" />
            <div className="text-left">
              <span className="text-white font-bold text-lg">GOVERNANCE</span>
              <p className="text-purple-300 text-xs">The Overarching Driver</p>
            </div>
          </motion.div>
          
          {/* Connecting arrows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-8"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
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
            ))}
          </motion.div>
        </motion.div>

        {/* Three Pillars */}
        <div className="flex gap-4 mt-8">
          {[
            { icon: Shield, label: "Prevention", sublabel: "Hazard Control", color: "blue", delay: 0.6 },
            { icon: Eye, label: "Vigilance", sublabel: "Surveillance", color: "emerald", delay: 0.75 },
            { icon: Heart, label: "Restoration", sublabel: "Compensation", color: "amber", delay: 0.9 },
          ].map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pillar.delay, duration: 0.5, type: "spring" }}
              className={cn(
                "flex-1 h-36 rounded-xl border-2 flex flex-col items-center justify-center gap-2 shadow-lg",
                pillar.color === "blue" && "bg-blue-500/20 border-blue-400/50 shadow-blue-500/20",
                pillar.color === "emerald" && "bg-emerald-500/20 border-emerald-400/50 shadow-emerald-500/20",
                pillar.color === "amber" && "bg-amber-500/20 border-amber-400/50 shadow-amber-500/20",
              )}
            >
              <pillar.icon className={cn(
                "w-10 h-10",
                pillar.color === "blue" && "text-blue-300",
                pillar.color === "emerald" && "text-emerald-300",
                pillar.color === "amber" && "text-amber-300",
              )} />
              <span className="text-sm font-bold text-white">{pillar.label}</span>
              <span className="text-[10px] text-white/50">{pillar.sublabel}</span>
            </motion.div>
          ))}
        </div>

        {/* Foundation */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-6 h-4 bg-gradient-to-r from-slate-600/30 via-slate-500/50 to-slate-600/30 rounded-full flex items-center justify-center"
        >
          <Database className="w-3 h-3 text-slate-400" />
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

function ConclusionVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <FloatingParticles color="cyan" count={30} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="text-center"
      >
        {/* Animated framework icon */}
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            boxShadow: ["0 0 40px rgba(6,182,212,0.2)", "0 0 60px rgba(6,182,212,0.4)", "0 0 40px rgba(6,182,212,0.2)"]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-36 h-36 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 via-purple-500 to-cyan-600 flex items-center justify-center shadow-2xl"
        >
          <Layers className="w-20 h-20 text-white" />
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

        {/* Quick hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex justify-center gap-4"
        >
          {[
            { icon: Crown, label: "Governance", color: "purple" },
            { icon: Shield, label: "Prevention", color: "blue" },
            { icon: Eye, label: "Vigilance", color: "emerald" },
            { icon: Heart, label: "Restoration", color: "amber" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1 }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                colors[item.color].bgSolid,
                "shadow-lg"
              )}
            >
              <item.icon className="w-6 h-6 text-white" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// GET VISUAL FOR SLIDE
// ============================================================================

function getVisualForSlide(slideId: string) {
  switch (slideId) {
    case "intro": return <IntroVisual />;
    case "overview": return <TempleOverviewVisual />;
    case "governance": return <GovernanceVisual />;
    case "pillar-1": return <HazardPreventionVisual />;
    case "pillar-2": return <SurveillanceVisual />;
    case "pillar-3": return <RestorationVisual />;
    case "integration": return <IntegrationVisual />;
    case "conclusion": return <ConclusionVisual />;
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

// ============================================================================
// CINEMATIC LOADER
// ============================================================================

function CinematicLoader({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [phase, setPhase] = useState<'fade' | 'logo' | 'done'>('fade');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 300);
    const t2 = setTimeout(() => { setPhase('done'); onComplete(); }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
      {/* Particles */}
      {phase === 'logo' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, x: "50%", y: "50%" }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 0.5],
                x: `${50 + (Math.random() - 0.5) * 80}%`,
                y: `${50 + (Math.random() - 0.5) * 80}%`,
              }}
              transition={{ duration: 2, delay: 0.5 + Math.random() * 0.5 }}
              className="absolute w-1 h-1 rounded-full bg-cyan-400"
            />
          ))}
        </div>
      )}

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: phase !== 'fade' ? 1 : 0, scale: phase !== 'fade' ? 1 : 0.5 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ filter: ["drop-shadow(0 0 20px rgba(6,182,212,0.3))", "drop-shadow(0 0 40px rgba(6,182,212,0.5))", "drop-shadow(0 0 20px rgba(6,182,212,0.3))"] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <img src="/adl-logo.png" alt="ADL" className="h-20 mx-auto" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-white font-semibold text-lg"
        >
          ADL Occupational Health Framework
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-2 text-cyan-400 text-sm"
        >
          Version 2.0 — Interactive Guide
        </motion.p>
      </motion.div>

      {/* Skip */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onSkip}
        className="absolute bottom-6 right-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-all"
      >
        Skip Intro
      </motion.button>
    </div>
  );
}

// ============================================================================
// MAIN MODAL
// ============================================================================

export function InteractionGuideModal({ isOpen, onClose }: InteractionGuideModalProps) {
  const [showLoader, setShowLoader] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowLoader(true);
      setCurrentSlide(0);
    }
  }, [isOpen]);

  const handleLoaderComplete = useCallback(() => setShowLoader(false), []);

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

  // Keyboard
  useEffect(() => {
    if (!isOpen || showLoader) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showLoader, nextSlide, prevSlide, onClose]);

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-2 sm:inset-4 md:inset-6 lg:inset-10 xl:inset-12 bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700/50 z-50 overflow-hidden flex flex-col"
          >
            {/* Loader */}
            <AnimatePresence>
              {showLoader && (
                <CinematicLoader onComplete={handleLoaderComplete} onSkip={onClose} />
              )}
            </AnimatePresence>

            {/* Close */}
            {!showLoader && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
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
                      {getVisualForSlide(slide.id)}
                    </motion.div>
                  </AnimatePresence>

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

            {/* Skip Tour Link - Hidden on mobile for space */}
            {!showLoader && (
              <div className="flex-shrink-0 px-3 sm:px-6 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <button onClick={onClose} className="hover:text-white transition-colors">
                  Skip Tour
                </button>
                <div className="hidden sm:flex gap-4">
                  <span>← → Navigate</span>
                  <span>Space = Next</span>
                  <span>Esc = Close</span>
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
