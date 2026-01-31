/**
 * GenerationPanel Component
 * Center panel - generation controls and progress display
 */

import { useEffect, useState } from 'react';
import { Play, Square, RotateCcw, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { QueueItem, GenerationState, StatusMessage } from './types';
import { cn } from '../../lib/utils';

interface GenerationPanelProps {
  queueItems: QueueItem[];
  generationState: GenerationState;
  onGenerateNext: () => void;
  onStopGeneration: () => void;
  onResetProcessing: () => void;
  statusMessage: StatusMessage | null;
  onDismissMessage: () => void;
}

export function GenerationPanel({
  queueItems,
  generationState,
  onGenerateNext,
  onStopGeneration,
  onResetProcessing,
  statusMessage,
  onDismissMessage,
}: GenerationPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generationState.isGenerating && generationState.startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - generationState.startTime!) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [generationState.isGenerating, generationState.startTime]);

  // Calculate stats
  const pendingCount = queueItems.filter((i) => i.status === 'pending').length;
  const processingCount = queueItems.filter((i) => i.status === 'processing').length;
  const completedCount = queueItems.filter((i) => i.status === 'completed').length;
  const hasStuckProcessing = processingCount > 0 && !generationState.isGenerating;
  const canGenerate = pendingCount > 0 && !generationState.isGenerating;

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get next pending item
  const nextItem = queueItems.find((i) => i.status === 'pending');

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-slate-100">Generation Control</h2>
        </div>
        <p className="text-sm text-slate-400">
          Controlled report generation with quality review
        </p>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={cn(
            'mx-4 mt-4 p-3 rounded-lg flex items-start gap-2 text-sm',
            statusMessage.type === 'success' && 'bg-emerald-500/10 text-emerald-400',
            statusMessage.type === 'error' && 'bg-red-500/10 text-red-400',
            statusMessage.type === 'info' && 'bg-cyan-500/10 text-cyan-400',
            statusMessage.type === 'warning' && 'bg-amber-500/10 text-amber-400'
          )}
        >
          {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span className="flex-1">{statusMessage.message}</span>
          <button onClick={onDismissMessage} className="text-slate-400 hover:text-slate-200">
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 w-full mb-8">
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-3xl font-bold text-cyan-400">{processingCount}</div>
            <div className="text-xs text-slate-400 mt-1">Processing</div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-3xl font-bold text-amber-400">{pendingCount}</div>
            <div className="text-xs text-slate-400 mt-1">Pending</div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-3xl font-bold text-emerald-400">{completedCount}</div>
            <div className="text-xs text-slate-400 mt-1">Completed</div>
          </div>
        </div>

        {/* Generation Status */}
        {generationState.isGenerating ? (
          <div className="text-center mb-6">
            {/* Spinner */}
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <p className="text-lg font-medium text-slate-200">
              Generating report...
            </p>
            {generationState.currentItem && (
              <p className="text-sm text-slate-400 mt-1">
                {generationState.currentItem.country_name}
              </p>
            )}
            <p className="text-2xl font-mono text-cyan-400 mt-2">
              {formatTime(elapsedTime)}
            </p>
          </div>
        ) : nextItem ? (
          <div className="text-center mb-6">
            <p className="text-slate-400 mb-2">Next in queue:</p>
            <p className="text-lg font-medium text-slate-200">{nextItem.country_name}</p>
            <p className="text-sm text-slate-400">{nextItem.topic}</p>
          </div>
        ) : (
          <div className="text-center mb-6">
            <p className="text-slate-400">No pending reports</p>
            <p className="text-sm text-slate-500 mt-1">Add countries to start generating</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 w-full max-w-xs">
          {generationState.isGenerating ? (
            <button
              onClick={onStopGeneration}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
            >
              <Square className="w-5 h-5" />
              Stop Generation
            </button>
          ) : (
            <button
              onClick={onGenerateNext}
              disabled={!canGenerate}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-lg transition-all',
                canGenerate
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              <Play className="w-5 h-5" />
              Generate Next
            </button>
          )}

          {hasStuckProcessing && (
            <button
              onClick={onResetProcessing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Stuck Reports
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 text-center">
          Reports are generated one at a time for quality control.
          <br />
          Review each report before proceeding.
        </p>
      </div>
    </div>
  );
}
