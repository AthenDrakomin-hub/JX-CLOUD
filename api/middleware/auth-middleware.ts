// api/middleware/auth-middleware.ts
import { db } from '../../src/services/db.server.js';
import { user as authUser } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// 从Authorization头部提取并验证JWT token
export async function authenticateUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // 在实际实现中，这里应该使用Better Auth的服务器端验证功能
  // 目前模拟验证过程，实际部署时需要替换为真实实现
  try {
    // 这里应该是Better Auth的验证逻辑
    // const session = await auth.verifyToken(token);
    // return session?.user;
    
    // 模拟验证逻辑，实际应使用Better Auth的服务器端API
    // 从token中提取用户信息
    // 对于原型目的，我们暂时返回一个模拟用户
    // 在实际应用中，需要通过Better Auth的API来验证token
    
    // 假设前端传递了用户信息作为查询参数或请求体的一部分
    // 在实际应用中，需要从JWT token解码用户信息
    const url = new URL(request.url);
    const mockUserId = url.searchParams.get('mockUserId'); // 仅用于演示
    
    if (mockUserId) {
      const user = await db.query.user.findFirst({
        where: eq(authUser.id, mockUserId)
      });
      
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// 验证用户是否有权访问特定partner的数据
export function hasPartnerAccess(currentUser: any, targetPartnerId: string | null) {
  if (!currentUser) {
    return false;
  }
  
  // 管理员可以访问所有数据
  if (currentUser.role === 'admin') {
    return true;
  }
  
  // 用户只能访问自己partner的数据
  return currentUser.partnerId === targetPartnerId;
}

// 获取当前用户的partnerId
export function getUserPartnerId(user: any) {
  return user?.partnerId;
}