
import { RoomStatus, Dish, UserRole, CRUDPermissions, AppModule } from './types';

export const ROOM_NUMBERS = [
  ...Array.from({ length: 32 }, (_, i) => (8201 + i).toString()),
  ...Array.from({ length: 32 }, (_, i) => (8301 + i).toString()),
  'VIP-666', 'VIP-888', 'VIP-000'
];

const FULL_CRUD: CRUDPermissions = { enabled: true, c: true, r: true, u: true, d: true };
const ALL_MODULE_PERMS: Record<AppModule, CRUDPermissions> = {
  dashboard: FULL_CRUD,
  rooms: FULL_CRUD,
  orders: FULL_CRUD,
  menu: FULL_CRUD,
  finance: FULL_CRUD,
  partners: FULL_CRUD,
  users: FULL_CRUD,
  settings: FULL_CRUD,
  database: FULL_CRUD,
  images: FULL_CRUD,
  // Fix: Added missing 'inventory' module permission
  inventory: FULL_CRUD,
  // Fix: Added missing 'payments' module permission
  payments: FULL_CRUD,
  // Fix: Added missing 'supply_chain' module permission
  supply_chain: FULL_CRUD
};

export const INITIAL_DISHES: Dish[] = [
  { id: 'soup-1', name: '南昌瓦罐煨汤(鸡蛋肉饼)', nameEn: 'Claypot Egg & Pork Soup', price: 180, category: 'Heritage Soup', stock: 50, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=600', description: 'Jiangxi traditional soup.', isRecommended: true },
  { id: 'main-1', name: '余干辣椒炒肉', nameEn: 'Spicy Yugan Chili Pork', price: 450, category: 'Land & Sea', stock: 100, imageUrl: 'https://images.unsplash.com/photo-1512058560366-cd242d4586ee?auto=format&fit=crop&q=80&w=600', description: 'Selected Yugan chili.', isRecommended: true },
  { id: 'staple-1', name: '南昌拌粉', nameEn: 'Nanchang Mixed Noodles', price: 150, category: 'Street Classics', stock: 200, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=600', description: 'Local breakfast noodle.', isRecommended: true },
  { id: 'dr-1', name: '冰镇酸梅汤', nameEn: 'Chilled Plum Juice', price: 90, category: 'Soft Drinks', stock: 300, imageUrl: 'https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&q=80&w=600', description: 'Best for spicy food relief.' },
];

// 注意：仅在演示/开发环境中包含默认用户凭据
// 在生产环境中，用户应通过Supabase认证系统创建
const DEMO_FULL_CRUD: CRUDPermissions = { enabled: true, c: true, r: true, u: true, d: true };
const DEMO_READ_ONLY: CRUDPermissions = { enabled: true, c: false, r: true, u: false, d: false };
const DEMO_LIMITED_CRUD: CRUDPermissions = { enabled: true, c: true, r: true, u: true, d: false }; // 无删除权限

// 系统管理员权限 - 拥有所有模块的完全权限
const ADMIN_PERMISSIONS: Record<AppModule, CRUDPermissions> = {
  dashboard: DEMO_FULL_CRUD,
  rooms: DEMO_FULL_CRUD,
  orders: DEMO_FULL_CRUD,
  menu: DEMO_FULL_CRUD,
  finance: DEMO_FULL_CRUD,
  partners: DEMO_FULL_CRUD,
  users: DEMO_FULL_CRUD,
  settings: DEMO_FULL_CRUD,
  database: DEMO_FULL_CRUD,
  images: DEMO_FULL_CRUD,
  inventory: DEMO_FULL_CRUD,
  payments: DEMO_FULL_CRUD,
  supply_chain: DEMO_FULL_CRUD
};

// 员工权限 - 只有基本操作权限，不能管理用户和系统设置
const STAFF_PERMISSIONS: Record<AppModule, CRUDPermissions> = {
  dashboard: DEMO_READ_ONLY,
  rooms: DEMO_LIMITED_CRUD,
  orders: DEMO_FULL_CRUD, // 员工需要处理订单
  menu: DEMO_READ_ONLY,
  finance: DEMO_READ_ONLY,
  partners: DEMO_READ_ONLY,
  users: DEMO_READ_ONLY, // 员工只能查看用户
  settings: DEMO_READ_ONLY, // 员工不能修改设置
  database: DEMO_READ_ONLY, // 员工不能访问数据库
  images: DEMO_LIMITED_CRUD,
  inventory: DEMO_READ_ONLY,
  payments: DEMO_READ_ONLY,
  supply_chain: DEMO_LIMITED_CRUD
};

// 开发者/维护员权限 - 拥有大部分权限，但财务模块限制
const MAINTAINER_PERMISSIONS: Record<AppModule, CRUDPermissions> = {
  dashboard: DEMO_FULL_CRUD,
  rooms: DEMO_FULL_CRUD,
  orders: DEMO_FULL_CRUD,
  menu: DEMO_FULL_CRUD,
  finance: DEMO_READ_ONLY, // 维护员可以查看财务但不能修改
  partners: DEMO_FULL_CRUD,
  users: DEMO_FULL_CRUD,
  settings: DEMO_FULL_CRUD,
  database: DEMO_FULL_CRUD,
  images: DEMO_FULL_CRUD,
  inventory: DEMO_FULL_CRUD,
  payments: DEMO_FULL_CRUD,
  supply_chain: DEMO_FULL_CRUD
};

// 注意：在纯生产模式下，用户应通过 Supabase 认证系统创建
// 此处保留空数组以避免破坏现有接口
export const INITIAL_USERS: User[] = [];

export const CATEGORIES = ['Heritage Soup', 'Land & Sea', 'Street Classics', 'Soft Drinks'];
export const COLORS = { primary: '#2563eb', success: '#22c55e', danger: '#ef4444', warning: '#f59e0b' };