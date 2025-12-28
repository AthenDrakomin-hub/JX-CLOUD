
import { RoomStatus, Dish } from './types';

// 32 (82xx) + 32 (83xx) + 3 (VIP) = 67 间
export const ROOM_NUMBERS = [
  ...Array.from({ length: 32 }, (_, i) => (8201 + i).toString()),
  ...Array.from({ length: 32 }, (_, i) => (8301 + i).toString()),
  'VIP-666', 
  'VIP-888', 
  'VIP-000'
];

export const INITIAL_DISHES: Dish[] = [
  { id: 'd1', name: '南昌瓦罐汤', nameEn: 'Crockpot Soup', price: 15, category: 'Soup', stock: 100, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400', description: '江西特色早餐，传统古法瓦罐慢煨，口感醇厚。', isRecommended: true, calories: 120, allergens: [] },
  { id: 'd2', name: '藜蒿炒腊肉', nameEn: 'Sautéed Preserved Pork with Artemisia', price: 58, category: 'Main', stock: 45, imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=400', description: '鄱阳湖藜蒿配上优质腊肉，清香爽脆。', isRecommended: true, calories: 350, allergens: ['Meat'] },
  { id: 'd3', name: '井冈山烟笋炒肉', nameEn: 'Dried Bamboo Shoots with Pork', price: 48, category: 'Main', stock: 50, imageUrl: 'https://images.unsplash.com/photo-1512058560366-cd242d4586ee?auto=format&fit=crop&q=80&w=400', description: '井冈山野生烟笋，烟熏味十足，十分下饭。', isRecommended: true, calories: 280, allergens: ['Meat'] },
  { id: 'd4', name: '清蒸鄱阳湖银鱼', nameEn: 'Steamed Silver Fish', price: 88, category: 'Seafood', stock: 15, imageUrl: 'https://images.unsplash.com/photo-1599481238640-4c1288750d7a?auto=format&fit=crop&q=80&w=400', description: '鄱阳湖特产，肉质极其细嫩，鲜美无比。', calories: 180, allergens: ['Seafood'] },
  { id: 'd5', name: '南昌拌粉', nameEn: 'Nanchang Mixed Noodles', price: 12, category: 'Staple', stock: 200, imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400', description: '江西人的灵魂早餐，Q弹劲道。', calories: 420, allergens: ['Peanuts'] },
  { id: 'd6', name: '石耳炖土鸡', nameEn: 'Braised Chicken with Stone Ear', price: 128, category: 'Main', stock: 10, imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=400', description: '庐山石耳配上散养土鸡，滋补圣品。', calories: 550, allergens: ['Meat'] },
  { id: 'd7', name: '九江茶饼', nameEn: 'Jiujiang Tea Cake', price: 25, category: 'Dessert', stock: 80, imageUrl: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=400', description: '传统名点，酥皮薄层，香甜可口。', calories: 210, allergens: ['Wheat'] },
  { id: 'd8', name: '赣南脐橙汁', nameEn: 'Gannan Orange Juice', price: 18, category: 'Drink', stock: 150, imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400', description: '鲜榨赣南脐橙，果味浓郁。', calories: 90, allergens: [] },
  { id: 'd9', name: '白糖糕', nameEn: 'Sugar Sponge Cake', price: 10, category: 'Dessert', stock: 60, imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400', description: '江西特色点心，清甜软糯。', calories: 150, allergens: ['Wheat'] },
];

export const CATEGORIES = ['Main', 'Seafood', 'Staple', 'Soup', 'Drink', 'Dessert'];

export const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
};
