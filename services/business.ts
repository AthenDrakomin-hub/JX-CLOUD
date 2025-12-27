/**
 * JX Cloud 酒店管理系统 - 业务逻辑函数
 * 包含订单处理、库存管理、财务计算等核心业务逻辑
 */

import { Order, Dish, Expense, User, OrderStatus, RoomStatus, PaymentMethod } from '../types';
import { calculateOrderTotal, calculateTax, calculateTotalWithTax } from './utils';

// 库存管理函数
export const checkDishAvailability = (dish: Dish, quantity: number): boolean => {
  return dish.isAvailable !== false && dish.stock >= quantity;
};

export const updateDishStock = (dish: Dish, quantity: number): Dish => {
  const newStock = Math.max(0, (dish.stock || 0) - quantity);
  return {
    ...dish,
    stock: newStock,
    isAvailable: newStock > 0
  };
};

export const generateRestockRecommendation = (dishes: Dish[], threshold: number = 5): Dish[] => {
  return dishes.filter(dish => (dish.stock || 0) <= threshold);
};

// 订单处理函数
export const processNewOrder = (roomId: string, items: { dishId: string; name: string; quantity: number; price: number }[]): Order => {
  const subtotal = calculateOrderTotal(items);
  const tax = calculateTax(subtotal);
  const total = calculateTotalWithTax(subtotal);
  
  return {
    id: `ORD${Date.now()}`,
    roomId,
    items,
    totalAmount: total,
    pointsEarned: Math.floor(total / 10), // 每消费10元获得1积分
    status: OrderStatus.PENDING,
    paymentMethod: PaymentMethod.CASH, // 默认现金支付
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    taxAmount: tax
  };
};

export const updateOrderStatus = (order: Order, newStatus: OrderStatus): Order => {
  return {
    ...order,
    status: newStatus,
    updatedAt: new Date().toISOString()
  };
};

export const calculateOrderPreparationTime = (items: { quantity: number }[]): number => {
  // 简单估算：每道菜需要10分钟，每增加一个额外菜品增加2分钟
  const baseTime = 10; // 基础准备时间
  const additionalTime = (items.length - 1) * 2; // 额外菜品时间
  const quantityMultiplier = items.reduce((sum, item) => sum + item.quantity, 0) * 0.5; // 数量乘数
  
  return Math.ceil(baseTime + additionalTime + quantityMultiplier);
};

// 财务管理函数
export const calculateDailyRevenue = (orders: Order[], date: string): number => {
  return orders
    .filter(order => order.createdAt.split('T')[0] === date && order.status === OrderStatus.COMPLETED)
    .reduce((total, order) => total + order.totalAmount, 0);
};

export const calculateMonthlyRevenue = (orders: Order[], month: string): number => {
  // 月份格式: YYYY-MM
  return orders
    .filter(order => order.createdAt.startsWith(month) && order.status === OrderStatus.COMPLETED)
    .reduce((total, order) => total + order.totalAmount, 0);
};

export const calculateRevenueByCategory = (orders: Order[], dishes: Dish[]): Record<string, number> => {
  const revenueByCategory: Record<string, number> = {};
  
  orders
    .filter(order => order.status === OrderStatus.COMPLETED)
    .forEach(order => {
      order.items.forEach(item => {
        const dish = dishes.find(d => d.id === item.dishId);
        if (dish) {
          const category = dish.category || 'Uncategorized';
          revenueByCategory[category] = (revenueByCategory[category] || 0) + (item.price * item.quantity);
        }
      });
    });
  
  return revenueByCategory;
};

export const calculatePopularDishes = (orders: Order[], dishes: Dish[], limit: number = 5): Dish[] => {
  const dishCount: Record<string, number> = {};
  
  orders.forEach(order => {
    if (order.status === OrderStatus.COMPLETED) {
      order.items.forEach(item => {
        dishCount[item.dishId] = (dishCount[item.dishId] || 0) + item.quantity;
      });
    }
  });
  
  // 按销量排序并返回最受欢迎的菜品
  return dishes
    .map(dish => ({ ...dish, orderCount: dishCount[dish.id] || 0 }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, limit);
};

// 房间管理函数
export const getAvailableRooms = (rooms: { id: string; status?: RoomStatus }[]): string[] => {
  return rooms
    .filter(room => room.status === RoomStatus.READY)
    .map(room => room.id);
};

export const getOccupiedRooms = (rooms: { id: string; status?: RoomStatus }[]): string[] => {
  return rooms
    .filter(room => room.status === RoomStatus.ORDERING)
    .map(room => room.id);
};

export const assignRoomToOrder = (roomId: string, orders: Order[]): Order[] => {
  return orders.map(order => 
    order.roomId === roomId 
      ? { ...order, status: OrderStatus.PENDING } 
      : order
  );
};

// 会员积分函数
export const calculateLoyaltyPoints = (orderAmount: number): number => {
  // 每消费1元获得0.1积分
  return Math.floor(orderAmount * 0.1);
};

export const applyLoyaltyDiscount = (totalAmount: number, points: number): { discountedAmount: number; remainingPoints: number } => {
  // 每100积分抵扣1元
  const maxDiscount = Math.floor(points / 100);
  const discount = Math.min(maxDiscount, Math.floor(totalAmount * 0.1)); // 最大折扣不超过总额的10%
  
  return {
    discountedAmount: totalAmount - discount,
    remainingPoints: points - (discount * 100)
  };
};

// 营销和促销函数
export const applyDiscount = (amount: number, discountPercent: number): number => {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('折扣百分比必须在0-100之间');
  }
  return parseFloat((amount * (1 - discountPercent / 100)).toFixed(2));
};

