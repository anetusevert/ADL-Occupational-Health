/**
 * AgentCard Component
 * 
 * Displays an AI agent with its details and action buttons.
 */

import { motion } from 'framer-motion';
import {
  Bot,
  FileText,
  Shield,
  Newspaper,
  MessageCircle,
  Play,
  Settings,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AgentData {
  id: string;
  name: string;
  description?: string;
  system_prompt?: string;
  user_prompt_template?: string;
  template_variables: string[];
  icon: string;
  color: string;
  is_active: boolean;
  execution_count: number;
  last_run_at?: string;
}

interface AgentCardProps {
  agent: AgentData;
  onViewPrompts: (agent: AgentData) => void;
  onTest: (agent: AgentData) => void;
}

// Icon mapping
const ICON_MAP: Record<string, typeof Bot> = {
  'bot': Bot,
  'file-text': FileText,
  'shield': Shield,
  'newspaper': Newspaper,
  'message-circle': MessageCircle,
};

// Color classes
const COLOR_CLASSES: Record<string, { bg: string; border: string; icon: string }> = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'text-amber-400' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: 'text-indigo-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'text-orange-400' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: 'text-rose-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'text-emerald-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'text-purple-400' },
};

function getTimeAgo(dateString?: string): string {
  if (!dateString) return 'Never run';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function AgentCard({ agent, onViewPrompts, onTest }: AgentCardProps) {
  const colors = COLOR_CLASSES[agent.color] || COLOR_CLASSES.cyan;
  const IconComponent = ICON_MAP[agent.icon] || Bot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-5 transition-all',
        colors.bg,
        colors.border,
        'hover:shadow-lg hover:shadow-black/20'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={cn('p-3 rounded-lg', colors.bg, 'border', colors.border)}>
          <IconComponent className={cn('w-6 h-6', colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg leading-tight">{agent.name}</h3>
          {agent.description && (
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{agent.description}</p>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Zap className="w-4 h-4" />
          <span>{agent.execution_count} runs</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-4 h-4" />
          <span>{getTimeAgo(agent.last_run_at)}</span>
        </div>
      </div>
      
      {/* Variables */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-1.5">Variables:</p>
        <div className="flex flex-wrap gap-1.5">
          {agent.template_variables.map((v) => (
            <span
              key={v}
              className="px-2 py-0.5 text-xs rounded bg-white/5 text-slate-400 font-mono"
            >
              {'{' + v + '}'}
            </span>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <button
          onClick={() => onViewPrompts(agent)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
        >
          <Settings className="w-4 h-4" />
          View Prompts
        </button>
        <button
          onClick={() => onTest(agent)}
          disabled={!agent.is_active}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors',
            agent.is_active
              ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
              : 'bg-white/5 text-slate-500 cursor-not-allowed'
          )}
        >
          <Play className="w-4 h-4" />
          Test
        </button>
      </div>
    </motion.div>
  );
}

export default AgentCard;
