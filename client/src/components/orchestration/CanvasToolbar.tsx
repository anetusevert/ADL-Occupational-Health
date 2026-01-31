/**
 * CanvasToolbar Component
 * 
 * n8n-style toolbar for workflow canvas with run, save, zoom controls
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Square,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Settings,
  Download,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
export type RunStatus = 'idle' | 'running' | 'success' | 'error';

interface CanvasToolbarProps {
  workflowName?: string;
  onWorkflowNameChange?: (name: string) => void;
  
  // Run controls
  onRun?: () => void;
  onStop?: () => void;
  runStatus?: RunStatus;
  
  // Save controls
  onSave?: () => void;
  saveStatus?: SaveStatus;
  
  // Undo/Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  
  // Zoom controls
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  
  // Grid
  showGrid?: boolean;
  onToggleGrid?: () => void;
  snapToGrid?: boolean;
  onToggleSnap?: () => void;
  
  // Mini map
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  
  // Auto layout
  onAutoLayout?: () => void;
  
  // Import/Export
  onExport?: () => void;
  onImport?: () => void;
  
  // Settings
  onOpenSettings?: () => void;
  
  className?: string;
}

export function CanvasToolbar({
  workflowName = 'Untitled Workflow',
  onWorkflowNameChange,
  onRun,
  onStop,
  runStatus = 'idle',
  onSave,
  saveStatus = 'saved',
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  zoom = 100,
  onZoomIn,
  onZoomOut,
  onFitView,
  showGrid = true,
  onToggleGrid,
  snapToGrid = true,
  onToggleSnap,
  showMiniMap = true,
  onToggleMiniMap,
  onAutoLayout,
  onExport,
  onImport,
  onOpenSettings,
  className,
}: CanvasToolbarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workflowName);

  const handleNameSubmit = () => {
    if (editedName.trim() && onWorkflowNameChange) {
      onWorkflowNameChange(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditedName(workflowName);
      setIsEditingName(false);
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'saving':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'unsaved':
        return <div className="w-2 h-2 rounded-full bg-amber-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return 'Saved';
      case 'saving':
        return 'Saving...';
      case 'unsaved':
        return 'Unsaved changes';
      case 'error':
        return 'Save failed';
    }
  };

  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 bg-slate-900/80 border-b border-white/10', className)}>
      {/* Workflow Name */}
      <div className="flex items-center gap-2 min-w-0">
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="px-2 py-1 text-sm font-medium bg-white/10 border border-white/20 rounded text-white outline-none focus:ring-1 focus:ring-adl-accent min-w-[150px]"
          />
        ) : (
          <button
            onClick={() => {
              setEditedName(workflowName);
              setIsEditingName(true);
            }}
            className="text-sm font-medium text-white hover:text-adl-accent truncate max-w-[200px]"
            title="Click to rename"
          >
            {workflowName}
          </button>
        )}
        
        {/* Save Status */}
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          {getSaveStatusIcon()}
          <span className="hidden sm:inline">{getSaveStatusText()}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10" />

      {/* Run Controls */}
      <div className="flex items-center gap-1">
        {runStatus === 'running' ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
            title="Stop execution"
          >
            <Square className="w-4 h-4" />
            <span className="text-sm font-medium">Stop</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={runStatus === 'running'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors',
              runStatus === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : runStatus === 'error'
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-adl-accent/20 text-adl-accent hover:bg-adl-accent/30'
            )}
            title="Run workflow"
          >
            {runStatus === 'running' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : runStatus === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : runStatus === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {runStatus === 'running' ? 'Running' : runStatus === 'success' ? 'Success' : runStatus === 'error' ? 'Failed' : 'Run'}
            </span>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          icon={Undo2}
        />
        <ToolbarButton
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          icon={Redo2}
        />
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onZoomOut} title="Zoom out" icon={ZoomOut} />
        <span className="text-xs text-white/60 min-w-[40px] text-center">
          {Math.round(zoom)}%
        </span>
        <ToolbarButton onClick={onZoomIn} title="Zoom in" icon={ZoomIn} />
        <ToolbarButton onClick={onFitView} title="Fit to view" icon={Maximize2} />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View Options */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={onToggleGrid}
          active={showGrid}
          title={showGrid ? 'Hide grid' : 'Show grid'}
          icon={Grid3X3}
        />
        <ToolbarButton
          onClick={onToggleSnap}
          active={snapToGrid}
          title={snapToGrid ? 'Disable snap' : 'Enable snap'}
          icon={LayoutGrid}
        />
        <ToolbarButton
          onClick={onToggleMiniMap}
          active={showMiniMap}
          title={showMiniMap ? 'Hide minimap' : 'Show minimap'}
          icon={showMiniMap ? Eye : EyeOff}
        />
        <ToolbarButton
          onClick={onAutoLayout}
          title="Auto-layout"
          icon={LayoutGrid}
        />
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10" />

      {/* Import/Export */}
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onExport} title="Export workflow" icon={Download} />
        <ToolbarButton onClick={onImport} title="Import workflow" icon={Upload} />
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/10" />

      {/* Save & Settings */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={onSave}
          disabled={saveStatus === 'saved' || saveStatus === 'saving'}
          title="Save workflow (Ctrl+S)"
          icon={Save}
        />
        <ToolbarButton onClick={onOpenSettings} title="Settings" icon={Settings} />
      </div>
    </div>
  );
}

// Toolbar Button Component
interface ToolbarButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  icon: typeof Play;
}

function ToolbarButton({ onClick, disabled, active, title, icon: Icon }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        disabled
          ? 'text-white/20 cursor-not-allowed'
          : active
          ? 'text-adl-accent bg-adl-accent/20 hover:bg-adl-accent/30'
          : 'text-white/60 hover:text-white hover:bg-white/10'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default CanvasToolbar;
