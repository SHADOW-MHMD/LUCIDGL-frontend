"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Compass, MessageSquare, PlusSquare, ArrowLeft } from "lucide-react";
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
import { ServerRail } from "@/components/chat/ServerRail";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";
import { MemberSidebar } from "@/components/chat/MemberSidebar";
import { LeaderboardModal } from "@/components/chat/LeaderboardModal";
import { motion, AnimatePresence } from "framer-motion";

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

  const [showCommunitiesList, setShowCommunitiesList] = useState(false);

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


  const isAdmin = currentRole === 'owner' || currentRole === 'admin';
  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  useEffect(() => {
    const savedView = localStorage.getItem('messages_view');
    if (savedView === 'communities') setShowCommunitiesList(true);
  }, []);

  const handleSetView = (view: 'communities' | 'dms') => {
    if (view === 'communities') {
      setShowCommunitiesList(true);
      localStorage.setItem('messages_view', 'communities');
    } else {
      setShowCommunitiesList(false);
      setSelectedCommunityId(null);
      localStorage.setItem('messages_view', 'dms');
    }
  };

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
  }, [user, refreshTrigger]);

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
      <p className="text-white/50">Sign in to access messages and communities.</p>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0f] font-sans">
      
      {/* Left Sidebar Swapping Logic */}
      <AnimatePresence mode="wait">
        {showCommunitiesList ? (
          <motion.div
            key="communities-list"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="w-72 bg-[#0a0a0f] border-r border-white/[0.08] flex flex-col h-full z-10 shrink-0"
          >
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between mt-12 md:mt-0">
              <h2 className="text-white font-bold">Communities</h2>
              <button onClick={() => setIsCreatingCommunity(true)} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                <PlusSquare size={20}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
               {communities.length === 0 && <p className="text-white/40 text-sm text-center mt-4">No communities yet.</p>}
               {communities.map(c => (
                  <div key={c.id} onClick={() => { setSelectedCommunityId(c.id); setShowCommunitiesList(false); }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors">
                      {c.logo_url ? <img src={c.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-white font-bold">{c.name.charAt(0).toUpperCase()}</div>}
                      <span className="text-white font-medium">{c.name}</span>
                  </div>
               ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="channel-sidebar"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="h-full flex flex-col z-10 shrink-0 bg-[#0a0a0f]"
          >
            {selectedCommunityId !== null && (
              <button 
                onClick={() => setShowCommunitiesList(true)}
                className="flex items-center gap-2 p-4 text-white/60 hover:text-white hover:bg-white/[0.02] border-b border-white/[0.08] transition-colors mt-12 md:mt-0"
              >
                <ArrowLeft size={16} /> Back to Communities
              </button>
            )}
            <div className={`flex-1 ${selectedCommunityId === null ? 'mt-12 md:mt-0' : ''}`}>
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
      </AnimatePresence>

      {/* Floating Glass Chat Pane */}
      <div className="flex-1 m-4 md:m-6 lg:m-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-2xl flex flex-col overflow-hidden min-w-0">
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
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0a0a0f]/40"
          >
            <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
              <Compass className="w-10 h-10 text-white/15" />
            </div>
            <h2 className="text-white/50 text-lg font-semibold mb-2">No channel selected</h2>
            <p className="text-white/30 max-w-sm text-sm">Pick a channel from the sidebar to start chatting.</p>
          </motion.div>
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

      {/* FLOATING BOTTOM DOCK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl z-50">
        <motion.button
          onClick={() => handleSetView('communities')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${showCommunitiesList || selectedCommunityId !== null ? 'bg-cyan-500/20 shadow-lg shadow-cyan-500/20 text-cyan-400' : 'hover:bg-white/[0.06] text-white/70 hover:text-white'}`}
          title="Communities"
        >
          <Compass size={24} />
        </motion.button>
        
        <div className="w-px h-8 bg-white/[0.08] mx-1" />

        <motion.button
          onClick={() => handleSetView('dms')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${!showCommunitiesList && selectedCommunityId === null ? 'bg-violet-500/20 shadow-lg shadow-violet-500/20 text-violet-400' : 'hover:bg-white/[0.06] text-white/70 hover:text-white'}`}
          title="Direct Messages"
        >
          <MessageSquare size={24} />
        </motion.button>
      </div>
    </div>
  );
}
