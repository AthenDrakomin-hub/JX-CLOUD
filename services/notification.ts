
export type NotificationType = 'NEW_ORDER' | 'ORDER_UPDATE' | 'SYSTEM_ALERT';

interface BroadcastMessage {
  type: NotificationType;
  title: string;
  body: string;
  targetRoles?: string[];
  data?: any;
}

const channel = new BroadcastChannel('jx_hotel_notifications');

export const notificationService = {
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    return await Notification.requestPermission();
  },

  // Broadcast to other tabs and show local notification if allowed
  send: (
    title: string, 
    body: string, 
    type: NotificationType = 'SYSTEM_ALERT',
    targetRoles: string[] = ['admin', 'manager', 'staff']
  ) => {
    const message: BroadcastMessage = { type, title, body, targetRoles };
    
    // Broadcast to other open tabs
    channel.postMessage(message);

    // Show local notification immediately
    notificationService.triggerLocal(title, body, type);
  },

  // Internally used to trigger the actual browser notification
  triggerLocal: (title: string, body: string, type: NotificationType) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3119/3119338.png',
        tag: type // Group similar notifications
      });

      // Play specific sounds based on type
      try {
        const soundUrl = type === 'NEW_ORDER' 
          ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' // Urgent
          : 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'; // Subtle
        const audio = new Audio(soundUrl);
        audio.play().catch(() => {});
      } catch (e) {
        console.error('Audio fail', e);
      }
    }
  },

  // Hook for components to listen for incoming broadcasts
  subscribe: (callback: (msg: BroadcastMessage) => void) => {
    const handler = (event: MessageEvent<BroadcastMessage>) => callback(event.data);
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
  }
};
