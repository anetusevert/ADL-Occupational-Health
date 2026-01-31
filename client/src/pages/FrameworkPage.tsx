/**
 * Arthur D. Little - Global Health Platform
 * Framework Page - ADL Occupational Health Framework Visualization
 * Viewport-fit design with no scrolling
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Info, BookOpen, Sparkles } from "lucide-react";
import { InteractiveTemple, DetailPanel, StatCardModal, InteractionGuideModal } from "../components/framework";
import { cn } from "../lib/utils";

// Storage key for tracking first visit
const INTRO_SHOWN_KEY = "adl_framework_intro_shown";

type StatCardType = "components" | "metrics" | "bestPractices" | "maturityLevels";

interface StatCard {
  id: StatCardType;
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
  hoverBorder: string;
  glow: string;
}

const statCards: StatCard[] = [
  { 
    id: "components",
    label: "Components", 
    value: "4", 
    color: "text-adl-accent", 
    bg: "bg-adl-accent/10", 
    border: "border-adl-accent/20",
    hoverBorder: "hover:border-adl-accent/50",
    glow: "hover:shadow-adl-accent/20"
  },
  { 
    id: "metrics",
    label: "Metrics", 
    value: "25", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/50",
    glow: "hover:shadow-emerald-500/20"
  },
  { 
    id: "bestPractices",
    label: "Global Leaders", 
    value: "Top 15", 
    color: "text-amber-400", 
    bg: "bg-amber-500/10", 
    border: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/50",
    glow: "hover:shadow-amber-500/20"
  },
  { 
    id: "maturityLevels",
    label: "Maturity Levels", 
    value: "4", 
    color: "text-purple-400", 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/50",
    glow: "hover:shadow-purple-500/20"
  },
];

export function FrameworkPage() {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [selectedStatCard, setSelectedStatCard] = useState<StatCardType | null>(null);
  
  // Show interaction guide automatically on first visit only
  const [showInteractionGuide, setShowInteractionGuide] = useState(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem(INTRO_SHOWN_KEY);
    return !hasSeenIntro; // Show if never seen
  });

  // Mark intro as shown when modal closes
  const handleCloseGuide = () => {
    setShowInteractionGuide(false);
    localStorage.setItem(INTRO_SHOWN_KEY, "true");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Stat Card Modal */}
      <StatCardModal
        isOpen={selectedStatCard !== null}
        onClose={() => setSelectedStatCard(null)}
        cardType={selectedStatCard}
      />

      {/* Interaction Guide Modal - Shows automatically on first visit */}
      <InteractionGuideModal
        isOpen={showInteractionGuide}
        onClose={handleCloseGuide}
        onNavigateToBlock={(blockId) => {
          setActiveBlock(blockId);
          handleCloseGuide();
        }}
      />

      {/* Page Header - Fixed */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src="/adl-logo.png" 
                alt="ADL" 
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">
                ADL Occupational Health Framework
              </h1>
              <p className="text-white/40 text-sm">
                Version 2.0 — Comprehensive Assessment Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <Info className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/40">Click blocks to explore</span>
            </div>
            <motion.button
              onClick={() => setShowInteractionGuide(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-adl-accent/10 border border-adl-accent/20 rounded-lg hover:bg-adl-accent/20 hover:border-adl-accent/40 transition-all cursor-pointer group"
            >
              <BookOpen className="w-3.5 h-3.5 text-adl-accent" />
              <span className="text-xs text-adl-accent font-medium">Interactive Guide</span>
              <Sparkles className="w-3 h-3 text-adl-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content - Flexible */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Temple Visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden",
            activeBlock ? "lg:flex-[3]" : "lg:flex-1"
          )}
        >
          <InteractiveTemple
            activeBlock={activeBlock}
            onBlockSelect={setActiveBlock}
          />
        </motion.div>

        {/* Detail Panel */}
        {activeBlock && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:w-96 xl:w-[420px] min-h-0 overflow-hidden"
          >
            <DetailPanel
              blockId={activeBlock}
              onClose={() => setActiveBlock(null)}
            />
          </motion.div>
        )}
      </div>

      {/* Bottom Stats - Fixed & Interactive */}
      <div className="flex-shrink-0 mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <motion.button
            key={stat.id}
            onClick={() => setSelectedStatCard(stat.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
            whileHover={{ 
              scale: 1.03, 
              transition: { duration: 0.2 } 
            }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "p-3 rounded-xl border backdrop-blur-sm text-left cursor-pointer",
              "transition-all duration-300",
              "hover:shadow-lg",
              stat.bg,
              stat.border,
              stat.hoverBorder,
              stat.glow
            )}
          >
            <motion.div 
              className={cn("text-xl font-bold", stat.color)}
              whileHover={{ scale: 1.05 }}
            >
              {stat.value}
            </motion.div>
            <div className="text-xs text-white/40 flex items-center justify-between">
              <span>{stat.label}</span>
              <motion.span
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="text-[10px] opacity-0 group-hover:opacity-100"
              >
                Click to explore
              </motion.span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default FrameworkPage;
