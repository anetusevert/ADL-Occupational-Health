/**
 * Arthur D. Little - Global Health Platform
 * Strategic Deep Dive - Admin Console
 * 
 * Phase 27: Expert AI-Powered Country Analysis
 * 
 * Features:
 * - Three-column layout: Country Selection, Topics, Report
 * - Admin-only generation controls (no auto-generation)
 * - Batch generation for multiple countries
 * - Admin menu for Edit/Delete/Amend reports
 * - 3 topics per framework area (12 total + comprehensive)
 * - PDF export functionality
 * - Persistent report storage
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Globe,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Target,
  FileText,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Zap,
  RefreshCw,
  Shield,
  Database,
  Heart,
  Crown,
  Eye,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  PlayCircle,
  Users,
  X,
  Check,
  FileDown,
  Layers,
} from "lucide-react";
import {
  getStrategicDeepDiveCountries,
  getStrategicDeepDiveReport,
  generateStrategicDeepDive,
  generateAllTopicsForCountry,
  getCountryTopicStatuses,
  deleteStrategicDeepDive,
  type CountryDeepDiveItem,
  type StrategicDeepDiveReport,
  type KeyFinding,
  type SWOTItem,
  type StrategicRecommendation,
  type TopicStatus,
  type GenerateAllTopicsResponse,
} from "../../services/api";
import { cn, getApiBaseUrl } from "../../lib/utils";

// =============================================================================
// CONSTANTS
// =============================================================================

const CONTINENT_MAP: Record<string, string> = {
  // Africa
  DZA: "Africa", AGO: "Africa", BEN: "Africa", BWA: "Africa", BFA: "Africa",
  BDI: "Africa", CPV: "Africa", CMR: "Africa", CAF: "Africa", TCD: "Africa",
  COM: "Africa", COG: "Africa", COD: "Africa", CIV: "Africa", DJI: "Africa",
  EGY: "Africa", GNQ: "Africa", ERI: "Africa", SWZ: "Africa", ETH: "Africa",
  GAB: "Africa", GMB: "Africa", GHA: "Africa", GIN: "Africa", GNB: "Africa",
  KEN: "Africa", LSO: "Africa", LBR: "Africa", LBY: "Africa", MDG: "Africa",
  MWI: "Africa", MLI: "Africa", MRT: "Africa", MUS: "Africa", MAR: "Africa",
  MOZ: "Africa", NAM: "Africa", NER: "Africa", NGA: "Africa", RWA: "Africa",
  STP: "Africa", SEN: "Africa", SYC: "Africa", SLE: "Africa", SOM: "Africa",
  ZAF: "Africa", SSD: "Africa", SDN: "Africa", TZA: "Africa", TGO: "Africa",
  TUN: "Africa", UGA: "Africa", ZMB: "Africa", ZWE: "Africa",
  // Americas
  ATG: "Americas", ARG: "Americas", BHS: "Americas", BRB: "Americas", BLZ: "Americas",
  BOL: "Americas", BRA: "Americas", CAN: "Americas", CHL: "Americas", COL: "Americas",
  CRI: "Americas", CUB: "Americas", DMA: "Americas", DOM: "Americas", ECU: "Americas",
  SLV: "Americas", GRD: "Americas", GTM: "Americas", GUY: "Americas", HTI: "Americas",
  HND: "Americas", JAM: "Americas", MEX: "Americas", NIC: "Americas", PAN: "Americas",
  PRY: "Americas", PER: "Americas", KNA: "Americas", LCA: "Americas", VCT: "Americas",
  SUR: "Americas", TTO: "Americas", USA: "Americas", URY: "Americas", VEN: "Americas",
  // Asia
  AFG: "Asia", ARM: "Asia", AZE: "Asia", BHR: "Asia", BGD: "Asia", BTN: "Asia",
  BRN: "Asia", KHM: "Asia", CHN: "Asia", CYP: "Asia", GEO: "Asia", IND: "Asia",
  IDN: "Asia", IRN: "Asia", IRQ: "Asia", ISR: "Asia", JPN: "Asia", JOR: "Asia",
  KAZ: "Asia", KWT: "Asia", KGZ: "Asia", LAO: "Asia", LBN: "Asia", MYS: "Asia",
  MDV: "Asia", MNG: "Asia", MMR: "Asia", NPL: "Asia", PRK: "Asia", OMN: "Asia",
  PAK: "Asia", PHL: "Asia", QAT: "Asia", SAU: "Asia", SGP: "Asia", KOR: "Asia",
  LKA: "Asia", SYR: "Asia", TJK: "Asia", THA: "Asia", TLS: "Asia", TKM: "Asia",
  ARE: "Asia", UZB: "Asia", VNM: "Asia", YEM: "Asia", PSE: "Asia", TWN: "Asia",
  // Europe
  ALB: "Europe", AND: "Europe", AUT: "Europe", BLR: "Europe", BEL: "Europe",
  BIH: "Europe", BGR: "Europe", HRV: "Europe", CZE: "Europe", DNK: "Europe",
  EST: "Europe", FIN: "Europe", FRA: "Europe", DEU: "Europe", GRC: "Europe",
  HUN: "Europe", ISL: "Europe", IRL: "Europe", ITA: "Europe", LVA: "Europe",
  LIE: "Europe", LTU: "Europe", LUX: "Europe", MLT: "Europe", MDA: "Europe",
  MCO: "Europe", MNE: "Europe", NLD: "Europe", MKD: "Europe", NOR: "Europe",
  POL: "Europe", PRT: "Europe", ROU: "Europe", RUS: "Europe", SMR: "Europe",
  SRB: "Europe", SVK: "Europe", SVN: "Europe", ESP: "Europe", SWE: "Europe",
  CHE: "Europe", UKR: "Europe", GBR: "Europe", VAT: "Europe",
  // Oceania
  AUS: "Oceania", FJI: "Oceania", KIR: "Oceania", MHL: "Oceania", FSM: "Oceania",
  NRU: "Oceania", NZL: "Oceania", PLW: "Oceania", PNG: "Oceania", WSM: "Oceania",
  SLB: "Oceania", TON: "Oceania", TUV: "Oceania", VUT: "Oceania",
};

const CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"] as const;

// Framework layers with 3 topics each
const FRAMEWORK_LAYERS = [
  {
    id: "governance",
    name: "Governance Ecosystem",
    description: "Strategic capacity & policy foundations",
    icon: Crown,
    color: "purple",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    iconBgClass: "bg-purple-500/20",
    iconColorClass: "text-purple-400",
    topics: [
      { id: "gov-policy", name: "Policy & Regulatory Framework", description: "National OH policies, legislation & ILO compliance" },
      { id: "gov-enforcement", name: "Inspection & Enforcement Capacity", description: "Inspector density, enforcement mechanisms & penalties" },
      { id: "gov-tripartite", name: "Tripartite Governance & Social Dialogue", description: "Employer-worker-government collaboration structures" },
    ],
  },
  {
    id: "hazard",
    name: "Hazard Prevention",
    description: "Pillar I — Prevention & Control",
    icon: Shield,
    color: "blue",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    iconBgClass: "bg-blue-500/20",
    iconColorClass: "text-blue-400",
    topics: [
      { id: "haz-chemical", name: "Chemical & Carcinogen Exposure Control", description: "OEL compliance, hazardous substance management" },
      { id: "haz-physical", name: "Physical Hazards & Ergonomics", description: "Noise, vibration, ergonomic risk management" },
      { id: "haz-climate", name: "Heat Stress & Climate Adaptation", description: "Thermal regulations, outdoor worker protection" },
    ],
  },
  {
    id: "vigilance",
    name: "Surveillance & Detection",
    description: "Pillar II — Health Vigilance",
    icon: Eye,
    color: "teal",
    bgClass: "bg-teal-500/10",
    borderClass: "border-teal-500/30",
    iconBgClass: "bg-teal-500/20",
    iconColorClass: "text-teal-400",
    topics: [
      { id: "vig-disease", name: "Occupational Disease Surveillance", description: "Disease detection, reporting systems & registries" },
      { id: "vig-mental", name: "Workplace Mental Health Programs", description: "Psychosocial risk assessment, EAPs & support" },
      { id: "vig-screening", name: "Health Screening & Medical Surveillance", description: "Pre-employment & periodic health examinations" },
    ],
  },
  {
    id: "restoration",
    name: "Restoration & Compensation",
    description: "Pillar III — Recovery & Support",
    icon: Heart,
    color: "amber",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    iconBgClass: "bg-amber-500/20",
    iconColorClass: "text-amber-400",
    topics: [
      { id: "rest-compensation", name: "Workers' Compensation Systems", description: "Insurance coverage, claim processes & benefits" },
      { id: "rest-rtw", name: "Return-to-Work & Rehabilitation", description: "Vocational rehab, workplace accommodation programs" },
      { id: "rest-migrant", name: "Migrant & Informal Worker Protection", description: "Coverage gaps, portability & informal sector inclusion" },
    ],
  },
];

// =============================================================================
// PDF EXPORT UTILITY
// =============================================================================

function generatePDF(report: StrategicDeepDiveReport) {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.strategy_name || report.country_name} - Strategic Deep Dive Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1a1a2e;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #6366f1;
        }
        .header h1 {
          font-size: 28px;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .header .subtitle {
          font-size: 14px;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .header .meta {
          margin-top: 16px;
          font-size: 12px;
          color: #666;
        }
        .section {
          margin-bottom: 32px;
        }
        .section h2 {
          font-size: 18px;
          color: #1a1a2e;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .section p {
          font-size: 14px;
          color: #374151;
        }
        .findings-list {
          list-style: none;
        }
        .findings-list li {
          padding: 12px;
          margin-bottom: 8px;
          background: #f9fafb;
          border-left: 4px solid #6366f1;
        }
        .findings-list li strong {
          display: block;
          color: #1a1a2e;
          margin-bottom: 4px;
        }
        .swot-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .swot-box {
          padding: 16px;
          border-radius: 8px;
        }
        .swot-box.strengths { background: #d1fae5; border: 1px solid #10b981; }
        .swot-box.weaknesses { background: #fee2e2; border: 1px solid #ef4444; }
        .swot-box.opportunities { background: #fef3c7; border: 1px solid #f59e0b; }
        .swot-box.threats { background: #ede9fe; border: 1px solid #8b5cf6; }
        .swot-box h3 {
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .swot-box ul {
          list-style: disc;
          padding-left: 20px;
          font-size: 13px;
        }
        .recommendations {
          list-style: none;
        }
        .recommendations li {
          padding: 16px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #f0f9ff, #ede9fe);
          border-radius: 8px;
          border: 1px solid #c7d2fe;
        }
        .recommendations li .title {
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 4px;
        }
        .recommendations li .priority {
          display: inline-block;
          padding: 2px 8px;
          font-size: 10px;
          border-radius: 4px;
          background: #6366f1;
          color: white;
          margin-left: 8px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="subtitle">Strategic Deep Dive Report</div>
        <h1>${report.strategy_name || `${report.country_name} Analysis`}</h1>
        <div class="meta">
          ${report.country_name} | Generated: ${report.generated_at ? new Date(report.generated_at).toLocaleDateString() : 'N/A'} | ${report.ai_provider || 'AI Analysis'}
        </div>
      </div>

      ${report.executive_summary ? `
      <div class="section">
        <h2>Executive Summary</h2>
        <p>${report.executive_summary}</p>
      </div>
      ` : ''}

      ${report.key_findings?.length ? `
      <div class="section">
        <h2>Key Findings</h2>
        <ul class="findings-list">
          ${report.key_findings.map((f: KeyFinding) => `
            <li>
              <strong>${f.title}</strong>
              ${f.description}
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      ${(report.strengths?.length || report.weaknesses?.length) ? `
      <div class="section">
        <h2>SWOT Analysis</h2>
        <div class="swot-grid">
          <div class="swot-box strengths">
            <h3>Strengths</h3>
            <ul>${report.strengths?.map((s: SWOTItem) => `<li>${s.title}</li>`).join('') || '<li>None identified</li>'}</ul>
          </div>
          <div class="swot-box weaknesses">
            <h3>Weaknesses</h3>
            <ul>${report.weaknesses?.map((w: SWOTItem) => `<li>${w.title}</li>`).join('') || '<li>None identified</li>'}</ul>
          </div>
          <div class="swot-box opportunities">
            <h3>Opportunities</h3>
            <ul>${report.opportunities?.map((o: SWOTItem) => `<li>${o.title}</li>`).join('') || '<li>None identified</li>'}</ul>
          </div>
          <div class="swot-box threats">
            <h3>Threats</h3>
            <ul>${report.threats?.map((t: SWOTItem) => `<li>${t.title}</li>`).join('') || '<li>None identified</li>'}</ul>
          </div>
        </div>
      </div>
      ` : ''}

      ${report.strategic_recommendations?.length ? `
      <div class="section">
        <h2>Strategic Recommendations</h2>
        <ul class="recommendations">
          ${report.strategic_recommendations.map((r: StrategicRecommendation) => `
            <li>
              <div class="title">${r.title}<span class="priority">${r.priority}</span></div>
              <p>${r.description}</p>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      ${report.priority_interventions?.length ? `
      <div class="section">
        <h2>Priority Interventions</h2>
        <ol>
          ${report.priority_interventions.map((item: string) => `<li>${item}</li>`).join('')}
        </ol>
      </div>
      ` : ''}

      <div class="footer">
        <p>Arthur D. Little - Global Health Intelligence Platform</p>
        <p>ADL Occupational Health Framework - Confidential Report</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

// =============================================================================
// COUNTRY TILE COMPONENT
// =============================================================================

interface CountryTileProps {
  country: CountryDeepDiveItem;
  isSelected: boolean;
  onClick: () => void;
}

function CountryTile({ country, isSelected, onClick }: CountryTileProps) {
  const status = country.deep_dive_status;
  const completedReports = country.completed_reports || 0;
  const hasReports = completedReports > 0;
  const apiBaseUrl = getApiBaseUrl();
  const flagUrl = country.flag_url ? `${apiBaseUrl}${country.flag_url}` : null;
  const [imgError, setImgError] = useState(false);
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-200 w-full",
        isSelected 
          ? "bg-purple-500/20 border-purple-500/50 ring-1 ring-purple-500/30"
          : hasReports
            ? "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30"
            : "bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/40 hover:border-slate-600/50"
      )}
    >
      {/* Status Badge - Shows count of completed reports */}
      {hasReports && (
        <div className={cn(
          "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-lg text-[9px] font-bold px-1",
          completedReports >= 13
            ? "bg-emerald-500 shadow-emerald-500/30 text-white"
            : "bg-amber-500 shadow-amber-500/30 text-white"
        )}>
          {completedReports >= 13 ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            completedReports
          )}
        </div>
      )}
      {status === "processing" && !hasReports && (
        <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        </div>
      )}
      
      {/* Flag Image */}
      <div className="w-6 h-4 rounded overflow-hidden flex-shrink-0 bg-slate-700/50">
        {flagUrl && !imgError ? (
          <img 
            src={flagUrl} 
            alt={`${country.name} flag`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-500 font-medium">
            {country.iso_code}
          </div>
        )}
      </div>
      
      {/* Country Name */}
      <span className={cn(
        "text-xs truncate flex-1 text-left",
        isSelected ? "text-purple-200" : hasReports ? "text-emerald-200" : "text-slate-300"
      )}>
        {country.name}
      </span>
    </motion.button>
  );
}

