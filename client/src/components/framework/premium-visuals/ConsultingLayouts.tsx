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
        "w-full flex-shrink-0 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 border-b border-white/10",
        "bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95",
        "backdrop-blur-xl relative overflow-hidden"
      )}
    >
      {/* Animated accent line */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
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
        "flex items-start gap-2 sm:gap-3",
        align === "center" ? "justify-center text-center" : "justify-between"
      )}>
        <div className={cn("flex-1 min-w-0", align === "center" && "flex flex-col items-center")}>
          {/* Action Title - Viewport-scaled typography */}
          <div className="flex items-center gap-2 sm:gap-3">
            {icon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, delay: 0.15 }}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0",
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
              className="text-[clamp(1rem,2.5vw,1.75rem)] font-bold text-white tracking-tight leading-tight"
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
                "mt-1 text-[clamp(0.65rem,1.2vw,0.875rem)]", 
                styles.accent, 
                "font-medium tracking-wide",
                icon && "ml-10 sm:ml-12"
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
            className="hidden md:flex items-center gap-2 flex-shrink-0"
          >
            <img src="/adl-logo.png" alt="ADL" className="h-5 lg:h-6 object-contain opacity-80 hover:opacity-100 transition-opacity" />
            <div className="w-px h-4 bg-white/20" />
            <img src="/gosi-logo.png" alt="GOSI" className="h-5 lg:h-6 object-contain opacity-80 hover:opacity-100 transition-opacity" />
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
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const sizes = {
    sm: { value: "text-[clamp(1.25rem,3vw,1.75rem)]", label: "text-[clamp(0.5rem,1vw,0.7rem)]", padding: "p-2 sm:p-3" },
    md: { value: "text-[clamp(1.5rem,4vw,2.5rem)]", label: "text-[clamp(0.55rem,1.1vw,0.75rem)]", padding: "p-2 sm:p-3 md:p-4" },
    lg: { value: "text-[clamp(1.75rem,5vw,3rem)]", label: "text-[clamp(0.6rem,1.2vw,0.875rem)]", padding: "p-2 sm:p-4" },
  };

  return (
    <div className={cn("grid gap-2 sm:gap-3 flex-shrink-0", gridCols[columns])}>
      {stats.map((stat, i) => {
        const styles = colorStyles[stat.color || "cyan"];
        return (
          <HeroReveal key={i} delay={0.15 + i * 0.08} direction="up">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "relative rounded-lg sm:rounded-xl border overflow-hidden",
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
                  <div className={cn("mb-1 flex justify-center", styles.accent)}>
                    {stat.icon}
                  </div>
                )}
                
                <div className={cn(sizes[size].value, "font-bold text-white tabular-nums leading-none")}>
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
                  "text-white/60 mt-0.5 sm:mt-1 font-semibold uppercase tracking-wider leading-tight"
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
          "relative rounded-lg sm:rounded-xl border overflow-hidden flex-shrink-0",
          variant === "quote" 
            ? "bg-gradient-to-br from-white/5 to-transparent border-l-2 sm:border-l-4 border-l-white/40 border-t-0 border-r-0 border-b-0"
            : cn(styles.bg, styles.border),
          "p-2 sm:p-3"
        )}
      >
        {variant !== "quote" && <ShimmerOverlay delay={0.5} duration={4} />}

        <div className="relative z-10">
          {variant === "quote" ? (
            <div className="flex gap-2">
              <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[clamp(0.7rem,1.3vw,0.875rem)] text-white/90 italic leading-snug line-clamp-2">
                  "{insight}"
                </p>
                {source && (
                  <p className="mt-1 text-[clamp(0.5rem,0.9vw,0.65rem)] text-white/50">— {source}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              {icon || (
                <div className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0",
                  styles.bg, styles.border, "border"
                )}>
                  <TrendingUp className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", styles.accent)} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[clamp(0.7rem,1.3vw,0.875rem)] text-white font-medium leading-snug line-clamp-2">
                  {insight}
                </p>
                {source && (
                  <p className="mt-1 text-[clamp(0.5rem,0.9vw,0.65rem)] text-white/50">Source: {source}</p>
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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative rounded-lg sm:rounded-xl border overflow-hidden p-2 sm:p-3 h-full",
          highlighted 
            ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border-cyan-400/50"
            : cn(styles.bg, styles.border),
          "group cursor-default transform-gpu"
        )}
      >
        <ShimmerOverlay delay={delay + 0.15} duration={3.5} />
        
        {highlighted && (
          <motion.div
            className="absolute top-1.5 right-1.5"
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
          </motion.div>
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
            {flag && (
              <motion.span 
                className="text-lg sm:text-xl md:text-2xl"
                animate={highlighted ? { scale: [1, 1.08, 1] } : undefined}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {flag}
              </motion.span>
            )}
            <h3 className="text-[clamp(0.75rem,1.4vw,1rem)] font-bold text-white leading-tight">{title}</h3>
          </div>

          <div className={cn(
            "text-[clamp(0.8rem,1.6vw,1.125rem)] font-bold leading-tight",
            highlighted ? "text-cyan-400" : styles.accent
          )}>
            {achievement}
          </div>

          {detail && (
            <p className="text-[clamp(0.55rem,1vw,0.75rem)] text-white/60 mt-0.5 leading-tight line-clamp-1">{detail}</p>
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
      "grid gap-1.5 sm:gap-2 flex-1 min-h-0",
      columns === 2 ? "grid-cols-2" : "grid-cols-1"
    )}>
      {points.map((point, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: startDelay + i * 0.05,
            ease: [0.22, 1, 0.36, 1]
          }}
          className={cn(
            "flex items-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md sm:rounded-lg",
            styles.bg, styles.border, "border",
            "hover:bg-white/5 transition-colors duration-200"
          )}
        >
          <CheckCircle className={cn("w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0", styles.accent)} />
          <span className="text-[clamp(0.6rem,1.1vw,0.8rem)] text-white/90 leading-snug line-clamp-2">{point}</span>
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
      "flex-1 min-h-0 relative overflow-hidden",
      "bg-gradient-to-br from-slate-900 via-slate-800/95 to-slate-900",
      className
    )}>
      {/* Ambient particles */}
      {withParticles && (
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <ParticleField count={20} color={particleColor} speed={0.2} />
        </div>
      )}
      
      {/* Content - No scrolling, flex-fit layout */}
      <div className="relative z-10 h-full flex flex-col px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8 lg:py-5 overflow-hidden">
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
        "flex items-center justify-center gap-2 sm:gap-3 flex-shrink-0",
        variant === "compact" ? "py-1" : "py-2 sm:py-3",
        className
      )}
    >
      <motion.img
        src="/adl-logo.png"
        alt="Arthur D. Little"
        className={cn("object-contain", variant === "compact" ? "h-4 sm:h-5" : "h-6 sm:h-8")}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className={cn(
        "bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full",
        variant === "compact" ? "w-4 sm:w-5 h-px" : "w-8 sm:w-10 h-0.5"
      )} />
      <motion.img
        src="/gosi-logo.png"
        alt="GOSI"
        className={cn("object-contain", variant === "compact" ? "h-4 sm:h-5" : "h-6 sm:h-8")}
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
      className="flex items-center gap-2 sm:gap-3 my-2 sm:my-3 flex-shrink-0"
    >
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {label && (
        <span className={cn("text-[clamp(0.5rem,1vw,0.7rem)] font-semibold uppercase tracking-wider", styles.accent)}>
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </motion.div>
  );
}
