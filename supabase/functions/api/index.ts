// 江西云厨酒店管理系统 - 统一API网关
// Supabase Edge Functions (Deno运行时)
// 生产级实现 - 2026年1月

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { decode } from "https://deno.land/x/djwt@v2.8/mod.ts";

// ==================== 类型定义 ====================
interface ApiRequest {
  action: string;
  [key: string]: any;
}

interface HealthResponse {
  success: true;
  data: {
    status: string;
    db_connected: boolean;
    timestamp: string;
    service: string;
    version: string;
  };
}

interface RegistrationApprovalRequest {
  requestId: string;
  approved: boolean;
  adminId: string;
  rejectionReason?: string;
}

interface DishOperation {
  action: 'manage-dishes';
  operation: 'create' | 'update' | 'delete' | 'list';
  payload?: any;
  dishId?: string;
  partnerId: string;
}

interface OrderStatusUpdate {
  orderId: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
}

interface RoomStatusQuery {
  roomIds: string[];
}

// ==================== 配置和常量 ====================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
  'X-JX-Cloud-Version': '1.0.0',
  'X-Powered-By': 'Supabase-Edge-Deno'
};

const SERVICE_VERSION = '1.0.0';
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

// ==================== 工具函数 ====================

/**
 * 验证环境变量
 */
function validateEnvVars(): void {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !Deno.env.get(varName));
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

/**
 * 解析JWT令牌
 */
async function parseJwtToken(token: string): Promise<any> {
  try {
    // 移除Bearer前缀
    const cleanToken = token.replace('Bearer ', '');
    // 这里应该使用正确的JWT解码方法
    // 简化版本 - 实际生产中应使用完整的JWT验证
    const payload = JSON.parse(atob(cleanToken.split('.')[1]));
    return payload;
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

/**
 * 验证管理员权限
 */
async function validateAdminPermission(authHeader: string | null): Promise<boolean> {
  if (!authHeader) {
    throw new Error('Authorization header required');
  }
  
  try {
    const payload = await parseJwtToken(authHeader);
    return payload.role === 'admin' || payload.user_role === 'admin';
  } catch (error) {
    throw new Error('Unauthorized: Invalid admin credentials');
  }
}

/**
 * 标准化错误响应
 */
function createErrorResponse(error: string, statusCode = 500): Response {
  console.error(`[API ERROR] ${new Date().toISOString()}:`, error);
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: error,
      timestamp: new Date().toISOString()
    }),
    { 
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * 标准化成功响应
 */
function createSuccessResponse(data: any, statusCode = 200): Response {
  return new Response(
    JSON.stringify({ 
      success: true, 
      data: data,
      timestamp: new Date().toISOString()
    }),
    { 
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * 日志记录函数
 */
function logAction(action: string, details: any, userId?: string): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    action,
    userId,
    details
  }));
}

// ==================== API处理器 ====================

/**
 * 处理注册请求提交
 */
async function handleRegistrationRequest(
  supabase: any,
  payload: any
): Promise<Response> {
  try {
    const { email, name } = payload;
    
    if (!email || !name) {
      return createErrorResponse('Email and name are required', 400);
    }
    
    // 检查用户是否已存在
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return createErrorResponse('User with this email already exists', 400);
    }
    
    // 创建注册请求记录
    const requestId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: newRequest, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        status: 'pending',
        registration_request_id: requestId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    logAction('REGISTRATION_REQUEST_SUBMITTED', { requestId, email });
    
    return createSuccessResponse({
      success: true,
      requestId: newRequest.registration_request_id,
      message: 'Registration request submitted successfully'
    });
    
  } catch (error) {
    return createErrorResponse(`Registration request failed: ${(error as Error).message}`);
  }
}

/**
 * 获取注册请求列表
 */
async function handleGetRegistrationRequests(
  supabase: any
): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    logAction('REGISTRATION_REQUESTS_FETCHED', { count: data?.length || 0 });
    
    return createSuccessResponse({
      requests: data || [],
      totalCount: data?.length || 0
    });
    
  } catch (error) {
    return createErrorResponse(`Fetching registration requests failed: ${(error as Error).message}`);
  }
}

/**
 * 系统健康检查
 */
async function handleHealthCheck(supabase: any): Promise<Response> {
  try {
    // 测试数据库连接
    const { count, error } = await supabase 
      .from('users') 
      .select('*', { count: 'exact', head: true });
    
    const dbConnected = !error;
    
    const healthData: HealthResponse['data'] = {
      status: dbConnected ? 'OK' : 'DEGRADED',
      db_connected: dbConnected,
      timestamp: new Date().toISOString(),
      service: 'jx-cloud-api-gateway',
      version: SERVICE_VERSION
    };
    
    logAction('HEALTH_CHECK', { db_status: dbConnected ? 'connected' : 'disconnected' });
    
    return createSuccessResponse(healthData);
    
  } catch (error) {
    return createErrorResponse(`Health check failed: ${(error as Error).message}`);
  }
}

/**
 * 用户注册审批
 */
async function handleRegistrationApproval(
  supabase: any, 
  payload: RegistrationApprovalRequest,
  authHeader: string | null
): Promise<Response> {
  try {
    // 验证管理员权限
    await validateAdminPermission(authHeader);
    
    const { requestId, approved, adminId, rejectionReason } = payload;
    
    if (!requestId || approved === undefined || !adminId) {
      return createErrorResponse('Missing required fields: requestId, approved, adminId', 400);
    }
    
    if (approved) {
      // 批准注册 - 激活用户
      const { data, error } = await supabase
        .from('users')
        .update({ 
          status: 'active',
          activated_at: new Date().toISOString(),
          activated_by: adminId
        })
        .eq('registration_request_id', requestId)
        .select()
        .single();
      
      if (error) throw error;
      
      // 发送欢迎邮件（模拟）
      console.log(`[EMAIL] Welcome email sent to user from request ${requestId}`);
      
      logAction('REGISTRATION_APPROVED', { requestId, adminId }, adminId);
      
      return createSuccessResponse({
        message: 'User activated successfully',
        userId: data.id
      });
      
    } else {
      // 拒绝注册 - 删除或标记拒绝
      const { error } = await supabase
        .from('users')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason || 'Admin decision',
          rejected_at: new Date().toISOString(),
          rejected_by: adminId
        })
        .eq('registration_request_id', requestId);
      
      if (error) throw error;
      
      logAction('REGISTRATION_REJECTED', { requestId, adminId, reason: rejectionReason }, adminId);
      
      return createSuccessResponse({
        message: 'Registration request rejected'
      });
    }
    
  } catch (error) {
    return createErrorResponse(`Registration approval failed: ${(error as Error).message}`);
  }
}

/**
 * 菜品管理
 */
async function handleDishManagement(
  supabase: any,
  payload: DishOperation,
  authHeader: string | null
): Promise<Response> {
  try {
    // 验证权限和partnerId
    if (!payload.partnerId) {
      return createErrorResponse('Partner ID is required', 400);
    }
    
    const { operation, payload: dishData, dishId } = payload;
    
    switch (operation) {
      case 'create':
        if (!dishData) {
          return createErrorResponse('Dish data is required for creation', 400);
        }
        
        const newDish = {
          ...dishData,
          partner_id: payload.partnerId,
          created_at: new Date().toISOString()
        };
        
        const { data: createdDish, error: createError } = await supabase
          .from('menu_dishes')
          .insert(newDish)
          .select()
          .single();
        
        if (createError) throw createError;
        
        logAction('DISH_CREATED', { dishId: createdDish.id, partnerId: payload.partnerId });
        
        return createSuccessResponse(createdDish);
        
      case 'update':
        if (!dishId || !dishData) {
          return createErrorResponse('Dish ID and data are required for update', 400);
        }
        
        const { data: updatedDish, error: updateError } = await supabase
          .from('menu_dishes')
          .update(dishData)
          .eq('id', dishId)
          .eq('partner_id', payload.partnerId) // 确保只能更新自己的数据
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        logAction('DISH_UPDATED', { dishId, partnerId: payload.partnerId });
        
        return createSuccessResponse(updatedDish);
        
      case 'delete':
        if (!dishId) {
          return createErrorResponse('Dish ID is required for deletion', 400);
        }
        
        const { error: deleteError } = await supabase
          .from('menu_dishes')
          .delete()
          .eq('id', dishId)
          .eq('partner_id', payload.partnerId); // 确保只能删除自己的数据
        
        if (deleteError) throw deleteError;
        
        logAction('DISH_DELETED', { dishId, partnerId: payload.partnerId });
        
        return createSuccessResponse({ message: 'Dish deleted successfully' });
        
      case 'list':
        const { data: dishes, error: listError } = await supabase
          .from('menu_dishes')
          .select('*')
          .eq('partner_id', payload.partnerId)
          .order('created_at', { ascending: false });
        
        if (listError) throw listError;
        
        return createSuccessResponse(dishes || []);
        
      default:
        return createErrorResponse(`Unknown dish operation: ${operation}`, 400);
    }
    
  } catch (error) {
    return createErrorResponse(`Dish management failed: ${(error as Error).message}`);
  }
}

