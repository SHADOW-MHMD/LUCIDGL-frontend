"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { env } from "@/lib/env";
import { MessageSquare, Link2, User2, Code2, PlaySquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  xp_points: number;
  streak_count: number;
  badge_tier: string;
  nitro_tier: number;
  twitter_url?: string;
  github_url?: string;
  website_url?: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  telegram_file_id: string;
  caption?: string;
  like_count: number;
  comment_count?: number;
  download_count?: number;
  file_name?: string;
  file_type?: string;
  created_at: string;
  post_type: 'reel' | 'code';
  is_liked?: number;
}

export default function UserProfilePage() {
  const { id: userId } = useParams() as { id: string };
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const currentId = sessionData.session?.user?.id;
        if (currentId) setCurrentUser(currentId);

        if (!token) throw new Error("No access token");

        const [profileRes, postsRes] = await Promise.all([
          fetch(`${env.apiUrl}/api/users/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${env.apiUrl}/api/users/profile/${userId}/posts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        } else {
          setError("User not found");
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) fetchData();
  }, [userId]);

  const handleMessage = async () => {
    if (!currentUser || !userId || currentUser === userId) return;
    
    // Check if DM already exists or route to messages page and open dm overlay.
    // Since direct DM creation API isn't immediately obvious in the frontend code,
    // we route the user to messages. The messages page typically handles empty state DMs
    // if configured, but as a basic feature we push to /messages and can add an alert if needed.
    router.push(`/messages`);
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen">
        <div className="w-full h-48 skeleton relative" />
        <div className="max-w-4xl mx-auto px-8">
          <div className="relative -mt-14 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex flex-col gap-4">
              <div className="w-28 h-28 rounded-full skeleton ring-4 ring-black ring-offset-0" />
              <div className="space-y-2 mt-2">
                <div className="h-8 w-48 skeleton rounded-lg" />
                <div className="h-4 w-64 skeleton rounded-lg" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="h-24 skeleton rounded-xl" />
            <div className="h-24 skeleton rounded-xl" />
            <div className="h-24 skeleton rounded-xl" />
          </div>
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white/40">
        <User2 size={64} strokeWidth={1} className="mb-4 opacity-50" />
        <p className="text-xl">{error || "User not found"}</p>
        <button onClick={() => router.back()} className="mt-6 px-6 py-2.5 bg-white text-black hover:bg-white/90 font-semibold rounded-xl transition">Go Back</button>
      </div>
    );
  }

  let currentLevel = 0;
  let totalXp = profile.xp_points || 0;
  while (totalXp >= (5 * Math.pow(currentLevel + 1, 2) + 50 * (currentLevel + 1) + 100)) {
    currentLevel += 1;
  }

  const gradientIndex = profile.username ? profile.username.charCodeAt(0) % 4 : 0;
  const gradients = [
    "from-violet-600/60 via-indigo-600/40 to-transparent",
    "from-emerald-600/60 via-teal-600/40 to-transparent",
    "from-cyan-600/60 via-blue-600/40 to-transparent",
    "from-rose-600/60 via-pink-600/40 to-transparent"
  ];
  const selectedGradient = gradients[gradientIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-black min-h-screen pb-24"
    >
      {/* Banner */}
      <div className={`w-full h-48 bg-gradient-to-b ${selectedGradient} relative`}>
        <div className="max-w-4xl mx-auto px-8 h-full flex flex-col justify-start pt-8">
           <button onClick={() => router.back()} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit">
            <ArrowLeft size={16} strokeWidth={1.5} /> Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8">
        {/* Header Content Wrapper */}
        <div className="relative -mt-14 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div className="w-28 h-28 rounded-full bg-zinc-900 ring-4 ring-black ring-offset-0 flex flex-shrink-0 items-center justify-center text-4xl font-bold text-white/50 overflow-hidden relative">
              {profile.avatar_url ? (
                 <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                 (profile.username || "U")[0].toUpperCase()
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">@{profile.username}</h1>
              <p className="text-white/40 text-sm mt-1 flex items-center">
                {profile.email} {profile.bio && <><span className="mx-2">•</span>{profile.bio}</>}
              </p>
              
              <div className="flex gap-4 mt-3 text-white/40 text-sm">
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-color)] transition flex items-center gap-1.5">
                    <Link2 size={14} strokeWidth={1.5} /> Twitter
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-color)] transition flex items-center gap-1.5">
                    <Link2 size={14} strokeWidth={1.5} /> GitHub
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-color)] transition flex items-center gap-1.5">
                    <Link2 size={14} strokeWidth={1.5} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {currentUser !== userId && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMessage}
              className="px-6 py-2.5 bg-white text-black hover:bg-white/90 rounded-xl font-semibold flex items-center gap-2 transition-colors sm:mb-2 w-fit"
            >
              <MessageSquare size={16} strokeWidth={1.5} /> Message
            </motion.button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <motion.div 
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-6 py-4 hover:border-[var(--accent-color)]/30 hover:bg-white/[0.05] transition-colors"
          >
            <div className="text-white/40 text-xs uppercase tracking-widest mb-1">XP Points</div>
            <div className="text-3xl font-black text-[var(--accent-color)]">{profile.xp_points}</div>
          </motion.div>
          <motion.div 
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-6 py-4 hover:border-[var(--accent-color)]/30 hover:bg-white/[0.05] transition-colors"
          >
            <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Level</div>
            <div className="text-3xl font-black text-[var(--accent-color)]">{currentLevel}</div>
          </motion.div>
          <motion.div 
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-6 py-4 hover:border-[var(--accent-color)]/30 hover:bg-white/[0.05] transition-colors"
          >
            <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Streak</div>
            <div className="text-3xl font-black text-[var(--accent-color)]">{profile.streak_count}</div>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-6">Recent Activity</h2>
          
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <PlaySquare size={48} strokeWidth={1} className="mb-4 opacity-50" />
              <p>No activity yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                  whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-[var(--accent-color)]/30 hover:bg-white/[0.05] transition-colors group relative flex flex-col"
                >
                  {post.post_type === 'reel' ? (
                    <Link href={`/reels`} className="block flex-1">
                      <div className="aspect-[9/16] bg-black/50 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlaySquare className="w-12 h-12 text-white/20 group-hover:text-[var(--accent-color)] transition-colors" strokeWidth={1.5} />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                          <p className="text-white text-sm line-clamp-2">{post.caption}</p>
                          <div className="text-white/50 text-xs mt-2 flex gap-3">
                            <span>{post.like_count} likes</span>
                            <span>{post.comment_count} comments</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link href={`/code`} className="block p-5 h-full min-h-[200px] flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center">
                          <Code2 size={20} strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-[var(--accent-color)]/70 border border-[var(--accent-color)]/20 px-2 py-1 rounded">Code</span>
                      </div>
                      <h3 className="text-white font-medium line-clamp-1 mb-2">{post.file_name}</h3>
                      <p className="text-white/50 text-xs line-clamp-3 mb-4">{post.caption}</p>
                      <div className="mt-auto text-white/40 text-xs">
                        {post.download_count} downloads
                      </div>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
