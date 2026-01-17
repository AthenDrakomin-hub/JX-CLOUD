import { db } from '../../src/services/db.server.js';
import { user, users as businessUsers } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

export const config = {
  runtime: 'nodejs',
};

// 生产级响应头
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Node': 'Edge-V5'
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const rootEmail = 'athendrakomin@proton.me';
    const rootUsername = 'AthenDrakomin';
    const rootName = '系统总监';
    
    // Check if root admin already exists
    const existingUser = await db.select().from(user).where(eq(user.email, rootEmail));
    const existingBusinessUser = await db.select().from(businessUsers).where(eq(businessUsers.email, rootEmail));
    
    let userId = '';
    
    // Create or update the Better Auth user table
    if (existingUser.length > 0) {
      // Update existing user
      await db.update(user).set({
        role: 'admin',
        name: rootName,
        updatedAt: new Date()
      }).where(eq(user.email, rootEmail));
      
      userId = existingUser[0].id;
    } else {
      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: rootName,
        email: rootEmail,
        emailVerified: true,
        image: null,
        role: 'admin',
        partnerId: null,
        modulePermissions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertedUsers = await db.insert(user).values(newUser).returning();
      userId = insertedUsers[0].id;
    }
    
    // Create or update the business users table
    if (existingBusinessUser.length > 0) {
      // Update existing business user
      await db.update(businessUsers).set({
        role: 'admin',
        name: rootName,
        username: rootUsername,
        updatedAt: new Date()
      }).where(eq(businessUsers.email, rootEmail));
    } else {
      // Create new business user
      const newBusinessUser = {
        id: `business_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: rootUsername,
        email: rootEmail,
        name: rootName,
        role: 'admin',
        partnerId: null,
        modulePermissions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(businessUsers).values(newBusinessUser);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Root admin user initialized successfully',
        userId: userId
      }), 
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error initializing root admin:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize root admin user' }), 
      { status: 500, headers: corsHeaders }
    );
  }
}