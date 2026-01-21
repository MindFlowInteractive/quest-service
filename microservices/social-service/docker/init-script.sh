#!/bin/bash
set -e

echo "Initializing Social Service database schema..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- Create social schema if it doesn't exist
  CREATE SCHEMA IF NOT EXISTS social;

  -- Grant privileges
  GRANT ALL PRIVILEGES ON SCHEMA social TO "$POSTGRES_USER";

  -- Set default schema for the user
  ALTER ROLE "$POSTGRES_USER" SET search_path TO social, public;

  -- Create a specific role for the social service if needed
  -- DO
  -- \$do\$
  -- BEGIN
  --    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'social_user') THEN
  --       CREATE ROLE social_user WITH LOGIN PASSWORD 'secure_password';
  --       GRANT USAGE ON SCHEMA social TO social_user;
  --       GRANT CREATE ON SCHEMA social TO social_user;
  --    END IF;
  -- END
  -- \$do\$;

  -- Enable required extensions
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

EOSQL

echo "Social Service database schema initialization completed!"
