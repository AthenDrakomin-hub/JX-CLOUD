// Supabase Edge Function - Better-Auth Integration
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { betterAuth } from "https://esm.sh/better-auth@1.4.15";
import { drizzleAdapter } from "https://esm.sh/better-auth@1.4.15/adapters/drizzle";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get database connection info from environment
const databaseUrl = Deno.env.get("DATABASE_URL");

// Initialize Better-Auth with Drizzle adapter
const auth = betterAuth({
  database: databaseUrl 
    ? drizzleAdapter(databaseUrl, {
        provider: "pg",
      })
    : undefined,
  emailAndPassword: {
    enabled: false, // We're using passkey only
  },
  socialProviders: {},
  secret: Deno.env.get("BETTER_AUTH_SECRET") || "JiangxiJiudianSuperSecret2025Admin",
  origin: Deno.env.get("BETTER_AUTH_URL") || "https://zlbemopcgjohrnyyiwvs.supabase.co",
  advanced: {
    useSecureCookies: true,
    crossOrigin: true
  }
});

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace("/functions/v1/better-auth", "");
  const method = req.method;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Auth-Service": "jx-cloud-better-auth",
  };

  // Handle preflight requests
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Health check endpoint
    if (path === "/health" || path === "/") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "jx-cloud-better-auth",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Let Better-Auth handle the request
    const betterAuthResponse = await auth.handler(req);

    // If Better-Auth handled the request, return its response
    if (betterAuthResponse) {
      return betterAuthResponse;
    }

    // If no response from Better-Auth, return 404
    return new Response(
      JSON.stringify({
        error: "Route not found",
        path: path,
        service: "jx-cloud-better-auth",
      }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Better-Auth error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message,
        service: "jx-cloud-better-auth",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

if (import.meta.main) {
  serve(handler);
};