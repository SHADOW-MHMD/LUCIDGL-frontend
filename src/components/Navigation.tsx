"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Home, Play, MessageSquare, LogIn, LogOut, Compass, UserCircle, PlusSquare, Code2, BarChart2, Settings, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/faces/upload", label: "Upload", icon: PlusSquare },
    { href: "/code", label: "Code Hub", icon: Code2 },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-[#0d0d1a]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl z-50">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <motion.div
            key={href}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative"
          >
            <Link
              href={href}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                isActive
                  ? "bg-indigo-600/20 shadow-lg shadow-indigo-500/20"
                  : "hover:bg-white/[0.06]"
              }`}
              title={label}
            >
              <Icon size={24} className={isActive ? "text-indigo-400" : "text-white/70"} />
            </Link>
            {isActive && (
              <motion.div
                layoutId="nav-active-dot"
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400"
              />
            )}
          </motion.div>
        );
      })}

      <div className="w-px h-8 bg-white/[0.08] mx-1" />

      <div className="relative">
        <motion.button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 hover:bg-white/[0.06]"
        >
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border border-white/20" />
          ) : (
            <UserCircle className="w-8 h-8 text-white/70" />
          )}
        </motion.button>

        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute bottom-full mb-4 right-0 w-48 bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50"
            >
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-indigo-500/10 hover:text-indigo-300 text-white/80 transition-all text-sm"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
