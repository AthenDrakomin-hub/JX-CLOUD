#!/usr/bin/env node

/**
 * Vite Illegal Import Fix Helper
 * Specifically targets the "illegal reference chain" error in Vite projects
 */

const fs = require('fs');
const path = require('path');

// Vite-specific problematic patterns
const VITE_PROBLEMATIC_PATTERNS = [
  // Direct database imports that cause Vite bundling issues
  { 
    pattern: /import\s*[{,\s]*db[,\s}]*\s*from\s*['"][^'"]*services[\/\\]db['"]/,
    severity: 'HIGH',
    fixType: 'replace-with-api'
  },
  {
    pattern: /import\s*[{,\s]*database[,\s}]*\s*from\s*['"][^'"]*db['"]/,
    severity: 'HIGH',
    fixType: 'replace-with-api'
  },
  {
    pattern: /import\s*.+\s*from\s*['"][^'"]*(pg|postgres|mysql|sqlite)['"]/,
    severity: 'CRITICAL',
    fixType: 'remove-completely'
  },
  {
    pattern: /require\s*\(\s*['"][^'"]*services[\/\\]db['"]\s*\)/,
    severity: 'HIGH',
    fixType: 'replace-with-api'
  }
];

// File patterns that are DEFINITELY frontend components
const FRONTEND_COMPONENT_PATTERNS = [
  // React/Vue/Svelte component files
  /\.(jsx|tsx|vue|svelte)$/,
  // Files in frontend directories
  /src[\/\\]components/,
  /src[\/\\]pages/,
  /src[\/\\]views/,
  /client[\/\\]/,
  /frontend[\/\\]/,
  /components[\/\\][^\/\\]+\.tsx?$/,
  /pages[\/\\][^\/\\]+\.tsx?$/
];

// File patterns that are DEFINITELY backend/scripts (safe to import db)
const BACKEND_SAFE_PATTERNS = [
  // Backend service files
  /services[\/\\].*\.server\.ts$/,
  /server[\/\\]/,
  /api[\/\\]/,
  /backend[\/\\]/,
  // Scripts and utilities
  /[\/\\]scripts[\/\\]/,
  /migrations?[\/\\]/,
  /seeds?[\/\\]/,
  /\.script\.ts$/,
  /utils?[\/\\]db/,
  /config[\/\\]database/
];

function isDefinitelyFrontend(filePath) {
  return FRONTEND_COMPONENT_PATTERNS.some(pattern => pattern.test(filePath));
}

function isDefinitelyBackend(filePath) {
  return BACKEND_SAFE_PATTERNS.some(pattern => pattern.test(filePath));
}

function analyzeImportIssue(filePath, lineContent, lineNumber) {
  const fullPath = path.resolve(filePath);
  const isFrontend = isDefinitelyFrontend(fullPath);
  const isBackend = isDefinitelyBackend(fullPath);
  
  // If definitely backend, it's probably legitimate
  if (isBackend && !isFrontend) {
    return null; // Not an issue
  }
  
  // If definitely frontend, it's problematic
  if (isFrontend && !isBackend) {
    return {
      filePath,
      line: lineNumber,
      content: lineContent,
      type: 'ILLEGAL_FRONTEND_DB_IMPORT',
      severity: 'CRITICAL',
      recommendation: 'Replace with API call'
    };
  }
  
  // Ambiguous case - check the content more carefully
  for (const { pattern, severity, fixType } of VITE_PROBLEMATIC_PATTERNS) {
    if (pattern.test(lineContent)) {
      return {
        filePath,
        line: lineNumber,
        content: lineContent,
        type: 'POTENTIAL_ILLEGAL_IMPORT',
        severity,
        fixType,
        recommendation: fixType === 'replace-with-api' ? 
          'Replace with API service call' : 
          'Remove database driver import'
      };
    }
  }
  
  return null; // No issue detected
}

