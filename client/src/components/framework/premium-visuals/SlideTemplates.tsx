/**
 * McKinsey/BCG Style Slide Layout Templates
 * 
 * Five distinct layouts for different content types:
 * 1. HeroSlideLayout - Intro and CTA slides
 * 2. DataImpactLayout - Challenge and opportunity slides  
 * 3. FrameworkLayout - Overview and integration slides
 * 4. ComponentLayout - Governance and pillar slides
 * 5. EvidenceLayout - Success stories and solution slides
 */

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import { 
  ConsultingSlideHeader,
  StatGrid,
  InsightBox,
  KeyPointsList,
  SlideBody,
  LogoBar,
  SectionDivider,
  EvidenceCard,
} from "./ConsultingLayouts";
import { 
  HeroReveal, 
  ScaleReveal, 
  DramaticTextReveal,
  ShimmerOverlay,
  PulseRing,
} from "./HeroReveal";
import { ParticleField } from "./ParticleField";
import { GlowOrb, FloatingGlowOrb } from "./GlowOrb";
import { Play, Sparkles } from "lucide-react";

// ============================================================================
// 1. HERO SLIDE LAYOUT - For intro and CTA slides
// Large centered visual with action title below
// ============================================================================

interface HeroSlideLayoutProps {
  actionTitle: string;
  subtitle?: string;
  description?: string;
  highlights?: string[];
  visual: ReactNode;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  showLogos?: boolean;
  ctaButton?: {
    label: string;
    onClick: () => void;
  };
}

