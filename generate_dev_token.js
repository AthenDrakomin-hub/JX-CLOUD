// generate_dev_token.js

// Local dev script — use only on trusted dev machine

// Usage:

//   SUPABASE_URL="https://<proj>.supabase.co" \

//   SUPABASE_SERVICE_ROLE_KEY="..." \

//   DEV_USER_EMAIL="athendrakominproton.me" \

//   DEV_USER_PWD="TempDevPwd!123" \

//   node generate_dev_token.js

import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEV_USER_EMAIL = process.env.DEV_USER_EMAIL || 'dev@example.com';
const DEV_USER_PWD = process.env.DEV_USER_PWD || 'TempDevPwd!123';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your env.');
  process.exit(1);
}

// Create admin client with service role key
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: {
    // don't persist session
    persistSession: false,
  },
});

// helper for fetch (Node 18+ has global fetch)
const fetcher = (globalThis.fetch && globalThis.fetch.bind(globalThis)) || (await import('node-fetch')).default;

async function ensureUser() {
  // Try to get user by email via admin API (select from auth.users via RPC)
  // supabase-js admin API has admin.getUserByEmail in newer versions, but to be compatible use the REST admin endpoint
  // We'll call the Admin API: /admin/users (requires service role) — but supabase-js has admin API helper(s).
  
  try {
    // Try to fetch existing user using admin.auth.api (works in many versions)
    // Use admin.auth.admin.listUsers if available; fallback to RPC against auth.users
    
    if (admin.auth.admin && typeof admin.auth.admin.listUsers === 'function') {
      // listUsers supports filtering, but older versions may paginate; we will attempt direct find
      const { data, error } = await admin.auth.admin.listUsers();
      if (error) {
        console.warn('listUsers error, falling back to direct create:', error.message || error);
      } else {
        const found = data.find((u) => u.email === DEV_USER_EMAIL);
        if (found) return found;
      }
    }
  } catch (e) {
    // ignore and fallback to create
  }
  
  // Fallback: create or update user via admin API
  try {
    // Create user (if already exists, update password)
    const { data, error } = await admin.auth.admin.createUser({
      email: DEV_USER_EMAIL,
      password: DEV_USER_PWD,
      email_confirm: true,
    });
    
    if (error) {
      // If user exists, update password
      if (error.message && error.message.includes('already exists')) {
        // find user id via listUsers (best effort)
        try {
          const listRes = await admin.auth.admin.listUsers();
          const found = listRes.data.find((u) => u.email === DEV_USER_EMAIL);
          if (found) {
            // update user password
            const upd = await admin.auth.admin.updateUserById(found.id, {
              password: DEV_USER_PWD,
            });
            
            if (upd.error) {
              console.error('Failed to update existing user password:', upd.error);
              process.exit(1);
            }
            
            return upd.data;
          }
        } catch (le) {
          console.error('Could not find existing user to update password:', le);
          process.exit(1);
        }
      } else {
        console.error('createUser error:', error);
        process.exit(1);
      }
    }
    
    return data;
  } catch (err) {
    console.error('Error ensuring user:', err);
    process.exit(1);
  }
}

async function getAccessTokenByPassword() {
  // Uses the public /auth/v1/token endpoint with grant_type=password
  // This requires the user's email and password. We just ensured the user exists and set the password above.
  
  const tokenUrl = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    email: DEV_USER_EMAIL,
    password: DEV_USER_PWD,
  });
  
  const res = await fetcher(tokenUrl, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE, // use service role as apikey when calling this endpoint from trusted env
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });
  
  const json = await res.json();
  
  if (!res.ok) {
    console.error('Token endpoint error:', json);
    process.exit(1);
  }
  
  // json will contain access_token, refresh_token, expires_in, token_type, etc.
  return json;
}

async function main() {
  console.log('Ensuring dev user exists (email):', DEV_USER_EMAIL);
  const user = await ensureUser();
  console.log('User ready:', user?.id ?? user?.user?.id ?? '<unknown-id>');
  
  console.log('Requesting short-lived access token via password grant');
  const tokenResp = await getAccessTokenByPassword();
  
  console.log('--- TOKEN RESPONSE ---');
  console.log('access_token:', tokenResp.access_token);
  console.log('expires_in (sec):', tokenResp.expires_in);
  console.log('token_type:', tokenResp.token_type);
  console.log('refresh_token:', tokenResp.refresh_token ? '(present)' : '(none)');
  console.log('----------------------');
  
  console.log('\nQuick usage: in browser devtools run:');
  console.log(`localStorage.setItem('jx_root_authority_bypass','true');`);
  console.log(`localStorage.setItem('jx_dev_access_token','${tokenResp.access_token}');`);
  
  console.log('\nRemove when done:');
  console.log(`localStorage.removeItem('jx_dev_access_token'); localStorage.removeItem('jx_root_authority_bypass');`);
}

main().catch((e) => {
  console.error('Script error:', e);
  process.exit(1);
});