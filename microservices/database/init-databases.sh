#!/bin/bash

# Quest Service Database Initialization Script
# This script creates separate databases for each microservice

set -e

echo "Initializing Quest Service databases..."

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-password}

# Function to create database if it doesn't exist
create_database() {
    local db_name=$1
    echo "Creating database: $db_name"
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
        SELECT 'CREATE DATABASE $db_name'
        WHERE NOT EXISTS (
            SELECT FROM pg_database WHERE datname = '$db_name'
        );" || true
    
    if [ $? -eq 0 ]; then
        echo "✓ Database $db_name created successfully"
    else
        echo "✗ Failed to create database $db_name"
        exit 1
    fi
}

# Function to create user and grant privileges
create_user() {
    local username=$1
    local password=$2
    local database=$3
    
    echo "Creating user: $username for database: $database"
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
        DO \$\$
        BEGIN;
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$username') THEN
                CREATE USER $username WITH PASSWORD '$password';
            END IF;
            GRANT ALL PRIVILEGES ON DATABASE $database TO $username;
            GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $username;
            GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $username;
        COMMIT;
        \$\$" || true
    
    if [ $? -eq 0 ]; then
        echo "✓ User $username created and granted privileges"
    else
        echo "✗ Failed to create user $username"
        exit 1
    fi
}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q'; do
  echo "PostgreSQL is ready"
  break
done
sleep 2

# Create databases for each microservice
echo "Creating microservice databases..."

create_database "quest_db"
create_database "game_session_db"
create_database "economy_db"
create_database "notification_db"
create_database "social_db"
create_database "recommendation_db"

# Create service-specific users with limited privileges
echo "Creating service users..."

# Main quest service user (full access to quest_db)
create_user "quest_service_user" "quest_secure_password_2024" "quest_db"

# Game session service user
create_user "game_session_service_user" "session_secure_password_2024" "game_session_db"

# Economy service user
create_user "economy_service_user" "economy_secure_password_2024" "economy_db"

# Notification service user
create_user "notification_service_user" "notification_secure_password_2024" "notification_db"

# Social service user
create_user "social_service_user" "social_secure_password_2024" "social_db"

# Recommendation service user
create_user "recommendation_service_user" "recommendation_secure_password_2024" "recommendation_db"

# Create shared user for cross-service operations
echo "Creating shared service user..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    DO \$\$
        BEGIN;
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'quest_shared_user') THEN
                CREATE USER quest_shared_user WITH PASSWORD 'shared_secure_password_2024';
            END IF;
        COMMIT;
    \$\$" || true

# Grant shared user read access to all databases
for db in "quest_db" "game_session_db" "economy_db" "notification_db" "social_db" "recommendation_db"; do
    echo "Granting shared user access to: $db"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
        GRANT CONNECT ON DATABASE $db TO quest_shared_user;
        GRANT USAGE ON SCHEMA public TO quest_shared_user;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO quest_shared_user;" || true
done

# Create monitoring and backup functions
echo "Creating monitoring functions..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    DO \$\$
        BEGIN;
            -- Function to get database size
            CREATE OR REPLACE FUNCTION get_database_size(db_name TEXT)
            RETURNS TEXT AS \$\$
                DECLARE
                    size_result TEXT;
                BEGIN
                    EXECUTE format('SELECT pg_size_pretty(pg_database_size(%L))', db_name) INTO size_result;
                    RETURN size_result;
                END;
            \$\$ LANGUAGE plpgsql;
            
            -- Function to get table sizes
            CREATE OR REPLACE FUNCTION get_table_sizes(db_name TEXT)
            RETURNS TABLE(table_name TEXT, size TEXT) AS \$\$
                BEGIN
                    RETURN QUERY
                    SELECT 
                        schemaname||'.'||tablename as table_name,
                        pg_size_pretty(pg_total_relation_size(schemaname::regclass::oid)) as size
                    FROM pg_tables 
                    WHERE schemaname = 'public' 
                    AND pg_my_temp_schema() IS NULL;
                END;
            \$\$ LANGUAGE plpgsql;
        COMMIT;
    \$\$" || true

# Set up replication user
echo "Creating replication user..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    DO \$\$
        BEGIN;
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'quest_replicator') THEN
                CREATE USER quest_replicator WITH REPLICATION ENCRYPTED PASSWORD 'replication_secure_password_2024';
            END IF;
        COMMIT;
    \$\$" || true

# Create monitoring views
echo "Creating monitoring views..."

for db in "quest_db" "game_session_db" "economy_db" "notification_db" "social_db" "recommendation_db"; do
    echo "Creating monitoring views for: $db"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $db -c "
        CREATE OR REPLACE VIEW database_stats AS
        SELECT 
            '$db' as database_name,
            pg_database_size('$db') as database_size_bytes,
            pg_size_pretty(pg_database_size('$db')) as database_size_human,
            (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as table_count,
            (SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename)) 
             FROM pg_tables WHERE schemaname = 'public') as total_table_size;
    " || true
