import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
// import { Providers } from "@/providers";
import "./globals.css";

/* ============================================================
   FONT LOADING — self-hosted by Next.js, no external requests
   ============================================================ */

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/* ============================================================
   METADATA
   ============================================================ */

export const metadata: Metadata = {
  title: {
    default: "Meridian Core — Digital Banking Management",
    template: "%s · Meridian Core",
  },
  description:
    "Advanced digital banking management system — secure transfers, loans, and analytics for modern financial institutions.",
  applicationName: "Meridian Core",
  authors: [{ name: "Meridian Core" }],
  keywords: ["banking", "fintech", "digital banking", "meridian core"],
  icons: {
    icon: "/logo/favicon.ico",
    apple: "/logo/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F7FA" },
    { media: "(prefers-color-scheme: dark)", color: "#091929" },
  ],
  width: "device-width",
  initialScale: 1,
};

/* ============================================================
   ROOT LAYOUT
   ============================================================ */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${cormorant.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/* <Providers> */}
          {children}
        {/* </Providers> */}
      </body>
    </html>
  );
}