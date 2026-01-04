// /api/edge/get-dishes.ts
export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE URL or ANON KEY env vars");
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Replace * with your domain for production
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Example: fetch dishes (public read)
    const url = `${SUPABASE_URL}/rest/v1/dishes?select=id,name,name_en,price,is_available,category,image_url&order=created_at.desc`;
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });

    const data = await resp.text(); // forward raw body
    const headers = {
      "Content-Type": resp.headers.get("content-type") || "application/json",
      ...CORS_HEADERS,
    };
    return new Response(data, { status: resp.status, headers });
  } catch (err) {
    console.error("Edge function error", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}

export default handler;