// api/auth/validate-token.ts
import { validateRegistrationToken } from '../admin/create-user.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');

    if (!userId || !token) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Missing required parameters' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证token
    const validationResult = validateRegistrationToken(token, email || '');

    if (validationResult.valid) {
      return new Response(JSON.stringify({ 
        valid: true, 
        userId: validationResult.userId,
        message: 'Token is valid' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Invalid or expired token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Token validation error:', error);
    return new Response(JSON.stringify({ 
      valid: false,
      error: 'Internal server error',
      message: 'Token validation failed' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}