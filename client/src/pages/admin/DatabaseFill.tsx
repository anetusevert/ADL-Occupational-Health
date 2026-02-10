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
  total_insights_generated: number;
  total_insights_failed: number;
  errors: Array<{ country_iso: string; error: string }>;
  started_at: string | null;
  completed_at: string | null;
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
  const pollInsights = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/v1/insight-batch/generate-status');
      setInsightStatus(res.data);
      setInsightRunning(res.data.status === 'running');
    } catch (err: any) {
      console.warn('[DBFill] Phase 3 poll failed:', err?.response?.status, err?.message);
    }
  }, []);

  // ── Backend connectivity check on mount ──
  useEffect(() => {
    const checkBackend = async () => {
      const endpoints = [
        { name: 'ETL status', url: '/api/v1/etl/status' },
        { name: 'Fill status', url: '/api/v1/etl/fill-status' },
        { name: 'Insights status', url: '/api/v1/insight-batch/generate-status' },
      ];
      const failures: string[] = [];
      for (const ep of endpoints) {
        try {
          await apiClient.get(ep.url);
        } catch (err: any) {
          const code = err?.response?.status;
          if (code === 404) {
            failures.push(`${ep.name} (404 Not Found)`);
          } else if (code === 401 || code === 403) {
            failures.push(`${ep.name} (${code} Unauthorized)`);
          }
          // Other errors (network, timeout) might be transient
        }
      }
      if (failures.length > 0) {
        setBackendReady(false);
        setError(`Backend endpoints not available: ${failures.join(', ')}. The backend may need redeployment.`);
        console.error('[DBFill] Backend check failed:', failures);
      } else {
        setBackendReady(true);
        console.log('[DBFill] Backend connectivity OK - all endpoints reachable');
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
  const startInsights = async () => {
    setError(null);
    console.log('[DBFill] Starting Phase 3: Batch insights (force_regenerate:', forceRegenInsights, ')...');
    try {
      const res = await apiClient.post('/api/v1/insight-batch/generate-all', {
        delay_between: 3.0,
        force_regenerate: forceRegenInsights,
      });
      console.log('[DBFill] Phase 3 started:', res.data);
      setInsightRunning(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to start batch insight generation';
      console.error('[DBFill] Phase 3 start failed:', err?.response?.status, msg, err);
      setError(`Phase 3 Error: ${msg}`);
    }
  };

  // ── Reset Phase 3 Status ──
  const resetInsightStatus = async () => {
    try {
      await apiClient.post('/api/v1/insight-batch/generate-reset');
      setInsightStatus(null);
      setInsightRunning(false);
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
          description="Generate all 6 insight categories for every country (culture, infrastructure, industry, urban, workforce, political). ~1,158 insights total."
          icon={Sparkles}
          color="cyan"
          isRunning={insightRunning}
          isComplete={insightStatus?.status === 'completed'}
          onStart={startInsights}
        >
          {/* Controls */}
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={forceRegenInsights}
                onChange={(e) => setForceRegenInsights(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/30"
              />
              <span className="text-xs text-white/50">Force regenerate (overwrite existing insights)</span>
            </label>

            {insightStatus && insightStatus.status !== 'idle' && !insightRunning && (
              <button
                onClick={resetInsightStatus}
                className="text-xs text-white/30 hover:text-white/60 underline transition-colors"
              >
                Reset status
              </button>
            )}
          </div>

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

              <div className="flex flex-wrap gap-2">
                <StatBadge
                  icon={Sparkles}
                  label="Insights Generated"
                  value={insightStatus.total_insights_generated}
                  color="cyan"
                />
                {insightStatus.total_insights_failed > 0 && (
                  <StatBadge
                    icon={XCircle}
                    label="Insights Failed"
                    value={insightStatus.total_insights_failed}
                    color="red"
                  />
                )}
                {insightStatus.current_country && (
                  <StatBadge
                    icon={Loader2}
                    label="Current"
                    value={`${insightStatus.current_country_name || insightStatus.current_country}`}
                    color="amber"
                  />
                )}
              </div>

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

              {insightStatus.completed_at && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed at {new Date(insightStatus.completed_at).toLocaleString()}
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
          <p>Phase 3: ~6-10 hours for 193 countries. Estimated cost: $35-60. Can run overnight.</p>
          <p>Phases are sequential -- run Phase 1 first to ensure all countries exist in the database.</p>
        </div>
      </div>
    </div>
  );
}
