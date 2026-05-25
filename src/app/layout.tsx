import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

/* ── Inter font ── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

/* ── SEO Metadata ── */
export const metadata: Metadata = {
  title: {
    template: "%s | Clarity",
    default: "Clarity — Dashboard",
  },
  description:
    "A clean, minimalist analytics dashboard. Monitor metrics, review reports, and manage your workspace.",
  keywords: ["analytics", "dashboard", "metrics", "reports"],
  authors: [{ name: "Clarity Team" }],
  openGraph: {
    title: "Clarity Dashboard",
    description: "Monitor metrics and review reports.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable)}
    >
      <body className={cn("font-sans antialiased bg-background text-foreground")}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange={false}
            themes={["light", "dark"]}
          >
            <AppShell>{children}</AppShell>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
