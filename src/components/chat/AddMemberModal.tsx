import { useState, useEffect } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface AddMemberModalProps {
  communityId: string;
  onClose: () => void;
  onAdded: () => void;
}

interface Profile { id: string; username: string; avatar_url?: string; }

export function AddMemberModal({ communityId, onClose, onAdded }: AddMemberModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());

  // ponytail: load existing member IDs once so we can filter them out
  useEffect(() => {
    if (!communityId) return;
    supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId)
      .then(({ data }) => {
        if (data) setExistingIds(new Set(data.map(m => m.user_id)));
      });
  }, [communityId]);

  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      setLoading(true);
      const req = supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', user.id)
        .order('username')
        .limit(20);
      if (query.trim().length >= 1) req.ilike('username', `%${query.trim()}%`);
      const { data } = await req;
      if (data) setUsers(data as Profile[]);
      setLoading(false);
    };
    fetchUsers();
  }, [user, query]);

  const handleAddMember = async (targetUserId: string) => {
    const { error } = await supabase
      .from('community_members')
      .insert([{ community_id: communityId, user_id: targetUserId, role: 'member' }]);

    if (error) {
      console.error("Failed to add member", error);
    } else {
      setExistingIds(prev => new Set([...prev, targetUserId]));
      onAdded();
    }
  };

  const filteredUsers = users.filter(u => !existingIds.has(u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            Add Member
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            autoFocus
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-emerald-500 transition-all"
          />
          <Search className="w-5 h-5 text-white/30 absolute left-4 top-3.5" />
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
          {loading ? (
            <p className="text-white/40 text-center py-8">Searching...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-white/40 text-center py-8">No users found.</p>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => handleAddMember(u.id)}
                className="flex items-center gap-3 p-3 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl transition-all duration-200 text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 overflow-hidden shadow-md">
                  {u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-white/80 group-hover:text-white font-medium">{u.username}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
