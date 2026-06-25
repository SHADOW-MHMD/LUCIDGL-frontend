"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MessageCircle, Share2, MoreVertical, ShieldAlert } from "lucide-react";
import type { FacePost } from "@/types";

export default function ReelsPage() {
  const { user } = useAuth();
  const [reels, setReels] = useState<FacePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const apiUrl = "https://lucid-gl.muhammed1515mishal.workers.dev";
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin"></div>
        <p className="text-white/60 animate-pulse">Loading Feed...</p>
      </div>
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
      <div className="w-full max-w-md flex flex-col gap-8 snap-y snap-mandatory h-[calc(100vh-120px)] overflow-y-auto pb-20 no-scrollbar">
        {reels.length === 0 ? (
          <div className="text-center text-slate-400 mt-20">No media available.</div>
        ) : (
          reels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))
        )}
      </div>
    </div>
  );
}

function ReelCard({ reel }: { reel: FacePost }) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likes, setLikes] = useState(reel.like_count);
  const [isLiked, setIsLiked] = useState(!!reel.is_liked);

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
        const token = await user.getIdToken();
        const apiUrl = "https://lucid-gl.muhammed1515mishal.workers.dev";
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
        }
      } catch (err) {
        console.error("Like request failed", err);
      }
    }
  };

  return (
    <div className="snap-center shrink-0 w-full aspect-[9/16] rounded-[2.5rem] bg-slate-900 border border-white/10 overflow-hidden relative shadow-2xl flex flex-col">
      {/* Actual Video Container */}
      <div 
        ref={videoRef}
        onClick={togglePlayback}
        className={`absolute inset-0 bg-black transition-opacity duration-700 flex items-center justify-center cursor-pointer ${isVisible ? 'opacity-100' : 'opacity-50'}`}
      >
        <video
          ref={videoElementRef}
          src={reel.videoUrl}
          playsInline={true}
          loop={true}
          muted={true}
          preload="metadata"
          className="relative z-10 w-full h-full object-cover"
        />
        {!isPlaying && isVisible && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <span className="text-white font-bold text-xs tracking-widest">PAUSED</span>
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
      <div className={`absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end z-30 transition-opacity duration-300 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/20"></div>
            <span className="font-bold text-white shadow-sm">@{reel.username || "anonymous"}</span>
            {reel.badge_tier && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white tracking-wider">
                {reel.badge_tier}
              </span>
            )}
          </div>
          <p className="text-white/90 text-sm drop-shadow-md pr-4">{reel.caption || `Path: ${reel.videoUrl}`}</p>
        </div>

        <div className="flex flex-col gap-6 items-center z-40">
          <button type="button" onClick={handleLike} className="flex flex-col items-center gap-1 group relative z-40">
            <div className={`p-3 rounded-full backdrop-blur-md transition-all ${isLiked ? 'bg-red-500/20 text-red-500' : 'bg-black/20 text-white group-hover:bg-white/10'}`}>
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500' : ''}`} />
            </div>
            <span className="text-white font-medium text-xs drop-shadow-md">{likes}</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 group">
            <div className="p-3 rounded-full bg-black/20 text-white backdrop-blur-md transition-all group-hover:bg-white/10">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-white font-medium text-xs drop-shadow-md">0</span>
          </button>

          <button className="flex flex-col items-center gap-1 group">
            <div className="p-3 rounded-full bg-black/20 text-white backdrop-blur-md transition-all group-hover:bg-white/10">
              <Share2 className="w-6 h-6" />
            </div>
          </button>

          <button className="p-2 text-white/80 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
