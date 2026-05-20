import { cn } from "@/lib/utils";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8 animate-pulse">
      
      {/* ── Header Skeleton ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-surface-elevated" />
          <div className="h-4 w-72 rounded-md bg-surface-elevated" />
        </div>

        {/* Prediction model skeleton */}
        <div className="flex items-center gap-6 rounded-2xl border border-border bg-surface p-4 w-60">
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-20 rounded bg-surface-elevated" />
            <div className="h-4 w-28 rounded bg-surface-elevated" />
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="h-[70px] w-[70px] rounded-full bg-surface-elevated" />
        </div>
      </div>

      {/* ── KPI Cards Skeletons ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5">
            <div className="h-10 w-10 rounded-lg bg-surface-elevated" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 rounded bg-surface-elevated" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-24 rounded bg-surface-elevated" />
                <div className="h-4 w-10 rounded-full bg-surface-elevated" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart Skeleton ── */}
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
        <div className="space-y-2 mb-6">
          <div className="h-4 w-24 rounded bg-surface-elevated" />
          <div className="h-3 w-48 rounded bg-surface-elevated" />
        </div>
        <div className="h-72 w-full rounded-lg bg-surface-elevated" />
      </div>

      {/* ── Bottom Grid Skeletons (5 Items) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div className="h-4 w-32 rounded bg-surface-elevated" />
            <div className="h-44 w-full rounded-lg bg-surface-elevated" />
          </div>
        ))}
      </div>

    </div>
  );
}
