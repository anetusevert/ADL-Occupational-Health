/**
 * Arthur D. Little - Global Health Platform
 * Orbiting Elements Animation Component
 * 
 * Decorative orbiting icons around a central element
 */

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";

interface OrbitingElementsProps {
  icons: LucideIcon[];
  radius?: number;
  duration?: number;
  color?: "purple" | "blue" | "emerald" | "amber" | "cyan" | "rose";
  className?: string;
  iconSize?: number;
  reverse?: boolean;
}

export function OrbitingElements({
  icons,
  radius = 60,
  duration = 20,
  color = "purple",
  className,
  iconSize = 16,
  reverse = false,
}: OrbitingElementsProps) {
  const colorClasses = {
    purple: "text-purple-400/60",
    blue: "text-blue-400/60",
    emerald: "text-emerald-400/60",
    amber: "text-amber-400/60",
    cyan: "text-cyan-400/60",
    rose: "text-rose-400/60",
  };

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: reverse ? -360 : 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {icons.map((Icon, index) => {
          const angle = (360 / icons.length) * index;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <motion.div
              key={index}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
              }}
              animate={{ rotate: reverse ? 360 : -360 }}
              transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Icon className={cn("w-4 h-4", colorClasses[color])} style={{ width: iconSize, height: iconSize }} />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default OrbitingElements;
