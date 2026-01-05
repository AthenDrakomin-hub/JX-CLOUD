
import { RoomStatus, Dish, User, UserRole, CRUDPermissions, AppModule } from './types';

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

// 注意：生产环境中不应包含默认用户凭据
// 在生产环境中，用户应通过Supabase认证系统创建
export const INITIAL_USERS: User[] = [
  // 仅在演示模式下使用默认用户，生产环境应从Supabase数据库获取用户
  // {
  //   id: 'u-admin-root',
  //   username: 'admin',
  //   password: 'admin',
  //   role: UserRole.ADMIN,
  //   name: '系统管理员',
  //   modulePermissions: ALL_MODULE_PERMS,
  //   isOnline: false,
  //   // Fix: Removed non-existent property 'twoFactorEnabled'
  // },
  // {
  //   id: 'u-maintainer-dev',
  //   username: 'maintainer',
  //   password: 'dev123',
  //   role: UserRole.MAINTAINER,
  //   name: '技术维护员',
  //   modulePermissions: {
  //     ...ALL_MODULE_PERMS,
  //     finance: { enabled: true, c: false, r: true, u: false, d: false }
  //   },
  //   isOnline: false,
  //   // Fix: Removed non-existent property 'twoFactorEnabled'
  // }
];

export const CATEGORIES = ['Heritage Soup', 'Land & Sea', 'Street Classics', 'Soft Drinks'];
export const COLORS = { primary: '#2563eb', success: '#22c55e', danger: '#ef4444', warning: '#f59e0b' };