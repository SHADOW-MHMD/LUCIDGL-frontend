"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Home, Play, MessageSquare, LogIn, LogOut, Compass, UserCircle, PlusSquare, Code2, BarChart2, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { user, signIn, signOut } = useAuth();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!user || pathname.startsWith('/messages')) {
    return null;
  }

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/reels", label: "Reels", icon: Play },
    { href: "/messages", label: "DMs", icon: MessageSquare },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/faces/upload", label: "Upload", icon: PlusSquare },
    { href: "/code", label: "Code Hub", icon: Code2 },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl z-50">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out ${
              isActive
                ? "bg-white/20 shadow-lg scale-110"
                : "hover:bg-white/10 hover:scale-105"
            }`}
            title={label}
          >
            <Icon size={24} className={isActive ? "text-blue-400" : "text-white"} />
          </Link>
        );
      })}

      <div className="w-px h-8 bg-white/10 mx-1" />

      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-white/10 hover:scale-105"
        >
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border border-white/20" />
          ) : (
            <UserCircle className="w-8 h-8 text-white/70" />
          )}
        </button>

        {showProfileMenu && (
          <div className="absolute bottom-full mb-4 right-0 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50">
            <Link
              href="/settings"
              onClick={() => setShowProfileMenu(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all text-sm"
            >
              <Settings size={16} />
              Settings
            </Link>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                signOut();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400/80 hover:text-red-400 transition-all text-sm w-full text-left"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
