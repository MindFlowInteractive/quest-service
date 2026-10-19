-- Co-operative puzzle solving (#447)
-- Adds team roles, per-player contribution tracking, shared win conditions
-- and persisted team chat to the collaborative session schema.

DO $$
BEGIN
  CREATE TYPE puzzle_player_role AS ENUM (
    'LEADER',
    'CONTRIBUTOR',
    'OBSERVER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE puzzle_session_players
  ADD COLUMN IF NOT EXISTS role puzzle_player_role NOT NULL DEFAULT 'CONTRIBUTOR';

ALTER TABLE puzzle_session_players
  ADD COLUMN IF NOT EXISTS contributions INTEGER NOT NULL DEFAULT 0;

ALTER TABLE puzzle_session_players
  ADD COLUMN IF NOT EXISTS contribution_points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE puzzle_session_players
  ADD COLUMN IF NOT EXISTS last_contribution_at TIMESTAMPTZ;

ALTER TABLE puzzle_sessions
  ADD COLUMN IF NOT EXISTS required_solved_steps JSONB NOT NULL DEFAULT '[]';

ALTER TABLE puzzle_sessions
  ADD COLUMN IF NOT EXISTS min_contributors INTEGER NOT NULL DEFAULT 1;

ALTER TABLE puzzle_sessions
  ADD COLUMN IF NOT EXISTS require_all_players BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS puzzle_session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES puzzle_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_puzzle_session_messages_session_created
  ON puzzle_session_messages(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_puzzle_session_players_session_role
  ON puzzle_session_players(session_id, role);
