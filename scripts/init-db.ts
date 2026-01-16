/**
 * Database initialization helper
 * This script provides functions to initialize the database with sample data
 * NOTE: Actual table creation should be done via Supabase SQL Editor or Drizzle migrations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Use environment variables for Supabase connection
// For database initialization, we need the direct database URL
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const DIRECT_DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not set. Please check your .env file.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Initialize basic system configuration
 */
async function initializeSystemConfig() {
  console.log('Initializing system configuration...');
  
  const { data, error } = await supabase
    .from('system_config')
    .select()
    .eq('id', 'global')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error checking system config:', error);
    return;
  }

  if (!data) {
    // Insert default system config
    const { error: insertError } = await supabase
      .from('system_config')
      .insert([{ 
        id: 'global', 
        hotel_name: '江西云厨酒店',
        version: '8.8.0'
      }]);

    if (insertError) {
      console.error('Error inserting system config:', insertError);
    } else {
      console.log('System configuration initialized');
    }
  } else {
    console.log('System configuration already exists');
  }
}

/**
 * Initialize default rooms
 */
async function initializeRooms() {
  console.log('Initializing rooms...');
  
  // Check if rooms already exist
  const { count, error: countError } = await supabase
    .from('rooms')
    .select('*', { count: true, head: true });

  if (countError) {
    console.error('Error counting rooms:', countError);
    return;
  }

  if (count === 0) {
    // Insert default rooms (67 rooms: 8201-8232, 8301-8332, VIP rooms)
    const roomsData = [];
    
    // Rooms 8201-8232
    for (let i = 8201; i <= 8232; i++) {
      roomsData.push({ id: i.toString(), status: 'ready' });
    }
    
    // Rooms 8301-8332
    for (let i = 8301; i <= 8332; i++) {
      roomsData.push({ id: i.toString(), status: 'ready' });
    }
    
    // VIP rooms
    roomsData.push({ id: 'VIP-666', status: 'ready' });
    roomsData.push({ id: 'VIP-888', status: 'ready' });
    roomsData.push({ id: 'VIP-000', status: 'ready' });
    
    const { error: insertError } = await supabase
      .from('rooms')
      .insert(roomsData);

    if (insertError) {
      console.error('Error inserting rooms:', insertError);
    } else {
      console.log(`${roomsData.length} rooms initialized`);
    }
  } else {
    console.log(`Found ${count} existing rooms`);
  }
}

/**
 * Initialize default users
 */
async function initializeUsers() {
  console.log('Initializing users...');
  
  // Check if root admin user already exists
  const { data: existingRootUser, error: rootUserError } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'athendrakomin@proton.me')
    .single();

  if (!rootUserError && !existingRootUser) {
    // Create root admin user in the users table (business logic table)
    const { error: userInsertError } = await supabase
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

    if (userInsertError) {
      console.error('Error inserting root admin user:', userInsertError);
    } else {
      console.log('Root admin user (athendrakomin@proton.me) created');
    }
  } else {
    console.log('Root admin user already exists');
  }

  // Check if staff user already exists
  const { data: existingStaffUser, error: staffUserError } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'staff@jxcloud.com')
    .single();

  if (!staffUserError && !existingStaffUser) {
    // Create staff user in the users table (business logic table)
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
      console.error('Error inserting staff user:', staffInsertError);
    } else {
      console.log('Staff user (staff@jxcloud.com) created');
    }
  } else {
    console.log('Staff user already exists');
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration. Please check your environment variables.');
    return;
  }
  
  try {
    await initializeSystemConfig();
    await initializeRooms();
    await initializeUsers();
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Only run if called directly (not imported)
if (typeof require !== 'undefined' && require.main === module) {
  console.log('Starting database initialization from main...');
  initializeDatabase().catch(console.error);
}

export { initializeDatabase, initializeSystemConfig, initializeRooms };