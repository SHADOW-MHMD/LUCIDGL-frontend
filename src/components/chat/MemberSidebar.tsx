import { UserPlus } from "lucide-react";

interface MemberWithRole {
  id: string;
  username: string;
  avatar_url?: string;
  role: string;
}

interface MemberSidebarProps {
  members: MemberWithRole[];
  isAdmin: boolean;
  onAddMember: () => void;
}

export function MemberSidebar({ members, isAdmin, onAddMember }: MemberSidebarProps) {
  return (
    <div className="w-60 shrink-0 bg-[#2b2d31]/60 backdrop-blur-xl flex flex-col border-l border-white/5">
      <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <span className="text-white font-bold text-sm">Members</span>
        {isAdmin && (
          <button onClick={onAddMember} className="text-white/40 hover:text-emerald-400 transition-colors" title="Add Member">
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 no-scrollbar">
        {['owner', 'admin', 'member'].map(rg => {
          const group = members.filter(m => m.role === rg);
          if (!group.length) return null;
          return (
            <div key={rg} className="mb-4">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 px-1">
                {rg}s — {group.length}
              </p>
              {group.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 px-1 py-1.5 rounded-md hover:bg-white/5 transition-colors group/m cursor-pointer">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
                      {m.avatar_url && <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#2b2d31] rounded-full" />
                  </div>
                  <span className="text-white/60 text-sm font-medium group-hover/m:text-white transition-colors truncate flex-1">{m.username}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
