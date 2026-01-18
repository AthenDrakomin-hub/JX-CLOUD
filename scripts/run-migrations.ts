import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

console.log('🔍 Connecting to database for migrations...');

const pool = new Pool({
  connectionString: connectionString,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const db = drizzle(pool);

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Database migrations completed successfully!');
    
    // Close the connection
    await pool.end();
    console.log('🔒 Database connection closed');
  } catch (error) {
    console.error('❌ Error during migrations:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run migrations
runMigrations();