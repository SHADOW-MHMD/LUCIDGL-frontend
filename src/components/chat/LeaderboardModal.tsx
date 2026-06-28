import { useState, useEffect } from "react";
import { X, Trophy, Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import { LevelBadge } from "@/components/ui/LevelBadge";

interface LeaderboardModalProps {
  communityId: string | null;
  onClose: () => void;
}

export function LeaderboardModal({ communityId, onClose }: LeaderboardModalProps) {
  const [tab, setTab] = useState<'global' | 'community'>('global');
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://lucid-gl.muhammed1515mishal.workers.dev'}/api/users/leaderboard`);
        const data = await res.json();
        
        let profs = data.map((d: any) => ({
          id: d.id,
          username: d.username,
          total_xp: d.xp_points,
          current_streak: d.streak_count,
          current_level: 0,
          badge_tier: d.badge_tier,
          avatar_url: '' // Will need to resolve avatars if needed
        }));

        profs = profs.map((p: any) => {
          let lvl = 0;
          let xp = p.total_xp || 0;
          while (xp >= (5 * Math.pow(lvl + 1, 2) + 50 * (lvl + 1) + 100)) lvl++;
          p.current_level = lvl;
          return p;
        });

        if (tab === 'community' && communityId) {
          // Filter to only community members
          const { data: members } = await supabase.from('community_members').select('user_id').eq('community_id', communityId);
          if (members) {
            const memberIds = new Set(members.map(m => m.user_id));
            profs = profs.filter((p: any) => memberIds.has(p.id));
          }
        }
        
        setLeaders(profs);
      } catch(e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchLeaders();
  }, [tab, communityId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111214] w-full max-w-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold text-lg">Leaderboard</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {communityId && (
          <div className="flex px-4 pt-4 gap-4 border-b border-white/10">
            <button
              onClick={() => setTab('global')}
              className={`pb-3 text-sm font-bold transition-colors border-b-2 ${tab === 'global' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
            >
              Global Top 100
            </button>
            <button
              onClick={() => setTab('community')}
              className={`pb-3 text-sm font-bold transition-colors border-b-2 ${tab === 'community' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
            >
              This Server
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 no-scrollbar">
          {loading ? (
            <p className="text-white/40 text-center py-8">Loading ranks...</p>
          ) : leaders.length === 0 ? (
            <p className="text-white/40 text-center py-8">No data found.</p>
          ) : (
            leaders.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                <span className={`w-6 font-black text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/30'}`}>
                  #{i + 1}
                </span>
                <div className="w-10 h-10 rounded-full bg-white/10 shrink-0 overflow-hidden">
                  {u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold truncate">{u.username}</span>
                    <LevelBadge level={u.current_level || 0} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-medium">
                    <span className="text-indigo-300">{u.total_xp || 0} XP</span>
                    <span className="text-orange-400 flex items-center gap-0.5">
                      <Flame className="w-3 h-3" />
                      {u.current_streak || 0} Day Streak
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
