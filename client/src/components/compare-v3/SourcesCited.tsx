/**
 * Sources Cited Component
 * 
 * Displays the data sources used in the comparison report.
 */

import { motion } from "framer-motion";
import { Database, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

interface SourcesCitedProps {
  sources: string[];
}

// Map sources to their official URLs
const sourceUrls: Record<string, string> = {
  "World Bank": "https://data.worldbank.org",
  "ILO": "https://ilostat.ilo.org",
  "ILOSTAT": "https://ilostat.ilo.org",
  "WHO": "https://www.who.int/data",
  "UNDP": "https://hdr.undp.org",
  "OECD": "https://data.oecd.org",
  "Yale EPI": "https://epi.yale.edu",
  "Transparency International": "https://www.transparency.org",
  "World Justice Project": "https://worldjusticeproject.org",
  "IHME": "https://www.healthdata.org",
};

function getSourceUrl(source: string): string | null {
  for (const [key, url] of Object.entries(sourceUrls)) {
    if (source.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }
  return null;
}

export function SourcesCited({ sources }: SourcesCitedProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Data Sources</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => {
          const url = getSourceUrl(source);
          
          return (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                "bg-slate-700/50 text-xs text-slate-300",
                url && "hover:bg-slate-700 cursor-pointer transition-colors"
              )}
              onClick={() => url && window.open(url, "_blank")}
            >
              {source}
              {url && <ExternalLink className="w-3 h-3 text-slate-500" />}
            </motion.span>
          );
        })}
      </div>
    </motion.div>
  );
}

export default SourcesCited;
