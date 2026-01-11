// api/custom-jwt-claims/route.ts
// Custom JWT Claims Edge Function for Supabase Auth

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-supabase-signature, x-hook-signature',
      }
    });
  }

  try {
    // Get the payload from the request body
    const payload = await req.json();
    
    // Extract user data from the payload (standard Supabase Auth hook format)
    const { event, user } = payload;
    
    // If this is not a user creation/update event, return early
    if (!event || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing event or user data' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Determine the claims to add to the JWT
    let customClaims = {};

    // Get user role from the users table (assuming it exists)
    // In a real implementation, you would query the database for user roles
    // For now, we'll simulate getting the role from a database lookup
    if (user.id) {
      // This would normally be a database call to get the user's role from public.users table
      // For simulation purposes, we'll check if user exists in a mock lookup
      // In the actual deployed function, this would use the service role to query the database
      
      // Placeholder for role lookup logic
      // const dbUser = await getUserRoleFromDB(user.id);
      // const role = dbUser?.role || 'viewer';
      
      // For now, simulate getting the role from the user's app metadata or a lookup
      // Since the actual DB lookup happens in the deployed function, we'll just return basic claims
      customClaims = {
        'https://hasura.io/jwt/claims': {
          'x-hasura-default-role': 'viewer',
          'x-hasura-allowed-roles': ['viewer'],
          // In the actual deployed function, this would be populated from DB
          'x-hasura-user-id': user.id,
        },
        // Additional custom claims would be added here
      };
    }

    // Return the custom claims
    return new Response(
      JSON.stringify({ 
        claims: customClaims 
      }), 
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error: any) {
    console.error('Custom JWT Claims function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}