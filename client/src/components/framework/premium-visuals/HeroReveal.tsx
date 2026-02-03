/**
 * Arthur D. Little - Global Health Platform
 * HeroReveal - Cinematic blur-to-focus reveal wrapper
 * 
 * Wraps any content for dramatic cinematic entrance animations
 * Matches the 3-phase intro animation language
 */

import { motion, Variants, Transition } from "framer-motion";
import { cn } from "../../../lib/utils";

interface HeroRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none" | "scale";
  blur?: number;
  distance?: number;
  once?: boolean;
}

export function HeroReveal({
  children,
  className,
  delay = 0,
  duration = 0.8,
  direction = "up",
  blur = 20,
  distance = 30,
  once = true,
}: HeroRevealProps) {
  const directionConfig = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
    scale: { scale: 0.8 },
  };

  const variants: Variants = {
    hidden: {
      opacity: 0,
      filter: `blur(${blur}px)`,
      ...directionConfig[direction],
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: 0,
      scale: 1,
    },
  };

  const transition: Transition = {
    duration,
    delay,
    ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for cinematic feel
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={transition}
      viewport={once ? { once: true } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered children reveal
export function StaggerReveal({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const directionOffset = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
      ...directionOffset[direction],
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={itemVariants}>{children}</motion.div>
      }
    </motion.div>
  );
}

// Dramatic scale reveal for hero elements
export function ScaleReveal({
  children,
  className,
  delay = 0,
  initialScale = 0.5,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  initialScale?: number;
}) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: initialScale, 
        filter: "blur(30px)" 
      }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        filter: "blur(0px)" 
      }}
      transition={{
        duration: 1,
        delay,
        type: "spring",
        damping: 20,
        stiffness: 100,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Text with dramatic letter-by-letter blur reveal
export function DramaticTextReveal({
  text,
  className,
  delay = 0,
  letterDelay = 0.04,
  glow = false,
  glowColor = "rgba(6, 182, 212, 0.6)",
}: {
  text: string;
  className?: string;
  delay?: number;
  letterDelay?: number;
  glow?: boolean;
  glowColor?: string;
}) {
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      className={cn("inline-block", className)}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-[0.3em]">
          {word.split("").map((char, charIndex) => {
            const globalIndex = words
              .slice(0, wordIndex)
              .reduce((acc, w) => acc + w.length + 1, 0) + charIndex;

            return (
              <motion.span
                key={charIndex}
                initial={{
                  opacity: 0,
                  y: 20,
                  filter: "blur(12px)",
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  scale: 1,
                }}
                transition={{
                  duration: 0.4,
                  delay: delay + globalIndex * letterDelay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                style={glow ? {
                  textShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
                } : undefined}
                className="inline-block"
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.span>
  );
}

// Cinematic fade with zoom
export function CinematicFade({
  children,
  className,
  delay = 0,
  zoomIn = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  zoomIn?: boolean;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: zoomIn ? 1.1 : 0.9,
        filter: "blur(10px)",
      }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Shimmer effect overlay
export function ShimmerOverlay({
  className,
  delay = 0,
  duration = 2,
  repeat = true,
}: {
  className?: string;
  delay?: number;
  duration?: number;
  repeat?: boolean;
}) {
  return (
    <motion.div
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ 
        x: "200%", 
        opacity: [0, 0.4, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: repeat ? Infinity : 0,
        repeatDelay: 3,
        ease: "easeInOut",
      }}
      className={cn(
        "absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none",
        className
      )}
    />
  );
}

// Pulse ring effect
export function PulseRing({
  color = "cyan",
  size = "w-32 h-32",
  className,
  count = 3,
  duration = 2,
}: {
  color?: "purple" | "cyan" | "blue" | "emerald" | "amber";
  size?: string;
  className?: string;
  count?: number;
  duration?: number;
}) {
  const colorClasses = {
    purple: "border-purple-500/40",
    cyan: "border-cyan-500/40",
    blue: "border-blue-500/40",
    emerald: "border-emerald-500/40",
    amber: "border-amber-500/40",
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration,
            repeat: Infinity,
            delay: i * (duration / count),
            ease: "easeOut",
          }}
          className={cn(
            "absolute rounded-full border-2",
            size,
            colorClasses[color],
            className
          )}
        />
      ))}
    </>
  );
}

export default HeroReveal;
