import { NextResponse } from "next/server";
import { pingDatabase, query, getDb, initSchema } from "@/lib/db";

/**
 * GET /api/db-test
 *
 * Verifies the Turso (libSQL) database pipeline end-to-end:
 *   1. Validates env vars and opens the client
 *   2. Executes `SELECT sqlite_version() AS version`
 *   3. Returns version, table inventory, row counts, and latency
 *
 * ✅ 200 — connected, returns { connected, version, tables, latencyMs }
 * ❌ 500 — client failed, returns { connected: false, error }
 */
export async function GET() {
  const start = Date.now();

  try {
    // 1. Ensure schema exists and ping the DB
    await initSchema();
    const versionRow = await pingDatabase();

    if (!versionRow) {
      return NextResponse.json(
        { connected: false, error: "Database failed to respond to ping.", hint: "Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env.local" },
        { status: 500 }
      );
    }

    // 2. Inventory all tables
    const tableList = await query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    );

    // 3. Row counts for each table
    const rowCounts: Record<string, number> = {};
    for (const { name } of tableList) {
      const r = await query<{ n: number }>(`SELECT COUNT(*) AS n FROM "${name}"`);
      rowCounts[name] = r[0]?.n ?? 0;
    }

    const latencyMs = Date.now() - start;

    return NextResponse.json({
      connected: true,
      query: "SELECT sqlite_version() AS version",
      sqliteVersion: versionRow.version,
      database: process.env.TURSO_DATABASE_URL?.replace(/\/\/.*@/, "//[credentials]@") ?? "unknown",
      tableCount: tableList.length,
      tables: tableList.map((t) => t.name),
      rowCounts,
      latencyMs,
      message: "Turso (libSQL) is connected and schema is initialised ✓",
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const latencyMs = Date.now() - start;

    console.error("[db-test] Turso error:", message);

    return NextResponse.json(
      {
        connected: false,
        error: message,
        latencyMs,
        hint: "Ensure TURSO_DATABASE_URL starts with libsql:// and TURSO_AUTH_TOKEN is set in .env.local",
      },
      { status: 500 }
    );
  }
}
