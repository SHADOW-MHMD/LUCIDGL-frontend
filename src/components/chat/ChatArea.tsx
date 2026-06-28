import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Hash, Users, Trash2, MoreHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SupabaseMessage } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { LevelBadge } from "@/components/ui/LevelBadge";

interface ChatAreaProps {
  channelId: string;
  channelName: string;
  type: 'community' | 'dm';
  communityRole?: string;
  onChannelDeleted?: () => void;
}

// ContextMenu imported from ui/ContextMenu

const userLevelCache: Record<string, any> = {};

export function ChatArea({ channelId, channelName, type, communityRole, onChannelDeleted }: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = communityRole === 'owner' || communityRole === 'admin';

  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, channel_id, user_id, text, created_at, profiles(id, username, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data && isMounted) {
        let msgs = data.reverse() as unknown as SupabaseMessage[];
        
        // Fetch gamification from D1 for all unique users
        const userIds = [...new Set(msgs.map(m => m.user_id))];
        if (userIds.length > 0 && user) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://lucid-gl.muhammed1515mishal.workers.dev'}/api/gamification/levels`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(user as any).access_token || ''}`
              },
              body: JSON.stringify({ userIds })
            });
            const levelsMap = await res.json();
            Object.assign(userLevelCache, levelsMap);
            msgs = msgs.map(m => {
              if (levelsMap[m.user_id] && m.profiles) {
                m.profiles = { ...m.profiles, ...levelsMap[m.user_id] };
              }
              return m;
            });
          } catch(e) {}
        }
        
        setMessages(msgs);
      }
      if (isMounted) setLoading(false);
    };
    fetchMessages();

    const sub = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, async payload => {
        const { data: profile } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', payload.new.user_id).single();
        let finalProfile = profile;
        if (user && finalProfile) {
          try {
            if (userLevelCache[payload.new.user_id]) {
              finalProfile = { ...finalProfile, ...userLevelCache[payload.new.user_id] };
            } else {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://lucid-gl.muhammed1515mishal.workers.dev'}/api/gamification/levels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(user as any).access_token || ''}` },
                body: JSON.stringify({ userIds: [payload.new.user_id] })
              });
              const levelsMap = await res.json();
              if (levelsMap[payload.new.user_id]) {
                userLevelCache[payload.new.user_id] = levelsMap[payload.new.user_id];
                finalProfile = { ...finalProfile, ...levelsMap[payload.new.user_id] };
              }
            }
          } catch(e) {}
        }
        if (isMounted) setMessages(prev => [...prev, { ...payload.new, profiles: finalProfile } as SupabaseMessage]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, payload => {
        if (isMounted) setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { isMounted = false; supabase.removeChannel(sub); };
  }, [channelId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const deleteMessage = useCallback(async (msgId: string) => {
    const prevMessages = [...messages];
    setMessages(prev => prev.filter(m => m.id !== msgId));
    
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (error) {
      console.error("Failed to delete message:", error);
      alert(`Failed to delete message: ${error.message}`);
      setMessages(prevMessages);
    }
  }, [messages]);

  const handleMsgContextMenu = (e: React.MouseEvent, msg: SupabaseMessage) => {
    const canDelete = msg.user_id === user?.id || isAdmin;
    if (!canDelete) return;
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, msgId: msg.id });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const t = text;
    setText("");
    const { error } = await supabase.from('messages').insert({ channel_id: channelId, user_id: user.id, text: t.trim() });
    if (error) {
      console.error("Failed to send:", error);
      setText(t);
      alert("Failed to send message.");
    } else {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://lucid-gl.muhammed1515mishal.workers.dev'}/api/gamification/record-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(user as any).access_token || ''}`
        }
      }).catch(console.error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-md relative">
      <div className="h-14 border-b border-white/10 flex items-center px-5 shrink-0 z-10 bg-white/5 justify-between">
        <div className="flex items-center gap-2">
          {type === 'community' ? <Hash className="w-5 h-5 text-white/50" /> : <Users className="w-5 h-5 text-white/50" />}
          <h3 className="text-white font-semibold">{channelName}</h3>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-0.5 no-scrollbar">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end pb-8">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              {type === 'community' ? <Hash className="w-8 h-8 text-white/60" /> : <Users className="w-8 h-8 text-white/60" />}
            </div>
            <h1 className="text-white font-bold text-3xl mb-2">Welcome to #{channelName}!</h1>
            <p className="text-white/50">This is the beginning of this channel's history.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isConsecutive = idx > 0 && messages[idx - 1].user_id === msg.user_id &&
              (new Date(msg.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime()) < 5 * 60 * 1000;
            const isMe = msg.user_id === user?.id;
            const canDelete = isMe || isAdmin;

            return (
              <div
                key={msg.id}
                className={`group relative flex gap-4 px-4 py-0.5 rounded-md hover:bg-white/5 transition-colors ${isConsecutive ? 'mt-0' : 'mt-4'}`}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
                onContextMenu={e => handleMsgContextMenu(e, msg)}
              >
                {!isConsecutive ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0 overflow-hidden shadow-md mt-0.5">
                    {msg.profiles?.avatar_url && <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                ) : (
                  <div className="w-10 shrink-0 flex justify-center items-center">
                    <span className="text-[10px] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {!isConsecutive && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-medium text-white text-[15px]">{msg.profiles?.username || 'Unknown'}</span>
                      <LevelBadge level={(msg.profiles as any)?.current_level || 0} />
                      <span className="text-[11px] text-white/40">
                        {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  <p className="text-white/90 text-sm leading-relaxed break-words">{msg.text}</p>
                </div>

                {/* Discord-style action toolbar — fades in on hover */}
                {hoveredMsgId === msg.id && canDelete && (
                  <div className="absolute right-4 -top-4 flex items-center gap-0.5 bg-[#2b2d31] border border-white/10 rounded-md shadow-lg py-0.5 px-1">
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, msgId: msg.id }); }}
                      onClick={e => setCtxMenu({ x: e.clientX, y: e.clientY, msgId: msg.id })}
                      className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      title="More"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Right-click context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: 'Delete Message', danger: true, onClick: () => deleteMessage(ctxMenu.msgId) },
          ]}
        />
      )}

      {/* Input */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          {/* ponytail: delete channel trigger moved to server settings — no button here */}
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Message ${type === 'dm' ? channelName : `#${channelName}`}`}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 disabled:opacity-30 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
