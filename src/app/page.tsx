"use client";

import { useEffect, useState } from "react";
import { AreaChart, BarChart, BarList, DonutChart } from "@tremor/react";
import { motion, AnimatePresence } from "framer-motion";
import { ViralityScore } from "@/components/ui/ViralityScore";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Clock, Users, Zap, Eye,
  PlayCircle, ArrowUpRight, ArrowDownRight, Minus,
  Globe, BarChart2,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
function fmtFull(n: number) {
  return Intl.NumberFormat("en-US").format(n);
}

// ── Delta Badge ────────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const isUp   = delta > 0;
  const isFlat = delta === 0;
  const Icon   = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const color  = isFlat
    ? "text-foreground-muted bg-foreground/5"
    : isUp
    ? "text-emerald-400 bg-emerald-400/10"
    : "text-red-400 bg-red-400/10";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", color)}>
      <Icon size={9} strokeWidth={2.5} />
      {isFlat ? "—" : `${Math.abs(delta)}%`}
    </span>
  );
}

// ── Custom Tooltips ────────────────────────────────────────────────────────────

const areaTooltip = (props: any) => {
  const { payload, active, label } = props;
  if (!active || !payload?.length) return null;
  const names: Record<string, string> = {
    views: "Views", watchHours: "Watch Hrs", netSubscribers: "Subscribers",
  };
  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5 shadow-lg space-y-1.5 text-xs">
      <p className="font-medium text-foreground-muted">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.stroke }} />
            <span className="text-foreground-muted">{names[p.name] ?? p.name}</span>
          </div>
          <span className="font-semibold text-foreground">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const barTooltip = (props: any) => {
  const { payload, active, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-foreground-muted mb-1">{label}</p>
      <p className="font-semibold text-foreground">{fmtFull(payload[0]?.value ?? 0)} views</p>
    </div>
  );
};

// ── Top Content Leaderboard ────────────────────────────────────────────────────

