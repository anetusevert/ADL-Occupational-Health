/**
 * Step Indicator Component
 * Animated progress stepper for the 3-step wizard flow
 */

import { motion } from "framer-motion";
import { Check, Globe, Layers, Table2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface Step {
  id: number;
  label: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: 1, label: "Select Countries", icon: Globe },
  { id: 2, label: "Choose Data Layers", icon: Layers },
  { id: 3, label: "View Results", icon: Table2 },
];

interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connection line background */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-700/50 mx-16" />
        
        {/* Progress line */}
        <motion.div
          className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 mx-16"
          initial={{ width: "0%" }}
          animate={{
            width: `${((Math.min(currentStep, 3) - 1) / 2) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted || step.id <= currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center z-10"
            >
              {/* Step Circle */}
              <motion.button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-gradient-to-br from-cyan-500 to-indigo-500 border-transparent text-white shadow-lg shadow-cyan-500/25"
                    : isCurrent
                    ? "bg-slate-800 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800/50 border-slate-600 text-slate-500",
                  isClickable && !isCompleted && "cursor-pointer hover:border-cyan-400"
                )}
                whileHover={isClickable ? { scale: 1.05 } : {}}
                whileTap={isClickable ? { scale: 0.95 } : {}}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </motion.button>

              {/* Step Label */}
              <motion.span
                className={cn(
                  "mt-3 text-sm font-medium transition-colors duration-300 whitespace-nowrap",
                  isCompleted || isCurrent ? "text-white" : "text-slate-500"
                )}
                animate={{
                  color: isCompleted || isCurrent ? "#fff" : "#64748b",
                }}
              >
                {step.label}
              </motion.span>

              {/* Step Number Badge */}
              <span
                className={cn(
                  "absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center",
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-700 text-slate-400"
                )}
              >
                {step.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepIndicator;
