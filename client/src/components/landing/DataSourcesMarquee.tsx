/**
 * Arthur D. Little - Data Sources Marquee
 * Simple text-based row of data sources
 * No logos, no icons - just names and data types
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

// Data sources - name and data type only
const dataSources = [
  { id: "worldbank", name: "World Bank", dataType: "Economic", url: "https://data.worldbank.org" },
  { id: "ilo", name: "ILO", dataType: "Labor", url: "https://ilostat.ilo.org" },
  { id: "who", name: "WHO", dataType: "Health", url: "https://www.who.int/data/gho" },
  { id: "oecd", name: "OECD", dataType: "Policy", url: "https://data.oecd.org" },
  { id: "undp", name: "UNDP", dataType: "Development", url: "https://hdr.undp.org" },
  { id: "ti", name: "Transparency Intl", dataType: "Governance", url: "https://www.transparency.org" },
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
      <p className="text-center text-[8px] text-white/25 uppercase tracking-[0.2em] mb-2">
        Powered by Global Data Sources
      </p>

      {/* Single row of text sources - no wrap */}
      <div className="flex justify-center items-center gap-3 overflow-x-auto">
        {dataSources.map((source, index) => (
          <motion.a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.02 * index }}
            className="flex-shrink-0 text-center hover:opacity-100 transition-opacity cursor-pointer"
          >
            <p className="text-[10px] font-medium text-white/60 hover:text-white transition-colors">
              {source.name}
            </p>
            <p className="text-[8px] text-white/30">
              {source.dataType}
            </p>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}

export default DataSourcesMarquee;
