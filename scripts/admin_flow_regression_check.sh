#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

echo "== Admin Flow Regression Check =="

echo "[1/6] Admin product save flow wiring"
rg -Fq '$("addProductBtn").addEventListener("click"' main.js || fail "addProductBtn handler missing"
rg -Fq 'if(!id || !name)' main.js || fail "product id/name guard missing"
rg -Fq 'await upsertProduct(product)' main.js || fail "product upsert call missing"
pass "product save flow"

echo "[2/6] Admin category add/subcategory wiring"
rg -Fq '$("adminAddCategoryBtn").addEventListener("click"' main.js || fail "adminAddCategoryBtn handler missing"
rg -Fq 'renderAdminProductSubcategorySelect' main.js || fail "subcategory render function missing"
rg -Fq '$("adminProductCategory").addEventListener("change"' main.js || fail "category change -> subcategory sync missing"
pass "category/subcategory flow"

echo "[3/6] Admin template save flow wiring"
rg -Fq '$("addTemplateBtn").addEventListener("click"' main.js || fail "addTemplateBtn handler missing"
rg -Fq 'await upsertTemplate(tpl)' main.js || fail "template upsert call missing"
rg -Fq 'syncAdminTemplatePageOptions(id)' main.js || fail "template page option sync missing"
pass "template save flow"

echo "[4/6] Router admin category delete/reorder wiring"
rg -Fq 'function renderAdminCategoryOrder()' router.js || fail "renderAdminCategoryOrder missing"
rg -Fq 'data-order-action="delete"' router.js || fail "category delete action button missing"
rg -Fq 'const removeCategory = (target) => {' router.js || fail "removeCategory logic missing"
pass "category reorder/delete flow"

echo "[5/6] Router selected product delete wiring"
rg -Fq 'adminDeleteSelectedProductsBtn' router.js || fail "selected delete button wiring missing"
rg -Fq '삭제할 상품을 체크하세요.' router.js || fail "selected-delete empty guard missing"
rg -Fq '선택한 ${targetIds.length}개 상품을 삭제할까요?' router.js || fail "selected-delete confirm guard missing"
pass "selected product delete flow"

echo "[6/6] Catalog sync event propagation"
rg -Fq 'new CustomEvent("lf:catalog-updated", { detail: { source: "router" } })' router.js || fail "router catalog-updated dispatch missing"
rg -Fq 'window.addEventListener("lf:catalog-updated"' main.js || fail "main catalog-updated listener missing"
pass "catalog sync propagation"

echo "All admin flow checks passed."
