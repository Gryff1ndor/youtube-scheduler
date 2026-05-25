"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Settings,
  ChevronLeft,
  Layers,
  Upload,
  MessageSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── Nav items ── */
const NAV_ITEMS = [
  { id: "dashboard",     label: "Dashboard",     href: "/",              icon: LayoutDashboard },
  { id: "reports",       label: "Reports",       href: "/reports",       icon: FileText },
  { id: "community",     label: "Community",     href: "/community",     icon: MessageSquare },
  { id: "upload",        label: "AI Scheduler",  href: "/upload",        icon: Upload },
  { id: "integrations",  label: "Integrations",  href: "/integrations",  icon: Layers },
] as const;

const BOTTOM_ITEMS = [
  { id: "settings", label: "Settings", href: "/settings", icon: Settings },
] as const;

/* ── Label animation variants ── */
const labelVariants = {
  visible: { opacity: 1, x: 0,  transition: { delay: 0.06, duration: 0.15, ease: [0.4, 0, 0.2, 1] as const } },
  hidden:  { opacity: 0, x: -6, transition: { duration: 0.10, ease: [0.4, 0, 0.2, 1] as const } },
};

/* ── NavItem ── */
interface NavItemProps {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isCollapsed: boolean;
  isActive: boolean;
}

function NavItem({ label, href, icon: Icon, badge, isCollapsed, isActive }: NavItemProps) {
  const link = (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2",
        "text-sm font-medium transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[--accent]",
        isActive
          ? "bg-[--accent-subtle] text-[--accent]"
          : "text-[--foreground-muted] hover:bg-[--surface-elevated] hover:text-[--foreground]",
        isCollapsed && "justify-center px-0"
      )}
    >
      {/* Active left indicator */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[--accent]"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <Icon
        size={16}
        strokeWidth={isActive ? 2.25 : 1.75}
        className={cn(
          "shrink-0 transition-colors duration-200",
          isActive
            ? "text-[--accent]"
            : "text-[--foreground-subtle] group-hover:text-[--foreground-muted]"
        )}
      />

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.span
            key="label"
            variants={labelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="truncate flex-1"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!isCollapsed && badge && (
          <motion.span
            key="badge"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "ml-auto text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded-full",
              badge === "New"
                ? "bg-[--accent-subtle] text-[--accent]"
                : "bg-[--surface-elevated] text-[--foreground-muted]"
            )}
          >
            {badge}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">
          {label}
          {badge && (
            <Badge variant="secondary" className="ml-2 text-[10px]">
              {badge}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

/* ── Sidebar ── */
interface SidebarProps {
  defaultCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ defaultCollapsed = false, onCollapse }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const pathname = usePathname();

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      onCollapse?.(next);
      return next;
    });
  }, [onCollapse]);

  return (
    <aside
      id="sidebar"
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        "relative flex flex-col h-full overflow-hidden",
        "bg-[--sidebar] border-r border-[--sidebar-border]",
        "w-full" // width is controlled by parent AppShell motion.div
      )}
    >
      {/* ── Logo / Brand ── */}
      <div
        className={cn(
          "flex items-center h-[var(--topnav-height)] shrink-0",
          "border-b border-[--sidebar-border] px-3.5",
          isCollapsed ? "justify-center px-0" : "gap-2.5"
        )}
      >
        {/* Logo mark */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[--accent] text-white shadow-sm">
          <span className="text-xs font-bold tracking-tighter">C</span>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key="brand-label"
              variants={labelVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden min-w-0"
            >
              <p className="text-sm font-semibold tracking-tight text-[--foreground] truncate">
                Clarity
              </p>
              <p className="text-[10px] text-[--foreground-muted] leading-none mt-0.5">
                Workspace
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <nav className={cn("flex flex-col gap-0.5 px-2")}>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isCollapsed={isCollapsed}
              isActive={
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </nav>

        {/* Section divider */}
        <div className="my-3 mx-3 h-px bg-[--border]" />

        <nav className="flex flex-col gap-0.5 px-2">
          {BOTTOM_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isCollapsed={isCollapsed}
              isActive={pathname.startsWith(item.href)}
            />
          ))}
        </nav>
      </div>


      {/* ── Collapse toggle ── */}
      {/*
        Positioned at the right edge of the sidebar.
        Half of the button (12px) overhangs — clipped by parent overflow:hidden
        on the sidebar itself, so we use a portal-like approach: absolute with z-50
        and overflow:visible on the button's container.
      */}
      <div className="absolute right-0 top-[calc(var(--topnav-height)+16px)] translate-x-1/2 z-50">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              id="sidebar-collapse-toggle"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
              className={cn(
                "h-6 w-6 rounded-full",
                "border border-[--border-strong] bg-[--surface]",
                "flex items-center justify-center",
                "text-[--foreground-subtle] hover:text-[--foreground] hover:bg-[--surface-elevated]",
                "shadow-sm transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent]"
              )}
            >
              <motion.span
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              >
                <ChevronLeft size={12} strokeWidth={2.5} />
              </motion.span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="text-xs">
            {isCollapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
