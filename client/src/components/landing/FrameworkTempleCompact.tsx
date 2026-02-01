/**
 * Arthur D. Little - Compact Framework Temple
 * Elegant visualization of the ADL Occupational Health Framework
 * Designed for the landing page - minimal, sophisticated presentation
 */

import { motion } from "framer-motion";
import { Crown, Shield, Eye, Heart } from "lucide-react";
import { cn } from "../../lib/utils";

const governance = {
  id: "governance",
  title: "Governance",
  subtitle: "The Overarching Driver",
  icon: Crown,
  color: "purple",
  gradient: "from-purple-500/20 to-purple-600/5",
  borderColor: "border-purple-500/30",
  iconBg: "bg-purple-500/20",
  iconColor: "text-purple-400",
  glowColor: "shadow-purple-500/20",
};

const pillars = [
  {
    id: "prevention",
    title: "Prevention",
    subtitle: "Hazard Control",
    icon: Shield,
    color: "blue",
    gradient: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    id: "vigilance",
    title: "Vigilance",
    subtitle: "Surveillance",
    icon: Eye,
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: "restoration",
    title: "Restoration",
    subtitle: "Compensation",
    icon: Heart,
    color: "amber",
    gradient: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
];

interface FrameworkTempleCompactProps {
  className?: string;
  delay?: number;
}

export function FrameworkTempleCompact({ className, delay = 0 }: FrameworkTempleCompactProps) {
  const Icon = governance.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn("w-full max-w-xl mx-auto", className)}
    >
      {/* Governance - Roof */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.1 }}
        className={cn(
          "relative mx-auto px-6 py-4 rounded-xl border backdrop-blur-sm",
          "bg-gradient-to-b", governance.gradient, governance.borderColor,
          "shadow-lg", governance.glowColor,
          "flex items-center justify-center gap-3"
        )}
      >
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", governance.iconBg)}>
          <Icon className={cn("w-5 h-5", governance.iconColor)} />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            {governance.title}
          </h3>
          <p className="text-[10px] text-white/50">{governance.subtitle}</p>
        </div>
      </motion.div>

      {/* Connecting Lines */}
      <div className="flex justify-center py-3">
        <div className="flex items-end gap-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 20, opacity: 1 }}
              transition={{ delay: delay + 0.3 + i * 0.1, duration: 0.4 }}
              className={cn(
                "w-px rounded-full",
                i === 0 && "bg-gradient-to-b from-purple-500/50 to-blue-500/30",
                i === 1 && "bg-gradient-to-b from-purple-500/50 to-emerald-500/30",
                i === 2 && "bg-gradient-to-b from-purple-500/50 to-amber-500/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Three Pillars */}
      <div className="grid grid-cols-3 gap-3">
        {pillars.map((pillar, index) => {
          const PillarIcon = pillar.icon;
          return (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: delay + 0.5 + index * 0.1 }}
              whileHover={{ 
                scale: 1.03, 
                transition: { duration: 0.2 } 
              }}
              className={cn(
                "relative px-3 py-4 rounded-xl border backdrop-blur-sm cursor-default",
                "bg-gradient-to-b", pillar.gradient, pillar.borderColor,
                "flex flex-col items-center text-center",
                "hover:shadow-lg transition-shadow duration-300"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", pillar.iconBg)}>
                <PillarIcon className={cn("w-4 h-4", pillar.iconColor)} />
              </div>
              <h4 className="text-xs font-semibold text-white">{pillar.title}</h4>
              <p className="text-[9px] text-white/40 mt-0.5">{pillar.subtitle}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default FrameworkTempleCompact;
