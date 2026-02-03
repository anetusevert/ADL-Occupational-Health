/**
 * Central Insight Modal Component
 * 
 * Universal modal that opens when clicking ANY tile on the Country Dashboard.
 * Features:
 * - Image slideshow on the left
 * - Consulting-style AI analysis on the right
 *   - "What is [Category]?" section (3-4 paragraphs)
 *   - "What does this mean for Occupational Health?" section (3-4 paragraphs)
 * - Admin-only regenerate button
 * - Data persistence via backend API
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronLeft, ChevronRight, RefreshCw, Loader2,
  Briefcase, Globe2, Users, TrendingUp,
  Crown, Shield, Eye, HeartPulse,
  Lightbulb, Building2, Factory, MapPin, UserCheck, Landmark
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { InsightCategory } from "../../pages/CountryDashboard";

// ============================================================================
// TYPES
// ============================================================================

interface CentralInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: InsightCategory | null;
  countryIso: string;
  countryName: string;
  isAdmin: boolean;
  onRegenerate?: () => void;
}

interface InsightData {
  images: {
    url: string;
    thumbnailUrl?: string;
    alt: string;
    photographer?: string;
  }[];
  whatIsAnalysis: string;
  ohImplications: string;
  status: "pending" | "generating" | "completed" | "error";
  generatedAt?: string;
}

// ============================================================================
// CATEGORY CONFIGURATION
// ============================================================================

interface CategoryConfig {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const CATEGORY_CONFIGS: Record<InsightCategory, CategoryConfig> = {
  // Economic tiles
  "labor-force": {
    title: "Labor Force",
    icon: Briefcase,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
  },
  "gdp-per-capita": {
    title: "Economic Output",
    icon: Globe2,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
  },
  "population": {
    title: "Demographics",
    icon: Users,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  "unemployment": {
    title: "Employment Status",
    icon: TrendingUp,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  // Framework pillars
  "governance": {
    title: "Governance",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  "hazard-control": {
    title: "Hazard Control",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  "vigilance": {
    title: "Vigilance",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-500/30",
  },
  "restoration": {
    title: "Restoration",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  // Country insights
  "culture": {
    title: "Culture & Society",
    icon: Lightbulb,
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    borderColor: "border-rose-500/30",
  },
  "oh-infrastructure": {
    title: "OH Infrastructure",
    icon: Building2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  "industry": {
    title: "Industry & Economy",
    icon: Factory,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
  },
  "urban": {
    title: "Urban Development",
    icon: MapPin,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    borderColor: "border-indigo-500/30",
  },
  "workforce": {
    title: "Workforce Demographics",
    icon: UserCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
  },
  "political": {
    title: "Political Capacity",
    icon: Landmark,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    borderColor: "border-violet-500/30",
  },
};

// ============================================================================
// PLACEHOLDER CONTENT (until backend is ready)
// ============================================================================

function getPlaceholderContent(category: InsightCategory, countryName: string): InsightData {
  const placeholderTexts: Record<string, { whatIs: string; ohMeaning: string }> = {
    "culture": {
      whatIs: `${countryName}'s cultural landscape is shaped by centuries of tradition blended with modern influences. The nation's identity is formed through its unique history, religious practices, and social customs that continue to evolve in the contemporary era.

Workplace culture in ${countryName} reflects broader societal values, including attitudes toward hierarchy, collaboration, and work-life balance. These cultural norms significantly influence how occupational health programs are designed and received.

Family structures and community bonds play important roles in social support systems, which can either complement or substitute for formal occupational health services. Understanding these dynamics is essential for effective program design.

The ongoing cultural transformation in ${countryName} presents both opportunities and challenges for occupational health practitioners seeking to implement international best practices while respecting local traditions.`,
      ohMeaning: `Cultural factors directly influence occupational health outcomes through their impact on risk perception, safety behaviors, and help-seeking patterns. Workers' willingness to report injuries, use protective equipment, and participate in health programs is heavily influenced by cultural norms.

In ${countryName}, traditional attitudes toward authority and hierarchy may affect how safety concerns are communicated within organizations. Power distance and communication styles shape the effectiveness of safety training and incident reporting systems.

Religious observances and cultural practices can impact workplace scheduling, dietary needs, and accommodation requirements. Occupational health programs must be culturally sensitive to achieve high participation rates and positive outcomes.

The cultural emphasis on community and collective responsibility in ${countryName} can be leveraged to promote workplace safety through peer support programs and group-based health initiatives that align with local values.`
    },
    "industry": {
      whatIs: `${countryName}'s economy encompasses diverse sectors that drive employment and national development. The industrial composition reflects both historical strengths and ongoing economic transformation efforts aimed at diversification and modernization.

Key industries include manufacturing, construction, services, and extractive sectors, each presenting distinct workforce characteristics and economic contributions. The relative importance of these sectors shapes the overall employment landscape and skill requirements.

Economic policies and investment patterns continue to influence industrial development, with implications for job creation, worker migration, and occupational distribution. Growth sectors attract both domestic and international workers seeking employment opportunities.

The pace of technological adoption varies across industries, affecting productivity, skill requirements, and the nature of occupational hazards workers face in different sectors.`,
      ohMeaning: `Industrial composition directly determines the occupational health risk profile of ${countryName}'s workforce. High-risk sectors such as construction, manufacturing, and extractive industries present elevated rates of occupational injuries and diseases requiring targeted prevention strategies.

Each industry sector presents characteristic hazards: construction involves fall risks and musculoskeletal demands; manufacturing presents machinery hazards and repetitive motion injuries; extractive industries involve respiratory hazards and extreme environmental conditions.

The distribution of employment across sectors informs resource allocation priorities for occupational health services. Sectors with higher hazard exposure require proportionally greater investment in prevention, surveillance, and rehabilitation services.

Economic transformation and industrial diversification create evolving occupational health needs as workers transition between sectors and new industries emerge with novel hazard profiles requiring updated regulatory frameworks and professional expertise.`
    },
    "political": {
      whatIs: `${countryName}'s political system provides the governance framework for regulatory development, enforcement, and public policy implementation. The structure of government, legislative processes, and administrative capacity all influence how occupational health is managed nationally.

Regulatory bodies responsible for workplace safety operate within this political context, with varying degrees of independence, resources, and enforcement authority. Political priorities and budget allocations shape the capacity of these institutions.

International commitments and trade relationships influence domestic occupational health standards through conventions, bilateral agreements, and supply chain requirements. The alignment of domestic regulations with international standards reflects political choices and diplomatic considerations.

Political stability and institutional continuity affect the consistency and predictability of occupational health governance, influencing employer compliance and worker protection over time.`,
      ohMeaning: `The political environment in ${countryName} fundamentally shapes the occupational health system through legislation, enforcement, and resource allocation decisions. Political will and administrative capacity determine the effectiveness of workplace safety regulation.

Regulatory enforcement capacity varies based on government priorities and resource constraints. The strength of labor inspection systems, penalties for violations, and support for compliance assistance reflect political choices about worker protection.

Political processes determine the balance between regulatory approaches and voluntary compliance mechanisms. The role of social partners, including employers and workers, in occupational health governance depends on the political and institutional framework.

International engagement on occupational health issues is influenced by political relationships and policy priorities. Ratification and implementation of international conventions, technical cooperation, and knowledge exchange all reflect political decisions affecting worker protection.`
    }
  };

  const defaultContent = {
    whatIs: `This section provides comprehensive analysis of ${category.replace(/-/g, " ")} in ${countryName}. The analysis draws on multiple data sources to present a factual, informative overview of this topic within the national context.

The content examines key characteristics, trends, and developments relevant to understanding how ${category.replace(/-/g, " ")} manifests in ${countryName}. Historical context and current conditions are both considered.

Statistical indicators and comparative data help position ${countryName}'s situation relative to regional and global benchmarks. These quantitative measures complement qualitative observations.

Ongoing developments and emerging trends are identified to provide a forward-looking perspective on how this area may evolve in the coming years.`,
    ohMeaning: `Understanding ${category.replace(/-/g, " ")} is essential for effective occupational health programming in ${countryName}. This section analyzes the specific implications for workforce protection and workplace safety.

The connections between ${category.replace(/-/g, " ")} and occupational health outcomes are examined through multiple pathways, including direct effects on worker exposure and indirect effects through institutional and behavioral mechanisms.

Evidence from ${countryName} and comparable contexts illustrates how these factors influence occupational health indicators. Both challenges and opportunities for improvement are identified.

Practical considerations for occupational health professionals working in ${countryName} are highlighted, including context-specific factors that may affect program design and implementation.`
  };

  const content = placeholderTexts[category] || defaultContent;

  return {
    images: [
      {
        url: `https://source.unsplash.com/800x600/?${countryName},${category.replace(/-/g, " ")}`,
        alt: `${category} in ${countryName}`,
      },
      {
        url: `https://source.unsplash.com/800x600/?${countryName},workplace`,
        alt: `Workplace in ${countryName}`,
      },
      {
        url: `https://source.unsplash.com/800x600/?${countryName},people`,
        alt: `People in ${countryName}`,
      },
    ],
    whatIsAnalysis: content.whatIs,
    ohImplications: content.ohMeaning,
    status: "completed",
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// IMAGE SLIDESHOW COMPONENT
// ============================================================================

interface ImageSlideshowProps {
  images: InsightData["images"];
  categoryTitle: string;
}

function ImageSlideshow({ images, categoryTitle }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-slate-700/50 rounded-xl flex items-center justify-center">
        <p className="text-white/40 text-sm">No images available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden group">
      {/* Current Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
        >
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}

      {/* Photographer credit */}
      {images[currentIndex].photographer && (
        <div className="absolute bottom-3 right-3 text-[10px] text-white/50">
          Photo: {images[currentIndex].photographer}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CentralInsightModal({
  isOpen,
  onClose,
  category,
  countryIso,
  countryName,
  isAdmin,
  onRegenerate,
}: CentralInsightModalProps) {
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Load insight data when category changes
  useEffect(() => {
    if (!category || !isOpen) return;

    setIsLoading(true);
    
    // TODO: Replace with actual API call when backend is ready
    // For now, use placeholder content
    const timer = setTimeout(() => {
      const data = getPlaceholderContent(category, countryName);
      setInsightData(data);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [category, countryIso, countryName, isOpen]);

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!category) return;
    
    setIsRegenerating(true);
    
    // TODO: Call actual API endpoint
    // await apiClient.post(`/api/v1/insights/${countryIso}/${category}/regenerate`);
    
    // Simulate regeneration
    setTimeout(() => {
      const data = getPlaceholderContent(category, countryName);
      setInsightData(data);
      setIsRegenerating(false);
      onRegenerate?.();
    }, 2000);
  };

  if (!category) return null;

  const config = CATEGORY_CONFIGS[category];
  const Icon = config.icon;

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-6 md:inset-8 lg:inset-12 xl:inset-16 bg-slate-800 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10",
              config.bgColor
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", config.bgColor, config.borderColor, "border")}>
                  <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", config.color)} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">{config.title}</h2>
                  <p className="text-xs sm:text-sm text-white/60">{countryName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Admin Regenerate Button */}
                {isAdmin && (
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
                    <span className="hidden sm:inline">
                      {isRegenerating ? "Regenerating..." : "Regenerate"}
                    </span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : insightData ? (
                <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6">
                  {/* Left: Image Slideshow */}
                  <div className="h-64 lg:h-full">
                    <ImageSlideshow
                      images={insightData.images}
                      categoryTitle={config.title}
                    />
                  </div>

                  {/* Right: Analysis Content */}
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                      {/* What is [Category]? */}
                      <section>
                        <h3 className={cn("text-sm sm:text-base font-semibold mb-3 flex items-center gap-2", config.color)}>
                          <span className="w-1 h-4 rounded-full bg-current" />
                          What is {config.title}?
                        </h3>
                        <div className="text-sm text-white/80 leading-relaxed space-y-3">
                          {insightData.whatIsAnalysis.split("\n\n").map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </section>

                      {/* What does this mean for OH? */}
                      <section>
                        <h3 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2 text-cyan-400">
                          <span className="w-1 h-4 rounded-full bg-current" />
                          What does this mean for Occupational Health?
                        </h3>
                        <div className="text-sm text-white/80 leading-relaxed space-y-3">
                          {insightData.ohImplications.split("\n\n").map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* Footer with generation info */}
                    {insightData.generatedAt && (
                      <div className="pt-3 mt-3 border-t border-white/10 text-[10px] text-white/40">
                        Generated: {new Date(insightData.generatedAt).toLocaleDateString()}
                        {insightData.status === "completed" && " • AI-powered analysis"}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40">No data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CentralInsightModal;
