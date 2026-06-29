"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowRight, Zap, Shield, LayoutGrid, Heart, Play, Download, MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
}) => {
  return (
    <div className={`flex flex-col gap-12 lg:gap-20 items-center justify-between max-w-7xl mx-auto px-6 py-24 ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      <motion.div 
        className="flex-1 space-y-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-xl text-gray-400 leading-relaxed max-w-xl">{description}</p>
      </motion.div>
      <motion.div 
        className="flex-1 flex justify-center items-center w-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-full max-w-md flex justify-center relative"
        >
          {mockUI}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function Home() {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/reels');
    }
  }, [user, loading, router]);

  if (user || loading) return null;

  return (
    <div className="min-h-screen bg-gray-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-950 to-gray-950 overflow-hidden font-sans">
      {/* Hero Section */}
      <motion.div
        className="flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          v2.0 Engine Online
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/40"
        >
          The Next Generation of <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">
            Agentic Interfaces
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed"
        >
          Experience zero-latency interactions with our optimistic UI updates,
          bulletproof hydration firewalls, and premium aesthetic design.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20"
        >
          <motion.button
            onClick={signIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold tracking-wide shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group transition-colors duration-200"
          >
            Start your journey
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Feature Sections */}
      <div className="flex flex-col gap-12 relative z-10">
        <FeatureSection
          title="Gamification at its core"
          description="Level up as you engage. Earn XP, collect badges, and showcase your achievements with our built-in progression system designed to keep you coming back for more."
          reversed={false}
          mockUI={
            <div className="w-full max-w-sm bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-xl rounded-2xl p-6 relative overflow-hidden bg-gradient-to-br from-violet-600/20 to-indigo-600/20 ring-1 ring-violet-500/50">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={120} />
              </div>
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/50 flex items-center justify-center text-xl font-bold text-violet-200">
                  Lvl 42
                </div>
                <div>
                  <h3 className="text-xl font-bold text-violet-300">Alex Developer</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">Nitro Active</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-sm text-violet-300">
                  <span>XP Progress</span>
                  <span>8,450 / 10,000</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 w-[84%] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                </div>
              </div>
            </div>
          }
        />

        <FeatureSection
          title="Infinite Reels Feed"
          description="Immerse yourself in a continuous stream of content. Our optimized video delivery network ensures instant playback and zero buffering, wrapped in a beautiful cinematic UI."
          reversed={true}
          mockUI={
            <div className="aspect-[9/16] w-64 bg-gray-900 border border-gray-800 shadow-2xl rounded-3xl relative overflow-hidden flex flex-col justify-end p-4">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-950 z-0"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-10 border border-white/30">
                <Play className="w-6 h-6 ml-1 fill-white" />
              </div>
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-end justify-between">
                  <div>
                    <h4 className="font-bold text-white text-lg drop-shadow-md">Building the future</h4>
                    <p className="text-white/80 text-sm drop-shadow-md">@creator_pro</p>
                  </div>
                  <div className="flex flex-col items-center gap-4 text-white">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-1">
                        <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                      </div>
                      <span className="text-xs font-medium">12.4K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        />

        <FeatureSection
          title="Developer Code Hub"
          description="Share and deploy instantly. Whether it's a quick snippet, a full ZIP archive, or an APK, our integrated hub makes sharing code assets seamless and secure."
          reversed={false}
          mockUI={
            <div className="w-full max-w-sm font-mono text-sm bg-gray-950 border border-gray-800 rounded-xl p-5 shadow-[0_0_30px_-5px_rgba(79,70,229,0.3)] text-indigo-400 relative">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-gray-500 text-xs ml-2">server.ts</span>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-hidden">
                <code>
                  <span className="text-violet-400">import</span> {'{ serve }'} <span className="text-violet-400">from</span> <span className="text-emerald-400">"bun"</span>;<br/><br/>
                  serve({'{'}<br/>
                  &nbsp;&nbsp;port: <span className="text-amber-400">3000</span>,<br/>
                  &nbsp;&nbsp;fetch(req) {'{'}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-violet-400">return new</span> Response(<span className="text-emerald-400">"Online"</span>);<br/>
                  &nbsp;&nbsp;{'}'},<br/>
                  {'}'});
                </code>
              </pre>
              <div className="mt-6 flex justify-end relative z-10">
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg transition-colors text-xs font-sans font-medium shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                  <Download className="w-4 h-4" />
                  Download ZIP
                </button>
              </div>
            </div>
          }
        />

        <FeatureSection
          title="Real-time Communities"
          description="Connect with like-minded creators in dedicated spaces. High-performance WebSocket chat ensures your messages arrive before you even finish typing."
          reversed={true}
          mockUI={
            <div className="w-full max-w-sm flex flex-col gap-4 relative pl-4">
              <div className="bg-indigo-600 rounded-2xl rounded-tl-none p-3 text-white max-w-[80%] shadow-lg self-start">
                <p className="text-sm">Did you see the latest UI update? It's incredibly smooth! 🔥</p>
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-tr-none p-3 text-gray-200 max-w-[80%] shadow-lg border border-gray-700 self-end mt-2">
                <p className="text-sm">Yes! The floating animations are a really nice touch.</p>
              </div>
              <div className="bg-indigo-600 rounded-2xl rounded-tl-none p-3 text-white max-w-[80%] shadow-lg self-start mt-2">
                <p className="text-sm">Can't wait to try the new API endpoints.</p>
              </div>
            </div>
          }
        />
      </div>

      {/* Final CTA Section */}
      <motion.div
        className="flex flex-col items-center justify-center py-32 px-6 text-center relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to dive in?</h2>
        <p className="text-xl text-gray-400 max-w-2xl mb-10">
          Join thousands of developers and creators building the next generation of applications.
        </p>
        <motion.button
          onClick={signIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 rounded-xl bg-white text-gray-950 font-bold text-lg hover:bg-gray-100 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] flex items-center gap-2"
        >
          Get Started Now
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
