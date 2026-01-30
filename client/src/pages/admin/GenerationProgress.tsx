/**
 * GOHIP Platform - Report Generation Progress Dashboard
 * =====================================================
 * 
 * Admin-only dashboard showing real-time progress of batch report generation.
 * Includes country selection and batch generation trigger functionality.
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Play,
  Square,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { apiClient, generateBatchCountries } from '../../services/api';

// EU and GCC country codes for quick selection
const EU_COUNTRIES = [
  "ALB", "AND", "AUT", "BLR", "BEL", "BIH", "BGR", "HRV", "CZE", "DNK",
  "EST", "FIN", "FRA", "DEU", "GRC", "HUN", "ISL", "IRL", "ITA", "LVA",
  "LIE", "LTU", "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "MKD", "NOR",
  "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN", "ESP", "SWE",
  "CHE", "UKR", "GBR", "VAT"
];

const GCC_COUNTRIES = ["BHR", "KWT", "OMN", "QAT", "SAU", "ARE"];

interface CountryProgress {
  iso_code: string;
  name: string;
  completed: number;
  failed: number;
  pending: number;
  total: number;
  percent_complete: number;
}

interface GlobalProgress {
  total_countries: number;
  total_reports: number;
  completed_reports: number;
  failed_reports: number;
  pending_reports: number;
  percent_complete: number;
  countries: CountryProgress[];
  eu_progress: {
    completed: number;
    total: number;
    percent: number;
  };
  gcc_progress: {
    completed: number;
    total: number;
    percent: number;
  };
}

async function fetchGlobalProgress(): Promise<GlobalProgress> {
  const response = await apiClient.get<GlobalProgress>('/api/v1/strategic-deep-dive/progress/global');
  return response.data;
}

function ProgressBar({ percent, color = 'emerald' }: { percent: number; color?: string }) {
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        className={`h-full bg-${color}-500`}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}

interface CountryRowProps {
  country: CountryProgress;
  selectionMode: boolean;
  isSelected: boolean;
  onToggle: (isoCode: string) => void;
}

function CountryRow({ country, selectionMode, isSelected, onToggle }: CountryRowProps) {
  const getStatusColor = () => {
    if (country.percent_complete === 100) return 'emerald';
    if (country.failed > 0) return 'amber';
    if (country.completed > 0) return 'blue';
    return 'slate';
  };

  return (
    <div 
      className={`flex items-center gap-4 py-2 border-b border-slate-700/30 last:border-0 ${
        selectionMode ? 'cursor-pointer hover:bg-slate-700/30' : ''
      } ${isSelected ? 'bg-cyan-500/10' : ''}`}
      onClick={() => selectionMode && onToggle(country.iso_code)}
    >
      {selectionMode && (
        <div className="w-6 flex-shrink-0">
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-cyan-400" />
          ) : (
            <Square className="w-5 h-5 text-slate-500" />
          )}
        </div>
      )}
      <div className="w-12 text-center">
        <span className="text-lg font-mono text-slate-300">{country.iso_code}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white truncate max-w-[200px]">{country.name}</span>
          <span className="text-xs text-slate-400">
            {country.completed}/{country.total}
          </span>
        </div>
        <ProgressBar percent={country.percent_complete} color={getStatusColor()} />
      </div>
      <div className="flex items-center gap-2 w-24 justify-end">
        {country.completed > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            {country.completed}
          </span>
        )}
        {country.failed > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <XCircle className="w-3 h-3" />
            {country.failed}
          </span>
        )}
        {country.pending > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {country.pending}
          </span>
        )}
      </div>
    </div>
  );
}

export function GenerationProgress() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  const { data: progress, isLoading, error, refetch } = useQuery({
    queryKey: ['generation-progress'],
    queryFn: fetchGlobalProgress,
    refetchInterval: autoRefresh ? 10000 : false,
    retry: 2,
  });

  // Batch generation mutation
  const batchMutation = useMutation({
    mutationFn: (isoCodes: string[]) => generateBatchCountries(isoCodes),
    onSuccess: (data) => {
      setGenerationMessage(`Started generation for ${data.countries_queued} countries (${data.total_reports} reports)`);
      setSelectedCountries(new Set());
      setSelectionMode(false);
      // Start auto-refresh to show progress
      setAutoRefresh(true);
      queryClient.invalidateQueries({ queryKey: ['generation-progress'] });
      // Clear message after 5 seconds
      setTimeout(() => setGenerationMessage(null), 5000);
    },
    onError: (error: any) => {
      setGenerationMessage(`Error: ${error.message || 'Failed to start generation'}`);
      setTimeout(() => setGenerationMessage(null), 5000);
    },
  });

  // Get all available country codes from progress data
  const availableCountries = useMemo(() => {
    if (!progress?.countries) return [];
    return progress.countries.map(c => c.iso_code);
  }, [progress?.countries]);

  // Toggle country selection
  const toggleCountry = (isoCode: string) => {
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (next.has(isoCode)) {
        next.delete(isoCode);
      } else {
        next.add(isoCode);
      }
      return next;
    });
  };

  // Quick select functions
  const selectEU = () => {
    const euInProgress = EU_COUNTRIES.filter(c => availableCountries.includes(c));
    setSelectedCountries(new Set(euInProgress));
  };

  const selectGCC = () => {
    const gccInProgress = GCC_COUNTRIES.filter(c => availableCountries.includes(c));
    setSelectedCountries(new Set(gccInProgress));
  };

  const selectAll = () => {
    setSelectedCountries(new Set(availableCountries));
  };

  const clearSelection = () => {
    setSelectedCountries(new Set());
  };

  // Handle batch generation
  const handleGenerateSelected = () => {
    if (selectedCountries.size === 0) return;
    batchMutation.mutate(Array.from(selectedCountries));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
        <p>Failed to load progress data</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Report Generation Progress
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time monitoring of strategic deep dive report generation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-600"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Action Bar - Batch Generation Controls */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selection Mode Toggle */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) clearSelection();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
              selectionMode 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectionMode ? 'Selection Active' : 'Select Countries'}
          </button>

          {selectionMode && (
            <>
              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={selectEU}
                  className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-xs font-medium"
                >
                  EU Countries
                </button>
                <button
                  onClick={selectGCC}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition text-xs font-medium"
                >
                  GCC Countries
                </button>
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500 transition text-xs font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition text-xs font-medium"
                >
                  Clear
                </button>
              </div>

              {/* Selected Count & Generate Button */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-slate-400">
                  {selectedCountries.size} selected
                </span>
                <button
                  onClick={handleGenerateSelected}
                  disabled={selectedCountries.size === 0 || batchMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
                    selectedCountries.size > 0 && !batchMutation.isPending
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {batchMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Generate Selected ({selectedCountries.size})
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Generation Message */}
        {generationMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-lg text-sm ${
              generationMessage.startsWith('Error')
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {generationMessage}
          </motion.div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Overall Progress</h2>
          <span className="text-3xl font-bold text-emerald-400">
            {progress.percent_complete}%
          </span>
        </div>
        <ProgressBar percent={progress.percent_complete} />
        <p className="text-sm text-slate-400 mt-2">
          {progress.completed_reports} of {progress.total_reports} reports completed
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Countries"
          value={progress.total_countries}
          icon={Globe}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={progress.completed_reports}
          icon={CheckCircle2}
          color="emerald"
          subtitle={`${progress.percent_complete}%`}
        />
        <StatCard
          title="Failed"
          value={progress.failed_reports}
          icon={XCircle}
          color="red"
          subtitle={progress.failed_reports > 0 ? 'Check AI config' : 'None'}
        />
        <StatCard
          title="Pending"
          value={progress.pending_reports}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* EU & GCC Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🇪🇺</span>
            <h3 className="font-semibold text-white">European Countries</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              {progress.eu_progress.completed} / {progress.eu_progress.total} reports
            </span>
            <span className="text-lg font-bold text-blue-400">
              {progress.eu_progress.percent}%
            </span>
          </div>
          <ProgressBar percent={progress.eu_progress.percent} color="blue" />
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏜️</span>
            <h3 className="font-semibold text-white">GCC Countries</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              {progress.gcc_progress.completed} / {progress.gcc_progress.total} reports
            </span>
            <span className="text-lg font-bold text-amber-400">
              {progress.gcc_progress.percent}%
            </span>
          </div>
          <ProgressBar percent={progress.gcc_progress.percent} color="amber" />
        </div>
      </div>

      {/* Country List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Per-Country Progress
          </h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-4">
          {progress.countries.length > 0 ? (
            progress.countries.map((country) => (
              <CountryRow 
                key={country.iso_code} 
                country={country}
                selectionMode={selectionMode}
                isSelected={selectedCountries.has(country.iso_code)}
                onToggle={toggleCountry}
              />
            ))
          ) : (
            <p className="text-center text-slate-400 py-8">
              No reports generated yet. Use the selection controls above to select countries and generate reports.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerationProgress;
