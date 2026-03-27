import nextAuthMiddleware from "next-auth/middleware";

export default nextAuthMiddleware;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/modules/:path*",
    "/quiz/:path*",
    "/assignments/:path*",
    "/programming/:path*",
    "/leaderboard",
    "/profile",
    "/parent/:path*",
    "/teacher/:path*"
  ]
};
