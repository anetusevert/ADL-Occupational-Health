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
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <ParticleField count={40} color="rgba(6,182,212,0.4)" speed={0.3} />
      </div>

      {/* Floating glow orbs */}
      <FloatingGlowOrb color="purple" size="lg" className="absolute top-20 left-10 opacity-30" />
      <FloatingGlowOrb color="cyan" size="md" className="absolute bottom-32 right-20 opacity-30" />

      {/* Logo bar at top */}
      {showLogos && (
        <div className="relative z-10 pt-6">
          <LogoBar variant="full" />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-8 py-6">
        {/* Visual area - takes up significant space */}
        <div className="w-full max-w-2xl mb-8">
          <ScaleReveal delay={0.2}>
            {visual}
          </ScaleReveal>
        </div>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-64 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-6"
        />

        {/* Action Title - Centered, Bold */}
        <HeroReveal delay={0.3} direction="up">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center tracking-tight leading-tight max-w-4xl">
            {actionTitle}
          </h1>
        </HeroReveal>

        {/* Subtitle */}
        {subtitle && (
          <HeroReveal delay={0.4} direction="up">
            <p className="mt-3 text-lg md:text-xl text-cyan-400 font-medium text-center">
              {subtitle}
            </p>
          </HeroReveal>
        )}

        {/* Description */}
        {description && (
          <HeroReveal delay={0.5} direction="up">
            <p className="mt-4 text-base text-white/70 text-center max-w-2xl leading-relaxed">
              {description}
            </p>
          </HeroReveal>
        )}

        {/* Highlights as horizontal badges */}
        {highlights && highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            {highlights.map((highlight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-sm text-white/80">{highlight}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA Button */}
        {ctaButton && (
          <HeroReveal delay={0.8} direction="up">
            <motion.button
              onClick={ctaButton.onClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-white font-bold text-lg shadow-xl shadow-cyan-500/30 relative overflow-hidden group"
            >
              <ShimmerOverlay delay={1} duration={3} />
              <span className="relative z-10 flex items-center gap-3">
                <Play className="w-5 h-5" />
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

      {/* Body */}
      <SlideBody particleColor={color === "amber" ? "rgba(245,158,11,0.3)" : "rgba(6,182,212,0.3)"}>
        <div className="h-full flex flex-col">
          {/* Optional visual at top */}
          {visual && (
            <div className="mb-6">
              <ScaleReveal delay={0.2}>
                {visual}
              </ScaleReveal>
            </div>
          )}

          {/* Stats Grid - Main focus */}
          <div className="mb-6">
            <StatGrid 
              stats={stats} 
              columns={stats.length > 3 ? 4 : 3} 
              size="lg" 
            />
          </div>

          {/* Divider */}
          <SectionDivider label="Key Insights" color={color} />

          {/* Key Points */}
          {highlights && highlights.length > 0 && (
            <div className="mb-6">
              <KeyPointsList 
                points={highlights} 
                color={color} 
                columns={highlights.length > 3 ? 2 : 1} 
              />
            </div>
          )}

          {/* Insight Box */}
          {insight && (
            <div className="mt-auto">
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

      {/* Body */}
      <SlideBody particleColor="rgba(147,51,234,0.3)">
        <div className="h-full flex flex-col items-center">
          {/* Framework Visual - Center stage */}
          <div className="flex-1 flex items-center justify-center w-full max-w-3xl py-4">
            <ScaleReveal delay={0.2}>
              {visual}
            </ScaleReveal>
          </div>

          {/* Key Points below visual */}
          {highlights && highlights.length > 0 && (
            <div className="w-full max-w-3xl mt-4">
              <SectionDivider label="Key Elements" color={color} />
              <KeyPointsList 
                points={highlights} 
                color={color} 
                columns={2} 
              />
            </div>
          )}

          {/* Insight at bottom */}
          {insight && (
            <div className="w-full max-w-3xl mt-4">
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

      {/* Body - Two column layout */}
      <SlideBody>
        <div className="h-full flex flex-col lg:flex-row gap-6">
          {/* Left: Visual */}
          <div className="lg:w-1/2 flex items-center justify-center">
            <ScaleReveal delay={0.2}>
              <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                {visual}
              </div>
            </ScaleReveal>
          </div>

          {/* Right: Content */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            {/* Description */}
            {description && (
              <HeroReveal delay={0.3} direction="left">
                <p className="text-white/80 leading-relaxed mb-6">
                  {description}
                </p>
              </HeroReveal>
            )}

            {/* Key Elements */}
            {highlights && highlights.length > 0 && (
              <div className="mb-6">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3"
                >
                  Key Elements
                </motion.h3>
                <KeyPointsList 
                  points={highlights} 
                  color={color} 
                  startDelay={0.5}
                />
              </div>
            )}

            {/* Insight Box */}
            {insight && (
              <InsightBox
                insight={insight}
                source={insightSource}
                color={color}
                variant="quote"
              />
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
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
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

      {/* Body */}
      <SlideBody particleColor="rgba(16,185,129,0.3)">
        <div className="h-full flex flex-col">
          {/* Description */}
          {description && (
            <HeroReveal delay={0.2} direction="up">
              <p className="text-white/80 leading-relaxed mb-6 text-center max-w-3xl mx-auto">
                {description}
              </p>
            </HeroReveal>
          )}

          {/* Evidence Grid */}
          <div className={cn("grid gap-4 mb-6", gridCols[gridColumns])}>
            {evidence.map((item, i) => (
              <EvidenceCard
                key={i}
                flag={item.flag}
                title={item.title}
                achievement={item.achievement}
                detail={item.detail}
                highlighted={item.highlighted}
                color={color}
                delay={0.3 + i * 0.1}
              />
            ))}
          </div>

          {/* Key points */}
          {highlights && highlights.length > 0 && (
            <div className="mb-6">
              <SectionDivider label="Key Takeaways" color={color} />
              <KeyPointsList 
                points={highlights} 
                color={color} 
                columns={2}
              />
            </div>
          )}

          {/* Insight */}
          {insight && (
            <div className="mt-auto">
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
