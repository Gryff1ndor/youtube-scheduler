/**
 * Turso (libSQL) Database Utility
 *
 * Cloud-hosted SQLite via Turso. Uses @libsql/client over HTTPS/WebSockets.
 *
 * Architecture:
 *  - Singleton `createClient()` instance — created once per process
 *  - All queries are async (use `await db.execute()`)
 *  - `query<T>()` — typed SELECT helper, returns T[]
 *  - `run()`      — INSERT / UPDATE / DELETE helper
 *  - `withTransaction()` — atomic batch via db.batch()
 *  - Schema is initialised on first call to `getDb()`
 *
 * Environment variables required in .env.local:
 *   TURSO_DATABASE_URL   — e.g. libsql://your-db.turso.io
 *   TURSO_AUTH_TOKEN     — from `turso db tokens create <db-name>`
 */

import { createClient, type Client, type InValue } from "@libsql/client";

// ── Singleton ─────────────────────────────────────────────────────────────────

let _db: Client | null = null;

/**
 * Returns (or creates) the process-scoped Turso client.
 * Throws a clear, actionable error if env vars are missing or malformed.
 */
export function getDb(): Client {
  if (_db) return _db;

  // ── Validate environment variables ────────────────────────────────────────
  const rawUrl   = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  console.log("[db] TURSO_DATABASE_URL:", rawUrl ?? "(undefined)");
  console.log("[db] TURSO_AUTH_TOKEN  :", authToken ? "(set)" : "(undefined)");

  if (!rawUrl || rawUrl.trim() === "") {
    throw new Error(
      "[db] TURSO_DATABASE_URL is not set. " +
      "Add it to .env.local → TURSO_DATABASE_URL=libsql://your-db.turso.io"
    );
  }

  if (!authToken || authToken.trim() === "") {
    throw new Error(
      "[db] TURSO_AUTH_TOKEN is not set. " +
      "Add it to .env.local → TURSO_AUTH_TOKEN=your_token_from_turso"
    );
  }

  // Strip trailing slashes and surrounding quotes that can sneak in via copy-paste
  const url = rawUrl.trim().replace(/\/+$/, "").replace(/^["']|["']$/g, "");

  // Basic sanity-check on the URL scheme
  if (!url.startsWith("libsql://") && !url.startsWith("https://") && !url.startsWith("http://")) {
    throw new Error(
      `[db] TURSO_DATABASE_URL has an invalid scheme: "${url}". ` +
      "Expected it to start with libsql://, https://, or http://"
    );
  }

  _db = createClient({ url, authToken: authToken.trim() });

  console.info(`[db] Turso client created → ${url}`);
  return _db;
}

// ── Schema initialisation ─────────────────────────────────────────────────────

let _schemaInitialised = false;

/**
 * Creates all tables if they don't exist. Called lazily before the first query.
 * libSQL does not support multi-statement strings in execute(), so we run each
 * DDL statement individually inside a batch for atomicity.
 */
export async function initSchema(): Promise<void> {
  if (_schemaInitialised) return;
  const db = getDb();

  await db.batch([
    // ── Users ────────────────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS users (
       id                 TEXT    PRIMARY KEY,
       name               TEXT,
       email              TEXT    UNIQUE NOT NULL,
       image              TEXT,
       youtube_channel_id TEXT,
       created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
       updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
     )`,

    // ── Channel Metrics ──────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS channel_metrics (
       id                     INTEGER PRIMARY KEY AUTOINCREMENT,
       channel_id             TEXT    NOT NULL,
       metric_date            TEXT    NOT NULL,
       views                  INTEGER NOT NULL DEFAULT 0,
       watch_time_hours       REAL    NOT NULL DEFAULT 0,
       subscribers_gained     INTEGER NOT NULL DEFAULT 0,
       subscribers_lost       INTEGER NOT NULL DEFAULT 0,
       estimated_revenue      REAL    NOT NULL DEFAULT 0,
       average_view_duration  INTEGER NOT NULL DEFAULT 0,
       created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
       UNIQUE (channel_id, metric_date)
     )`,

    `CREATE INDEX IF NOT EXISTS idx_channel_metrics_date
       ON channel_metrics (channel_id, metric_date)`,

    // ── Scheduled Uploads ────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS scheduled_uploads (
       id                  INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id             TEXT    NOT NULL,
       video_title         TEXT    NOT NULL,
       video_description   TEXT,
       tags                TEXT,
       privacy_status      TEXT    NOT NULL DEFAULT 'private',
       scheduled_time      TEXT    NOT NULL,
       youtube_video_id    TEXT,
       upload_status       TEXT    NOT NULL DEFAULT 'pending',
       created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
     )`,

    `CREATE INDEX IF NOT EXISTS idx_scheduled_uploads_user
       ON scheduled_uploads (user_id, scheduled_time)`,

    // ── Community Comments ───────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS community_comments (
       id                       TEXT PRIMARY KEY,
       channel_id               TEXT,
       video_id                 TEXT,
       author_name              TEXT,
       author_profile_image_url TEXT,
       text_display             TEXT,
       published_at             TEXT,
       like_count               INTEGER DEFAULT 0,
       replied                  INTEGER DEFAULT 0 NOT NULL,
       reply_text               TEXT,
       is_owner                 INTEGER DEFAULT 0 NOT NULL,
       created_at               TEXT NOT NULL DEFAULT (datetime('now'))
     )`,

    // ── Notifications ────────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS notifications (
       id          INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id     TEXT,
       title       TEXT NOT NULL,
       description TEXT,
       read        INTEGER DEFAULT 0 NOT NULL,
       created_at  TEXT NOT NULL DEFAULT (datetime('now'))
     )`,

    // ── Analytics Snapshots ──────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS analytics_snapshots (
       id              INTEGER PRIMARY KEY AUTOINCREMENT,
       channel_id      TEXT    NOT NULL,
       snapshot_date   TEXT    NOT NULL DEFAULT (date('now')),
       payload         TEXT    NOT NULL,
       virality_score  INTEGER,
       created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
       UNIQUE (channel_id, snapshot_date)
     )`,

    // ── AI Logs ──────────────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS ai_logs (
       id            INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id       TEXT,
       action        TEXT    NOT NULL,
       model         TEXT    NOT NULL DEFAULT 'gemini-1.5-flash',
       input_summary TEXT,
       output        TEXT,
       latency_ms    INTEGER,
       success       INTEGER NOT NULL DEFAULT 1,
       error_message TEXT,
       created_at    TEXT NOT NULL DEFAULT (datetime('now'))
     )`,

    `CREATE INDEX IF NOT EXISTS idx_ai_logs_user
       ON ai_logs (user_id, created_at)`,

    `CREATE INDEX IF NOT EXISTS idx_ai_logs_action
       ON ai_logs (action, created_at)`,
  ], "write");

  _schemaInitialised = true;
  console.info("[db] Schema verified — all tables ready.");

  // ── Database Migration: Add reply_text column if it does not exist ─────────
  try {
    const db = getDb();
    await db.execute("ALTER TABLE community_comments ADD COLUMN reply_text TEXT");
    console.info("[db] Migration: added reply_text column to community_comments table.");
  } catch (err: any) {
    // Safe to ignore if column already exists (SQLite error: duplicate column name)
  }

  // ── Database Migration: Add is_owner column if it does not exist ───────────
  try {
    const db = getDb();
    await db.execute("ALTER TABLE community_comments ADD COLUMN is_owner INTEGER DEFAULT 0 NOT NULL");
    console.info("[db] Migration: added is_owner column to community_comments table.");
  } catch (err: any) {
    // Safe to ignore if column already exists
  }
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/**
 * Execute a SELECT and return all matching rows as typed objects.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: InValue[] = []
): Promise<T[]> {
  await initSchema();
  const result = await getDb().execute({ sql, args: params });
  return result.rows as unknown as T[];
}

/**
 * Execute a SELECT and return the first row, or undefined.
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: InValue[] = []
): Promise<T | undefined> {
  const rows = await query<T>(sql, params);
  return rows[0];
}

/**
 * Execute an INSERT / UPDATE / DELETE statement.
 * Returns the libSQL ResultSet (includes rowsAffected, lastInsertRowid).
 */
export async function run(
  sql: string,
  params: InValue[] = []
) {
  await initSchema();
  return getDb().execute({ sql, args: params });
}

/**
 * Wrap multiple write statements in a single atomic batch.
 */
export async function withTransaction(
  statements: Array<{ sql: string; args?: InValue[] }>
): Promise<void> {
  await initSchema();
  await getDb().batch(
    statements.map((s) => ({ sql: s.sql, args: s.args ?? [] })),
    "write"
  );
}

// ── Domain helpers ────────────────────────────────────────────────────────────

/**
 * Upsert a daily metrics row for a channel.
 */
export async function upsertChannelMetrics(params: {
  channelId: string;
  metricDate: string;
  views: number;
  watchTimeHours: number;
  subscribersGained: number;
  subscribersLost: number;
  estimatedRevenue: number;
  averageViewDuration: number;
}) {
  return run(
    `INSERT INTO channel_metrics
       (channel_id, metric_date, views, watch_time_hours,
        subscribers_gained, subscribers_lost, estimated_revenue, average_view_duration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(channel_id, metric_date) DO UPDATE SET
       views                 = excluded.views,
       watch_time_hours      = excluded.watch_time_hours,
       subscribers_gained    = excluded.subscribers_gained,
       subscribers_lost      = excluded.subscribers_lost,
       estimated_revenue     = excluded.estimated_revenue,
       average_view_duration = excluded.average_view_duration`,
    [
      params.channelId,
      params.metricDate,
      params.views,
      params.watchTimeHours,
      params.subscribersGained,
      params.subscribersLost,
      params.estimatedRevenue,
      params.averageViewDuration,
    ]
  );
}

/**
 * Upsert a community comment from YouTube sync.
 * Preserves the replied status if it's already true locally, or sets it based on totalReplyCount.
 */
export async function upsertCommunityComment(params: {
  id: string;
  channelId: string;
  videoId: string;
  authorName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  publishedAt: string;
  likeCount: number;
  replied: boolean;
  replyText?: string;
  isOwner?: boolean;
}) {
  return run(
    `INSERT INTO community_comments
       (id, channel_id, video_id, author_name, author_profile_image_url, text_display, published_at, like_count, replied, reply_text, is_owner)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       author_name = excluded.author_name,
       author_profile_image_url = excluded.author_profile_image_url,
       text_display = excluded.text_display,
       published_at = excluded.published_at,
       like_count = excluded.like_count,
       replied = CASE WHEN community_comments.replied = 1 THEN 1 ELSE excluded.replied END,
       reply_text = CASE WHEN (excluded.reply_text IS NOT NULL AND excluded.reply_text != '') THEN excluded.reply_text ELSE community_comments.reply_text END,
       is_owner = excluded.is_owner`,
    [
      params.id,
      params.channelId,
      params.videoId,
      params.authorName,
      params.authorProfileImageUrl,
      params.textDisplay,
      params.publishedAt,
      params.likeCount,
      params.replied ? 1 : 0,
      params.replyText ?? null,
      params.isOwner ? 1 : 0,
    ]
  );
}

/**
 * Mark a comment as replied internally with reply text.
 */
export async function markCommentReplied(commentId: string, replyText: string) {
  return run(
    `UPDATE community_comments SET replied = 1, reply_text = ? WHERE id = ?`,
    [replyText, commentId]
  );
}

/**
 * Log a Gemini AI action to the audit trail.
 */
export async function logAiAction(params: {
  userId?: string;
  action: string;
  model?: string;
  inputSummary?: string;
  output?: string;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
}) {
  return run(
    `INSERT INTO ai_logs
       (user_id, action, model, input_summary, output, latency_ms, success, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.userId ?? null,
      params.action,
      params.model ?? "gemini-1.5-flash",
      params.inputSummary?.slice(0, 500) ?? null,
      params.output?.slice(0, 2000) ?? null,
      params.latencyMs ?? null,
      params.success !== false ? 1 : 0,
      params.errorMessage ?? null,
    ]
  );
}
/**
 * Notification types
 */
