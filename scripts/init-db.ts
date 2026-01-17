/**
 * Database initialization helper using Drizzle ORM
 * This script provides functions to initialize the database with sample data
 */

import { db } from '../services/db.server';
import { systemConfig, rooms, users } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Initialize basic system configuration
 */
async function initializeSystemConfig() {
  console.log('Initializing system configuration...');
  
  try {
    const existingConfig = await db.select().from(systemConfig).where(eq(systemConfig.id, 'global')).limit(1);

    if (existingConfig.length === 0) {
      // Insert default system config
      await db.insert(systemConfig).values({ 
        id: 'global', 
        hotelName: '江西云厨酒店',
        version: '8.8.0'
      });
      console.log('System configuration initialized');
    } else {
      console.log('System configuration already exists');
    }
  } catch (error) {
    console.error('Error initializing system config:', error);
  }
}

/**
 * Initialize default rooms
 */
async function initializeRooms() {
  console.log('Initializing rooms...');
  
  try {
    // Check if rooms already exist
    const countResult = await db.select({ count: sql`COUNT(*)` }).from(rooms);
    const existingCount = parseInt(countResult[0]?.count || '0');

    if (existingCount === 0) {
      // Insert default rooms (67 rooms: 8201-8232, 8301-8332, VIP rooms)
      const roomsData = [];
      
      // Rooms 8201-8232
      for (let i = 8201; i <= 8232; i++) {
        roomsData.push({ id: i.toString(), status: 'ready' });
      }
      
      // Rooms 8301-8332
      for (let i = 8301; i <= 8332; i++) {
        roomsData.push({ id: i.toString(), status: 'ready' });
      }
      
      // VIP rooms
      roomsData.push({ id: 'VIP-666', status: 'ready' });
      roomsData.push({ id: 'VIP-888', status: 'ready' });
      roomsData.push({ id: 'VIP-000', status: 'ready' });
      
      await db.insert(rooms).values(roomsData);
      console.log(`${roomsData.length} rooms initialized`);
    } else {
      console.log(`Found ${existingCount} existing rooms`);
    }
  } catch (error) {
    console.error('Error initializing rooms:', error);
  }
}

/**
 * Initialize default users
 */
async function initializeUsers() {
  console.log('Initializing users...');
  
  try {
    // Check if root admin user already exists
    const existingRootUser = await db.select().from(users).where(eq(users.email, 'athendrakomin@proton.me')).limit(1);

    if (existingRootUser.length === 0) {
      // Create root admin user in the users table (business logic table)
      await db.insert(users).values({
        id: `admin-${Date.now()}`,
        username: 'AthenDrakomin',
        email: 'athendrakomin@proton.me',
        name: '系统总监',
        role: 'admin',
        partnerId: null,
        modulePermissions: {}
      });
      console.log('Root admin user (athendrakomin@proton.me) created');
    } else {
      console.log('Root admin user already exists');
    }

    // Check if staff user already exists
    const existingStaffUser = await db.select().from(users).where(eq(users.email, 'staff@jxcloud.com')).limit(1);

    if (existingStaffUser.length === 0) {
      // Create staff user in the users table (business logic table)
      await db.insert(users).values({
        id: `staff-${Date.now()}`,
        username: 'staff',
        email: 'staff@jxcloud.com',
        name: '普通员工',
        role: 'staff',
        partnerId: null,
        modulePermissions: {}
      });
      console.log('Staff user (staff@jxcloud.com) created');
    } else {
      console.log('Staff user already exists');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  try {
    await initializeSystemConfig();
    await initializeRooms();
    await initializeUsers();
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Only run if called directly (not imported)
if (typeof require !== 'undefined' && require.main === module) {
  console.log('Starting database initialization from main...');
  initializeDatabase().catch(console.error);
}

export { initializeDatabase, initializeSystemConfig, initializeRooms };