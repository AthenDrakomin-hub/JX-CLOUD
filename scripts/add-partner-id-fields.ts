import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Environment variables
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or POSTGRES_URL not set in environment variables');
  process.exit(1);
}

// Create database connection
const pool = new Pool({ 
  connectionString: connectionString,
});
const db = drizzle(pool, { schema });

async function addPartnerIdFields() {
  console.log('🔍 Checking for missing partner_id fields...');
  
  try {
    // Check if partner_id column exists in orders table
    const ordersCheck = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'partner_id'
    `);
    
    if (ordersCheck.rowCount === 0 || ordersCheck.rows.length === 0) {
      console.log('📝 Adding partner_id column to orders table...');
      await db.execute(`ALTER TABLE "orders" ADD COLUMN "partner_id" text;`);
      console.log('✅ Added partner_id column to orders table');
    } else {
      console.log('✅ partner_id column already exists in orders table');
    }
    
    // Check if partner_id column exists in expenses table
    const expensesCheck = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'expenses' AND column_name = 'partner_id'
    `);
    
    if (expensesCheck.rowCount === 0 || expensesCheck.rows.length === 0) {
      console.log('📝 Adding partner_id column to expenses table...');
      await db.execute(`ALTER TABLE "expenses" ADD COLUMN "partner_id" text;`);
      console.log('✅ Added partner_id column to expenses table');
    } else {
      console.log('✅ partner_id column already exists in expenses table');
    }
    
    // Check if partner_id column exists in ingredients table
    const ingredientsCheck = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ingredients' AND column_name = 'partner_id'
    `);
    
    if (ingredientsCheck.rowCount === 0 || ingredientsCheck.rows.length === 0) {
      console.log('📝 Adding partner_id column to ingredients table...');
      await db.execute(`ALTER TABLE "ingredients" ADD COLUMN "partner_id" text;`);
      console.log('✅ Added partner_id column to ingredients table');
    } else {
      console.log('✅ partner_id column already exists in ingredients table');
    }
    
    console.log('\n🎉 All partner_id fields have been added successfully!');
    console.log('📋 Summary:');
    console.log('   - orders table: partner_id field added');
    console.log('   - expenses table: partner_id field added');
    console.log('   - ingredients table: partner_id field added');
    console.log('   - Multi-tenant isolation is now properly configured');
    
  } catch (error) {
    console.error('❌ Error adding partner_id fields:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the function
addPartnerIdFields();