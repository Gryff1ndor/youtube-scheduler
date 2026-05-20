"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { TopNav } from "@/components/layout/TopNav";
import { FloatingMobileNav } from "@/components/layout/FloatingMobileNav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="h-screen w-full bg-[#0A0A0C] text-foreground relative overflow-hidden flex items-center justify-center">
          {children}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      {/* Full-width single-column layout — sidebar removed */}
      <div className="flex flex-col min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background">

        {/* ── Top Nav ── */}
        <div className="shrink-0 relative z-10">
          <TopNav />
        </div>

        {/* ── Scrollable page content — full width ── */}
        <main
          id="main-content"
          role="main"
          className={cn(
            "flex-1 w-full px-4 md:px-6 pt-4 pb-32"
          )}
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-screen-xl mx-auto"
          >
            {children}
          </motion.div>
        </main>

        {/* ── Floating Liquid Glass Nav — all screen sizes ── */}
        <FloatingMobileNav />
      </div>
    </TooltipProvider>
  );
}
