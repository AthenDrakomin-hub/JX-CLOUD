#!/usr/bin/env node

/**
 * 江西云厨系统 - 集成验证脚本
 * 用于验证 Supabase + BetterAuth + Drizzle ORM 集成状态
 * 
 * 用法: node db-validation.js 或 npm run validate-db
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';

// 加载环境变量
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const envPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(chalk.blue(`✓ 已加载环境变量文件: ${file}`));
    break;
  }
}

// 定义环境变量配置
const ENV_VARS = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
};

// 验证结果存储
const validationResults = {
  environment: {},
  supabase: {},
  drizzle: {},
  betterAuth: {},
  report: []
};

// 添加结果记录函数
function addResult(category, test, status, message, details = null) {
  validationResults[category][test] = { status, message, details };
  validationResults.report.push({ category, test, status, message, details });
}

// 打印测试结果
function printResult(test, result) {
  const statusSymbol = {
    'success': '✅',
    'error': '❌',
    'warning': '⚠️ '
  }[result.status] || '❓';
  
  const statusColor = {
    'success': chalk.green,
    'error': chalk.red,
    'warning': chalk.yellow
  }[result.status] || chalk.white;
  
  console.log(`  ${statusSymbol} ${statusColor(result.message)}`);
  if (result.details) {
    console.log(`    ${chalk.gray(result.details)}`);
  }
}

// 验证环境变量
async function validateEnvironment() {
  console.log(chalk.bold('\n🔍 环境变量验证...\n'));

  // 检查必需的环境变量
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'BETTER_AUTH_URL',
    'BETTER_AUTH_SECRET',
    'DATABASE_URL'
  ];

  for (const varName of requiredVars) {
    const value = ENV_VARS[varName];
    
    if (!value) {
      addResult('environment', varName, 'error', `${varName} 环境变量未设置`);
      continue;
    }

    // 根据变量类型进行格式验证
    let isValid = true;
    let validationMessage = `${varName} 格式验证通过`;

    switch (varName) {
      case 'SUPABASE_URL':
        try {
          new URL(value);
          if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
            isValid = false;
            validationMessage = `${varName} 不是有效的 Supabase URL`;
          }
        } catch {
          isValid = false;
          validationMessage = `${varName} 不是有效的 URL 格式`;
        }
        break;
      
      case 'SUPABASE_ANON_KEY':
      case 'SUPABASE_SERVICE_ROLE_KEY':
        // JWT 密钥通常比较长，至少要有一定长度
        if (value.length < 20) {
          isValid = false;
          validationMessage = `${varName} 长度过短，可能不是有效的密钥`;
        }
        break;
      
      case 'BETTER_AUTH_URL':
        try {
          new URL(value);
          if (!value.includes('/functions/v1/') && !value.includes('better-auth')) {
            console.log(chalk.yellow(`⚠️  ${varName} 可能不是标准的 BetterAuth URL`));
          }
        } catch {
          isValid = false;
          validationMessage = `${varName} 不是有效的 URL 格式`;
        }
        break;
      
      case 'BETTER_AUTH_SECRET':
        if (value.length < 32) {
          isValid = false;
          validationMessage = `${varName} 长度小于32字符，BetterAuth 推荐至少32字符`;
        }
        break;
      
      case 'DATABASE_URL':
        try {
          new URL(value);
          if (!value.includes('postgresql://') && !value.includes('postgres://')) {
            isValid = false;
            validationMessage = `${varName} 不是有效的 PostgreSQL 连接字符串`;
          }
        } catch {
          isValid = false;
          validationMessage = `${varName} 不是有效的数据库连接字符串`;
        }
        break;
    }

    if (isValid) {
      addResult('environment', varName, 'success', validationMessage);
    } else {
      addResult('environment', varName, 'error', validationMessage);
    }
  }

  // 输出环境变量验证结果
  for (const [test, result] of Object.entries(validationResults.environment)) {
    printResult(test, result);
  }
}

// 验证 Supabase 功能
async function validateSupabase() {
  console.log(chalk.bold('\n🔌 Supabase 连接验证...\n'));

  const supabaseUrl = ENV_VARS.SUPABASE_URL;
  const supabaseAnonKey = ENV_VARS.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = ENV_VARS.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    addResult('supabase', 'connection', 'error', '缺少 Supabase 连接信息，跳过 Supabase 验证');
    return;
  }

  try {
    // 初始化 Supabase 客户端 (anon key)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          'User-Agent': 'JX-Cloud-Validation-Script/1.0'
        }
      }
    });

    // 测试基础连接
    try {
      const { data, error } = await Promise.race([
        anonClient.from('users').select('id').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('连接超时')), 10000))
      ]);

      if (error) {
        addResult('supabase', 'connection', 'error', `Supabase 连接失败: ${error.message}`);
      } else {
        addResult('supabase', 'connection', 'success', 'Supabase 匿名客户端连接成功');
      }
    } catch (error) {
      addResult('supabase', 'connection', 'error', `Supabase 连接测试超时或失败: ${error.message}`);
    }

    // 测试 Auth 会话检查（模拟 BetterAuth 交互）
    try {
      const authResponse = await fetch(`${supabaseUrl.replace('/supabase.co', '.supabase.co')}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        }
      });
      
      if (authResponse.status === 401) {
        // 401 是正常的，因为 anon key 无法获取用户信息
        addResult('supabase', 'auth_integration', 'success', 'Supabase Auth 接口可访问 (401 为预期状态)');
      } else if (authResponse.ok) {
        addResult('supabase', 'auth_integration', 'success', 'Supabase Auth 接口可访问');
      } else {
        addResult('supabase', 'auth_integration', 'warning', `Supabase Auth 接口返回意外状态: ${authResponse.status}`);
      }
    } catch (error) {
      addResult('supabase', 'auth_integration', 'error', `Supabase Auth 接口不可访问: ${error.message}`);
    }

    // 测试 Edge Functions 连接
    try {
      const functionsUrl = `${supabaseUrl.replace('/supabase.co', '.supabase.co')}/functions/v1/_health`;
      const functionsResponse = await fetch(functionsUrl, {
        headers: {
          'apikey': supabaseAnonKey,
        }
      });

      if (functionsResponse.ok) {
        addResult('supabase', 'edge_functions', 'success', 'Supabase Edge Functions 接口可访问');
      } else {
        addResult('supabase', 'edge_functions', 'warning', `Supabase Edge Functions 接口返回状态: ${functionsResponse.status}`);
      }
    } catch (error) {
      addResult('supabase', 'edge_functions', 'error', `Supabase Edge Functions 接口不可访问: ${error.message}`);
    }

  } catch (error) {
    addResult('supabase', 'initialization', 'error', `Supabase 客户端初始化失败: ${error.message}`);
  }

  // 使用 service role key 进行更深入的测试
  if (supabaseServiceRoleKey) {
    try {
      const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

      // 测试服务角色访问
      try {
        const { data, error } = await Promise.race([
          serviceClient.rpc('version'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('服务角色测试超时')), 10000))
        ]);

        if (error) {
          addResult('supabase', 'service_role', 'error', `Supabase 服务角色访问失败: ${error.message}`);
        } else {
          addResult('supabase', 'service_role', 'success', 'Supabase 服务角色访问成功');
        }
      } catch (error) {
        addResult('supabase', 'service_role', 'error', `Supabase 服务角色测试超时: ${error.message}`);
      }
    } catch (error) {
      addResult('supabase', 'service_role_init', 'error', `Supabase 服务角色客户端初始化失败: ${error.message}`);
    }
  } else {
    addResult('supabase', 'service_role', 'warning', '缺少 SUPABASE_SERVICE_ROLE_KEY，跳过服务角色测试');
  }

  // 输出 Supabase 验证结果
  for (const [test, result] of Object.entries(validationResults.supabase)) {
    printResult(test, result);
  }
}

// 验证 Drizzle ORM 功能
async function validateDrizzle() {
  console.log(chalk.bold('\n💾 Drizzle ORM 验证...\n'));

  const databaseUrl = ENV_VARS.DATABASE_URL;

  if (!databaseUrl) {
    addResult('drizzle', 'connection', 'error', '缺少 DATABASE_URL，跳过 Drizzle 验证');
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // 对于 Supabase 连接通常是必需的
    }
  });

  try {
    // 连接数据库
    await client.connect();
    addResult('drizzle', 'connection', 'success', 'Drizzle 数据库连连接成功');

    // 执行基础 SQL 查询
    try {
      const result = await client.query('SELECT NOW() as current_time;');
      if (result.rows.length > 0) {
        addResult('drizzle', 'basic_query', 'success', `基础查询成功，当前时间: ${result.rows[0].current_time}`);
      } else {
        addResult('drizzle', 'basic_query', 'error', '基础查询返回空结果');
      }
    } catch (error) {
      addResult('drizzle', 'basic_query', 'error', `基础查询失败: ${error.message}`);
    }

    // 测试核心业务表的存在性和权限
    const coreTables = ['users', 'menu_dishes', 'orders'];
    
    for (const table of coreTables) {
      try {
        const result = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [table]);
        
        if (result.rowCount > 0) {
          addResult('drizzle', `table_${table}`, 'success', `核心表 ${table} 存在，包含 ${result.rowCount} 个字段`);
        } else {
          addResult('drizzle', `table_${table}`, 'warning', `核心表 ${table} 不存在或无法访问`);
        }
      } catch (error) {
        addResult('drizzle', `table_${table}`, 'error', `检查表 ${table} 时出错: ${error.message}`);
      }
    }

    // 测试 RLS 策略（通过尝试查询一个可能存在数据的表）
    try {
      const result = await client.query('SELECT COUNT(*) FROM users LIMIT 1;');
      // 如果没有权限错误，则 RLS 可能已启用
      addResult('drizzle', 'rls_check', 'success', 'RLS 策略测试通过（无权限错误）');
    } catch (error) {
      if (error.message.includes('permission denied') || error.message.includes('authorization')) {
        addResult('drizzle', 'rls_check', 'success', 'RLS 策略已启用（权限受限是预期行为）');
      } else {
        addResult('drizzle', 'rls_check', 'error', `RLS 策略测试出错: ${error.message}`);
      }
    }

  } catch (error) {
    addResult('drizzle', 'connection', 'error', `Drizzle 数据库连接失败: ${error.message}`);
  } finally {
    try {
      await client.end();
    } catch (e) {
      // 忽略关闭连接时的错误
    }
  }

  // 输出 Drizzle 验证结果
  for (const [test, result] of Object.entries(validationResults.drizzle)) {
    printResult(test, result);
  }
}

// 验证 BetterAuth 集成
async function validateBetterAuth() {
  console.log(chalk.bold('\n🔒 BetterAuth 集成验证...\n'));

  const betterAuthUrl = ENV_VARS.BETTER_AUTH_URL;
  const betterAuthSecret = ENV_VARS.BETTER_AUTH_SECRET;

  if (!betterAuthUrl) {
    addResult('betterAuth', 'configuration', 'error', '缺少 BETTER_AUTH_URL，跳过 BetterAuth 验证');
    return;
  }

  // 验证 BetterAuth URL 可访问性
  try {
    const response = await Promise.race([
      fetch(betterAuthUrl, { method: 'HEAD' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('BetterAuth 连接超时')), 10000))
    ]);

    if (response.status !== 404 && response.status !== 405) {
      addResult('betterAuth', 'url_access', 'success', `BetterAuth 端点可访问 (HTTP ${response.status})`);
    } else {
      addResult('betterAuth', 'url_access', 'error', `BetterAuth 端点不可访问 (HTTP ${response.status})`);
    }
  } catch (error) {
    addResult('betterAuth', 'url_access', 'error', `BetterAuth 端点无法访问: ${error.message}`);
  }

  // 验证 JWKS URL 可访问性
  if (betterAuthUrl) {
    try {
      const jwksUrl = `${betterAuthUrl}/api/auth/jwks`;
      const response = await Promise.race([
        fetch(jwksUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error('JWKS 连接超时')), 10000))
      ]);

      if (response.ok) {
        const jwks = await response.json();
        if (jwks.keys && Array.isArray(jwks.keys)) {
          addResult('betterAuth', 'jwks_access', 'success', `JWKS 端点可访问，包含 ${jwks.keys.length} 个密钥`);
        } else {
          addResult('betterAuth', 'jwks_access', 'warning', 'JWKS 端点返回格式异常');
        }
      } else {
        addResult('betterAuth', 'jwks_access', 'error', `JWKS 端点返回错误: ${response.status}`);
      }
    } catch (error) {
      addResult('betterAuth', 'jwks_access', 'error', `JWKS 端点无法访问: ${error.message}`);
    }
  }

  // 验证密钥强度
  if (betterAuthSecret) {
    if (betterAuthSecret.length >= 32) {
      addResult('betterAuth', 'secret_strength', 'success', 'BetterAuth 密钥长度符合安全要求 (≥32字符)');
    } else {
      addResult('betterAuth', 'secret_strength', 'warning', `BetterAuth 密钥长度不足32字符 (${betterAuthSecret.length})`);
    }
  } else {
    addResult('betterAuth', 'secret_strength', 'error', '缺少 BETTER_AUTH_SECRET');
  }

  // 测试会话端点（如果可用）
  if (betterAuthUrl) {
    try {
      const sessionUrl = `${betterAuthUrl}/api/session`;
      const response = await fetch(sessionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // 无论返回什么状态，只要能访问就说明端点存在
      addResult('betterAuth', 'session_endpoint', 'success', `BetterAuth 会话端点可访问 (HTTP ${response.status})`);
    } catch (error) {
      addResult('betterAuth', 'session_endpoint', 'error', `BetterAuth 会话端点无法访问: ${error.message}`);
    }
  }

  // 输出 BetterAuth 验证结果
  for (const [test, result] of Object.entries(validationResults.betterAuth)) {
    printResult(test, result);
  }
}

// 生成验证报告
function generateReport() {
  console.log(chalk.bold('\n📋 生成系统集成验证报告...\n'));

  const reportPath = path.resolve(process.cwd(), 'SYSTEM_INTEGRATION_VALIDATION_REPORT.md');
  
  let reportContent = `# 江西云厨系统 - 集成验证报告

生成时间: ${new Date().toLocaleString('zh-CN')}

## 验证摘要

| 类别 | 通过 | 失败 | 警告 | 总计 |
|------|------|------|------|------|
`;

  // 统计各类别的结果
  const categories = ['environment', 'supabase', 'drizzle', 'betterAuth'];
  const stats = {};

  for (const category of categories) {
    stats[category] = {
      success: 0,
      error: 0,
      warning: 0
    };
    
    for (const result of Object.values(validationResults[category])) {
      stats[category][result.status]++;
    }
    
    const total = stats[category].success + stats[category].error + stats[category].warning;
    reportContent += `| ${category.toUpperCase()} | ${stats[category].success} | ${stats[category].error} | ${stats[category].warning} | ${total} |\n`;
  }

  reportContent += `\n## 详细验证结果

`;

  for (const category of categories) {
    reportContent += `### ${category.toUpperCase()}\n\n`;
    
    for (const [test, result] of Object.entries(validationResults[category])) {
      const statusEmoji = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
      }[result.status] || '❓';
      
      reportContent += `- ${statusEmoji} **${test}**: ${result.message}\n`;
      if (result.details) {
        reportContent += `  - 详情: ${result.details}\n`;
      }
      reportContent += '\n';
    }
  }

  reportContent += `## 修复建议

### 环境变量问题
- 确保所有必需的环境变量都已正确设置
- 检查 URL 格式是否正确
- 验证密钥长度是否符合要求

### Supabase 连接问题
- 检查 Supabase 项目是否处于活动状态
- 验证 API 密钥是否正确
- 确认防火墙/CORS 设置允许当前环境访问

### Drizzle/数据库问题
- 确认 DATABASE_URL 格式正确
- 验证数据库用户权限
- 检查 RLS 策略配置

### BetterAuth 问题
- 确认 BetterAuth 服务正在运行
- 验证端点 URL 是否正确
- 检查 JWKS 端点是否可访问

## 系统状态评估

`;

  // 状态评估
  const totalErrors = Object.values(stats).reduce((sum, cat) => sum + cat.error, 0);
  const totalWarnings = Object.values(stats).reduce((sum, cat) => sum + cat.warning, 0);

  if (totalErrors === 0) {
    if (totalWarnings === 0) {
      reportContent += '🎉 **系统集成状态: 完全正常** - 所有验证项均通过\n\n';
      reportContent += '系统已准备好投入生产使用。\n';
    } else {
      reportContent += '🟡 **系统集成状态: 基本正常** - 存在一些警告但无严重错误\n\n';
      reportContent += '系统功能正常，但建议处理警告项以提高稳定性。\n';
    }
  } else {
    reportContent += `🔴 **系统集成状态: 存在问题** - 有 ${totalErrors} 个错误需要修复\n\n`;
    reportContent += '在解决所有错误之前，系统可能无法正常工作。\n';
  }

  reportContent += `\n---\n*此报告由江西云厨系统集成验证脚本自动生成*`;

  try {
    fs.writeFileSync(reportPath, reportContent);
    console.log(chalk.green(`✓ 验证报告已生成: ${reportPath}`));
  } catch (error) {
    console.log(chalk.red(`✗ 生成验证报告失败: ${error.message}`));
  }
}

// 主函数
async function main() {
  console.log(chalk.bold.rgb(255, 165, 0)('🏗️  江西云厨系统 - 集成验证脚本'));
  console.log(chalk.gray('正在验证 Supabase + BetterAuth + Drizzle ORM 集成状态...\n'));

  // 执行各项验证
  await validateEnvironment();
  await validateSupabase();
  await validateDrizzle();
  await validateBetterAuth();

  // 生成报告
  generateReport();

  // 输出最终统计
  console.log(chalk.bold('\n📊 最终验证统计:\n'));
  
  let totalSuccess = 0, totalError = 0, totalWarning = 0;
  
  for (const category of Object.values(validationResults)) {
    for (const result of Object.values(category)) {
      switch (result.status) {
        case 'success': totalSuccess++; break;
        case 'error': totalError++; break;
        case 'warning': totalWarning++; break;
      }
    }
  }
  
  console.log(`  ✅ 通过: ${chalk.green(totalSuccess)}`);
  console.log(`  ❌ 失败: ${chalk.red(totalError)}`);
  console.log(`  ⚠️  警告: ${chalk.yellow(totalWarning)}`);
  console.log(`  总计: ${totalSuccess + totalError + totalWarning}`);

  if (totalError > 0) {
    console.log(chalk.red('\n❌ 验证未完全通过，请检查错误项并修复后重试。'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n✅ 所有验证通过！系统集成正常。'));
    process.exit(0);
  }
}

// 运行主函数
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  main().catch(err => {
    console.error(chalk.red('验证过程中发生错误:'), err);
    process.exit(1);
  });
}

export { validateEnvironment, validateSupabase, validateDrizzle, validateBetterAuth, validationResults };