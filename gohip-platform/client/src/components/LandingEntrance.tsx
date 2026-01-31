/**
 * Arthur D. Little - Landing Entrance Animation
 * Premium cinematic entrance sequence with ADL logo and framework visualization
 * 
 * Animation Stages:
 * - Stage 1 (0-1.5s): ADL logo fades in with blur-to-sharp effect
 * - Stage 2 (1.5-4s): Temple framework builds beneath the logo
 * - Stage 3 (4-5s): Zoom transition effect into main view
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Crown, Shield, Eye, Heart } from "lucide-react";
import { cn } from "../lib/utils";

interface LandingEntranceProps {
  onComplete: () => void;
  duration?: number; // Total animation duration in ms
}

// Framework pillar configuration
const frameworkPillars = [
  {
    id: "governance",
    icon: Crown,
    label: "Governance",
    color: "purple",
    bgGradient: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/40",
    glowColor: "shadow-purple-500/20",
  },
  {
    id: "hazard",
    icon: Shield,
    label: "Hazard Prevention",
    color: "blue",
    bgGradient: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/40",
    glowColor: "shadow-blue-500/20",
  },
  {
    id: "vigilance",
    icon: Eye,
    label: "Health Vigilance",
    color: "emerald",
    bgGradient: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-500/40",
    glowColor: "shadow-emerald-500/20",
  },
  {
    id: "restoration",
    icon: Heart,
    label: "Restoration",
    color: "amber",
    bgGradient: "from-amber-500/20 to-amber-600/10",
    borderColor: "border-amber-500/40",
    glowColor: "shadow-amber-500/20",
  },
];

export function LandingEntrance({ onComplete, duration = 5000 }: LandingEntranceProps) {
  const [stage, setStage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Stage 1: Logo appears (0-1.5s)
    const stage1Timer = setTimeout(() => setStage(1), 100);
    
    // Stage 2: Framework builds (1.5s)
    const stage2Timer = setTimeout(() => setStage(2), 1500);
    
    // Stage 3: Zoom transition (4s)
    const stage3Timer = setTimeout(() => {
      setIsExiting(true);
      setStage(3);
    }, duration - 1000);
    
    // Complete animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-50 bg-adl-gradient flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.5,
            filter: "blur(20px)",
          }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>
          
          {/* Ambient glow */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full bg-adl-accent/10 blur-[150px]"
            animate={{ 
              scale: [1, 1.3, 1], 
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Main Content Container */}
          <div className="relative flex flex-col items-center">
            
            {/* Stage 1: ADL Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              animate={stage >= 1 ? { 
                opacity: 1, 
                scale: 1, 
                filter: "blur(0px)" 
              } : {}}
              transition={{ 
                duration: 1.2, 
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
              className="relative z-10 mb-12"
            >
              {/* Orbiting rings around logo */}
              {[1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-adl-accent/20"
                  style={{ 
                    inset: `-${i * 25}px`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${100 + i * 50}px`,
                    height: `${100 + i * 50}px`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={stage >= 1 ? {
                    opacity: [0.2, 0.4, 0.2],
                    scale: [0.9, 1.1, 0.9],
                    rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                  } : {}}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  }}
                />
              ))}
              
              {/* Logo with glow */}
              <motion.img
                src="/adl-logo.png"
                alt="Arthur D. Little"
                className="h-24 md:h-32 object-contain relative z-10"
                animate={stage >= 1 ? {
                  filter: [
                    "drop-shadow(0 0 30px rgba(6,182,212,0.3))",
                    "drop-shadow(0 0 50px rgba(6,182,212,0.5))",
                    "drop-shadow(0 0 30px rgba(6,182,212,0.3))",
                  ],
                } : {}}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Stage 2: Temple Framework Animation */}
            <AnimatePresence>
              {stage >= 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative w-full max-w-2xl px-4"
                >
                  {/* Governance Roof - Slides down */}
                  <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94] 
                    }}
                    className="mb-4"
                  >
                    <div className={cn(
                      "bg-gradient-to-b from-purple-500/20 to-purple-600/10",
                      "border border-purple-500/30 rounded-xl p-4",
                      "backdrop-blur-sm shadow-lg shadow-purple-500/10"
                    )}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-white font-semibold">Governance Ecosystem</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Connectors */}
                  <div className="flex justify-center gap-8 py-2 mb-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 20, opacity: 1 }}
                        transition={{ 
                          delay: 0.5 + i * 0.1, 
                          duration: 0.4,
                          ease: "easeOut"
                        }}
                        className="w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent rounded-full"
                      />
                    ))}
                  </div>

                  {/* Three Pillars - Rise up */}
                  <div className="grid grid-cols-3 gap-3">
                    {frameworkPillars.slice(1).map((pillar, index) => {
                      const Icon = pillar.icon;
                      return (
                        <motion.div
                          key={pillar.id}
                          initial={{ opacity: 0, y: 50, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            duration: 0.7, 
                            delay: 0.7 + index * 0.15,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }}
                        >
                          <div className={cn(
                            "bg-gradient-to-b",
                            pillar.bgGradient,
                            "border",
                            pillar.borderColor,
                            "rounded-xl p-4 backdrop-blur-sm",
                            "shadow-lg",
                            pillar.glowColor
                          )}>
                            <div className="flex flex-col items-center gap-2">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                `bg-${pillar.color}-500/20`
                              )}>
                                <Icon className={cn("w-5 h-5", `text-${pillar.color}-400`)} />
                              </div>
                              <span className="text-white/90 text-sm font-medium text-center">
                                {pillar.label}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Platform Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.6 }}
                    className="text-center mt-8"
                  >
                    <p className="text-adl-accent text-sm font-medium tracking-widest uppercase">
                      Global Occupational Health Intelligence
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 2 ? 1 : 0 }}
              transition={{ delay: 2 }}
              className="absolute bottom-[-80px] left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-adl-accent/60"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LandingEntrance;
