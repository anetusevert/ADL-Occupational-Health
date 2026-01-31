/**
 * QueuePanel Component
 * Left panel - displays and manages the report generation queue
 */

import { useState } from 'react';
import { Plus, Trash2, ListOrdered, RefreshCw } from 'lucide-react';
import type { QueueItem as QueueItemType, QueueStatusResponse } from './types';
import { QueueItem } from './QueueItem';
import { cn } from '../../lib/utils';

interface QueuePanelProps {
  queueData: QueueStatusResponse | undefined;
  isLoading: boolean;
  selectedItem: QueueItemType | null;
  onSelectItem: (item: QueueItemType) => void;
  onRemoveItem: (id: string) => void;
  onAddCountry: () => void;
  onClearQueue: () => void;
  onRefresh: () => void;
}

export function QueuePanel({
  queueData,
  isLoading,
  selectedItem,
  onSelectItem,
  onRemoveItem,
  onAddCountry,
  onClearQueue,
  onRefresh,
}: QueuePanelProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const items = queueData?.queue_items || [];
  
  // Filter items based on selection
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.status === 'pending' || item.status === 'processing';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  // Count by status
  const counts = {
    pending: items.filter((i) => i.status === 'pending').length,
    processing: items.filter((i) => i.status === 'processing').length,
    completed: items.filter((i) => i.status === 'completed').length,
  };

  const hasPendingItems = counts.pending > 0;

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Queue</h2>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className={cn('w-4 h-4 text-slate-400', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400">
            {counts.processing} processing
          </span>
          <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">
            {counts.pending} pending
          </span>
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
            {counts.completed} done
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-2 border-b border-slate-700/50">
        {(['all', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              filter === f
                ? 'bg-slate-700 text-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <ListOrdered className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No items in queue</p>
            <p className="text-xs mt-1">Add countries to get started</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={onSelectItem}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-slate-700/50 space-y-2">
        <button
          onClick={onAddCountry}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Country
        </button>
        {hasPendingItems && (
          <button
            onClick={onClearQueue}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear Pending
          </button>
        )}
      </div>
    </div>
  );
}
