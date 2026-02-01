/**
 * Arthur D. Little - Data Sources Marquee
 * Compact single-row display of authoritative data sources
 * Designed for no-scroll landing page
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

// Core data sources - show primary 5 on mobile, all on desktop
const dataSources = [
  { id: "worldbank", shortName: "World Bank", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  { id: "ilo", shortName: "ILO", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "who", shortName: "WHO", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { id: "oecd", shortName: "OECD", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { id: "undp", shortName: "UNDP", color: "text-sky-400", bgColor: "bg-sky-500/10" },
  { id: "transparency", shortName: "TI", color: "text-rose-400", bgColor: "bg-rose-500/10" },
  { id: "yale", shortName: "Yale", color: "text-green-400", bgColor: "bg-green-500/10" },
  { id: "ihme", shortName: "IHME", color: "text-purple-400", bgColor: "bg-purple-500/10" },
];

interface DataSourcesMarqueeProps {
  className?: string;
  delay?: number;
}

export function DataSourcesMarquee({ className, delay = 0 }: DataSourcesMarqueeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("w-full", className)}
    >
      {/* Header */}
      <p className="text-center text-[9px] text-white/30 uppercase tracking-[0.15em] mb-2">
        Powered by Global Data
      </p>

      {/* Single row of badges */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {dataSources.map((source, index) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.05 + index * 0.03 }}
            className={cn(
              "px-2 py-1 rounded-md border border-white/10 backdrop-blur-sm",
              "transition-all duration-200 hover:border-white/20",
              source.bgColor,
              // Hide extra sources on mobile
              index >= 5 && "hidden sm:block"
            )}
          >
            <span className={cn("text-[10px] font-medium", source.color)}>
              {source.shortName}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default DataSourcesMarquee;
