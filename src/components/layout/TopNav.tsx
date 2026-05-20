"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

/* ── Page title mapping ── */
const PAGE_TITLES: Record<string, { title: string; crumbs: string[] }> = {
  "/":               { title: "Dashboard",     crumbs: ["Home", "Dashboard"] },
  "/analytics":      { title: "Analytics",     crumbs: ["Home", "Analytics"] },
  "/reports":        { title: "Reports",       crumbs: ["Home", "Reports"] },
  "/notifications":  { title: "Notifications", crumbs: ["Home", "Notifications"] },
  "/integrations":   { title: "Integrations",  crumbs: ["Home", "Integrations"] },
  "/settings":       { title: "Settings",      crumbs: ["Home", "Settings"] },
};

export function TopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const pageInfo = PAGE_TITLES[pathname] ?? {
    title: "Page",
    crumbs: ["Home", "Page"],
  };

  /* Detect scroll for blur effect */
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main) return;
    const handler = () => setScrolled(main.scrollTop > 8);
    main.addEventListener("scroll", handler, { passive: true });
    return () => main.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      id="top-nav"
      className={cn(
        "flex h-[var(--topnav-height)] items-center justify-between",
        "border-b px-4 sm:px-6 transition-all duration-300",
        scrolled
          ? "border-border-strong glass"
          : "border-transparent bg-background"
      )}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 min-w-0">
          {pageInfo.crumbs.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <span className="text-foreground-subtle text-xs select-none">/</span>
              )}
              <span
                className={cn(
                  "text-sm truncate",
                  i === pageInfo.crumbs.length - 1
                    ? "font-semibold text-foreground"
                    : "text-foreground-muted"
                )}
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>

        {/* Mobile: just show page title */}
        <h1 className="sm:hidden text-sm font-semibold text-foreground truncate">
          {pageInfo.title}
        </h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2">
          {/* Desktop/Tablet Search Bar */}
          <button
            id="search-toggle"
            aria-label="Search"
            onClick={() => setShowSearch(true)}
            className={cn(
              "relative hidden sm:flex items-center w-56 lg:w-64 h-9 pl-3 pr-1.5 rounded-xl text-sm",
              "text-foreground-subtle hover:text-foreground text-left",
              "backdrop-blur-xl saturate-[1.5]",
              "bg-white/30 border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),_0_2px_8px_rgba(0,0,0,0.05)] hover:bg-white/40",
              "dark:bg-[#1c1c1e]/40 dark:border-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_2px_8px_rgba(0,0,0,0.3)] dark:hover:bg-[#1c1c1e]/60",
              "transition-all duration-300 focus:outline-none"
            )}
          >
            <Search size={14} className="mr-2 shrink-0" />
            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs">Search pages, reports...</span>
            <kbd className="hidden lg:inline-flex items-center justify-center rounded-md bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-foreground-muted font-mono tracking-widest border border-black/10 dark:border-white/10 shadow-sm ml-2">
              ⌘K
            </kbd>
          </button>
          
          {/* Mobile Search Icon */}
          <button
            id="search-toggle-mobile"
            aria-label="Search"
            onClick={() => setShowSearch(true)}
            className={cn(
              "relative sm:hidden h-9 w-9 rounded-xl flex items-center justify-center",
              "text-foreground",
              "backdrop-blur-xl saturate-[1.5]",
              "bg-white/30 border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),_0_2px_8px_rgba(0,0,0,0.05)] hover:bg-white/40",
              "dark:bg-[#1c1c1e]/40 dark:border-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_2px_8px_rgba(0,0,0,0.3)] dark:hover:bg-[#1c1c1e]/60",
              "transition-all duration-300 focus:outline-none"
            )}
          >
            <Search size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notifications-btn"
            aria-label="Notifications (3 unread)"
            onClick={() => setShowNotifications((p) => !p)}
            className={cn(
              "relative h-9 w-9 rounded-xl flex items-center justify-center",
              "text-foreground",
              "backdrop-blur-xl saturate-[1.5]",
              "bg-white/30 border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),_0_2px_8px_rgba(0,0,0,0.05)] hover:bg-white/40",
              "dark:bg-[#1c1c1e]/40 dark:border-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_2px_8px_rgba(0,0,0,0.3)] dark:hover:bg-[#1c1c1e]/60",
              "transition-all duration-300 focus:outline-none"
            )}
          >
            <Bell size={16} strokeWidth={1.75} />
            {!notificationsRead && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-1 ring-background" />}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-border-strong bg-surface-elevated shadow-lg glass p-2 z-40"
                >
                  <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">Notifications</p>
                    {!notificationsRead && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotificationsRead(true);
                        }}
                        className="text-[10px] text-[hsl(220_90%_56%)] font-medium cursor-pointer hover:underline focus:outline-none"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="py-2 flex flex-col gap-1 max-h-64 overflow-y-auto">
                    <div className={cn("px-3 py-2 hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer flex gap-3", !notificationsRead && "bg-white/[0.02]")}>
                      {!notificationsRead && <div className="mt-1 h-2 w-2 bg-accent rounded-full shrink-0" />}
                      <div>
                        <p className={cn("text-xs", !notificationsRead ? "text-foreground font-medium" : "text-foreground/80")}>New subscriber milestone reached!</p>
                        <p className="text-[10px] text-foreground-subtle mt-0.5">2 hours ago</p>
                      </div>
                    </div>
                    <div className={cn("px-3 py-2 hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer flex gap-3", !notificationsRead && "bg-white/[0.02]")}>
                      {!notificationsRead && <div className="mt-1 h-2 w-2 bg-accent rounded-full shrink-0" />}
                      <div>
                        <p className={cn("text-xs", !notificationsRead ? "text-foreground font-medium" : "text-foreground/80")}>Your latest video is gaining traction.</p>
                        <p className="text-[10px] text-foreground-subtle mt-0.5">5 hours ago</p>
                      </div>
                    </div>
                    <div className={cn("px-3 py-2 hover:bg-foreground/5 rounded-lg transition-colors cursor-pointer flex gap-3", !notificationsRead && "bg-white/[0.02]")}>
                      {!notificationsRead && <div className="mt-1 h-2 w-2 bg-accent rounded-full shrink-0" />}
                      <div>
                        <p className={cn("text-xs", !notificationsRead ? "text-foreground font-medium" : "text-foreground/80")}>Weekly analytics report is ready.</p>
                        <p className="text-[10px] text-foreground-subtle mt-0.5">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Separator */}
        <div className="mx-1 h-4 w-px bg-border" />

        {/* User avatar and dropdown container */}
        <div className="relative">
          <button
            id="user-menu-btn"
            aria-label="User menu"
            onClick={() => setShowUserMenu((p) => !p)}
            className={cn(
              "relative h-9 w-9 rounded-full flex items-center justify-center overflow-hidden",
              "text-foreground",
              "backdrop-blur-xl saturate-[1.5]",
              "bg-white/30 border border-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),_0_2px_8px_rgba(0,0,0,0.05)] hover:bg-white/40",
              "dark:bg-[#1c1c1e]/40 dark:border-white/10 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_2px_8px_rgba(0,0,0,0.3)] dark:hover:bg-[#1c1c1e]/60",
              "transition-all duration-300 focus:outline-none"
            )}
          >
            <Avatar className="h-full w-full">
              <AvatarImage 
                src={session?.user?.image || ""} 
                alt={session?.user?.name || "User avatar"} 
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="text-[10px] font-semibold bg-accent/15 text-accent uppercase">
                {session?.user?.name 
                  ? session.user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* User menu dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <>
                {/* Click outside backdrop to close */}
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-border-strong bg-surface-elevated shadow-lg glass p-2 z-40 space-y-1.5"
                >
                  <div className="px-3 py-2 border-b border-border/60">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {session?.user?.name || "Authenticated User"}
                    </p>
                    <p className="text-[10px] text-foreground-subtle truncate mt-0.5">
                      {session?.user?.email || "user@youtube.channels"}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search Modal (Command Palette Style) */}
      <AnimatePresence>
        {showSearch && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowSearch(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, scale: 0.95, y: -20, x: "-50%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed top-[15%] left-1/2 w-[90%] max-w-2xl z-50",
                "rounded-2xl border border-white/20 shadow-[0_16px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden",
                "bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-3xl saturate-150"
              )}
            >
              <div className="relative flex items-center px-5 py-4 border-b border-black/5 dark:border-white/10">
                <Search size={22} className="text-foreground-muted shrink-0" strokeWidth={1.5} />
                <input
                  id="search-input"
                  autoFocus
                  type="text"
                  placeholder="Search pages, reports, settings…"
                  className={cn(
                    "w-full bg-transparent border-none text-foreground text-lg ml-3",
                    "placeholder:text-foreground-subtle focus:outline-none focus:ring-0"
                  )}
                  onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
                />
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <kbd className="hidden sm:inline-flex items-center justify-center rounded-md bg-black/5 dark:bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-foreground-muted font-mono tracking-widest border border-black/10 dark:border-white/10 shadow-sm">
                    ESC
                  </kbd>
                </div>
              </div>
              <div className="px-5 py-12 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Search size={20} className="text-foreground-subtle" />
                </div>
                <p className="text-sm font-medium text-foreground">No recent searches</p>
                <p className="text-xs text-foreground-muted mt-1">Try searching for "audience" or "reports"</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
