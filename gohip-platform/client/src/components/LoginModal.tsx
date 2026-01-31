/**
 * Arthur D. Little - Login Modal Component
 * Professional modal overlay for authentication
 * Extracted from Login.tsx for use in landing page
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
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
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
      // Auth context will handle redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-md"
          >
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-adl-accent/10 blur-[60px] rounded-3xl" />
            
            {/* Card */}
            <div className="relative bg-adl-navy-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-adl-accent/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-adl-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Welcome</h2>
                  <p className="text-white/40 text-sm">Sign in to access the platform</p>
                </div>
              </div>

              {/* Form */}
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
                    "shadow-lg shadow-adl-accent/20 hover:shadow-xl hover:shadow-adl-accent/30",
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
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Secure Connection</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;
