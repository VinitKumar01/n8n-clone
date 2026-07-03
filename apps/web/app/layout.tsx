import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, IBM_Plex_Mono } from "next/font/google";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://g8g-web.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "g8g — Go based Visual Workflow Automation",
  description:
    "Build, schedule, and automate workflows visually. Connect AI, webhooks, and email into powerful pipelines.",
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "g8g — Go based Visual Workflow Automation",
    description:
      "Build, schedule, and automate workflows visually. Connect AI, webhooks, and email into powerful pipelines.",
    siteName: "g8g",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "g8g - Go-based Visual Workflow Automation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "g8g — Go based Visual Workflow Automation",
    description:
      "Build, schedule, and automate workflows visually. Connect AI, webhooks, and email into powerful pipelines.",
    images: ["/og-image.png"],
    creator: "@g8g_dev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${dmSerif.variable} ${ibmMono.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="h-screen w-full">
              {children}
              <Analytics />
              <SpeedInsights />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
