-- Create emails schema
CREATE SCHEMA IF NOT EXISTS emails;

-- Set search path
SET search_path TO emails;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
