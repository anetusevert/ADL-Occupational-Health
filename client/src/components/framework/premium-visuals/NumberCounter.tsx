/**
 * Arthur D. Little - Global Health Platform
 * NumberCounter - Animated counting numbers with easing
 * 
 * Creates smooth number counting animations for statistics
 */

import { useState, useEffect, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { cn } from "../../../lib/utils";

interface NumberCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  animate?: boolean;
  onComplete?: () => void;
}

export function NumberCounter({
  value,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  animate = true,
  onComplete,
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [hasStarted, setHasStarted] = useState(false);

  // Spring animation for smooth easing
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  // Transform to formatted number
  const display = useTransform(spring, (current) => {
    const formatted = current.toFixed(decimals);
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    if (!animate) {
      spring.set(value);
      return;
    }

    if (isInView && !hasStarted) {
      const timer = setTimeout(() => {
        setHasStarted(true);
        spring.set(value);
        
        // Call onComplete after animation
        if (onComplete) {
          setTimeout(onComplete, duration * 1000);
        }
      }, delay * 1000);

      return () => clearTimeout(timer);
    }
  }, [isInView, hasStarted, value, spring, delay, duration, animate, onComplete]);

  return (
    <motion.span
      ref={ref}
      className={cn("tabular-nums", className)}
    >
      {display}
    </motion.span>
  );
}

// Large hero stat counter with label
export function StatCounter({
  value,
  label,
  prefix = "",
  suffix = "",
  duration = 2.5,
  delay = 0,
  className,
  color = "cyan",
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  className?: string;
  color?: "purple" | "cyan" | "blue" | "emerald" | "amber";
}) {
  const colorClasses = {
    purple: "text-purple-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={cn("text-center", className)}
    >
      <div className={cn("text-4xl md:text-5xl font-bold mb-2", colorClasses[color])}>
        <NumberCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          duration={duration}
          delay={delay + 0.3}
        />
      </div>
      <p className="text-white/60 text-sm">{label}</p>
    </motion.div>
  );
}

// Compact stat with icon
export function CompactStat({
  value,
  label,
  icon: Icon,
  prefix = "",
  suffix = "",
  color = "cyan",
  delay = 0,
}: {
  value: number;
  label: string;
  icon?: React.ElementType;
  prefix?: string;
  suffix?: string;
  color?: "purple" | "cyan" | "blue" | "emerald" | "amber";
  delay?: number;
}) {
  const bgClasses = {
    purple: "bg-purple-500/20 border-purple-500/30",
    cyan: "bg-cyan-500/20 border-cyan-500/30",
    blue: "bg-blue-500/20 border-blue-500/30",
    emerald: "bg-emerald-500/20 border-emerald-500/30",
    amber: "bg-amber-500/20 border-amber-500/30",
  };

  const textClasses = {
    purple: "text-purple-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm",
        bgClasses[color]
      )}
    >
      {Icon && (
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bgClasses[color])}>
          <Icon className={cn("w-5 h-5", textClasses[color])} />
        </div>
      )}
      <div>
        <div className={cn("text-xl font-bold", textClasses[color])}>
          <NumberCounter value={value} prefix={prefix} suffix={suffix} delay={delay + 0.2} />
        </div>
        <p className="text-white/50 text-xs">{label}</p>
      </div>
    </motion.div>
  );
}

export default NumberCounter;
