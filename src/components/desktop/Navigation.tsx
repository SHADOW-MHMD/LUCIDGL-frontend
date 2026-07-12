"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Play,
  MessageSquare,
  Compass,
  Trophy,
  PlusSquare,
  Code2,
  BarChart2,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reels", label: "Reels", icon: Play },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/faces/upload", label: "Upload", icon: PlusSquare },
  { href: "/code", label: "Code Hub", icon: Code2 },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export default function DesktopNavigation() {
  const { user, signIn, signOut } = useAuth();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!user || pathname.startsWith("/messages")) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-1 px-2 py-2 rounded-2xl border border-white/[0.08]"
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <motion.div
              key={href}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="relative"
            >
              <Link
                href={href}
                title={label}
                className="relative w-11 h-11 rounded-xl flex items-center justify-center group"
              >
                {/* Active pill */}
                {isActive && (
                  <motion.span
                    layoutId="dock-active-pill"
                    className="absolute inset-0 rounded-xl bg-white"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className={`relative z-10 transition-colors duration-150 ${
                    isActive
                      ? "text-black"
                      : "text-white/55 group-hover:text-white/90"
                  }`}
                />
              </Link>
            </motion.div>
          );
        })}

        {/* Divider */}
        <div className="w-px h-7 bg-white/[0.08] mx-1 shrink-0" />

        {/* Profile button */}
        <div className="relative">
          <motion.button
            onClick={() => setShowProfileMenu((p) => !p)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white/55 hover:text-white/90 hover:bg-white/[0.06] transition-colors"
            title="Profile"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-7 h-7 rounded-full ring-1 ring-white/20"
              />
            ) : (
              <UserCircle size={22} strokeWidth={1.5} />
            )}
          </motion.button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.94 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute bottom-full mb-3 right-0 w-52 z-50 rounded-xl border border-white/[0.08] p-1.5 flex flex-col gap-0.5"
                  style={{
                    background: "#000",
                    boxShadow:
                      "0 -4px 24px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  {/* User info */}
                  {user?.email && (
                    <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
                      <p className="text-white/90 text-sm font-medium truncate">
                        {user.user_metadata?.full_name ?? user.email}
                      </p>
                      <p className="text-white/35 text-xs truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  )}

                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-sm"
                  >
                    <Settings size={15} strokeWidth={1.5} />
                    Settings
                  </Link>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm w-full text-left"
                  >
                    <LogOut size={15} strokeWidth={1.5} />
                    Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sign in (logged out fallback) */}
        {!user && (
          <motion.button
            onClick={signIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold transition-colors hover:bg-white/90"
          >
            Sign in
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