export const checkSpecialOffers = (orders: Order[], dishes: Dish[]): { dishId: string; discountPercent: number }[] => {
  // 示例：如果某道菜在一天内销售超过10份，则享受9折优惠
  const dishCount: Record<string, number> = {};
  
  orders.forEach(order => {
    if (order.createdAt.split('T')[0] === new Date().toISOString().split('T')[0]) {
      order.items.forEach(item => {
        dishCount[item.dishId] = (dishCount[item.dishId] || 0) + item.quantity;
      });
    }
  });
  
  return Object.entries(dishCount)
    .filter(([dishId, count]) => count >= 10)
    .map(([dishId]) => ({ dishId, discountPercent: 10 }));
};

// 报表生成函数
export const generateDailyReport = (orders: Order[], expenses: Expense[], date: string) => {
  const dailyOrders = orders.filter(order => order.createdAt.split('T')[0] === date);
  const completedOrders = dailyOrders.filter(order => order.status === OrderStatus.COMPLETED);
  
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalExpenses = expenses
    .filter(expense => expense.date === date)
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  return {
    date,
    totalOrders: dailyOrders.length,
    completedOrders: completedOrders.length,
    totalRevenue,
    totalExpenses,
    netRevenue: totalRevenue - totalExpenses,
    averageOrderValue: completedOrders.length > 0 ? parseFloat((totalRevenue / completedOrders.length).toFixed(2)) : 0,
    popularItems: calculatePopularDishes(completedOrders, [], 5).map(dish => dish.name)
  };
};

export const generateMonthlyReport = (orders: Order[], expenses: Expense[], month: string) => {
  const monthlyOrders = orders.filter(order => order.createdAt.startsWith(month));
  const completedOrders = monthlyOrders.filter(order => order.status === OrderStatus.COMPLETED);
  
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalExpenses = expenses
    .filter(expense => expense.date.startsWith(month))
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const revenueByCategory = calculateRevenueByCategory(completedOrders, []);
  
  return {
    month,
    totalOrders: monthlyOrders.length,
    completedOrders: completedOrders.length,
    totalRevenue,
    totalExpenses,
    netRevenue: totalRevenue - totalExpenses,
    averageOrderValue: completedOrders.length > 0 ? parseFloat((totalRevenue / completedOrders.length).toFixed(2)) : 0,
    revenueByCategory,
    topDishes: calculatePopularDishes(completedOrders, [], 10).map(dish => dish.name)
  };
};

// 预测和分析函数
export const predictDemand = (orders: Order[], dishId: string): number => {
  // 简单预测：基于过去7天的平均销量
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentOrders = orders.filter(order => 
    new Date(order.createdAt) >= oneWeekAgo && order.status === OrderStatus.COMPLETED
  );
  
  const totalQuantity = recentOrders.reduce((sum, order) => {
    const dishItem = order.items.find(item => item.dishId === dishId);
    return sum + (dishItem ? dishItem.quantity : 0);
  }, 0);
  
  const days = Math.min(7, Math.ceil((new Date().getTime() - oneWeekAgo.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.ceil(totalQuantity / days); // 预测每日需求
};

// 通知和提醒函数
export const shouldNotifyRestock = (dish: Dish, threshold: number = 5): boolean => {
  return (dish.stock || 0) <= threshold && dish.isAvailable !== false;
};

export const generateOrderReminder = (order: Order): string | null => {
  if (order.status === OrderStatus.PREPARING) {
    const createdTime = new Date(order.createdAt).getTime();
    const estimatedTime = order.estimatedTime || 30; // 默认30分钟
    const elapsedMinutes = Math.floor((Date.now() - createdTime) / (1000 * 60));
    
    if (elapsedMinutes > estimatedTime * 0.8) { // 超过预计时间的80%
      return `订单 ${order.id} 即将超时，请尽快处理`;
    }
  }
  
  return null;
};

// 质量控制函数
export const validateOrderForKitchen = (order: Order, dishes: Dish[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  order.items.forEach(item => {
    const dish = dishes.find(d => d.id === item.dishId);
    
    if (!dish) {
      errors.push(`菜品 ${item.dishId} 不存在`);
    } else if (!dish.isAvailable) {
      errors.push(`菜品 ${item.name} 已下架`);
    } else if (dish.stock < item.quantity) {
      errors.push(`菜品 ${item.name} 库存不足，当前库存: ${dish.stock}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 成本控制函数
export const calculateFoodCostPercentage = (orders: Order[], dishes: Dish[]): number => {
  // 计算食品成本占收入的百分比（假设每道菜的成本是价格的30%）
  const totalRevenue = orders
    .filter(order => order.status === OrderStatus.COMPLETED)
    .reduce((sum, order) => sum + order.totalAmount, 0);
  
  if (totalRevenue === 0) return 0;
  
  const totalFoodCost = orders
    .filter(order => order.status === OrderStatus.COMPLETED)
    .reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        const dish = dishes.find(d => d.id === item.dishId);
        const dishCost = dish ? dish.price * 0.3 : item.price * 0.3; // 假设成本是售价的30%
        return itemSum + (dishCost * item.quantity);
      }, 0);
    }, 0);
  
  return parseFloat(((totalFoodCost / totalRevenue) * 100).toFixed(2));
};

// 营业分析函数
export const calculatePeakHours = (orders: Order[]): Record<string, number> => {
  // 统计每小时的订单数量，找出营业高峰时段
  const hourlyOrders: Record<string, number> = {};
  
  orders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    hourlyOrders[hourStr] = (hourlyOrders[hourStr] || 0) + 1;
  });
  
  return hourlyOrders;
};