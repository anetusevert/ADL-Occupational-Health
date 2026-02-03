/**
 * Arthur D. Little - Global Health Platform
 * PersonaAvatar Component
 * 
 * Displays AI-generated persona avatars with animated effects.
 * Falls back to icon-based avatars when images are not available.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { type Persona } from "../../data/personas";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface PersonaAvatarProps {
  persona: Persona;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  className?: string;
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const sizeConfig = {
  sm: {
    container: "w-12 h-12",
    icon: "w-6 h-6",
    ring: "ring-2",
    iconBg: "p-2",
  },
  md: {
    container: "w-16 h-16",
    icon: "w-8 h-8",
    ring: "ring-2",
    iconBg: "p-3",
  },
  lg: {
    container: "w-20 h-20",
    icon: "w-10 h-10",
    ring: "ring-3",
    iconBg: "p-4",
  },
  xl: {
    container: "w-32 h-32",
    icon: "w-14 h-14",
    ring: "ring-4",
    iconBg: "p-6",
  },
};

// ============================================================================
// COLOR CONFIG
// ============================================================================

const colorConfig: Record<string, { 
  gradient: string; 
  ring: string; 
  glow: string;
  iconBg: string;
  iconColor: string;
}> = {
  purple: {
    gradient: "from-purple-600 to-violet-700",
    ring: "ring-purple-500/30",
    glow: "shadow-purple-500/40",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  cyan: {
    gradient: "from-cyan-600 to-teal-700",
    ring: "ring-cyan-500/30",
    glow: "shadow-cyan-500/40",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  amber: {
    gradient: "from-amber-600 to-orange-700",
    ring: "ring-amber-500/30",
    glow: "shadow-amber-500/40",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  rose: {
    gradient: "from-rose-600 to-pink-700",
    ring: "ring-rose-500/30",
    glow: "shadow-rose-500/40",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-400",
  },
  emerald: {
    gradient: "from-emerald-600 to-green-700",
    ring: "ring-emerald-500/30",
    glow: "shadow-emerald-500/40",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PersonaAvatar({ 
  persona, 
  size = 'md', 
  showGlow = true,
  className 
}: PersonaAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const Icon = persona.icon;
  
  const sizes = sizeConfig[size];
  const colors = colorConfig[persona.color] || colorConfig.cyan;
  
  // Check if image exists (we'll use icon fallback for now until images are generated)
  const hasImage = persona.avatarUrl && !imageError;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative flex items-center justify-center",
        className
      )}
    >
      {/* Glow Effect */}
      {showGlow && (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-0 rounded-full blur-xl",
            `bg-gradient-to-br ${colors.gradient}`,
            colors.glow,
            "shadow-lg"
          )}
          style={{ transform: "scale(1.2)" }}
        />
      )}

      {/* Avatar Container */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden",
          sizes.container,
          sizes.ring,
          colors.ring,
          "bg-gradient-to-br",
          colors.gradient,
          "transition-all duration-300"
        )}
      >
        {hasImage ? (
          /* Image Avatar */
          <img
            src={persona.avatarUrl}
            alt={persona.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Icon Fallback - Styled as professional avatar */
          <div className={cn(
            "w-full h-full flex items-center justify-center",
            "bg-gradient-to-br",
            colors.gradient
          )}>
            {/* Inner circle with icon */}
            <div className={cn(
              "rounded-full flex items-center justify-center",
              colors.iconBg,
              sizes.iconBg
            )}>
              <Icon className={cn(sizes.icon, "text-white/90")} />
            </div>
          </div>
        )}

        {/* Overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
      </div>

      {/* Status Ring Animation */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className={cn(
          "absolute inset-0 rounded-full",
          "border border-dashed border-white/10",
          "pointer-events-none"
        )}
        style={{ 
          transform: "scale(1.15)",
          transformOrigin: "center"
        }}
      />
    </motion.div>
  );
}

export default PersonaAvatar;
