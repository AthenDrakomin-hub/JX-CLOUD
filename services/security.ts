/**
 * JX Cloud 酒店管理系统 - 安全工具函数
 * 包含数据加密、安全验证、风险评估等安全相关函数
 */

import { User, SecurityLog, Order, Dish, Expense } from '../types';

// 密码安全函数
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需包含大写字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码需包含小写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码需包含数字');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码需包含特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const hashPassword = async (password: string): Promise<string> => {
  // 在实际应用中，应该使用适当的哈希算法如bcrypt
  // 这里使用简单的哈希作为示例
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 用户会话安全函数
export const generateSessionToken = (): string => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const validateSessionToken = (token: string): boolean => {
  // 验证会话token的格式和有效性
  return typeof token === 'string' && token.length === 64 && /^[0-9a-f]+$/i.test(token);
};

// 数据安全函数
export const sanitizeInput = (input: string): string => {
  // 防止XSS攻击的输入清理
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const validateInputLength = (input: string, maxLength: number): boolean => {
  return input.length <= maxLength;
};

// 风险评估函数
export const assessSecurityRisk = (action: string, user: User | null): 'Low' | 'Medium' | 'High' => {
  if (!user) return 'High'; // 未认证用户操作风险高
  
  // 根据操作类型和用户权限评估风险
  const highRiskActions = [
    'Staff Profile Modified',
    'Staff Registered', 
    'Staff Deleted',
    'Menu Item Deleted',
    'Order Revoked',
    'System Settings Changed'
  ];
  
  const mediumRiskActions = [
    'Menu Item Added',
    'Menu Item Updated'
  ];
  
  if (highRiskActions.includes(action)) return 'High';
  if (mediumRiskActions.includes(action)) return 'Medium';
  
  // 管理员操作通常风险较高
  if (user.role === 'admin') {
    // 管理员执行高权限操作
    if (action.includes('manage') || action.includes('config') || action.includes('system')) {
      return 'Medium';
    }
  }
  
  return 'Low';
};

// 安全日志处理函数
export const createSecurityLog = (
  userId: string, 
  action: string, 
  details?: string,
  ip?: string,
  location?: string
): SecurityLog => {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    action,
    details,
    timestamp: new Date().toISOString(),
    ip: ip || 'Unknown',
    location: location || 'Unknown',
    riskLevel: assessSecurityRisk(action, null) // 在实际使用中应该传入用户信息
  };
};

// 权限验证函数
export const checkUserPermission = (user: User, requiredPermission: string): boolean => {
  return user.permissions.includes(requiredPermission as any);
};

export const checkUserRole = (user: User, requiredRole: string): boolean => {
  if (requiredRole === 'admin') {
    return user.role === 'admin';
  }
  if (requiredRole === 'manager') {
    return user.role === 'admin' || user.role === 'manager';
  }
  // staff role is the lowest, everyone has access
  return true;
};

// 敏感数据处理函数
export const maskSensitiveData = (data: string, type: 'phone' | 'email' | 'id' | 'card'): string => {
  switch (type) {
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    case 'email':
      const [local, domain] = data.split('@');
      if (!local || !domain) return data;
      const maskedLocal = local.length > 2 ? 
        local.substring(0, 1) + '*'.repeat(Math.max(0, local.length - 2)) + local.substring(local.length - 1) : 
        local;
      return `${maskedLocal}@${domain}`;
    case 'id':
      return data.replace(/^(.{2}).*(.{2})$/, '$1**$2');
    case 'card':
      return data.replace(/(\d{4})\d+(\d{4})/, '$1****$2');
    default:
      return data;
  }
};

// 数据验证函数
export const validateUserData = (userData: Partial<User>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (userData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(userData.username)) {
    errors.push('用户名只能包含字母、数字和下划线，长度3-20位');
  }
  
  if (userData.name && userData.name.length < 2) {
    errors.push('姓名至少需要2个字符');
  }
  
  if (userData.username && userData.username.length > 50) {
    errors.push('用户名不能超过50个字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateOrderData = (orderData: Partial<Order>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (orderData.items && orderData.items.length === 0) {
    errors.push('订单必须包含至少一个项目');
  }
  
  if (orderData.totalAmount !== undefined && orderData.totalAmount < 0) {
    errors.push('订单金额不能为负数');
  }
  
  if (orderData.roomId && !/^(8[23]\d{2}|vip\d{3})$/i.test(orderData.roomId)) {
    errors.push('房间号格式不正确');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDishData = (dishData: Partial<Dish>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (dishData.name && dishData.name.length < 2) {
    errors.push('菜品名称至少需要2个字符');
  }
  
  if (dishData.price !== undefined && dishData.price < 0) {
    errors.push('价格不能为负数');
  }
  
  if (dishData.stock !== undefined && (!Number.isInteger(dishData.stock) || dishData.stock < 0)) {
    errors.push('库存必须为非负整数');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 安全检查函数
export const performSecurityCheck = async (request: Request): Promise<boolean> => {
  // 检查请求头中的安全相关字段
  const userAgent = request.headers.get('User-Agent');
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');
  
  // 简单的机器人检测
  if (userAgent && /bot|crawler|spider|crawling|semon|ahrefs|mj12bot|rogerbot|dataprovider|panscient|leakix|evc-batch/i.test(userAgent)) {
    console.warn('Detected potential bot traffic:', userAgent);
    return false;
  }
  
  // 在实际应用中，可以集成更复杂的检查
  return true;
};

// 安全审计函数
export const auditDataAccess = (userId: string, dataType: string, action: string, recordId?: string) => {
  // 记录数据访问审计日志
  const auditLog = {
    userId,
    dataType,
    action,
    recordId,
    timestamp: new Date().toISOString(),
    ip: 'CLIENT_IP', // 应该从请求中获取实际IP
    userAgent: 'CLIENT_USER_AGENT' // 应该从请求中获取实际User-Agent
  };
  
  console.log('Data access audited:', auditLog);
  // 在实际应用中，应将审计日志保存到安全的存储中
};

// 数据脱敏函数
export const anonymizeUserData = (user: User): Partial<User> => {
  return {
    id: user.id,
    username: maskSensitiveData(user.username, 'id'),
    role: user.role,
    name: maskSensitiveData(user.name, 'id'),
    lastLogin: user.lastLogin,
    permissions: user.permissions,
    isLocked: user.isLocked
  };
};

// 频率限制函数
export interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

export const checkRateLimit = (
  store: RateLimitStore,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; timeRemaining: number } => {
  const now = Date.now();
  const record = store[key];
  
  if (!record) {
    // 首次请求，创建记录
    store[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, timeRemaining: 0 };
  }
  
  if (now > record.resetTime) {
    // 时间窗口已过，重置计数
    store[key] = { count: 1, resetTime: now + windowMs };
    return { allowed: true, timeRemaining: 0 };
  }
  
  if (record.count >= maxRequests) {
    // 达到限制
    return { 
      allowed: false, 
      timeRemaining: Math.ceil((record.resetTime - now) / 1000) 
    };
  }
  
  // 增加计数
  record.count += 1;
  return { allowed: true, timeRemaining: 0 };
};