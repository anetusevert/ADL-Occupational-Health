/**
 * AnimatedWeightChart - Radial/Donut chart for weight distribution
 * 
 * Visualizes weight distribution with animated segments,
 * spring animations, and hover states.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "../../lib/utils";

// Types
interface WeightSegment {
  id: string;
  label: string;
  shortLabel?: string;
  weight: number;
  color: string;
  icon?: React.ElementType;
}

interface AnimatedWeightChartProps {
  segments: WeightSegment[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  showCenter?: boolean;
  centerLabel?: string;
  centerValue?: string;
  animated?: boolean;
  onSegmentClick?: (segment: WeightSegment) => void;
  onSegmentHover?: (segment: WeightSegment | null) => void;
  selectedSegment?: string | null;
  className?: string;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 200,
      staggerChildren: 0.1,
    },
  },
};

const legendVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
};

// Animated path segment
function AnimatedSegment({
  startAngle,
  endAngle,
  radius,
  strokeWidth,
  color,
  isHovered,
  isSelected,
  delay = 0,
  onClick,
}: {
  startAngle: number;
  endAngle: number;
  radius: number;
  strokeWidth: number;
  color: string;
  isHovered: boolean;
  isSelected: boolean;
  delay?: number;
  onClick?: () => void;
}) {
  const center = radius + strokeWidth;
  const innerRadius = radius - strokeWidth / 2;
  const outerRadius = radius + strokeWidth / 2;

  // Animated end angle using spring
  const springEndAngle = useSpring(startAngle, {
    duration: 1000,
    bounce: 0.2,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      springEndAngle.set(endAngle);
    }, delay);
    return () => clearTimeout(timer);
  }, [endAngle, springEndAngle, delay]);

  const d = useTransform(springEndAngle, (currentEndAngle) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (currentEndAngle - 90) * (Math.PI / 180);

    const x1 = center + innerRadius * Math.cos(startRad);
    const y1 = center + innerRadius * Math.sin(startRad);
    const x2 = center + innerRadius * Math.cos(endRad);
    const y2 = center + innerRadius * Math.sin(endRad);
    const x3 = center + outerRadius * Math.cos(endRad);
    const y3 = center + outerRadius * Math.sin(endRad);
    const x4 = center + outerRadius * Math.cos(startRad);
    const y4 = center + outerRadius * Math.sin(startRad);

    const largeArcFlag = currentEndAngle - startAngle > 180 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;
  });

  const scale = isHovered || isSelected ? 1.05 : 1;
  const opacity = isSelected ? 1 : isHovered ? 0.9 : 0.85;

  return (
    <motion.path
      d={d}
      fill={color}
      animate={{ scale, opacity }}
      transition={{ type: "spring", damping: 20, stiffness: 400 }}
      style={{ transformOrigin: `${center}px ${center}px` }}
      className="cursor-pointer"
      onClick={onClick}
      whileHover={{ filter: "brightness(1.1)" }}
    />
  );
}

// Main chart component
export function AnimatedWeightChart({
  segments,
  size = 200,
  strokeWidth = 30,
  showLabels = true,
  showLegend = true,
  showCenter = true,
  centerLabel = "Total",
  centerValue,
  animated = true,
  onSegmentClick,
  onSegmentHover,
  selectedSegment,
  className,
}: AnimatedWeightChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const chartRef = useRef<SVGSVGElement>(null);

  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;

  // Calculate segment angles
  const segmentAngles = useMemo(() => {
    const total = segments.reduce((sum, s) => sum + s.weight, 0);
    let currentAngle = 0;
    
    return segments.map((segment) => {
      const startAngle = currentAngle;
      const sweepAngle = (segment.weight / total) * 360;
      const endAngle = currentAngle + sweepAngle;
      currentAngle = endAngle;

      // Calculate label position (middle of arc)
      const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
      const labelRadius = radius + strokeWidth + 20;
      const labelX = center + labelRadius * Math.cos(midAngle);
      const labelY = center + labelRadius * Math.sin(midAngle);

      return {
        ...segment,
        startAngle,
        endAngle,
        sweepAngle,
        labelX,
        labelY,
        percentage: ((segment.weight / total) * 100).toFixed(0),
      };
    });
  }, [segments, radius, center, strokeWidth]);

  const handleSegmentHover = (segment: WeightSegment | null) => {
    setHoveredSegment(segment?.id || null);
    onSegmentHover?.(segment);
  };

  // Animated total weight
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  const springTotal = useSpring(0, { duration: 1500, bounce: 0 });
  const displayTotal = useTransform(springTotal, (v) => `${v.toFixed(0)}%`);

  useEffect(() => {
    if (animated) {
      springTotal.set(totalWeight * 100);
    } else {
      springTotal.set(totalWeight * 100);
    }
  }, [totalWeight, springTotal, animated]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col items-center gap-6", className)}
    >
      {/* Chart SVG */}
      <div className="relative">
        <svg
          ref={chartRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {segmentAngles.map((segment, index) => (
            <AnimatedSegment
              key={segment.id}
              startAngle={segment.startAngle}
              endAngle={segment.endAngle}
              radius={radius}
              strokeWidth={strokeWidth}
              color={segment.color}
              isHovered={hoveredSegment === segment.id}
              isSelected={selectedSegment === segment.id}
              delay={animated ? index * 100 : 0}
              onClick={() => onSegmentClick?.(segment)}
            />
          ))}

          {/* Segment labels (optional) */}
          {showLabels && segmentAngles.map((segment) => {
            const isActive = hoveredSegment === segment.id || selectedSegment === segment.id;
            return (
              <g key={`label-${segment.id}`}>
                <motion.text
                  x={segment.labelX}
                  y={segment.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive ? "white" : "rgba(255,255,255,0.6)"}
                  fontSize={isActive ? 14 : 12}
                  fontWeight={isActive ? 600 : 400}
                  className="pointer-events-none transition-all duration-200"
                >
                  {segment.percentage}%
                </motion.text>
              </g>
            );
          })}

          {/* Center content */}
          {showCenter && (
            <g>
              <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth - 10}
                fill="rgba(10, 10, 26, 0.9)"
              />
              <motion.text
                x={center}
                y={center - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize={12}
                className="pointer-events-none"
              >
                {centerLabel}
              </motion.text>
              <motion.text
                x={center}
                y={center + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={24}
                fontWeight={700}
                fontFamily="monospace"
                className="pointer-events-none"
              >
                {centerValue ?? displayTotal}
              </motion.text>
            </g>
          )}
        </svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredSegment && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full"
            >
              {(() => {
                const segment = segmentAngles.find((s) => s.id === hoveredSegment);
                if (!segment) return null;
                return (
                  <div className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                    <p className="text-white text-sm font-medium">{segment.label}</p>
                    <p className="text-white/60 text-xs">{segment.percentage}% weight</p>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      {showLegend && (
        <motion.div
          variants={containerVariants}
          className="flex flex-wrap justify-center gap-3"
        >
          {segmentAngles.map((segment, index) => {
            const Icon = segment.icon;
            const isActive = hoveredSegment === segment.id || selectedSegment === segment.id;

            return (
              <motion.button
                key={segment.id}
                variants={legendVariants}
                custom={index}
                onClick={() => onSegmentClick?.(segment)}
                onMouseEnter={() => handleSegmentHover(segment)}
                onMouseLeave={() => handleSegmentHover(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-white/15 ring-1 ring-white/30"
                    : "bg-white/5 hover:bg-white/10"
                )}
              >
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                {Icon && <Icon className="w-4 h-4 text-white/60" />}
                <span className="text-white/80 text-sm">{segment.shortLabel || segment.label}</span>
                <span className="text-white/40 text-xs font-mono">{segment.percentage}%</span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

// Simpler bar chart variant
export function AnimatedWeightBars({
  segments,
  maxWidth = 300,
  barHeight = 8,
  showPercentage = true,
  animated = true,
  className,
}: {
  segments: WeightSegment[];
  maxWidth?: number;
  barHeight?: number;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      {segments.map((segment, index) => {
        const percentage = (segment.weight / total) * 100;
        const Icon = segment.icon;

        return (
          <motion.div
            key={segment.id}
            variants={legendVariants}
            custom={index}
            className="flex items-center gap-3"
          >
            {Icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${segment.color}33` }}
              >
                <Icon className="w-4 h-4" style={{ color: segment.color }} />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/80 text-sm">{segment.label}</span>
                {showPercentage && (
                  <span className="text-white/60 text-sm font-mono">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
              <div
                className="relative h-2 bg-white/10 rounded-full overflow-hidden"
                style={{ width: maxWidth, height: barHeight }}
              >
                <motion.div
                  initial={animated ? { width: 0 } : { width: `${percentage}%` }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1,
                    type: "spring",
                    damping: 20,
                  }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Pillar weight distribution preset
// Weights based on WHO/ILO framework - Hazard Control highest as prevention is primary goal
export function PillarWeightChart({
  weights,
  className,
}: {
  weights?: Record<string, number>;
  className?: string;
}) {
  const defaultWeights = {
    governance: 0.20,        // 20% - Regulatory foundation
    pillar_1_hazard: 0.35,   // 35% - Prevention (highest priority)
    pillar_2_vigilance: 0.25, // 25% - Detection
    pillar_3_restoration: 0.20, // 20% - Recovery
  };

  const mergedWeights = { ...defaultWeights, ...weights };

  const segments: WeightSegment[] = [
    {
      id: "governance",
      label: "Governance",
      shortLabel: "GOV",
      weight: mergedWeights.governance,
      color: "#a855f7",
    },
    {
      id: "pillar_1_hazard",
      label: "Hazard Control",
      shortLabel: "P1",
      weight: mergedWeights.pillar_1_hazard,
      color: "#ef4444",
    },
    {
      id: "pillar_2_vigilance",
      label: "Health Vigilance",
      shortLabel: "P2",
      weight: mergedWeights.pillar_2_vigilance,
      color: "#f59e0b",
    },
    {
      id: "pillar_3_restoration",
      label: "Restoration",
      shortLabel: "P3",
      weight: mergedWeights.pillar_3_restoration,
      color: "#10b981",
    },
  ];

  return (
    <AnimatedWeightChart
      segments={segments}
      size={180}
      strokeWidth={25}
      centerLabel="Pillar Weights"
      className={className}
    />
  );
}

export default AnimatedWeightChart;
