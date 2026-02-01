/**
 * Arthur D. Little - Compact Framework Temple
 * Elegant visualization of the ADL Occupational Health Framework
 * Clickable pillars open detailed explainer modals
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Eye, Heart } from "lucide-react";
import { cn } from "../../lib/utils";
import { PillarExplainerModal, type PillarId, PILLAR_ID_MAP } from "./PillarExplainerModal";

const governance = {
  id: "governance",
  pillarId: "governance" as PillarId,
  title: "Governance",
  subtitle: "The Overarching Driver",
  icon: Crown,
  gradient: "from-purple-500/20 to-purple-600/5",
  borderColor: "border-purple-500/30",
  iconBg: "bg-purple-500/20",
  iconColor: "text-purple-400",
  glowColor: "shadow-purple-500/20",
};

const pillars = [
  {
    id: "prevention",
    pillarId: "pillar-1" as PillarId,
    title: "Prevention",
    subtitle: "Hazard Control",
    icon: Shield,
    gradient: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    id: "vigilance",
    pillarId: "pillar-2" as PillarId,
    title: "Vigilance",
    subtitle: "Surveillance",
    icon: Eye,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: "restoration",
    pillarId: "pillar-3" as PillarId,
    title: "Restoration",
    subtitle: "Compensation",
    icon: Heart,
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
  const [activePillar, setActivePillar] = useState<PillarId | null>(null);
  const Icon = governance.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={cn("w-full max-w-md mx-auto", className)}
      >
        {/* Governance - Roof */}
        <motion.button
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActivePillar(governance.pillarId)}
          className={cn(
            "relative w-full mx-auto px-4 py-2 rounded-lg border backdrop-blur-sm",
            "bg-gradient-to-b", governance.gradient, governance.borderColor,
            "shadow-md", governance.glowColor,
            "flex items-center justify-center gap-2",
            "cursor-pointer hover:border-purple-400/50 transition-all duration-200"
          )}
        >
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", governance.iconBg)}>
            <Icon className={cn("w-3.5 h-3.5", governance.iconColor)} />
          </div>
          <div className="text-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">
              {governance.title}
            </h3>
            <p className="text-[8px] text-white/50">{governance.subtitle}</p>
          </div>
        </motion.button>

        {/* Connecting Lines */}
        <div className="flex justify-center py-1.5">
          <div className="flex items-end gap-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 12, opacity: 1 }}
                transition={{ delay: delay + 0.2 + i * 0.05, duration: 0.3 }}
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
        <div className="grid grid-cols-3 gap-2">
          {pillars.map((pillar, index) => {
            const PillarIcon = pillar.icon;
            return (
              <motion.button
                key={pillar.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: delay + 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActivePillar(pillar.pillarId)}
                className={cn(
                  "relative px-2 py-2.5 rounded-lg border backdrop-blur-sm",
                  "bg-gradient-to-b", pillar.gradient, pillar.borderColor,
                  "flex flex-col items-center text-center",
                  "cursor-pointer hover:border-white/30 transition-all duration-200"
                )}
              >
                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center mb-1", pillar.iconBg)}>
                  <PillarIcon className={cn("w-3.5 h-3.5", pillar.iconColor)} />
                </div>
                <h4 className="text-[10px] font-semibold text-white">{pillar.title}</h4>
                <p className="text-[8px] text-white/40 hidden sm:block">{pillar.subtitle}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Pillar Explainer Modal */}
      <PillarExplainerModal
        isOpen={!!activePillar}
        onClose={() => setActivePillar(null)}
        pillarId={activePillar}
      />
    </>
  );
}

export default FrameworkTempleCompact;
