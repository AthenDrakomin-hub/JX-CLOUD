import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load environment variables

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',  // Migration folder
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.DIRECT_URL!,
  },
  verbose: true,
  strict: true,
});