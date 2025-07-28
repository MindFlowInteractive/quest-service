#!/bin/bash

# Database Migration and Setup Script
# This script runs all migrations and sets up the game database schema

set -e  # Exit on any error

echo "🚀 Starting database migration process..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
    echo "✅ Environment variables loaded"
else
    echo "⚠️  .env file not found, using system environment variables"
fi

# Check if database connection variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Database connection variables are not set"
    echo "Required: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME"
    exit 1
fi

echo "📊 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Test database connection
echo "🔍 Testing database connection..."
if ! npx typeorm query "SELECT 1" -d src/config/orm-config.ts; then
    echo "❌ Cannot connect to database. Please check your configuration."
    exit 1
fi
echo "✅ Database connection successful"

# Build the project to ensure migrations are compiled
echo "🔨 Building project..."
npm run build

# Run migrations in order
echo "📋 Running database migrations..."

migrations=(
    "CreateGameDatabaseSchema"
    "CreateProgressAndAchievementTables"
    "CreateSupportingTables"
    "AddPerformanceIndexes"
    "AddDatabaseConstraints"
    "SeedInitialData"
)

for migration in "${migrations[@]}"; do
    echo "  📝 Running migration: $migration"
    if ! npx typeorm migration:run -d dist/config/orm-config.js; then
        echo "❌ Migration failed: $migration"
        exit 1
    fi
    echo "  ✅ Migration completed: $migration"
done

echo "🎉 All migrations completed successfully!"

# Verify database schema
echo "🔍 Verifying database schema..."

# Check if all main tables exist
tables=("users" "puzzles" "puzzle_categories" "achievements" "user_achievements" "puzzle_progress" "game_sessions" "puzzle_ratings" "user_stats")

for table in "${tables[@]}"; do
    if npx typeorm query "SELECT 1 FROM information_schema.tables WHERE table_name = '$table'" -d dist/config/orm-config.js | grep -q "1"; then
        echo "  ✅ Table exists: $table"
    else
        echo "  ❌ Table missing: $table"
        exit 1
    fi
done

# Check for sample data
echo "🔍 Verifying seed data..."
puzzle_count=$(npx typeorm query "SELECT COUNT(*) FROM puzzles" -d dist/config/orm-config.js | grep -o '[0-9]\+' | tail -1)
achievement_count=$(npx typeorm query "SELECT COUNT(*) FROM achievements" -d dist/config/orm-config.js | grep -o '[0-9]\+' | tail -1)
category_count=$(npx typeorm query "SELECT COUNT(*) FROM puzzle_categories" -d dist/config/orm-config.js | grep -o '[0-9]\+' | tail -1)

echo "  📊 Puzzles: $puzzle_count"
echo "  🏆 Achievements: $achievement_count"
echo "  📁 Categories: $category_count"

if [ "$puzzle_count" -gt 0 ] && [ "$achievement_count" -gt 0 ] && [ "$category_count" -gt 0 ]; then
    echo "✅ Seed data verified successfully"
else
    echo "⚠️  Some seed data may be missing"
fi

echo ""
echo "🎊 Database setup completed successfully!"
echo "📝 Summary:"
echo "  - All database tables created with proper relationships"
echo "  - Performance indexes added for optimal query performance"
echo "  - Database constraints and validation rules applied"
echo "  - Initial puzzle and achievement data seeded"
echo "  - Ready for development and testing!"
echo ""
echo "🚀 You can now start the application with: npm run start:dev"
