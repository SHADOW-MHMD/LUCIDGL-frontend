interface LevelBadgeProps {
  level?: number;
  badgeTier?: string;
}

export function LevelBadge({ level = 0, badgeTier }: LevelBadgeProps) {
  let tierStyle = "border-white/10 text-white/40 bg-white/5"; // Default/0
  let label = badgeTier || "New";

  if (badgeTier === "GOD TIER") {
    tierStyle = "border-amber-400 text-amber-100 bg-gradient-to-r from-amber-500/40 to-yellow-600/40 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse";
  } else if (badgeTier === "GRANDMASTER") {
    tierStyle = "border-slate-300 text-slate-100 bg-gradient-to-r from-slate-400/30 to-slate-200/30 shadow-[0_0_12px_rgba(203,213,225,0.4)]";
  } else if (level >= 50 || badgeTier === "ASCENDANT") {
    tierStyle = "border-fuchsia-500/50 text-fuchsia-100 bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 shadow-[0_0_10px_rgba(217,70,239,0.3)]";
    label = label !== "New" ? label : "Ascendant";
  } else if (level >= 25 || badgeTier === "GOLD_ELITE") {
    tierStyle = "border-amber-500/40 text-amber-200 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]";
    label = label !== "New" ? label : "Gold Elite";
  } else if (level >= 10 || badgeTier === "SILVER_SPEC") {
    tierStyle = "border-slate-300/40 text-slate-200 bg-slate-300/10 shadow-[0_0_5px_rgba(203,213,225,0.1)]";
    label = label !== "New" ? label : "Silver Spec";
  } else if (level > 0 || badgeTier === "BRONZE_NOV") {
    tierStyle = "border-stone-400/30 text-stone-300 bg-stone-500/10";
    label = label !== "New" ? label : "Bronze Nov";
  }

  return (
    <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${tierStyle}`}>
      <span>Lvl {level}</span>
      <span className="opacity-60">{label.replace('_', ' ')}</span>
    </div>
  );
}
