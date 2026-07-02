import "reactflow/dist/style.css";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import NodesBar from "@/components/NodesBar";
import { auth } from "@clerk/nextjs/server";
import { DM_Serif_Display, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";

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
          {/* Mobile Blocker Screen */}
          <div className="hidden max-md:flex fixed inset-0 z-[9999] bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 flex-col items-center justify-center p-6 text-center font-[var(--font-mono)] transition-colors duration-200">
            <div className="max-w-md">
              <div className="mb-6 flex justify-center">
                <Image
                  src="/logo.svg"
                  alt="g8g logo"
                  width={48}
                  height={48}
                  className="dark:invert"
                />
              </div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                Desktop Only Website
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                g8g is a visual workflow editor designed for larger displays. To
                build and automate your pipelines, please use a device with a
                bigger screen.
              </p>
              <div className="text-[10px] text-red-600 dark:text-red-500 uppercase tracking-widest border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded inline-block font-bold">
                Mobile Access Blocked
              </div>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="flex h-full w-full max-md:hidden">
            <NodesBar>{children}</NodesBar>
          </div>
          <Toaster />
        </div>
      </ThemeProvider>
    </ClerkProvider>
  );
}
