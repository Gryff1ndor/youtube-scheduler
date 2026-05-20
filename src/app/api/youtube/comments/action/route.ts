import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "mock-key",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;
    const body = await req.json();
    const { action, commentIds, commentText } = body;

    // Offline / Dev Mock Handler
    if (!accessToken) {
      console.warn("No active NextAuth access token. Simulating action.");
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (action === "delete_spam") {
        return NextResponse.json({ success: true, message: `Successfully deleted ${commentIds.length} spam comments.` });
      }

      if (action === "auto_reply") {
        // Mock Gemini response
        let reply = "Thank you so much for the kind words! I'm glad the video was helpful.";
        if (commentText?.includes("animations")) {
          reply = "Thank you! I spent a lot of time perfecting those animations using Framer Motion. Glad you noticed!";
        }
        return NextResponse.json({ success: true, reply });
      }

      return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
    }

    // Real YouTube API & Gemini Handler
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    if (action === "delete_spam") {
      if (!Array.isArray(commentIds)) throw new Error("commentIds must be an array");
      
      // YouTube API allows setting moderation status bulk
      await youtube.comments.setModerationStatus({
        id: commentIds,
        moderationStatus: "rejected",
        banAuthor: true,
      });

      return NextResponse.json({ success: true, message: `Successfully removed ${commentIds.length} comments.` });
    }

    if (action === "auto_reply") {
      const commentId = commentIds[0];
      if (!commentId || !commentText) throw new Error("commentId and commentText required for reply");

      // Generate Reply using Gemini
      const prompt = `
        You are the creator of a YouTube channel. A viewer just left this positive comment on your video:
        "${commentText}"
        Write a short, warm, and authentic reply (1-2 sentences maximum). Be polite and conversational.
      `;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      const replyText = aiResponse.text || "Thank you so much for watching!";

      // Post Reply to YouTube
      await youtube.comments.insert({
        part: ["snippet"],
        requestBody: {
          snippet: {
            parentId: commentId,
            textOriginal: replyText
          }
        }
      });

      return NextResponse.json({ success: true, reply: replyText });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });

  } catch (err: any) {
    console.error("Comments Action Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
