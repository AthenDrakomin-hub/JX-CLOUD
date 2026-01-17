import { db } from '../src/services/db.server.js';
import { users } from '../drizzle/schema.js';
import { sql } from 'drizzle-orm';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  // Quick health check without complex operations
  try {
    // Simple ping to check if we can reach the database
    const startTime = Date.now();
    
    // Just do a quick connection test
    const result = await db.execute(sql`SELECT 1 as test`);
    
    const responseTime = Date.now() - startTime;
    
    // Check if we can query the users table (lightweight)
    let userCount = 0;
    try {
      const countResult = await db.select({ count: sql`COUNT(*)` }).from(users);
      userCount = parseInt(String(countResult[0]?.count || '0'));
    } catch (countError) {
      console.warn('Warning: Could not count users:', countError);
      // Continue anyway, just report 0 users
    }

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        response_time_ms: responseTime,
        user_count: userCount,
        details: {
          database_connection: 'success',
          query_execution: 'success'
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Health-Check': 'Passed'
        } 
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        details: {
          database_connection: 'failed'
        }
      }),
      { 
        status: 503, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
}