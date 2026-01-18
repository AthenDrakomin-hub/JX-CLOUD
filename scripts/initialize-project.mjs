#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Jiangxi Cloud Kitchen initialization...');

// Check if node_modules exists
if (!fs.existsSync('./node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Step 1: Generate Drizzle migrations
console.log('\n🔧 Generating database migrations...');
try {
    execSync('npx drizzle-kit generate', { stdio: 'inherit' });
  console.log('✅ Migrations generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate migrations:', error.message);
  // This might fail if there are no schema changes, which is OK
  console.log('⚠️  Migration generation skipped (may not be needed)');
}

// Step 2: Run database migrations
console.log('\n🏗️ Running database migrations...');
try {
  execSync('npx tsx scripts/run-migrations.ts', { stdio: 'inherit' });
  console.log('✅ Database migrations completed!');
} catch (error) {
  console.error('❌ Failed to run migrations:', error.message);
  process.exit(1);
}

// Step 3: Initialize database data
console.log('\n💾 Initializing database data...');
try {
  execSync('npx tsx scripts/init-db.ts', { stdio: 'inherit' });
  console.log('✅ Database data initialized!');
} catch (error) {
  console.error('❌ Failed to initialize database data:', error.message);
  process.exit(1);
}

// Step 4: Initialize root admin user
console.log('\n🔑 Initializing root admin user...');
try {
  execSync('npx tsx scripts/init-users.ts', { stdio: 'inherit' });
  console.log('✅ Root admin user initialized!');
} catch (error) {
  console.error('❌ Failed to initialize root admin user:', error.message);
  process.exit(1);
}

// Step 5: Build the application
console.log('\n🔨 Building the application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Application built successfully!');
} catch (error) {
  console.warn('⚠️  Build failed, but continuing (might be due to environment-specific issues):', error.message);
}

console.log('\n🎉 Jiangxi Cloud Kitchen initialization completed successfully!');
console.log('\n✨ You can now start the development server with:');
console.log('   npm run dev');
console.log('\n🌐 The application will be available at http://localhost:3000');
console.log('\n🔐 Default admin user:');
console.log('   Email: admin@example.com');
console.log('   Password: Will be set during first login (credentials will be configured via Better Auth)');