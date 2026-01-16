import 'dotenv/config';

console.log('=== 环境变量诊断 ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');

// 尝试解析 URL
try {
  const url = new URL(process.env.DATABASE_URL || '');
  console.log('Hostname:', url.hostname);
  console.log('Port:', url.port);
  console.log('Protocol:', url.protocol);
} catch (e) {
  console.log('URL parsing error:', e.message);
}