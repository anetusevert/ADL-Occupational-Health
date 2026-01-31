/**
 * CanvasToolbar Component
 * 
 * n8n-style toolbar for workflow canvas actions
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  LayoutGrid,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CanvasToolbarProps {
  workflowName: string;
  onWorkflowNameChange?: (name: string) => void;
  isSaved: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onRun?: () => void;
  isRunning?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  zoomLevel?: number;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  onAutoLayout?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export function CanvasToolbar({
  workflowName,
  onWorkflowNameChange,
  isSaved,
  isSaving = false,
  onSave,
  onRun,
  isRunning = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onZoomIn,
  onZoomOut,
  onFitView,
  zoomLevel = 100,
  showGrid = true,
  onToggleGrid,
  onAutoLayout,
  onOpenSettings,
  className,
}: CanvasToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workflowName);

  const handleStartEdit = () => {
    setEditedName(workflowName);
    setIsEditingName(true);
  };

  const handleFinishEdit = () => {
    if (editedName.trim() && onWorkflowNameChange) {
      onWorkflowNameChange(editedName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/10',
      className
    )}>
      {/* Left Section - Workflow Name */}
      <div className="flex items-center gap-4">
        {/* Workflow Name */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEdit();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              autoFocus
              className="bg-white/5 border border-white/20 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-adl-accent"
            />
          ) : (
            <button
              onClick={handleStartEdit}
              className="group flex items-center gap-2 text-white font-medium hover:text-white/80 transition-colors"
            >
              <span>{workflowName}</span>
              <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Save Status */}
          <div className="flex items-center gap-1.5 text-xs">
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="text-amber-400">Saving...</span>
              </>
            ) : isSaved ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">Unsaved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center Section - Main Actions */}
      <div className="flex items-center gap-2">
        {/* Run Workflow */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all',
            isRunning
              ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Test Workflow
            </>
          )}
        </button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              'p-2 rounded-lg transition-colors',
              canUndo
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-white/20 cursor-not-allowed'
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              'p-2 rounded-lg transition-colors',
              canRedo
                ? 'text-white/60 hover:text-white hover:bg-white/10'
                : 'text-white/20 cursor-not-allowed'
            )}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isSaved || isSaving}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            isSaved || isSaving
              ? 'text-white/30 cursor-not-allowed'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          )}
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Right Section - View Controls */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="px-2 text-xs text-white/60 min-w-[3rem] text-center">
            {Math.round(zoomLevel)}%
          </span>
          
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button
            onClick={onFitView}
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Fit View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10" />

        {/* Grid Toggle */}
        <button
          onClick={onToggleGrid}
          className={cn(
            'p-2 rounded-lg transition-colors',
            showGrid
              ? 'text-adl-accent bg-adl-accent/10'
              : 'text-white/40 hover:text-white hover:bg-white/10'
          )}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        {/* Auto Layout */}
        <button
          onClick={onAutoLayout}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Auto Layout"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default CanvasToolbar;
