/**
 * QueueItem Component
 * Single queue item row with status indicator
 */

import { Clock, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import type { QueueItem as QueueItemType } from './types';
import { cn } from '../../lib/utils';

interface QueueItemProps {
  item: QueueItemType;
  isSelected: boolean;
  onSelect: (item: QueueItemType) => void;
  onRemove?: (id: string) => void;
  showRemove?: boolean;
}

// Topic ID to readable name
const TOPIC_NAMES: Record<string, string> = {
  comprehensive: 'Comprehensive',
  governance_policy: 'Governance Policy',
  governance_inspection: 'Inspection & Enforcement',
  governance_tripartite: 'Tripartite Dialogue',
  hazard_chemical: 'Chemical Hazards',
  hazard_physical: 'Physical Hazards',
  hazard_heat: 'Heat Stress',
  surveillance_disease: 'Disease Surveillance',
  surveillance_mental: 'Mental Health',
  surveillance_screening: 'Health Screening',
  restoration_compensation: 'Compensation',
  restoration_rtw: 'Return to Work',
  restoration_migrant: 'Migrant Protection',
};

export function QueueItem({ item, isSelected, onSelect, onRemove, showRemove = true }: QueueItemProps) {
  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      label: 'Pending',
    },
    processing: {
      icon: Loader2,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      label: 'Processing',
      animate: true,
    },
    completed: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      label: 'Completed',
    },
    failed: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      label: 'Failed',
    },
  };

  const config = statusConfig[item.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const topicName = TOPIC_NAMES[item.topic] || item.topic;

  return (
    <div
      onClick={() => onSelect(item)}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
        'hover:bg-slate-700/50',
        isSelected ? 'bg-slate-700/70 ring-1 ring-cyan-500/50' : 'bg-slate-800/50'
      )}
    >
      {/* Status Icon */}
      <div className={cn('p-1.5 rounded-md', config.bg)}>
        <StatusIcon
          className={cn(
            'w-4 h-4',
            config.color,
            config.animate && 'animate-spin'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {item.country_name}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {topicName}
        </p>
      </div>

      {/* Remove Button */}
      {showRemove && item.status === 'pending' && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-600 transition-opacity"
          title="Remove from queue"
        >
          <X className="w-4 h-4 text-slate-400 hover:text-red-400" />
        </button>
      )}
    </div>
  );
}
