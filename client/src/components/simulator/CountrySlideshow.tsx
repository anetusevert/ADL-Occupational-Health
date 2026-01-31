/**
 * CountrySlideshow Component
 * 
 * Animated slideshow of country images including landmarks, culture, industry
 * Displays country description with political system and key people
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Landmark,
  Factory,
  Users,
  Building2,
  Crown,
  Flag,
  Globe2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryBriefing, CountryContext } from './types';

interface CountryImage {
  id: string;
  category: 'landmark' | 'culture' | 'industry' | 'city' | 'government';
  title: string;
  description: string;
  icon: typeof Landmark;
}

interface CountrySlideshowProps {
  briefing: CountryBriefing | null;
  className?: string;
  autoPlay?: boolean;
  interval?: number;
}

// Generate slideshow data from country context
function generateSlides(briefing: CountryBriefing | null): CountryImage[] {
  if (!briefing?.country_context) {
    return [
      { id: 'default', category: 'landmark', title: 'National Monument', description: 'Iconic landmark', icon: Landmark }
    ];
  }

  const ctx = briefing.country_context;
  const slides: CountryImage[] = [];

  // Landmark slide
  if (ctx.iconic_landmark) {
    slides.push({
      id: 'landmark-1',
      category: 'landmark',
      title: ctx.iconic_landmark,
      description: ctx.landmark_city ? `${ctx.landmark_city}, ${briefing.country_name}` : briefing.country_name,
      icon: Landmark,
    });
  }

  // Capital/Government slide
  if (ctx.capital) {
    slides.push({
      id: 'capital',
      category: 'government',
      title: ctx.capital,
      description: `Capital of ${briefing.country_name}`,
      icon: Building2,
    });
  }

  // Industry slides
  if (ctx.key_industries && ctx.key_industries.length > 0) {
    slides.push({
      id: 'industry-1',
      category: 'industry',
      title: ctx.key_industries[0],
      description: 'Key economic sector',
      icon: Factory,
    });

    if (ctx.key_industries.length > 1) {
      slides.push({
        id: 'industry-2',
        category: 'industry',
        title: ctx.key_industries[1],
        description: 'Major industry',
        icon: Factory,
      });
    }
  }

  // Industrial regions
  if (ctx.industrial_regions && ctx.industrial_regions.length > 0) {
    slides.push({
      id: 'region',
      category: 'city',
      title: ctx.industrial_regions[0],
      description: 'Major industrial region',
      icon: MapPin,
    });
  }

  // Culture slide
  slides.push({
    id: 'culture',
    category: 'culture',
    title: 'Cultural Heritage',
    description: briefing.cultural_factors?.substring(0, 80) || `Rich traditions of ${briefing.country_name}`,
    icon: Users,
  });

  return slides.length > 0 ? slides : [
    { id: 'default', category: 'landmark', title: 'National Monument', description: 'Explore the nation', icon: Landmark }
  ];
}

export function CountrySlideshow({
  briefing,
  className,
  autoPlay = true,
  interval = 5000,
}: CountrySlideshowProps) {
  const slides = generateSlides(briefing);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || isPaused || slides.length <= 1) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [autoPlay, isPaused, interval, nextSlide, slides.length]);

  const currentSlide = slides[currentIndex];
  const SlideIcon = currentSlide?.icon || Landmark;

  // Category colors
  const categoryColors: Record<string, string> = {
    landmark: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    culture: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    industry: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    city: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    government: 'from-red-500/20 to-rose-500/20 border-red-500/30',
  };

  const categoryIcons: Record<string, string> = {
    landmark: 'text-amber-400',
    culture: 'text-purple-400',
    industry: 'text-blue-400',
    city: 'text-emerald-400',
    government: 'text-red-400',
  };

  return (
    <div
      className={cn('relative h-full flex flex-col', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Slide Area */}
      <div className="flex-1 relative overflow-hidden rounded-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className={cn(
              'absolute inset-0 bg-gradient-to-br border',
              categoryColors[currentSlide.category] || categoryColors.landmark
            )}
          >
            {/* Icon Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                {/* Glow Effect */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
                />
                <SlideIcon className={cn(
                  'w-20 h-20 relative z-10',
                  categoryIcons[currentSlide.category] || 'text-amber-400'
                )} />
              </motion.div>
            </div>

            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <span className={cn(
                'text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full',
                'bg-white/10 backdrop-blur-sm border border-white/20 text-white/70'
              )}>
                {currentSlide.category}
              </span>
            </div>

            {/* Slide Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent"
            >
              <h3 className="text-lg font-bold text-white">{currentSlide.title}</h3>
              <p className="text-sm text-white/60 line-clamp-2">{currentSlide.description}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-4'
                  : 'bg-white/30 hover:bg-white/50'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Country Profile Card with political system and key people
 */
export function CountryProfile({
  briefing,
  className,
}: {
  briefing: CountryBriefing | null;
  className?: string;
}) {
  if (!briefing) return null;

  const ctx = briefing.country_context;
  const stats = briefing.key_statistics;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with Flag */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <img
          src={briefing.flag_url}
          alt={briefing.country_name}
          className="w-10 h-7 object-cover rounded shadow"
        />
        <div>
          <h3 className="font-bold text-white">{briefing.country_name}</h3>
          <p className="text-[10px] text-white/40">{briefing.iso_code}</p>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {ctx?.capital && (
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/60">Capital:</span>
            <span className="text-white font-medium">{ctx.capital}</span>
          </div>
        )}
        {stats?.population && (
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-white/40" />
            <span className="text-white/60">Pop:</span>
            <span className="text-white font-medium">
              {typeof stats.population === 'number' 
                ? `${(stats.population / 1000000).toFixed(1)}M`
                : stats.population}
            </span>
          </div>
        )}
      </div>

      {/* Government Info */}
      {ctx?.ministry_name && (
        <div className="p-2 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-medium text-white/60 uppercase tracking-wide">Government</span>
          </div>
          <p className="text-xs text-white">{ctx.ministry_name}</p>
          {ctx.ministry_abbreviation && (
            <p className="text-[10px] text-white/40">{ctx.ministry_abbreviation}</p>
          )}
        </div>
      )}

      {/* Key Industries */}
      {ctx?.key_industries && ctx.key_industries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Factory className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-medium text-white/60 uppercase tracking-wide">Key Industries</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {ctx.key_industries.slice(0, 4).map((industry, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Labor Organizations */}
      {ctx?.major_unions && ctx.major_unions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-medium text-white/60 uppercase tracking-wide">Labor Organizations</span>
          </div>
          <p className="text-xs text-white/70">{ctx.major_unions[0]}</p>
        </div>
      )}
    </div>
  );
}

export default CountrySlideshow;
