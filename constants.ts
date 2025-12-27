
import { RoomStatus, Dish } from './types';

export const ROOM_NUMBERS = [
  ...Array.from({ length: 32 }, (_, i) => (8201 + i).toString()),
  ...Array.from({ length: 32 }, (_, i) => (8301 + i).toString()),
];

export const INITIAL_DISHES: Dish[] = [
  { id: '1', name: '红烧肉', nameEn: 'Braised Pork', price: 48, category: 'Main', stock: 50, imageUrl: 'https://picsum.photos/seed/pork/200/200' },
  { id: '2', name: '清蒸鱼', nameEn: 'Steamed Fish', price: 88, category: 'Seafood', stock: 20, imageUrl: 'https://picsum.photos/seed/fish/200/200' },
  { id: '3', name: '扬州炒饭', nameEn: 'Fried Rice', price: 28, category: 'Staple', stock: 100, imageUrl: 'https://picsum.photos/seed/rice/200/200' },
  { id: '4', name: '青椒炒肉', nameEn: 'Pork with Pepper', price: 32, category: 'Main', stock: 40, imageUrl: 'https://picsum.photos/seed/pepper/200/200' },
  { id: '5', name: '可乐', nameEn: 'Coke', price: 6, category: 'Drink', stock: 200, imageUrl: 'https://picsum.photos/seed/coke/200/200' },
];

export const CATEGORIES = ['Main', 'Seafood', 'Staple', 'Soup', 'Drink', 'Dessert'];

export const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
};
