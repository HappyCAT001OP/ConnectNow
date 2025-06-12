import { createRouteHandler } from "uploadthing/next";

// Temporarily commenting out import and usage of ourFileRouter for debugging 404s
// import { ourFileRouter } from "./core";

// Export routes for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: {},
}); 