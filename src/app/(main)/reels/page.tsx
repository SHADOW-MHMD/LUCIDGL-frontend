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
  return <div className="skeleton aspect-[9/16] w-80 rounded-3xl" />;
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
    <div className="bg-black min-h-screen flex items-center justify-center py-8">
      <div className="flex flex-col items-center w-full">
        {/* Snap feed */}
        <motion.div
          id="reels-feed-container"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-8 snap-y snap-mandatory h-[calc(100vh-120px)] overflow-y-auto pb-20 no-scrollbar"
        >
          {reels.map((reel) => (
            <motion.div key={reel.id} variants={cardVariants} className="snap-center shrink-0">
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
      className="bg-[#0a0a0a] border border-white/[0.08] rounded-3xl overflow-hidden relative aspect-[9/16] w-80 shadow-2xl"
      data-active={isVisible ? "true" : undefined}
    >
      {/* ── Video layer ──────────────────────────────────────────────────── */}
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

        {/* Paused indicator (visible & in-viewport) */}
        {!isPlaying && isVisible && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.12] flex items-center justify-center">
              <span className="text-white/60 font-medium text-[10px] tracking-[0.2em]">
                PAUSED
              </span>
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

      {/* ── Bottom overlay ────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex justify-between items-end z-30">
        {/* Left: user info + caption */}
        <div className="flex flex-col gap-2 flex-1 mr-3">
          {/* Avatar + username */}
          <div className="flex items-center gap-2">
            <Link
              href={`/user/${reel.user_id}`}
              className="hover:scale-105 transition-transform shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-white/20" />
            </Link>
            <Link href={`/user/${reel.user_id}`} className="hover:underline">
              <span className="text-white font-bold text-sm tracking-tight">
                @{reel.username || "anonymous"}
              </span>
            </Link>
            {reel.badge_tier && (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.08] text-[10px] font-bold text-white/60 tracking-wider">
                {reel.badge_tier}
              </span>
            )}
          </div>

          {/* Caption */}
          <p className="text-white/80 text-xs leading-relaxed pr-2 line-clamp-3">
            {reel.caption || `Path: ${reel.telegram_file_id}`}
          </p>
        </div>

        {/* Right: interaction buttons */}
        <div className="flex flex-col gap-4 items-center shrink-0">
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              type="button"
              onClick={handleLike}
              whileTap={{ scale: 1.45 }}
              transition={{ type: "spring", stiffness: 520, damping: 18 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${
                isLiked
                  ? "bg-rose-500/25 border-rose-500/30 text-rose-400"
                  : "bg-black/40 backdrop-blur-md border-white/[0.12] text-white/80 hover:bg-white/[0.12] hover:text-white"
              }`}
            >
              <motion.div
                animate={{ scale: isLiked ? [1, 1.35, 1] : 1 }}
                transition={{ duration: 0.28 }}
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? "fill-rose-400" : ""}`}
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.button>
            <span className="text-white/70 text-[11px] font-medium tracking-tight">{likes}</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              onClick={onOpenComments}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/[0.12] text-white/80 hover:bg-white/[0.12] hover:text-white transition-colors"
            >
              <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
            </motion.button>
            <span className="text-white/70 text-[11px] font-medium tracking-tight">
              {reel.comment_count || 0}
            </span>
          </div>

          {/* Share */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/[0.12] text-white/80 hover:bg-white/[0.12] hover:text-white transition-colors"
          >
            <Share2 className="w-5 h-5" strokeWidth={1.5} />
          </motion.button>

          {/* More */}
          <motion.button
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
