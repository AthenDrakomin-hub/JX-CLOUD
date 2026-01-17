/**
 * 前端API客户端 - 与后端API服务分离
 * 避免在前端Bundle中包含数据库驱动
 */

const API_BASE_URL = '/api';

// 分类API
const categoryApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    return response.json();
  },

  saveAll: async (categories: any[]): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categories }),
    });
    if (!response.ok) {
      throw new Error(`Failed to save categories: ${response.statusText}`);
    }
  }
};

// 订单API
const orderApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/orders`);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    return response.json();
  },

  create: async (order: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }
    return response.json();
  }
};

// 菜品API
const dishApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/dishes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch dishes: ${response.statusText}`);
    }
    return response.json();
  }
};

// 房间API
const roomApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rooms: ${response.statusText}`);
    }
    return response.json();
  }
};

// 用户API
const userApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    return response.json();
  }
};

// 合伙人API
const partnerApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/partners`);
    if (!response.ok) {
      throw new Error(`Failed to fetch partners: ${response.statusText}`);
    }
    return response.json();
  }
};

// 系统配置API
const configApi = {
  get: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.statusText}`);
    }
    return response.json();
  },

  update: async (config: any): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(`Failed to update config: ${response.statusText}`);
    }
  }
};

// 主API对象
export const api = {
  categories: categoryApi,
  orders: orderApi,
  dishes: dishApi,
  rooms: roomApi,
  users: userApi,
  partners: partnerApi,
  config: configApi
};