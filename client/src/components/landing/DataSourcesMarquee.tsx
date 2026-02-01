/**
 * Arthur D. Little - Data Sources Marquee
 * Premium scrolling display of authoritative data sources with logos
 * Grayscale by default, color on hover
 */

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "../../lib/utils";

// All data sources used in the platform
const dataSources = [
  {
    id: "worldbank",
    name: "World Bank",
    shortName: "World Bank",
    description: "GDP, governance indicators, economic data",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    url: "https://data.worldbank.org",
  },
  {
    id: "ilo",
    name: "International Labour Organization",
    shortName: "ILO",
    description: "Labor statistics, conventions, inspector data",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    url: "https://ilostat.ilo.org",
  },
  {
    id: "who",
    name: "World Health Organization",
    shortName: "WHO",
    description: "Health metrics, UHC coverage, life expectancy",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    url: "https://www.who.int/data/gho",
  },
  {
    id: "oecd",
    name: "Organisation for Economic Co-operation and Development",
    shortName: "OECD",
    description: "Policy data, work-life balance, claim times",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    url: "https://data.oecd.org",
  },
  {
    id: "undp",
    name: "UN Development Programme",
    shortName: "UNDP",
    description: "Human Development Index",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    url: "https://hdr.undp.org",
  },
  {
    id: "transparency",
    name: "Transparency International",
    shortName: "TI",
    description: "Corruption Perception Index",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    url: "https://www.transparency.org",
  },
  {
    id: "yale",
    name: "Yale Environmental Performance Index",
    shortName: "Yale EPI",
    description: "Environmental performance, air quality",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    url: "https://epi.yale.edu",
  },
  {
    id: "ihme",
    name: "Institute for Health Metrics and Evaluation",
    shortName: "IHME",
    description: "Global Burden of Disease, occupational DALYs",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    url: "https://www.healthdata.org",
  },
  {
    id: "wjp",
    name: "World Justice Project",
    shortName: "WJP",
    description: "Rule of Law Index",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    url: "https://worldjusticeproject.org",
  },
];

interface DataSourcesMarqueeProps {
  className?: string;
  delay?: number;
}

export function DataSourcesMarquee({ className, delay = 0 }: DataSourcesMarqueeProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      className={cn("w-full overflow-hidden", className)}
    >
      {/* Header */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1 }}
        className="text-center text-[10px] text-white/30 uppercase tracking-[0.2em] mb-4"
      >
        Powered by Authoritative Global Data
      </motion.p>

      {/* Source badges - Two rows */}
      <div className="space-y-3">
        {/* Row 1 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {dataSources.slice(0, 5).map((source, index) => (
            <SourceBadge
              key={source.id}
              source={source}
              index={index}
              delay={delay + 0.3}
              isHovered={hoveredId === source.id}
              onHover={() => setHoveredId(source.id)}
              onLeave={() => setHoveredId(null)}
            />
          ))}
        </motion.div>

        {/* Row 2 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {dataSources.slice(5).map((source, index) => (
            <SourceBadge
              key={source.id}
              source={source}
              index={index + 5}
              delay={delay + 0.5}
              isHovered={hoveredId === source.id}
              onHover={() => setHoveredId(source.id)}
              onLeave={() => setHoveredId(null)}
            />
          ))}
        </motion.div>
      </div>

      {/* Subtle divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.6 }}
        className="mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto max-w-lg"
      />
    </motion.div>
  );
}

interface SourceBadgeProps {
  source: (typeof dataSources)[0];
  index: number;
  delay: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function SourceBadge({ source, index, delay, isHovered, onHover, onLeave }: SourceBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="relative group"
    >
      <div
        className={cn(
          "px-3 py-1.5 rounded-lg border backdrop-blur-sm cursor-default",
          "transition-all duration-300",
          isHovered ? source.bgColor : "bg-white/[0.02]",
          isHovered ? source.borderColor : "border-white/10",
          "hover:border-white/20"
        )}
      >
        <span
          className={cn(
            "text-xs font-medium transition-colors duration-300",
            isHovered ? source.color : "text-white/50"
          )}
        >
          {source.shortName}
        </span>
      </div>

      {/* Tooltip */}
      <div
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 min-w-48",
          "bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-lg",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "pointer-events-none z-20 shadow-xl"
        )}
      >
        <p className="text-xs font-medium text-white mb-0.5">{source.name}</p>
        <p className="text-[10px] text-white/50">{source.description}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-slate-800/95" />
        </div>
      </div>
    </motion.div>
  );
}

export default DataSourcesMarquee;
