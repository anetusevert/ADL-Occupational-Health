/**
 * McKinsey/BCG Style Consulting Slide Layout Components
 * 
 * Professional consulting deck components with action titles,
 * visual hierarchy, and animated data presentation.
 */

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { 
  HeroReveal, 
  ScaleReveal, 
  DramaticTextReveal, 
  ShimmerOverlay,
  PulseRing 
} from "./HeroReveal";
import { NumberCounter } from "./NumberCounter";
import { GlowOrb, FloatingGlowOrb } from "./GlowOrb";
import { ParticleField } from "./ParticleField";
import { CheckCircle, Quote, TrendingUp, Sparkles } from "lucide-react";

// ============================================================================
// CONSULTING SLIDE HEADER
// Action title at top with subtitle - McKinsey style
// ============================================================================

interface ConsultingSlideHeaderProps {
  actionTitle: string;
  subtitle?: string;
  icon?: ReactNode;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  align?: "left" | "center";
  showLogos?: boolean;
}

const colorStyles = {
  purple: {
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
  },
  blue: {
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
  },
  emerald: {
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
  },
  cyan: {
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
  },
};

export function ConsultingSlideHeader({
  actionTitle,
  subtitle,
  icon,
  color = "cyan",
  align = "left",
  showLogos = false,
}: ConsultingSlideHeaderProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "w-full px-6 md:px-10 py-4 md:py-6 border-b border-white/10",
        "bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95",
        "backdrop-blur-xl relative overflow-hidden"
      )}
    >
      {/* Animated accent line */}
      <motion.div
        className={cn(
          "absolute bottom-0 left-0 h-[2px]",
          `bg-gradient-to-r from-transparent via-${color === "cyan" ? "cyan-500" : color === "purple" ? "purple-500" : color === "blue" ? "blue-500" : color === "emerald" ? "emerald-500" : "amber-500"} to-transparent`
        )}
        style={{
          background: `linear-gradient(to right, transparent, ${
            color === "cyan" ? "#06b6d4" : 
            color === "purple" ? "#9333ea" : 
            color === "blue" ? "#2563eb" : 
            color === "emerald" ? "#10b981" : 
            "#f59e0b"
          }, transparent)`
        }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 0.8 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className={cn(
        "flex items-start gap-4",
        align === "center" ? "justify-center text-center" : "justify-between"
      )}>
        <div className={cn("flex-1", align === "center" && "flex flex-col items-center")}>
          {/* Action Title - Large, Bold, McKinsey Statement */}
          <div className="flex items-center gap-4">
            {icon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, delay: 0.15 }}
                className={cn(
                  "w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center",
                  styles.bg, styles.border, "border shadow-lg",
                  styles.glow
                )}
              >
                {icon}
              </motion.div>
            )}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-xl sm:text-2xl md:text-[28px] lg:text-3xl font-bold text-white tracking-tight leading-tight"
            >
              {actionTitle}
            </motion.h1>
          </div>

          {/* Subtitle - Contextual tag */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
              className={cn(
                "mt-2 text-sm md:text-base", 
                styles.accent, 
                "font-medium tracking-wide",
                icon && "ml-14 md:ml-16"
              )}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Logo Bar (optional) */}
        {showLogos && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="hidden sm:flex items-center gap-3"
          >
            <img src="/adl-logo.png" alt="ADL" className="h-7 md:h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
            <div className="w-px h-5 bg-white/20" />
            <img src="/gosi-logo.png" alt="GOSI" className="h-7 md:h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// STAT GRID - Animated KPI cards
// ============================================================================

interface StatItem {
  value: number | string;
  label: string;
  suffix?: string;
  prefix?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  icon?: ReactNode;
}

interface StatGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function StatGrid({ 
  stats, 
  columns = 3, 
  size = "md",
  animated = true 
}: StatGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  const sizes = {
    sm: { value: "text-2xl sm:text-3xl", label: "text-xs", padding: "p-3 sm:p-4" },
    md: { value: "text-2xl sm:text-3xl md:text-4xl", label: "text-xs sm:text-sm", padding: "p-3 sm:p-4 md:p-5" },
    lg: { value: "text-3xl sm:text-4xl md:text-5xl", label: "text-sm md:text-base", padding: "p-4 sm:p-5 md:p-6" },
  };

  return (
    <div className={cn("grid gap-3 sm:gap-4", gridCols[columns])}>
      {stats.map((stat, i) => {
        const styles = colorStyles[stat.color || "cyan"];
        return (
          <HeroReveal key={i} delay={0.15 + i * 0.08} direction="up">
            <motion.div
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "relative rounded-xl sm:rounded-2xl border overflow-hidden",
                styles.bg, styles.border,
                sizes[size].padding,
                "group cursor-default",
                "transform-gpu will-change-transform"
              )}
            >
              <ShimmerOverlay delay={0.4 + i * 0.12} duration={3.5} />
              
              {/* Glow effect on hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-gradient-to-br from-white/5 to-transparent"
              )} />

              <div className="relative z-10 text-center">
                {stat.icon && (
                  <div className={cn("mb-2 flex justify-center", styles.accent)}>
                    {stat.icon}
                  </div>
                )}
                
                <div className={cn(sizes[size].value, "font-bold text-white tabular-nums")}>
                  {stat.prefix}
                  {animated && typeof stat.value === "number" ? (
                    <NumberCounter 
                      value={stat.value} 
                      duration={1.2} 
                      delay={0.25 + i * 0.08}
                    />
                  ) : (
                    stat.value
                  )}
                  {stat.suffix && (
                    <span className={cn(styles.accent, "ml-0.5")}>{stat.suffix}</span>
                  )}
                </div>
                
                <p className={cn(
                  sizes[size].label, 
                  "text-white/60 mt-1 sm:mt-1.5 font-semibold uppercase tracking-wider"
                )}>
                  {stat.label}
                </p>
              </div>
            </motion.div>
          </HeroReveal>
        );
      })}
    </div>
  );
}

// ============================================================================
// INSIGHT BOX - Highlighted key insight callout
// ============================================================================

interface InsightBoxProps {
  insight: string;
  source?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  variant?: "quote" | "stat" | "callout";
  icon?: ReactNode;
}

export function InsightBox({
  insight,
  source,
  color = "cyan",
  variant = "callout",
  icon,
}: InsightBoxProps) {
  const styles = colorStyles[color];

  return (
    <HeroReveal delay={0.35} direction="up">
      <motion.div
        whileHover={{ scale: 1.005 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "relative rounded-xl sm:rounded-2xl border overflow-hidden",
          variant === "quote" 
            ? "bg-gradient-to-br from-white/5 to-transparent border-l-4 border-l-white/40 border-t-0 border-r-0 border-b-0"
            : cn(styles.bg, styles.border),
          "p-3 sm:p-4 md:p-5"
        )}
      >
        {variant !== "quote" && <ShimmerOverlay delay={0.5} duration={4} />}

        <div className="relative z-10">
          {variant === "quote" ? (
            <div className="flex gap-2 sm:gap-3">
              <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 flex-shrink-0 mt-0.5 sm:mt-1" />
              <div>
                <p className="text-sm sm:text-base text-white/90 italic leading-relaxed">
                  "{insight}"
                </p>
                {source && (
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-white/50">— {source}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 sm:gap-3">
              {icon || (
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  styles.bg, styles.border, "border"
                )}>
                  <TrendingUp className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", styles.accent)} />
                </div>
              )}
              <div>
                <p className="text-sm sm:text-base text-white font-medium leading-relaxed">
                  {insight}
                </p>
                {source && (
                  <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-white/50">Source: {source}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </HeroReveal>
  );
}

// ============================================================================
// EVIDENCE CARD - Country/case study cards
// ============================================================================

interface EvidenceCardProps {
  flag?: string;
  title: string;
  achievement: string;
  detail?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  delay?: number;
  highlighted?: boolean;
}

export function EvidenceCard({
  flag,
  title,
  achievement,
  detail,
  color = "cyan",
  delay = 0,
  highlighted = false,
}: EvidenceCardProps) {
  const styles = colorStyles[color];

  return (
    <HeroReveal delay={delay} direction="up">
      <motion.div
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative rounded-xl sm:rounded-2xl border overflow-hidden p-3 sm:p-4 md:p-5",
          highlighted 
            ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border-cyan-400/50"
            : cn(styles.bg, styles.border),
          "group cursor-default transform-gpu"
        )}
      >
        <ShimmerOverlay delay={delay + 0.15} duration={3.5} />
        
        {highlighted && (
          <motion.div
            className="absolute top-2 right-2"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          </motion.div>
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            {flag && (
              <motion.span 
                className="text-2xl sm:text-3xl"
                animate={highlighted ? { scale: [1, 1.08, 1] } : undefined}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {flag}
              </motion.span>
            )}
            <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
          </div>

          <div className={cn(
            "text-lg sm:text-xl font-bold mb-1 sm:mb-2",
            highlighted ? "text-cyan-400" : styles.accent
          )}>
            {achievement}
          </div>

          {detail && (
            <p className="text-xs sm:text-sm text-white/60">{detail}</p>
          )}
        </div>
      </motion.div>
    </HeroReveal>
  );
}

// ============================================================================
// KEY POINTS LIST - Bullet points with animation
// ============================================================================

interface KeyPointsListProps {
  points: string[];
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  columns?: 1 | 2;
  startDelay?: number;
}

export function KeyPointsList({
  points,
  color = "cyan",
  columns = 1,
  startDelay = 0.3,
}: KeyPointsListProps) {
  const styles = colorStyles[color];

  return (
    <div className={cn(
      "grid gap-2 sm:gap-3",
      columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
    )}>
      {points.map((point, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.35, 
            delay: startDelay + i * 0.06,
            ease: [0.22, 1, 0.36, 1]
          }}
          className={cn(
            "flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl",
            styles.bg, styles.border, "border",
            "hover:bg-white/5 transition-colors duration-200"
          )}
        >
          <CheckCircle className={cn("w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0", styles.accent)} />
          <span className="text-xs sm:text-sm text-white/90 leading-relaxed">{point}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// SLIDE BODY WRAPPER - Consistent padding and structure
// ============================================================================

interface SlideBodyProps {
  children: ReactNode;
  className?: string;
  withParticles?: boolean;
  particleColor?: string;
}

export function SlideBody({ 
  children, 
  className,
  withParticles = true,
  particleColor = "rgba(6,182,212,0.3)"
}: SlideBodyProps) {
  return (
    <div className={cn(
      "flex-1 relative overflow-hidden",
      "bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900",
      className
    )}>
      {/* Ambient particles */}
      {withParticles && (
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <ParticleField count={25} color={particleColor} speed={0.25} />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 lg:px-10 lg:py-8 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// LOGO BAR - ADL + GOSI branding
// ============================================================================

interface LogoBarProps {
  variant?: "full" | "compact";
  className?: string;
}

export function LogoBar({ variant = "full", className }: LogoBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={cn(
        "flex items-center justify-center gap-4",
        variant === "compact" ? "py-2" : "py-4",
        className
      )}
    >
      <motion.img
        src="/adl-logo.png"
        alt="Arthur D. Little"
        className={cn("object-contain", variant === "compact" ? "h-6" : "h-10")}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className={cn(
        "bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full",
        variant === "compact" ? "w-6 h-px" : "w-12 h-0.5"
      )} />
      <motion.img
        src="/gosi-logo.png"
        alt="GOSI"
        className={cn("object-contain", variant === "compact" ? "h-6" : "h-10")}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      />
    </motion.div>
  );
}

// ============================================================================
// SECTION DIVIDER - Visual separator with label
// ============================================================================

interface SectionDividerProps {
  label?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
}

export function SectionDivider({ label, color = "cyan" }: SectionDividerProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex items-center gap-4 my-6"
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {label && (
        <span className={cn("text-xs font-semibold uppercase tracking-wider", styles.accent)}>
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </motion.div>
  );
}
