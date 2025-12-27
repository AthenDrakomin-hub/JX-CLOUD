/**
 * JX Cloud 酒店管理系统 - 工具函数
 * 包含数据验证、格式化、计算等实用函数
 */

import { Order, Dish, Expense, User, OrderStatus, RoomStatus, PaymentMethod } from '../types';

// 数据验证函数
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateRoomId = (roomId: string): boolean => {
  // 验证房间ID格式 (例如: 8201-8232, 8301-8332, VIP房间)
  const roomRegex = /^(8[23]\d{2}|vip\d{3})$/i;
  return roomRegex.test(roomId);
};

export const validatePrice = (price: number): boolean => {
  return typeof price === 'number' && price >= 0;
};

export const validateStock = (stock: number): boolean => {
  return Number.isInteger(stock) && stock >= 0;
};

// 日期时间处理函数
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN');
};

export const getTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}秒前`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
  return `${Math.floor(diffInSeconds / 86400)}天前`;
};

// 价格计算函数
export const calculateOrderTotal = (items: { price: number; quantity: number }[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const calculateTax = (amount: number, taxRate: number = 0.12): number => {
  return parseFloat((amount * taxRate).toFixed(2));
};

export const calculateTotalWithTax = (subtotal: number, taxRate: number = 0.12): number => {
  const tax = calculateTax(subtotal, taxRate);
  return parseFloat((subtotal + tax).toFixed(2));
};

export const formatCurrency = (amount: number, currency: string = 'PHP'): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency === 'PHP' ? 'PHP' : 'CNY',
    minimumFractionDigits: 2
  }).format(amount);
};

// 订单处理函数
export const canChangeOrderStatus = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  // 定义订单状态转换规则
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [] // 一旦取消，不能更改状态
  };

  return validTransitions[currentStatus].includes(newStatus);
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.PREPARING]: 'bg-blue-100 text-blue-800',
    [OrderStatus.DELIVERING]: 'bg-indigo-100 text-indigo-800',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800'
  };
  return colors[status];
};

export const getOrderStatusText = (status: OrderStatus, lang: 'zh' | 'en' | 'tl' = 'zh'): string => {
  const statusTexts: Record<OrderStatus, Record<string, string>> = {
    [OrderStatus.PENDING]: { zh: '待处理', en: 'Pending', tl: 'Nakabinbin' },
    [OrderStatus.PREPARING]: { zh: '制作中', en: 'Preparing', tl: 'Inihahanda' },
    [OrderStatus.DELIVERING]: { zh: '配送中', en: 'Delivering', tl: 'Dinadala' },
    [OrderStatus.COMPLETED]: { zh: '已完成', en: 'Completed', tl: 'Nakumpleto' },
    [OrderStatus.CANCELLED]: { zh: '已取消', en: 'Cancelled', tl: 'Nakansela' }
  };
  return statusTexts[status][lang];
};

// 房间状态处理函数
export const getRoomStatusColor = (status: RoomStatus): string => {
  const colors: Record<RoomStatus, string> = {
    [RoomStatus.READY]: 'bg-green-500',
    [RoomStatus.ORDERING]: 'bg-yellow-500'
  };
  return colors[status];
};

export const getRoomStatusText = (status: RoomStatus, lang: 'zh' | 'en' | 'tl' = 'zh'): string => {
  const statusTexts: Record<RoomStatus, Record<string, string>> = {
    [RoomStatus.READY]: { zh: '空闲', en: 'Ready', tl: 'Handa' },
    [RoomStatus.ORDERING]: { zh: '使用中', en: 'Occupied', tl: 'Ginagamit' }
  };
  return statusTexts[status][lang];
};

// 权限检查函数
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission as any);
};

export const canManageMenu = (user: User | null): boolean => {
  return hasPermission(user, 'manage_menu');
};

export const canViewFinance = (user: User | null): boolean => {
  return hasPermission(user, 'view_finance');
};

export const canProcessOrders = (user: User | null): boolean => {
  return hasPermission(user, 'process_orders');
};

export const canManageStaff = (user: User | null): boolean => {
  return hasPermission(user, 'manage_staff');
};

export const canSystemConfig = (user: User | null): boolean => {
  return hasPermission(user, 'system_config');
};

// 数据格式化函数
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const generateOrderId = (): string => {
  return `ORD${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
};

export const generateRoomQRCodeData = (roomId: string): string => {
  // 生成房间的二维码数据，可用于扫码点餐
  return `jxcloud://room/${roomId}`;
};

// 统计函数
export const calculateOccupancyRate = (rooms: { status?: RoomStatus }[]): number => {
  if (rooms.length === 0) return 0;
  const occupiedCount = rooms.filter(room => room.status === RoomStatus.ORDERING).length;
  return parseFloat(((occupiedCount / rooms.length) * 100).toFixed(2));
};

export const calculateTotalRevenue = (orders: Order[]): number => {
  return orders
    .filter(order => order.status === OrderStatus.COMPLETED)
    .reduce((total, order) => total + order.totalAmount, 0);
};

export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

export const calculateNetRevenue = (orders: Order[], expenses: Expense[]): number => {
  const revenue = calculateTotalRevenue(orders);
  const totalExpenses = calculateTotalExpenses(expenses);
  return revenue - totalExpenses;
};

// 搜索和过滤函数
export const filterDishesByCategory = (dishes: Dish[], category: string): Dish[] => {
  if (!category || category === 'all') return dishes;
  return dishes.filter(dish => dish.category.toLowerCase() === category.toLowerCase());
};

export const filterDishesByAvailability = (dishes: Dish[], available: boolean): Dish[] => {
  return dishes.filter(dish => (dish.isAvailable ?? true) === available);
};

export const filterDishesBySearch = (dishes: Dish[], searchTerm: string): Dish[] => {
  if (!searchTerm) return dishes;
  const term = searchTerm.toLowerCase();
  return dishes.filter(dish => 
    dish.name.toLowerCase().includes(term) || 
    (dish.nameEn && dish.nameEn.toLowerCase().includes(term))
  );
};

// 排序函数
export const sortDishesByPrice = (dishes: Dish[], ascending: boolean = true): Dish[] => {
  return [...dishes].sort((a, b) => {
    return ascending ? a.price - b.price : b.price - a.price;
  });
};

export const sortDishesByName = (dishes: Dish[], ascending: boolean = true): Dish[] => {
  return [...dishes].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return ascending ? -1 : 1;
    if (nameA > nameB) return ascending ? 1 : -1;
    return 0;
  });
};

// 实用工具函数
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 数据导出函数
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 通知工具函数
export const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // 这里可以集成实际的通知系统
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // 如果有浏览器通知支持，也可以使用
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(message);
  }
};