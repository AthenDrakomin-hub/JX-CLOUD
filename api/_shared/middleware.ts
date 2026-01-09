// api/_shared/middleware.ts

import { createUserClient, createServiceRoleClient } from './supabaseClient';

export type Context = {
  userClient: ReturnType<typeof createUserClient> | null;
  serviceClient: ReturnType<typeof createServiceRoleClient>;
  accessToken: string | null;
};

// Parse Authorization header and build context
export async function buildCtx(req: Request): Promise<Context> {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
  let accessToken: string | null = null;

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    accessToken = authHeader.slice(7);
  }

  const userClient = createUserClient(accessToken);
  const serviceClient = createServiceRoleClient();

  return { userClient, serviceClient, accessToken };
}

// Simple guard: requires authenticated user (access token present)
export function requireAuth(ctx: Context) {
  if (!ctx.accessToken) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }
}

// Production-grade response headers
export const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Node': 'Edge-V5'
};

// Helper to create JSON responses
export function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), { 
    status, 
    headers: corsHeaders 
  });
}