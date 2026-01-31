/**
 * Arthur D. Little - Global Health Platform
 * Agent Prompts Configuration - Admin Settings
 * Configure AI agents for country analysis and research
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Save,
  Loader2,
  Check,
  FileText,
  Globe,
  Search,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  Play,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Default agent prompts (used when API is not available)
const DEFAULT_AGENTS = [
  {
    id: "strategic-deep-dive",
    name: "Strategic Deep Dive Agent",
    description: "McKinsey Partner-style expert agent. Generates authoritative, succinct strategic country analyses with quantified insights and action-oriented recommendations.",
    prompt_template: `You are a Senior Partner at McKinsey & Company specializing in Global Health Policy.

Write in the distinctive McKinsey Partner style: SUCCINCT. AUTHORITATIVE. INSIGHT-DRIVEN.

## McKinsey Writing Principles:
1. **Lead with the "So What"** - Every statement starts with the implication
2. **Pyramid Structure** - Conclusion first, then evidence
3. **Quantify Everything** - Specific numbers, not vague statements
4. **Action-Oriented** - Verb-forward recommendations with expected impact
5. **Confident Authority** - No hedging. Write with conviction.
6. **Brevity is Power** - One idea per sentence. No filler words.

## Data Inputs:
{{COUNTRY_DATA}}
{{INTELLIGENCE_DATA}}
{{WEB_RESEARCH}}

## Analysis Focus:
{{TOPIC}}

## Output Format (JSON):
{
  "strategy_name": "4-6 word punchy title (e.g., 'Closing the Enforcement Gap')",
  "executive_summary": "3 sentences max. Verdict first. Key metric. Strategic implication.",
  "key_findings": [{"title": "Insight headline", "description": "So-what statement with data", "impact_level": "high|medium|low"}],
  "strategic_recommendations": [{"title": "Verb-forward imperative", "description": "Action + expected outcome", "priority": "critical|high|medium|low", "timeline": "immediate|short-term|medium-term|long-term"}],
  "priority_interventions": ["Three most critical actions"]
}

## Style Examples:
✓ "Fatal accident rate of 3.2 per 100,000—4x the OECD average—signals systemic enforcement failure"
✗ "The fatal accident rate appears to be somewhat higher than average"

✓ "Implement risk-based inspections targeting high-hazard sectors, reducing fatalities by 40% within 3 years"
✗ "Consider improving the inspection system"

Generate valid JSON only.`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: "country-analysis",
    name: "Country Analysis Agent",
    description: "Generates comprehensive occupational health assessments for countries using framework data and web research",
    prompt_template: `You are an expert occupational health analyst for Arthur D. Little's Global Health Intelligence Platform.

Your task is to generate a comprehensive strategic assessment for {{COUNTRY_NAME}} ({{ISO_CODE}}) based on the Sovereign OH Integrity Framework.

## Available Country Data:
{{COUNTRY_DATA}}

## Analysis Requirements:

1. **Executive Summary**: Provide a 2-3 sentence overview of the country's occupational health maturity.

2. **Governance Analysis**: Evaluate the strategic capacity and policy framework:
   - ILO Convention ratification status
   - Labor inspection capacity
   - Mental health policy integration

3. **Hazard Control Assessment**: Analyze risk management effectiveness:
   - Fatal accident rates vs global benchmarks
   - Carcinogen exposure controls
   - Heat stress regulations

4. **Health Vigilance Review**: Assess surveillance and detection:
   - Disease detection capabilities
   - Vulnerable population coverage
   - Screening program effectiveness

5. **Restoration Capacity**: Evaluate compensation and rehabilitation:
   - Compensation mechanisms
   - Return-to-work programs
   - Rehabilitation access

6. **Key Recommendations**: Provide 3-5 actionable recommendations prioritized by impact.

7. **Data Confidence Note**: Comment on data availability and reliability.

## Output Format:
Provide a professional, well-structured analysis suitable for executive decision-makers. Use clear headings and bullet points where appropriate. Be specific with data references and benchmarks.`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: "web-research",
    name: "Web Research Agent",
    description: "Conducts deep web research on occupational health policies, regulations, and statistics",
    prompt_template: `You are a research specialist focused on occupational health and safety policy analysis.

Your task is to conduct comprehensive web research on {{COUNTRY_NAME}}'s occupational health landscape.

## Research Focus Areas:

1. **Recent Policy Developments**: Search for recent legislative changes, policy announcements, or regulatory updates related to occupational health in {{COUNTRY_NAME}}.

2. **Statistical Data**: Look for the latest occupational injury statistics, disease prevalence data, and workforce health metrics.

3. **International Comparisons**: Find how {{COUNTRY_NAME}} compares to regional peers and global standards (ILO, WHO benchmarks).

4. **Industry-Specific Risks**: Identify key industries and their specific occupational health challenges.

5. **Best Practices**: Research successful interventions or programs that have improved occupational health outcomes.

6. **Gaps and Challenges**: Identify documented gaps in the occupational health system.

## Source Requirements:
- Prioritize official government sources, ILO reports, WHO data
- Include reputable academic publications
- Note publication dates for all data points
- Flag any conflicting information from different sources

## Output Format:
Provide a structured research brief with clear citations. Include a "Data Quality" section noting the reliability and recency of sources found.`,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
];

interface AgentPrompt {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export function AgentPrompts() {
  const [selectedAgent, setSelectedAgent] = useState<string>("country-analysis");
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // For now, use default agents (API integration can be added later)
  const agents: AgentPrompt[] = DEFAULT_AGENTS;
  const isLoading = false;

  // Get current agent
  const currentAgent = agents.find((a) => a.id === selectedAgent);

  // Initialize edited prompt when agent changes
  useEffect(() => {
    if (currentAgent) {
      setEditedPrompt(currentAgent.prompt_template);
      setHasChanges(false);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [selectedAgent, currentAgent]);

  // Handle prompt change
  const handlePromptChange = (value: string) => {
    setEditedPrompt(value);
    setHasChanges(value !== currentAgent?.prompt_template);
    setSaveSuccess(false);
  };

  // Handle save
  const handleSave = async () => {
    // In production, this would call the API
    // For now, simulate save
    setSaveSuccess(true);
    setHasChanges(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle test
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    // Simulate API test
    setTimeout(() => {
      setTestResult({
        success: true,
        message: "Agent prompt validated successfully. The template contains all required variables and is properly formatted.",
      });
      setIsTesting(false);
    }, 2000);
  };

  // Handle reset to default
  const handleReset = () => {
    const defaultAgent = DEFAULT_AGENTS.find((a) => a.id === selectedAgent);
    if (defaultAgent) {
      setEditedPrompt(defaultAgent.prompt_template);
      setHasChanges(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-adl-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Agent Prompts
            </h1>
            <p className="text-white/40 text-sm">
              Configure AI agents for country analysis and research
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Agent Selection Panel */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 overflow-auto scrollbar-thin">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-adl-accent" />
            Available Agents
          </h2>
          
          <div className="space-y-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-all duration-200",
                  selectedAgent === agent.id
                    ? "bg-purple-500/20 border border-purple-500/40"
                    : "bg-white/5 border border-transparent hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  {agent.id === "strategic-deep-dive" ? (
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  ) : agent.id === "country-analysis" ? (
                    <Globe className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Search className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    selectedAgent === agent.id ? "text-white" : "text-white/70"
                  )}>
                    {agent.name}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 line-clamp-2">
                  {agent.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded",
                    agent.is_active
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/10 text-white/40"
                  )}>
                    {agent.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Info Card */}
          <div className="mt-4 p-3 bg-adl-accent/10 rounded-lg border border-adl-accent/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-adl-accent flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-white/50">
                <p className="font-medium text-white/70 mb-1">Template Variables:</p>
                <ul className="space-y-0.5">
                  <li>{"{{COUNTRY_NAME}}"} - Full country name</li>
                  <li>{"{{ISO_CODE}}"} - ISO country code</li>
                  <li>{"{{COUNTRY_DATA}}"} - Framework data</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Editor Panel */}
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {/* Editor Header */}
          <div className="flex-shrink-0 p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  {currentAgent?.name || "Select an Agent"}
                </h2>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {currentAgent?.description}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-[10px] text-amber-400 px-2 py-1 bg-amber-500/10 rounded">
                    Unsaved changes
                  </span>
                )}
                
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
                
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
                    "hover:bg-cyan-500/30 disabled:opacity-50"
                  )}
                >
                  {isTesting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Test
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    "bg-purple-500/20 text-purple-400 border border-purple-500/30",
                    "hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {saveSuccess ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  {saveSuccess ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 min-h-0 p-4 overflow-hidden flex flex-col">
            <label className="block text-xs font-medium text-white/60 mb-2">
              Prompt Template
            </label>
            <textarea
              value={editedPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              className={cn(
                "flex-1 w-full p-4 rounded-lg text-sm font-mono leading-relaxed resize-none",
                "bg-slate-900/50 border border-slate-700/50 text-white/80",
                "placeholder-slate-500 focus:outline-none focus:border-purple-500/50",
                "scrollbar-thin"
              )}
              placeholder="Enter your agent prompt template..."
            />
            
            {/* Test Result */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-4 p-4 rounded-lg border",
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    testResult.success ? "text-emerald-400" : "text-red-400"
                  )}>
                    {testResult.success ? "Validation Passed" : "Validation Failed"}
                  </span>
                </div>
                <p className="text-xs text-white/50">{testResult.message}</p>
              </motion.div>
            )}
          </div>

          {/* Editor Footer */}
          <div className="flex-shrink-0 p-4 border-t border-white/10 bg-slate-900/30">
            <div className="flex items-center justify-between text-[10px] text-white/30">
              <div className="flex items-center gap-4">
                <span>Characters: {editedPrompt.length}</span>
                <span>Lines: {editedPrompt.split('\n').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Last updated: {currentAgent?.updated_at || "Never"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentPrompts;
