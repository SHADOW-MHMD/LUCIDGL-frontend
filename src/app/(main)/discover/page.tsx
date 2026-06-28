"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Code2, Image as ImageIcon, Download, Heart, Zap } from "lucide-react";

export default function DiscoverPage() {
  const [data, setData] = useState<{
    top_users: any[];
    trending_code: any[];
    top_faces: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiscover() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lucid-gl.muhammed1515mishal.workers.dev";
        
        const res = await fetch(`${apiUrl}/api/discover`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          // If the endpoint is mocked or fails, fallback to empty arrays to render empty states
          setData({ top_users: [], trending_code: [], top_faces: [] });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
          <p className="text-white/70 font-medium tracking-wide">Loading Discover...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-16">
      <div className="text-center mt-10">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Discover
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Explore top players, trending resources, and the most engaging content across the platform.
        </p>
      </div>

      {/* Apex Legends (Top Users) */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <h2 className="text-3xl font-bold text-white/90">Apex Legends</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.top_users?.slice(0, 3).map((user, i) => (
            <div key={user.id || i} className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-3xl p-6 shadow-xl hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  #{i + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.username || 'User'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      Lvl {user.level || 1}
                    </span>
                    {user.nitro_tier && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Tier {user.nitro_tier}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/20 rounded-xl p-3">
                <span className="text-slate-400 text-sm">Experience</span>
                <span className="text-white font-mono font-bold">{user.xp || 0} XP</span>
              </div>
            </div>
          ))}
          {(!data?.top_users || data.top_users.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-center py-10 text-slate-500">
              No legends found yet.
            </div>
          )}
        </div>
      </section>

      {/* Trending Code */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Code2 className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white/90">Trending Code</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.trending_code?.slice(0, 3).map((code, i) => (
            <div key={code.id || i} className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-3xl p-6 shadow-xl hover:bg-white/[0.05] transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white line-clamp-2">{code.title || 'Code Snippet'}</h3>
                  <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                    {code.type?.toUpperCase() || (code.file_url?.endsWith('.apk') ? 'APK' : 'ZIP')}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-6 line-clamp-3">{code.description || 'No description provided.'}</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">{code.author_name || 'Anonymous'}</span>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-400/10 px-3 py-1 rounded-full">
                  <Download className="w-4 h-4" />
                  <span>{code.downloads || 0}</span>
                </div>
              </div>
            </div>
          ))}
          {(!data?.trending_code || data.trending_code.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-center py-10 text-slate-500">
              No trending code found yet.
            </div>
          )}
        </div>
      </section>

      {/* Top Faces */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-8 h-8 text-pink-400" />
          <h2 className="text-3xl font-bold text-white/90">Top Faces</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.top_faces?.slice(0, 3).map((post, i) => (
            <div key={post.id || i} className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-3xl overflow-hidden shadow-xl hover:bg-white/[0.05] transition-all group">
              <div className="aspect-[4/5] bg-black/40 relative overflow-hidden">
                {post.media_url ? (
                  <img src={post.media_url} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">No Media</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">
                    {post.caption || 'No caption'}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-white/80 text-xs font-semibold">{post.author_name || 'User'}</span>
                    <div className="flex items-center gap-1.5 text-pink-400 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                      <Heart className="w-4 h-4 fill-pink-400" />
                      <span className="text-sm font-bold">{post.likes || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!data?.top_faces || data.top_faces.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-center py-10 text-slate-500">
              No top faces found yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
