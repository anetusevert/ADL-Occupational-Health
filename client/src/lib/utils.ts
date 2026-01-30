import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the API base URL from environment or default
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || "http://localhost:8000";
}

/**
 * Get the flag image URL for a country
 * @param isoCode - The 3-letter ISO country code (e.g., "DEU", "USA")
 * @param backendUrl - Optional backend URL, defaults to environment variable
 */
export function getFlagImageUrl(isoCode: string, backendUrl?: string): string {
  const baseUrl = backendUrl || getApiBaseUrl();
  return `${baseUrl}/static/flags/${isoCode.toLowerCase()}.svg`;
}

/**
 * Get country flag emoji or fallback
 * @param isoCode - The 3-letter ISO country code
 */
export function getCountryFlag(isoCode: string): string {
  // Convert ISO 3166-1 alpha-3 to alpha-2 for emoji flags
  const alpha3ToAlpha2: Record<string, string> = {
    DEU: "DE", USA: "US", GBR: "GB", FRA: "FR", JPN: "JP", CHN: "CN",
    IND: "IN", BRA: "BR", CAN: "CA", AUS: "AU", SAU: "SA", ARE: "AE",
    // Add more as needed
  };
  
  const alpha2 = alpha3ToAlpha2[isoCode.toUpperCase()];
  if (!alpha2) return "🏳️";
  
  // Convert alpha-2 code to flag emoji
  const codePoints = alpha2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Get maturity stage label and color based on score
 * @param score - Maturity score (0-100)
 */
export function getMaturityStage(score: number | null | undefined): {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  if (score === null || score === undefined) {
    return {
      label: "Unknown",
      color: "gray",
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
    };
  }

  if (score >= 80) {
    return {
      label: "Leading",
      color: "emerald",
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-700",
    };
  } else if (score >= 60) {
    return {
      label: "Advancing",
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    };
  } else if (score >= 40) {
    return {
      label: "Developing",
      color: "amber",
      bgColor: "bg-amber-100",
      textColor: "text-amber-700",
    };
  } else if (score >= 20) {
    return {
      label: "Emerging",
      color: "orange",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
    };
  } else {
    return {
      label: "Nascent",
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    };
  }
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a boolean value as Yes/No
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return value ? "Yes" : "No";
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
}
