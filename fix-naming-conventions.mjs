import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义命名映射规则 (camelCase -> snake_case)
const namingMap = {
  // SystemConfig 相关
  'hotelName': 'hotel_name',
  'autoPrintOrder': 'auto_print_order',
  'ticketStyle': 'ticket_style',
  'fontFamily': 'font_family',
  
  // Partner 相关
  'ownerName': 'owner_name',
  'commissionRate': 'commission_rate',
  'authorizedCategories': 'authorized_categories',
  'totalSales': 'total_sales',
  'joinedAt': 'joined_at',
  
  // Ingredient 相关
  'minStock': 'min_stock',
  'lastRestocked': 'last_restocked',
  
  // Order 相关
  'totalAmount': 'total_amount',
  'paymentMethod': 'payment_method',
  'createdAt': 'created_at',
  'tableId': 'room_id', // 注意：这里可能是 tableId -> room_id
  
  // Dish 相关
  'nameEn': 'name_en',
  'isAvailable': 'is_available',
  'isRecommended': 'is_recommended',
  'imageUrl': 'image_url',
  
  // Category 相关
  'parentId': 'parent_id',
  'displayOrder': 'display_order',
  'isActive': 'is_active',
  
  // PaymentMethodConfig 相关
  'nameEn': 'name_en',
  'isActive': 'is_active',
  'sortOrder': 'sort_order',
  'currencySymbol': 'currency_symbol',
  'exchangeRate': 'exchange_rate',
  'paymentType': 'payment_type',
  'qrUrl': 'qr_url',
  'walletAddress': 'wallet_address',
  
  // User 相关
  'partnerId': 'partner_id',
  'modulePermissions': 'module_permissions'
};

// 需要特殊处理的文件列表
const filesToProcess = [
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

// 处理单个文件
function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changesMade = false;
  
  // 应用所有命名转换
  Object.entries(namingMap).forEach(([camelCase, snakeCase]) => {
    const camelRegex = new RegExp(`\\.(${camelCase})(?![a-zA-Z0-9_])`, 'g');
    const stringRegex = new RegExp(`(['"\`])${camelCase}\\1`, 'g');
    const objectKeyRegex = new RegExp(`(["'])${camelCase}\\1\\s*:`, 'g');
    
    if (content.includes(camelCase)) {
      // 处理对象属性访问 .property
      content = content.replace(camelRegex, `.${snakeCase}`);
      
      // 处理字符串字面量中的属性名
      content = content.replace(stringRegex, `$1${snakeCase}$1`);
      
      // 处理对象键名 property:
      content = content.replace(objectKeyRegex, `$1${snakeCase}$1:`);
      
      if (content !== originalContent) {
        changesMade = true;
        console.log(`  Fixed ${camelCase} -> ${snakeCase} in ${path.basename(filePath)}`);
        originalContent = content;
      }
    }
  });
  
  if (changesMade) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Processed: ${filePath}`);
  } else {
    console.log(`- No changes needed: ${filePath}`);
  }
}

// 主处理函数
console.log('🚀 Starting batch naming convention fix...');
console.log('==========================================');

filesToProcess.forEach(filePath => {
  try {
    processFile(filePath);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n✅ Batch naming convention fix completed!');