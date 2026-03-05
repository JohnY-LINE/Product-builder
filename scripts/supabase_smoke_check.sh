#!/usr/bin/env bash
set -euo pipefail

URL="${SUPABASE_URL:-https://rdvvnnspothqtxwdobtp.supabase.co}"
KEY="${SUPABASE_ANON_KEY:-sb_publishable_ZUdtCg1dNvzKcVXDxDG7Lw_0eDI_rHL}"

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  SUPABASE_URL=... SUPABASE_ANON_KEY=... ./scripts/supabase_smoke_check.sh

Checks:
  1) products table select
  2) templates select with product_id
  3) assets select with product_id
  4) storage list on editor-assets
EOF
  exit 0
fi

call_get() {
  local path="$1"
  curl -sS -m 15 "$URL/rest/v1/$path" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Accept: application/json"
}

echo "== Supabase Smoke Check =="
echo "URL: $URL"
echo

echo "[1/4] products select"
call_get "products?select=id,name,canvas_mode&limit=1"
echo
echo

echo "[2/4] templates select with product_id"
call_get "templates?select=id,product_id,name,width_mm,height_mm,dpi&limit=2"
echo
echo

echo "[3/4] assets select with product_id"
call_get "assets?select=id,product_id,title,name,size,mime_type&limit=2"
echo
echo

echo "[4/4] storage list editor-assets"
curl -sS -m 15 "$URL/storage/v1/object/list/editor-assets" \
  -X POST \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"prefix":"","limit":3,"offset":0}'
echo
