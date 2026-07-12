"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Heart,
  Play,
  Download,
  MessageSquare,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const FeatureSection = ({
  title,
  description,
  reversed,
  mockUI,
}: {
  title: string;
  description: string;
  reversed?: boolean;
  mockUI: React.ReactNode;
}) => (
  <div
    className={`flex flex-col gap-12 lg:gap-20 items-center justify-between max-w-7xl mx-auto px-6 py-24 ${
      reversed ? "lg:flex-row-reverse" : "lg:flex-row"
    }`}
  >
    <motion.div
      className="flex-1 space-y-6"
      initial={{ opacity: 0, x: reversed ? 32 : -32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
        {title}
      </h2>
      <p className="text-lg text-white/40 leading-relaxed max-w-xl">{description}</p>
    </motion.div>

    <motion.div
      className="flex-1 flex justify-center items-center w-full"
      initial={{ opacity: 0, x: reversed ? -32 : 32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="w-full max-w-md flex justify-center relative">{mockUI}</div>
    </motion.div>
  </div>
);

// Terminal mock UI
const TerminalMock = () => (
  <div className="w-full max-w-sm font-mono text-sm bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-5 shadow-[0_0_60px_-10px_rgba(255,255,255,0.08)]">
    {/* macOS stoplight dots */}
    <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-3">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-rose-500" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
      </div>
      <span className="text-white/30 text-xs ml-2">server.ts</span>
    </div>
    <pre className="text-xs overflow-x-hidden leading-relaxed">
      <code>
        <span className="text-violet-400">import</span>
        {" { serve } "}
        <span className="text-violet-400">from</span>{" "}
        <span className="text-emerald-400">&quot;bun&quot;</span>;{"\n\n"}
        serve({"{"}
        {"\n"}
        {"  "}port:{" "}
        <span className="text-amber-400">3000</span>,{"\n"}
        {"  "}fetch(req) {"{"}
        {"\n"}
        {"    "}
        <span className="text-violet-400">return new</span> Response(
        <span className="text-emerald-400">&quot;Online&quot;</span>);{"\n"}
        {"  "}
        {"}"},{"\n"}
        {"}"});
      </code>
    </pre>
    <div className="mt-5 flex justify-end">
      <button className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] text-white/60 border border-white/[0.08] rounded-lg transition-colors text-xs font-sans font-medium">
        <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
        Download ZIP
      </button>
    </div>
  </div>
);

// Video / Reels mock UI
const ReelsMock = () => (
  <div className="aspect-[9/16] w-56 bg-[#0a0a0a] border border-white/[0.08] shadow-2xl rounded-3xl relative overflow-hidden flex flex-col justify-end p-4">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90 z-0" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white z-10 border border-white/20">
      <Play className="w-5 h-5 ml-0.5 fill-white" strokeWidth={1.5} />
    </div>
    <div className="relative z-10 flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <h4 className="font-bold text-white text-sm drop-shadow-md">
            Building the future
          </h4>
          <p className="text-white/50 text-xs drop-shadow-md">@creator_pro</p>
        </div>
        <div className="flex flex-col items-center gap-1 text-white">
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" strokeWidth={1.5} />
          </div>
          <span className="text-xs font-medium text-white/60">12.4K</span>
        </div>
      </div>
    </div>
  </div>
);

// Chat mock UI
const ChatMock = () => (
  <div className="w-full max-w-sm flex flex-col gap-3">
    <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-none p-3 max-w-[78%] self-start">
      <p className="text-sm text-white/80">
        Did you see the latest UI update? It&apos;s incredibly smooth! 🔥
      </p>
    </div>
    <div className="bg-[var(--accent-color)]/20 border border-[var(--accent-color)]/30 rounded-2xl rounded-tr-none p-3 max-w-[78%] self-end">
      <p className="text-sm text-white/80">
        Yes! The floating animations are a really nice touch.
      </p>
    </div>
    <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-none p-3 max-w-[78%] self-start">
      <p className="text-sm text-white/80">
        Can&apos;t wait to try the new API endpoints.
      </p>
    </div>
  </div>
);

// XP / Gamification mock UI
const XPMock = () => (
  <div className="w-full max-w-sm bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] shadow-xl rounded-2xl p-6 relative overflow-hidden">
    {/* Background accent glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/10 to-transparent pointer-events-none" />
    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
      <Zap size={100} />
    </div>

    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className="w-14 h-14 rounded-full bg-[var(--accent-color)]/20 border border-[var(--accent-color)]/30 flex items-center justify-center text-sm font-black text-white">
        Lv42
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">Alex Developer</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="px-2 py-0.5 rounded-full bg-[var(--accent-color)]/20 text-[var(--accent-color)] text-xs font-semibold uppercase tracking-wider border border-[var(--accent-color)]/30">
            Nitro Active
          </span>
        </div>
      </div>
    </div>

    <div className="space-y-2 relative z-10">
      <div className="flex justify-between text-sm text-white/50">
        <span>XP Progress</span>
        <span>8,450 / 10,000</span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent-color)] rounded-full shadow-[0_0_10px_var(--accent-color)]"
          style={{ width: "84%" }}
        />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Feature card config
// ---------------------------------------------------------------------------
const FEATURE_CARDS = [
  {
    icon: Zap,
    title: "Gamification",
    description: "Earn XP, unlock badges, and climb the leaderboard.",
  },
  {
    icon: Play,
    title: "Infinite Reels",
    description: "Zero-buffer video delivery wrapped in cinematic UI.",
  },
  {
    icon: Download,
    title: "Code Hub",
    description: "Share snippets, ZIPs, or APKs — instantly and securely.",
  },
  {
    icon: MessageSquare,
    title: "Communities",
    description: "WebSocket-powered chat that arrives before you stop typing.",
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function Home() {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/reels");
    }
  }, [user, loading, router]);

  if (user || loading) return null;

  return (
    <motion.div
      className="min-h-screen bg-black overflow-hidden font-sans"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative flex flex-col items-center justify-center pt-36 pb-24 px-6 text-center">
        {/* Radial white glow aura */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-white/60 text-sm font-medium mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          v2.0 Engine Online
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent"
        >
          The Next Generation
          <br className="hidden md:block" />
          of{" "}
          <span className="bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            Agentic Interfaces
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="text-lg md:text-xl text-white/40 max-w-2xl mb-12 leading-relaxed"
        >
          Experience zero-latency interactions with our optimistic UI updates,
          bulletproof hydration firewalls, and premium aesthetic design.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <motion.button
            onClick={signIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="inline-flex items-center gap-2 bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.12)] text-base"
          >
            Start your journey
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </motion.button>
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Feature overview cards                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={cardVariants}
              className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-6 hover:border-[var(--accent-color)]/30 hover:bg-white/[0.05] transition-all duration-200 cursor-default"
            >
              <div className="mb-4 w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                <Icon className="w-4 h-4 text-white/60" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Feature Sections                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col relative z-10 border-t border-white/[0.04]">
        <FeatureSection
          title="Gamification at its core"
          description="Level up as you engage. Earn XP, collect badges, and showcase your achievements with our built-in progression system designed to keep you coming back for more."
          reversed={false}
          mockUI={<XPMock />}
        />

        <div className="border-t border-white/[0.04]" />

        <FeatureSection
          title="Infinite Reels Feed"
          description="Immerse yourself in a continuous stream of content. Our optimized video delivery network ensures instant playback and zero buffering, wrapped in a beautiful cinematic UI."
          reversed={true}
          mockUI={<ReelsMock />}
        />

        <div className="border-t border-white/[0.04]" />

        <FeatureSection
          title="Developer Code Hub"
          description="Share and deploy instantly. Whether it's a quick snippet, a full ZIP archive, or an APK, our integrated hub makes sharing code assets seamless and secure."
          reversed={false}
          mockUI={<TerminalMock />}
        />

        <div className="border-t border-white/[0.04]" />

        <FeatureSection
          title="Real-time Communities"
          description="Connect with like-minded creators in dedicated spaces. High-performance WebSocket chat ensures your messages arrive before you even finish typing."
          reversed={true}
          mockUI={<ChatMock />}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Final CTA                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative flex flex-col items-center justify-center py-36 px-6 text-center border-t border-white/[0.04]">
        {/* Glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(255,255,255,0.05) 0%, transparent 70%)",
          }}
        />

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6"
        >
          Ready to dive in?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-lg text-white/40 max-w-xl mb-10"
        >
          Join thousands of developers and creators building the next generation
          of applications.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <motion.button
            onClick={signIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="inline-flex items-center gap-2 bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-white/90 shadow-[0_0_60px_rgba(255,255,255,0.18)] text-base"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
