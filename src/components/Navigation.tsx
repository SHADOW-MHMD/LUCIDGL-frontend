"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Home, Play, MessageSquare, LogIn, LogOut, BarChart3, UserCircle, PlusSquare, Code2, BarChart2, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { user, signIn, signOut } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/reels", label: "Reels", icon: Play },
    { href: "/messages", label: "DMs", icon: MessageSquare },
    { href: "/leaderboard", label: "Rank", icon: BarChart3 },
    { href: "/faces/upload", label: "Upload", icon: PlusSquare },
    { href: "/code", label: "Code Hub", icon: Code2 },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed top-0 inset-x-0 z-50 p-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4 px-8 bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] shadow-2xl rounded-2xl transition-all duration-300 ease-in-out">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center">
            <span className="font-bold text-white text-sm tracking-tighter">L</span>
          </div>
          <span className="font-bold text-white/90 hidden sm:block tracking-wide">LUCID-GL</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm border border-white/5"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} className={isActive ? "text-blue-400" : ""} />
                <span className="hidden md:block text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border border-white/20" />
                ) : (
                  <UserCircle className="w-8 h-8 text-white/70" />
                )}
                <span className="hidden sm:block text-sm font-medium text-white/90">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Developer'}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-white/10 text-white/80 transition-all duration-300 text-sm font-medium"
              >
                <LogOut size={16} />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border border-white/10 transition-all duration-300 text-sm font-medium"
            >
              <LogIn size={16} />
              <span className="hidden sm:block">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
