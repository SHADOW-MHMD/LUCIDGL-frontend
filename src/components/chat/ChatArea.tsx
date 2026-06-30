import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Hash, Users, Trash2, MoreHorizontal, Smile, Edit2, Paperclip, Mic, Info, X, ShieldAlert, UserMinus, Settings, Lock, Unlock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { SupabaseMessage, Community, Profile } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { LevelBadge } from "@/components/ui/LevelBadge";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { motion, AnimatePresence } from "framer-motion";

interface MemberWithRole extends Profile { role: string; }

interface ChatAreaProps {
  channelId: string;
  channelName: string;
  type: 'community' | 'dm';
  communityRole?: string;
  avatarUrl?: string;
  selectedCommunity?: Community;
  members?: MemberWithRole[];
  onChannelDeleted?: () => void;
}

const userLevelCache: Record<string, any> = {};

export function ChatArea({ channelId, channelName, type, communityRole, avatarUrl, selectedCommunity, members = [], onChannelDeleted }: ChatAreaProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; msgId: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, { username: string }>>({});
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(selectedCommunity?.is_private ?? false);

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
        return <span key={i} className="text-cyan-400 font-semibold">{part}</span>;
      }
      if (/^https?:\/\/\S+$/.test(part)) {
        return <a key={i} href={part} target="_blank" rel="noreferrer" className="text-blue-400 underline">{part}</a>;
      }
      return part;
    });
  };

  const handleTogglePrivacy = async () => {
    if (!selectedCommunity || !isAdmin) return;
    const newVal = !isPrivate;
    setIsPrivate(newVal);
    await supabase.from('communities').update({ is_private: newVal }).eq('id', selectedCommunity.id);
  };

  const handleKickUser = async (userId: string) => {
    if (!selectedCommunity || !isAdmin) return;
    if (window.confirm("Are you sure you want to kick this user?")) {
      await supabase.from('community_members').delete().eq('community_id', selectedCommunity.id).eq('user_id', userId);
    }
  };

  const handleDeleteChannelHub = async () => {
    if (!isAdmin) return;
    if (window.confirm("Are you sure you want to delete this channel hub?")) {
      await supabase.from('channels').delete().eq('id', channelId);
      if (onChannelDeleted) onChannelDeleted();
    }
  };

  const typingArray = Object.values(typingUsers);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] relative w-full overflow-hidden">
      {/* Top Header */}
      <div className="h-16 border-b border-white/[0.08] flex items-center px-6 shrink-0 z-10 bg-[#0a0a0f] justify-between">
        <div className="flex items-center gap-3">
          {type === 'dm' ? (
            avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-300 font-bold">
                {channelName.charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
              <Hash className="w-5 h-5 text-white/50" />
            </div>
          )}
          <div>
            <h3 className="text-white font-semibold text-[15px]">{channelName}</h3>
            <p className="text-white/40 text-[13px]">
              {type === 'dm' ? (typingArray.length > 0 ? "typing..." : "online") : `${messages.length} messages`}
            </p>
          </div>
        </div>
        
        {type === 'community' && (
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Community Overlay Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedCommunity && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute right-0 top-0 h-full w-[350px] bg-[#0a0a0f]/95 backdrop-blur-xl border-l border-white/[0.08] z-50 shadow-2xl flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.08] shrink-0">
               <h2 className="text-white font-semibold flex items-center gap-2"><Settings className="w-4 h-4"/> Community Info</h2>
               <button onClick={() => setIsDrawerOpen(false)} className="text-white/50 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
               {/* Section 1: Profile & Metadata */}
               <div className="flex flex-col items-center text-center">
                  {selectedCommunity.logo_url ? (
                    <img src={selectedCommunity.logo_url} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 border-white/[0.08] shadow-lg mb-4" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-300 font-bold text-3xl border-2 border-violet-500/30 shadow-lg mb-4">
                      {selectedCommunity.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white/90">{selectedCommunity.name}</h3>
                  <p className="text-white/50 text-sm mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                  
                  {isAdmin && (
                    <div className="mt-6 w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between cursor-pointer hover:bg-white/[0.05] transition-colors" onClick={handleTogglePrivacy}>
                      <div className="flex items-center gap-3">
                        {isPrivate ? <Lock className="w-5 h-5 text-rose-400" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
                        <div className="text-left">
                          <p className="text-white/90 text-sm font-medium">{isPrivate ? "Restricted Private" : "Public Space"}</p>
                          <p className="text-white/40 text-xs">Channel Privacy Status</p>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPrivate ? 'bg-violet-600' : 'bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  )}
               </div>

               {/* Section 2: Member Registry */}
               <div>
                 <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-1">Registry</h4>
                 <div className="space-y-1 bg-white/[0.02] border border-white/[0.08] rounded-xl p-2">
                   {members.map(member => (
                     <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
                        <div className="relative">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm">
                              {member.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0f] bg-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/90 text-sm font-medium truncate">{member.username}</p>
                          <p className={`text-[11px] font-medium ${member.role === 'owner' ? 'text-amber-400' : member.role === 'admin' ? 'text-cyan-400' : 'text-white/40'}`}>
                            {member.role === 'owner' ? 'Creator' : member.role === 'admin' ? 'Admin' : 'Member'}
                          </p>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Section 3: Admin Power Console */}
               {isAdmin && (
                 <div>
                   <h4 className="text-xs font-semibold text-rose-400/70 uppercase tracking-wider mb-3 px-1">Power Console</h4>
                   <div className="space-y-2">
                     <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] text-white/70 hover:text-white transition-colors text-left text-sm font-medium">
                       <ShieldAlert className="w-4 h-4 text-cyan-400" /> Assign Admin Privileges
                     </button>
                     <button onClick={() => handleKickUser(members[members.length - 1]?.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors text-left text-sm font-medium">
                       <UserMinus className="w-4 h-4" /> Kick User from Space
                     </button>
                     <button onClick={handleDeleteChannelHub} className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors text-left text-sm font-medium">
                       <Trash2 className="w-4 h-4" /> Delete Channel Hub
                     </button>
                   </div>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 no-scrollbar bg-[url('/chat-pattern.png')] bg-repeat bg-black/20 bg-blend-overlay">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              {type === 'community' ? <Hash className="w-8 h-8 text-white/40" /> : <Users className="w-8 h-8 text-white/40" />}
            </div>
            <h1 className="text-white font-medium text-lg mb-1">No messages here yet...</h1>
            <p className="text-white/40 text-sm">Send a message or reply with a sticker.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === user?.id;
            const isConsecutive = idx > 0 && messages[idx - 1].user_id === msg.user_id &&
              (new Date(msg.created_at).getTime() - new Date(messages[idx - 1].created_at).getTime()) < 5 * 60 * 1000;
            const canDelete = isMe || isAdmin;
            
            let reactionsArray: any[] = [];
            if (msg.reactions) {
              reactionsArray = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions;
            }

            return (
              <div
                key={msg.id}
                className={`group relative flex gap-3 max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'} ${isConsecutive ? 'mt-0' : 'mt-2'}`}
                onContextMenu={e => handleMsgContextMenu(e, msg)}
              >
                {!isConsecutive && !isMe ? (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shrink-0 overflow-hidden mt-auto mb-1">
                    {msg.profiles?.avatar_url && <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                ) : !isConsecutive && isMe ? (
                   <div className="w-9 shrink-0" /> 
                ) : (
                  <div className="w-9 shrink-0" />
                )}

                <div className={`relative flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isConsecutive && !isMe && type === 'community' && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="font-medium text-violet-400 text-[13px]">{msg.profiles?.username || 'Unknown'}</span>
                      <LevelBadge level={(msg.profiles as any)?.current_level || 0} />
                    </div>
                  )}
                  
                  <div className={`relative px-4 py-2.5 rounded-2xl ${
                    isMe 
                      ? 'bg-violet-600 text-white rounded-br-sm' 
                      : 'bg-white/[0.08] text-white rounded-bl-sm'
                  }`}>
                    {editingMessageId === msg.id ? (
                      <div className="min-w-[200px]">
                        <input 
                          type="text" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSubmit(msg.id);
                            if (e.key === 'Escape') setEditingMessageId(null);
                          }}
                          autoFocus
                          className="w-full bg-black/40 border border-violet-500/50 text-white rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 text-[15px]" 
                        />
                        <div className="text-[10px] text-white/60 mt-1">escape to cancel, enter to save</div>
                      </div>
                    ) : (
                      <div className="flex items-end gap-3">
                        <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">
                          {renderText(msg.text)}
                        </p>
                        <span className={`text-[11px] shrink-0 translate-y-0.5 ${isMe ? 'text-violet-200/70' : 'text-white/40'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.is_edited && ' (edited)'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {reactionsArray.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {reactionsArray.map((r, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleReact(r.emoji, msg.id, reactionsArray)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${r.userIds.includes(user?.id) ? 'bg-violet-500/20 border-violet-500/50 text-violet-200' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-medium">{r.userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hover actions */}
                  <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#1a1b26] border border-white/10 rounded-xl shadow-lg py-1 px-1 z-10 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                    <button onClick={() => setShowEmojiPicker(msg.id)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    {isMe && (
                      <button onClick={() => { setEditingMessageId(msg.id); setEditValue(msg.text); }} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => deleteMessage(msg.id)} className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Emoji Picker */}
                  {showEmojiPicker === msg.id && (
                    <div className={`absolute top-0 z-50 ${isMe ? 'right-full mr-12' : 'left-full ml-12'}`}>
                      <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(null)} />
                      <div className="relative z-50 shadow-2xl border border-white/10 rounded-xl overflow-hidden">
                        <Picker data={data} onEmojiSelect={(e: any) => handleReact(e.native, msg.id, msg.reactions)} theme="dark" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Bar */}
      <div className="shrink-0 bg-[#0a0a0f]">
        {typingArray.length > 0 && (
          <div className="px-6 py-1 text-[13px] text-violet-400 font-medium">
            {typingArray.length === 1 
              ? `${typingArray[0].username} is typing...` 
              : typingArray.length === 2 
                ? `${typingArray[0].username} and ${typingArray[1].username} are typing...` 
                : 'Several people are typing...'}
          </div>
        )}
        <div className="px-4 pb-4 pt-2">
          <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
            <button type="button" className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors shrink-0 mb-1">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-white/[0.05] rounded-3xl flex items-end">
              <textarea
                value={text}
                onChange={handleTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Write a message..."
                rows={1}
                className="w-full bg-transparent text-white placeholder-white/40 px-4 py-3 focus:outline-none resize-none max-h-32 text-[15px]"
                style={{ minHeight: '44px' }}
              />
              <button type="button" className="p-3 text-white/40 hover:text-white transition-colors shrink-0">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            {text.trim() ? (
              <button
                type="submit"
                className="p-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full transition-colors shrink-0 mb-0.5 shadow-lg shadow-violet-500/20"
              >
                <Send className="w-5 h-5 -ml-0.5" />
              </button>
            ) : (
              <button type="button" className="p-3.5 bg-white/[0.05] hover:bg-white/[0.1] text-white/60 rounded-full transition-colors shrink-0 mb-0.5">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
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
    </div>
  );
}
