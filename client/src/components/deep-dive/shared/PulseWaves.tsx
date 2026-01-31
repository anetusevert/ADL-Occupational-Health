/**
 * Arthur D. Little - Global Health Platform
 * Pulse Waves Animation Component
 * 
 * Expanding pulse rings for emphasis effects
 * Re-applied: 2026-01-31
 */

import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

interface PulseWavesProps {
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan" | "rose";
  count?: number;
  size?: number;
  duration?: number;
  className?: string;
}

export function PulseWaves({
  color = "purple",
  count = 3,
  size = 100,
  duration = 3,
  className,
}: PulseWavesProps) {
  const colorClasses = {
    purple: "border-purple-500/30",
    blue: "border-blue-500/30",
    emerald: "border-emerald-500/30",
    amber: "border-amber-500/30",
    cyan: "border-cyan-500/30",
    rose: "border-rose-500/30",
  };

  return (
    <div className={cn("absolute inset-0 flex items-center justify-center pointer-events-none", className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full border-2",
            colorClasses[color]
          )}
          style={{ width: size, height: size }}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{
            scale: [0.8, 1.5, 2],
            opacity: [0.6, 0.3, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay: i * (duration / count),
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default PulseWaves;
