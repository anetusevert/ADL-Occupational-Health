/**
 * Agent Activity Indicator Component
 * 
 * Shows real-time AI agent activity during workflow execution
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  Database,
  Sparkles,
  CheckCircle,
  Loader2,
  Globe,
  FileText,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AgentLogEntry {
  timestamp: string;
  agent: string;
  status: 'starting' | 'researching' | 'analyzing' | 'synthesizing' | 'complete' | 'error';
  message: string;
  emoji: string;
}

interface AgentActivityIndicatorProps {
  isLoading: boolean;
  agentLog?: AgentLogEntry[];
  currentPhase?: string;
  variant?: 'minimal' | 'detailed' | 'inline';
  className?: string;
}

const AGENT_ICONS: Record<string, typeof Brain> = {
  'DataAgent': Database,
  'ResearchAgent': Search,
  'IntelligenceAgent': Globe,
  'SynthesisAgent': Sparkles,
  'BriefingAgent': FileText,
  'AdvisorAgent': Brain,
  'NewsAgent': FileText,
  'ReportAgent': FileText,
  'Orchestrator': Brain,
};

const STATUS_COLORS: Record<string, string> = {
  'starting': 'text-blue-400',
  'researching': 'text-cyan-400',
  'analyzing': 'text-purple-400',
  'synthesizing': 'text-amber-400',
  'complete': 'text-emerald-400',
  'error': 'text-red-400',
};

export function AgentActivityIndicator({
  isLoading,
  agentLog = [],
  currentPhase = 'Processing',
  variant = 'minimal',
  className,
}: AgentActivityIndicatorProps) {
  if (!isLoading && agentLog.length === 0) return null;

  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn('flex items-center gap-2 text-sm text-white/60', className)}
      >
        {isLoading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-4 h-4 text-adl-accent" />
          </motion.div>
        )}
        <span>{currentPhase}</span>
      </motion.div>
    );
  }

  if (variant === 'minimal') {
    const latestEntry = agentLog[agentLog.length - 1];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10',
          className
        )}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-5 h-5 text-adl-accent" />
          </motion.div>
        ) : (
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">
            {latestEntry?.message || currentPhase}
          </p>
          {latestEntry?.agent && (
            <p className="text-xs text-white/40 truncate">
              {latestEntry.agent}
            </p>
          )}
        </div>
        
        {isLoading && (
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-adl-accent"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // Detailed variant
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'p-4 rounded-xl bg-white/5 border border-white/10 space-y-3',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-5 h-5 text-adl-accent" />
            </motion.div>
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-sm font-medium text-white">
            {isLoading ? 'Processing' : 'Complete'}
          </span>
        </div>
        
        {isLoading && (
          <span className="text-xs text-white/40">
            {agentLog.length} operations
          </span>
        )}
      </div>
      
      {/* Agent Log */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {agentLog.map((entry, index) => {
            // Skip malformed entries
            if (!entry || !entry.agent) return null;
            
            const Icon = AGENT_ICONS[entry.agent] || Brain;
            const isLatest = index === agentLog.length - 1;
            
            return (
              <motion.div
                key={`${entry.agent}-${entry.timestamp}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg transition-colors',
                  isLatest && isLoading ? 'bg-white/5' : 'bg-transparent'
                )}
              >
                <div className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                  entry.status === 'complete' ? 'bg-emerald-500/20' : 'bg-white/10'
                )}>
                  {entry.status === 'complete' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isLatest && isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-3.5 h-3.5 text-adl-accent" />
                    </motion.div>
                  ) : (
                    <Icon className="w-3.5 h-3.5 text-white/40" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-medium',
                      STATUS_COLORS[entry.status] || 'text-white/60'
                    )}>
                      {entry.agent}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {entry.emoji}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate">
                    {entry.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {isLoading && agentLog.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-white/40">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-4 h-4" />
            </motion.div>
            <span>Initializing analysis...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AgentActivityIndicator;
