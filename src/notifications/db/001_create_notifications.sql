CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_status'
  ) THEN
    CREATE TYPE notification_status AS ENUM (
      'PENDING',
      'PROCESSING',
      'DELIVERED',
      'READ',
      'FAILED'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_delivery_status'
  ) THEN
    CREATE TYPE notification_delivery_status AS ENUM (
      'PENDING',
      'DELIVERED',
      'FAILED'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_type'
  ) THEN
    CREATE TYPE notification_type AS ENUM (
      'QUEST_ASSIGNED',
      'QUEST_COMPLETED',
      'QUEST_APPROVED',
      'QUEST_REJECTED',
      'REWARD_RECEIVED',
      'ACHIEVEMENT_UNLOCKED',
      'LEVEL_UP',
      'BADGE_EARNED',
      'SYSTEM'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(128) NOT NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  status notification_status NOT NULL DEFAULT 'PENDING',
  read_at TIMESTAMPTZ,
  deduplication_key VARCHAR(255) UNIQUE,
  aggregation_key VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON notifications(user_id, status);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL UNIQUE
    REFERENCES notifications(id) ON DELETE CASCADE,
  status notification_delivery_status NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(128) NOT NULL UNIQUE,

  quest_assigned BOOLEAN NOT NULL DEFAULT TRUE,
  quest_completed BOOLEAN NOT NULL DEFAULT TRUE,
  quest_approved BOOLEAN NOT NULL DEFAULT TRUE,
  quest_rejected BOOLEAN NOT NULL DEFAULT TRUE,
  reward_received BOOLEAN NOT NULL DEFAULT TRUE,
  achievement_unlocked BOOLEAN NOT NULL DEFAULT TRUE,
  level_up BOOLEAN NOT NULL DEFAULT TRUE,
  badge_earned BOOLEAN NOT NULL DEFAULT TRUE,
  system BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
