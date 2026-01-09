// api/storage/route.ts

import { buildCtx, requireAuth, corsHeaders, jsonResponse } from '../_shared/middleware';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);

  try {
    const ctx = await buildCtx(req);

    if (req.method === 'POST') {
      // Generate signed upload URL for authenticated user
      // Require auth
      requireAuth(ctx);
      
      const body = await req.json();
      const { bucket, path, expires = 3600 } = body;
      
      if (!bucket || !path) {
        return jsonResponse({ error: 'Missing bucket or path' }, 400);
      }
      
      // Use serviceClient to sign URL (server-side)
      const { data, error } = await ctx.serviceClient
        .storage
        .from(bucket)
        .createSignedUploadUrl(path, expires);
      
      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }
      
      return jsonResponse({ url: data.signedUrl }, 200);
    }

    if (req.method === 'GET') {
      // Generate signed download URL
      requireAuth(ctx);
      
      const bucket = url.searchParams.get('bucket');
      const path = url.searchParams.get('path');
      
      if (!bucket || !path) {
        return jsonResponse({ error: 'Missing bucket or path parameters' }, 400);
      }
      
      const { data, error } = await ctx.serviceClient
        .storage
        .from(bucket)
        .createSignedUrl(path, 60); // 60 seconds expiry
      
      if (error) {
        return jsonResponse({ error: error.message }, 400);
      }
      
      return jsonResponse({ url: data.signedUrl }, 200);
    }

    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return jsonResponse({ error: 'Unauthorized', details: err.message }, 401);
    }
    
    return jsonResponse({ error: err.message }, 500);
  }
}