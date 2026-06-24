"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Send, Sparkles, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types";

const API_URL = "https://lucid-gl.muhammed1515mishal.workers.dev";
const POLL_INTERVAL_MS = 3000;
const CHANNEL = "general";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownIdsRef = useRef(new Set<string>());
  const isInitialLoadRef = useRef(true);

  // Authenticated fetch helper
  const authFetch = useCallback(
    async (url: string, options?: RequestInit) => {
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options?.headers,
        },
      });
    },
    [user]
  );

  // Sync messages from KV-backed endpoint
  const syncMessages = useCallback(async () => {
    if (!user || authLoading) return;
    try {
      const res = await authFetch(
        `${API_URL}/api/chat/sync/${CHANNEL}`
      );
      if (!res.ok) return;

      const incoming: ChatMessage[] = await res.json();

      setMessages((prev) => {
        // Build a merged list: keep optimistic messages that aren't in the server payload yet
        const serverIds = new Set(incoming.map((m) => m.id));
        const optimisticOnly = prev.filter(
          (m) => !serverIds.has(m.id) && !knownIdsRef.current.has(m.id)
        );

        // Update the known IDs set
        for (const m of incoming) {
          knownIdsRef.current.add(m.id);
        }

        return [...incoming, ...optimisticOnly];
      });

      isInitialLoadRef.current = false;
    } catch (error) {
      console.error("Chat sync failed:", error);
    }
  }, [user, authLoading, authFetch]);

  // Short-polling loop: 3-second interval
  useEffect(() => {
    if (!user || authLoading) return;

    // Initial fetch
    syncMessages();

    const interval = setInterval(syncMessages, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, authLoading, syncMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler with optimistic UI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || isSending) return;

    const optimisticMsg: ChatMessage = {
      id: crypto.randomUUID(),
      channel_id: CHANNEL,
      user_id: user.uid,
      username: user.displayName || "You",
      text: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistic render — immediately show on the glass panel
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue("");
    setIsSending(true);

    try {
      await authFetch(`${API_URL}/api/chat/send`, {
        method: "POST",
        body: JSON.stringify({
          id: optimisticMsg.id,
          channel_id: CHANNEL,
          text: optimisticMsg.text,
        }),
      });

      // Mark this ID as known so the dedup guard recognizes it on the next poll
      knownIdsRef.current.add(optimisticMsg.id);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Rollback: remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  // Auth gate: unauthenticated view
  if (!user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
        <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
        <p className="text-slate-400">Sign in to join the interactive rooms.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white tracking-wide">General Nexus</h2>
            <p className="text-xs text-green-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              {isInitialLoadRef.current ? "Connecting..." : "Secure Connection"}
            </p>
          </div>
        </div>
        <div className="text-xs text-white/30 font-mono">
          KV-Sync · {messages.length} msgs
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && !isInitialLoadRef.current && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Sparkles className="w-10 h-10 text-white/20" />
            <p className="text-white/30 text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === user?.uid;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] text-white/40 mb-1 px-1 font-medium tracking-wider uppercase">
                {isMe ? "You" : msg.username || "Anonymous"}
              </span>
              <div
                className={`px-4 py-3 rounded-2xl max-w-[80%] break-words shadow-md ${
                  isMe
                    ? "bg-blue-600 text-white rounded-tr-sm border border-blue-500"
                    : "bg-white/10 text-white/90 rounded-tl-sm border border-white/5 backdrop-blur-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
          <input
            id="chat-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Broadcast message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            disabled={isSending}
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
