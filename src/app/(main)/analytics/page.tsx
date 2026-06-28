"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@/types";
import { Eye, Download, ThumbsUp, Loader2 } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lucid-gl.muhammed1515mishal.workers.dev";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`${apiUrl}/api/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = analytics
    ? [
        { label: "Profile Impressions", value: analytics.impressions, icon: Eye, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
        { label: "File Downloads", value: analytics.downloads, icon: Download, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        { label: "Upvotes Received", value: analytics.upvotes_received, icon: ThumbsUp, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
      ]
    : [];

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-white/50 mt-2 text-sm">Your performance at a glance</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="text-white/40 animate-spin" size={40} />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div
                key={label}
                className="bg-white/[0.03] backdrop-blur-lg border border-white/[0.1] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/[0.05] hover:border-white/[0.15] transition-all duration-300"
              >
                <div className={`p-3 rounded-xl ${bg} border ${border} mb-4`}>
                  <Icon size={24} className={color} />
                </div>
                <span className="text-5xl font-bold text-white tabular-nums">
                  {value.toLocaleString()}
                </span>
                <span className="text-white/50 text-sm mt-2 font-medium">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        {!loading && !error && (
          <p className="text-center text-white/25 text-xs">Stats refresh on each page load</p>
        )}
      </div>
    </div>
  );
}
