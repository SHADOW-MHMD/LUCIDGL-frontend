"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, User2, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lucid-gl.muhammed1515mishal.workers.dev";

interface UserProfile {
  id: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  nitro_tier?: number;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`${apiUrl}/api/users/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const p: UserProfile = data.profile ?? data;
          setProfile(p);
          setBio(p.bio ?? "");
          setAvatarUrl(p.avatar_url ?? "");
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${apiUrl}/api/users/profile`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio, avatar_url: avatarUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || "Save failed");
      }
      setSaveSuccess(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center">
        <div className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-2xl p-10 text-center">
          <p className="text-white/50">Please sign in to access settings.</p>
        </div>
      </div>
    );
  }

  const nitroTier = profile?.nitro_tier ?? 0;

  return (
    <motion.div
      className="min-h-screen pt-28 pb-16 px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-white/50 mt-2 text-sm">Manage your profile</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="text-indigo-400/40 animate-spin" size={40} />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className={`bg-white/[0.03] backdrop-blur-sm border rounded-2xl p-6 space-y-6 transition-all duration-300 ${nitroTier > 0 ? "nitro-border border" : "border-white/[0.08]"}`}
          >
            {/* Nitro badge */}
            {nitroTier > 0 && (
              <div className="flex items-center justify-center">
                <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                  <span className="nitro-badge">✨ Nitro</span>
                </span>
              </div>
            )}

            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/[0.12]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/[0.06] border-2 border-white/[0.12] flex items-center justify-center">
                  <User2 size={28} className="text-white/30" />
                </div>
              )}
              <div>
                <p className="text-white font-semibold">{profile?.username ?? user.email?.split("@")[0]}</p>
                <p className="text-white/35 text-xs">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Avatar URL */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 size={12} /> Avatar URL
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><User2 size={12} /> Bio</span>
                  <span className={`tabular-nums ${bio.length > 140 ? "text-red-400" : "text-white/30"}`}>{bio.length}/160</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  placeholder="Tell the community about yourself..."
                  rows={3}
                  maxLength={160}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 resize-none transition-colors"
                />
              </div>

              <AnimatePresence>
                {saveError && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                  >
                    {saveError}
                  </motion.p>
                )}
                {saveSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2"
                  >
                    ✓ Profile saved successfully!
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={saving}
                whileHover={!saving ? { scale: 1.02 } : {}}
                whileTap={!saving ? { scale: 0.97 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Profile</>}
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
