/**
 * ExecutionPanel Component
 * 
 * Shows real-time workflow execution logs and agent activity
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Play,
  Square,
  Trash2,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Terminal,
  Brain,
  Search,
  Database,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ExecutionLogEntry {
  id: string;
  timestamp: string;
  agent: string;
  status: 'starting' | 'running' | 'complete' | 'error' | 'warning';
  message: string;
  emoji?: string;
  duration_ms?: number;
}

export interface ExecutionResult {
  success: boolean;
  execution_time_ms: number;
  agent_log: ExecutionLogEntry[];
  errors: string[];
  data?: Record<string, unknown>;
}

interface ExecutionPanelProps {
  isRunning: boolean;
  logs: ExecutionLogEntry[];
  result?: ExecutionResult;
  onClear?: () => void;
  onExport?: () => void;
  onStop?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const AGENT_ICONS: Record<string, typeof Brain> = {
  'Orchestrator': Brain,
  'ResearchAgent': Search,
  'DataAgent': Database,
  'SynthesisAgent': Sparkles,
  'BriefingAgent': Brain,
  'AdvisorAgent': Brain,
  'NewsAgent': Terminal,
  'ReportAgent': Terminal,
};

const STATUS_STYLES: Record<string, { color: string; icon: typeof CheckCircle; bg: string }> = {
  starting: { color: 'text-blue-400', icon: Loader2, bg: 'bg-blue-500/10' },
  running: { color: 'text-amber-400', icon: Loader2, bg: 'bg-amber-500/10' },
  complete: { color: 'text-emerald-400', icon: CheckCircle, bg: 'bg-emerald-500/10' },
  error: { color: 'text-red-400', icon: XCircle, bg: 'bg-red-500/10' },
  warning: { color: 'text-amber-400', icon: AlertCircle, bg: 'bg-amber-500/10' },
};

export function ExecutionPanel({
  isRunning,
  logs,
  result,
  onClear,
  onExport,
  onStop,
  collapsed = false,
  onToggleCollapse,
  className,
}: ExecutionPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  if (collapsed) {
    return (
      <div className={cn(
        'flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-white/10 cursor-pointer hover:bg-slate-800/80 transition-colors',
        className
      )} onClick={onToggleCollapse}>
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/60">Execution Logs</span>
          {isRunning && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs text-amber-400">Running...</span>
            </div>
          )}
          {result && !isRunning && (
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">
                    Complete ({formatDuration(result.execution_time_ms)})
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400">Failed</span>
                </>
              )}
            </div>
          )}
        </div>
        <ChevronUp className="w-4 h-4 text-white/40" />
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col bg-slate-900/80 border-t border-white/10',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-white/40" />
          <span className="text-sm font-medium text-white">Execution Logs</span>
          <span className="text-xs text-white/30">({logs.length} entries)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Running Status */}
          {isRunning && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-500/10">
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-xs text-amber-400">Running</span>
              {onStop && (
                <button
                  onClick={onStop}
                  className="p-0.5 rounded hover:bg-white/10"
                  title="Stop execution"
                >
                  <Square className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>
          )}

          {/* Result Status */}
          {result && !isRunning && (
            <div className={cn(
              'flex items-center gap-2 px-2 py-1 rounded',
              result.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
            )}>
              {result.success ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className={cn(
                'text-xs',
                result.success ? 'text-emerald-400' : 'text-red-400'
              )}>
                {result.success ? 'Complete' : 'Failed'}
              </span>
              <span className="text-xs text-white/40">
                {formatDuration(result.execution_time_ms)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onClear && logs.length > 0 && (
              <button
                onClick={onClear}
                className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onExport && logs.length > 0 && (
              <button
                onClick={onExport}
                className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Export logs"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Collapse"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Container */}
      <div 
        className="flex-1 overflow-y-auto min-h-[120px] max-h-[200px] px-2 py-2 space-y-1 font-mono text-xs"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
          setAutoScroll(atBottom);
        }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/30">
            <div className="text-center">
              <Play className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>Run a workflow to see execution logs</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => {
              const AgentIcon = AGENT_ICONS[log.agent] || Brain;
              const statusStyle = STATUS_STYLES[log.status] || STATUS_STYLES.running;
              const StatusIcon = statusStyle.icon;

              return (
                <motion.div
                  key={log.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'flex items-start gap-2 px-2 py-1.5 rounded',
                    statusStyle.bg
                  )}
                >
                  {/* Timestamp */}
                  <span className="text-white/30 flex-shrink-0 w-16">
                    {formatTime(log.timestamp)}
                  </span>

                  {/* Status Icon */}
                  <StatusIcon className={cn(
                    'w-3.5 h-3.5 flex-shrink-0 mt-0.5',
                    statusStyle.color,
                    log.status === 'running' || log.status === 'starting' ? 'animate-spin' : ''
                  )} />

                  {/* Agent */}
                  <span className={cn(
                    'flex-shrink-0 w-28 truncate font-medium',
                    statusStyle.color
                  )}>
                    {log.emoji} {log.agent}
                  </span>

                  {/* Message */}
                  <span className="text-white/70 flex-1">
                    {log.message}
                  </span>

                  {/* Duration */}
                  {log.duration_ms && (
                    <span className="text-white/30 flex-shrink-0">
                      {formatDuration(log.duration_ms)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Errors */}
      {result && result.errors.length > 0 && (
        <div className="px-2 py-2 border-t border-white/10">
          <div className="text-xs text-red-400 font-medium mb-1">Errors:</div>
          {result.errors.map((error, i) => (
            <div key={i} className="text-xs text-red-300/80 pl-2">
              • {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExecutionPanel;
