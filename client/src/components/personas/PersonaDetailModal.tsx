/**
 * Arthur D. Little - Global Health Platform
 * PersonaDetailModal Component - Master-Detail Layout
 * 
 * Two-column layout with:
 * - Left sidebar: Avatar, navigation, quick stats
 * - Right content: Tab panels (no scrolling)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  FileText,
  Sparkles,
  Building2,
  ChevronRight,
  Percent,
  Route,
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

type TabId = 'overview' | 'journey' | 'research' | 'coverage';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const sidebarItemVariants = {
  inactive: { backgroundColor: "rgba(255,255,255,0)" },
  active: { 
    backgroundColor: "rgba(255,255,255,0.1)",
    transition: { duration: 0.2 }
  }
};

const contentVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } }
};

// ============================================================================
// COLOR CONFIG
// ============================================================================

const colorConfig: Record<string, { 
  accent: string; 
  gradient: string; 
  bg: string;
  border: string;
  ring: string;
}> = {
  purple: { 
    accent: "text-purple-400", 
    gradient: "from-purple-500/20 to-violet-600/20",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    ring: "ring-purple-500/30"
  },
  cyan: { 
    accent: "text-cyan-400", 
    gradient: "from-cyan-500/20 to-teal-600/20",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    ring: "ring-cyan-500/30"
  },
  amber: { 
    accent: "text-amber-400", 
    gradient: "from-amber-500/20 to-orange-600/20",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    ring: "ring-amber-500/30"
  },
  rose: { 
    accent: "text-rose-400", 
    gradient: "from-rose-500/20 to-pink-600/20",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    ring: "ring-rose-500/30"
  },
  emerald: { 
    accent: "text-emerald-400", 
    gradient: "from-emerald-500/20 to-green-600/20",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/30"
  },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CoverageBadge({ status, size = 'md' }: { status: 'full' | 'partial' | 'none'; size?: 'sm' | 'md' }) {
  const config = {
    full: { 
      icon: CheckCircle2, 
      label: "Full Coverage",
      color: "text-emerald-400", 
      bg: "bg-emerald-500/15", 
      border: "border-emerald-500/30" 
    },
    partial: { 
      icon: AlertTriangle, 
      label: "Partial",
      color: "text-amber-400", 
      bg: "bg-amber-500/15", 
      border: "border-amber-500/30" 
    },
    none: { 
      icon: XCircle, 
      label: "No Coverage",
      color: "text-rose-400", 
      bg: "bg-rose-500/15", 
      border: "border-rose-500/30" 
    },
  };
  
  const { icon: Icon, label, color, bg, border } = config[status];
  const isSmall = size === 'sm';
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full border",
      bg, border,
      isSmall ? "px-2 py-1" : "px-3 py-1.5"
    )}>
      <Icon className={cn(isSmall ? "w-3 h-3" : "w-4 h-4", color)} />
      <span className={cn(isSmall ? "text-[10px]" : "text-xs", "font-medium", color)}>{label}</span>
    </div>
  );
}

function NavButton({ 
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
    <motion.button
      onClick={onClick}
      variants={sidebarItemVariants}
      animate={isActive ? "active" : "inactive"}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive 
          ? "text-white border-l-2 border-cyan-400" 
          : "text-white/50 hover:text-white/80 border-l-2 border-transparent"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  );
}

function QuickStat({ 
  label, 
  value, 
  icon: Icon,
  color 
}: { 
  label: string; 
  value: string; 
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
      <Icon className={cn("w-4 h-4", color)} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-white/40 uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function CompactStatCard({ 
  icon: Icon, 
  label, 
  value,
  color = "cyan"
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
    rose: "text-rose-400",
  };
  
  return (
    <div className="p-3 rounded-lg bg-slate-800/60 border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-3.5 h-3.5", colorClasses[color])} />
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function CoverageRow({ 
  label, 
  value, 
  isBoolean = false 
}: { 
  label: string; 
  value: boolean | string; 
  isBoolean?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-700/40">
      <span className="text-xs text-white/60">{label}</span>
      {isBoolean ? (
        value ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <XCircle className="w-4 h-4 text-rose-400" />
        )
      ) : (
        <span className="text-xs font-medium text-white">{value}</span>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PersonaDetailModal({ persona, onClose }: PersonaDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const coverageStatus = getCoverageStatus(persona);
  const colors = colorConfig[persona.color] || colorConfig.cyan;

  const navItems: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'journey', label: 'OH Journey', icon: Route },
    { id: 'coverage', label: 'Coverage', icon: Shield },
    { id: 'research', label: 'Research', icon: FileText },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />

      {/* Modal - Master-Detail Layout */}
      <motion.div
        variants={modalVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-modal-title"
        className="fixed inset-3 sm:inset-6 md:inset-10 lg:inset-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 z-50 overflow-hidden shadow-2xl flex"
      >
        {/* ===== LEFT SIDEBAR ===== */}
        <div className={cn(
          "w-[260px] flex-shrink-0 flex flex-col border-r border-white/10",
          "bg-gradient-to-b",
          colors.gradient
        )}>
          {/* Avatar Section */}
          <div className="p-5 flex flex-col items-center border-b border-white/10">
            <PersonaAvatar persona={persona} size="xl" showGlow />
            
            <h2 id="persona-modal-title" className="text-lg font-bold text-white mt-4 text-center">
              {persona.name}
            </h2>
            <p className={cn("text-xs font-medium mt-1 text-center", colors.accent)}>
              {persona.tagline}
            </p>
            <p className="text-[10px] text-white/30 mt-1 font-arabic" dir="rtl">
              {persona.arabicName}
            </p>
            
            {/* Coverage Badge */}
            <div className="mt-3">
              <CoverageBadge status={coverageStatus} size="sm" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="p-3 border-t border-white/10 space-y-2">
            <QuickStat 
              label="Participation" 
              value={`${persona.demographics.participationRate}%`}
              icon={TrendingUp}
              color={colors.accent}
            />
            <QuickStat 
              label="Labor Force" 
              value={`${persona.demographics.populationShare}%`}
              icon={Percent}
              color="text-white/60"
            />
          </div>
        </div>

        {/* ===== RIGHT CONTENT PANEL ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", colors.bg, colors.border, "border")}>
                {activeTab === 'overview' && <Users className={cn("w-5 h-5", colors.accent)} />}
                {activeTab === 'journey' && <Route className={cn("w-5 h-5", colors.accent)} />}
                {activeTab === 'coverage' && <Shield className={cn("w-5 h-5", colors.accent)} />}
                {activeTab === 'research' && <FileText className={cn("w-5 h-5", colors.accent)} />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {activeTab === 'overview' && 'Demographic Overview'}
                  {activeTab === 'journey' && 'Occupational Health Journey'}
                  {activeTab === 'coverage' && 'GOSI Coverage Details'}
                  {activeTab === 'research' && 'Research & Sources'}
                </h3>
                <p className="text-xs text-white/40">{persona.name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Panel - No Scrolling */}
          <div className="flex-1 p-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={contentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full"
              >
                {activeTab === 'overview' && <OverviewPanel persona={persona} colors={colors} />}
                {activeTab === 'journey' && <JourneyPanel persona={persona} colors={colors} />}
                {activeTab === 'coverage' && <CoveragePanel persona={persona} colors={colors} />}
                {activeTab === 'research' && <ResearchPanel persona={persona} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============================================================================
// COMPACT PANEL COMPONENTS (No Scrolling)
// ============================================================================

function OverviewPanel({ persona, colors }: { persona: Persona; colors: typeof colorConfig.cyan }) {
  return (
    <div className="h-full grid grid-cols-2 gap-4">
      {/* Left Column */}
      <div className="space-y-4">
        {/* Key Stats - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          <CompactStatCard 
            icon={Users}
            label="Labor Force"
            value={`${persona.demographics.populationShare}%`}
            color={persona.color}
          />
          <CompactStatCard 
            icon={TrendingUp}
            label="Participation"
            value={`${persona.demographics.participationRate}%`}
            color="emerald"
          />
          <CompactStatCard 
            icon={AlertTriangle}
            label="Unemployment"
            value={`${persona.demographics.unemploymentRate}%`}
            color={persona.demographics.unemploymentRate > 10 ? "amber" : "cyan"}
          />
          <CompactStatCard 
            icon={Briefcase}
            label="Age Group"
            value={persona.demographics.keyAgeGroup}
            color="purple"
          />
        </div>

        {/* Primary Sectors */}
        <div className="p-3 rounded-lg bg-slate-800/40 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-white/50" />
            <span className="text-xs text-white/50 uppercase tracking-wider">Primary Sectors</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {persona.demographics.primarySectors.slice(0, 5).map((sector) => (
              <span key={sector} className="px-2 py-0.5 rounded bg-slate-700/50 text-[10px] text-white/60">
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        {/* Key Risks */}
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Key Occupational Risks</span>
          </div>
          <ul className="space-y-1">
            {persona.research.keyRisks.slice(0, 3).map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                <ChevronRight className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Current Challenges */}
        <div className="p-3 rounded-lg bg-slate-800/40 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-white/50 uppercase tracking-wider">Challenges</span>
          </div>
          <ul className="space-y-1">
            {persona.research.challenges.slice(0, 3).map((challenge, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                <ChevronRight className="w-3 h-3 text-white/30 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{challenge}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Changes */}
        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Recent Policy Changes</span>
          </div>
          <ul className="space-y-1">
            {persona.research.recentChanges.slice(0, 2).map((change, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-white/60">
                <span className="text-emerald-400">•</span>
                <span className="line-clamp-1">{change}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function JourneyPanel({ persona, colors }: { persona: Persona; colors: typeof colorConfig.cyan }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <p className="text-sm text-white/60">
          What happens when <span className="text-white font-medium">{persona.name}</span> experiences a workplace injury?
        </p>
        <div className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-white/10">
          <span className="text-[10px] text-white/40 uppercase">Duration:</span>
          <span className={cn("ml-2 text-sm font-semibold", colors.accent)}>{persona.ohJourney.totalDuration}</span>
        </div>
      </div>

      {/* Horizontal Timeline */}
      <div className="flex-1">
        <CoverageTimeline 
          steps={persona.ohJourney.steps}
          outcome={persona.ohJourney.outcome}
          personaColor={persona.color}
          variant="horizontal"
        />
      </div>
    </div>
  );
}

function CoveragePanel({ persona, colors }: { persona: Persona; colors: typeof colorConfig.cyan }) {
  const coverageStatus = getCoverageStatus(persona);
  
  return (
    <div className="h-full grid grid-cols-2 gap-5">
      {/* Left - Coverage Status */}
      <div className="space-y-4">
        {/* Large Status Badge */}
        <div className={cn(
          "p-4 rounded-xl border",
          coverageStatus === 'full' ? "bg-emerald-500/10 border-emerald-500/30" :
          coverageStatus === 'partial' ? "bg-amber-500/10 border-amber-500/30" :
          "bg-rose-500/10 border-rose-500/30"
        )}>
          <div className="flex items-center gap-3">
            {coverageStatus === 'full' && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
            {coverageStatus === 'partial' && <AlertTriangle className="w-8 h-8 text-amber-400" />}
            {coverageStatus === 'none' && <XCircle className="w-8 h-8 text-rose-400" />}
            <div>
              <p className="text-lg font-bold text-white">{getCoverageLabel(coverageStatus)}</p>
              <p className="text-xs text-white/50">GOSI Social Insurance</p>
            </div>
          </div>
        </div>

        {/* Coverage Details */}
        <div className="space-y-2">
          <CoverageRow label="Annuities (Pension)" value={persona.coverage.annuities} isBoolean />
          <CoverageRow label="Occupational Hazards" value={persona.coverage.occupationalHazards} isBoolean />
          <CoverageRow label="Contribution Rate" value={persona.coverage.contributionRate} />
          <CoverageRow label="Paid By" value={persona.coverage.payer.charAt(0).toUpperCase() + persona.coverage.payer.slice(1)} />
        </div>
      </div>

      {/* Right - Gaps & Impact */}
      <div className="space-y-4">
        {/* Coverage Gaps */}
        {persona.coverage.gaps.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Coverage Gaps</span>
            </div>
            <ul className="space-y-2">
              {persona.coverage.gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <span className="text-amber-400 mt-0.5">!</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What This Means */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-white/50" />
            <span className="text-sm font-medium text-white/70">What This Means</span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            {coverageStatus === 'full' && "Full access to GOSI benefits including pension, occupational injury compensation, medical care, and rehabilitation services."}
            {coverageStatus === 'partial' && "Limited to occupational hazard coverage only. No pension or retirement benefits. Medical and injury compensation available for work-related incidents."}
            {coverageStatus === 'none' && "Not covered by GOSI. No formal protections for workplace injuries. Dependent on employer goodwill for any support."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResearchPanel({ persona }: { persona: Persona }) {
  return (
    <div className="h-full flex flex-col">
      {/* AI Badge */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4 flex-shrink-0">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <div>
          <p className="text-sm font-medium text-purple-300">AI-Powered Research</p>
          <p className="text-[10px] text-purple-300/60">Data from official sources with full citations</p>
        </div>
      </div>

      {/* Sources */}
      <div className="flex-1 overflow-hidden">
        <SourceCitations sources={persona.research.sources} compact />
      </div>
    </div>
  );
}

export default PersonaDetailModal;
