
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern for Supabase client
let supabaseInstance: SupabaseClient | null = null;

export const initializeSupabase = (): SupabaseClient => {
  // Validate environment variables exist
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not defined in environment variables');
  }

  if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
  }

  // Create and return the Supabase client instance
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client': 'react-app'
      }
    }
  });
};

// Get or create the singleton Supabase client instance
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = initializeSupabase();
    
    // Perform a basic health check to verify the connection
    supabaseInstance
      .from('users') // Test with a common table
      .select('id', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          console.error('Supabase connection health check failed:', error.message);
        } else {
          console.log('Supabase client initialized and connection verified');
        }
      })
      .catch((err) => {
        console.error('Supabase connection health check error:', err);
      });
  }
  
  return supabaseInstance;
};

// Export the default client instance
export const supabase = getSupabaseClient();

// Check if user has admin role
export const isAdmin = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const userRole = session.user?.user_metadata?.role;
  return userRole === 'admin';
};

// Check if user has developer role
export const isDeveloper = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const userRole = session.user?.user_metadata?.role;
  return userRole === 'developer';
};

// Check if user has staff role
export const isStaff = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const userRole = session.user?.user_metadata?.role;
  return userRole === 'staff';
};

// Check if user has elevated permissions (admin or developer)
export const hasElevatedPermissions = async (): Promise<boolean> => {
  const admin = await isAdmin();
  const developer = await isDeveloper();
  return admin || developer;
};

// Get current user role
export const getUserRole = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  return session.user?.user_metadata?.role || null;
};

// Check if JWT token is valid
export const isValidSession = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return false;
  }
  
  // Check if token is expired
  const isExpired = session.expires_at && session.expires_at < Math.floor(Date.now() / 1000);
  return !isExpired;
};

// In production mode only
const isDemoMode = false;
export { isDemoMode };