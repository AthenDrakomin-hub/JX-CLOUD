// pages/api/proxy.ts - 通用 Supabase 代理 API 路由
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path, method = 'GET', body, token } = req.body || {};
  
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing Supabase environment variables' });
  }

  // 如果提供了 token，则验证用户身份
  if (token) {
    try {
      const userResp = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userResp.status !== 200) return res.status(401).json({ error: "Invalid token" });
      const userInfo = await userResp.json();
      // userInfo contains user id and app_metadata, user_metadata, etc.
    } catch (error) {
      console.error('Token validation error:', error);
      return res.status(401).json({ error: 'Token validation failed' });
    }
  }

  try {
    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };

    // 如果有 token，添加到 Authorization 头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // 否则使用 ANON_KEY
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const url = `${SUPABASE_URL}${path}`;
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};