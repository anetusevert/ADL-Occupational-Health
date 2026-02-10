/**
 * GOHIP Platform - Database Fill Admin Page
 * ==========================================
 * 
 * Admin dashboard for triggering and monitoring the 3-phase
 * database population pipeline:
 * 
 *   Phase 1: ETL Pipeline (structured API data)
 *   Phase 2: AI Database Fill (pillar metric enrichment)
 *   Phase 3: Batch Insight Generation (6 categories per country)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  Brain,
  BarChart3,
  Clock,
  ArrowRight,
  Sparkles,
  Square,
  RotateCcw,
  Timer,
  Activity,
} from 'lucide-react';
import { apiClient } from '../../services/api';

// =============================================================================
// TYPES
// =============================================================================

interface FillStatus {
  status: string;
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  current_country: string | null;
  fields_written: number;
  errors: Array<{ country_iso: string; error: string }>;
  started_at: string | null;
  completed_at: string | null;
}

interface BatchInsightStatus {
  status: string;
  total_countries: number;
  countries_completed: number;
  countries_failed: number;
  countries_skipped: number;
  current_country: string | null;
  current_country_name: string | null;
  current_category: string | null;
  total_insights_generated: number;
  total_insights_failed: number;
  errors: Array<{ country_iso: string; error: string }>;
  started_at: string | null;
  completed_at: string | null;
  elapsed_seconds: number | null;
  estimated_remaining_seconds: number | null;
  avg_seconds_per_country: number | null;
  last_completed_country: string | null;
}

interface PipelineStatus {
  is_running: boolean;
  progress: string;
  progress_count: number;
  total_countries: number;
  current_country: string | null;
}

// =============================================================================
// PHASE CARD COMPONENT
// =============================================================================

function PhaseCard({
  phase,
  title,
  description,
  icon: Icon,
  color,
  isRunning,
  isComplete,
  onStart,
  children,
}: {
  phase: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  isRunning: boolean;
  isComplete: boolean;
  onStart: () => void;
  children?: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  const btnColor: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-500',
    purple: 'bg-purple-600 hover:bg-purple-500',
    cyan: 'bg-cyan-600 hover:bg-cyan-500',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
                Phase {phase}
              </span>
              {isComplete && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                </span>
              )}
              {isRunning && (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all flex items-center gap-2 ${
            isRunning
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : btnColor[color]
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Start
            </>
          )}
        </button>
      </div>

      <p className="text-sm text-white/40 mb-4">{description}</p>

      {children}
    </div>
  );
}

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

function ProgressBar({
  completed,
  failed,
  skipped,
  total,
  label,
}: {
  completed: number;
  failed: number;
  skipped: number;
  total: number;
  label?: string;
}) {
  // Defensive: ensure all values are valid numbers
  const c = Number(completed) || 0;
  const f = Number(failed) || 0;
  const s = Number(skipped) || 0;
  const t = Number(total) || 0;
  const done = c + f + s;
  const pct = t > 0 ? (done / t) * 100 : 0;

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-white/40">{label}</span>
          <span className="text-xs text-white/60 font-mono">
            {done} / {t}
          </span>
        </div>
      )}
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-4 mt-1.5 text-xs">
        <span className="text-emerald-400">{c} done</span>
        {f > 0 && <span className="text-red-400">{f} failed</span>}
        {s > 0 && <span className="text-white/30">{s} skipped</span>}
      </div>
    </div>
  );
}

// =============================================================================
// STAT BADGE COMPONENT
// =============================================================================

function StatBadge({ icon: Icon, label, value, color = 'white' }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    white: 'text-white/60',
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
  };

  return (
    <div className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-3 py-2">
      <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
      <div className="flex flex-col">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-semibold ${colorClasses[color]}`}>{value}</span>
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatSpeed(avgSeconds: number | null | undefined): string {
  if (!avgSeconds || avgSeconds <= 0) return '--';
  if (avgSeconds < 60) return `~${Math.round(avgSeconds)}s/country`;
  return `~${(avgSeconds / 60).toFixed(1)}min/country`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DatabaseFill() {
  // Phase 1 - ETL
  const [etlStatus, setEtlStatus] = useState<PipelineStatus | null>(null);
  const [etlRunning, setEtlRunning] = useState(false);

  // Phase 2 - AI Fill
  const [forceRegenInsights, setForceRegenInsights] = useState(false);
  const [fillStatus, setFillStatus] = useState<FillStatus | null>(null);
  const [fillRunning, setFillRunning] = useState(false);

  // Phase 3 - Batch Insights
  const [insightStatus, setInsightStatus] = useState<BatchInsightStatus | null>(null);
  const [insightRunning, setInsightRunning] = useState(false);
  const [insightStopping, setInsightStopping] = useState(false);

  // Error display
  const [error, setError] = useState<string | null>(null);

  // Backend connectivity
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  // ── Poll Phase 1 Status ──
  const pollEtl = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/etl/status');
      setEtlStatus(res.data);
      setEtlRunning(res.data.is_running);
    } catch (err: any) {
      console.warn('[DBFill] Phase 1 poll failed:', err?.response?.status, err?.message);
    }
  }, []);

  // ── Poll Phase 2 Status ──
  const pollFill = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/etl/fill-status');
      setFillStatus(res.data);
      setFillRunning(res.data.status === 'running' || res.data.status === 'recalculating_scores');
    } catch (err: any) {
      console.warn('[DBFill] Phase 2 poll failed:', err?.response?.status, err?.message);
    }
  }, []);

  // ── Poll Phase 3 Status ──
  // Try new URL first (/insight-batch/), fall back to legacy (/insights/batch-)
  const pollInsights = useCallback(async () => {
    // Try new router first
    try {
      const res = await apiClient.get('/api/v1/insight-batch/generate-status');
      if (res.data && typeof res.data.status === 'string' && !res.data.country_iso) {
        setInsightStatus(res.data);
        const running = res.data.status === 'running';
        setInsightRunning(running);
        if (!running) setInsightStopping(false);
        return;
      }
    } catch {
      // New router not available, try legacy
    }

    // Fallback: legacy URL (may be intercepted by wildcard on old backend)
    try {
      const res = await apiClient.get('/api/v1/insights/batch-generate-status');
      // Validate response shape: if it has country_iso, it's the wrong endpoint (wildcard intercepted)
      if (res.data && res.data.country_iso) {
        // Wildcard intercepted - treat as no batch status
        console.warn('[DBFill] Phase 3 legacy poll intercepted by wildcard, treating as idle');
        return;
      }
      if (res.data && typeof res.data.status === 'string') {
        setInsightStatus(res.data);
        const running = res.data.status === 'running';
        setInsightRunning(running);
        if (!running) setInsightStopping(false);
        return;
      }
    } catch (err: any) {
      console.warn('[DBFill] Phase 3 poll failed:', err?.response?.status, err?.message);
    }
  }, []);

  // ── Backend connectivity check on mount ──
  useEffect(() => {
    const checkBackend = async () => {
      // Check Phase 1 & 2 endpoints
      const basicEndpoints = [
        { name: 'ETL status', url: '/api/v1/etl/status' },
        { name: 'Fill status', url: '/api/v1/etl/fill-status' },
      ];
      const failures: string[] = [];
      for (const ep of basicEndpoints) {
        try {
          await apiClient.get(ep.url);
        } catch (err: any) {
          const code = err?.response?.status;
          if (code === 404) failures.push(`${ep.name} (404)`);
          else if (code === 401 || code === 403) failures.push(`${ep.name} (${code})`);
        }
      }

      // Check Phase 3: try new URL, fallback to legacy (validating response shape)
      let phase3ok = false;
      try {
        const res = await apiClient.get('/api/v1/insight-batch/generate-status');
        if (res.data && !res.data.country_iso) { phase3ok = true; }
      } catch { /* try legacy */ }
      if (!phase3ok) {
        try {
          const res = await apiClient.get('/api/v1/insights/batch-generate-status');
          // If wildcard intercepted, response has country_iso field
          if (res.data && !res.data.country_iso && typeof res.data.status === 'string') {
            phase3ok = true;
          }
        } catch { /* not available */ }
      }
      if (!phase3ok) {
        console.warn('[DBFill] Phase 3 status endpoint not properly available (wildcard conflict or 404)');
        // Don't report as failure - Phase 3 POST may still work
      }

      if (failures.length > 0) {
        setBackendReady(false);
        setError(`Backend endpoints not available: ${failures.join(', ')}. The backend may need redeployment.`);
        console.error('[DBFill] Backend check failed:', failures);
      } else {
        setBackendReady(true);
        console.log('[DBFill] Backend connectivity OK', phase3ok ? '- all endpoints reachable' : '- Phase 3 polling may use fallback');
      }
    };
    checkBackend();
  }, []);

  // ── Auto-poll ──
  useEffect(() => {
    pollEtl();
    pollFill();
    pollInsights();

    const interval = setInterval(() => {
      pollEtl();
      pollFill();
      pollInsights();
    }, 3000);

    return () => clearInterval(interval);
  }, [pollEtl, pollFill, pollInsights]);

  // ── Start Phase 1: ETL ──
  const startEtl = async () => {
    setError(null);
    console.log('[DBFill] Starting Phase 1: ETL pipeline...');
    try {
      const res = await apiClient.post('/api/v1/etl/run', { fetch_flags: true });
      console.log('[DBFill] Phase 1 started:', res.data);
      setEtlRunning(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to start ETL pipeline';
      console.error('[DBFill] Phase 1 start failed:', err?.response?.status, msg, err);
      setError(`Phase 1 Error: ${msg}`);
    }
  };

  // ── Start Phase 2: AI Fill ──
  const startFill = async () => {
    setError(null);
    console.log('[DBFill] Starting Phase 2: AI database fill...');
    try {
      const res = await apiClient.post('/api/v1/etl/fill-database', { delay_between: 2.0 });
      console.log('[DBFill] Phase 2 started:', res.data);
      setFillRunning(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to start database fill';
      console.error('[DBFill] Phase 2 start failed:', err?.response?.status, msg, err);
      setError(`Phase 2 Error: ${msg}`);
    }
  };

  // ── Start Phase 3: Batch Insights ──
  // Try new URL first, fall back to legacy
  const startInsights = async () => {
    setError(null);
    const body = { delay_between: 1.0, force_regenerate: forceRegenInsights };
    console.log('[DBFill] Starting Phase 3: Batch insights (force_regenerate:', forceRegenInsights, ')...');

    // Try new router first
    try {
      const res = await apiClient.post('/api/v1/insight-batch/generate-all', body);
      console.log('[DBFill] Phase 3 started (new router):', res.data);
      setInsightRunning(true);
      return;
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to start batch insight generation';
        console.error('[DBFill] Phase 3 start failed:', err?.response?.status, msg);
        setError(`Phase 3 Error: ${msg}`);
        return;
      }
      console.log('[DBFill] New router 404, trying legacy URL...');
    }

    // Fallback: legacy URL
    try {
      const res = await apiClient.post('/api/v1/insights/batch-generate-all', body);
      console.log('[DBFill] Phase 3 started (legacy):', res.data);
      setInsightRunning(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to start batch insight generation';
      console.error('[DBFill] Phase 3 start failed:', err?.response?.status, msg, err);
      setError(`Phase 3 Error: ${msg}`);
    }
  };

  // ── Stop Phase 3 ──
  const stopInsights = async () => {
    setInsightStopping(true);
    try {
      await apiClient.post('/api/v1/insight-batch/generate-stop');
      console.log('[DBFill] Phase 3 stop requested');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to stop';
      console.error('[DBFill] Phase 3 stop failed:', msg);
      setError(`Stop Error: ${msg}`);
      setInsightStopping(false);
    }
  };

  // ── Retry Failed Insights ──
  const retryFailedInsights = async () => {
    setError(null);
    const body = { retry_failed: true, delay_between: 1.0, force_regenerate: false };
    console.log('[DBFill] Starting Phase 3: Retry failed insights...');
    try {
      const res = await apiClient.post('/api/v1/insight-batch/generate-all', body);
      console.log('[DBFill] Phase 3 retry started:', res.data);
      setInsightRunning(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to start retry';
      console.error('[DBFill] Phase 3 retry failed:', err?.response?.status, msg);
      setError(`Retry Error: ${msg}`);
    }
  };

  // ── Reset Phase 3 Status ──
  const resetInsightStatus = async () => {
    // Try new URL first, fall back to legacy
    try {
      await apiClient.post('/api/v1/insight-batch/generate-reset');
      setInsightStatus(null);
      setInsightRunning(false);
      setInsightStopping(false);
      return;
    } catch {
      // Try legacy
    }
    try {
      await apiClient.post('/api/v1/insights/batch-generate-reset');
      setInsightStatus(null);
      setInsightRunning(false);
      setInsightStopping(false);
    } catch (err: any) {
      console.warn('[DBFill] Reset failed:', err?.message);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Database Fill Pipeline
            </h1>
            <p className="text-white/40 text-sm">
              3-phase pipeline to populate all 193 countries with complete data
            </p>
          </div>
        </div>

        <button
          onClick={() => { pollEtl(); pollFill(); pollInsights(); }}
          className="px-3 py-2 rounded-lg bg-slate-700/50 text-white/60 hover:text-white hover:bg-slate-700 transition-all text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Backend status indicator */}
      {backendReady === false && (
        <div className="flex-shrink-0 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">
            Backend API is not fully available. Some pipeline phases may not work. Please ensure the backend is deployed with the latest code.
          </span>
        </div>
      )}
      {backendReady === true && (
        <div className="flex-shrink-0 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm text-emerald-300">
            Backend API connected — all pipeline endpoints are reachable.
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable phases */}
      <div className="flex-1 overflow-auto space-y-4 pr-1">
        {/* ── PHASE 1: ETL Pipeline ── */}
        <PhaseCard
          phase={1}
          title="Structured API Data (ETL)"
          description="Fetch data from 9 API sources (ILO, WHO, World Bank, etc.) for all 193 UN member states. No AI cost."
          icon={Globe}
          color="blue"
          isRunning={etlRunning}
          isComplete={!etlRunning && etlStatus !== null && (etlStatus.progress_count > 0)}
          onStart={startEtl}
        >
          {etlStatus && etlRunning && (
            <div className="space-y-3">
              <ProgressBar
                completed={etlStatus.progress_count}
                failed={0}
                skipped={0}
                total={etlStatus.total_countries || 193}
                label="Countries processed"
              />
              {etlStatus.current_country && (
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                  Processing: <span className="text-blue-400 font-mono">{etlStatus.current_country}</span>
                </div>
              )}
            </div>
          )}
        </PhaseCard>

        {/* ── Arrow ── */}
        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
        </div>

        {/* ── PHASE 2: AI Database Fill ── */}
        <PhaseCard
          phase={2}
          title="AI-Enriched Pillar Metrics"
          description="Use GPT-4o with web search to fill ~20 NULL pillar fields per country. Includes source citations and automatic score recalculation."
          icon={Brain}
          color="purple"
          isRunning={fillRunning}
          isComplete={fillStatus?.status === 'completed'}
          onStart={startFill}
        >
          {fillStatus && fillStatus.status !== 'idle' && (
            <div className="space-y-3">
              <ProgressBar
                completed={fillStatus.completed}
                failed={fillStatus.failed}
                skipped={fillStatus.skipped}
                total={fillStatus.total}
                label="Countries filled"
              />

              <div className="flex flex-wrap gap-2">
                <StatBadge icon={Zap} label="Fields Written" value={fillStatus.fields_written} color="purple" />
                {fillStatus.current_country && (
                  <StatBadge icon={Loader2} label="Current" value={fillStatus.current_country} color="amber" />
                )}
                {fillStatus.status === 'recalculating_scores' && (
                  <StatBadge icon={BarChart3} label="Status" value="Recalculating scores..." color="cyan" />
                )}
              </div>

              {(fillStatus.errors?.length ?? 0) > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 max-h-32 overflow-auto">
                  <p className="text-xs text-red-400 font-medium mb-1">Errors ({fillStatus.errors?.length ?? 0})</p>
                  {(fillStatus.errors ?? []).slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-red-300/60 truncate">
                      {e.country_iso}: {e.error}
                    </p>
                  ))}
                  {(fillStatus.errors?.length ?? 0) > 5 && (
                    <p className="text-xs text-red-400/40 mt-1">+ {(fillStatus.errors?.length ?? 0) - 5} more</p>
                  )}
                </div>
              )}

              {fillStatus.completed_at && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed at {new Date(fillStatus.completed_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </PhaseCard>

        {/* ── Arrow ── */}
        <div className="flex justify-center">
          <ArrowRight className="w-5 h-5 text-white/20 rotate-90" />
        </div>

        {/* ── PHASE 3: Batch Insight Generation ── */}
        <PhaseCard
          phase={3}
          title="AI Country Insights"
          description="Generate all 6 insight categories for every country (culture, infrastructure, industry, urban, workforce, political). ~1,158 insights total. Categories are generated in parallel for faster processing."
          icon={Sparkles}
          color="cyan"
          isRunning={insightRunning}
          isComplete={insightStatus?.status === 'completed'}
          onStart={startInsights}
        >
          {/* Controls row */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceRegenInsights}
                onChange={(e) => setForceRegenInsights(e.target.checked)}
                disabled={insightRunning}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30"
              />
              <span className="text-xs text-white/50">Force regenerate (overwrite existing)</span>
            </label>

            {/* Stop button - visible while running */}
            {insightRunning && (
              <button
                onClick={stopInsights}
                disabled={insightStopping}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  insightStopping
                    ? 'bg-red-900/30 text-red-400/60 cursor-not-allowed'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-500/30'
                }`}
              >
                {insightStopping ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Stopping...</>
                ) : (
                  <><Square className="w-3.5 h-3.5" /> Stop</>
                )}
              </button>
            )}

            {/* Retry Failed button - visible when stopped/completed with failures */}
            {!insightRunning && (insightStatus?.total_insights_failed ?? 0) > 0 && (
              <button
                onClick={retryFailedInsights}
                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-amber-600/20 text-amber-400 hover:bg-amber-600/40 border border-amber-500/30 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Failed ({insightStatus?.countries_failed ?? 0})
              </button>
            )}

            {/* Reset button */}
            {insightStatus && insightStatus.status !== 'idle' && !insightRunning && (
              <button
                onClick={resetInsightStatus}
                className="text-xs text-white/30 hover:text-white/60 underline transition-colors"
              >
                Reset status
              </button>
            )}
          </div>

          {/* Stopped banner */}
          {insightStatus?.status === 'stopped' && (
            <div className="mb-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
              <Square className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300">
                Generation was stopped. Click "Start" to continue from where it left off (completed insights will be skipped), or "Retry Failed" to retry only the failed ones.
              </span>
            </div>
          )}

          {/* Skipped warning */}
          {insightStatus?.status === 'completed' &&
            (insightStatus.total_insights_generated ?? 0) === 0 &&
            (insightStatus.countries_skipped ?? 0) > 0 && (
            <div className="mb-3 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300">
                All {insightStatus.countries_skipped} countries were skipped because insights already exist.
                Enable "Force regenerate" to overwrite them.
              </span>
            </div>
          )}

          {insightStatus && insightStatus.status !== 'idle' && (
            <div className="space-y-3">
              <ProgressBar
                completed={insightStatus.countries_completed}
                failed={insightStatus.countries_failed}
                skipped={insightStatus.countries_skipped}
                total={insightStatus.total_countries}
                label="Countries processed"
              />

              {/* Real-time metrics row */}
              <div className="flex flex-wrap gap-2">
                <StatBadge
                  icon={Sparkles}
                  label="Insights Generated"
                  value={insightStatus.total_insights_generated}
                  color="cyan"
                />
                {(insightStatus.total_insights_failed ?? 0) > 0 && (
                  <StatBadge
                    icon={XCircle}
                    label="Insights Failed"
                    value={insightStatus.total_insights_failed}
                    color="red"
                  />
                )}
                {insightRunning && insightStatus.elapsed_seconds != null && (
                  <StatBadge
                    icon={Timer}
                    label="Elapsed"
                    value={formatDuration(insightStatus.elapsed_seconds)}
                    color="blue"
                  />
                )}
                {insightRunning && insightStatus.estimated_remaining_seconds != null && (
                  <StatBadge
                    icon={Clock}
                    label="ETA"
                    value={formatDuration(insightStatus.estimated_remaining_seconds)}
                    color="purple"
                  />
                )}
                {insightRunning && insightStatus.avg_seconds_per_country != null && (
                  <StatBadge
                    icon={Activity}
                    label="Speed"
                    value={formatSpeed(insightStatus.avg_seconds_per_country)}
                    color="emerald"
                  />
                )}
              </div>

              {/* Current processing info */}
              {insightRunning && insightStatus.current_country && (
                <div className="bg-slate-700/20 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span className="text-white/50">Currently processing:</span>
                    <span className="text-cyan-400 font-semibold animate-pulse">
                      {insightStatus.current_country_name || insightStatus.current_country}
                    </span>
                    <span className="text-white/20 font-mono text-[10px]">({insightStatus.current_country})</span>
                  </div>
                  {insightStatus.current_category && (
                    <div className="flex items-center gap-2 text-xs text-white/30 pl-5">
                      <Sparkles className="w-3 h-3 text-cyan-400/50" />
                      Categories: <span className="text-cyan-300/70 font-mono">{insightStatus.current_category}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error list */}
              {(insightStatus.errors?.length ?? 0) > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 max-h-32 overflow-auto">
                  <p className="text-xs text-red-400 font-medium mb-1">Errors ({insightStatus.errors?.length ?? 0})</p>
                  {(insightStatus.errors ?? []).slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-red-300/60 truncate">
                      {e.country_iso}: {e.error}
                    </p>
                  ))}
                  {(insightStatus.errors?.length ?? 0) > 5 && (
                    <p className="text-xs text-red-400/40 mt-1">+ {(insightStatus.errors?.length ?? 0) - 5} more</p>
                  )}
                </div>
              )}

              {/* Completion / Stop info */}
              {insightStatus.completed_at && insightStatus.status === 'completed' && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed at {new Date(insightStatus.completed_at).toLocaleString()}
                </div>
              )}
              {insightStatus.completed_at && insightStatus.status === 'stopped' && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <Square className="w-3.5 h-3.5" />
                  Stopped at {new Date(insightStatus.completed_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </PhaseCard>

        {/* ── Execution Notes ── */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 text-xs text-white/30 space-y-1">
          <p className="text-white/50 font-medium mb-2">Execution Notes</p>
          <p>Phase 1: ~15-20 min for 193 countries (API rate limits). Free, no AI cost.</p>
          <p>Phase 2: ~60-90 min for 193 countries. Estimated cost: $6-10 (GPT-4o with web search).</p>
          <p>Phase 3: ~3-6 hours for 193 countries (parallel categories + 2 concurrent countries). Estimated cost: $35-60. Can be stopped and resumed at any time.</p>
          <p>Phases are sequential -- run Phase 1 first to ensure all countries exist in the database.</p>
          <p>Failed insights are auto-retried up to 2 times. Use "Retry Failed" button for remaining failures.</p>
        </div>
      </div>
    </div>
  );
}
