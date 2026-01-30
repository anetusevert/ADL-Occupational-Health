/**
 * Arthur D. Little - Global Health Platform
 * Professional Corporate Login Interface
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";

export function Login() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-adl-gradient flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        {/* Accent glow */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-adl-accent/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-adl-blue-light/10 rounded-full blur-[100px]" />

        {/* Logo - Premium ADL Logo with glow effect */}
        <motion.div 
          initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10"
        >
          <div className="flex flex-col">
            <motion.img 
              src="/adl-logo.png" 
              alt="Arthur D. Little"
              className="h-16 object-contain object-left"
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(6,182,212,0.2))",
                  "drop-shadow(0 0 35px rgba(6,182,212,0.4))",
                  "drop-shadow(0 0 20px rgba(6,182,212,0.2))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-adl-accent text-sm font-medium mt-3 tracking-wide"
            >
              Management Consulting
            </motion.p>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Global Occupational
            <br />
            <span className="text-adl-accent">Health Intelligence</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Strategic insights and policy simulation for sovereign occupational health frameworks.
            Powered by the Sovereign OH Integrity Framework v3.0.
          </p>
          
          {/* Feature highlights */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: "Countries", value: "195+", desc: "Global Coverage" },
              { label: "Framework Pillars", value: "4", desc: "OH Assessment" },
              { label: "Key Metrics", value: "50+", desc: "Data Points" },
              { label: "Data Sources", value: "WB, ILO", desc: "WHO & More" },
              { label: "Deep Dive", value: "AI", desc: "Strategic Reports" },
              { label: "Comparisons", value: "Live", desc: "Country Rankings" },
            ].map((item, index) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.08 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-300"
              >
                <p className="text-xl font-bold text-white">{item.value}</p>
                <p className="text-adl-accent text-xs font-medium">{item.label}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10"
        >
          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} Arthur D. Little. All rights reserved.
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-8 bg-adl-navy-dark/50 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo - Premium animated display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:hidden text-center mb-10"
          >
            <motion.img 
              src="/adl-logo.png" 
              alt="Arthur D. Little"
              className="h-14 object-contain mx-auto mb-3"
              animate={{
                filter: [
                  "drop-shadow(0 0 15px rgba(6,182,212,0.2))",
                  "drop-shadow(0 0 25px rgba(6,182,212,0.4))",
                  "drop-shadow(0 0 15px rgba(6,182,212,0.2))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-adl-accent text-sm tracking-wide"
            >
              Global Health Intelligence
            </motion.p>
          </motion.div>

          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-adl-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-adl-accent/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-adl-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
                <p className="text-white/40 text-sm">Sign in to continue</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className={cn(
                      "w-full pl-12 pr-4 py-3.5 bg-white/5 border rounded-xl",
                      "text-white placeholder-white/30",
                      "focus:outline-none focus:ring-2 focus:ring-adl-accent/50 focus:border-adl-accent/50",
                      "transition-all duration-200",
                      error ? "border-red-500/50" : "border-white/10"
                    )}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={cn(
                      "w-full pl-12 pr-12 py-3.5 bg-white/5 border rounded-xl",
                      "text-white placeholder-white/30",
                      "focus:outline-none focus:ring-2 focus:ring-adl-accent/50 focus:border-adl-accent/50",
                      "transition-all duration-200",
                      error ? "border-red-500/50" : "border-white/10"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-3.5 px-4 rounded-xl font-semibold text-white",
                  "bg-adl-accent hover:bg-adl-blue-light",
                  "focus:outline-none focus:ring-2 focus:ring-adl-accent/50",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "shadow-adl hover:shadow-adl-lg",
                  "flex items-center justify-center gap-2"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-white/30">
                Sovereign OH Integrity Framework v3.0
              </p>
              <p className="text-xs text-white/20 mt-1">
                Authorized personnel only
              </p>
            </div>
          </div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Secure Connection</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;
