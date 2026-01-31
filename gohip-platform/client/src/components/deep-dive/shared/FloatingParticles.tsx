/**
 * Arthur D. Little - Global Health Platform
 * Floating Particles Background Component
 * 
 * Reusable animated particle background for immersive experiences
 */

import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

interface FloatingParticlesProps {
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan" | "teal";
  count?: number;
  className?: string;
}

export function FloatingParticles({ 
  color = "cyan", 
  count = 20,
  className 
}: FloatingParticlesProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: "100%", x: `${Math.random() * 100}%` }}
          animate={{ 
            opacity: [0, 0.4, 0],
            y: "-10%",
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          className={cn(
            "absolute w-1 h-1 rounded-full",
            color === "purple" && "bg-purple-400",
            color === "blue" && "bg-blue-400",
            color === "emerald" && "bg-emerald-400",
            color === "amber" && "bg-amber-400",
            color === "cyan" && "bg-cyan-400",
            color === "teal" && "bg-teal-400",
          )}
        />
      ))}
    </div>
  );
}

export default FloatingParticles;
