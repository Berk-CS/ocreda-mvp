'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

const SESSION_BOOT_TIMEOUT_MS = 5_000;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithOtp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: number | undefined;
    const sessionTimeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error('Session initialization timed out')),
        SESSION_BOOT_TIMEOUT_MS,
      );
    });

    Promise.race([supabase.auth.getSession(), sessionTimeout])
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithOtp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
