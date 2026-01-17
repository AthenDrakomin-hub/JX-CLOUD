#!/usr/bin/env node

/**
 * Targeted Vite Illegal Import Fixer
 * Focuses only on files that are likely part of the current development project
 */

const fs = require('fs');
const path = require('path');

// Only check these specific file types that are likely to be project files
const PROJECT_FILE_PATTERNS = [
  'App.tsx',
  'main.tsx', 
  'index.tsx',
  'App.jsx',
  'main.jsx',
  'index.jsx'
];

// Component directory patterns
const COMPONENT_DIRS = [
  'src/components',
  'src/pages', 
  'src/views',
  'components',
  'pages',
  'views'
];

// Clear indicators of project files vs system files
function isLikelyProjectFile(filePath) {
  const fullPath = path.resolve(filePath);
  const fileName = path.basename(filePath);
  const dirPath = path.dirname(filePath).toLowerCase();
  
  // Check for project indicators
  const hasProjectIndicator = 
    PROJECT_FILE_PATTERNS.includes(fileName) ||
    COMPONENT_DIRS.some(dir => dirPath.includes(dir)) ||
    fullPath.includes('src' + path.sep) ||
    fullPath.includes('client' + path.sep) ||
    fullPath.includes('frontend' + path.sep);
  
  // Check for system directory indicators (exclude these)
  const isSystemFile = 
    dirPath.includes('node_modules') ||
    dirPath.includes('appdata') ||
    dirPath.includes('program files') ||
    dirPath.includes('windows') ||
    dirPath.includes('users') && !fullPath.includes(process.cwd());
  
  return hasProjectIndicator && !isSystemFile;
}

// Only the most problematic patterns for Vite
const VITE_CRITICAL_PATTERNS = [
  {
    pattern: /import\s*{\s*db\s*}\s*from\s*['"][^'"]*services[\/\\]db['"]/,
    description: 'Direct database import in frontend component'
  },
  {
    pattern: /import\s*.*\s*from\s*['"][^'"]*(pg|postgres|mysql)['"]/,
    description: 'Database driver import in frontend'
  }
];

function checkCurrentProject() {
  const cwd = process.cwd();
  const issues = [];
  
  console.log(`🔍 Checking current project: ${cwd}\n`);
  
  // Look for common project structures
  const searchPaths = [
    cwd,
    path.join(cwd, 'src'),
    path.join(cwd, 'client'),
    path.join(cwd, 'frontend'),
    path.join(cwd, 'components')
  ];
  
  searchPaths.forEach(searchPath => {
    if (fs.existsSync(searchPath)) {
      try {
        const files = fs.readdirSync(searchPath);
        files.forEach(file => {
          const filePath = path.join(searchPath, file);
          
          // Check if it's a file we should examine
          if ((file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) && 
              isLikelyProjectFile(filePath)) {
            
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const lines = content.split('\n');
              
              lines.forEach((line, lineIndex) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('import')) {
                  VITE_CRITICAL_PATTERNS.forEach(({ pattern, description }) => {
                    if (pattern.test(trimmedLine)) {
                      issues.push({
                        file: path.relative(cwd, filePath),
                        line: lineIndex + 1,
                        content: trimmedLine,
                        description: description
                      });
                    }
                  });
                }
              });
            } catch (error) {
              // Skip files we can't read
            }
          }
        });
      } catch (error) {
        // Skip directories we can't access
      }
    }
  });
  
  return issues;
}

function main() {
  console.log('🎯 Targeted Vite Illegal Import Checker');
  console.log('Focuses only on your current project files\n');
  
  const issues = checkCurrentProject();
  
  if (issues.length === 0) {
    console.log('✅ Excellent! No Vite-illegal database imports found.');
    console.log('Your project should build without "illegal reference chain" errors.');
    return;
  }
  
  console.log(`⚠️  Found ${issues.length} Vite-critical issues:\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}:${issue.line}`);
    console.log(`   🔴 ${issue.content}`);
    console.log(`   📝 Issue: ${issue.description}`);
    console.log('');
  });
  
  console.log('🔧 Immediate Fixes:\n');
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. In ${issue.file} line ${issue.line}:`);
    console.log(`   Remove: ${issue.content}`);
    console.log(`   Add:    import { api } from '../api/client';`);
    console.log(`   Then replace db calls with api calls`);
    console.log('');
  });
  
  console.log('💡 Best Practice:');
  console.log('- Frontend: import { api } from \'./api\'');
  console.log('- Backend:  import { db } from \'./services/db\'');
  console.log('- Never import database connections in frontend files!');
}

if (require.main === module) {
  main();
}