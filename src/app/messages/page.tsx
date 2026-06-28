"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Compass } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Community, Channel, Profile } from "@/types";
import { ChatArea } from "@/components/chat/ChatArea";
import { CreateCommunityModal } from "@/components/chat/CreateCommunityModal";
import { CreateDMModal } from "@/components/chat/CreateDMModal";
import { CreateChannelModal } from "@/components/chat/CreateChannelModal";
import { AddMemberModal } from "@/components/chat/AddMemberModal";
import { ServerSettingsModal } from "@/components/chat/ServerSettingsModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ServerRail } from "@/components/chat/ServerRail";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { MemberSidebar } from "@/components/chat/MemberSidebar";
import { LeaderboardModal } from "@/components/chat/LeaderboardModal";

interface MemberWithRole extends Profile { role: string; }

export default function MessagesPage() {
  const { user } = useAuth();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [currentRole, setCurrentRole] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userProfile, setUserProfile] = useState<Profile | undefined>(undefined);

  // Modal state
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [serverSettings, setServerSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Inline rename state for channels
  const [renamingChannelId, setRenamingChannelId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Context menus
  const [channelCtx, setChannelCtx] = useState<{ x: number; y: number; channel: Channel } | null>(null);
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);

  const isAdmin = currentRole === 'owner' || currentRole === 'admin';
  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  // Fetch communities & user profile
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
        // Fetch gamification from D1
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://lucid-gl.muhammed1515mishal.workers.dev'}/api/gamification/levels`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(user as any).access_token || ''}`
            },
            body: JSON.stringify({ userIds: [user.id] })
          });
          const gamificationMap = await res.json();
          if (gamificationMap && gamificationMap[user.id]) {
            profileData = { ...profileData, ...gamificationMap[user.id] };
          }
        } catch(e) {}
        setUserProfile(profileData);
      }
    };
    loadData();
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
          // ponytail: performance fix — cap members fetch to 100 for large servers
          supabase.from('community_members')
            .select('role, profiles(id, username, avatar_url)')
            .eq('community_id', selectedCommunityId)
            .limit(100)
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
    const { error } = await supabase.from('channels').delete().eq('id', ch.id).select();
    if (error || !error) {
      // Actually we removed the inline alert from here previously as this handles the context menu action
      // We should check error, but since the RLS fix is applied in the backend, it will work.
      if (error) {
        console.error("Failed to delete channel:", error);
        alert(`Failed to delete channel: ${error.message}`);
      } else {
        setChannels(prev => prev.filter(c => c.id !== ch.id));
        if (selectedChannel?.id === ch.id) setSelectedChannel(null);
      }
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
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-6 text-center">
      <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
      <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
      <p className="text-slate-400">Sign in to access messages and communities.</p>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent font-sans">
      
      <ServerRail 
        communities={communities}
        selectedCommunityId={selectedCommunityId}
        onSelectCommunity={setSelectedCommunityId}
        onCreateCommunity={() => setIsCreatingCommunity(true)}
      />

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
        hoveredChannelId={hoveredChannelId}
        onHoverChannel={setHoveredChannelId}
        userProfile={userProfile}
      />

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

      {selectedCommunityId !== null && selectedChannel?.type === 'community' && (
        <MemberSidebar 
          members={members}
          isAdmin={isAdmin}
          onAddMember={() => setIsAddingMember(true)}
        />
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
      {showLeaderboard && (
        <LeaderboardModal communityId={selectedCommunityId} onClose={() => setShowLeaderboard(false)} />
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
