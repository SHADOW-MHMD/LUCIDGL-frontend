"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  ShieldAlert,
  Play,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FacePost } from "@/types";
import { CommentsPanel } from "@/components/CommentsPanel";
import { motion } from "framer-motion";
import { env } from "@/lib/env";
import { useReels } from "@/components/ReelsContext";
import Link from "next/link";

// ─── Page-level stagger container ────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 24 },
  },
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ReelSkeleton() {
  return (
    <div className="flex items-end gap-6 h-[calc(100vh-140px)] max-h-[850px]">
      <div className="skeleton aspect-[9/16] h-full rounded-3xl" />
      <div className="flex flex-col gap-4 pb-4">
        <div className="skeleton w-12 h-12 rounded-full" />
        <div className="skeleton w-12 h-12 rounded-full" />
        <div className="skeleton w-12 h-12 rounded-full" />
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const { user } = useAuth();
  const [reels, setReels] = useState<FacePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReels = async () => {
      if (!user) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const apiUrl = env.apiUrl;
        const res = await fetch(`${apiUrl}/api/feed/reels`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setReels(data);
        }
      } catch (error) {
        console.error("Failed to fetch reels:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReels();
  }, [user]);

  // ── Authentication guard ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <ShieldAlert className="w-16 h-16 text-white/20" strokeWidth={1.5} />
          <h2 className="text-xl font-bold tracking-tight text-white/80">
            Authentication Required
          </h2>
          <p className="text-white/40 text-sm tracking-tight">
            You must be signed in to view the media feed.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6"
        >
          <ReelSkeleton />
          <ReelSkeleton />
        </motion.div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (reels.length === 0) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Play className="w-16 h-16 text-white/15" strokeWidth={1.5} />
          <p className="text-white/40 text-sm tracking-tight">
            No media available yet
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Main feed ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-black min-h-screen flex items-center justify-center py-4">
      <div className="flex flex-col items-center w-full max-w-2xl">
        {/* Snap feed */}
        <motion.div
          id="reels-feed-container"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center snap-y snap-mandatory h-[calc(100vh-100px)] overflow-y-auto no-scrollbar w-full"
        >
          {reels.map((reel) => (
            <motion.div key={reel.id} variants={cardVariants} className="snap-center snap-always shrink-0 h-full w-full flex items-center justify-center py-4">
              <ReelCard
                reel={reel}
                onOpenComments={() => setActiveCommentPostId(reel.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Comments slide-up panel */}
        {activeCommentPostId && (
          <CommentsPanel
            postId={activeCommentPostId}
            onClose={() => setActiveCommentPostId(null)}
            onCommentAdded={(newCount) => {
              setReels(
                reels.map((r) =>
                  r.id === activeCommentPostId
                    ? { ...r, comment_count: newCount }
                    : r
                )
              );
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Reel Card ────────────────────────────────────────────────────────────────
function ReelCard({
  reel,
  onOpenComments,
}: {
  reel: FacePost;
  onOpenComments: () => void;
}) {
  const { user } = useAuth();
  const { incrementViewed } = useReels();
  const videoRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasCountedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likes, setLikes] = useState(reel.like_count);
  const [isLiked, setIsLiked] = useState(!!reel.is_liked);
  const apiUrl = env.apiUrl;

  // ── Intersection observer (auto-play when in view) ────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Increment fatigue count once per reel when it first becomes visible
  useEffect(() => {
    if (isVisible && !hasCountedRef.current) {
      hasCountedRef.current = true;
      incrementViewed();
    }
  }, [isVisible, incrementViewed]);

  // Auto play / pause based on visibility
  useEffect(() => {
    if (videoElementRef.current) {
      if (isVisible) {
        videoElementRef.current.play().catch((e) =>
          console.log("Play interrupted", e)
        );
        setIsPlaying(true);
      } else {
        videoElementRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isVisible]);

  const togglePlayback = () => {
    if (videoElementRef.current) {
      if (isPlaying) {
        videoElementRef.current.pause();
        setIsPlaying(false);
      } else {
        videoElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Optimistic UI update
    if (isLiked) {
      setLikes((l) => Math.max(0, l - 1));
      setIsLiked(false);
    } else {
      setLikes((l) => l + 1);
      setIsLiked(true);
    }

    if (user) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        const response = await fetch(`${apiUrl}/api/feed/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ postId: reel.id }),
        });
        if (!response.ok) {
          console.error("Backend like update failed", await response.text());
          throw new Error("Backend like update failed");
        }
      } catch (err) {
        console.error("Like request failed", err);
        // Rollback
        if (isLiked) {
          setLikes((l) => l + 1);
          setIsLiked(true);
        } else {
          setLikes((l) => Math.max(0, l - 1));
          setIsLiked(false);
        }
      }
    }
  };

  return (
    <div
      className="flex items-end justify-center gap-4 sm:gap-6 h-full max-h-[850px] w-full"
      data-active={isVisible ? "true" : undefined}
    >
      {/* ── Video Container ──────────────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl overflow-hidden relative h-full aspect-[9/16] shadow-2xl shrink-0 group">
        {/* Video layer */}
        <div
          ref={videoRef}
          onClick={togglePlayback}
          onDoubleClick={handleLike}
          className={`absolute inset-0 bg-black transition-opacity duration-700 flex items-center justify-center cursor-pointer ${
            isVisible ? "opacity-100" : "opacity-50"
          }`}
        >
          <video
            ref={videoElementRef}
            src={`${apiUrl}/api/feed/stream/${reel.telegram_file_id}`}
            playsInline={true}
            loop={true}
            muted={true}
            preload="metadata"
            className="relative z-10 w-full h-full object-cover"
          />

          {/* Paused indicator */}
          {!isPlaying && isVisible && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
              </div>
            </div>
          )}

          {/* Out-of-view indicator */}
          {!isVisible && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
              <span className="text-white/30 text-xs font-mono tracking-tight">PAUSED</span>
            </div>
          )}
        </div>

        {/* Bottom overlay (user info + caption only) */}
        <div className="absolute inset-x-0 bottom-0 p-5 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2 z-30 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Link
              href={`/user/${reel.user_id}`}
              className="hover:scale-105 transition-transform shrink-0"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-white/20" />
            </Link>
            <Link href={`/user/${reel.user_id}`} className="hover:underline">
              <span className="text-white font-bold text-sm tracking-tight drop-shadow-md">
                @{reel.username || "anonymous"}
              </span>
            </Link>
            {reel.badge_tier && (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.08] text-[10px] font-bold text-white/60 tracking-wider">
                {reel.badge_tier}
              </span>
            )}
          </div>
          <p className="text-white/80 text-sm leading-relaxed pr-2 line-clamp-3 pointer-events-auto drop-shadow-md">
            {reel.caption || `Path: ${reel.telegram_file_id}`}
          </p>
        </div>
      </div>

      {/* ── Outside Interaction Buttons ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 pb-4 shrink-0">
        {/* Like */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            type="button"
            onClick={handleLike}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 520, damping: 18 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
              isLiked
                ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                : "bg-white/[0.03] backdrop-blur-md border-white/[0.08] text-white/80 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <motion.div
              animate={{ scale: isLiked ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-5 h-5 ${isLiked ? "fill-rose-400" : ""}`}
                strokeWidth={isLiked ? 2 : 1.5}
              />
            </motion.div>
          </motion.button>
          <span className="text-white/60 text-xs font-bold tracking-tight">{likes}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            onClick={onOpenComments}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.03] backdrop-blur-md border border-white/[0.08] text-white/80 hover:bg-white/[0.08] hover:text-white transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
          </motion.button>
          <span className="text-white/60 text-xs font-bold tracking-tight">
            {reel.comment_count || 0}
          </span>
        </div>

        {/* Share */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white/[0.03] backdrop-blur-md border border-white/[0.08] text-white/80 hover:bg-white/[0.08] hover:text-white transition-all duration-300"
        >
          <Share2 className="w-5 h-5" strokeWidth={1.5} />
        </motion.button>

        {/* More */}
        <motion.button
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="w-12 h-12 mt-2 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.03] transition-colors"
        >
          <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  );
}
