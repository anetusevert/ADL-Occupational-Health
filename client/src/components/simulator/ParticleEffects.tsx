/**
 * Particle Effects Component
 * 
 * Ambient particle animations for visual polish
 */

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

interface ParticleEffectsProps {
  count?: number;
  colors?: string[];
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function ParticleEffects({
  count = 20,
  colors = ['#06b6d4', '#a855f7', '#3b82f6', '#14b8a6', '#f59e0b'],
  className,
  intensity = 'medium',
}: ParticleEffectsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const particleCount = intensity === 'low' ? Math.floor(count / 2) : intensity === 'high' ? count * 2 : count;
  
  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, [particleCount, colors.length]);
  
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Score change celebration effect
 */
export function ScoreCelebration({
  show,
  positive,
  onComplete,
}: {
  show: boolean;
  positive: boolean;
  onComplete?: () => void;
}) {
  if (!show) return null;
  
  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      angle: (i / 30) * 360,
      distance: Math.random() * 100 + 50,
      size: Math.random() * 6 + 2,
      delay: Math.random() * 0.2,
    })),
    []
  );
  
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
    >
      {particles.map((p) => {
        const radian = (p.angle * Math.PI) / 180;
        const endX = Math.cos(radian) * p.distance;
        const endY = Math.sin(radian) * p.distance;
        
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: positive ? '#10b981' : '#ef4444',
              boxShadow: `0 0 ${p.size * 2}px ${positive ? '#10b981' : '#ef4444'}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: endX,
              y: endY,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 1,
              delay: p.delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </motion.div>
  );
}

/**
 * Pulsing glow effect for important elements
 */
export function PulsingGlow({
  color = '#06b6d4',
  size = 100,
  className,
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('absolute rounded-full opacity-20 blur-xl pointer-events-none', className)}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.1, 0.3, 0.1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/**
 * Achievement unlock animation
 */
export function AchievementUnlock({
  show,
  achievementName,
  onComplete,
}: {
  show: boolean;
  achievementName: string;
  onComplete?: () => void;
}) {
  if (!show) return null;
  
  return (
    <motion.div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      initial={{ y: -100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 15 }}
      onAnimationComplete={onComplete}
    >
      <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded-xl px-6 py-4 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 bg-amber-500/30 rounded-xl flex items-center justify-center"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className="text-2xl">🏆</span>
          </motion.div>
          <div>
            <p className="text-xs text-amber-400 uppercase tracking-wider">Achievement Unlocked</p>
            <p className="text-lg font-bold text-white">{achievementName}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Loading shimmer effect
 */
export function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export default ParticleEffects;
