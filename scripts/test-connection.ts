import { db } from '../services/db.server';
import { systemConfig, users } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('Testing database connection with Drizzle ORM...');

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    
    // Test basic connection with a simple query
    const result = await db.execute(sql`SELECT 1 as test_connection`);
    console.log('✅ Database connection successful!');
    console.log('Test result:', result);
    
    // Test querying system config table
    console.log('\nTesting system config table...');
    try {
      const config = await db.select().from(systemConfig).where(eq(systemConfig.id, 'global')).limit(1);
      console.log('✅ System config table accessible');
      console.log('Config data:', config);
    } catch (err) {
      console.log('ℹ️  System config table may not exist yet - this is normal for fresh installations');
    }
    
    // Check and create users
    console.log('\nChecking for existing users...');
    
    // Check for root admin
    try {
      const rootUser = await db.select().from(users).where(eq(users.email, 'athendrakomin@proton.me')).limit(1);
      
      if (rootUser.length === 0) {
        console.log('Root admin user not found, creating...');
        await db.insert(users).values({
          id: `admin-${Date.now()}`,
          username: 'AthenDrakomin',
          email: 'athendrakomin@proton.me',
          name: '系统总监',
          role: 'admin',
          partnerId: null,
          modulePermissions: {}
        });
        console.log('✅ Root admin user created');
      } else {
        console.log('✅ Root admin user already exists');
      }
    } catch (err) {
      console.log('ℹ️  Users table may not exist yet - this is normal for fresh installations');
    }
    
    // Check for staff user
    try {
      const staffUser = await db.select().from(users).where(eq(users.email, 'staff@jxcloud.com')).limit(1);
      
      if (staffUser.length === 0) {
        console.log('Staff user not found, creating...');
        await db.insert(users).values({
          id: `staff-${Date.now()}`,
          username: 'staff',
          email: 'staff@jxcloud.com',
          name: '普通员工',
          role: 'staff',
          partnerId: null,
          modulePermissions: {}
        });
        console.log('✅ Staff user created');
      } else {
        console.log('✅ Staff user already exists');
      }
    } catch (err) {
      console.log('ℹ️  Users table may not exist yet - this is normal for fresh installations');
    }
    
    console.log('\n🎉 Database connection and user initialization completed!');
  } catch (err: any) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();