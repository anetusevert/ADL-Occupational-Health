/**
 * Arthur D. Little - Brand Logo Component
 * Premium animated logo with high-class effects
 * Professional appearance with smooth animations
 */

import { motion, type Variants } from "framer-motion";
import { cn } from "../lib/utils";

interface ADLLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  showTagline?: boolean;
  tagline?: string;
  animate?: boolean;
  glowEffect?: boolean;
  hoverEffect?: boolean;
}

const sizeConfig = {
  xs: { height: "h-5", glow: 10 },
  sm: { height: "h-7", glow: 15 },
  md: { height: "h-9", glow: 20 },
  lg: { height: "h-12", glow: 25 },
  xl: { height: "h-16", glow: 30 },
  "2xl": { height: "h-20", glow: 35 },
  "3xl": { height: "h-24", glow: 40 },
  "4xl": { height: "h-32", glow: 50 },
};

// Premium fade-in animation
const logoVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    filter: "blur(8px)",
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Subtle glow pulse animation
const glowVariants: Variants = {
  initial: {},
  animate: {
    filter: [
      "drop-shadow(0 0 15px rgba(6,182,212,0.3))",
      "drop-shadow(0 0 25px rgba(6,182,212,0.5))",
      "drop-shadow(0 0 15px rgba(6,182,212,0.3))",
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Hover scale effect
const hoverVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.03,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export function ADLLogo({ 
  size = "md", 
  className, 
  showTagline = false, 
  tagline = "Global Health Intelligence",
  animate = true,
  glowEffect = false,
  hoverEffect = false,
}: ADLLogoProps) {
  const config = sizeConfig[size];

  return (
    <motion.div 
      className={cn("flex flex-col", className)}
      variants={animate ? logoVariants : undefined}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
      whileHover={hoverEffect ? "hover" : undefined}
    >
      <motion.img 
        src="/adl-logo.png" 
        alt="Arthur D. Little" 
        className={cn(config.height, "object-contain")}
        variants={glowEffect ? glowVariants : hoverEffect ? hoverVariants : undefined}
        initial={glowEffect ? "initial" : undefined}
        animate={glowEffect ? "animate" : undefined}
      />
      {showTagline && (
        <motion.span 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-[10px] text-adl-accent font-medium mt-1.5 whitespace-nowrap tracking-wide"
        >
          {tagline}
        </motion.span>
      )}
    </motion.div>
  );
}

// Dark variant for use on dark backgrounds
export function ADLLogoDark({ 
  size = "md", 
  showTagline = true, 
  tagline = "Global Health Intelligence", 
  className,
  animate = true,
  glowEffect = false,
}: { 
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"; 
  showTagline?: boolean;
  tagline?: string;
  className?: string;
  animate?: boolean;
  glowEffect?: boolean;
}) {
  const config = sizeConfig[size];

  return (
    <motion.div 
      className={cn("flex flex-col", className)}
      variants={animate ? logoVariants : undefined}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
    >
      <motion.img 
        src="/adl-logo.png" 
        alt="Arthur D. Little" 
        className={cn(config.height, "object-contain")}
        variants={glowEffect ? glowVariants : undefined}
        initial={glowEffect ? "initial" : undefined}
        animate={glowEffect ? "animate" : undefined}
      />
      {showTagline && (
        <motion.span 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-[10px] text-adl-accent font-medium mt-1.5 whitespace-nowrap tracking-wide"
        >
          {tagline}
        </motion.span>
      )}
    </motion.div>
  );
}

// Platform header with platform name
export function ADLPlatformHeader({ 
  size = "lg", 
  className,
  animate = true,
}: { 
  size?: "md" | "lg" | "xl"; 
  className?: string;
  animate?: boolean;
}) {
  const heights = {
    md: "h-9",
    lg: "h-12",
    xl: "h-16",
  };

  return (
    <motion.div 
      className={cn("flex flex-col", className)}
      variants={animate ? logoVariants : undefined}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
    >
      <img 
        src="/adl-logo.png" 
        alt="Arthur D. Little" 
        className={cn(heights[size], "object-contain")}
      />
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="text-adl-accent text-xs font-medium tracking-wide mt-2"
      >
        Global Occupational Health Platform
      </motion.span>
    </motion.div>
  );
}

// Compact icon version
export function ADLIcon({ 
  size = "md", 
  className,
  animate = true,
  glowEffect = false,
}: { 
  size?: "xs" | "sm" | "md" | "lg" | "xl"; 
  className?: string;
  animate?: boolean;
  glowEffect?: boolean;
}) {
  const sizes = {
    xs: "h-4",
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-14",
  };

  return (
    <motion.img 
      src="/adl-logo.png" 
      alt="ADL" 
      className={cn(sizes[size], "object-contain", className)}
      variants={animate ? logoVariants : glowEffect ? glowVariants : undefined}
      initial={animate ? "hidden" : glowEffect ? "initial" : undefined}
      animate={animate ? "visible" : glowEffect ? "animate" : undefined}
    />
  );
}

// Premium animated logo for loaders and splash screens
export function ADLLogoAnimated({ 
  size = "xl",
  className,
  showRings = true,
  showParticles = true,
}: { 
  size?: "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
  showRings?: boolean;
  showParticles?: boolean;
}) {
  const config = sizeConfig[size];

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Animated rings */}
      {showRings && (
        <>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0.1, 0.3, 0.1],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute rounded-full border border-cyan-400/30",
                i === 1 && "w-32 h-32",
                i === 2 && "w-48 h-48",
                i === 3 && "w-64 h-64",
              )}
            />
          ))}
        </>
      )}

      {/* Floating particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                x: "50%", 
                y: "50%",
                scale: 0,
              }}
              animate={{ 
                opacity: [0, 0.6, 0],
                x: `${50 + (Math.cos(i * 30 * Math.PI / 180) * 40)}%`,
                y: `${50 + (Math.sin(i * 30 * Math.PI / 180) * 40)}%`,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeOut",
              }}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      )}

      {/* Logo with glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          filter: "blur(0px)",
        }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10"
      >
        <motion.img
          src="/adl-logo.png"
          alt="Arthur D. Little"
          className={cn(config.height, "object-contain")}
          animate={{
            filter: [
              "drop-shadow(0 0 20px rgba(6,182,212,0.3))",
              "drop-shadow(0 0 40px rgba(6,182,212,0.5))",
              "drop-shadow(0 0 20px rgba(6,182,212,0.3))",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </div>
  );
}

// Minimal shimmer effect logo
export function ADLLogoShimmer({
  size = "md",
  className,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const config = sizeConfig[size];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img 
        src="/adl-logo.png" 
        alt="Arthur D. Little" 
        className={cn(config.height, "object-contain relative z-10")}
      />
      {/* Shimmer overlay */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
        className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
      />
    </div>
  );
}

export default ADLLogo;
