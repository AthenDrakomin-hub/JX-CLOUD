import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 完整的命名映射规则
const namingConversions = [
  // SystemConfig相关
  { from: /\.hotelName(?![a-zA-Z0-9_])/, to: '.hotel_name' },
  { from: /\.autoPrintOrder(?![a-zA-Z0-9_])/, to: '.auto_print_order' },
  { from: /\.fontFamily(?![a-zA-Z0-9_])/, to: '.font_family' },
  { from: /\.ticketStyle(?![a-zA-Z0-9_])/, to: '.ticket_style' },
  
  // Partner相关
  { from: /\.ownerName(?![a-zA-Z0-9_])/, to: '.owner_name' },
  { from: /\.commissionRate(?![a-zA-Z0-9_])/, to: '.commission_rate' },
  { from: /\.authorizedCategories(?![a-zA-Z0-9_])/, to: '.authorized_categories' },
  { from: /\.totalSales(?![a-zA-Z0-9_])/, to: '.total_sales' },
  { from: /\.joinedAt(?![a-zA-Z0-9_])/, to: '.joined_at' },
  
  // Ingredient相关
  { from: /\.minStock(?![a-zA-Z0-9_])/, to: '.min_stock' },
  { from: /\.lastRestocked(?![a-zA-Z0-9_])/, to: '.last_restocked' },
  
  // Order相关
  { from: /\.totalAmount(?![a-zA-Z0-9_])/, to: '.total_amount' },
  { from: /\.paymentMethod(?![a-zA-Z0-9_])/, to: '.payment_method' },
  { from: /\.createdAt(?![a-zA-Z0-9_])/, to: '.created_at' },
  
  // Dish相关
  { from: /\.nameEn(?![a-zA-Z0-9_])/, to: '.name_en' },
  { from: /\.isAvailable(?![a-zA-Z0-9_])/, to: '.is_available' },
  { from: /\.isRecommended(?![a-zA-Z0-9_])/, to: '.is_recommended' },
  { from: /\.imageUrl(?![a-zA-Z0-9_])/, to: '.image_url' },
  
  // Category相关
  { from: /\.parentId(?![a-zA-Z0-9_])/, to: '.parent_id' },
  { from: /\.displayOrder(?![a-zA-Z0-9_])/, to: '.display_order' },
  { from: /\.isActive(?![a-zA-Z0-9_])/, to: '.is_active' },
  
  // PaymentMethodConfig相关
  { from: /\.sortOrder(?![a-zA-Z0-9_])/, to: '.sort_order' },
  { from: /\.currencySymbol(?![a-zA-Z0-9_])/, to: '.currency_symbol' },
  { from: /\.exchangeRate(?![a-zA-Z0-9_])/, to: '.exchange_rate' },
  { from: /\.paymentType(?![a-zA-Z0-9_])/, to: '.payment_type' },
  { from: /\.qrUrl(?![a-zA-Z0-9_])/, to: '.qr_url' },
  { from: /\.walletAddress(?![a-zA-Z0-9_])/, to: '.wallet_address' },
  
  // User相关
  { from: /\.partnerId(?![a-zA-Z0-9_])/, to: '.partner_id' },
  { from: /\.modulePermissions(?![a-zA-Z0-9_])/, to: '.module_permissions' }
];

// 需要处理的文件列表
const targetFiles = [
  'src/components/CommandCenter.tsx',
  'src/components/Dashboard.tsx', 
  'src/components/FinanceManagement.tsx',
  'src/components/GuestOrder.tsx',
  'src/components/ImageLibrary.tsx',
  'src/components/InventoryManagement.tsx',
  'src/components/MenuManagement.tsx',
  'src/components/PartnerManagement.tsx',
  'src/components/PaymentManagement.tsx',
  'src/components/RoomGrid.tsx',
  'src/components/StaffManagement.tsx',
  'src/components/SystemSettings.tsx',
  'src/services/api.ts'
];

console.log('🔧 开始批量修复命名规范问题...');
console.log('=====================================');

let totalChanges = 0;

targetFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let fileChanges = 0;
    
    // 应用所有命名转换
    namingConversions.forEach(conversion => {
      const matches = content.match(conversion.from);
      if (matches) {
        content = content.replace(conversion.from, conversion.to);
        fileChanges += matches.length;
      }
    });
    
    // 如果有变化则写入文件
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath}: 修复了 ${fileChanges} 处命名问题`);
      totalChanges += fileChanges;
    } else {
      console.log(`➖ ${filePath}: 无需修改`);
    }
    
  } catch (error) {
    console.error(`❌ 处理文件 ${filePath} 时出错:`, error.message);
  }
});

console.log('=====================================');
console.log(`🎉 批量修复完成！总共修复了 ${totalChanges} 处命名规范问题。`);

// 验证修复效果
console.log('\n🔍 验证修复效果...');
try {
  // 简单测试几个关键文件是否还存在明显的命名问题
  const testFile = 'src/services/api.ts';
  const testPath = path.join(__dirname, testFile);
  if (fs.existsSync(testPath)) {
    const content = fs.readFileSync(testPath, 'utf8');
    const remainingIssues = [];
    
    // 检查是否还有明显的camelCase属性
    const camelCasePatterns = [
      /\.hotelName(?![a-zA-Z0-9_])/,
      /\.autoPrintOrder(?![a-zA-Z0-9_])/,
      /\.fontFamily(?![a-zA-Z0-9_])/
    ];
    
    camelCasePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        remainingIssues.push(pattern.toString());
      }
    });
    
    if (remainingIssues.length > 0) {
      console.log(`⚠️  发现 ${remainingIssues.length} 个可能残留的命名问题:`);
      remainingIssues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ 命名规范修复验证通过！');
    }
  }
} catch (error) {
  console.error('验证过程中出现错误:', error.message);
}