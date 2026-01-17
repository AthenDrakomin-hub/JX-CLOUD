#!/usr/bin/env node

/**
 * Smart Database Import Checker
 * Distinguishes between legitimate backend scripts and problematic frontend imports
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate PROBLEMATIC frontend imports
const PROBLEMATIC_FRONTEND_PATTERNS = [
  // React/Vue component files importing db directly
  { pattern: /import\s*{\s*db\s*}\s*from\s*['"][^'"]*services[\/\\]db['"]/, context: 'component' },
  { pattern: /import\s*{\s*database\s*}\s*from\s*['"][^'"]*db['"]/, context: 'component' },
  // Frontend files importing postgres/mysql drivers directly
  { pattern: /import\s*.+\s*from\s*['"][^'"]*(postgres|mysql|pg|sqlite)['"]/, context: 'frontend' },
  { pattern: /require\s*\(\s*['"][^'"]*services[\/\\]db['"]\s*\)/, context: 'component' }
];

// Patterns that are LEGITIMATE backend/service imports
const LEGITIMATE_BACKEND_PATTERNS = [
  // Backend service files
  { pattern: /import.+from.+services[\/\\]db/, fileTypes: ['server.ts', 'service.ts', 'script.ts'] },
  // Database connection files
  { pattern: /import.+from.+database/, fileTypes: ['db.', 'database.'] },
  // Migration/seeding scripts
  { pattern: /import.+Pool.+from.+pg/, fileTypes: ['script.', 'migration.', 'seed.'] }
];

// Truly frontend file patterns
const TRUE_FRONTEND_FILES = [
  /components[\/\\].+\.(tsx|jsx)$/,
  /pages[\/\\].+\.(tsx|jsx)$/,
  /views[\/\\].+\.(tsx|jsx)$/,
  /src[\/\\].+\.(tsx|jsx)$/,
  /[A-Z][a-zA-Z]*\.(tsx|jsx)$/  // Component files typically start with uppercase
];

function getFileContext(filePath) {
  const fileName = path.basename(filePath).toLowerCase();
  const dirPath = filePath.toLowerCase();
  
  // Check if it's clearly a frontend component
  if (TRUE_FRONTEND_FILES.some(pattern => pattern.test(filePath))) {
    return 'frontend-component';
  }
  
  // Check if it's a backend script/service
  if (fileName.includes('script') || 
      fileName.includes('service') || 
      fileName.includes('server') ||
      fileName.includes('migration') ||
      fileName.includes('seed') ||
      dirPath.includes('backend') ||
      dirPath.includes('server') ||
      dirPath.includes('api')) {
    return 'backend-script';
  }
  
  // Check if it's in a components directory
  if (dirPath.includes('component') || dirPath.includes('page') || dirPath.includes('view')) {
    return 'frontend-component';
  }
  
  return 'unknown';
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileContext = getFileContext(filePath);
    const issues = [];
    
    lines.forEach((line, index) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim() === '') {
        return;
      }
      
      // Check for problematic patterns in frontend contexts
      for (const { pattern, context } of PROBLEMATIC_FRONTEND_PATTERNS) {
        if (pattern.test(line)) {
          // Only flag as issue if it's in a frontend context
          if (fileContext === 'frontend-component' || context === 'component') {
            issues.push({
              line: index + 1,
              content: line.trim(),
              filePath: filePath,
              type: 'PROBLEMATIC',
              reason: 'Frontend component importing database directly'
            });
          }
        }
      }
      
      // Check for legitimate backend patterns (these are OK)
      for (const { pattern, fileTypes } of LEGITIMATE_BACKEND_PATTERNS) {
        if (pattern.test(line)) {
          const isLegitimate = fileTypes.some(type => 
            filePath.toLowerCase().includes(type.replace('.', ''))
          );
          if (isLegitimate) {
            // This is a legitimate backend import, not an issue
            return;
          }
        }
      }
    });
    
    return issues;
  } catch (error) {
    return [];
  }
}

function main() {
  console.log('🔍 Smart scanning for problematic database imports...\n');
  
  const cwd = process.cwd();
  const allFiles = [];
  
  // Find TypeScript/JavaScript files in reasonable project structure
  function findProjectFiles(dir, depth = 0) {
    if (depth > 4) return; // Limit depth
    
    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // Skip common non-project directories
            const skipDirs = ['node_modules', '.git', 'dist', 'build', 'AppData', 'Downloads'];
            if (!skipDirs.includes(file) && !file.startsWith('.')) {
              findProjectFiles(filePath, depth + 1);
            }
          } else if (/\.(tsx|jsx|ts|js)$/.test(file)) {
            // Only include files that seem to be part of a project
            if (depth <= 3 || filePath.includes('src') || filePath.includes('components')) {
              allFiles.push(filePath);
            }
          }
        } catch (error) {
          // Skip inaccessible files
        }
      });
    } catch (error) {
      // Skip inaccessible directories
    }
  }
  
  findProjectFiles(cwd);
  
  console.log(`Analyzing ${allFiles.length} files...\n`);
  
  let realIssues = [];
  let legitimateImports = 0;
  
  allFiles.forEach(filePath => {
    const issues = checkFile(filePath);
    if (issues.length > 0) {
      realIssues.push(...issues);
    } else {
      // Check if this file has legitimate backend imports
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('import') && (
          content.includes('services/db') || 
          content.includes('database') ||
          content.includes('pg') ||
          content.includes('postgres')
        )) {
          const context = getFileContext(filePath);
          if (context === 'backend-script') {
            legitimateImports++;
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }
  });
  
  // Display results
  if (realIssues.length > 0) {
    console.log('🚨 PROBLEMATIC IMPORTS FOUND:\n');
    const groupedIssues = {};
    
    realIssues.forEach(issue => {
      const relativePath = path.relative(cwd, issue.filePath);
      if (!groupedIssues[relativePath]) {
        groupedIssues[relativePath] = [];
      }
      groupedIssues[relativePath].push(issue);
    });
    
    Object.entries(groupedIssues).forEach(([filePath, issues]) => {
      console.log(`📁 ${filePath}:`);
      issues.forEach(issue => {
        console.log(`   ⚠️  Line ${issue.line}: ${issue.content}`);
        console.log(`      Reason: ${issue.reason}`);
      });
      console.log('');
    });
    
    console.log(`\n🔧 FIX RECOMMENDATIONS (${realIssues.length} issues):\n`);
    console.log('1. Move database logic to API endpoints');
    console.log('2. Replace direct DB imports with API calls');
    console.log('3. Use fetch/axios for frontend-backend communication\n');
    
    console.log('Example transformation:');
    console.log('// ❌ BEFORE (Problematic)');
    console.log('// import { db } from \'../services/db\'');
    console.log('// const data = await db.query(\'SELECT *\')');
    console.log('//');
    console.log('// ✅ AFTER (Correct)');
    console.log('// import { api } from \'../api\'');
    console.log('// const data = await api.getData()');
    
  } else {
    console.log('✅ No problematic frontend database imports found!');
    if (legitimateImports > 0) {
      console.log(`✅ Found ${legitimateImports} legitimate backend imports (these are OK)`);
    }
    console.log('\n🎉 Your project structure looks good!');
  }
}

if (require.main === module) {
  main();
}