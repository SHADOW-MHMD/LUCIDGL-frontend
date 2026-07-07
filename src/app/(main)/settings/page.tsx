"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, User2, Link2, Monitor, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";

const apiUrl = env.apiUrl;

interface UserProfile {
  id: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  nitro_tier?: number;
}

const GlassToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <motion.div 
    layout 
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 cursor-pointer flex items-center transition-colors ${checked ? 'bg-violet-500/50' : 'bg-white/[0.05]'}`}
  >
    <motion.div 
      layout 
      className="w-4 h-4 bg-white rounded-full shadow-md"
      initial={false}
      animate={{ x: checked ? 24 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    />
  </motion.div>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState("account");

  const [appearanceToggles, setAppearanceToggles] = useState({
    darkMode: true,
    animations: true,
    lucidRobots: true,
  });
  
  const [gamificationToggles, setGamificationToggles] = useState({
    showBadges: true,
    displayRank: true,
  });

  useEffect(() => {
    const app = localStorage.getItem("settings_appearance");
    const gam = localStorage.getItem("settings_gamification");
    if (app) setAppearanceToggles(JSON.parse(app));
    if (gam) setGamificationToggles(JSON.parse(gam));
  }, []);

  const toggleAppearance = (key: keyof typeof appearanceToggles) => {
    const newToggles = { ...appearanceToggles, [key]: !appearanceToggles[key] };
    setAppearanceToggles(newToggles);
    localStorage.setItem("settings_appearance", JSON.stringify(newToggles));
  };

  const toggleGamification = (key: keyof typeof gamificationToggles) => {
    const newToggles = { ...gamificationToggles, [key]: !gamificationToggles[key] };
    setGamificationToggles(newToggles);
    localStorage.setItem("settings_gamification", JSON.stringify(newToggles));
  };

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

  const tabs = [
    { id: "account", label: "Account", icon: User2 },
    { id: "appearance", label: "Appearance", icon: Monitor },
    { id: "gamification", label: "Gamification", icon: Trophy },
  ];

  return (
    <motion.div
      className="min-h-screen pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Left Sidebar */}
      <div className="w-full md:w-64 border-r border-white/[0.08] pr-4 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white mb-4 px-3">Settings</h2>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                isActive 
                  ? "bg-white/[0.05] text-violet-400" 
                  : "text-white/60 hover:bg-white/[0.02] hover:text-white"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right Pane */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="text-violet-400/40 animate-spin" size={40} />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-white/[0.03] backdrop-blur-sm border rounded-2xl p-6 md:p-8 space-y-6 ${nitroTier > 0 && activeTab === "account" ? "nitro-border border" : "border-white/[0.08]"}`}
          >
            {activeTab === "account" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-6">Account Profile</h3>
                {nitroTier > 0 && (
                  <div className="flex items-center justify-start">
                    <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                      <span className="nitro-badge">✨ Nitro</span>
                    </span>
                  </div>
                )}

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
                  <div className="space-y-1.5">
                    <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 size={12} /> Avatar URL
                    </label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="e.g. https://imgur.com/avatar.png"
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><User2 size={12} /> Bio</span>
                      <span className={`tabular-nums ${bio.length > 140 ? "text-red-400" : "text-white/30"}`}>{bio.length}/160</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 160))}
                      placeholder="e.g. I build Next.js apps and love open-source."
                      rows={3}
                      maxLength={160}
                      className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all"
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
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                  >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Profile</>}
                  </motion.button>
                </form>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-6">Appearance</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Dark Mode</p>
                      <p className="text-white/50 text-sm">Use deep dark theme across the app.</p>
                    </div>
                    <GlassToggle checked={appearanceToggles.darkMode} onChange={() => toggleAppearance('darkMode')} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Fluid Animations</p>
                      <p className="text-white/50 text-sm">Enable framer-motion micro-interactions.</p>
                    </div>
                    <GlassToggle checked={appearanceToggles.animations} onChange={() => toggleAppearance('animations')} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Enable Lucid Robot Assistants</p>
                      <p className="text-white/50 text-sm">Disables intensive canvas SVG tracking and unmounts sidebar event handlers for lower-end computer rigs.</p>
                    </div>
                    <GlassToggle checked={appearanceToggles.lucidRobots} onChange={() => toggleAppearance('lucidRobots')} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gamification" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-6">Gamification</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Show Badges</p>
                      <p className="text-white/50 text-sm">Display your earned badges in chat.</p>
                    </div>
                    <GlassToggle checked={gamificationToggles.showBadges} onChange={() => toggleGamification('showBadges')} />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div>
                      <p className="text-white font-medium">Display Rank</p>
                      <p className="text-white/50 text-sm">Show your global rank on your profile card.</p>
                    </div>
                    <GlassToggle checked={gamificationToggles.displayRank} onChange={() => toggleGamification('displayRank')} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
