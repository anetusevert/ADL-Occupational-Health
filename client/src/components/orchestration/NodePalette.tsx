/**
 * NodePalette Component
 * 
 * n8n-style draggable node sidebar for adding agents to the canvas
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  Sparkles,
  FileText,
  Brain,
  Zap,
  Cpu,
  HelpCircle,
  MapPin,
  Clock,
  GripVertical,
  Plus,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  defaultPrompt?: string;
}

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeTemplate: NodeTemplate) => void;
  onAddNode?: (nodeTemplate: NodeTemplate) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

// Icon mapping
const ICONS: Record<string, typeof Brain> = {
  database: Database,
  search: Globe,
  globe: Globe,
  sparkles: Sparkles,
  map: MapPin,
  'help-circle': HelpCircle,
  brain: Brain,
  zap: Zap,
  cpu: Cpu,
  file: FileText,
};

// Color classes
const COLORS: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400' },
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/30', text: 'text-rose-400' },
};

// Default node templates organized by category
const DEFAULT_NODE_TEMPLATES: NodeTemplate[] = [
  // Analysis Category
  {
    id: 'data-agent',
    name: 'Data Agent',
    description: 'Retrieves and processes data from internal databases',
    category: 'analysis',
    icon: 'database',
    color: 'blue',
    defaultPrompt: 'You are a data analysis agent. Extract and analyze relevant data.',
  },
  {
    id: 'query-agent',
    name: 'Query Agent',
    description: 'Executes database queries and formats results',
    category: 'analysis',
    icon: 'cpu',
    color: 'purple',
    defaultPrompt: 'You are a query agent. Execute queries and return structured data.',
  },
  // Research Category
  {
    id: 'web-research-agent',
    name: 'Web Research Agent',
    description: 'Performs web search for real-time information',
    category: 'research',
    icon: 'globe',
    color: 'emerald',
    defaultPrompt: 'You are a web research agent. Search for and synthesize online information.',
  },
  {
    id: 'intelligence-agent',
    name: 'Intelligence Agent',
    description: 'Gathers multi-source intelligence data',
    category: 'research',
    icon: 'search',
    color: 'cyan',
    defaultPrompt: 'You are an intelligence agent. Gather and correlate information from multiple sources.',
  },
  // Synthesis Category
  {
    id: 'synthesis-agent',
    name: 'Synthesis Agent',
    description: 'Combines data sources into coherent reports',
    category: 'synthesis',
    icon: 'sparkles',
    color: 'amber',
    defaultPrompt: 'You are a synthesis agent. Combine multiple inputs into a comprehensive output.',
  },
  {
    id: 'report-agent',
    name: 'Report Agent',
    description: 'Generates formatted reports and summaries',
    category: 'synthesis',
    icon: 'file',
    color: 'rose',
    defaultPrompt: 'You are a report agent. Generate well-formatted reports from provided data.',
  },
  // AI Category
  {
    id: 'reasoning-agent',
    name: 'Reasoning Agent',
    description: 'Performs complex reasoning and decision-making',
    category: 'ai',
    icon: 'brain',
    color: 'purple',
    defaultPrompt: 'You are a reasoning agent. Analyze situations and provide logical conclusions.',
  },
  {
    id: 'advisor-agent',
    name: 'Advisor Agent',
    description: 'Provides strategic recommendations',
    category: 'ai',
    icon: 'zap',
    color: 'amber',
    defaultPrompt: 'You are a strategic advisor. Provide actionable recommendations.',
  },
];

const CATEGORIES = [
  { id: 'analysis', name: 'Analysis', icon: Database, description: 'Data processing and analysis' },
  { id: 'research', name: 'Research', icon: Globe, description: 'Web and multi-source research' },
  { id: 'synthesis', name: 'Synthesis', icon: Sparkles, description: 'Report generation and summarization' },
  { id: 'ai', name: 'AI & Reasoning', icon: Brain, description: 'Advanced AI capabilities' },
];

export function NodePalette({
  onDragStart,
  onAddNode,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['analysis', 'research', 'synthesis', 'ai'])
  );

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_NODE_TEMPLATES;
    const query = searchQuery.toLowerCase();
    return DEFAULT_NODE_TEMPLATES.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group nodes by category
  const nodesByCategory = useMemo(() => {
    const grouped: Record<string, NodeTemplate[]> = {};
    filteredNodes.forEach((node) => {
      if (!grouped[node.category]) {
        grouped[node.category] = [];
      }
      grouped[node.category].push(node);
    });
    return grouped;
  }, [filteredNodes]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleDragStart = (event: React.DragEvent, node: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
    onDragStart(event, node);
  };

  if (isCollapsed) {
    return (
      <div className={cn('w-12 bg-slate-900/80 border-r border-white/10 flex flex-col items-center py-3 gap-3', className)}>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          title="Expand palette"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={cat.name}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside className={cn('w-64 bg-slate-900/80 border-r border-white/10 flex flex-col', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Node Palette</h3>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-adl-accent focus:border-adl-accent"
          />
        </div>
      </div>

      {/* Node Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORIES.map((category) => {
          const nodes = nodesByCategory[category.id] || [];
          const isExpanded = expandedCategories.has(category.id);
          const Icon = category.icon;

          if (nodes.length === 0 && searchQuery) return null;

          return (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{category.name}</span>
                <span className="text-[10px] text-white/30">{nodes.length}</span>
              </button>

              {/* Category Nodes */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-1 pl-2">
                      {nodes.map((node) => {
                        const NodeIcon = ICONS[node.icon] || HelpCircle;
                        const colors = COLORS[node.color] || COLORS.blue;

                        return (
                          <div
                            key={node.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, node)}
                            onClick={() => onAddNode?.(node)}
                            className={cn(
                              'group flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing',
                              'border border-transparent hover:border-white/10 hover:bg-white/5',
                              'transition-all duration-150'
                            )}
                          >
                            {/* Drag Handle */}
                            <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                            
                            {/* Icon */}
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', colors.bg, colors.border, 'border')}>
                              <NodeIcon className={cn('w-4 h-4', colors.text)} />
                            </div>
                            
                            {/* Name & Description */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{node.name}</p>
                              <p className="text-[10px] text-white/40 truncate">{node.description}</p>
                            </div>

                            {/* Add Button */}
                            {onAddNode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddNode(node);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* No Results */}
        {filteredNodes.length === 0 && searchQuery && (
          <div className="text-center py-8 text-white/40">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No nodes found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <p className="text-[10px] text-white/30 text-center">
          Drag nodes to canvas or click to add
        </p>
      </div>
    </aside>
  );
}

export default NodePalette;
