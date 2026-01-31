/**
 * ExecutionPanel Component
 * 
 * Bottom panel showing workflow execution logs and agent activity
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Trash2,
  Download,
  Copy,
  AlertTriangle,
  Brain,
  Database,
  Globe,
  Sparkles,
  Filter,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ExecutionLogEntry {
  id: string;
  timestamp: Date;
  agent: string;
  status: 'starting' | 'running' | 'complete' | 'error' | 'warning';
  message: string;
  emoji?: string;
  duration?: number;
  details?: string;
}

export interface ExecutionRun {
  id: string;
  workflowId: string;
  workflowName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'error' | 'cancelled';
  logs: ExecutionLogEntry[];
}

interface ExecutionPanelProps {
  runs: ExecutionRun[];
  currentRun?: ExecutionRun | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClearLogs?: () => void;
  onExportLogs?: () => void;
  className?: string;
}

const AGENT_ICONS: Record<string, typeof Brain> = {
  DataAgent: Database,
  ResearchAgent: Globe,
  IntelligenceAgent: Globe,
  SynthesisAgent: Sparkles,
  BriefingAgent: Brain,
  AdvisorAgent: Brain,
  NewsAgent: Sparkles,
  ReportAgent: Sparkles,
};

const STATUS_STYLES: Record<string, { icon: typeof CheckCircle; color: string; bgColor: string }> = {
  starting: { icon: Loader2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  running: { icon: Loader2, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  complete: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  error: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
};

export function ExecutionPanel({
  runs,
  currentRun,
  isExpanded = true,
  onToggleExpand,
  onClearLogs,
  onExportLogs,
  className,
}: ExecutionPanelProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (currentRun && isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentRun?.logs.length, isExpanded]);

  // Use current run or selected run
  const displayRun = currentRun || runs.find(r => r.id === selectedRunId) || runs[0];

  // Filter logs by status
  const filteredLogs = displayRun?.logs.filter(log => 
    !statusFilter || log.status === statusFilter
  ) || [];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const copyLogsToClipboard = () => {
    if (!displayRun) return;
    const text = displayRun.logs.map(log => 
      `[${formatTime(log.timestamp)}] [${log.agent}] [${log.status.toUpperCase()}] ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  if (!isExpanded) {
    return (
      <div 
        className={cn(
          'flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-white/10 cursor-pointer hover:bg-slate-800/80 transition-colors',
          className
        )}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/60">Execution Logs</span>
          {currentRun?.status === 'running' && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Running
            </span>
          )}
          {currentRun?.status === 'success' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              Success
            </span>
          )}
          {currentRun?.status === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <XCircle className="w-3 h-3" />
              Error
            </span>
          )}
        </div>
        <ChevronUp className="w-4 h-4 text-white/40" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col bg-slate-900/90 border-t border-white/10', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-white/60" />
          <span className="text-sm font-medium text-white">Execution Logs</span>
          
          {/* Run selector */}
          {runs.length > 1 && (
            <select
              value={selectedRunId || currentRun?.id || ''}
              onChange={(e) => setSelectedRunId(e.target.value || null)}
              className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 outline-none"
            >
              {currentRun && <option value={currentRun.id}>Current Run</option>}
              {runs.map(run => (
                <option key={run.id} value={run.id}>
                  {run.workflowName} - {formatTime(run.startTime)}
                </option>
              ))}
            </select>
          )}
          
          {/* Status filter */}
          <div className="flex items-center gap-1 ml-4">
            <Filter className="w-3 h-3 text-white/30" />
            {['complete', 'error', 'running'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded transition-colors',
                  statusFilter === status
                    ? STATUS_STYLES[status].bgColor + ' ' + STATUS_STYLES[status].color
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Run status */}
          {displayRun && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Clock className="w-3 h-3" />
              {displayRun.endTime
                ? formatDuration(displayRun.endTime.getTime() - displayRun.startTime.getTime())
                : 'Running...'}
            </div>
          )}
          
          {/* Actions */}
          <button
            onClick={copyLogsToClipboard}
            className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Copy logs"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onExportLogs}
            className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Export logs"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClearLogs}
            className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Collapse panel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 min-h-0 max-h-48 overflow-y-auto px-4 py-2 space-y-1 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/30">
            <div className="text-center">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No logs to display</p>
              <p className="text-[10px] mt-1">Run a workflow to see execution logs</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredLogs.map((log, index) => {
              const StatusIcon = STATUS_STYLES[log.status]?.icon || CheckCircle;
              const AgentIcon = AGENT_ICONS[log.agent] || Brain;
              const statusStyles = STATUS_STYLES[log.status] || STATUS_STYLES.complete;
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'flex items-start gap-3 py-1.5 px-2 rounded hover:bg-white/5 transition-colors',
                    log.status === 'error' && 'bg-red-500/5'
                  )}
                >
                  {/* Timestamp */}
                  <span className="text-white/30 flex-shrink-0 w-16">
                    {formatTime(log.timestamp)}
                  </span>
                  
                  {/* Status Icon */}
                  <StatusIcon className={cn(
                    'w-4 h-4 flex-shrink-0',
                    statusStyles.color,
                    log.status === 'running' || log.status === 'starting' ? 'animate-spin' : ''
                  )} />
                  
                  {/* Agent */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 w-28">
                    <AgentIcon className="w-3 h-3 text-white/40" />
                    <span className="text-white/60 truncate">{log.agent}</span>
                  </div>
                  
                  {/* Message */}
                  <span className="text-white/80 flex-1">
                    {log.emoji && <span className="mr-1">{log.emoji}</span>}
                    {log.message}
                  </span>
                  
                  {/* Duration */}
                  {log.duration !== undefined && (
                    <span className="text-white/30 flex-shrink-0">
                      {formatDuration(log.duration)}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

export default ExecutionPanel;
