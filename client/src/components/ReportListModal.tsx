/**
 * Arthur D. Little - Global Health Platform
 * Report List Modal
 * Shows available reports for a specific framework pillar
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  CheckCircle2,
  Minus,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { FRAMEWORK_LAYERS } from "../data/frameworkLayers";
import { ReportViewerModal } from "./ReportViewerModal";
import { cn } from "../lib/utils";
import type { TopicStatus } from "../services/api";

interface PillarConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

interface ReportListModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillarId: string;
  pillarConfig: PillarConfig;
  isoCode: string;
  countryName: string;
  topicStatusMap: Record<string, TopicStatus>;
}

export function ReportListModal({
  isOpen,
  onClose,
  pillarId,
  pillarConfig,
  isoCode,
  countryName,
  topicStatusMap,
}: ReportListModalProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Keyboard handler for escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedTopic) {
          setSelectedTopic(null);
        } else {
          onClose();
        }
      }
    },
    [onClose, selectedTopic]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Get topics for this pillar
  const layer = FRAMEWORK_LAYERS.find(l => l.id === pillarId);
  const topics = layer?.topics || [];

  const Icon = pillarConfig.icon;

  // Handle topic click
  const handleTopicClick = (topicName: string) => {
    const status = topicStatusMap[topicName];
    if (status?.has_report) {
      setSelectedTopic(topicName);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-2 sm:inset-4 md:inset-8 lg:inset-16 xl:inset-24 bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700/50 z-50 overflow-hidden flex flex-col shadow-2xl max-w-2xl mx-auto max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] md:max-h-[80vh]"
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 bg-gradient-to-r backdrop-blur-sm border-b border-slate-700/50 px-6 py-4",
              pillarConfig.bgClass
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    pillarConfig.iconBgClass
                  )}>
                    <Icon className={cn("w-5 h-5", pillarConfig.iconColorClass)} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {pillarConfig.name} {pillarConfig.description}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {countryName} • Deep Dive Reports
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-3">
                {topics.map((topic, index) => {
                  const status = topicStatusMap[topic.name];
                  const hasReport = status?.has_report;

                  return (
                    <motion.button
                      key={topic.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleTopicClick(topic.name)}
                      disabled={!hasReport}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all duration-200",
                        hasReport
                          ? cn(
                              "cursor-pointer hover:scale-[1.01]",
                              pillarConfig.bgClass,
                              pillarConfig.borderClass,
                              "hover:brightness-110"
                            )
                          : "bg-slate-800/30 border-slate-700/30 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          hasReport ? pillarConfig.iconBgClass : "bg-slate-700/50"
                        )}>
                          <FileText className={cn(
                            "w-5 h-5",
                            hasReport ? pillarConfig.iconColorClass : "text-slate-500"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={cn(
                              "text-sm font-medium truncate",
                              hasReport ? "text-white" : "text-slate-500"
                            )}>
                              {topic.name}
                            </h3>
                            {hasReport ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Minus className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {topic.description}
                          </p>
                        </div>
                        {hasReport && (
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* No reports message */}
              {topics.every(t => !topicStatusMap[t.name]?.has_report) && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">
                    No reports available for this pillar yet.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Reports can be generated from the Strategic Deep Dive admin page.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-3 bg-slate-800/50 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-500 text-center">
                Click on available reports to view full analysis
              </p>
            </div>
          </motion.div>

          {/* Report Viewer Modal */}
          {selectedTopic && (
            <ReportViewerModal
              isOpen={selectedTopic !== null}
              onClose={() => setSelectedTopic(null)}
              isoCode={isoCode}
              topic={selectedTopic}
              countryName={countryName}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default ReportListModal;
