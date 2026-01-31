/**
 * WorkflowTabs Component
 * 
 * n8n-style tab bar for switching between workflows
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  MoreHorizontal, 
  Edit2, 
  Trash2,
  Play,
  Copy,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface WorkflowTab {
  id: string;
  name: string;
  description?: string;
  color: string;
  agentCount: number;
  isDefault?: boolean;
}

interface WorkflowTabsProps {
  workflows: WorkflowTab[];
  activeWorkflowId: string | null;
  onSelect: (workflowId: string) => void;
  onCreateNew: () => void;
  onRename?: (workflowId: string, newName: string) => void;
  onDelete?: (workflowId: string) => void;
  onDuplicate?: (workflowId: string) => void;
  onRun?: (workflowId: string) => void;
  className?: string;
}

// Color palette matching workflows
const WORKFLOW_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  pink: { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400' },
  indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  teal: { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-400' },
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
};

function getColorClasses(color: string) {
  return WORKFLOW_COLORS[color] || WORKFLOW_COLORS.blue;
}

export function WorkflowTabs({
  workflows,
  activeWorkflowId,
  onSelect,
  onCreateNew,
  onRename,
  onDelete,
  onDuplicate,
  onRun,
  className,
}: WorkflowTabsProps) {
  const [contextMenu, setContextMenu] = useState<{ workflowId: string; x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleContextMenu = (e: React.MouseEvent, workflowId: string) => {
    e.preventDefault();
    setContextMenu({ workflowId, x: e.clientX, y: e.clientY });
  };

  const handleStartRename = (workflow: WorkflowTab) => {
    setEditingId(workflow.id);
    setEditingName(workflow.name);
    setContextMenu(null);
  };

  const handleFinishRename = () => {
    if (editingId && editingName.trim() && onRename) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow?.isDefault) {
      alert('Cannot delete default workflows');
      return;
    }
    if (onDelete) {
      onDelete(workflowId);
    }
    setContextMenu(null);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/80 border-b border-white/10 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* All Workflows Tab */}
        <button
          onClick={() => onSelect('')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
            !activeWorkflowId
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          All Workflows
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
            {workflows.length}
          </span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Workflow Tabs */}
        {workflows.map((workflow) => {
          const colors = getColorClasses(workflow.color);
          const isActive = activeWorkflowId === workflow.id;
          const isEditing = editingId === workflow.id;

          return (
            <motion.div
              key={workflow.id}
              layout
              className="relative"
            >
              <button
                onClick={() => !isEditing && onSelect(workflow.id)}
                onContextMenu={(e) => handleContextMenu(e, workflow.id)}
                className={cn(
                  'group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  isActive
                    ? cn(colors.bg, 'border', colors.border, colors.text)
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {/* Color dot */}
                <span className={cn('w-2 h-2 rounded-full', colors.bg.replace('/20', ''))} />

                {/* Name */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="bg-transparent border-none outline-none w-24 text-white"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="max-w-32 truncate">{workflow.name}</span>
                )}

                {/* Agent count */}
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  isActive ? 'bg-white/10' : 'bg-white/5 text-white/40'
                )}>
                  {workflow.agentCount}
                </span>

                {/* Close button (on hover for non-default) */}
                {!workflow.isDefault && isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(workflow.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>
            </motion.div>
          );
        })}

        {/* Add New Tab */}
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 bg-slate-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-40"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {onRun && (
                <button
                  onClick={() => {
                    onRun(contextMenu.workflowId);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  Run Workflow
                </button>
              )}
              
              <button
                onClick={() => handleStartRename(workflows.find(w => w.id === contextMenu.workflowId)!)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Rename
              </button>
              
              {onDuplicate && (
                <button
                  onClick={() => {
                    onDuplicate(contextMenu.workflowId);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              
              {!workflows.find(w => w.id === contextMenu.workflowId)?.isDefault && (
                <>
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => handleDelete(contextMenu.workflowId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WorkflowTabs;
