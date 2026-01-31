/**
 * NodePalette Component
 * 
 * n8n-style draggable node sidebar for adding agents to the canvas
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Database,
  Globe,
  Sparkles,
  Brain,
  FileText,
  Zap,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Star,
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

// Node categories with their templates
const NODE_CATEGORIES = [
  {
    id: 'analysis',
    name: 'Analysis',
    icon: Database,
    color: 'text-blue-400',
    nodes: [
      {
        id: 'data-agent',
        name: 'Data Agent',
        description: 'Retrieves and processes data from databases',
        category: 'analysis',
        icon: 'database',
        color: 'blue',
      },
      {
        id: 'query-agent',
        name: 'Query Agent',
        description: 'Executes complex database queries',
        category: 'analysis',
        icon: 'database',
        color: 'blue',
      },
      {
        id: 'metrics-agent',
        name: 'Metrics Agent',
        description: 'Calculates and analyzes metrics',
        category: 'analysis',
        icon: 'cpu',
        color: 'blue',
      },
    ],
  },
  {
    id: 'research',
    name: 'Research',
    icon: Search,
    color: 'text-emerald-400',
    nodes: [
      {
        id: 'research-agent',
        name: 'Research Agent',
        description: 'Performs web research and gathers information',
        category: 'research',
        icon: 'search',
        color: 'emerald',
      },
      {
        id: 'web-search-agent',
        name: 'Web Search Agent',
        description: 'Searches the web for recent articles',
        category: 'research',
        icon: 'globe',
        color: 'emerald',
      },
      {
        id: 'intelligence-agent',
        name: 'Intelligence Agent',
        description: 'Gathers intelligence from multiple sources',
        category: 'research',
        icon: 'globe',
        color: 'emerald',
      },
    ],
  },
  {
    id: 'synthesis',
    name: 'Synthesis',
    icon: Sparkles,
    color: 'text-purple-400',
    nodes: [
      {
        id: 'synthesis-agent',
        name: 'Synthesis Agent',
        description: 'Synthesizes findings into cohesive reports',
        category: 'synthesis',
        icon: 'sparkles',
        color: 'purple',
      },
      {
        id: 'summary-agent',
        name: 'Summary Agent',
        description: 'Creates concise summaries from data',
        category: 'synthesis',
        icon: 'sparkles',
        color: 'purple',
      },
      {
        id: 'briefing-agent',
        name: 'Briefing Agent',
        description: 'Generates executive briefings',
        category: 'synthesis',
        icon: 'brain',
        color: 'purple',
      },
    ],
  },
  {
    id: 'game',
    name: 'Game Agents',
    icon: Zap,
    color: 'text-amber-400',
    nodes: [
      {
        id: 'advisor-agent',
        name: 'Advisor Agent',
        description: 'Provides strategic game advice',
        category: 'game',
        icon: 'brain',
        color: 'amber',
      },
      {
        id: 'news-agent',
        name: 'News Agent',
        description: 'Generates in-game news content',
        category: 'game',
        icon: 'file-text',
        color: 'amber',
      },
      {
        id: 'report-agent',
        name: 'Report Agent',
        description: 'Creates end-game reports',
        category: 'game',
        icon: 'file-text',
        color: 'amber',
      },
    ],
  },
];

// Recently used nodes (would be persisted in real app)
const RECENT_NODES = [
  NODE_CATEGORIES[0].nodes[0], // Data Agent
  NODE_CATEGORIES[1].nodes[0], // Research Agent
  NODE_CATEGORIES[2].nodes[0], // Synthesis Agent
];

const ICON_MAP: Record<string, typeof Database> = {
  database: Database,
  search: Search,
  globe: Globe,
  sparkles: Sparkles,
  brain: Brain,
  'file-text': FileText,
  zap: Zap,
  cpu: Brain,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Brain;
}

export function NodePalette({
  onDragStart,
  onAddNode,
  collapsed = false,
  onToggleCollapse,
  className,
}: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['analysis', 'research']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDragStart = useCallback((event: React.DragEvent, node: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
    onDragStart(event, node);
  }, [onDragStart]);

  // Filter nodes based on search
  const filteredCategories = NODE_CATEGORIES.map(category => ({
    ...category,
    nodes: category.nodes.filter(node =>
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.nodes.length > 0);

  if (collapsed) {
    return (
      <div className={cn('w-12 bg-slate-900/80 border-r border-white/10 flex flex-col items-center py-3 gap-2', className)}>
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Expand palette"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        <div className="w-6 h-px bg-white/10 my-1" />
        
        {NODE_CATEGORIES.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              className={cn(
                'p-2 rounded-lg transition-colors',
                category.color,
                'hover:bg-white/10'
              )}
              title={category.name}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside className={cn(
      'w-64 bg-slate-900/80 border-r border-white/10 flex flex-col overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white">Node Palette</h2>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-adl-accent/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {/* Recent */}
        {!searchQuery && (
          <div className="mb-3">
            <button
              onClick={() => toggleCategory('recent')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span className="flex-1 text-left">Recently Used</span>
              {expandedCategories.includes('recent') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedCategories.includes('recent') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 pt-1">
                    {RECENT_NODES.map(node => (
                      <DraggableNode
                        key={`recent-${node.id}`}
                        node={node}
                        onDragStart={handleDragStart}
                        onAdd={onAddNode}
                        compact
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Node Categories */}
        {filteredCategories.map(category => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);

          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                <CategoryIcon className={cn('w-4 h-4', category.color)} />
                <span className="flex-1 text-left">{category.name}</span>
                <span className="text-xs text-white/30">{category.nodes.length}</span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 pt-1">
                      {category.nodes.map(node => (
                        <DraggableNode
                          key={node.id}
                          node={node}
                          onDragStart={handleDragStart}
                          onAdd={onAddNode}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 text-center">
        <p className="text-[10px] text-white/30">
          Drag nodes to canvas or click + to add
        </p>
      </div>
    </aside>
  );
}

interface DraggableNodeProps {
  node: NodeTemplate;
  onDragStart: (event: React.DragEvent, node: NodeTemplate) => void;
  onAdd?: (node: NodeTemplate) => void;
  compact?: boolean;
}

function DraggableNode({ node, onDragStart, onAdd, compact = false }: DraggableNodeProps) {
  const Icon = getIcon(node.icon);
  
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400' },
  };

  const colors = colorClasses[node.color] || colorClasses.blue;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node)}
      className={cn(
        'group flex items-center gap-2 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors',
        colors.bg,
        'border',
        colors.border,
        'hover:bg-white/10'
      )}
    >
      {/* Drag handle */}
      <GripVertical className="w-3 h-3 text-white/30 group-hover:text-white/50 flex-shrink-0" />
      
      {/* Icon */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
        colors.bg
      )}>
        <Icon className={cn('w-4 h-4', colors.text)} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{node.name}</p>
        {!compact && (
          <p className="text-[10px] text-white/40 truncate">{node.description}</p>
        )}
      </div>

      {/* Add button */}
      {onAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(node);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
        >
          <Plus className="w-4 h-4 text-white/60" />
        </button>
      )}
    </div>
  );
}

export default NodePalette;
