"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, Link2, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { env } from "@/lib/env";

interface CommunityInviteModalProps {
  communityId: string;
  communityName: string;
  onClose: () => void;
}

type Tab = "search" | "invite";

interface UserResult {
  id: string;
  username: string;
}

export function CommunityInviteModal({ communityId, communityName, onClose }: CommunityInviteModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup both timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Debounced user search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${env.apiUrl}/api/users/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (res.ok) setResults(await res.json());
      } catch {
        // silently fail
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleAddUser = useCallback(async (userId: string) => {
    setAddingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${env.apiUrl}/api/chat/communities/${communityId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) setAddedIds(prev => new Set(prev).add(userId));
    } catch {
      // silently fail
    } finally {
      setAddingId(null);
    }
  }, [communityId]);

  const handleGenerateInvite = useCallback(async () => {
    setGeneratingInvite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${env.apiUrl}/api/chat/communities/${communityId}/invites`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInviteToken(data.token);
        setInviteExpiry(data.expires_at);
      }
    } catch {
      // silently fail
    } finally {
      setGeneratingInvite(false);
    }
  }, [communityId]);

  const inviteUrl = inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/chat/communities/invites/join?token=${inviteToken}`
    : null;

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  };

  const expiryLabel = inviteExpiry
    ? new Date(inviteExpiry).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.08]">
            <div>
              <h2 className="text-lg font-bold text-white">Manage Members</h2>
              <p className="text-xs text-white/40 mt-0.5 truncate max-w-[220px]">{communityName}</p>
            </div>
            <button
              id="community-invite-modal-close"
              onClick={onClose}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mx-6 mt-4 p-1 bg-white/[0.04] rounded-xl border border-white/[0.06]">
            {(["search", "invite"] as Tab[]).map((tab) => (
              <button
                key={tab}
                id={`community-invite-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  {tab === "search" ? <><Search className="w-4 h-4" /> Search Users</> : <><Link2 className="w-4 h-4" /> Invite Link</>}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeTab === "search" ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="community-member-search-input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by username..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] border border-white/[0.10] rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
                    )}
                  </div>

                  {/* Results */}
                  <motion.ul
                    className="mt-3 space-y-1.5 max-h-[200px] overflow-y-auto"
                    variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                    animate="show"
                  >
                    {results.map((u) => (
                      <motion.li
                        key={u.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.username[0]?.toUpperCase()}
                          </div>
                          <span className="text-white/90 text-sm font-medium">@{u.username}</span>
                        </div>
                        <button
                          id={`add-member-btn-${u.id}`}
                          onClick={() => handleAddUser(u.id)}
                          disabled={addedIds.has(u.id) || addingId === u.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            addedIds.has(u.id)
                              ? "text-green-400 bg-green-400/10"
                              : "text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300"
                          }`}
                        >
                          {addingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : addedIds.has(u.id) ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                        </button>
                      </motion.li>
                    ))}
                    {results.length === 0 && query.length >= 2 && !searching && (
                      <li className="text-center text-white/30 text-sm py-6">No users found for "{query}"</li>
                    )}
                    {query.length < 2 && (
                      <li className="text-center text-white/20 text-sm py-6">Type 2+ characters to search</li>
                    )}
                  </motion.ul>
                </motion.div>
              ) : (
                <motion.div
                  key="invite"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col items-center gap-4 pt-2"
                >
                  {inviteUrl ? (
                    <>
                      <div className="w-full flex items-center gap-2 bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2.5">
                        <Link2 className="w-4 h-4 text-white/30 shrink-0" />
                        <span className="text-white/60 text-xs truncate flex-1 font-mono">{inviteUrl}</span>
                        <button
                          id="copy-invite-link-btn"
                          onClick={handleCopy}
                          className="shrink-0 p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      {expiryLabel && (
                        <p className="text-xs text-white/30">Expires {expiryLabel}</p>
                      )}
                      <button
                        id="generate-new-invite-btn"
                        onClick={handleGenerateInvite}
                        disabled={generatingInvite}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                      >
                        Generate new link
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Link2 className="w-7 h-7 text-indigo-400" />
                      </div>
                      <p className="text-white/40 text-sm text-center max-w-[240px]">
                        Generate a unique invite link to share with anyone. Links expire in 7 days.
                      </p>
                      <button
                        id="generate-invite-link-btn"
                        onClick={handleGenerateInvite}
                        disabled={generatingInvite}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {generatingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                        Generate Invite Link
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
