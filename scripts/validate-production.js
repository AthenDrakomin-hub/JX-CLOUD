#!/usr/bin/env node

/**
 * 生产环境验证脚本
 * 用于在部署前验证 Vercel + Supabase 环境配置
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 检查 Node.js 版本...');
console.log(`当前版本: ${process.version}`);

// 直接运行tsx命令
const runValidation = () => {
  const tsxProcess = spawn('npx', ['tsx', 'utils/validationRunner.ts'], {
    stdio: 'inherit',
    shell: true, // 在Windows上使用shell
    env: { ...process.env }
  });

  tsxProcess.on('close', (code) => {
    console.log(`\n验证进程退出，代码: ${code}`);
    process.exit(code);
  });

  tsxProcess.on('error', (err) => {
    console.error('❌ 运行验证脚本时出错:', err.message);
    console.log('请确保已安装 tsx: npm install --save-dev tsx');
    process.exit(1);
  });
};

// 如果没有参数，直接运行验证
if (process.argv.length === 2) {
  console.log('🧪 运行生产环境验证...\n');
  runValidation();
} else {
  // 解析命令行参数
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
使用方法: node validate-production.js [options]

选项:
  --help, -h    显示此帮助信息
  --verbose     显示详细输出

示例:
  node validate-production.js          # 运行验证
  node validate-production.js --help   # 显示帮助
    `);
  } else if (args.includes('--verbose')) {
    console.log('🧪 运行详细生产环境验证...\n');
    runValidation();
  } else {
    console.log(`未知参数: ${args.join(', ')}`);
    console.log('使用 --help 查看可用选项');
  }
}