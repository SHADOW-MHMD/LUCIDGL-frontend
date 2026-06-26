"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const syncUserWithBackend = useCallback(async (sessionUser: SupabaseUser, token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://lucid-gl.muhammed1515mishal.workers.dev";
      
      const generatedUsername = sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User";
      const email = sessionUser.email || "no-email@provided.com";

      const res = await fetch(`${apiUrl}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: sessionUser.id,
          username: generatedUsername,
          email: email
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to parse error response" }));
        if (data.error !== "User parameters already registered") {
          console.error("Failed to sync user:", data.error);
        }
      }

      // Sync with Supabase profiles table for real-time chat joins
      try {
        await supabase.from("profiles").upsert({
          id: sessionUser.id,
          username: generatedUsername,
          avatar_url: sessionUser.user_metadata?.avatar_url || null,
        }, { onConflict: "id" });
      } catch (err) {
        console.error("Failed to sync Supabase profile", err);
      }
    } catch (error) {
      console.error("Backend sync error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setLoading(true);
        await syncUserWithBackend(session.user, session.access_token);
        setUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isMounted, syncUserWithBackend]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error("Sign-in error:", error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse bg-white/10 backdrop-blur-md border border-white/20 w-32 h-32 rounded-2xl"></div>
      </div>
    );
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
          <p className="text-white/70 font-medium tracking-wide">Syncing Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
