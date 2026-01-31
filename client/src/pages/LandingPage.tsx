/**
 * Arthur D. Little - Landing Page
 * Professional entry point for the Global Occupational Health Platform
 * 
 * Features:
 * - Cinematic entrance animation
 * - Hero section with ADL branding
 * - Value proposition cards
 * - Trusted data sources display
 * - Login modal integration
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe2, 
  BarChart3, 
  Layers, 
  TrendingUp,
  ArrowRight,
  MapPin,
  Shield,
  Activity
} from "lucide-react";
import { LandingEntrance } from "../components/LandingEntrance";
import { TrustedSources } from "../components/TrustedSources";
import { LoginModal } from "../components/LoginModal";
import { cn } from "../lib/utils";

// Value proposition cards configuration
const valueProps = [
  {
    icon: Layers,
    title: "Framework Analysis",
    description: "Comprehensive assessment across governance, prevention, vigilance, and restoration pillars.",
    color: "purple",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Globe2,
    title: "Country Profiles",
    description: "In-depth occupational health intelligence for 196 nations worldwide.",
    color: "blue",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: TrendingUp,
    title: "Policy Simulation",
    description: "Model intervention scenarios and forecast their impact on health outcomes.",
    color: "emerald",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: BarChart3,
    title: "Strategic Insights",
    description: "Evidence-based recommendations for policy development and resource allocation.",
    color: "amber",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
];

// Key stats for credibility
const stats = [
  { value: "196", label: "Countries", icon: MapPin },
  { value: "50+", label: "Key Metrics", icon: Activity },
  { value: "4", label: "Framework Pillars", icon: Shield },
];

export function LandingPage() {
  const [showEntrance, setShowEntrance] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

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
              <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 py-12">
                
                {/* Hero Content */}
                <div className="text-center max-w-4xl mx-auto mb-16">
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
                    className="flex flex-wrap justify-center gap-6 mt-10"
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

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-10"
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
                </div>

                {/* Value Proposition Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                  className="w-full max-w-6xl mx-auto mb-16"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {valueProps.map((prop, index) => {
                      const Icon = prop.icon;
                      return (
                        <motion.div
                          key={prop.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          whileHover={{ 
                            y: -4,
                            transition: { duration: 0.2 }
                          }}
                          className={cn(
                            "p-6 rounded-xl border backdrop-blur-sm",
                            "bg-gradient-to-b from-white/5 to-transparent",
                            prop.borderColor,
                            "hover:border-white/20 transition-all duration-300"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                            prop.bgColor
                          )}>
                            <Icon className={cn("w-6 h-6", prop.iconColor)} />
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {prop.title}
                          </h3>
                          <p className="text-sm text-white/50 leading-relaxed">
                            {prop.description}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Trusted Sources */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="w-full max-w-4xl mx-auto"
                >
                  <TrustedSources animate={true} />
                </motion.div>
              </main>

              {/* Footer */}
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;
