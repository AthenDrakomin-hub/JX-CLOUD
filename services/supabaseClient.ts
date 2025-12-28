
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

if (isDemoMode) {
  console.warn('JX CLOUD: 运行在演示模式。请在 Vercel 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
}