"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Compass, MessageSquare, PlusSquare, ArrowLeft, Search, Paperclip, Send, Mic } from "lucide-react";
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
import { MemberSidebar } from "@/components/chat/MemberSidebar";
import { LeaderboardModal } from "@/components/chat/LeaderboardModal";
import { motion, AnimatePresence } from "framer-motion";
import { ChannelSidebar } from "@/components/chat/ChannelSidebar";

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
    if (savedView === 'dms') setActiveTab('dms');
  }, []);

  const handleSetTab = (tab: 'communities' | 'dms') => {
    setActiveTab(tab);
    localStorage.setItem('messages_view', tab);
    if (tab === 'dms') {
      setSelectedCommunityId(null);
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
          supabase.from('community_members')
            .select('role, profiles(id, username, avatar_url)')
            .eq('community_id', selectedCommunityId)
            .limit(100)
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
    <div className="flex flex-col items-center justify-center h-screen gap-6 text-center bg-[#0a0a0f]">
      <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
      <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
      <p className="text-white/50">Sign in to access messages and communities.</p>
    </div>
  );

  const filteredCommunities = communities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0a0a0f] text-white font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className="w-[350px] h-full bg-[#0d0d1a] border-r border-white/[0.08] flex flex-col shrink-0">
        
        {/* Search Header */}
        <div className="p-4 pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex px-4 gap-6 border-b border-white/[0.08]">
          <button 
            onClick={() => handleSetTab('communities')}
            className={`pb-3 text-sm font-medium relative transition-colors ${activeTab === 'communities' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            Communities
            {activeTab === 'communities' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500 rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => handleSetTab('dms')}
            className={`pb-3 text-sm font-medium relative transition-colors ${activeTab === 'dms' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            Direct Messages
            {activeTab === 'dms' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-violet-500 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'communities' && selectedCommunityId === null ? (
              <motion.div
                key="communities-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 space-y-1"
              >
                {filteredCommunities.length === 0 && <p className="text-white/40 text-sm text-center mt-6">No communities found.</p>}
                {filteredCommunities.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedCommunityId(c.id)} 
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] cursor-pointer transition-colors group"
                  >
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/[0.08]" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-semibold text-[15px] truncate text-white/90 group-hover:text-white">{c.name}</span>
                        <span className="text-[11px] text-white/30 shrink-0">12:00</span>
                      </div>
                      <p className="text-[13px] text-white/50 truncate group-hover:text-white/70">Click to view channels</p>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setIsCreatingCommunity(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] cursor-pointer transition-colors text-violet-400 group mt-4"
                >
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                    <PlusSquare size={20} />
                  </div>
                  <span className="font-medium text-[15px]">Create Community</span>
                </button>
              </motion.div>
            ) : activeTab === 'communities' && selectedCommunityId !== null ? (
              <motion.div
                key="channels-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <button 
                  onClick={() => setSelectedCommunityId(null)}
                  className="flex items-center gap-2 px-4 py-3 text-[13px] font-medium text-white/50 hover:text-white hover:bg-white/[0.03] border-b border-white/[0.08] transition-colors shrink-0"
                >
                  <ArrowLeft size={16} /> Back to Folders
                </button>
                <div className="flex-1">
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
            ) : (
              <motion.div
                key="dms-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 h-full flex flex-col"
              >
                <div className="flex-1 overflow-y-auto space-y-1">
                  {channels.filter(c => c.type === 'dm').length === 0 && (
                     <p className="text-white/40 text-sm text-center mt-6">No direct messages yet.</p>
                  )}
                  {channels.filter(c => c.type === 'dm').map(ch => {
                    const otherMember = ch.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles;
                    const isActive = selectedChannel?.id === ch.id;
                    return (
                      <div 
                        key={ch.id} 
                        onClick={() => setSelectedChannel(ch)} 
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors group ${isActive ? 'bg-violet-600/20' : 'hover:bg-white/[0.05]'}`}
                        onContextMenu={(e) => handleChannelCtx(e, ch)}
                      >
                        {otherMember?.avatar_url ? (
                          <img src={otherMember.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${isActive ? 'bg-violet-500' : 'bg-white/10'}`}>
                            {(otherMember?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className={`font-semibold text-[15px] truncate ${isActive ? 'text-violet-300' : 'text-white/90 group-hover:text-white'}`}>
                              {otherMember?.username || 'Unknown User'}
                            </span>
                            <span className="text-[11px] text-white/30 shrink-0">12:00</span>
                          </div>
                          <p className={`text-[13px] truncate ${isActive ? 'text-violet-200/70' : 'text-white/50 group-hover:text-white/70'}`}>
                            Direct Message
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => setIsCreatingDM(true)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.05] cursor-pointer transition-colors text-violet-400 group shrink-0"
                >
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                    <PlusSquare size={20} />
                  </div>
                  <span className="font-medium text-[15px]">New Message</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-[#0a0a0f]">
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
            onChannelDeleted={() => {
              setChannels(prev => prev.filter(c => c.id !== selectedChannel.id));
              setSelectedChannel(null);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#0a0a0f]">
            <div className="w-24 h-24 rounded-full bg-white/[0.02] flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-white/10" />
            </div>
            <h2 className="text-white/50 text-xl font-semibold mb-2">Select a chat to start messaging</h2>
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

