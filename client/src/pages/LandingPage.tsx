/**
 * Arthur D. Little - Landing Page
 * No-scroll, fully responsive premium landing page
 * 
 * Design: Centered single-column layout
 * All content fits within viewport - no scrolling required
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe2, 
  Layers, 
  ArrowRight,
  MapPin,
  Activity,
} from "lucide-react";
import { LandingEntrance } from "../components/LandingEntrance";
import { LoginModal } from "../components/LoginModal";
import { FeatureDetailModal, type FeatureType } from "../components/FeatureDetailModal";
import { cn } from "../lib/utils";

// Value proposition cards - compact configuration (GOSI-focused, no simulator)
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
    title: "Framework",
    shortDesc: "4-pillar assessment",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    id: "countries",
    icon: Globe2,
    title: "Countries",
    shortDesc: "196 nation profiles",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
];

// Key stats
const stats = [
  { value: "196", label: "Countries", icon: MapPin },
  { value: "50+", label: "Metrics", icon: Activity },
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
            duration={5000}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {contentVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative h-full flex flex-col"
          >
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 opacity-[0.015]">
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '50px 50px'
                  }}
                />
              </div>
              <div className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] bg-adl-accent/[0.03] rounded-full blur-[180px]" />
              <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative z-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 lg:py-4"
            >
              <motion.img
                src="/adl-logo.png"
                alt="Arthur D. Little"
                className="h-8 lg:h-10 object-contain"
                animate={{
                  filter: [
                    "drop-shadow(0 0 6px rgba(6,182,212,0.15))",
                    "drop-shadow(0 0 12px rgba(6,182,212,0.2))",
                    "drop-shadow(0 0 6px rgba(6,182,212,0.15))",
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.button
                onClick={() => setIsLoginOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-white text-sm",
                  "bg-adl-accent hover:bg-adl-blue-light",
                  "transition-all duration-200",
                  "shadow-md shadow-adl-accent/20",
                  "flex items-center gap-1.5"
                )}
              >
                Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </motion.header>

            {/* Main Content - Centered Single Column */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-2 lg:py-4">
              
              {/* Hero + Features */}
              <div className="flex flex-col justify-center max-w-2xl">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-4 lg:mb-6"
                >
                  {/* GOSI Partnership Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-medium text-emerald-400 uppercase tracking-wider">
                      Developed for GOSI Saudi Arabia
                    </span>
                  </motion.div>
                  
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                    Global Occupational{" "}
                    <span className="text-adl-accent">Health Intelligence</span>
                  </h1>
                  <p className="mt-2 lg:mt-3 text-sm sm:text-base lg:text-lg text-white/50 leading-relaxed max-w-lg">
                    Strategic insights for sovereign occupational health frameworks across 196 nations.
                  </p>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="flex gap-3 mb-4 lg:mb-6"
                >
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2",
                          "bg-white/[0.03] border border-white/10 rounded-lg"
                        )}
                      >
                        <Icon className="w-4 h-4 text-adl-accent" />
                        <div>
                          <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                          <p className="text-[10px] text-white/40 uppercase">{stat.label}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mb-4 lg:mb-6"
                >
                  <motion.button
                    onClick={() => setIsLoginOpen(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "px-6 py-3 rounded-xl font-semibold text-white",
                      "bg-adl-accent hover:bg-adl-blue-light",
                      "transition-all duration-200",
                      "shadow-lg shadow-adl-accent/25",
                      "flex items-center gap-2"
                    )}
                  >
                    Access Platform
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>

                {/* Feature Tiles - Compact Horizontal */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="grid grid-cols-2 gap-2"
                >
                  {valueProps.map((prop, index) => {
                    const Icon = prop.icon;
                    return (
                      <motion.button
                        key={prop.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + index * 0.05 }}
                        whileHover={{ y: -3 }}
                        onClick={() => setActiveFeature(prop.id)}
                        className={cn(
                          "group p-3 rounded-xl border backdrop-blur-sm text-left",
                          "bg-gradient-to-b from-white/[0.03] to-transparent",
                          prop.borderColor,
                          "hover:border-white/25 transition-all duration-200",
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
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-[10px] text-white/40 mt-0.5 hidden sm:block">
                          {prop.shortDesc}
                        </p>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>
            </main>

            {/* Footer - Minimal */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="relative z-10 py-2 px-4 text-center"
            >
              <p className="text-white/20 text-[10px] tracking-wide">
                &copy; {new Date().getFullYear()} Arthur D. Little
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
