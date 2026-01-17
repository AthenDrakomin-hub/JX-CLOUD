#!/usr/bin/env node

/**
 * Database Import Checker and Fixer (Project-specific version)
 * Detects illegal database imports in frontend files within the current project
 */

const fs = require('fs');
const path = require('path');

// Common patterns that indicate illegal database imports
const ILLEGAL_IMPORT_PATTERNS = [
  /import\s*{\s*db\s*}\s*from\s*['"][^'"]*services[\/\\]db['"]/,
  /import\s*{\s*database\s*}\s*from\s*['"][^'"]*db['"]/,
  /import\s*.+\s*from\s*['"][^'"]*(database|postgres|mysql|pg|sqlite)['"]/,
  /require\s*\(\s*['"][^'"]*services[\/\\]db['"]\s*\)/,
  /import\s*{\s*pool\s*}\s*from\s*['"][^'"]*db['"]/
];

// Files that should never contain database imports
const FRONTEND_FILE_PATTERNS = [
  /\.tsx?$/,
  /\.jsx?$/,
  /\.vue$/,
  /\.svelte$/
];

// Safe API patterns (these are OK to import)
const SAFE_IMPORT_PATTERNS = [
  /import\s*{\s*api\s*}\s*from/,
  /import\s*.+\s*from\s*['"][^'"]*api['"]/
];

// Directories to exclude from scanning
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '__tests__',
  '__mocks__',
  'AppData',
  'Application Data',
  'Cookies',
  'Local Settings',
  'My Documents',
  'NetHood',
  'PrintHood',
  'Recent',
  'SendTo',
  'Templates',
  '「开始」菜单'
];

function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.includes(dirName) || 
         dirName.startsWith('.') || 
         dirName.includes('node_modules') ||
         dirName.includes('AppData');
}

function scanProjectDirectory(dir, results = [], depth = 0) {
  // Limit recursion depth to prevent scanning system directories
  if (depth > 5) return results;
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (!shouldExcludeDir(file)) {
            scanProjectDirectory(filePath, results, depth + 1);
          }
        } else if (FRONTEND_FILE_PATTERNS.some(pattern => pattern.test(file))) {
          // Only include files that are likely part of the current project
          if (filePath.includes(path.basename(process.cwd())) || depth <= 3) {
            results.push(filePath);
          }
        }
      } catch (error) {
        // Skip files we can't access
      }
    });
  } catch (error) {
    // Skip directories we can't access
  }
  
  return results;
}

function checkFileForIllegalImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim() === '') {
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
    // Skip files we can't read
    return [];
  }
}

function main() {
  console.log('🔍 Scanning current project for illegal database imports...\n');
  
  // Only scan the current working directory and immediate subdirectories
  const projectFiles = [];
  const cwd = process.cwd();
  
  // Scan current directory
  try {
    const files = fs.readdirSync(cwd);
    files.forEach(file => {
      const filePath = path.join(cwd, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile() && FRONTEND_FILE_PATTERNS.some(pattern => pattern.test(file))) {
          projectFiles.push(filePath);
        } else if (stat.isDirectory() && !shouldExcludeDir(file)) {
          scanProjectDirectory(filePath, projectFiles, 1);
        }
      } catch (error) {
        // Skip inaccessible files/directories
      }
    });
  } catch (error) {
    console.error('Error scanning current directory:', error.message);
    return;
  }
  
  console.log(`Found ${projectFiles.length} project files to check\n`);
  
  if (projectFiles.length === 0) {
    console.log('ℹ️  No frontend files found in current project directory.');
    console.log('Make sure you are in the correct project folder.');
    return;
  }
  
  let totalIssues = 0;
  
  projectFiles.forEach(filePath => {
    const issues = checkFileForIllegalImports(filePath);
    if (issues.length > 0) {
      console.log(`❌ Issues found in ${path.relative(cwd, filePath)}:`);
      issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.content}`);
        totalIssues++;
      });
      console.log('');
    }
  });
  
  if (totalIssues === 0) {
    console.log('✅ No illegal database imports found in your project!');
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

module.exports = { checkFileForIllegalImports, scanProjectDirectory };