
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

  /**
   * 使用浏览器原生 Web Speech API 进行播报
   * 无需 AI，低延迟，支持多语言。
   */
  broadcastOrderVoice: (order: Order, lang: 'zh' | 'en', volume: number = 1.0) => {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech Synthesis not supported in this browser.");
      return;
    }

    const text = lang === 'zh' 
      ? `您有一条来自 ${order.roomId} 房间的新订单，请及时处理。`
      : `New order received from Room ${order.roomId}. Please check.`;

    // 停止当前正在进行的播报，防止重叠
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.volume = volume;
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // 稍微调高音调，增加识别度

    // 针对 Chrome 偶尔无法自动找到嗓音的修复
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => v.lang.includes(lang === 'zh' ? 'zh' : 'en'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  },

  triggerWebhook: async (order: Order, supabaseInstance?: any) => {
    // 使用部署的 notify-proxy 边缘函数
    const proxyUrl = 'https://zlbemopcgjohrnyyiwvs.supabase.co/functions/v1/notify-proxy';
    const payload = {
      event: 'order.created',
      timestamp: new Date().toISOString(),
      source: 'JX_CLOUD_V5',
      data: {
        orderId: order.id,
        room: order.roomId,
        amount: order.totalAmount
      }
    };
    
    try {
      // 获取当前会话
      const { data: { session } } = supabaseInstance 
        ? await supabaseInstance.auth.getSession()
        : await import('./supabaseClient').then(mod => mod.supabase.auth.getSession());

      if (!session?.access_token) {
        console.warn('No valid session found for webhook request');
        return;
      }

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,  // 包含身份验证头
          'X-Client-Info': 'JX-Cloud-Frontend/5.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Webhook proxy request failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Webhook proxy request error:', error);
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
      new Notification(title, { body, tag: type });
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
    };
  }
};