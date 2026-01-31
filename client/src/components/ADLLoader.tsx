/**
 * Arthur D. Little - Global Health Platform
 * ADL Branded Loader Component
 * Reusable animated loader with ADL logo and premium effects
 */

import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface ADLLoaderProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Loading message to display */
  message?: string;
  /** Secondary message/subtitle */
  subtitle?: string;
  /** Whether to show the progress bar */
  showProgress?: boolean;
  /** Additional className */
  className?: string;
}

const sizeConfig = {
  sm: {
    logo: "h-12",
    rings: [8, 16, 24],
    particles: 4,
    particleDistance: 30,
    text: "text-sm",
    subtitle: "text-xs",
    progress: "w-24",
  },
  md: {
    logo: "h-16",
    rings: [10, 20, 30],
    particles: 6,
    particleDistance: 45,
    text: "text-base",
    subtitle: "text-sm",
    progress: "w-32",
  },
  lg: {
    logo: "h-24",
    rings: [12, 24, 36],
    particles: 8,
    particleDistance: 60,
    text: "text-lg",
    subtitle: "text-sm",
    progress: "w-48",
  },
};

export function ADLLoader({
  size = "md",
  message = "Loading...",
  subtitle,
  showProgress = true,
  className,
}: ADLLoaderProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      {/* ADL Logo with Animated Effects */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative"
      >
        {/* Orbiting Rings */}
        {config.rings.map((offset, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-adl-accent/20"
            style={{
              inset: `-${offset}px`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3 / (i + 1), 0.6 / (i + 1), 0.3 / (i + 1)],
              rotate: i % 2 === 0 ? [0, 360] : [360, 0],
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
              rotate: { duration: 15 + i * 5, repeat: Infinity, ease: "linear" },
            }}
          />
        ))}

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(config.particles)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                left: "50%",
                top: "50%",
              }}
              animate={{
                x: [0, Math.cos((i * 360 / config.particles) * Math.PI / 180) * config.particleDistance],
                y: [0, Math.sin((i * 360 / config.particles) * Math.PI / 180) * config.particleDistance],
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * (2 / config.particles),
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* ADL Logo with Glow */}
        <motion.img
          src="/adl-logo.png"
          alt="Arthur D. Little"
          className={cn(config.logo, "object-contain relative z-10")}
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

      {/* Text Content */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-center"
      >
        <p className={cn("text-white font-medium tracking-tight", config.text)}>
          {message}
        </p>
        {subtitle && (
          <p className={cn("text-white/40 mt-1", config.subtitle)}>
            {subtitle}
          </p>
        )}
      </motion.div>

      {/* Progress Bar */}
      {showProgress && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={cn("h-1 bg-white/10 rounded-full overflow-hidden", config.progress)}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-adl-accent via-adl-blue-light to-adl-accent rounded-full"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "50%" }}
          />
        </motion.div>
      )}
    </div>
  );
}

export default ADLLoader;
