/**
 * EnhancedWeightSlider - Improved weight slider with animations
 * 
 * Features drag animations, visual feedback,
 * and better UX for weight adjustment.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import type { PanInfo, Variants } from "framer-motion";
import {
  TrendingDown,
  Lock,
  Unlock,
  RotateCcw,
  Info,
  Gauge,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Types
interface EnhancedWeightSliderProps {
  metricKey: string;
  metricName: string;
  description?: string | null;
  weight: number;
  defaultWeight?: number;
  isInverted?: boolean;
  maxValue?: number;
  unit?: string | null;
  lowerIsBetter?: boolean;
  onChange: (weight: number) => void;
  onReset?: () => void;
  pillarColor?: string;
  disabled?: boolean;
  locked?: boolean;
  onLockToggle?: () => void;
  showValue?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

// Animation variants
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 20, stiffness: 300 },
  },
} satisfies Variants;

const tooltipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 20, stiffness: 400 },
  },
} satisfies Variants;

export function EnhancedWeightSlider({
  metricKey,
  metricName,
  description,
  weight,
  defaultWeight = 0.2,
  isInverted = false,
  maxValue,
  unit,
  lowerIsBetter = false,
  onChange,
  onReset,
  pillarColor = "text-cyan-400",
  disabled = false,
  locked = false,
  onLockToggle,
  showValue = true,
  min = 0,
  max = 100,
  step = 5,
  className,
}: EnhancedWeightSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Convert weight (0-1) to percentage (0-100)
  const percentage = weight * 100;
  const hasChanged = Math.abs(weight - defaultWeight) > 0.001;

  // Spring animation for smooth thumb movement
  const springPosition = useSpring(percentage, {
    damping: 30,
    stiffness: 400,
  });

  // Update spring when weight changes externally
  useEffect(() => {
    if (!isDragging) {
      springPosition.set(percentage);
    }
  }, [percentage, isDragging, springPosition]);

  // Calculate slider value from mouse/touch position
  const calculateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return percentage;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const rawValue = ratio * (max - min) + min;
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, percentage]
  );

  // Handle drag
  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
      if (disabled || locked) return;

      const clientX =
        "touches" in event
          ? event.touches[0].clientX
          : (event as MouseEvent).clientX;

      const newValue = calculateValue(clientX);
      springPosition.set(newValue);
      onChange(newValue / 100);
    },
    [disabled, locked, calculateValue, onChange, springPosition]
  );

  // Handle click on track
  const handleTrackClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || locked) return;

      const newValue = calculateValue(event.clientX);
      springPosition.set(newValue);
      onChange(newValue / 100);
    },
    [disabled, locked, calculateValue, onChange, springPosition]
  );

  // Transform for track fill
  const fillWidth = useTransform(springPosition, (v) => `${v}%`);

  // Keyboard support
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || locked) return;

      let newValue = percentage;
      switch (event.key) {
        case "ArrowRight":
        case "ArrowUp":
          newValue = Math.min(max, percentage + step);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          newValue = Math.max(min, percentage - step);
          break;
        case "Home":
          newValue = min;
          break;
        case "End":
          newValue = max;
          break;
        default:
          return;
      }

      event.preventDefault();
      springPosition.set(newValue);
      onChange(newValue / 100);
    },
    [disabled, locked, percentage, min, max, step, onChange, springPosition]
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "px-4 py-4 rounded-lg transition-colors",
        isHovered && !disabled && "bg-white/5",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-medium">{metricName}</p>
            {isInverted && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 flex items-center gap-1"
              >
                <TrendingDown className="w-3 h-3" />
                Inverted
              </motion.span>
            )}
            {locked && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60 flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                Locked
              </motion.span>
            )}
            {hasChanged && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400"
              >
                Modified
              </motion.span>
            )}
          </div>
          {description && (
            <p className="text-white/40 text-sm mt-0.5 line-clamp-1">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {/* Action buttons */}
          <AnimatePresence>
            {isHovered && !disabled && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1"
              >
                {hasChanged && onReset && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onReset}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title="Reset to default"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white/60" />
                  </motion.button>
                )}
                {onLockToggle && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onLockToggle}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    title={locked ? "Unlock" : "Lock"}
                  >
                    {locked ? (
                      <Lock className="w-3.5 h-3.5 text-white/60" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-white/60" />
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Weight display */}
          {showValue && (
            <div className="text-right">
              <motion.p
                key={percentage}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={cn("text-2xl font-bold font-mono", pillarColor)}
              >
                {percentage.toFixed(0)}%
              </motion.p>
              {unit && <p className="text-white/40 text-xs">{unit}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Slider */}
      <div
        ref={sliderRef}
        className="relative h-10 flex items-center"
        onClick={handleTrackClick}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={percentage}
        aria-label={`${metricName} weight (${metricKey})`}
        tabIndex={disabled || locked ? -1 : 0}
        onKeyDown={handleKeyDown}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 h-2 bg-white/10 rounded-full">
          {/* Gradient fill */}
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              "bg-gradient-to-r from-white/20 to-white/40"
            )}
            style={{ width: fillWidth }}
          />

          {/* Active fill with glow */}
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              isDragging && "shadow-lg"
            )}
            style={{
              width: fillWidth,
              background: `linear-gradient(to right, rgba(255,255,255,0.3), rgba(255,255,255,0.5))`,
              boxShadow: isDragging ? "0 0 20px rgba(255,255,255,0.3)" : "none",
            }}
          />
        </div>

        {/* Step markers */}
        <div className="absolute inset-x-0 h-2 flex justify-between pointer-events-none">
          {[0, 25, 50, 75, 100].map((marker) => (
            <div
              key={marker}
              className={cn(
                "w-0.5 h-full",
                marker <= percentage ? "bg-white/30" : "bg-white/10"
              )}
            />
          ))}
        </div>

        {/* Draggable Thumb */}
        <motion.div
          ref={thumbRef}
          drag={disabled || locked ? false : "x"}
          dragConstraints={sliderRef}
          dragElastic={0}
          dragMomentum={false}
          onDrag={handleDrag as any}
          onDragStart={() => {
            setIsDragging(true);
            setShowTooltip(true);
          }}
          onDragEnd={() => {
            setIsDragging(false);
            setShowTooltip(false);
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => !isDragging && setShowTooltip(false)}
          style={{
            left: fillWidth,
            x: "-50%",
          }}
          whileHover={{ scale: 1.2 }}
          whileDrag={{ scale: 1.3 }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-10",
            "w-5 h-5 rounded-full bg-white shadow-lg",
            "cursor-grab active:cursor-grabbing",
            "ring-2 ring-white/30",
            isDragging && "ring-4 ring-white/40",
            (disabled || locked) && "cursor-not-allowed opacity-50"
          )}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && !disabled && (
              <motion.div
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <div className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                  <span className="text-white text-sm font-mono font-bold">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 text-xs text-white/30">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      {/* Additional info */}
      {(maxValue || lowerIsBetter) && (
        <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
          {maxValue && (
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>Max: {maxValue}</span>
            </div>
          )}
          {lowerIsBetter && (
            <div className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Lower values indicate better performance</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Simplified variant for compact layouts
export function CompactWeightSlider({
  label,
  weight,
  onChange,
  color = "cyan",
  disabled = false,
  className,
}: {
  label: string;
  weight: number;
  onChange: (weight: number) => void;
  color?: "purple" | "red" | "amber" | "emerald" | "cyan";
  disabled?: boolean;
  className?: string;
}) {
  const accentColor = {
    purple: "#a855f7",
    red: "#ef4444",
    amber: "#f59e0b",
    emerald: "#10b981",
    cyan: "#06b6d4",
  };

  const percentage = weight * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="text-white font-mono text-sm">{percentage.toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percentage}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        disabled={disabled}
        style={{ accentColor: accentColor[color] }}
        className={cn(
          "w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:h-4",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-white",
          "[&::-webkit-slider-thumb]:shadow-lg",
          "[&::-webkit-slider-thumb]:cursor-grab",
          "[&::-webkit-slider-thumb]:transition-transform",
          "[&::-webkit-slider-thumb]:hover:scale-110",
          "[&::-moz-range-thumb]:w-4",
          "[&::-moz-range-thumb]:h-4",
          "[&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:bg-white",
          "[&::-moz-range-thumb]:border-0",
          "[&::-moz-range-thumb]:cursor-grab",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  );
}

// Weight slider group with total validation
export function WeightSliderGroup({
  sliders,
  onSliderChange,
  className,
}: {
  sliders: Array<{
    key: string;
    name: string;
    description?: string;
    weight: number;
    inverted?: boolean;
    color?: string;
  }>;
  onSliderChange: (key: string, weight: number) => void;
  className?: string;
}) {
  const totalWeight = sliders.reduce((sum, s) => sum + s.weight, 0);
  const isValid = Math.abs(totalWeight - 1.0) < 0.001;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Total weight indicator */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
        <span className="text-white/60 text-sm">Total Weight</span>
        <div className="flex items-center gap-2">
          <motion.span
            key={totalWeight}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={cn(
              "font-mono font-bold",
              isValid ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {(totalWeight * 100).toFixed(0)}%
          </motion.span>
          {!isValid && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-amber-400 text-xs"
            >
              (should be 100%)
            </motion.span>
          )}
        </div>
      </div>

      {/* Sliders */}
      <div className="divide-y divide-white/5">
        {sliders.map((slider) => (
          <EnhancedWeightSlider
            key={slider.key}
            metricKey={slider.key}
            metricName={slider.name}
            description={slider.description}
            weight={slider.weight}
            isInverted={slider.inverted}
            pillarColor={slider.color || "text-cyan-400"}
            onChange={(weight) => onSliderChange(slider.key, weight)}
          />
        ))}
      </div>
    </div>
  );
}

export default EnhancedWeightSlider;
