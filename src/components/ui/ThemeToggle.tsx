"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-8 w-8 rounded-md bg-surface-elevated animate-pulse-soft",
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      id="theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-9 w-9 rounded-xl flex items-center justify-center",
        "text-foreground",
        "backdrop-blur-xl saturate-[1.5]",
        "bg-white/30 border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),_0_2px_8px_rgba(0,0,0,0.05)] hover:bg-white/40",
        "dark:bg-[#1c1c1e]/40 dark:border-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_2px_8px_rgba(0,0,0,0.3)] dark:hover:bg-[#1c1c1e]/60",
        "transition-all duration-300 focus:outline-none",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center justify-center"
          >
            <Sun size={16} strokeWidth={1.75} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center justify-center"
          >
            <Moon size={16} strokeWidth={1.75} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
