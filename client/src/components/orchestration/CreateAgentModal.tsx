/**
 * CreateAgentModal - Modal for creating new AI agents
 */

import React, { useState } from 'react';
import {
  X,
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
  Loader2,
} from 'lucide-react';

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

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAgentData) => void;
  isLoading: boolean;
  workflows: Workflow[];
  providers: Provider[];
  globalProvider?: string;
  globalModel?: string;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  category: string;
  workflow_id?: string;
  icon: string;
  color: string;
  llm_provider?: string;
  llm_model_name?: string;
  system_prompt?: string;
  user_prompt_template?: string;
  template_variables: string[];
  position_x: number;
  position_y: number;
}

const ICONS = [
  { id: 'brain', Icon: Brain, label: 'Brain' },
  { id: 'database', Icon: Database, label: 'Database' },
  { id: 'search', Icon: Search, label: 'Search' },
  { id: 'globe', Icon: Globe, label: 'Globe' },
  { id: 'sparkles', Icon: Sparkles, label: 'Sparkles' },
  { id: 'map', Icon: Map, label: 'Map' },
  { id: 'help-circle', Icon: HelpCircle, label: 'Help' },
  { id: 'zap', Icon: Zap, label: 'Zap' },
  { id: 'cpu', Icon: Cpu, label: 'CPU' },
];

const COLORS = [
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { id: 'pink', label: 'Pink', class: 'bg-pink-500' },
];

const CATEGORIES = [
  { id: 'analysis', label: 'Analysis' },
  { id: 'research', label: 'Research' },
  { id: 'synthesis', label: 'Synthesis' },
  { id: 'explanation', label: 'Explanation' },
  { id: 'internal', label: 'Internal' },
];

export function CreateAgentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  workflows,
  providers,
  globalProvider,
  globalModel,
}: CreateAgentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('analysis');
  const [workflowId, setWorkflowId] = useState('');
  const [icon, setIcon] = useState('brain');
  const [color, setColor] = useState('cyan');
  const [llmProvider, setLlmProvider] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [templateVars, setTemplateVars] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: CreateAgentData = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      workflow_id: workflowId || undefined,
      icon,
      color,
      llm_provider: llmProvider || undefined,
      llm_model_name: llmModel || undefined,
      system_prompt: systemPrompt.trim() || undefined,
      user_prompt_template: userPrompt.trim() || undefined,
      template_variables: templateVars
        .split(',')
        .map(v => v.trim())
        .filter(Boolean),
      position_x: 200,
      position_y: 200,
    };

    onSubmit(data);
  };

  const selectedProvider = providers.find(p => p.id === llmProvider);
  const availableModels = selectedProvider?.models || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Create New Agent</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Agent Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Data Collector Agent"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of what this agent does"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Row: Category + Workflow */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Workflow
              </label>
              <select
                value={workflowId}
                onChange={e => setWorkflowId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="">No workflow</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Icon + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(({ id, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIcon(id)}
                    className={`p-2 rounded-lg border transition-all ${
                      icon === id
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-8 h-8 rounded-lg ${c.class} transition-all ${
                      color === c.id
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* LLM Configuration */}
          <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              LLM Configuration
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Leave empty to use global default: {globalProvider} / {globalModel}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Provider
                </label>
                <select
                  value={llmProvider}
                  onChange={e => {
                    setLlmProvider(e.target.value);
                    setLlmModel('');
                  }}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">Use Global Default</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id} disabled={!p.is_configured}>
                      {p.name} {!p.is_configured && '(not configured)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Model
                </label>
                <select
                  value={llmModel}
                  onChange={e => setLlmModel(e.target.value)}
                  disabled={!llmProvider}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
                >
                  <option value="">Select model</option>
                  {availableModels.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Prompts */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="Define the agent's role and behavior..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              User Prompt Template
            </label>
            <textarea
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              placeholder="Template for user messages. Use {{VARIABLE}} for placeholders..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Template Variables
            </label>
            <input
              type="text"
              value={templateVars}
              onChange={e => setTemplateVars(e.target.value)}
              placeholder="COUNTRY_NAME, ISO_CODE, TOPIC (comma-separated)"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAgentModal;
