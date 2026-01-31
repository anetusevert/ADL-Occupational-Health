/**
 * AI Orchestration Layer
 * ======================
 * 
 * Simple view of all AI agents with ability to view/edit prompts and test.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Loader2,
  XCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { apiClient } from '../../services/api';
import { AgentCard, AgentData, AgentEditModal, AgentTestModal } from '../../components/orchestration';

// =============================================================================
// API FUNCTIONS
// =============================================================================

interface AgentListResponse {
  agents: AgentData[];
  total: number;
}

async function getAgents(): Promise<AgentData[]> {
  const response = await apiClient.get<AgentListResponse>('/api/v1/orchestration/agents');
  return response.data.agents;
}

async function updateAgent(
  agentId: string, 
  updates: { system_prompt?: string; user_prompt_template?: string }
): Promise<void> {
  await apiClient.patch(`/api/v1/orchestration/agents/${agentId}`, updates);
}

async function testAgent(
  agentId: string, 
  variables: Record<string, string>,
  enableWebSearch: boolean = false
): Promise<{ success: boolean; output?: string; error?: string; execution_time_ms?: number }> {
  const response = await apiClient.post(`/api/v1/orchestration/agents/${agentId}/test`, { 
    variables,
    enable_web_search: enableWebSearch
  });
  return response.data;
}

async function initializeAgents(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('/api/v1/orchestration/init');
  return response.data;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIOrchestrationLayer() {
  const queryClient = useQueryClient();
  
  // Modal states
  const [editAgent, setEditAgent] = useState<AgentData | null>(null);
  const [testAgentData, setTestAgentData] = useState<AgentData | null>(null);

  // Fetch agents
  const { data: agents, isLoading, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: getAgents,
    staleTime: 30000,
    retry: 2,
  });

  // Update agent mutation
  const updateMutation = useMutation({
    mutationFn: ({ agentId, updates }: { agentId: string; updates: { system_prompt?: string; user_prompt_template?: string } }) =>
      updateAgent(agentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setEditAgent(null);
    },
  });

  // Initialize agents mutation
  const initMutation = useMutation({
    mutationFn: initializeAgents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  // Handlers
  const handleViewPrompts = (agent: AgentData) => {
    setEditAgent(agent);
  };

  const handleTest = (agent: AgentData) => {
    setTestAgentData(agent);
  };

  const handleSavePrompts = async (
    agentId: string, 
    updates: { system_prompt?: string; user_prompt_template?: string }
  ) => {
    await updateMutation.mutateAsync({ agentId, updates });
  };

  const handleRunTest = async (
    agentId: string, 
    variables: Record<string, string>,
    enableWebSearch: boolean = false
  ) => {
    return await testAgent(agentId, variables, enableWebSearch);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading agents...</p>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Bot className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">AI Agents</h1>
              <p className="text-sm text-slate-400">
                {agents?.length || 0} agents available
              </p>
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!agents || agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No agents found</h3>
            <p className="text-slate-400 mb-4">
              Initialize to create default agents
            </p>
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
              Initialize Agents
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onViewPrompts={handleViewPrompts}
                onTest={handleTest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AgentEditModal
        agent={editAgent}
        isOpen={!!editAgent}
        onClose={() => setEditAgent(null)}
        onSave={handleSavePrompts}
        isSaving={updateMutation.isPending}
      />

      {/* Test Modal */}
      <AgentTestModal
        agent={testAgentData}
        isOpen={!!testAgentData}
        onClose={() => setTestAgentData(null)}
        onTest={handleRunTest}
      />
    </div>
  );
}

export default AIOrchestrationLayer;
