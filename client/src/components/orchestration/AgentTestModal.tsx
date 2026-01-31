/**
 * AgentTestModal Component
 * 
 * Modal for testing an agent with sample inputs.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Loader2, CheckCircle, XCircle, Clock, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AgentData } from './AgentCard';

interface AgentTestModalProps {
  agent: AgentData | null;
  isOpen: boolean;
  onClose: () => void;
  onTest: (agentId: string, variables: Record<string, string>, enableWebSearch?: boolean) => Promise<{
    success: boolean;
    output?: string;
    error?: string;
    execution_time_ms?: number;
  }>;
}

// Sample values for common variables
// Note: DATABASE_CONTEXT, METRICS_DATA, INTELLIGENCE_DATA, PILLAR_SCORES are auto-injected from ISO_CODE
const SAMPLE_VALUES: Record<string, string> = {
  'ISO_CODE': 'DEU',
  'COUNTRY_NAME': 'Germany',
  'COUNTRY': 'Germany',
  'TOPIC': 'Governance and Regulatory Framework',
  'CURRENT_MONTH': '3',
  'CURRENT_YEAR': '2026',
  'BUDGET': '100',
  'GAME_STATE': `Turn: 3/12
Budget Remaining: 100 points
Recent Actions: Launched inspection campaign`,
  'USER_QUESTION': 'What should be my priority for this quarter?',
  'RECENT_DECISIONS': `- Launched national inspection campaign (Turn 2)
- Increased inspector training budget (Turn 1)`,
  // These are auto-injected but can be overridden
  'DATABASE_CONTEXT': '(Auto-injected from database based on ISO_CODE)',
  'METRICS_DATA': '(Auto-injected from database based on ISO_CODE)',
  'INTELLIGENCE_DATA': '(Auto-injected from database based on ISO_CODE)',
  'CONTEXT': '(Auto-injected from database based on ISO_CODE)',
  'PILLAR_SCORES': '(Auto-injected from database based on ISO_CODE)',
  'OHI_SCORE': '(Auto-injected from database based on ISO_CODE)',
  'WEB_RESEARCH': '(Optional: Enable web search to populate)',
};

export function AgentTestModal({ agent, isOpen, onClose, onTest }: AgentTestModalProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    output?: string;
    error?: string;
    execution_time_ms?: number;
  } | null>(null);

  // Initialize variables with sample values
  useEffect(() => {
    if (agent) {
      const initialVars: Record<string, string> = {};
      for (const v of agent.template_variables) {
        initialVars[v] = SAMPLE_VALUES[v] || '';
      }
      setVariables(initialVars);
      setResult(null);
    }
  }, [agent]);

  const handleRun = async () => {
    if (!agent) return;
    
    setIsRunning(true);
    setResult(null);
    
    try {
      // Filter out auto-injected placeholder values
      const filteredVars: Record<string, string> = {};
      for (const [key, value] of Object.entries(variables)) {
        if (!value.startsWith('(Auto-injected') && !value.startsWith('(Optional:')) {
          filteredVars[key] = value;
        }
      }
      
      const response = await onTest(agent.id, filteredVars, enableWebSearch);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const updateVariable = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
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
                  <h2 className="text-lg font-semibold text-white">Test: {agent.name}</h2>
                  <p className="text-sm text-slate-400">Run the agent with sample inputs</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Variables */}
              <div className="w-1/3 border-r border-white/10 p-6 overflow-y-auto">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Input Variables</h3>
                
                <div className="space-y-4">
                  {agent.template_variables.map((v) => (
                    <div key={v}>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        {v}
                      </label>
                      <textarea
                        value={variables[v] || ''}
                        onChange={(e) => updateVariable(v, e.target.value)}
                        rows={v.includes('DATA') || v.includes('CONTEXT') || v.includes('SCORES') ? 6 : 2}
                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm font-mono resize-y focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Web Search Option */}
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableWebSearch}
                      onChange={(e) => setEnableWebSearch(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50"
                    />
                    <div>
                      <span className="text-sm font-medium text-white">Enable Web Search</span>
                      <p className="text-xs text-slate-500">Search for recent news and developments</p>
                    </div>
                  </label>
                </div>

                <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-400">
                    <strong>Note:</strong> Database context is auto-injected based on ISO_CODE. 
                    You only need to provide country code and topic.
                  </p>
                </div>

                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className={cn(
                    'w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                    isRunning
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-cyan-500 text-white hover:bg-cyan-400'
                  )}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Test
                    </>
                  )}
                </button>
              </div>
              
              {/* Right: Output */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-300">Output</h3>
                  
                  {result && (
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="w-4 h-4" />
                          Success
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <XCircle className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                      
                      {result.execution_time_ms && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {(result.execution_time_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {isRunning ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
                      <p className="text-slate-400">Running agent...</p>
                      <p className="text-xs text-slate-500 mt-1">This may take a few seconds</p>
                    </div>
                  </div>
                ) : result ? (
                  <div className="rounded-lg bg-slate-800 border border-white/10 p-4 overflow-x-auto">
                    {result.success ? (
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                        {result.output}
                      </pre>
                    ) : (
                      <div className="text-red-400">
                        <p className="font-medium mb-2">Error:</p>
                        <p className="text-sm">{result.error}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    <p>Click "Run Test" to see the output</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AgentTestModal;
