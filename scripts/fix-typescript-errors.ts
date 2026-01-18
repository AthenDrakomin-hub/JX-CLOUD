// 修复 init-users.ts 中的 updated_at 属性错误
import { writeFile, readFile } from 'fs/promises';

async function fixInitUsers() {
  const filePath = './scripts/init-users.ts';
  let content = await readFile(filePath, 'utf-8');
  
  // 将 updated_at 替换为 updatedAt
  content = content.replace(/updated_at/g, 'updatedAt');
  
  await writeFile(filePath, content);
  console.log('✅ Fixed init-users.ts - replaced updated_at with updatedAt');
}

async function fixCheckPasskeysTable() {
  const filePath = './scripts/check-passkeys-table.ts';
  let content = await readFile(filePath, 'utf-8');
  
  // 修复导入路径
  content = content.replace(
    "import { db } from './src/services/db.server.js';", 
    "import { db } from '../src/services/db.server.js';"
  );
  
  await writeFile(filePath, content);
  console.log('✅ Fixed check-passkeys-table.ts - corrected import path');
}

async function main() {
  try {
    await fixInitUsers();
    await fixCheckPasskeysTable();
    console.log('🎉 All script fixes applied!');
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

main();