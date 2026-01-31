/**
 * AgentConfigPanel - Right sidebar for editing selected agent
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Database,
  Search,
  Globe,
  Sparkles,
  Map,
  HelpCircle,
  Zap,
  Cpu,
  Save,
  RotateCcw,
  Play,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  X,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description?: string;
  category: string;
  workflow_id?: string;
  system_prompt?: string;
  user_prompt_template?: string;
  icon?: string;
  color?: string;
  llm_provider?: string;
  llm_model_name?: string;
  template_variables: string[];
  is_active: boolean;
  updated_at?: string;
}

interface Workflow {
  id: string;
  name: string;
  color: string;
}

interface Provider {
  id: string;
  name: string;
  models: string[];
  is_configured: boolean;
}

interface AgentConfigPanelProps {
  agent: Agent | null;
  workflows: Workflow[];
  providers: Provider[];
  globalProvider?: string;
  globalModel?: string;
  onSave: (agentId: string, updates: Partial<Agent>) => void;
  onTest: (agentId: string) => void;
  onDelete: (agentId: string) => void;
  onClose: () => void;
  isSaving: boolean;
  isTesting: boolean;
  testResult: { success: boolean; response?: string; error?: string } | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  database: Database,
  search: Search,
  globe: Globe,
  sparkles: Sparkles,
  map: Map,
  'help-circle': HelpCircle,
  brain: Brain,
  zap: Zap,
  cpu: Cpu,
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

const CATEGORIES = [
  { id: 'analysis', label: 'Analysis' },
  { id: 'research', label: 'Research' },
  { id: 'synthesis', label: 'Synthesis' },
  { id: 'explanation', label: 'Explanation' },
  { id: 'internal', label: 'Internal' },
];

export function AgentConfigPanel({
  agent,
  workflows,
  providers,
  globalProvider,
  globalModel,
  onSave,
  onTest,
  onDelete,
  onClose,
  isSaving,
  isTesting,
  testResult,
}: AgentConfigPanelProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('analysis');
  const [workflowId, setWorkflowId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [llmProvider, setLlmProvider] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [templateVars, setTemplateVars] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state with agent
  useEffect(() => {
    if (agent) {
      setName(agent.name || '');
      setDescription(agent.description || '');
      setCategory(agent.category || 'analysis');
      setWorkflowId(agent.workflow_id || '');
      setSystemPrompt(agent.system_prompt || '');
      setUserPrompt(agent.user_prompt_template || '');
      setLlmProvider(agent.llm_provider || '');
      setLlmModel(agent.llm_model_name || '');
      setTemplateVars((agent.template_variables || []).join(', '));
      setHasChanges(false);
      setShowDeleteConfirm(false);
    }
  }, [agent?.id]);

  const markChanged = () => setHasChanges(true);

  const handleSave = () => {
    if (!agent) return;
    
    const updates: Partial<Agent> = {
      name,
      description,
      category,
      workflow_id: workflowId || undefined,
      system_prompt: systemPrompt,
      user_prompt_template: userPrompt,
      llm_provider: llmProvider || undefined,
      llm_model_name: llmModel || undefined,
      template_variables: templateVars
        .split(',')
        .map(v => v.trim())
        .filter(Boolean),
    };
    
    onSave(agent.id, updates);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (agent) {
      setName(agent.name || '');
      setDescription(agent.description || '');
      setCategory(agent.category || 'analysis');
      setWorkflowId(agent.workflow_id || '');
      setSystemPrompt(agent.system_prompt || '');
      setUserPrompt(agent.user_prompt_template || '');
      setLlmProvider(agent.llm_provider || '');
      setLlmModel(agent.llm_model_name || '');
      setTemplateVars((agent.template_variables || []).join(', '));
      setHasChanges(false);
    }
  };

  if (!agent) {
    return (
      <div className="w-80 bg-slate-800/50 border-l border-slate-700 flex items-center justify-center">
        <div className="text-center p-6">
          <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">Select an Agent</h3>
          <p className="text-sm text-slate-500">
            Click on an agent node to configure it
          </p>
        </div>
      </div>
    );
  }

  const IconComponent = ICON_MAP[agent.icon || 'bot'] || Brain;
  const colorClass = COLOR_MAP[agent.color || 'cyan'] || COLOR_MAP.cyan;
  const selectedProvider = providers.find(p => p.id === llmProvider);
  const availableModels = selectedProvider?.models || [];

  return (
    <div className="w-96 bg-slate-800/80 border-l border-slate-700 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass} border`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Agent Configuration</h3>
            <p className="text-xs text-slate-400 truncate max-w-[180px]">{agent.id}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white transition-colors rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-700/50 flex-shrink-0">
        {hasChanges && (
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded flex-shrink-0">
            Unsaved
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onTest(agent.id)}
          disabled={isTesting}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 text-xs"
        >
          {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          Test
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 text-xs"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); markChanged(); }}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => { setDescription(e.target.value); markChanged(); }}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Category + Workflow */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); markChanged(); }}
              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Workflow</label>
            <select
              value={workflowId}
              onChange={e => { setWorkflowId(e.target.value); markChanged(); }}
              className="w-full px-2 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">None</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
          <h4 className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            LLM Override
          </h4>
          <p className="text-[10px] text-slate-500 mb-2">
            Default: {globalProvider} / {globalModel}
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <select
              value={llmProvider}
              onChange={e => {
                setLlmProvider(e.target.value);
                setLlmModel('');
                markChanged();
              }}
              className="px-2 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">Global Default</option>
              {providers.map(p => (
                <option key={p.id} value={p.id} disabled={!p.is_configured}>
                  {p.name}
                </option>
              ))}
            </select>
            
            <select
              value={llmModel}
              onChange={e => { setLlmModel(e.target.value); markChanged(); }}
              disabled={!llmProvider}
              className="px-2 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
            >
              <option value="">Model</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={e => { setSystemPrompt(e.target.value); markChanged(); }}
            rows={4}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
        </div>

        {/* User Prompt */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">User Prompt Template</label>
          <textarea
            value={userPrompt}
            onChange={e => { setUserPrompt(e.target.value); markChanged(); }}
            rows={6}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
        </div>

        {/* Template Variables */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Template Variables</label>
          <input
            type="text"
            value={templateVars}
            onChange={e => { setTemplateVars(e.target.value); markChanged(); }}
            placeholder="COUNTRY_NAME, ISO_CODE"
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg border ${
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
              <span className={`text-xs font-medium ${
                testResult.success ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {testResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
            </div>
            <pre className="text-[10px] text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-32 overflow-y-auto">
              {testResult.success ? testResult.response : testResult.error}
            </pre>
          </div>
        )}

        {/* Delete Button */}
        <div className="pt-4 border-t border-slate-700/50">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete Agent
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Delete?</span>
              <button
                onClick={() => onDelete(agent.id)}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-400"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-700/50 text-[10px] text-slate-500 flex-shrink-0">
        Updated: {agent.updated_at ? new Date(agent.updated_at).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}

export default AgentConfigPanel;
