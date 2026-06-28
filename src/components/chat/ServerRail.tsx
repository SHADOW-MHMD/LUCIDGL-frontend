import Link from "next/link";
import { ArrowLeft, MessageSquare, Plus } from "lucide-react";
import type { Community } from "@/types";

interface ServerRailProps {
  communities: Community[];
  selectedCommunityId: string | null;
  onSelectCommunity: (id: string | null) => void;
  onCreateCommunity: () => void;
}

export function ServerRail({
  communities,
  selectedCommunityId,
  onSelectCommunity,
  onCreateCommunity
}: ServerRailProps) {
  return (
    <div className="w-[72px] shrink-0 bg-white/[0.03] backdrop-blur-lg flex flex-col items-center py-4 gap-3 overflow-y-auto no-scrollbar border-r border-white/[0.1] shadow-2xl z-20 transition-all duration-300 ease-in-out">
      <Link href="/" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div className="w-8 h-px bg-white/10 my-1" />

      {/* DMs */}
      <button
        onClick={() => onSelectCommunity(null)}
        className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 ${
          selectedCommunityId === null
            ? 'bg-indigo-500 rounded-xl text-white'
            : 'bg-white/5 rounded-2xl hover:rounded-xl text-white/50 hover:bg-indigo-500/80 hover:text-white'
        }`}
      >
        <MessageSquare className="w-6 h-6" />
        {selectedCommunityId === null && <div className="absolute -left-2.5 w-1 h-8 bg-white rounded-r-full" />}
      </button>

      <div className="w-8 h-px bg-white/10 my-1" />

      {/* Community icons */}
      {communities.map(comm => (
        <button
          key={comm.id}
          onClick={() => onSelectCommunity(comm.id)}
          title={comm.name}
          className={`relative w-12 h-12 flex items-center justify-center overflow-hidden font-bold text-lg transition-all duration-200 ${
            selectedCommunityId === comm.id
              ? 'bg-indigo-500 rounded-xl text-white'
              : 'bg-white/5 rounded-2xl hover:rounded-xl text-white/60 hover:bg-white/15 hover:text-white'
          }`}
        >
          {comm.logo_url
            ? <img src={comm.logo_url} alt="" className="w-full h-full object-cover" />
            : comm.name.substring(0, 2).toUpperCase()
          }
          {selectedCommunityId === comm.id && <div className="absolute -left-2.5 w-1 h-8 bg-white rounded-r-full" />}
        </button>
      ))}

      <button
        onClick={onCreateCommunity}
        className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:rounded-xl text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all duration-200 mt-1"
        title="Create Server"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
