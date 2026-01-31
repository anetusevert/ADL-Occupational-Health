/**
 * AI Orchestration Layer
 * ======================
 * 
 * Visual dashboard for managing AI agents and their workflows.
 * Features an interactive agent map and prompt editor.
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Brain,
  Database,
  Search,
  Globe,
  Sparkles,
  Map,
  HelpCircle,
  Save,
  RotateCcw,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Settings,
  Zap,
} from 'lucide-react';
import { apiClient } from '../../services/api';

// =============================================================================
// TYPES
// =============================================================================

interface Agent {
  id: string;
  name: string;
  description: string | null;
  category: string;
  workflow: string;
  system_prompt: string | null;
  user_prompt_template: string | null;
  icon: string | null;
  color: string | null;
  order_in_workflow: number | null;
  is_active: boolean;
  template_variables: string[];
  created_at: string | null;
  updated_at: string | null;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface AgentListResponse {
  agents: Agent[];
  workflows: Workflow[];
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function getAgents(): Promise<AgentListResponse> {
  const response = await apiClient.get<AgentListResponse>('/api/v1/orchestration/agents');
  return response.data;
}

async function updateAgent(agentId: string, data: Partial<Agent>): Promise<Agent> {
  const response = await apiClient.put<Agent>(`/api/v1/orchestration/agents/${agentId}`, data);
  return response.data;
}

async function testAgent(agentId: string): Promise<{ success: boolean; response?: string; error?: string; latency_ms?: number }> {
  const response = await apiClient.post(`/api/v1/orchestration/agents/${agentId}/test`, {});
  return response.data;
}

// =============================================================================
// ICON MAPPING
// =============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  database: Database,
  search: Search,
  globe: Globe,
  sparkles: Sparkles,
  map: Map,
  'help-circle': HelpCircle,
  brain: Brain,
  zap: Zap,
  bot: Brain,
};

const COLOR_MAP: Record<string, string> = {
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  pink: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
};

// =============================================================================
// WORKFLOW MAP COMPONENT
// =============================================================================

interface WorkflowMapProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

function WorkflowMap({ agents, selectedAgentId, onSelectAgent }: WorkflowMapProps) {
  // Group agents by workflow
  const workflowGroups = useMemo(() => {
    const groups: Record<string, Agent[]> = {};
    agents.forEach(agent => {
      if (!groups[agent.workflow]) groups[agent.workflow] = [];
      groups[agent.workflow].push(agent);
    });
    // Sort by order
    Object.keys(groups).forEach(wf => {
      groups[wf].sort((a, b) => (a.order_in_workflow || 0) - (b.order_in_workflow || 0));
    });
    return groups;
  }, [agents]);

  const workflowMeta: Record<string, { name: string; color: string }> = {
    report_generation: { name: 'Report Generation', color: 'amber' },
    country_assessment: { name: 'Country Assessment', color: 'emerald' },
    metric_explanation: { name: 'Metric Explanation', color: 'pink' },
    data_collection: { name: 'Data Collection', color: 'cyan' },
  };

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Agent Workflows</h2>
      </div>
      
      <div className="space-y-6">
        {Object.entries(workflowGroups).map(([workflowId, workflowAgents]) => {
          const meta = workflowMeta[workflowId] || { name: workflowId, color: 'slate' };
          const borderColor = `border-${meta.color}-500/30`;
          const bgColor = `bg-${meta.color}-500/5`;
          
          return (
            <div
              key={workflowId}
              className={`rounded-lg border ${borderColor} ${bgColor} p-4`}
            >
              <h3 className={`text-sm font-medium text-${meta.color}-400 mb-4`}>
                {meta.name}
              </h3>
              
              <div className="flex items-center gap-2 flex-wrap">
                {workflowAgents.map((agent, idx) => {
                  const IconComponent = ICON_MAP[agent.icon || 'bot'] || Brain;
                  const colorClasses = COLOR_MAP[agent.color || 'cyan'];
                  const isSelected = selectedAgentId === agent.id;
                  
                  return (
                    <React.Fragment key={agent.id}>
                      <button
                        onClick={() => onSelectAgent(agent.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 ' + colorClasses
                            : colorClasses + ' hover:opacity-80'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium text-white">{agent.name}</span>
                      </button>
                      
                      {idx < workflowAgents.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// PROMPT EDITOR COMPONENT
// =============================================================================

interface PromptEditorProps {
  agent: Agent | null;
  onSave: (agent: Agent, updates: Partial<Agent>) => void;
  onTest: (agentId: string) => void;
  isSaving: boolean;
  isTesting: boolean;
  testResult: { success: boolean; response?: string; error?: string } | null;
}

function PromptEditor({ agent, onSave, onTest, isSaving, isTesting, testResult }: PromptEditorProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when agent changes
  React.useEffect(() => {
    if (agent) {
      setSystemPrompt(agent.system_prompt || '');
      setUserPrompt(agent.user_prompt_template || '');
      setHasChanges(false);
    }
  }, [agent?.id]);

  const handleSystemPromptChange = (value: string) => {
    setSystemPrompt(value);
    setHasChanges(true);
  };

  const handleUserPromptChange = (value: string) => {
    setUserPrompt(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (agent) {
      onSave(agent, {
        system_prompt: systemPrompt,
        user_prompt_template: userPrompt,
      });
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    if (agent) {
      setSystemPrompt(agent.system_prompt || '');
      setUserPrompt(agent.user_prompt_template || '');
      setHasChanges(false);
    }
  };

  if (!agent) {
    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">Select an Agent</h3>
          <p className="text-sm text-slate-500">
            Click on an agent in the workflow map to edit its prompts
          </p>
        </div>
      </div>
    );
  }

  const IconComponent = ICON_MAP[agent.icon || 'bot'] || Brain;

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${COLOR_MAP[agent.color || 'cyan']}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
            <p className="text-xs text-slate-400">{agent.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTest(agent.id)}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Test
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
      
      {/* Template Variables */}
      {agent.template_variables && agent.template_variables.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-800/50">
          <span className="text-xs text-slate-400 mr-2">Template Variables:</span>
          {agent.template_variables.map(v => (
            <code key={v} className="text-xs bg-slate-700 text-cyan-300 px-1.5 py-0.5 rounded mr-1">
              {`{{${v}}}`}
            </code>
          ))}
        </div>
      )}
      
      {/* Prompts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => handleSystemPromptChange(e.target.value)}
            className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
            placeholder="Enter system prompt..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            User Prompt Template
          </label>
          <textarea
            value={userPrompt}
            onChange={(e) => handleUserPromptChange(e.target.value)}
            className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
            placeholder="Enter user prompt template..."
          />
        </div>
        
        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${
                testResult.success ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {testResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
            </div>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {testResult.success ? testResult.response : testResult.error}
            </pre>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700/50 text-xs text-slate-500">
        Last updated: {agent.updated_at ? new Date(agent.updated_at).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIOrchestrationLayer() {
  const queryClient = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; response?: string; error?: string } | null>(null);

  // Fetch agents
  const { data, isLoading, error } = useQuery({
    queryKey: ['orchestration-agents'],
    queryFn: getAgents,
    staleTime: 30000,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ agentId, updates }: { agentId: string; updates: Partial<Agent> }) =>
      updateAgent(agentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-agents'] });
    },
  });

  // Test mutation
  const testMutation = useMutation({
    mutationFn: testAgent,
    onSuccess: (result) => {
      setTestResult(result);
    },
    onError: (err: any) => {
      setTestResult({ success: false, error: err.message || 'Test failed' });
    },
  });

  const selectedAgent = useMemo(() => {
    if (!data?.agents || !selectedAgentId) return null;
    return data.agents.find(a => a.id === selectedAgentId) || null;
  }, [data?.agents, selectedAgentId]);

  const handleSave = (agent: Agent, updates: Partial<Agent>) => {
    updateMutation.mutate({ agentId: agent.id, updates });
  };

  const handleTest = (agentId: string) => {
    setTestResult(null);
    testMutation.mutate(agentId);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="bg-slate-800/50 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Agents</h2>
          <p className="text-slate-400">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading AI Orchestration Layer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden p-4">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Orchestration Layer</h1>
            <p className="text-xs text-slate-400">Configure and manage AI agents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
            {data?.agents.filter(a => a.is_active).length || 0} Active Agents
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
        {/* Left: Workflow Map */}
        <div className="overflow-y-auto">
          <WorkflowMap
            agents={data?.agents || []}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />
        </div>

        {/* Right: Prompt Editor */}
        <div className="overflow-hidden">
          <PromptEditor
            agent={selectedAgent}
            onSave={handleSave}
            onTest={handleTest}
            isSaving={updateMutation.isPending}
            isTesting={testMutation.isPending}
            testResult={testResult}
          />
        </div>
      </div>
    </div>
  );
}

export default AIOrchestrationLayer;
