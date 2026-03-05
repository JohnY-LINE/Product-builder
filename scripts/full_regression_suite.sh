#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Full Regression Suite =="

./scripts/quick_regression_check.sh
echo
./scripts/flow_regression_check.sh
echo
./scripts/admin_flow_regression_check.sh

run_e2e="${RUN_E2E_SMOKE:-0}"
if [[ "${E2E_REQUIRED:-0}" == "1" ]]; then
  run_e2e="1"
fi

if [[ "${run_e2e}" == "1" ]]; then
  echo
  E2E_REQUIRED="${E2E_REQUIRED:-0}" ./scripts/run_admin_e2e.sh
fi

echo
echo "Full regression suite passed."
