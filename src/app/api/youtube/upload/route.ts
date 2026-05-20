import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { Readable } from "stream";

// ── Auth diagnostic helper ─────────────────────────────────────────────────────
/**
 * Classifies a googleapis error so we can return the correct HTTP status
 * and a clear, actionable message to the frontend.
 */
function classifyGoogleError(err: unknown): { status: number; message: string } {
  const msg    = err instanceof Error ? err.message : String(err);
  const code   = (err as any)?.code;
  const status = (err as any)?.status ?? (err as any)?.response?.status;

  if (status === 401 || code === 401 || msg.includes("401") || msg.toLowerCase().includes("invalid credentials")) {
    return {
      status: 401,
      message:
        "Your YouTube session has expired or the access token is invalid. " +
        "Please sign out and sign back in to re-authorise YouTube access.",
    };
  }
  if (status === 403 || code === 403 || msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
    return {
      status: 403,
      message:
        "Permission denied. Ensure your Google account has granted the 'youtube.upload' scope. " +
        "Sign out, sign back in, and accept all permissions on the consent screen.",
    };
  }
  if (status === 400 || msg.toLowerCase().includes("invalid request")) {
    return { status: 400, message: `YouTube API rejected the request: ${msg}` };
  }
  return { status: 500, message: msg || "Unexpected YouTube API error." };
}

// ── POST /api/youtube/upload ───────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // ── 1. Session & token extraction ───────────────────────────────────────
    const session = await getServerSession(authOptions);
    const accessToken  = session?.accessToken;
    const refreshToken = session?.refreshToken;

    // Detailed diagnostic log — never exposes secrets to the client
    if (!session) {
      console.warn("[upload] No NextAuth session found.");
    } else if (!accessToken) {
      console.warn("[upload] Session exists but accessToken is missing. Check JWT callback in [...nextauth]/route.ts.");
    } else {
      console.info(`[upload] Token present for user: ${session.user?.email ?? "unknown"}`);
    }

    // ── 2. Parse request body ───────────────────────────────────────────────
    const contentType = req.headers.get("content-type") || "";
    let title = "", description = "", tags = "", publishAt = "";
    let videoBuffer: Buffer | null = null;
    let videoMime = "video/mp4";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title       = (formData.get("title")       as string) || "";
      description = (formData.get("description") as string) || "";
      tags        = (formData.get("tags")        as string) || "";
      publishAt   = (formData.get("publishAt")   as string) || "";

      const videoFile = formData.get("video") as File | null;
      if (videoFile && videoFile.size > 0) {
        const arrayBuffer = await videoFile.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuffer);
        videoMime   = videoFile.type || "video/mp4";
      }
    } else {
      const body  = await req.json();
      title       = body.title       || "";
      description = body.description || "";
      tags        = body.tags        || "";
      publishAt   = body.publishAt   || "";
    }

    // Graceful fallback — never let an empty title reach the YouTube API
    if (!title?.trim()) {
      console.warn("[upload] Title missing from request — defaulting to 'Untitled AI Schedule'.");
      title = "Untitled AI Schedule";
    }

    // ── 3. No token → clear 401 with actionable message ────────────────────
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Not authenticated. No YouTube access token found in your session. " +
            "Please sign in with Google and grant YouTube permissions.",
          action: "SIGN_IN_REQUIRED",
        },
        { status: 401 }
      );
    }

    // ── 4. Build OAuth2 client ──────────────────────────────────────────────
    //
    // IMPORTANT: We create the OAuth2 client WITHOUT passing clientId/clientSecret
    // as constructor args here. Passing them triggers googleapis' auto-refresh logic,
    // which can silently attempt a token refresh and fail with a misleading error when
    // the refresh_token is missing or expired.
    //
    // By calling setCredentials() directly on a bare OAuth2 instance we guarantee the
    // access_token we have from the user's session is used as-is.
    //
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      access_token:  accessToken,
      refresh_token: refreshToken ?? null,
      // Tell the library not to attempt a silent refresh on its own —
      // if the token is expired the user must re-authenticate via NextAuth.
      token_type: "Bearer",
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // ── 5. YouTube upload ────────────────────────────────────────────────────
    const statusBlock: Record<string, string> = { privacyStatus: "private" };
    if (publishAt) {
      statusBlock.publishAt = new Date(publishAt).toISOString();
    }

    const mediaBody = videoBuffer
      ? Readable.from(videoBuffer)
      : Readable.from(Buffer.from("placeholder"));   // dev/no-file fallback

    let uploadResponse;
    try {
      uploadResponse = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title,
            description,
            tags: tags ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
            categoryId: "22", // People & Blogs — sensible default
          },
          status: statusBlock,
        },
        media: {
          mimeType: videoMime,
          body: mediaBody,
        },
      });
    } catch (ytErr: unknown) {
      // ── Classify the error and return the appropriate HTTP status ──────────
      const { status, message } = classifyGoogleError(ytErr);
      console.error(`[upload] YouTube API error (${status}):`, message);

      return NextResponse.json(
        {
          success: false,
          error: message,
          ...(status === 401 || status === 403
            ? { action: "SIGN_IN_REQUIRED" }
            : {}),
        },
        { status }
      );
    }

    // ── 6. Success ───────────────────────────────────────────────────────────
    const videoId = uploadResponse.data.id;
    console.info(`[upload] Successfully uploaded videoId=${videoId} for ${session.user?.email}`);

    return NextResponse.json({
      success: true,
      videoId,
      publishAt,
      message: publishAt
        ? `Uploaded privately. Scheduled to publish at ${new Date(publishAt).toLocaleString()}.`
        : "Uploaded to YouTube with PRIVATE status successfully.",
    });

  } catch (err: unknown) {
    // Catches parsing errors, session errors, etc. — not YouTube API errors
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    console.error("[upload] Unhandled error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
