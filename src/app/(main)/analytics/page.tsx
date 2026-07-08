"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@/types";
import { Eye, Download, ThumbsUp, Loader2, BarChart3, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { env } from "@/lib/env";

const apiUrl = env.apiUrl;

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    let rafId: number;
    const tick = () => {
      step++;
      current = Math.min(current + increment, value);
      setDisplay(Math.round(current));
      if (step < steps) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
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

  const chartData = analytics
    ? [
        { label: "Impressions", value: analytics.impressions, color: "from-indigo-400 to-cyan-400" },
        { label: "Downloads", value: analytics.downloads, color: "from-cyan-400 to-emerald-400" },
        { label: "Upvotes", value: analytics.upvotes_received, color: "from-violet-400 to-fuchsia-400" },
      ]
    : [];

  const peakValue = Math.max(...chartData.map((item) => item.value), 1);
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

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
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-white/65 text-xs uppercase tracking-[0.35em] mb-4">
            <BarChart3 size={14} />
            Live signals
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Analytics</h1>
          <p className="text-white/50 mt-3 text-sm md:text-base">Your performance at a glance, with a little more visual rhythm.</p>
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
          <div className="space-y-6">
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
                  className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-[1.5rem] p-6 flex flex-col items-center text-center hover:bg-white/[0.04] hover:border-indigo-500/20 transition-colors duration-300 cursor-default"
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

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl shadow-[0_18px_70px_rgba(0,0,0,0.25)]"
              >
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-300" />
                      Engagement mix
                    </p>
                    <p className="text-white/45 text-sm mt-1">A simple read on where the momentum is landing.</p>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300 text-xs font-semibold">
                    Total {totalValue.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-4">
                  {chartData.map((item, index) => {
                    const share = peakValue === 0 ? 0 : Math.max((item.value / peakValue) * 100, 12);
                    return (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/70">{item.label}</span>
                          <span className="text-white font-semibold tabular-nums">{item.value.toLocaleString()}</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden border border-white/[0.05]">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${share}%` }}
                            transition={{ duration: 0.8, delay: 0.25 + index * 0.08, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.32 }}
                className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl shadow-[0_18px_70px_rgba(0,0,0,0.25)] space-y-5"
              >
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Zap className="w-4 h-4 text-violet-300" />
                  Momentum notes
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {chartData.map((item) => {
                    const ratio = peakValue === 0 ? 0 : item.value / peakValue;
                    return (
                      <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-black/20 p-3 text-center">
                        <div className={`mx-auto mb-3 h-20 w-3 rounded-full overflow-hidden bg-white/[0.06]`}>
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-t ${item.color}`}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(ratio * 100, 8)}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">{item.label}</p>
                        <p className="text-white font-semibold text-sm mt-1">{item.value.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/60">Best performing signal</span>
                    <span className="text-cyan-300 font-semibold">{chartData.find((item) => item.value === peakValue)?.label ?? "None"}</span>
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed">
                    The bars here are derived from your live counts, so the layout stays honest even when the numbers get weird.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
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
