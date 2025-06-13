import { auth } from "@clerk/nextjs"; // Import auth from Clerk
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Helper to get Clerk userId
const getUser = () => auth();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define a route for images
  imageUploader: f({
    image: { maxFileSize: "4MB" },
  })
    .middleware(async ({ req }) => {
      const user = await getUser();
      if (!user.userId) throw new Error("Unauthorized");
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { userId: string }, file: any }) => {
      console.log("Upload complete for url:", file.url);
      console.log("User ID from metadata:", metadata.userId);
      // You can do whatever you need with the file data here.
      // For example, store it in your database.
      return { uploadedBy: metadata.userId };
    }),
  // You can add more file routes here if needed
  messageFile: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
    video: { maxFileSize: "16MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 },
    text: { maxFileSize: "4MB", maxFileCount: 1 },
    pdf: { maxFileSize: "10MB", maxFileCount: 1 }, // Allow PDF files
    word: { maxFileSize: "10MB", maxFileCount: 1 }, // Allow Word documents (.doc, .docx)
    excel: { maxFileSize: "10MB", maxFileCount: 1 }, // Allow Excel spreadsheets (.xls, .xlsx)
    csv: { maxFileSize: "4MB", maxFileCount: 1 }, // Allow CSV files
  })
    .middleware(async ({ req }) => {
      const user = await getUser();
      if (!user.userId) throw new Error("Unauthorized");
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }: { metadata: { userId: string }, file: any }) => {
      console.log("Chat file upload complete:", file.url);
      console.log("User ID from metadata:", metadata.userId);
      return { fileUrl: file.url, fileName: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 