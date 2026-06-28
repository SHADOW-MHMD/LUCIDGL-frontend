import { useState, useEffect } from "react";
import { X, Search, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface CreateDMModalProps {
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

interface Profile { id: string; username: string; avatar_url?: string; }

export function CreateDMModal({ onClose, onCreated }: CreateDMModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // ponytail: search on type, debounce not needed at this scale
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

  const handleCreateDM = async (targetUserId: string) => {
    if (!user) return;
    try {
      // ponytail: dedup — check for existing DM between these two users
      const { data: existing } = await supabase
        .from('channel_members')
        .select('channel_id, channels!inner(id, type)')
        .eq('user_id', user.id);

      if (existing) {
        const myChannelIds = existing
          .filter((m: any) => m.channels?.type === 'dm')
          .map((m: any) => m.channel_id);

        if (myChannelIds.length > 0) {
          const { data: shared } = await supabase
            .from('channel_members')
            .select('channel_id')
            .eq('user_id', targetUserId)
            .in('channel_id', myChannelIds);

          if (shared && shared.length > 0) {
            // DM already exists — just open it
            onCreated(shared[0].channel_id);
            return;
          }
        }
      }

      // Create a DM channel with a client-generated UUID to avoid RLS SELECT issues
      const channelId = crypto.randomUUID();
      const { error: chError } = await supabase
        .from('channels')
        .insert({ id: channelId, type: 'dm', name: null });

      if (chError) throw chError;

      await supabase.from('channel_members').insert([
        { channel_id: channelId, user_id: user.id },
        { channel_id: channelId, user_id: targetUserId }
      ]);

      onCreated(channelId);
    } catch (err) {
      console.error("Failed to create DM", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            New Direct Message
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
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-blue-500 transition-all"
          />
          <Search className="w-5 h-5 text-white/30 absolute left-4 top-3.5" />
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
          {loading ? (
            <p className="text-white/40 text-center py-8">Searching...</p>
          ) : users.length === 0 ? (
            <p className="text-white/40 text-center py-8">No users found.</p>
          ) : (
            users.map(u => (
              <button
                key={u.id}
                onClick={() => handleCreateDM(u.id)}
                className="flex items-center gap-3 p-3 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl transition-all duration-200 text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-md">
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
