import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

console.log('🔍 Connecting to database to check partners table structure...');

const pool = new Pool({
  connectionString: connectionString,
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 3000,
});

async function checkPartnersTableStructure() {
  try {
    // Check partners table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'partners'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 partners table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
    });

    // Close the connection
    await pool.end();
    console.log('\n🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkPartnersTableStructure();