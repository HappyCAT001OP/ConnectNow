import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// Export routes for Next.js App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    uploadthingId: "svglj7u4w1",
    uploadthingSecret: "sk_live_0a35d03f20ac19bc5c0f32a93c34c2a412465104196143cd58451b53cbd374e8",
  },
}); 