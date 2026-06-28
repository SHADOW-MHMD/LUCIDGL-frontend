"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Send, Sparkles, Loader2, Hash, MessageSquare, Plus, Users, Image as ImageIcon, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

const API_URL = "https://lucid-gl.muhammed1515mishal.workers.dev";
const POLL_INTERVAL_MS = 3000;

type Community = { id: string, name: string, owner_id: string, is_private: number };
type Channel = { id: string, name: string, community_id: string };
type DM = { id: string, target_user: { id: string, username: string, badge_tier?: string } };

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
  
  // Chat State
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
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

  // Initial Load
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [commRes, dmRes] = await Promise.all([
          authFetch(`${API_URL}/api/chat/communities`),
          authFetch(`${API_URL}/api/chat/dms`)
        ]);
        const commData = await commRes.json();
        const dmData = await dmRes.json();
        setCommunities(commData);
        setDms(dmData);
        if (commData.length > 0) setActiveCommId(commData[0].id);
      } catch (err) {
        console.error("Failed to load sidebars", err);
      }
    };
    loadData();
  }, [user, authFetch]);

  // Load Channels when Community changes
  useEffect(() => {
    if (!activeCommId || activeTab !== 'communities') return;
    const loadChannels = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/chat/communities/${activeCommId}/channels`);
        const data = await res.json();
        setChannels(data);
        if (data.length > 0) setActiveChannelId(data[0].id);
        else setActiveChannelId(null);
      } catch (err) {
        console.error("Failed to load channels", err);
      }
    };
    loadChannels();
  }, [activeCommId, activeTab, authFetch]);

  // Sync Messages Loop
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

  const handleUploadMedia = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      const { error } = await supabase.storage.from('chat-media').upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from('chat-media').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error("Upload failed", err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !uploadFile) || !user || isSending || !activeChannelId) return;

    setIsSending(true);
    let mediaUrl = null;
    
    if (uploadFile) {
      mediaUrl = await handleUploadMedia(uploadFile);
      setUploadFile(null);
    }

    const optimisticMsg: ChatMessage = {
      id: crypto.randomUUID(),
      channel_id: activeChannelId,
      user_id: user.id,
      username: user.user_metadata?.full_name || "You",
      text: inputValue.trim(),
      media_url: mediaUrl,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue("");

    try {
      await authFetch(`${API_URL}/api/chat/send`, {
        method: "POST",
        body: JSON.stringify({
          id: optimisticMsg.id,
          channel_id: activeChannelId,
          text: optimisticMsg.text,
          media_url: mediaUrl,
        }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await authFetch(`${API_URL}/api/chat/messages/${msgId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  if (!user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
        <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* Primary Sidebar - Servers/DMs toggle */}
      <div className="w-20 bg-black/40 border-r border-white/5 flex flex-col items-center py-4 gap-4 overflow-y-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('dms'); setActiveChannelId(dms.length > 0 ? dms[0].id : null); }}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'dms' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
        <div className="w-10 h-[2px] bg-white/10 rounded-full" />
        {communities.map(c => (
          <button 
            key={c.id}
            onClick={() => { setActiveTab('communities'); setActiveCommId(c.id); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold uppercase transition-all ${activeTab === 'communities' && activeCommId === c.id ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
          >
            {c.name.substring(0, 2)}
          </button>
        ))}
      </div>

      {/* Secondary Sidebar - Channels or DMs list */}
      <div className="w-64 bg-black/20 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-bold text-white tracking-wide">
            {activeTab === 'communities' ? 'Channels' : 'Direct Messages'}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === 'communities' ? (
            channels.map(ch => (
              <button 
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${activeChannelId === ch.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}
              >
                <Hash className="w-4 h-4" />
                <span className="truncate text-sm font-medium">{ch.name}</span>
              </button>
            ))
          ) : (
            dms.map(dm => (
              <button 
                key={dm.id}
                onClick={() => setActiveChannelId(dm.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${activeChannelId === dm.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {dm.target_user.username.substring(0,2).toUpperCase()}
                </div>
                <span className="truncate text-sm font-medium">{dm.target_user.username}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative bg-black/10">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-white flex items-center gap-2">
              {activeTab === 'communities' ? <Hash className="w-5 h-5 text-purple-400"/> : <MessageSquare className="w-5 h-5 text-blue-400"/>}
              {activeTab === 'communities' ? channels.find(c=>c.id===activeChannelId)?.name || 'Select Channel' : dms.find(d=>d.id===activeChannelId)?.target_user.username || 'Select DM'}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          {messages.length === 0 && !isLoading && (
             <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
               <Sparkles className="w-10 h-10 text-white/20" />
               <p className="text-white/30 text-sm">No messages yet. Say hello!</p>
             </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  <span className="text-[11px] text-white/50 font-medium tracking-wider">
                    {isMe ? "You" : msg.username || "Anonymous"}
                  </span>
                  <span className="text-[9px] text-white/20">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div className={`group relative px-4 py-3 rounded-2xl max-w-[80%] shadow-md ${
                  isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white/10 text-white/90 rounded-tl-sm backdrop-blur-sm"
                }`}>
                  {msg.media_url && (
                    <img src={msg.media_url} alt="attachment" className="rounded-xl max-w-full max-h-64 object-cover mb-2" />
                  )}
                  {msg.text && <p className="break-words leading-relaxed">{msg.text}</p>}
                  
                  {isMe && (
                    <button onClick={() => handleDeleteMessage(msg.id)} className="absolute -left-10 top-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-red-500/20 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {activeChannelId && (
          <div className="p-4 bg-black/30 border-t border-white/5">
            {uploadFile && (
              <div className="mb-3 flex items-center gap-2 p-2 bg-white/5 rounded-xl border border-white/10 w-max">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white/80 max-w-[150px] truncate">{uploadFile.name}</span>
                <button onClick={() => setUploadFile(null)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-3 h-3 text-white/50"/></button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <label className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-pointer transition-all">
                <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                <Plus className="w-5 h-5" />
              </label>
              
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                disabled={isSending || isUploading}
              />
              <button
                type="submit"
                disabled={(!inputValue.trim() && !uploadFile) || isSending || isUploading}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all"
              >
                {(isSending || isUploading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
