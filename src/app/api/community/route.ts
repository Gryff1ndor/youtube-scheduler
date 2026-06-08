export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { google } from "googleapis";
import { upsertCommunityComment, query } from "@/lib/db";

// ── Mock data for dev / unauthenticated mode ─────────────────────────────────
const MOCK_COMMENTS = [
  {
    id: "cmt_001",
    authorName: "Sarah Chen",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=sarah_chen",
    textDisplay: "This tutorial completely changed how I think about Next.js 14 server components. The explanation at the 12-minute mark was pure gold. Subscribed immediately!",
    publishedAt: new Date(Date.now() - 3_600_000 * 1.5).toISOString(),
    videoTitle: "Mastering Next.js 14 Server Components",
    videoId: "vid_001",
    likeCount: 24,
    replied: false,
  },
  {
    id: "cmt_002",
    authorName: "Marcus Webb",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=marcus_webb",
    textDisplay: "Quick question — around the 8:40 mark when you set up the OAuth flow, I'm getting a 401 error even though I copied the exact config. Is there a newer version of next-auth that changed the callback URL format?",
    publishedAt: new Date(Date.now() - 3_600_000 * 4).toISOString(),
    videoTitle: "Building a Full-Stack Auth System",
    videoId: "vid_002",
    likeCount: 7,
    replied: true,
    replyText: "Make sure you're using next-auth v4.24+, they updated the required callback formats recently. Let me know if that works!",
  },
  {
    id: "cmt_003",
    authorName: "Priya Nair",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=priya_nair",
    textDisplay: "The Framer Motion animations you built at the end look absolutely stunning — that exit transition is the smoothest I've seen on YouTube. Would love a dedicated deep-dive on animation composition!",
    publishedAt: new Date(Date.now() - 3_600_000 * 7).toISOString(),
    videoTitle: "UI/UX Micro-Interactions in React",
    videoId: "vid_003",
    likeCount: 41,
    replied: false,
  },
  {
    id: "cmt_004",
    authorName: "Alex Torres",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=alex_torres",
    textDisplay: "I've been struggling with Tailwind dark mode for weeks. Your explanation of the `data-[state]` pattern finally made it click. This is genuinely the best content creator in the dev space right now.",
    publishedAt: new Date(Date.now() - 3_600_000 * 12).toISOString(),
    videoTitle: "Tailwind CSS Dark Mode Masterclass",
    videoId: "vid_004",
    likeCount: 18,
    replied: false,
  },
  {
    id: "cmt_005",
    authorName: "Jordan Kim",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=jordan_kim",
    textDisplay: "When you deploy this to Vercel, does the YouTube Analytics API still work or do you need special server configurations? I'm getting CORS errors on my production deployment.",
    publishedAt: new Date(Date.now() - 3_600_000 * 18).toISOString(),
    videoTitle: "Deploy Next.js to Vercel — Full Guide",
    videoId: "vid_005",
    likeCount: 5,
    replied: true,
    replyText: "Yes! The Analytics API works perfectly on Vercel. You just need to ensure your GOOGLE_CLIENT_ID and SECRET are set in the Vercel dashboard environment variables.",
  },
  {
    id: "cmt_006",
    authorName: "Elena Vasquez",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=elena_vasquez",
    textDisplay: "You're the reason I landed my first dev job 🙌 I watched your full roadmap series back-to-back and it gave me exactly what I needed for the technical interviews. Thank you from the bottom of my heart!",
    publishedAt: new Date(Date.now() - 3_600_000 * 26).toISOString(),
    videoTitle: "Frontend Developer Roadmap 2025",
    videoId: "vid_006",
    likeCount: 89,
    replied: false,
  },
  {
    id: "cmt_007",
    authorName: "Thomas Müller",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=thomas_muller",
    textDisplay: "Is there a GitHub repo for this project? I'd love to dig into the full source code and see how the state management is wired up end-to-end.",
    publishedAt: new Date(Date.now() - 3_600_000 * 30).toISOString(),
    videoTitle: "Building a YouTube Analytics Dashboard",
    videoId: "vid_007",
    likeCount: 12,
    replied: false,
  },
  {
    id: "cmt_008",
    authorName: "Ava Mitchell",
    authorProfileImageUrl: "https://i.pravatar.cc/150?u=ava_mitchell",
    textDisplay: "The production-grade code patterns you use are so different from what they teach in bootcamps. The custom hooks and abstraction layer at the 20-minute mark just elevated my entire understanding of React architecture.",
    publishedAt: new Date(Date.now() - 3_600_000 * 38).toISOString(),
    videoTitle: "Advanced React Patterns for Production",
    videoId: "vid_008",
    likeCount: 33,
    replied: false,
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;

    // ── Dev / no-auth fallback ───────────────────────────────────────────────
    if (!accessToken) {
      console.warn("[community] No access token — serving mock comments.");
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ success: true, comments: MOCK_COMMENTS });
    }

    // ── Live YouTube API ─────────────────────────────────────────────────────
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // 1. Resolve channel ID for the authenticated user
    const channelRes = await youtube.channels.list({
      part: ["id"],
      mine: true,
    });
    const channelId = channelRes.data.items?.[0]?.id;

    if (!channelId) {
      return NextResponse.json({ success: true, comments: [] });
    }

    // 2. Fetch latest 20 comment threads on the channel
    const threadsRes = await youtube.commentThreads.list({
      part: ["snippet", "replies"],
      allThreadsRelatedToChannelId: channelId,
      maxResults: 20,
      order: "time",
    });

    const items = threadsRes.data.items ?? [];

    // 3. Collect unique videoIds for batch title resolution
    const videoIds = Array.from(new Set(items.map((i) => i.snippet?.videoId).filter((v): v is string => !!v)));

    // 4. Batch-fetch video titles (max 50 per request — safe)
    const videoTitleMap: Record<string, string> = {};
    if (videoIds.length > 0) {
      const videosRes = await youtube.videos.list({
        part: ["snippet"],
        id: videoIds,
      });
      for (const v of videosRes.data.items ?? []) {
        if (v.id) videoTitleMap[v.id] = v.snippet?.title ?? "Untitled Video";
      }
    }

    // 5. Shape the response and sync to database
    const mappedItems = items.map((item) => {
      const top = item.snippet?.topLevelComment?.snippet;
      const videoId = item.snippet?.videoId ?? "";
      const authorChannelId = top?.authorChannelId?.value;
      const isOwner = authorChannelId === channelId;
      return {
        id: item.id ?? "",
        authorName: top?.authorDisplayName ?? "Anonymous",
        authorProfileImageUrl: top?.authorProfileImageUrl ?? "",
        textDisplay: top?.textDisplay ?? "",
        publishedAt: top?.publishedAt ?? new Date().toISOString(),
        videoId,
        videoTitle: videoTitleMap[videoId] ?? "Your Video",
        likeCount: top?.likeCount ?? 0,
        totalReplyCount: item.snippet?.totalReplyCount ?? 0,
        replyText: item.replies?.comments?.[0]?.snippet?.textDisplay ?? "",
        isOwner,
      };
    });

    if (mappedItems.length > 0) {
      // Upsert into DB
      const dbPromises = mappedItems.map(async (c) => {
        await upsertCommunityComment({
          id: c.id,
          channelId: channelId,
          videoId: c.videoId,
          authorName: c.authorName,
          authorProfileImageUrl: c.authorProfileImageUrl,
          textDisplay: c.textDisplay,
          publishedAt: c.publishedAt,
          likeCount: c.likeCount,
          replied: c.totalReplyCount > 0,
          replyText: c.replyText || undefined,
          isOwner: c.isOwner,
        });
      });
      await Promise.all(dbPromises);
    }

    // Fetch the final replied status and reply text for these comments
    let repliedMap = new Map<string, { replied: boolean; replyText: string }>();
    if (mappedItems.length > 0) {
      const ids = mappedItems.map((c) => c.id);
      const placeholders = ids.map(() => "?").join(",");
      const rows = await query<{ id: string; replied: number; reply_text: string | null }>(
        `SELECT id, replied, reply_text FROM community_comments WHERE id IN (${placeholders})`,
        ids
      );
      repliedMap = new Map(
        rows.map((r) => [
          r.id,
          { replied: r.replied === 1, replyText: r.reply_text ?? "" },
        ])
      );
    }

    const comments = mappedItems
      .filter((c) => !c.isOwner)
      .map((c) => {
      const dbInfo = repliedMap.get(c.id);
      const isReplied = dbInfo?.replied ?? (c.totalReplyCount > 0);
      const dbReplyText = dbInfo?.replyText ?? "";
      return {
        id: c.id,
        authorName: c.authorName,
        authorProfileImageUrl: c.authorProfileImageUrl,
        textDisplay: c.textDisplay,
        publishedAt: c.publishedAt,
        videoId: c.videoId,
        videoTitle: c.videoTitle,
        likeCount: c.likeCount,
        replied: isReplied,
        replyText: c.replyText || dbReplyText || undefined,
      };
    });

    return NextResponse.json({ success: true, comments });

  } catch (err: any) {
    console.error("[community] GET error:", err);
    // Graceful degradation to mock data on API error
    return NextResponse.json({ success: true, comments: MOCK_COMMENTS });
  }
}
