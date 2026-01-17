import { db } from '../src/services/db.server.js';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n');

    // Check menu_categories table structure
    console.log('📋 menu_categories table:');
    const categoryColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'menu_categories' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log(categoryColumns.rows);
    console.log('');

    // Check user table structure (Better Auth)
    console.log('👤 user table (Better Auth):');
    const userColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log(userColumns.rows);
    console.log('');

    // Check users table structure (Business logic)
    console.log('👥 users table (Business logic):');
    const usersColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    console.log(usersColumns.rows);
    console.log('');

    // Check if required fields exist
    console.log('✅ Schema validation:');
    
    // Check for parent_id in menu_categories
    const hasParentId = categoryColumns.rows.some((col: any) => col.column_name === 'parent_id');
    console.log(`  parent_id in menu_categories: ${hasParentId ? '✅' : '❌'}`);
    
    // Check for partner_id in menu_categories
    const hasPartnerId = categoryColumns.rows.some((col: any) => col.column_name === 'partner_id');
    console.log(`  partner_id in menu_categories: ${hasPartnerId ? '✅' : '❌'}`);
    
    // Check for role in user table
    const hasUserRole = userColumns.rows.some((col: any) => col.column_name === 'role');
    console.log(`  role in user table: ${hasUserRole ? '✅' : '❌'}`);
    
    // Check for role in users table
    const hasUsersRole = usersColumns.rows.some((col: any) => col.column_name === 'role');
    console.log(`  role in users table: ${hasUsersRole ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema();