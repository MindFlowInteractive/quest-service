CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE puzzle_session_status AS ENUM (
    'WAITING',
    'ACTIVE',
    'COMPLETED',
    'EXPIRED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE puzzle_player_status AS ENUM (
    'CONNECTED',
    'DISCONNECTED',
    'LEFT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS puzzle_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id VARCHAR(128) NOT NULL,
  status puzzle_session_status NOT NULL DEFAULT 'WAITING',
  max_players INTEGER NOT NULL DEFAULT 10,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS puzzle_session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES puzzle_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL,
  status puzzle_player_status NOT NULL DEFAULT 'CONNECTED',
  score INTEGER NOT NULL DEFAULT 0,
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMPTZ,
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_puzzle_session_players_session
  ON puzzle_session_players(session_id);

CREATE TABLE IF NOT EXISTS puzzle_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES puzzle_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(128),
  type VARCHAR(64) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_puzzle_session_events_session_created
  ON puzzle_session_events(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS puzzle_session_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES puzzle_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL,
  step_id VARCHAR(128),
  content TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  confidence DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
