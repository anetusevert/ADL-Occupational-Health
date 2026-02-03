/**
 * Slideshow Quadrant Component
 * 
 * Auto-advancing slideshow with 6 interesting facts about the country.
 * Features:
 * - Auto-advance every 5 seconds
 * - Manual navigation dots
 * - Crossfade transitions
 * - Dynamic facts based on country data
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Factory,
  Users,
  Briefcase,
  Heart,
  Globe2,
  Building2,
  Lightbulb,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { CountryIntelligence } from "../../pages/CountryDashboard";

interface SlideshowQuadrantProps {
  country: {
    iso_code: string;
    name: string;
  };
  intelligence: CountryIntelligence | null;
}

interface Slide {
  id: string;
  category: string;
  title: string;
  fact: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
}

// Generate facts based on country intelligence data
function generateFacts(countryName: string, intel: CountryIntelligence | null): Slide[] {
  const facts: Slide[] = [];
  
  // 1. Population & Workforce
  if (intel?.population_total || intel?.labor_force_participation) {
    const popInMillions = intel.population_total ? (intel.population_total / 1_000_000).toFixed(1) : null;
    facts.push({
      id: "workforce",
      category: "Workforce",
      title: "Labor Force",
      fact: popInMillions 
        ? `${countryName} has a population of ${popInMillions} million with ${intel.labor_force_participation?.toFixed(1) || "N/A"}% labor force participation.`
        : `Labor force participation rate: ${intel?.labor_force_participation?.toFixed(1) || "N/A"}%`,
      icon: Users,
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/20 to-blue-500/20",
    });
  }

  // 2. Economic Output
  if (intel?.gdp_per_capita_ppp) {
    const gdpFormatted = intel.gdp_per_capita_ppp >= 1000 
      ? `$${(intel.gdp_per_capita_ppp / 1000).toFixed(1)}K`
      : `$${intel.gdp_per_capita_ppp.toFixed(0)}`;
    facts.push({
      id: "economy",
      category: "Economy",
      title: "Economic Output",
      fact: `GDP per capita (PPP) of ${gdpFormatted}, with ${intel.gdp_growth_rate?.toFixed(1) || "N/A"}% growth rate.`,
      icon: Globe2,
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/20 to-teal-500/20",
    });
  }

  // 3. Industry Composition
  if (intel?.services_pct_gdp || intel?.industry_pct_gdp) {
    const dominant = (intel.services_pct_gdp || 0) > (intel.industry_pct_gdp || 0) ? "services" : "industry";
    const pct = dominant === "services" ? intel.services_pct_gdp : intel.industry_pct_gdp;
    facts.push({
      id: "industry",
      category: "Industry",
      title: "Economic Structure",
      fact: `The economy is ${dominant}-oriented, with ${dominant} accounting for ${pct?.toFixed(0) || "N/A"}% of GDP.`,
      icon: Factory,
      color: "text-purple-400",
      bgGradient: "from-purple-500/20 to-pink-500/20",
    });
  }

  // 4. Employment
  if (intel?.unemployment_rate !== null && intel?.unemployment_rate !== undefined) {
    const youthUnempNote = intel.youth_unemployment_rate 
      ? ` Youth unemployment stands at ${intel.youth_unemployment_rate.toFixed(1)}%.`
      : "";
    facts.push({
      id: "employment",
      category: "Employment",
      title: "Job Market",
      fact: `Unemployment rate of ${intel.unemployment_rate.toFixed(1)}%.${youthUnempNote}`,
      icon: Briefcase,
      color: "text-amber-400",
      bgGradient: "from-amber-500/20 to-orange-500/20",
    });
  }

  // 5. Urbanization
  if (intel?.urban_population_pct) {
    facts.push({
      id: "urban",
      category: "Demographics",
      title: "Urban Living",
      fact: `${intel.urban_population_pct.toFixed(0)}% of the population lives in urban areas, with a median age of ${intel.median_age?.toFixed(0) || "N/A"} years.`,
      icon: Building2,
      color: "text-blue-400",
      bgGradient: "from-blue-500/20 to-indigo-500/20",
    });
  }

  // 6. Health & Development
  if (intel?.life_expectancy_at_birth || intel?.hdi_score) {
    const hdiNote = intel.hdi_score ? ` HDI: ${intel.hdi_score.toFixed(3)}` : "";
    facts.push({
      id: "health",
      category: "Health",
      title: "Life & Development",
      fact: `Life expectancy: ${intel.life_expectancy_at_birth?.toFixed(1) || "N/A"} years. Healthy life expectancy: ${intel.healthy_life_expectancy?.toFixed(1) || "N/A"} years.${hdiNote}`,
      icon: Heart,
      color: "text-red-400",
      bgGradient: "from-red-500/20 to-rose-500/20",
    });
  }

  // Ensure we have at least 6 slides, add generic ones if needed
  while (facts.length < 6) {
    facts.push({
      id: `insight-${facts.length}`,
      category: "Insight",
      title: `${countryName}`,
      fact: `Explore ${countryName}'s occupational health framework through our four-pillar analysis: Governance, Hazard Control, Vigilance, and Restoration.`,
      icon: Lightbulb,
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/20 to-purple-500/20",
    });
  }

  return facts.slice(0, 6);
}

export function SlideshowQuadrant({ country, intelligence }: SlideshowQuadrantProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const slides = useMemo(() => 
    generateFacts(country.name, intelligence),
    [country.name, intelligence]
  );

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Country Insights
          </h3>
          <p className="text-xs text-white/40 mt-0.5">{country.name}</p>
        </div>
        
        {/* Play/Pause control */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white/60" />
          ) : (
            <Play className="w-4 h-4 text-white/60" />
          )}
        </button>
      </div>
      
      {/* Slide Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
            className={cn(
              "absolute inset-0 p-6 flex flex-col justify-center",
              "bg-gradient-to-br",
              currentSlide.bgGradient
            )}
          >
            {/* Category badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium mb-3 w-fit",
                "bg-white/10 border border-white/10"
              )}
            >
              <currentSlide.icon className={cn("w-3 h-3", currentSlide.color)} />
              <span className={currentSlide.color}>{currentSlide.category}</span>
            </motion.div>
            
            {/* Title */}
            <motion.h4
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-bold text-white mb-2"
            >
              {currentSlide.title}
            </motion.h4>
            
            {/* Fact */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-white/70 leading-relaxed"
            >
              {currentSlide.fact}
            </motion.p>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation arrows */}
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* Navigation dots */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 flex items-center justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex 
                ? "bg-cyan-400 w-4" 
                : "bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default SlideshowQuadrant;
