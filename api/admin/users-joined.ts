import { db } from '../../src/services/db.server.js';
import { user as authUser, users as businessUsers } from '../../drizzle/schema.js';
import { eq, and, asc } from 'drizzle-orm';
// @ts-ignore
import { auth } from '../auth/[...betterAuth].js';

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

  let session: any = null;
  try {
    // @ts-ignore - Better Auth type recursion is too deep for TS to track
    const sessionResponse = (await auth.api.getSession({
      headers: req.headers,
      request: req,
    })) as any;
    session = sessionResponse;
  } catch (error) {
    console.error('Session verification failed:', error);
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid session' }), 
      { status: 401, headers: corsHeaders }
    );
  }

  // 验证管理员权限
  if (!session || !session.user || session.user.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Admin access required' }), 
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    // 获取联合查询的用户数据
    if (req.method === 'GET') {
      const result = await db
        .select({
          // 认证表字段
          authId: authUser.id,
          authEmail: authUser.email,
          authName: authUser.name,
          authImage: authUser.image,
          authRole: authUser.role,
          authPartnerId: authUser.partnerId,
          authEmailVerified: authUser.emailVerified,
          authCreatedAt: authUser.createdAt,
          authUpdatedAt: authUser.updatedAt,
          // 业务表字段
          businessId: businessUsers.id,
          businessUsername: businessUsers.username,
          businessEmail: businessUsers.email,
          businessName: businessUsers.name,
          businessRole: businessUsers.role,
          businessPartnerId: businessUsers.partnerId,
          businessAuthType: businessUsers.authType,
          businessEmailVerified: businessUsers.emailVerified,
          businessIsActive: businessUsers.isActive,
          businessModulePermissions: businessUsers.modulePermissions,
          businessCreatedAt: businessUsers.createdAt,
          businessUpdatedAt: businessUsers.updatedAt
        })
        .from(authUser)
        .leftJoin(businessUsers, eq(authUser.id, businessUsers.id))
        .where(eq(authUser.partnerId, session.user.partnerId))
        .orderBy(asc(authUser.createdAt));

      const users = result.map(row => ({
        id: row.businessId || row.authId,
        email: row.businessEmail || row.authEmail,
        username: row.businessUsername || row.authEmail.split('@')[0],
        name: row.businessName || row.authName,
        role: row.businessRole || row.authRole || 'user',
        partnerId: row.businessPartnerId || row.authPartnerId,
        emailVerified: row.businessEmailVerified || row.authEmailVerified,
        isActive: row.businessIsActive ?? true,
        modulePermissions: row.businessModulePermissions,
        authType: row.businessAuthType,
        createdAt: row.businessCreatedAt || row.authCreatedAt,
        updatedAt: row.businessUpdatedAt || row.authUpdatedAt,
        image: row.authImage
      }));

      return new Response(
        JSON.stringify({ users }), 
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }), 
      { status: 404, headers: corsHeaders }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
    
    return new Response(
      JSON.stringify({ 
        error: 'Server Error', 
        details: errorMessage,
        code: errorCode
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
}