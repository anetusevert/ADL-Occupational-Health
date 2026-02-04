/**
 * ScoreTree - Tree view of OHI calculation structure
 *
 * Renders ADL OHI Score at the root, pillars as children,
 * and metric weights as leaf nodes. Clicking a node can
 * open an editor modal.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  BarChart3,
  Layers,
  Dot,
  Info,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type ScoreTreeNodeType = "root" | "pillar" | "metric";

export interface ScoreTreeNode {
  id: string;
  type: ScoreTreeNodeType;
  label: string;
  description?: string | null;
  weight?: number;
  pillarId?: string;
  metricKey?: string;
  inverted?: boolean;
  unit?: string | null;
  children?: ScoreTreeNode[];
}

interface ScoreTreeProps {
  rootLabel: string;
  nodes: ScoreTreeNode[];
  onNodeClick?: (node: ScoreTreeNode) => void;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const nodeVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 22, stiffness: 320 },
  },
};

export function ScoreTree({ rootLabel, nodes, onNodeClick, className }: ScoreTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleNode = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isExpanded = (id: string, defaultValue = true) =>
    expanded[id] ?? defaultValue;

  const flattened = useMemo(() => nodes, [nodes]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-4", className)}
    >
      {/* Root */}
      <motion.div variants={nodeVariants} className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">{rootLabel}</p>
            <p className="text-white/50 text-sm">Overall maturity score (1.0–4.0)</p>
          </div>
          <div className="text-white/40 text-sm">Root</div>
        </div>
      </motion.div>

      {/* Tree */}
      <div className="space-y-3">
        {flattened.map((pillar) => {
          const expandedPillar = isExpanded(pillar.id);

          return (
            <motion.div key={pillar.id} variants={nodeVariants} className="rounded-xl border border-white/10 bg-white/5">
              <button
                onClick={() => toggleNode(pillar.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">{pillar.label}</p>
                  <p className="text-white/40 text-sm">{pillar.description}</p>
                </div>
                {typeof pillar.weight === "number" && (
                  <span className="text-white/60 font-mono text-sm">
                    {(pillar.weight * 100).toFixed(0)}%
                  </span>
                )}
                <div className="text-white/40">
                  {expandedPillar ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {expandedPillar && pillar.children && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <div className="border-l border-white/10 pl-4 space-y-2">
                        {pillar.children.map((metric) => (
                          <motion.button
                            key={metric.id}
                            variants={nodeVariants}
                            onClick={() => onNodeClick?.(metric)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg text-left",
                              "bg-white/5 hover:bg-white/10 transition-colors"
                            )}
                          >
                            <div className="text-white/30">
                              <Dot className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white/80 text-sm truncate">{metric.label}</p>
                              {metric.description && (
                                <p className="text-white/40 text-xs line-clamp-1">{metric.description}</p>
                              )}
                            </div>
                            {typeof metric.weight === "number" && (
                              <span className="text-white/60 font-mono text-sm">
                                {(metric.weight * 100).toFixed(0)}%
                              </span>
                            )}
                            <Info className="w-4 h-4 text-white/30" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ScoreTree;
