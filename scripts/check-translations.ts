import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Extract all translation keys used in the codebase
function extractTranslationKeys(): string[] {
  try {
    // Use grep to find all t('key') and t("key") patterns
    const output = execSync('grep -r "t(\''" src/ --include="*.tsx" --include="*.ts" --exclude-dir=node_modules || true', { encoding: 'utf-8' });
    const lines = output.split('\n');
    
    const keys = new Set<string>();
    
    for (const line of lines) {
      if (!line) continue;
      
      // Match t('key') or t("key") patterns
      const regex = /t\(['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        keys.add(match[1]);
      }
    }
    
    // Also check for template literals with parameters
    const paramOutput = execSync('grep -r "t(\''" src/ --include="*.tsx" --include="*.ts" --exclude-dir=node_modules || true', { encoding: 'utf-8' });
    const paramLines = paramOutput.split('\n');
    
    for (const line of paramLines) {
      if (!line) continue;
      
      // Match t('key', {...}) patterns
      const regex = /t\(['"]([^'"]+)['"]\s*,/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        keys.add(match[1]);
      }
    }
    
    return Array.from(keys);
  } catch (error) {
    console.error('Error extracting translation keys:', error);
    return [];
  }
}

// Get the static keys from the translations file
function getStaticKeys(): string[] {
  const content = readFileSync('src/constants/translations.ts', 'utf-8');
  
  // Extract keys from the translations object
  const keyRegex = /(\w+):\s*'[^']*'/g;
  const matches = [...content.matchAll(keyRegex)];
  
  return matches.map(match => match[1]).filter(key => 
    key !== 'zh' && key !== 'en' && key !== 'fil' && // exclude language keys
    key !== 'jxCloud' && key !== 'dashboard' // include valid keys
  );
}

// Compare keys and identify missing ones
function compareKeys() {
  const usedKeys = extractTranslationKeys();
  const staticKeys = getStaticKeys();
  
  console.log('=== Translation Keys Analysis ===');
  console.log(`Total keys used in codebase: ${usedKeys.length}`);
  console.log(`Total keys in static translations: ${staticKeys.length}`);
  
  // Find keys that are used but not in static translations
  const missingKeys = usedKeys.filter(key => !staticKeys.includes(key));
  
  console.log('\nKeys used in codebase but missing from static translations:');
  missingKeys.forEach(key => console.log(`  - ${key}`));
  
  // Check which of these should be in the database
  console.log('\nKeys that should be in the database translations table:');
  missingKeys.forEach(key => console.log(`  - ${key}`));
  
  // Check which keys are used in the code but might be missing from DB
  const allKeys = [...new Set([...usedKeys, ...staticKeys])];
  
  console.log(`\nTotal unique keys to consider for database: ${allKeys.length}`);
  
  // Generate SQL insert statements for missing keys
  console.log('\n--- SQL INSERT STATEMENTS FOR MISSING KEYS ---');
  console.log('-- Add these to populate the translations table:');
  
  allKeys.forEach(key => {
    console.log(`
INSERT INTO public.translations (key, language, value, namespace, is_active)
SELECT '${key}', 'zh', '${key}', 'common', true
WHERE NOT EXISTS (SELECT 1 FROM public.translations WHERE key = '${key}' AND language = 'zh');
INSERT INTO public.translations (key, language, value, namespace, is_active)
SELECT '${key}', 'en', '${key}', 'common', true
WHERE NOT EXISTS (SELECT 1 FROM public.translations WHERE key = '${key}' AND language = 'en');
INSERT INTO public.translations (key, language, value, namespace, is_active)
SELECT '${key}', 'fil', '${key}', 'common', true
WHERE NOT EXISTS (SELECT 1 FROM public.translations WHERE key = '${key}' AND language = 'fil');
`);
  });
}

// Run the comparison
compareKeys();