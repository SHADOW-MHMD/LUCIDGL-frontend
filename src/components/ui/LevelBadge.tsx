interface LevelBadgeProps {
  level?: number;
}

export function LevelBadge({ level = 0 }: LevelBadgeProps) {
  let tierStyle = "border-white/10 text-white/40 bg-white/5"; // Default/0
  let label = "New";

  if (level >= 50) {
    tierStyle = "border-fuchsia-500/50 text-fuchsia-100 bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 shadow-[0_0_10px_rgba(217,70,239,0.3)]";
    label = "Ascendant";
  } else if (level >= 25) {
    tierStyle = "border-amber-500/40 text-amber-200 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]";
    label = "Gold Elite";
  } else if (level >= 10) {
    tierStyle = "border-slate-300/40 text-slate-200 bg-slate-300/10 shadow-[0_0_5px_rgba(203,213,225,0.1)]";
    label = "Silver Spec";
  } else if (level > 0) {
    tierStyle = "border-stone-400/30 text-stone-300 bg-stone-500/10";
    label = "Bronze Nov";
  }

  return (
    <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${tierStyle}`}>
      <span>Lvl {level}</span>
      <span className="opacity-60">{label}</span>
    </div>
  );
}
