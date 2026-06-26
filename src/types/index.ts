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
  videoUrl: string;
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

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username?: string;
  text: string;
  timestamp: string;
}
