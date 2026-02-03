/**
 * Comparison Loader Component
 * 
 * Animated loading screen shown while generating AI comparison report.
 * Features rotating country flags and progress animation.
 */

import { motion } from "framer-motion";
import { Loader2, Sparkles, Brain } from "lucide-react";
import { cn, getApiBaseUrl, getCountryFlag } from "../../lib/utils";

interface ComparisonLoaderProps {
  primaryIso: string;
  primaryName: string;
  comparisonIso: string;
  comparisonName: string;
  primaryFlagUrl?: string;
  comparisonFlagUrl?: string;
}

export function ComparisonLoader({
  primaryIso,
  primaryName,
  comparisonIso,
  comparisonName,
  primaryFlagUrl,
  comparisonFlagUrl,
}: ComparisonLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center"
    >
      <div className="flex flex-col items-center max-w-lg mx-auto px-6">
        {/* Animated Flags */}
        <div className="flex items-center gap-8 mb-8">
          {/* Primary Country Flag */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(16, 185, 129, 0.3)",
                  "0 0 40px rgba(16, 185, 129, 0.5)",
                  "0 0 20px rgba(16, 185, 129, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-16 rounded-xl overflow-hidden border-2 border-emerald-500/50"
            >
              {primaryFlagUrl ? (
                <img
                  src={`${getApiBaseUrl()}${primaryFlagUrl}`}
                  alt={primaryName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl">
                  {getCountryFlag(primaryIso)}
                </div>
              )}
            </motion.div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-emerald-400 font-medium whitespace-nowrap">
              {primaryName}
            </span>
          </motion.div>

          {/* VS Indicator */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-purple-400/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Comparison Country Flag */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="relative"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 20px rgba(139, 92, 246, 0.3)",
                  "0 0 40px rgba(139, 92, 246, 0.5)",
                  "0 0 20px rgba(139, 92, 246, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="w-24 h-16 rounded-xl overflow-hidden border-2 border-purple-500/50"
            >
              {comparisonFlagUrl ? (
                <img
                  src={`${getApiBaseUrl()}${comparisonFlagUrl}`}
                  alt={comparisonName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl">
                  {getCountryFlag(comparisonIso)}
                </div>
              )}
            </motion.div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-purple-400 font-medium whitespace-nowrap">
              {comparisonName}
            </span>
          </motion.div>
        </div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mt-8 mb-4 text-center"
        >
          Preparing Comparison Report
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 text-center mb-8"
        >
          Our AI analyst is conducting a deep comparative analysis...
        </motion.p>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 w-full max-w-sm"
        >
          {[
            "Analyzing framework metrics",
            "Comparing socioeconomic indicators",
            "Identifying strategic gaps",
            "Generating recommendations",
          ].map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.15 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
                className="w-2 h-2 rounded-full bg-purple-400"
              />
              <span className="text-sm text-slate-300">{step}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Loading Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center gap-2 text-purple-400"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">This may take 30-60 seconds...</span>
        </motion.div>

        {/* Sparkles decoration */}
        <motion.div
          className="absolute top-1/4 left-1/4"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-8 h-8 text-purple-400/30" />
        </motion.div>
        <motion.div
          className="absolute bottom-1/4 right-1/4"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        >
          <Sparkles className="w-6 h-6 text-emerald-400/30" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ComparisonLoader;
