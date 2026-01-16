import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// 读取当前 .env 文件
const envPath = path.join(__dirname, '../.env');
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('=== 当前 DATABASE_URL ===');
console.log(process.env.DATABASE_URL);

// 解析并修正 URL
const currentUrl = new URL(process.env.DATABASE_URL);
currentUrl.port = '6543'; // 改为连接池端口
currentUrl.searchParams.set('sslmode', 'require'); // 添加 SSL 要求

const correctedUrl = currentUrl.toString();
console.log('\n=== 修正后的 DATABASE_URL ===');
console.log(correctedUrl);

// 更新 .env 文件
const escapedUrl = correctedUrl.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
const newEnvContent = envContent.replace(
  /DATABASE_URL=.*/,
  `DATABASE_URL=${escapedUrl}`
);

fs.writeFileSync(envPath, newEnvContent);
console.log('\n✅ .env 文件已更新');

// 验证更新
console.log('\n=== 验证更新结果 ===');
const updatedEnv = require('dotenv').config({ path: envPath });
console.log('更新后的 DATABASE_URL:');
console.log(updatedEnv.parsed?.DATABASE_URL);