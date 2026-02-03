/**
 * Arthur D. Little - Global Health Platform
 * TextReveal - Character-by-character text reveal animation
 * 
 * Creates an elegant typing effect with optional glow
 */

import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
  glow?: boolean;
  glowColor?: string;
}

export function TextReveal({
  text,
  className,
  delay = 0,
  staggerDelay = 0.03,
  glow = false,
  glowColor = "rgba(6, 182, 212, 0.5)",
}: TextRevealProps) {
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      animate="visible"
      className={cn("inline-block", className)}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-[0.25em]">
          {word.split("").map((char, charIndex) => {
            const globalIndex = words
              .slice(0, wordIndex)
              .reduce((acc, w) => acc + w.length, 0) + charIndex;
            
            return (
              <motion.span
                key={charIndex}
                initial={{ 
                  opacity: 0, 
                  y: 10,
                  filter: "blur(4px)",
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.3,
                  delay: delay + globalIndex * staggerDelay,
                  ease: "easeOut",
                }}
                style={glow ? {
                  textShadow: `0 0 20px ${glowColor}`,
                } : undefined}
                className="inline-block"
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.span>
  );
}

// Word-by-word reveal variant
export function WordReveal({
  text,
  className,
  delay = 0,
  staggerDelay = 0.1,
}: Omit<TextRevealProps, "glow" | "glowColor">) {
  const words = text.split(" ");

  return (
    <motion.span className={cn("inline-block", className)}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ 
            opacity: 0, 
            y: 20,
            filter: "blur(8px)",
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 0.5,
            delay: delay + index * staggerDelay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Line-by-line reveal for paragraphs
export function LineReveal({
  lines,
  className,
  delay = 0,
  staggerDelay = 0.15,
}: {
  lines: string[];
  className?: string;
  delay?: number;
  staggerDelay?: number;
}) {
  return (
    <div className={className}>
      {lines.map((line, index) => (
        <motion.p
          key={index}
          initial={{ 
            opacity: 0, 
            x: -20,
          }}
          animate={{ 
            opacity: 1, 
            x: 0,
          }}
          transition={{
            duration: 0.5,
            delay: delay + index * staggerDelay,
            ease: "easeOut",
          }}
          className="mb-2"
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}

export default TextReveal;
