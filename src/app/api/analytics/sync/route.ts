/**
 * GET  /api/analytics/sync  — Returns the 28-day aggregated summary from SQLite
 * POST /api/analytics/sync  — Upserts a daily metrics row into SQLite
 *
 * Migrated from Oracle PL/SQL → better-sqlite3 (upsertChannelMetrics / query helpers).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query, queryOne, upsertChannelMetrics } from "@/lib/db";

// ── GET — 28-day summary ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const channelId = url.searchParams.get("channelId");

    if (!channelId) {
      return NextResponse.json(
        { error: "Missing required query parameter: channelId" },
        { status: 400 }
      );
    }

    // Equivalent of the Oracle get_28_day_summary procedure
    const summary = queryOne<{
      total_views:                 number;
      total_watch_time_hours:      number;
      net_subscribers:             number;
      total_revenue:               number;
      global_avg_view_duration:    number;
      start_date:                  string;
      end_date:                    string;
      days_with_data:              number;
    }>(
      `SELECT
         SUM(views)                                              AS total_views,
         SUM(watch_time_hours)                                   AS total_watch_time_hours,
         SUM(subscribers_gained) - SUM(subscribers_lost)        AS net_subscribers,
         SUM(estimated_revenue)                                  AS total_revenue,
         CASE
           WHEN SUM(views) > 0
           THEN ROUND(SUM(average_view_duration * views) * 1.0 / SUM(views), 2)
           ELSE 0
         END                                                     AS global_avg_view_duration,
         MIN(metric_date)                                        AS start_date,
         MAX(metric_date)                                        AS end_date,
         COUNT(*)                                                AS days_with_data
       FROM channel_metrics
       WHERE channel_id  = ?
         AND metric_date >= date('now', '-28 days')`,
      [channelId]
    );

    // Daily breakdown for sparklines / charts
    const daily = query<{
      metric_date:          string;
      views:                number;
      watch_time_hours:     number;
      subscribers_gained:   number;
      subscribers_lost:     number;
      estimated_revenue:    number;
      average_view_duration: number;
    }>(
      `SELECT
         metric_date, views, watch_time_hours,
         subscribers_gained, subscribers_lost,
         estimated_revenue, average_view_duration
       FROM channel_metrics
       WHERE channel_id  = ?
         AND metric_date >= date('now', '-28 days')
       ORDER BY metric_date ASC`,
      [channelId]
    );

    return NextResponse.json({
      success: true,
      channelId,
      summary: summary ?? { message: "No data found for the last 28 days." },
      daily,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[analytics/sync] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST — upsert a single day's metrics ──────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, metrics } = body as {
      channelId?: string;
      metrics?: {
        date:                  string;  // YYYY-MM-DD
        views:                 number;
        watch_time_hours:      number;
        subscribers_gained:    number;
        subscribers_lost:      number;
        estimated_revenue?:    number;
        average_view_duration?: number;
      };
    };

    if (!channelId || !metrics?.date) {
      return NextResponse.json(
        { error: "Missing required fields: channelId and metrics.date" },
        { status: 400 }
      );
    }

    const result = upsertChannelMetrics({
      channelId,
      metricDate:           metrics.date,
      views:                metrics.views               ?? 0,
      watchTimeHours:       metrics.watch_time_hours    ?? 0,
      subscribersGained:    metrics.subscribers_gained  ?? 0,
      subscribersLost:      metrics.subscribers_lost    ?? 0,
      estimatedRevenue:     metrics.estimated_revenue   ?? 0,
      averageViewDuration:  metrics.average_view_duration ?? 0,
    });

    return NextResponse.json({
      success:    true,
      rowId:      Number(result.lastInsertRowid),
      changes:    result.changes,
      channelId,
      metricDate: metrics.date,
      message:    `Metrics for ${metrics.date} synced successfully.`,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[analytics/sync] POST error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
