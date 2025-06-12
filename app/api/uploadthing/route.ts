import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

console.log("Initializing UploadThing route handler...");
console.log("ourFileRouter:", ourFileRouter);

// Export routes for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
}); 