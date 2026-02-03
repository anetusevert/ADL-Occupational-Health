/**
 * Country Insights Quadrant Component
 * 
 * Displays 6 image tiles showcasing different aspects of the country:
 * - Culture & Society
 * - Famous Landmarks
 * - Industry & Economy
 * - Urban Development
 * - People & Community
 * - Political System
 * 
 * Features:
 * - No scrolling (6 tiles in 3x2 grid)
 * - Real country images from Unsplash
 * - Click to open detail modal with AI-generated content
 * - ADL OHI Score integration
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { 
  getCountryImages, 
  getCountryImageSync,
  CATEGORY_INFO,
  type CountryImageSet,
  type ImageCategory 
} from "../../services/unsplashService";
import { CountryInsightModal } from "./CountryInsightModal";
import type { CountryIntelligence } from "../../pages/CountryDashboard";

interface SlideshowQuadrantProps {
  country: {
    iso_code: string;
    name: string;
    governance_score?: number | null;
    pillar1_score?: number | null;
    pillar2_score?: number | null;
    pillar3_score?: number | null;
    maturity_score?: number | null;
  };
  intelligence: CountryIntelligence | null;
}

interface ImageTileProps {
  category: ImageCategory;
  imageUrl: string;
  title: string;
  onClick: () => void;
  delay: number;
  isLoading?: boolean;
}

function ImageTile({ category, imageUrl, title, onClick, delay, isLoading }: ImageTileProps) {
  const info = CATEGORY_INFO[category];
  
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full h-full rounded-lg overflow-hidden group cursor-pointer"
    >
      {/* Background Image */}
      {isLoading ? (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
        </div>
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-colors duration-300" />
      
      {/* Content */}
      <div className="absolute inset-0 p-2 flex flex-col justify-end">
        {/* Icon Badge */}
        <div className="absolute top-2 left-2 text-lg">
          {info.icon}
        </div>
        
        {/* Title */}
        <h4 className="text-xs font-semibold text-white leading-tight line-clamp-1">
          {title}
        </h4>
        
        {/* Click hint on hover */}
        <div className="text-[9px] text-cyan-400/0 group-hover:text-cyan-400/80 transition-colors mt-0.5">
          Click to explore
        </div>
      </div>
      
      {/* Border Glow on Hover */}
      <div className="absolute inset-0 rounded-lg border border-white/0 group-hover:border-cyan-400/50 transition-colors duration-300" />
    </motion.button>
  );
}

export function SlideshowQuadrant({ country, intelligence }: SlideshowQuadrantProps) {
  const [images, setImages] = useState<CountryImageSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory | null>(null);

  // Fetch images on mount
  useEffect(() => {
    let mounted = true;
    
    async function loadImages() {
      setIsLoading(true);
      try {
        const imageSet = await getCountryImages(country.iso_code, country.name);
        if (mounted) {
          setImages(imageSet);
        }
      } catch (error) {
        console.error("Error loading country images:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadImages();
    
    return () => {
      mounted = false;
    };
  }, [country.iso_code, country.name]);

  // Get image URL for a category (sync fallback while loading)
  const getImageUrl = (category: ImageCategory): string => {
    if (images?.[category]) {
      return images[category]?.thumbnailUrl || images[category]?.url || "";
    }
    return getCountryImageSync(country.iso_code, category).thumbnailUrl;
  };

  const categories: ImageCategory[] = ["culture", "landmarks", "industry", "cityscape", "people", "political"];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Country Insights
        </h3>
        <p className="text-[10px] text-white/40">{country.name} • Click to explore</p>
      </div>
      
      {/* Image Grid - 3x2 layout, no scroll */}
      <div className="flex-1 p-2">
        <div className="h-full grid grid-cols-3 grid-rows-2 gap-2">
          {categories.map((category, index) => (
            <ImageTile
              key={category}
              category={category}
              imageUrl={getImageUrl(category)}
              title={CATEGORY_INFO[category].title}
              onClick={() => setSelectedCategory(category)}
              delay={0.1 + index * 0.05}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>
      
      {/* Country Insight Modal */}
      <CountryInsightModal
        isOpen={selectedCategory !== null}
        category={selectedCategory || "culture"}
        country={country}
        intelligence={intelligence}
        imageUrl={selectedCategory ? (images?.[selectedCategory]?.url || getCountryImageSync(country.iso_code, selectedCategory).url) : ""}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
}

export default SlideshowQuadrant;
