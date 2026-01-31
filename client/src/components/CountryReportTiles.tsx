/**
 * Arthur D. Little - Global Health Platform
 * Country Report Tiles Component
 * Displays available deep dive reports as interactive tiles
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Minus,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getCountryTopicStatuses, type TopicStatus } from "../services/api";
import { FRAMEWORK_LAYERS, COMPREHENSIVE_TOPIC } from "../data/frameworkLayers";
import { ReportViewerModal } from "./ReportViewerModal";
import { cn } from "../lib/utils";

interface CountryReportTilesProps {
  isoCode: string;
  countryName: string;
}

export function CountryReportTiles({ isoCode, countryName }: CountryReportTilesProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

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

  // Count available reports
  const availableReports = topicData?.topics?.filter(t => t.has_report).length || 0;
  const totalTopics = 13;

  // Toggle layer expansion
  const toggleLayer = (layerId: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Handle tile click
  const handleTileClick = (topicName: string) => {
    const status = topicStatusMap[topicName];
    if (status?.has_report) {
      setSelectedTopic(topicName);
    }
  };

  // Get comprehensive status
  const comprehensiveStatus = topicStatusMap[COMPREHENSIVE_TOPIC.name];

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Unable to load reports</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Deep Dive Reports</h2>
              <p className="text-[10px] text-white/40">
                {availableReports} of {totalTopics} reports available
              </p>
            </div>
          </div>
        </div>

        {/* Comprehensive Assessment Tile */}
        <button
          onClick={() => handleTileClick(COMPREHENSIVE_TOPIC.name)}
          disabled={!comprehensiveStatus?.has_report}
          className={cn(
            "w-full p-3 rounded-lg border transition-all duration-200 mb-3",
            comprehensiveStatus?.has_report
              ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/40 hover:border-purple-400/60 cursor-pointer"
              : "bg-slate-800/30 border-slate-700/30 opacity-60 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              comprehensiveStatus?.has_report ? "bg-purple-500/30" : "bg-slate-700/30"
            )}>
              <Sparkles className={cn(
                "w-4 h-4",
                comprehensiveStatus?.has_report ? "text-purple-300" : "text-slate-500"
              )} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium",
                  comprehensiveStatus?.has_report ? "text-white" : "text-slate-400"
                )}>
                  Comprehensive Assessment
                </span>
                {comprehensiveStatus?.has_report ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Minus className="w-3 h-3 text-slate-500" />
                )}
              </div>
              <p className="text-[10px] text-slate-500">Full analysis of all framework pillars</p>
            </div>
          </div>
        </button>

        {/* Framework Layers */}
        <div className="space-y-2">
          {FRAMEWORK_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isExpanded = expandedLayers.has(layer.id);
            
            // Count available reports for this layer
            const layerAvailable = layer.topics.filter(
              t => topicStatusMap[t.name]?.has_report
            ).length;

            return (
              <div key={layer.id}>
                {/* Layer Header */}
                <button
                  onClick={() => toggleLayer(layer.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-200",
                    isExpanded
                      ? `${layer.bgClass} ${layer.borderClass}`
                      : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
                  )}
                >
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center", layer.iconBgClass)}>
                    <Icon className={cn("w-3 h-3", layer.iconColorClass)} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-[11px] font-medium text-white">{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {layerAvailable > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        {layerAvailable}/3
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expandable Topics */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 pt-1.5 space-y-1">
                        {layer.topics.map((topic) => {
                          const status = topicStatusMap[topic.name];
                          const hasReport = status?.has_report;

                          return (
                            <button
                              key={topic.id}
                              onClick={() => handleTileClick(topic.name)}
                              disabled={!hasReport}
                              className={cn(
                                "w-full text-left p-2 rounded-lg border transition-all duration-200",
                                hasReport
                                  ? `${layer.bgClass} ${layer.borderClass} hover:brightness-110 cursor-pointer`
                                  : "bg-slate-800/20 border-slate-700/20 opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                  hasReport 
                                    ? layer.iconColorClass.replace('text-', 'bg-') 
                                    : "bg-slate-600"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                      "text-[10px] font-medium truncate",
                                      hasReport ? "text-white" : "text-slate-500"
                                    )}>
                                      {topic.name}
                                    </span>
                                    {hasReport && (
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* No reports message */}
        {availableReports === 0 && (
          <div className="mt-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <p className="text-[10px] text-slate-400 text-center">
              No deep dive reports available yet for {countryName}.
              <br />
              <span className="text-slate-500">Reports can be generated from the Strategic Deep Dive admin page.</span>
            </p>
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      <ReportViewerModal
        isOpen={selectedTopic !== null}
        onClose={() => setSelectedTopic(null)}
        isoCode={isoCode}
        topic={selectedTopic || ""}
        countryName={countryName}
      />
    </>
  );
}

export default CountryReportTiles;
