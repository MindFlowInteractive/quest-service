#!/bin/bash

echo "📦 Manual A/B Testing Tables Migration"
echo "======================================"

# Connect to PostgreSQL and run SQL directly
echo "Connecting to PostgreSQL..."
sudo -u postgres psql -d myapp << EOF

-- A/B Testing Tables Migration
-- Run this SQL in your PostgreSQL database

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

-- Create indexes for performance
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

-- Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('experiments', 'experiment_conversions', 'experiment_assignments', 'feature_flags')) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('experiments', 'experiment_conversions', 'experiment_assignments', 'feature_flags');

EOF

echo "✅ Migration completed!"
echo ""
echo "To test the connection, run:"
echo "  sudo -u postgres psql -d myapp -c \"SELECT * FROM feature_flags;\""
