import "reactflow/dist/style.css";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import NodesBar from "@/components/NodesBar";
import { auth } from "@clerk/nextjs/server";
import { DM_Serif_Display, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

export const dynamic = "force-dynamic";

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
}: Readonly<{ children: React.ReactNode }>) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <ClerkProvider afterSignOutUrl="/">
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
          <Toaster />
        </div>
      </ThemeProvider>
    </ClerkProvider>
  );
}
