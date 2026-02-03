/**
 * Arthur D. Little - Global Health Platform
 * PersonaDetailModal Component
 * 
 * Full-screen modal displaying comprehensive persona information including:
 * - Avatar and demographics
 * - GOSI coverage details
 * - OH journey timeline
 * - Key risks and challenges
 * - AI research with source citations
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Clock,
  FileText,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Building2,
} from "lucide-react";
import { type Persona, getCoverageStatus, getCoverageLabel } from "../../data/personas";
import { PersonaAvatar } from "./PersonaAvatar";
import { CoverageTimeline } from "./CoverageTimeline";
import { SourceCitations } from "./SourceCitations";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface PersonaDetailModalProps {
  persona: Persona;
  onClose: () => void;
}

type TabId = 'overview' | 'journey' | 'research';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

const contentVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.2, duration: 0.4 }
  }
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CoverageBadge({ status }: { status: 'full' | 'partial' | 'none' }) {
  const config = {
    full: { 
      icon: CheckCircle2, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/15", 
      border: "border-emerald-500/30" 
    },
    partial: { 
      icon: AlertTriangle, 
      color: "text-amber-400", 
      bg: "bg-amber-500/15", 
      border: "border-amber-500/30" 
    },
    none: { 
      icon: XCircle, 
      color: "text-rose-400", 
      bg: "bg-rose-500/15", 
      border: "border-rose-500/30" 
    },
  };
  
  const { icon: Icon, color, bg, border } = config[status];
  
  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", bg, border, "border")}>
      <Icon className={cn("w-4 h-4", color)} />
      <span className={cn("text-sm font-medium", color)}>{getCoverageLabel(status)}</span>
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  color = "cyan"
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };
  
  return (
    <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg border", colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtext && <p className="text-xs text-white/40 mt-1">{subtext}</p>}
    </div>
  );
}

function TabButton({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
}: { 
  id: TabId; 
  label: string; 
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      className={cn(
        "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap",
        isActive 
          ? "bg-white/10 text-white border border-white/20" 
          : "text-white/50 hover:text-white/80 hover:bg-white/5"
      )}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function RiskChip({ risk }: { risk: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle className="w-3 h-3 text-amber-400" />
      <span className="text-xs text-amber-200">{risk}</span>
    </div>
  );
}

function ChallengeItem({ challenge }: { challenge: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-800/40">
      <ChevronRight className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-white/70">{challenge}</span>
    </div>
  );
}

function SectorBadge({ sector }: { sector: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full bg-slate-700/50 border border-white/10 text-xs text-white/60">
      {sector}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PersonaDetailModal({ persona, onClose }: PersonaDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const coverageStatus = getCoverageStatus(persona);
  
  // Color config based on persona
  const colorConfig: Record<string, { accent: string; gradient: string }> = {
    purple: { accent: "text-purple-400", gradient: "from-purple-500/20 to-violet-600/20" },
    cyan: { accent: "text-cyan-400", gradient: "from-cyan-500/20 to-teal-600/20" },
    amber: { accent: "text-amber-400", gradient: "from-amber-500/20 to-orange-600/20" },
    rose: { accent: "text-rose-400", gradient: "from-rose-500/20 to-pink-600/20" },
    emerald: { accent: "text-emerald-400", gradient: "from-emerald-500/20 to-green-600/20" },
  };
  
  const colors = colorConfig[persona.color] || colorConfig.cyan;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        variants={modalVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-modal-title"
        className="fixed inset-2 sm:inset-4 md:inset-8 lg:inset-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl sm:rounded-2xl border border-white/10 z-50 overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className={cn(
          "flex-shrink-0 p-4 sm:p-6 border-b border-white/10",
          "bg-gradient-to-r",
          colors.gradient
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
              <PersonaAvatar persona={persona} size="lg" showGlow />
              
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h2 id="persona-modal-title" className="text-xl sm:text-2xl font-bold text-white">{persona.name}</h2>
                  <CoverageBadge status={coverageStatus} />
                </div>
                <p className={cn("text-xs sm:text-sm font-medium mb-1", colors.accent)}>
                  {persona.tagline}
                </p>
                <p className="text-xs sm:text-sm text-white/50 max-w-xl hidden sm:block">
                  {persona.description}
                </p>
                <p className="text-[10px] sm:text-xs text-white/30 mt-1 sm:mt-2 font-arabic" dir="rtl">
                  {persona.arabicName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex-shrink-0"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Tabs */}
          <nav aria-label="Persona details navigation" className="flex items-center gap-1 sm:gap-2 mt-4 sm:mt-6 overflow-x-auto">
            <TabButton 
              id="overview" 
              label="Overview" 
              icon={Users} 
              isActive={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton 
              id="journey" 
              label="OH Journey" 
              icon={Clock} 
              isActive={activeTab === 'journey'}
              onClick={() => setActiveTab('journey')}
            />
            <TabButton 
              id="research" 
              label="Sources" 
              icon={FileText} 
              isActive={activeTab === 'research'}
              onClick={() => setActiveTab('research')}
            />
          </nav>
        </div>

        {/* Content */}
        <motion.div 
          variants={contentVariants}
          className="flex-1 overflow-auto p-6"
        >
          {activeTab === 'overview' && (
            <OverviewTab persona={persona} colors={colors} />
          )}
          
          {activeTab === 'journey' && (
            <JourneyTab persona={persona} />
          )}
          
          {activeTab === 'research' && (
            <ResearchTab persona={persona} />
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function OverviewTab({ persona, colors }: { persona: Persona; colors: { accent: string; gradient: string } }) {
  const coverageStatus = getCoverageStatus(persona);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Demographics & Stats */}
      <div className="lg:col-span-2 space-y-6">
        {/* Key Statistics */}
        <section>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Key Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              icon={Users}
              label="Labor Force Share"
              value={`${persona.demographics.populationShare}%`}
              color={persona.color}
            />
            <StatCard 
              icon={TrendingUp}
              label="Participation Rate"
              value={`${persona.demographics.participationRate}%`}
              color="emerald"
            />
            <StatCard 
              icon={AlertTriangle}
              label="Unemployment"
              value={`${persona.demographics.unemploymentRate}%`}
              color={persona.demographics.unemploymentRate > 10 ? "amber" : "cyan"}
            />
            <StatCard 
              icon={Briefcase}
              label="Key Age Group"
              value={persona.demographics.keyAgeGroup}
              subtext="years"
              color="purple"
            />
          </div>
        </section>

        {/* Primary Sectors */}
        <section>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Primary Sectors
          </h3>
          <div className="flex flex-wrap gap-2">
            {persona.demographics.primarySectors.map((sector) => (
              <SectorBadge key={sector} sector={sector} />
            ))}
          </div>
        </section>

        {/* Key Risks */}
        <section>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Occupational Health Risks
          </h3>
          <div className="flex flex-wrap gap-2">
            {persona.research.keyRisks.map((risk) => (
              <RiskChip key={risk} risk={risk} />
            ))}
          </div>
        </section>

        {/* Challenges */}
        <section>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Current Challenges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {persona.research.challenges.map((challenge) => (
              <ChallengeItem key={challenge} challenge={challenge} />
            ))}
          </div>
        </section>
      </div>

      {/* Right Column - Coverage Details */}
      <div className="space-y-6">
        {/* GOSI Coverage Card */}
        <section className="p-5 rounded-xl bg-slate-800/60 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            GOSI Coverage
          </h3>
          
          <div className="space-y-4">
            {/* Coverage Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
              <span className="text-sm text-white/70">Status</span>
              <CoverageBadge status={coverageStatus} />
            </div>

            {/* Annuities */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
              <span className="text-sm text-white/70">Annuities (Pension)</span>
              {persona.coverage.annuities ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            {/* Occupational Hazards */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
              <span className="text-sm text-white/70">Occupational Hazards</span>
              {persona.coverage.occupationalHazards ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            {/* Contribution Rate */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
              <span className="text-sm text-white/70">Contribution Rate</span>
              <span className="text-sm font-medium text-white">{persona.coverage.contributionRate}</span>
            </div>

            {/* Payer */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
              <span className="text-sm text-white/70">Paid By</span>
              <span className="text-sm font-medium text-white capitalize">{persona.coverage.payer}</span>
            </div>
          </div>

          {/* Coverage Gaps */}
          {persona.coverage.gaps.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                Coverage Gaps
              </h4>
              <ul className="space-y-2">
                {persona.coverage.gaps.map((gap) => (
                  <li key={gap} className="flex items-start gap-2 text-xs text-white/50">
                    <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Recent Changes */}
        <section className="p-5 rounded-xl bg-slate-800/60 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Recent Policy Changes
          </h3>
          <ul className="space-y-3">
            {persona.research.recentChanges.map((change) => (
              <li key={change} className="flex items-start gap-2 text-sm text-white/70">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                {change}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function JourneyTab({ persona }: { persona: Persona }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            What Happens When {persona.name} Gets Injured?
          </h3>
          <p className="text-sm text-white/50">
            The typical occupational health journey from incident to recovery
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10">
          <span className="text-xs text-white/50">Typical Duration:</span>
          <span className="ml-2 text-sm font-semibold text-cyan-400">{persona.ohJourney.totalDuration}</span>
        </div>
      </div>

      <CoverageTimeline 
        steps={persona.ohJourney.steps}
        outcome={persona.ohJourney.outcome}
        personaColor={persona.color}
      />
    </div>
  );
}

function ResearchTab({ persona }: { persona: Persona }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <div>
          <h3 className="text-sm font-semibold text-purple-300">AI-Powered Research</h3>
          <p className="text-xs text-purple-300/70">
            Data compiled from official sources, academic research, and verified reports
          </p>
        </div>
      </div>

      <SourceCitations sources={persona.research.sources} />

      {/* Research Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Risks */}
        <div className="p-5 rounded-xl bg-slate-800/60 border border-white/10">
          <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Key Occupational Risks
          </h4>
          <ul className="space-y-2">
            {persona.research.keyRisks.map((risk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-white/70">
                <span className="text-amber-400">{index + 1}.</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>

        {/* Challenges */}
        <div className="p-5 rounded-xl bg-slate-800/60 border border-white/10">
          <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
            Systemic Challenges
          </h4>
          <ul className="space-y-2">
            {persona.research.challenges.map((challenge, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-white/70">
                <span className="text-cyan-400">{index + 1}.</span>
                {challenge}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PersonaDetailModal;
