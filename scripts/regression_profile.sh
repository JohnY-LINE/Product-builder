#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

profile="${1:-ci}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/regression_profile.sh [local|ci|strict]

Profiles:
  local   : 빠른 로컬 점검 (E2E 미실행)
  ci      : CI 기본 점검 (E2E 실행, 실패 대신 SKIP 허용)
  strict  : 강제 점검 (E2E 필수, SKIP도 실패 처리)
EOF
}

case "$profile" in
  local)
    export RUN_E2E_SMOKE=0
    export E2E_REQUIRED=0
    ;;
  ci)
    export RUN_E2E_SMOKE=1
    export E2E_REQUIRED=0
    ;;
  strict)
    export RUN_E2E_SMOKE=1
    export E2E_REQUIRED=1
    ;;
  -h|--help|help)
    usage
    exit 0
    ;;
  *)
    echo "[FAIL] unknown profile: $profile"
    usage
    exit 1
    ;;
esac

echo "== Regression Profile =="
echo "profile=${profile}"
echo "RUN_E2E_SMOKE=${RUN_E2E_SMOKE}"
echo "E2E_REQUIRED=${E2E_REQUIRED}"

./scripts/full_regression_suite.sh
