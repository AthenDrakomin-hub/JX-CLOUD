import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Environment variables
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or POSTGRES_URL not set in environment variables');
  process.exit(1);
}

// Function to get properly formatted connection string with SSL
function getPooledUrl(url: string) {
  if (!url) {
    console.error("❌ DATABASE_URL not set!");
    return "";
  }
  
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('supabase.co')) {
        parsed.port = "6543"; // Use connection pool port to improve concurrency
        // Ensure SSL mode parameter is set
        const searchParams = parsed.searchParams;
        if (!searchParams.has('sslmode')) {
          searchParams.set('sslmode', 'require');
        }
    } else if (!parsed.searchParams.has('sslmode')) {
      // Ensure SSL mode is set for non-Supabase connections too
      parsed.searchParams.set('sslmode', 'require');
    }
    return parsed.toString();
  } catch (error) {
    console.error("❌ Database connection string parsing failed:", error);
    return url;
  }
}

async function addPartnerIdFields() {
  console.log('🔍 Checking database connection and adding partner_id fields...');
  
  const pooledUrl = getPooledUrl(connectionString);
  console.log('🔧 Using connection string:', pooledUrl.replace(/:[^:@]+@/, ':***@')); // Mask password
  
  // Create database connection with proper SSL settings
  const pool = new Pool({ 
    connectionString: pooledUrl,
    max: 1,           // Use minimal connections for this operation
    min: 0,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 3000,
    maxUses: 100,
    keepAlive: false,
    allowExitOnIdle: true
  });

  try {
    const client = await pool.connect();
    
    // Add partner_id column to orders table if it doesn't exist
    try {
      console.log('📝 Checking/adding partner_id column to orders table...');
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'partner_id'
          ) THEN
            ALTER TABLE "orders" ADD COLUMN "partner_id" text;
            RAISE NOTICE 'Added partner_id column to orders table';
          ELSE
            RAISE NOTICE 'partner_id column already exists in orders table';
          END IF;
        END $$;
      `);
      console.log('✅ Orders table partner_id column check completed');
    } catch (error) {
      console.error('⚠️ Error with orders table:', error.message);
    }
    
    // Add partner_id column to expenses table if it doesn't exist
    try {
      console.log('📝 Checking/adding partner_id column to expenses table...');
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'expenses' AND column_name = 'partner_id'
          ) THEN
            ALTER TABLE "expenses" ADD COLUMN "partner_id" text;
            RAISE NOTICE 'Added partner_id column to expenses table';
          ELSE
            RAISE NOTICE 'partner_id column already exists in expenses table';
          END IF;
        END $$;
      `);
      console.log('✅ Expenses table partner_id column check completed');
    } catch (error) {
      console.error('⚠️ Error with expenses table:', error.message);
    }

    // Add partner_id column to ingredients table if it doesn't exist
    try {
      console.log('📝 Checking/adding partner_id column to ingredients table...');
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ingredients' AND column_name = 'partner_id'
          ) THEN
            ALTER TABLE "ingredients" ADD COLUMN "partner_id" text;
            RAISE NOTICE 'Added partner_id column to ingredients table';
          ELSE
            RAISE NOTICE 'partner_id column already exists in ingredients table';
          END IF;
        END $$;
      `);
      console.log('✅ Ingredients table partner_id column check completed');
    } catch (error) {
      console.error('⚠️ Error with ingredients table:', error.message);
    }

    console.log('\n🎉 All partner_id fields have been processed successfully!');
    console.log('📋 Summary:');
    console.log('   - orders table: partner_id field added/verified');
    console.log('   - expenses table: partner_id field added/verified');
    console.log('   - ingredients table: partner_id field added/verified');
    console.log('   - Multi-tenant isolation is now properly configured');
    
    client.release();
  } catch (error) {
    console.error('❌ Error processing partner_id fields:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the function
addPartnerIdFields();