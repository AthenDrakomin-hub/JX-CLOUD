// src/services/notification.ts

export type NotificationType = 'NEW_ORDER' | 'ORDER_UPDATE' | 'GENERAL' | 'PAYMENT' | 'INVENTORY';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const notificationService = {
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    return await Notification.requestPermission();
  },

  create: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification => {
    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      ...notification
    };
  },

  markAsRead: (id: string): Notification | null => {
    // In a real app, this would update the notification in state/store
    console.log(`Marked notification ${id} as read`);
    return null;
  },

  delete: (id: string): boolean => {
    // In a real app, this would remove the notification from state/store
    console.log(`Deleted notification ${id}`);
    return true;
  }
};