export interface DbNotification {
  id: number;
  user_id: string | null;
  title: string;
  description: string | null;
  read: number;
  created_at: string;
}

/**
 * Fetch all notifications for a user, sorted by created_at descending.
 */
export async function getNotifications(userId: string): Promise<DbNotification[]> {
  return query<DbNotification>(
    `SELECT id, user_id, title, description, read, created_at
     FROM notifications
     WHERE user_id = ? OR user_id IS NULL
     ORDER BY created_at DESC`,
    [userId]
  );
}

/**
 * Fetch unread notifications count for a user.
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND read = 0`,
    [userId]
  );
  return row?.count ?? 0;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markNotificationsAsRead(userId: string): Promise<void> {
  await run(
    `UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL`,
    [userId]
  );
}

/**
 * Insert a notification.
 */
export async function insertNotification(params: {
  userId?: string;
  title: string;
  description?: string;
  createdAt?: string;
}) {
  return run(
    `INSERT INTO notifications (user_id, title, description, created_at)
     VALUES (?, ?, ?, COALESCE(?, datetime('now')))`,
    [params.userId ?? null, params.title, params.description ?? null, params.createdAt ?? null]
  );
}

/**
 * Count unreplied comments in the community feed.
 */
export async function getPendingCommentsCount(channelId?: string): Promise<number> {
  if (channelId) {
    const row = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM community_comments WHERE channel_id = ? AND replied = 0 AND is_owner = 0`,
      [channelId]
    );
    return row?.count ?? 0;
  } else {
    const row = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM community_comments WHERE replied = 0 AND is_owner = 0`
    );
    return row?.count ?? 0;
  }
}

/**
 * Quick health-check: queries the SQLite version via Turso.
 */
export async function pingDatabase(): Promise<{ version: string } | null> {
  try {
    await initSchema();
    const row = await queryOne<{ version: string }>("SELECT sqlite_version() AS version");
    return row ?? null;
  } catch {
    return null;
  }
}
