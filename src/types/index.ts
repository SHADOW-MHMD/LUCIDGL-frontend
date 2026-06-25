export interface User {
  id: string;
  username: string;
  email: string;
  streak_count: number;
  xp_points: number;
  badge_tier: string;
  created_at: string;
}

export interface FacePost {
  id: string;
  user_id: string;
  videoUrl: string;
  caption: string;
  like_count: number;
  is_promoted?: number;
  created_at: string;
  username?: string;
  badge_tier?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  channel_name: string | null;
  message_content: string;
  created_at: string;
  sender_username?: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username?: string;
  text: string;
  timestamp: string;
}

export interface RegisterPayload {
  id: string;
  username: string;
  email: string;
}

export interface CreateReelPayload {
  id: string;
  hf_repo_path: string;
  caption?: string;
}

export interface SendMessagePayload {
  id: string;
  recipient_id?: string | null;
  channel_name?: string | null;
  message_content: string;
}

export interface LikePayload {
  postId: string;
}
