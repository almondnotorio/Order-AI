import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrderAI — Intelligent Signage Ordering",
  description: "AI-powered signage order processing system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
        <body className="min-h-full font-sans" style={{ backgroundColor: "var(--amz-bg)", color: "var(--amz-text)" }}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "10px",
                background: "#1f2937",
                color: "#f9fafb",
                fontSize: "14px",
              },
              success: { iconTheme: { primary: "#10b981", secondary: "#f9fafb" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#f9fafb" } },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
