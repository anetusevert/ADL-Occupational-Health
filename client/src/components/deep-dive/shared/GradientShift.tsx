/**
 * Arthur D. Little - Global Health Platform
 * Gradient Shift Animation Component
 * 
 * Dynamic background gradient animations
 * Re-applied: 2026-01-31
 */

import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

interface GradientShiftProps {
  colors?: string[];
  duration?: number;
  className?: string;
}

export function GradientShift({
  colors = ["from-purple-900/20", "from-blue-900/20", "from-cyan-900/20"],
  duration = 10,
  className,
}: GradientShiftProps) {
  return (
    <motion.div
      className={cn(
        "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none",
        className
      )}
      animate={{
        background: colors.map(() => `linear-gradient(to bottom right, var(--tw-gradient-stops))`),
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    />
  );
}

// Animated gradient orbs for background effects
interface GradientOrbsProps {
  count?: number;
  className?: string;
}

export function GradientOrbs({ count = 3, className }: GradientOrbsProps) {
  const orbColors = [
    "bg-purple-500/10",
    "bg-blue-500/10",
    "bg-cyan-500/10",
    "bg-emerald-500/10",
    "bg-amber-500/10",
  ];

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full blur-3xl",
            orbColors[i % orbColors.length]
          )}
          style={{
            width: 300 + i * 100,
            height: 300 + i * 100,
          }}
          initial={{
            x: `${20 + i * 30}%`,
            y: `${20 + i * 20}%`,
          }}
          animate={{
            x: [`${20 + i * 30}%`, `${50 + i * 10}%`, `${20 + i * 30}%`],
            y: [`${20 + i * 20}%`, `${60 - i * 15}%`, `${20 + i * 20}%`],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default GradientShift;
