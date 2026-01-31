/**
 * GOHIP Platform - CountryFlag Component
 * Displays country flag image with emoji fallback
 */

import { useState } from "react";
import { getCountryFlag, getApiBaseUrl } from "../lib/utils";
import { cn } from "../lib/utils";

interface CountryFlagProps {
  isoCode: string;
  flagUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showEmojiFallback?: boolean;
}

const SIZE_CLASSES = {
  sm: "w-6 h-4",
  md: "w-8 h-5",
  lg: "w-12 h-8",
  xl: "w-16 h-10",
};

const EMOJI_SIZE_CLASSES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl",
};

export function CountryFlag({
  isoCode,
  flagUrl,
  size = "md",
  className,
  showEmojiFallback = true,
}: CountryFlagProps) {
  const [imageError, setImageError] = useState(false);

  // If we have a flag URL and no error, show the image
  if (flagUrl && !imageError) {
    const fullUrl = flagUrl.startsWith("http") 
      ? flagUrl 
      : `${getApiBaseUrl()}${flagUrl}`;
    
    return (
      <img
        src={fullUrl}
        alt={`${isoCode} flag`}
        className={cn(
          SIZE_CLASSES[size],
          "object-cover rounded shadow-sm border border-white/10",
          className
        )}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to emoji flag
  if (showEmojiFallback) {
    return (
      <span className={cn(EMOJI_SIZE_CLASSES[size], "leading-none", className)}>
        {getCountryFlag(isoCode)}
      </span>
    );
  }

  // No flag available and no fallback
  return null;
}

export default CountryFlag;
