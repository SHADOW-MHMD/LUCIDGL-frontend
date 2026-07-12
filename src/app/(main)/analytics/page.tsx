"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Analytics } from "@/types";
import { Eye, Download, ThumbsUp, BarChart3, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { env } from "@/lib/env";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  CartesianGrid,
} from "recharts";

const apiUrl = env.apiUrl;

// ─── AnimatedNumber — logic 100% identical ───────────────────────────────────
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

// ─── Custom Tooltip for BarChart ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.12] bg-black/80 backdrop-blur-md px-4 py-3 text-sm shadow-xl">
      <p className="text-white/50 uppercase tracking-widest text-[10px] mb-1">{label}</p>
      <p className="text-white font-bold text-base">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 flex flex-col gap-4">
      <div className="skeleton h-4 w-24 rounded-lg" />
      <div className="skeleton h-12 w-32 rounded-xl" />
      <div className="skeleton h-3 w-20 rounded-lg" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
        },
        {
          label: "File Downloads",
          value: analytics.downloads,
          icon: Download,
        },
        {
          label: "Upvotes Received",
          value: analytics.upvotes_received,
          icon: ThumbsUp,
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

  // Recharts bar data
  const barData = chartData.map((item) => ({ name: item.label, value: item.value }));

  // Engagement score: normalised 0-100 based on total vs a soft ceiling of peakValue*3
  const engagementScore = Math.min(Math.round((totalValue / Math.max(peakValue * 3, 1)) * 100), 100);
  const radialData = [{ name: "Engagement", value: engagementScore, fill: "var(--accent-color)" }];

  // ─── Framer variants ────────────────────────────────────────────────────────
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="bg-black min-h-screen"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-5xl mx-auto px-8 py-16 space-y-12">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <BarChart3 size={20} strokeWidth={1.5} className="text-[var(--accent-color)]" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white leading-none">Analytics</h1>
            <p className="text-white/40 text-sm mt-1">Your performance at a glance.</p>
          </div>
        </motion.div>

        {/* ── Loading ── */}
        {loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-52 rounded-2xl" />
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle size={48} strokeWidth={1.5} className="text-red-500/50" />
            <p className="text-red-400/70 text-sm">{error}</p>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && analytics && (
          <div className="space-y-8">

            {/* Stat cards */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {stats.map(({ label, value, icon: Icon }) => (
                <motion.div
                  key={label}
                  variants={cardVariants}
                  whileHover={{
                    y: -6,
                    transition: { type: "spring", stiffness: 320, damping: 22 },
                  }}
                  className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 flex flex-col gap-4 hover:border-[var(--accent-color)]/30 hover:bg-white/[0.05] transition-colors duration-300 cursor-default"
                >
                  <Icon size={20} strokeWidth={1.5} className="text-[var(--accent-color)]" />
                  <motion.span
                    className="text-5xl font-black text-white tabular-nums"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                  >
                    <AnimatedNumber value={value} />
                  </motion.span>
                  <span className="text-white/40 text-sm uppercase tracking-widest font-medium">
                    {label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* BarChart */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8"
            >
              <div className="flex items-center gap-2 mb-6">
                <Activity size={16} strokeWidth={1.5} className="text-[var(--accent-color)]" />
                <p className="text-white font-semibold text-sm">Engagement mix</p>
                <span className="ml-auto rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-white/40 text-xs font-medium">
                  Total {totalValue.toLocaleString()}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={40} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" fill="var(--accent-color)" radius={[6, 6, 0, 0]} opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* RadialBarChart — engagement score */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.38 }}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-10"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm mb-1">Overall engagement score</p>
                <p className="text-white/40 text-sm leading-relaxed">
                  A normalised read on how your three signals compare to your peak metric. The arc fills as your totals climb relative to your best-performing signal.
                </p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-5xl font-black text-white tabular-nums">{engagementScore}</span>
                  <span className="text-white/30 text-lg font-medium mb-1">/ 100</span>
                </div>
                <p className="text-white/30 text-xs uppercase tracking-widest mt-1">Engagement index</p>
              </div>

              <div className="shrink-0">
                <ResponsiveContainer width={180} height={180}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={82}
                    startAngle={210}
                    endAngle={-30}
                    data={radialData}
                    barSize={14}
                  >
                    <RadialBar
                      dataKey="value"
                      background={{ fill: "rgba(255,255,255,0.04)" }}
                      cornerRadius={8}
                      data={radialData}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

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
