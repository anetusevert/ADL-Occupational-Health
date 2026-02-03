/**
 * Arthur D. Little - Global Health Platform
 * GlowOrb - Cinematic pulsing glow effect component
 * 
 * Creates mesmerizing pulsing glow orbs for central elements
 * Matches the cinematic intro animation language
 */

import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

interface GlowOrbProps {
  color?: "purple" | "cyan" | "blue" | "emerald" | "amber" | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
  intensity?: "subtle" | "medium" | "intense";
  pulse?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const colorConfig = {
  purple: {
    gradient: "from-purple-500 to-purple-700",
    glow: "rgba(147, 51, 234, 0.6)",
    glowLight: "rgba(147, 51, 234, 0.3)",
    ring: "border-purple-400/50",
  },
  cyan: {
    gradient: "from-cyan-500 to-cyan-700",
    glow: "rgba(6, 182, 212, 0.6)",
    glowLight: "rgba(6, 182, 212, 0.3)",
    ring: "border-cyan-400/50",
  },
  blue: {
    gradient: "from-blue-500 to-blue-700",
    glow: "rgba(37, 99, 235, 0.6)",
    glowLight: "rgba(37, 99, 235, 0.3)",
    ring: "border-blue-400/50",
  },
  emerald: {
    gradient: "from-emerald-500 to-emerald-700",
    glow: "rgba(5, 150, 105, 0.6)",
    glowLight: "rgba(5, 150, 105, 0.3)",
    ring: "border-emerald-400/50",
  },
  amber: {
    gradient: "from-amber-500 to-amber-700",
    glow: "rgba(245, 158, 11, 0.6)",
    glowLight: "rgba(245, 158, 11, 0.3)",
    ring: "border-amber-400/50",
  },
  gradient: {
    gradient: "from-purple-500 via-cyan-500 to-purple-600",
    glow: "rgba(139, 92, 246, 0.5)",
    glowLight: "rgba(6, 182, 212, 0.3)",
    ring: "border-cyan-400/50",
  },
};

const sizeConfig = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-40 h-40",
};

const intensityConfig = {
  subtle: { blur: 40, spread: 80 },
  medium: { blur: 60, spread: 120 },
  intense: { blur: 80, spread: 160 },
};

export function GlowOrb({
  color = "cyan",
  size = "md",
  intensity = "medium",
  pulse = true,
  className,
  children,
}: GlowOrbProps) {
  const c = colorConfig[color];
  const s = sizeConfig[size];
  const i = intensityConfig[intensity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.8, type: "spring", damping: 20 }}
      className={cn("relative flex items-center justify-center", className)}
    >
      {/* Outer glow layer */}
      <motion.div
        animate={pulse ? {
          boxShadow: [
            `0 0 ${i.blur}px ${c.glowLight}, 0 0 ${i.spread}px ${c.glowLight}`,
            `0 0 ${i.blur * 1.5}px ${c.glow}, 0 0 ${i.spread * 1.5}px ${c.glow}`,
            `0 0 ${i.blur}px ${c.glowLight}, 0 0 ${i.spread}px ${c.glowLight}`,
          ],
        } : undefined}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute rounded-2xl",
          s
        )}
      />

      {/* Inner gradient orb */}
      <motion.div
        animate={pulse ? { scale: [1, 1.02, 1] } : undefined}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-2xl relative overflow-hidden",
          s,
          c.gradient
        )}
      >
        {/* Shimmer effect */}
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: "200%", opacity: [0, 0.3, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
        
        {children}
      </motion.div>

      {/* Pulse ring */}
      {pulse && (
        <motion.div
          className={cn("absolute rounded-2xl border-2", s, c.ring)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

// Floating variant for background accents
export function FloatingGlowOrb({
  color = "purple",
  size = "lg",
  position = "top-right",
  delay = 0,
}: {
  color?: "purple" | "cyan" | "blue" | "emerald" | "amber";
  size?: "sm" | "md" | "lg" | "xl";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  delay?: number;
}) {
  const c = colorConfig[color];
  const s = sizeConfig[size];
  
  const positionClasses = {
    "top-left": "-top-10 -left-10",
    "top-right": "-top-10 -right-10",
    "bottom-left": "-bottom-10 -left-10",
    "bottom-right": "-bottom-10 -right-10",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.2, 0.4, 0.2],
        scale: [0.8, 1.2, 0.8],
        y: [0, -20, 0],
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className={cn(
        "absolute rounded-full blur-3xl pointer-events-none",
        s,
        positionClasses[position]
      )}
      style={{
        background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
      }}
    />
  );
}

// Mini glow for icon backgrounds
export function IconGlow({
  color = "cyan",
  children,
  className,
}: {
  color?: "purple" | "cyan" | "blue" | "emerald" | "amber";
  children: React.ReactNode;
  className?: string;
}) {
  const c = colorConfig[color];

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={cn("relative", className)}
    >
      <motion.div
        animate={{
          boxShadow: [
            `0 0 20px ${c.glowLight}`,
            `0 0 40px ${c.glow}`,
            `0 0 20px ${c.glowLight}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn(
          "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center",
          c.gradient
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default GlowOrb;
