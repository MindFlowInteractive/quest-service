CREATE TABLE IF NOT EXISTS content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "contentId" uuid NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_content_revisions_content_version UNIQUE ("contentId", version)
);

INSERT INTO content_revisions ("contentId", version, snapshot)
SELECT
  id,
  COALESCE(CASE WHEN metadata->>'version' ~ '^[0-9]+$' THEN (metadata->>'version')::integer END, 1),
  jsonb_build_object(
    'id', id,
    'title', title,
    'contentType', "contentType",
    'category', category,
    'tags', tags,
    'content', content,
    'metadata', COALESCE(metadata, '{}'::jsonb),
    'version', COALESCE(CASE WHEN metadata->>'version' ~ '^[0-9]+$' THEN (metadata->>'version')::integer END, 1),
    'updatedAt', "updatedAt"
  )
FROM contents
ON CONFLICT ("contentId", version) DO NOTHING;

CREATE TABLE IF NOT EXISTS content_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "contentId" uuid NULL REFERENCES contents(id) ON DELETE SET NULL,
  "eventType" varchar(20) NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_delivery_events_type_created
  ON content_delivery_events ("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS idx_content_delivery_events_content_created
  ON content_delivery_events ("contentId", "createdAt");