import { useEffect, useState } from 'react';
import { supabase } from '../services/enhancedSupabaseClient';
import type { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }
    init();
    
    const { data: listener } = supabase.auth.onAuthStateChange((event: any, s: any) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
    });
    
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  
  async function signInWithEmail(email: string) {
    // 魔法链接示例
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return true;
  }
  
  async function signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session ?? null);
    setUser(data.user ?? null);
    return data;
  }
  
  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    
    // 清除所有前端会话状态和缓存
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  }
  
  return { session, user, loading, signInWithEmail, signInWithPassword, signOut };
}