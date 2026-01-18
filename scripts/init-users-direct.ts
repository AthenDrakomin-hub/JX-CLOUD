import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

console.log('🔍 Initializing root admin user with direct queries...');

const pool = new Pool({
  connectionString: connectionString,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function initializeRootAdmin() {
  try {
    console.log('📋 Checking database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');

    const rootEmail = 'admin@example.com';
    const rootUsername = 'admin';
    const rootName = '系统管理员';
    const rootRole = 'admin';
    
    console.log(`👤 Creating/Updating root admin user: ${rootEmail}`);
    
    // Check if root admin already exists in auth table
    const existingUserResult = await pool.query(
      'SELECT id FROM "user" WHERE email = $1', 
      [rootEmail]
    );
    
    let userId = '';
    let createdNew = false;
    
    // Create or update the Better Auth user table
    if (existingUserResult.rows.length > 0) {
      console.log('🔄 Updating existing admin user in auth table...');
      await pool.query(
        'UPDATE "user" SET role = $1, name = $2, updated_at = NOW() WHERE email = $3',
        [rootRole, rootName, rootEmail]
      );
      
      userId = existingUserResult.rows[0].id;
    } else {
      console.log('➕ Creating new admin user in auth table...');
      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: rootName,
        email: rootEmail,
        email_verified: true,
        image: null,
        role: rootRole,
        partner_id: null,
        module_permissions: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const insertResult = await pool.query(
        `INSERT INTO "user" (id, name, email, email_verified, image, role, partner_id, module_permissions, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          newUser.id, newUser.name, newUser.email, newUser.email_verified, 
          newUser.image, newUser.role, newUser.partner_id, 
          newUser.module_permissions, newUser.created_at, newUser.updated_at
        ]
      );
      userId = insertResult.rows[0].id;
      createdNew = true;
    }
    
    // Check if root admin already exists in business users table
    const existingBusinessUserResult = await pool.query(
      'SELECT id FROM users WHERE email = $1', 
      [rootEmail]
    );
    
    // Create or update the business users table
    if (existingBusinessUserResult.rows.length > 0) {
      console.log('🔄 Updating existing admin user in business table...');
      await pool.query(
        'UPDATE users SET role = $1, name = $2, username = $3, updated_at = NOW() WHERE email = $4',
        [rootRole, rootName, rootUsername, rootEmail]
      );
    } else {
      console.log('➕ Creating new admin user in business table...');
      // Create new business user
      const newBusinessUser = {
        id: `business_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: rootUsername,
        email: rootEmail,
        name: rootName,
        role: rootRole,
        partner_id: null,
        module_permissions: null,
        auth_type: 'credentials',
        email_verified: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await pool.query(
        `INSERT INTO users (id, username, email, name, role, partner_id, module_permissions, auth_type, email_verified, is_active, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          newBusinessUser.id, newBusinessUser.username, newBusinessUser.email,
          newBusinessUser.name, newBusinessUser.role, newBusinessUser.partner_id,
          newBusinessUser.module_permissions, newBusinessUser.auth_type,
          newBusinessUser.email_verified, newBusinessUser.is_active,
          newBusinessUser.created_at, newBusinessUser.updated_at
        ]
      );
      createdNew = true;
    }
    
    console.log(`✅ Root admin user initialization completed!`);
    console.log({
      success: true,
      message: createdNew ? 'Root admin user created successfully' : 'Root admin user updated successfully',
      userId: userId,
      email: rootEmail,
      username: rootUsername,
      role: rootRole,
      createdNew: createdNew
    });
    
    // Close the connection
    await pool.end();
    console.log('🔒 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error during root admin initialization:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run initialization
initializeRootAdmin();