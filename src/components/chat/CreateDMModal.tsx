import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
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
      <div className="bg-[#36393f] border border-[#202225] rounded-lg w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Select Friends</h2>
          <button onClick={onClose} className="text-[#a3a6aa] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Type the username of a friend" 
            className="w-full bg-[#202225] text-[#dcddde] rounded px-4 py-2 pl-10 focus:outline-none"
          />
          <Search className="w-4 h-4 text-[#72767d] absolute left-3 top-3" />
        </div>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
          {loading ? (
            <p className="text-[#72767d] text-center py-4">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-[#72767d] text-center py-4">No users found.</p>
          ) : (
            users.map(u => (
              <button 
                key={u.id}
                onClick={() => handleCreateDM(u.id, u.username)}
                className="flex items-center gap-3 p-2 hover:bg-[#40444b] rounded-md transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500 overflow-hidden">
                  {u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="text-[#dcddde] font-medium">{u.username}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
