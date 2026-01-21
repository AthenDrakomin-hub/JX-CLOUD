// 快速修复最常见的命名冲突
const fs = require('fs');
const path = require('path');

// 要修复的关键文件
const keyFiles = [
  'src/services/api.ts',
  'src/components/SystemSettings.tsx',
  'src/components/GuestOrder.tsx'
];

// 常见的命名转换
const quickFixes = [
  { from: 'hotelName', to: 'hotel_name' },
  { from: 'autoPrintOrder', to: 'auto_print_order' },
  { from: 'fontFamily', to: 'font_family' },
  { from: 'totalAmount', to: 'total_amount' },
  { from: 'paymentMethod', to: 'payment_method' },
  { from: 'nameEn', to: 'name_en' },
  { from: 'isActive', to: 'is_active' },
  { from: 'sortOrder', to: 'sort_order' }
];

keyFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changes = 0;
    
    quickFixes.forEach(fix => {
      const regex = new RegExp(fix.from, 'g');
      if (content.includes(fix.from)) {
        content = content.replace(regex, fix.to);
        changes++;
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Fixed ${changes} issues in ${file}`);
    }
  }
});

console.log('Quick naming fixes applied!');