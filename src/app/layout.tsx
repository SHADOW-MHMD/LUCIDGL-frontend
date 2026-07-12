import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUCID-GL Engine",
  description: "Next-gen multi-agent platform — dark, fast, powerful.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-black text-white min-h-screen relative overflow-x-hidden`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="theme-violet"
          themes={["theme-violet", "theme-emerald", "theme-cyan", "theme-rose"]}
          storageKey="lucidgl-accent-theme"
          enableSystem={false}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
