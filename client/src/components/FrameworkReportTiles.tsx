/**
 * Arthur D. Little - Global Health Platform
 * Framework Report Tiles Component
 * Displays 4 equal framework pillar tiles with report availability
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Crown,
  Shield,
  Eye,
  Heart,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getCountryTopicStatuses, type TopicStatus } from "../services/api";
import { FRAMEWORK_LAYERS } from "../data/frameworkLayers";
import { ReportListModal } from "./ReportListModal";
import { cn } from "../lib/utils";

interface FrameworkReportTilesProps {
  isoCode: string;
  countryName: string;
  className?: string;
}

// Framework pillar configuration with icons
const PILLAR_CONFIG = [
  {
    id: "governance",
    name: "Governance",
    description: "Ecosystem",
    icon: Crown,
    bgClass: "from-purple-500/15 to-purple-600/5",
    borderClass: "border-purple-500/30",
    iconBgClass: "bg-purple-500/20",
    iconColorClass: "text-purple-400",
    hoverBorder: "hover:border-purple-400/50",
  },
  {
    id: "hazard",
    name: "Hazard",
    description: "Prevention",
    icon: Shield,
    bgClass: "from-blue-500/15 to-blue-600/5",
    borderClass: "border-blue-500/30",
    iconBgClass: "bg-blue-500/20",
    iconColorClass: "text-blue-400",
    hoverBorder: "hover:border-blue-400/50",
  },
  {
    id: "vigilance",
    name: "Surveillance",
    description: "& Detection",
    icon: Eye,
    bgClass: "from-teal-500/15 to-teal-600/5",
    borderClass: "border-teal-500/30",
    iconBgClass: "bg-teal-500/20",
    iconColorClass: "text-teal-400",
    hoverBorder: "hover:border-teal-400/50",
  },
  {
    id: "restoration",
    name: "Restoration",
    description: "& Compensation",
    icon: Heart,
    bgClass: "from-amber-500/15 to-amber-600/5",
    borderClass: "border-amber-500/30",
    iconBgClass: "bg-amber-500/20",
    iconColorClass: "text-amber-400",
    hoverBorder: "hover:border-amber-400/50",
  },
];

export function FrameworkReportTiles({ isoCode, countryName, className = "" }: FrameworkReportTilesProps) {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  // Fetch topic statuses
  const { data: topicData, isLoading, isError } = useQuery({
    queryKey: ["country-topic-statuses", isoCode],
    queryFn: () => getCountryTopicStatuses(isoCode),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  // Create a map of topic name to status
  const topicStatusMap: Record<string, TopicStatus> = {};
  topicData?.topics?.forEach((topic) => {
    topicStatusMap[topic.topic] = topic;
  });

  // Count available reports per pillar
  const getReportCount = (pillarId: string): { available: number; total: number } => {
    const layer = FRAMEWORK_LAYERS.find(l => l.id === pillarId);
    if (!layer) return { available: 0, total: 3 };
    
    const available = layer.topics.filter(t => topicStatusMap[t.name]?.has_report).length;
    return { available, total: layer.topics.length };
  };

  // Get total available reports
  const totalAvailable = PILLAR_CONFIG.reduce((sum, pillar) => {
    return sum + getReportCount(pillar.id).available;
  }, 0);

  if (isLoading) {
    return (
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4", className)}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="ml-2 text-sm text-white/50">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4", className)}>
        <div className="flex items-center justify-center h-32">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          <span className="ml-2 text-sm text-white/50">Unable to load reports</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden", className)}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Deep Dive Reports</span>
            <span className="text-xs text-white/40 ml-auto">
              {totalAvailable} of 12 available
            </span>
          </div>
        </div>

        {/* 2x2 Grid of Pillar Tiles */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {PILLAR_CONFIG.map((pillar, index) => {
              const Icon = pillar.icon;
              const { available, total } = getReportCount(pillar.id);
              const hasReports = available > 0;

              return (
                <motion.button
                  key={pillar.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPillar(pillar.id)}
                  className={cn(
                    "relative bg-gradient-to-br rounded-lg p-3 border text-left",
                    "cursor-pointer transition-all duration-200",
                    "hover:scale-[1.02] hover:brightness-110",
                    "focus:outline-none focus:ring-2 focus:ring-white/20",
                    pillar.bgClass,
                    pillar.borderClass,
                    pillar.hoverBorder
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      pillar.iconBgClass
                    )}>
                      <Icon className={cn("w-4 h-4", pillar.iconColorClass)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {pillar.name}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {pillar.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Report Count Badge */}
                  <div className={cn(
                    "mt-2 text-[10px] font-medium px-2 py-0.5 rounded inline-flex items-center gap-1",
                    hasReports
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700/50 text-slate-500"
                  )}>
                    {hasReports ? (
                      <>
                        <FileText className="w-2.5 h-2.5" />
                        {available}/{total} reports
                      </>
                    ) : (
                      "No reports"
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Report List Modal */}
      {selectedPillar && (
        <ReportListModal
          isOpen={selectedPillar !== null}
          onClose={() => setSelectedPillar(null)}
          pillarId={selectedPillar}
          pillarConfig={PILLAR_CONFIG.find(p => p.id === selectedPillar)!}
          isoCode={isoCode}
          countryName={countryName}
          topicStatusMap={topicStatusMap}
        />
      )}
    </>
  );
}

export default FrameworkReportTiles;
