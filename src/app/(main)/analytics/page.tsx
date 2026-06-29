"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@/types";
import { Eye, Download, ThumbsUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lucid-gl.muhammed1515mishal.workers.dev";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, value);
      setDisplay(Math.round(current));
      if (step >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

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
        {
          label: "Profile Impressions",
          value: analytics.impressions,
          icon: Eye,
          color: "text-indigo-400",
          bg: "bg-indigo-500/10",
          border: "border-indigo-500/20"
        },
        {
          label: "File Downloads",
          value: analytics.downloads,
          icon: Download,
          color: "text-cyan-400",
          bg: "bg-cyan-500/10",
          border: "border-cyan-500/20"
        },
        {
          label: "Upvotes Received",
          value: analytics.upvotes_received,
          icon: ThumbsUp,
          color: "text-violet-400",
          bg: "bg-violet-500/10",
          border: "border-violet-500/20"
        },
      ]
    : [];

  return (
    <motion.div
      className="min-h-screen pt-28 pb-16 px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-white/50 mt-2 text-sm">Your performance at a glance</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="text-indigo-400/40 animate-spin" size={40} />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1, delayChildren: 0.2 }
              }
            }}
          >
            {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
              <motion.div
                key={label}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                }}
                whileHover={{
                  y: -6,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors duration-300 cursor-default"
              >
                <div className={`p-3 rounded-xl ${bg} border ${border} mb-4`}>
                  <Icon size={24} className={color} />
                </div>
                <motion.span
                  className="text-5xl font-bold text-white tabular-nums"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <AnimatedNumber value={value} />
                </motion.span>
                <span className="text-white/40 text-xs mt-2 font-medium uppercase tracking-wider">
                  {label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Footer note */}
        {!loading && !error && (
          <motion.p
            className="text-center text-white/20 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            Stats refresh on each page load
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
