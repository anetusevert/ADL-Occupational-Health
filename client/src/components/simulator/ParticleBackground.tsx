/**
 * Particle Background Component
 * 
 * Subtle animated particles for professional polish
 */

import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
  speed?: 'slow' | 'medium' | 'fast';
}

export function ParticleBackground({
  className,
  particleCount = 30,
  speed = 'slow',
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Particle class
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      fadeDirection: number;
    }
    
    // Speed multiplier
    const speedMultiplier = speed === 'fast' ? 2 : speed === 'medium' ? 1 : 0.5;
    
    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3 * speedMultiplier,
        speedY: (Math.random() - 0.5) * 0.3 * speedMultiplier,
        opacity: Math.random() * 0.5 + 0.1,
        fadeDirection: Math.random() > 0.5 ? 1 : -1,
      });
    }
    
    // Animation loop
    let animationId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      for (const particle of particles) {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;
        
        // Fade in/out
        particle.opacity += particle.fadeDirection * 0.005;
        if (particle.opacity >= 0.6) particle.fadeDirection = -1;
        if (particle.opacity <= 0.1) particle.fadeDirection = 1;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${particle.opacity})`;
        ctx.fill();
      }
      
      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [particleCount, speed]);
  
  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

/**
 * Floating Orbs - Larger ambient decorations
 */
export function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left orb */}
      <div 
        className="absolute -top-32 -left-32 w-64 h-64 bg-adl-accent/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      
      {/* Bottom right orb */}
      <div 
        className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: '10s', animationDelay: '2s' }}
      />
      
      {/* Center accent */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: '12s', animationDelay: '4s' }}
      />
    </div>
  );
}

/**
 * Glowing Border Effect
 */
export function GlowingBorder({
  children,
  color = 'cyan',
  className,
}: {
  children: React.ReactNode;
  color?: 'cyan' | 'purple' | 'emerald' | 'amber';
  className?: string;
}) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 via-transparent to-cyan-500/20',
    purple: 'from-purple-500/20 via-transparent to-purple-500/20',
    emerald: 'from-emerald-500/20 via-transparent to-emerald-500/20',
    amber: 'from-amber-500/20 via-transparent to-amber-500/20',
  };
  
  return (
    <div className={cn('relative', className)}>
      {/* Animated border glow */}
      <div 
        className={cn(
          'absolute -inset-[1px] rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          colorClasses[color]
        )}
        style={{
          animation: 'spin 6s linear infinite',
        }}
      />
      {children}
    </div>
  );
}

/**
 * Pulse Ring Animation
 */
export function PulseRing({
  size = 'md',
  color = 'cyan',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'purple' | 'emerald' | 'amber';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  const colorClasses = {
    cyan: 'border-cyan-500',
    purple: 'border-purple-500',
    emerald: 'border-emerald-500',
    amber: 'border-amber-500',
  };
  
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <div 
        className={cn(
          'absolute inset-0 rounded-full border-2 animate-ping opacity-30',
          colorClasses[color]
        )}
        style={{ animationDuration: '2s' }}
      />
      <div 
        className={cn(
          'absolute inset-0 rounded-full border-2 animate-ping opacity-20',
          colorClasses[color]
        )}
        style={{ animationDuration: '2s', animationDelay: '0.5s' }}
      />
      <div 
        className={cn(
          'absolute inset-2 rounded-full border animate-ping opacity-10',
          colorClasses[color]
        )}
        style={{ animationDuration: '2s', animationDelay: '1s' }}
      />
    </div>
  );
}

export default ParticleBackground;
