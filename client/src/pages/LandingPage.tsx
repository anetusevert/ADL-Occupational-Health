/**
 * Arthur D. Little - Landing Page
 * Premium entry point for the Global Occupational Health Platform
 * 
 * Design: Bloomberg Terminal meets Stripe elegance
 * Features:
 * - Cinematic entrance animation
 * - Temple-style framework visualization
 * - OHI Score distribution histogram
 * - Interactive feature tiles
 * - Comprehensive data sources marquee
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe2, 
  Layers, 
  TrendingUp,
  ArrowRight,
  MapPin,
  Activity,
  Sparkles,
} from "lucide-react";
import { LandingEntrance } from "../components/LandingEntrance";
import { LoginModal } from "../components/LoginModal";
import { FeatureDetailModal, type FeatureType } from "../components/FeatureDetailModal";
import { FrameworkTempleCompact } from "../components/landing/FrameworkTempleCompact";
import { OHIScoreDistribution } from "../components/landing/OHIScoreDistribution";
import { DataSourcesMarquee } from "../components/landing/DataSourcesMarquee";
import { cn } from "../lib/utils";

// Value proposition cards configuration (3 tiles)
const valueProps: Array<{
  id: FeatureType;
  icon: typeof Layers;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  glowColor: string;
}> = [
  {
    id: "framework",
    icon: Layers,
    title: "Framework Analysis",
    description: "Comprehensive assessment across governance, prevention, vigilance, and restoration pillars.",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-400",
    glowColor: "group-hover:shadow-purple-500/20",
  },
  {
    id: "countries",
    icon: Globe2,
    title: "Country Profiles",
    description: "In-depth occupational health intelligence for 196 nations worldwide.",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconColor: "text-cyan-400",
    glowColor: "group-hover:shadow-cyan-500/20",
  },
  {
    id: "simulator",
    icon: TrendingUp,
    title: "Policy Simulation",
    description: "Model intervention scenarios and forecast their impact on health outcomes.",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    glowColor: "group-hover:shadow-emerald-500/20",
  },
];

// Key stats for credibility
const stats = [
  { value: "196", label: "Countries", icon: MapPin },
  { value: "50+", label: "Key Metrics", icon: Activity },
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

  const handleFeatureClick = (featureId: FeatureType) => {
    setActiveFeature(featureId);
  };

  const handleModalAccessPlatform = () => {
    setActiveFeature(null);
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-adl-gradient overflow-x-hidden">
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
            transition={{ duration: 0.8 }}
            className="relative min-h-screen"
          >
            {/* Premium Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.015]">
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '60px 60px'
                  }}
                />
              </div>
              {/* Gradient orbs */}
              <motion.div 
                animate={{ 
                  x: [0, 30, 0],
                  y: [0, -20, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-200px] right-[-200px] w-[900px] h-[900px] bg-adl-accent/[0.04] rounded-full blur-[200px]" 
              />
              <motion.div 
                animate={{ 
                  x: [0, -20, 0],
                  y: [0, 30, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-300px] left-[-200px] w-[700px] h-[700px] bg-purple-500/[0.04] rounded-full blur-[180px]" 
              />
              {/* Constellation particles */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{ 
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 80}%`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen">
              
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center justify-between px-6 lg:px-16 py-6"
              >
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <motion.img
                    src="/adl-logo.png"
                    alt="Arthur D. Little"
                    className="h-10 md:h-12 object-contain"
                    animate={{
                      filter: [
                        "drop-shadow(0 0 8px rgba(6,182,212,0.15))",
                        "drop-shadow(0 0 16px rgba(6,182,212,0.25))",
                        "drop-shadow(0 0 8px rgba(6,182,212,0.15))",
                      ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                {/* Sign In Button */}
                <motion.button
                  onClick={() => setIsLoginOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-medium text-white",
                    "bg-adl-accent hover:bg-adl-blue-light",
                    "transition-all duration-300",
                    "shadow-lg shadow-adl-accent/20 hover:shadow-xl hover:shadow-adl-accent/30",
                    "flex items-center gap-2"
                  )}
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.header>

              {/* Hero Section */}
              <main className="flex-1 flex flex-col items-center px-6 lg:px-16 py-8">
                
                {/* Hero Content */}
                <div className="text-center max-w-4xl mx-auto">
                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
                      Global Occupational{" "}
                      <span className="text-adl-accent">Health Intelligence</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto font-light">
                      Strategic insights and policy analysis for sovereign occupational 
                      health frameworks. Empowering evidence-based decisions across 196 nations.
                    </p>
                  </motion.div>

                  {/* Stats Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-4 mt-10"
                  >
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          whileHover={{ scale: 1.03 }}
                          className={cn(
                            "flex items-center gap-3 px-6 py-3",
                            "bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl",
                            "hover:border-white/20 transition-all duration-300"
                          )}
                        >
                          <Icon className="w-5 h-5 text-adl-accent" />
                          <div className="text-left">
                            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                            <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Framework Temple Visual */}
                  <div className="mt-12">
                    <FrameworkTempleCompact delay={0.7} />
                  </div>

                  {/* OHI Score Distribution */}
                  <div className="mt-10">
                    <OHIScoreDistribution delay={1.0} />
                  </div>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    className="mt-10"
                  >
                    <motion.button
                      onClick={() => setIsLoginOpen(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "group relative px-10 py-4 rounded-2xl font-semibold text-white text-lg",
                        "bg-adl-accent hover:bg-adl-blue-light",
                        "transition-all duration-300",
                        "shadow-xl shadow-adl-accent/25 hover:shadow-2xl hover:shadow-adl-accent/35",
                        "flex items-center gap-3 mx-auto overflow-hidden"
                      )}
                    >
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        initial={{ x: "-200%" }}
                        whileHover={{ x: "200%" }}
                        transition={{ duration: 0.8 }}
                      />
                      <Sparkles className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">Access Platform</span>
                      <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* Feature Tiles */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 1.4 }}
                  className="w-full max-w-5xl mx-auto mt-16"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {valueProps.map((prop, index) => {
                      const Icon = prop.icon;
                      return (
                        <motion.button
                          key={prop.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.5 + index * 0.1 }}
                          whileHover={{ 
                            y: -8,
                            transition: { duration: 0.25, ease: "easeOut" }
                          }}
                          onClick={() => handleFeatureClick(prop.id)}
                          className={cn(
                            "group relative p-7 rounded-2xl border backdrop-blur-sm text-left",
                            "bg-gradient-to-b from-white/[0.04] to-transparent",
                            prop.borderColor,
                            "hover:border-white/25 transition-all duration-300",
                            "cursor-pointer overflow-hidden",
                            "shadow-lg shadow-black/10",
                            prop.glowColor, "group-hover:shadow-xl"
                          )}
                        >
                          {/* Subtle shine on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          />
                          
                          <div className="relative z-10">
                            <div className={cn(
                              "w-14 h-14 rounded-xl flex items-center justify-center mb-5",
                              prop.bgColor
                            )}>
                              <Icon className={cn("w-7 h-7", prop.iconColor)} />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                              {prop.title}
                              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            </h3>
                            <p className="text-sm text-white/45 leading-relaxed">
                              {prop.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Data Sources Marquee */}
                <div className="w-full max-w-4xl mx-auto mt-16">
                  <DataSourcesMarquee delay={1.7} />
                </div>
              </main>

              {/* Footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.9 }}
                className="py-8 px-6 lg:px-16 text-center"
              >
                <p className="text-white/25 text-sm tracking-wide">
                  &copy; {new Date().getFullYear()} Arthur D. Little. All rights reserved.
                </p>
              </motion.footer>
            </div>

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
                onAccessPlatform={handleModalAccessPlatform}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;
