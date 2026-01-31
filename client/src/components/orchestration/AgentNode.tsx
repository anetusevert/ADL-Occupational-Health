/**
 * AgentNode - Custom React Flow node for AI agents
 * 
 * Displays an agent as a draggable node in the workflow canvas.
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
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
  Settings,
} from 'lucide-react';

// Icon mapping
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
  settings: Settings,
};

// Color mapping for node styling
const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; handle: string }> = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    handle: 'bg-blue-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    handle: 'bg-cyan-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    handle: 'bg-purple-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    handle: 'bg-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    handle: 'bg-emerald-400',
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/50',
    text: 'text-pink-400',
    handle: 'bg-pink-400',
  },
  slate: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/50',
    text: 'text-slate-400',
    handle: 'bg-slate-400',
  },
};

export interface AgentNodeData {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  llm_provider?: string;
  llm_model_name?: string;
  is_active?: boolean;
}

function AgentNodeComponent({ data, selected }: NodeProps<AgentNodeData>) {
  const IconComponent = ICON_MAP[data.icon || 'bot'] || Brain;
  const colors = COLOR_CLASSES[data.color || 'cyan'] || COLOR_CLASSES.cyan;
  
  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[160px] max-w-[200px]
        transition-all duration-200 cursor-pointer
        ${colors.bg} ${colors.border}
        ${selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}
        hover:scale-105
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className={`w-3 h-3 ${colors.handle} border-2 border-slate-900`}
      />
      
      {/* Content */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
          <IconComponent className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{data.name}</h3>
          {data.category && (
            <p className="text-xs text-slate-400 truncate">{data.category}</p>
          )}
        </div>
      </div>
      
      {/* LLM Override Indicator */}
      {data.llm_provider && (
        <div className="mt-2 px-2 py-1 bg-slate-800/50 rounded text-xs text-slate-400 flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          <span className="truncate">{data.llm_model_name || data.llm_provider}</span>
        </div>
      )}
      
      {/* Status Indicator */}
      {data.is_active === false && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900" />
      )}
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={`w-3 h-3 ${colors.handle} border-2 border-slate-900`}
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
export default AgentNode;
