"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Trophy, Code2, Image as ImageIcon, Download, Heart, Zap, Users,
  ChevronLeft, ChevronRight, Sparkles, Flame
} from "lucide-react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";
import { useGamification } from "@/hooks/useGamification";
import { LevelBadge } from "@/components/ui/LevelBadge";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  member_count?: number;
  is_private?: number;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut" as const, duration: 0.35 } },
};

// ─── Mocked "For You" community affinity data ────────────────────────────────
const FOR_YOU_TAGS = ["Gaming", "Dev", "Art", "Music", "Anime", "Crypto", "Science"];
const mockedForYou = FOR_YOU_TAGS.map((tag, i) => ({
  id: `foryou-${i}`,
  tag,
  headline: `Top ${tag} content this week`,
  engagement: Math.floor(Math.random() * 9000) + 1000,
}));

// ─── Trending Communities Carousel ───────────────────────────────────────────
function TrendingCarousel({ communities }: { communities: Community[] }) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);

  const CARD_W = 260;
  const GAP = 16;

  useEffect(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.offsetWidth;
    const totalW = communities.length * (CARD_W + GAP);
    setConstraints({ left: -(totalW - containerW), right: 0 });
  }, [communities.length]);

  const goTo = (dir: -1 | 1) => {
    const newIdx = Math.max(0, Math.min(communities.length - 1, currentIndex + dir));
    setCurrentIndex(newIdx);
    x.set(-(newIdx * (CARD_W + GAP)));
  };

  if (communities.length === 0) {
    return (
      <div className="text-center py-10 text-white/30 text-sm">No trending communities yet.</div>
    );
  }

  return (
    <div className="relative">
      {/* Nav arrows */}
      <div className="flex gap-2 absolute -top-12 right-0">
        <button
          id="carousel-prev"
          onClick={() => goTo(-1)}
          disabled={currentIndex === 0}
          className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.10] transition-all disabled:opacity-25"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          id="carousel-next"
          onClick={() => goTo(1)}
          disabled={currentIndex >= communities.length - 1}
          className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.10] transition-all disabled:opacity-25"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div ref={containerRef} className="overflow-hidden">
        <motion.div
          className="flex gap-4 cursor-grab active:cursor-grabbing"
          style={{ x }}
          drag="x"
          dragConstraints={constraints}
          dragElastic={0.08}
          animate={{ x: -(currentIndex * (CARD_W + GAP)) }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) goTo(1);
            else if (info.offset.x > 60) goTo(-1);
          }}
        >
          {communities.map((c, i) => (
            <motion.div
              key={c.id}
              id={`community-carousel-card-${c.id}`}
              style={{ width: CARD_W, flexShrink: 0 }}
              whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 22 } }}
              className="bg-white/5 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 select-none"
            >
              <div className="flex items-center gap-3 mb-3">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm leading-tight truncate max-w-[150px]">{c.name}</p>
                  {c.is_private ? (
                    <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Private</span>
                  ) : (
                    <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Public</span>
                  )}
                </div>
              </div>
              {c.description && (
                <p className="text-white/40 text-xs line-clamp-2 mb-3">{c.description}</p>
              )}
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{c.member_count ?? 0} members</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {communities.map((_, i) => (
          <button
            key={i}
            id={`carousel-dot-${i}`}
            onClick={() => setCurrentIndex(i)}
            className="transition-all"
          >
            <motion.div
              animate={{ width: i === currentIndex ? 20 : 6, backgroundColor: i === currentIndex ? "rgb(129 140 248)" : "rgba(255,255,255,0.15)" }}
              className="h-1.5 rounded-full"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function DiscoverPage() {
  const { getGamificationData } = useGamification();
  const [data, setData] = useState<{
    top_users: any[];
    trending_code: any[];
    top_faces: any[];
  } | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiscover() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const apiUrl = env.apiUrl;

        const [discoverRes, communitiesRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/discover`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/chat/communities`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (discoverRes.status === "fulfilled" && discoverRes.value.ok) {
          setData(await discoverRes.value.json());
        } else {
          setData({ top_users: [], trending_code: [], top_faces: [] });
        }

        if (communitiesRes.status === "fulfilled" && communitiesRes.value.ok) {
          setCommunities(await communitiesRes.value.json());
        }
      } catch (err) {
        console.error("Failed to fetch discover page data", err);
        setData({ top_users: [], trending_code: [], top_faces: [] });
      } finally {
        setLoading(false);
      }
    }
    fetchDiscover();
  }, []);

  const filteredForYou = activeTag
    ? mockedForYou.filter((f) => f.tag === activeTag)
    : mockedForYou;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-t-indigo-400 border-white/[0.08] rounded-full animate-spin"></div>
          <p className="text-white/50 font-medium tracking-wide">Loading Discover...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto py-12 px-4 space-y-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Header */}
      <motion.div
        className="text-center mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
          Discover
        </h1>
        <p className="text-white/50 max-w-xl mx-auto text-lg">
          Explore top players, trending resources, and the most engaging content across the platform.
        </p>
      </motion.div>

      {/* ── Trending Communities Carousel ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-8 relative">
          <Users className="w-8 h-8 text-violet-400" />
          <h2 className="text-3xl font-bold text-white/90">Trending Communities</h2>
        </div>
        <TrendingCarousel communities={communities} />
      </motion.section>

      {/* ── For You Feed ───────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white/90">For You</h2>
        </div>

        {/* Tag filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            id="for-you-tag-all"
            onClick={() => setActiveTag(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              activeTag === null
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
            }`}
          >
            All
          </button>
          <AnimatePresence>
            {FOR_YOU_TAGS.map((tag) => (
              <motion.button
                key={tag}
                id={`for-you-tag-${tag.toLowerCase()}`}
                layoutId={`tag-pill-${tag}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  activeTag === tag
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                    : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
                }`}
              >
                {tag}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Stagger list */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filteredForYou.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className="bg-white/5 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
              >
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-3">
                  {item.tag}
                </span>
                <p className="text-white/90 font-semibold text-sm mb-3">{item.headline}</p>
                <div className="flex items-center gap-1.5 text-white/30 text-xs">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{item.engagement.toLocaleString()} engagements</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.section>

      {/* ── Apex Legends (Top Users) ────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white/90">Apex Legends</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.top_users?.slice(0, 3).map((user, i) => {
            const gData = getGamificationData(user.id, user.current_level || 0, user.badge_tier || "NOVICE", user.current_streak || 0);
            return (
              <motion.div
                key={user.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className={`bg-white/[0.03] backdrop-blur-sm border rounded-2xl p-6 shadow-xl hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors ${gData.glowClass ? `border-2 ${gData.glowClass}` : "border-white/[0.08]"}`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0 overflow-hidden">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : `#${i + 1}`}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
                      {user.username || "User"}
                      {gData.showFlame && <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <LevelBadge level={user.current_level || 1} badgeTier={gData.dynamicBadge} />
                      {user.nitro_tier && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Tier {user.nitro_tier}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white/[0.04] border border-white/[0.06] rounded-xl p-3">
                  <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Experience</span>
                  <span className="text-white font-mono font-bold text-lg">{user.total_xp || 0} XP</span>
                </div>
              </motion.div>
            );
          })}
          {(!data?.top_users || data.top_users.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-center py-10 text-white/30">No legends found yet.</div>
          )}
        </div>
      </motion.section>

      {/* ── Trending Code ───────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Code2 className="w-8 h-8 text-indigo-400" />
          <h2 className="text-3xl font-bold text-white/90">Trending Code</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.trending_code?.slice(0, 3).map((code, i) => (
            <motion.div
              key={code.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 shadow-xl hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white line-clamp-2">{code.title || "Code Snippet"}</h3>
                  <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    {code.type?.toUpperCase() || (code.file_url?.endsWith(".apk") ? "APK" : "ZIP")}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-6 line-clamp-3">{code.description || "No description provided."}</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40 font-medium">{code.author_name || "Anonymous"}</span>
                <div className="flex items-center gap-1 text-cyan-400 font-semibold bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/15 cursor-default select-none">
                  <Download className="w-4 h-4" />
                  <span>{code.downloads || 0}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {(!data?.trending_code || data.trending_code.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-center py-10 text-white/30">No trending code found yet.</div>
          )}
        </div>
      </motion.section>

      {/* ── Top Faces ───────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-8 h-8 text-pink-400" />
          <h2 className="text-3xl font-bold text-white/90">Top Faces</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.top_faces?.slice(0, 3).map((post, i) => (
            <motion.div
              key={post.id || i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 22 } }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors group"
            >
              <div className="aspect-[4/5] bg-black/40 relative overflow-hidden">
                {post.media_url ? (
                  <img src={post.media_url} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/15">No Media</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">{post.caption || "No caption"}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-white/80 text-xs font-semibold">{post.author_name || "User"}</span>
                    <div className="flex items-center gap-1.5 text-pink-400 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Heart className="w-4 h-4 fill-pink-400" />
                      <span className="text-sm font-bold">{post.likes || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {(!data?.top_faces || data.top_faces.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-center py-10 text-white/30">No top faces found yet.</div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
