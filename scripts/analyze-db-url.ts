import 'dotenv/config';

console.log('=== DATABASE_URL 详细分析 ===');
const dbUrl = process.env.DATABASE_URL;
console.log('完整连接字符串:');
console.log(dbUrl);
console.log('');

// 解析各个部分
try {
  const url = new URL(dbUrl);
  console.log('协议:', url.protocol);
  console.log('主机名:', url.hostname);
  console.log('端口:', url.port);
  console.log('用户名:', url.username);
  console.log('密码长度:', url.password?.length || 0);
  console.log('路径:', url.pathname);
  console.log('查询参数:', url.search);
  
  // 检查必要参数
  console.log('\n=== 必要配置检查 ===');
  console.log('包含 sslmode=require:', dbUrl.includes('sslmode=require'));
  console.log('端口是 6543:', url.port === '6543');
  console.log('端口是 5432:', url.port === '5432');
  
  // 构造修正版本
  console.log('\n=== 建议的修正版本 ===');
  const correctedUrl = new URL(dbUrl);
  correctedUrl.port = '6543'; // 强制使用连接池端口
  if (!dbUrl.includes('sslmode=require')) {
    correctedUrl.searchParams.set('sslmode', 'require');
  }
  console.log('修正后的连接字符串:');
  console.log(correctedUrl.toString());
  
} catch (e) {
  console.log('URL 解析失败:', e.message);
}