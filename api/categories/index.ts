// api/categories/index.ts - 菜单分类管理API端点
import { db } from '../../src/services/db.server.js';
import { menuCategories as categoriesTable } from '../../drizzle/schema.js';
import { eq, and, ilike } from 'drizzle-orm';
import { authenticateUser, hasPartnerAccess, getUserPartnerId } from '../middleware/auth-middleware.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request: Request) {
  // 认证用户
  const currentUser = await authenticateUser(request);
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing authentication token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // GET /api/categories - 获取分类列表
    if (request.method === 'GET' && pathname === '/api/categories') {
      const parentId = url.searchParams.get('parentId');
      const search = url.searchParams.get('search');
      const currentPartnerId = getUserPartnerId(currentUser);
      
      // 验证用户是否有权访问其partner的分类
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to access categories' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      let conditions: any[] = [eq(categoriesTable.partnerId, currentPartnerId)]; // 强制过滤当前用户的partnerId
      
      if (parentId) {
        conditions.push(eq(categoriesTable.parentId, parentId));
      } else {
        // 如果没有指定parentId，获取顶级分类（parentId为null）
        conditions.push(eq(categoriesTable.level, 1));
      }
      if (search) {
        conditions.push(ilike(categoriesTable.name, `%${search}%`));
      }
      
      const categories = await db.select()
        .from(categoriesTable)
        .where(and(...conditions))
        .orderBy(categoriesTable.displayOrder, categoriesTable.name);
      
      return new Response(JSON.stringify(categories), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/categories - 创建分类
    if (request.method === 'POST' && pathname === '/api/categories') {
      const body = await request.json();
      
      // 验证当前用户权限
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to create categories' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 确保分类关联到当前用户的partnerId
      const newCategory = await db.insert(categoriesTable).values({
        ...body,
        partnerId: currentPartnerId // 强制设置为当前用户的partnerId
      }).returning();
      
      return new Response(JSON.stringify(newCategory[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/categories - 批量保存分类
    if (request.method === 'POST' && pathname === '/api/categories') {
      const body = await request.json();
      
      // 验证当前用户权限
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to update categories' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const { categories } = body;
      
      if (!Array.isArray(categories)) {
        return new Response(JSON.stringify({ error: 'Invalid categories data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 先删除当前用户partner的所有分类
      await db.delete(categoriesTable)
        .where(eq(categoriesTable.partnerId, currentPartnerId));
      
      // 然后批量插入新的分类
      if (categories.length > 0) {
        const categoriesWithPartnerId = categories.map(category => ({
          ...category,
          partnerId: currentPartnerId // 强制设置为当前用户的partnerId
        }));
        
        await db.insert(categoriesTable)
          .values(categoriesWithPartnerId);
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/categories/:id - 更新分类
    if (request.method === 'PUT' && pathname.match(/^\/api\/categories\/.+$/)) {
      const categoryId = pathname.split('/')[3]; // /api/categories/{id}
      
      if (!categoryId) {
        return new Response(JSON.stringify({ error: 'Category ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标分类的partnerId
      const targetCategory = await db.query.menuCategories.findFirst({
        where: eq(categoriesTable.id, categoryId)
      });
      
      if (!targetCategory) {
        return new Response(JSON.stringify({ error: 'Category not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权更新目标分类
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetCategory.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to update this category' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const body = await request.json();
      
      // 只允许更新属于当前用户partnerId的分类
      const updatedCategories = await db.update(categoriesTable)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(
          eq(categoriesTable.id, categoryId),
          eq(categoriesTable.partnerId, currentPartnerId) // 确保只能更新属于当前partner的分类
        ))
        .returning();
      
      if (updatedCategories.length === 0) {
        return new Response(JSON.stringify({ error: 'Category not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(updatedCategories[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // DELETE /api/categories/:id - 删除分类
    if (request.method === 'DELETE' && pathname.match(/^\/api\/categories\/.+$/)) {
      const categoryId = pathname.split('/')[3]; // /api/categories/{id}
      
      if (!categoryId) {
        return new Response(JSON.stringify({ error: 'Category ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标分类的partnerId
      const targetCategory = await db.query.menuCategories.findFirst({
        where: eq(categoriesTable.id, categoryId)
      });
      
      if (!targetCategory) {
        return new Response(JSON.stringify({ error: 'Category not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权删除目标分类
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetCategory.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to delete this category' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 只允许删除属于当前用户partnerId的分类
      const deletedCategories = await db.delete(categoriesTable)
        .where(and(
          eq(categoriesTable.id, categoryId),
          eq(categoriesTable.partnerId, currentPartnerId) // 确保只能删除属于当前partner的分类
        ))
        .returning();
      
      if (deletedCategories.length === 0) {
        return new Response(JSON.stringify({ error: 'Category not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Categories API error:', error);
    return new Response(JSON.stringify({ 
      error: 'API request failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}