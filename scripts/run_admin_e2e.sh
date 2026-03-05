#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${E2E_PORT:-4173}"
HOST="${E2E_HOST:-127.0.0.1}"
BASE_URL="${E2E_BASE_URL:-http://${HOST}:${PORT}}"
E2E_REQUIRED="${E2E_REQUIRED:-0}"

SERVER_PID=""
cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "== Run Admin E2E (Playwright) =="
echo "Serving: ${BASE_URL}"
echo "E2E_REQUIRED=${E2E_REQUIRED}"

python3 -m http.server "${PORT}" --bind "${HOST}" >/tmp/admin_e2e_server.log 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  if curl -sS -m 1 "${BASE_URL}/index.html" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

if ! curl -sS -m 2 "${BASE_URL}/index.html" >/dev/null 2>&1; then
  echo "[FAIL] local http server did not start"
  exit 1
fi

E2E_BASE_URL="${BASE_URL}" E2E_REQUIRED="${E2E_REQUIRED}" node scripts/admin_e2e_smoke_playwright.mjs
