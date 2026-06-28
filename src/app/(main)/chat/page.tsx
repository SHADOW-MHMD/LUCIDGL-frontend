"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Send, Sparkles, Loader2, Hash, MessageSquare, Plus, Users, Image as ImageIcon, Trash2, X, MoreVertical, LogOut, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

const API_URL = "https://lucid-gl.muhammed1515mishal.workers.dev";
const POLL_INTERVAL_MS = 3000;

type Community = { id: string, name: string, owner_id: string, is_private: number };
type Channel = { id: string, name: string, community_id: string };
type DM = { id: string, target_user: { id: string, username: string, badge_tier?: string } };
type Member = { id: string, username: string, role: string };

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'communities' | 'dms'>('communities');
  const [activeCommId, setActiveCommId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  
  // Data State
  const [communities, setCommunities] = useState<Community[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<DM[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  
  // UI State
  const [showMembers, setShowMembers] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  // Modals state
  const [newCommName, setNewCommName] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [newDmUserId, setNewDmUserId] = useState("");
  const [joinCommId, setJoinCommId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef(new Set<string>());
  const [isLoading, setIsLoading] = useState(true);

  const authFetch = useCallback(async (url: string, options?: RequestInit) => {
    if (!user) throw new Error("Not authenticated");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res;
  }, [user]);

  // Load Sidebars
  const loadSidebars = useCallback(async () => {
    try {
      const [commRes, dmRes] = await Promise.all([
        authFetch(`${API_URL}/api/chat/communities`),
        authFetch(`${API_URL}/api/chat/dms`)
      ]);
      const commData = await commRes.json();
      const dmData = await dmRes.json();
      setCommunities(commData);
      setDms(dmData);
    } catch (err) {
      console.error("Failed to load sidebars", err);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) loadSidebars();
  }, [user, loadSidebars]);

  // Load Channels when Community changes
  const loadChannelsAndMembers = useCallback(async () => {
    if (!activeCommId || activeTab !== 'communities') return;
    try {
      const [chanRes, memRes] = await Promise.all([
        authFetch(`${API_URL}/api/chat/communities/${activeCommId}/channels`),
        authFetch(`${API_URL}/api/chat/communities/${activeCommId}/members`)
      ]);
      const chanData = await chanRes.json();
      const memData = await memRes.json();
      setChannels(chanData);
      setMembers(memData);
      if (chanData.length > 0 && !channels.find(c => c.id === activeChannelId)) {
        setActiveChannelId(chanData[0].id);
      }
    } catch (err) {
      console.error("Failed to load channels/members", err);
    }
  }, [activeCommId, activeTab, authFetch, activeChannelId, channels]);

  useEffect(() => {
    loadChannelsAndMembers();
  }, [activeCommId, activeTab, loadChannelsAndMembers]);

  // Sync Messages
  const syncMessages = useCallback(async () => {
    if (!user || !activeChannelId) return;
    try {
      const res = await authFetch(`${API_URL}/api/chat/sync/${activeChannelId}`);
      if (!res.ok) return;
      const incoming: ChatMessage[] = await res.json();
      setMessages((prev) => {
        const serverIds = new Set(incoming.map((m) => m.id));
        const optimisticOnly = prev.filter(m => !serverIds.has(m.id) && !knownIdsRef.current.has(m.id));
        for (const m of incoming) knownIdsRef.current.add(m.id);
        return [...incoming, ...optimisticOnly];
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Chat sync failed:", error);
    }
  }, [user, activeChannelId, authFetch]);

  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }
    setMessages([]);
    knownIdsRef.current.clear();
    setIsLoading(true);
    syncMessages();
    const interval = setInterval(syncMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeChannelId, syncMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Actions
  const handleCreateCommunity = async () => {
    if (!newCommName) return;
    await authFetch(`${API_URL}/api/chat/communities`, { method: "POST", body: JSON.stringify({ name: newCommName }) });
    setNewCommName("");
    loadSidebars();
  };

  const handleJoinCommunity = async () => {
    if (!joinCommId) return;
    await authFetch(`${API_URL}/api/chat/communities/${joinCommId}/join`, { method: "POST" });
    setJoinCommId("");
    loadSidebars();
  };

  const handleCreateChannel = async () => {
    if (!newChannelName || !activeCommId) return;
    await authFetch(`${API_URL}/api/chat/communities/${activeCommId}/channels`, { method: "POST", body: JSON.stringify({ name: newChannelName }) });
    setNewChannelName("");
    loadChannelsAndMembers();
  };

  const handleDeleteChannel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await authFetch(`${API_URL}/api/chat/channels/${id}`, { method: "DELETE" });
    if (activeChannelId === id) setActiveChannelId(null);
    loadChannelsAndMembers();
  };

  const handleCreateDM = async () => {
    if (!newDmUserId) return;
    const res = await authFetch(`${API_URL}/api/chat/dms`, { method: "POST", body: JSON.stringify({ targetUserId: newDmUserId }) });
    const data = await res.json();
    setNewDmUserId("");
    loadSidebars();
    setActiveChannelId(data.id);
  };

  const handleDeleteDM = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await authFetch(`${API_URL}/api/chat/dms/${id}`, { method: "DELETE" });
    if (activeChannelId === id) setActiveChannelId(null);
    loadSidebars();
  };

  const handleKickMember = async (targetId: string) => {
    if (!activeCommId) return;
    await authFetch(`${API_URL}/api/chat/communities/${activeCommId}/members/${targetId}`, { method: "DELETE" });
    loadChannelsAndMembers();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !uploadFile) || !user || isSending || !activeChannelId) return;
    setIsSending(true);
    let mediaUrl = null;
    
    if (uploadFile) {
      setIsUploading(true);
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { error } = await supabase.storage.from('chat-media').upload(`uploads/${fileName}`, uploadFile);
      if (!error) {
        const { data } = supabase.storage.from('chat-media').getPublicUrl(`uploads/${fileName}`);
        mediaUrl = data.publicUrl;
      }
      setIsUploading(false);
      setUploadFile(null);
    }

    const optimisticMsg: ChatMessage = {
      id: crypto.randomUUID(), channel_id: activeChannelId, user_id: user.id, username: user.user_metadata?.full_name || "You", text: inputValue.trim(), media_url: mediaUrl, timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue("");
    try {
      await authFetch(`${API_URL}/api/chat/send`, { method: "POST", body: JSON.stringify({ id: optimisticMsg.id, channel_id: activeChannelId, text: optimisticMsg.text, media_url: mediaUrl }) });
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    await authFetch(`${API_URL}/api/chat/messages/${msgId}`, { method: 'DELETE' });
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const currentRole = members.find(m => m.id === user?.id)?.role;
  const isAdmin = currentRole === 'owner' || currentRole === 'admin';

  if (!user && !authLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
      <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-140px)] max-w-[1400px] mx-auto bg-[#0a0a0c] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* Primary Sidebar (Servers) */}
      <div className="w-[80px] bg-black/60 border-r border-white/5 flex flex-col items-center py-4 gap-3 overflow-y-auto no-scrollbar shrink-0">
        <button onClick={() => { setActiveTab('dms'); setActiveChannelId(dms.length > 0 ? dms[0].id : null); }} className={`group relative w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 ${activeTab === 'dms' ? 'bg-indigo-500 text-white rounded-[16px]' : 'bg-white/5 text-white/50 hover:bg-indigo-500/80 hover:text-white'}`}>
          <MessageSquare className="w-6 h-6" />
        </button>
        <div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />
        
        {communities.map(c => (
          <button key={c.id} onClick={() => { setActiveTab('communities'); setActiveCommId(c.id); }} className={`group relative w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center text-lg font-bold uppercase transition-all duration-200 ${activeTab === 'communities' && activeCommId === c.id ? 'bg-purple-600 text-white rounded-[16px]' : 'bg-white/5 text-white/50 hover:bg-purple-600/80 hover:text-white'}`}>
            {c.name.substring(0, 2)}
          </button>
        ))}

        {/* Create Community Mini-Form */}
        <div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />
        <div className="relative group flex flex-col items-center">
          <button className="w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center bg-white/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-200">
            <Plus className="w-6 h-6" />
          </button>
          <div className="absolute left-16 p-3 bg-[#1e1e24] border border-white/10 rounded-xl w-64 hidden group-hover:block z-50 shadow-2xl">
            <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">New Community</h4>
            <div className="flex gap-2">
              <input value={newCommName} onChange={e=>setNewCommName(e.target.value)} placeholder="Name..." className="flex-1 bg-black/50 text-white text-sm rounded-lg px-3 py-2 outline-none border border-transparent focus:border-emerald-500/50" />
              <button onClick={handleCreateCommunity} className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg"><Plus className="w-4 h-4"/></button>
            </div>
            <div className="h-px bg-white/10 my-3"/>
            <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">Join via ID</h4>
            <div className="flex gap-2">
              <input value={joinCommId} onChange={e=>setJoinCommId(e.target.value)} placeholder="UUID..." className="flex-1 bg-black/50 text-white text-sm rounded-lg px-3 py-2 outline-none border border-transparent focus:border-indigo-500/50" />
              <button onClick={handleJoinCommunity} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg"><Search className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Sidebar (Channels / DMs) */}
      <div className="w-64 bg-[#111116] border-r border-white/5 flex flex-col shrink-0">
        <div className="h-14 px-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white tracking-wide truncate">
            {activeTab === 'communities' ? communities.find(c=>c.id===activeCommId)?.name || 'Community' : 'Direct Messages'}
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-[2px] no-scrollbar">
          {activeTab === 'communities' ? (
            <>
              {channels.map(ch => (
                <div key={ch.id} className="group relative">
                  <button onClick={() => setActiveChannelId(ch.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${activeChannelId === ch.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/90'}`}>
                    <Hash className="w-4 h-4 shrink-0 text-white/30" />
                    <span className="truncate text-sm font-medium leading-none">{ch.name}</span>
                  </button>
                  {isAdmin && (
                    <button onClick={(e) => handleDeleteChannel(ch.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded-md transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {isAdmin && (
                <div className="mt-4 px-2">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">New Channel</h4>
                  <div className="flex gap-1">
                    <input value={newChannelName} onChange={e=>setNewChannelName(e.target.value)} placeholder="name" className="flex-1 bg-black/40 text-white text-xs rounded-lg px-2 py-1.5 outline-none" />
                    <button onClick={handleCreateChannel} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg"><Plus className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {dms.map(dm => (
                <div key={dm.id} className="group relative">
                  <button onClick={() => setActiveChannelId(dm.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${activeChannelId === dm.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/90'}`}>
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                       <span className="text-indigo-300 text-xs font-bold">{dm.target_user.username.substring(0,2).toUpperCase()}</span>
                    </div>
                    <span className="truncate text-sm font-medium">{dm.target_user.username}</span>
                  </button>
                  <button onClick={(e) => handleDeleteDM(dm.id, e)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded-md transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="mt-4 px-2">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">New DM (User ID)</h4>
                <div className="flex gap-1">
                  <input value={newDmUserId} onChange={e=>setNewDmUserId(e.target.value)} placeholder="UUID" className="flex-1 bg-black/40 text-white text-xs rounded-lg px-2 py-1.5 outline-none" />
                  <button onClick={handleCreateDM} className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg"><Plus className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#18181b]">
        {/* Header */}
        <div className="h-14 px-4 border-b border-white/5 flex items-center justify-between bg-[#18181b] shadow-sm z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              {activeTab === 'communities' ? <Hash className="w-5 h-5 text-zinc-400"/> : <MessageSquare className="w-5 h-5 text-indigo-400"/>}
              {activeTab === 'communities' ? channels.find(c=>c.id===activeChannelId)?.name || 'Select Channel' : dms.find(d=>d.id===activeChannelId)?.target_user.username || 'Select DM'}
            </h2>
          </div>
          {activeTab === 'communities' && activeChannelId && (
            <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-lg transition-all ${showMembers ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
              <Users className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar flex flex-col">
          {messages.length === 0 && !isLoading && (
             <div className="flex flex-col items-center justify-center h-full gap-4 text-center mt-auto mb-auto">
               <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                 <Sparkles className="w-8 h-8 text-indigo-400" />
               </div>
               <div>
                 <h3 className="text-white font-bold text-lg">Welcome to the beginning of this chat</h3>
                 <p className="text-zinc-500 text-sm mt-1 max-w-md">This is the start of a legendary conversation. Say hello!</p>
               </div>
             </div>
          )}
          {messages.map((msg, idx) => {
            const isMe = msg.user_id === user?.id;
            const prevMsg = messages[idx - 1];
            const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id || (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000);
            const canDelete = isMe || isAdmin;

            return (
              <div key={msg.id} className={`group flex gap-3 ${showHeader ? 'mt-4' : 'mt-1'}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${showHeader ? 'bg-gradient-to-tr from-indigo-500 to-purple-500' : 'opacity-0'}`}>
                   {showHeader && <span className="text-white text-xs font-bold">{msg.username?.substring(0,2).toUpperCase() || 'AN'}</span>}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col items-start">
                  {showHeader && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[14px] text-zinc-100 font-medium hover:underline cursor-pointer">{msg.username || "Anonymous"}</span>
                      <span className="text-[11px] text-zinc-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  )}
                  
                  <div className="relative group/msg inline-block max-w-full">
                    {msg.media_url && (
                      <div className="mb-2 max-w-[400px]">
                        <img src={msg.media_url} alt="attachment" className="rounded-xl w-full h-auto object-cover border border-white/10" />
                      </div>
                    )}
                    {msg.text && (
                      <div className="px-4 py-2.5 bg-[#2b2d31] text-zinc-100 rounded-xl leading-relaxed whitespace-pre-wrap break-words border border-white/5 inline-block">
                        {msg.text}
                      </div>
                    )}
                    
                    {canDelete && (
                      <button onClick={() => handleDeleteMessage(msg.id)} className="absolute -right-10 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity text-red-400 hover:bg-red-500/20 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        {activeChannelId && (
          <div className="p-4 bg-[#18181b]">
            <div className="bg-[#383a40] rounded-xl relative">
              {uploadFile && (
                <div className="p-3 border-b border-white/5 flex items-center gap-3">
                  <div className="w-16 h-16 bg-black/40 rounded-lg flex flex-col items-center justify-center border border-white/10 relative overflow-hidden group">
                    <ImageIcon className="w-6 h-6 text-indigo-400" />
                    <button onClick={() => setUploadFile(null)} className="absolute top-1 right-1 p-1 bg-black/60 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                  </div>
                  <span className="text-sm text-zinc-300 font-medium truncate max-w-[200px]">{uploadFile.name}</span>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 p-3 min-h-[56px]">
                <label className="p-2 -ml-1 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-white/5 cursor-pointer transition-colors">
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  <Plus className="w-6 h-6" />
                </label>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  placeholder={`Message ${channels.find(c=>c.id===activeChannelId)?.name || 'DM'}...`}
                  className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 py-2.5 max-h-[50vh] resize-none outline-none leading-relaxed overflow-y-auto no-scrollbar"
                  rows={1}
                  disabled={isSending || isUploading}
                />
                <button
                  type="submit"
                  disabled={(!inputValue.trim() && !uploadFile) || isSending || isUploading}
                  className="p-2 -mr-1 rounded-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white transition-colors flex shrink-0"
                >
                  {(isSending || isUploading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar (Communities only) */}
      {activeTab === 'communities' && showMembers && (
        <div className="w-64 bg-[#2b2d31] border-l border-white/5 flex flex-col shrink-0">
          <div className="h-14 px-4 border-b border-white/5 flex items-center">
             <h3 className="font-bold text-white tracking-wide">Members — {members.length}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
            {['owner', 'admin', 'member'].map(roleGroup => {
              const groupMembers = members.filter(m => m.role === roleGroup);
              if (groupMembers.length === 0) return null;
              return (
                <div key={roleGroup} className="mb-4">
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">
                    {roleGroup}s — {groupMembers.length}
                  </h4>
                  {groupMembers.map(m => (
                    <div key={m.id} className="group relative flex items-center gap-3 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-zinc-300 text-xs font-bold">
                        {m.username.substring(0,2).toUpperCase()}
                      </div>
                      <span className="truncate text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{m.username}</span>
                      
                      {isAdmin && m.id !== user?.id && m.role !== 'owner' && (
                        <button onClick={() => handleKickMember(m.id)} className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded-md transition-all">
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