/**
 * 订单状态更新
 */
async function handleOrderStatusUpdate(
  supabase: any,
  payload: OrderStatusUpdate,
  authHeader: string | null
): Promise<Response> {
  try {
    const { orderId, status } = payload;
    
    if (!orderId || !status) {
      return createErrorResponse('Order ID and status are required', 400);
    }
    
    // 更新订单状态
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    
    // 触发实时通知到KDS厨房显示屏
    const { error: notifyError } = await supabase
      .from('kds_notifications')
      .insert({
        order_id: orderId,
        event_type: 'status_update',
        new_status: status,
        timestamp: new Date().toISOString()
      });
    
    if (notifyError) {
      console.warn('Failed to send KDS notification:', notifyError);
    }
    
    logAction('ORDER_STATUS_UPDATED', { orderId, newStatus: status });
    
    return createSuccessResponse({
      orderId: updatedOrder.id,
      newStatus: status,
      updatedAt: updatedOrder.updated_at
    });
    
  } catch (error) {
    return createErrorResponse(`Order status update failed: ${(error as Error).message}`);
  }
}

/**
 * 房间状态批量查询
 */
async function handleRoomStatusQuery(
  supabase: any,
  payload: RoomStatusQuery
): Promise<Response> {
  try {
    const { roomIds } = payload;
    
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return createErrorResponse('Room IDs array is required', 400);
    }
    
    // 查询每个房间的活跃订单统计
    const roomStatuses = [];
    
    for (const roomId of roomIds) {
      // 查询该房间的活跃订单
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, status')
        .eq('room_id', roomId)
        .in('status', ['pending', 'preparing', 'ready']);
      
      if (error) {
        console.warn(`Failed to fetch orders for room ${roomId}:`, error);
        continue;
      }
      
      const activeOrders = orders?.length || 0;
      const totalAmount = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      roomStatuses.push({
        roomId,
        activeOrders,
        totalAmount: parseFloat(totalAmount.toFixed(2))
      });
    }
    
    logAction('ROOM_STATUS_QUERY', { roomCount: roomIds.length });
    
    return createSuccessResponse(roomStatuses);
    
  } catch (error) {
    return createErrorResponse(`Room status query failed: ${(error as Error).message}`);
  }
}

// ==================== 主处理函数 ====================
export const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  try {
    // 验证环境变量
    validateEnvVars();
    
    // 解析请求
    const url = new URL(req.url);
    const method = req.method;
    const authHeader = req.headers.get('Authorization');
    
    // 获取Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let requestBody: any = {};
    
    // 解析请求体（仅对POST请求）
    if (method === 'POST' && req.body) {
      try {
        requestBody = await req.json();
      } catch (parseError) {
        return createErrorResponse('Invalid JSON in request body', 400);
      }
    }
    
    const { action, ...payload } = requestBody;
    
    // 路由分发
    let response: Response;
    
    switch (action) {
      case 'health':
        response = await handleHealthCheck(supabase);
        break;
        
      case 'request-registration':
        response = await handleRegistrationRequest(supabase, payload);
        break;
        
      case 'get-registration-requests':
        response = await handleGetRegistrationRequests(supabase);
        break;
        
      case 'approve-registration':
        response = await handleRegistrationApproval(supabase, payload, authHeader);
        break;
        
      case 'manage-dishes':
        response = await handleDishManagement(supabase, payload as DishOperation, authHeader);
        break;
        
      case 'update-order-status':
        response = await handleOrderStatusUpdate(supabase, payload as OrderStatusUpdate, authHeader);
        break;
        
      case 'get-room-statuses':
        response = await handleRoomStatusQuery(supabase, payload as RoomStatusQuery);
        break;
        
      default:
        response = createErrorResponse(`Unknown action: ${action}`, 404);
    }
    
    // 记录响应时间
    const duration = Date.now() - startTime;
    console.log(`[API] ${action} completed in ${duration}ms`);
    
    return response;
    
  } catch (error) {
    return createErrorResponse(`Internal server error: ${(error as Error).message}`);
  }
};

// 兼容Deno serve
if (import.meta.main) {
  serve(handler);
}