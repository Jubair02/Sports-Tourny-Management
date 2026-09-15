import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TourneyBD — Sports Tournament Management Platform",
  description:
    "Bangladesh's all-in-one sports tournament management platform. Organize football, cricket, futsal & more. Manage teams, fixtures, results and rankings.",
  keywords: [
    "Bangladesh tournament", "football tournament Dhaka", "cricket tournament",
    "sports management", "tournament organizer", "TourneyBD",
  ],
  authors: [{ name: "TourneyBD" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "TourneyBD — Sports Tournament Management Platform",
    description: "Organize, play & follow tournaments across Bangladesh.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
