// api/users/route.ts

import { buildCtx, requireAuth, corsHeaders, jsonResponse } from '../_shared/middleware';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/users/, '');
  const pathParts = path.split('/').filter(p => p); // Remove empty parts
  const id = pathParts[0]; // /api/users/:id for PUT/DELETE

  try {
    const ctx = await buildCtx(req);

    // Apply auth requirement to all user endpoints
    requireAuth(ctx);

    if (req.method === 'GET') {
      // List users visible to the current user (RLS enforces)
      // Use serviceClient to get all users (admin functionality) or userClient for limited access
      const { data, error } = await ctx.serviceClient
        .from('users')
        .select('id,username,email,full_name,role,created_at,updated_at,is_online')
        .order('created_at', { ascending: false });

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse({ data }, 200);
    }

    if (req.method === 'POST') {
      // Create user record - typically only admin/service does this
      const body = await req.json();
      
      // Validate minimal fields
      const payload = {
        email: body.email,
        username: body.username,
        full_name: body.full_name ?? null,
        role: body.role ?? 'viewer', // Default role
        module_permissions: body.module_permissions ?? {},
        ip_whitelist: body.ip_whitelist ?? [],
        metadata: body.metadata ?? {},
      };

      const { data, error } = await ctx.serviceClient
        .from('users')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }

      return jsonResponse({ data }, 201);
    }

    if (req.method === 'PUT') {
      if (!id) {
        return jsonResponse({ error: 'Missing id' }, 400);
      }

      const body = await req.json();

      // Update user - user can update own profile via userClient (RLS), admin via serviceClient
      const { data, error } = await ctx.serviceClient
        .from('users')
        .update(body)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return jsonResponse({ error: error.message }, 403);
      }

      return jsonResponse({ data }, 200);
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return jsonResponse({ error: 'Missing id' }, 400);
      }

      // Only service role can delete users here
      const { error } = await ctx.serviceClient
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }

      return new Response(null, { status: 204 });
    }

    return jsonResponse({ error: 'Method Not Allowed' }, 405);

  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return jsonResponse({ error: 'Unauthorized', details: err.message }, 401);
    }
    
    const status = err.status ?? 500;
    return jsonResponse({ error: err.message }, status);
  }
}