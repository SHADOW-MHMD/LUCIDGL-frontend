"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Crown, Flame, Trophy, Award, Medal } from "lucide-react";
import { env } from "@/lib/env";

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-t-yellow-400 border-white/[0.08] rounded-full animate-spin"></div>
          <p className="text-white/50 font-medium tracking-wide">Summoning Legends...</p>
        </div>
      </div>
    );
  }

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  // Reorder top 3 for the podium: Rank 2, Rank 1, Rank 3
  const podium = [
    top3[1], // Rank 2
    top3[0], // Rank 1
    top3[2], // Rank 3
  ];

  return (
    <motion.div
      className="max-w-6xl mx-auto py-12 px-4 space-y-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-center mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3">
          <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500">
            Global Leaderboard
          </span>
        </h1>
        <p className="text-white/50 max-w-xl mx-auto text-lg">
          The elite ranks of Apex Legends. Prove your worth and climb to the top.
        </p>
      </motion.div>

      {/* Podium Hero State */}
      {top3.length > 0 && (
        <motion.div
          className="flex justify-center items-end h-72 gap-4 md:gap-8 mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {podium.map((user, index) => {
            if (!user) return <div key={index} className="w-24 md:w-32" />; // Empty slot if < 3 users

            const isRank1 = index === 1;
            const rank = isRank1 ? 1 : index === 0 ? 2 : 3;

            return (
              <motion.div
                key={user.id}
                className={`relative flex flex-col items-center ${isRank1 ? 'z-10' : 'z-0'}`}
                whileHover={{ y: -5 }}
              >
                {/* Crown / Marker */}
                <div className="absolute -top-12 z-20">
                  {isRank1 ? (
                    <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                  ) : rank === 2 ? (
                    <Award className="w-8 h-8 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />
                  ) : (
                    <Medal className="w-8 h-8 text-orange-600 drop-shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
                  )}
                </div>

                {/* Avatar */}
                <div
                  className={`rounded-full p-1 ${
                    isRank1
                      ? "bg-gradient-to-b from-yellow-300 to-yellow-600 w-24 h-24 shadow-[0_0_30px_rgba(250,204,21,0.4)]"
                      : rank === 2
                      ? "bg-gradient-to-b from-slate-200 to-slate-400 w-20 h-20"
                      : "bg-gradient-to-b from-orange-400 to-orange-700 w-20 h-20"
                  } mb-4 relative flex items-center justify-center`}
                >
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-white text-xl">{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={`absolute -bottom-2 px-3 py-0.5 rounded-full text-xs font-bold ${
                    isRank1 ? 'bg-yellow-500 text-black' : rank === 2 ? 'bg-slate-300 text-black' : 'bg-orange-600 text-white'
                  }`}>
                    #{rank}
                  </div>
                </div>

                {/* Podium Block */}
                <div
                  className={`w-28 md:w-40 rounded-t-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex flex-col items-center justify-start pt-4 overflow-hidden ${
                    isRank1 ? "h-48 border-t-yellow-400/50 shadow-[0_-5px_25px_rgba(250,204,21,0.15)]" : rank === 2 ? "h-36 border-t-slate-400/50" : "h-28 border-t-orange-600/50"
                  }`}
                >
                  <span className="font-bold text-white truncate w-full text-center px-2">@{user.username}</span>
                  <span className="text-white/50 text-xs mt-1">{user.xp_points} XP</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Data Scroll Grid */}
      {rest.length > 0 && (
        <motion.div
          className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                  <th className="py-5 px-6 font-semibold text-white/40 uppercase tracking-wider text-xs">Rank</th>
                  <th className="py-5 px-6 font-semibold text-white/40 uppercase tracking-wider text-xs">Legend</th>
                  <th className="py-5 px-6 font-semibold text-white/40 uppercase tracking-wider text-xs">Tier</th>
                  <th className="py-5 px-6 font-semibold text-white/40 uppercase tracking-wider text-xs whitespace-nowrap">Streak & Max</th>
                  <th className="py-5 px-6 font-semibold text-white/40 uppercase tracking-wider text-xs text-right">Experience</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((user, index) => {
                  const rank = index + 4;
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="border-b border-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="text-white/40 font-mono font-medium text-lg group-hover:text-white/80 transition-colors">
                          {String(rank).padStart(2, '0')}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden border border-white/[0.08]">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-white/70 text-sm">{user.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="font-bold text-white text-[15px]">@{user.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-indigo-300 font-semibold text-sm">Lvl {user.current_level}</span>
                          <span className="text-white/30 text-xs uppercase tracking-wider font-bold">{user.badge_tier}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-md text-orange-400">
                            <Flame className="w-4 h-4 fill-orange-500/20" />
                            <span className="font-bold text-sm">{user.streak_count || 0}</span>
                          </div>
                          <div className="text-white/40 text-xs font-medium flex items-center gap-1">
                            <span className="uppercase tracking-widest text-[10px]">Max</span>
                            <span className="font-mono text-white/70">{user.max_streak || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-lg">
                          {user.xp_points.toLocaleString()}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
