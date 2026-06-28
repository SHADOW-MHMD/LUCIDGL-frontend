"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Plus, MessageSquare, Hash, Compass, ArrowLeft, Users, UserPlus, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Community, Channel, Profile } from "@/types";
import { ChatArea } from "@/components/chat/ChatArea";
import { CreateCommunityModal } from "@/components/chat/CreateCommunityModal";
import { CreateDMModal } from "@/components/chat/CreateDMModal";
import { CreateChannelModal } from "@/components/chat/CreateChannelModal";
import { AddMemberModal } from "@/components/chat/AddMemberModal";
import Link from "next/link";

interface MemberWithRole extends Profile {
  role: string;
}

export default function MessagesPage() {
  const { user } = useAuth();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [currentRole, setCurrentRole] = useState<string | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isAdmin = currentRole === 'owner' || currentRole === 'admin';

  // Fetch communities on mount
  useEffect(() => {
    if (!user) return;
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: memberData } = await supabase
        .from('community_members')
        .select('community_id, role, communities(id, name, logo_url, owner_id)')
        .eq('user_id', user.id);

      if (memberData) {
        const comms = memberData.map(m => ({
          ...(m.communities as any),
          role: m.role,
        })) as Community[];
        setCommunities(comms);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, [user]);

  // When community changes, fetch channels + members
  useEffect(() => {
    if (!user) return;

    const fetchChannels = async () => {
      if (selectedCommunityId === null) {
        // Fetch DMs
        const { data: dmMembers } = await supabase
          .from('channel_members')
          .select('channel_id, channels(id, name, type, channel_members(profiles(id, username, avatar_url)))')
          .eq('user_id', user.id);

        if (dmMembers) {
          const dms = dmMembers
            .map(m => m.channels)
            .filter(c => c && (c as any).type === 'dm') as unknown as Channel[];
          setChannels(dms);
          if (dms.length > 0) setSelectedChannel(dms[0]);
          else setSelectedChannel(null);
        }
        setCurrentRole(undefined);
        setMembers([]);
      } else {
        // Fetch community channels
        const { data: commChannels } = await supabase
          .from('channels')
          .select('*')
          .eq('community_id', selectedCommunityId)
          .order('created_at', { ascending: true });

        if (commChannels) {
          setChannels(commChannels as Channel[]);
          if (commChannels.length > 0) setSelectedChannel(commChannels[0] as Channel);
          else setSelectedChannel(null);
        }

        // Fetch community members with roles
        const { data: commMembers } = await supabase
          .from('community_members')
          .select('role, profiles(id, username, avatar_url)')
          .eq('community_id', selectedCommunityId);

        if (commMembers) {
          const mems = commMembers.map(m => ({
            ...(m.profiles as any),
            role: m.role,
          })) as MemberWithRole[];
          setMembers(mems);
          // ponytail: derive current user's role from the member list
          const me = mems.find(m => m.id === user.id);
          setCurrentRole(me?.role);
        }
      }
    };

    fetchChannels();
  }, [user, selectedCommunityId, refreshTrigger]);

  // ponytail: delete community → Postgres CASCADE does the rest
  const handleDeleteCommunity = async (commId: string) => {
    if (!window.confirm("Delete this server permanently? All channels and messages will be wiped.")) return;
    const { error } = await supabase.from('communities').delete().eq('id', commId);
    if (error) { console.error("Failed to delete community", error); return; }
    setCommunities(prev => prev.filter(c => c.id !== commId));
    if (selectedCommunityId === commId) {
      setSelectedCommunityId(null);
      setChannels([]);
      setSelectedChannel(null);
    }
  };

  const handleKickMember = async (targetId: string) => {
    if (!selectedCommunityId) return;
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', selectedCommunityId)
      .eq('user_id', targetId);
    if (error) { console.error("Failed to kick member", error); return; }
    setMembers(prev => prev.filter(m => m.id !== targetId));
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 opacity-50" />
        <h2 className="text-2xl font-bold text-white/90">Authentication Required</h2>
        <p className="text-slate-400">Sign in to access messages and communities.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent font-sans">

      {/* 1. SERVER SIDEBAR */}
      <div className="w-[80px] shrink-0 bg-white/5 backdrop-blur-xl flex flex-col items-center py-4 gap-3 overflow-y-auto no-scrollbar border-r border-white/10 relative z-20">

        <Link href="/" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-[1px] bg-white/10 my-1 rounded-full" />

        <button
          onClick={() => setSelectedCommunityId(null)}
          className={`relative group w-12 h-12 flex items-center justify-center transition-all duration-300 border ${
            selectedCommunityId === null
              ? 'bg-blue-500/20 border-blue-500/50 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              : 'bg-white/5 border-white/10 rounded-2xl text-white/70 hover:bg-white/10 hover:border-white/20 hover:rounded-xl hover:text-white'
          }`}
        >
          <MessageSquare className="w-6 h-6" />
          {selectedCommunityId === null && <div className="absolute -left-3 w-2 h-10 bg-white rounded-r-full" />}
        </button>

        <div className="w-8 h-[1px] bg-white/10 my-1 rounded-full" />

        {communities.map(comm => (
          <div key={comm.id} className="relative group/server">
            <button
              onClick={() => setSelectedCommunityId(comm.id)}
              className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 border overflow-hidden ${
                selectedCommunityId === comm.id
                  ? 'bg-blue-500/20 border-blue-500/50 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 border-white/10 rounded-2xl text-white/70 hover:bg-white/10 hover:border-white/20 hover:rounded-xl hover:text-white'
              }`}
            >
              {comm.logo_url ? (
                <img src={comm.logo_url} alt="" className="w-full h-full object-cover rounded-inherit" />
              ) : (
                <span className="font-bold text-lg">{comm.name.substring(0, 1).toUpperCase()}</span>
              )}
              {selectedCommunityId === comm.id && <div className="absolute -left-3 w-2 h-10 bg-white rounded-r-full" />}
              <div className="absolute -left-3 w-2 h-0 bg-white rounded-r-full transition-all group-hover/server:h-5" />
            </button>
            {/* ponytail: delete server — only visible to owner/admin on hover */}
            {(comm.role === 'owner' || comm.role === 'admin') && (
              <button
                onClick={() => handleDeleteCommunity(comm.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/server:opacity-100 transition-opacity z-10"
                title="Delete server"
              >
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={() => setIsCreatingCommunity(true)}
          className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:rounded-xl hover:text-emerald-300 transition-all duration-300 mt-2"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 2. CHANNEL/DM SIDEBAR */}
      <div className="w-64 shrink-0 bg-white/5 backdrop-blur-md flex flex-col relative z-10 border-r border-white/10">

        <div className="h-14 border-b border-white/10 flex items-center justify-between px-5 shadow-sm shrink-0 bg-white/5 transition-colors">
          <h2 className="text-white font-bold truncate tracking-wide">
            {selectedCommunityId === null
              ? "Direct Messages"
              : communities.find(c => c.id === selectedCommunityId)?.name || "Community"}
          </h2>
          <div className="flex items-center gap-2">
            {selectedCommunityId === null ? (
              <button onClick={() => setIsCreatingDM(true)} className="text-white/50 hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            ) : (
              isAdmin && (
                <button onClick={() => setIsCreatingChannel(true)} className="text-white/50 hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 no-scrollbar">
          {channels.length === 0 ? (
            <div className="text-center px-4 py-8 bg-white/5 border border-white/10 rounded-xl mt-4">
              <p className="text-white/50 text-sm">No channels found.</p>
            </div>
          ) : (
            channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`flex items-center w-full px-3 py-2 rounded-xl text-left transition-all duration-200 group border ${
                  selectedChannel?.id === channel.id
                    ? 'bg-white/10 border-white/10 text-white shadow-sm'
                    : 'border-transparent text-white/60 hover:bg-white/5 hover:text-white/90 hover:border-white/5'
                }`}
              >
                {channel.type === 'community' ? (
                  <Hash className="w-5 h-5 mr-1.5 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 mr-2 shrink-0 flex items-center justify-center text-white text-xs overflow-hidden">
                    {(() => {
                      const otherProfile = channel.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles;
                      return otherProfile?.avatar_url ? (
                        <img src={otherProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : "DM";
                    })()}
                  </div>
                )}
                <span className="truncate font-medium flex-1">
                  {channel.type === 'dm' ? (
                    (() => {
                      const otherProfile = channel.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles;
                      return otherProfile?.username || "Unnamed DM";
                    })()
                  ) : (
                    channel.name || "Unnamed Channel"
                  )}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="h-16 bg-black/20 shrink-0 flex items-center px-4 py-2 gap-3 border-t border-white/10 backdrop-blur-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shrink-0 overflow-hidden shadow-lg shadow-blue-500/20">
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-white text-sm font-bold truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "You"}
            </span>
            <span className="text-white/50 text-xs truncate">#Online</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CHAT AREA */}
      <div className="flex-1 bg-transparent relative z-0 flex flex-col">
        {selectedChannel ? (
          <ChatArea
            channelId={selectedChannel.id}
            channelName={
              selectedChannel.type === 'dm'
                ? (selectedChannel.channel_members?.find(m => m.profiles?.id !== user.id)?.profiles?.username || "Direct Message")
                : (selectedChannel.name || "chat")
            }
            type={selectedChannel.type}
            communityRole={currentRole}
            onChannelDeleted={() => {
              setChannels(prev => prev.filter(c => c.id !== selectedChannel.id));
              setSelectedChannel(null);
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/20 backdrop-blur-md">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Compass className="w-12 h-12 text-white/30" />
            </div>
            <h2 className="text-white/70 text-2xl font-bold mb-2 tracking-wide">No channel selected</h2>
            <p className="text-white/40 max-w-sm">Select a channel from the sidebar or create a new one to start chatting.</p>
          </div>
        )}
      </div>

      {/* 4. MEMBER LIST SIDEBAR */}
      {selectedCommunityId !== null && selectedChannel?.type === 'community' && (
        <div className="w-64 shrink-0 bg-white/5 backdrop-blur-xl flex flex-col border-l border-white/10 relative z-10">
          <div className="h-14 border-b border-white/10 flex items-center justify-between px-5 shadow-sm shrink-0 bg-white/5">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-white/50 mr-2" />
              <span className="text-white font-bold text-sm tracking-wide">Members</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsAddingMember(true)}
                className="text-white/50 hover:text-emerald-400 transition-colors"
                title="Add Member"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            {/* Group by role */}
            {['owner', 'admin', 'member'].map(roleGroup => {
              const groupMembers = members.filter(m => m.role === roleGroup);
              if (groupMembers.length === 0) return null;
              return (
                <div key={roleGroup} className="mb-4">
                  <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-2">
                    {roleGroup}s — {groupMembers.length}
                  </h3>
                  <div className="flex flex-col gap-1">
                    {groupMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/5 cursor-pointer transition-all duration-200 group/member">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-md">
                            {member.avatar_url && <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
                        </div>
                        <span className="text-white/70 font-medium group-hover/member:text-white truncate flex-1">
                          {member.username}
                        </span>
                        {/* ponytail: kick button — only for admins, not for self, not for other owners */}
                        {isAdmin && member.id !== user.id && member.role !== 'owner' && (
                          <button
                            onClick={() => handleKickMember(member.id)}
                            className="opacity-0 group-hover/member:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all rounded"
                            title="Kick member"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCreatingCommunity && (
        <CreateCommunityModal
          onClose={() => setIsCreatingCommunity(false)}
          onCreated={(id) => {
            setIsCreatingCommunity(false);
            setSelectedCommunityId(id);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
      {isCreatingDM && (
        <CreateDMModal
          onClose={() => setIsCreatingDM(false)}
          onCreated={(id) => {
            setIsCreatingDM(false);
            setSelectedCommunityId(null);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
      {isCreatingChannel && selectedCommunityId && (
        <CreateChannelModal
          communityId={selectedCommunityId}
          onClose={() => setIsCreatingChannel(false)}
          onCreated={() => {
            setIsCreatingChannel(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
      {isAddingMember && selectedCommunityId && (
        <AddMemberModal
          communityId={selectedCommunityId}
          onClose={() => setIsAddingMember(false)}
          onAdded={() => {
            setIsAddingMember(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
