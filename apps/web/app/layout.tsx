import type { Metadata } from "next";
import { Crimson_Text } from "next/font/google";
import "reactflow/dist/style.css";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";

const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-crimson",
});

export const metadata: Metadata = {
  title: "The Go based automation tool",
  description: "This is a performent alternate to n8n/zapier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${crimson.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
