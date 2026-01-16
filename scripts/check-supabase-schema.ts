import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Fallback to demo mode if no env vars
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema via Supabase...\n');

    // Check menu_categories table structure
    console.log('📋 menu_categories table columns:');
    const { data: categoryInfo, error: categoryError } = await supabase
      .from('menu_categories')
      .select('*')
      .limit(0); // Just get structure
    
    if (categoryError) {
      console.log('❌ menu_categories table error:', categoryError.message);
      if (categoryError.code === '42P01') {
        console.log('   Table does not exist');
      }
    } else {
      console.log('✅ menu_categories table exists');
      // Try to get column info via RPC or describe
      try {
        const { data: columns } = await supabase.rpc('get_table_columns', { 
          table_name: 'menu_categories' 
        });
        if (columns) {
          console.log('Columns:', columns);
        }
      } catch (rpcErr) {
        console.log('Could not get detailed column info via RPC');
      }
    }
    console.log('');

    // Check user table (Better Auth)
    console.log('👤 user table (Better Auth):');
    const { data: userInfo, error: userError } = await supabase
      .from('user')
      .select('*')
      .limit(0);
    
    if (userError) {
      console.log('❌ user table error:', userError.message);
      if (userError.code === '42P01') {
        console.log('   Table does not exist');
      }
    } else {
      console.log('✅ user table exists');
    }
    console.log('');

    // Check users table (Business logic)
    console.log('👥 users table (Business logic):');
    const { data: usersInfo, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(0);
    
    if (usersError) {
      console.log('❌ users table error:', usersError.message);
      if (usersError.code === '42P01') {
        console.log('   Table does not exist');
      }
    } else {
      console.log('✅ users table exists');
    }
    console.log('');

    // Test inserting a sample category to check field compatibility
    console.log('🧪 Testing category insertion:');
    const testCategory = {
      id: 'test-cat-' + Date.now(),
      name: '测试分类',
      name_en: 'Test Category',
      level: 1,
      display_order: 0,
      is_active: true,
      parent_id: null,
      partner_id: null
    };

    const { error: insertError } = await supabase
      .from('menu_categories')
      .insert(testCategory);

    if (insertError) {
      console.log('❌ Category insertion failed:', insertError.message);
      console.log('   Error code:', insertError.code);
    } else {
      console.log('✅ Category insertion successful');
      // Clean up test data
      await supabase.from('menu_categories').delete().eq('id', testCategory.id);
      console.log('   Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema();