// api/orders/index.ts - 订单管理API端点
import { db } from '../../src/services/db.server.js';
import { orders as ordersTable, menuDishes } from '../../drizzle/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
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
    // GET /api/orders - 获取订单列表
    if (request.method === 'GET' && pathname === '/api/orders') {
      const status = url.searchParams.get('status');
      const roomNumber = url.searchParams.get('roomNumber');
      const currentPartnerId = getUserPartnerId(currentUser);
      
      // 验证用户是否有权访问其partner的订单
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to access orders' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      let conditions: any[] = [eq(ordersTable.partnerId, currentPartnerId)]; // 强制过滤当前用户的partnerId
      
      if (status) {
        conditions.push(eq(ordersTable.status, status));
      }
      if (roomNumber) {
        conditions.push(eq(ordersTable.tableId, roomNumber));
      }
      
      const orders = await db.select()
        .from(ordersTable)
        .where(and(...conditions))
        .orderBy(ordersTable.createdAt);
      
      return new Response(JSON.stringify(orders), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/orders - 创建订单
    if (request.method === 'POST' && pathname === '/api/orders') {
      const body = await request.json();
      
      // 验证当前用户权限
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to create orders' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 确保订单关联到当前用户的partnerId
      const newOrder = await db.insert(ordersTable).values({
        ...body,
        partnerId: currentPartnerId // 强制设置为当前用户的partnerId
      }).returning();
      
      return new Response(JSON.stringify(newOrder[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/orders/:id - 更新订单
    if (request.method === 'PUT' && pathname.match(/^\/api\/orders\/.+$/)) {
      const orderId = pathname.split('/')[3]; // /api/orders/{id}
      
      if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标订单的partnerId
      const targetOrder = await db.query.orders.findFirst({
        where: eq(ordersTable.id, orderId)
      });
      
      if (!targetOrder) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权更新目标订单
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetOrder.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to update this order' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const body = await request.json();
      
      // 只允许更新属于当前用户partnerId的订单
      const updatedOrders = await db.update(ordersTable)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.partnerId, currentPartnerId) // 确保只能更新属于当前partner的订单
        ))
        .returning();
      
      if (updatedOrders.length === 0) {
        return new Response(JSON.stringify({ error: 'Order not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(updatedOrders[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/orders/:id/status - 更新订单状态
    if (request.method === 'PUT' && pathname.match(/^\/api\/orders\/.+\/status$/)) {
      const orderId = pathname.split('/')[3]; // /api/orders/{id}/status
      
      if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标订单的partnerId
      const targetOrder = await db.query.orders.findFirst({
        where: eq(ordersTable.id, orderId)
      });
      
      if (!targetOrder) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权更新目标订单状态
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetOrder.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to update this order status' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const body = await request.json();
      const { status } = body;
      
      if (!status) {
        return new Response(JSON.stringify({ error: 'Status is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 只允许更新属于当前用户partnerId的订单状态
      const updatedOrders = await db.update(ordersTable)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.partnerId, currentPartnerId) // 确保只能更新属于当前partner的订单
        ))
        .returning();
      
      if (updatedOrders.length === 0) {
        return new Response(JSON.stringify({ error: 'Order not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(updatedOrders[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // DELETE /api/orders/:id - 删除订单
    if (request.method === 'DELETE' && pathname.match(/^\/api\/orders\/.+$/)) {
      const orderId = pathname.split('/')[3]; // /api/orders/{id}
      
      if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标订单的partnerId
      const targetOrder = await db.query.orders.findFirst({
        where: eq(ordersTable.id, orderId)
      });
      
      if (!targetOrder) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权删除目标订单
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetOrder.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to delete this order' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 只允许删除属于当前用户partnerId的订单
      const deletedOrders = await db.delete(ordersTable)
        .where(and(
          eq(ordersTable.id, orderId),
          eq(ordersTable.partnerId, currentPartnerId) // 确保只能删除属于当前partner的订单
        ))
        .returning();
      
      if (deletedOrders.length === 0) {
        return new Response(JSON.stringify({ error: 'Order not found or unauthorized' }), {
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
    console.error('Orders API error:', error);
    return new Response(JSON.stringify({ 
      error: 'API request failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}