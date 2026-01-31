/**
 * News Feed Component
 * 
 * Live news ticker showing AI-generated headlines
 * Enhanced central display mode for prominent news presentation
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
  Radio,
  Zap,
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
  variant?: 'default' | 'central' | 'compact';
}

export function NewsFeed({
  newsItems,
  maxItems = 10,
  autoScroll = true,
  variant = 'default',
}: NewsFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isCentral = variant === 'central';
  const isCompact = variant === 'compact';

  // Auto-scroll to top when new items arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current && newsItems.length > 0) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [newsItems.length, autoScroll]);

  const displayedItems = newsItems.slice(0, maxItems);

  if (displayedItems.length === 0) {
    return (
      <div className={cn(
        'h-full flex items-center justify-center text-white/30',
        isCentral ? 'text-base' : 'text-sm'
      )}>
        <div className="text-center">
          <motion.div
            animate={isCentral ? { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Newspaper className={cn(
              'mx-auto mb-3 opacity-50',
              isCentral ? 'w-16 h-16' : 'w-8 h-8'
            )} />
          </motion.div>
          <p className={isCentral ? 'text-lg' : ''}>News will appear as the simulation progresses</p>
          {isCentral && (
            <p className="text-sm text-white/20 mt-2">Make decisions to generate news coverage</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={cn(
        'flex-shrink-0 border-b border-white/5',
        isCentral ? 'px-5 py-3 bg-gradient-to-r from-red-900/20 via-transparent to-red-900/20' : 'px-4 py-2'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCentral ? (
              <>
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-red-500"
                />
                <Radio className="w-4 h-4 text-red-400" />
                <span className="text-base font-bold text-white tracking-wide">BREAKING NEWS</span>
              </>
            ) : (
              <>
                <Newspaper className="w-4 h-4 text-adl-accent" />
                <span className="text-sm font-medium text-white">Live News</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCentral && (
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full font-medium">
                LIVE
              </span>
            )}
            <span className={cn(
              'text-white/30',
              isCentral ? 'text-sm' : 'text-xs'
            )}>
              {displayedItems.length} stories
            </span>
          </div>
        </div>
        {isCentral && (
          <motion.div 
            className="h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent mt-2"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>

      {/* News List */}
      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-y-auto',
          isCentral && 'bg-gradient-to-b from-slate-900/50 to-transparent'
        )}
      >
        <AnimatePresence initial={false}>
          {displayedItems.map((item, index) => (
            <NewsItemCard
              key={item.id}
              item={item}
              index={index}
              isNew={index === 0}
              variant={variant}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Ticker Footer for Central Mode */}
      {isCentral && displayedItems.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-white/5 bg-slate-900/80">
          <div className="flex items-center gap-2 text-xs text-white/40 overflow-hidden">
            <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <motion.div
              className="whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {displayedItems.map((item, i) => (
                <span key={item.id}>
                  {item.headline}
                  {i < displayedItems.length - 1 && ' • '}
                </span>
              ))}
              {' • '}
              {displayedItems.map((item, i) => (
                <span key={`dup-${item.id}`}>
                  {item.headline}
                  {i < displayedItems.length - 1 && ' • '}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsItemCard({
  item,
  index,
  isNew,
  variant = 'default',
}: {
  item: NewsItem;
  index: number;
  isNew: boolean;
  variant?: 'default' | 'central' | 'compact';
}) {
  const isCentral = variant === 'central';
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
      initial={{ opacity: 0, x: isCentral ? 0 : -20, y: isCentral ? -10 : 0, height: 0 }}
      animate={{ opacity: 1, x: 0, y: 0, height: 'auto' }}
      exit={{ opacity: 0, x: isCentral ? 0 : 20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'border-b border-white/5 last:border-b-0',
        isNew && (isCentral ? 'bg-gradient-to-r from-red-900/20 via-red-900/10 to-transparent' : 'bg-adl-accent/5')
      )}
    >
      <div className={cn('p-3', isCentral && 'p-4')}>
        {/* New Badge */}
        {isNew && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'inline-block px-1.5 py-0.5 rounded mb-1.5',
              isCentral 
                ? 'text-[10px] bg-red-500/30 text-red-300 font-bold tracking-wider'
                : 'text-[9px] bg-adl-accent/20 text-adl-accent'
            )}
          >
            {isCentral ? 'BREAKING' : 'NEW'}
          </motion.span>
        )}

        {/* Headline */}
        <div className="flex items-start gap-2">
          <SentimentIcon className={cn(
            'flex-shrink-0 mt-0.5',
            isCentral ? 'w-5 h-5' : 'w-4 h-4',
            sentimentColor
          )} />
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              'text-white font-medium leading-tight',
              isCentral ? 'text-base' : 'text-sm'
            )}>
              {item.headline}
            </h4>
          </div>
        </div>

        {/* Summary */}
        <p className={cn(
          'text-white/50 mt-1.5 pl-6',
          isCentral ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'
        )}>
          {item.summary}
        </p>

        {/* Meta Row */}
        <div className={cn(
          'flex items-center gap-2 mt-2 pl-6',
          isCentral && 'mt-3'
        )}>
          {/* Category Tag */}
          <div className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded',
            isCentral ? 'text-xs' : 'text-[10px]',
            item.category === 'governance' ? 'bg-purple-500/20 text-purple-300' :
            item.category === 'hazardControl' ? 'bg-blue-500/20 text-blue-300' :
            item.category === 'healthVigilance' ? 'bg-teal-500/20 text-teal-300' :
            item.category === 'restoration' ? 'bg-amber-500/20 text-amber-300' :
            'bg-white/10 text-white/50'
          )}>
            <CategoryIcon className={isCentral ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
            <span className="capitalize">{item.category}</span>
          </div>

          {/* Source */}
          <div className={cn(
            'flex items-center gap-1 text-white/30',
            isCentral ? 'text-xs' : 'text-[10px]'
          )}>
            <SourceIcon className={isCentral ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
            <span>{item.source}</span>
          </div>

          {/* Location */}
          {item.location && (
            <span className={cn(
              'text-white/20',
              isCentral ? 'text-xs' : 'text-[10px]'
            )}>
              • {item.location}
            </span>
          )}

          {/* Timestamp */}
          <span className={cn(
            'text-white/20 ml-auto',
            isCentral ? 'text-xs' : 'text-[10px]'
          )}>
            {item.timestamp}
          </span>
        </div>

        {/* Related Decision Tag */}
        {item.related_decision && (
          <div className={cn('mt-2 pl-6', isCentral && 'mt-3')}>
            <span className={cn(
              'px-1.5 py-0.5 bg-adl-accent/10 text-adl-accent/70 rounded',
              isCentral ? 'text-[10px]' : 'text-[9px]'
            )}>
              Related to your decision
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default NewsFeed;
