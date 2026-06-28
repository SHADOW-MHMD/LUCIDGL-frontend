"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ArrowRight, Zap, Shield, LayoutGrid } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-medium mb-8">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        v2.0 Engine Online
      </div>

      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/40">
        The Next Generation of <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          Agentic Interfaces
        </span>
      </h1>

      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
        Experience zero-latency interactions with our optimistic UI updates,
        bulletproof hydration firewalls, and glassmorphism design system.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20">
        <div className="p-1 rounded-2xl bg-gradient-to-r from-blue-500/30 to-indigo-500/30">
          <button 
            onClick={signIn}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-white/5 text-white font-medium shadow-2xl transition-all hover:bg-slate-800 flex items-center justify-center gap-2 group"
          >
            Sign in to start earning XP
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          {
            icon: <Zap className="text-yellow-400" />,
            title: "Zero-Latency Optimistic UI",
            desc: "State updates instantly before backend acknowledgment.",
          },
          {
            icon: <Shield className="text-green-400" />,
            title: "Hydration Firewalls",
            desc: "Bulletproof client-side mounting eradicates React #310.",
          },
          {
            icon: <LayoutGrid className="text-blue-400" />,
            title: "Aero-Glass Aesthetics",
            desc: "Pristine components forged with Tailwind and Lucide.",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl flex flex-col items-center text-center hover:bg-white/10 transition-colors duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 border border-white/5">
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold text-white/90 mb-2">{feature.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
