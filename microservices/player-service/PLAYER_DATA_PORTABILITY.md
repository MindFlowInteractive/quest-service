# Player Data Portability

The authenticated player API supports encrypted export, email delivery, recurring delivery, and validation of canonical JSON bundles. Exports cover the `players`, `player_profiles`, and `player_progress` data owned by this service. They intentionally omit password hashes and profile/progress foreign-key objects.

## API

- `GET /players/export?format=json|csv|pdf` downloads an encrypted artifact. The format defaults to `json`.
- `POST /players/export/email` with `{ "format": "json|csv|pdf" }` emails the encrypted artifact to the account email address.
- `POST /players/export-schedules` with `{ "format": "json|csv|pdf", "cadence": "daily|weekly" }` creates a recurring email schedule.
- `GET /players/export-schedules` lists the authenticated player's schedules.
- `DELETE /players/export-schedules/:id` removes one of the authenticated player's schedules.
- `POST /players/imports/validate` with `{ "data": <canonical JSON export> }` validates schema version 1. Validation does not write imported data to the database.

All endpoints require the existing JWT guard. JSON exports use schema version 1 and include player account fields, profile fields, and every progress record. CSV uses `section,record_id,field,value` rows so nested JSON values remain unambiguous. PDF is a formatted report containing the same exported records.

## Configuration

Set `EXPORT_ENCRYPTION_KEY` to a secret of at least 32 bytes. Artifacts use AES-256-GCM with a fresh random salt and IV per export and scrypt key derivation. The encrypted JSON envelope contains the format, algorithm, KDF, salt, IV, authentication tag, and ciphertext; it does not contain the key. Keep a protected backup of the key and deliver it to recipients through a separate secure channel. Losing it makes exports unrecoverable.

Email and schedules require `SMTP_HOST` and `SMTP_PORT`. Optional settings are `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE=true`, and `EXPORT_EMAIL_FROM`. Scheduled jobs are stored in the player database and checked once per minute. They are disabled when the associated account is inactive. SMTP failures are retried on the next scheduler pass.

The service's default `DB_SYNC=true` creates the schedule table automatically. For deployments with synchronization disabled, apply `migrations/001-create-player-export-schedules.sql` to the player database before starting the updated service.

## Privacy Scope

The JWT prevents one player from requesting another player's data, and export excludes credentials. This implementation covers only data persisted in this service; game, payment, analytics, and other microservice data require coordinated source integrations before an organization can claim a complete cross-service export. This API adds portability support but does not itself establish legal GDPR compliance; retention, deletion, lawful basis, processor handling, access logging, key management, and jurisdiction-specific review remain operational and legal responsibilities.
