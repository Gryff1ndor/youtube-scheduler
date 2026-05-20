import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the built-in Session type to include OAuth tokens
   * persisted via the jwt + session callbacks in authOptions.
   */
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  /** Extends the built-in JWT type to carry OAuth tokens */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}
