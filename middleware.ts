import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/sign-in",
    "/sign-up",
    "/api/webhook",
    "/api/uploadthing",
    "/api/trpc/uploadthing",
    "/api/trpc/uploadthing.uploadthing",
    "/api/trpc/uploadthing.uploadthing.uploadthing",
  ],
  ignoredRoutes: [
    "/api/webhook",
    "/api/uploadthing",
    "/api/trpc/uploadthing",
    "/api/trpc/uploadthing.uploadthing",
    "/api/trpc/uploadthing.uploadthing.uploadthing",
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 