// api/admin/route.ts

import { createServiceRoleClient } from '../_shared/supabaseClient';
import { corsHeaders, jsonResponse } from '../_shared/middleware';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // NOTE: do not accept user access tokens here. This endpoint runs with service role.
  // Optionally enforce a custom header / API key to prevent accidental public access.
  // We strongly recommend adding an additional server-side secret check (e.g., X-ADMIN-KEY).
  
  const adminKey = req.headers.get('x-admin-key');
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  const svc = createServiceRoleClient();

  try {
    if (req.method === 'POST') {
      // e.g., bulk import users, trigger background job, etc.
      const body = await req.json();
      
      // perform admin tasks with svc
      // Example: create multiple rows
      const { data, error } = await svc.from('some_admin_table').insert(body.items);
      
      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }
      
      return jsonResponse({ data }, 200);
    }
    
    if (req.method === 'GET') {
      // Example: get admin stats or perform admin read operations
      // This is just an example - implement based on your needs
      const { count, error } = await svc.from('orders').select('*', { count: 'exact', head: true });
      
      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }
      
      return jsonResponse({ stats: { totalOrders: count } }, 200);
    }

    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
}