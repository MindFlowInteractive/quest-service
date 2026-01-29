-- Database initialization script
-- Run this if you need to manually set up the database

CREATE DATABASE storage_db;

\c storage_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  path VARCHAR(500) NOT NULL,
  bucket VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  cdn_url VARCHAR(500),
  user_id VARCHAR(100) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  previous_version_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID,
  user_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  processing_metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_files_user_category ON files(user_id, category);
CREATE INDEX idx_files_deleted ON files(deleted_at);
CREATE INDEX idx_files_user ON files(user_id);
CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_metadata_file ON file_metadata(file_id);
CREATE INDEX idx_metadata_file_key ON file_metadata(file_id, key);

-- Foreign keys
ALTER TABLE file_metadata
  ADD CONSTRAINT fk_metadata_file
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;

-- Comments
COMMENT ON TABLE files IS 'Stores file metadata and references';
COMMENT ON TABLE uploads IS 'Tracks file upload status and processing';
COMMENT ON TABLE file_metadata IS 'Flexible key-value metadata storage';

-- ============================================================================
-- FILE: microservices/storage-service/scripts/seed-data.sql
-- ============================================================================
-- Sample data for testing

-- Insert test files
INSERT INTO files (
  id,
  original_name,
  file_name,
  mime_type,
  size,
  path,
  bucket,
  category,
  user_id,
  is_public,
  version
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'puzzle-1.jpg',
    '1234567890-abc123.jpg',
    'image/jpeg',
    1048576,
    'puzzle/user123/1234567890-abc123.jpg',
    'puzzle-storage',
    'puzzle',
    'user123',
    true,
    1
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'avatar.png',
    '1234567891-def456.png',
    'image/png',
    524288,
    'avatar/user123/1234567891-def456.png',
    'puzzle-storage',
    'avatar',
    'user123',
    false,
    1
  );

-- Insert test uploads
INSERT INTO uploads (
  id,
  file_id,
  user_id,
  status
) VALUES
  (
    '650e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'user123',
    'completed'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'user123',
    'completed'
  );

-- Insert test metadata
INSERT INTO file_metadata (
  file_id,
  key,
  value
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'optimized',
    'true'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'originalWidth',
    '1920'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'originalHeight',
    '1080'
  );

// ============================================================================
// FILE: microservices/storage-service/Makefile
// ============================================================================
.PHONY: help install build start dev test clean docker-build docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

build: ## Build the application
	npm run build

start: ## Start the application in production mode
	npm run start:prod

dev: ## Start the application in development mode
	npm run start:dev

test: ## Run tests
	npm test

test-e2e: ## Run e2e tests
	npm run test:e2e

lint: ## Lint the code
	npm run lint

format: ## Format the code
	npm run format

clean: ## Clean build artifacts
	rm -rf dist node_modules coverage

docker-build: ## Build Docker image
	docker build -t storage-service:latest .

docker-up: ## Start Docker Compose services
	docker-compose up -d

docker-down: ## Stop Docker Compose services
	docker-compose down

docker-logs: ## View Docker Compose logs
	docker-compose logs -f storage-service

docker-restart: docker-down docker-up ## Restart Docker services

db-init: ## Initialize database with schema
	docker-compose exec postgres psql -U postgres -f /scripts/init-db.sql

db-seed: ## Seed database with test data
	docker-compose exec postgres psql -U postgres -d storage_db -f /scripts/seed-data.sql

minio-create-bucket: ## Create MinIO bucket manually
	docker-compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin
	docker-compose exec minio mc mb myminio/puzzle-storage --ignore-existing

.DEFAULT_GOAL := help