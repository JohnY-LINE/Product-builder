#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

echo "== Flow Regression Check =="

echo "[1/5] Base quick checks"
./scripts/quick_regression_check.sh >/dev/null || fail "quick regression failed"
pass "quick regression"

echo "[2/5] Core storage keys consistency"
for key in "lf.products.v1" "lf.templates.v1" "lf.product.categories.v1"; do
  rg -q "$key" main.js || fail "main.js missing key: $key"
  rg -q "$key" router.js || fail "router.js missing key: $key"
done
rg -q "lf.assets.v1" main.js || fail "main.js missing key: lf.assets.v1"
pass "shared storage keys"

echo "[3/5] Catalog update event wiring"
rg -q "lf:catalog-updated" main.js || fail "main.js missing catalog update listener"
rg -q "lf:catalog-updated" router.js || fail "router.js missing catalog update listener"
pass "catalog update event"

echo "[4/5] Route hardening wiring"
rg -q "safeDecodeUriSegment\\(parts\\[1\\]\\)" router.js || fail "route decode for id missing"
rg -q "safeDecodeUriSegment\\(parts\\[2\\]\\)" router.js || fail "route decode for nested id missing"
pass "route decode guards"

echo "[5/5] Image URL sanitize wiring"
rg -q "sanitizeImageUrl\\(asset\\.previewUrl\\)" main.js || fail "asset preview sanitize missing"
rg -q "sanitizeImageUrl\\(layer\\.src\\)" main.js || fail "layer src sanitize missing"
rg -q "sanitizeImageUrl\\(state\\.templatePreviewUrl \\|\\| currentTemplate\\.templateImageUrl \\|\\| \"\"\\)" main.js || fail "template bg sanitize missing"
pass "image sanitize guards"

echo "All flow checks passed."
