import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要修复的脚本文件
const scriptFiles = [
  'scripts/check-duplicate-passkey-tables.ts',
  'scripts/check-translations-table.ts',
  'scripts/create-auth-tables-step-by-step.ts',
  'scripts/execute-auth-tables-creation.ts',
  'scripts/insert-initial-translations.ts',
  'scripts/remove-duplicate-passkey-table.ts',
  'scripts/test-auth-endpoints.ts',
  'scripts/test-translations-connection.ts',
  'scripts/validate-production-db.ts',
  'scripts/verify-passkey-cleanup.ts',
  'scripts/verify-translations-table.ts'
];

// 数据库连接修复模式
const dbConnectionFixes = [
  {
    // 修复 postgres() 调用中的环境变量处理
    pattern: /postgres\(process\.env\.DATABASE_URL\)/g,
    replacement: "postgres(process.env.DATABASE_URL || '')"
  },
  {
    // 修复可能的 undefined 环境变量
    pattern: /postgres\(process\.env\.([A-Z_]+)\)/g,
    replacement: "postgres(process.env.$1 || '')"
  }
];

console.log('🔧 开始修复脚本文件数据库连接问题...');
console.log('========================================');

let totalFixes = 0;

scriptFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  脚本文件不存在: ${filePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let fileFixes = 0;
    
    // 应用数据库连接修复
    dbConnectionFixes.forEach(fix => {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern, fix.replacement);
        fileFixes += matches.length;
      }
    });
    
    // 如果有变化则写入文件
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${filePath}: 修复了 ${fileFixes} 处数据库连接问题`);
      totalFixes += fileFixes;
    } else {
      console.log(`➖ ${filePath}: 无需修改`);
    }
    
  } catch (error) {
    console.error(`❌ 处理脚本文件 ${filePath} 时出错:`, error.message);
  }
});

console.log('========================================');
console.log(`🎉 脚本文件修复完成！总共修复了 ${totalFixes} 处数据库连接问题。`);

// 额外修复：处理 schema.ts 导入问题
console.log('\n🔧 处理 schema.ts 导入问题...');

const dbMigratePath = path.join(__dirname, 'scripts/db-migrate.ts');
if (fs.existsSync(dbMigratePath)) {
  let content = fs.readFileSync(dbMigratePath, 'utf8');
  
  // 修复 passkey -> passkeys 的导入
  if (content.includes('passkey')) {
    content = content.replace(/\bpasskey\b/g, 'passkeys');
    console.log('✅ 修复了 passkey -> passkeys 导入问题');
  }
  
  // 移除不存在的 translations 导入
  if (content.includes('translations')) {
    content = content.replace(/,\s*translations\s*/g, '');
    content = content.replace(/translations,\s*/g, '');
    console.log('✅ 移除了不存在的 translations 导入');
  }
  
  fs.writeFileSync(dbMigratePath, content, 'utf8');
}

console.log('✅ Schema 导入问题修复完成！');