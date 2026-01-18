// api/users/joined.ts - 获取认证表和业务表的联合数据
import { db } from '../../src/services/db.server.js';
import { user as authUser, users as businessUsers } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

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
    // 使用LEFT JOIN查询认证表和业务表的联合数据
    const joinedUsers = await db.select({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      role: authUser.role,
      partnerId: authUser.partnerId,
      createdAt: authUser.createdAt,
      updatedAt: authUser.updatedAt,
      username: businessUsers.username,
      authType: businessUsers.authType,
      isActive: businessUsers.isActive,
      isPasskeyBound: businessUsers.isPasskeyBound
    })
    .from(authUser)
    .leftJoin(businessUsers, eq(authUser.id, businessUsers.id));

    return new Response(JSON.stringify(joinedUsers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error fetching joined users:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch users',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}