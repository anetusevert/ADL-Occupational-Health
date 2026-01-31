/**
 * Loading Briefing Component
 * 
 * Premium loading screen while AI researches the country
 * Shows real-time agent activity when agent_log is provided
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Database, Search, FileText, Sparkles, Brain, Users, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AgentLogEntry {
  timestamp: string;
  agent: string;
  status: string;
  message: string;
  emoji: string;
}

interface LoadingBriefingProps {
  countryName: string;
  countryFlag: string;
  agentLog?: AgentLogEntry[];
  isComplete?: boolean;
  onComplete?: () => void;
}

// Fallback steps when no agent_log is available
const LOADING_STEPS = [
  { id: 'database', label: 'Accessing country database...', icon: Database, emoji: '📊' },
  { id: 'research', label: 'Researching recent developments...', icon: Search, emoji: '🔍' },
  { id: 'analyze', label: 'Analyzing occupational health landscape...', icon: Globe, emoji: '🌍' },
  { id: 'stakeholders', label: 'Identifying key stakeholders...', icon: Users, emoji: '👥' },
  { id: 'institutions', label: 'Mapping institutional framework...', icon: Building2, emoji: '🏛️' },
  { id: 'generate', label: 'Preparing your intelligence briefing...', icon: Brain, emoji: '🧠' },
  { id: 'finalize', label: 'Finalizing mission parameters...', icon: Sparkles, emoji: '✨' },
];

// Map agent names to icons
const AGENT_ICONS: Record<string, React.ElementType> = {
  'Orchestrator': Sparkles,
  'DataAgent': Database,
  'ResearchAgent': Search,
  'BriefingAgent': Brain,
  'IntelligenceAgent': Globe,
};

// Map status to colors
const STATUS_COLORS: Record<string, string> = {
  'starting': 'text-blue-400',
  'researching': 'text-amber-400',
  'analyzing': 'text-purple-400',
  'synthesizing': 'text-cyan-400',
  'querying': 'text-indigo-400',
  'complete': 'text-emerald-400',
  'error': 'text-red-400',
};

export function LoadingBriefing({ 
  countryName, 
  countryFlag, 
  agentLog = [],
  isComplete = false,
  onComplete 
}: LoadingBriefingProps) {
  const [displayedLogs, setDisplayedLogs] = useState<AgentLogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Animate through agent log entries when they arrive
  useEffect(() => {
    if (agentLog.length > 0) {
      // Show logs progressively with a slight delay between each
      let index = 0;
      const showNextLog = () => {
        if (index < agentLog.length) {
          setDisplayedLogs(prev => [...prev, agentLog[index]]);
          setProgress(((index + 1) / agentLog.length) * 100);
          index++;
          // Faster animation when catching up to real-time
          setTimeout(showNextLog, index < agentLog.length - 1 ? 300 : 500);
        }
      };
      showNextLog();
    }
  }, [agentLog]);

  // Auto-scroll log container
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  // Fallback animation when no agent log
  useEffect(() => {
    if (agentLog.length === 0 && !isComplete) {
      let stepTimeout: NodeJS.Timeout;
      let progressInterval: NodeJS.Timeout;

      const runStep = (stepIndex: number) => {
        if (stepIndex >= LOADING_STEPS.length) {
          setProgress(100);
          return;
        }

        setCurrentStep(stepIndex);
        const stepProgress = (stepIndex / LOADING_STEPS.length) * 100;
        const nextProgress = ((stepIndex + 1) / LOADING_STEPS.length) * 100;

        // Animate progress during this step
        const duration = 2000 + Math.random() * 1000;
        const progressStep = (nextProgress - stepProgress) / (duration / 50);
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
        }, duration);
      };

      runStep(0);

      return () => {
        clearTimeout(stepTimeout);
        clearInterval(progressInterval);
      };
    }
  }, [agentLog.length, isComplete]);

  // Handle completion
  useEffect(() => {
    if (isComplete && progress >= 95) {
      setProgress(100);
      const timer = setTimeout(() => onComplete?.(), 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, progress, onComplete]);

  const currentStepData = LOADING_STEPS[currentStep];
  const StepIcon = currentStepData?.icon || Globe;
  const hasAgentLog = agentLog.length > 0;

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
        className="relative z-10 text-center max-w-2xl mx-auto px-8"
      >
        {/* ADL Logo */}
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 bg-adl-accent/20 rounded-2xl border border-adl-accent/30 mb-6"
          animate={{
            boxShadow: [
              '0 0 30px rgba(6,182,212,0.3)',
              '0 0 60px rgba(6,182,212,0.5)',
              '0 0 30px rgba(6,182,212,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src="/adl-logo.png" alt="ADL" className="h-12 w-12 object-contain" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Intelligence Briefing
        </h1>
        <p className="text-white/60 mb-4">
          Preparing your mission for <span className="text-adl-accent font-semibold">{countryName}</span>
        </p>

        {/* Country Flag */}
        <motion.div
          className="text-5xl mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {countryFlag}
        </motion.div>

        {/* Agent Activity Log (when available) */}
        {hasAgentLog ? (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
              <Sparkles className="w-4 h-4 text-adl-accent" />
              <span className="text-sm font-medium text-white/80">Agent Activity</span>
              {!isComplete && (
                <Loader2 className="w-3 h-3 text-adl-accent animate-spin ml-auto" />
              )}
            </div>
            <div 
              ref={logContainerRef}
              className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600"
            >
              <AnimatePresence>
                {displayedLogs.map((entry, index) => {
                  const Icon = AGENT_ICONS[entry.agent] || Sparkles;
                  const statusColor = STATUS_COLORS[entry.status] || 'text-slate-400';
                  const isLast = index === displayedLogs.length - 1;
                  
                  return (
                    <motion.div
                      key={`${entry.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex items-start gap-3 text-sm py-1.5",
                        isLast && !isComplete && "animate-pulse"
                      )}
                    >
                      <span className="text-lg flex-shrink-0">{entry.emoji}</span>
                      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", statusColor)} />
                      <div className="flex-1 min-w-0">
                        <span className={cn("font-medium", statusColor)}>[{entry.agent}]</span>
                        <span className="text-white/70 ml-2">{entry.message}</span>
                      </div>
                      {entry.status === 'complete' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Current Step (fallback) */
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <span className="text-2xl">{currentStepData?.emoji}</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <StepIcon className="w-5 h-5 text-adl-accent" />
              </motion.div>
              <span className="text-white/80">{currentStepData?.label}</span>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Progress Bar */}
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-adl-accent to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
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
          {isComplete ? 'Complete!' : `${Math.round(progress)}% complete`}
        </p>

        {/* Step Indicators (only for fallback) */}
        {!hasAgentLog && (
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
        )}
      </motion.div>
    </div>
  );
}

export default LoadingBriefing;
