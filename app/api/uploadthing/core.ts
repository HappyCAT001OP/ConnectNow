import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define a route for images
  imageUploader: f({
    image: { maxFileSize: "4MB" },
  })
    .onUploadComplete(async ({ metadata, file }: { metadata: { userId: string }, file: any }) => {
      console.log("Upload complete for url:", file.url);
      // You can do whatever you need with the file data here.
      // For example, store it in your database.
      return { uploadedBy: "" };
    }),
  // You can add more file routes here if needed
  messageFile: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "16MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .onUploadComplete(async ({ metadata, file }: { metadata: { userId: string }, file: any }) => {
      console.log("Chat file upload complete:", file.url);
      return { fileUrl: file.url, fileName: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 