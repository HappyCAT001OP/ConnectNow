import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ConnectNow",
  description: "Your Space to Collaborate and Create.",
  icons: {
    icon: "/icons/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <ClerkProvider
        signUpUrl="/sign-up"
        signInUrl="/sign-in"
        appearance={{
          layout: {
            socialButtonsVariant: "iconButton",
            logoImageUrl: "/icons/logo.jpg",
            logoPlacement: "inside",
            showOptionalFields: true,
            privacyPageUrl: "/privacy",
            termsPageUrl: "/terms",
          },
          variables: {
            colorText: "#fff",
            colorPrimary: "#0E78F9",
            colorBackground: "#1C1F2E",
            colorInputBackground: "#252A41",
            colorInputText: "#fff",
            colorSuccess: "#0E78F9",
            colorDanger: "#FF4B4B",
            colorWarning: "#FFB800",
            borderRadius: "0.5rem",
            fontFamily: inter.style.fontFamily,
          },
          elements: {
            formButtonPrimary: {
              backgroundColor: "#0E78F9",
              "&:hover": {
                backgroundColor: "#0B5FD9",
              },
            },
            card: {
              backgroundColor: "#1C1F2E",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            },
            headerTitle: {
              fontSize: "1.5rem",
              fontWeight: "600",
            },
            headerSubtitle: {
              fontSize: "1rem",
              color: "#9CA3AF",
            },
          },
        }}
      >
        <body className={`${inter.className} bg-black`}>
          <Toaster />
          {children}
        </body>
      </ClerkProvider>
    </html>
  );
}
