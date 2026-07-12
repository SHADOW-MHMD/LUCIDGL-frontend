"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Trophy, Code2, Image as ImageIcon, Download, Heart, Zap, Users,
  ChevronLeft, ChevronRight, Sparkles, Flame
} from "lucide-react";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { env } from "@/lib/env";
import { useGamification } from "@/hooks/useGamification";
import { LevelBadge } from "@/components/ui/LevelBadge";

// ─── Section Heading ──────────────────────────────────────────────────────────
function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
      {icon}
      <span className="tracking-tight">{label}</span>
      <div className="flex-1 h-px bg-[var(--accent-color)]/30 ml-2" />
    </h2>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-16 space-y-16">
        <div className="space-y-3">
          <div className="skeleton h-12 w-48 rounded-xl" />
          <div className="skeleton h-5 w-80 rounded-lg" />
        </div>
        {[0, 1, 2].map((s) => (
          <div key={s} className="space-y-6">
            <div className="skeleton h-8 w-64 rounded-lg mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((c) => (
                <div key={c} className="skeleton bg-white/[0.03] border border-white/[0.08] rounded-2xl h-48" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    setConstraints({ left: -(Math.max(0, totalW - containerW)), right: 0 });
  }, [communities.length]);

  const goTo = (dir: -1 | 1) => {
    const newIdx = Math.max(0, Math.min(communities.length - 1, currentIndex + dir));
    setCurrentIndex(newIdx);
    x.set(-(newIdx * (CARD_W + GAP)));
  };

  if (communities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Users className="w-16 h-16 text-white/10" strokeWidth={1} />
        <p className="text-white/30 text-sm">No trending communities yet.</p>
      </div>
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
          className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-[var(--accent-color)]/30 transition-all disabled:opacity-25"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button
          id="carousel-next"
          onClick={() => goTo(1)}
          disabled={currentIndex >= communities.length - 1}
          className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-[var(--accent-color)]/30 transition-all disabled:opacity-25"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
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
          {communities.map((c) => (
            <motion.div
              key={c.id}
              id={`community-carousel-card-${c.id}`}
              style={{ width: CARD_W, flexShrink: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[var(--accent-color)]/30 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent-color)]/20 flex items-center justify-center text-[var(--accent-color)] font-bold text-lg shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm leading-tight truncate max-w-[150px]">{c.name}</p>
                  {c.is_private ? (
                    <span className="text-[10px] text-[var(--accent-color)] font-semibold uppercase tracking-wider">Private</span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Public</span>
                  )}
                </div>
              </div>
              {c.description && (
                <p className="text-white/40 text-xs line-clamp-2 mb-3">{c.description}</p>
              )}
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
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
              animate={{
                width: i === currentIndex ? 20 : 6,
                backgroundColor: i === currentIndex ? "var(--accent-color)" : "rgba(255,255,255,0.15)",
              }}
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
    return <LoadingSkeleton />;
  }

  return (
    <div className="bg-black min-h-screen">
      <motion.div
        className="max-w-7xl mx-auto px-8 py-16 space-y-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <h1 className="text-5xl font-black tracking-tight text-white mb-3">Discover</h1>
          <p className="text-white/40 text-lg max-w-xl">
            Explore top players, trending resources, and the most engaging content across the platform.
          </p>
        </motion.div>

        {/* ── Trending Communities Carousel ────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <SectionHeading
            icon={<Users className="w-5 h-5 text-[var(--accent-color)]" strokeWidth={1.5} />}
            label="Trending Communities"
          />
          <TrendingCarousel communities={communities} />
        </motion.section>

        {/* ── For You Feed ─────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <SectionHeading
            icon={<Sparkles className="w-5 h-5 text-[var(--accent-color)]" strokeWidth={1.5} />}
            label="For You"
          />

          {/* Tag filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              id="for-you-tag-all"
              onClick={() => setActiveTag(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                activeTag === null
                  ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)]/20 text-[var(--accent-color)]"
                  : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
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
                      ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)]/20 text-[var(--accent-color)]"
                      : "bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredForYou.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[var(--accent-color)]/30 transition-all duration-200 cursor-pointer"
                >
                  <span className="inline-block bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20 rounded-full px-2 py-0.5 text-xs font-medium mb-3">
                    {item.tag}
                  </span>
                  <p className="text-white font-semibold text-sm mb-3 tracking-tight">{item.headline}</p>
                  <div className="flex items-center gap-1.5 text-white/30 text-xs">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" strokeWidth={1.5} />
                    <span>{item.engagement.toLocaleString()} engagements</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.section>

        {/* ── Apex Legends (Top Users) ──────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <SectionHeading
            icon={<Trophy className="w-5 h-5 text-[var(--accent-color)]" strokeWidth={1.5} />}
            label="Apex Legends"
          />
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
                  whileHover={{ y: -4 }}
                  className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[var(--accent-color)]/30 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden">
                      {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : `#${i + 1}`}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                        {user.username || "User"}
                        {gData.showFlame && <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" strokeWidth={1.5} />}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <LevelBadge level={user.current_level || 1} badgeTier={gData.dynamicBadge} />
                        {user.nitro_tier && (
                          <span className="bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20 rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3" strokeWidth={1.5} /> Tier {user.nitro_tier}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                    <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Experience</span>
                    <span className="text-white font-mono font-bold text-base">{user.total_xp || 0} XP</span>
                  </div>
                </motion.div>
              );
            })}
            {(!data?.top_users || data.top_users.length === 0) && (
              <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center py-16 gap-3">
                <Trophy className="w-16 h-16 text-white/10" strokeWidth={1} />
                <p className="text-white/30 text-sm">No legends found yet.</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ── Trending Code ─────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <SectionHeading
            icon={<Code2 className="w-5 h-5 text-[var(--accent-color)]" strokeWidth={1.5} />}
            label="Trending Code"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.trending_code?.slice(0, 3).map((code, i) => (
              <motion.div
                key={code.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[var(--accent-color)]/30 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <h3 className="text-base font-bold text-white tracking-tight line-clamp-2 flex-1">{code.title || "Code Snippet"}</h3>
                    <span className="bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20 rounded-full px-2 py-0.5 text-xs font-medium shrink-0">
                      {code.type?.toUpperCase() || (code.file_url?.endsWith(".apk") ? "APK" : "ZIP")}
                    </span>
                  </div>
                  <p className="text-white/40 text-sm mb-6 line-clamp-3">{code.description || "No description provided."}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40 font-medium truncate">{code.author_name || "Anonymous"}</span>
                  <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5 text-xs cursor-default select-none font-medium">
                    <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{code.downloads || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {(!data?.trending_code || data.trending_code.length === 0) && (
              <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center py-16 gap-3">
                <Code2 className="w-16 h-16 text-white/10" strokeWidth={1} />
                <p className="text-white/30 text-sm">No trending code found yet.</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ── Top Faces ─────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <SectionHeading
            icon={<ImageIcon className="w-5 h-5 text-[var(--accent-color)]" strokeWidth={1.5} />}
            label="Top Faces"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.top_faces?.slice(0, 3).map((post, i) => (
              <motion.div
                key={post.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-[var(--accent-color)]/30 transition-all duration-200 cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/5] bg-black/40 relative overflow-hidden rounded-xl mb-4 group">
                  {post.media_url ? (
                    <img src={post.media_url} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/15">No Media</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <p className="text-white text-sm font-medium line-clamp-2 tracking-tight mb-3">{post.caption || "No caption"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs font-medium">{post.author_name || "User"}</span>
                    <div className="flex items-center gap-1.5 text-pink-400 bg-pink-400/10 border border-pink-400/20 px-2 py-0.5 rounded-full text-xs font-medium">
                      <Heart className="w-3.5 h-3.5 fill-pink-400" strokeWidth={1.5} />
                      <span>{post.likes || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {(!data?.top_faces || data.top_faces.length === 0) && (
              <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center py-16 gap-3">
                <ImageIcon className="w-16 h-16 text-white/10" strokeWidth={1} />
                <p className="text-white/30 text-sm">No top faces found yet.</p>
              </div>
            )}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
