export default function MobilePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        {/* Animated icon */}
        <div className="relative mx-auto mb-8 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-white/5 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-3">
          Mobile coming soon
        </h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          We're crafting a dedicated mobile experience. For now, open{" "}
          <span className="text-white/60 font-medium">LUCID-GL</span> on a
          desktop or laptop for the full experience.
        </p>

        {/* Subtle divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-white/20 text-xs font-medium tracking-widest uppercase">
            or
          </span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <a
          href="/?desktop=1"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.1] hover:text-white transition-colors duration-200"
        >
          Continue anyway →
        </a>
      </div>
    </div>
  );
}
