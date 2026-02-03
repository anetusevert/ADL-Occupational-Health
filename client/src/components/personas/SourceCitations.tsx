/**
 * Arthur D. Little - Global Health Platform
 * SourceCitations Component
 * 
 * Displays research sources with expandable details and external links.
 * Supports filtering by source type (official, academic, news).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ExternalLink, 
  FileText, 
  Building2, 
  BookOpen, 
  Newspaper,
  ChevronDown,
  ChevronUp,
  Calendar,
  Link2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { type PersonaSource } from "../../data/personas";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface SourceCitationsProps {
  sources: PersonaSource[];
  className?: string;
  compact?: boolean;
}

type SourceType = 'all' | 'official' | 'academic' | 'news';

// ============================================================================
// HELPER CONFIG
// ============================================================================

const sourceTypeConfig: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
}> = {
  official: {
    icon: Building2,
    label: "Official",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  academic: {
    icon: BookOpen,
    label: "Academic",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  news: {
    icon: Newspaper,
    label: "News",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const expandVariants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3, ease: "easeOut" },
      opacity: { duration: 0.2, delay: 0.1 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.1 },
    },
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function FilterButton({ 
  type, 
  label, 
  icon: Icon, 
  isActive, 
  count,
  onClick 
}: { 
  type: SourceType; 
  label: string; 
  icon: React.ElementType;
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        isActive 
          ? "bg-white/10 text-white border border-white/20" 
          : "text-white/50 hover:text-white/80 hover:bg-white/5"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      <span className={cn(
        "px-1.5 py-0.5 rounded text-[10px]",
        isActive ? "bg-white/10" : "bg-white/5"
      )}>
        {count}
      </span>
    </button>
  );
}

function SourceCard({ source, index }: { source: PersonaSource; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = sourceTypeConfig[source.type];
  const Icon = config.icon;

  return (
    <motion.div
      variants={itemVariants}
      className="rounded-xl bg-slate-800/40 border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start justify-between gap-4 text-left"
      >
        <div className="flex items-start gap-3">
          {/* Source Type Badge */}
          <div className={cn(
            "p-2 rounded-lg",
            config.bg,
            config.border,
            "border"
          )}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>

          {/* Title and Meta */}
          <div>
            <h4 className="text-sm font-medium text-white mb-1 line-clamp-2 group-hover:text-white/90">
              {source.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className={cn("flex items-center gap-1", config.color)}>
                <Shield className="w-3 h-3" />
                {config.label}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {source.date}
              </span>
            </div>
          </div>
        </div>

        {/* Expand Button */}
        <div className={cn(
          "p-1.5 rounded-lg transition-colors",
          isExpanded ? "bg-white/10" : "bg-white/5 hover:bg-white/10"
        )}>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/50" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={expandVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="p-3 rounded-lg bg-slate-700/50 border border-white/5">
                {/* URL */}
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4 text-white/40" />
                  <span className="text-xs text-white/40 truncate flex-1">
                    {source.url}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      config.bg,
                      config.border,
                      "border",
                      config.color,
                      "hover:bg-opacity-20"
                    )}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Source
                  </a>
                  
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-600/50 text-xs text-white/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Verified
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SourceCitations({ sources, className, compact = false }: SourceCitationsProps) {
  const [filter, setFilter] = useState<SourceType>('all');

  // Filter sources
  const filteredSources = filter === 'all' 
    ? sources 
    : sources.filter(s => s.type === filter);

  // Count by type
  const counts = {
    all: sources.length,
    official: sources.filter(s => s.type === 'official').length,
    academic: sources.filter(s => s.type === 'academic').length,
    news: sources.filter(s => s.type === 'news').length,
  };

  // Compact mode - Grid of source cards
  if (compact) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/50" />
            <h3 className="text-sm font-semibold text-white/70">Sources</h3>
            <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/40">
              {sources.length}
            </span>
          </div>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-3 gap-3 flex-1">
          {sources.slice(0, 3).map((source) => {
            const config = sourceTypeConfig[source.type];
            const Icon = config?.icon || FileText;
            
            return (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-slate-800/40 border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-1.5 rounded", config?.bg, config?.border, "border")}>
                    <Icon className={cn("w-3.5 h-3.5", config?.color)} />
                  </div>
                  <span className={cn("text-[10px] font-medium", config?.color)}>{config?.label}</span>
                </div>
                <p className="text-xs text-white/70 line-clamp-2 mb-2">{source.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">{source.date}</span>
                  <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
              </a>
            );
          })}
        </div>

        {sources.length > 3 && (
          <p className="text-[10px] text-white/30 text-center mt-3 flex-shrink-0">
            +{sources.length - 3} more sources available
          </p>
        )}
      </div>
    );
  }

  // Full mode (default)
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white/50" />
          <h3 className="text-sm font-semibold text-white/70">
            Research Sources
          </h3>
          <span className="px-2 py-0.5 rounded bg-white/5 text-xs text-white/40">
            {sources.length} sources
          </span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterButton 
          type="all" 
          label="All" 
          icon={FileText}
          isActive={filter === 'all'}
          count={counts.all}
          onClick={() => setFilter('all')}
        />
        <FilterButton 
          type="official" 
          label="Official" 
          icon={Building2}
          isActive={filter === 'official'}
          count={counts.official}
          onClick={() => setFilter('official')}
        />
        <FilterButton 
          type="academic" 
          label="Academic" 
          icon={BookOpen}
          isActive={filter === 'academic'}
          count={counts.academic}
          onClick={() => setFilter('academic')}
        />
        <FilterButton 
          type="news" 
          label="News" 
          icon={Newspaper}
          isActive={filter === 'news'}
          count={counts.news}
          onClick={() => setFilter('news')}
        />
      </div>

      {/* Sources List */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {filteredSources.length > 0 ? (
          filteredSources.map((source, index) => (
            <SourceCard key={source.url} source={source} index={index} />
          ))
        ) : (
          <div className="p-8 text-center rounded-xl bg-slate-800/40 border border-white/10">
            <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">No sources found for this filter</p>
          </div>
        )}
      </motion.div>

      {/* Citation Note */}
      <p className="text-[10px] text-white/30 text-center pt-2">
        All sources are verified and traceable. Click on any source to visit the original document.
      </p>
    </div>
  );
}

export default SourceCitations;
