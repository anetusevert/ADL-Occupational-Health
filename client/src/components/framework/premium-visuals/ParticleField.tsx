/**
 * Arthur D. Little - Global Health Platform
 * ParticleField - Ambient floating particle system
 * 
 * Creates a beautiful, performance-optimized particle background
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

interface ParticleFieldProps {
  count?: number;
  color?: "purple" | "cyan" | "blue" | "emerald" | "amber" | "mixed" | "white";
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

export function ParticleField({ 
  count = 40, 
  color = "mixed",
  speed = "normal",
  className 
}: ParticleFieldProps) {
  // Generate particles with random properties
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: speed === "slow" ? 15 + Math.random() * 10 : 
                speed === "fast" ? 5 + Math.random() * 5 :
                8 + Math.random() * 8,
      opacity: Math.random() * 0.5 + 0.1,
      colorVariant: Math.floor(Math.random() * 5),
    }));
  }, [count, speed]);

  const getParticleColor = (variant: number) => {
    if (color === "mixed") {
      const colors = [
        "bg-purple-400",
        "bg-cyan-400",
        "bg-blue-400",
        "bg-emerald-400",
        "bg-amber-400",
      ];
      return colors[variant % colors.length];
    }
    
    const colorMap = {
      purple: "bg-purple-400",
      cyan: "bg-cyan-400",
      blue: "bg-blue-400",
      emerald: "bg-emerald-400",
      amber: "bg-amber-400",
      white: "bg-white",
    };
    
    return colorMap[color];
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}%`,
            y: "110%",
            opacity: 0,
          }}
          animate={{
            y: "-10%",
            opacity: [0, particle.opacity, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            willChange: "transform, opacity",
          }}
          className={cn(
            "absolute rounded-full",
            getParticleColor(particle.colorVariant)
          )}
        />
      ))}

      {/* Larger floating orbs for depth */}
      {Array.from({ length: Math.floor(count / 10) }).map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: 0.8,
          }}
          animate={{
            y: [
              `${Math.random() * 30 + 20}%`,
              `${Math.random() * 30 + 50}%`,
              `${Math.random() * 30 + 20}%`,
            ],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute w-32 h-32 rounded-full blur-3xl",
            color === "mixed" 
              ? i % 2 === 0 ? "bg-purple-500/20" : "bg-cyan-500/20"
              : color === "purple" ? "bg-purple-500/20"
              : color === "cyan" ? "bg-cyan-500/20"
              : color === "blue" ? "bg-blue-500/20"
              : color === "emerald" ? "bg-emerald-500/20"
              : color === "amber" ? "bg-amber-500/20"
              : "bg-white/10"
          )}
        />
      ))}
    </div>
  );
}

export default ParticleField;