export function HeroSlideLayout({
  actionTitle,
  subtitle,
  description,
  highlights,
  visual,
  color = "cyan",
  showLogos = true,
  ctaButton,
}: HeroSlideLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <ParticleField count={25} color="rgba(6,182,212,0.3)" speed={0.2} />
      </div>

      {/* Floating glow orbs - hidden on small screens */}
      <FloatingGlowOrb color="purple" size="md" className="absolute top-12 left-6 opacity-15 hidden md:block" />
      <FloatingGlowOrb color="cyan" size="sm" className="absolute bottom-20 right-12 opacity-15 hidden md:block" />

      {/* Logo bar at top */}
      {showLogos && (
        <div className="relative z-10 pt-2 sm:pt-3 flex-shrink-0">
          <LogoBar variant="compact" />
        </div>
      )}

      {/* Main content area - No scroll, flex-fit */}
      <div className="flex-1 min-h-0 relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 overflow-hidden">
        {/* Visual area - scales to fit */}
        <div className="w-full max-w-[200px] sm:max-w-[280px] md:max-w-[360px] lg:max-w-md mb-2 sm:mb-3 flex items-center justify-center flex-shrink-0">
          <ScaleReveal delay={0.15}>
            {visual}
          </ScaleReveal>
        </div>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-32 sm:w-48 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-2 sm:mb-3 flex-shrink-0"
        />

        {/* Action Title - Viewport-scaled */}
        <HeroReveal delay={0.25} direction="up">
          <h1 className="text-[clamp(1.25rem,4vw,2.5rem)] font-bold text-white text-center tracking-tight leading-tight max-w-4xl px-2">
            {actionTitle}
          </h1>
        </HeroReveal>

        {/* Subtitle */}
        {subtitle && (
          <HeroReveal delay={0.35} direction="up">
            <p className="mt-1 sm:mt-2 text-[clamp(0.75rem,1.8vw,1.125rem)] text-cyan-400 font-medium text-center">
              {subtitle}
            </p>
          </HeroReveal>
        )}

        {/* Description */}
        {description && (
          <HeroReveal delay={0.45} direction="up">
            <p className="mt-1 sm:mt-2 text-[clamp(0.65rem,1.3vw,0.875rem)] text-white/70 text-center max-w-2xl leading-snug px-2 line-clamp-2">
              {description}
            </p>
          </HeroReveal>
        )}

        {/* Highlights as horizontal badges */}
        {highlights && highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 sm:mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2 flex-shrink-0"
          >
            {highlights.slice(0, 3).map((highlight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.08, ease: "easeOut" }}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 border border-white/10 rounded-full"
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                <span className="text-[clamp(0.55rem,1vw,0.75rem)] text-white/80">{highlight}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA Button */}
        {ctaButton && (
          <HeroReveal delay={0.75} direction="up">
            <motion.button
              onClick={ctaButton.onClick}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6,182,212,0.4)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg sm:rounded-xl text-white font-bold text-[clamp(0.75rem,1.5vw,1rem)] shadow-lg shadow-cyan-500/30 relative overflow-hidden group flex-shrink-0"
            >
              <ShimmerOverlay delay={0.9} duration={3} />
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {ctaButton.label}
              </span>
            </motion.button>
          </HeroReveal>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. DATA IMPACT LAYOUT - For challenge and opportunity slides
// Stats grid with supporting insights
// ============================================================================

interface StatData {
  value: number | string;
  suffix?: string;
  prefix?: string;
  label: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
}

interface DataImpactLayoutProps {
  actionTitle: string;
  subtitle?: string;
  stats: StatData[];
  highlights?: string[];
  insight?: string;
  insightSource?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  icon?: ReactNode;
  visual?: ReactNode;
}

export function DataImpactLayout({
  actionTitle,
  subtitle,
  stats,
  highlights,
  insight,
  insightSource,
  color = "amber",
  icon,
  visual,
}: DataImpactLayoutProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <ConsultingSlideHeader
        actionTitle={actionTitle}
        subtitle={subtitle}
        icon={icon}
        color={color}
      />

      {/* Body - No scroll */}
      <SlideBody particleColor={color === "amber" ? "rgba(245,158,11,0.2)" : "rgba(6,182,212,0.2)"}>
        <div className="h-full flex flex-col max-w-5xl mx-auto min-h-0">
          {/* Optional visual at top - compact */}
          {visual && (
            <div className="mb-2 sm:mb-3 flex justify-center flex-shrink-0">
              <ScaleReveal delay={0.15}>
                {visual}
              </ScaleReveal>
            </div>
          )}

          {/* Stats Grid - Main focus */}
          <div className="mb-2 sm:mb-3 flex-shrink-0">
            <StatGrid 
              stats={stats} 
              columns={stats.length > 3 ? 4 : 3} 
              size="md" 
            />
          </div>

          {/* Divider */}
          <SectionDivider label="Key Insights" color={color} />

          {/* Key Points - Flex to fill */}
          {highlights && highlights.length > 0 && (
            <div className="flex-1 min-h-0 mb-2">
              <KeyPointsList 
                points={highlights.slice(0, 4)} 
                color={color} 
                columns={2} 
              />
            </div>
          )}

          {/* Insight Box */}
          {insight && (
            <div className="flex-shrink-0">
              <InsightBox
                insight={insight}
                source={insightSource}
                color={color}
                variant="quote"
              />
            </div>
          )}
        </div>
      </SlideBody>
    </div>
  );
}

// ============================================================================
// 3. FRAMEWORK LAYOUT - For overview and integration slides
// Centered visual with key points below
// ============================================================================

interface FrameworkLayoutProps {
  actionTitle: string;
  subtitle?: string;
  visual: ReactNode;
  highlights?: string[];
  insight?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  icon?: ReactNode;
}

export function FrameworkLayout({
  actionTitle,
  subtitle,
  visual,
  highlights,
  insight,
  color = "purple",
  icon,
}: FrameworkLayoutProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <ConsultingSlideHeader
        actionTitle={actionTitle}
        subtitle={subtitle}
        icon={icon}
        color={color}
      />

      {/* Body - No scroll */}
      <SlideBody particleColor="rgba(147,51,234,0.2)">
        <div className="h-full flex flex-col items-center max-w-4xl mx-auto min-h-0">
          {/* Framework Visual - Center stage, flex to fit */}
          <div className="flex-1 min-h-0 flex items-center justify-center w-full py-1 sm:py-2">
            <ScaleReveal delay={0.15}>
              <div className="w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] flex justify-center">
                {visual}
              </div>
            </ScaleReveal>
          </div>

          {/* Key Points below visual */}
          {highlights && highlights.length > 0 && (
            <div className="w-full flex-shrink-0">
              <SectionDivider label="Key Elements" color={color} />
              <KeyPointsList 
                points={highlights.slice(0, 4)} 
                color={color} 
                columns={2} 
              />
            </div>
          )}

          {/* Insight at bottom */}
          {insight && (
            <div className="w-full mt-2 flex-shrink-0">
              <InsightBox
                insight={insight}
                color={color}
                variant="callout"
              />
            </div>
          )}
        </div>
      </SlideBody>
    </div>
  );
}

// ============================================================================
// 4. COMPONENT LAYOUT - For governance and pillar slides
// Split layout with visual on left, content on right
// ============================================================================

interface ComponentLayoutProps {
  actionTitle: string;
  subtitle?: string;
  description?: string;
  visual: ReactNode;
  highlights?: string[];
  insight?: string;
  insightSource?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  icon?: ReactNode;
}

export function ComponentLayout({
  actionTitle,
  subtitle,
  description,
  visual,
  highlights,
  insight,
  insightSource,
  color = "blue",
  icon,
}: ComponentLayoutProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <ConsultingSlideHeader
        actionTitle={actionTitle}
        subtitle={subtitle}
        icon={icon}
        color={color}
      />

      {/* Body - Two column layout, no scroll */}
      <SlideBody>
        <div className="h-full flex flex-row gap-3 sm:gap-4 max-w-6xl mx-auto min-h-0">
          {/* Left: Visual - Always side by side */}
          <div className="w-2/5 flex items-center justify-center flex-shrink-0">
            <ScaleReveal delay={0.15}>
              <div className="relative w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] flex items-center justify-center">
                {visual}
              </div>
            </ScaleReveal>
          </div>

          {/* Right: Content - Flex column, no scroll */}
          <div className="w-3/5 flex flex-col min-h-0 justify-center">
            {/* Description - Truncated */}
            {description && (
              <HeroReveal delay={0.25} direction="left">
                <p className="text-[clamp(0.65rem,1.2vw,0.875rem)] text-white/80 leading-snug mb-2 sm:mb-3 line-clamp-3 flex-shrink-0">
                  {description}
                </p>
              </HeroReveal>
            )}

            {/* Key Elements - Flex to fill */}
            {highlights && highlights.length > 0 && (
              <div className="flex-1 min-h-0 flex flex-col">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-[clamp(0.5rem,0.9vw,0.7rem)] font-semibold uppercase tracking-wider text-white/50 mb-1 sm:mb-2 flex-shrink-0"
                >
                  Key Elements
                </motion.h3>
                <KeyPointsList 
                  points={highlights.slice(0, 4)} 
                  color={color} 
                  startDelay={0.4}
                />
              </div>
            )}

            {/* Insight Box */}
            {insight && (
              <div className="flex-shrink-0 mt-2">
                <InsightBox
                  insight={insight}
                  source={insightSource}
                  color={color}
                  variant="quote"
                />
              </div>
            )}
          </div>
        </div>
      </SlideBody>
    </div>
  );
}

