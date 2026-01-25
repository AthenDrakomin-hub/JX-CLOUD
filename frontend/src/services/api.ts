// services/api.ts
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// 定义数据类型
export interface Room {
  roomNumber: string;     // 房号 (如: "8201", "8301", "3333", "6666", "9999")
  tableName: string;      // 餐桌名称 (如: "餐桌8201", "VIP包厢A")
  capacity: number;       // 容量 (人数: 2-20)
  status: 'available' | 'occupied' | 'maintenance'; // 状态
}

export interface Dish {
  _id: string;           // 菜品ID
  name: string;          // 菜品名称 (如: "宫保鸡丁")
  description: string;   // 菜品描述 (如: "经典川菜，酸甜微辣")
  price: number;         // 价格 (单位: 元)
  category: string;      // 分类 (如: "川菜", "家常菜", "海鲜")
  isAvailable: boolean;  // 是否上架
  imageUrl?: string;     // 图片URL (可选)
  createdAt: string;     // 创建时间
  updatedAt: string;     // 更新时间
}

export interface OrderItem {
  dishId: string;      // 菜品ID
  name: string;        // 菜品名称
  quantity: number;    // 数量
  price: number;       // 单价
  subtotal: number;    // 小计 (quantity * price)
}

export interface Order {
  _id: string;           // 订单ID
  roomNumber: string;    // 房号
  items: OrderItem[];    // 菜品项
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled'; // 状态
  totalAmount: number;   // 总金额 (后端自动计算)
  remark?: string;       // 备注
  createdAt: string;     // 创建时间
  updatedAt: string;     // 更新时间
  tableNumber?: string;  // 桌号 (可选)
}

export interface CreateOrderRequest {
  roomNumber: string;
  items: Array<{
    dishId: string;
    quantity: number;
  }>;
  remark?: string;
}

export interface UpdateOrderStatusRequest {
  status: 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
}

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiError {
  success: boolean;
  error: string;
  message?: string;
}

// 通用请求函数
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 从localStorage获取认证token（如果存在）
  const storedUser = localStorage.getItem('currentUser');
  let token = null;
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      // 假设后端使用某种形式的认证token
      // 这里可以根据实际后端要求添加认证头
      token = user.token || null;
    } catch (e) {
      console.warn('Failed to parse user data for auth header');
    }
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ success: false, error: 'Network error', message: 'Failed to parse error response' }));
    throw error;
  }
  
  const result: ApiResponse<T> = await response.json();
  return result.data;
};

// 房间相关API
export const roomApi = {
  // GET /api/rooms - 获取所有房间状态
  getAll: () => request<Room[]>('/rooms'),
  // GET /api/rooms/:roomNumber - 获取房间信息
  getByRoomNumber: (roomNumber: string) => request<Room>(`/rooms/${roomNumber}`),
};

// 菜品相关API
export const dishApi = {
  // GET /api/dishes - 获取菜品列表（仅上架菜品）
  getAll: () => request<Dish[]>('/dishes'),
  // GET /api/dishes/:id - 获取单个菜品详情
  getById: (id: string) => request<Dish>(`/dishes/${id}`),
};

// 订单相关API
export const orderApi = {
  // GET /api/orders - 查询订单（支持按状态和房间号筛选）
  getAll: () => request<Order[]>('/orders'),
  // GET /api/orders/:id - 获取单个订单详情
  getById: (id: string) => request<Order>(`/orders/${id}`),
  // POST /api/orders - 创建订单（后端自动计算总价）
  create: (order: CreateOrderRequest) => request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  // PATCH /api/orders/:id/status - 更新订单状态
  updateStatus: (id: string, statusUpdate: UpdateOrderStatusRequest) => request<Order>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusUpdate),
  }),
};

// 系统配置API
export const configApi = {
  // GET /api/config - 获取系统配置
  get: () => request<any>('/config'),
};

// 健康检查API
export const healthApi = {
  // GET /health - 健康检查
  check: () => request<any>('/health'),
};

// 认证API
export const authApi = {
  // POST /api/auth/login - 用户登录
  login: (credentials: { email: string; password: string }) => request<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  // POST /api/auth/register - 用户注册
  register: (userData: { email: string; password: string; name?: string }) => request<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  // GET /api/auth/profile - 获取用户资料
  profile: () => request<any>('/auth/profile'),
};

// 管理API
export const adminApi = {
  // GET /api/admin/orders - 管理员获取所有订单
  getAllOrders: () => request<Order[]>('/admin/orders'),
  // GET /api/admin/dishes - 管理员获取菜品列表
  getAllDishes: () => request<Dish[]>('/admin/dishes'),
  // POST /api/admin/dishes - 管理员添加菜品
  createDish: (dish: Omit<Dish, '_id' | 'createdAt' | 'updatedAt'>) => request<Dish>('/admin/dishes', {
    method: 'POST',
    body: JSON.stringify(dish),
  }),
  // PUT /api/admin/dishes/:id - 管理员更新菜品
  updateDish: (id: string, dish: Partial<Dish>) => request<Dish>(`/admin/dishes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dish),
  }),
  // DELETE /api/admin/dishes/:id - 管理员删除菜品
  deleteDish: (id: string) => request<void>(`/admin/dishes/${id}`, {
    method: 'DELETE',
  }),
};