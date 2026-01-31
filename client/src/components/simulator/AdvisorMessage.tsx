/**
 * AdvisorMessage Component
 * 
 * Individual chat message bubble with Framework-style animations
 * Used in the AdvisorPanel for conversational gameplay
 */

import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';

export type MessageRole = 'advisor' | 'player';
export type MessageType = 'text' | 'thinking' | 'decision' | 'summary';

export interface AdvisorMessageData {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  timestamp?: Date;
  isTyping?: boolean;
}

interface AdvisorMessageProps {
  message: AdvisorMessageData;
  index: number;
  isLatest?: boolean;
}

export function AdvisorMessage({ message, index, isLatest = false }: AdvisorMessageProps) {
  const isAdvisor = message.role === 'advisor';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.05,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        'flex gap-3',
        isAdvisor ? 'justify-start' : 'justify-end'
      )}
    >
      {/* Advisor Avatar */}
      {isAdvisor && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 300 }}
          className="flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-adl-accent to-adl-blue-light flex items-center justify-center shadow-lg shadow-adl-accent/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      )}

      {/* Message Bubble */}
      <motion.div
        initial={{ opacity: 0, x: isAdvisor ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 + 0.15, duration: 0.3 }}
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isAdvisor
            ? 'bg-white/10 backdrop-blur-sm border border-white/10 rounded-tl-sm'
            : 'bg-adl-accent/20 border border-adl-accent/30 rounded-tr-sm',
          message.type === 'thinking' && 'bg-amber-500/10 border-amber-500/20',
          message.type === 'summary' && 'bg-emerald-500/10 border-emerald-500/20',
          message.type === 'decision' && 'bg-purple-500/10 border-purple-500/20'
        )}
      >
        {/* Typing Indicator */}
        {message.isTyping ? (
          <div className="flex items-center gap-1.5 py-1">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 rounded-full bg-white/60"
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 rounded-full bg-white/60"
            />
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 rounded-full bg-white/60"
            />
          </div>
        ) : (
          <>
            {/* Message Type Label */}
            {message.type !== 'text' && (
              <div className={cn(
                'text-[10px] font-medium uppercase tracking-wider mb-1',
                message.type === 'thinking' && 'text-amber-400',
                message.type === 'summary' && 'text-emerald-400',
                message.type === 'decision' && 'text-purple-400'
              )}>
                {message.type === 'thinking' && 'Analyzing...'}
                {message.type === 'summary' && 'Summary'}
                {message.type === 'decision' && 'Decision Point'}
              </div>
            )}

            {/* Message Content */}
            <p className={cn(
              'text-sm leading-relaxed',
              isAdvisor ? 'text-white/90' : 'text-white'
            )}>
              {message.content}
            </p>

            {/* Timestamp */}
            {message.timestamp && (
              <p className="text-[10px] text-white/30 mt-1.5">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </>
        )}
      </motion.div>

      {/* Player Avatar */}
      {!isAdvisor && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 300 }}
          className="flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <User className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Typing indicator component for when advisor is "thinking"
 */
export function AdvisorTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 justify-start"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-adl-accent to-adl-blue-light flex items-center justify-center shadow-lg shadow-adl-accent/20">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 rounded-full bg-adl-accent"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            className="w-2 h-2 rounded-full bg-adl-accent"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            className="w-2 h-2 rounded-full bg-adl-accent"
          />
        </div>
      </div>
    </motion.div>
  );
}

export default AdvisorMessage;
