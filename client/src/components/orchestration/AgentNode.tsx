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

// n8n-style color accents (light background, colored accents)
const COLOR_ACCENTS: Record<string, { accent: string; bg: string; iconBg: string; handleColor: string }> = {
  blue: {
    accent: '#3b82f6',
    bg: 'bg-slate-100',
    iconBg: 'bg-blue-100',
    handleColor: '#3b82f6',
  },
  cyan: {
    accent: '#06b6d4',
    bg: 'bg-slate-100',
    iconBg: 'bg-cyan-100',
    handleColor: '#06b6d4',
  },
  purple: {
    accent: '#8b5cf6',
    bg: 'bg-slate-100',
    iconBg: 'bg-purple-100',
    handleColor: '#8b5cf6',
  },
  amber: {
    accent: '#f59e0b',
    bg: 'bg-slate-100',
    iconBg: 'bg-amber-100',
    handleColor: '#f59e0b',
  },
  emerald: {
    accent: '#10b981',
    bg: 'bg-slate-100',
    iconBg: 'bg-emerald-100',
    handleColor: '#10b981',
  },
  pink: {
    accent: '#ec4899',
    bg: 'bg-slate-100',
    iconBg: 'bg-pink-100',
    handleColor: '#ec4899',
  },
  slate: {
    accent: '#64748b',
    bg: 'bg-slate-100',
    iconBg: 'bg-slate-200',
    handleColor: '#64748b',
  },
  orange: {
    accent: '#f97316',
    bg: 'bg-slate-100',
    iconBg: 'bg-orange-100',
    handleColor: '#f97316',
  },
  teal: {
    accent: '#14b8a6',
    bg: 'bg-slate-100',
    iconBg: 'bg-teal-100',
    handleColor: '#14b8a6',
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
        relative rounded-xl shadow-md
        transition-all duration-150
        ${colors.bg}
        border border-slate-200
        ${selected 
          ? 'ring-2 ring-offset-2 ring-offset-slate-900 shadow-lg' 
          : 'hover:shadow-lg hover:border-slate-300'
        }
      `}
      style={{
        minWidth: '140px',
        maxWidth: '180px',
        ...(selected ? { '--tw-ring-color': colors.accent } as React.CSSProperties : {}),
      }}
    >
      {/* Input Handle - Left side (n8n-style circle) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !rounded-full !border-2 transition-all"
        style={{ 
          left: -7,
          backgroundColor: '#fff',
          borderColor: colors.handleColor,
        }}
      />
      
      {/* Node Content */}
      <div className="px-3 py-2.5">
        {/* Header with icon and name */}
        <div className="flex items-center gap-2.5">
          {/* Icon container - n8n style colored box */}
          <div 
            className={`p-2 rounded-lg ${colors.iconBg} flex-shrink-0`}
            style={{ border: `1px solid ${colors.accent}30` }}
          >
            <IconComponent 
              className="w-4 h-4" 
              style={{ color: colors.accent }}
            />
          </div>
          
          {/* Name and category */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate leading-tight">
              {data.name}
            </h3>
            {data.category && (
              <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                {data.category}
              </p>
            )}
          </div>
        </div>
        
        {/* LLM Override - compact display */}
        {data.llm_provider && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 border-t border-slate-200 pt-1.5">
            <Cpu className="w-3 h-3" />
            <span className="truncate">{data.llm_model_name || data.llm_provider}</span>
          </div>
        )}
      </div>
      
      {/* Status Indicator - inactive */}
      {data.is_active === false && (
        <div 
          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"
          title="Inactive"
        />
      )}
      
      {/* Output Handle - Right side (n8n-style circle) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !rounded-full !border-2 transition-all"
        style={{ 
          right: -7,
          backgroundColor: '#fff',
          borderColor: colors.handleColor,
        }}
      />
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
export default AgentNode;
