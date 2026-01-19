console.log('🔍 检查 Better-Auth 必需的环境变量...');

const requiredEnvVars = [
  'BETTER_AUTH_SECRET',
  'VITE_BETTER_AUTH_URL',
  'DATABASE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const missingVars = [];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: 未设置`);
  } else {
    console.log(`✅ ${varName}: 已设置 (${value.substring(0, 20)}...)`);
  }
});

if (missingVars.length > 0) {
  console.log(`\n🚨 缺少 ${missingVars.length} 个必需的环境变量:`);
  missingVars.forEach(varName => console.log(`  • ${varName}`));
  console.log('\n请在 Vercel 项目设置中添加这些环境变量');
} else {
  console.log('\n🎉 所有必需的环境变量都已设置');
}

// 测试 Better-Auth 密钥长度
const secret = process.env.BETTER_AUTH_SECRET;
if (secret && secret.length < 32) {
  console.log(`⚠️  BETTER_AUTH_SECRET 长度不足 (当前: ${secret.length} 字符，建议至少 32 字符)`);
} else if (secret) {
  console.log(`✅ BETTER_AUTH_SECRET 长度合适 (${secret.length} 字符)`);
}