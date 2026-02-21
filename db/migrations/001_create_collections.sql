-- Collections schema
CREATE TABLE IF NOT EXISTS category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id uuid REFERENCES category(id) ON DELETE SET NULL,
  difficulty integer NOT NULL DEFAULT 1,
  is_featured boolean NOT NULL DEFAULT false,
  reward_type TEXT NOT NULL DEFAULT 'points',
  reward_value integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_category ON collection(category_id);
CREATE INDEX IF NOT EXISTS idx_collection_featured ON collection(is_featured);

CREATE TABLE IF NOT EXISTS puzzle_collection (
  puzzle_id uuid NOT NULL,
  collection_id uuid NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  PRIMARY KEY(puzzle_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_pc_collection_order ON puzzle_collection(collection_id, order_index);

CREATE TABLE IF NOT EXISTS user_puzzle_completion (
  user_id uuid NOT NULL,
  puzzle_id uuid NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, puzzle_id)
);

CREATE TABLE IF NOT EXISTS user_collection_progress (
  user_id uuid NOT NULL,
  collection_id uuid NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
  completed_puzzles_count integer NOT NULL DEFAULT 0,
  total_puzzles integer NOT NULL DEFAULT 0,
  progress_percentage numeric NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  reward_claimed boolean NOT NULL DEFAULT false,
  PRIMARY KEY(user_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_ucp_user ON user_collection_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ucp_collection ON user_collection_progress(collection_id);
