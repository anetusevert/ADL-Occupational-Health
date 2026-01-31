/**
 * GOHIP Platform - Interactive Temple Component
 * ADL Occupational Health Framework Visualization
 * 
 * Phase 6: Interactive Framework Visualization
 * 
 * Visual "Temple" Structure:
 * - Roof: Governance (Overarching Driver)
 * - Columns: 3 Operational Pillars (Hazard, Vigilance, Restoration)
 */

import { motion, AnimatePresence } from "framer-motion";
import { frameworkContent, type FrameworkBlock } from "../../data/frameworkContent";
import { cn } from "../../lib/utils";

interface InteractiveTempleProps {
  activeBlock: string | null;
  onBlockSelect: (blockId: string | null) => void;
}

interface TempleBlockProps {
  block: FrameworkBlock;
  isActive: boolean;
  onClick: () => void;
  layoutId: string;
  delay?: number;
}

/**
 * Individual Temple Block with animations
 */
function TempleBlock({ block, isActive, onClick, layoutId, delay = 0 }: TempleBlockProps) {
  const Icon = block.icon;

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: 1.03,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl border backdrop-blur-md transition-all duration-300",
        "bg-gradient-to-b",
        block.gradientFrom,
        block.gradientTo,
        isActive
          ? `border-${block.color}-400/60 shadow-lg ${block.glowColor} ring-2 ring-${block.color}-400/30`
          : "border-white/10 hover:border-white/20",
        "group"
      )}
    >
      {/* Glow effect on hover */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
          `bg-${block.color}-500/10`
        )}
        animate={{ opacity: isActive ? 0.4 : 0 }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col">
        {/* Icon and Title */}
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              `bg-${block.color}-500/20`,
              isActive && `bg-${block.color}-500/30`
            )}
            animate={{
              rotate: isActive ? [0, -5, 5, 0] : 0,
            }}
            transition={{ duration: 0.5 }}
          >
            <Icon
              className={cn(
                "w-6 h-6 transition-colors duration-300",
                `text-${block.color}-400`,
                isActive && `text-${block.color}-300`
              )}
            />
          </motion.div>
          <div className="flex-1">
            <h3
              className={cn(
                "text-lg font-bold transition-colors duration-300",
                isActive ? "text-white" : "text-slate-200"
              )}
            >
              {block.title}
            </h3>
            <p className="text-sm text-slate-400">{block.subtitle}</p>
          </div>
        </div>

        {/* Key Metrics Preview */}
        <div className="mt-auto">
          <div className="flex flex-wrap gap-2">
            {block.keyMetrics.slice(0, 2).map((metric, idx) => (
              <span
                key={idx}
                className={cn(
                  "text-xs px-2 py-1 rounded-md",
                  `bg-${block.color}-500/10 text-${block.color}-300/80`
                )}
              >
                {metric}
              </span>
            ))}
            {block.keyMetrics.length > 2 && (
              <span className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-400">
                +{block.keyMetrics.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute top-3 right-3 w-3 h-3 rounded-full",
                `bg-${block.color}-400`
              )}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom border glow */}
      <motion.div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1 rounded-b-xl",
          `bg-gradient-to-r from-transparent via-${block.color}-500 to-transparent`
        )}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{
          opacity: isActive ? 0.8 : 0,
          scaleX: isActive ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

/**
 * Interactive Temple Visualization
 */
export function InteractiveTemple({ activeBlock, onBlockSelect }: InteractiveTempleProps) {
  const { governance, pillars } = frameworkContent;

  const handleBlockClick = (blockId: string) => {
    onBlockSelect(activeBlock === blockId ? null : blockId);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Temple Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          ADL Occupational Health Framework
        </h2>
        <p className="text-slate-400 text-sm">
          Click any block to explore its role in the framework
        </p>
      </motion.div>

      {/* Temple Structure */}
      <div className="space-y-4">
        {/* Roof - Governance */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <TempleBlock
            block={governance}
            isActive={activeBlock === governance.id}
            onClick={() => handleBlockClick(governance.id)}
            layoutId={`temple-${governance.id}`}
            delay={0.3}
          />
        </motion.div>

        {/* Decorative connectors */}
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: 24 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
              className="w-1 bg-gradient-to-b from-purple-500/50 to-transparent rounded-full"
            />
          ))}
        </div>

        {/* Pillars - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((pillar, index) => (
            <TempleBlock
              key={pillar.id}
              block={pillar}
              isActive={activeBlock === pillar.id}
              onClick={() => handleBlockClick(pillar.id)}
              layoutId={`temple-${pillar.id}`}
              delay={0.6 + index * 0.15}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-slate-500"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500/50" />
          <span>Governance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500/50" />
          <span>Prevention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          <span>Vigilance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500/50" />
          <span>Restoration</span>
        </div>
      </motion.div>
    </div>
  );
}

export default InteractiveTemple;
