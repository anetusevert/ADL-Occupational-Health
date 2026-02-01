/**
 * Arthur D. Little - Global Health Platform
 * Pillar Architecture Map
 * 
 * Visual representation of all components that create
 * the infrastructure to deliver a specific pillar.
 */

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { ComponentCard } from "./ComponentCard";
import type { PillarArchitecture, ArchitectureSection, ArchitectureComponent } from "../../lib/architectureDefinitions";
import { calculateComponentScore, findComponentLeaders, type ComponentScore, type CountryComponentScore } from "../../lib/architectureRankings";

interface PillarArchitectureMapProps {
  architecture: PillarArchitecture;
  currentCountry: Record<string, unknown>;
  allCountries: Record<string, unknown>[];
  onComponentClick?: (component: ArchitectureComponent) => void;
}

// Color map for pillars
const PILLAR_COLORS: Record<string, string> = {
  purple: "purple",
  blue: "blue",
  teal: "teal",
  amber: "amber",
};

export function PillarArchitectureMap({
  architecture,
  currentCountry,
  allCountries,
  onComponentClick,
}: PillarArchitectureMapProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    architecture.sections.map(s => s.id)
  );
  
  const pillarColor = PILLAR_COLORS[architecture.color] ?? "slate";
  
  // Calculate all component scores for current country
  const componentScores = useMemo(() => {
    const scores: Record<string, ComponentScore> = {};
    for (const section of architecture.sections) {
      for (const component of section.components) {
        scores[component.id] = calculateComponentScore(component, currentCountry);
      }
    }
    return scores;
  }, [architecture, currentCountry]);
  
  // Find leaders for all components
  const componentLeaders = useMemo(() => {
    const leaders: Record<string, CountryComponentScore[]> = {};
    for (const section of architecture.sections) {
      for (const component of section.components) {
        const result = findComponentLeaders(component, allCountries);
        leaders[component.id] = result.leaders;
      }
    }
    return leaders;
  }, [architecture, allCountries]);
  
  // Calculate overall section scores
  const sectionScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const section of architecture.sections) {
      const sectionComponentScores = section.components
        .map(c => componentScores[c.id]?.score ?? 0);
      if (sectionComponentScores.length > 0) {
        scores[section.id] = Math.round(
          sectionComponentScores.reduce((a, b) => a + b, 0) / sectionComponentScores.length
        );
      } else {
        scores[section.id] = 0;
      }
    }
    return scores;
  }, [architecture, componentScores]);
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  
  const currentIso = String(currentCountry.iso_code ?? currentCountry.code ?? "");
  
  return (
    <div className="space-y-4">
      {/* Architecture Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-3 h-3 rounded-full",
          `bg-${pillarColor}-500`
        )} />
        <h3 className="text-lg font-semibold text-white">
          {architecture.name}
        </h3>
        <p className="text-sm text-white/50">
          {architecture.description}
        </p>
      </div>
      
      {/* Sections */}
      <div className="space-y-4">
        {architecture.sections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className={cn(
              "rounded-xl border overflow-hidden",
              `border-${pillarColor}-500/30`,
              `bg-${pillarColor}-500/5`
            )}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 text-left",
                "hover:bg-white/5 transition-colors"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                  `bg-${pillarColor}-500/20`,
                  `text-${pillarColor}-400`
                )}>
                  {sectionScores[section.id]}%
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {section.name}
                  </h4>
                  <p className="text-xs text-white/50">
                    {section.description}
                  </p>
                </div>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-white/40 transition-transform",
                expandedSections.includes(section.id) && "rotate-180"
              )} />
            </button>
            
            {/* Section Content */}
            {expandedSections.includes(section.id) && (
              <div className="p-4 pt-0">
                {section.isChain ? (
                  // Chain layout (horizontal flow)
                  <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                    {section.components.map((component, idx) => (
                      <div key={component.id} className="flex items-center">
                        <div className="flex-shrink-0 w-64">
                          <ComponentCard
                            component={component}
                            score={componentScores[component.id]}
                            leaders={componentLeaders[component.id] ?? []}
                            currentCountryIso={currentIso}
                            pillarColor={pillarColor}
                            onViewDetails={
                              onComponentClick 
                                ? () => onComponentClick(component) 
                                : undefined
                            }
                          />
                        </div>
                        {idx < section.components.length - 1 && (
                          <ArrowRight className={cn(
                            "w-6 h-6 mx-2 flex-shrink-0",
                            `text-${pillarColor}-400/50`
                          )} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Grid layout
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.components.map(component => (
                      <ComponentCard
                        key={component.id}
                        component={component}
                        score={componentScores[component.id]}
                        leaders={componentLeaders[component.id] ?? []}
                        currentCountryIso={currentIso}
                        pillarColor={pillarColor}
                        onViewDetails={
                          onComponentClick 
                            ? () => onComponentClick(component) 
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Overall Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Complete (70%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Partial (30-70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Missing (&lt;30%)</span>
        </div>
      </div>
    </div>
  );
}

export default PillarArchitectureMap;
