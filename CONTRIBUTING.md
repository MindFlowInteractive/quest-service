# Contributing to Quest Service

Thanks for your interest in contributing! This guide is intentionally short — it covers the **three things** that will get your PR merged fastest.

---

## 1. Local setup (one command)

```bash
# Prereqs: Node 20+, npm 10+, Docker (for Postgres/Redis/RabbitMQ)
nvm use            # picks up the version pinned in .nvmrc
npm install
npm run setup      # creates .env from .env.example and brings up docker
```

> If you don't use Docker, edit `.env` to point at a local Postgres/Redis/RabbitMQ.

Verify the install with a quick smoke test:

```bash
npm run typecheck  # zero errors expected
npm run lint       # zero errors expected
npm test           # unit tests pass
```

---

## 2. Before opening a PR — run this checklist

Run the same checks CI runs:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
```

All four must pass. If `format:check` fails, run `npm run format` to auto-fix.

### Style at a glance

- **TypeScript**: 2-space indent, single quotes, trailing commas, semicolons (see `.editorconfig` + `.prettierrc`).
- **NestJS**: one module per folder under `src/`. Each module exports a `*.module.ts` plus a controller, service, and DTOs.
- **Naming**: `kebab-case` for files & folders, `PascalCase` for classes, `camelCase` for variables/functions.
- **Imports**: use the explicit relative path (e.g. `../users/users.module`) — avoid deep `@/` aliases unless one already exists.
- **Don't**: disable ESLint rules, add `// @ts-ignore`, or weaken `tsconfig.json` to make errors go away. Fix the code.

### Common bug sources to avoid

| Symptom                                               | Fix                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Type 'undefined' is not assignable` after an `await` | Add a null-check or use `?? defaultValue`                                                   |
| Service method returns `Promise<undefined>`           | Return a value or annotate as `Promise<void>`                                               |
| Config value is `string \| undefined`                 | Use `configService.get<...>('KEY', defaultValue)` and provide a default                     |
| Circular dependency crash                             | Move shared code into a third module; never import services across `app.module.ts` siblings |

---

## 3. PR rules

- **One concern per PR.** Don't bundle a refactor with a feature.
- **Reference an issue** with `Fixes #123` in the description.
- **Add or update tests** for any behavior change. New code without a test will be asked to add one.
- **Fill in the PR template** (`.github/PULL_REQUEST_TEMPLATE.md`). The CI bot blocks PRs that don't.
- **Keep diffs small.** Aim for <300 lines changed. Large refactors should be split.

A maintainer will review within 2 business days. If you don't hear back, ping the issue.

---

## Reporting bugs

Use the **Bug report** issue template at `.github/ISSUE_TEMPLATE/bug_report.md`. A great bug report includes:

1. What you did (steps to reproduce)
2. What you expected
3. What happened (logs/screenshots)
4. Environment: OS, Node version, branch, commit SHA

Security issues: see `SECURITY.md` (or open a private security advisory — **do not** file a public issue).

---

## Project layout (the short version)

```
src/
  app.module.ts        # root composition root — add new modules here
  main.ts              # bootstrap, helmet, cors, validation, sentry
  config/              # env validation + app config
  common/              # filters, interceptors, pipes, decorators
  <feature>/           # one folder per feature module
    <feature>.module.ts
    <feature>.controller.ts
    <feature>.service.ts
    dto/
    entities/
    tests/             # *.spec.ts colocated with source
```

---

## Need help?

Open a question in Discussions, or ask in the PR — there's no such thing as a dumb question.
