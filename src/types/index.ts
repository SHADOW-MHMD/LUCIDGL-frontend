export interface User {
  id: string;
  username: string;
  email?: string;
  streak_count: number;
  xp_points: number;
  badge_tier: string;
  created_at?: string;
}

export interface FacePost {
  id: string;
  user_id: string;
  telegram_file_id: string;
  caption: string;
  like_count: number;
  comment_count?: number;
  is_liked?: number | boolean;
  is_promoted?: number;
  created_at: string;
  username?: string;
  badge_tier?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  like_count: number;
  is_liked?: number | boolean;
  created_at: string;
  username?: string;
  badge_tier?: string;
}

// ponytail: ChatMessage used by (main)/chat D1 system — separate from SupabaseMessage below
export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username?: string;
  text: string;
  media_url?: string | null;
  timestamp: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  total_xp?: number;
  current_level?: number;
  current_streak?: number;
}

export interface Community {
  id: string;
  name: string;
  owner_id: string;
  logo_url?: string;
  role?: string; // current user's role in this community
}

export interface Channel {
  id: string;
  community_id?: string;
  name?: string;
  type: 'community' | 'dm';
  // ponytail: typed to match the deep select shape used in messages/page.tsx
  channel_members?: Array<{ profiles?: Profile }>;
}

export interface SupabaseMessage {
  id: string;
  channel_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles?: Profile;
}

export interface CodeFile {
  id: string;
  user_id: string;
  telegram_file_id: string;
  file_name: string;
  file_type: 'zip' | 'apk';
  caption?: string;
  download_count: number;
  created_at: string;
  username?: string;
}

export interface Analytics {
  impressions: number;
  downloads: number;
  upvotes_received: number;
}