// ============================================================================
// 5. EVIDENCE LAYOUT - For success stories and solution slides
// Grid of evidence cards with summary
// ============================================================================

interface EvidenceData {
  flag?: string;
  title: string;
  achievement: string;
  detail?: string;
  highlighted?: boolean;
}

interface EvidenceLayoutProps {
  actionTitle: string;
  subtitle?: string;
  description?: string;
  evidence: EvidenceData[];
  highlights?: string[];
  insight?: string;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan";
  icon?: ReactNode;
  gridColumns?: 2 | 3 | 4;
}

export function EvidenceLayout({
  actionTitle,
  subtitle,
  description,
  evidence,
  highlights,
  insight,
  color = "emerald",
  icon,
  gridColumns = 2,
}: EvidenceLayoutProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <ConsultingSlideHeader
        actionTitle={actionTitle}
        subtitle={subtitle}
        icon={icon}
        color={color}
      />

      {/* Body - No scroll */}
      <SlideBody particleColor="rgba(16,185,129,0.2)">
        <div className="h-full flex flex-col max-w-5xl mx-auto min-h-0">
          {/* Description - Compact */}
          {description && (
            <HeroReveal delay={0.15} direction="up">
              <p className="text-[clamp(0.65rem,1.2vw,0.875rem)] text-white/80 leading-snug mb-2 sm:mb-3 text-center max-w-3xl mx-auto line-clamp-2 flex-shrink-0">
                {description}
              </p>
            </HeroReveal>
          )}

          {/* Evidence Grid - Flex to fill */}
          <div className={cn("grid gap-2 sm:gap-3 flex-1 min-h-0", gridCols[gridColumns])}>
            {evidence.slice(0, 4).map((item, i) => (
              <EvidenceCard
                key={i}
                flag={item.flag}
                title={item.title}
                achievement={item.achievement}
                detail={item.detail}
                highlighted={item.highlighted}
                color={color}
                delay={0.2 + i * 0.06}
              />
            ))}
          </div>

          {/* Key points - Limited */}
          {highlights && highlights.length > 0 && (
            <div className="mt-2 flex-shrink-0">
              <SectionDivider label="Key Takeaways" color={color} />
              <KeyPointsList 
                points={highlights.slice(0, 2)} 
                color={color} 
                columns={2}
              />
            </div>
          )}

          {/* Insight */}
          {insight && (
            <div className="flex-shrink-0 mt-2">
              <InsightBox
                insight={insight}
                color={color}
                variant="callout"
              />
            </div>
          )}
        </div>
      </SlideBody>
    </div>
  );
}
