// api/_shared/supabaseClient.ts
// Server-side Supabase client factory for Edge/Serverless.
// Uses environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';

// Use service role key only where necessary. For user-scoped requests we construct client with
// the incoming user's access_token to apply RLS.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL) throw new Error('SUPABASE_URL not set in env');

export function createServiceRoleClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

// Create a client bound to a user's access token (so RLS and claims apply)
export function createUserClient(accessToken: string | null) {
  if (!accessToken) {
    // fallback to anon client (read-only per RLS)
    if (!SUPABASE_ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  }
  
  // For edge runtime, we use the anon key but the Supabase client will use the access token appropriately
  // The access token will be sent with requests that require authentication
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  });
}