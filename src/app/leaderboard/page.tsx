"use strict";
"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Flame, Star } from "lucide-react";
import type { User } from "@/types";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const apiUrl = "https://lucid-gl.muhammed1515mishal.workers.dev";
        const res = await fetch(`${apiUrl}/api/users/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setLeaders(data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-t-yellow-400 border-white/10 rounded-full animate-spin"></div>
        <p className="text-white/60 animate-pulse">Calculating Ranks...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 max-w-4xl mx-auto">
      <div className="text-center mb-10 relative">
        <div className="absolute -inset-4 bg-yellow-500/20 blur-3xl rounded-full -z-10"></div>
        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 mb-2">
          Global Vanguard
        </h1>
        <p className="text-slate-400">Top developers ranked by XP and engagement streaks</p>
      </div>

      <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold text-white/50 uppercase tracking-wider bg-black/20">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-4">Developer</div>
          <div className="col-span-3 text-center">XP Points</div>
          <div className="col-span-3 text-center">Streak</div>
        </div>

        <div className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto no-scrollbar">
          {leaders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No ranked developers yet.</div>
          ) : (
            leaders.map((leader, index) => {
              const isTop3 = index < 3;
              return (
                <div 
                  key={leader.id} 
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-all hover:bg-white/5 ${isTop3 ? 'bg-yellow-500/5' : ''}`}
                >
                  <div className="col-span-2 flex justify-center">
                    {index === 0 ? <Medal className="w-7 h-7 text-yellow-400" /> :
                     index === 1 ? <Medal className="w-7 h-7 text-slate-300" /> :
                     index === 2 ? <Medal className="w-7 h-7 text-amber-600" /> :
                     <span className="text-white/40 font-mono text-lg">{index + 1}</span>}
                  </div>
                  
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center">
                      <span className="font-bold text-white uppercase">{leader.username.charAt(0)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white/90">{leader.username}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 w-fit text-white/70 tracking-wider">
                        {leader.badge_tier}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-center items-center gap-1.5 font-mono text-blue-400">
                    <Star className="w-4 h-4" />
                    {leader.xp_points.toLocaleString()}
                  </div>

                  <div className="col-span-3 flex justify-center items-center gap-1.5 font-mono text-orange-400">
                    <Flame className="w-4 h-4" />
                    {leader.streak_count}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
