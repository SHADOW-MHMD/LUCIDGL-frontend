"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Plus, MessageSquare, Hash, Compass, ArrowLeft, Users, UserPlus, Settings, MoreVertical, Trash2, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Community, Channel, Profile } from "@/types";
import { ChatArea } from "@/components/chat/ChatArea";
import { CreateCommunityModal } from "@/components/chat/CreateCommunityModal";
import { CreateDMModal } from "@/components/chat/CreateDMModal";
import { CreateChannelModal } from "@/components/chat/CreateChannelModal";
import { AddMemberModal } from "@/components/chat/AddMemberModal";
import { ServerSettingsModal } from "@/components/chat/ServerSettingsModal";
import Link from "next/link";

interface MemberWithRole extends Profile { role: string; }

// ponytail: inline context menu — no library
function ContextMenu({ x, y, items, onClose }: {
  x: number; y: number;
  items: { label: string; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    window.addEventListener('contextmenu', h);
    return () => { window.removeEventListener('click', h); window.removeEventListener('contextmenu', h); };
  }, [onClose]);

  return (
    <div
      className="fixed z-[200] bg-[#111214] border border-white/10 rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={e => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.onClick(); onClose(); }}
          className={`w-full px-3 py-1.5 text-sm text-left transition-colors ${item.danger ? 'text-red-400 hover:bg-red-500/20' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [currentRole, setCurrentRole] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [serverSettings, setServerSettings] = useState(false);

  // Inline rename state for channels
  const [renamingChannelId, setRenamingChannelId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Context menus
  const [channelCtx, setChannelCtx] = useState<{ x: number; y: number; channel: Channel } | null>(null);
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);

  const isAdmin = currentRole === 'owner' || currentRole === 'admin';
  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  // Fetch communities
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('community_members')
        .select('community_id, role, communities(id, name, logo_url, owner_id)')
        .eq('user_id', user.id);
      if (data) setCommunities(data.map(m => ({ ...(m.communities as any), role: m.role })) as Community[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Fetch channels + members when community changes
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      if (selectedCommunityId === null) {
        const { data } = await supabase
          .from('channel_members')
          .select('channel_id, channels(id, name, type, channel_members(profiles(id, username, avatar_url)))')
          .eq('user_id', user.id);
        if (data) {
          const dms = data.map(m => m.channels).filter(c => c && (c as any).type === 'dm') as unknown as Channel[];
          setChannels(dms);
          setSelectedChannel(dms[0] || null);
        }
        setCurrentRole(undefined);
        setMembers([]);
      } else {
        const [{ data: chans }, { data: mems }] = await Promise.all([
          supabase.from('channels').select('*').eq('community_id', selectedCommunityId).order('created_at'),
          supabase.from('community_members').select('role, profiles(id, username, avatar_url)').eq('community_id', selectedCommunityId)
        ]);
        if (chans) {
          setChannels(chans as Channel[]);
          setSelectedChannel(chans[0] as Channel || null);
        }
        if (mems) {
          const withRoles = mems.map(m => ({ ...(m.profiles as any), role: m.role })) as MemberWithRole[];
          setMembers(withRoles);
          setCurrentRole(withRoles.find(m => m.id === user.id)?.role);
        }
      }
    };
    fetch();
  }, [user, selectedCommunityId, refreshTrigger]);

  const handleDeleteChannel = useCallback(async (ch: Channel) => {
    if (!window.confirm(`Delete #${ch.name}?`)) return;
    await supabase.from('channels').delete().eq('id', ch.id);
    setChannels(prev => prev.filter(c => c.id !== ch.id));
    if (selectedChannel?.id === ch.id) setSelectedChannel(null);
  }, [selectedChannel]);

  const handleRenameChannel = async (ch: Channel) => {
    if (!renameValue.trim() || renameValue === ch.name) { setRenamingChannelId(null); return; }
    const slug = renameValue.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    await supabase.from('channels').update({ name: slug }).eq('id', ch.id);
    setChannels(prev => prev.map(c => c.id === ch.id ? { ...c, name: slug } : c));
    setRenamingChannelId(null);
  };

  const handleChannelCtx = (e: React.MouseEvent, ch: Channel) => {
    if (!isAdmin) return;
    e.preventDefault();
    setChannelCtx({ x: e.clientX, y: e.clientY, channel: ch });
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
      <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
      <p className="text-slate-400">Sign in to access messages and communities.</p>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent font-sans">

      {/* ── 1. SERVER RAIL ── */}
      <div className="w-[72px] shrink-0 bg-black/40 backdrop-blur-xl flex flex-col items-center py-3 gap-2 overflow-y-auto no-scrollbar border-r border-white/5">
        <Link href="/" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-px bg-white/10 my-1" />

        {/* DMs */}
        <button
          onClick={() => setSelectedCommunityId(null)}
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

        {/* Community icons — no delete badge, clean like Discord */}
        {communities.map(comm => (
          <button
            key={comm.id}
            onClick={() => setSelectedCommunityId(comm.id)}
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
          onClick={() => setIsCreatingCommunity(true)}
          className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl hover:rounded-xl text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all duration-200 mt-1"
          title="Create Server"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* ── 2. CHANNEL SIDEBAR ── */}
      <div className="w-60 shrink-0 bg-[#2b2d31]/80 backdrop-blur-md flex flex-col border-r border-white/5">

        {/* Server name header */}
        <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between shrink-0 shadow-sm">
          <h2 className="text-white font-bold text-sm tracking-wide truncate flex-1">
            {selectedCommunityId === null ? 'Direct Messages' : selectedCommunity?.name || 'Community'}
          </h2>
          {/* Gear icon → Server Settings (Discord pattern) */}
          {selectedCommunityId !== null && isAdmin && (
            <button
              onClick={() => setServerSettings(true)}
              className="p-1 text-white/40 hover:text-white transition-colors rounded"
              title="Server Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          {selectedCommunityId === null && (
            <button onClick={() => setIsCreatingDM(true)} className="p-1 text-white/40 hover:text-white transition-colors" title="New DM">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {/* Section header for community channels */}
          {selectedCommunityId !== null && (
            <div className="flex items-center justify-between px-4 py-1 mb-1 group">
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Text Channels</span>
              {isAdmin && (
                <button onClick={() => setIsCreatingChannel(true)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white transition-all">
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
                onMouseEnter={() => setHoveredChannelId(ch.id)}
                onMouseLeave={() => setHoveredChannelId(null)}
                onContextMenu={e => handleChannelCtx(e, ch)}
              >
                {renamingChannelId === ch.id ? (
                  // Inline rename input
                  <div className="flex items-center gap-1 px-2 py-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameChannel(ch); if (e.key === 'Escape') setRenamingChannelId(null); }}
                      className="flex-1 bg-black/40 text-white text-sm rounded px-2 py-1 outline-none border border-blue-500/50"
                    />
                    <button onClick={() => handleRenameChannel(ch)} className="text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setRenamingChannelId(null)} className="text-white/40 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedChannel(ch)}
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
                          const other = ch.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles;
                          return other?.avatar_url ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" /> : 'DM';
                        })()}
                      </div>
                    )}
                    <span className="truncate flex-1 text-left">
                      {ch.type === 'dm'
                        ? (ch.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles?.username || 'DM')
                        : ch.name}
                    </span>
                    {/* Hover ⋯ button for channel options */}
                    {isAdmin && ch.type === 'community' && hoveredChannelId === ch.id && (
                      <button
                        onClick={e => { e.stopPropagation(); setChannelCtx({ x: e.currentTarget.getBoundingClientRect().right, y: e.currentTarget.getBoundingClientRect().bottom, channel: ch }); }}
                        className="p-0.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
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
        <div className="h-14 bg-black/20 shrink-0 flex items-center px-3 gap-2 border-t border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shrink-0 overflow-hidden">
            {user?.user_metadata?.avatar_url && <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-white text-xs font-bold truncate">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'}</span>
            <span className="text-white/40 text-[10px]">Online</span>
          </div>
        </div>
      </div>

      {/* ── 3. CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
          <ChatArea
            channelId={selectedChannel.id}
            channelName={
              selectedChannel.type === 'dm'
                ? (selectedChannel.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles?.username || 'DM')
                : (selectedChannel.name || 'chat')
            }
            type={selectedChannel.type}
            communityRole={currentRole}
            onChannelDeleted={() => {
              setChannels(prev => prev.filter(c => c.id !== selectedChannel.id));
              setSelectedChannel(null);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/10">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Compass className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-white/60 text-xl font-bold mb-2">No channel selected</h2>
            <p className="text-white/30 max-w-sm text-sm">Pick a channel from the sidebar to start chatting.</p>
          </div>
        )}
      </div>

      {/* ── 4. MEMBERS SIDEBAR ── */}
      {selectedCommunityId !== null && selectedChannel?.type === 'community' && (
        <div className="w-60 shrink-0 bg-[#2b2d31]/60 backdrop-blur-xl flex flex-col border-l border-white/5">
          <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <span className="text-white font-bold text-sm">Members</span>
            {isAdmin && (
              <button onClick={() => setIsAddingMember(true)} className="text-white/40 hover:text-emerald-400 transition-colors" title="Add Member">
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
      )}

      {/* ── MODALS ── */}
      {isCreatingCommunity && (
        <CreateCommunityModal onClose={() => setIsCreatingCommunity(false)} onCreated={id => { setIsCreatingCommunity(false); setSelectedCommunityId(id); setRefreshTrigger(t => t + 1); }} />
      )}
      {isCreatingDM && (
        <CreateDMModal onClose={() => setIsCreatingDM(false)} onCreated={id => { setIsCreatingDM(false); setSelectedCommunityId(null); setRefreshTrigger(t => t + 1); }} />
      )}
      {isCreatingChannel && selectedCommunityId && (
        <CreateChannelModal communityId={selectedCommunityId} onClose={() => setIsCreatingChannel(false)} onCreated={() => { setIsCreatingChannel(false); setRefreshTrigger(t => t + 1); }} />
      )}
      {isAddingMember && selectedCommunityId && (
        <AddMemberModal communityId={selectedCommunityId} onClose={() => setIsAddingMember(false)} onAdded={() => { setIsAddingMember(false); setRefreshTrigger(t => t + 1); }} />
      )}
      {serverSettings && selectedCommunityId && selectedCommunity && (
        <ServerSettingsModal
          communityId={selectedCommunityId}
          communityName={selectedCommunity.name}
          currentRole={currentRole || 'member'}
          members={members}
          onClose={() => setServerSettings(false)}
          onDeleted={() => {
            setServerSettings(false);
            setCommunities(prev => prev.filter(c => c.id !== selectedCommunityId));
            setSelectedCommunityId(null);
            setChannels([]); setSelectedChannel(null);
          }}
          onNameChanged={newName => setCommunities(prev => prev.map(c => c.id === selectedCommunityId ? { ...c, name: newName } : c))}
          onMemberKicked={uid => setMembers(prev => prev.filter(m => m.id !== uid))}
          onRoleChanged={(uid, role) => setMembers(prev => prev.map(m => m.id === uid ? { ...m, role } : m))}
        />
      )}

      {/* Channel right-click / ⋯ context menu */}
      {channelCtx && (
        <ContextMenu
          x={channelCtx.x}
          y={channelCtx.y}
          onClose={() => setChannelCtx(null)}
          items={[
            {
              label: 'Edit Channel Name',
              onClick: () => { setRenamingChannelId(channelCtx.channel.id); setRenameValue(channelCtx.channel.name || ''); }
            },
            {
              label: 'Delete Channel',
              danger: true,
              onClick: () => handleDeleteChannel(channelCtx.channel)
            }
          ]}
        />
      )}
    </div>
  );
}
