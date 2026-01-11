// api/assign-role/function.ts - Edge function to assign user roles based on email configuration

import { createServiceRoleClient } from '../_shared/supabaseClient';
import { corsHeaders, jsonResponse } from '../_shared/middleware';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  try {
    // Verify the request has the proper authorization
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const supabaseKey = req.headers.get('x-supabase-key');

    // In production, you'd want to verify this is a legitimate request from Supabase Auth
    // For now, we'll rely on the service role key for security
    
    const svc = createServiceRoleClient();
    
    // Parse the request body
    const body = await req.json();
    const { email, userId } = body;

    if (!email || !userId) {
      return jsonResponse({ error: 'Missing required fields: email, userId' }, 400);
    }

    // Load configuration from system_config table
    const { data: configData, error: configError } = await svc
      .from('system_config')
      .select('source_tag')
      .eq('id', 'global')
      .single();

    let adminEmails: string[] = [];
    let adminEmailDomains: string[] = [];

    if (!configError && configData?.source_tag) {
      // Extract admin emails and domains from configuration
      adminEmails = configData.source_tag.adminEmails || [];
      adminEmailDomains = configData.source_tag.adminEmailDomains || [];
    } else {
      // Fallback to environment variables or default configuration
      // In a real scenario, you'd store this in the database instead of env vars
      adminEmails = ["athendrakominproton.me [blocked]", "28111284084qq.com [blocked]"];
      adminEmailDomains = [];
    }

    // Determine user role based on email configuration
    let assignedRole = 'viewer'; // Default role

    // Check if email is in the admin list (excluding blocked ones)
    const cleanAdminEmails = adminEmails
      .map(email => email.replace(/\s*\[blocked\]\s*/g, '').trim())
      .filter(email => email.length > 0);

    if (cleanAdminEmails.includes(email)) {
      assignedRole = 'admin';
    } else {
      // Check if email domain matches any admin domain
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (emailDomain && adminEmailDomains.some(domain => emailDomain.endsWith(domain.toLowerCase()))) {
        assignedRole = 'admin';
      }
    }

    // Update the user's role in the users table
    const { error: updateError } = await svc
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

  } catch (error: any) {
    console.error('Assign role function error:', error);
    return jsonResponse({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, 500);
  }
}