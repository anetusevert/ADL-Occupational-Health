/**
 * GOHIP Platform - Report Workshop
 * =================================
 * 
 * Admin-only dashboard for controlled report generation with:
 * - Queue management (add/remove countries)
 * - One-by-one generation with real-time progress
 * - Immediate preview and quality iteration
 * - Cancel/reset capabilities
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  Square,
  CheckSquare,
  Loader2,
  Trash2,
  Plus,
  FileText,
  Zap,
  ArrowRight,
  RotateCcw,
  Eye,
  ChevronRight,
  X,
  StopCircle,
  Sparkles,
  Brain,
  Search,
  Filter,
  GripVertical,
} from 'lucide-react';
import {
  apiClient,
  getStrategicDeepDiveCountries,
  getQueueStatus,
  resetProcessingReports,
  cancelAllGeneration,
  addCountryToQueue,
  removeFromQueue,
  reorderQueue,
  generateControlled,
  type QueueItem,
  type QueueStatusResponse,
  type ControlledGenerateResponse,
  type StrategicDeepDiveReport,
} from '../../services/api';

// All 13 analysis topics
const ALL_TOPICS = [
  "Comprehensive Occupational Health Assessment",
  "Policy & Regulatory Framework",
  "Inspection & Enforcement Capacity",
  "Tripartite Governance & Social Dialogue",
  "Chemical & Carcinogen Exposure Control",
  "Physical Hazards & Ergonomics",
  "Heat Stress & Climate Adaptation",
  "Occupational Disease Surveillance",
  "Workplace Mental Health Programs",
  "Health Screening & Medical Surveillance",
  "Workers' Compensation Systems",
  "Return-to-Work & Rehabilitation",
  "Migrant & Informal Worker Protection",
];

// EU and GCC country codes for quick selection
const EU_COUNTRIES = [
  "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK",
  "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA",
  "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR",
  "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE",
  "CHE", "UKR", "GBR", "VAT"
];

const GCC_COUNTRIES = ["BHR", "KWT", "OMN", "QAT", "SAU", "ARE"];

// =============================================================================
// PROCESSING DIALOG COMPONENT
// =============================================================================

interface ProcessingDialogProps {
  processingCount: number;
  pendingCount: number;
  onResetAndStart: () => void;
  onContinue: () => void;
  onLeave: () => void;
}

function ProcessingDialog({ processingCount, pendingCount, onResetAndStart, onContinue, onLeave }: ProcessingDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Generation In Progress</h2>
            <p className="text-sm text-slate-400">
              {processingCount} reports processing, {pendingCount} pending
            </p>
          </div>
        </div>
        
        <p className="text-sm text-slate-300 mb-6">
          There are reports currently marked as "processing" in the system. 
          This usually means a previous generation session was interrupted. 
          What would you like to do?
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onResetAndStart}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-white">Reset and Start Fresh</p>
              <p className="text-xs text-slate-400">Clear all processing status, start with empty queue</p>
            </div>
          </button>
          
          <button
            onClick={onContinue}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 transition-all"
          >
            <Eye className="w-5 h-5 text-blue-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-white">Continue Monitoring</p>
              <p className="text-xs text-slate-400">Keep watching current status without changes</p>
            </div>
          </button>
          
          <button
            onClick={onLeave}
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5 text-slate-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-300">Leave As-Is</p>
              <p className="text-xs text-slate-500">Don't change anything, just view</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// QUEUE ITEM COMPONENT
// =============================================================================

interface QueueItemRowProps {
  item: QueueItem;
  index: number;
  isActive: boolean;
  onRemove: (id: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

function QueueItemRow({ 
  item, 
  index,
  isActive, 
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: QueueItemRowProps) {
  const isPending = item.status === 'pending';
  const isDragTarget = dragOverIndex === index;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      draggable={isPending}
      onDragStart={(e) => isPending && onDragStart(e as any, index)}
      onDragOver={(e) => {
        e.preventDefault();
        if (isPending) onDragOver(e as any, index);
      }}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
        isDragging && isDragTarget
          ? 'border-cyan-400 border-dashed bg-cyan-500/20'
          : isActive
          ? 'bg-cyan-500/10 border-cyan-500/30'
          : item.status === 'processing'
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-slate-800/50 border-slate-700/30'
      } ${isPending ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Drag Handle */}
      {isPending && (
        <div className="flex-shrink-0 text-slate-600 hover:text-slate-400 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      
      {/* Status Icon */}
      {item.status === 'processing' && (
        <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
      )}
      {isPending && !isDragging && (
        <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{item.iso_code}</span>
          <span className="text-sm text-white truncate">{item.country_name}</span>
        </div>
        <p className="text-[10px] text-slate-500 truncate">{item.topic}</p>
      </div>
      
      {isPending && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

// =============================================================================
// REPORT PREVIEW COMPONENT
// =============================================================================

interface ReportPreviewProps {
  report: StrategicDeepDiveReport | null;
  onRegenerate: () => void;
  onApprove: () => void;
  isRegenerating: boolean;
}

function ReportPreview({ report, onRegenerate, onApprove, isRegenerating }: ReportPreviewProps) {
  if (!report) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Report Yet</h3>
          <p className="text-sm text-slate-400">
            Generate a report from the queue to preview it here and review quality.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Report Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 px-4 py-3 border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-300 text-xs mb-1">
              <Sparkles className="w-3 h-3" />
              <span className="uppercase tracking-wider">Report Preview</span>
            </div>
            <h3 className="text-white font-semibold">{report.strategy_name || report.country_name}</h3>
            <p className="text-xs text-purple-200/60">{report.country_name}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-xs hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve & Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Report Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Executive Summary */}
        {report.executive_summary && (
          <section>
            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Executive Summary
            </h4>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-sm text-slate-300 leading-relaxed">{report.executive_summary}</p>
            </div>
          </section>
        )}
        
        {/* Key Findings */}
        {report.key_findings && report.key_findings.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Key Findings ({report.key_findings.length})
            </h4>
            <div className="space-y-2">
              {report.key_findings.slice(0, 3).map((finding: any, idx: number) => (
                <div key={idx} className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/30">
                  <p className="text-xs font-medium text-white">{finding.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{finding.description}</p>
                </div>
              ))}
              {report.key_findings.length > 3 && (
                <p className="text-xs text-slate-500 text-center">
                  +{report.key_findings.length - 3} more findings
                </p>
              )}
            </div>
          </section>
        )}
        
        {/* Strategic Recommendations */}
        {report.strategic_recommendations && report.strategic_recommendations.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              Recommendations ({report.strategic_recommendations.length})
            </h4>
            <div className="space-y-2">
              {report.strategic_recommendations.slice(0, 2).map((rec: any, idx: number) => (
                <div key={idx} className="bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-lg p-2.5 border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white">{rec.title}</p>
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400">
                      {rec.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Quality Indicator */}
        <section className="border-t border-slate-700/50 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">Quality Check</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/30 rounded-lg p-2">
              <p className="text-lg font-bold text-white">{report.key_findings?.length || 0}</p>
              <p className="text-[10px] text-slate-500">Findings</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2">
              <p className="text-lg font-bold text-white">{report.strategic_recommendations?.length || 0}</p>
              <p className="text-[10px] text-slate-500">Recommendations</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2">
              <p className="text-lg font-bold text-white">
                {(report.strengths?.length || 0) + (report.weaknesses?.length || 0)}
              </p>
              <p className="text-[10px] text-slate-500">SWOT Items</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// =============================================================================
// COUNTRY SELECTOR COMPONENT
// =============================================================================

interface CountrySelectorProps {
  onAddCountry: (isoCode: string, topics: string[]) => void;
  onClose: () => void;
}

function CountrySelector({ onAddCountry, onClose }: CountrySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set(ALL_TOPICS));
  
  const { data: countriesData } = useQuery({
    queryKey: ['strategic-deep-dive-countries'],
    queryFn: getStrategicDeepDiveCountries,
    staleTime: 60000,
  });
  
  const filteredCountries = useMemo(() => {
    if (!countriesData?.countries) return [];
    const query = searchQuery.toLowerCase();
    return countriesData.countries.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.iso_code.toLowerCase().includes(query)
    );
  }, [countriesData, searchQuery]);
  
  const handleAddCountry = (isoCode: string) => {
    onAddCountry(isoCode, Array.from(selectedTopics));
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            Add Country to Queue
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              autoFocus
            />
          </div>
          
          {/* Topic Selection */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Topics to generate:</p>
              <button
                onClick={() => setSelectedTopics(selectedTopics.size === ALL_TOPICS.length ? new Set() : new Set(ALL_TOPICS))}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                {selectedTopics.size === ALL_TOPICS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TOPICS.map(topic => (
                <button
                  key={topic}
                  onClick={() => {
                    const next = new Set(selectedTopics);
                    if (next.has(topic)) next.delete(topic);
                    else next.add(topic);
                    setSelectedTopics(next);
                  }}
                  className={`px-2 py-1 rounded text-[10px] transition-colors ${
                    selectedTopics.has(topic)
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-700/50 text-slate-500 border border-slate-700'
                  }`}
                >
                  {topic.length > 25 ? topic.slice(0, 25) + '...' : topic}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {filteredCountries.slice(0, 50).map(country => (
              <button
                key={country.iso_code}
                onClick={() => handleAddCountry(country.iso_code)}
                className="flex items-center gap-2 p-2.5 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-all text-left"
              >
                <span className="text-xs font-mono text-slate-400">{country.iso_code}</span>
                <span className="text-sm text-white flex-1 truncate">{country.name}</span>
                {country.completed_reports > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                    {country.completed_reports}/13
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function GenerationProgress() {
  const queryClient = useQueryClient();
  
  // UI State
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [dialogHandled, setDialogHandled] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<{
    iso_code: string;
    country_name: string;
    topic: string;
    startTime: number;
  } | null>(null);
  const [lastGeneratedReport, setLastGeneratedReport] = useState<StrategicDeepDiveReport | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [autoGenerateNext, setAutoGenerateNext] = useState(false);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Queries
  const { data: queueStatus, isLoading: isLoadingQueue, error: queueError, refetch: refetchQueue } = useQuery({
    queryKey: ['generation-queue-status'],
    queryFn: getQueueStatus,
    refetchInterval: isGenerating ? 5000 : 15000,
    staleTime: 5000,
    retry: 2,
  });
  
  // Check for processing reports on mount
  useEffect(() => {
    if (!dialogHandled && queueStatus) {
      if (queueStatus.processing_count > 0) {
        setShowProcessingDialog(true);
      } else {
        setDialogHandled(true);
      }
    }
  }, [queueStatus, dialogHandled]);
  
  // Mutations
  const resetMutation = useMutation({
    mutationFn: resetProcessingReports,
    onSuccess: (data) => {
      setStatusMessage({ type: 'success', text: data.message });
      queryClient.invalidateQueries({ queryKey: ['generation-queue-status'] });
      setShowProcessingDialog(false);
      setDialogHandled(true);
      setTimeout(() => setStatusMessage(null), 3000);
    },
    onError: (error: any) => {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to reset' });
    },
  });
  
  const addToQueueMutation = useMutation({
    mutationFn: ({ isoCode, topics }: { isoCode: string; topics: string[] }) =>
      addCountryToQueue(isoCode, topics),
    onSuccess: (data) => {
      setStatusMessage({ type: 'success', text: data.message });
      queryClient.invalidateQueries({ queryKey: ['generation-queue-status'] });
      setTimeout(() => setStatusMessage(null), 3000);
    },
    onError: (error: any) => {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to add to queue' });
    },
  });
  
  const removeFromQueueMutation = useMutation({
    mutationFn: removeFromQueue,
    onSuccess: (data) => {
      setStatusMessage({ type: 'info', text: data.message });
      queryClient.invalidateQueries({ queryKey: ['generation-queue-status'] });
      setTimeout(() => setStatusMessage(null), 3000);
    },
  });
  
  // Reorder queue mutation
  const reorderMutation = useMutation({
    mutationFn: (newOrder: string[]) => reorderQueue(newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-queue-status'] });
    },
    onError: (error: any) => {
      setStatusMessage({ type: 'error', text: error.message || 'Failed to reorder queue' });
      setTimeout(() => setStatusMessage(null), 3000);
    },
  });
  
  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Reorder the queue items
      const pendingItems = queueItems.filter(item => item.status === 'pending');
      const newOrder = [...pendingItems];
      const [draggedItem] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dragOverIndex, 0, draggedItem);
      
      // Get new order of IDs and call API
      const newOrderIds = newOrder.map(item => item.id);
      reorderMutation.mutate(newOrderIds);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, queueItems, reorderMutation]);
  
  // Generate next report from queue
  const generateNext = useCallback(async () => {
    if (!queueStatus || queueStatus.queue_items.length === 0) {
      setStatusMessage({ type: 'info', text: 'Queue is empty. Add countries to generate.' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    // Get first pending item
    const nextItem = queueStatus.queue_items.find(item => item.status === 'pending');
    if (!nextItem) {
      setStatusMessage({ type: 'info', text: 'No pending reports in queue.' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    
    setIsGenerating(true);
    setCurrentGeneration({
      iso_code: nextItem.iso_code,
      country_name: nextItem.country_name,
      topic: nextItem.topic,
      startTime: Date.now(),
    });
    setLastGeneratedReport(null);
    
    try {
      const result = await generateControlled(nextItem.iso_code, nextItem.topic);
      
      if (result.success && result.report) {
        setLastGeneratedReport(result.report);
        setStatusMessage({
          type: 'success',
          text: `Generated ${result.country_name} - ${result.topic} in ${result.generation_time_seconds}s`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Generation failed'
        });
      }
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        text: error.message || 'Generation failed'
      });
    } finally {
      setIsGenerating(false);
      setCurrentGeneration(null);
      queryClient.invalidateQueries({ queryKey: ['generation-queue-status'] });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  }, [queueStatus, queryClient]);
  
  // Handle dialog actions
  const handleResetAndStart = () => {
    resetMutation.mutate();
  };
  
  const handleContinue = () => {
    setShowProcessingDialog(false);
    setDialogHandled(true);
  };
  
  const handleLeave = () => {
    setShowProcessingDialog(false);
    setDialogHandled(true);
  };
  
  // Handle country add
  const handleAddCountry = (isoCode: string, topics: string[]) => {
    addToQueueMutation.mutate({ isoCode, topics });
  };
  
  // Handle approve and continue
  const handleApproveAndNext = () => {
    setLastGeneratedReport(null);
    if (autoGenerateNext) {
      generateNext();
    }
  };
  
  // Handle regenerate
  const handleRegenerate = async () => {
    if (!lastGeneratedReport) return;
    
    setIsGenerating(true);
    setCurrentGeneration({
      iso_code: lastGeneratedReport.iso_code,
      country_name: lastGeneratedReport.country_name || lastGeneratedReport.iso_code,
      topic: lastGeneratedReport.topic || 'Comprehensive Occupational Health Assessment',
      startTime: Date.now(),
    });
    
    try {
      const result = await generateControlled(
        lastGeneratedReport.iso_code,
        lastGeneratedReport.topic || 'Comprehensive Occupational Health Assessment'
      );
      
      if (result.success && result.report) {
        setLastGeneratedReport(result.report);
        setStatusMessage({ type: 'success', text: 'Report regenerated successfully' });
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Regeneration failed' });
      }
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Regeneration failed' });
    } finally {
      setIsGenerating(false);
      setCurrentGeneration(null);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };
  
  // Calculate elapsed time
  const elapsedSeconds = currentGeneration
    ? Math.floor((Date.now() - currentGeneration.startTime) / 1000)
    : 0;
  
  const pendingCount = queueStatus?.pending_count || 0;
  const processingCount = queueStatus?.processing_count || 0;
  const queueItems = queueStatus?.queue_items || [];
  
  // Error state - show a friendly error UI instead of crashing
  if (queueError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="bg-slate-800/50 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-6">
            Unable to connect to the server. This could be a network issue or the server may be temporarily unavailable.
          </p>
          <button
            onClick={() => refetchQueue()}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state - show a spinner on initial load
  if (isLoadingQueue && !queueStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading queue status...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Processing Dialog */}
      <AnimatePresence>
        {showProcessingDialog && (
          <ProcessingDialog
            processingCount={processingCount}
            pendingCount={pendingCount}
            onResetAndStart={handleResetAndStart}
            onContinue={handleContinue}
            onLeave={handleLeave}
          />
        )}
      </AnimatePresence>
      
      {/* Country Selector Modal */}
      <AnimatePresence>
        {showCountrySelector && (
          <CountrySelector
            onAddCountry={handleAddCountry}
            onClose={() => setShowCountrySelector(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Main Layout */}
      <div className="h-full flex flex-col overflow-hidden p-4">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Report Workshop</h1>
              <p className="text-xs text-slate-400">Controlled generation with quality review</p>
            </div>
          </div>
          
          {/* Status Message */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : statusMessage.type === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {statusMessage.type === 'error' && <XCircle className="w-4 h-4" />}
                {statusMessage.type === 'info' && <Activity className="w-4 h-4" />}
                {statusMessage.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Three-Panel Layout - Responsive: Stack on mobile, side-by-side on desktop */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden lg:overflow-visible">
          {/* Left Panel: Queue Management */}
          <div className="w-full lg:w-[280px] flex-shrink-0 flex flex-col bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden max-h-[40vh] lg:max-h-none">
            <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-700/40">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Generation Queue
                </h2>
                <span className="text-xs text-slate-400">
                  {pendingCount} pending
                </span>
              </div>
            </div>
            
            {/* Queue Actions */}
            <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700/40 space-y-2">
              <button
                onClick={() => setShowCountrySelector(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm font-medium hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Country
              </button>
              
              {pendingCount > 0 && (
                <button
                  onClick={() => cancelAllGeneration(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-400 text-xs hover:bg-slate-700 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Queue
                </button>
              )}
            </div>
            
            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {queueItems.length > 0 ? (
                  queueItems.map((item, index) => (
                    <QueueItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      isActive={currentGeneration?.iso_code === item.iso_code && currentGeneration?.topic === item.topic}
                      onRemove={(id) => removeFromQueueMutation.mutate(id)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedIndex !== null}
                      dragOverIndex={dragOverIndex}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Queue is empty</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Add countries to start generating
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Center Panel: Generation Control */}
          <div className="w-full lg:w-[300px] flex-shrink-0 flex flex-col bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden max-h-[40vh] lg:max-h-none">
            <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-700/40">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Generation Control
              </h2>
            </div>
            
            {/* Generation Status */}
            <div className="flex-1 flex flex-col p-4">
              {isGenerating && currentGeneration ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 border-4 border-cyan-500/30 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                    </div>
                  </div>
                  
                  <h3 className="text-white font-semibold mb-1">Generating...</h3>
                  <p className="text-sm text-slate-400 text-center mb-2">
                    {currentGeneration.country_name}
                  </p>
                  <p className="text-xs text-slate-500 text-center mb-4">
                    {currentGeneration.topic}
                  </p>
                  
                  <div className="w-full bg-slate-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Time Elapsed</span>
                      <span className="text-white font-mono">
                        {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>AI Analysis in progress...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-700/30 rounded-2xl flex items-center justify-center mb-4">
                    <Play className="w-8 h-8 text-slate-500" />
                  </div>
                  
                  <h3 className="text-white font-semibold mb-1">Ready to Generate</h3>
                  <p className="text-xs text-slate-500 text-center mb-6">
                    {pendingCount > 0
                      ? `${pendingCount} reports in queue`
                      : 'Add countries to the queue first'
                    }
                  </p>
                  
                  <button
                    onClick={generateNext}
                    disabled={pendingCount === 0 || isGenerating}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                      pendingCount > 0 && !isGenerating
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-5 h-5" />
                    Generate Next
                  </button>
                  
                  {/* Auto-generate toggle */}
                  <label className="flex items-center gap-2 mt-4 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoGenerateNext}
                      onChange={(e) => setAutoGenerateNext(e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    Auto-generate after approve
                  </label>
                </div>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-slate-700/40 bg-slate-800/50">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-amber-400">{processingCount}</p>
                  <p className="text-[10px] text-slate-500">Processing</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-400">{pendingCount}</p>
                  <p className="text-[10px] text-slate-500">Pending</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-400">{queueItems.length - pendingCount - processingCount}</p>
                  <p className="text-[10px] text-slate-500">Completed</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Panel: Report Preview */}
          <div className="flex-1 min-w-0 bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
            <ReportPreview
              report={lastGeneratedReport}
              onRegenerate={handleRegenerate}
              onApprove={handleApproveAndNext}
              isRegenerating={isGenerating}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default GenerationProgress;
