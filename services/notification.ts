
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
  // Fix: Added 'fil' to lang parameter type to match Language type and prevent type mismatch in App.tsx
  broadcastOrderVoice: (order: Order, lang: 'zh' | 'en' | 'fil', volume: number = 1.0) => {
    // 1. 触发物理提示音 (Qoder 标准实现)
    // 提示音来源：企业级通知声
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.6;
    audio.play().catch(e => console.warn("Audio playback blocked by browser policy. Interaction required."));

    // 2. 语音播报
    if (!('speechSynthesis' in window)) return;
    
    // Fix: Added support for Filipino (fil) speech synthesis and improved logic for language selection
    let text = '';
    // Fix: Changed 'roomId' to 'room_id' to match Order interface
    if (lang === 'zh') {
      text = `江西云厨提醒，您有一条来自 ${order.room_id} 的新订单，请及时接单。`;
    } else if (lang === 'fil') {
      text = `May bagong order galing sa Room ${order.room_id}. Kabuuang halaga ay ${Math.round(order.total_amount)} pesos.`;
    } else {
      text = `New order from Room ${order.room_id}. Total amount is ${Math.round(order.total_amount)} pesos.`;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Fix: Mapped 'fil' to Filipino (tl-PH) BCP 47 tag for speech synthesis
    utterance.lang = lang === 'zh' ? 'zh-CN' : (lang === 'fil' ? 'tl-PH' : 'en-US');
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