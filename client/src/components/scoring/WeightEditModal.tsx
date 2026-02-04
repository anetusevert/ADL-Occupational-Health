/**
 * WeightEditModal - Edit metric weight via slider
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { X, Sliders } from "lucide-react";
import { cn } from "../../lib/utils";
import { EnhancedWeightSlider } from "./EnhancedWeightSlider";
import type { ScoreTreeNode } from "./ScoreTree";

interface WeightEditModalProps {
  isOpen: boolean;
  node: ScoreTreeNode | null;
  currentWeight: number;
  onClose: () => void;
  onSave: (newWeight: number) => void;
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

export function WeightEditModal({ isOpen, node, currentWeight, onClose, onSave }: WeightEditModalProps) {
  const [localWeight, setLocalWeight] = useState(currentWeight);

  useEffect(() => {
    setLocalWeight(currentWeight);
  }, [currentWeight, isOpen]);

  if (!node) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0a1a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <p className="text-white font-medium">{node.label}</p>
                  <p className="text-white/40 text-sm">Adjust metric weight</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {node.description && (
                <p className="text-white/50 text-sm">{node.description}</p>
              )}

              <EnhancedWeightSlider
                metricKey={node.metricKey || node.id}
                metricName={node.label}
                description={node.description || null}
                weight={localWeight}
                defaultWeight={currentWeight}
                isInverted={node.inverted || false}
                unit={node.unit || null}
                onChange={(value) => setLocalWeight(value)}
                pillarColor="text-cyan-400"
              />
            </div>

            <div className="p-5 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(localWeight)}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                Save Weight
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default WeightEditModal;
