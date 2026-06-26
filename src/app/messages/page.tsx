"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Plus, MessageSquare, Hash, Home, Compass, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Community, Channel, Profile } from "@/types";
import { ChatArea } from "@/components/chat/ChatArea";
import { CreateCommunityModal } from "@/components/chat/CreateCommunityModal";
import { CreateDMModal } from "@/components/chat/CreateDMModal";
import { CreateChannelModal } from "@/components/chat/CreateChannelModal";
import Link from "next/link";

export default function MessagesPage() {
  const { user } = useAuth();
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null); // null means Home/DMs
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingDM, setIsCreatingDM] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Profile[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
  }, [user, selectedCommunityId, refreshTrigger]);

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
      
      {/* 1. SERVER SIDEBAR (Left-most) */}
      <div className="w-[80px] shrink-0 bg-white/5 backdrop-blur-xl flex flex-col items-center py-4 gap-3 overflow-y-auto no-scrollbar border-r border-white/10 relative z-20">
        
        {/* Back Button */}
        <Link href="/" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-8 h-[1px] bg-white/10 my-1 rounded-full" />

        {/* Home Button (DMs) */}
        <button 
          onClick={() => setSelectedCommunityId(null)}
          className={`relative group w-12 h-12 flex items-center justify-center transition-all duration-300 border ${
            selectedCommunityId === null 
              ? 'bg-blue-500/20 border-blue-500/50 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
              : 'bg-white/5 border-white/10 rounded-2xl text-white/70 hover:bg-white/10 hover:border-white/20 hover:rounded-xl hover:text-white'
          }`}
        >
          <MessageSquare className="w-6 h-6" />
          {selectedCommunityId === null && (
            <div className="absolute -left-3 w-2 h-10 bg-white rounded-r-full" />
          )}
        </button>

        <div className="w-8 h-[1px] bg-white/10 my-1 rounded-full" />

        {/* Communities List */}
        {communities.map(comm => (
          <button 
            key={comm.id}
            onClick={() => setSelectedCommunityId(comm.id)}
            className={`relative group w-12 h-12 flex items-center justify-center transition-all duration-300 border overflow-hidden ${
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
            {selectedCommunityId === comm.id && (
              <div className="absolute -left-3 w-2 h-10 bg-white rounded-r-full" />
            )}
            <div className="absolute -left-3 w-2 h-0 bg-white rounded-r-full transition-all group-hover:h-5" />
          </button>
        ))}

        {/* Add Community */}
        <button 
          onClick={() => setIsCreatingCommunity(true)}
          className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:rounded-xl hover:text-emerald-300 transition-all duration-300 mt-2"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 2. CHANNEL/DM SIDEBAR (Middle) */}
      <div className="w-64 shrink-0 bg-white/5 backdrop-blur-md flex flex-col relative z-10 border-r border-white/10">
        
        {/* Header */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-5 shadow-sm shrink-0 bg-white/5 transition-colors">
          <h2 className="text-white font-bold truncate tracking-wide">
            {selectedCommunityId === null 
              ? "Direct Messages" 
              : communities.find(c => c.id === selectedCommunityId)?.name || "Community"}
          </h2>
          {selectedCommunityId === null ? (
            <button onClick={() => setIsCreatingDM(true)} className="text-white/50 hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setIsCreatingChannel(true)} className="text-white/50 hover:text-white transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* List */}
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

      {/* 3. MAIN CHAT AREA (Right) */}
      <div className="flex-1 bg-transparent relative z-0 flex flex-col">
        {selectedChannel ? (
          <ChatArea 
            channelId={selectedChannel.id} 
            channelName={selectedChannel.name || "chat"} 
            type={selectedChannel.type}
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

      {/* 4. MEMBER LIST SIDEBAR (Right-most) */}
      {selectedCommunityId !== null && selectedChannel?.type === 'community' && (
        <div className="w-64 shrink-0 bg-white/5 backdrop-blur-xl flex flex-col border-l border-white/10 relative z-10">
          {/* Header matches ChatArea header height */}
          <div className="h-14 border-b border-white/10 flex items-center px-5 shadow-sm shrink-0 bg-white/5">
            <Users className="w-5 h-5 text-white/50 mr-2" />
            <span className="text-white font-bold text-sm tracking-wide">Members</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-2">
              Online — {members.length}
            </h3>
            <div className="flex flex-col gap-1">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/5 cursor-pointer transition-all duration-200 group">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shadow-md">
                      {member.avatar_url && <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    {/* Status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
                  </div>
                  <span className="text-white/70 font-medium group-hover:text-white truncate">
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
            // The useEffect will automatically fetch the new community and channels
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
          onCreated={(id) => {
            setIsCreatingChannel(false);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
