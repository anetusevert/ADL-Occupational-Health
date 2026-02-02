/**
 * Comparison Report Component
 * 
 * Main layout component that assembles all comparison sections.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Calendar } from "lucide-react";
import { cn, getCountryFlag, getApiBaseUrl } from "../../lib/utils";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { CountryImageSlideshow } from "./CountryImageSlideshow";
import { FrameworkComparisonGrid } from "./FrameworkComparisonGrid";
import { PillarDeepDiveModal } from "./PillarDeepDiveModal";
import { SocioeconomicPanel } from "./SocioeconomicPanel";
import { StrategicRecommendations } from "./StrategicRecommendations";
import { SourcesCited } from "./SourcesCited";
import { AdminRegenerateButton } from "./AdminRegenerateButton";

interface ComparisonReportData {
  id: string;
  primary_iso: string;
  comparison_iso: string;
  executive_summary: string | null;
  framework_analysis: any[] | null;
  socioeconomic_comparison: any | null;
  metric_comparisons: any[] | null;
  strategic_recommendations: any[] | null;
  sources_cited: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  version: number;
  generation_time_seconds: number | null;
  primary_name?: string;
  comparison_name?: string;
}

interface CountryData {
  iso_code: string;
  name: string;
  flag_url?: string;
  maturity_score?: number;
}

interface ComparisonReportProps {
  report: ComparisonReportData;
  primaryCountry: CountryData;
  comparisonCountry: CountryData;
  onBack: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function ComparisonReport({
  report,
  primaryCountry,
  comparisonCountry,
  onBack,
  onRegenerate,
  isRegenerating,
}: ComparisonReportProps) {
  const [selectedPillar, setSelectedPillar] = useState<any | null>(null);

  // Calculate overall scores from framework analysis
  const overallScores = report.framework_analysis?.reduce(
    (acc, pillar) => ({
      saudi: acc.saudi + (pillar.saudi_score || 0),
      comparison: acc.comparison + (pillar.comparison_score || 0),
    }),
    { saudi: 0, comparison: 0 }
  );

  const saudiAvg = overallScores 
    ? overallScores.saudi / (report.framework_analysis?.length || 1) 
    : primaryCountry.maturity_score || 0;
  
  const comparisonAvg = overallScores 
    ? overallScores.comparison / (report.framework_analysis?.length || 1)
    : comparisonCountry.maturity_score || 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex items-center gap-4">
                {/* Flags */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-7 rounded overflow-hidden border border-emerald-500/30">
                    {primaryCountry.flag_url ? (
                      <img
                        src={`${getApiBaseUrl()}${primaryCountry.flag_url}`}
                        alt={primaryCountry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{getCountryFlag(primaryCountry.iso_code)}</span>
                    )}
                  </div>
                  <span className="text-slate-500 text-xl">vs</span>
                  <div className="w-10 h-7 rounded overflow-hidden border border-purple-500/30">
                    {comparisonCountry.flag_url ? (
                      <img
                        src={`${getApiBaseUrl()}${comparisonCountry.flag_url}`}
                        alt={comparisonCountry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{getCountryFlag(comparisonCountry.iso_code)}</span>
                    )}
                  </div>
                </div>

                <div>
                  <h1 className="text-lg font-bold text-white">
                    {primaryCountry.name} vs {comparisonCountry.name}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Generated {formatDate(report.created_at)}
                    </span>
                    <span>•</span>
                    <span>{report.framework_analysis?.length || 4} pillars analyzed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Admin Controls */}
            {onRegenerate && (
              <AdminRegenerateButton
                onRegenerate={onRegenerate}
                isLoading={isRegenerating}
                lastUpdated={report.updated_at || report.created_at || undefined}
                version={report.version}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive Summary */}
        {report.executive_summary && (
          <ExecutiveSummary
            summary={report.executive_summary}
            saudiScore={saudiAvg}
            comparisonScore={comparisonAvg}
            comparisonName={comparisonCountry.name}
          />
        )}

        {/* Country Slideshows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CountryImageSlideshow
            isoCode={primaryCountry.iso_code}
            countryName={primaryCountry.name}
            className="h-64 md:h-80"
          />
          <CountryImageSlideshow
            isoCode={comparisonCountry.iso_code}
            countryName={comparisonCountry.name}
            className="h-64 md:h-80"
          />
        </div>

        {/* Framework Comparison Grid */}
        {report.framework_analysis && report.framework_analysis.length > 0 && (
          <FrameworkComparisonGrid
            analysis={report.framework_analysis}
            comparisonName={comparisonCountry.name}
            onPillarClick={setSelectedPillar}
          />
        )}

        {/* Socioeconomic Panel */}
        {report.socioeconomic_comparison && (
          <SocioeconomicPanel
            comparison={report.socioeconomic_comparison}
            comparisonName={comparisonCountry.name}
          />
        )}

        {/* Strategic Recommendations */}
        {report.strategic_recommendations && report.strategic_recommendations.length > 0 && (
          <StrategicRecommendations
            recommendations={report.strategic_recommendations}
          />
        )}

        {/* Sources Cited */}
        {report.sources_cited && report.sources_cited.length > 0 && (
          <SourcesCited sources={report.sources_cited} />
        )}
      </div>

      {/* Pillar Deep Dive Modal */}
      <PillarDeepDiveModal
        isOpen={!!selectedPillar}
        onClose={() => setSelectedPillar(null)}
        pillar={selectedPillar}
        comparisonName={comparisonCountry.name}
      />
    </div>
  );
}

export default ComparisonReport;
