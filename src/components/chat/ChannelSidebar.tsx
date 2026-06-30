import { Plus, Settings, Hash, MoreVertical, Check, X, Trophy } from "lucide-react";
import type { Channel, Community, Profile } from "@/types";
import { LevelBadge } from "@/components/ui/LevelBadge";

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  selectedCommunityId: string | null;
  selectedCommunity?: Community;
  isAdmin: boolean;
  userId?: string;
  onSelectChannel: (channel: Channel) => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
  onCreateDM: () => void;
  onCreateChannel: () => void;
  renamingChannelId: string | null;
  renameValue: string;
  onRenameChange: (val: string) => void;
  onRenameSubmit: (ch: Channel) => void;
  onRenameCancel: () => void;
  onChannelCtx: (e: React.MouseEvent, ch: Channel) => void;

  userProfile?: Profile;
}

export function ChannelSidebar({
  channels, selectedChannel, selectedCommunityId, selectedCommunity, isAdmin, userId,
  onSelectChannel, onOpenSettings, onOpenLeaderboard, onCreateDM, onCreateChannel,
  renamingChannelId, renameValue, onRenameChange, onRenameSubmit, onRenameCancel,
  onChannelCtx, userProfile
}: ChannelSidebarProps) {
  return (
    <div className="w-60 shrink-0 bg-white/[0.03] backdrop-blur-lg flex flex-col border-r border-white/[0.1] shadow-2xl z-10 transition-all duration-300 ease-in-out">
      {/* Server name header */}
      <div className="h-16 px-6 border-b border-white/[0.1] flex items-center justify-between shrink-0">
        <h2 className="text-white font-bold text-sm tracking-wide truncate flex-1">
          {selectedCommunityId === null ? 'Direct Messages' : selectedCommunity?.name || 'Community'}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenLeaderboard}
            className="p-1 text-amber-500/80 hover:text-amber-400 transition-colors rounded"
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
          </button>
          {selectedCommunityId !== null && isAdmin && (
            <button
              onClick={onOpenSettings}
              className="p-1 text-white/40 hover:text-white transition-colors rounded"
              title="Server Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {selectedCommunityId === null && (
            <button onClick={onCreateDM} className="p-1 text-white/40 hover:text-white transition-colors" title="New DM">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {selectedCommunityId !== null && (
          <div className="flex items-center justify-between px-4 py-1 mb-1 group">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Text Channels</span>
            {isAdmin && (
              <button onClick={onCreateChannel} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-all">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {channels.length === 0 ? (
          <p className="text-white/30 text-xs text-center mt-8 px-4">No channels yet.</p>
        ) : (
          channels.map(ch => (
            <div
              key={ch.id}
              className="relative group/ch px-2"
              onContextMenu={e => onChannelCtx(e, ch)}
            >
              {renamingChannelId === ch.id ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => onRenameChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onRenameSubmit(ch); if (e.key === 'Escape') onRenameCancel(); }}
                    className="flex-1 bg-black/40 text-white text-sm rounded px-2 py-1 outline-none border border-blue-500/50"
                  />
                  <button onClick={() => onRenameSubmit(ch)} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={onRenameCancel} className="text-white/40 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectChannel(ch)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    selectedChannel?.id === ch.id
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                  }`}
                >
                  {ch.type === 'community' ? (
                    <Hash className="w-4 h-4 shrink-0 text-white/30" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center text-[9px] font-bold">
                      {(() => {
                        const other = ch.channel_members?.find(m => m.profiles?.id !== userId)?.profiles;
                        return other?.avatar_url ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" /> : 'DM';
                      })()}
                    </div>
                  )}
                  <span className="truncate flex-1 text-left">
                    {ch.type === 'dm'
                      ? (ch.channel_members?.find(m => m.profiles?.id !== userId)?.profiles?.username || 'DM')
                      : ch.name}
                  </span>
                  {isAdmin && ch.type === 'community' && (
                    <button
                      onClick={e => { e.stopPropagation(); onChannelCtx(e, ch); }}
                      className="opacity-0 group-hover/ch:opacity-100 p-0.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-opacity shrink-0"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* User bar at bottom */}
      <div className="h-16 bg-white/[0.02] shrink-0 flex items-center px-4 gap-3 border-t border-white/[0.1] backdrop-blur-md">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shrink-0 overflow-hidden">
          {userProfile?.avatar_url && <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs font-bold truncate">{userProfile?.username || 'Unknown'}</span>
            <LevelBadge level={userProfile?.current_level || 0} />
          </div>
          <span className="text-white/40 text-[10px]">Online</span>
        </div>
      </div>
    </div>
  );
}
