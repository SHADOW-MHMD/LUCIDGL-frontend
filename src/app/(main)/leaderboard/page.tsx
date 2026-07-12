"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Crown, Flame, Trophy, Award, Medal } from "lucide-react";
import { env } from "@/lib/env";
import Link from "next/link";

interface LeaderboardUser {
  id: string;
  username: string;
  xp_points: number;
  streak_count: number;
  max_streak: number;
  badge_tier: string;
  avatar_url?: string;
  current_level: number;
}

// ─── Rank-specific style config ───────────────────────────────────────────────
const podiumConfig = {
  1: {
    gradient: "from-yellow-400/20 to-amber-400/10",
    border: "border-yellow-400/30",
    shadow: "shadow-[0_0_40px_rgba(250,204,21,0.1)]",
    badge: "bg-yellow-400 text-black",
    ring: "ring-yellow-400/50",
    icon: <Crown className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />,
    height: "h-52",
  },
  2: {
    gradient: "from-slate-400/20 to-slate-300/10",
    border: "border-slate-400/25",
    shadow: "shadow-[0_0_30px_rgba(148,163,184,0.08)]",
    badge: "bg-slate-300 text-black",
    ring: "ring-slate-400/40",
    icon: <Award className="w-5 h-5 text-slate-300" strokeWidth={1.5} />,
    height: "h-40",
  },
  3: {
    gradient: "from-orange-700/20 to-orange-600/10",
    border: "border-orange-700/25",
    shadow: "shadow-[0_0_30px_rgba(194,65,12,0.08)]",
    badge: "bg-orange-700 text-white",
    ring: "ring-orange-700/40",
    icon: <Medal className="w-5 h-5 text-orange-500" strokeWidth={1.5} />,
    height: "h-32",
  },
} as const;

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch(`${env.apiUrl}/api/users/leaderboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  // Reorder top 3 for the podium: Rank 2, Rank 1, Rank 3
  const podium = [
    top3[1], // Rank 2
    top3[0], // Rank 1
    top3[2], // Rank 3
  ];

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-black min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-16 space-y-10">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-md" />
            <div className="skeleton w-52 h-9 rounded-lg" />
          </div>
          {/* Podium skeleton */}
          <div className="flex justify-center items-end gap-4 h-52">
            {[40, 52, 32].map((h, i) => (
              <div
                key={i}
                className="skeleton rounded-2xl w-32"
                style={{ height: `${h * 4}px` }}
              />
            ))}
          </div>
          {/* Row skeletons */}
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton h-[68px] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (!loading && users.length === 0) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <Trophy className="w-16 h-16 text-white/10" strokeWidth={1.5} />
          <p className="text-white/30 text-sm tracking-tight">
            No legends yet. Be the first to climb the ranks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <motion.div
        className="max-w-3xl mx-auto px-8 py-16 space-y-12"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Trophy
            className="w-8 h-8 text-[var(--accent-color)]"
            strokeWidth={1.5}
          />
          <h1 className="text-4xl font-black tracking-tight text-white">
            Leaderboard
          </h1>
        </div>

        {/* ── Podium ──────────────────────────────────────────────────────── */}
        {top3.length > 0 && (
          <motion.div
            className="flex justify-center items-end gap-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {podium.map((user, idx) => {
              if (!user) return <div key={idx} className="w-36" />;

              const isRank1 = idx === 1;
              const rank = (isRank1 ? 1 : idx === 0 ? 2 : 3) as 1 | 2 | 3;
              const cfg = podiumConfig[rank];

              return (
                <motion.div
                  key={user.id}
                  className="flex flex-col items-center"
                  whileHover={{
                    y: -4,
                    transition: { type: "spring", stiffness: 400, damping: 20 },
                  }}
                >
                  {/* Rank card */}
                  <div
                    className={`
                      relative w-36 ${cfg.height} rounded-2xl
                      bg-gradient-to-b ${cfg.gradient}
                      border ${cfg.border} ${cfg.shadow}
                      backdrop-blur-sm overflow-hidden
                      flex flex-col items-center justify-start pt-5 px-3
                      transition-colors duration-200
                    `}
                  >
                    {/* Watermark rank number */}
                    <span
                      className="absolute bottom-1 right-2 text-8xl font-black text-white/[0.04] select-none leading-none"
                      aria-hidden
                    >
                      {rank}
                    </span>

                    {/* Rank icon */}
                    <div className="mb-3 z-10">{cfg.icon}</div>

                    {/* Avatar */}
                    <Link href={`/user/${user.id}`} className="z-10">
                      <div
                        className={`w-12 h-12 rounded-full overflow-hidden ring-2 ${cfg.ring} ring-offset-1 ring-offset-black bg-white/[0.05]`}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-bold text-white text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Username */}
                    <Link
                      href={`/user/${user.id}`}
                      className="mt-2 font-bold text-white text-xs truncate w-full text-center hover:underline z-10"
                    >
                      @{user.username}
                    </Link>

                    {/* XP */}
                    <span className="text-[var(--accent-color)] font-bold font-mono text-xs mt-0.5 z-10">
                      {user.xp_points.toLocaleString()} XP
                    </span>

                    {/* Rank badge pill */}
                    <span
                      className={`absolute top-2 left-2 text-[10px] font-black px-1.5 py-0.5 rounded-md ${cfg.badge} z-10`}
                    >
                      #{rank}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Ranks 4+ list ────────────────────────────────────────────────── */}
        {rest.length > 0 && (
          <div className="space-y-2">
            {rest.map((user, index) => {
              const rank = index + 4;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.15 + index * 0.04,
                    type: "spring",
                    stiffness: 260,
                    damping: 22,
                  }}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-6 py-4 flex items-center gap-4 hover:bg-white/[0.04] hover:border-[var(--accent-color)]/30 transition-colors duration-200 group"
                >
                  {/* Rank number */}
                  <span className="w-8 text-right font-mono text-sm text-white/25 group-hover:text-white/50 transition-colors shrink-0">
                    {String(rank).padStart(2, "0")}
                  </span>

                  {/* Avatar */}
                  <Link href={`/user/${user.id}`} className="shrink-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/20 bg-white/[0.05] flex items-center justify-center hover:scale-105 transition-transform">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-white/70 text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Username + level/badge */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/user/${user.id}`}
                      className="font-semibold text-white text-sm hover:underline truncate block"
                    >
                      @{user.username}
                    </Link>
                    <span className="text-white/30 text-xs uppercase tracking-wider font-bold">
                      Lvl {user.current_level} · {user.badge_tier}
                    </span>
                  </div>

                  {/* Streak */}
                  <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg shrink-0">
                    <Flame
                      className="w-3.5 h-3.5 text-orange-400"
                      strokeWidth={1.5}
                    />
                    <span className="font-bold text-orange-400 text-xs">
                      {user.streak_count || 0}
                    </span>
                  </div>

                  {/* XP */}
                  <span className="text-[var(--accent-color)] font-bold font-mono text-sm shrink-0">
                    {user.xp_points.toLocaleString()} XP
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
