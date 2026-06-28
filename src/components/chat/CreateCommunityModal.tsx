import { useState } from "react";
import { X, Server } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CreateCommunityModalProps {
  onClose: () => void;
  onCreated: (communityId: string) => void;
}

export function CreateCommunityModal({ onClose, onCreated }: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Create community
      const { data: comm, error: commError } = await supabase
        .from("communities")
        .insert({ name, owner_id: session.user.id })
        .select()
        .single();
        
      if (commError) throw commError;

      // Add creator as owner
      await supabase.from("community_members").insert({
        community_id: comm.id,
        user_id: session.user.id,
        role: 'owner'
      });

      // Create a default "general" channel
      const channelId = crypto.randomUUID();
      await supabase.from("channels").insert({
        id: channelId,
        community_id: comm.id,
        name: "general",
        type: "community"
      });

      onCreated(comm.id);
    } catch (err) {
      console.error("Failed to create community", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            Create Your Server
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          Give your new community a personality with a name. You can always change it later.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
              Server Name
            </label>
            <div className="relative">
              <Server className="absolute left-3 top-3.5 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gamer Lounge"
                maxLength={32}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/5 border border-transparent hover:border-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!name.trim() || loading}
              className="px-5 py-2.5 rounded-xl bg-blue-500/80 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