function TopContentLeaderboard({ items }: { items: any[] }) {
  if (!items || items.length === 0)
    return <div className="flex items-center justify-center h-32 text-xs text-foreground-muted">No content data available.</div>;
  return (
    <div className="divide-y divide-border">
      {items.map((v: any, i: number) => (
        <motion.div
          key={v.videoId || i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex items-center gap-4 py-3.5"
        >
          <span className={cn(
            "w-5 text-center text-xs font-bold tabular-nums shrink-0",
            i === 0 ? "text-[hsl(220_90%_56%)]" : i === 1 ? "text-foreground-muted" : "text-foreground-subtle"
          )}>{i + 1}</span>
          <div className="relative h-9 w-16 rounded-md bg-surface-elevated shrink-0 flex items-center justify-center border border-border overflow-hidden">
            {v.videoId ? (
              <img 
                src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover" 
              />
            ) : (
              <PlayCircle size={14} className="text-foreground-subtle" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{v.title}</p>
            <p className="text-[10px] text-foreground-muted mt-0.5">avg {v.avgViewDuration}</p>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground tabular-nums">{fmtNum(v.views)}</p>
              <p className="text-[10px] text-foreground-muted">views</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-foreground tabular-nums">{fmtNum(v.watchHours)}h</p>
              <p className="text-[10px] text-foreground-muted">watch</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Donut with legend ──────────────────────────────────────────────────────────

const PALETTE = ["blue", "cyan", "indigo", "violet", "fuchsia", "slate"];
const HEX: Record<string, string> = {
  blue: "hsl(220 90% 56%)", cyan: "hsl(190 90% 50%)", indigo: "hsl(243 75% 59%)",
  violet: "hsl(262 83% 58%)", fuchsia: "hsl(292 84% 61%)", slate: "hsl(215 20% 45%)",
  emerald: "hsl(160 84% 39%)", rose: "hsl(347 77% 50%)",
};

function DonutWithLegend({
  data, colors = PALETTE, valueFormatter, title, description,
}: {
  data: { name: string; value: number }[];
  colors?: string[];
  valueFormatter?: (n: number) => string;
  title?: string;
  description?: string;
}) {
  const fmt = valueFormatter ?? ((n: number) => `${n}%`);
  return (
    <div className="flex flex-col gap-4">
      {(title || description) && (
        <div>
          {title     && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
          {description && <p className="text-xs text-foreground-muted mt-0.5">{description}</p>}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-44 h-44 shrink-0">
          <DonutChart
            data={data}
            category="value"
            index="name"
            valueFormatter={fmt}
            colors={colors}
            className="h-full w-full"
            showAnimation={true}
            showTooltip={true}
          />
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {data.map((item, i) => {
            const color = colors[i % colors.length];
            const hex   = HEX[color] ?? "hsl(220 90% 56%)";
            return (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                  <span className="text-xs text-foreground-muted truncate">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-foreground tabular-nums shrink-0">{fmt(item.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm", className)}>
      {children}
    </section>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData]           = useState<any>(null);
  const [activeChart, setActiveChart] = useState<"views" | "watchHours" | "netSubscribers">("views");

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  // ── Derived totals ────────────────────────────────────────────────────────
  const daily         = data?.dailyViews ?? [];
  const totalViews    = daily.reduce((s: number, r: any) => s + (r.views || 0), 0);
  const totalMinutes  = daily.reduce((s: number, r: any) => s + (r.estimatedMinutes || 0), 0);
  const totalWatchHrs = Math.round(totalMinutes / 60);
  const netSubs       = daily.reduce((s: number, r: any) => s + (r.netSubscribers || 0), 0);

  const viralityScore    = data?.viralityScore    ?? 0;
  const deltaViews       = data?.deltaViews       ?? 0;
  const deltaWatchHours  = data?.deltaWatchHours  ?? 0;
  const deltaSubscribers = data?.deltaSubscribers ?? 0;
  const realtimeTotal    = data?.realtimeTotal    ?? 0;
  const realtime48h      = data?.realtime48h      ?? [];
  const topContent       = data?.topContent       ?? [];
  const trafficSources   = data?.trafficSources   ?? [];
  const audienceRegion   = data?.audienceRegion   ?? [];
  const ageData          = data?.demographics?.age    ?? [];
  const genderData       = data?.demographics?.gender ?? [];

  let growthLabel = "Low Growth";
  if      (viralityScore > 70) growthLabel = "High Growth";
  else if (viralityScore > 40) growthLabel = "Moderate Growth";

  const CHART_TABS = [
    { key: "views"          as const, label: "Views"       },
    { key: "watchHours"     as const, label: "Watch Hours" },
    { key: "netSubscribers" as const, label: "Subscribers" },
  ];
  const CHART_COLOR: Record<string, string> = {
    views: "blue", watchHours: "violet", netSubscribers: "emerald",
  };

  const kpis = [
    { label: "Total Views",     value: fmtNum(totalViews),    delta: deltaViews,       icon: Eye,   color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10 dark:bg-blue-400/10" },
    { label: "Watch Time",      value: `${fmtNum(totalWatchHrs)}h`, delta: deltaWatchHours,  icon: Clock, color: "text-violet-400",           bg: "bg-violet-400/10"          },
    { label: "Net Subscribers", value: (netSubs >= 0 ? "+" : "") + fmtNum(netSubs), delta: deltaSubscribers, icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="flex flex-col gap-6 lg:gap-8"
      >

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Channel Analytics
            </h1>
            <p className="mt-1.5 text-sm text-foreground-muted">
              28-day live performance · previous period delta
            </p>
          </div>
          <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface px-5 py-3.5 shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-widest font-medium text-foreground-muted">Virality Model</span>
              <span className="text-sm font-semibold text-foreground">{growthLabel}</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <ViralityScore score={viralityScore} size={68} strokeWidth={6} />
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative flex items-center gap-4 rounded-xl border border-border bg-surface p-5 overflow-hidden group hover:border-border-strong transition-colors duration-200"
            >
              <div className={cn("absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500", kpi.bg)} />
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", kpi.bg)}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground-muted">{kpi.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                  <DeltaBadge delta={kpi.delta} />
                </div>
                <p className="text-[10px] text-foreground-subtle mt-0.5">vs previous 28d</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="w-full">

          {/* Tab triggers */}
          <TabsList className="mb-2 h-9 rounded-xl border border-border bg-surface px-1.5 gap-0.5 w-fit">
            {[
              { value: "overview", label: "Overview",  icon: BarChart2 },
              { value: "reach",    label: "Reach",     icon: TrendingUp },
              { value: "audience", label: "Audience",  icon: Globe },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 h-7 rounded-lg text-xs font-medium transition-all duration-200",
                  "text-foreground-muted hover:text-foreground",
                  "data-active:bg-accent/10 data-active:text-accent data-active:shadow-none"
                )}
              >
                <Icon size={12} strokeWidth={2} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="flex flex-col gap-5 lg:gap-6">

              {/* Tabbed area chart */}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">28-Day Trend</h2>
                    <p className="text-xs text-foreground-muted mt-0.5">Daily breakdown over the last 28 days.</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-surface-elevated border border-border p-1">
                    {CHART_TABS.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveChart(tab.key)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                          activeChart === tab.key
                            ? "bg-surface text-foreground shadow-sm border border-border"
                            : "text-foreground-muted hover:text-foreground"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64 w-full">
                  <AreaChart
                    className="h-full w-full"
                    data={daily}
                    index="date"
                    categories={[activeChart]}
                    colors={[CHART_COLOR[activeChart]]}
                    valueFormatter={(n: number) => fmtFull(n)}
                    showLegend={false}
                    showGridLines={false}
                    showAnimation={true}
                    curveType="monotone"
                    customTooltip={areaTooltip}
                    yAxisWidth={52}
                  />
                </div>
              </Card>

              {/* Realtime 48h + Top Content */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Realtime 48h */}
                <Card className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(220_90%_56%)] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(220_90%_56%)]" />
                        </span>
                        <h2 className="text-sm font-semibold text-foreground">Realtime (48h)</h2>
                      </div>
                      <p className="text-xs text-foreground-muted mt-0.5 ml-4">Hourly view velocity</p>
                    </div>
                    <Zap size={14} className="text-[hsl(220_90%_56%)] shrink-0" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold tracking-tight text-foreground">{fmtNum(realtimeTotal)}</p>
                    <p className="text-xs text-foreground-muted mt-1">views in last 48 hours</p>
                  </div>
                  <div className="h-32 w-full">
                    <BarChart
                      className="h-full w-full"
                      data={realtime48h}
                      index="hour"
                      categories={["views"]}
                      colors={["blue"]}
                      valueFormatter={(n: number) => fmtNum(n)}
                      showLegend={false}
                      showGridLines={false}
                      showAnimation={true}
                      showXAxis={false}
                      yAxisWidth={32}
                      customTooltip={barTooltip}
                    />
                  </div>
                </Card>

                {/* Top Content */}
                <Card className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Top Content</h2>
                      <p className="text-xs text-foreground-muted mt-0.5">Best performing videos · last 28 days</p>
                    </div>
                    <TrendingUp size={14} className="text-foreground-subtle shrink-0" />
                  </div>
                  <TopContentLeaderboard items={topContent} />
                </Card>
              </div>

            </div>
          </TabsContent>

          {/* ── REACH TAB ─────────────────────────────────────────────── */}
          <TabsContent value="reach">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col gap-5 lg:gap-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Traffic Sources donut */}
                <Card>
                  <DonutWithLegend
                    title="Traffic Sources"
                    description="Where viewers discover your content"
                    data={trafficSources}
                    colors={["blue", "cyan", "indigo", "violet", "fuchsia", "slate"]}
                    valueFormatter={(n: number) => `${n}%`}
                  />
                </Card>

                {/* Traffic sources bar breakdown */}
                <Card>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Source Breakdown</h3>
                  <p className="text-xs text-foreground-muted mb-5">Share of total views per traffic channel</p>
                  <BarList
                    data={trafficSources}
                    valueFormatter={(n: number) => `${n}%`}
                    color="blue"
                    showAnimation={true}
                    className="mt-1"
                  />
                </Card>
              </div>

              {/* Reach summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {trafficSources.slice(0, 4).map((src: any, i: number) => {
                  const colors = ["text-[hsl(220_90%_56%)]", "text-cyan-400", "text-indigo-400", "text-violet-400"];
                  const bgs    = ["bg-[hsl(220_90%_56%)]/10", "bg-cyan-400/10", "bg-indigo-400/10", "bg-violet-400/10"];
                  return (
                    <div key={src.name} className="rounded-xl border border-border bg-surface p-4">
                      <div className={cn("text-2xl font-bold tabular-nums", colors[i])}>{src.value}%</div>
                      <div className="text-xs text-foreground-muted mt-1 leading-snug">{src.name}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </TabsContent>

          {/* ── AUDIENCE TAB ──────────────────────────────────────────── */}
          <TabsContent value="audience">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col gap-5 lg:gap-6"
            >

              {/* Geography */}
              <Card>
                <div className="flex items-center gap-2 mb-5">
                  <Globe size={14} className="text-foreground-muted" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Top Geographies</h3>
                    <p className="text-xs text-foreground-muted mt-0.5">Share of views by country</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <BarList
                    data={audienceRegion}
                    valueFormatter={(n: number) => `${n}%`}
                    color="blue"
                    showAnimation={true}
                  />
                  <div className="h-52 w-full">
                    <DonutChart
                      data={audienceRegion}
                      category="value"
                      index="name"
                      valueFormatter={(n: number) => `${n}%`}
                      colors={["blue", "cyan", "indigo", "violet", "fuchsia", "slate"]}
                      className="h-full w-full"
                      showAnimation={true}
                    />
                  </div>
                </div>
              </Card>

              {/* Age + Gender side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Age distribution */}
                <Card>
                  <DonutWithLegend
                    title="Age Distribution"
                    description="Viewer age group breakdown"
                    data={ageData}
                    colors={["blue", "cyan", "indigo", "violet", "slate"]}
                    valueFormatter={(n: number) => `${n}%`}
                  />
                </Card>

                {/* Gender distribution */}
                <Card>
                  <DonutWithLegend
                    title="Gender Distribution"
                    description="Viewer gender breakdown"
                    data={genderData}
                    colors={["blue", "indigo", "slate"]}
                    valueFormatter={(n: number) => `${n}%`}
                  />
                </Card>
              </div>

            </motion.div>
          </TabsContent>

        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
