#!/bin/bash
set -e

# Function to create a database
create_db() {
    local database=$1
    echo "  Creating database '$database'..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"<<-EOSQL
        CREATE DATABASE $database;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

# Create the databases
create_db "quest_db"
create_db "notification_db"
create_db "social_db"

echo "All microservice databases created successfully!"