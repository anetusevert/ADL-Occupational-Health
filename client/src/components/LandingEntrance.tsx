/**
 * Arthur D. Little - Landing Entrance Animation
 * Cinematic entrance sequence: ADL logo, light-streak transition, GOSI logo, tagline reveal
 * 
 * Animation Stages:
 * - Stage 1 (0-2.5s): ADL logo fades in with blur-to-sharp, orbiting rings, pulsing glow
 * - Stage 2 (2.5s): Light-streak wipe transition
 * - Stage 3 (2.5-5s): GOSI logo fades in with orbiting rings
 * - Stage 4 (5-6s): Tagline reveal beneath GOSI logo
 * - Stage 5 (6-7s): Cinematic zoom-blur exit into main view
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface LandingEntranceProps {
  onComplete: () => void;
  duration?: number; // Total animation duration in ms
}

export function LandingEntrance({ onComplete, duration = 7000 }: LandingEntranceProps) {
  const [stage, setStage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Stage 1: ADL Logo appears (0-2.5s)
    const stage1Timer = setTimeout(() => setStage(1), 100);
    
    // Stage 2: Light streak + transition (2.5s)
    const stage2Timer = setTimeout(() => setStage(2), 2500);
    
    // Stage 3: GOSI Logo appears (3s)
    const stage3Timer = setTimeout(() => setStage(3), 3000);
    
    // Stage 4: Tagline reveal (5s)
    const stage4Timer = setTimeout(() => setStage(4), 5000);
    
    // Stage 5: Exit transition (6s)
    const stage5Timer = setTimeout(() => {
      setIsExiting(true);
      setStage(5);
    }, duration - 1000);
    
    // Complete animation
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      clearTimeout(stage4Timer);
      clearTimeout(stage5Timer);
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
            scale: 1.3,
            filter: "blur(30px)",
          }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '50px 50px'
              }}
            />
          </div>
          
          {/* Ambient glow - Primary */}
          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full bg-adl-accent/8 blur-[180px]"
            animate={{ 
              scale: [1, 1.4, 1], 
              opacity: [0.15, 0.35, 0.15] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Ambient glow - Secondary */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] translate-x-[-200px] translate-y-[100px]"
            animate={{ 
              scale: [1.1, 0.9, 1.1], 
              opacity: [0.1, 0.2, 0.1] 
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Light streak transition between logos */}
          <AnimatePresence>
            {stage === 2 && (
              <motion.div
                className="absolute inset-0 z-20 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  initial={{ left: "-100%", width: "60%" }}
                  animate={{ left: "140%" }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-adl-accent/60 to-transparent"
                  initial={{ left: "-100%", width: "80%" }}
                  animate={{ left: "140%" }}
                  transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.05 }}
                />
                {/* Flash */}
                <motion.div
                  className="absolute inset-0 bg-white/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.08, 0] }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Container */}
          <div className="relative flex flex-col items-center">
            
            {/* Stage 1: ADL Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: "blur(20px)" }}
              animate={stage >= 1 ? { 
                opacity: stage >= 2 ? 0 : 1, 
                scale: stage >= 2 ? 1.05 : 1, 
                filter: "blur(0px)" 
              } : {}}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="relative z-10"
            >
              {/* Orbiting rings around ADL logo */}
              {[1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-adl-accent/15"
                  style={{ 
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: `${110 + i * 55}px`,
                    height: `${110 + i * 55}px`,
                  }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={stage >= 1 && stage < 2 ? {
                    opacity: [0.15, 0.35, 0.15],
                    scale: [0.92, 1.08, 0.92],
                    rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                  } : { opacity: 0 }}
                  transition={{
                    opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                  }}
                />
              ))}
              
              {/* ADL Logo with glow */}
              <motion.img
                src="/adl-logo.png"
                alt="Arthur D. Little"
                className="h-24 md:h-32 object-contain relative z-10"
                animate={stage >= 1 && stage < 2 ? {
                  filter: [
                    "drop-shadow(0 0 25px rgba(6,182,212,0.25))",
                    "drop-shadow(0 0 45px rgba(6,182,212,0.45))",
                    "drop-shadow(0 0 25px rgba(6,182,212,0.25))",
                  ],
                } : {}}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Stage 3: GOSI Logo (White) */}
            <AnimatePresence>
              {stage >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, filter: "blur(20px)" }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    filter: "blur(0px)" 
                  }}
                  transition={{ 
                    duration: 1.4, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  className="relative z-10 absolute"
                >
                  {/* Orbiting rings around GOSI logo */}
                  {[1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-white/10"
                      style={{ 
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${130 + i * 60}px`,
                        height: `${130 + i * 60}px`,
                      }}
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                        scale: [0.92, 1.08, 0.92],
                        rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                      }}
                      transition={{
                        opacity: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                      }}
                    />
                  ))}
                  
                  {/* GOSI Logo - White version, fully visible */}
                  <motion.img
                    src="/gosi-logo.png"
                    alt="GOSI"
                    className="h-24 md:h-32 object-contain relative z-10 brightness-0 invert"
                    animate={{
                      filter: [
                        "brightness(0) invert(1) drop-shadow(0 0 25px rgba(255,255,255,0.2))",
                        "brightness(0) invert(1) drop-shadow(0 0 45px rgba(255,255,255,0.4))",
                        "brightness(0) invert(1) drop-shadow(0 0 25px rgba(255,255,255,0.2))",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage 4: Tagline reveal beneath GOSI logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={stage >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mt-24"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={stage >= 3 ? { width: "100%" } : {}}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4 mx-auto max-w-[240px]"
              />
              <p className="text-white/70 text-xs md:text-sm font-light tracking-[0.25em] uppercase">
                Occupational Health Intelligence
              </p>
              
              {/* Second tagline - delayed further */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={stage >= 4 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-adl-accent/80 text-[11px] md:text-xs font-medium tracking-[0.2em] uppercase mt-2"
              >
                Protecting Every Worker. Powering Every Decision.
              </motion.p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 4 ? 1 : 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute bottom-[-110px] left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-adl-accent/50"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 1.2,
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
