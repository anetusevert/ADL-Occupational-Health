/**
 * Arthur D. Little - Global Health Platform
 * Framework Summary Component
 * 
 * McKinsey Partner-grade strategic summary organized by framework categories:
 * - Governance (Strategic Capacity)
 * - Hazard Control (Pillar 1)
 * - Vigilance (Pillar 2)
 * - Restoration (Pillar 3)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, AlertTriangle, Eye, HeartPulse, CheckCircle2, XCircle, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Country } from "../../types/country";

interface FrameworkSummaryProps {
  country: Country;
  comparisonCountry: Country | null;
  className?: string;
}

interface PillarAnalysis {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  score: number | null;
  color: string;
  bgColor: string;
  insight: string;
  strength: { label: string; value: string };
  gap: { label: string; value: string };
}

export function FrameworkSummary({ country, comparisonCountry, className }: FrameworkSummaryProps) {
  const [executivePerspective, setExecutivePerspective] = useState<string>("");
  const [priorities, setPriorities] = useState<string[]>([]);

  // Generate executive perspective and priorities from data
  useEffect(() => {
    const gov = country.governance;
    const p1 = country.pillar_1_hazard;
    const p2 = country.pillar_2_vigilance;
    const p3 = country.pillar_3_restoration;

    // Generate executive perspective
    const ohiScore = country.maturity_score ?? 2.0;
    const stage = ohiScore >= 3.5 ? "leading" : ohiScore >= 2.5 ? "advancing" : ohiScore >= 1.5 ? "developing" : "foundational";
    
    let perspective = `${country.name} presents a ${stage} occupational health landscape `;
    perspective += `with an ADL OHI Score of ${ohiScore.toFixed(1)}/4.0. `;
    
    if (gov?.strategic_capacity_score) {
      perspective += `Strategic capacity at ${gov.strategic_capacity_score.toFixed(0)}% `;
      perspective += gov.strategic_capacity_score >= 60 ? "provides a solid governance foundation. " : "indicates room for governance strengthening. ";
    }
    
    if (p1?.fatal_accident_rate) {
      perspective += `The fatal accident rate of ${p1.fatal_accident_rate.toFixed(1)}/100k workers `;
      perspective += p1.fatal_accident_rate < 2 ? "reflects effective workplace safety measures. " : "highlights the need for enhanced hazard controls. ";
    }
    
    setExecutivePerspective(perspective);

    // Generate strategic priorities
    const newPriorities: string[] = [];
    
    if (!gov?.ilo_c187_status || !gov?.ilo_c155_status) {
      newPriorities.push("Pursue ILO C187/C155 ratification to strengthen international alignment");
    }
    
    if (gov?.inspector_density && gov.inspector_density < 1.0) {
      newPriorities.push(`Increase inspector density from ${gov.inspector_density.toFixed(2)} to meet ILO 1.0/10k benchmark`);
    }
    
    if (!p2?.disease_detection_rate || p2.disease_detection_rate < 50) {
      newPriorities.push("Implement comprehensive disease surveillance and reporting system");
    }
    
    if (p3?.rehab_access_score && p3.rehab_access_score < 60) {
      newPriorities.push("Expand rehabilitation access and return-to-work programs");
    }
    
    if (newPriorities.length === 0) {
      newPriorities.push("Maintain current performance while pursuing continuous improvement");
      newPriorities.push("Share best practices with regional partners");
    }
    
    setPriorities(newPriorities.slice(0, 3));
  }, [country]);

  // Build pillar analyses
  const pillars: PillarAnalysis[] = [
    {
      id: "governance",
      name: "GOVERNANCE",
      subtitle: "Strategic Capacity",
      icon: Crown,
      score: country.governance?.strategic_capacity_score ?? null,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      insight: buildGovernanceInsight(country),
      strength: getGovernanceStrength(country),
      gap: getGovernanceGap(country),
    },
    {
      id: "hazard",
      name: "HAZARD CONTROL",
      subtitle: "Pillar 1",
      icon: AlertTriangle,
      score: country.pillar_1_hazard?.control_maturity_score ?? null,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      insight: buildHazardInsight(country),
      strength: getHazardStrength(country),
      gap: getHazardGap(country),
    },
    {
      id: "vigilance",
      name: "VIGILANCE",
      subtitle: "Pillar 2",
      icon: Eye,
      score: country.pillar_2_vigilance?.disease_detection_rate ?? null,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      insight: buildVigilanceInsight(country),
      strength: getVigilanceStrength(country),
      gap: getVigilanceGap(country),
    },
    {
      id: "restoration",
      name: "RESTORATION",
      subtitle: "Pillar 3",
      icon: HeartPulse,
      score: country.pillar_3_restoration?.rehab_access_score ?? null,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      insight: buildRestorationInsight(country),
      strength: getRestorationStrength(country),
      gap: getRestorationGap(country),
    },
  ];

  return (
    <div className={cn("h-full flex flex-col overflow-hidden", className)}>
      {/* Executive Perspective */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 mb-4 p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Executive Perspective</h3>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          {executivePerspective}
        </p>
      </motion.div>

      {/* Framework Assessment Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 overflow-hidden">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;
          return (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-xl border p-3 flex flex-col overflow-hidden",
                pillar.bgColor,
                "border-slate-700/50"
              )}
            >
              {/* Pillar Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", pillar.bgColor)}>
                    <Icon className={cn("w-4 h-4", pillar.color)} />
                  </div>
                  <div>
                    <h4 className={cn("text-xs font-bold", pillar.color)}>{pillar.name}</h4>
                    <p className="text-[9px] text-white/40">{pillar.subtitle}</p>
                  </div>
                </div>
                {pillar.score !== null && (
                  <span className={cn("text-lg font-bold", pillar.color)}>
                    {pillar.score.toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Insight */}
              <p className="text-[11px] text-white/60 leading-relaxed mb-2 flex-1">
                {pillar.insight}
              </p>

              {/* Strength & Gap */}
              <div className="flex-shrink-0 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="text-white/50">{pillar.strength.label}:</span>
                  <span className="text-emerald-400 font-medium">{pillar.strength.value}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <span className="text-white/50">{pillar.gap.label}:</span>
                  <span className="text-red-400 font-medium">{pillar.gap.value}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Strategic Priorities */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex-shrink-0 mt-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50"
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-white">Strategic Priorities</h3>
        </div>
        <div className="space-y-1">
          {priorities.map((priority, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px]">
              <span className="text-amber-400 font-bold">{idx + 1}.</span>
              <span className="text-white/60">{priority}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Helper functions to build insights
function buildGovernanceInsight(country: Country): string {
  const gov = country.governance;
  if (!gov) return "Governance data unavailable for comprehensive analysis.";
  
  const capacity = gov.strategic_capacity_score;
  const iloStatus = (gov.ilo_c187_status ? 1 : 0) + (gov.ilo_c155_status ? 1 : 0);
  
  let insight = "";
  if (capacity) {
    insight += capacity >= 60 
      ? "Strong strategic governance provides policy foundation. " 
      : "Governance capacity requires strengthening. ";
  }
  insight += iloStatus === 2 
    ? "ILO conventions ratified." 
    : iloStatus === 1 
      ? "Partial ILO adoption." 
      : "ILO conventions pending ratification.";
  
  return insight;
}

function getGovernanceStrength(country: Country): { label: string; value: string } {
  const gov = country.governance;
  if (gov?.mental_health_policy) return { label: "Mental Health", value: "Policy exists" };
  if (gov?.ilo_c187_status) return { label: "ILO C187", value: "Ratified" };
  if (gov?.strategic_capacity_score && gov.strategic_capacity_score >= 50) 
    return { label: "Capacity", value: `${gov.strategic_capacity_score.toFixed(0)}%` };
  return { label: "Data", value: "Limited" };
}

function getGovernanceGap(country: Country): { label: string; value: string } {
  const gov = country.governance;
  if (!gov?.ilo_c187_status && !gov?.ilo_c155_status) return { label: "ILO Conventions", value: "Not ratified" };
  if (!gov?.ilo_c187_status) return { label: "ILO C187", value: "Not ratified" };
  if (!gov?.ilo_c155_status) return { label: "ILO C155", value: "Not ratified" };
  if (gov?.inspector_density && gov.inspector_density < 1.0) 
    return { label: "Inspectors", value: `${gov.inspector_density.toFixed(2)}/10k` };
  return { label: "Gap", value: "Minor" };
}

function buildHazardInsight(country: Country): string {
  const p1 = country.pillar_1_hazard;
  if (!p1) return "Hazard control data unavailable.";
  
  let insight = "";
  if (p1.oel_compliance_pct) {
    insight += p1.oel_compliance_pct >= 80 
      ? `Strong OEL compliance at ${p1.oel_compliance_pct.toFixed(0)}%. ` 
      : `OEL compliance at ${p1.oel_compliance_pct.toFixed(0)}% needs improvement. `;
  }
  if (p1.fatal_accident_rate) {
    insight += p1.fatal_accident_rate < 2 
      ? "Low fatality rate reflects safety culture." 
      : `Fatal rate of ${p1.fatal_accident_rate.toFixed(1)}/100k requires attention.`;
  }
  return insight || "Hazard control metrics pending.";
}

function getHazardStrength(country: Country): { label: string; value: string } {
  const p1 = country.pillar_1_hazard;
  if (p1?.oel_compliance_pct && p1.oel_compliance_pct >= 80) 
    return { label: "OEL Compliance", value: `${p1.oel_compliance_pct.toFixed(0)}%` };
  if (p1?.fatal_accident_rate && p1.fatal_accident_rate < 2) 
    return { label: "Fatal Rate", value: `${p1.fatal_accident_rate.toFixed(1)}/100k` };
  return { label: "Data", value: "Available" };
}

function getHazardGap(country: Country): { label: string; value: string } {
  const p1 = country.pillar_1_hazard;
  if (p1?.fatal_accident_rate && p1.fatal_accident_rate >= 3) 
    return { label: "Fatal Rate", value: `${p1.fatal_accident_rate.toFixed(1)}/100k high` };
  if (p1?.oel_compliance_pct && p1.oel_compliance_pct < 70) 
    return { label: "OEL Compliance", value: `${p1.oel_compliance_pct.toFixed(0)}% low` };
  return { label: "Gap", value: "Minor" };
}

function buildVigilanceInsight(country: Country): string {
  const p2 = country.pillar_2_vigilance;
  if (!p2) return "Vigilance system data unavailable.";
  
  let insight = "";
  if (p2.surveillance_logic) {
    insight += p2.surveillance_logic === "Risk-Based" 
      ? "Risk-based surveillance positions system well. " 
      : `${p2.surveillance_logic} surveillance in place. `;
  }
  if (p2.disease_detection_rate) {
    insight += `Disease detection at ${p2.disease_detection_rate.toFixed(0)}%.`;
  } else {
    insight += "Disease detection data gaps exist.";
  }
  return insight;
}

function getVigilanceStrength(country: Country): { label: string; value: string } {
  const p2 = country.pillar_2_vigilance;
  if (p2?.surveillance_logic === "Risk-Based") return { label: "Surveillance", value: "Risk-based" };
  if (p2?.disease_detection_rate && p2.disease_detection_rate >= 50) 
    return { label: "Detection", value: `${p2.disease_detection_rate.toFixed(0)}%` };
  return { label: "System", value: "Exists" };
}

function getVigilanceGap(country: Country): { label: string; value: string } {
  const p2 = country.pillar_2_vigilance;
  if (!p2?.disease_detection_rate) return { label: "Detection Data", value: "Unavailable" };
  if (p2.disease_detection_rate < 50) return { label: "Detection", value: `${p2.disease_detection_rate.toFixed(0)}% low` };
  return { label: "Gap", value: "Minor" };
}

function buildRestorationInsight(country: Country): string {
  const p3 = country.pillar_3_restoration;
  if (!p3) return "Restoration system data unavailable.";
  
  let insight = "";
  if (p3.payer_mechanism) {
    insight += p3.payer_mechanism === "No-Fault" 
      ? "No-fault compensation streamlines recovery. " 
      : `${p3.payer_mechanism} payer mechanism. `;
  }
  if (p3.return_to_work_success_pct) {
    insight += `RTW success at ${p3.return_to_work_success_pct.toFixed(0)}%.`;
  }
  return insight || "Restoration data pending.";
}

function getRestorationStrength(country: Country): { label: string; value: string } {
  const p3 = country.pillar_3_restoration;
  if (p3?.return_to_work_success_pct && p3.return_to_work_success_pct >= 70) 
    return { label: "RTW Success", value: `${p3.return_to_work_success_pct.toFixed(0)}%` };
  if (p3?.payer_mechanism === "No-Fault") return { label: "Payer", value: "No-Fault" };
  if (p3?.reintegration_law) return { label: "Reintegration", value: "Law exists" };
  return { label: "System", value: "Exists" };
}

function getRestorationGap(country: Country): { label: string; value: string } {
  const p3 = country.pillar_3_restoration;
  if (!p3?.rehab_access_score) return { label: "Rehab Data", value: "Unavailable" };
  if (p3.rehab_access_score < 50) return { label: "Rehab Access", value: `${p3.rehab_access_score.toFixed(0)}/100 low` };
  if (!p3.reintegration_law) return { label: "Reintegration", value: "No law" };
  return { label: "Gap", value: "Minor" };
}

export default FrameworkSummary;
