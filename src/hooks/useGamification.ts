import { useEffect, useState } from 'react';
import { env } from '@/lib/env';

export interface LeaderboardUser {
  id: string;
  username: string;
  xp_points: number;
  streak_count: number;
  max_streak: number;
  badge_tier: string;
  avatar_url?: string;
  current_level: number;
}

let cachedLeaderboard: LeaderboardUser[] | null = null;
let isFetching = false;
let fetchPromise: Promise<LeaderboardUser[]> | null = null;

export function useGamification() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(cachedLeaderboard || []);

  useEffect(() => {
    if (cachedLeaderboard) return;
    if (isFetching && fetchPromise) {
      fetchPromise.then(setLeaderboard);
      return;
    }
    
    isFetching = true;
    fetchPromise = fetch(`${env.apiUrl}/api/users/leaderboard`)
      .then(res => res.json())
      .then(data => {
        cachedLeaderboard = data;
        setLeaderboard(data);
        isFetching = false;
        return data;
      })
      .catch((err) => {
        console.error("Failed to load gamification leaderboard:", err);
        isFetching = false;
        return [];
      });
  }, []);

  const getGamificationData = (userId: string, baseLevel: number = 0, baseBadge: string = "NOVICE", streakCount: number = 0) => {
    const rankIndex = leaderboard.findIndex(u => u.id === userId);
    
    let dynamicBadge = baseBadge;
    let glowClass = "";
    
    if (rankIndex === 0 && baseLevel >= 100) {
      dynamicBadge = "GOD TIER";
    } else if (rankIndex >= 0 && rankIndex < 10 && baseLevel >= 50) {
      dynamicBadge = "GRANDMASTER";
    }
    
    if (rankIndex === 0) {
      glowClass = "border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse";
    } else if (rankIndex === 1 || rankIndex === 2) {
      glowClass = "border-slate-300/40 shadow-[0_0_15px_rgba(203,213,225,0.25)]";
    }
    
    const showFlame = streakCount > 7;
    
    return { dynamicBadge, glowClass, showFlame };
  };

  return { getGamificationData, leaderboard };
}
