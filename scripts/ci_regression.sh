#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PROFILE="${REGRESSION_PROFILE:-ci}"

echo "== CI Regression =="
echo "REGRESSION_PROFILE=${PROFILE}"

./scripts/regression_profile.sh "${PROFILE}"
