/**
 * AdvisorPanel Component
 * 
 * AI-powered conversational advisor interface for the Sovereign Health game
 * Features interactive chat with decision suggestions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, Send, Bot, User, ChevronRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AdvisorChoices } from './AdvisorChoices';
import type { DecisionCard, CountryBriefing } from './types';

// Message types for the conversation
interface ChatMessage {
  id: string;
  role: 'advisor' | 'user' | 'system';
  content: string;
  timestamp: Date;
  type?: 'greeting' | 'analysis' | 'recommendation' | 'confirmation' | 'error';
}

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

type ConversationPhase = 'greeting' | 'decisions' | 'selected' | 'confirming';

// Quick action suggestions for the user
const QUICK_ACTIONS = [
  { label: 'What should I prioritize?', icon: '🎯' },
  { label: 'Explain the risks', icon: '⚠️' },
  { label: 'Show impact analysis', icon: '📊' },
];

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ConversationPhase>('greeting');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDecisionIds, setSelectedDecisionIds] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[currentMonth - 1] || 'January';

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Add advisor message with typing simulation
  const addAdvisorMessage = useCallback((content: string, type?: ChatMessage['type'], delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'advisor',
        content,
        timestamp: new Date(),
        type,
      }]);
    }, delay);
  }, []);

  // Add user message immediately
  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }]);
  }, []);

  // Initial greeting and context
  useEffect(() => {
    if (hasInitialized || isLoading || !briefing) return;
    setHasInitialized(true);

    // Initial greeting
    addAdvisorMessage(
      `Good day, Minister. Welcome to ${monthName} ${currentYear}.`,
      'greeting',
      400
    );

    // Context message
    setTimeout(() => {
      const ohiScore = briefing?.ohi_score?.toFixed(2) || '2.50';
      addAdvisorMessage(
        `${countryName}'s current OHI score is ${ohiScore}. You have ${budgetRemaining} budget points available for strategic initiatives this year.`,
        'analysis',
        800
      );

      // Decision prompt
      setTimeout(() => {
        setPhase('decisions');
        addAdvisorMessage(
          'I have prepared three priority actions for your consideration. Select the initiatives you wish to pursue, then confirm to proceed.',
          'recommendation',
          600
        );
      }, 1200);
    }, 800);
  }, [hasInitialized, isLoading, briefing, monthName, currentYear, countryName, budgetRemaining, addAdvisorMessage]);

  // Handle decision selection
  const handleSelectDecision = (decisionId: string) => {
    setSelectedDecisionIds(prev => {
      const newIds = prev.includes(decisionId)
        ? prev.filter(id => id !== decisionId)
        : [...prev, decisionId];
      onSelectDecisions(newIds);
      
      // Update phase based on selection
      if (newIds.length > 0) {
        setPhase('selected');
      } else {
        setPhase('decisions');
      }
      
      return newIds;
    });
  };

  // Handle user submitting a question
  const handleSubmitQuestion = () => {
    if (!userInput.trim()) return;
    
    const question = userInput.trim();
    setUserInput('');
    addUserMessage(question);

    // Simulate AI response based on question
    setTimeout(() => {
      let response = '';
      const lowerQuestion = question.toLowerCase();
      
      if (lowerQuestion.includes('priorit') || lowerQuestion.includes('focus')) {
        const weakestPillar = decisions.length > 0 
          ? decisions.reduce((min, d) => d.expected_impacts[d.pillar] > (min?.expected_impacts[min.pillar] || 0) ? d : min, decisions[0])
          : null;
        response = weakestPillar 
          ? `Based on my analysis, I recommend prioritizing "${weakestPillar.title}". This addresses a critical gap in ${weakestPillar.pillar.replace('C', ' C').replace('V', ' V')} and offers the best return on investment.`
          : 'I recommend focusing on governance improvements first, as they create the foundation for all other initiatives.';
      } else if (lowerQuestion.includes('risk')) {
        const highRiskDecisions = decisions.filter(d => d.risk_level === 'high');
        response = highRiskDecisions.length > 0
          ? `The following initiatives carry higher risk: ${highRiskDecisions.map(d => d.title).join(', ')}. High-risk decisions can yield greater rewards but may face implementation challenges.`
          : 'All current options are moderate to low risk. This is a good opportunity for steady progress without major disruption.';
      } else if (lowerQuestion.includes('impact') || lowerQuestion.includes('effect')) {
        const totalImpact = decisions.reduce((sum, d) => {
          return sum + Object.values(d.expected_impacts).reduce((a, b) => a + b, 0);
        }, 0);
        response = `The combined potential impact of all initiatives is ${totalImpact} points across all pillars. Selecting complementary actions can create synergies that amplify results.`;
      } else if (lowerQuestion.includes('budget') || lowerQuestion.includes('cost')) {
        const totalCost = decisions.reduce((sum, d) => sum + d.cost, 0);
        response = `Total cost of all available initiatives: ${totalCost} points. Your budget of ${budgetRemaining} points allows for strategic selection. Consider balancing quick wins with long-term investments.`;
      } else {
        response = `That's an excellent question, Minister. Given ${countryName}'s current situation, I recommend reviewing the available initiatives carefully. Each option has been selected based on its potential to improve your OHI score.`;
      }
      
      addAdvisorMessage(response, 'analysis', 1000);
    }, 500);
  };

  // Handle quick action click
  const handleQuickAction = (action: string) => {
    setUserInput(action);
    setTimeout(() => handleSubmitQuestion(), 100);
  };

  // Handle confirmation
  const handleConfirm = () => {
    if (selectedDecisionIds.length === 0) return;
    setPhase('confirming');

    const selectedDecisions = decisions.filter(d => selectedDecisionIds.includes(d.id));
    const titles = selectedDecisions.map(d => d.title);
    const totalCost = selectedDecisions.reduce((sum, d) => sum + d.cost, 0);

    // User confirmation message
    addUserMessage(`Proceed with: ${titles.join(', ')}`);

    // Advisor acknowledgment
    setTimeout(() => {
      addAdvisorMessage(
        `Confirmed. Implementing ${selectedDecisionIds.length} initiative${selectedDecisionIds.length > 1 ? 's' : ''} at a total cost of ${totalCost} budget points. I'll report on the outcomes as they develop.`,
        'confirmation',
        800
      );

      // Trigger game logic
      setTimeout(() => {
        onConfirmDecisions();
      }, 1200);
    }, 500);
  };

  // Reset for new round when decisions change
  useEffect(() => {
    if (decisions.length > 0 && phase === 'confirming') {
      // New round - reset state
      setPhase('greeting');
      setHasInitialized(false);
      setSelectedDecisionIds([]);
      setMessages([]);
    }
  }, [decisions]);

  // Convert decisions to choices format
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

  // Calculate selected cost
  const selectedCost = decisions
    .filter(d => selectedDecisionIds.includes(d.id))
    .reduce((sum, d) => sum + d.cost, 0);

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
            <Bot className="w-5 h-5 text-white" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Strategic Advisor
              <Sparkles className="w-3 h-3 text-adl-accent" />
            </h2>
            <p className="text-[10px] text-white/40">
              {monthName} {currentYear} • {countryName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-adl-accent">{budgetRemaining}</p>
            <p className="text-[10px] text-white/40">Budget</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <motion.div className="flex items-center gap-3 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin text-adl-accent" />
              <span className="text-sm">Analyzing situation...</span>
            </motion.div>
          </div>
        )}

        {/* Chat Messages */}
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex gap-2',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'advisor' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-adl-accent/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-adl-accent" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] px-3 py-2 rounded-xl text-sm',
                  message.role === 'user'
                    ? 'bg-adl-accent text-white'
                    : 'bg-white/10 text-white/90 border border-white/5'
                )}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-white/60" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 items-center"
            >
              <div className="w-7 h-7 rounded-full bg-adl-accent/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-adl-accent" />
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/5">
                <motion.div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-adl-accent rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decision Cards */}
        <AnimatePresence>
          {(phase === 'decisions' || phase === 'selected') && !isTyping && advisorChoices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="mt-3"
            >
              <AdvisorChoices
                choices={advisorChoices}
                budgetRemaining={budgetRemaining}
                onSelect={handleSelectDecision}
                onConfirm={handleConfirm}
                multiSelect={true}
                disabled={disabled || phase === 'confirming'}
                confirmLabel={
                  selectedDecisionIds.length > 0
                    ? `Confirm ${selectedDecisionIds.length} Decision${selectedDecisionIds.length > 1 ? 's' : ''} (${selectedCost} pts)`
                    : 'Select Decisions'
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions (when in decision phase and not typing) */}
        {(phase === 'decisions' || phase === 'selected') && !isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-2 mt-4"
          >
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/70 hover:text-white transition-colors"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-3 border-t border-white/5 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitQuestion()}
            placeholder="Ask your advisor..."
            disabled={disabled || isLoading || phase === 'confirming'}
            className={cn(
              'flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30',
              'focus:outline-none focus:border-adl-accent/50 focus:ring-1 focus:ring-adl-accent/30',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmitQuestion}
            disabled={!userInput.trim() || disabled || isLoading}
            className={cn(
              'p-2 rounded-lg transition-colors',
              userInput.trim()
                ? 'bg-adl-accent text-white hover:bg-adl-blue-light'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Selection Status */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-white/40">
          <span className="flex items-center gap-1.5">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isTyping ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            )} />
            {isTyping ? 'Thinking...' : 'Ready'}
          </span>
          {selectedDecisionIds.length > 0 && (
            <span className="flex items-center gap-1 text-adl-accent">
              <CheckCircle2 className="w-3 h-3" />
              {selectedDecisionIds.length} selected • {selectedCost}/{budgetRemaining} pts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdvisorPanel;
