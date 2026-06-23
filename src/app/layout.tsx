import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LUCID-GL Engine",
  description: "Next-gen multi-agent platform with Glassmorphism aesthetic.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen relative overflow-x-hidden`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <AuthProvider>
          <Navigation />
          <main className="pt-20 pb-24 px-4 max-w-5xl mx-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
