#!/usr/bin/env node

/**
 * Database Import Checker and Fixer
 * Detects illegal database imports in frontend files and suggests fixes
 */

const fs = require('fs');
const path = require('path');

// Common patterns that indicate illegal database imports
const ILLEGAL_IMPORT_PATTERNS = [
  /import\s*{\s*db\s*}\s*from\s*['"][^'"]*services\/db['"]/,
  /import\s*{\s*database\s*}\s*from\s*['"][^'"]*db['"]/,
  /import\s*.+\s*from\s*['"][^'"]*(database|db|postgres|mysql|sqlite)['"]/,
  /require\s*\(\s*['"][^'"]*services\/db['"]\s*\)/
];

// Files that should never contain database imports
const FRONTEND_FILE_PATTERNS = [
  /\.tsx?$/,
  /\.jsx?$/,
  /\.vue$/
];

// Safe API patterns (these are OK to import)
const SAFE_IMPORT_PATTERNS = [
  /import\s*{\s*api\s*}\s*from/,
  /import\s*.+\s*from\s*['"][^'"]*api['"]/
];

function scanDirectory(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
          scanDirectory(filePath, results);
        }
      } else if (FRONTEND_FILE_PATTERNS.some(pattern => pattern.test(file))) {
        results.push(filePath);
      }
    });
  } catch (error) {
    console.warn(`Could not scan directory ${dir}:`, error.message);
  }
  
  return results;
}

function checkFileForIllegalImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
        return;
      }
      
      // Check for illegal patterns
      for (const pattern of ILLEGAL_IMPORT_PATTERNS) {
        if (pattern.test(line)) {
          // Make sure it's not a safe import
          const isSafe = SAFE_IMPORT_PATTERNS.some(safePattern => safePattern.test(line));
          if (!isSafe) {
            issues.push({
              line: index + 1,
              content: line.trim(),
              filePath: filePath
            });
          }
        }
      }
    });
    
    return issues;
  } catch (error) {
    console.warn(`Could not read file ${filePath}:`, error.message);
    return [];
  }
}

function main() {
  console.log('🔍 Scanning for illegal database imports...\n');
  
  // Scan current directory and subdirectories
  const frontendFiles = scanDirectory('.');
  let totalIssues = 0;
  
  console.log(`Found ${frontendFiles.length} frontend files to check\n`);
  
  frontendFiles.forEach(filePath => {
    const issues = checkFileForIllegalImports(filePath);
    if (issues.length > 0) {
      console.log(`❌ Issues found in ${filePath}:`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.content}`);
        totalIssues++;
      });
      console.log('');
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ No illegal database imports found!');
    console.log('\n🎉 Your frontend/backend separation looks good!');
  } else {
    console.log(`⚠️  Found ${totalIssues} illegal import(s) that need to be fixed.`);
    console.log('\n🔧 Recommended fixes:');
    console.log('1. Replace direct database imports with API calls');
    console.log('2. Move database logic to backend API endpoints');
    console.log('3. Use fetch() or axios to call your backend APIs');
    console.log('\nExample fix:');
    console.log('// Before:');
    console.log('// import { db } from \'../services/db\'');
    console.log('// const users = await db.query(\'SELECT * FROM users\')');
    console.log('//');
    console.log('// After:');
    console.log('// import { api } from \'../api\'');
    console.log('// const users = await api.getUsers()');
  }
}

// Run the checker
if (require.main === module) {
  main();
}

module.exports = { checkFileForIllegalImports, scanDirectory };