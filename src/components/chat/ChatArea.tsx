import { useState, useEffect, useRef } from "react";
import { Send, Hash, Users, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SupabaseMessage } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface ChatAreaProps {
  channelId: string;
  channelName: string;
  type: 'community' | 'dm';
  communityRole?: string; // 'owner' | 'admin' | 'member' | undefined
  onChannelDeleted?: () => void;
}

export function ChatArea({ channelId, channelName, type, communityRole, onChannelDeleted }: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = communityRole === 'owner' || communityRole === 'admin';

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, channel_id, user_id, text, created_at,
          profiles ( id, username, avatar_url )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error("Failed to fetch messages", error);
      } else if (isMounted) {
        setMessages(data as any);
      }
      if (isMounted) setLoading(false);
    };

    fetchMessages();

    const sub = supabase
      .channel(`room:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();
          const newMessage = { ...payload.new, profiles: profile } as SupabaseMessage;
          if (isMounted) setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          // ponytail: realtime delete — remove from local state immediately
          if (isMounted) setMessages((prev) => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(sub);
    };
  }, [channelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDeleteMessage = async (msgId: string) => {
    // Optimistic removal
    setMessages((prev) => prev.filter(m => m.id !== msgId));
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (error) {
      console.error("Failed to delete message", error);
      // Re-fetch to restore if it failed
      const { data } = await supabase
        .from('messages')
        .select('id, channel_id, user_id, text, created_at, profiles(id, username, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setMessages(data as any);
    }
  };

  const handleDeleteChannel = async () => {
    if (!window.confirm("Delete this channel and all its messages?")) return;
    const { error } = await supabase.from('channels').delete().eq('id', channelId);
    if (error) {
      console.error("Failed to delete channel", error);
    } else {
      onChannelDeleted?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const currentText = text;
    setText("");

    const { error } = await supabase.from("messages").insert({
      channel_id: channelId,
      user_id: user.id,
      text: currentText.trim(),
    });

    if (error) {
      console.error("Failed to send message", error);
      setText(currentText);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-md relative">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center px-5 shadow-sm shrink-0 z-10 bg-white/5 justify-between">
        <div className="flex items-center">
          {type === 'community' ? (
            <Hash className="w-6 h-6 text-white/50 mr-2" />
          ) : (
            <Users className="w-5 h-5 text-white/50 mr-2" />
          )}
          <h3 className="text-white font-bold tracking-wide">{channelName || "unknown-channel"}</h3>
        </div>
        {/* ponytail: delete channel only visible to admin/owner */}
        {type === 'community' && isAdmin && (
          <button
            onClick={handleDeleteChannel}
            className="text-white/30 hover:text-red-400 transition-colors p-2"
            title="Delete Channel"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar scroll-smooth"
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end pb-8">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              {type === 'community' ? <Hash className="w-10 h-10 text-white/80" /> : <Users className="w-10 h-10 text-white/80" />}
            </div>
            <h1 className="text-white font-bold text-4xl mb-3 tracking-tight">Welcome to #{channelName}!</h1>
            <p className="text-white/60 text-lg">This is the start of the {type === 'community' ? 'channel' : 'direct message history'}.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isConsecutive = idx > 0 && messages[idx - 1].user_id === msg.user_id;
            const isMe = msg.user_id === user?.id;
            // ponytail: admins can delete any message; users can delete their own
            const canDelete = isMe || isAdmin;

            return (
              <div key={msg.id} className={`flex gap-4 group ${isConsecutive ? 'mt-0' : 'mt-4'}`}>
                {!isConsecutive ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 overflow-hidden shadow-md">
                    {msg.profiles?.avatar_url && (
                      <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ) : (
                  <div className="w-10 shrink-0 opacity-0 group-hover:opacity-100 flex justify-center items-center">
                    <span className="text-[10px] text-white/40">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {!isConsecutive && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-white font-medium hover:underline cursor-pointer">
                        {msg.profiles?.username || "Unknown User"}
                      </span>
                      <span className="text-xs text-white/40">
                        {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <p className="text-white/90 leading-relaxed break-words flex-1">{msg.text}</p>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all shrink-0 rounded"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message #${channelName}`}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-md shadow-lg"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
