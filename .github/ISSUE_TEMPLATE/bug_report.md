name: Bug report
description: Report broken or unexpected behavior
labels: ["bug", "triage"]

---

## Describe the bug

<!-- A clear, one-paragraph description of what went wrong. -->

## Steps to reproduce

1.
2.
3.

## Expected behavior

<!-- What you thought would happen. -->

## Actual behavior

<!-- What actually happened. Paste error output, stack traces, or screenshots. -->

```text
<paste logs here>
```

## Environment

- OS: <!-- e.g. macOS 14.4, Ubuntu 22.04, Windows 11 -->
- Node version: <!-- output of `node -v` -->
- Branch / commit: <!-- output of `git rev-parse --abbrev-ref HEAD` and `git rev-parse --short HEAD` -->
- Install method: <!-- npm ci / npm install / Docker -->
- Are you running: <!-- local / docker-compose / production / staging -->

## Minimal reproduction

<!--
If possible, a repo, code snippet, or curl command that reproduces the issue.
Example:
  curl -X POST http://localhost:3000/api/v1/auth/wallet/challenge \
    -H 'Content-Type: application/json' \
    -d '{"walletAddress":"GABC..."}'
-->

## Possible cause

<!-- Optional: your hypothesis about the root cause. -->

## Additional context

<!-- Anything else that might help — related issues, PRs, screenshots. -->
