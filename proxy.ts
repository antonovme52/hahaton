import nextAuthMiddleware from "next-auth/middleware";

export const proxy = nextAuthMiddleware;

export default proxy;

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
