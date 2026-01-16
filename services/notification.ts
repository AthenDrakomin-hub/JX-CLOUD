
import { Order } from '../types';

export type NotificationType = 'NEW_ORDER' | 'ORDER_UPDATE' | 'GENERAL';

/**
 * 江西云厨 - 实时通知服务 (V8.5 加固版)
 * 集成 Qoder 推荐的 Audio API 提示音 + Web Speech 语音播报
 */
export const notificationService = {
  requestPermission: async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied';
    return await Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission;
  },

  /**
   * 综合广播：触发语音 + 提示音
   */
  broadcastOrderVoice: (order: Order, lang: 'zh' | 'en', volume: number = 1.0) => {
    // 1. 触发物理提示音 (Qoder 标准实现)
    // 提示音来源：企业级通知声
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.6;
    audio.play().catch(e => console.warn("Audio playback blocked by browser policy. Interaction required."));

    // 2. 语音播报
    if (!('speechSynthesis' in window)) return;
    
    // 构建更详细的语音播报内容，包含订单详情
    let text = '';
    if (lang === 'zh') {
      // 获取订单中的菜品名称
      const itemNames = order.items?.map(item => item.name || item.dishId).join('、') || '若干菜品';
      text = `江西云厨提醒，房间 ${order.roomId} 有新订单，包含 ${itemNames}，请及时处理。`;
    } else {
      // 英文版本
      const itemCount = order.items?.length || 0;
      text = `New order from Room ${order.roomId}. Contains ${itemCount} item(s), total amount is ${Math.round(order.totalAmount || 0)} pesos. Please process promptly.`;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.volume = volume;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  },

  /**
   * 触发本地系统通知
   */
  triggerLocal: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { 
          body,
          icon: '/favicon.ico',
          tag: 'jx-order-update' 
        });
      } catch (e) {
        console.warn("Notification error:", e);
      }
    }
  }
};