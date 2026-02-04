/**
 * MaturityRuleVisualizer - Visual representation of scoring rules
 * 
 * Displays maturity scoring rules with visual condition trees,
 * impact indicators, and interactive exploration.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Shield,
  AlertTriangle,
  Activity,
  Heart,
  BarChart3,
  ChevronDown,
  Plus,
  Equal,
  AlertCircle,
  CheckCircle,
  Zap,
  Lock,
  Target,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Types
interface MaturityRule {
  id: string;
  rule_key: string;
  name: string;
  description: string | null;
  pillar: string;
  priority: number;
  condition_type: string;
  condition_config: Record<string, any>;
  impact_type: "add" | "multiply" | "cap" | "set";
  impact_value: number;
  is_active: boolean;
}

interface MaturityRuleVisualizerProps {
  rules: MaturityRule[];
  onRuleClick?: (rule: MaturityRule) => void;
  highlightedRule?: string | null;
  showInactive?: boolean;
  className?: string;
}

// Pillar configuration
const pillarConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  governance: {
    icon: Shield,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/40",
    label: "Governance",
  },
  pillar_1_hazard: {
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/40",
    label: "Hazard Control",
  },
  pillar_2_vigilance: {
    icon: Activity,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/40",
    label: "Health Vigilance",
  },
  pillar_3_restoration: {
    icon: Heart,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/40",
    label: "Restoration",
  },
  composite: {
    icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/40",
    label: "Composite",
  },
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const ruleVariants: Variants = {
  hidden: { opacity: 0, x: -20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
};

const detailVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { height: { duration: 0.3 }, opacity: { duration: 0.2, delay: 0.1 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { opacity: { duration: 0.1 }, height: { duration: 0.2 } },
  },
};

// Impact type configuration
const impactConfig: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}> = {
  add: {
    icon: Plus,
    label: "Add",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  multiply: {
    icon: TrendingUp,
    label: "Multiply",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  cap: {
    icon: Lock,
    label: "Cap",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  set: {
    icon: Equal,
    label: "Set",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
};

// Condition renderer component
function ConditionRenderer({ config, type }: { config: Record<string, any>; type: string }) {
  const renderCondition = () => {
    switch (type) {
      case "threshold":
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-white/80 bg-white/10 px-2 py-0.5 rounded text-sm font-mono">
              {config.field}
            </code>
            <span className="text-white/40">{config.operator || "<"}</span>
            <code className="text-cyan-400 font-mono">{config.value}</code>
          </div>
        );
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <code className="text-white/80 bg-white/10 px-2 py-0.5 rounded text-sm font-mono">
              {config.field}
            </code>
            <span className="text-white/40">=</span>
            <span className={config.value ? "text-emerald-400" : "text-red-400"}>
              {config.value ? "true" : "false"}
            </span>
          </div>
        );
      case "enum":
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-white/80 bg-white/10 px-2 py-0.5 rounded text-sm font-mono">
              {config.field}
            </code>
            <span className="text-white/40">=</span>
            <code className="text-amber-400 font-mono">"{config.value}"</code>
          </div>
        );
      case "compound":
        return (
          <div className="space-y-2">
            <span className="text-white/50 text-xs uppercase tracking-wider">
              {config.operator || "AND"}
            </span>
            <div className="pl-4 border-l-2 border-white/20 space-y-2">
              {config.conditions?.map((cond: any, index: number) => (
                <ConditionRenderer key={index} config={cond.config} type={cond.type} />
              ))}
            </div>
          </div>
        );
      case "base":
        return (
          <div className="flex items-center gap-2 text-white/60">
            <Target className="w-4 h-4" />
            <span>Base score rule (always applied)</span>
          </div>
        );
      default:
        return (
          <pre className="text-white/50 text-xs overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        );
    }
  };

  return <div className="text-sm">{renderCondition()}</div>;
}

// Individual rule card component
function RuleCard({
  rule,
  isExpanded,
  isHighlighted,
  onToggle,
  onClick,
}: {
  rule: MaturityRule;
  isExpanded: boolean;
  isHighlighted: boolean;
  onToggle: () => void;
  onClick?: () => void;
}) {
  const pillar = pillarConfig[rule.pillar] || pillarConfig.composite;
  const impact = impactConfig[rule.impact_type] || impactConfig.add;
  const Icon = pillar.icon;
  const ImpactIcon = impact.icon;

  // Format impact display
  const getImpactDisplay = () => {
    switch (rule.impact_type) {
      case "add":
        return `${rule.impact_value >= 0 ? "+" : ""}${rule.impact_value}`;
      case "multiply":
        return `×${rule.impact_value}`;
      case "cap":
        return `Max ${rule.impact_value}`;
      case "set":
        return `=${rule.impact_value}`;
      default:
        return rule.impact_value;
    }
  };

  return (
    <motion.div
      variants={ruleVariants}
      className={cn(
        "rounded-xl border overflow-hidden transition-all",
        pillar.bgColor,
        pillar.borderColor,
        isHighlighted && "ring-2 ring-white/30",
        !rule.is_active && "opacity-60"
      )}
    >
      {/* Rule Header */}
      <button
        onClick={() => {
          onToggle();
          onClick?.();
        }}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Pillar icon */}
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", pillar.bgColor)}>
            <Icon className={cn("w-5 h-5", pillar.color)} />
          </div>

          {/* Rule info */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">{rule.name}</p>
              {!rule.is_active && (
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/40">
                  Inactive
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/40">
                Priority: {rule.priority}
              </span>
            </div>
            {rule.description && (
              <p className="text-white/50 text-sm line-clamp-1">{rule.description}</p>
            )}
          </div>
        </div>

        {/* Impact display */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            impact.bgColor
          )}>
            <ImpactIcon className={cn("w-4 h-4", impact.color)} />
            <span className={cn("text-lg font-bold font-mono", impact.color)}>
              {getImpactDisplay()}
            </span>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={detailVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
              {/* Condition section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-white/40" />
                  <span className="text-white/60 text-sm font-medium">Condition</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/40">
                    {rule.condition_type}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <ConditionRenderer config={rule.condition_config} type={rule.condition_type} />
                </div>
              </div>

              {/* Impact explanation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-white/40" />
                  <span className="text-white/60 text-sm font-medium">Impact</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", impact.bgColor)}>
                      <ImpactIcon className={cn("w-5 h-5", impact.color)} />
                    </div>
                    <div>
                      <p className="text-white text-sm">
                        {rule.impact_type === "add" && (
                          <>Add <span className={impact.color}>{rule.impact_value}</span> to maturity score</>
                        )}
                        {rule.impact_type === "multiply" && (
                          <>Multiply score by <span className={impact.color}>{rule.impact_value}</span></>
                        )}
                        {rule.impact_type === "cap" && (
                          <>Cap score at maximum of <span className={impact.color}>{rule.impact_value}</span></>
                        )}
                        {rule.impact_type === "set" && (
                          <>Set score to exactly <span className={impact.color}>{rule.impact_value}</span></>
                        )}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        Applied when condition is met
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw config for debugging */}
              <details className="text-xs">
                <summary className="text-white/30 cursor-pointer hover:text-white/50">
                  View raw configuration
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-white/5 text-white/40 overflow-x-auto">
                  {JSON.stringify({ condition: rule.condition_config, impact: { type: rule.impact_type, value: rule.impact_value } }, null, 2)}
                </pre>
              </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main component
export function MaturityRuleVisualizer({
  rules,
  onRuleClick,
  highlightedRule,
  showInactive = false,
  className,
}: MaturityRuleVisualizerProps) {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [filterPillar, setFilterPillar] = useState<string | null>(null);

  // Filter and sort rules
  const filteredRules = useMemo(() => {
    let filtered = rules;
    
    if (!showInactive) {
      filtered = filtered.filter((r) => r.is_active);
    }
    
    if (filterPillar) {
      filtered = filtered.filter((r) => r.pillar === filterPillar);
    }
    
    return [...filtered].sort((a, b) => a.priority - b.priority);
  }, [rules, showInactive, filterPillar]);

  // Get unique pillars
  const uniquePillars = useMemo(() => {
    return [...new Set(rules.map((r) => r.pillar))];
  }, [rules]);

  // Calculate score impact summary
  const impactSummary = useMemo(() => {
    const activeRules = rules.filter((r) => r.is_active);
    const addRules = activeRules.filter((r) => r.impact_type === "add");
    const capRules = activeRules.filter((r) => r.impact_type === "cap");
    
    const maxPossibleAdd = addRules.reduce((sum, r) => sum + Math.max(0, r.impact_value), 0);
    const minCap = capRules.length > 0 ? Math.min(...capRules.map((r) => r.impact_value)) : 4.0;
    
    return { maxPossibleAdd, minCap, totalRules: activeRules.length };
  }, [rules]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Maturity Scoring Rules</h3>
            <p className="text-white/50 text-sm">
              {filteredRules.length} rules define the OHI maturity score
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterPillar(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              !filterPillar ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            All
          </button>
          {uniquePillars.map((pillar) => {
            const config = pillarConfig[pillar];
            if (!config) return null;
            return (
              <button
                key={pillar}
                onClick={() => setFilterPillar(pillar)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5",
                  filterPillar === pillar
                    ? `${config.bgColor} ${config.color}`
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                <config.icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-white/60 text-sm">Active Rules</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{impactSummary.totalRules}</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="text-white/60 text-sm">Max Possible Add</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">+{impactSummary.maxPossibleAdd}</p>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-red-400" />
            <span className="text-white/60 text-sm">Score Cap</span>
          </div>
          <p className="text-2xl font-bold text-red-400 font-mono">{impactSummary.minCap}</p>
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {filteredRules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            isExpanded={expandedRule === rule.id}
            isHighlighted={highlightedRule === rule.id}
            onToggle={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
            onClick={() => onRuleClick?.(rule)}
          />
        ))}

        {filteredRules.length === 0 && (
          <div className="text-center py-8 text-white/40">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No rules found matching the current filter</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-white/40">
        {Object.entries(impactConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded flex items-center justify-center", config.bgColor)}>
              <config.icon className={cn("w-3 h-3", config.color)} />
            </div>
            <span>{config.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default MaturityRuleVisualizer;
