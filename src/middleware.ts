import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/analytics/:path*",
    "/reports/:path*",
    "/upload/:path*",
    "/community/:path*",
  ],
};
