import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Use environment variables for Supabase connection
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Testing Supabase connection...');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase environment variables not set. Please check your .env file.');
  console.log('SUPABASE_URL:', !!SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY);
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('URL:', SUPABASE_URL.substring(0, 40) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Test by querying a table (doesn't matter which one for connection test)
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!');
    console.log('Query result:', data);
    
    // Now try to insert the admin users if they don't exist
    console.log('\nChecking for existing users...');
    
    // Check for root admin
    const { data: rootUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'athendrakomin@proton.me')
      .single();
    
    if (!rootUser) {
      console.log('Root admin user not found, creating...');
      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: `admin-${Date.now()}`,
          username: 'AthenDrakomin',
          email: 'athendrakomin@proton.me',
          name: '系统总监',
          role: 'admin',
          partner_id: null,
          module_permissions: {}
        }]);
      
      if (insertError) {
        console.error('❌ Error creating root admin:', insertError.message);
      } else {
        console.log('✅ Root admin user created');
      }
    } else {
      console.log('✅ Root admin user already exists');
    }
    
    // Check for staff user
    const { data: staffUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'staff@jxcloud.com')
      .single();
    
    if (!staffUser) {
      console.log('Staff user not found, creating...');
      const { error: staffInsertError } = await supabase
        .from('users')
        .insert([{
          id: `staff-${Date.now()}`,
          username: 'staff',
          email: 'staff@jxcloud.com',
          name: '普通员工',
          role: 'staff',
          partner_id: null,
          module_permissions: {}
        }]);
      
      if (staffInsertError) {
        console.error('❌ Error creating staff user:', staffInsertError.message);
      } else {
        console.log('✅ Staff user created');
      }
    } else {
      console.log('✅ Staff user already exists');
    }
    
    console.log('\n🎉 User initialization completed!');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();