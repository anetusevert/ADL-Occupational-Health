/**
 * Loading Briefing Component
 * 
 * Premium loading screen while AI researches the country
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Database, Search, FileText, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingBriefingProps {
  countryName: string;
  countryFlag: string;
  onComplete?: () => void;
}

const LOADING_STEPS = [
  { id: 'database', label: 'Accessing country database...', icon: Database, duration: 2000 },
  { id: 'research', label: 'Researching recent developments...', icon: Search, duration: 3000 },
  { id: 'analyze', label: 'Analyzing occupational health landscape...', icon: Globe, duration: 2500 },
  { id: 'generate', label: 'Preparing your intelligence briefing...', icon: FileText, duration: 2000 },
  { id: 'finalize', label: 'Finalizing mission parameters...', icon: Sparkles, duration: 1500 },
];

export function LoadingBriefing({ countryName, countryFlag, onComplete }: LoadingBriefingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const runStep = (stepIndex: number) => {
      if (stepIndex >= LOADING_STEPS.length) {
        setProgress(100);
        setTimeout(() => onComplete?.(), 500);
        return;
      }

      setCurrentStep(stepIndex);
      const step = LOADING_STEPS[stepIndex];
      const stepProgress = (stepIndex / LOADING_STEPS.length) * 100;
      const nextProgress = ((stepIndex + 1) / LOADING_STEPS.length) * 100;

      // Animate progress during this step
      const progressStep = (nextProgress - stepProgress) / (step.duration / 50);
      let currentProgress = stepProgress;

      progressInterval = setInterval(() => {
        currentProgress += progressStep;
        if (currentProgress >= nextProgress) {
          currentProgress = nextProgress;
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 50);

      stepTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        runStep(stepIndex + 1);
      }, step.duration);
    };

    runStep(0);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const currentStepData = LOADING_STEPS[currentStep];
  const StepIcon = currentStepData?.icon || Globe;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-adl-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-lg mx-auto px-8"
      >
        {/* ADL Logo */}
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 bg-adl-accent/20 rounded-3xl border border-adl-accent/30 mb-8"
          animate={{
            boxShadow: [
              '0 0 30px rgba(6,182,212,0.3)',
              '0 0 60px rgba(6,182,212,0.5)',
              '0 0 30px rgba(6,182,212,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src="/adl-logo.png" alt="ADL" className="h-14 w-14 object-contain" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Intelligence Briefing
        </h1>
        <p className="text-white/60 mb-8">
          Preparing your mission for <span className="text-adl-accent font-semibold">{countryName}</span>
        </p>

        {/* Country Flag */}
        <motion.div
          className="text-6xl mb-8"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {countryFlag}
        </motion.div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <StepIcon className="w-5 h-5 text-adl-accent" />
            </motion.div>
            <span className="text-white/80">{currentStepData?.label}</span>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-adl-accent to-cyan-400 rounded-full"
            style={{ width: `${progress}%` }}
          />
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '500%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Progress Percentage */}
        <p className="text-sm text-white/40">
          {Math.round(progress)}% complete
        </p>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {LOADING_STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index < currentStep
                  ? 'bg-adl-accent'
                  : index === currentStep
                  ? 'bg-adl-accent animate-pulse'
                  : 'bg-white/20'
              )}
              animate={index === currentStep ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default LoadingBriefing;
