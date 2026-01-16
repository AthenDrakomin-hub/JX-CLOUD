import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateDatabaseSchema() {
  try {
    console.log('🔄 Updating database schema...\n');
    
    // Read the SQL update file
    const sqlFilePath = path.join(__dirname, '../database_update.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements (simple approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('DO $$'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For simple INSERT/UPDATE/ALTER statements
        if (statement.toUpperCase().startsWith('INSERT') || 
            statement.toUpperCase().startsWith('UPDATE') || 
            statement.toUpperCase().startsWith('ALTER') ||
            statement.toUpperCase().startsWith('CREATE') ||
            statement.toUpperCase().startsWith('GRANT') ||
            statement.toUpperCase().startsWith('DROP')) {
          
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        }
      } catch (err: any) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message);
        // Continue with other statements
      }
    }

    console.log('\n🔍 Verifying schema updates...');

    // Test if the fixes worked
    const testCategory = {
      id: 'verification-test-' + Date.now(),
      name: '验证测试分类',
      name_en: 'Verification Test Category',
      level: 1,
      display_order: 999,
      is_active: true,
      parent_id: null,
      partner_id: null
    };

    const { error: insertError } = await supabase
      .from('menu_categories')
      .insert(testCategory);

    if (insertError) {
      console.log('❌ Schema verification failed:', insertError.message);
      console.log('   Error code:', insertError.code);
    } else {
      console.log('✅ Schema verification successful - all required fields are present');
      // Clean up test data
      await supabase.from('menu_categories').delete().eq('id', testCategory.id);
    }

    console.log('\n🎉 Database schema update completed!');

  } catch (error) {
    console.error('❌ Database update failed:', error);
  }
}

updateDatabaseSchema();