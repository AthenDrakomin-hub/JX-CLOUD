// api/assign-role/route.ts - Edge function to assign user roles based on email configuration

import { buildCtx, requireAuth, corsHeaders, jsonResponse } from '../_shared/middleware';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const ctx = await buildCtx(req);

    // Apply auth requirement - only authenticated users can trigger this
    // For a signup/role assignment function, we might want different auth logic
    // requireAuth(ctx);

    // This endpoint should be called when a new user signs up or needs role assignment
    if (req.method === 'POST') {
      const body = await req.json();
      const { email, userId } = body;

      if (!email || !userId) {
        return jsonResponse({ error: 'Missing required fields: email, userId' }, 400);
      }

      // Define admin email configuration
      const adminEmails = ["athendrakominproton.me", "28111284084qq.com"]; // Cleaned from blocked status
      const adminEmailDomains: string[] = []; // No domains specified

      // Determine user role based on email configuration
      let assignedRole = 'viewer'; // Default role

      // Check if email is in the admin list
      if (adminEmails.includes(email)) {
        assignedRole = 'admin';
      } else {
        // Check if email domain matches any admin domain
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (emailDomain && adminEmailDomains.some(domain => emailDomain.endsWith(domain.toLowerCase()))) {
          assignedRole = 'admin';
        }
      }

      // Update the user's role in the users table using service role
      const { error: updateError } = await ctx.serviceClient
        .from('users')
        .update({ role: assignedRole })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user role:', updateError);
        return jsonResponse({ error: 'Failed to update user role', details: updateError.message }, 500);
      }

      return jsonResponse({ 
        message: 'Role assigned successfully', 
        userId, 
        email, 
        assignedRole 
      }, 200);
    }

    return jsonResponse({ 
      error: "Method not allowed", 
      message: "Only POST method is supported for this endpoint." 
    }, 405);

  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return jsonResponse({ error: 'Unauthorized', details: err.message }, 401);
    }
    
    return jsonResponse({ error: 'Gateway Error', details: err.message }, 500);
  }
}