import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logAiAction } from "@/lib/db";

// ── Gemini client (lazy-init so missing key degrades gracefully) ─────────────
function getGenAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

const REPLY_SYSTEM_PROMPT = `You are the creator of a popular YouTube channel. A viewer has left a comment on one of your videos.

Your task: write a single, authentic, warm reply that:
- Is 1–3 sentences (never longer)
- Directly addresses the specific content of their comment
- Feels personal and genuine — not generic or corporate
- If it's a question, briefly answer it or guide them to a resource
- If it's praise, thank them specifically for what they noticed
- Uses a friendly, conversational tone — like a real person, not a brand
- Never uses hollow phrases like "Thanks for watching!" or "Great question!"

Return ONLY the reply text. No quotes, no labels, no preamble.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { commentId, commentText, videoTitle, authorName } = body as {
      commentId: string;
      commentText: string;
      videoTitle?: string;
      authorName?: string;
    };

    if (!commentId || !commentText?.trim()) {
      return NextResponse.json(
        { success: false, error: "commentId and commentText are required." },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;
    const ai = getGenAI();

    // ── Draft Gemini reply ────────────────────────────────────────────────────
    let replyText = "";
    const replyStart = Date.now();
    const userId = session?.user?.email ?? undefined;
    const inputSummary = `[${videoTitle ?? "video"}] ${authorName ?? "viewer"}: ${commentText.slice(0, 300)}`;

    if (!ai) {
      // Dev fallback — no Gemini key
      await new Promise((r) => setTimeout(r, 1400));
      if (commentText.toLowerCase().includes("question") || commentText.includes("?")) {
        replyText = `Great question, ${authorName ?? "friend"}! That's something a lot of people run into — drop it in the comments and I'll make sure to address it in the next video.`;
      } else {
        replyText = `This genuinely made my day, ${authorName ?? ""}! Knowing that the ${videoTitle ? `"${videoTitle}"` : "video"} clicked for you is exactly why I keep making these. More coming soon! 🙌`;
      }

      // Log dev-fallback generation
      try {
        logAiAction({
          userId,
          action: "draft_reply",
          model: "dev-fallback",
          inputSummary,
          output: replyText,
          latencyMs: Date.now() - replyStart,
          success: true,
        });
      } catch (logErr) {
        console.warn("[community/reply] ai_log write failed:", logErr);
      }
    } else {
      const prompt = `${REPLY_SYSTEM_PROMPT}

Video title: "${videoTitle ?? "N/A"}"
Viewer name: ${authorName ?? "Unknown"}
Their comment: "${commentText}"

Write the reply now:`;

      try {
        const genAI = ai;
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        replyText = result.response.text().trim();
        if (!replyText) throw new Error("Gemini returned an empty reply.");

        // Log successful Gemini generation
        try {
          logAiAction({
            userId,
            action: "draft_reply",
            model: "gemini-1.5-flash",
            inputSummary,
            output: replyText,
            latencyMs: Date.now() - replyStart,
            success: true,
          });
        } catch (logErr) {
          console.warn("[community/reply] ai_log write failed:", logErr);
        }
      } catch (geminiErr: unknown) {
        const errMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);

        // Log the failure before re-throwing
        try {
          logAiAction({
            userId,
            action: "draft_reply",
            model: "gemini-1.5-flash",
            inputSummary,
            latencyMs: Date.now() - replyStart,
            success: false,
            errorMessage: errMsg,
          });
        } catch (logErr) {
          console.warn("[community/reply] ai_log write failed:", logErr);
        }

        throw geminiErr;
      }
    }

    // ── If authenticated, post to YouTube ───────────────────────────────────
    if (accessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ access_token: accessToken });

        const youtube = google.youtube({ version: "v3", auth: oauth2Client });

        await youtube.comments.insert({
          part: ["snippet"],
          requestBody: {
            snippet: {
              parentId: commentId,
              textOriginal: replyText,
            },
          },
        });

        return NextResponse.json({
          success: true,
          reply: replyText,
          posted: true,
          message: "Reply posted to YouTube successfully.",
        });
      } catch (ytErr: any) {
        console.error("[community/reply] YouTube post failed:", ytErr.message);
        // Still return the generated text even if posting failed
        return NextResponse.json({
          success: true,
          reply: replyText,
          posted: false,
          message: `Draft generated but posting failed: ${ytErr.message}`,
        });
      }
    }

    // ── Dev / no-auth — return draft only ────────────────────────────────────
    return NextResponse.json({
      success: true,
      reply: replyText,
      posted: false,
      message: "Draft generated (dev mode — not posted to YouTube).",
    });

  } catch (err: any) {
    console.error("[community/reply] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to generate reply." },
      { status: 500 }
    );
  }
}
