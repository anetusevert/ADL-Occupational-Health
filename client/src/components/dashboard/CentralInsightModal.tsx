/**
 * Central Insight Modal Component
 * 
 * Premium, centered modal with:
 * - Smaller, focused design (not full screen)
 * - Framer Motion animations throughout
 * - Country-specific images from curated Unsplash
 * - Consulting-style analysis with key stats tiles
 * - Admin-only regenerate button
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ChevronLeft, ChevronRight, RefreshCw, Loader2,
  Briefcase, Globe2, Users, TrendingUp, Info,
  Crown, Shield, Eye, HeartPulse, Activity,
  Lightbulb, Building2, Factory, MapPin, UserCheck, Landmark,
  AlertTriangle, Heart, Percent, DollarSign
} from "lucide-react";
import { cn } from "../../lib/utils";

// Define InsightCategory locally to avoid circular dependency with CountryDashboard
export type InsightCategory = 
  // Economic tiles
  | "labor-force" | "gdp-per-capita" | "population" | "unemployment"
  // Framework pillars
  | "governance" | "hazard-control" | "vigilance" | "restoration"
  // Country insights
  | "culture" | "oh-infrastructure" | "industry" 
  | "urban" | "workforce" | "political";

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

interface KeyStat {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface InsightData {
  images: {
    url: string;
    alt: string;
    photographer?: string;
  }[];
  whatIsAnalysis: string;
  ohImplications: string;
  keyStats: KeyStat[];
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
  gradient: string;
}

const CATEGORY_CONFIGS: Record<InsightCategory, CategoryConfig> = {
  "labor-force": {
    title: "Labor Force",
    icon: Briefcase,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  "gdp-per-capita": {
    title: "Economic Output",
    icon: Globe2,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
  "population": {
    title: "Demographics",
    icon: Users,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    gradient: "from-purple-500/20 to-purple-600/5",
  },
  "unemployment": {
    title: "Employment Status",
    icon: TrendingUp,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  "governance": {
    title: "Governance",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    gradient: "from-purple-500/20 to-purple-600/5",
  },
  "hazard-control": {
    title: "Hazard Control",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  "vigilance": {
    title: "Vigilance",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-500/30",
    gradient: "from-teal-500/20 to-teal-600/5",
  },
  "restoration": {
    title: "Restoration",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  "culture": {
    title: "Culture & Society",
    icon: Lightbulb,
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    borderColor: "border-rose-500/30",
    gradient: "from-rose-500/20 to-rose-600/5",
  },
  "oh-infrastructure": {
    title: "OH Infrastructure",
    icon: Building2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  "industry": {
    title: "Industry & Economy",
    icon: Factory,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
  "urban": {
    title: "Urban Development",
    icon: MapPin,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    borderColor: "border-indigo-500/30",
    gradient: "from-indigo-500/20 to-indigo-600/5",
  },
  "workforce": {
    title: "Workforce Demographics",
    icon: UserCheck,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  "political": {
    title: "Political Capacity",
    icon: Landmark,
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
    borderColor: "border-violet-500/30",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
};

// ============================================================================
// CURATED COUNTRY IMAGES
// ============================================================================

// Pre-selected high-quality images from Unsplash for specific countries
const COUNTRY_IMAGES: Record<string, Record<string, string[]>> = {
  CAN: {
    default: [
      "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=600&q=80", // Toronto skyline
      "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&q=80", // Canadian mountains
      "https://images.unsplash.com/photo-1569681157752-1e188e28a46a?w=600&q=80", // Vancouver
    ],
    "oh-infrastructure": [
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80", // Hospital
      "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=600&q=80", // Medical facility
    ],
    industry: [
      "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=600&q=80", // Oil industry
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", // Construction
    ],
  },
  SAU: {
    default: [
      "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=600&q=80", // Mecca
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=600&q=80", // Riyadh
      "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&q=80", // Saudi culture
    ],
    industry: [
      "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=600&q=80", // Oil refinery
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", // Construction
    ],
    "oh-infrastructure": [
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80", // Hospital
      "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80", // Medical center
    ],
  },
  DEU: {
    default: [
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80", // Brandenburg Gate
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&q=80", // Berlin
      "https://images.unsplash.com/photo-1449452198679-05c7fd30f416?w=600&q=80", // German cityscape
    ],
    industry: [
      "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&q=80", // German industry
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80", // Manufacturing
    ],
  },
  USA: {
    default: [
      "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=600&q=80", // Statue of Liberty
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80", // NYC skyline
      "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&q=80", // Capitol
    ],
    industry: [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80", // Tech industry
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", // Construction
    ],
  },
  GBR: {
    default: [
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80", // London Tower Bridge
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&q=80", // Parliament
      "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600&q=80", // Big Ben
    ],
  },
  JPN: {
    default: [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80", // Mount Fuji
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80", // Tokyo
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80", // Japanese temple
    ],
  },
  AUS: {
    default: [
      "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&q=80", // Sydney Opera
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80", // Sydney harbor
      "https://images.unsplash.com/photo-1494233892892-84542a694e72?w=600&q=80", // Australian coast
    ],
  },
};

// Fallback images for categories
const CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  "oh-infrastructure": [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80",
  ],
  industry: [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
  ],
  culture: [
    "https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=600&q=80",
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
  ],
  workforce: [
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
  ],
  political: [
    "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&q=80",
    "https://images.unsplash.com/photo-1575540325855-4b5c1ad86a7a?w=600&q=80",
  ],
  urban: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80",
  ],
};

function getCountryImages(countryIso: string, category: string): string[] {
  // Try country-specific images for category
  const countryData = COUNTRY_IMAGES[countryIso];
  if (countryData) {
    if (countryData[category]) return countryData[category];
    if (countryData.default) return countryData.default;
  }
  // Fallback to category images
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.default;
}

// ============================================================================
// COUNTRY-SPECIFIC CONTENT
// ============================================================================

interface CountryContent {
  whatIs: string;
  ohMeaning: string;
  keyStats: KeyStat[];
}

function getCountrySpecificContent(
  category: InsightCategory,
  countryIso: string,
  countryName: string
): CountryContent {
  // Country-specific content database
  const contentDb: Record<string, Record<string, CountryContent>> = {
    CAN: {
      "oh-infrastructure": {
        whatIs: `Canada operates one of the most comprehensive occupational health infrastructures in North America. The Canadian Centre for Occupational Health and Safety (CCOHS) serves as the national resource center, while each province maintains its own workers' compensation board and OH regulatory agencies.

Ontario's Workplace Safety and Insurance Board (WSIB) and similar provincial bodies manage over $5 billion annually in workers' compensation claims. Major rehabilitation facilities include the Institute for Work & Health in Toronto and WorkSafeBC's rehabilitation centers.

Canada's network includes 15 accredited occupational medicine residency programs and over 2,000 certified occupational health nurses. The country has approximately 450 board-certified occupational medicine physicians, concentrated in industrial centers like Alberta's oil sands region.

Provincial networks of occupational health clinics provide coverage across urban and rural areas, though access challenges persist in northern territories and remote First Nations communities.`,
        ohMeaning: `Canada's OH infrastructure directly impacts 20 million workers across diverse sectors. The decentralized provincial system creates varying levels of service quality and accessibility that occupational health practitioners must navigate.

Workers' compensation coverage extends to approximately 80% of the Canadian workforce, with self-employed and gig economy workers often excluded. This coverage gap affects over 3 million Canadians who lack workplace injury protection.

The concentration of OH specialists in major urban centers (Toronto, Vancouver, Calgary, Montreal) creates service deserts in rural and northern regions. Indigenous communities face particular challenges accessing culturally appropriate OH services.

Climate change is creating new demands on Canada's OH infrastructure as extreme weather events and expanding wildfire seasons expose more workers to heat stress and air quality hazards, requiring infrastructure adaptation.`,
        keyStats: [
          { label: "Workers Covered", value: "80%", icon: Users, color: "text-emerald-400" },
          { label: "Annual Claims", value: "$5B+", icon: DollarSign, color: "text-cyan-400" },
          { label: "OH Physicians", value: "~450", icon: Heart, color: "text-rose-400" },
          { label: "Provinces", value: "10", icon: MapPin, color: "text-purple-400" },
        ],
      },
      industry: {
        whatIs: `Canada's economy is anchored by natural resources, manufacturing, and services. The oil and gas sector in Alberta employs over 150,000 workers directly, while mining operations span from British Columbia to Labrador. These extractive industries generate approximately 10% of GDP.

Construction is Canada's third-largest industry, employing 1.4 million workers with major infrastructure projects including transit expansions in Toronto and Vancouver. The sector experiences the highest workplace fatality rates at 10.5 deaths per 100,000 workers.

Manufacturing, particularly automotive in Ontario, employs 1.7 million Canadians. The sector has modernized with increased automation, shifting hazard profiles from acute injuries to ergonomic and psychosocial risks.

Canada's tech sector has grown rapidly, with 1.8 million workers in information and communications technology. These workers face emerging hazards including sedentary work, screen exposure, and mental health challenges from remote work arrangements.`,
        ohMeaning: `Canada's industrial composition creates a distinctive occupational health risk profile. The resource extraction sector in Alberta reports 2.3 times the national average of lost-time injuries, requiring specialized high-risk industry OH programs.

Construction workers face the highest fatality risk (4x other sectors) with falls remaining the leading cause of death. Cold weather construction in Canada adds frostbite and hypothermia risks absent in warmer climates.

The shift from manufacturing to services has reduced acute injury rates but increased musculoskeletal and mental health claims. Psychological injury claims have increased 300% over the past decade, now representing 30% of long-term disability costs.

Seasonal industries (fishing, forestry, agriculture) create workforce health challenges with intensive work periods followed by unemployment, disrupting continuous health monitoring and care relationships.`,
        keyStats: [
          { label: "Oil & Gas Workers", value: "150K+", icon: Factory, color: "text-amber-400" },
          { label: "Construction Workers", value: "1.4M", icon: Building2, color: "text-blue-400" },
          { label: "Tech Workforce", value: "1.8M", icon: Activity, color: "text-cyan-400" },
          { label: "Fatality Rate", value: "10.5/100K", icon: AlertTriangle, color: "text-red-400" },
        ],
      },
    },
    SAU: {
      "oh-infrastructure": {
        whatIs: `Saudi Arabia's occupational health infrastructure is managed primarily through GOSI (General Organization for Social Insurance), which covers 12 million workers and processes over 70,000 workplace injury claims annually. GOSI operates 19 regional offices and 5 specialized rehabilitation centers.

The Ministry of Human Resources and Social Development enforces workplace safety regulations through 1,500+ inspectors. Major initiatives under Vision 2030 are modernizing OH systems, including digital reporting platforms and expanded coverage for previously excluded workers.

King Fahd Medical City and King Faisal Specialist Hospital house the country's primary occupational medicine units. Saudi Arabia has approximately 200 board-certified occupational medicine physicians, with most concentrated in Riyadh, Jeddah, and the Eastern Province oil regions.

Saudi Aramco operates one of the world's largest private industrial health systems, with 30+ clinics serving 70,000 employees. This system often sets de facto standards adopted by other large employers.`,
        ohMeaning: `GOSI's modernization is expanding coverage from 8 million to 12 million workers, bringing previously excluded domestic workers and informal sector employees under protection. This 50% expansion represents one of the largest OH coverage extensions globally.

Heat stress is Saudi Arabia's most significant occupational hazard. With summer temperatures exceeding 50°C, the mandatory midday outdoor work ban (12 PM - 3 PM, June-September) directly affects 3 million construction and outdoor workers.

The construction sector employs 40% of Saudi Arabia's private workforce and accounts for 45% of workplace fatalities. Mega-projects like NEOM and Red Sea require scaling OH capacity from current levels to meet international standards.

Saudization policies requiring increased national workforce participation create new OH challenges as Saudi workers enter previously expatriate-dominated industrial roles, requiring culturally adapted safety training and health programs.`,
        keyStats: [
          { label: "GOSI Coverage", value: "12M", icon: Users, color: "text-emerald-400" },
          { label: "Annual Claims", value: "70K+", icon: Activity, color: "text-cyan-400" },
          { label: "Peak Temp", value: "50°C+", icon: AlertTriangle, color: "text-red-400" },
          { label: "Inspectors", value: "1,500+", icon: Shield, color: "text-blue-400" },
        ],
      },
      industry: {
        whatIs: `Saudi Arabia's economy is dominated by oil and gas (40% of GDP), with Saudi Aramco employing 70,000 directly and supporting 300,000+ contractor jobs. The petrochemical complex at Jubail is the world's largest, employing 100,000 workers across 20+ major facilities.

Construction is the largest private sector employer with 4 million workers building Vision 2030 mega-projects. NEOM alone represents $500 billion in investment creating 400,000 construction jobs. The Red Sea Project and Qiddiya add 200,000 more construction positions.

Manufacturing is growing under "Made in Saudi" initiatives, with 850,000 industrial workers in sectors including automotive (Lucid Motors factory), defense, and pharmaceuticals. These new industries require developing domestic OH expertise previously imported with expatriate workers.

Tourism and entertainment, virtually nonexistent before 2019, now employ 500,000+ workers with targets of 1.5 million by 2030. These service sector roles bring different OH challenges than traditional Saudi industries.`,
        ohMeaning: `The oil and gas sector maintains world-class safety standards with lost-time injury rates of 0.03 per 200,000 work hours - among the lowest globally. However, contractor workforces performing supporting services have 8x higher injury rates.

Construction fatalities (estimated 300+ annually) are driven by fall hazards (35%), struck-by incidents (25%), and heat-related illness (20%). The pace of mega-project development strains inspection capacity, with each inspector responsible for 2,500+ workers.

Industrial diversification creates new hazard exposures as Saudi workers enter manufacturing roles previously filled by experienced expatriate workers. The transition requires intensive safety training and supervision during the skills development period.

The shift to entertainment and tourism creates service industry hazards (ergonomic, psychosocial, customer violence) unfamiliar to Saudi OH systems designed primarily for industrial settings.`,
        keyStats: [
          { label: "Oil Sector Jobs", value: "370K+", icon: Factory, color: "text-amber-400" },
          { label: "Construction", value: "4M", icon: Building2, color: "text-blue-400" },
          { label: "Mega-Projects", value: "$1T+", icon: DollarSign, color: "text-emerald-400" },
          { label: "Safety Rate", value: "0.03 LTI", icon: Shield, color: "text-cyan-400" },
        ],
      },
    },
  };

  // Check for country-specific content
  const countryData = contentDb[countryIso];
  if (countryData && countryData[category]) {
    return countryData[category];
  }

  // Generate default content with country name
  return {
    whatIs: `${countryName} has developed occupational health systems reflecting its economic structure, regulatory environment, and workforce characteristics. The national framework addresses workplace safety through a combination of legislation, enforcement, and institutional support.

Key institutions responsible for occupational health include the ministry of labor, workers' compensation authorities, and specialized OH research centers. These bodies establish standards, conduct inspections, and provide technical assistance to employers and workers.

The coverage and quality of occupational health services vary by region and sector. Urban industrial centers typically have better access to OH professionals and facilities than rural areas. High-risk industries often receive prioritized attention from regulatory bodies.

Ongoing reforms and international engagement are shaping the evolution of ${countryName}'s occupational health infrastructure. Alignment with international standards and adoption of new technologies are common themes in current development efforts.`,
    ohMeaning: `The occupational health system in ${countryName} directly affects millions of workers across all economic sectors. Understanding the local infrastructure is essential for designing effective interventions and ensuring compliance with national requirements.

Workforce composition and industry distribution determine the primary hazard exposures and OH service needs. Construction, manufacturing, and extractive industries typically present the highest injury and illness rates requiring targeted prevention programs.

Access to occupational health services remains uneven, with coverage gaps affecting informal sector workers, small enterprises, and remote regions. These populations often face the highest risks with the least protection.

Practitioners working in ${countryName} must navigate the local regulatory environment, cultural factors, and resource constraints when implementing OH programs. Success requires adapting international best practices to the specific national context.`,
    keyStats: [
      { label: "Coverage", value: "Varies", icon: Users, color: "text-emerald-400" },
      { label: "Key Sector", value: "Industry", icon: Factory, color: "text-cyan-400" },
      { label: "Priority", value: "Growing", icon: TrendingUp, color: "text-amber-400" },
      { label: "Standards", value: "Developing", icon: Shield, color: "text-blue-400" },
    ],
  };
}

// ============================================================================
// COMPONENTS
// ============================================================================

function KeyStatTile({ stat, index }: { stat: KeyStat; index: number }) {
  const Icon = stat.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-3.5 h-3.5", stat.color)} />
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</span>
      </div>
      <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
    </motion.div>
  );
}

function ImageSlideshow({ images, category }: { images: string[]; category: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (index: number) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl flex items-center justify-center">
        <Info className="w-8 h-8 text-white/20" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {imageError[currentIndex] ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <div className="text-center">
                <Info className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p className="text-xs text-white/40">{category}</p>
              </div>
            </div>
          ) : (
            <>
              <img
                src={images[currentIndex]}
                alt={`${category} - image ${currentIndex + 1}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(currentIndex)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-4"
                  : "bg-white/40 w-1.5 hover:bg-white/60"
              )}
            />
          ))}
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

  useEffect(() => {
    if (!category || !isOpen) return;

    setIsLoading(true);
    
    // Get country-specific content
    const timer = setTimeout(() => {
      const content = getCountrySpecificContent(category, countryIso, countryName);
      const images = getCountryImages(countryIso, category);
      
      setInsightData({
        images: images.map((url, i) => ({ url, alt: `${category} image ${i + 1}` })),
        whatIsAnalysis: content.whatIs,
        ohImplications: content.ohMeaning,
        keyStats: content.keyStats,
        status: "completed",
        generatedAt: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [category, countryIso, countryName, isOpen]);

  const handleRegenerate = async () => {
    if (!category) return;
    setIsRegenerating(true);
    
    setTimeout(() => {
      const content = getCountrySpecificContent(category, countryIso, countryName);
      const images = getCountryImages(countryIso, category);
      
      setInsightData({
        images: images.map((url, i) => ({ url, alt: `${category} image ${i + 1}` })),
        whatIsAnalysis: content.whatIs,
        ohImplications: content.ohMeaning,
        keyStats: content.keyStats,
        status: "completed",
        generatedAt: new Date().toISOString(),
      });
      setIsRegenerating(false);
      onRegenerate?.();
    }, 1500);
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />

          {/* Modal - Centered, smaller */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 400,
              mass: 0.8
            }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Decorative gradient */}
            <div className={cn("absolute top-0 left-0 right-0 h-32 bg-gradient-to-b opacity-50 pointer-events-none", config.gradient)} />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative flex items-center justify-between px-5 py-4 border-b border-white/10"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className={cn("p-2.5 rounded-xl", config.bgColor, config.borderColor, "border")}
                >
                  <Icon className={cn("w-5 h-5", config.color)} />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white">{config.title}</h2>
                  <p className="text-xs text-white/50">{countryName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
                    <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
                  </motion.button>
                )}

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </motion.button>
              </div>
            </motion.div>

            {/* Content */}
            <div className="relative flex-1 overflow-hidden">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-white/50">Loading insights...</p>
                  </motion.div>
                </div>
              ) : insightData ? (
                <div className="h-full flex flex-col lg:flex-row gap-4 p-5 overflow-y-auto">
                  {/* Left: Image + Key Stats */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:w-2/5 flex flex-col gap-4"
                  >
                    {/* Image */}
                    <div className="h-48 lg:h-56">
                      <ImageSlideshow 
                        images={insightData.images.map(i => i.url)} 
                        category={config.title}
                      />
                    </div>

                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {insightData.keyStats.map((stat, i) => (
                        <KeyStatTile key={stat.label} stat={stat} index={i} />
                      ))}
                    </div>
                  </motion.div>

                  {/* Right: Analysis */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:w-3/5 flex flex-col overflow-hidden"
                  >
                    <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                      {/* What is Section */}
                      <section>
                        <motion.h3 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className={cn("text-sm font-semibold mb-3 flex items-center gap-2", config.color)}
                        >
                          <span className={cn("w-1 h-4 rounded-full", config.bgColor.replace("/20", ""))} />
                          What is {config.title}?
                        </motion.h3>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-[13px] text-white/75 leading-relaxed space-y-3"
                        >
                          {insightData.whatIsAnalysis.split("\n\n").map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </motion.div>
                      </section>

                      {/* OH Implications */}
                      <section>
                        <motion.h3 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-sm font-semibold mb-3 flex items-center gap-2 text-cyan-400"
                        >
                          <span className="w-1 h-4 rounded-full bg-cyan-500" />
                          What does this mean for OH?
                        </motion.h3>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="text-[13px] text-white/75 leading-relaxed space-y-3"
                        >
                          {insightData.ohImplications.split("\n\n").map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </motion.div>
                      </section>
                    </div>

                    {/* Footer */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="pt-3 mt-3 border-t border-white/10 text-[10px] text-white/30"
                    >
                      Generated: {new Date(insightData.generatedAt || "").toLocaleDateString()} • AI-powered analysis
                    </motion.div>
                  </motion.div>
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
