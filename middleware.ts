import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api/webhook", "/favicon.ico", "/icons/(.*)", "/_next/(.*)"],
});

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!.+\.[\\w]+$|_next).*)",
  ],
}; 