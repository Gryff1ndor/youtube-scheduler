import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// ── Token refresh helper ───────────────────────────────────────────────────────
/**
 * Attempts to refresh the Google access token using the stored refresh_token.
 * Returns the updated token on success, or the original token with an error flag
 * on failure (the session will surface `token.error = "RefreshAccessTokenError"`).
 */
async function refreshAccessToken(token: {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
}) {
  try {
    const params = new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID     ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type:    "refresh_token",
      refresh_token: token.refreshToken ?? "",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    });

    const refreshed = await response.json();

    if (!response.ok) {
      console.error("[nextauth] Token refresh failed:", refreshed);
      throw new Error(refreshed.error ?? "Token refresh failed");
    }

    console.info("[nextauth] Access token refreshed successfully.");
    return {
      ...token,
      accessToken:        refreshed.access_token,
      // Google may or may not return a new refresh_token — keep old one if not
      refreshToken:       refreshed.refresh_token ?? token.refreshToken,
      // expires_in is in seconds; store as absolute ms timestamp
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      error:              undefined,
    };
  } catch (err) {
    console.error("[nextauth] refreshAccessToken error:", err);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

// ── NextAuth config ────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt:        "consent",
          access_type:   "offline",
          response_type: "code",
          // ✅ Full scope set required for analytics + upload
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.force-ssl",  // required for comments.insert
            "https://www.googleapis.com/auth/yt-analytics.readonly",
          ].join(" "),
        },
      },
    }),
  ],

  callbacks: {
    /**
     * jwt callback — runs on every session check.
     * Stores the access/refresh tokens and proactively refreshes when expired.
     */
    async jwt({ token, account }) {
      // First sign-in: persist tokens from the OAuth account object
      if (account) {
        return {
          ...token,
          accessToken:        account.access_token,
          refreshToken:       account.refresh_token,
          // expires_at from Google is an absolute Unix timestamp in seconds
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        };
      }

      // Subsequent calls: if token is still valid, return as-is
      const expires = (token as any).accessTokenExpires as number | undefined;
      if (expires && Date.now() < expires - 60_000) {
        // 60-second buffer before actual expiry
        return token;
      }

      // Token is expired (or expiry unknown) — attempt refresh
      console.info("[nextauth] Access token expired — refreshing…");
      return refreshAccessToken(token as Parameters<typeof refreshAccessToken>[0]);
    },

    /**
     * session callback — shapes the Session object exposed to the app.
     * Only include what the client and server routes actually need.
     */
    async session({ session, token }) {
      session.accessToken  = (token as any).accessToken  as string | undefined;
      session.refreshToken = (token as any).refreshToken as string | undefined;
      // Surface refresh errors so the frontend can prompt re-login
      (session as any).error = (token as any).error;
      return session;
    },
  },

  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },
  secret:  process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
