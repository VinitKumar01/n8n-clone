import "reactflow/dist/style.css";
import "../globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import NodesBar from "@/components/NodesBar";
import { auth } from "@clerk/nextjs/server";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div
          className={`${dmSerif.variable} ${ibmMono.variable} antialiased h-screen flex justify-start w-full`}
        >
          <NodesBar>{children}</NodesBar>
        </div>
      </ThemeProvider>
    </ClerkProvider>
  );
}