// =============================================================================
// CONTINENT SECTION COMPONENT
// =============================================================================

interface ContinentSectionProps {
  continent: string;
  countries: CountryDeepDiveItem[];
  selectedCountries: Set<string>;
  onCountryToggle: (iso: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  selectionMode: boolean;
}

function ContinentSection({
  continent,
  countries,
  selectedCountries,
  onCountryToggle,
  isExpanded,
  onToggle,
  selectionMode,
}: ContinentSectionProps) {
  // Count countries with at least one completed report
  const countriesWithReports = countries.filter(c => (c.completed_reports || 0) > 0).length;
  const selectedInContinent = countries.filter(c => selectedCountries.has(c.iso_code)).length;
  
  return (
    <div className="border-b border-slate-700/30 last:border-b-0">
      {/* Continent Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </motion.div>
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-sm font-medium text-white">{continent}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {selectionMode && selectedInContinent > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
              {selectedInContinent} selected
            </span>
          )}
          {countriesWithReports > 0 ? (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {countriesWithReports}/{countries.length}
            </span>
          ) : (
            <span className="text-slate-500">/ {countries.length}</span>
          )}
        </div>
      </button>
      
      {/* Countries Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1">
              {countries.map((country) => (
                <div key={country.iso_code} className="flex items-center gap-1.5">
                  {selectionMode && (
                    <button
                      onClick={() => onCountryToggle(country.iso_code)}
                      className={cn(
                        "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                        selectedCountries.has(country.iso_code)
                          ? "bg-purple-500 border-purple-500"
                          : "border-slate-600 hover:border-purple-400"
                      )}
                    >
                      {selectedCountries.has(country.iso_code) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  )}
                  <CountryTile
                    country={country}
                    isSelected={!selectionMode && selectedCountries.has(country.iso_code)}
                    onClick={() => onCountryToggle(country.iso_code)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TOPIC CARD COMPONENT
// =============================================================================

interface TopicCardProps {
  topic: { id: string; name: string; description: string };
  layer: typeof FRAMEWORK_LAYERS[0];
  isSelected: boolean;
  onClick: () => void;
}

function TopicCard({ topic, layer, isSelected, onClick }: TopicCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-2.5 rounded-lg border transition-all duration-200",
        isSelected
          ? `${layer.bgClass} ${layer.borderClass} ring-1 ring-${layer.color}-500/20`
          : "bg-slate-800/20 border-slate-700/20 hover:bg-slate-800/40 hover:border-slate-600/40"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
          isSelected ? layer.iconColorClass.replace('text-', 'bg-') : "bg-slate-600"
        )} />
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-xs font-medium truncate",
            isSelected ? "text-white" : "text-slate-400"
          )}>
            {topic.name}
          </h4>
          <p className="text-[10px] text-slate-500 truncate mt-0.5">
            {topic.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// ADMIN MENU COMPONENT
// =============================================================================

interface AdminMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onExportPDF: () => void;
  hasReport: boolean;
}

function AdminMenu({ onEdit, onDelete, onExportPDF, hasReport }: AdminMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-slate-400" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              className="absolute right-0 top-full mt-1 z-50 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
            >
              {hasReport && (
                <>
                  <button
                    onClick={() => { onExportPDF(); setIsOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Export as PDF
                  </button>
                  <button
                    onClick={() => { onEdit(); setIsOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Report
                  </button>
                  <div className="border-t border-slate-700" />
                  <button
                    onClick={() => { onDelete(); setIsOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Report
                  </button>
                </>
              )}
              {!hasReport && (
                <div className="px-3 py-2 text-xs text-slate-500">
                  No report to manage
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// REPORT PANEL COMPONENT
// =============================================================================

interface ReportPanelProps {
  report: StrategicDeepDiveReport | null;
  isLoading: boolean;
  isGenerating: boolean;
  isGeneratingAll: boolean;
  generateAllProgress: string | null;
  completedReportsCount: number;
  countryName: string | null;
  selectedTopic: string;
  onGenerate: () => void;
  onRegenerate: () => void;
  onGenerateAll: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExportPDF: () => void;
  generationError: string | null;
}

function ReportPanel({
  report,
  isLoading,
  isGenerating,
  isGeneratingAll,
  generateAllProgress,
  completedReportsCount,
  countryName,
  selectedTopic,
  onGenerate,
  onRegenerate,
  onGenerateAll,
  onEdit,
  onDelete,
  onExportPDF,
  generationError,
}: ReportPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Loading state
  if (isLoading || isGenerating || isGeneratingAll) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full animate-pulse" />
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-400 text-sm mt-4">
            {isGeneratingAll 
              ? "Generating all 13 topic reports..." 
              : isGenerating 
                ? "Generating strategic analysis..." 
                : "Loading report..."}
          </p>
          {(isGenerating || isGeneratingAll) && countryName && (
            <p className="text-purple-400/70 text-xs mt-2">
              AI agents analyzing {countryName}
            </p>
          )}
          {isGeneratingAll && (
            <>
              {/* Progress indicator */}
              <div className="mt-4 w-64 mx-auto">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span className="text-cyan-400 font-medium">{completedReportsCount} / 13</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(completedReportsCount / 13) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-amber-400/60 text-[10px] mt-4">
                This may take 15-30 minutes. Please keep this page open.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // Error state
  if (generationError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertCircle className="w-12 h-12 text-red-400/70 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Generation Failed</h3>
          <p className="text-sm text-slate-400 mb-4">{generationError}</p>
          <button
            onClick={onGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Empty state - no selection
  if (!countryName) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
            <Brain className="w-10 h-10 text-purple-400/50" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Strategic Deep Dive
          </h3>
          <p className="text-sm text-slate-400">
            Select a country and analysis topic, then click "Generate Report" to create an AI-powered strategic assessment.
          </p>
        </div>
      </div>
    );
  }
  
  // Ready to generate (country selected but no report)
  if (!report) {
    return (
      <div className="h-full flex flex-col">
        {/* Header with Admin Actions */}
        <div className="flex-shrink-0 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">{countryName}</span>
              <span className="text-xs text-slate-500">• No reports yet</span>
            </div>
            <button
              onClick={onGenerateAll}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-500/50 disabled:to-orange-500/50 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed"
              title="Generate all 13 topic reports for this country"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating {completedReportsCount}/13...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Generate All 13 Reports
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
              <Sparkles className="w-10 h-10 text-cyan-400/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ready to Analyze {countryName}
            </h3>
            <p className="text-sm text-slate-400 mb-2">
              Topic: <span className="text-purple-300">{selectedTopic}</span>
            </p>
            <p className="text-xs text-slate-500 mb-6">
              No existing report found. Generate a new analysis.
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/20 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Generate This Topic
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 mt-2">
                Or use "Generate All 13 Reports" above to create all topic analyses (~30 min)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Display report
  return (
    <div className="h-full flex flex-col">
      {/* Report Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-sm border-b border-purple-500/30 px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-purple-300 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                Strategic Deep Dive Report
              </span>
            </div>
            <h2 className="text-lg font-bold text-white truncate">
              {report.strategy_name || `${report.country_name} Analysis`}
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-purple-200/60 mt-1">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {report.country_name}
              </span>
              {report.generated_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(report.generated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Admin Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button
              onClick={onGenerateAll}
              disabled={isGeneratingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-500 hover:to-orange-500 disabled:from-amber-500/40 disabled:to-orange-500/40 border border-amber-500/30 rounded-lg text-white text-xs font-medium transition-all disabled:cursor-not-allowed"
              title="Generate all 13 topic reports for this country"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {completedReportsCount}/13
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  All 13
                </>
              )}
            </button>
            <AdminMenu
              onEdit={onEdit}
              onDelete={onDelete}
              onExportPDF={onExportPDF}
              hasReport={true}
            />
          </div>
        </div>
      </div>
      
      {/* Report Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-6">
        {/* Executive Summary */}
        {report.executive_summary && (
          <section>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Executive Summary
            </h3>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
              <p className="text-slate-300 leading-relaxed text-sm">
                {report.executive_summary}
              </p>
            </div>
          </section>
        )}
        
        {/* Key Findings */}
        {report.key_findings?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Key Findings
            </h3>
            <div className="space-y-2">
              {report.key_findings.map((finding: KeyFinding, idx: number) => (
                <div key={idx} className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      finding.impact_level === "high" ? "bg-red-500/20 text-red-400" :
                      finding.impact_level === "medium" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-white">{finding.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{finding.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* SWOT Analysis */}
        {(report.strengths?.length > 0 || report.weaknesses?.length > 0) && (
          <section>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              SWOT Analysis
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <h4 className="text-xs font-semibold text-emerald-400">Strengths</h4>
                </div>
                <ul className="space-y-1">
                  {report.strengths?.map((item: SWOTItem, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <span className="text-slate-300">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <h4 className="text-xs font-semibold text-red-400">Weaknesses</h4>
                </div>
                <ul className="space-y-1">
                  {report.weaknesses?.map((item: SWOTItem, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <span className="text-slate-300">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <h4 className="text-xs font-semibold text-amber-400">Opportunities</h4>
                </div>
                <ul className="space-y-1">
                  {report.opportunities?.map((item: SWOTItem, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <span className="text-slate-300">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
                  <h4 className="text-xs font-semibold text-purple-400">Threats</h4>
                </div>
                <ul className="space-y-1">
                  {report.threats?.map((item: SWOTItem, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                      <span className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                      <span className="text-slate-300">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
        
        {/* Strategic Recommendations */}
        {report.strategic_recommendations?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              Strategic Recommendations
            </h3>
            <div className="space-y-2">
              {report.strategic_recommendations.map((rec: StrategicRecommendation, idx: number) => (
                <div key={idx} className="bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-xs font-medium text-white">{rec.title}</p>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0",
                      rec.priority === "critical" ? "bg-red-500/20 text-red-400" :
                      rec.priority === "high" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{rec.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Priority Interventions */}
        {report.priority_interventions?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-400" />
              Priority Interventions
            </h3>
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
              <ol className="space-y-1.5">
                {report.priority_interventions.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs">
                    <span className="w-5 h-5 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
        
        {/* Data Quality Notes */}
        {report.data_quality_notes && (
          <section className="border-t border-slate-700/40 pt-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Data Quality Notes
            </h3>
            <p className="text-[11px] text-slate-500 italic">{report.data_quality_notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// BATCH GENERATION MODAL
// =============================================================================

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountries: Set<string>;
  countriesData: CountryDeepDiveItem[];
  selectedTopic: string;
  onGenerate: () => void;
  isGenerating: boolean;
}

function BatchModal({
  isOpen,
  onClose,
  selectedCountries,
  countriesData,
  selectedTopic,
  onGenerate,
  isGenerating,
}: BatchModalProps) {
  if (!isOpen) return null;
  
  const selectedList = countriesData.filter(c => selectedCountries.has(c.iso_code));
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Batch Generation
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="p-5">
          <p className="text-sm text-slate-400 mb-4">
            Generate reports for <span className="text-purple-300 font-medium">{selectedCountries.size} countries</span> using:
          </p>
          <div className="bg-slate-700/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-500">Topic:</p>
            <p className="text-sm text-white font-medium">{selectedTopic}</p>
          </div>
          
          <div className="max-h-48 overflow-y-auto mb-4 space-y-1">
            {selectedList.map(country => (
              <div key={country.iso_code} className="flex items-center gap-2 text-xs text-slate-300 py-1">
                <CheckCircle2 className="w-3 h-3 text-purple-400" />
                {country.name}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Generate All
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StrategicDeepDive() {
  const queryClient = useQueryClient();
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());
  const [selectedTopic, setSelectedTopic] = useState<string>("Comprehensive Occupational Health Assessment");
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set(["Europe"]));
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set()); // Collapsible framework layers
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  // Get first selected country for single view
  const selectedCountry = useMemo(() => {
    if (batchMode || selectedCountries.size !== 1) return null;
    return Array.from(selectedCountries)[0];
  }, [selectedCountries, batchMode]);
  
  // Fetch countries
  const { data: countriesData, isLoading: isLoadingCountries, error: countriesError, refetch: refetchCountries } = useQuery({
    queryKey: ["strategic-deep-dive-countries"],
    queryFn: getStrategicDeepDiveCountries,
    staleTime: 30 * 1000,
    retry: 2,
  });
  
  // Fetch report for selected country AND topic
  const { data: report, isLoading: isLoadingReport, refetch: refetchReport } = useQuery({
    queryKey: ["strategic-deep-dive-report", selectedCountry, selectedTopic],
    queryFn: () => selectedCountry ? getStrategicDeepDiveReport(selectedCountry, selectedTopic) : null,
    enabled: !!selectedCountry && !batchMode,
    staleTime: 60 * 1000,
    retry: false,
  });
  
  // Fetch topic statuses for selected country (to show which topics have reports)
  // When isGeneratingAll is true, poll every 10 seconds to track progress
  const { data: topicStatuses } = useQuery({
    queryKey: ["strategic-deep-dive-topic-statuses", selectedCountry],
    queryFn: () => selectedCountry ? getCountryTopicStatuses(selectedCountry) : null,
    enabled: !!selectedCountry && !batchMode,
    staleTime: isGeneratingAll ? 5 * 1000 : 30 * 1000,
    refetchInterval: isGeneratingAll ? 10 * 1000 : false, // Poll every 10s when generating
  });
  
  // Build a map of topic name -> status for quick lookup
  const topicStatusMap = useMemo(() => {
    const map: Record<string, TopicStatus> = {};
    if (topicStatuses?.topics) {
      topicStatuses.topics.forEach(ts => {
        map[ts.topic] = ts;
      });
    }
    return map;
  }, [topicStatuses]);
  
  // Count completed reports (for progress tracking)
  const completedReportsCount = useMemo(() => {
    if (!topicStatuses?.topics) return 0;
    return topicStatuses.topics.filter(t => t.has_report).length;
  }, [topicStatuses]);
  
  // Effect: Stop polling when all 13 reports are complete
  useEffect(() => {
    if (isGeneratingAll && completedReportsCount >= 13) {
      setIsGeneratingAll(false);
      setGenerateAllProgress(null);
      // Refresh all data
      queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-countries"] });
      queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-report"] });
    }
  }, [isGeneratingAll, completedReportsCount, queryClient]);
  
  // Effect: Auto-refetch report when polling detects new completed topics
  // This ensures the report panel updates as reports are generated
  const prevCompletedCount = useRef(completedReportsCount);
  useEffect(() => {
    if (isGeneratingAll && completedReportsCount > prevCompletedCount.current) {
      // A new report was completed, refetch current topic's report
      refetchReport();
      // Update progress message
      setGenerateAllProgress(`Generating reports... (${completedReportsCount}/13 complete)`);
    }
    prevCompletedCount.current = completedReportsCount;
  }, [completedReportsCount, isGeneratingAll, refetchReport]);
  
  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: ({ iso_code, topic }: { iso_code: string; topic: string }) =>
      generateStrategicDeepDive(iso_code, topic),
    onSuccess: async () => {
      setGenerationError(null);
      queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-countries"] });
      queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-topic-statuses", selectedCountry] });
      
      // Retry fetching report with delay to handle race condition
      // The report might not be immediately available after generation completes
      let attempts = 0;
      while (attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const result = await refetchReport();
        if (result.data) break;
        attempts++;
      }
    },
    onError: (error: Error) => {
      setGenerationError(error.message || "Failed to generate analysis");
    },
  });
  
  // Generate ALL topics mutation (queues 13 reports for background generation)
  const [generateAllProgress, setGenerateAllProgress] = useState<string | null>(null);
  const generateAllMutation = useMutation({
    mutationFn: (iso_code: string) => generateAllTopicsForCountry(iso_code),
    onMutate: () => {
      setGenerateAllProgress("Queuing all 13 reports for generation...");
    },
    onSuccess: (data: GenerateAllTopicsResponse) => {
      // Start polling mode - the background tasks are now running
      setIsGeneratingAll(true);
      setGenerateAllProgress(`Generating reports for ${data.country_name}...`);
      setGenerationError(null);
      // Immediately refetch to start showing progress
      queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-topic-statuses", selectedCountry] });
    },
    onError: (error: Error) => {
      setGenerateAllProgress(null);
      setIsGeneratingAll(false);
      setGenerationError(error.message || "Failed to queue reports for generation");
    },
  });
  
  // Organize countries by continent
  const countriesByContinent = useMemo(() => {
    const countries = countriesData?.countries || [];
    const grouped: Record<string, CountryDeepDiveItem[]> = {};
    CONTINENTS.forEach(continent => {
      grouped[continent] = countries.filter(c => CONTINENT_MAP[c.iso_code] === continent);
    });
    return grouped;
  }, [countriesData]);
  
  // Get selected country data
  const selectedCountryData = useMemo(() => {
    if (!selectedCountry || !countriesData) return null;
    return countriesData.countries.find(c => c.iso_code === selectedCountry) || null;
  }, [selectedCountry, countriesData]);
  
  // Toggle continent expansion
  const toggleContinent = (continent: string) => {
    setExpandedContinents(prev => {
      const next = new Set(prev);
      if (next.has(continent)) next.delete(continent);
      else next.add(continent);
      return next;
    });
  };
  
  // Toggle framework layer expansion
  const toggleLayer = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };
  
  // Handle country selection
  const handleCountryToggle = useCallback((isoCode: string) => {
    setGenerationError(null);
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (batchMode) {
        if (next.has(isoCode)) next.delete(isoCode);
        else next.add(isoCode);
      } else {
        next.clear();
        next.add(isoCode);
      }
      return next;
    });
  }, [batchMode]);
  
  // Handle generate single
  const handleGenerate = () => {
    if (selectedCountry) {
      setGenerationError(null);
      generateMutation.mutate({ iso_code: selectedCountry, topic: selectedTopic });
    }
  };
  
  // Handle generate ALL 13 topics at once
  const handleGenerateAll = () => {
    if (!selectedCountry) return;
    
    const countryName = selectedCountryData?.name || selectedCountry;
    if (confirm(`Generate ALL 13 topic reports for ${countryName}?\n\nThis will take approximately 15-30 minutes. The process will run in the background.`)) {
      generateAllMutation.mutate(selectedCountry);
    }
  };
  
  // Handle batch generate
  const handleBatchGenerate = async () => {
    const countries = Array.from(selectedCountries);
    for (const iso of countries) {
      await generateMutation.mutateAsync({ iso_code: iso, topic: selectedTopic });
    }
    setShowBatchModal(false);
    setBatchMode(false);
  };
  
  // Handle PDF export
  const handleExportPDF = () => {
    if (report) {
      generatePDF(report);
    }
  };
  
  // Handle edit (placeholder)
  const handleEdit = () => {
    alert("Edit functionality coming soon");
  };
  
  // Handle delete (placeholder)
  const handleDelete = async () => {
    if (!selectedCountry) return;
    if (confirm(`Are you sure you want to delete the "${selectedTopic}" report for this country?`)) {
      try {
        await deleteStrategicDeepDive(selectedCountry, selectedTopic);
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-countries"] });
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-topic-statuses", selectedCountry] });
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-report", selectedCountry, selectedTopic] });
      } catch (error) {
        alert("Failed to delete report: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Country Deep Dive
            </h1>
            <p className="text-white/40 text-xs">
              Dedicated deep dive reports across the framework
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-3">
          {countriesData && (
            <>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">
                  {countriesData.completed} Analyzed
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 rounded-lg">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400 font-medium">
                  {countriesData.total_count} Countries
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Three-Column Layout */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* Column 1: Country Selection */}
        <div className="w-[260px] flex-shrink-0 flex flex-col min-h-0 bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-700/40">
            <h2 className="text-xs font-semibold text-white flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              Select Country
              {batchMode && (
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px]">
                  Multi-select
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoadingCountries ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            ) : countriesError ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
                <p className="text-xs text-red-400 mb-3">Failed to load countries</p>
                <button
                  onClick={() => refetchCountries()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[11px] rounded-lg"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            ) : (
              CONTINENTS.map((continent) => (
                <ContinentSection
                  key={continent}
                  continent={continent}
                  countries={countriesByContinent[continent] || []}
                  selectedCountries={selectedCountries}
                  onCountryToggle={handleCountryToggle}
                  isExpanded={expandedContinents.has(continent)}
                  onToggle={() => toggleContinent(continent)}
                  selectionMode={batchMode}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Column 2: Analysis Topics */}
        <div className="w-[280px] flex-shrink-0 flex flex-col min-h-0 bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
          <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-700/40">
            <h2 className="text-xs font-semibold text-white flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-purple-400" />
              Analysis Topic
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
            {/* Comprehensive Assessment */}
            <div className="space-y-1.5">
              {(() => {
                const comprehensiveTopic = "Comprehensive Occupational Health Assessment";
                const comprehensiveStatus = topicStatusMap[comprehensiveTopic];
                return (
                  <button
                    onClick={() => setSelectedTopic(comprehensiveTopic)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all duration-200",
                      selectedTopic === comprehensiveTopic
                        ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/40"
                        : "bg-slate-800/50 border-slate-700/30 hover:bg-slate-800/70"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center",
                        selectedTopic === comprehensiveTopic 
                          ? "bg-purple-500/20" : "bg-slate-700/50"
                      )}>
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-medium text-white">Comprehensive Assessment</h4>
                          {/* Status indicator */}
                          {comprehensiveStatus?.has_report && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          )}
                          {comprehensiveStatus?.status === "processing" && (
                            <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">Full analysis of all framework pillars</p>
                      </div>
                    </div>
                  </button>
                );
              })()}
            </div>
            
            {/* Framework Layers with 3 topics each - COLLAPSIBLE */}
            {FRAMEWORK_LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isExpanded = expandedLayers.has(layer.id);
              
              // Count how many topics in this layer have completed reports
              const completedTopics = layer.topics.filter(
                t => topicStatusMap[t.name]?.has_report
              ).length;
              
              return (
                <div key={layer.id} className="space-y-1.5">
                  {/* Clickable Layer Header */}
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-2 rounded-lg border transition-all duration-200",
                      isExpanded 
                        ? `${layer.bgClass} ${layer.borderClass}` 
                        : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded flex items-center justify-center", layer.iconBgClass)}>
                      <Icon className={cn("w-3 h-3", layer.iconColorClass)} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-[11px] font-semibold text-white">{layer.name}</h3>
                      <p className="text-[9px] text-slate-500">{layer.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Topic completion indicator */}
                      {completedTopics > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          {completedTopics}/3
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
                        <div className="pl-2 space-y-1 pt-1">
                          {layer.topics.map((topic) => {
                            const topicStatus = topicStatusMap[topic.name];
                            return (
                              <button
                                key={topic.id}
                                onClick={() => setSelectedTopic(topic.name)}
                                className={cn(
                                  "w-full text-left p-2 rounded-lg border transition-all duration-200",
                                  selectedTopic === topic.name
                                    ? `${layer.bgClass} ${layer.borderClass}`
                                    : "bg-slate-800/30 border-slate-700/20 hover:bg-slate-800/50"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-[10px] font-medium text-white truncate">
                                        {topic.name}
                                      </h4>
                                      {/* Status indicator */}
                                      {topicStatus?.has_report && (
                                        <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                                      )}
                                      {topicStatus?.status === "processing" && (
                                        <Loader2 className="w-3 h-3 text-yellow-400 animate-spin flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[9px] text-slate-500 truncate">{topic.description}</p>
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
        </div>
        
        {/* Column 3: Report Display */}
        <div className="flex-1 min-w-0 bg-slate-900/50 border border-slate-700/40 rounded-xl overflow-hidden">
          <ReportPanel
            report={report || null}
            isLoading={isLoadingReport}
            isGenerating={generateMutation.isPending}
            isGeneratingAll={isGeneratingAll}
            generateAllProgress={generateAllProgress}
            completedReportsCount={completedReportsCount}
            countryName={selectedCountryData?.name || null}
            selectedTopic={selectedTopic}
            onGenerate={handleGenerate}
            onRegenerate={handleGenerate}
            onGenerateAll={handleGenerateAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onExportPDF={handleExportPDF}
            generationError={generationError}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex-shrink-0 mt-3 text-[10px] text-slate-500 text-center">
        Powered by Strategic Deep Dive Agent • AI Orchestration Layer • Phase 27
      </div>
      
      {/* Batch Modal */}
      <BatchModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        selectedCountries={selectedCountries}
        countriesData={countriesData?.countries || []}
        selectedTopic={selectedTopic}
        onGenerate={handleBatchGenerate}
        isGenerating={generateMutation.isPending}
      />
    </div>
  );
}

export default StrategicDeepDive;
