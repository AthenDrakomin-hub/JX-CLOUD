#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

console.log('🔍 检查项目中的多重React实例...\n');

// 检查node_modules中的React实例
const nodeModulesPath = path.join(process.cwd(), 'node_modules');

// 检查主要的React相关包
const reactPackages = [
  'react',
  'react-dom',
  'scheduler',
  '@types/react',
  '@types/react-dom'
];

console.log('📋 检查主要React相关包:');
for (const pkg of reactPackages) {
  const pkgPath = path.join(nodeModulesPath, pkg, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`   ${pkg}: v${pkgJson.version}`);
  } else {
    console.log(`   ${pkg}: ❌ 未找到`);
  }
}

// 检查是否存在嵌套的React实例
console.log('\n🔍 搜索嵌套的React实例...');

function searchNestedReact(dir: string, depth = 0): string[] {
  if (depth > 3) return []; // 限制搜索深度
  
  const results: string[] = [];
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item === 'react' && fs.existsSync(path.join(fullPath, 'package.json'))) {
          results.push(fullPath);
        } else if (item !== 'node_modules') {
          results.push(...searchNestedReact(fullPath, depth + 1));
        }
      }
    }
  }
  
  return results;
}

const nestedReactPaths = searchNestedReact(nodeModulesPath);
if (nestedReactPaths.length > 0) {
  console.log('⚠️  发现嵌套的React实例:');
  nestedReactPaths.forEach(p => console.log(`   ${p}`));
} else {
  console.log('✅ 未发现嵌套的React实例');
}

// 检查package.json中的版本冲突
console.log('\n📦 检查package.json中的版本规范...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const declaredVersions = {
  react: packageJson.dependencies?.react || packageJson.devDependencies?.react,
  reactDom: packageJson.dependencies?.['react-dom'] || packageJson.devDependencies?.['react-dom']
};

console.log(`   package.json中声明的React版本:`);
console.log(`     react: ${declaredVersions.react}`);
console.log(`     react-dom: ${declaredVersions.reactDom}`);

// 检查冲突的可能性
console.log('\n⚠️  检查可能的冲突...');
const actualReactVersion = '19.2.3'; // 从npm list中获取的实际版本
const declaredReactVersion = declaredVersions.react;

if (declaredReactVersion && !declaredReactVersion.includes(actualReactVersion.split('.')[0])) {
  console.log(`   ❌ React版本不匹配! 声明: ${declaredReactVersion}, 实际: ${actualReactVersion}`);
} else {
  console.log(`   ✅ React版本兼容`);
}

// 检查Vite配置中的手动分包配置
console.log('\n🔧 检查Vite配置中的分包策略...');
const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  if (viteConfig.includes('manualChunks')) {
    console.log('   ⚠️  发现manualChunks配置，可能存在React分割问题');
    console.log('   在vite.config.ts:80-88行，React相关包被分割到了不同chunk中');
  } else {
    console.log('   ✅ 未发现manualChunks配置问题');
  }
}

console.log('\n📋 建议解决方案:');
console.log('   1. 运行 `npm dedupe` 来减少重复依赖');
console.log('   2. 如果仍有冲突，考虑在vite.config.ts中添加React别名:');
console.log('      resolve: {');
console.log('        alias: {');
console.log('          ...existingAliases,');
console.log('          "react": path.resolve(__dirname, "node_modules/react"),');
console.log('          "react-dom": path.resolve(__dirname, "node_modules/react-dom"),');
console.log('        },');
console.log('      },');
console.log('   3. 或者在package.json中使用overrides字段强制统一版本');