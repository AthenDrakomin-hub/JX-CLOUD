import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database URL from .env file
const DATABASE_URL = "postgresql://postgres.zlbemopcgjohrnyyiwvs:BUAu5RXUctzLUjSc@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require";

try {
  // Create postgres client
  const client = postgres(DATABASE_URL, { 
    max: 8,                      
    idle_timeout: 10,            
    connect_timeout: 3,          
    prepare: false,              
    onnotice: () => {},          
  });

  // Create drizzle instance
  const db = drizzle(client);

  console.log('Attempting to connect to the database...');
  
  // Test the connection by performing a simple query
  const result = await db.execute('SELECT version()');
  
  console.log('✅ Successfully connected to the database!');
  console.log('Database version:', result[0]?.version?.substring(0, 50) + '...');
  
  // Close the connection
  await client.end();
  console.log('Connection closed.');
} catch (error) {
  console.error('❌ Failed to connect to the database:');
  console.error(error.message);
}