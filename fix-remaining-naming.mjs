// 修复剩余的命名规范问题
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要修复的文件列表
const filesToFix = [
  'src/components/Dashboard.tsx',
  'src/components/FinanceManagement.tsx',
  'src/components/GuestOrder.tsx',
  'src/components/ImageLibrary.tsx',
  'src/components/InventoryManagement.tsx',
  'src/components/PartnerManagement.tsx',
  'src/components/PaymentManagement.tsx',
  'src/components/RoomGrid.tsx',
  'src/components/SystemSettings.tsx',
  'src/services/api.ts'
];

// 剩余的命名转换规则
const remainingFixes = [
  { from: /\.commissionRate(?![a-zA-Z0-9_])/, to: '.commission_rate' },
  { from: /\.paymentMethod(?![a-zA-Z0-9_])/, to: '.payment_method' },
  { from: /\.totalAmount(?![a-zA-Z0-9_])/, to: '.total_amount' },
  { from: /\.sortOrder(?![a-zA-Z0-9_])/, to: '.sort_order' },
  { from: /\.nameEn(?![a-zA-Z0-9_])/, to: '.name_en' },
  { from: /\.minStock(?![a-zA-Z0-9_])/, to: '.min_stock' },
  { from: /\.lastRestocked(?![a-zA-Z0-9_])/, to: '.last_restocked' },
  { from: /\.ownerName(?![a-zA-Z0-9_])/, to: '.owner_name' },
  { from: /\.totalSales(?![a-zA-Z0-9_])/, to: '.total_sales' },
  { from: /\.authorizedCategories(?![a-zA-Z0-9_])/, to: '.authorized_categories' },
  { from: /\.joinedAt(?![a-zA-Z0-9_])/, to: '.joined_at' },
  { from: /\.qrUrl(?![a-zA-Z0-9_])/, to: '.qr_url' },
  { from: /\.walletAddress(?![a-zA-Z0-9_])/, to: '.wallet_address' },
  { from: /\.currencySymbol(?![a-zA-Z0-9_])/, to: '.currency_symbol' },
  { from: /\.exchangeRate(?![a-zA-Z0-9_])/, to: '.exchange_rate' },
  { from: /\.paymentType(?![a-zA-Z0-9_])/, to: '.payment_type' },
  { from: /\.isActive(?![a-zA-Z0-9_])/, to: '.is_active' },
  { from: /\.ticketStyle(?![a-zA-Z0-9_])/, to: '.ticket_style' }
];

console.log('🔧 开始修复剩余的命名规范问题...');
console.log('==================================');

let totalChanges = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    
    // 应用所有剩余的修复
    remainingFixes.forEach(fix => {
      const matches = content.match(fix.from);
      if (matches) {
        content = content.replace(fix.from, fix.to);
        totalChanges += matches.length;
      }
    });
    
    // 写回文件（如果有变化）
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath}: 修复了命名问题`);
    }
    
  } catch (error) {
    console.error(`❌ 处理文件 ${filePath} 时出错:`, error.message);
  }
});

console.log('==================================');
console.log(`🎉 修复完成！总共修复了 ${totalChanges} 处命名问题。`);

// 特殊处理：修复 'tableId' 问题
const specialFiles = [
  'src/components/FinanceManagement.tsx',
  'src/components/RoomGrid.tsx'
];

specialFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // 将 tableId 替换为 room_id（订单中的房间ID）
    content = content.replace(/\btableId\b/g, 'room_id');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 修复了 ${filePath} 中的 tableId 问题`);
  }
});

console.log('✅ 所有剩余命名规范问题修复完成！');