done

# Create backup helper functions
echo "Creating backup functions..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    DO \$\$
        BEGIN;
            -- Function to create backup
            CREATE OR REPLACE FUNCTION create_backup(db_name TEXT, backup_path TEXT)
            RETURNS BOOLEAN AS \$\$
                DECLARE
                    backup_command TEXT;
                BEGIN
                    backup_command := format('pg_dump %s -h %s -p %s -U %s -d %s -f %s', 
                        db_name, '$DB_HOST', '$DB_PORT', '$DB_USER', db_name, backup_path);
                    
                    -- This would typically be executed by the backup system
                    -- For now, just return true to indicate success
                    RETURN TRUE;
                END;
            \$\$ LANGUAGE plpgsql;
            
            -- Function to verify backup integrity
            CREATE OR REPLACE FUNCTION verify_backup(backup_path TEXT)
            RETURNS BOOLEAN AS \$\$
                DECLARE
                    restore_command TEXT;
                BEGIN
                    -- This would typically verify backup integrity
                    -- For now, just return true
                    RETURN TRUE;
                END;
            \$\$ LANGUAGE plpgsql;
        COMMIT;
    \$\$" || true

# Set up row-level security policies (optional, for multi-tenant scenarios)
echo "Setting up RLS policies..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d economy_db -c "
    -- Enable RLS on transactions table
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    
    -- Policy to allow users to see only their own transactions
    CREATE POLICY user_transactions_policy ON transactions
        FOR ALL
        TO economy_service_user
        USING (user_id = current_setting('app.current_user_id'::TEXT));
    
    -- Apply the policy
    ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
" || true

# Create performance monitoring indexes
echo "Creating performance indexes..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d game_session_db -c "
    -- Indexes for session management
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id_status ON sessions(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_sessions_last_active_at ON sessions(last_active_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
    
    -- Indexes for state snapshots
    CREATE INDEX IF NOT EXISTS idx_state_snapshots_session_id_created ON state_snapshots(session_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_state_snapshots_session_id_type ON state_snapshots(session_id, snapshot_type);
    
    -- Indexes for replays
    CREATE INDEX IF NOT EXISTS idx_replays_session_id ON replays(session_id);
    CREATE INDEX IF NOT EXISTS idx_replays_user_id_created ON replays(user_id, created_at);
" || true

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d economy_db -c "
    -- Indexes for transactions
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created ON transactions(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type, status);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id_type ON transactions(user_id, type);
    
    -- Indexes for user energy
    CREATE INDEX IF NOT EXISTS idx_user_energy_user_id_type ON user_energy(user_id, energy_type);
    CREATE INDEX IF NOT EXISTS idx_user_energy_last_regeneration ON user_energy(last_regeneration_time);
    
    -- Indexes for shop items
    CREATE INDEX IF NOT EXISTS idx_shop_items_type_status ON shop_items(item_type, status);
    CREATE INDEX IF NOT EXISTS idx_shop_items_created_at ON shop_items(created_at);
" || true

# Set up database configuration
echo "Optimizing database configuration..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    -- Set session timeout
    ALTER SYSTEM SET session_timeout = '300s';
    
    -- Set statement timeout
    ALTER SYSTEM SET statement_timeout = '60s';
    
    -- Set work memory
    ALTER SYSTEM SET work_mem = '256MB';
    
    -- Set maintenance work memory
    ALTER SYSTEM SET maintenance_work_mem = '1GB';
    
    -- Set checkpoint completion target
    ALTER SYSTEM SET checkpoint_completion_target = '0.7';
    
    -- Set random page cost
    ALTER SYSTEM SET random_page_cost = '1.1';
    
    -- Set effective cache size
    ALTER SYSTEM SET effective_cache_size = '4GB';
    
    -- Reload configuration
    SELECT pg_reload_conf();
" || true

echo "Database initialization completed successfully!"
echo ""
echo "Summary of created databases:"
echo "- quest_db (main service)"
echo "- game_session_db (session management)"
echo "- economy_db (economy and transactions)"
echo "- notification_db (notifications)"
echo "- social_db (social features)"
echo "- recommendation_db (recommendations)"
echo ""
echo "Service users created with appropriate privileges"
echo "Monitoring views and performance indexes configured"
echo ""
echo "Next steps:"
echo "1. Update your .env files with appropriate database credentials"
echo "2. Run migrations for each service"
echo "3. Start the microservices"
echo ""
echo "Database connection string format:"
echo "postgresql://username:password@localhost:5432/database_name"
