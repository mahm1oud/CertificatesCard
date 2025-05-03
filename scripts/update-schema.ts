import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

/**
 * Connect to database and create tables
 */
async function createTables() {
  try {
    const DATABASE_URL = process.env.DATABASE_URL!;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    console.log('Connecting to database...');
    const client = postgres(DATABASE_URL, { max: 1 });
    const db = drizzle(client, { schema });

    console.log('Creating tables:');
    console.log('- auth_settings');
    console.log('- categories');
    console.log('- certificate_batch_items');
    console.log('- certificate_batches');
    console.log('- certificates');
    console.log('- fonts');
    console.log('- layers');
    console.log('- settings');
    console.log('- template_fields');
    console.log('- templates');
    console.log('- users');
    console.log('- cards');

    // Execute SQL directly to create tables if they don't exist
    await client`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES templates(id),
        user_id INTEGER REFERENCES users(id),
        form_data JSONB NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_accessed TIMESTAMP,
        quality TEXT DEFAULT 'medium',
        public_id TEXT UNIQUE,
        access_count INTEGER NOT NULL DEFAULT 0,
        settings JSONB DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active'
      );
    `;
    
    console.log('Tables created successfully!');
    
    await client.end();
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables().then(() => {
  console.log('Database schema update completed');
  process.exit(0);
});