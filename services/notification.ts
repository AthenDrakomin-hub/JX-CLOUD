
import { supabase, isDemoMode } from './supabaseClient';
import { Order } from '../types';

export type NotificationType = 'NEW_ORDER' | 'ORDER_UPDATE' | 'SYSTEM_ALERT';

interface BroadcastMessage {
  type: NotificationType;
  title: string;
  body: string;
  targetRoles?: string[];
  data?: any;
}

const channel = new BroadcastChannel('jx_hotel_notifications');
const listeners: ((msg: BroadcastMessage) => void)[] = [];

export const notificationService = {
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    return await Notification.requestPermission();
  },

  // 核心：Webhook 推送逻辑
  triggerWebhook: async (order: Order, webhookUrl?: string) => {
    if (!webhookUrl) return;

    const payload = {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      source: 'JX_CLOUD_V3',
      data: {
        orderId: order.id,
        room: order.roomId,
        amount: order.totalAmount,
        payment: order.paymentMethod,
        items: order.items.map(i => `${i.name} x${i.quantity}`).join(', ')
      }
    };

    try {
      // 使用 fetch 发送 POST 请求到第三方网关
      // 注意：在浏览器端可能会受 CORS 限制，生产环境建议通过后端中继
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors' // 演示环境通常使用 no-cors
      });
      console.log('Webhook dispatched successfully.');
    } catch (error) {
      console.warn('Webhook dispatch failed:', error);
    }
  },

  send: (
    title: string, 
    body: string, 
    type: NotificationType = 'SYSTEM_ALERT',
    targetRoles: string[] = ['admin', 'manager', 'staff'],
    data?: any
  ) => {
    const message: BroadcastMessage = { type, title, body, targetRoles, data };
    channel.postMessage(message);
    listeners.forEach(listener => listener(message));
    notificationService.triggerLocal(title, body, type);
  },

  triggerLocal: (title: string, body: string, type: NotificationType) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
        tag: type,
        silent: false
      });

      try {
        const soundUrl = type === 'NEW_ORDER' 
          ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
          : 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';
        const audio = new Audio(soundUrl);
        audio.play().catch(() => {});
      } catch (e) {}
    }
  },

  subscribe: (callback: (msg: BroadcastMessage) => void) => {
    const handler = (event: MessageEvent<BroadcastMessage>) => callback(event.data);
    channel.addEventListener('message', handler);
    listeners.push(callback);
    return () => {
      channel.removeEventListener('message', handler);
      const index = listeners.indexOf(callback);
      if (index !== -1) listeners.splice(index, 1);
    };
  }
};
