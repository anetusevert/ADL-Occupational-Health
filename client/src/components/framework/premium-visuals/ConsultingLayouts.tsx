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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "w-full px-8 py-5 border-b border-white/10",
        "bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90",
        "backdrop-blur-xl relative overflow-hidden"
      )}
    >
      {/* Subtle animated gradient line */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      />

      <div className={cn(
        "flex items-start gap-4",
        align === "center" ? "justify-center text-center" : "justify-between"
      )}>
        <div className={cn("flex-1", align === "center" && "flex flex-col items-center")}>
          {/* Action Title - Large, Bold, Statement */}
          <div className="flex items-center gap-3">
            {icon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  styles.bg, styles.border, "border"
                )}
              >
                {icon}
              </motion.div>
            )}
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight"
            >
              {actionTitle}
            </motion.h1>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={cn("mt-2 text-sm md:text-base", styles.accent, "font-medium")}
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
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-3"
          >
            <img src="/adl-logo.png" alt="ADL" className="h-8 object-contain opacity-80" />
            <div className="w-px h-6 bg-white/20" />
            <img src="/gosi-logo.png" alt="GOSI" className="h-8 object-contain opacity-80" />
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
    sm: { value: "text-2xl md:text-3xl", label: "text-xs", padding: "p-4" },
    md: { value: "text-3xl md:text-4xl", label: "text-sm", padding: "p-5" },
    lg: { value: "text-4xl md:text-5xl", label: "text-base", padding: "p-6" },
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {stats.map((stat, i) => {
        const styles = colorStyles[stat.color || "cyan"];
        return (
          <HeroReveal key={i} delay={0.2 + i * 0.1} direction="up">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className={cn(
                "relative rounded-2xl border overflow-hidden",
                styles.bg, styles.border,
                sizes[size].padding,
                "group cursor-default"
              )}
            >
              <ShimmerOverlay delay={0.5 + i * 0.15} duration={3} />
              
              {/* Glow effect on hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                "bg-gradient-to-br from-white/5 to-transparent"
              )} />

              <div className="relative z-10 text-center">
                {stat.icon && (
                  <div className={cn("mb-2 flex justify-center", styles.accent)}>
                    {stat.icon}
                  </div>
                )}
                
                <div className={cn(sizes[size].value, "font-bold text-white")}>
                  {stat.prefix}
                  {animated && typeof stat.value === "number" ? (
                    <NumberCounter 
                      value={stat.value} 
                      duration={1.5} 
                      delay={0.3 + i * 0.1}
                    />
                  ) : (
                    stat.value
                  )}
                  {stat.suffix && (
                    <span className={styles.accent}>{stat.suffix}</span>
                  )}
                </div>
                
                <p className={cn(
                  sizes[size].label, 
                  "text-white/60 mt-1 font-medium uppercase tracking-wider"
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
    <HeroReveal delay={0.4} direction="up">
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={cn(
          "relative rounded-2xl border overflow-hidden",
          variant === "quote" 
            ? "bg-gradient-to-br from-white/5 to-transparent border-l-4 border-l-white/40 border-t-0 border-r-0 border-b-0"
            : cn(styles.bg, styles.border),
          "p-5"
        )}
      >
        {variant !== "quote" && <ShimmerOverlay delay={0.6} duration={4} />}

        <div className="relative z-10">
          {variant === "quote" ? (
            <div className="flex gap-3">
              <Quote className="w-6 h-6 text-white/40 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white/90 italic text-base leading-relaxed">
                  "{insight}"
                </p>
                {source && (
                  <p className="mt-2 text-xs text-white/50">— {source}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              {icon || (
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  styles.bg, styles.border, "border"
                )}>
                  <TrendingUp className={cn("w-4 h-4", styles.accent)} />
                </div>
              )}
              <div>
                <p className="text-white font-medium leading-relaxed">
                  {insight}
                </p>
                {source && (
                  <p className="mt-2 text-xs text-white/50">Source: {source}</p>
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
        whileHover={{ scale: 1.03, y: -4 }}
        className={cn(
          "relative rounded-2xl border overflow-hidden p-5",
          highlighted 
            ? "bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border-cyan-400/50"
            : cn(styles.bg, styles.border),
          "group cursor-default"
        )}
      >
        <ShimmerOverlay delay={delay + 0.2} duration={3} />
        
        {highlighted && (
          <motion.div
            className="absolute top-2 right-2"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </motion.div>
        )}

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            {flag && (
              <motion.span 
                className="text-3xl"
                animate={highlighted ? { scale: [1, 1.1, 1] } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {flag}
              </motion.span>
            )}
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>

          <div className={cn(
            "text-xl font-bold mb-2",
            highlighted ? "text-cyan-400" : styles.accent
          )}>
            {achievement}
          </div>

          {detail && (
            <p className="text-sm text-white/60">{detail}</p>
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
      "grid gap-3",
      columns === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
    )}>
      {points.map((point, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: startDelay + i * 0.08 }}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl",
            styles.bg, styles.border, "border"
          )}
        >
          <CheckCircle className={cn("w-5 h-5 mt-0.5 flex-shrink-0", styles.accent)} />
          <span className="text-sm text-white/90 leading-relaxed">{point}</span>
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
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <ParticleField count={30} color={particleColor} speed={0.3} />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full p-6 md:p-8 overflow-auto">
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
