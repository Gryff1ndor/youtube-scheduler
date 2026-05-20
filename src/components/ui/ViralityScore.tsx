"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ViralityScoreProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ViralityScore({
  score,
  size = 120,
  strokeWidth = 8,
  className,
}: ViralityScoreProps) {
  const [mounted, setMounted] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine color based on score
  let strokeColorValue = "#ef4444"; // Red for 0 to 40
  if (score > 40 && score <= 70) {
    strokeColorValue = "#f59e0b"; // Orange/Yellow for 41 to 70
  } else if (score > 70) {
    strokeColorValue = "hsl(220 90% 56%)"; // Signature Apple Blue for 71 to 100
  }

  // Handle SSR: wait to animate until mounted
  const drawLength = mounted ? circumference * (score / 100) : 0;
  const dashOffset = circumference - drawLength;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Background Track */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-border"
          fill="none"
        />
        {/* Animated Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="transition-colors duration-500"
          fill="none"
          stroke={strokeColorValue}
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>

      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-2xl font-bold tracking-tighter text-foreground"
        >
          {score}
        </motion.span>
        {size > 80 && (
          <motion.span
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.8, duration: 0.5 }}
             className="text-[10px] uppercase tracking-widest text-foreground-muted mt-0.5"
          >
            Virality
          </motion.span>
        )}
      </div>
    </div>
  );
}
