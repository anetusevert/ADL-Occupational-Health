/**
 * AI Orchestration Layer
 * ======================
 * 
 * Visual workflow builder for managing AI agents.
 * Features a React Flow canvas with workflow lanes, drag-and-drop, and connection suggestions.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Brain,
  Plus,
  Workflow,
  Loader2,
  XCircle,
  RefreshCw,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
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
  WorkflowTabs,
  NodePalette,
  CanvasToolbar,
  ExecutionPanel,
  type NodeTemplate,
  type ExecutionLogEntry,
  type WorkflowTab,
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
  lane_order: number | null;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface Connection {
  id: string;
  source: string;
  target: string;
  workflow_id: string | null;
  type: string | null;
}

interface AgentListResponse {
  agents: Agent[];
  workflows: WorkflowType[];
  connections: Connection[];
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

async function createConnection(data: { source: string; target: string; workflow_id?: string }): Promise<Connection> {
  const response = await apiClient.post<Connection>('/api/v1/orchestration/connections', data);
  return response.data;
}

async function deleteConnection(connectionId: string): Promise<void> {
  await apiClient.delete(`/api/v1/orchestration/connections/${connectionId}`);
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LANE_HEIGHT = 200;
const LANE_PADDING = 40;
const GRID_SIZE = 25;
const SNAP_DISTANCE = 80;

const WORKFLOW_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
  emerald: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' },
  pink: { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)', text: '#ec4899' },
  indigo: { bg: 'rgba(99, 102, 241, 0.1)', border: 'rgba(99, 102, 241, 0.3)', text: '#6366f1' },
  rose: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)', text: '#f43f5e' },
  orange: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', text: '#f97316' },
  teal: { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.3)', text: '#14b8a6' },
  cyan: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4' },
  purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6' },
  blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' },
};

// =============================================================================
// NODE TYPES
// =============================================================================

const nodeTypes: NodeTypes = {
  agent: AgentNode,
};

// =============================================================================
// WORKFLOW LANE COMPONENT
// =============================================================================

interface WorkflowLaneProps {
  workflow: WorkflowType;
  laneY: number;
  width: number;
}

function WorkflowLane({ workflow, laneY, width }: WorkflowLaneProps) {
  const colors = WORKFLOW_COLORS[workflow.color || 'cyan'] || WORKFLOW_COLORS.cyan;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: laneY,
        width: width,
        height: LANE_HEIGHT,
      }}
    >
      {/* Lane Background */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: colors.bg,
          border: `1px dashed ${colors.border}`,
        }}
      />
      
      {/* Lane Header */}
      <div
        className="absolute -top-6 left-4 px-3 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          color: colors.text,
        }}
      >
        {workflow.name}
      </div>
    </div>
  );
}

// =============================================================================
// CONNECTION SUGGESTION OVERLAY
// =============================================================================

interface ConnectionSuggestionProps {
  sourcePos: { x: number; y: number } | null;
  targetPos: { x: number; y: number } | null;
  isValid: boolean;
}

