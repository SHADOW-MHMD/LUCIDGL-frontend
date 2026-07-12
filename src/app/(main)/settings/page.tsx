"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Save, Loader2, User2, Link2, Monitor, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";
import { useTheme } from "next-themes";

const apiUrl = env.apiUrl;

interface UserProfile {
  id: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  nitro_tier?: number;
  twitter_url?: string;
  github_url?: string;
  website_url?: string;
}

const GlassToggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <motion.div
    layout
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 cursor-pointer flex items-center transition-colors ${checked ? "bg-[var(--accent-color)]/50" : "bg-white/[0.05]"}`}
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

const ACCENT_SWATCHES = [
  { label: "Violet", theme: "theme-violet", color: "#8b5cf6" },
  { label: "Emerald", theme: "theme-emerald", color: "#10b981" },
  { label: "Cyan", theme: "theme-cyan", color: "#06b6d4" },
  { label: "Rose", theme: "theme-rose", color: "#f43f5e" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState("appearance");

  const [appearanceToggles, setAppearanceToggles] = useState({
    darkMode: true,
    animations: true,
    lucidRobots: true,
  });

  useEffect(() => {
    const app = localStorage.getItem("settings_appearance");
    if (app) setAppearanceToggles(JSON.parse(app));
  }, []);

  const toggleAppearance = (key: keyof typeof appearanceToggles) => {
    const newToggles = { ...appearanceToggles, [key]: !appearanceToggles[key] };
    setAppearanceToggles(newToggles);
    localStorage.setItem("settings_appearance", JSON.stringify(newToggles));
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
          setTwitterUrl(p.twitter_url ?? "");
          setGithubUrl(p.github_url ?? "");
          setWebsiteUrl(p.website_url ?? "");
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
        body: JSON.stringify({
          bio,
          twitter_url: twitterUrl,
          github_url: githubUrl,
          website_url: websiteUrl,
        }),
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
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <User2 size={48} strokeWidth={1} className="text-white/20" />
          <p className="text-white/40 text-sm">Please sign in to access settings.</p>
        </div>
      </div>
    );
  }

  const nitroTier = profile?.nitro_tier ?? 0;

  const tabs = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "account", label: "Account", icon: User2 },
    { id: "display", label: "Display", icon: Monitor },
  ];

  return (
    <div className="bg-black min-h-screen">
      <motion.div
        className="max-w-5xl mx-auto px-8 py-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-white/40 text-sm mt-1">Manage your account and preferences.</p>
        </div>

        <div className="flex gap-10">
          {/* ── Left nav ── */}
          <nav className="w-56 shrink-0 flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    isActive
                      ? "text-white bg-white/[0.07] border border-white/[0.08]"
                      : "text-white/50 hover:text-white hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <Icon size={15} strokeWidth={1.5} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* ── Right pane ── */}
          <div className="flex-1 min-w-0">
            {loading && activeTab === "account" ? (
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 space-y-6">
                <div className="h-7 w-48 rounded-lg skeleton mb-6" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full skeleton" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded skeleton" />
                    <div className="h-3 w-48 rounded skeleton" />
                  </div>
                </div>
                <div className="space-y-5">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-1.5">
                       <div className="h-3 w-20 rounded skeleton" />
                       <div className="h-10 w-full rounded-lg skeleton" />
                     </div>
                     <div className="space-y-1.5">
                       <div className="h-3 w-20 rounded skeleton" />
                       <div className="h-10 w-full rounded-lg skeleton" />
                     </div>
                   </div>
                   <div className="space-y-1.5">
                     <div className="h-3 w-20 rounded skeleton" />
                     <div className="h-10 w-full rounded-lg skeleton" />
                   </div>
                   <div className="space-y-1.5">
                     <div className="h-3 w-20 rounded skeleton" />
                     <div className="h-24 w-full rounded-lg skeleton" />
                   </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {/* ── Appearance section ── */}
                  {activeTab === "appearance" && (
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 space-y-6">
                      <h2 className="text-lg font-semibold text-white mb-6 pb-4 border-b border-white/[0.06]">
                        Appearance
                      </h2>

                      {/* Accent colour swatches */}
                      <div className="space-y-3">
                        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Accent Color</p>
                        <div className="flex items-center gap-3">
                          {ACCENT_SWATCHES.map((swatch) => {
                            const isSelected = theme === swatch.theme;
                            return (
                              <motion.button
                                key={swatch.theme}
                                onClick={() => setTheme(swatch.theme)}
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.93 }}
                                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                                title={swatch.label}
                                style={{ backgroundColor: swatch.color }}
                                className={`w-9 h-9 rounded-full transition-opacity ${
                                  isSelected
                                    ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                                    : "opacity-70 hover:opacity-100"
                                }`}
                              />
                            );
                          })}
                        </div>
                        <p className="text-white/30 text-xs">
                          Changes the accent color used throughout the interface.
                        </p>
                      </div>

                      {/* Dark mode (coming soon) */}
                      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl opacity-60">
                        <div>
                          <p className="text-white font-medium text-sm flex items-center gap-2">
                            Dark Mode
                            <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                              Coming Soon
                            </span>
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">Use deep dark theme across the app.</p>
                        </div>
                        <div className="pointer-events-none">
                          <GlassToggle checked={true} onChange={() => {}} />
                        </div>
                      </div>

                      {/* Fluid animations (coming soon) */}
                      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl opacity-60">
                        <div>
                          <p className="text-white font-medium text-sm flex items-center gap-2">
                            Fluid Animations
                            <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                              Coming Soon
                            </span>
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">Enable framer-motion micro-interactions.</p>
                        </div>
                        <div className="pointer-events-none">
                          <GlassToggle checked={true} onChange={() => {}} />
                        </div>
                      </div>

                      {/* Lucid robots toggle */}
                      <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-[var(--accent-color)]/30 hover:bg-white/[0.05] transition-colors">
                        <div>
                          <h4 className="text-white font-medium text-sm">Enable Lucid Robot Companions</h4>
                          <p className="text-white/50 text-xs mt-1">
                            Toggles advanced isometric canvas transformations and unmounts intense
                            mouse-tracking listeners for low-end processors.
                          </p>
                        </div>
                        <GlassToggle
                          checked={appearanceToggles.lucidRobots}
                          onChange={() => toggleAppearance("lucidRobots")}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Account section ── */}
                  {activeTab === "account" && (
                    <div
                      className={`bg-white/[0.03] border rounded-2xl p-8 space-y-6 ${
                        nitroTier > 0 ? "nitro-border border" : "border-white/[0.08]"
                      }`}
                    >
                      <h2 className="text-lg font-semibold text-white mb-6 pb-4 border-b border-white/[0.06]">
                        Account Profile
                      </h2>

                      {nitroTier > 0 && (
                        <div className="flex items-center justify-start">
                          <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                            <span className="nitro-badge">✨ Nitro</span>
                          </span>
                        </div>
                      )}

                      {/* Avatar row */}
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-xl font-bold text-white/50">
                          {(profile?.username ?? user.email?.split("@")[0] ?? "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {profile?.username ?? user.email?.split("@")[0]}
                          </p>
                          <p className="text-white/35 text-xs mt-0.5">{user.email}</p>
                        </div>
                      </div>

                      <form onSubmit={handleSave} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                              <Link2 size={12} strokeWidth={1.5} /> Twitter / X
                            </label>
                            <input
                              type="text"
                              value={twitterUrl}
                              onChange={(e) => setTwitterUrl(e.target.value)}
                              placeholder="https://x.com/username"
                              className="w-full bg-white/[0.04] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] transition-shadow placeholder:text-white/30 border-0"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                              <Link2 size={12} strokeWidth={1.5} /> GitHub
                            </label>
                            <input
                              type="text"
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              placeholder="https://github.com/username"
                              className="w-full bg-white/[0.04] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] transition-shadow placeholder:text-white/30 border-0"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                            <Link2 size={12} strokeWidth={1.5} /> Personal Website
                          </label>
                          <input
                            type="text"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://yourdomain.com"
                            className="w-full bg-white/[0.04] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] transition-shadow placeholder:text-white/30 border-0"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-white/60 text-xs font-medium uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <User2 size={12} strokeWidth={1.5} /> Bio
                            </span>
                            <span
                              className={`tabular-nums ${bio.length > 140 ? "text-red-400" : "text-white/30"}`}
                            >
                              {bio.length}/160
                            </span>
                          </label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value.slice(0, 160))}
                            placeholder="e.g. I build Next.js apps and love open-source."
                            rows={3}
                            maxLength={160}
                            className="w-full bg-white/[0.04] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] transition-shadow placeholder:text-white/30 border-0 resize-none"
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

                        <div className="flex justify-end">
                          <motion.button
                            type="submit"
                            disabled={saving}
                            whileHover={!saving ? { scale: 1.03 } : {}}
                            whileTap={!saving ? { scale: 0.97 } : {}}
                            transition={{ type: "spring", stiffness: 420, damping: 22 }}
                            className="bg-white text-black font-semibold px-5 py-2 rounded-lg hover:bg-white/90 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {saving ? (
                              <>
                                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                                Saving…
                              </>
                            ) : (
                              <>
                                <Save size={14} strokeWidth={1.5} />
                                Save Profile
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* ── Display section ── */}
                  {activeTab === "display" && (
                    <div className="flex flex-col items-center justify-center py-32 text-center h-full">
                      <Monitor size={48} strokeWidth={1} className="text-white/20 mb-4" />
                      <p className="text-white/40 text-sm">No display settings yet.</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
