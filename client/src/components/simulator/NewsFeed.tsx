/**
 * News Feed Component
 * 
 * Live news ticker showing AI-generated headlines
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Crown,
  Shield,
  Eye,
  Heart,
  Building,
  Globe,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { NewsItem, PillarId } from './types';

const PILLAR_ICONS: Record<string, typeof Crown> = {
  governance: Crown,
  hazardControl: Shield,
  healthVigilance: Eye,
  restoration: Heart,
};

const PILLAR_COLORS: Record<string, string> = {
  governance: 'text-purple-400',
  hazardControl: 'text-blue-400',
  healthVigilance: 'text-teal-400',
  restoration: 'text-amber-400',
};

const SOURCE_ICONS: Record<string, typeof Newspaper> = {
  official: Building,
  media: Newspaper,
  international: Globe,
};

interface NewsFeedProps {
  newsItems: NewsItem[];
  maxItems?: number;
  autoScroll?: boolean;
}

export function NewsFeed({
  newsItems,
  maxItems = 10,
  autoScroll = true,
}: NewsFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current && newsItems.length > 0) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [newsItems.length, autoScroll]);

  const displayedItems = newsItems.slice(0, maxItems);

  if (displayedItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-white/30 text-sm">
        <div className="text-center">
          <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>News will appear as the simulation progresses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-adl-accent" />
            <span className="text-sm font-medium text-white">Live News</span>
          </div>
          <span className="text-xs text-white/30">{displayedItems.length} stories</span>
        </div>
      </div>

      {/* News List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <AnimatePresence initial={false}>
          {displayedItems.map((item, index) => (
            <NewsItemCard
              key={item.id}
              item={item}
              index={index}
              isNew={index === 0}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NewsItemCard({
  item,
  index,
  isNew,
}: {
  item: NewsItem;
  index: number;
  isNew: boolean;
}) {
  const CategoryIcon = PILLAR_ICONS[item.category] || Newspaper;
  const SourceIcon = SOURCE_ICONS[item.source_type] || Newspaper;
  const categoryColor = PILLAR_COLORS[item.category] || 'text-white';

  const sentimentIcon = item.sentiment === 'positive'
    ? TrendingUp
    : item.sentiment === 'negative'
    ? TrendingDown
    : Minus;

  const sentimentColor = item.sentiment === 'positive'
    ? 'text-emerald-400'
    : item.sentiment === 'negative'
    ? 'text-red-400'
    : 'text-white/40';

  const SentimentIcon = sentimentIcon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'border-b border-white/5 last:border-b-0',
        isNew && 'bg-adl-accent/5'
      )}
    >
      <div className="p-3">
        {/* New Badge */}
        {isNew && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block text-[9px] px-1.5 py-0.5 bg-adl-accent/20 text-adl-accent rounded mb-1.5"
          >
            NEW
          </motion.span>
        )}

        {/* Headline */}
        <div className="flex items-start gap-2">
          <SentimentIcon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', sentimentColor)} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm text-white font-medium leading-tight">
              {item.headline}
            </h4>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-white/50 mt-1.5 line-clamp-2 pl-6">
          {item.summary}
        </p>

        {/* Meta Row */}
        <div className="flex items-center gap-2 mt-2 pl-6">
          {/* Category Tag */}
          <div className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
            item.category === 'governance' ? 'bg-purple-500/20 text-purple-300' :
            item.category === 'hazardControl' ? 'bg-blue-500/20 text-blue-300' :
            item.category === 'healthVigilance' ? 'bg-teal-500/20 text-teal-300' :
            item.category === 'restoration' ? 'bg-amber-500/20 text-amber-300' :
            'bg-white/10 text-white/50'
          )}>
            <CategoryIcon className="w-2.5 h-2.5" />
            <span className="capitalize">{item.category}</span>
          </div>

          {/* Source */}
          <div className="flex items-center gap-1 text-[10px] text-white/30">
            <SourceIcon className="w-2.5 h-2.5" />
            <span>{item.source}</span>
          </div>

          {/* Location */}
          {item.location && (
            <span className="text-[10px] text-white/20">
              • {item.location}
            </span>
          )}

          {/* Timestamp */}
          <span className="text-[10px] text-white/20 ml-auto">
            {item.timestamp}
          </span>
        </div>

        {/* Related Decision Tag */}
        {item.related_decision && (
          <div className="mt-2 pl-6">
            <span className="text-[9px] px-1.5 py-0.5 bg-adl-accent/10 text-adl-accent/70 rounded">
              Related to your decision
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default NewsFeed;
