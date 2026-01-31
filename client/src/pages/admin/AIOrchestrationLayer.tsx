/**
 * AI Orchestration Layer
 * ======================
 * 
 * Visual workflow builder for managing AI agents.
 * Features a React Flow canvas for drag-and-drop agent management.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Brain,
  Plus,
  Workflow,
  Loader2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../services/api';
import {
  AgentNode,
  AgentNodeData,
  CreateAgentModal,
  CreateAgentData,
  CreateWorkflowModal,
  CreateWorkflowData,
  AgentConfigPanel,
} from '../../components/orchestration';

// =============================================================================
// TYPES
// =============================================================================

interface Agent {
  id: string;
  name: string;
  description: string | null;
  category: string;
  workflow_id: string | null;
  system_prompt: string | null;
  user_prompt_template: string | null;
  icon: string | null;
  color: string | null;
  order_in_workflow: number | null;
  position_x: number | null;
  position_y: number | null;
  llm_provider: string | null;
  llm_model_name: string | null;
  is_active: boolean;
  template_variables: string[];
  created_at: string | null;
  updated_at: string | null;
}

interface WorkflowType {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface AgentListResponse {
  agents: Agent[];
  workflows: WorkflowType[];
}

interface Provider {
  id: string;
  name: string;
  models: string[];
  is_configured: boolean;
  is_global_default: boolean;
}

interface ProvidersResponse {
  providers: Provider[];
  global_provider: string | null;
  global_model: string | null;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function getAgents(): Promise<AgentListResponse> {
  const response = await apiClient.get<AgentListResponse>('/api/v1/orchestration/agents');
  return response.data;
}

async function getProviders(): Promise<ProvidersResponse> {
  const response = await apiClient.get<ProvidersResponse>('/api/v1/orchestration/providers');
  return response.data;
}

async function createAgent(data: CreateAgentData): Promise<Agent> {
  const response = await apiClient.post<Agent>('/api/v1/orchestration/agents', data);
  return response.data;
}

async function updateAgent(agentId: string, data: Partial<Agent>): Promise<Agent> {
  const response = await apiClient.put<Agent>(`/api/v1/orchestration/agents/${agentId}`, data);
  return response.data;
}

async function updateAgentPosition(agentId: string, position: { position_x: number; position_y: number }): Promise<Agent> {
  const response = await apiClient.patch<Agent>(`/api/v1/orchestration/agents/${agentId}/position`, position);
  return response.data;
}

async function deleteAgent(agentId: string): Promise<void> {
  await apiClient.delete(`/api/v1/orchestration/agents/${agentId}`);
}

async function createWorkflow(data: CreateWorkflowData): Promise<WorkflowType> {
  const response = await apiClient.post<WorkflowType>('/api/v1/orchestration/workflows', data);
  return response.data;
}

async function testAgent(agentId: string): Promise<{ success: boolean; response?: string; error?: string; latency_ms?: number }> {
  const response = await apiClient.post(`/api/v1/orchestration/agents/${agentId}/test`, {});
  return response.data;
}

// =============================================================================
// NODE TYPES
// =============================================================================

const nodeTypes: NodeTypes = {
  agent: AgentNode,
};

// =============================================================================
// WORKFLOW GROUP COMPONENT
// =============================================================================

interface WorkflowLabelProps {
  workflow: WorkflowType;
  agents: Agent[];
}

function WorkflowLabel({ workflow }: WorkflowLabelProps) {
  const colorClasses: Record<string, string> = {
    amber: 'border-amber-500/30 text-amber-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    pink: 'border-pink-500/30 text-pink-400',
    cyan: 'border-cyan-500/30 text-cyan-400',
    purple: 'border-purple-500/30 text-purple-400',
    blue: 'border-blue-500/30 text-blue-400',
  };

  const colors = colorClasses[workflow.color || 'cyan'] || colorClasses.cyan;

  return (
    <div className={`absolute -top-8 left-0 px-3 py-1 border rounded-full text-xs font-medium ${colors}`}>
      {workflow.name}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AIOrchestrationLayer() {
  const queryClient = useQueryClient();
  
  // UI State
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; response?: string; error?: string } | null>(null);

  // React Flow State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch agents and workflows
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orchestration-agents'],
    queryFn: getAgents,
    staleTime: 30000,
  });

  // Fetch providers
  const { data: providersData } = useQuery({
    queryKey: ['orchestration-providers'],
    queryFn: getProviders,
    staleTime: 60000,
  });

  // Convert agents to React Flow nodes
  useEffect(() => {
    if (!data?.agents) return;

    const newNodes: Node<AgentNodeData>[] = data.agents.map((agent) => ({
      id: agent.id,
      type: 'agent',
      position: {
        x: agent.position_x || 100,
        y: agent.position_y || 100,
      },
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description || undefined,
        icon: agent.icon || undefined,
        color: agent.color || undefined,
        category: agent.category,
        llm_provider: agent.llm_provider || undefined,
        llm_model_name: agent.llm_model_name || undefined,
        is_active: agent.is_active,
      },
      selected: agent.id === selectedAgentId,
    }));

    setNodes(newNodes);

    // Create edges between agents in the same workflow (by order)
    const newEdges: Edge[] = [];
    const workflowGroups: Record<string, Agent[]> = {};
    
    data.agents.forEach(agent => {
      if (agent.workflow_id) {
        if (!workflowGroups[agent.workflow_id]) {
          workflowGroups[agent.workflow_id] = [];
        }
        workflowGroups[agent.workflow_id].push(agent);
      }
    });

    Object.values(workflowGroups).forEach(agents => {
      const sorted = agents.sort((a, b) => (a.order_in_workflow || 0) - (b.order_in_workflow || 0));
      for (let i = 0; i < sorted.length - 1; i++) {
        newEdges.push({
          id: `${sorted[i].id}-${sorted[i + 1].id}`,
          source: sorted[i].id,
          target: sorted[i + 1].id,
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
        });
      }
    });

    setEdges(newEdges);
  }, [data?.agents, selectedAgentId, setNodes, setEdges]);

  // Mutations
  const createAgentMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-agents'] });
      setShowCreateAgent(false);
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: ({ agentId, updates }: { agentId: string; updates: Partial<Agent> }) =>
      updateAgent(agentId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-agents'] });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: ({ agentId, position }: { agentId: string; position: { position_x: number; position_y: number } }) =>
      updateAgentPosition(agentId, position),
  });

  const deleteAgentMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-agents'] });
      setSelectedAgentId(null);
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-agents'] });
      setShowCreateWorkflow(false);
    },
  });

  const testAgentMutation = useMutation({
    mutationFn: testAgent,
    onSuccess: (result) => setTestResult(result),
    onError: (err: any) => setTestResult({ success: false, error: err.message || 'Test failed' }),
  });

  // Handlers
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#06b6d4' } }, eds)),
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      updatePositionMutation.mutate({
        agentId: node.id,
        position: { position_x: node.position.x, position_y: node.position.y },
      });
    },
    [updatePositionMutation]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedAgentId(node.id);
    setTestResult(null);
  }, []);

  const handleSaveAgent = useCallback((agentId: string, updates: Partial<Agent>) => {
    updateAgentMutation.mutate({ agentId, updates });
  }, [updateAgentMutation]);

  const handleDeleteAgent = useCallback((agentId: string) => {
    deleteAgentMutation.mutate(agentId);
  }, [deleteAgentMutation]);

  const handleTestAgent = useCallback((agentId: string) => {
    setTestResult(null);
    testAgentMutation.mutate(agentId);
  }, [testAgentMutation]);

  const selectedAgent = useMemo(() => {
    if (!data?.agents || !selectedAgentId) return null;
    return data.agents.find(a => a.id === selectedAgentId) || null;
  }, [data?.agents, selectedAgentId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading AI Orchestration Layer...</p>
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
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Orchestration Layer</h1>
            <p className="text-xs text-slate-400">Drag agents to position them, click to configure</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-sm">
            {data?.agents.filter(a => a.is_active).length || 0} Agents
          </span>
          <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-sm">
            {data?.workflows.length || 0} Workflows
          </span>
          
          <button
            onClick={() => setShowCreateWorkflow(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
          >
            <Workflow className="w-4 h-4" />
            Add Workflow
          </button>
          
          <button
            onClick={() => setShowCreateAgent(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Agent
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-900"
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            <Controls className="bg-slate-800 border-slate-700" />
            <MiniMap
              nodeColor={(node) => {
                const colors: Record<string, string> = {
                  blue: '#3b82f6',
                  cyan: '#06b6d4',
                  purple: '#8b5cf6',
                  amber: '#f59e0b',
                  emerald: '#10b981',
                  pink: '#ec4899',
                };
                return colors[(node.data as AgentNodeData).color || 'cyan'] || '#06b6d4';
              }}
              className="bg-slate-800 border-slate-700"
            />
          </ReactFlow>

          {/* Workflow Labels */}
          {data?.workflows.map(workflow => {
            const workflowAgents = data.agents.filter(a => a.workflow_id === workflow.id);
            if (workflowAgents.length === 0) return null;
            
            const minX = Math.min(...workflowAgents.map(a => a.position_x || 0));
            const minY = Math.min(...workflowAgents.map(a => a.position_y || 0));
            
            return (
              <div
                key={workflow.id}
                className="absolute pointer-events-none"
                style={{ left: minX + 100, top: minY + 50 }}
              >
                <WorkflowLabel workflow={workflow} agents={workflowAgents} />
              </div>
            );
          })}
        </div>

        {/* Config Panel */}
        <AgentConfigPanel
          agent={selectedAgent}
          workflows={data?.workflows || []}
          providers={providersData?.providers || []}
          globalProvider={providersData?.global_provider || undefined}
          globalModel={providersData?.global_model || undefined}
          onSave={handleSaveAgent}
          onTest={handleTestAgent}
          onDelete={handleDeleteAgent}
          onClose={() => setSelectedAgentId(null)}
          isSaving={updateAgentMutation.isPending}
          isTesting={testAgentMutation.isPending}
          testResult={testResult}
        />
      </div>

      {/* Modals */}
      <CreateAgentModal
        isOpen={showCreateAgent}
        onClose={() => setShowCreateAgent(false)}
        onSubmit={(data) => createAgentMutation.mutate(data)}
        isLoading={createAgentMutation.isPending}
        workflows={data?.workflows || []}
        providers={providersData?.providers || []}
        globalProvider={providersData?.global_provider || undefined}
        globalModel={providersData?.global_model || undefined}
      />

      <CreateWorkflowModal
        isOpen={showCreateWorkflow}
        onClose={() => setShowCreateWorkflow(false)}
        onSubmit={(data) => createWorkflowMutation.mutate(data)}
        isLoading={createWorkflowMutation.isPending}
      />
    </div>
  );
}

export default AIOrchestrationLayer;
