// pages/api/update-order.ts

import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Env lookup consistent with your project:
 * Priority: VITE_<KEY> -> NEXT_PUBLIC_<KEY> -> <KEY>
 */
const getEnv = (key: string) => {
  const viteKey = `VITE_${key}`;
  const nextKey = `NEXT_PUBLIC_${key}`;
  
  return process?.env?.[viteKey] ?? process?.env?.[nextKey] ?? process?.env?.[key];
};

const SUPABASE_URL = getEnv("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SERVICE_ROLE_KEY");

if (!SUPABASE_URL) console.error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE) console.warn("Missing service role key; DB writes will fail until configured.");

/**
 * Validate incoming Supabase JWT by calling Supabase auth endpoint.
 * Returns user object on success, null on failure.
 */
async function validateSupabaseToken(token: string) {
  if (!token) return null;
  
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`;
  
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: token,
        Accept: "application/json",
      },
    });
    
    if (!resp.ok) return null;
    
    const user = await resp.json();
    return user;
  } catch (err) {
    console.error("Error validating token:", err);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT" && req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });
  
  const authHeader = (req.headers.authorization || "") as string;
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Missing Bearer token" });
  
  const token = authHeader.split(" ")[1];
  const user = await validateSupabaseToken(token);
  
  if (!user || !user.id) return res.status(401).json({ error: "Invalid or expired token" });
  
  const { order_id, status, updated_by } = req.body ?? {};
  
  if (!order_id) {
    return res.status(400).json({ error: "Invalid payload: order_id required" });
  }
  
  if (!SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: "Server not configured: missing service role key" });
  }
  
  // 构建更新数据，只更新提供的字段
  const updatePayload: any = {};
  if (status !== undefined) updatePayload.status = status;
  if (updated_by !== undefined) updatePayload.updated_by = updated_by;
  updatePayload.updated_at = new Date().toISOString();
  
  try {
    const url = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/orders?id=eq.${order_id}`;
    const resp = await fetch(url, {
      method: req.method,
      headers: {
        apikey: SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    });
    
    const data = await resp.json();
    
    if (!resp.ok) {
      console.error("Supabase update failed", resp.status, data);
      return res.status(resp.status).json({ error: "db_update_failed", details: data });
    }
    
    return res.status(200).json(data);
  } catch (err) {
    console.error("update-order error", err);
    return res.status(500).json({ error: "internal_error" });
  }
}