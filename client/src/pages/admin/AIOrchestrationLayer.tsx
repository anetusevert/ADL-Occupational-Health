/**
 * AI Orchestration Layer
 * ======================
 * 
 * Simple dashboard showing all workflows with their usage statistics.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Workflow,
  Loader2,
  XCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { WorkflowCard, WorkflowDashboardData } from '../../components/orchestration';
import { cn } from '../../lib/utils';

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function getWorkflowDashboard(): Promise<WorkflowDashboardData[]> {
  const response = await apiClient.get<WorkflowDashboardData[]>('/api/v1/orchestration/workflows/dashboard');
  return response.data;
}

async function toggleWorkflowActive(workflowId: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/api/v1/orchestration/workflows/${workflowId}`, { is_active: isActive });
}

async function initializeOrchestration(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('/api/v1/orchestration/init');
  return response.data;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIOrchestrationLayer() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch workflow dashboard data
  const { data: workflows, isLoading, error, refetch } = useQuery({
    queryKey: ['workflow-dashboard'],
    queryFn: getWorkflowDashboard,
    staleTime: 30000,
    retry: 2,
  });

  // Toggle workflow active mutation
  const toggleMutation = useMutation({
    mutationFn: ({ workflowId, isActive }: { workflowId: string; isActive: boolean }) =>
      toggleWorkflowActive(workflowId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-dashboard'] });
    },
  });

  // Initialize/seed orchestration data
  const initMutation = useMutation({
    mutationFn: initializeOrchestration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-dashboard'] });
    },
  });

  // Filter workflows
  const filteredWorkflows = workflows?.filter(wf => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!wf.name.toLowerCase().includes(query) && 
          !wf.description?.toLowerCase().includes(query)) {
        return false;
      }
    }
    // Active filter
    if (filterActive === 'active' && !wf.is_active) return false;
    if (filterActive === 'inactive' && wf.is_active) return false;
    return true;
  }) || [];

  // Calculate summary stats
  const totalWorkflows = workflows?.length || 0;
  const activeWorkflows = workflows?.filter(w => w.is_active).length || 0;
  const totalRuns = workflows?.reduce((sum, w) => sum + w.execution_count, 0) || 0;
  const avgSuccessRate = workflows?.length 
    ? workflows.reduce((sum, w) => sum + w.success_rate, 0) / workflows.length 
    : 0;

  // Handle toggle
  const handleToggleActive = (workflowId: string, isActive: boolean) => {
    toggleMutation.mutate({ workflowId, isActive });
  };

  // Handle run (placeholder - would trigger workflow execution)
  const handleRun = (workflowId: string) => {
    console.log('Run workflow:', workflowId);
    // TODO: Implement workflow execution
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading workflows...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="bg-slate-800/50 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load</h2>
          <p className="text-slate-400 mb-4">{(error as Error).message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => initMutation.mutate()}
              disabled={initMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 disabled:opacity-50"
            >
              {initMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Initialize
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Workflow className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">AI Orchestration</h1>
              <p className="text-sm text-slate-400">Manage and monitor AI workflows</p>
            </div>
          </div>
          
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-slate-800/50 rounded-lg px-4 py-3 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Workflows</p>
            <p className="text-2xl font-semibold text-white">{totalWorkflows}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg px-4 py-3 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Active</p>
            <p className="text-2xl font-semibold text-emerald-400">{activeWorkflows}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg px-4 py-3 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Runs</p>
            <p className="text-2xl font-semibold text-white">{totalRuns}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg px-4 py-3 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Avg Success</p>
            <p className={cn(
              'text-2xl font-semibold',
              avgSuccessRate >= 90 ? 'text-emerald-400' :
              avgSuccessRate >= 70 ? 'text-amber-400' :
              'text-red-400'
            )}>
              {avgSuccessRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Active Filter */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  filterActive === status
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Workflow className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No workflows found</h3>
            <p className="text-slate-400 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Initialize to create default workflows'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => initMutation.mutate()}
                disabled={initMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 disabled:opacity-50"
              >
                {initMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Initialize Workflows
              </button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          )}>
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onToggleActive={handleToggleActive}
                onRun={handleRun}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIOrchestrationLayer;
