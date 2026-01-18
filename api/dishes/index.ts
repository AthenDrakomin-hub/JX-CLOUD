// api/dishes/index.ts - 菜品管理API端点
import { db } from '../../src/services/db.server.js';
import { menuDishes as dishesTable, menuCategories } from '../../drizzle/schema.js';
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
    // GET /api/dishes - 获取菜品列表
    if (request.method === 'GET' && pathname === '/api/dishes') {
      const categoryId = url.searchParams.get('categoryId');
      const search = url.searchParams.get('search');
      const currentPartnerId = getUserPartnerId(currentUser);
      
      // 验证用户是否有权访问其partner的菜品
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to access dishes' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      let conditions: any[] = [eq(dishesTable.partnerId, currentPartnerId)]; // 强制过滤当前用户的partnerId
      
      if (categoryId) {
        conditions.push(eq(dishesTable.categoryId, categoryId));
      }
      if (search) {
        conditions.push(ilike(dishesTable.name, `%${search}%`));
      }
      
      const dishes = await db.select()
        .from(dishesTable)
        .leftJoin(menuCategories, eq(dishesTable.categoryId, menuCategories.id))
        .where(and(...conditions));
      
      return new Response(JSON.stringify(dishes), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/dishes - 创建菜品
    if (request.method === 'POST' && pathname === '/api/dishes') {
      const body = await request.json();
      
      // 验证当前用户权限
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to create dishes' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 确保菜品关联到当前用户的partnerId
      const newDish = await db.insert(dishesTable).values({
        ...body,
        partnerId: currentPartnerId // 强制设置为当前用户的partnerId
      }).returning();
      
      return new Response(JSON.stringify(newDish[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/dishes/:id - 更新菜品
    if (request.method === 'PUT' && pathname.match(/^\/api\/dishes\/.+$/)) {
      const dishId = pathname.split('/')[3]; // /api/dishes/{id}
      
      if (!dishId) {
        return new Response(JSON.stringify({ error: 'Dish ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标菜品的partnerId
      const targetDish = await db.query.menuDishes.findFirst({
        where: eq(dishesTable.id, dishId)
      });
      
      if (!targetDish) {
        return new Response(JSON.stringify({ error: 'Dish not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权更新目标菜品
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetDish.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to update this dish' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const body = await request.json();
      
      // 只允许更新属于当前用户partnerId的菜品
      const updatedDishes = await db.update(dishesTable)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(
          eq(dishesTable.id, dishId),
          eq(dishesTable.partnerId, currentPartnerId) // 确保只能更新属于当前partner的菜品
        ))
        .returning();
      
      if (updatedDishes.length === 0) {
        return new Response(JSON.stringify({ error: 'Dish not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(updatedDishes[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // DELETE /api/dishes/:id - 删除菜品
    if (request.method === 'DELETE' && pathname.match(/^\/api\/dishes\/.+$/)) {
      const dishId = pathname.split('/')[3]; // /api/dishes/{id}
      
      if (!dishId) {
        return new Response(JSON.stringify({ error: 'Dish ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标菜品的partnerId
      const targetDish = await db.query.menuDishes.findFirst({
        where: eq(dishesTable.id, dishId)
      });
      
      if (!targetDish) {
        return new Response(JSON.stringify({ error: 'Dish not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权删除目标菜品
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetDish.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to delete this dish' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 只允许删除属于当前用户partnerId的菜品
      const deletedDishes = await db.delete(dishesTable)
        .where(and(
          eq(dishesTable.id, dishId),
          eq(dishesTable.partnerId, currentPartnerId) // 确保只能删除属于当前partner的菜品
        ))
        .returning();
      
      if (deletedDishes.length === 0) {
        return new Response(JSON.stringify({ error: 'Dish not found or unauthorized' }), {
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
    console.error('Dishes API error:', error);
    return new Response(JSON.stringify({ 
      error: 'API request failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}