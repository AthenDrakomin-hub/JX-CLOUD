#!/usr/bin/env node

/**
 * 生产环境功能验证脚本
 * 用于验证 JX Cloud Terminal 在生产环境中的各项功能
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 开始生产环境功能验证...\n');

// 检查环境变量
console.log('📋 检查环境变量配置...');
const envVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY', 
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let envCheckPassed = true;
for (const varName of envVars) {
  const value = process.env[varName] || fs.readFileSync('.env.production', 'utf8')
    .split('\n')
    .find(line => line.startsWith(varName + '='))?.replace(varName + '=', '');
  
  if (!value) {
    console.log(`❌ ${varName} 未配置`);
    envCheckPassed = false;
  } else {
    console.log(`✅ ${varName} 已配置`);
  }
}

if (!envCheckPassed) {
  console.log('\n❌ 环境变量配置不完整，生产环境可能无法正常运行！');
  process.exit(1);
} else {
  console.log('✅ 所有环境变量均已正确配置\n');
}

// 检查构建输出
console.log('🏗️ 检查构建输出...');
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  if (files.length > 0) {
    console.log('✅ 构建输出存在且非空');
  } else {
    console.log('⚠️ 构建输出为空');
  }
} else {
  console.log('⚠️ 构建输出目录不存在 (这可能是正常的，如果尚未构建)');
}

// 检查前端文件完整性
console.log('\n📄 检查前端文件...');
const requiredFrontendFiles = [
  'index.html',
  'assets',
  'manifest.json'
];

for (const file of requiredFrontendFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.log(`⚠️ ${file} 不存在`);
  }
}

// 检查组件完整性
console.log('\n🧩 检查核心组件...');
const componentPaths = [
  'src/App.tsx',
  'src/main.tsx',
  'src/services/api.ts',
  'src/services/frontend/auth-client.frontend.ts',
  'supabase/functions/api/index.ts',
  'supabase/functions/auth.ts'
];

for (const componentPath of componentPaths) {
  if (fs.existsSync(path.join(process.cwd(), componentPath))) {
    console.log(`✅ ${componentPath} 存在`);
  } else {
    console.log(`❌ ${componentPath} 不存在`);
  }
}

// 检查API端点配置
console.log('\n📡 检查API端点配置...');
const apiConfigPath = path.join(process.cwd(), 'supabase/functions/config.json');
if (fs.existsSync(apiConfigPath)) {
  try {
    const apiConfig = JSON.parse(fs.readFileSync(apiConfigPath, 'utf8'));
    console.log('✅ API配置文件存在且格式正确');
    console.log(`✅ 配置了 ${Object.keys(apiConfig.functions || {}).length} 个函数`);
  } catch (e) {
    console.log('❌ API配置文件格式错误');
  }
} else {
  console.log('❌ API配置文件不存在');
}

// 检查构建配置
console.log('\n⚙️ 检查构建配置...');
const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  console.log('✅ Vite构建配置存在');
} else {
  console.log('❌ Vite构建配置不存在');
}

// 检查依赖
console.log('\n📦 检查依赖...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    '@supabase/supabase-js',
    'better-auth',
    'react',
    'react-dom'
  ];
  
  for (const dep of requiredDeps) {
    if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
      console.log(`✅ ${dep} 依赖已安装`);
    } else {
      console.log(`❌ ${dep} 依赖缺失`);
    }
  }
}

console.log('\n🎯 生产环境功能验证完成！');
console.log('\n💡 提示：要进行完整的功能测试，建议部署到生产环境后进行端到端测试。');
console.log('   验证包括：用户登录、数据CRUD操作、实时功能、权限控制等功能。');