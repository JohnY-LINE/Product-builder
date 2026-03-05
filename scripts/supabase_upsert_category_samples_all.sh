#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[1/3] products"
"$ROOT_DIR/scripts/supabase_upsert_category_samples.sh"
echo

echo "[2/3] templates"
"$ROOT_DIR/scripts/supabase_upsert_category_sample_templates.sh"
echo

echo "[3/3] assets"
"$ROOT_DIR/scripts/supabase_upsert_category_sample_assets.sh"
echo

echo "All category sample upserts completed."
