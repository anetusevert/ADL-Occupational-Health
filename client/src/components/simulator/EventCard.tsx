/**
 * Event Card Component
 * 
 * AI-generated event display with choice system and impact preview
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Lightbulb,
  Globe2,
  TrendingDown,
  Sparkles,
  Clock,
  ChevronRight,
  Crown,
  Shield,
  Eye,
  Heart,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GameEvent, EventChoice, PillarId, PillarDelta } from './types';

// Event type icons
const EVENT_ICONS = {
  crisis: AlertTriangle,
  opportunity: Lightbulb,
  diplomatic: Globe2,
  economic: TrendingDown,
  discovery: Sparkles,
  natural: AlertTriangle,
};

// Severity colors
const SEVERITY_COLORS = {
  minor: 'border-blue-500/50 bg-blue-500/10',
  moderate: 'border-amber-500/50 bg-amber-500/10',
  major: 'border-orange-500/50 bg-orange-500/10',
  critical: 'border-red-500/50 bg-red-500/10',
};

const SEVERITY_BADGE_COLORS = {
  minor: 'bg-blue-500/20 text-blue-400',
  moderate: 'bg-amber-500/20 text-amber-400',
  major: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

// Pillar icons
const PILLAR_ICONS: Record<PillarId, typeof Crown> = {
  governance: Crown,
  hazardControl: Shield,
  healthVigilance: Eye,
  restoration: Heart,
};

const PILLAR_COLORS: Record<PillarId, string> = {
  governance: 'text-purple-400',
  hazardControl: 'text-blue-400',
  healthVigilance: 'text-teal-400',
  restoration: 'text-amber-400',
};

interface EventCardProps {
  event: GameEvent;
  onResolve: (choiceId: string) => void;
  onDismiss: () => void;
}

export function EventCard({ event, onResolve, onDismiss }: EventCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(event.deadline);
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);
  
  const EventIcon = EVENT_ICONS[event.type];
  
  // Countdown timer
  useEffect(() => {
    if (event.deadline <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-dismiss or select first choice on timeout
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [event.deadline, onDismiss]);
  
  const handleConfirm = () => {
    if (selectedChoice) {
      onResolve(selectedChoice);
    }
  };
  
  const currentChoice = event.choices.find(c => c.id === (hoveredChoice || selectedChoice));
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'relative w-full max-w-2xl rounded-2xl border-2 overflow-hidden',
          SEVERITY_COLORS[event.severity]
        )}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
        
        {/* Header */}
        <div className="relative p-6 pb-4">
          {/* Background glow */}
          <div className={cn(
            'absolute inset-0 opacity-30',
            event.type === 'crisis' ? 'bg-gradient-to-br from-red-600/20 to-transparent' :
            event.type === 'opportunity' ? 'bg-gradient-to-br from-emerald-600/20 to-transparent' :
            'bg-gradient-to-br from-blue-600/20 to-transparent'
          )} />
          
          <div className="relative flex items-start gap-4">
            {/* Event Icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: event.type === 'crisis' ? [0, -5, 5, 0] : 0
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center',
                event.type === 'crisis' ? 'bg-red-500/20' :
                event.type === 'opportunity' ? 'bg-emerald-500/20' :
                event.type === 'diplomatic' ? 'bg-blue-500/20' :
                event.type === 'economic' ? 'bg-amber-500/20' :
                'bg-purple-500/20'
              )}
            >
              <EventIcon className={cn(
                'w-7 h-7',
                event.type === 'crisis' ? 'text-red-400' :
                event.type === 'opportunity' ? 'text-emerald-400' :
                event.type === 'diplomatic' ? 'text-blue-400' :
                event.type === 'economic' ? 'text-amber-400' :
                'text-purple-400'
              )} />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              {/* Severity Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
                  SEVERITY_BADGE_COLORS[event.severity]
                )}>
                  {event.severity}
                </span>
                <span className="text-xs text-white/40 capitalize">{event.type}</span>
                
                {/* Timer */}
                {event.deadline > 0 && (
                  <div className="flex items-center gap-1 ml-auto text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-mono">{timeRemaining}s</span>
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-1">{event.title}</h2>
              <p className="text-sm text-white/60">{event.description}</p>
            </div>
          </div>
        </div>
        
        {/* Narrative */}
        {event.narrative && (
          <div className="px-6 py-3 bg-white/5 border-t border-white/10">
            <p className="text-sm text-white/70 italic leading-relaxed">
              "{event.narrative}"
            </p>
          </div>
        )}
        
        {/* Choices */}
        <div className="p-6 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Choose your response</p>
          
          {event.choices.map((choice) => (
            <ChoiceButton
              key={choice.id}
              choice={choice}
              isSelected={selectedChoice === choice.id}
              isHovered={hoveredChoice === choice.id}
              onSelect={() => setSelectedChoice(choice.id)}
              onHover={() => setHoveredChoice(choice.id)}
              onLeave={() => setHoveredChoice(null)}
            />
          ))}
        </div>
        
        {/* Impact Preview */}
        <AnimatePresence>
          {currentChoice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 py-4 bg-white/5 border-t border-white/10">
                <p className="text-xs text-white/40 mb-2">Projected Impact</p>
                <div className="flex items-center gap-4">
                  {Object.entries(currentChoice.impacts).map(([pillar, delta]) => {
                    if (delta === 0) return null;
                    const Icon = PILLAR_ICONS[pillar as PillarId];
                    const color = PILLAR_COLORS[pillar as PillarId];
                    
                    return (
                      <div key={pillar} className="flex items-center gap-1.5">
                        <Icon className={cn('w-4 h-4', color)} />
                        <span className={cn(
                          'text-sm font-medium',
                          delta > 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      </div>
                    );
                  })}
                  
                  {currentChoice.cost > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-xs text-white/40">Cost:</span>
                      <span className="text-sm font-medium text-red-400">
                        -{currentChoice.cost} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Confirm Button */}
        <div className="p-6 pt-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={!selectedChoice}
            className={cn(
              'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
              selectedChoice
                ? 'bg-adl-accent text-white hover:bg-adl-blue-light'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            )}
          >
            Confirm Decision
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ChoiceButtonProps {
  choice: EventChoice;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}

function ChoiceButton({
  choice,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: ChoiceButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all',
        isSelected
          ? 'border-adl-accent bg-adl-accent/10'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
          isSelected ? 'border-adl-accent bg-adl-accent' : 'border-white/30'
        )}>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-white"
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white mb-1">{choice.label}</p>
          <p className="text-xs text-white/50">{choice.description}</p>
        </div>
      </div>
    </motion.button>
  );
}

export default EventCard;
