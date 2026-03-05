#!/usr/bin/env bash
set -euo pipefail

URL="${SUPABASE_URL:-https://rdvvnnspothqtxwdobtp.supabase.co}"
KEY="${SUPABASE_ANON_KEY:-sb_publishable_ZUdtCg1dNvzKcVXDxDG7Lw_0eDI_rHL}"

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  SUPABASE_URL=... SUPABASE_ANON_KEY=... ./scripts/supabase_upsert_category_sample_templates.sh

What it does:
  - Creates/updates sample templates in public.templates
  - 7 categories x (3 types x 4 items) = 84 rows
  - Upsert key: id
EOF
  exit 0
fi

echo "== Supabase Category Sample Template Upsert =="
echo "URL: $URL"

PAYLOAD="$(node <<'NODE'
const categories = ["슬로건", "우치와", "키링", "소품", "머그컵", "티셔츠", "특가상품"];
const slugByName = {
  "슬로건": "slogan",
  "우치와": "uchiwa",
  "키링": "keyring",
  "소품": "small-goods",
  "머그컵": "mugcup",
  "티셔츠": "tshirt",
  "특가상품": "special-deals"
};
const sampleTypes = {
  "슬로건": ["레터링 슬로건", "캘리그라피 슬로건", "행사용 슬로건"],
  "우치와": ["팬 응원 우치와", "캐릭터 우치와", "행사 홍보 우치와"],
  "키링": ["아크릴 키링", "PVC 키링", "메탈 키링"],
  "소품": ["파우치", "스티커팩", "엽서 세트"],
  "머그컵": ["화이트 머그컵", "컬러 머그컵", "포토 머그컵"],
  "티셔츠": ["기본 반팔", "오버핏 반팔", "롱슬리브"],
  "특가상품": ["한정 특가", "재고 정리", "시즌 프로모션"]
};

const rows = [];
categories.forEach((categoryName) => {
  const slug = slugByName[categoryName];
  const types = (sampleTypes[categoryName] || ["기본 타입 A", "기본 타입 B", "기본 타입 C"]).slice(0, 3);
  types.forEach((typeName, typeIndex) => {
    for (let itemIndex = 0; itemIndex < 4; itemIndex += 1) {
      const productId = `sample_${slug}_${typeIndex + 1}_${itemIndex + 1}`;
      rows.push({
        id: `tpl_${productId}_front`,
        product_id: productId,
        page_group: `${productId}:default`,
        page_name: "앞면",
        name: `${typeName} 템플릿 ${itemIndex + 1}`,
        width_mm: 100,
        height_mm: 100,
        bleed_mm: 3,
        safe_mm: 3,
        dpi: 300,
        active: true
      });
    }
  });
});

process.stdout.write(JSON.stringify(rows));
NODE
)"

COUNT="$(node -e 'const rows=JSON.parse(process.argv[1]); process.stdout.write(String(rows.length));' "$PAYLOAD")"
echo "Prepared rows: $COUNT"

RESP_FILE="$(mktemp)"
HTTP_CODE="$(
  curl -sS -m 30 -o "$RESP_FILE" -w "%{http_code}" \
    "$URL/rest/v1/templates?on_conflict=id" \
    -X POST \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates,return=representation" \
    --data-binary "$PAYLOAD"
)"

echo "HTTP: $HTTP_CODE"
if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
  echo "Upsert failed:"
  cat "$RESP_FILE"
  rm -f "$RESP_FILE"
  exit 1
fi

UPSERTED="$(node -e 'const fs=require("fs");const t=fs.readFileSync(process.argv[1],"utf8");const a=JSON.parse(t||"[]");process.stdout.write(String(Array.isArray(a)?a.length:0));' "$RESP_FILE" || echo "0")"
echo "Upserted rows returned: $UPSERTED"
rm -f "$RESP_FILE"

echo "Done."
