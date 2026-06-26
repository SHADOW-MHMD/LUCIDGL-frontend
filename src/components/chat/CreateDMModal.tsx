import { useState, useEffect } from "react";
import { X, Search, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface CreateDMModalProps {
  onClose: () => void;
  onCreated: (channelId: string) => void;
}

export function CreateDMModal({ onClose, onCreated }: CreateDMModalProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', user?.id)
        .limit(20);
      if (data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, [user]);

  const handleCreateDM = async (targetUserId: string, targetUsername: string) => {
    if (!user) return;
    try {
      // Create a DM channel
      const { data: channel, error: chError } = await supabase
        .from('channels')
        .insert({ type: 'dm', name: targetUsername })
        .select()
        .single();
        
      if (chError) throw chError;

      // Add both users to channel_members
      await supabase.from('channel_members').insert([
        { channel_id: channel.id, user_id: user.id },
        { channel_id: channel.id, user_id: targetUserId }
      ]);

      onCreated(channel.id);
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
            placeholder="Search friends..." 
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-blue-500 transition-all"
          />
          <Search className="w-5 h-5 text-white/30 absolute left-4 top-3.5" />
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
          {loading ? (
            <p className="text-white/40 text-center py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-white/40 text-center py-8">No users found.</p>
          ) : (
            users.map(u => (
              <button 
                key={u.id}
                onClick={() => handleCreateDM(u.id, u.username)}
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
