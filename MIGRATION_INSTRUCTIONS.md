# A/B Testing Migration Instructions

## Option 1: Run Migration Script (Recommended)

```bash
# Make script executable
chmod +x run-ab-testing-migration.sh

# Run migration
./run-ab-testing-migration.sh
```

## Option 2: Run SQL Manually

```bash
# Connect to PostgreSQL
psql -h localhost -p 5432 -U postgres -d myapp

# Then run the SQL from sql/create-ab-testing-tables.sql
```

## Option 3: Use npm script

```bash
npm run migration:run
```

## What Gets Created

### Tables:
1. **experiments** - Experiment definitions
2. **experiment_conversions** - Conversion events
3. **experiment_assignments** - User-variant assignments
4. **feature_flags** - Feature flag definitions

### Indexes:
- Indexes for performance on all foreign keys and status fields

### Default Feature Flags:
- `new_puzzle_ui` (10% rollout)
- `premium_rewards` (100% for premium users)
- `tutorial_v2` (disabled)
- `social_features` (50% rollout)
- `mobile_optimizations` (100% rollout)

## Verification

After migration, verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('experiments', 'experiment_conversions', 'experiment_assignments', 'feature_flags');
```

## Troubleshooting

### If PostgreSQL isn't running:
```bash
# Start PostgreSQL (Ubuntu/Debian)
sudo service postgresql start

# Or using Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres
```

### If connection fails:
Check your `.env` file has correct credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=password
```

### If tables already exist:
The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.