/**
 * EventCard Placeholder
 * TODO: Implement full component
 */

import type { GameEvent } from './types';

interface EventCardProps {
  event?: GameEvent;
  onChoice?: (choiceId: string) => void;
}

export function EventCard({ event, onChoice }: EventCardProps) {
  return (
    <div className="p-4 text-slate-400 text-center">
      EventCard - Coming Soon
    </div>
  );
}
