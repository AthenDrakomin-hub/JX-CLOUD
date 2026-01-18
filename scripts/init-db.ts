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

console.log('🔍 Initializing database connection...');

const pool = new Pool({
  connectionString: connectionString,
  max: 5, // Reduced for initialization
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const db = drizzle(pool);

// Import schema
import * as schema from '../drizzle/schema.js';

console.log('🚀 Starting database initialization...');

async function initializeDatabase() {
  try {
    console.log('📋 Checking database connection...');
    
    // Test basic connection
    const result = await db.execute('SELECT NOW()');
    console.log('✅ Database connection successful!');

    // Initialize system configuration
    console.log('⚙️ Setting up system configuration...');
    
    // Insert default system config if it doesn't exist
    const defaultConfig = {
      id: 'global',
      hotelName: '江西云厨酒店',
      version: '8.8.0',
      updatedAt: new Date()
    };

    // Check if config already exists
    const existingConfig = await db.execute(`
      SELECT * FROM system_config WHERE id = 'global'
    `);

    if (existingConfig.rowCount === 0) {
      await db.execute(`
        INSERT INTO system_config (id, hotel_name, version, updated_at) 
        VALUES ('${defaultConfig.id}', '${defaultConfig.hotelName}', '${defaultConfig.version}', '${defaultConfig.updatedAt.toISOString()}')
      `);
      console.log('✅ Default system configuration created');
    } else {
      console.log('ℹ️ System configuration already exists');
    }

    // Initialize default payment methods
    console.log('💳 Setting up default payment methods...');
    
    const defaultPaymentMethods = [
      {
        id: 'cash',
        name: '现金支付',
        nameEn: 'Cash Payment',
        currency: 'PHP',
        currencySymbol: '₱',
        isActive: true,
        paymentType: 'cash',
        sortOrder: 1
      },
      {
        id: 'gcash',
        name: 'GCash',
        nameEn: 'GCash',
        currency: 'PHP',
        currencySymbol: '₱',
        isActive: true,
        paymentType: 'digital_wallet',
        sortOrder: 2
      }
    ];

    for (const method of defaultPaymentMethods) {
      const existingMethod = await db.execute(`
        SELECT * FROM payment_methods WHERE id = '${method.id}'
      `);

      if (existingMethod.rowCount === 0) {
        await db.execute(`
          INSERT INTO payment_methods (
            id, name, name_en, currency, currency_symbol, is_active, 
            payment_type, sort_order, created_at
          ) VALUES (
            '${method.id}', '${method.name}', '${method.nameEn}', '${method.currency}', 
            '${method.currencySymbol}', ${method.isActive}, '${method.paymentType}', 
            ${method.sortOrder}, NOW()
          )
        `);
      }
    }
    console.log('✅ Default payment methods created');

    // Initialize default room
    console.log('🏨 Setting up default rooms...');
    
    // Check if rooms exist
    const existingRooms = await db.execute(`
      SELECT * FROM rooms LIMIT 1
    `);

    if (existingRooms.rowCount === 0) {
      // Create some default rooms
      for (let i = 1; i <= 10; i++) {
        const roomId = `room-${i.toString().padStart(3, '0')}`;
        await db.execute(`
          INSERT INTO rooms (id, status, updated_at) 
          VALUES ('${roomId}', 'ready', NOW())
        `);
      }
      console.log('✅ Default rooms created (room-001 to room-010)');
    } else {
      console.log('ℹ️ Rooms already exist');
    }

    // Initialize default partner
    console.log('🤝 Setting up default partner...');
    
    const existingPartner = await db.execute(`
      SELECT * FROM partners WHERE name = '默认合作伙伴'
    `);

    if (existingPartner.rowCount === 0) {
      await db.execute(`
        INSERT INTO partners (
          id, name, owner_name, status, commission_rate, balance, 
          authorized_categories, joined_at
        ) VALUES (
          'partner-default', '默认合作伙伴', '系统管理员', 'active', '0.15', '0',
          '{}', NOW()
        )
      `);
      console.log('✅ Default partner created');
    } else {
      console.log('ℹ️ Default partner already exists');
    }

    console.log('🎉 Database initialization completed successfully!');
    
    // Close the connection
    await pool.end();
    console.log('🔒 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();