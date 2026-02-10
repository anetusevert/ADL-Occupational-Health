/**
 * Arthur D. Little - Landing Page
 * Cinematic, no-scroll landing page presenting the Occupational Health Intelligence platform
 * 
 * Design: Centered single-column layout with premium consulting aesthetics
 * All content fits within viewport - no scrolling required
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe2, 
  Layers, 
  ArrowRight,
  MapPin,
  BarChart3,
  Shield,
} from "lucide-react";
import { LandingEntrance } from "../components/LandingEntrance";
import { LoginModal } from "../components/LoginModal";
import { FeatureDetailModal, type FeatureType } from "../components/FeatureDetailModal";
import { cn } from "../lib/utils";

// Value proposition cards
const valueProps: Array<{
  id: FeatureType;
  icon: typeof Layers;
  title: string;
  shortDesc: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}> = [
  {
    id: "framework",
    icon: Layers,
    title: "The Framework",
    shortDesc: "4 pillars. 25 metrics. One architecture.",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    id: "countries",
    icon: Globe2,
    title: "Global Intelligence",
    shortDesc: "195 nations. Scored, ranked, compared.",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
];

// Key stats
const stats = [
  { value: "195", label: "Nations Assessed", icon: MapPin },
  { value: "25+", label: "OH Metrics", icon: BarChart3 },
  { value: "4", label: "Framework Pillars", icon: Shield },
];

export function LandingPage() {
  const [showEntrance, setShowEntrance] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState<FeatureType | null>(null);

  useEffect(() => {
    const entranceShown = sessionStorage.getItem("entranceShown");
    if (entranceShown) {
      setShowEntrance(false);
      setContentVisible(true);
    }
  }, []);

  const handleEntranceComplete = () => {
    setShowEntrance(false);
    sessionStorage.setItem("entranceShown", "true");
    setTimeout(() => setContentVisible(true), 100);
  };

  return (
    <div className="h-screen overflow-hidden bg-adl-gradient">
      {/* Entrance Animation */}
      <AnimatePresence>
        {showEntrance && (
          <LandingEntrance 
            onComplete={handleEntranceComplete} 
            duration={7000}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {contentVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-full flex flex-col"
          >
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 opacity-[0.012]">
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '50px 50px'
                  }}
                />
              </div>
              <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] bg-adl-accent/[0.03] rounded-full blur-[180px]" />
              <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-purple-500/[0.025] rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-20 flex items-center justify-end px-4 sm:px-6 lg:px-10 py-3 lg:py-4"
            >
              <motion.button
                onClick={() => setIsLoginOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "px-5 py-2.5 rounded-lg font-medium text-white text-sm",
                  "bg-adl-accent hover:bg-adl-blue-light",
                  "transition-all duration-200",
                  "shadow-md shadow-adl-accent/20",
                  "flex items-center gap-2"
                )}
              >
                Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </motion.header>

            {/* Main Content - Centered Single Column */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-2 lg:py-4">
              
              <div className="flex flex-col items-center justify-center max-w-2xl text-center">
                
                {/* Both Logos Side by Side */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center gap-6 sm:gap-10 mb-8"
                >
                  {/* ADL Logo */}
                  <motion.img
                    src="/adl-logo.png"
                    alt="Arthur D. Little"
                    className="h-12 sm:h-16 lg:h-20 object-contain"
                    animate={{
                      filter: [
                        "drop-shadow(0 0 8px rgba(6,182,212,0.15))",
                        "drop-shadow(0 0 16px rgba(6,182,212,0.25))",
                        "drop-shadow(0 0 8px rgba(6,182,212,0.15))",
                      ],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Divider */}
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "100%", opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="h-12 sm:h-16 lg:h-20 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" 
                  />
                  
                  {/* GOSI Logo */}
                  <motion.img
                    src="/gosi-logo.png"
                    alt="GOSI"
                    className="h-12 sm:h-16 lg:h-20 object-contain brightness-0 invert"
                    animate={{
                      filter: [
                        "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.15))",
                        "brightness(0) invert(1) drop-shadow(0 0 16px rgba(255,255,255,0.25))",
                        "brightness(0) invert(1) drop-shadow(0 0 8px rgba(255,255,255,0.15))",
                      ],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-4 lg:mb-6"
                >
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                    Occupational Health{" "}
                    <span className="text-adl-accent">Intelligence</span>
                  </h1>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "80px" }}
                    transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="h-[1px] bg-gradient-to-r from-adl-accent/60 to-transparent mx-auto mt-3 mb-3"
                  />
                  <p className="text-sm sm:text-base lg:text-lg text-white/50 leading-relaxed max-w-lg mx-auto font-light">
                    Evidence-based framework for sovereign occupational health strategy.
                    <span className="block text-white/35 text-xs sm:text-sm mt-1">195 nations assessed. One integrated intelligence platform.</span>
                  </p>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex justify-center gap-3 mb-5 lg:mb-6"
                >
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.08 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2",
                          "bg-white/[0.03] border border-white/10 rounded-lg"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 text-adl-accent/70" />
                        <div>
                          <p className="text-base font-bold text-white leading-none">{stat.value}</p>
                          <p className="text-[9px] text-white/35 uppercase tracking-wide">{stat.label}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className="mb-5 lg:mb-6 flex flex-col items-center gap-2"
                >
                  <motion.button
                    onClick={() => setIsLoginOpen(true)}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(6,182,212,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "px-8 py-3.5 rounded-xl font-semibold text-white",
                      "bg-adl-accent hover:bg-adl-blue-light",
                      "transition-all duration-300",
                      "shadow-lg shadow-adl-accent/20",
                      "flex items-center gap-2.5 text-sm"
                    )}
                  >
                    Enter the Platform
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  <p className="text-[10px] text-white/25 tracking-wide">
                    Built by Arthur D. Little for GOSI
                  </p>
                </motion.div>

                {/* Feature Tiles */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                  className="grid grid-cols-2 gap-3 w-full max-w-sm"
                >
                  {valueProps.map((prop, index) => {
                    const Icon = prop.icon;
                    return (
                      <motion.button
                        key={prop.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.08 }}
                        whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.2)" }}
                        onClick={() => setActiveFeature(prop.id)}
                        className={cn(
                          "group p-3.5 rounded-xl border backdrop-blur-sm text-left",
                          "bg-gradient-to-b from-white/[0.03] to-transparent",
                          prop.borderColor,
                          "hover:bg-white/[0.05] transition-all duration-300",
                          "cursor-pointer"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                          prop.bgColor
                        )}>
                          <Icon className={cn("w-4 h-4", prop.iconColor)} />
                        </div>
                        <h3 className="text-xs font-semibold text-white flex items-center gap-1">
                          {prop.title}
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </h3>
                        <p className="text-[10px] text-white/35 mt-0.5 leading-relaxed hidden sm:block">
                          {prop.shortDesc}
                        </p>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>
            </main>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.9 }}
              className="relative z-10 py-2 px-4 text-center"
            >
              <p className="text-white/15 text-[10px] tracking-wider">
                &copy; {new Date().getFullYear()} Arthur D. Little &middot; Privileged & Confidential
              </p>
            </motion.footer>

            {/* Modals */}
            <LoginModal 
              isOpen={isLoginOpen} 
              onClose={() => setIsLoginOpen(false)} 
            />

            {activeFeature && (
              <FeatureDetailModal
                isOpen={!!activeFeature}
                onClose={() => setActiveFeature(null)}
                feature={activeFeature}
                onAccessPlatform={() => {
                  setActiveFeature(null);
                  setIsLoginOpen(true);
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;
