"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Plus, MessageSquare, Hash, Home, Compass, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Community, Channel, Profile } from "@/types";
import { ChatArea } from "@/components/chat/ChatArea";
import { CreateCommunityModal } from "@/components/chat/CreateCommunityModal";
import { CreateDMModal } from "@/components/chat/CreateDMModal";
import Link from "next/link";

export default function MessagesPage() {
  const { user } = useAuth();
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null); // null means Home/DMs
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Profile[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchInitialData = async () => {
      setLoading(true);
      // Fetch user's communities
      const { data: memberData } = await supabase
        .from('community_members')
        .select('community_id, communities(id, name, logo_url)')
        .eq('user_id', user.id);
        
      if (memberData) {
        const comms = memberData.map(m => m.communities) as unknown as Community[];
        setCommunities(comms);
      }
      setLoading(false);
    };
    
    fetchInitialData();
  }, [user]);

  // When community changes, fetch its channels (or DMs if null)
  useEffect(() => {
    if (!user) return;

    const fetchChannels = async () => {
      if (selectedCommunityId === null) {
        // Fetch DMs
        const { data: dmMembers } = await supabase
          .from('channel_members')
          .select('channel_id, channels(id, name, type)')
          .eq('user_id', user.id);
          
        if (dmMembers) {
          const dms = dmMembers.map(m => m.channels).filter(c => c && (c as any).type === 'dm') as unknown as Channel[];
          setChannels(dms);
          if (dms.length > 0) setSelectedChannel(dms[0]);
          else setSelectedChannel(null);
        }
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

        // Fetch community members
        const { data: commMembers } = await supabase
          .from('community_members')
          .select('profiles(id, username, avatar_url)')
          .eq('community_id', selectedCommunityId);
          
        if (commMembers) {
          setMembers(commMembers.map(m => m.profiles) as unknown as Profile[]);
        }
      }
    };
    
    fetchChannels();
  }, [user, selectedCommunityId]);

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
    <div className="flex h-screen w-full overflow-hidden bg-[#202225] font-sans">
      
      {/* 1. SERVER SIDEBAR (Left-most) */}
      <div className="w-[72px] shrink-0 bg-[#202225] flex flex-col items-center py-3 gap-2 overflow-y-auto no-scrollbar border-r border-[#1a1b1e] relative z-20">
        
        {/* Back Button */}
        <Link href="/" className="w-12 h-12 flex items-center justify-center bg-[#36393f] rounded-[24px] text-[#dcddde] hover:bg-white/10 hover:rounded-[16px] hover:text-white transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-[2px] bg-[#2d2f32] my-1 rounded-full" />

        {/* Home Button (DMs) */}
        <button 
          onClick={() => setSelectedCommunityId(null)}
          className={`relative group w-12 h-12 flex items-center justify-center transition-all duration-200 ${
            selectedCommunityId === null 
              ? 'bg-[#5865F2] rounded-[16px] text-white' 
              : 'bg-[#36393f] rounded-[24px] text-[#dcddde] hover:bg-[#5865F2] hover:rounded-[16px] hover:text-white'
          }`}
        >
          <MessageSquare className="w-6 h-6" />
          {selectedCommunityId === null && (
            <div className="absolute -left-3 w-2 h-10 bg-white rounded-r-full" />
          )}
        </button>

        <div className="w-8 h-[2px] bg-[#2d2f32] my-1 rounded-full" />

        {/* Communities List */}
        {communities.map(comm => (
          <button 
            key={comm.id}
            onClick={() => setSelectedCommunityId(comm.id)}
            className={`relative group w-12 h-12 flex items-center justify-center transition-all duration-200 ${
              selectedCommunityId === comm.id 
                ? 'bg-[#5865F2] rounded-[16px] text-white' 
                : 'bg-[#36393f] rounded-[24px] text-[#dcddde] hover:bg-[#5865F2] hover:rounded-[16px] hover:text-white'
            }`}
          >
            {comm.logo_url ? (
              <img src={comm.logo_url} alt="" className="w-full h-full object-cover rounded-inherit" />
            ) : (
              <span className="font-bold text-lg">{comm.name.substring(0, 1).toUpperCase()}</span>
            )}
            {selectedCommunityId === comm.id && (
              <div className="absolute -left-3 w-2 h-10 bg-white rounded-r-full" />
            )}
            <div className="absolute -left-3 w-2 h-0 bg-white rounded-r-full transition-all group-hover:h-5" />
          </button>
        ))}

        {/* Add Community */}
        <button 
          onClick={() => setIsCreatingCommunity(true)}
          className="w-12 h-12 flex items-center justify-center bg-[#36393f] rounded-[24px] text-[#3ba55c] hover:bg-[#3ba55c] hover:rounded-[16px] hover:text-white transition-all duration-200 mt-2"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 2. CHANNEL/DM SIDEBAR (Middle) */}
      <div className="w-60 shrink-0 bg-[#2f3136] flex flex-col relative z-10">
        
        {/* Header */}
        <div className="h-12 border-b border-[#202225] flex items-center justify-between px-4 shadow-sm shrink-0 hover:bg-[#34373c] transition-colors">
          <h2 className="text-white font-bold truncate">
            {selectedCommunityId === null 
              ? "Direct Messages" 
              : communities.find(c => c.id === selectedCommunityId)?.name || "Community"}
          </h2>
          {selectedCommunityId === null && (
            <button onClick={() => setIsCreatingDM(true)} className="text-[#b9bbbe] hover:text-white">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5 no-scrollbar">
          {channels.length === 0 ? (
            <div className="text-center px-4 py-8">
              <p className="text-[#72767d] text-sm">No channels found.</p>
            </div>
          ) : (
            channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`flex items-center w-full px-2 py-1.5 rounded-md text-left transition-colors group ${
                  selectedChannel?.id === channel.id 
                    ? 'bg-[#393c43] text-white' 
                    : 'text-[#8e9297] hover:bg-[#34373c] hover:text-[#dcddde]'
                }`}
              >
                {channel.type === 'community' ? (
                  <Hash className="w-5 h-5 mr-1.5 shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 mr-2 shrink-0 flex items-center justify-center text-white text-xs">
                    DM
                  </div>
                )}
                <span className="truncate font-medium flex-1">
                  {channel.name || "Unnamed DM"}
                </span>
              </button>
            ))
          )}
        </div>
        
        {/* User Status Area at bottom of sidebar */}
        <div className="h-[52px] bg-[#292b2f] shrink-0 flex items-center px-2 py-1.5 gap-2 border-t border-[#202225]/50">
          <div className="w-8 h-8 rounded-full bg-indigo-500 shrink-0"></div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-white text-sm font-bold truncate">You</span>
            <span className="text-[#b9bbbe] text-xs truncate">#Online</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN CHAT AREA (Right) */}
      <div className="flex-1 bg-[#36393f] relative z-0 flex flex-col">
        {selectedChannel ? (
          <ChatArea 
            channelId={selectedChannel.id} 
            channelName={selectedChannel.name || "chat"} 
            type={selectedChannel.type}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Compass className="w-20 h-20 text-[#72767d] opacity-50 mb-6" />
            <h2 className="text-[#a3a6aa] text-xl font-bold mb-2">No channel selected</h2>
            <p className="text-[#72767d]">Select a channel from the sidebar or create a new one to start chatting.</p>
          </div>
        )}
      </div>

      {/* 4. MEMBER LIST SIDEBAR (Right-most) */}
      {selectedCommunityId !== null && selectedChannel?.type === 'community' && (
        <div className="w-60 shrink-0 bg-[#2f3136] flex flex-col border-l border-[#202225]">
          {/* Header matches ChatArea header height */}
          <div className="h-12 border-b border-[#202225] flex items-center px-4 shadow-sm shrink-0 bg-[#36393f]">
            <Users className="w-5 h-5 text-[#72767d] mr-2" />
            <span className="text-white font-bold text-sm">Members</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <h3 className="text-xs font-bold text-[#8e9297] uppercase tracking-wider mb-2">
              Online — {members.length}
            </h3>
            <div className="flex flex-col gap-1">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#393c43] cursor-pointer transition-colors group">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
                      {member.avatar_url && <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#23a559] border-2 border-[#2f3136] rounded-full"></div>
                  </div>
                  <span className="text-[#8e9297] font-medium group-hover:text-[#dcddde] truncate">
                    {member.username}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCreatingCommunity && (
        <CreateCommunityModal 
          onClose={() => setIsCreatingCommunity(false)}
          onCreated={(id) => {
            setIsCreatingCommunity(false);
            setSelectedCommunityId(id);
            window.location.reload(); 
          }}
        />
      )}

      {isCreatingDM && (
        <CreateDMModal
          onClose={() => setIsCreatingDM(false)}
          onCreated={(id) => {
            setIsCreatingDM(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
