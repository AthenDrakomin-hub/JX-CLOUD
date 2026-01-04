/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import { RoomStatus, Dish } from './types';

// 32 (82xx) + 32 (83xx) + 3 (VIP) = 67 间
export const ROOM_NUMBERS = [
  ...Array.from({ length: 32 }, (_, i) => (8201 + i).toString()),
  ...Array.from({ length: 32 }, (_, i) => (8301 + i).toString()),
  'VIP-666', 
  'VIP-888', 
  'VIP-000'
];

// 初始菜品数据已移除，系统现在完全依赖云端数据

export const CATEGORIES = ['Main', 'Seafood', 'Staple', 'Soup', 'Drink', 'Dessert'];

export const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
};