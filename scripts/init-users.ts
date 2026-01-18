import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { user, users as businessUsers } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  process.exit(1);
}

console.log('🔍 Initializing root admin user...');

const pool = new Pool({
  connectionString: connectionString,
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const db = drizzle(pool);

async function initializeRootAdmin() {
  try {
    console.log('📋 Checking database connection...');
    
    // Test basic connection
    const result = await db.execute('SELECT NOW()');
    console.log('✅ Database connection successful!');

    const rootEmail = 'admin@example.com';  // Using a safer default
    const rootUsername = 'admin';
    const rootName = '系统管理员';
    const rootRole = 'admin';
    
    console.log(`👤 Creating/Updating root admin user: ${rootEmail}`);
    
    // Check if root admin already exists
    const existingUser = await db.select().from(user).where(eq(user.email, rootEmail));
    const existingBusinessUser = await db.select().from(businessUsers).where(eq(businessUsers.email, rootEmail));
    
    let userId = '';
    let createdNew = false;
    
    // Create or update the Better Auth user table
    if (existingUser.length > 0) {
      console.log('🔄 Updating existing admin user in auth table...');
      await db.update(user).set({
        role: rootRole,
        name: rootName,
        updatedAt: new Date()
      }).where(eq(user.email, rootEmail));
      
      userId = existingUser[0].id;
    } else {
      console.log('➕ Creating new admin user in auth table...');
      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: rootName,
        email: rootEmail,
        emailVerified: true,
        image: null,
        role: rootRole,
        partnerId: null,
        modulePermissions: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertedUsers = await db.insert(user).values(newUser).returning();
      userId = insertedUsers[0].id;
      createdNew = true;
    }
    
    // Create or update the business users table
    if (existingBusinessUser.length > 0) {
      console.log('🔄 Updating existing admin user in business table...');
      await db.update(businessUsers).set({
        role: rootRole,
        name: rootName,
        username: rootUsername,
        updatedAt: new Date()
      }).where(eq(businessUsers.email, rootEmail));
    } else {
      console.log('➕ Creating new admin user in business table...');
      // Create new business user
      const newBusinessUser = {
        id: `business_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: rootUsername,
        email: rootEmail,
        name: rootName,
        role: rootRole,
        partnerId: null,
        modulePermissions: null,
        authType: 'credentials',
        emailVerified: true,
        isActive: true,
        isPasskeyBound: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(businessUsers).values(newBusinessUser);
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