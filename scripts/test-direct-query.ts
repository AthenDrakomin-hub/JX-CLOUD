import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

console.log('🔍 Testing direct database queries...');

const pool = new Pool({
  connectionString: connectionString,
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 3000,
});

async function testQueries() {
  try {
    console.log('Testing query on auth user table...');
    const result1 = await pool.query("SELECT * FROM \"user\" WHERE email = 'admin@example.com' LIMIT 1;");
    console.log('✅ Auth user table query successful');
    
    console.log('Testing query on business users table...');
    const result2 = await pool.query("SELECT * FROM users WHERE email = 'admin@example.com' LIMIT 1;");
    console.log('✅ Business users table query successful');
    
    console.log('Both tables accessible!');
    
    // Close the connection
    await pool.end();
    console.log('🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Error during query test:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testQueries();