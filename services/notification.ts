
import { supabase, isDemoMode } from './supabaseClient';

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

// 生产环境监听：如果是正式模式，监听数据库变更
if (!isDemoMode) {
  supabase
    .channel('realtime_orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
      notificationService.triggerLocal(
        '云端新订单',
        `房间 ${payload.new.room_id} 刚刚下单了 ₱${payload.new.total_amount}`,
        'NEW_ORDER'
      );
      listeners.forEach(l => l({
        type: 'NEW_ORDER',
        title: 'New Cloud Order',
        body: `Room ${payload.new.room_id} sync completed.`
      }));
    })
    .subscribe();
}

export const notificationService = {
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    return await Notification.requestPermission();
  },

  send: (
    title: string, 
    body: string, 
    type: NotificationType = 'SYSTEM_ALERT',
    targetRoles: string[] = ['admin', 'manager', 'staff']
  ) => {
    const message: BroadcastMessage = { type, title, body, targetRoles };
    channel.postMessage(message);
    listeners.forEach(listener => listener(message));
    notificationService.triggerLocal(title, body, type);
  },

  triggerLocal: (title: string, body: string, type: NotificationType) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
        tag: type
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