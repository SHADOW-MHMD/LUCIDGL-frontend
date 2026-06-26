import { useState, useEffect, useRef } from "react";
import { Send, Hash, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SupabaseMessage } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface ChatAreaProps {
  channelId: string;
  channelName: string;
  type: 'community' | 'dm';
}

export function ChatArea({ channelId, channelName, type }: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    // Subscribe to new messages
    const channel = supabase
      .channel(`room:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            profiles: profile
          } as SupabaseMessage;

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      setText(currentText); // Restore if failed
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#36393f] relative">
      {/* Header */}
      <div className="h-12 border-b border-[#202225] flex items-center px-4 shadow-sm shrink-0 z-10 bg-[#36393f]">
        {type === 'community' ? (
          <Hash className="w-6 h-6 text-[#72767d] mr-2" />
        ) : (
          <Users className="w-5 h-5 text-[#72767d] mr-2" />
        )}
        <h3 className="text-white font-bold">{channelName || "unknown-channel"}</h3>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar scroll-smooth"
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end pb-8">
            <div className="w-16 h-16 rounded-full bg-[#4f545c] flex items-center justify-center mb-4">
              {type === 'community' ? <Hash className="w-8 h-8 text-white" /> : <Users className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-white font-bold text-3xl mb-2">Welcome to #{channelName}!</h1>
            <p className="text-[#b9bbbe]">This is the start of the {type === 'community' ? 'channel' : 'direct message history'}.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isConsecutive = idx > 0 && messages[idx - 1].user_id === msg.user_id;
            
            return (
              <div key={msg.id} className={`flex gap-4 group ${isConsecutive ? 'mt-0' : 'mt-4'}`}>
                {!isConsecutive ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 overflow-hidden">
                    {msg.profiles?.avatar_url && (
                      <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                ) : (
                  <div className="w-10 shrink-0 opacity-0 group-hover:opacity-100 flex justify-center items-center">
                    <span className="text-[10px] text-[#72767d]">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                
                <div className="flex-1">
                  {!isConsecutive && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-white font-medium hover:underline cursor-pointer">
                        {msg.profiles?.username || "Unknown User"}
                      </span>
                      <span className="text-xs text-[#72767d]">
                        {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <p className="text-[#dcddde] leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message #${channelName}`}
            className="w-full bg-[#40444b] text-[#dcddde] placeholder-[#72767d] rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-[#5865F2] transition-all"
          />
          <button 
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 p-1.5 rounded-md hover:bg-[#5865F2] text-[#b9bbbe] hover:text-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
