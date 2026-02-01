/**
 * Arthur D. Little - Data Sources with Real Logos
 * Displays authoritative data sources with organization logos
 * Clickable links to source websites
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

// All data sources with Wikipedia/official logo URLs
const DATA_SOURCES = [
  {
    id: "worldbank",
    name: "World Bank",
    shortDesc: "Economic data",
    url: "https://data.worldbank.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/87/The_World_Bank_logo.svg",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "ilo",
    name: "ILO",
    shortDesc: "Labor statistics",
    url: "https://ilostat.ilo.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/59/International_Labour_Organization_logo.svg",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "who",
    name: "WHO",
    shortDesc: "Health metrics",
    url: "https://www.who.int/data/gho",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c2/WHO_logo.svg",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "oecd",
    name: "OECD",
    shortDesc: "Policy data",
    url: "https://data.oecd.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/ff/OECD_logo_new.svg",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "undp",
    name: "UNDP",
    shortDesc: "Development",
    url: "https://hdr.undp.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/UNDP_logo.svg",
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    id: "transparency",
    name: "Transparency Intl",
    shortDesc: "Corruption data",
    url: "https://www.transparency.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/a2/Transparency_International_logo.svg",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
  },
];

interface DataSourcesLogosProps {
  className?: string;
  delay?: number;
  compact?: boolean;
}

export function DataSourcesLogos({ className, delay = 0, compact = false }: DataSourcesLogosProps) {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const handleLogoError = (id: string) => {
    setFailedLogos((prev) => new Set(prev).add(id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className={cn("w-full", className)}
    >
      {/* Header */}
      <p className="text-center text-[9px] text-white/30 uppercase tracking-[0.15em] mb-3">
        Powered by Global Data Sources
      </p>

      {/* Logo Grid */}
      <div className={cn(
        "flex flex-wrap justify-center",
        compact ? "gap-3" : "gap-4"
      )}>
        {DATA_SOURCES.map((source, index) => (
          <motion.a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.05 + index * 0.03 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className={cn(
              "group flex flex-col items-center p-2 rounded-lg",
              "bg-white/[0.02] border border-white/5",
              "hover:bg-white/[0.05] hover:border-white/15",
              "transition-all duration-200 cursor-pointer",
              compact ? "min-w-[60px]" : "min-w-[70px]"
            )}
          >
            {/* Logo or Fallback */}
            <div className={cn(
              "flex items-center justify-center mb-1",
              compact ? "w-8 h-8" : "w-10 h-10"
            )}>
              {!failedLogos.has(source.id) ? (
                <img
                  src={source.logoUrl}
                  alt={source.name}
                  className={cn(
                    "object-contain filter brightness-0 invert opacity-60",
                    "group-hover:opacity-100 transition-opacity",
                    compact ? "max-h-6 max-w-6" : "max-h-8 max-w-8"
                  )}
                  onError={() => handleLogoError(source.id)}
                />
              ) : (
                <div className={cn(
                  "flex items-center justify-center rounded-md",
                  source.bgColor,
                  compact ? "w-6 h-6" : "w-8 h-8"
                )}>
                  <span className={cn("text-[10px] font-bold", source.color)}>
                    {source.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Name */}
            <span className={cn(
              "font-medium text-white/60 group-hover:text-white/90 transition-colors text-center leading-tight",
              compact ? "text-[8px]" : "text-[9px]"
            )}>
              {source.name}
            </span>

            {/* Short description */}
            {!compact && (
              <span className="text-[7px] text-white/30 group-hover:text-white/50 transition-colors mt-0.5 flex items-center gap-0.5">
                {source.shortDesc}
                <ExternalLink className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            )}
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}

export { DATA_SOURCES };
export default DataSourcesLogos;
