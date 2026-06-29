#!/usr/bin/env bash
# scripts/setup.sh — One-command local setup for new contributors.
#
# What it does:
#   1. Verifies Node + npm versions match what the project expects.
#   2. Installs dependencies (npm ci if lockfile present, else npm install).
#   3. Copies .env.example -> .env if .env doesn't exist.
#   4. Optionally brings up Postgres/Redis/RabbitMQ via docker-compose.
#   5. Runs a quick smoke test (typecheck + lint:check) to catch setup issues.
#
# Usage:
#   bash scripts/setup.sh            # full setup, including docker
#   bash scripts/setup.sh --no-docker   # skip docker (use existing services)
#   bash scripts/setup.sh --skip-verify  # skip the smoke test
#
# Idempotent: safe to re-run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

REQUIRED_NODE_MAJOR=20
WITH_DOCKER=1
RUN_VERIFY=1

for arg in "$@"; do
  case "$arg" in
    --no-docker)   WITH_DOCKER=0 ;;
    --skip-verify) RUN_VERIFY=0 ;;
    -h|--help)
      sed -n '2,18p' "$0"
      exit 0
      ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

color() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
info()  { color "1;34" "→ $*"; }
ok()    { color "1;32" "✓ $*"; }
warn()  { color "1;33" "! $*"; }
err()   { color "1;31" "✗ $*" >&2; }

trap 'err "Setup failed on line $LINENO. See the error above."' ERR

# --- 1. Tooling check -------------------------------------------------------
info "Checking Node.js version"
if ! command -v node >/dev/null 2>&1; then
  err "Node.js is not installed. Install Node ${REQUIRED_NODE_MAJOR}.x and retry."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "${NODE_MAJOR}" != "${REQUIRED_NODE_MAJOR}" ]]; then
  warn "Expected Node ${REQUIRED_NODE_MAJOR}.x, found $(node -v)."
  warn "Tip: run \`nvm use\` (a .nvmrc is provided)."
  if [[ "${WITH_DOCKER}" -eq 0 ]]; then
    err "Refusing to continue without the right Node version (--no-docker mode)."
    exit 1
  fi
fi
ok "Node $(node -v)"

if ! command -v npm >/dev/null 2>&1; then
  err "npm is not installed."
  exit 1
fi
ok "npm $(npm -v)"

# --- 2. Install deps --------------------------------------------------------
info "Installing dependencies"
if [[ -f package-lock.json ]]; then
  npm ci
else
  warn "No package-lock.json found; falling back to \`npm install\`."
  npm install
fi
ok "Dependencies installed"

# --- 3. .env ----------------------------------------------------------------
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    ok "Created .env from .env.example — review and edit secrets before committing."
  else
    warn "No .env.example found; skipping .env creation."
  fi
else
  ok ".env already exists, leaving it alone"
fi

# --- 4. Docker --------------------------------------------------------------
if [[ "${WITH_DOCKER}" -eq 1 ]]; then
  if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
      info "Starting docker-compose stack"
      docker compose up -d || docker-compose up -d
      ok "Docker stack is up"
    else
      warn "Docker daemon not reachable. Start Docker Desktop and re-run, or pass --no-docker."
    fi
  else
    warn "Docker not installed. Skipping. Pass --no-docker to silence this."
  fi
else
  info "Skipping docker (--no-docker)"
fi

# --- 5. Verify --------------------------------------------------------------
if [[ "${RUN_VERIFY}" -eq 1 ]]; then
  info "Running smoke checks (lint:check + typecheck)"
  if npm run lint:check >/dev/null 2>&1; then
    ok "lint:check passed"
  else
    warn "lint:check reported issues — run \`npm run lint\` to auto-fix."
  fi
  if npm run typecheck >/dev/null 2>&1; then
    ok "typecheck passed"
  else
    warn "typecheck reported issues — run \`npm run typecheck\` for details."
  fi
fi

ok "Setup complete."
echo
echo "Next steps:"
echo "  npm run start:dev    # start the API on http://localhost:3000"
echo "  npm test             # run unit tests"
echo "  cat CONTRIBUTING.md  # read the contributor guide"
