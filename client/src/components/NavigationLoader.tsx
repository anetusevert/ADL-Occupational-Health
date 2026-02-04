/**
 * Arthur D. Little - Global Health Platform
 * Navigation Loader Component
 * Professional animated loader with route-specific icons
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Layers,
  Target,
  Brain,
  Trophy,
  GitCompare,
  Database,
  Users,
  Cpu,
  Bot,
  Globe,
  type LucideIcon,
} from "lucide-react";

interface NavigationLoaderProps {
  isLoading: boolean;
  targetPath: string;
  pageName?: string;
}

// Map routes to their icons and labels
const routeConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  "/home": { icon: Map, label: "Global", color: "text-adl-accent" },
  "/framework": { icon: Layers, label: "Framework", color: "text-purple-400" },
  "/deep-dive": { icon: Brain, label: "Best Practices Compendium", color: "text-cyan-400" },
  "/compare": { icon: GitCompare, label: "Compare", color: "text-emerald-400" },
  "/leaderboard": { icon: Trophy, label: "Leaderboard", color: "text-amber-400" },
  "/simulator": { icon: Target, label: "Policy Simulator", color: "text-rose-400" },
  "/admin/data-engine": { icon: Database, label: "Data Engine", color: "text-blue-400" },
  "/admin/agent-prompts": { icon: Bot, label: "Agent Prompts", color: "text-purple-400" },
  "/admin/users": { icon: Users, label: "User Management", color: "text-orange-400" },
  "/admin/ai-config": { icon: Cpu, label: "AI Configuration", color: "text-green-400" },
};

// Get route config, with fallback for dynamic routes
function getRouteConfig(path: string) {
  // Direct match
  if (routeConfig[path]) {
    return routeConfig[path];
  }
  
  // Check for country profile route
  if (path.startsWith("/country/")) {
    return { icon: Globe, label: "Country Profile", color: "text-teal-400" };
  }
  
  // Default fallback
  return { icon: Layers, label: "Loading", color: "text-adl-accent" };
}

export function NavigationLoader({ isLoading, targetPath, pageName }: NavigationLoaderProps) {
  const config = getRouteConfig(targetPath);
  const Icon = config.icon;
  const displayLabel = pageName || config.label;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-adl-navy-dark/95 backdrop-blur-xl flex items-center justify-center"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          {/* Animated Glow Effects */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-adl-accent/10 blur-[100px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Main Loader Container */}
          <div className="relative flex flex-col items-center gap-8">
            {/* ADL Logo with Premium Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              {/* Multiple Orbiting Rings */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-adl-accent/20"
                  style={{
                    inset: `-${i * 12}px`,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3 / i, 0.6 / i, 0.3 / i],
                    rotate: i % 2 === 0 ? [0, 360] : [360, 0],
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
                    rotate: { duration: 15 + i * 5, repeat: Infinity, ease: "linear" },
                  }}
                />
              ))}
              
              {/* Floating Particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                    style={{
                      left: "50%",
                      top: "50%",
                    }}
                    animate={{
                      x: [0, Math.cos(i * 45 * Math.PI / 180) * 60],
                      y: [0, Math.sin(i * 45 * Math.PI / 180) * 60],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
              
              {/* Logo with Premium Glow */}
              <motion.img 
                src="/adl-logo.png" 
                alt="Arthur D. Little" 
                className="h-24 object-contain relative z-10"
                animate={{
                  filter: [
                    "drop-shadow(0 0 25px rgba(6,182,212,0.3))",
                    "drop-shadow(0 0 45px rgba(6,182,212,0.5))",
                    "drop-shadow(0 0 25px rgba(6,182,212,0.3))",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Route Icon with Animation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Animated Icon Container */}
              <motion.div
                className={`w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${config.color}`}
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Icon className="w-7 h-7" />
              </motion.div>

              {/* Page Label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <p className="text-white font-medium text-lg tracking-tight">
                  {displayLabel}
                </p>
                <p className="text-white/40 text-sm mt-1">Loading...</p>
              </motion.div>
            </motion.div>

            {/* Loading Progress Indicator */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="h-1 bg-white/10 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-adl-accent via-adl-blue-light to-adl-accent rounded-full"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ width: "50%" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NavigationLoader;
