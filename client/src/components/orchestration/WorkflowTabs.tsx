/**
 * WorkflowTabs Component
 * 
 * n8n-style horizontal tabs for switching between workflows
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Play,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_default?: boolean;
  agent_count?: number;
}

interface WorkflowTabsProps {
  workflows: WorkflowData[];
  activeWorkflowId: string | null;
  onSelectWorkflow: (workflowId: string | null) => void;
  onCreateWorkflow: () => void;
  onDeleteWorkflow?: (workflowId: string) => void;
  onRenameWorkflow?: (workflowId: string, newName: string) => void;
  onDuplicateWorkflow?: (workflowId: string) => void;
  onRunWorkflow?: (workflowId: string) => void;
  className?: string;
}

const WORKFLOW_COLORS: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', activeBg: 'bg-amber-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', activeBg: 'bg-emerald-500/20' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', activeBg: 'bg-pink-500/20' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', activeBg: 'bg-indigo-500/20' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', activeBg: 'bg-rose-500/20' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', activeBg: 'bg-orange-500/20' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', activeBg: 'bg-teal-500/20' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', activeBg: 'bg-cyan-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', activeBg: 'bg-purple-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', activeBg: 'bg-blue-500/20' },
};

export function WorkflowTabs({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onCreateWorkflow,
  onDeleteWorkflow,
  onRenameWorkflow,
  onDuplicateWorkflow,
  onRunWorkflow,
  className,
}: WorkflowTabsProps) {
  const [contextMenu, setContextMenu] = useState<{ workflowId: string; x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check scroll state
  useEffect(() => {
    const checkScroll = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, [workflows]);

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleContextMenu = (e: React.MouseEvent, workflowId: string) => {
    e.preventDefault();
    setContextMenu({ workflowId, x: e.clientX, y: e.clientY });
  };

  const handleStartRename = (workflow: WorkflowData) => {
    setEditingId(workflow.id);
    setEditingName(workflow.name);
    setContextMenu(null);
  };

  const handleFinishRename = () => {
    if (editingId && editingName.trim() && onRenameWorkflow) {
      onRenameWorkflow(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  };

  const getColorClasses = (color: string) => {
    return WORKFLOW_COLORS[color] || WORKFLOW_COLORS.blue;
  };

  return (
    <div className={cn('flex items-center gap-1 bg-slate-900/50 border-b border-white/10 px-2', className)}>
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          className="flex-shrink-0 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All Workflows" Tab */}
        <button
          onClick={() => onSelectWorkflow(null)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            activeWorkflowId === null
              ? 'bg-white/10 text-white border border-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          All Workflows
        </button>

        {/* Individual Workflow Tabs */}
        {workflows.map((workflow) => {
          const colors = getColorClasses(workflow.color);
          const isActive = activeWorkflowId === workflow.id;
          const isEditing = editingId === workflow.id;

          return (
            <motion.div
              key={workflow.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-shrink-0"
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 border outline-none',
                    colors.border, colors.text
                  )}
                  style={{ minWidth: '100px' }}
                />
              ) : (
                <button
                  onClick={() => onSelectWorkflow(workflow.id)}
                  onContextMenu={(e) => handleContextMenu(e, workflow.id)}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                    isActive
                      ? cn(colors.activeBg, colors.border, colors.text)
                      : cn('border-transparent text-white/60 hover:text-white hover:bg-white/5')
                  )}
                >
                  {/* Color indicator */}
                  <span className={cn('w-2 h-2 rounded-full', colors.text.replace('text-', 'bg-'))} />
                  
                  {/* Name */}
                  <span className="truncate max-w-[120px]">{workflow.name}</span>
                  
                  {/* Agent count badge */}
                  {workflow.agent_count !== undefined && workflow.agent_count > 0 && (
                    <span className="text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                      {workflow.agent_count}
                    </span>
                  )}

                  {/* More options button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, workflow.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded transition-opacity"
                  >
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </button>
              )}
            </motion.div>
          );
        })}

        {/* Add Workflow Button */}
        <button
          onClick={onCreateWorkflow}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          className="flex-shrink-0 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-slate-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {onRunWorkflow && (
              <button
                onClick={() => {
                  onRunWorkflow(contextMenu.workflowId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                <Play className="w-4 h-4" />
                Run Workflow
              </button>
            )}
            
            {onRenameWorkflow && (
              <button
                onClick={() => {
                  const workflow = workflows.find(w => w.id === contextMenu.workflowId);
                  if (workflow) handleStartRename(workflow);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Rename
              </button>
            )}
            
            {onDuplicateWorkflow && (
              <button
                onClick={() => {
                  onDuplicateWorkflow(contextMenu.workflowId);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
            )}
            
            {onDeleteWorkflow && (
              <>
                <div className="border-t border-white/10 my-1" />
                <button
                  onClick={() => {
                    const workflow = workflows.find(w => w.id === contextMenu.workflowId);
                    if (workflow?.is_default) {
                      alert('Cannot delete default workflow');
                    } else {
                      onDeleteWorkflow(contextMenu.workflowId);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WorkflowTabs;
