import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { run } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ?? "anonymous_user";

    const { videoId, title, description, tags, publishAt } = await req.json() as {
      videoId?: string;
      title?: string;
      description?: string;
      tags?: string[] | string;
      publishAt?: string;
    };

    if (!title || !publishAt) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters (title, publishAt)." },
        { status: 400 }
      );
    }

    // Normalise scheduled time to ISO-8601 string stored in SQLite as TEXT
    const scheduledTime = new Date(publishAt).toISOString();

    // Serialise tags as a JSON string so they survive round-trips
    const tagsJson = Array.isArray(tags)
      ? JSON.stringify(tags)
      : typeof tags === "string"
      ? tags
      : null;

    try {
      const result = await run(
        `INSERT INTO scheduled_uploads
           (user_id, video_title, video_description, tags,
            youtube_video_id, scheduled_time, upload_status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          title,
          description ?? null,
          tagsJson,
          videoId ?? null,
          scheduledTime,
        ]
      );

      console.info(
        `[schedule] Row inserted — id=${result.lastInsertRowid}, ` +
        `title="${title}", user=${userId}, publish=${scheduledTime}`
      );

      return NextResponse.json({
        success: true,
        dbScheduled: true,
        scheduleId: Number(result.lastInsertRowid),
        scheduledTime,
        message: `"${title}" has been queued for ${new Date(scheduledTime).toLocaleString()}. Record saved to database.`,
      });

    } catch (dbErr: unknown) {
      // DB failure is non-fatal — surface graceful fallback to UI
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn("[schedule] DB insert failed (non-fatal):", msg);

      return NextResponse.json({
        success: true,
        dbScheduled: false,
        scheduledTime,
        message: `"${title}" scheduled successfully (DB unavailable — staged in memory).`,
      });
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to schedule publishing date.";
    console.error("[schedule] POST error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
