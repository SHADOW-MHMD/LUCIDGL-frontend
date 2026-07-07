"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MessageCircle, Share2, MoreVertical, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { FacePost } from "@/types";
import { CommentsPanel } from "@/components/CommentsPanel";
import { motion } from "framer-motion";
import { env } from "@/lib/env";
import { useReels } from "@/components/ReelsContext";

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
            Authorization: `Bearer ${token}`
          }
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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      >
        <div className="w-12 h-12 border-4 border-t-indigo-500 border-white/[0.08] rounded-full animate-spin"></div>
        <p className="text-white/50 animate-pulse">Loading Feed...</p>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
        <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
        <p className="text-slate-400">You must be signed in to view the media feed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6">
      <div 
        id="reels-feed-container"
        className="w-full max-w-md flex flex-col gap-8 snap-y snap-mandatory h-[calc(100vh-120px)] overflow-y-auto pb-20 no-scrollbar relative"
      >
        {reels.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">No media available.</div>
        ) : (
          reels.map((reel, index) => (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
            >
              <ReelCard
                reel={reel}
                onOpenComments={() => setActiveCommentPostId(reel.id)}
              />
            </motion.div>
          ))
        )}
      </div>

      {activeCommentPostId && (
        <CommentsPanel
          postId={activeCommentPostId}
          onClose={() => setActiveCommentPostId(null)}
          onCommentAdded={(newCount) => {
            setReels(reels.map(r => r.id === activeCommentPostId ? { ...r, comment_count: newCount } : r));
          }}
        />
      )}
    </div>
  );
}

function ReelCard({ reel, onOpenComments }: { reel: FacePost; onOpenComments: () => void }) {
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

  useEffect(() => {
    if (videoElementRef.current) {
      if (isVisible) {
        videoElementRef.current.play().catch(e => console.log("Play interrupted", e));
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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const apiUrl = env.apiUrl;
        const response = await fetch(`${apiUrl}/api/feed/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ postId: reel.id })
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
      className="snap-center shrink-0 w-full aspect-[9/16] rounded-[2.5rem] bg-[#0d0d1a] border border-white/[0.08] overflow-hidden relative shadow-2xl flex flex-col"
      data-active={isVisible ? "true" : undefined}
    >
      {/* Actual Video Container */}
      <div 
        ref={videoRef}
        onClick={togglePlayback}
        onDoubleClick={handleLike}
        className={`absolute inset-0 bg-black transition-opacity duration-700 flex items-center justify-center cursor-pointer ${isVisible ? 'opacity-100' : 'opacity-50'}`}
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
        {!isPlaying && isVisible && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-md border border-white/[0.08] flex items-center justify-center">
              <span className="text-white/60 font-medium text-xs tracking-[0.2em]">PAUSED</span>
            </div>
          </div>
        )}
        {!isVisible && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <span className="text-white/30 text-xs font-mono">PAUSED</span>
          </div>
        )}
      </div>

      {/* Overlays */}
      <div className={`absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end z-30 transition-opacity duration-300 opacity-100`}>
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-white/20"></div>
            <span className="font-bold text-white shadow-sm">@{reel.username || "anonymous"}</span>
            {reel.badge_tier && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/20 text-[10px] font-bold text-indigo-200 tracking-wider">
                {reel.badge_tier}
              </span>
            )}
          </div>
          <p className="text-white/90 text-sm drop-shadow-md pr-4">{reel.caption || `Path: ${reel.telegram_file_id}`}</p>
        </div>

        <div className="flex flex-col gap-6 items-center z-40">
          <motion.button
            type="button"
            onClick={handleLike}
            whileTap={{ scale: 1.4 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="flex flex-col items-center gap-1 group relative z-40"
          >
            <motion.div
              animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded-full backdrop-blur-md transition-colors ${isLiked ? 'bg-rose-500/20 text-rose-400' : 'bg-black/30 text-white/80 group-hover:bg-white/[0.12]'}`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-400' : ''}`} />
            </motion.div>
            <span className="text-white font-medium text-xs drop-shadow-md">{likes}</span>
          </motion.button>
          
          <motion.button
            onClick={onOpenComments}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex flex-col items-center gap-1 group relative z-40"
          >
            <div className="p-3 rounded-full bg-black/30 text-white/80 backdrop-blur-md transition-all group-hover:bg-white/[0.12]">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-white font-medium text-xs drop-shadow-md">{reel.comment_count || 0}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="p-3 rounded-full bg-black/30 text-white/80 backdrop-blur-md transition-all group-hover:bg-white/[0.12]">
              <Share2 className="w-6 h-6" />
            </div>
          </motion.button>

          <motion.button
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
