import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Default values
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'myapp',
};

async function runMigration() {
  console.log('Running A/B testing migration...');
  console.log(`Connecting to: ${config.host}:${config.port}/${config.database}`);
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    migrations: [],
    migrationsTableName: 'migrations',
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established.');
    
    // Run the specific A/B testing migration
    const migrationName = '1743000000001-create-ab-testing-tables.ts';
    console.log(`Running migration: ${migrationName}`);
    
    // Create tables SQL
    const sql = `
      -- Create experiments table
      CREATE TABLE IF NOT EXISTS experiments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        variants JSONB NOT NULL,
        traffic_split_pct INTEGER NOT NULL CHECK (traffic_split_pct BETWEEN 1 AND 100),
        status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'ended')),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create experiment_conversions table
      CREATE TABLE IF NOT EXISTS experiment_conversions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        variant_name VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(experiment_id, user_id, event_type)
      );

      -- Create experiment_assignments table
      CREATE TABLE IF NOT EXISTS experiment_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        user_id VARCHAR(255) NOT NULL,
        variant_name VARCHAR(255) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_converted_at TIMESTAMP,
        UNIQUE(experiment_id, user_id)
      );

      -- Create feature_flags table
      CREATE TABLE IF NOT EXISTS feature_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) UNIQUE NOT NULL,
        enabled BOOLEAN DEFAULT FALSE,
        rollout_pct INTEGER DEFAULT 100 CHECK (rollout_pct BETWEEN 0 AND 100),
        target_cohort VARCHAR(50) DEFAULT 'all' CHECK (target_cohort IN ('all', 'premium', 'new_users')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
      CREATE INDEX IF NOT EXISTS idx_experiment_conversions_experiment_id ON experiment_conversions(experiment_id);
      CREATE INDEX IF NOT EXISTS idx_experiment_conversions_user_id ON experiment_conversions(user_id);
      CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment_id ON experiment_assignments(experiment_id);
      CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user_id ON experiment_assignments(user_id);
      CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
      CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

      -- Insert default feature flags
      INSERT INTO feature_flags (key, enabled, rollout_pct, target_cohort) VALUES
        ('new_puzzle_ui', false, 10, 'all'),
        ('premium_rewards', true, 100, 'premium'),
        ('tutorial_v2', false, 0, 'all'),
        ('social_features', true, 50, 'all'),
        ('mobile_optimizations', true, 100, 'all')
      ON CONFLICT (key) DO NOTHING;
    `;
    
    // Execute SQL
    await dataSource.query(sql);
    
    console.log('✅ A/B testing tables created successfully!');
    console.log('✅ Default feature flags inserted.');
    
    await dataSource.destroy();
    console.log('Migration completed.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();