"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Compass, MessageSquare, PlusSquare, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Community, Channel, Profile } from "@/types";
import { ChatArea } from "@/components/chat/ChatArea";
import { CreateCommunityModal } from "@/components/chat/CreateCommunityModal";
import { CreateDMModal } from "@/components/chat/CreateDMModal";
import { CreateChannelModal } from "@/components/chat/CreateChannelModal";
import { AddMemberModal } from "@/components/chat/AddMemberModal";
import { ServerSettingsModal } from "@/components/chat/ServerSettingsModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { LeaderboardModal } from "@/components/chat/LeaderboardModal";
import { motion, AnimatePresence } from "framer-motion";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { env } from "@/lib/env";

interface MemberWithRole extends Profile { role: string; }

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [currentRole, setCurrentRole] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | undefined>(undefined);

  const [activeTab, setActiveTab] = useState<'communities' | 'dms'>('communities');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [serverSettings, setServerSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [renamingChannelId, setRenamingChannelId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [channelCtx, setChannelCtx] = useState<{ x: number; y: number; channel: Channel } | null>(null);

  const isAdmin = currentRole === 'owner' || currentRole === 'admin';
  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  useEffect(() => {
    const savedView = localStorage.getItem('messages_view');
    if (savedView === 'dms') setActiveTab('dms');
  }, []);

  const handleSetTab = (tab: 'communities' | 'dms') => {
    setActiveTab(tab);
    localStorage.setItem('messages_view', tab);
    if (tab === 'dms') setSelectedCommunityId(null);
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const { data } = await supabase
        .from('community_members')
        .select('community_id, role, communities(id, name, logo_url, owner_id)')
        .eq('user_id', user.id);
      if (data) setCommunities(data.map(m => ({ ...(m.communities as any), role: m.role })) as Community[]);

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) {
        let profileData = prof as Profile;
        try {
          const res = await fetch(`${env.apiUrl}/api/gamification/levels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(user as any).access_token || ''}` },
            body: JSON.stringify({ userIds: [user.id] })
          });
          const gamificationMap = await res.json();
          if (gamificationMap && gamificationMap[user.id]) profileData = { ...profileData, ...gamificationMap[user.id] };
        } catch(e) {}
        setUserProfile(profileData);
      }
    };
    loadData();
  }, [user, refreshTrigger]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      if (selectedCommunityId === null && activeTab === 'dms') {
        const { data } = await supabase
          .from('channel_members')
          .select('channel_id, channels(id, name, type, channel_members(profiles(id, username, avatar_url)))')
          .eq('user_id', user.id);
        if (data) {
          const dms = data.map(m => m.channels).filter(c => c && (c as any).type === 'dm') as unknown as Channel[];
          setChannels(dms);
          if (!selectedChannel || selectedChannel.type !== 'dm') setSelectedChannel(dms[0] || null);
        }
        setCurrentRole(undefined);
        setMembers([]);
      } else if (selectedCommunityId !== null) {
        const [{ data: chans }, { data: mems }] = await Promise.all([
          supabase.from('channels').select('*').eq('community_id', selectedCommunityId).order('created_at'),
          supabase.from('community_members').select('role, profiles(id, username, avatar_url)').eq('community_id', selectedCommunityId).limit(100)
        ]);
        if (chans) {
          setChannels(chans as Channel[]);
          if (!selectedChannel || selectedChannel.community_id !== selectedCommunityId) setSelectedChannel(chans[0] as Channel || null);
        }
        if (mems) {
          const withRoles = mems.map(m => ({ ...(m.profiles as any), role: m.role })) as MemberWithRole[];
          setMembers(withRoles);
          setCurrentRole(withRoles.find(m => m.id === user.id)?.role);
        }
      }
    };
    fetch();
  }, [user, selectedCommunityId, activeTab, refreshTrigger]);

  const handleDeleteChannel = useCallback(async (ch: Channel) => {
    if (!window.confirm(`Delete #${ch.name}?`)) return;
    const { error } = await supabase.from('channels').delete().eq('id', ch.id).select();
    if (error || !error) {
      if (error) { console.error("Failed to delete channel:", error); alert(`Failed to delete channel: ${error.message}`); }
      else { setChannels(prev => prev.filter(c => c.id !== ch.id)); if (selectedChannel?.id === ch.id) setSelectedChannel(null); }
    }
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
    <div className="flex flex-col items-center justify-center h-screen gap-6 text-center bg-black">
      <ShieldAlert size={48} strokeWidth={1.5} className="text-red-400/50" />
      <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
      <p className="text-white/40 text-sm">Sign in to access messages and communities.</p>
    </div>
  );

  const filteredCommunities = communities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-screen w-full flex overflow-hidden bg-black text-white">

      {/* ══════════════ LEFT SIDEBAR ══════════════ */}
      <div
        className="w-[320px] h-full flex flex-col shrink-0 border-r border-white/[0.06]"
        style={{ background: "#080808" }}
      >
        {/* Back */}
        <div className="px-5 pt-5 pb-3">
          <motion.button
            onClick={() => router.back()}
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-xs font-medium"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Back
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] transition-shadow border-0"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-5 border-b border-white/[0.06] mb-1">
          {(['communities', 'dms'] as const).map(tab => (
            <motion.button
              key={tab}
              onClick={() => handleSetTab(tab)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className={`pb-3 text-xs font-semibold uppercase tracking-widest relative transition-colors ${
                activeTab === tab ? 'text-white' : 'text-white/35 hover:text-white/60'
              }`}
            >
              {tab === 'communities' ? 'Communities' : 'Direct Messages'}
              {activeTab === tab && (
                <motion.div
                  layoutId="msg-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                  style={{ background: "var(--accent-color)" }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2">
          <AnimatePresence mode="wait">
            {/* Communities list */}
            {activeTab === 'communities' && selectedCommunityId === null && (
              <motion.div key="communities" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0.5">
                {filteredCommunities.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Compass size={36} strokeWidth={1.5} className="text-white/15 mb-3" />
                    <p className="text-white/30 text-xs">No communities yet</p>
                  </div>
                )}
                {filteredCommunities.map(c => (
                  <motion.button
                    key={c.id}
                    onClick={() => setSelectedCommunityId(c.id)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group text-left"
                  >
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/60 font-bold shrink-0 text-sm">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white/80 group-hover:text-white truncate transition-colors">{c.name}</p>
                      <p className="text-white/30 text-xs truncate mt-0.5">Click to view channels</p>
                    </div>
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => setIsCreatingCommunity(true)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group text-left mt-2"
                >
                  <div className="w-10 h-10 rounded-xl border border-dashed border-white/[0.12] flex items-center justify-center text-white/30 group-hover:text-white/60 group-hover:border-white/25 transition-colors shrink-0">
                    <PlusSquare size={16} strokeWidth={1.5} />
                  </div>
                  <p className="text-white/40 group-hover:text-white/70 text-sm font-medium transition-colors">Create Community</p>
                </motion.button>
              </motion.div>
            )}

            {/* Channels list (inside community) */}
            {activeTab === 'communities' && selectedCommunityId !== null && (
              <motion.div key="channels" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="h-full flex flex-col -mx-3 -my-2">
                <motion.button
                  onClick={() => setSelectedCommunityId(null)}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-white/35 hover:text-white/70 border-b border-white/[0.06] transition-colors shrink-0"
                >
                  <ArrowLeft size={13} strokeWidth={1.5} /> Back to Communities
                </motion.button>
                <div className="flex-1 overflow-hidden flex flex-col">
                  <ChannelSidebar
                    channels={channels}
                    selectedChannel={selectedChannel}
                    selectedCommunityId={selectedCommunityId}
                    selectedCommunity={selectedCommunity}
                    isAdmin={isAdmin}
                    userId={user.id}
                    onSelectChannel={setSelectedChannel}
                    onOpenSettings={() => setServerSettings(true)}
                    onOpenLeaderboard={() => setShowLeaderboard(true)}
                    onCreateDM={() => setIsCreatingDM(true)}
                    onCreateChannel={() => setIsCreatingChannel(true)}
                    renamingChannelId={renamingChannelId}
                    renameValue={renameValue}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={handleRenameChannel}
                    onRenameCancel={() => setRenamingChannelId(null)}
                    onChannelCtx={handleChannelCtx}
                    userProfile={userProfile}
                  />
                </div>
              </motion.div>
            )}

            {/* DMs list */}
            {activeTab === 'dms' && (
              <motion.div key="dms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0.5">
                {channels.filter(c => c.type === 'dm').length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquare size={36} strokeWidth={1.5} className="text-white/15 mb-3" />
                    <p className="text-white/30 text-xs">No direct messages yet</p>
                  </div>
                )}
                {channels.filter(c => c.type === 'dm').map(ch => {
                  const otherMember = ch.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles;
                  const isActive = selectedChannel?.id === ch.id;
                  return (
                    <motion.button
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 24 }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-white/[0.08] border border-white/[0.12]'
                          : 'hover:bg-white/[0.05] border border-transparent'
                      }`}
                      onContextMenu={(e) => handleChannelCtx(e, ch)}
                    >
                      {otherMember?.avatar_url ? (
                        <img src={otherMember.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-white/50 font-bold text-sm shrink-0">
                          {(otherMember?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {otherMember?.username || 'Unknown User'}
                        </p>
                        <p className="text-white/30 text-xs">Direct Message</p>
                      </div>
                    </motion.button>
                  );
                })}
                <motion.button
                  onClick={() => setIsCreatingDM(true)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group text-left mt-2"
                >
                  <div className="w-9 h-9 rounded-full border border-dashed border-white/[0.12] flex items-center justify-center text-white/30 group-hover:text-white/60 group-hover:border-white/25 transition-colors shrink-0">
                    <PlusSquare size={14} strokeWidth={1.5} />
                  </div>
                  <p className="text-white/40 group-hover:text-white/70 text-sm font-medium transition-colors">New Message</p>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════ CHAT AREA ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-black">
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
            avatarUrl={
              selectedChannel.type === 'dm'
                ? selectedChannel.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles?.avatar_url
                : undefined
            }
            selectedCommunity={selectedCommunity}
            members={members}
            onChannelDeleted={() => {
              setChannels(prev => prev.filter(c => c.id !== selectedChannel.id));
              setSelectedChannel(null);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageSquare size={40} strokeWidth={1} className="text-white/10 mb-4" />
            <p className="text-white/25 text-sm font-medium">Select a conversation</p>
          </div>
        )}
      </div>

      {/* ══════════════ MODALS ══════════════ */}
      {isCreatingCommunity && (
        <CreateCommunityModal onClose={() => setIsCreatingCommunity(false)} onCreated={id => { setIsCreatingCommunity(false); setSelectedCommunityId(id); setRefreshTrigger(t => t + 1); }} />
      )}
      {isCreatingDM && (
        <CreateDMModal onClose={() => setIsCreatingDM(false)} onCreated={id => { setIsCreatingDM(false); handleSetTab('dms'); setRefreshTrigger(t => t + 1); }} />
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
            setSelectedCommunityId(null); setChannels([]); setSelectedChannel(null);
          }}
          onNameChanged={newName => setCommunities(prev => prev.map(c => c.id === selectedCommunityId ? { ...c, name: newName } : c))}
          onMemberKicked={uid => setMembers(prev => prev.filter(m => m.id !== uid))}
          onRoleChanged={(uid, role) => setMembers(prev => prev.map(m => m.id === uid ? { ...m, role } : m))}
        />
      )}
      {showLeaderboard && (
        <LeaderboardModal communityId={selectedCommunityId} onClose={() => setShowLeaderboard(false)} />
      )}
      {channelCtx && (
        <ContextMenu
          x={channelCtx.x}
          y={channelCtx.y}
          onClose={() => setChannelCtx(null)}
          items={[
            { label: 'Edit Channel Name', onClick: () => { setRenamingChannelId(channelCtx.channel.id); setRenameValue(channelCtx.channel.name || ''); } },
            { label: 'Delete Channel', danger: true, onClick: () => handleDeleteChannel(channelCtx.channel) }
          ]}
        />
      )}
    </div>
  );
}
