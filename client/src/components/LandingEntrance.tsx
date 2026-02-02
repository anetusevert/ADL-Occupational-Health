/**
 * Arthur D. Little - Landing Entrance Animation
 * Premium cinematic entrance sequence with ADL logo then GOSI logo
 * 
 * Animation Stages:
 * - Stage 1 (0-2s): ADL logo fades in with blur-to-sharp effect
 * - Stage 2 (2-4s): GOSI logo fades in (white version)
 * - Stage 3 (4-5s): Zoom transition effect into main view
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface LandingEntranceProps {
  onComplete: () => void;
  duration?: number; // Total animation duration in ms
}

export function LandingEntrance({ onComplete, duration = 5000 }: LandingEntranceProps) {
  const [stage, setStage] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Stage 1: ADL Logo appears (0-2s)
    const stage1Timer = setTimeout(() => setStage(1), 100);
    
    // Stage 2: GOSI Logo appears (2s)
    const stage2Timer = setTimeout(() => setStage(2), 2000);
    
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
                opacity: stage >= 2 ? 0 : 1, 
                scale: 1, 
                filter: "blur(0px)" 
              } : {}}
              transition={{ 
                duration: 1.2, 
                ease: [0.25, 0.46, 0.45, 0.94] 
              }}
              className="relative z-10"
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
                  animate={stage >= 1 && stage < 2 ? {
                    opacity: [0.2, 0.4, 0.2],
                    scale: [0.9, 1.1, 0.9],
                    rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                  } : { opacity: 0 }}
                  transition={{
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
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

            {/* Stage 2: GOSI Logo (White) */}
            <AnimatePresence>
              {stage >= 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    filter: "blur(0px)" 
                  }}
                  transition={{ 
                    duration: 1.2, 
                    ease: [0.25, 0.46, 0.45, 0.94] 
                  }}
                  className="relative z-10 absolute"
                >
                  {/* Orbiting rings around GOSI logo */}
                  {[1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-emerald-400/20"
                      style={{ 
                        inset: `-${i * 30}px`,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${120 + i * 60}px`,
                        height: `${80 + i * 40}px`,
                      }}
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                        scale: [0.9, 1.1, 0.9],
                        rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                      }}
                      transition={{
                        opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      }}
                    />
                  ))}
                  
                  {/* GOSI Logo - White version, cropped to show only main text */}
                  <div className="h-20 md:h-28 w-48 md:w-64 overflow-hidden relative z-10">
                    <motion.img
                      src="/gosi-logo.png"
                      alt="GOSI"
                      className="brightness-0 invert object-cover object-top w-full scale-[1.8] origin-top"
                      animate={{
                        filter: [
                          "brightness(0) invert(1) drop-shadow(0 0 30px rgba(255,255,255,0.3))",
                          "brightness(0) invert(1) drop-shadow(0 0 50px rgba(255,255,255,0.5))",
                          "brightness(0) invert(1) drop-shadow(0 0 30px rgba(255,255,255,0.3))",
                        ],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Platform Name - appears after GOSI logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={stage >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-center mt-24"
            >
              <p className="text-adl-accent text-sm font-medium tracking-widest uppercase">
                Global Occupational Health Intelligence
              </p>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: stage >= 2 ? 1 : 0 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-[-100px] left-1/2 -translate-x-1/2"
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