function ConnectionSuggestion({ sourcePos, targetPos, isValid }: ConnectionSuggestionProps) {
  if (!sourcePos || !targetPos) return null;
  
  return (
    <svg
      className="absolute inset-0 pointer-events-none z-50"
      style={{ overflow: 'visible' }}
    >
      <line
        x1={sourcePos.x}
        y1={sourcePos.y}
        x2={targetPos.x}
        y2={targetPos.y}
        stroke={isValid ? '#10b981' : '#ef4444'}
        strokeWidth={2}
        strokeDasharray="8 4"
        className="animate-pulse"
      />
      <circle
        cx={targetPos.x}
        cy={targetPos.y}
        r={8}
        fill={isValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
        stroke={isValid ? '#10b981' : '#ef4444'}
        strokeWidth={2}
      />
    </svg>
  );
}

// =============================================================================
// FLOW COMPONENT (Inner)
// =============================================================================

interface FlowComponentProps {
  data: AgentListResponse;
  providersData: ProvidersResponse | undefined;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  showCreateAgent: boolean;
  setShowCreateAgent: (show: boolean) => void;
  showCreateWorkflow: boolean;
  setShowCreateWorkflow: (show: boolean) => void;
  createAgentMutation: any;
  updateAgentMutation: any;
  updatePositionMutation: any;
  deleteAgentMutation: any;
  createWorkflowMutation: any;
  testAgentMutation: any;
  createConnectionMutation: any;
  deleteConnectionMutation: any;
  testResult: { success: boolean; response?: string; error?: string } | null;
  setTestResult: (result: any) => void;
}

function FlowComponent({
  data,
  providersData,
  selectedAgentId,
  setSelectedAgentId,
  showCreateAgent,
  setShowCreateAgent,
  showCreateWorkflow,
  setShowCreateWorkflow,
  createAgentMutation,
  updateAgentMutation,
  updatePositionMutation,
  deleteAgentMutation,
  createWorkflowMutation,
  testAgentMutation,
  createConnectionMutation,
  deleteConnectionMutation,
  testResult,
  setTestResult,
}: FlowComponentProps) {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [nearbyNode, setNearbyNode] = useState<string | null>(null);

  // Calculate lane positions
  const lanePositions = useMemo(() => {
    const positions: Record<string, number> = {};
    data.workflows
      .sort((a, b) => (a.lane_order || 0) - (b.lane_order || 0))
      .forEach((wf, idx) => {
        positions[wf.id] = idx * (LANE_HEIGHT + LANE_PADDING) + LANE_PADDING;
      });
    return positions;
  }, [data.workflows]);

  // Convert agents to React Flow nodes with horizontal layout
  useEffect(() => {
    if (!data?.agents) return;

    // Sort agents by order_in_workflow for proper left-to-right arrangement
    const sortedAgents = [...data.agents].sort((a, b) => 
      (a.order_in_workflow || 0) - (b.order_in_workflow || 0)
    );

    const newNodes: Node<AgentNodeData>[] = sortedAgents.map((agent, index) => {
      // Use horizontal layout: left-to-right with consistent Y
      const horizontalX = 150 + index * 280;
      const horizontalY = 200;
      
      return {
        id: agent.id,
        type: 'agent',
        position: {
          x: agent.position_x || horizontalX,
          y: agent.position_y || horizontalY,
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
      };
    });

    setNodes(newNodes);

    // Create edges from connections - improved styling
    const newEdges: Edge[] = data.connections.map(conn => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      animated: false,
      style: { stroke: '#64748b', strokeWidth: 2.5 },
      type: 'bezier',
      label: '',
      labelStyle: { fill: '#94a3b8', fontSize: 11 },
      labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
    }));

    setEdges(newEdges);
  }, [data?.agents, data?.connections, selectedAgentId, setNodes, setEdges]);

  // Handle connection creation
  const onConnect = useCallback(
    (params: any) => {
      // Create connection in backend
      createConnectionMutation.mutate({
        source: params.source,
        target: params.target,
      });
    },
    [createConnectionMutation]
  );

  // Handle node drag for proximity detection
  const onNodeDrag = useCallback(
    (_: any, node: Node) => {
      setDraggedNode(node.id);
      
      // Find nearby nodes for connection suggestion
      const otherNodes = nodes.filter(n => n.id !== node.id);
      let closest: string | null = null;
      let minDistance = SNAP_DISTANCE;
      
      otherNodes.forEach(other => {
        const dx = (node.position.x + 100) - other.position.x;
        const dy = node.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closest = other.id;
        }
      });
      
      setNearbyNode(closest);
    },
    [nodes]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      // Snap to grid
      const snappedX = Math.round(node.position.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(node.position.y / GRID_SIZE) * GRID_SIZE;
      
      updatePositionMutation.mutate({
        agentId: node.id,
        position: { position_x: snappedX, position_y: snappedY },
      });
      
      // Create connection if near another node
      if (nearbyNode && draggedNode) {
        const existingConnection = data.connections.find(
          c => (c.source === draggedNode && c.target === nearbyNode) ||
               (c.source === nearbyNode && c.target === draggedNode)
        );
        
        if (!existingConnection) {
          createConnectionMutation.mutate({
            source: draggedNode,
            target: nearbyNode,
          });
        }
      }
      
      setDraggedNode(null);
      setNearbyNode(null);
    },
    [updatePositionMutation, nearbyNode, draggedNode, data.connections, createConnectionMutation]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedAgentId(node.id);
    setTestResult(null);
  }, [setSelectedAgentId, setTestResult]);

  const handleSaveAgent = useCallback((agentId: string, updates: Partial<Agent>) => {
    updateAgentMutation.mutate({ agentId, updates });
  }, [updateAgentMutation]);

  const handleDeleteAgent = useCallback((agentId: string) => {
    deleteAgentMutation.mutate(agentId);
  }, [deleteAgentMutation]);

  const handleTestAgent = useCallback((agentId: string) => {
    setTestResult(null);
    testAgentMutation.mutate(agentId);
  }, [testAgentMutation, setTestResult]);

  const handleAutoLayout = useCallback(() => {
    // Auto-arrange agents in horizontal left-to-right flow
    const sortedAgents = [...data.agents].sort((a, b) => 
      (a.order_in_workflow || 0) - (b.order_in_workflow || 0)
    );
    
    sortedAgents.forEach((agent, idx) => {
      updatePositionMutation.mutate({
        agentId: agent.id,
        position: {
          position_x: 150 + idx * 280,
          position_y: 200,
        },
      });
    });
    
    // Fit view after layout
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 100);
  }, [data.agents, updatePositionMutation, reactFlowInstance]);

  const selectedAgent = useMemo(() => {
    if (!data?.agents || !selectedAgentId) return null;
    return data.agents.find(a => a.id === selectedAgentId) || null;
  }, [data?.agents, selectedAgentId]);

  // Calculate canvas width
  const canvasWidth = Math.max(
    1500,
    ...data.agents.map(a => (a.position_x || 0) + 400)
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          snapToGrid={showGrid}
          snapGrid={[GRID_SIZE, GRID_SIZE]}
          fitView
          className="bg-slate-900"
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'bezier',
            animated: false,
            style: { stroke: '#64748b', strokeWidth: 2.5 },
          }}
        >
          <Background
            variant={showGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
            gap={GRID_SIZE}
            size={1}
            color="#334155"
          />
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
                indigo: '#6366f1',
                rose: '#f43f5e',
                orange: '#f97316',
                teal: '#14b8a6',
              };
              return colors[(node.data as AgentNodeData).color || 'cyan'] || '#06b6d4';
            }}
            className="bg-slate-800 border-slate-700"
          />
          
          {/* Custom Panel for Toolbar */}
          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${
                showGrid ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'
              }`}
              title="Toggle Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleAutoLayout}
              className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
              title="Auto Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => reactFlowInstance.zoomIn()}
              className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => reactFlowInstance.zoomOut()}
              className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => reactFlowInstance.fitView()}
              className="p-2 bg-slate-700 text-slate-400 rounded-lg hover:bg-slate-600 transition-colors"
              title="Fit View"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </Panel>
        </ReactFlow>

        {/* Connection Suggestion */}
        {draggedNode && nearbyNode && (
          <ConnectionSuggestion
            sourcePos={null}
            targetPos={null}
            isValid={true}
          />
        )}
        
        {/* Nearby Node Indicator */}
        {nearbyNode && (
          <div className="absolute bottom-4 left-4 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm border border-emerald-500/30">
            Drop to connect with nearby agent
          </div>
        )}
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

      {/* Modals */}
      <CreateAgentModal
        isOpen={showCreateAgent}
        onClose={() => setShowCreateAgent(false)}
        onSubmit={(agentData) => createAgentMutation.mutate(agentData)}
        isLoading={createAgentMutation.isPending}
        workflows={data?.workflows || []}
        providers={providersData?.providers || []}
        globalProvider={providersData?.global_provider || undefined}
        globalModel={providersData?.global_model || undefined}
      />

      <CreateWorkflowModal
        isOpen={showCreateWorkflow}
        onClose={() => setShowCreateWorkflow(false)}
        onSubmit={(wfData) => createWorkflowMutation.mutate(wfData)}
        isLoading={createWorkflowMutation.isPending}
      />
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
  
  // n8n-style UI state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isExecutionPanelCollapsed, setIsExecutionPanelCollapsed] = useState(true);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

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

  const createConnectionMutation = useMutation({
    mutationFn: createConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-agents'] });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-agents'] });
    },
  });

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

  if (!data) return null;

  // Filter agents based on selected workflow
  const filteredData = selectedWorkflowId
    ? {
        ...data,
        agents: data.agents.filter(a => a.workflow_id === selectedWorkflowId),
        connections: data.connections.filter(c => {
          const sourceAgent = data.agents.find(a => a.id === c.source);
          const targetAgent = data.agents.find(a => a.id === c.target);
          return sourceAgent?.workflow_id === selectedWorkflowId || 
                 targetAgent?.workflow_id === selectedWorkflowId;
        }),
      }
    : data;

  // Get workflows with agent counts for tabs
  const workflowTabs: WorkflowTab[] = data.workflows.map(wf => ({
    id: wf.id,
    name: wf.name,
    description: wf.description || undefined,
    color: wf.color || 'cyan',
    agentCount: data.agents.filter(a => a.workflow_id === wf.id).length,
    isDefault: wf.is_default,
  }));

  // Get selected workflow name
  const selectedWorkflowName = selectedWorkflowId
    ? data.workflows.find(wf => wf.id === selectedWorkflowId)?.name || 'Workflow'
    : 'All Workflows';

  // Handle node palette drag
  const handlePaletteDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Handle adding node from palette
  const handleAddNodeFromPalette = (template: NodeTemplate) => {
    setShowCreateAgent(true);
    // Pre-fill with template data could be added here
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-900">
      {/* Workflow Tabs - n8n style */}
      <WorkflowTabs
        workflows={workflowTabs}
        activeWorkflowId={selectedWorkflowId}
        onSelect={setSelectedWorkflowId}
        onCreateNew={() => setShowCreateWorkflow(true)}
        onDelete={(id) => {
          // Could add delete workflow mutation here
          console.log('Delete workflow:', id);
        }}
      />

      {/* Canvas Toolbar - n8n style */}
      <CanvasToolbar
        workflowName={selectedWorkflowName}
        isSaved={true}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onRun={() => {
          // Trigger workflow execution
          setIsRunning(true);
          setExecutionLogs([
            { id: '1', timestamp: new Date().toISOString(), agent: 'Orchestrator', status: 'starting', message: 'Starting workflow execution...', emoji: '🚀' },
          ]);
          // Simulate workflow run
          setTimeout(() => {
            setExecutionLogs(prev => [...prev,
              { id: '2', timestamp: new Date().toISOString(), agent: 'ResearchAgent', status: 'running', message: 'Researching data...', emoji: '🔍' },
            ]);
          }, 1000);
          setTimeout(() => {
            setExecutionLogs(prev => [...prev,
              { id: '3', timestamp: new Date().toISOString(), agent: 'ResearchAgent', status: 'complete', message: 'Research complete', emoji: '✅' },
            ]);
            setIsRunning(false);
          }, 3000);
          setIsExecutionPanelCollapsed(false);
        }}
        isRunning={isRunning}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette - n8n style sidebar */}
        <NodePalette
          onDragStart={handlePaletteDragStart}
          onAddNode={handleAddNodeFromPalette}
          collapsed={isPaletteCollapsed}
          onToggleCollapse={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
        />

        {/* Canvas with ReactFlowProvider */}
        <ReactFlowProvider>
          <FlowComponent
            data={filteredData}
            providersData={providersData}
            selectedAgentId={selectedAgentId}
            setSelectedAgentId={setSelectedAgentId}
            showCreateAgent={showCreateAgent}
            setShowCreateAgent={setShowCreateAgent}
            showCreateWorkflow={showCreateWorkflow}
            setShowCreateWorkflow={setShowCreateWorkflow}
            createAgentMutation={createAgentMutation}
            updateAgentMutation={updateAgentMutation}
            updatePositionMutation={updatePositionMutation}
            deleteAgentMutation={deleteAgentMutation}
            createWorkflowMutation={createWorkflowMutation}
            testAgentMutation={testAgentMutation}
            createConnectionMutation={createConnectionMutation}
            deleteConnectionMutation={deleteConnectionMutation}
            testResult={testResult}
            setTestResult={setTestResult}
          />
        </ReactFlowProvider>
      </div>

      {/* Execution Panel - n8n style bottom panel */}
      <ExecutionPanel
        isRunning={isRunning}
        logs={executionLogs}
        collapsed={isExecutionPanelCollapsed}
        onToggleCollapse={() => setIsExecutionPanelCollapsed(!isExecutionPanelCollapsed)}
        onClear={() => setExecutionLogs([])}
      />
    </div>
  );
}

export default AIOrchestrationLayer;
