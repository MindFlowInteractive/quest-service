CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "player_export_schedules_format_enum" AS ENUM ('json', 'csv', 'pdf');
CREATE TYPE "player_export_schedules_cadence_enum" AS ENUM ('daily', 'weekly');

CREATE TABLE "player_export_schedules" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "playerId" uuid NOT NULL,
  "format" "player_export_schedules_format_enum" NOT NULL,
  "cadence" "player_export_schedules_cadence_enum" NOT NULL,
  "enabled" boolean NOT NULL DEFAULT true,
  "nextRunAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_player_export_schedules" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_player_export_schedules_player_enabled_next_run"
  ON "player_export_schedules" ("playerId", "enabled", "nextRunAt");