/**
 * WorkflowCard Component
 * 
 * Displays a workflow with its usage statistics in a card format.
 */

import { motion } from 'framer-motion';
import {
  Workflow,
  Users,
  Play,
  CheckCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Globe,
  Brain,
  Zap,
  FileText,
  Search,
  MessageSquare,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface WorkflowDashboardData {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  agent_count: number;
  execution_count: number;
  success_count: number;
  success_rate: number;
  last_run_at?: string;
}

interface WorkflowCardProps {
  workflow: WorkflowDashboardData;
  onToggleActive?: (workflowId: string, isActive: boolean) => void;
  onRun?: (workflowId: string) => void;
  onClick?: (workflowId: string) => void;
}

// Color classes for workflow cards
const COLOR_CLASSES: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'text-amber-400', badge: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'text-emerald-400', badge: 'bg-emerald-500' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: 'text-pink-400', badge: 'bg-pink-500' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: 'text-indigo-400', badge: 'bg-indigo-500' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: 'text-rose-400', badge: 'bg-rose-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: 'text-orange-400', badge: 'bg-orange-500' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', icon: 'text-teal-400', badge: 'bg-teal-500' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: 'text-cyan-400', badge: 'bg-cyan-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: 'text-purple-400', badge: 'bg-purple-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-400', badge: 'bg-blue-500' },
};

// Icons for different workflow types
const WORKFLOW_ICONS: Record<string, typeof Workflow> = {
  'report-generation': Sparkles,
  'strategic-deep-dive': Sparkles,
  'country-assessment': Globe,
  'metric-explanation': Brain,
  'intelligence-briefing': Search,
  'strategic-advisor': MessageSquare,
  'news-generator': FileText,
  'final-report': FileText,
};

function getTimeAgo(dateString?: string): string {
  if (!dateString) return 'Never';
  
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

export function WorkflowCard({ workflow, onToggleActive, onRun, onClick }: WorkflowCardProps) {
  const colors = COLOR_CLASSES[workflow.color] || COLOR_CLASSES.cyan;
  const IconComponent = WORKFLOW_ICONS[workflow.id] || Workflow;
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActive?.(workflow.id, !workflow.is_active);
  };
  
  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRun?.(workflow.id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(workflow.id)}
      className={cn(
        'relative rounded-xl border p-5 cursor-pointer transition-all',
        colors.bg,
        colors.border,
        'hover:shadow-lg hover:shadow-black/20'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-lg', colors.bg, 'border', colors.border)}>
            <IconComponent className={cn('w-5 h-5', colors.icon)} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg leading-tight">{workflow.name}</h3>
            {workflow.description && (
              <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{workflow.description}</p>
            )}
          </div>
        </div>
        
        {/* Active Toggle */}
        <button
          onClick={handleToggle}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            workflow.is_active 
              ? 'text-emerald-400 hover:bg-emerald-500/20' 
              : 'text-slate-500 hover:bg-slate-500/20'
          )}
          title={workflow.is_active ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
        >
          {workflow.is_active ? (
            <ToggleRight className="w-6 h-6" />
          ) : (
            <ToggleLeft className="w-6 h-6" />
          )}
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Agents */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">{workflow.agent_count}</span> agents
          </span>
        </div>
        
        {/* Executions */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <Play className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">{workflow.execution_count}</span> runs
          </span>
        </div>
        
        {/* Success Rate */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <CheckCircle className={cn(
            'w-4 h-4',
            workflow.success_rate >= 90 ? 'text-emerald-400' :
            workflow.success_rate >= 70 ? 'text-amber-400' :
            'text-red-400'
          )} />
          <span className="text-sm text-slate-300">
            <span className={cn(
              'font-semibold',
              workflow.success_rate >= 90 ? 'text-emerald-400' :
              workflow.success_rate >= 70 ? 'text-amber-400' :
              'text-red-400'
            )}>
              {workflow.success_rate}%
            </span> success
          </span>
        </div>
        
        {/* Last Run */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            {getTimeAgo(workflow.last_run_at)}
          </span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-2 h-2 rounded-full',
            workflow.is_active ? 'bg-emerald-400' : 'bg-slate-500'
          )} />
          <span className={cn(
            'text-xs font-medium',
            workflow.is_active ? 'text-emerald-400' : 'text-slate-500'
          )}>
            {workflow.is_active ? 'Active' : 'Inactive'}
          </span>
          
          {workflow.is_default && (
            <span className="text-xs text-slate-500 px-2 py-0.5 rounded bg-white/5">
              System
            </span>
          )}
        </div>
        
        {/* Run Button */}
        {onRun && (
          <button
            onClick={handleRun}
            disabled={!workflow.is_active}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              workflow.is_active
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            )}
          >
            <Play className="w-3.5 h-3.5" />
            Test
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default WorkflowCard;
