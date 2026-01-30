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
 * Get the flag image URL for a country
 * @param isoCode - The 3-letter ISO country code (e.g., "DEU", "USA")
 * @param backendUrl - Optional backend URL, defaults to environment variable
 */
export function getFlagImageUrl(isoCode: string, backendUrl?: string): string {
  const baseUrl = backendUrl || import.meta.env.VITE_API_URL || "http://localhost:8000";
  return `${baseUrl}/static/flags/${isoCode.toLowerCase()}.svg`;
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat().format(value);
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
}
