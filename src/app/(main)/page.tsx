"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowRight, Zap, Shield, LayoutGrid } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const { user, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/reels');
    }
  }, [user, router]);

  if (user) return null;

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 text-center"
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
        className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
      >
        Experience zero-latency interactions with our optimistic UI updates,
        bulletproof hydration firewalls, and glassmorphism design system.
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
          Sign in to start earning XP
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          {
            icon: <Zap className="text-indigo-400" />,
            title: "Zero-Latency Optimistic UI",
            desc: "State updates instantly before backend acknowledgment.",
          },
          {
            icon: <Shield className="text-cyan-400" />,
            title: "Hydration Firewalls",
            desc: "Bulletproof client-side mounting eradicates React #310.",
          },
          {
            icon: <LayoutGrid className="text-violet-400" />,
            title: "Aero-Glass Aesthetics",
            desc: "Pristine components forged with Tailwind and Lucide.",
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] shadow-xl flex flex-col items-center text-center hover:bg-white/[0.05] hover:border-indigo-500/20 transition-colors duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-4">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold text-white/90 mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
