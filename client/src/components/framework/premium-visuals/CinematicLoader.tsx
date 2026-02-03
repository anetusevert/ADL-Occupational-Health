/**
 * Arthur D. Little - Global Health Platform
 * Cinematic Loader - 3-Phase Premium Opening Sequence
 * 
 * Phase 1: Brand Reveal (ADL + GOSI partnership)
 * Phase 2: Framework Teaser (Temple structure builds)
 * Phase 3: Transition to content
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Shield, Eye, Heart } from "lucide-react";
import { ParticleField } from "./ParticleField";
import { TextReveal } from "./TextReveal";

interface CinematicLoaderProps {
  onComplete: () => void;
  skipEnabled?: boolean;
}

export function CinematicLoader({ onComplete, skipEnabled = true }: CinematicLoaderProps) {
  const [phase, setPhase] = useState(1);
  const [isSkipping, setIsSkipping] = useState(false);

  // Phase timing
  useEffect(() => {
    if (isSkipping) {
      onComplete();
      return;
    }

    const timings = {
      1: 3000, // Brand reveal
      2: 3500, // Temple build
      3: 1500, // Transition
    };

    const timer = setTimeout(() => {
      if (phase < 3) {
        setPhase(phase + 1);
      } else {
        onComplete();
      }
    }, timings[phase as keyof typeof timings]);

    return () => clearTimeout(timer);
  }, [phase, isSkipping, onComplete]);

  // Keyboard skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (skipEnabled && (e.key === "Escape" || e.key === " " || e.key === "Enter")) {
        setIsSkipping(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [skipEnabled]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-adl-navy-dark to-slate-950 flex items-center justify-center overflow-hidden"
    >
      {/* Ambient particle field */}
      <ParticleField 
        count={60} 
        color={phase === 1 ? "mixed" : phase === 2 ? "purple" : "cyan"} 
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-50" />

      <AnimatePresence mode="wait">
        {phase === 1 && <Phase1BrandReveal key="phase1" />}
        {phase === 2 && <Phase2TempleTeaser key="phase2" />}
        {phase === 3 && <Phase3Transition key="phase3" />}
      </AnimatePresence>

      {/* Skip hint */}
      {skipEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <button
            onClick={() => setIsSkipping(true)}
            className="text-white/30 text-xs hover:text-white/50 transition-colors flex items-center gap-2"
          >
            <span>Press any key to skip</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">ESC</kbd>
          </button>
        </motion.div>
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
        {[1, 2, 3].map((p) => (
          <motion.div
            key={p}
            className="w-8 h-1 rounded-full overflow-hidden bg-white/10"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: phase >= p ? "100%" : "0%" }}
              transition={{ duration: phase === p ? 2.5 : 0.3 }}
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// PHASE 1: Brand Reveal
// ============================================================================

function Phase1BrandReveal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 text-center"
    >
      {/* Logo container with glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative mb-8"
      >
        {/* Glow behind logos */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 60px rgba(139,92,246,0.3), 0 0 120px rgba(6,182,212,0.2)",
              "0 0 80px rgba(139,92,246,0.4), 0 0 160px rgba(6,182,212,0.3)",
              "0 0 60px rgba(139,92,246,0.3), 0 0 120px rgba(6,182,212,0.2)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl"
        />

        {/* Logos row */}
        <div className="flex items-center justify-center gap-6 p-8">
          {/* ADL Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            <div className="w-24 h-24 flex items-center justify-center">
              <img
                src="/adl-logo.png"
                alt="Arthur D. Little"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-white/60 text-xs mt-2 font-medium"
            >
              Arthur D. Little
            </motion.p>
          </motion.div>

          {/* Connecting line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="w-16 h-px bg-gradient-to-r from-purple-500 via-white/30 to-cyan-500"
          />

          {/* GOSI Logo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative"
          >
            <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
              <img
                src="/gosi-logo.png"
                alt="GOSI"
                className="w-full h-full object-contain brightness-0 invert scale-150"
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-white/60 text-xs mt-2 font-medium"
            >
              GOSI
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Partnership tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <TextReveal
          text="Strategic Partnership for Worker Protection"
          className="text-lg text-white/80 font-light tracking-wide"
          delay={1.4}
        />
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-cyan-400/70 text-sm mt-4"
      >
        Transforming Occupational Health in Saudi Arabia
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// PHASE 2: Temple Teaser
// ============================================================================

function Phase2TempleTeaser() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 flex flex-col items-center"
    >
      {/* Temple structure */}
      <div className="relative w-80 h-64">
        {/* Foundation/Base - appears first */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-2 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-full"
        />

        {/* Pillars */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-12">
          {/* Pillar 1 - Prevention (Blue) */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="origin-bottom"
          >
            <div className="w-16 h-32 bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-lg flex flex-col items-center justify-end pb-3 shadow-lg shadow-blue-500/30">
              <Shield className="w-6 h-6 text-white/90" />
              <span className="text-[8px] text-white/70 mt-1">Prevention</span>
            </div>
            {/* Light beam */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 0.6, height: 40 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-t from-blue-400 to-transparent"
            />
          </motion.div>

          {/* Pillar 2 - Surveillance (Emerald) */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
            className="origin-bottom"
          >
            <div className="w-16 h-32 bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-lg flex flex-col items-center justify-end pb-3 shadow-lg shadow-emerald-500/30">
              <Eye className="w-6 h-6 text-white/90" />
              <span className="text-[8px] text-white/70 mt-1">Vigilance</span>
            </div>
            {/* Light beam */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 0.6, height: 40 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-t from-emerald-400 to-transparent"
            />
          </motion.div>

          {/* Pillar 3 - Restoration (Amber) */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
            className="origin-bottom"
          >
            <div className="w-16 h-32 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-lg flex flex-col items-center justify-end pb-3 shadow-lg shadow-amber-500/30">
              <Heart className="w-6 h-6 text-white/90" />
              <span className="text-[8px] text-white/70 mt-1">Restoration</span>
            </div>
            {/* Light beam */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 0.6, height: 40 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-t from-amber-400 to-transparent"
            />
          </motion.div>
        </div>

        {/* Governance Roof - descends from top */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8, type: "spring", damping: 15 }}
          className="absolute top-4 left-1/2 -translate-x-1/2"
        >
          {/* Roof triangle */}
          <div className="relative">
            <div className="w-64 h-16 bg-gradient-to-b from-purple-500 to-purple-700 rounded-t-3xl flex items-center justify-center shadow-lg shadow-purple-500/40">
              <Crown className="w-8 h-8 text-white/90" />
              <span className="ml-2 text-sm text-white/90 font-medium">Governance</span>
            </div>
            {/* Golden glow */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 30px rgba(147,51,234,0.3)",
                  "0 0 50px rgba(147,51,234,0.5)",
                  "0 0 30px rgba(147,51,234,0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-t-3xl"
            />
          </div>
        </motion.div>
      </div>

      {/* Framework title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.6 }}
        className="mt-8 text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          ADL Occupational Health Framework
        </h2>
        <p className="text-white/50 text-sm">Version 2.0 — Comprehensive Assessment Architecture</p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// PHASE 3: Transition
// ============================================================================

function Phase3Transition() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 text-center"
    >
      {/* Morphing circle */}
      <motion.div
        animate={{
          scale: [1, 1.5, 20],
          opacity: [1, 0.8, 0],
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 mx-auto"
      />

      {/* Text that appears briefly */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, times: [0, 0.3, 1] }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xl font-medium whitespace-nowrap"
      >
        Begin Your Journey
      </motion.p>
    </motion.div>
  );
}

export default CinematicLoader;
