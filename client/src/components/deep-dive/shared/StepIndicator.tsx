/**
 * Arthur D. Little - Global Health Platform
 * Step Indicator Component
 * 
 * Visual progress indicator for the Deep Dive wizard
 */

import { motion } from "framer-motion";
import { Check, Globe, Layers, FileText } from "lucide-react";
import { cn } from "../../../lib/utils";

interface Step {
  id: number;
  label: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { id: 1, label: "Select Countries", icon: Globe },
  { id: 2, label: "Choose Topic", icon: Layers },
  { id: 3, label: "View Report", icon: FileText },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  canNavigateBack?: boolean;
}

export function StepIndicator({ 
  currentStep, 
  onStepClick,
  canNavigateBack = true 
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isClickable = canNavigateBack && currentStep > step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <motion.button
              onClick={() => isClickable && onStepClick?.(step.id)}
              disabled={!isClickable}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                isCompleted && "bg-emerald-500/20 border border-emerald-500/40 cursor-pointer hover:bg-emerald-500/30",
                isCurrent && "bg-purple-500/20 border border-purple-500/40",
                !isCompleted && !isCurrent && "bg-slate-800/40 border border-slate-700/40",
                isClickable && "hover:scale-105"
              )}
              whileHover={isClickable ? { scale: 1.05 } : undefined}
              whileTap={isClickable ? { scale: 0.98 } : undefined}
            >
              {/* Icon */}
              <motion.div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  isCompleted && "bg-emerald-500/30",
                  isCurrent && "bg-purple-500/30",
                  !isCompleted && !isCurrent && "bg-slate-700/50"
                )}
                animate={isCurrent ? {
                  boxShadow: [
                    "0 0 0px rgba(147, 51, 234, 0.4)",
                    "0 0 15px rgba(147, 51, 234, 0.6)",
                    "0 0 0px rgba(147, 51, 234, 0.4)"
                  ]
                } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className={cn(
                    "w-3.5 h-3.5",
                    isCurrent ? "text-purple-400" : "text-slate-500"
                  )} />
                )}
              </motion.div>

              {/* Label */}
              <span className={cn(
                "text-xs font-medium whitespace-nowrap",
                isCompleted && "text-emerald-400",
                isCurrent && "text-white",
                !isCompleted && !isCurrent && "text-slate-500"
              )}>
                {step.label}
              </span>

              {/* Pulse ring for current step */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full border border-purple-500/40"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div className="relative w-12 h-[2px] mx-2">
                <div className="absolute inset-0 bg-slate-700/50 rounded-full" />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: currentStep > step.id ? "100%" : "0%" 
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