function scanForIssues(directory = '.') {
  const issues = [];
  const visited = new Set();
  
  function walkDir(currentPath) {
    if (visited.has(currentPath)) return;
    visited.add(currentPath);
    
    try {
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip node_modules and other irrelevant directories
            const skipDirs = [
              'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
              'AppData', 'Downloads', 'Documents', 'Desktop'
            ];
            
            if (!skipDirs.includes(item) && !item.startsWith('.')) {
              walkDir(fullPath);
            }
          } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
            // Check if this is a project file (not system/utility)
            const projectIndicators = [
              'src', 'components', 'pages', 'views', 'client', 'frontend',
              'App.tsx', 'main.tsx', 'index.tsx'
            ];
            
            const isProjectFile = projectIndicators.some(indicator => 
              fullPath.includes(indicator)
            ) || currentPath.split(path.sep).length <= 4;
            
            if (isProjectFile) {
              checkFileForIssues(fullPath, issues);
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
  
  walkDir(path.resolve(directory));
  return issues;
}

function checkFileForIssues(filePath, issues) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
        return;
      }
      
      const issue = analyzeImportIssue(filePath, trimmedLine, index + 1);
      if (issue) {
        issues.push(issue);
      }
    });
  } catch (error) {
    // Skip files we can't read
  }
}

function generateFixRecommendations(issues) {
  const recommendations = [];
  
  issues.forEach(issue => {
    const relativePath = path.relative(process.cwd(), issue.filePath);
    
    if (issue.type === 'ILLEGAL_FRONTEND_DB_IMPORT') {
      recommendations.push({
        file: relativePath,
        line: issue.line,
        problem: issue.content,
        solution: `// ❌ Remove this line:\n// ${issue.content}\n\n// ✅ Add API import instead:\nimport { api } from '../api';\n\n// Then replace db calls with API calls`
      });
    } else if (issue.type === 'POTENTIAL_ILLEGAL_IMPORT') {
      recommendations.push({
        file: relativePath,
        line: issue.line,
        problem: issue.content,
        solution: issue.fixType === 'replace-with-api' ?
          `Replace "${issue.content}" with API service import` :
          `Remove "${issue.content}" - import database drivers in backend only`
      });
    }
  });
  
  return recommendations;
}

function main() {
  console.log('🔍 Vite Illegal Import Detector\n');
  console.log('Looking for database imports that cause "illegal reference chain" errors...\n');
  
  const issues = scanForIssues('.');
  
  if (issues.length === 0) {
    console.log('✅ No Vite-illegal database imports found!');
    console.log('Your project should build without the "illegal reference chain" error.');
    return;
  }
  
  console.log(`⚠️  Found ${issues.length} potential issues:\n`);
  
  // Group by file
  const issuesByFile = {};
  issues.forEach(issue => {
    const relativePath = path.relative(process.cwd(), issue.filePath);
    if (!issuesByFile[relativePath]) {
      issuesByFile[relativePath] = [];
    }
    issuesByFile[relativePath].push(issue);
  });
  
  Object.entries(issuesByFile).forEach(([filePath, fileIssues]) => {
    console.log(`📁 ${filePath}:`);
    fileIssues.forEach(issue => {
      const severityIcon = issue.severity === 'CRITICAL' ? '🔴' : 
                          issue.severity === 'HIGH' ? '🟡' : '🟢';
      console.log(`   ${severityIcon} Line ${issue.line}: ${issue.content}`);
      console.log(`      → ${issue.recommendation}`);
    });
    console.log('');
  });
  
  // Generate specific fixes
  const recommendations = generateFixRecommendations(issues);
  
  console.log('🔧 Quick Fix Commands:\n');
  
  recommendations.slice(0, 3).forEach((rec, index) => {
    console.log(`${index + 1}. In ${rec.file} line ${rec.line}:`);
    console.log(`   ${rec.problem}`);
    console.log(`   ↓ FIX:`);
    console.log(`   ${rec.solution.split('\n')[0]}`);
    console.log('');
  });
  
  if (recommendations.length > 3) {
    console.log(`... and ${recommendations.length - 3} more issues.`);
    console.log('Run this script again after applying fixes to check remaining issues.\n');
  }
  
  console.log('💡 Pro Tips:');
  console.log('- Move all database logic to backend API routes');
  console.log('- Frontend should only import API clients, not database connections');
  console.log('- Use environment variables for API endpoints');
  console.log('- Consider creating a shared types package for frontend/backend type safety');
}

if (require.main === module) {
  main();
}

module.exports = { scanForIssues, analyzeImportIssue };