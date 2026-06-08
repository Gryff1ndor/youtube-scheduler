"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Upload,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveNotifications } from "@/hooks/useLiveNotifications";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/",          icon: LayoutDashboard, badge: null },
  { id: "reports",   label: "Reports",   href: "/reports",   icon: FileText,         badge: null },
  { id: "community", label: "Community", href: "/community", icon: MessageSquare,    badge: "3"  },
  { id: "upload",    label: "Scheduler", href: "/upload",    icon: Upload,           badge: null },
  { id: "settings",  label: "Settings",  href: "/settings",  icon: Settings,         badge: null },
] as const;

// ── Single nav item ────────────────────────────────────────────────────────────
function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  badge: string | null;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      className="relative flex flex-1 items-center justify-center h-full"
    >
      <motion.div
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        className="relative flex flex-col items-center justify-center w-full gap-1 mt-1"
      >
        {/* ── Icon Area with Pill Highlight ── */}
        <div className="relative flex items-center justify-center w-[3.5rem] h-[2rem]">
          {/* Gliding active pill */}
          {isActive && (
            <motion.div
              layoutId="activeNavTab"
              className="absolute inset-0 m-auto bg-black/5 dark:bg-white/15 rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}

          {/* Icon */}
          <Icon
            className={cn(
              "relative z-10 w-[22px] h-[22px] transition-all duration-200",
              isActive ? "text-black dark:text-white" : "text-neutral-500 dark:text-neutral-400"
            )}
            strokeWidth={isActive ? 2.2 : 1.75}
          />

          {/* Badge with ring cutout */}
          {badge && (
            <span className="absolute -top-1 -right-0.5 z-20 bg-[#4ADE80] text-black text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full leading-none ring-2 ring-white dark:ring-[#1c1c1e]">
              {badge}
            </span>
          )}
        </div>

        {/* ── Tiny Text Label ── */}
        <span
          className={cn(
            "text-[10px] font-medium transition-all duration-200 tracking-wide",
            isActive ? "text-black dark:text-white" : "text-neutral-500 dark:text-neutral-400"
          )}
        >
          {label}
        </span>
      </motion.div>
    </Link>
  );
}

// ── Floating Liquid Glass Nav Bar ─────────────────────────────────────────────
export function FloatingMobileNav() {
  const pathname = usePathname();
  const { pendingComments } = useLiveNotifications();

  return (
    <motion.nav
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0,  opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.1 }}
      aria-label="Primary navigation"
      className={cn(
        // ── Position & size ──
        "fixed bottom-8 inset-x-0 mx-auto",
        "w-[94%] max-w-[420px] h-[72px]",
        "z-50",
        // ── Inner layout ──
        "flex items-center justify-around px-2",
        // ── Shape ──
        "rounded-[2.5rem]",
        // ── Extreme Liquid Glass (Apple Style) ──
        "backdrop-blur-[48px] saturate-[2]",
        // Light Mode
        "bg-white/10 bg-gradient-to-b from-white/20 to-transparent",
        "border border-white/40",
        "shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_inset_0_-1px_1px_rgba(0,0,0,0.1),_0_8px_32px_rgba(0,0,0,0.2)]",
        // Dark Mode
        "dark:bg-[#1c1c1e]/40 dark:from-white/10 dark:to-transparent",
        "dark:border-white/10",
        "dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),_inset_0_-1px_1px_rgba(255,255,255,0.05),_0_8px_32px_rgba(0,0,0,0.8)]"
      )}
    >
      {NAV_ITEMS.map((item) => {
        const badgeValue = item.id === "community"
          ? (pendingComments > 0 ? String(pendingComments) : null)
          : item.badge;

        return (
          <NavItem
            key={item.id}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={badgeValue}
            isActive={
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            }
          />
        );
      })}
    </motion.nav>
  );
}
