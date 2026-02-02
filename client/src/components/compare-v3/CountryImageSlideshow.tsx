/**
 * Country Image Slideshow Component
 * 
 * Rotating slideshow of country images with crossfade animation.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCountryImages, type CountryImage } from "../../data/countryImages";
import { cn } from "../../lib/utils";

interface CountryImageSlideshowProps {
  isoCode: string;
  countryName: string;
  className?: string;
  autoRotate?: boolean;
  rotateInterval?: number;
}

export function CountryImageSlideshow({
  isoCode,
  countryName,
  className,
  autoRotate = true,
  rotateInterval = 5000,
}: CountryImageSlideshowProps) {
  const images = getCountryImages(isoCode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate
  useEffect(() => {
    if (!autoRotate || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, rotateInterval);
    
    return () => clearInterval(interval);
  }, [autoRotate, isHovered, images.length, rotateInterval]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative rounded-2xl overflow-hidden group",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]?.url}
            alt={images[currentIndex]?.alt || countryName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </AnimatePresence>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/20" />
      </div>

      {/* Country Name */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-lg font-semibold text-white">{countryName}</h4>
        <p className="text-xs text-slate-300">{images[currentIndex]?.alt}</p>
      </div>

      {/* Navigation Arrows */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goToPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>
      
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>

      {/* Dots Indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex
                ? "bg-white w-4"
                : "bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default CountryImageSlideshow;
