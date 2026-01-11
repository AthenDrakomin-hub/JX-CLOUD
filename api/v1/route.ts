// api/v1/route.ts - Main API v1 route handling all endpoints

import { buildCtx, requireAuth, corsHeaders, jsonResponse } from '../_shared/middleware';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/v1/, '');
  const pathParts = path.split('/').filter(p => p); // Remove empty parts

  try {
    const ctx = await buildCtx(req);

    // Apply auth requirement to all v1 endpoints
    requireAuth(ctx);

    // Handle /api/v1/config/global
    if (path === '/config/global' && req.method === 'GET') {
      const { data, error } = await ctx.serviceClient.from('system_config').select('*').eq('id', 'global').single();
      
      if (error) {
        return jsonResponse({ 
          error: 'Failed to fetch system config', 
          details: error.message 
        }, 500);
      }

      return jsonResponse(data, 200);
    }

    // Handle /api/v1/orders (POST for creating orders)
    if (path === '/orders' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { room_id, items, payment_method } = body;

        // Input validation
        if (!room_id || !Array.isArray(items) || items.length === 0) {
          return jsonResponse({ 
            error: 'Missing required fields: room_id, items' 
          }, 400);
        }

        // Calculate total amount
        let subtotal = 0;
        for (const item of items) {
          if (item.unit_price && item.qty) {
            subtotal += item.unit_price * item.qty;
          }
        }

        // Apply 5% service charge
        const serviceChargeRate = 0.05; // 5% service charge
        const serviceCharge = subtotal * serviceChargeRate;
        const totalAmount = subtotal + serviceCharge;

        // Validate order amount is non-negative
        if (totalAmount < 0) {
          return jsonResponse({ 
            error: 'Total amount cannot be negative' 
          }, 400);
        }

        // Create order
        const orderData = {
          room_id,
          items,
          total_amount: totalAmount,
          tax_amount: serviceCharge, // Service charge as tax amount
          status: 'pending', // Default status
          payment_method: payment_method || 'Cash',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await ctx.serviceClient.from('orders').insert(orderData).select().single();

        if (error) {
          return jsonResponse({ 
            error: 'Failed to create order', 
            details: error.message 
          }, 500);
        }

        return jsonResponse({ 
          id: data.id,
          ...orderData
        }, 201);
      } catch (parseError) {
        return jsonResponse({ 
          error: 'Invalid request body', 
          details: parseError instanceof Error ? parseError.message : 'Unknown error' 
        }, 400);
      }
    }

    // Handle /api/v1/rooms/:roomId/orders (GET for room orders)
    if (pathParts.length === 3 && pathParts[0] === 'rooms' && pathParts[2] === 'orders' && req.method === 'GET') {
      const roomId = pathParts[1];
      const statusParam = url.searchParams.get('status');

      let query = ctx.serviceClient.from('orders').select('*').eq('room_id', roomId);

      if (statusParam) {
        query = query.eq('status', statusParam);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return jsonResponse({ 
          error: 'Failed to fetch room orders', 
          details: error.message 
        }, 500);
      }

      return jsonResponse(data, 200);
    }

    // Handle /api/v1/payment_configs (GET for active payment configs)
    if (path === '/payment_configs' && req.method === 'GET') {
      const { data, error } = await ctx.serviceClient.from('payment_configs').select('id, name, type, is_active, icon_type, instructions').eq('is_active', true);

      if (error) {
        return jsonResponse({ 
          error: 'Failed to fetch payment configs', 
          details: error.message 
        }, 500);
      }

      return jsonResponse(data, 200);
    }

    // Handle /api/v1/assign-role (POST for assigning user roles)
    if (path === '/assign-role' && req.method === 'POST') {
      const body = await req.json();
      const { email, userId } = body;

      if (!email || !userId) {
        return jsonResponse({ error: 'Missing required fields: email, userId' }, 400);
      }

      // Load admin email configuration from system_config table
      const { data: configData, error: configError } = await ctx.serviceClient
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
        // Fallback to default configuration if not found in database
        adminEmails = ["athendrakominproton.me [blocked]", "28111284084qq.com [blocked]"];
        adminEmailDomains = [];
      }

      // Determine user role based on email configuration
      let assignedRole = 'viewer'; // Default role

      // Process admin emails - remove blocked ones from consideration
      const validAdminEmails = adminEmails
        .map(adminEmail => {
          // Remove [blocked] tag if present and trim whitespace
          return adminEmail.replace(/\s*\[blocked\]\s*/g, '').trim();
        })
        .filter(cleanEmail => cleanEmail && cleanEmail.length > 0); // Remove empty strings

      // Check if email is in the valid admin list
      if (validAdminEmails.includes(email)) {
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
      error: "Protocol mismatch", 
      message: "API Node reached, but specific endpoint not defined." 
    }, 404);

  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return jsonResponse({ error: 'Unauthorized', details: err.message }, 401);
    }
    
    return jsonResponse({ error: 'Gateway Error', details: err.message }, 500);
  }
}