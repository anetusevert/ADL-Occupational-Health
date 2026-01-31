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
  imageUrl?: string;
}

// Curated image URLs for specific countries (Unsplash free images)
const COUNTRY_IMAGES: Record<string, Record<string, string>> = {
  SAU: {
    landmark: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=600&h=400&fit=crop', // Kingdom Tower Riyadh
    culture: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&h=400&fit=crop', // Saudi culture
    industry: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&h=400&fit=crop', // Oil industry
    government: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=600&h=400&fit=crop', // Riyadh skyline
  },
  UAE: {
    landmark: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop', // Burj Khalifa
    culture: 'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=600&h=400&fit=crop', // Dubai culture
    industry: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&h=400&fit=crop', // Modern industry
    government: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&h=400&fit=crop', // Dubai
  },
  DEU: {
    landmark: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop', // Brandenburg Gate
    culture: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&h=400&fit=crop', // German culture
    industry: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=400&fit=crop', // German industry
    government: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&h=400&fit=crop', // Berlin
  },
  GBR: {
    landmark: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop', // Big Ben
    culture: 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=600&h=400&fit=crop', // British culture
    industry: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', // London financial
    government: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&h=400&fit=crop', // Westminster
  },
  JPN: {
    landmark: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop', // Mt Fuji
    culture: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop', // Japanese culture
    industry: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop', // Tokyo industry
    government: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&h=400&fit=crop', // Tokyo
  },
  USA: {
    landmark: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=600&h=400&fit=crop', // Statue of Liberty
    culture: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop', // American culture
    industry: 'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=600&h=400&fit=crop', // Industry
    government: 'https://images.unsplash.com/photo-1585063560940-e5a32ffdcf53?w=600&h=400&fit=crop', // DC Capitol
  },
  AUS: {
    landmark: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&h=400&fit=crop', // Sydney Opera
    culture: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600&h=400&fit=crop', // Australian culture
    industry: 'https://images.unsplash.com/photo-1529455804998-9e79d19df6ba?w=600&h=400&fit=crop', // Mining
    government: 'https://images.unsplash.com/photo-1524820197278-540916411e20?w=600&h=400&fit=crop', // Sydney
  },
  IND: {
    landmark: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&h=400&fit=crop', // Taj Mahal
    culture: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=400&fit=crop', // Indian culture
    industry: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop', // Tech industry
    government: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&h=400&fit=crop', // Delhi
  },
  CHN: {
    landmark: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&h=400&fit=crop', // Great Wall
    culture: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600&h=400&fit=crop', // Chinese culture
    industry: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=600&h=400&fit=crop', // Industry
    government: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&h=400&fit=crop', // Beijing
  },
  BRA: {
    landmark: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&h=400&fit=crop', // Christ Redeemer
    culture: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=600&h=400&fit=crop', // Brazilian culture
    industry: 'https://images.unsplash.com/photo-1518639192441-8fce0a366e2e?w=600&h=400&fit=crop', // Industry
    government: 'https://images.unsplash.com/photo-1544989164-31dc3c645987?w=600&h=400&fit=crop', // Brasilia
  },
};

// Default images for countries without specific mappings
const DEFAULT_IMAGES: Record<string, string> = {
  landmark: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop',
  culture: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop',
  industry: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
  city: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
  government: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&h=400&fit=crop',
};

function getImageUrl(isoCode: string, category: string): string {
  const countryImages = COUNTRY_IMAGES[isoCode.toUpperCase()];
  if (countryImages && countryImages[category]) {
    return countryImages[category];
  }
  return DEFAULT_IMAGES[category] || DEFAULT_IMAGES.landmark;
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
      { id: 'default', category: 'landmark', title: 'National Monument', description: 'Iconic landmark', icon: Landmark, imageUrl: DEFAULT_IMAGES.landmark }
    ];
  }

  const ctx = briefing.country_context;
  const isoCode = briefing.iso_code;
  const slides: CountryImage[] = [];

  // Landmark slide
  if (ctx.iconic_landmark) {
    slides.push({
      id: 'landmark-1',
      category: 'landmark',
      title: ctx.iconic_landmark,
      description: ctx.landmark_city ? `${ctx.landmark_city}, ${briefing.country_name}` : briefing.country_name,
      icon: Landmark,
      imageUrl: getImageUrl(isoCode, 'landmark'),
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
      imageUrl: getImageUrl(isoCode, 'government'),
    });
  }

  // Culture slide
  slides.push({
    id: 'culture',
    category: 'culture',
    title: 'Cultural Heritage',
    description: briefing.cultural_factors?.substring(0, 80) || `Rich traditions of ${briefing.country_name}`,
    icon: Users,
    imageUrl: getImageUrl(isoCode, 'culture'),
  });

  // Industry slides
  if (ctx.key_industries && ctx.key_industries.length > 0) {
    slides.push({
      id: 'industry-1',
      category: 'industry',
      title: ctx.key_industries[0],
      description: 'Key economic sector',
      icon: Factory,
      imageUrl: getImageUrl(isoCode, 'industry'),
    });
  }

  // Industrial regions / City
  if (ctx.industrial_regions && ctx.industrial_regions.length > 0) {
    slides.push({
      id: 'region',
      category: 'city',
      title: ctx.industrial_regions[0],
      description: 'Major industrial region',
      icon: MapPin,
      imageUrl: getImageUrl(isoCode, 'city'),
    });
  }

  return slides.length > 0 ? slides : [
    { id: 'default', category: 'landmark', title: 'National Monument', description: 'Explore the nation', icon: Landmark, imageUrl: DEFAULT_IMAGES.landmark }
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
            className="absolute inset-0"
          >
            {/* Background Image */}
            {currentSlide.imageUrl ? (
              <img
                src={currentSlide.imageUrl}
                alt={currentSlide.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to gradient if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            
            {/* Gradient Overlay (always shown for text readability) */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-60',
              categoryColors[currentSlide.category] || categoryColors.landmark
            )} />

            {/* Icon Display (shown on top of image) */}
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
                  className="absolute inset-0 w-24 h-24 bg-black/30 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
                />
                <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4">
                  <SlideIcon className={cn(
                    'w-12 h-12 relative z-10',
                    categoryIcons[currentSlide.category] || 'text-amber-400'
                  )} />
                </div>
              </motion.div>
            </div>

            {/* Category Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className={cn(
                'text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full',
                'bg-black/40 backdrop-blur-sm border border-white/20 text-white'
              )}>
                {currentSlide.category}
              </span>
            </div>

            {/* Slide Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
            >
              <h3 className="text-lg font-bold text-white drop-shadow-lg">{currentSlide.title}</h3>
              <p className="text-sm text-white/80 line-clamp-2 drop-shadow">{currentSlide.description}</p>
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
