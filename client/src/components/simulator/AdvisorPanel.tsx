/**
 * AdvisorPanel Component
 * 
 * Conversational advisor interface for the Sovereign Health game
 * Replaces the card-based DecisionRound with an immersive chat experience
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AdvisorMessage, AdvisorTypingIndicator, type AdvisorMessageData } from './AdvisorMessage';
import { AdvisorChoices, SimpleChoices } from './AdvisorChoices';
import type { DecisionCard, PillarId, CountryBriefing } from './types';

interface AdvisorPanelProps {
  countryName: string;
  currentMonth: number;
  currentYear: number;
  decisions: DecisionCard[];
  budgetRemaining: number;
  briefing: CountryBriefing | null;
  isLoading?: boolean;
  onSelectDecisions: (selectedIds: string[]) => void;
  onConfirmDecisions: () => void;
  disabled?: boolean;
}

type ConversationPhase = 'greeting' | 'context' | 'decisions' | 'confirmation' | 'summary';

export function AdvisorPanel({
  countryName,
  currentMonth,
  currentYear,
  decisions,
  budgetRemaining,
  briefing,
  isLoading = false,
  onSelectDecisions,
  onConfirmDecisions,
  disabled = false,
}: AdvisorPanelProps) {
  const [messages, setMessages] = useState<AdvisorMessageData[]>([]);
  const [phase, setPhase] = useState<ConversationPhase>('greeting');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDecisionIds, setSelectedDecisionIds] = useState<string[]>([]);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[currentMonth - 1] || 'January';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Add a message with typing simulation
  const addMessage = useCallback((message: Omit<AdvisorMessageData, 'id' | 'timestamp'>, typeDelay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      }]);
    }, typeDelay);
  }, []);

  // Initial greeting sequence
  useEffect(() => {
    if (hasGreeted || isLoading) return;
    setHasGreeted(true);

    // Greeting message
    addMessage({
      role: 'advisor',
      type: 'text',
      content: `Good morning, Minister. Welcome to ${monthName} ${currentYear}.`,
    }, 500);

    // Context message after delay
    setTimeout(() => {
      addMessage({
        role: 'advisor',
        type: 'text',
        content: `I've prepared this month's strategic options for ${countryName}. We have ${budgetRemaining} budget points available for new initiatives.`,
      }, 800);

      setTimeout(() => {
        setPhase('decisions');
        addMessage({
          role: 'advisor',
          type: 'decision',
          content: 'Here are the priority actions I recommend for your consideration. You may select multiple initiatives within your budget.',
        }, 600);
      }, 1500);
    }, 1200);
  }, [hasGreeted, isLoading, monthName, currentYear, countryName, budgetRemaining, addMessage]);

  // Handle decision selection
  const handleSelectDecision = (decisionId: string) => {
    setSelectedDecisionIds(prev => {
      const newIds = prev.includes(decisionId)
        ? prev.filter(id => id !== decisionId)
        : [...prev, decisionId];
      onSelectDecisions(newIds);
      return newIds;
    });
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (selectedDecisionIds.length === 0) return;

    // Add player confirmation message
    const selectedDecisions = decisions.filter(d => selectedDecisionIds.includes(d.id));
    const decisionTitles = selectedDecisions.map(d => d.title).join(', ');
    
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'player',
      type: 'text',
      content: `I've decided to proceed with: ${decisionTitles}`,
      timestamp: new Date(),
    }]);

    setPhase('confirmation');

    // Advisor acknowledgment
    setTimeout(() => {
      addMessage({
        role: 'advisor',
        type: 'summary',
        content: `Excellent choices, Minister. I'll begin implementing these ${selectedDecisionIds.length} initiative${selectedDecisionIds.length > 1 ? 's' : ''} immediately. The effects should become visible in the coming weeks.`,
      }, 1000);

      // Trigger the actual game logic
      setTimeout(() => {
        onConfirmDecisions();
        setPhase('summary');
      }, 1500);
    }, 500);
  };

  // Convert decisions to advisor choices format
  const advisorChoices = decisions.map(d => ({
    id: d.id,
    label: d.title,
    description: d.description,
    pillar: d.pillar,
    cost: d.cost,
    riskLevel: d.risk_level,
    timeToEffect: d.time_to_effect,
    impacts: d.expected_impacts,
  }));

  // Reset for new round
  useEffect(() => {
    if (decisions.length > 0 && phase === 'summary') {
      // New round starting
      setPhase('greeting');
      setHasGreeted(false);
      setSelectedDecisionIds([]);
      setMessages([]);
    }
  }, [decisions, phase]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900/50 to-slate-800/30">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 10px rgba(6,182,212,0.3)',
                '0 0 20px rgba(6,182,212,0.5)',
                '0 0 10px rgba(6,182,212,0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-adl-accent to-adl-blue-light flex items-center justify-center"
          >
            <MessageSquare className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Strategic Advisor
              <Sparkles className="w-3 h-3 text-adl-accent" />
            </h2>
            <p className="text-[10px] text-white/40">
              {monthName} {currentYear} • {countryName}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-adl-accent border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((message, index) => (
            <AdvisorMessage
              key={message.id}
              message={message}
              index={index}
              isLatest={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && <AdvisorTypingIndicator />}
        </AnimatePresence>

        {/* Decision Choices */}
        <AnimatePresence>
          {phase === 'decisions' && !isTyping && advisorChoices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <AdvisorChoices
                choices={advisorChoices}
                budgetRemaining={budgetRemaining}
                onSelect={handleSelectDecision}
                onConfirm={handleConfirm}
                multiSelect={true}
                disabled={disabled}
                confirmLabel="Confirm & Proceed"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!isLoading && messages.length === 0 && !isTyping && (
          <div className="flex items-center justify-center h-full text-white/30">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for advisor...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-white/5 bg-slate-900/50">
        <div className="flex items-center justify-between text-[10px] text-white/30">
          <span className="flex items-center gap-1.5">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isTyping ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            )} />
            {isTyping ? 'Advisor is typing...' : 'Advisor ready'}
          </span>
          <span>
            {selectedDecisionIds.length > 0 && `${selectedDecisionIds.length} selected`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdvisorPanel;
