import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;

    if (!accessToken) {
      console.warn("No active NextAuth access token. Serving mock community comments.");
      
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Return mock data intentionally designed to test Praise, Question, and Spam
      return NextResponse.json({
        success: true,
        comments: [
          {
            id: "cmt_101",
            authorName: "Sarah Dev",
            authorProfileImageUrl: "https://i.pravatar.cc/150?u=sarah",
            textDisplay: "This tutorial on Next.js 14 was an absolute lifesaver! Thank you so much for breaking down the complex topics so beautifully.",
            publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            videoTitle: "Mastering Next.js 14"
          },
          {
            id: "cmt_102",
            authorName: "CryptoKing99",
            authorProfileImageUrl: "https://i.pravatar.cc/150?u=crypto",
            textDisplay: "🔥 EARN $5000 A DAY PASSIVELY CLICK HERE: http://spam-link-virus.xyz/crypto 🔥 Message me on WhatsApp: +123456789",
            publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
            videoTitle: "Mastering Next.js 14"
          },
          {
            id: "cmt_103",
            authorName: "Mark J.",
            authorProfileImageUrl: "https://i.pravatar.cc/150?u=mark",
            textDisplay: "I'm having an issue around the 12:45 mark. When I run `npm install`, I get an ERESOLVE error. Any tips on how to fix peer dependencies here?",
            publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            videoTitle: "Mastering Next.js 14"
          },
          {
            id: "cmt_104",
            authorName: "DesignEnthusiast",
            authorProfileImageUrl: "https://i.pravatar.cc/150?u=design",
            textDisplay: "Incredible video quality and editing. The animations are so buttery smooth. Subscribed!",
            publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            videoTitle: "UI/UX Micro-Interactions"
          },
          {
            id: "cmt_105",
            authorName: "BotAccount_xyz",
            authorProfileImageUrl: "https://i.pravatar.cc/150?u=bot",
            textDisplay: "Hot girls near you click my profile link!! 💋💋💋",
            publishedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
            videoTitle: "Mastering Next.js 14"
          }
        ]
      });
    }

    // Official Google API Client implementation for fetching real comments
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    
    // Fetch comment threads related to the authenticated user's channel
    const response = await youtube.commentThreads.list({
      part: ["snippet"],
      allThreadsRelatedToChannelId: "mine",
      maxResults: 50,
      order: "time"
    });

    const comments = response.data.items?.map((item) => {
      const topLevel = item.snippet?.topLevelComment?.snippet;
      return {
        id: item.id,
        authorName: topLevel?.authorDisplayName,
        authorProfileImageUrl: topLevel?.authorProfileImageUrl,
        textDisplay: topLevel?.textDisplay,
        publishedAt: topLevel?.publishedAt,
        videoId: item.snippet?.videoId,
        videoTitle: "Uploaded Video" // YouTube API requires separate call for title, mocked here for simplicity
      };
    }) || [];

    return NextResponse.json({
      success: true,
      comments
    });

  } catch (err: any) {
    console.error("YouTube Comments Fetch Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch comments." },
      { status: 500 }
    );
  }
}
