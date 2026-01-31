/**
 * AgentNode - Custom React Flow node for AI agents
 * 
 * n8n-style design: clean, minimal with visible connection handles.
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
  FileText,
  MessageSquare,
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
  'file-text': FileText,
  message: MessageSquare,
};

// n8n-style color accents (subtle, professional)
const COLOR_ACCENTS: Record<string, { accent: string; bg: string; iconBg: string }> = {
  blue: {
    accent: '#3b82f6',
    bg: 'bg-slate-800',
    iconBg: 'bg-blue-500/20',
  },
  cyan: {
    accent: '#06b6d4',
    bg: 'bg-slate-800',
    iconBg: 'bg-cyan-500/20',
  },
  purple: {
    accent: '#8b5cf6',
    bg: 'bg-slate-800',
    iconBg: 'bg-purple-500/20',
  },
  amber: {
    accent: '#f59e0b',
    bg: 'bg-slate-800',
    iconBg: 'bg-amber-500/20',
  },
  emerald: {
    accent: '#10b981',
    bg: 'bg-slate-800',
    iconBg: 'bg-emerald-500/20',
  },
  pink: {
    accent: '#ec4899',
    bg: 'bg-slate-800',
    iconBg: 'bg-pink-500/20',
  },
  slate: {
    accent: '#64748b',
    bg: 'bg-slate-800',
    iconBg: 'bg-slate-500/20',
  },
  orange: {
    accent: '#f97316',
    bg: 'bg-slate-800',
    iconBg: 'bg-orange-500/20',
  },
  teal: {
    accent: '#14b8a6',
    bg: 'bg-slate-800',
    iconBg: 'bg-teal-500/20',
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
  const colors = COLOR_ACCENTS[data.color || 'cyan'] || COLOR_ACCENTS.cyan;
  
  return (
    <div
      className={`
        relative rounded-lg shadow-lg
        transition-all duration-150
        ${colors.bg}
        ${selected 
          ? 'ring-2 ring-offset-2 ring-offset-slate-900' 
          : 'hover:shadow-xl'
        }
      `}
      style={{
        borderLeft: `4px solid ${colors.accent}`,
        minWidth: '160px',
        maxWidth: '200px',
        ...(selected ? { '--tw-ring-color': colors.accent } as React.CSSProperties : {}),
      }}
    >
      {/* Input Handle - Left side */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600 hover:!bg-white hover:!border-slate-400 transition-colors"
        style={{ left: -6 }}
      />
      
      {/* Node Content */}
      <div className="px-3 py-2.5">
        {/* Header with icon and name */}
        <div className="flex items-center gap-2.5">
          {/* Icon container */}
          <div 
            className={`p-1.5 rounded ${colors.iconBg} flex-shrink-0`}
          >
            <IconComponent 
              className="w-4 h-4" 
              style={{ color: colors.accent }}
            />
          </div>
          
          {/* Name and category */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate leading-tight">
              {data.name}
            </h3>
            {data.category && (
              <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                {data.category}
              </p>
            )}
          </div>
        </div>
        
        {/* LLM Override - compact display */}
        {data.llm_provider && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
            <Cpu className="w-3 h-3" />
            <span className="truncate">{data.llm_model_name || data.llm_provider}</span>
          </div>
        )}
      </div>
      
      {/* Status Indicator - inactive */}
      {data.is_active === false && (
        <div 
          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"
          title="Inactive"
        />
      )}
      
      {/* Output Handle - Right side */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-600 hover:!bg-white hover:!border-slate-400 transition-colors"
        style={{ right: -6 }}
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
export default AgentNode;
