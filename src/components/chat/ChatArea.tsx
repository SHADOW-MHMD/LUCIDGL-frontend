import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Hash, Users, Trash2, MoreHorizontal, Smile, Edit2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SupabaseMessage } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { LevelBadge } from "@/components/ui/LevelBadge";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface ChatAreaProps {
  channelId: string;
  channelName: string;
  type: 'community' | 'dm';
  communityRole?: string;
  onChannelDeleted?: () => void;
}

const userLevelCache: Record<string, any> = {};

export function ChatArea({ channelId, channelName, type, communityRole, onChannelDeleted }: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, { username: string }>>({});
  
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [currentUserProfileName, setCurrentUserProfileName] = useState("User");

  const isAdmin = communityRole === 'owner' || communityRole === 'admin';

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('username').eq('id', user.id).single().then(({data}) => {
        if (data?.username) setCurrentUserProfileName(data.username);
      });
    }
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, channel_id, user_id, text, created_at, is_edited, reactions, attachments, profiles(id, username, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data && isMounted) {
        let msgs = data.reverse() as unknown as SupabaseMessage[];
        
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, payload => {
        if (isMounted) {
          setMessages(prev => prev.map(m => {
            if (m.id === payload.new.id) {
              return { ...m, ...payload.new, profiles: m.profiles };
            }
            return m;
          }));
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, payload => {
        if (isMounted) setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { isMounted = false; supabase.removeChannel(sub); };
  }, [channelId, user]);

  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase.channel(`room-${channelId}`, {
      config: { presence: { key: user.id } }
    });
    
    presenceChannelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const newTyping: Record<string, { username: string }> = {};
      Object.keys(state).forEach(key => {
        if (key !== user.id) {
          const presences = state[key] as any[];
          const isTyping = presences.some(p => p.typing);
          if (isTyping) {
            newTyping[key] = { username: presences[0].username || 'User' };
          }
        }
      });
      setTypingUsers(newTyping);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, user?.id]);

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

  const handleEditSubmit = async (msgId: string) => {
    if (!editValue.trim()) {
      setEditingMessageId(null);
      return;
    }
    const { error } = await supabase.from('messages').update({ text: editValue.trim(), is_edited: true }).eq('id', msgId);
    if (error) {
      console.error("Failed to edit:", error);
      alert("Failed to edit message.");
    }
    setEditingMessageId(null);
  };

  const handleReact = async (emoji: string, msgId: string, currentReactions: any) => {
    let reactions = currentReactions ? (typeof currentReactions === 'string' ? JSON.parse(currentReactions) : currentReactions) : [];
    if (!Array.isArray(reactions)) reactions = [];
    
    const existingIndex = reactions.findIndex((r: any) => r.emoji === emoji);
    if (existingIndex > -1) {
      if (!reactions[existingIndex].userIds.includes(user?.id)) {
        reactions[existingIndex].userIds.push(user?.id);
      } else {
        reactions[existingIndex].userIds = reactions[existingIndex].userIds.filter((id: string) => id !== user?.id);
        if (reactions[existingIndex].userIds.length === 0) {
          reactions.splice(existingIndex, 1);
        }
      }
    } else {
      reactions.push({ emoji, userIds: [user?.id] });
    }
    
    const stringified = JSON.stringify(reactions);
    const { error } = await supabase.from('messages').update({ reactions: stringified }).eq('id', msgId);
    if (error) {
      console.error("Failed to add reaction:", error);
    }
    setShowEmojiPicker(null);
  };

  const handleMsgContextMenu = (e: React.MouseEvent, msg: SupabaseMessage) => {
    const canDelete = msg.user_id === user?.id || isAdmin;
    if (!canDelete) return;
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, msgId: msg.id });
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !user) return;
    const t = text;
    setText("");
    
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({ user_id: user.id, username: currentUserProfileName, typing: false });
    }

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (presenceChannelRef.current && user?.id) {
      presenceChannelRef.current.track({
        user_id: user.id,
        username: currentUserProfileName,
        typing: e.target.value.length > 0
      });
    }
  };

  const renderText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/g);
    return parts.map((part, i) => {
      if (/^@[a-zA-Z0-9_]+$/.test(part)) {
        return <span key={i} className="text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">{part}</span>;
      }
      if (/^https?:\/\/\S+$/.test(part)) {
        return <a key={i} href={part} target="_blank" rel="noreferrer" className="text-blue-400 underline">{part}</a>;
      }
      return part;
    });
  };

  const typingArray = Object.values(typingUsers);

  return (
    <div className="flex flex-col h-full bg-white/[0.02] backdrop-blur-lg relative shadow-2xl">
      <div className="h-16 border-b border-white/[0.1] flex items-center px-8 shrink-0 z-10 bg-white/[0.02] justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          {type === 'community' ? <Hash className="w-5 h-5 text-white/50" /> : <Users className="w-5 h-5 text-white/50" />}
          <h3 className="text-white font-semibold">{channelName}</h3>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 flex flex-col gap-2 no-scrollbar">
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
            
            let reactionsArray: any[] = [];
            if (msg.reactions) {
              reactionsArray = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions;
            }

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
                  
                  {editingMessageId === msg.id ? (
                    <div className="mt-1">
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSubmit(msg.id);
                          if (e.key === 'Escape') setEditingMessageId(null);
                        }}
                        autoFocus
                        className="w-full bg-black/40 border border-blue-500/50 text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                      <div className="text-[10px] text-white/40 mt-1">escape to cancel, enter to save</div>
                    </div>
                  ) : (
                    <p className="text-white/80 text-[15px] leading-8 break-words tracking-wide">
                      {renderText(msg.text)}
                      {msg.is_edited && <span className="text-[10px] text-white/30 ml-2">(edited)</span>}
                    </p>
                  )}
                  
                  {reactionsArray.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reactionsArray.map((r, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleReact(r.emoji, msg.id, reactionsArray)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${r.userIds.includes(user?.id) ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-medium">{r.userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover actions */}
                {hoveredMsgId === msg.id && (
                  <div className="absolute right-4 -top-4 flex items-center gap-0.5 bg-[#2b2d31]/90 backdrop-blur-md border border-white/10 rounded-md shadow-lg py-0.5 px-1 z-10">
                    <button
                      onClick={() => setShowEmojiPicker(msg.id)}
                      className="p-1.5 rounded text-white/50 hover:text-yellow-400 hover:bg-white/10 transition-colors"
                      title="React"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    {isMe && (
                      <button
                        onClick={() => { setEditingMessageId(msg.id); setEditValue(msg.text); }}
                        className="p-1.5 rounded text-white/50 hover:text-blue-400 hover:bg-white/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Emoji Picker */}
                {showEmojiPicker === msg.id && (
                  <div className="absolute right-8 top-0 z-50">
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(null)} />
                    <div className="relative z-50 shadow-2xl border border-white/10 rounded-xl overflow-hidden">
                      <Picker data={data} onEmojiSelect={(e: any) => handleReact(e.native, msg.id, msg.reactions)} theme="dark" />
                    </div>
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
        {typingArray.length > 0 && (
          <div className="px-2 pb-1 text-xs text-white/50 font-medium animate-pulse">
            {typingArray.length === 1 
              ? `${typingArray[0].username} is typing...` 
              : typingArray.length === 2 
                ? `${typingArray[0].username} and ${typingArray[1].username} are typing...` 
                : 'Several people are typing...'}
          </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-center bg-white/[0.03] border border-white/[0.1] rounded-2xl shadow-inner focus-within:ring-1 focus-within:ring-white/20 transition-all duration-300">
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${type === 'dm' ? channelName : `#${channelName}`}`}
            rows={1}
            className="w-full bg-transparent text-white placeholder-white/40 pl-6 pr-14 py-4 focus:outline-none resize-none max-h-32"
            style={{ minHeight: '56px' }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 bottom-2 p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 disabled:opacity-30 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
