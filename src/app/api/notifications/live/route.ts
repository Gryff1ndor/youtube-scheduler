export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  queryOne,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationsAsRead,
  insertNotification,
  getPendingCommentsCount,
} from "@/lib/db";

/**
 * GET /api/notifications/live
 *
 * Returns live unread notification count, pending comments count,
 * and the list of notification messages. Seeds mock alerts if none exist.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ?? "anonymous_user";

    // 1. Resolve channel ID from database to filter pending comments if possible
    let channelId: string | undefined = undefined;
    if (session?.user?.email) {
      const userRow = await queryOne<{ youtube_channel_id: string | null }>(
        `SELECT youtube_channel_id FROM users WHERE email = ?`,
        [session.user.email]
      );
      if (userRow?.youtube_channel_id) {
        channelId = userRow.youtube_channel_id;
      }
    }

    // 2. Retrieve notification list
    let list = await getNotifications(userId);

    // If notifications list is empty, seed 3 mock notification alerts matching UI design
    if (list.length === 0) {
      const mockSeeds = [
        {
          title: "New subscriber milestone reached!",
          description: "Congratulations! You have gained new subscribers.",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        },
        {
          title: "Your latest video is gaining traction.",
          description: "Views and watch time are higher than usual.",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
        },
        {
          title: "Weekly analytics report is ready.",
          description: "Your weekly summary dashboard is now compiled.",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
        },
      ];

      for (const item of mockSeeds) {
        await insertNotification({
          userId,
          title: item.title,
          description: item.description,
          createdAt: item.createdAt,
        });
      }

      // Re-fetch seeded notifications
      list = await getNotifications(userId);
    }

    // 3. Retrieve counts
    const unreadNotifications = await getUnreadNotificationsCount(userId);
    const pendingComments = await getPendingCommentsCount(channelId);

    return NextResponse.json({
      success: true,
      unreadNotifications,
      pendingComments,
      notifications: list,
    });

  } catch (err: any) {
    console.error("[notifications/live] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to fetch live notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/live
 *
 * Marks all notifications as read for the user.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ?? "anonymous_user";

    await markNotificationsAsRead(userId);

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read.",
    });

  } catch (err: any) {
    console.error("[notifications/live] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Failed to update notification state" },
      { status: 500 }
    );
  }
}
