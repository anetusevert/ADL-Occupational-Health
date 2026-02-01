/**
 * Arthur D. Little - Landing Page
 * Professional entry point for the Global Occupational Health Platform
 * 
 * Features:
 * - Cinematic entrance animation
 * - Hero section with ADL branding
 * - Framework pillars visualization
 * - ADL OHI Score display
 * - Interactive feature tiles with modals
 * - Data sources showcase
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
  Crown,
  Shield,
  Eye,
  Heart,
  ChevronRight,
} from "lucide-react";
import { LandingEntrance } from "../components/LandingEntrance";
import { LoginModal } from "../components/LoginModal";
import { FeatureDetailModal, type FeatureType } from "../components/FeatureDetailModal";
import { cn } from "../lib/utils";

// Framework pillars for visual display
const frameworkPillars = [
  { id: "governance", icon: Crown, name: "Governance", color: "purple", bgColor: "bg-purple-500/20", textColor: "text-purple-400" },
  { id: "prevention", icon: Shield, name: "Prevention", color: "blue", bgColor: "bg-blue-500/20", textColor: "text-blue-400" },
  { id: "vigilance", icon: Eye, name: "Vigilance", color: "emerald", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400" },
  { id: "restoration", icon: Heart, name: "Restoration", color: "amber", bgColor: "bg-amber-500/20", textColor: "text-amber-400" },
];

// Data sources with colors
const dataSources = [
  { id: "wb", name: "World Bank", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  { id: "ilo", name: "ILO", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { id: "who", name: "WHO", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  { id: "oecd", name: "OECD", color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20" },
];

// Value proposition cards configuration (3 tiles)
const valueProps: Array<{
  id: FeatureType;
  icon: typeof Layers;
  title: string;
  description: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}> = [
  {
    id: "framework",
    icon: Layers,
    title: "Framework Analysis",
    description: "Comprehensive assessment across governance, prevention, vigilance, and restoration pillars.",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    id: "countries",
    icon: Globe2,
    title: "Country Profiles",
    description: "In-depth occupational health intelligence for 196 nations worldwide.",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    id: "simulator",
    icon: TrendingUp,
    title: "Policy Simulation",
    description: "Model intervention scenarios and forecast their impact on health outcomes.",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
];

// Key stats for credibility (removed Framework Pillars)
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
    // Check if entrance was already shown this session
    const entranceShown = sessionStorage.getItem("entranceShown");
    if (entranceShown) {
      setShowEntrance(false);
      setContentVisible(true);
    }
  }, []);

  const handleEntranceComplete = () => {
    setShowEntrance(false);
    sessionStorage.setItem("entranceShown", "true");
    // Small delay before showing content for smooth transition
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
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute inset-0 opacity-[0.02]">
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '50px 50px'
                  }}
                />
              </div>
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-adl-accent/5 rounded-full blur-[200px]" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[180px]" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col min-h-screen">
              
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center justify-between px-6 lg:px-12 py-6"
              >
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <motion.img
                    src="/adl-logo.png"
                    alt="Arthur D. Little"
                    className="h-10 md:h-12 object-contain"
                    animate={{
                      filter: [
                        "drop-shadow(0 0 10px rgba(6,182,212,0.2))",
                        "drop-shadow(0 0 20px rgba(6,182,212,0.3))",
                        "drop-shadow(0 0 10px rgba(6,182,212,0.2))",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>

                {/* Login Button */}
                <motion.button
                  onClick={() => setIsLoginOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-medium text-white",
                    "bg-adl-accent hover:bg-adl-blue-light",
                    "transition-all duration-200",
                    "shadow-lg shadow-adl-accent/20 hover:shadow-xl hover:shadow-adl-accent/30",
                    "flex items-center gap-2"
                  )}
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.header>

              {/* Hero Section */}
              <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 py-8">
                
                {/* Hero Content */}
                <div className="text-center max-w-4xl mx-auto mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                  >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                      Global Occupational{" "}
                      <span className="text-adl-accent">Health Intelligence</span>
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
                      Strategic insights and policy analysis for sovereign occupational 
                      health frameworks. Empowering evidence-based decisions across 196 nations.
                    </p>
                  </motion.div>

                  {/* Stats Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-wrap justify-center gap-6 mt-8"
                  >
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="flex items-center gap-3 px-5 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
                        >
                          <Icon className="w-5 h-5 text-adl-accent" />
                          <div className="text-left">
                            <p className="text-xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs text-white/50">{stat.label}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Framework Pillars Visual */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-10"
                  >
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-4">
                      ADL Occupational Health Framework
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
                      {frameworkPillars.map((pillar, index) => {
                        const Icon = pillar.icon;
                        return (
                          <motion.div
                            key={pillar.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <div className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10",
                              "bg-white/5 backdrop-blur-sm",
                              "hover:border-white/20 transition-all duration-300"
                            )}>
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                pillar.bgColor
                              )}>
                                <Icon className={cn("w-4 h-4", pillar.textColor)} />
                              </div>
                              <span className="text-sm font-medium text-white hidden sm:block">
                                {pillar.name}
                              </span>
                            </div>
                            {index < frameworkPillars.length - 1 && (
                              <ChevronRight className="w-4 h-4 text-white/20 hidden md:block" />
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* ADL OHI Score Display */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                    className="mt-8"
                  >
                    <div className="inline-flex flex-col items-center px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <img src="/adl-logo.png" alt="ADL" className="h-5 opacity-80" />
                        <span className="text-sm font-semibold text-white">OHI Score</span>
                      </div>
                      <div className="flex items-center gap-1 w-full max-w-xs">
                        <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-emerald-500 to-cyan-500" />
                      </div>
                      <div className="flex justify-between w-full max-w-xs mt-2 text-[10px] text-white/40">
                        <span>1.0 Critical</span>
                        <span>2.0 Developing</span>
                        <span>3.0 Advancing</span>
                        <span>4.0 Leading</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    className="mt-8"
                  >
                    <motion.button
                      onClick={() => setIsLoginOpen(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "px-8 py-4 rounded-xl font-semibold text-white text-lg",
                        "bg-adl-accent hover:bg-adl-blue-light",
                        "transition-all duration-200",
                        "shadow-xl shadow-adl-accent/30 hover:shadow-2xl hover:shadow-adl-accent/40",
                        "flex items-center gap-3 mx-auto"
                      )}
                    >
                      Access Platform
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </motion.div>

                  {/* Data Sources Strip */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.1 }}
                    className="mt-8"
                  >
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
                      Powered by Authoritative Data
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {dataSources.map((source, index) => (
                        <motion.div
                          key={source.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border backdrop-blur-sm",
                            "transition-all duration-300",
                            source.bgColor,
                            source.borderColor,
                            "hover:border-white/30"
                          )}
                        >
                          <span className={cn("text-xs font-medium", source.color)}>
                            {source.name}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Value Proposition Cards - 3 Tiles */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 1.3 }}
                  className="w-full max-w-5xl mx-auto mb-12"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {valueProps.map((prop, index) => {
                      const Icon = prop.icon;
                      return (
                        <motion.button
                          key={prop.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4 + index * 0.1 }}
                          whileHover={{ 
                            y: -6,
                            transition: { duration: 0.2 }
                          }}
                          onClick={() => handleFeatureClick(prop.id)}
                          className={cn(
                            "p-6 rounded-xl border backdrop-blur-sm text-left",
                            "bg-gradient-to-b from-white/5 to-transparent",
                            prop.borderColor,
                            "hover:border-white/30 transition-all duration-300",
                            "group cursor-pointer"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                            prop.bgColor
                          )}>
                            <Icon className={cn("w-6 h-6", prop.iconColor)} />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            {prop.title}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h3>
                          <p className="text-sm text-white/50 leading-relaxed">
                            {prop.description}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              </main>

              {/* Footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="py-6 px-6 lg:px-12 text-center"
              >
                <p className="text-white/30 text-sm">
                  &copy; {new Date().getFullYear()} Arthur D. Little. All rights reserved.
                </p>
              </motion.footer>
            </div>

            {/* Login Modal */}
            <LoginModal 
              isOpen={isLoginOpen} 
              onClose={() => setIsLoginOpen(false)} 
            />

            {/* Feature Detail Modal */}
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
