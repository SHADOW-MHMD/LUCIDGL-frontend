"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Send, Sparkles } from "lucide-react";
import type { Message } from "@/types";

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of messages for the 'general' channel
    const fetchMessages = async () => {
      if (!user) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";
        const res = await fetch(`${apiUrl}/api/messages/channel/general`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };
    fetchMessages();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    const newMsg: Message = {
      id: crypto.randomUUID(),
      sender_id: user.uid,
      recipient_id: null,
      channel_name: "general",
      message_content: inputValue.trim(),
      created_at: new Date().toISOString(),
      sender_username: user.displayName || "You",
    };

    // Optimistic Update
    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");

    // Background Sync
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";
      
      await fetch(`${apiUrl}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMsg),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Rollback could be implemented here
    }
  };

  if (!user) {
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
              Secure Connection
            </p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <span className="text-[10px] text-white/40 mb-1 px-1 font-medium tracking-wider uppercase">
                {isMe ? 'You' : msg.sender_username}
              </span>
              <div className={`px-4 py-3 rounded-2xl max-w-[80%] break-words shadow-md ${
                isMe 
                ? 'bg-blue-600 text-white rounded-tr-sm border border-blue-500' 
                : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/5 backdrop-blur-sm'
              }`}>
                {msg.message_content}
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
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Broadcast message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
