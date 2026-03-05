#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

echo "== Quick Regression Check =="

echo "[1/4] Syntax"
node --check main.js >/dev/null || fail "main.js syntax error"
node --check router.js >/dev/null || fail "router.js syntax error"
node --check api-client.js >/dev/null || fail "api-client.js syntax error"
pass "node --check"

echo "[2/4] Hardened helpers present"
rg -q "function sanitizeImageUrl" main.js || fail "main.js sanitizeImageUrl missing"
rg -q "function renderStatusLines" main.js || fail "main.js renderStatusLines missing"
rg -q "function safeDecodeUriSegment" router.js || fail "router.js safeDecodeUriSegment missing"
pass "helper functions"

echo "[3/4] Route decode + image-url guard wired"
rg -q "safeDecodeUriSegment\\(parts\\[1\\]\\)" router.js || fail "route param decode not applied"
rg -q "sanitizeImageUrl\\(state\\.templatePreviewUrl \\|\\| currentTemplate\\.templateImageUrl \\|\\| \"\"\\)" main.js || fail "template bg sanitize missing"
pass "routing/image guards"

echo "[4/4] Validation status render wiring"
rg -q "renderStatusLines\\(\\$\\(\"warnBox\"\\)" main.js || fail "warnBox status renderer wiring missing"
rg -q "renderStatusLines\\(\\$\\(\"okBox\"\\)" main.js || fail "okBox status renderer wiring missing"
pass "status renderer"

echo "All quick checks passed."
