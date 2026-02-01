/**
 * Loading Briefing Component
 * 
 * Premium loading screen while AI researches the country
 * Shows real-time agent activity when agent_log is provided
 * Features a country map visualization
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Database, Search, FileText, Sparkles, Brain, Users, Building2, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { cn } from '../../lib/utils';

// TopoJSON URL for world map
const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO3 to ISO numeric code mapping for map highlighting
const ISO3_TO_NUMERIC: Record<string, string> = {
  // GCC
  SAU: '682', ARE: '784', KWT: '414', QAT: '634', BHR: '048', OMN: '512',
  // Europe
  DEU: '276', GBR: '826', FRA: '250', TUR: '792', POL: '616', ITA: '380', ESP: '724',
  NLD: '528', BEL: '056', CHE: '756', AUT: '040', SWE: '752', NOR: '578', DNK: '208',
  FIN: '246', PRT: '620', GRC: '300', CZE: '203', ROU: '642', HUN: '348', IRL: '372',
  // Americas
  USA: '840', CAN: '124', BRA: '076', MEX: '484', ARG: '032', CHL: '152', COL: '170',
  // Asia
  JPN: '392', CHN: '156', IND: '356', SGP: '702', IDN: '360', KOR: '410', THA: '764',
  VNM: '704', MYS: '458', PHL: '608', PAK: '586', BGD: '050',
  // Oceania
  AUS: '036', NZL: '554',
  // Africa
  ZAF: '710', NGA: '566', EGY: '818', KEN: '404', MAR: '504', DZA: '012', ETH: '231',
};

// Country center coordinates for zooming
const COUNTRY_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  // GCC
  SAU: { center: [45, 24], zoom: 4 },
  ARE: { center: [54, 24], zoom: 6 },
  KWT: { center: [47.5, 29.5], zoom: 8 },
  QAT: { center: [51.2, 25.3], zoom: 10 },
  BHR: { center: [50.5, 26], zoom: 12 },
  OMN: { center: [57, 21], zoom: 5 },
  // Europe
  DEU: { center: [10, 51], zoom: 5 },
  GBR: { center: [-2, 54], zoom: 5 },
  FRA: { center: [2, 46], zoom: 5 },
  TUR: { center: [35, 39], zoom: 4.5 },
  POL: { center: [19, 52], zoom: 5 },
  // Americas
  USA: { center: [-98, 39], zoom: 2.5 },
  CAN: { center: [-106, 56], zoom: 2 },
  BRA: { center: [-52, -14], zoom: 2.5 },
  MEX: { center: [-102, 23], zoom: 3 },
  // Asia
  JPN: { center: [138, 36], zoom: 4 },
  CHN: { center: [104, 35], zoom: 2.5 },
  IND: { center: [78, 22], zoom: 3 },
  SGP: { center: [104, 1.4], zoom: 10 },
  IDN: { center: [118, -2], zoom: 3 },
  // Oceania
  AUS: { center: [134, -25], zoom: 2.5 },
  NZL: { center: [172, -41], zoom: 4 },
  // Africa
  ZAF: { center: [25, -29], zoom: 4 },
  NGA: { center: [8, 10], zoom: 4 },
  EGY: { center: [30, 27], zoom: 4.5 },
};

// Default center for unknown countries
const DEFAULT_CENTER = { center: [0, 20] as [number, number], zoom: 1 };

interface AgentLogEntry {
  timestamp: string;
  agent: string;
  status: string;
  message: string;
  emoji: string;
}

interface LoadingBriefingProps {
  countryName: string;
  countryFlag: string;
  countryIsoCode?: string;
  agentLog?: AgentLogEntry[];
  isComplete?: boolean;
  onComplete?: () => void;
}

// Fallback steps when no agent_log is available
const LOADING_STEPS = [
  { id: 'database', label: 'Accessing country database...', icon: Database, emoji: '📊' },
  { id: 'research', label: 'Researching recent developments...', icon: Search, emoji: '🔍' },
  { id: 'analyze', label: 'Analyzing occupational health landscape...', icon: Globe, emoji: '🌍' },
  { id: 'stakeholders', label: 'Identifying key stakeholders...', icon: Users, emoji: '👥' },
  { id: 'institutions', label: 'Mapping institutional framework...', icon: Building2, emoji: '🏛️' },
  { id: 'generate', label: 'Preparing your intelligence briefing...', icon: Brain, emoji: '🧠' },
  { id: 'finalize', label: 'Finalizing mission parameters...', icon: Sparkles, emoji: '✨' },
];

// Map agent names to icons
const AGENT_ICONS: Record<string, React.ElementType> = {
  'Orchestrator': Sparkles,
  'DataAgent': Database,
  'ResearchAgent': Search,
  'BriefingAgent': Brain,
  'IntelligenceAgent': Globe,
};

// Map status to colors
const STATUS_COLORS: Record<string, string> = {
  'starting': 'text-blue-400',
  'researching': 'text-amber-400',
  'analyzing': 'text-purple-400',
  'synthesizing': 'text-cyan-400',
  'querying': 'text-indigo-400',
  'complete': 'text-emerald-400',
  'error': 'text-red-400',
};

export function LoadingBriefing({ 
  countryName, 
  countryFlag, 
  countryIsoCode,
  agentLog = [],
  isComplete = false,
  onComplete 
}: LoadingBriefingProps) {
  const [displayedLogs, setDisplayedLogs] = useState<AgentLogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Get country info for map
  const countryNumericCode = countryIsoCode ? ISO3_TO_NUMERIC[countryIsoCode.toUpperCase()] : undefined;
  const mapConfig = useMemo(() => {
    if (!countryIsoCode) return DEFAULT_CENTER;
    return COUNTRY_CENTERS[countryIsoCode.toUpperCase()] || DEFAULT_CENTER;
  }, [countryIsoCode]);

  // Animate through agent log entries when they arrive
  useEffect(() => {
    if (agentLog.length > 0) {
      // Show logs progressively with a slight delay between each
      let index = 0;
      const showNextLog = () => {
        if (index < agentLog.length) {
          setDisplayedLogs(prev => [...prev, agentLog[index]]);
          setProgress(((index + 1) / agentLog.length) * 100);
          index++;
          // Faster animation when catching up to real-time
          setTimeout(showNextLog, index < agentLog.length - 1 ? 300 : 500);
        }
      };
      showNextLog();
    }
  }, [agentLog]);

  // Auto-scroll log container
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  // Fallback animation when no agent log
  useEffect(() => {
    if (agentLog.length === 0 && !isComplete) {
      let stepTimeout: NodeJS.Timeout;
      let progressInterval: NodeJS.Timeout;

      const runStep = (stepIndex: number) => {
        if (stepIndex >= LOADING_STEPS.length) {
          setProgress(100);
          return;
        }

        setCurrentStep(stepIndex);
        const stepProgress = (stepIndex / LOADING_STEPS.length) * 100;
        const nextProgress = ((stepIndex + 1) / LOADING_STEPS.length) * 100;

        // Animate progress during this step
        const duration = 2000 + Math.random() * 1000;
        const progressStep = (nextProgress - stepProgress) / (duration / 50);
        let currentProgress = stepProgress;

        progressInterval = setInterval(() => {
          currentProgress += progressStep;
          if (currentProgress >= nextProgress) {
            currentProgress = nextProgress;
            clearInterval(progressInterval);
          }
          setProgress(currentProgress);
        }, 50);

        stepTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          runStep(stepIndex + 1);
        }, duration);
      };

      runStep(0);

      return () => {
        clearTimeout(stepTimeout);
        clearInterval(progressInterval);
      };
    }
  }, [agentLog.length, isComplete]);

  // Handle completion
  useEffect(() => {
    if (isComplete && progress >= 95) {
      setProgress(100);
      const timer = setTimeout(() => onComplete?.(), 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, progress, onComplete]);

  const currentStepData = LOADING_STEPS[currentStep];
  const StepIcon = currentStepData?.icon || Globe;
  const hasAgentLog = agentLog.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-adl-accent/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-2xl mx-auto px-8"
      >
        {/* ADL Logo */}
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 bg-adl-accent/20 rounded-2xl border border-adl-accent/30 mb-6"
          animate={{
            boxShadow: [
              '0 0 30px rgba(6,182,212,0.3)',
              '0 0 60px rgba(6,182,212,0.5)',
              '0 0 30px rgba(6,182,212,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src="/adl-logo.png" alt="ADL" className="h-12 w-12 object-contain" />
        </motion.div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Intelligence Briefing
        </h1>
        <p className="text-white/60 mb-4">
          Preparing your mission for <span className="text-adl-accent font-semibold">{countryName}</span>
        </p>

        {/* Country Map and Flag */}
        <div className="relative mb-6">
          {/* Mini Map */}
          {countryIsoCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-64 h-40 mx-auto bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden"
            >
              {/* Scanning overlay effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-adl-accent/10 via-transparent to-transparent"
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
              
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  center: mapConfig.center,
                  scale: 100 * mapConfig.zoom,
                }}
                style={{ width: '100%', height: '100%' }}
              >
                <Geographies geography={WORLD_TOPO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const isHighlighted = geo.id === countryNumericCode;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={isHighlighted ? '#06b6d4' : '#334155'}
                          stroke={isHighlighted ? '#22d3ee' : '#475569'}
                          strokeWidth={isHighlighted ? 1.5 : 0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none' },
                            pressed: { outline: 'none' },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>

              {/* Pulsing marker on country */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <MapPin className="w-6 h-6 text-adl-accent drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </motion.div>

              {/* Country code badge */}
              <div className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-xs font-mono text-adl-accent border border-adl-accent/30">
                {countryIsoCode}
              </div>
            </motion.div>
          )}

          {/* Flag overlay on map or standalone */}
          <motion.div
            className={cn(
              "text-4xl",
              countryIsoCode ? "absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-900 rounded-full p-2 border border-slate-700" : ""
            )}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {countryFlag}
          </motion.div>
        </div>

        {/* Agent Activity Log (when available) */}
        {hasAgentLog ? (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
              <Sparkles className="w-4 h-4 text-adl-accent" />
              <span className="text-sm font-medium text-white/80">Agent Activity</span>
              {!isComplete && (
                <Loader2 className="w-3 h-3 text-adl-accent animate-spin ml-auto" />
              )}
            </div>
            <div 
              ref={logContainerRef}
              className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600"
            >
              <AnimatePresence>
                {displayedLogs.map((entry, index) => {
                  const Icon = AGENT_ICONS[entry.agent] || Sparkles;
                  const statusColor = STATUS_COLORS[entry.status] || 'text-slate-400';
                  const isLast = index === displayedLogs.length - 1;
                  
                  return (
                    <motion.div
                      key={`${entry.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex items-start gap-3 text-sm py-1.5",
                        isLast && !isComplete && "animate-pulse"
                      )}
                    >
                      <span className="text-lg flex-shrink-0">{entry.emoji}</span>
                      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", statusColor)} />
                      <div className="flex-1 min-w-0">
                        <span className={cn("font-medium", statusColor)}>[{entry.agent}]</span>
                        <span className="text-white/70 ml-2">{entry.message}</span>
                      </div>
                      {entry.status === 'complete' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Current Step (fallback) */
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <span className="text-2xl">{currentStepData?.emoji}</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <StepIcon className="w-5 h-5 text-adl-accent" />
              </motion.div>
              <span className="text-white/80">{currentStepData?.label}</span>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Progress Bar */}
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-adl-accent to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '500%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        {/* Progress Percentage */}
        <p className="text-sm text-white/40">
          {isComplete ? 'Complete!' : `${Math.round(progress)}% complete`}
        </p>

        {/* Step Indicators (only for fallback) */}
        {!hasAgentLog && (
          <div className="flex justify-center gap-2 mt-6">
            {LOADING_STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index < currentStep
                    ? 'bg-adl-accent'
                    : index === currentStep
                    ? 'bg-adl-accent animate-pulse'
                    : 'bg-white/20'
                )}
                animate={index === currentStep ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default LoadingBriefing;
