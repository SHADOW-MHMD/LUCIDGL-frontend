"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const syncUserWithBackend = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";

      const res = await fetch(`${apiUrl}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        // If unique constraint fails, it just means they're already registered, which is fine
        if (data.error !== "User parameters already registered") {
          console.error("Failed to sync user:", data.error);
        }
      }
    } catch (error) {
      console.error("Backend sync error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await syncUserWithBackend(result.user);
        }
      } catch (error) {
        console.error("Redirect sign-in error:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    handleRedirectResult();

    return () => unsubscribe();
  }, [isMounted, syncUserWithBackend]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    const isMobileOrFirefox = /Mobi|Android|Firefox/i.test(navigator.userAgent);

    try {
      if (isMobileOrFirefox) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        setLoading(true);
        await syncUserWithBackend(result.user);
        setUser(result.user);
      }
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse bg-white/10 backdrop-blur-md border border-white/20 w-32 h-32 rounded-2xl"></div>
      </div>
    );
  }

  if (loading) {
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
