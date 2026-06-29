import { AppDataSource } from '../src/config/orm-config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Override with default values if not set
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'myapp';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'password';

async function runMigration() {
  console.log('Initializing database connection...');
  console.log(`Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Database connection established.');
    
    // Run migrations
    console.log('Running migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Applied ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    }
    
    // Close connection
    await AppDataSource.destroy();
    console.log('Migration completed successfully.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();