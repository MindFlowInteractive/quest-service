# Bounty Security Service

A NestJS microservice for managing a security bug-bounty program end-to-end:

- Vulnerability reports submitted by security researchers
- Automated **severity assessment** (CVSS-aware, explainable)
- Bounty programs with configurable **reward tiers** per severity
- Strict **workflow state machine**: `NEW → TRIAGED → VERIFIED → FIXED`
- Resettable **researcher reputation** (streaks, ranks, lifetime earnings)
- **Reward distribution** workflow: `PENDING → APPROVED → PAID`
- **Leaderboards** — top researchers globally, per-bounty, or per time window
- Independent PostgreSQL database, deployable with `docker compose up`

## Quick start

```bash
cp .env.example .env
# (edit DB creds if you want)
docker compose up --build
# -> http://localhost:3030/api (Swagger)
# -> http://localhost:3030/health
```

For local development without Docker:

```bash
npm install
DB_HOST=localhost npm run start:dev
```

## Architecture

```
src/
├── entities/
│   ├── report.entity.ts          # VulnerabilityReport (the workflow doc)
│   ├── bounty.entity.ts          # Bounty (scope, tiers, lifecycle)
│   ├── reward.entity.ts          # Reward (PENDING → APPROVED → PAID)
│   ├── researcher.entity.ts      # Researcher (reputation snapshot)
│   └── report-status.enum.ts     # SeverityTier, ReportStatus, RewardStatus...
├── dto/                          # class-validator DTOs grouped by feature
├── services/
│   ├── severity.service.ts       # CVSS-aware severity engine
│   ├── reports.service.ts        # Submission + workflow transitions
│   ├── bounties.service.ts       # Bounty CRUD + reward tier resolution
│   ├── rewards.service.ts        # Reward lifecycle + researcher earnings
│   ├── researchers.service.ts    # Researcher CRUD + reputation tracking
│   └── leaderboard.service.ts    # Rankings (by reputation / by bounty)
├── controllers/
│   ├── reports.controller.ts
│   ├── bounties.controller.ts
│   ├── researchers.controller.ts
│   ├── rewards.controller.ts
│   ├── leaderboard.controller.ts
│   └── health.controller.ts
├── app.module.ts
└── main.ts                       # Bootstrap w/ Swagger + ValidationPipe
```

## REST Endpoints (highlights)

| Method | Path                                  | Description                                |
| ------ | ------------------------------------- | ------------------------------------------ |
| `POST` | `/reports`                            | Submit a vulnerability report              |
| `POST` | `/reports/:id/transition`             | Walk a report through the workflow         |
| `POST` | `/bounties`                           | Create a bounty program                    |
| `GET`  | `/bounties/by-slug/:slug`             | Look up a bounty by URL slug               |
| `POST` | `/researchers`                        | Register a researcher                      |
| `PATCH`| `/rewards/:id/approve`                | Approve a pending reward                   |
| `PATCH`| `/rewards/:id/pay`                    | Mark an approved reward paid               |
| `GET`  | `/leaderboard/researchers?period=week`| Top researchers (time-window scoped)       |
| `GET`  | `/leaderboard/bounties/:id/researchers` | Top researchers per bounty              |
| `GET`  | `/health`                             | Liveness + stat snapshot                   |

Open `/api` for full Swagger.

## Workflow

```
              ┌─────────┐
              │   NEW   │  ← researcher submits report
              └────┬────┘
                   │ triage
       ┌───────────┼─────────────┐
       ▼           ▼             ▼
  ┌────────┐  ┌─────────┐   ┌──────────┐
  │TRIAGED │  │REJECTED │   │DUPLICATE │
  └────┬───┘  └─────────┘   └──────────┘
       │ verified
       ▼
  ┌─────────┐
  │VERIFIED │  ← severity locked, reputation credited
  └────┬────┘
       │ patch deployed
       ▼
   ┌───────┐
   │ FIXED │  ← reward row auto-created in PENDING
   └───────┘
```

State transitions are enforced by the `TRANSITIONS` matrix in
`services/reports.service.ts`. Any `VALID` transition also triggers:

- **TRIAGED** → severity is recomputed by the engine; rationale stored on the row.
- **VERIFIED / FIXED / REJECTED / DUPLICATE** → researcher reputation and streak are updated.
- **FIXED** → a `Reward` row is created at `PENDING` with the bounty-tier midpoint.

## Severity assessment

`SeverityService.assess()` takes the researcher's claimed severity, an optional
CVSS score or vector, the affected component, and a high-level impact tag.
It folds in component criticality (auth/payment/admin… get a 1.25× boost) and
an impact multiplier (RCE = 1.5×, best-practice = 0.5×).

Output:

```ts
{
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info',
  score: 0–100,
  rationale: {
    cvss?, componentBoost, impactMultiplier, notes: string[]
  }
}
```

The full rationale is persisted on the report (`severityRationale`) so an
auditor can later see *why* a severity was assigned.

## Reputation

Points awarded per accepted report, configurable via env:

| Severity | Default Δ |
| -------- | --------- |
| CRITICAL | +100 |
| HIGH     | +60  |
| MEDIUM   | +30  |
| LOW      | +10  |
| REJECTED | -5   |

Researcher ranks are derived from reputation:

| Reputation | Rank      |
| ---------- | --------- |
| ≥ 5000     | diamond   |
| ≥ 2000     | platinum  |
| ≥ 1000     | gold      |
| ≥ 300      | silver    |
| else       | bronze    |

## Reward tiers

Bounty authors configure a tier per severity:

```json
{
  "tiers": [
    { "severity": "critical", "minAmount": 5000, "maxAmount": 10000, "currency": "USD" },
    { "severity": "high",     "minAmount": 1000, "maxAmount": 2500,  "currency": "USD" },
    { "severity": "medium",   "minAmount": 250,  "maxAmount": 750,   "currency": "USD" }
  ]
}
```

If a bounty has no tiers, the global defaults from `.env` are applied.
The reward service uses the tier midpoint as the suggested payout, so the
security team can adjust before approving.

## Environment variables

See `.env.example`. Notable knobs:

- `DEFAULT_REWARD_{CRITICAL|HIGH|MEDIUM|LOW|INFO}` — global fallback tier amounts.
- `REPUTATION_ACCEPTED_*`, `REPUTATION_REJECTED_PENALTY` — reputation deltas.
- `SLA_TRIAGE_HOURS`, `SLA_VERIFY_HOURS` — informational SLAs (used by future reporting).
- `DB_SYNC=true` — for dev only. In production, prefer proper TypeORM migrations.

## Tests

```bash
npm test
```

Coverage focuses on:

- `SeverityService` — severity boundaries, CVSS parsing, overrides.
- `ReportsService` — state machine enforcement, audit trail, reward auto-creation.

## Production hardening

This scaffold uses `DB_SYNC=true` for local development. For production:

1. Disable `DB_SYNC`, generate real TypeORM migrations (`migration:generate`).
2. Move `transactionRef` integration to your real payment provider (Tremendous, Coinbase Commerce, etc.) behind an outbox pattern.
3. Add rate-limiting + CAPTCHA on `/reports` to deflect spam submissions.
4. Enforce content security on `/reports` — restrict file sizes, mime types, and run uploaded PoCs through a malware scanner.
5. Add SSO / `researcher_handle` gating through your identity service before awarding rewards.
