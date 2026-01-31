/**
 * Arthur D. Little - Global Health Platform
 * Country Mini Map Component
 * Shows a small map zoomed into the country's location
 */

import { memo, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { motion } from "framer-motion";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Country center coordinates (approximate)
const COUNTRY_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  DEU: { lat: 51.1657, lng: 10.4515, zoom: 6 },
  GBR: { lat: 55.3781, lng: -3.4360, zoom: 5 },
  USA: { lat: 37.0902, lng: -95.7129, zoom: 2.5 },
  FRA: { lat: 46.2276, lng: 2.2137, zoom: 5 },
  JPN: { lat: 36.2048, lng: 138.2529, zoom: 5 },
  CHN: { lat: 35.8617, lng: 104.1954, zoom: 3 },
  IND: { lat: 20.5937, lng: 78.9629, zoom: 4 },
  BRA: { lat: -14.2350, lng: -51.9253, zoom: 3 },
  AUS: { lat: -25.2744, lng: 133.7751, zoom: 3 },
  CAN: { lat: 56.1304, lng: -106.3468, zoom: 2.5 },
  SAU: { lat: 23.8859, lng: 45.0792, zoom: 5 },
  ARE: { lat: 23.4241, lng: 53.8478, zoom: 6 },
  SGP: { lat: 1.3521, lng: 103.8198, zoom: 10 },
  NLD: { lat: 52.1326, lng: 5.2913, zoom: 7 },
  CHE: { lat: 46.8182, lng: 8.2275, zoom: 7 },
  RUS: { lat: 61.5240, lng: 105.3188, zoom: 2 },
  MEX: { lat: 23.6345, lng: -102.5528, zoom: 4 },
  KOR: { lat: 35.9078, lng: 127.7669, zoom: 6 },
  IDN: { lat: -0.7893, lng: 113.9213, zoom: 4 },
  TUR: { lat: 38.9637, lng: 35.2433, zoom: 5 },
  POL: { lat: 51.9194, lng: 19.1451, zoom: 6 },
  SWE: { lat: 60.1282, lng: 18.6435, zoom: 4 },
  NOR: { lat: 60.4720, lng: 8.4689, zoom: 4 },
  ZAF: { lat: -30.5595, lng: 22.9375, zoom: 5 },
  EGY: { lat: 26.8206, lng: 30.8025, zoom: 5 },
  NGA: { lat: 9.0820, lng: 8.6753, zoom: 5 },
  ARG: { lat: -38.4161, lng: -63.6167, zoom: 3.5 },
  ITA: { lat: 41.8719, lng: 12.5674, zoom: 5.5 },
  ESP: { lat: 40.4637, lng: -3.7492, zoom: 5 },
  PRT: { lat: 39.3999, lng: -8.2245, zoom: 6 },
  GRC: { lat: 39.0742, lng: 21.8243, zoom: 6 },
  AUT: { lat: 47.5162, lng: 14.5501, zoom: 7 },
  BEL: { lat: 50.5039, lng: 4.4699, zoom: 8 },
  DNK: { lat: 56.2639, lng: 9.5018, zoom: 6 },
  FIN: { lat: 61.9241, lng: 25.7482, zoom: 4 },
  IRL: { lat: 53.1424, lng: -7.6921, zoom: 6 },
  NZL: { lat: -40.9006, lng: 174.8860, zoom: 4 },
  MYS: { lat: 4.2105, lng: 101.9758, zoom: 5 },
  THA: { lat: 15.8700, lng: 100.9925, zoom: 5 },
  VNM: { lat: 14.0583, lng: 108.2772, zoom: 5 },
  PHL: { lat: 12.8797, lng: 121.7740, zoom: 5 },
  PAK: { lat: 30.3753, lng: 69.3451, zoom: 5 },
  BGD: { lat: 23.6850, lng: 90.3563, zoom: 6 },
  ISR: { lat: 31.0461, lng: 34.8516, zoom: 7 },
  QAT: { lat: 25.3548, lng: 51.1839, zoom: 8 },
  KWT: { lat: 29.3117, lng: 47.4818, zoom: 8 },
  ROU: { lat: 45.9432, lng: 24.9668, zoom: 6 },
  CZE: { lat: 49.8175, lng: 15.4730, zoom: 7 },
  HUN: { lat: 47.1625, lng: 19.5033, zoom: 7 },
  UKR: { lat: 48.3794, lng: 31.1656, zoom: 5 },
  COL: { lat: 4.5709, lng: -74.2973, zoom: 5 },
  CHL: { lat: -35.6751, lng: -71.5430, zoom: 4 },
  PER: { lat: -9.1900, lng: -75.0152, zoom: 5 },
  VEN: { lat: 6.4238, lng: -66.5897, zoom: 5 },
};

// Default center for unknown countries
const DEFAULT_CENTER = { lat: 20, lng: 0, zoom: 1.5 };

interface CountryMiniMapProps {
  isoCode: string;
  countryName: string;
  className?: string;
}

export const CountryMiniMap = memo(function CountryMiniMap({ 
  isoCode, 
  countryName,
  className = "" 
}: CountryMiniMapProps) {
  const center = useMemo(() => {
    return COUNTRY_CENTERS[isoCode.toUpperCase()] || DEFAULT_CENTER;
  }, [isoCode]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-adl-navy-dark/50 ${className}`}>
      {/* Map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 150,
        }}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          center={[center.lng, center.lat]}
          zoom={center.zoom}
          minZoom={1}
          maxZoom={12}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isHighlighted = geo.properties.name === countryName || 
                  geo.id === isoCode;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHighlighted ? "#4a6bb5" : "#1a1a4e"}
                    stroke={isHighlighted ? "#6b8dd4" : "#252569"}
                    strokeWidth={isHighlighted ? 1.5 : 0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
          
          {/* Country Marker */}
          <Marker coordinates={[center.lng, center.lat]}>
            <motion.circle
              r={6}
              fill="#4a6bb5"
              stroke="#ffffff"
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </Marker>
        </ZoomableGroup>
      </ComposableMap>

      {/* Overlay gradient for professional look */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-adl-navy-dark/80 via-transparent to-transparent" />
      
      {/* Country label */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
          <div className="w-2 h-2 bg-adl-accent rounded-full animate-pulse" />
          <span className="text-xs text-white/80 font-medium">{countryName}</span>
        </div>
      </div>
    </div>
  );
});

export default CountryMiniMap;
