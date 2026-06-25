# Segmentation Service

Independent NestJS microservice that manages user cohorts for targeted campaigns,
A/B testing, and personalization inside the Quest Service platform.

## Highlights

- **Segments** defined declaratively by ordered rule groups (AND / OR combinators).
- **Rule-based**, **behavioral**, and **demographic** segmentation engines.
- **Real-time membership updates** through an event feed (signals + scheduled
  evaluations + Redis cache invalidation).
- **Overlap analysis** between two or more segments and a flexible **size metric**
  stream for dashboards.
- **A/B Experiment assignments** with deterministic hashing, sticky variants, and
  configurable traffic splits.
- **Docker** support (Postgres + Redis + service) with one-command bring-up.
- **Independent runtime**: the service can be deployed, scaled, and tested in
  isolation from the rest of the platform.

## Project Layout

```
microservices/segmentation-service/
├── Dockerfile
├── docker-compose.yml
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── app.controller.ts
    └── segmentation/
        ├── segmentation.module.ts
        ├── segmentation.controller.ts
        ├── segmentation.service.ts
        ├── segmentation-rule-engine.service.ts
        ├── segmentation.scheduler.ts
        ├── redis-cache.service.ts
        ├── entities/
        │   ├── segment.entity.ts
        │   ├── rule.entity.ts
        │   ├── membership.entity.ts
        │   ├── segment-event.entity.ts
        │   └── ab-experiment.entity.ts
        ├── dto/
        │   ├── create-segment.dto.ts
        │   ├── update-segment.dto.ts
        │   ├── create-rule.dto.ts
        │   ├── ingest-user-event.dto.ts
        │   ├── evaluate-segment.dto.ts
        │   ├── create-experiment.dto.ts
        │   └── assign-experiment.dto.ts
        └── interfaces/
            └── user-signal.interface.ts
```

## Run Locally

```bash
cp .env.example .env
npm install
npm run start:dev
```

Or bring the service up together with Postgres and Redis:

```bash
docker compose up --build
```

## Useful Endpoints

| Method | Path                                    | Purpose                                |
| ------ | --------------------------------------- | -------------------------------------- |
| GET    | `/api/health`                           | Liveness probe                         |
| GET    | `/api/segments`                         | List every segment                     |
| POST   | `/api/segments`                         | Create a segment (with inline rules)   |
| GET    | `/api/segments/:id`                     | Fetch a single segment with rules      |
| PATCH  | `/api/segments/:id`                     | Update segment metadata / status       |
| DELETE | `/api/segments/:id`                     | Archive / delete a segment             |
| POST   | `/api/segments/:id/rules`               | Append a new rule to a segment         |
| DELETE | `/api/segments/:id/rules/:ruleId`       | Remove a rule from a segment           |
| POST   | `/api/segments/:id/evaluate`            | Force a re-evaluation of members       |
| POST   | `/api/segments/:id/membership`          | Manually add / remove members          |
| GET    | `/api/segments/:id/members`             | List current members of a segment      |
| GET    | `/api/segments/:id/size`                | Read cached size + last computed time  |
| POST   | `/api/segments/:id/check/:userId`       | Check whether a user matches a segment |
| POST   | `/api/events`                           | Send a behavioral signal               |
| POST   | `/api/segments/overlap`                 | Compute overlap between segment ids    |
| POST   | `/api/experiments`                      | Create a new A/B experiment            |
| POST   | `/api/experiments/:id/assign`           | Assign (and cache) a variant for user  |
| GET    | `/api/dashboard`                        | Service-wide summary                   |

## Rule Schema

```jsonc
{
  "field": "country",
  "operator": "equals",
  "value": "US",
  "combinator": "AND",
  "order": 0
}
```

Operators: `equals`, `notEquals`, `in`, `notIn`, `contains`, `notContains`,
`gt`, `gte`, `lt`, `lte`, `between`, `exists`, `notExists`, `regex`.

Behavioral fields: `action`, `eventCount`, `lastEventAt`, `totalSpend`,
`level`, `xp`, `streak`, `consecutiveDays`. They are evaluated against the
freshest user signal stored under `segmentation:user:{userId}` in Redis.

## Tests

```bash
npm run lint:check
npm run type-check
npm run test
```

## Docker Build

```bash
docker build -t segmentation-service .
docker run --rm -p 3023:3023 segmentation-service
```
