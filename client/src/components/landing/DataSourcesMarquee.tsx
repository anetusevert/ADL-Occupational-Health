/**
 * Arthur D. Little - Data Sources Marquee
 * Single row of clickable organization logos with real images
 * Designed for no-scroll landing page
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

// Data sources with real Wikipedia logos
const dataSources = [
  {
    id: "worldbank",
    name: "World Bank",
    desc: "Economic data",
    url: "https://data.worldbank.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/87/The_World_Bank_logo.svg",
  },
  {
    id: "ilo",
    name: "ILO",
    desc: "Labor statistics",
    url: "https://ilostat.ilo.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/5/59/International_Labour_Organization_logo.svg",
  },
  {
    id: "who",
    name: "WHO",
    desc: "Health metrics",
    url: "https://www.who.int/data/gho",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c2/WHO_logo.svg",
  },
  {
    id: "oecd",
    name: "OECD",
    desc: "Policy data",
    url: "https://data.oecd.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/ff/OECD_logo_new.svg",
  },
  {
    id: "undp",
    name: "UNDP",
    desc: "Development",
    url: "https://hdr.undp.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a0/UNDP_logo.svg",
  },
  {
    id: "transparency",
    name: "Transparency Intl",
    desc: "Corruption data",
    url: "https://www.transparency.org",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/a/a2/Transparency_International_logo.svg",
  },
];

interface DataSourcesMarqueeProps {
  className?: string;
  delay?: number;
}

export function DataSourcesMarquee({ className, delay = 0 }: DataSourcesMarqueeProps) {
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
      <p className="text-center text-[8px] text-white/25 uppercase tracking-[0.2em] mb-3">
        Powered by Global Data Sources
      </p>

      {/* Single row of logos */}
      <div className="flex justify-center items-center gap-4 flex-wrap">
        {dataSources.map((source, index) => (
          <motion.a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.03 * index }}
            whileHover={{ scale: 1.05 }}
            className="group flex flex-col items-center gap-1 cursor-pointer"
          >
            {/* Logo Container */}
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all duration-200">
              {!failedLogos.has(source.id) ? (
                <img
                  src={source.logoUrl}
                  alt={source.name}
                  className="w-6 h-6 object-contain filter brightness-0 invert opacity-50 group-hover:opacity-90 transition-opacity"
                  onError={() => handleLogoError(source.id)}
                />
              ) : (
                <span className="text-[10px] font-bold text-white/50 group-hover:text-white/80">
                  {source.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {/* Name */}
            <span className="text-[9px] text-white/40 group-hover:text-white/70 transition-colors text-center">
              {source.name}
            </span>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}

export default DataSourcesMarquee;
