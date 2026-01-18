// api/expenses/index.ts - 费用管理API端点
import { db } from '../../src/services/db.server.js';
import { expenses as expensesTable } from '../../drizzle/schema.js';
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
    // GET /api/expenses - 获取费用列表
    if (request.method === 'GET' && pathname === '/api/expenses') {
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const currentPartnerId = getUserPartnerId(currentUser);
      
      // 验证用户是否有权访问其partner的费用
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to access expenses' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      let conditions: any[] = [eq(expensesTable.partnerId, currentPartnerId)]; // 强制过滤当前用户的partnerId
      
      if (startDate) {
        conditions.push(gte(expensesTable.date, new Date(startDate)));
      }
      if (endDate) {
        conditions.push(lte(expensesTable.date, new Date(endDate)));
      }
      
      const expenses = await db.select()
        .from(expensesTable)
        .where(and(...conditions))
        .orderBy(expensesTable.date.desc());
      
      return new Response(JSON.stringify(expenses), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST /api/expenses - 创建费用
    if (request.method === 'POST' && pathname === '/api/expenses') {
      const body = await request.json();
      
      // 验证当前用户权限
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, currentPartnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to create expenses' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 确保费用关联到当前用户的partnerId
      const newExpense = await db.insert(expensesTable).values({
        ...body,
        partnerId: currentPartnerId // 强制设置为当前用户的partnerId
      }).returning();
      
      return new Response(JSON.stringify(newExpense[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // PUT /api/expenses/:id - 更新费用 (新增端点)
    if (request.method === 'PUT' && pathname.match(/^\/api\/expenses\/.+$/)) {
      const expenseId = pathname.split('/')[3]; // /api/expenses/{id}
      
      if (!expenseId) {
        return new Response(JSON.stringify({ error: 'Expense ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标费用的partnerId
      const targetExpense = await db.query.expenses.findFirst({
        where: eq(expensesTable.id, expenseId)
      });
      
      if (!targetExpense) {
        return new Response(JSON.stringify({ error: 'Expense not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权更新目标费用
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetExpense.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to update this expense' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const body = await request.json();
      
      // 只允许更新属于当前用户partnerId的费用
      const updatedExpenses = await db.update(expensesTable)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(
          eq(expensesTable.id, expenseId),
          eq(expensesTable.partnerId, currentPartnerId) // 确保只能更新属于当前partner的费用
        ))
        .returning();
      
      if (updatedExpenses.length === 0) {
        return new Response(JSON.stringify({ error: 'Expense not found or unauthorized' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(updatedExpenses[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // DELETE /api/expenses/:id - 删除费用
    if (request.method === 'DELETE' && pathname.match(/^\/api\/expenses\/.+$/)) {
      const expenseId = pathname.split('/')[3]; // /api/expenses/{id}
      
      if (!expenseId) {
        return new Response(JSON.stringify({ error: 'Expense ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取目标费用的partnerId
      const targetExpense = await db.query.expenses.findFirst({
        where: eq(expensesTable.id, expenseId)
      });
      
      if (!targetExpense) {
        return new Response(JSON.stringify({ error: 'Expense not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 验证用户是否有权删除目标费用
      const currentPartnerId = getUserPartnerId(currentUser);
      if (!hasPartnerAccess(currentUser, targetExpense.partnerId)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to delete this expense' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 只允许删除属于当前用户partnerId的费用
      const deletedExpenses = await db.delete(expensesTable)
        .where(and(
          eq(expensesTable.id, expenseId),
          eq(expensesTable.partnerId, currentPartnerId) // 确保只能删除属于当前partner的费用
        ))
        .returning();
      
      if (deletedExpenses.length === 0) {
        return new Response(JSON.stringify({ error: 'Expense not found or unauthorized' }), {
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
    console.error('Expenses API error:', error);
    return new Response(JSON.stringify({ 
      error: 'API request failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}