/**
 * AgentEditModal Component
 * 
 * Modal for viewing and editing agent prompts.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Bot, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AgentData } from './AgentCard';

interface AgentEditModalProps {
  agent: AgentData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agentId: string, updates: { system_prompt?: string; user_prompt_template?: string }) => Promise<void>;
  isSaving?: boolean;
}

export function AgentEditModal({ agent, isOpen, onClose, onSave, isSaving }: AgentEditModalProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPromptTemplate, setUserPromptTemplate] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when agent changes
  useEffect(() => {
    if (agent) {
      setSystemPrompt(agent.system_prompt || '');
      setUserPromptTemplate(agent.user_prompt_template || '');
      setHasChanges(false);
    }
  }, [agent]);

  // Track changes
  useEffect(() => {
    if (agent) {
      const changed = 
        systemPrompt !== (agent.system_prompt || '') ||
        userPromptTemplate !== (agent.user_prompt_template || '');
      setHasChanges(changed);
    }
  }, [systemPrompt, userPromptTemplate, agent]);

  const handleSave = async () => {
    if (!agent || !hasChanges) return;
    
    await onSave(agent.id, {
      system_prompt: systemPrompt,
      user_prompt_template: userPromptTemplate,
    });
  };

  if (!agent) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-slate-900 border border-white/10 rounded-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Bot className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
                  <p className="text-sm text-slate-400">Edit agent prompts</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-xs text-amber-400 mr-2">Unsaved changes</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                    hasChanges
                      ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                      : 'bg-white/5 text-slate-500 cursor-not-allowed'
                  )}
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Variables Info */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Template Variables</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Use these variables in your prompts. They will be replaced with actual values when the agent runs.
                </p>
                <div className="flex flex-wrap gap-2">
                  {agent.template_variables.map((v) => (
                    <code
                      key={v}
                      className="px-2 py-1 text-xs rounded bg-slate-800 text-cyan-400 font-mono"
                    >
                      {'{' + v + '}'}
                    </code>
                  ))}
                </div>
              </div>
              
              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  System Prompt
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Sets the agent's personality, role, and output format requirements.
                </p>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white font-mono text-sm resize-y focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                  placeholder="Enter system prompt..."
                />
              </div>
              
              {/* User Prompt Template */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  User Prompt Template
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  The actual task/question sent to the agent. Use {'{VARIABLE}'} placeholders.
                </p>
                <textarea
                  value={userPromptTemplate}
                  onChange={(e) => setUserPromptTemplate(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white font-mono text-sm resize-y focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                  placeholder="Enter user prompt template..."
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AgentEditModal;
