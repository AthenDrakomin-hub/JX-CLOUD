import { Order, Dish } from '../types';

/**
 * 打印服务 - 生成厨房小票模板
 */
export const printService = {
  /**
   * 生成厨房小票HTML模板
   */
  generateKitchenReceipt: (order: Order, dishes: Dish[] = []): string => {
    const orderTime = new Date(order.createdAt || Date.now()).toLocaleString('zh-CN');
    
    // 获取订单中的菜品详情
    const orderItems = order.items?.map(item => {
      const dish = dishes.find(d => d.id === item.dishId);
      return {
        name: dish?.name || item.name || '未知菜品',
        quantity: item.quantity || 1,
        note: item.note || ''
      };
    }) || [];

    // 获取支付方式信息
    let paymentInfo = '支付方式: 未指定';
    if (order.paymentMethod) {
      if (order.paymentMethod === 'cash_php') {
        paymentInfo = '支付方式: 现金 (PAYMENT: CASH)';
      } else if (order.paymentMethod === 'gcash') {
        paymentInfo = '支付方式: GCash';
      } else {
        paymentInfo = `支付方式: ${order.paymentMethod}`;
      }
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>厨房小票</title>
  <style>
    body { 
      font-family: 'Courier New', monospace; 
      margin: 0; 
      padding: 10px; 
      font-size: 14px;
      line-height: 1.4;
    }
    .header { 
      text-align: center; 
      border-bottom: 2px solid #000; 
      padding-bottom: 10px; 
      margin-bottom: 15px; 
    }
    .room-number { 
      font-size: 24px; 
      font-weight: bold; 
      color: #d32f2f; 
      margin: 10px 0; 
    }
    .order-info { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 10px; 
    }
    .payment-info { 
      text-align: center; 
      background-color: #f0f0f0; 
      padding: 5px; 
      margin: 10px 0; 
      font-weight: bold; 
    }
    .items { 
      margin: 15px 0; 
    }
    .item { 
      margin: 5px 0; 
    }
    .footer { 
      margin-top: 15px; 
      padding-top: 10px; 
      border-top: 1px solid #ccc; 
      font-style: italic; 
    }
    .note { 
      color: #e65100; 
      font-weight: bold; 
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="room-number">房间号: ${order.roomId}</div>
    <div class="order-info">
      <span>订单号: ${order.id}</span>
      <span>时间: ${orderTime}</span>
    </div>
  </div>
  
  <div class="payment-info">${paymentInfo}</div>
  
  <div class="items">
    ${orderItems.map(item => `
      <div class="item">
        <span>${item.name} × ${item.quantity}</span>
        ${item.note ? `<div class="note">备注: ${item.note}</div>` : ''}
      </div>
    `).join('')}
  </div>
  
  ${order.note ? `<div class="footer">客户备注: ${order.note}</div>` : ''}
</body>
</html>`;
  },

  /**
   * 打印订单小票
   */
  printOrder: (order: Order, dishes: Dish[] = []): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // 创建一个隐藏的 iframe 来打印
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.zIndex = '-1';
        iframe.srcdoc = printService.generateKitchenReceipt(order, dishes);
        
        document.body.appendChild(iframe);
        
        iframe.onload = () => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            
            // 打印完成后移除 iframe
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve(true);
            }, 1000);
          } catch (printError) {
            console.error('打印失败:', printError);
            document.body.removeChild(iframe);
            resolve(false);
          }
        };
        
        iframe.onerror = () => {
          document.body.removeChild(iframe);
          resolve(false);
        };
      } catch (error) {
        console.error('打印初始化失败:', error);
        resolve(false);
      }
    });
  }
};