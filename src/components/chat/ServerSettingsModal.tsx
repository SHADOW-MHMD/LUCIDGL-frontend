"use client";

import { useState } from "react";
import { X, Server, Users, AlertTriangle, Check, Loader2, LogOut, ShieldCheck, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  username: string;
  avatar_url?: string;
  role: string;
}

interface ServerSettingsModalProps {
  communityId: string;
  communityName: string;
  currentRole: string;
  members: Member[];
  onClose: () => void;
  onDeleted: () => void;
  onNameChanged: (newName: string) => void;
  onMemberKicked: (userId: string) => void;
  onRoleChanged: (userId: string, newRole: string) => void;
}

type Tab = 'overview' | 'members' | 'danger';

export function ServerSettingsModal({
  communityId, communityName, currentRole, members,
  onClose, onDeleted, onNameChanged, onMemberKicked, onRoleChanged
}: ServerSettingsModalProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [name, setName] = useState(communityName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentRole === 'owner';
  const isAdmin = currentRole === 'owner' || currentRole === 'admin';

  const handleSaveName = async () => {
    if (!name.trim() || name === communityName) return;
    setSaving(true);
    const { error } = await supabase.from('communities').update({ name: name.trim() }).eq('id', communityId);
    setSaving(false);
    if (!error) {
      setSaved(true);
      onNameChanged(name.trim());
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleKick = async (userId: string) => {
    await supabase.from('community_members').delete().eq('community_id', communityId).eq('user_id', userId);
    onMemberKicked(userId);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase.from('community_members').update({ role: newRole }).eq('community_id', communityId).eq('user_id', userId);
    onRoleChanged(userId, newRole);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== communityName) return;
    setDeleting(true);
    await supabase.from('communities').delete().eq('id', communityId);
    onDeleted();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Server className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    ...(isOwner ? [{ id: 'danger' as Tab, label: 'Delete Server', icon: <AlertTriangle className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[#1e1f22] w-full max-w-3xl h-[calc(100vh-80px)] max-h-[700px] rounded-2xl overflow-hidden flex shadow-2xl border border-white/5"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Tab Navigation — Discord style */}
        <div className="w-56 bg-[#2b2d31] flex flex-col p-4 shrink-0 overflow-y-auto">
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-2 truncate">
            {communityName}
          </p>
          <div className="flex flex-col gap-0.5">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                  tab === t.id
                    ? 'bg-white/10 text-white'
                    : t.id === 'danger'
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="mt-auto">
            <div className="h-px bg-white/10 mb-3" />
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors w-full"
            >
              <X className="w-4 h-4" /> Esc
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>

          {tab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-6">Server Overview</h2>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Server Name</label>
              <div className="flex gap-3">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || name === communityName || !name.trim()}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium flex items-center gap-2 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                  {saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Members</h2>
              <p className="text-white/40 text-sm mb-6">{members.length} members</p>
              <div className="flex flex-col gap-1">
                {['owner', 'admin', 'member'].map(roleGroup => {
                  const group = members.filter(m => m.role === roleGroup);
                  if (!group.length) return null;
                  return (
                    <div key={roleGroup} className="mb-4">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        {roleGroup}s — {group.length}
                      </p>
                      {group.map(m => (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 group transition-colors">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden shrink-0">
                            {m.avatar_url && <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{m.username}</p>
                            <p className="text-white/40 text-xs capitalize">{m.role}</p>
                          </div>
                          {/* Controls — only for admins/owners acting on members below them */}
                          {isAdmin && m.role !== 'owner' && (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              {isOwner && m.role === 'member' && (
                                <button
                                  onClick={() => handleRoleChange(m.id, 'admin')}
                                  className="p-1.5 rounded-md text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                  title="Promote to Admin"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                              {isOwner && m.role === 'admin' && (
                                <button
                                  onClick={() => handleRoleChange(m.id, 'member')}
                                  className="p-1.5 rounded-md text-white/40 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                                  title="Demote to Member"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleKick(m.id)}
                                className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Kick"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'danger' && (
            <div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h2>
              <p className="text-white/50 text-sm mb-8">These actions are permanent and cannot be undone.</p>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-white font-bold mb-1">Delete this server</h3>
                <p className="text-white/50 text-sm mb-4">
                  Once deleted, all channels, messages, and members will be permanently wiped. Type the server name to confirm.
                </p>
                <input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={`Type "${communityName}" to confirm`}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 transition-colors mb-4"
                />
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirm !== communityName || deleting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium flex items-center gap-2 transition-colors"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Delete Server
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
