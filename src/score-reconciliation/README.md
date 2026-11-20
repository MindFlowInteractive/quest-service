# Score Reconciliation

A scheduled job that checks queued score submissions against the stored
score records. It restores records that never got written and flags records
that disagree with the queue. It never overwrites a stored score.

## How a run works

1. Pick the window: submissions created between `now - lookback` and
   `now - grace`. The grace period leaves recent submissions alone so the
   queue's own retries can finish first.
2. Read the submissions in batches and load their records by idempotency key.
3. For each submission:
   - **No record**: create one from the queue (`source = reconciliation`)
     and mark the submission `confirmed`.
   - **Record matches**: mark the submission `confirmed` if it was not.
   - **Record differs** (`userId`, `puzzleId`, `score` or
     `completionTimeMs`): leave both rows as they are, set
     `needsReview = true` on the record, and open a conflict. If the key
     already has an open conflict, it is counted as already flagged.
   - **Error**: count it, keep the message, and continue with the next one.
4. Save the report. A report is saved for every run, including failed ones.

Runs cannot overlap. A scheduled run is skipped while another run is going,
and a manual run returns `409`.

## Report format

Table `score_reconciliation_reports`, one row per run:

| Field              | Meaning                                        |
| ------------------ | ---------------------------------------------- |
| `trigger`          | `scheduled` or `manual`                        |
| `status`           | `running`, `completed` or `failed`             |
| `windowStart`      | Oldest submission time checked                 |
| `windowEnd`        | Newest submission time checked (`now - grace`) |
| `checked`          | Submissions examined                           |
| `matched`          | Submissions whose record matched               |
| `restored`         | Missing records recreated from the queue       |
| `conflictsFlagged` | New conflicts opened in this run               |
| `alreadyFlagged`   | Mismatches that already had an open conflict   |
| `errors`           | Submissions that could not be processed        |
| `details`          | Keys behind the counts (see below)             |
| `failureReason`    | Why the run stopped, when `status` is `failed` |
| `startedAt`        | When the run started                           |
| `finishedAt`       | When the run ended                             |

`checked = matched + restored + conflictsFlagged + alreadyFlagged + errors`.

`details` looks like this. Each list keeps at most 100 entries and
`truncated` is `true` when any list was cut short:

```json
{
  "restoredKeys": ["a1b2c3"],
  "conflictKeys": ["d4e5f6"],
  "errors": [{ "idempotencyKey": "g7h8", "message": "connection reset" }],
  "truncated": false
}
```

Conflicts live in `score_reconciliation_conflicts` with the differing fields:

```json
{
  "idempotencyKey": "d4e5f6",
  "differences": [{ "field": "score", "queued": 1200, "stored": 900 }],
  "status": "open"
}
```

## Endpoints (admin only)

| Method | Path                                          | Purpose                      |
| ------ | --------------------------------------------- | ---------------------------- |
| POST   | `/score-reconciliation/run`                   | Run now, returns the report  |
| GET    | `/score-reconciliation/reports?limit=20`      | Latest reports               |
| GET    | `/score-reconciliation/reports/:reportId`     | One report                   |
| GET    | `/score-reconciliation/conflicts?status=open` | Conflicts to review          |
| PATCH  | `/score-reconciliation/conflicts/:id/resolve` | Close a conflict with a note |

## Settings

| Variable                              | Default | Meaning                        |
| ------------------------------------- | ------- | ------------------------------ |
| `SCORE_RECONCILIATION_ENABLED`        | `true`  | Set `false` to stop the cron   |
| `SCORE_RECONCILIATION_LOOKBACK_HOURS` | `72`    | How far back each run looks    |
| `SCORE_RECONCILIATION_GRACE_MINUTES`  | `10`    | Skip submissions newer than it |
| `SCORE_RECONCILIATION_BATCH_SIZE`     | `500`   | Submissions read per query     |

The job runs every hour.
