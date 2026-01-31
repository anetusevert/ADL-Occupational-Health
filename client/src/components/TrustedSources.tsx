/**
 * Arthur D. Little - Trusted Sources Component
 * Displays data source logos to build credibility and trust
 * 
 * Sources: ILO, WHO, World Bank, UNDP, Transparency International, 
 *          Yale EPI, IHME, World Justice Project, OECD
 */

import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface DataSource {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  url: string;
}

const dataSources: DataSource[] = [
  {
    id: "ilo",
    name: "International Labour Organization",
    shortName: "ILO",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    url: "https://ilostat.ilo.org",
  },
  {
    id: "who",
    name: "World Health Organization",
    shortName: "WHO",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    url: "https://www.who.int/data/gho",
  },
  {
    id: "worldbank",
    name: "World Bank",
    shortName: "World Bank",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    url: "https://data.worldbank.org",
  },
  {
    id: "undp",
    name: "UN Development Programme",
    shortName: "UNDP",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    url: "https://hdr.undp.org",
  },
  {
    id: "transparency",
    name: "Transparency International",
    shortName: "TI",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    url: "https://www.transparency.org",
  },
  {
    id: "yale-epi",
    name: "Yale Environmental Performance",
    shortName: "Yale EPI",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    url: "https://epi.yale.edu",
  },
  {
    id: "ihme",
    name: "Institute for Health Metrics",
    shortName: "IHME",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    url: "https://www.healthdata.org",
  },
  {
    id: "wjp",
    name: "World Justice Project",
    shortName: "WJP",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    url: "https://worldjusticeproject.org",
  },
  {
    id: "oecd",
    name: "OECD",
    shortName: "OECD",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    url: "https://data.oecd.org",
  },
];

interface TrustedSourcesProps {
  className?: string;
  animate?: boolean;
  compact?: boolean;
}

export function TrustedSources({ 
  className, 
  animate = true,
  compact = false 
}: TrustedSourcesProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <motion.div
        initial={animate ? { opacity: 0, y: 10 } : {}}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <p className="text-white/40 text-xs uppercase tracking-widest font-medium">
          Powered by Authoritative Global Data
        </p>
      </motion.div>

      {/* Sources Grid */}
      <motion.div
        initial={animate ? { opacity: 0 } : {}}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={cn(
          "flex flex-wrap justify-center gap-3",
          compact ? "gap-2" : "gap-3"
        )}
      >
        {dataSources.map((source, index) => (
          <motion.div
            key={source.id}
            initial={animate ? { opacity: 0, scale: 0.9 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.4, 
              delay: animate ? 0.3 + index * 0.05 : 0 
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            className={cn(
              "group relative px-4 py-2 rounded-lg border backdrop-blur-sm",
              "transition-all duration-300 cursor-default",
              source.bgColor,
              source.borderColor,
              "hover:border-white/30"
            )}
          >
            <span className={cn(
              "text-sm font-medium transition-colors duration-300",
              source.color,
              "group-hover:text-white"
            )}>
              {source.shortName}
            </span>
            
            {/* Tooltip on hover */}
            <div className={cn(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5",
              "bg-white/10 backdrop-blur-md border border-white/10 rounded-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "pointer-events-none whitespace-nowrap z-10"
            )}>
              <span className="text-xs text-white/80">{source.name}</span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-white/10" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Subtle divider line */}
      <motion.div
        initial={animate ? { scaleX: 0 } : {}}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
    </div>
  );
}

export default TrustedSources;
