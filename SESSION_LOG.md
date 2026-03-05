### 2026-03-05 (github remote connection check)
- Confirmed git remote is configured: `origin -> https://github.com/JohnY-LINE/Product-builder.git` (fetch/push), current branch `main` tracking `origin/main`.

### 2026-03-04 (advanced detail editor: autosave draft + restore)
- Added product-scoped draft persistence for popup advanced detail editor:
  - draft key format: `lf.detailEditorDraft.v1.<productIdScope>`
  - autosave on typing (debounced), plus save on apply/apply-close/beforeunload.
- Added popup draft UX controls:
  - `초안 복구`
  - `초안 삭제`
  - live draft status text in popup header.
- Popup init now checks existing draft and:
  - auto-restores when incoming content is effectively empty
  - otherwise keeps incoming content and indicates draft availability.

### 2026-03-04 (advanced detail editor popup added)
- Added `고급 편집기(새 창)` launch action in admin product detail editor toolbar.
- Implemented popup-based advanced editor with expanded tools:
  - undo/redo
  - block formats (P/H2/H3/blockquote)
  - text styles (bold/italic/underline/strike)
  - alignment
  - ordered/unordered list
  - link/image insertion
  - horizontal rule and 3x3 table insertion
  - text color / highlight color pickers
  - template block panel (배송안내/제작안내/주의사항/FAQ).
- Added popup `편집/미리보기` tabs and parent-window sync via `postMessage`:
  - init content from parent editor
  - apply content back to parent editor with sanitize + preview refresh
  - optional apply-and-close flow.

### 2026-03-04 (theme switch visibility bug hardening)
- Investigated report that admin theme switch could appear on non-admin pages.
- Hardened visibility control with dual guard:
  - route-level explicit `style.display` toggle in addition to `hidden` flag
  - CSS rule `#adminThemeSwitch[hidden]{ display:none !important; }`.
- Result: theme switch is now strictly hidden outside post-login admin routes.

### 2026-03-04 (theme switch visibility limited to post-login admin pages)
- Updated route visibility condition so `#adminThemeSwitch` is hidden on `/admin/login` and shown only on post-login admin routes.
- Result: theme section no longer appears on admin login page.

### 2026-03-04 (detail editor upgrade: preview tab + template blocks)
- Enhanced admin product detail editor with `편집/미리보기` tab workflow:
  - added `#adminFormDetailTabEdit`, `#adminFormDetailTabPreview`, and preview pane `#adminFormDetailPreview`.
  - preview now renders sanitized HTML from current editor content.
- Added quick template block insert buttons in detail editor toolbar:
  - `배송안내`
  - `제작안내`
  - `주의사항`
- Implemented insertion via `data-editor-template` actions and wired live preview refresh on editor input/format actions/clear.

### 2026-03-04 (per-product detail-page editor + bottom detail content render)
- Added product detail-bottom content section on `/products/:id`:
  - new `detailExtraSection` + `detailRichContent` area below gallery/options.
- Extended product meta model with `detailContent` and wired it through catalog normalization.
- Added admin product-form rich editor for per-product detail pages:
  - toolbar actions (paragraph/headings/bold/italic/list/link/image/clear)
  - editable surface (`#adminFormDetailEditor`) with save integration.
- Product save now stores sanitized rich detail HTML into `cms.productMeta.v1.detailContent`.
- Product detail render now displays sanitized `detailContent`; falls back to basic product description when empty.

### 2026-03-04 (font color themes added with admin selector)
- Added `Font Theme` selector to admin theme switch (`#adminFontThemeSelect`) with presets:
  - `classic`
  - `cool-gray`
  - `warm-ink`
  - `high-contrast`.
- Added persistent state key `cms.fontTheme.v1` and router apply handler (`applyFontTheme`) that sets `data-font-theme` on `body`.
- Wired font theme apply on route transitions and admin switch changes.
- Added font color token presets in CSS (`--font-main`, `--font-strong`, `--font-muted`) and mapped key text UI elements to these variables.

### 2026-03-04 (removed page-card contrast override, added card-section border shadow)
- Removed the recent global page/card contrast override behavior from the new theme block (no longer forcing broad container/card surface replacement there).
- Added focused border+shadow treatment only to card sections:
  - `#homeFeatured.sectionGrid`
  - `#productsGrid.sectionGrid`
  - `.categoryShowcaseBlock .sectionGrid`
- Added dark/ruby-night shadow tuning for those card sections.

### 2026-03-04 (additional color theme presets added)
- Added two more admin-selectable global `Color Theme` presets:
  - `포레스트 민트` (`forest-mint`)
  - `루비 나이트` (`ruby-night`)
- Updated theme selection logic to support 4-color-theme whitelist (`light-mist`, `dark-slate`, `forest-mint`, `ruby-night`) with safe fallback.
- Added corresponding CSS token/override blocks for new presets (page background/surface/border/text/nav/input/thumb tone tuning).

### 2026-03-04 (global color audit + split theme controls with dark mode)
- Added expanded admin theme controls in `#adminThemeSwitch`:
  - `Admin UI` (existing clean/warm)
  - `Color Theme` (light-mist / dark-slate)
  - `Button Theme` (sunset / ocean / mono).
- Extended router theme state + persistence keys:
  - `cms.uiTheme.v1`
  - `cms.buttonTheme.v1`
  - new apply handlers (`applyUiTheme`, `applyButtonTheme`) now set body attributes globally.
- Route render path now reapplies global color/button themes on every route change, while admin UI theme remains admin-route scoped.
- Added large `Global Color + Button Theme System` override block in `style.css`:
  - stronger page/background vs card/section separation
  - dedicated dark-slate global theme
  - split button palette themes independent from page color theme
  - admin theme-switch layout updated for 3 selectors.

### 2026-03-04 (product card detail section expanded to full-card)
- Expanded `thumbMock` (detail section) to fill the entire product card area.
- Converted card layout to full-visual card style:
  - `productCard` now uses zero inner padding with full-area visual panel
  - price chip and `Customize` action are overlaid at the card bottom.
- Applied responsive min-height adjustments so the expanded detail section remains dominant on mobile as well.

### 2026-03-04 (product card detail-section text alignment update)
- Updated storefront product card markup so product name/description render inside the mockup/detail section (`thumbMock`) instead of outside.
- Added `thumbLabel` + `thumbMeta` structure and style so name/description are aligned to the bottom-right within the detail section.
- Kept existing card actions/price flow intact (`Customize` button + card click-to-detail behavior unchanged).

### 2026-03-04 (admin product edit form: subcategory visible/editable)
- Added subcategory selector (`#adminFormSubcategory`) to `/admin/products/:id/edit` form.
- Wired category -> subcategory dynamic option sync in `renderAdminProductForm`:
  - options now load from category subtype settings (`getCategorySampleTypes`)
  - existing saved subcategory is restored (including non-listed legacy values as `(저장값)`).
- Save flow now persists edited subcategory into `cms.productMeta.v1` from product form save path.

### 2026-03-04 (admin products UX redesign: dashboard-style one-screen workspace)
- Reworked `/admin/products` into a dashboard-like workspace focused on at-a-glance control:
  - added top overview hero (`adminProductsSummary`) with KPI cards
  - added quick-jump actions (`adminQuickLinks`, `adminQuickLinksSide`) and `한눈에 보기` button.
- Promoted product category table area to a dedicated always-visible panel (`adminSectionCatalog`) and added clear section IDs for fast navigation:
  - connection/product/menu/subcategory/asset sections now jump-targetable.
- Added `renderAdminProductsWorkspace()` in `router.js`:
  - renders overview metrics from current catalog/template/submission state
  - binds quick-jump buttons to filter + smooth-scroll + section expand behavior
  - initializes admin product filter to `all` on first load for one-screen visibility.
- Added comprehensive style override block `Admin Products Workspace Refresh` in `style.css` for modern card/grid hierarchy, sticky side utilities, and responsive behavior.

### 2026-03-04 (admin finalize button icon style update)
- Replaced admin finalize/home button text glyph with inline SVG home icon for cleaner visual consistency.
- Added compact icon-button styling for `#adminFinalizeApplyBtn` (`.adminHomeIconBtn`, `.homeIconSvg`) while preserving existing click behavior.

### 2026-03-04 (admin apply sync fix + finalize button home icon)
- Fixed catalog update sync path in `main.js`: `lf:catalog-updated` now always attempts `refreshProductData()`, `refreshTemplateData()`, and `refreshAssetData()` so admin edits apply to pages immediately.
- Added robust local fallback in the same listener when remote refresh fails (products/templates/assets all reloaded from local).
- Changed admin finalize apply button label from `최종 저장` to home icon `⌂` with `aria-label="홈으로"`.

### 2026-03-04 (card CTA simplification: remove 상세 button)
- In storefront card sections, removed `상세` button from card actions.
- Added card-level click/keyboard navigation to detail page (`#/products/:id`) for all product cards.
- Kept `Customize` as the only button in cards, linking to editor (`#/editor/:id`) without triggering card-detail navigation.

### 2026-03-04 (rollback: store card-section changes reverted)
- Rolled back storefront card-section customization in `router.js` and `style.css` to the previous card structure/style state.
- Removed `storeProductCard`-based card markup and interaction binding, restored original `thumbMock` + `상세/Customize` action layout.
- Restored previous grid/card proportions for home/products/category sections (including category card square ratio behavior).

### 2026-03-04 (store card proportion/font recalibration pass)
- Reworked storefront card sizing to better match the provided reference proportions:
  - removed square card forcing in category showcase
  - increased card height and visual-panel share (`.storeProductCard` min-height + `.productCardVisual` row ratios).
- Re-scaled typography for card internals (`Detail`, price, title, description, Customize button) using larger responsive `clamp()` values.
- Tuned product grids (`#homeFeatured`, `#productsGrid`, category showcase grid) to wider card columns so card aspect and font scale remain consistent.

### 2026-03-04 (store product cards redesigned + click routing split)
- Updated all storefront product cards (`renderCards`, category showcase cards) to a unified mockup-style card layout matching provided reference: large visual panel, oversized price, title/description, and bottom `Customize` button.
- Added explicit card interaction binding:
  - clicking/selecting a card moves to product detail (`#/products/:id`)
  - clicking `Customize` moves directly to custom editor (`#/editor/:id`) without triggering detail navigation.
- Implemented dedicated style scope `.storeProductCard*` in `style.css` so only storefront cards are affected and other card UIs remain unchanged.

### 2026-03-04 (admin selected-delete UX: 표시 체크 + 체크된 상품만 삭제 고도화)
- Admin 상품 목록 각 행에 `표시` 체크 UI를 추가하고, 카테고리 헤더에도 `표시` 전체선택 체크를 추가.
- `선택 상품 삭제` 버튼은 체크된 상품 ID만 수집해 삭제하도록 유지/확정(미선택 시 차단, 선택 개수 확인 팝업).
- 카테고리별 전체선택 체크와 개별 체크 상태를 양방향 동기화(개별 체크 변경 시 헤더 전체선택 자동 반영).
- 선택 삭제 후 상품/메타/제작방식/기본배경/선택값/수량/템플릿 연결 정리 및 카탈로그 UI 재렌더 유지.

### 2026-03-04 (global delete-all products + hard-refresh reappear bug prevention)
- Added `모든상품 삭제` button on `/admin/products` route head.
- Delete-all now clears product display sources and related mappings, then marks persistent lock key `cms.allProductsDeleted.v1=true` to prevent seed/default repopulation on hard refresh.
- Router now respects lock key:
  - `loadEditorProducts()` returns empty when locked
  - `getAllStoreCategories()` returns empty when locked
  - `ensureCategorySampleProductsInStore()` skips seeding when locked
- Main app now also respects lock key:
  - `loadProductsLocal()` returns empty when locked
  - `refreshProductData()` no longer auto-injects default product when locked
  - product upsert/save clears lock (`false`) so re-adding products works normally.

### 2026-03-04 (product save now supports subcategory selection and category-page application)
- Added per-product subcategory selector (`#adminProductSubcategory`) in admin product manager UI.
- Subcategory options now load dynamically from saved category subtype settings (`cms.categorySubtypes.v1`) for selected main category.
- Product save flow now persists `subcategory` into `cms.productMeta.v1` along with category.
- Router catalog/meta normalization now includes `subcategory` field in product data.
- Category page builder now prefers real products grouped by selected subcategory (fallback to sample cards only when group has no real products).

### 2026-03-04 (admin product-form category select now respects deleted categories)
- Fixed admin product registration category dropdown (`getKnownProductCategories`) to exclude names listed in `cms.deletedCategories.v1`.
- Result: deleting a category now removes it from top menu and from admin product category select consistently.

### 2026-03-04 (hard-refresh category reappear bug fixed with deleted-category persistence)
- Added persistent deleted-category key `cms.deletedCategories.v1` and integrated it into router state/category list builder.
- `getAllStoreCategories()` now excludes deleted categories even if old product/catalog data still contains them (prevents reappear after hard refresh).
- Category delete flow now appends deleted category into this persistent list.
- Re-add/save category flow in `main.js` now automatically removes that name from deleted list so intentional restore works.

### 2026-03-04 (fixed deleted category reappearing in top menu)
- Root cause addressed: category lists were being re-expanded by default-category merges and fixed sample seeding loops.
- `main.js` changes:
  - removed forced merge with default category list in `loadProductCategories`, `getKnownProductCategories`, and `refreshProductData`.
- `router.js` changes:
  - `getAllStoreCategories()` fallback reduced to single safe default only when empty
  - `ensureCategorySampleProductsInStore()` now seeds by dynamic ordered categories instead of fixed `STORE_CATEGORIES` list.
- Result: categories deleted in admin menu manager no longer reappear automatically in top menu.

### 2026-03-04 (promo section redesigned to balanced typography cards)
- Replaced image-heavy promo cards with balanced 3-column typography-first promo cards for cleaner visual consistency.
- Removed generated image dependency from home promo section and rebuilt with gradient card variants (`promoAdSlogan`, `promoAdKeyring`, `promoAdUchiwa`).
- Tuned card hierarchy (badge/headline/body) and equalized card height/spacing for better balance on desktop/tablet/mobile.

### 2026-03-04 (home bottom section converted to product ad showcase)
- Replaced previous operations CTA block in `.appleBottomPanel` with a product promotion section (buttons removed per request).
- Added local generated ad visuals (SVG):
  - `pic/promo-ad-slogan.svg`
  - `pic/promo-ad-keyring.svg`
  - `pic/promo-ad-uchiwa.svg`
- Added new promo layout/styles (`promoAdGrid`, `promoAdCard`, `promoAdBadge`) with responsive behavior for tablet/mobile.

### 2026-03-04 (admin final-apply button added with home redirect)
- Added `최종 저장` button (`#adminFinalizeApplyBtn`) to `/admin/products` route head next to `+ New Product`.
- Clicking final-apply now forces admin/store refresh flow (home/products/admin blocks) and then redirects to main page (`#/`).
- Added small head action layout style (`.adminHeadActions`) for consistent button alignment.

### 2026-03-04 (admin subcategory settings added per category)
- Added new admin filter tab/section: `하위카테고리` on `/admin/products`.
- New UI allows selecting a category and saving comma-separated subcategory names (`adminSubtypeCategory`, `adminSubtypeInput`).
- Saved subcategory map key: `cms.categorySubtypes.v1` and wired into router state.
- Category-page sample type headings now read from saved subcategory settings (`getCategorySampleTypes`) with fallback to default map.
- Deleting a category in menu-order manager also removes its subcategory settings entry.

### 2026-03-04 (admin category delete feature added)
- Added category delete action to admin menu-order rows (`삭제` button).
- Delete flow now reassigns products/meta using the deleted category to a fallback category (with confirmation), then removes the category from custom category storage and admin order list.
- Top menu / product filters / home category cards refresh immediately after delete and persist updated order/state.
- Added delete-button visual treatment in admin order UI (`orderDeleteBtn`).

### 2026-03-04 (admin category order: drag-and-drop enabled)
- Upgraded `/admin/products` category menu-order manager to support drag-and-drop row reordering (while keeping up/down buttons).
- Added drag lifecycle handling (`dragstart/dragover/drop/dragend`) with persistent order save to `cms.adminCategoryOrder.v1`.
- Added visual drag feedback styles for row hover, dragging state, and drop target highlight; included a drag handle glyph (`⋮⋮`).
- Reorder result immediately refreshes top category nav, product filters, home categories, and admin order list.

### 2026-03-04 (admin-controlled top-menu category order + category-title simplification)
- Added admin menu-order management block on `/admin/products` (`메뉴순서`) with up/down controls and reset button.
- Added persistent category order store key `cms.adminCategoryOrder.v1`; top menu/category filter/home category cards now all use ordered categories.
- Top menu generation remains category-name based (custom categories show as-is) while route slug mapping remains automatic.
- Updated category page title to show category name only (removed trailing `카테고리` text).
- Added dedicated styles for category order rows/actions in admin UI.

### 2026-03-04 (category label + product-name-only display cleanup)
- Kept top category menu labels generated directly from category names (not slug text), including newly added custom categories via dynamic nav render path.
- Updated product-card text composition to remove category-name exposure from card meta on product list/category pages; card meta now emphasizes price only.
- Normalized category sample text so descriptions/tags no longer inject category name into product-facing card copy:
  - tags: `[typeName, "샘플"]`
  - description: `${typeName} 샘플 상품`

### 2026-03-04 (custom category auto-page + auto-menu wiring)
- Implemented dynamic category source in router (`getAllStoreCategories`) using defaults + saved custom categories (`lf.product.categories.v1`) + catalog categories.
- Top header category menu is now rendered dynamically (`initTopCategoryNav`) so newly added categories are auto-included with category page links.
- Added dynamic slug map builder for categories (`buildCategorySlugMaps`) so custom categories route correctly via `#/products/category/:slug`.
- Product list category filters and home category cards now also render from dynamic category list (not fixed 7 only).
- Added immediate menu refresh trigger when adding category in admin product manager (`notifyCatalogUpdated` on `adminAddCategoryBtn`).

### 2026-03-04 (footer icon badges added for clearer info scan)
- Enhanced footer info/meta rows with compact icon badges via CSS pseudo-elements (no markup change).
- Added semantic symbol markers for address/phone/email/hours and admin/business registration lines to improve quick visual scanning and alignment.
- Kept footer tone-up layout intact while increasing perceived structure/readability.

### 2026-03-04 (footer tone-up refinement for cleaner alignment)
- Added dedicated `Footer Tone-up` override block in `style.css` to improve polish and alignment while keeping footer markup unchanged.
- Updated footer visual direction:
  - richer gradient atmosphere with subtle warm/cool radial accents
  - denser inner layout with two-column desktop balance and cleaner spacing rhythm
  - info panel card treatment (border/radius/shadow) for clearer scan hierarchy
  - refined meta/link row and copyright strip for stronger baseline alignment
- Added responsive footer adjustments for <=960 and <=780 for stable mobile readability.

### 2026-03-04 (admin 2-theme switch + typography alignment refinement)
- Added admin-only theme switch UI (`#adminThemeSwitch`, `#adminThemeSelect`) with two options:
  - `클린 블루` (`clean-blue`)
  - `웜 뉴트럴` (`warm-neutral`)
- Added theme persistence key `cms.adminTheme.v1` in router state; selection is restored across reloads.
- Theme data attribute (`data-admin-ui-theme`) is now applied only on `/admin*` routes and removed on non-admin routes.
- Added admin theme/style override block to improve perceived polish and consistency:
  - lighter/more balanced type weights (less heavy)
  - adjusted font sizes/line-height for titles, labels, inputs, accordion headers
  - aligned button/input/table/accordion tones to selected admin theme.

### 2026-03-04 (admin pages visual polish + consistency pass)
- Added dedicated `Admin Visual Consistency` override block in `style.css` to make admin UI more refined and consistent without changing functionality.
- Unified admin typography/hierarchy:
  - stronger route title scale/weight
  - label/input/button text rhythm normalized
- Unified admin surfaces and controls:
  - section cards (border radius, border tone, elevation)
  - route head and filter chips
  - data tables and status chips
  - accordion headers/bodies across admin routes
- Added admin-specific responsive tuning for mobile title/container spacing.

### 2026-03-04 (global UI/typography consistency refresh)
- Applied a unified design-token override block in `style.css` to align typography, spacing, borders, and elevation across store/admin/editor surfaces.
- Added webfont import (`SUIT`) and updated global font stack for a cleaner, more modern Korean UI tone.
- Harmonized key components for consistency:
  - header/nav/search/icon buttons
  - primary/secondary buttons
  - inputs/select/textarea focus states
  - card/table/footer visual language
- Added subtle page-enter stagger animation (`uiFadeUp`) with reduced-motion fallback.
- Added responsive tuning in the unified block for <=1100 and <=780 (brand/search/nav sizing).

### 2026-03-04 (category add feature for admin product management)
- Added inline category creation UI in `관리자: 상품 관리` (`새 카테고리 입력` + `카테고리 추가`).
- New categories persist in localStorage key `lf.product.categories.v1` and are merged with default categories + existing product categories.
- `상품 저장` now auto-registers selected category into saved category list if new.
- Router category normalization now preserves non-empty custom category names (no forced fallback to default category).
- Admin product form route now appends missing custom category option dynamically so existing custom-category products remain editable without category loss.

### 2026-03-04 (admin product save: category selector added)
- Added category select (`#adminProductCategory`) to `관리자: 상품 관리` inline save UI.
- `상품 저장` (`addProductBtn`) now saves selected category directly instead of keeping only previous category.
- Product-manage sync helper now loads existing product category into the new selector when editing by product id.

### 2026-03-04 (admin product save now bundles make-type + default background asset)
- Updated `관리자: 상품 관리` UI to include inline fields for `제작방식 목록` and `기본 배경 이미지` so these can be saved together with product id/name/canvas mode in one action.
- `상품 저장` (`addProductBtn`) now persists product + make-type map + default asset map in one flow, with validation for product-scoped default asset.
- Hidden duplicate management UI to reduce clutter:
  - product list card area (`#adminProductList`) hidden in product-management section
  - legacy separate `제작방식`/`기본배경` admin blocks hidden (`data-admin-hidden=1`)
- Admin filter logic now respects hidden blocks and keeps them invisible even when filter is `all`.

### 2026-03-04 (admin category accordion default collapsed + header summary)
- Updated `/admin/products` category accordion default state to collapsed unless explicitly opened by saved state (`state.adminAccordions[key] === true`).
- Enhanced category header title with summary text: total item count and published count per category.

### 2026-03-04 (admin products grouped by category accordion with collapsible sections)
- Replaced flat admin product list rendering with category-based accordion sections on `/admin/products`.
- Each category now has independent collapse/expand state persisted in `cms.adminAccordions.v1` using `adminProductsCategory:<category>` keys.
- Added per-category product table rendering (`.adminCatTable`) with empty-state row per category.
- Added status chip variants for publish state: `statusPublished` (green) and `statusHidden` (gray).
- Updated admin product list mount in `index.html` to `#adminProductsByCategory` and styled new accordion UI in `style.css`.

### 2026-03-04 (site footer section added with sample company info)
- Added global footer section below main content (`index.html`) with placeholder business info:
  - brand intro
  - address / customer center / email / business hours
  - admin link + business registration placeholders
  - copyright.
- Added footer style block in `style.css` (`.siteFooter*`) with mobile adjustments.

### 2026-03-04 (increased hero-to-feature gap further)
- Increased spacing between hero and the next section (`.appleFeatureStrip`) from `20px` to `36px` for clearer visual separation.

### 2026-03-04 (home hero-to-sections spacing unified to 20px)
- Adjusted home section vertical spacing under hero to `20px`:
  - `.appleFeatureStrip { margin-top: 20px }`
  - `.appleBlock { margin-top: 20px }`
  - `.appleBottomPanel { margin-top: 20px }`

### 2026-03-04 (hero images regenerated and replaced with custom fan-goods SVG set)
- Replaced previous hero gallery images with newly generated local SVG artworks:
  - `pic/fan-hero-thumb-1.svg` (slogan mood)
  - `pic/fan-hero-thumb-2.svg` (uchiwa mood)
  - `pic/fan-hero-thumb-3.svg` (keyring mood)
- Added generated hero poster fallback image:
  - `pic/fan-hero-poster.svg`
- Updated hero media references in `index.html` to use the new generated assets.

### 2026-03-04 (fan hero made full-bleed horizontally)
- Updated `.fanHero` to full-bleed layout so the hero spans edge-to-edge:
  - `width: 100vw`
  - `margin-left/right: calc(50% - 50vw)`
  - `border-radius: 0`

### 2026-03-04 (home hero upgraded to fan-goods visual style with media)
- Redesigned home hero section into fan-goods focused visual composition.
- Added hero media stack:
  - background autoplay muted loop video (`fanHeroVideo`) with poster fallback
  - right-side fan goods image gallery using local assets (`pic/image copy 2.png`, `pic/image copy 3.png`, `pic/image copy 6.png`).
- Updated hero typography/copy for fan-goods context:
  - stronger headline and support text
  - category chips (`SLOGAN/UCHIWA/KEYRING/MUG CUP`)
  - CTA copy updated to fan-goods browsing flow.
- Added dedicated `fanHero*` style system in `style.css` including desktop/tablet/mobile responsive behavior.

### 2026-03-04 (rolled back latest home-page Figma-array rewrite on request)
- Reverted the most recent `/` home page rewrite (workspace-style `homeWorkbench` layout) back to previous Apple-style home composition.
- Restored home markup blocks:
  - `appleHero`
  - `appleFeatureStrip`
  - `appleBlock` (Category / Best Picks)
  - `appleBottomPanel`.
- Removed the temporary home-only style additions (`homeWorkbench*`, related responsive overrides).
- Removed temporary `#homeStats` rendering hook from `renderHomeExperience()` in `router.js`.

### 2026-03-04 (home page redesigned with Figma-like workspace array)
- Reworked `/` main page layout to a more tool-oriented, easy-to-scan 3-pane array inspired by provided design reference:
  - left pane: `Tools` + category list
  - center pane: main canvas-like featured product board
  - right pane: `Properties` + operation CTA.
- Replaced old Apple-style home markup with new workspace structure while keeping dynamic mounts:
  - `#homeCategoryGrid`
  - `#homeFeatured`
  - added `#homeStats` for right-side property stats.
- Added `homeWorkbench*` style system in `style.css` and responsive behavior:
  - desktop 3-pane
  - tablet 2-pane/stack hybrid
  - mobile single-column stack.
- Updated `renderHomeExperience()` in `router.js` to render store pulse stats into `#homeStats`.

### 2026-03-04 (editor UI rearranged for easier use: left tools/layers, center canvas, right properties)
- Re-arranged editor stage layout to a clearer 3-pane structure inspired by reference UI:
  - left: Tools + Layers
  - center: Canvas + toolbar
  - right: Properties drawer.
- Added section headers in editor UI:
  - `Tools` header in dock rail
  - `Properties` header in right drawer.
- Simplified left tools interaction style:
  - wider horizontal buttons with icon + label for faster recognition.
- Updated layers panel visual language for usability:
  - light panel theme, searchable row list, compact controls at bottom.
- Updated responsive behavior:
  - <=1100px: left panel + canvas with properties/toolbar stacked below
  - <=780px: single-column stack (canvas, toolbar, layers, properties) with existing mobile dock override preserved.

### 2026-03-04 (layer controls moved + new Photoshop-style Layers panel)
- Moved layer management UI out of the image drawer panel and into a dedicated stage-side panel.
- Added new `Layers` board beside dock rail/drawer in editor stage:
  - tab strip (`Layers / Asset Export / Artboards`)
  - layer search input (`#layerSearch`)
  - dark row-based layer list (`#layerList`) with visible/lock quick toggles
  - bottom controls (up/down/duplicate/delete + opacity + blend).
- Reworked stage layout to 4-column desktop structure: `canvas / rail / layers / drawer`.
- Updated responsive stage layout so layers panel stacks above drawer on tablet/mobile breakpoints.
- Updated `main.js` layer list renderer from card-style to row-style panel UI and added search filtering.
- Updated layer list click handler to generic row targeting (`[data-layer-id]`) for new markup.

### 2026-03-04 (category cards set to square + 4-column desktop layout)
- Updated category showcase cards to be square (`aspect-ratio: 1 / 1`) and arranged in 4 columns on desktop.
- Added category-only sizing tweaks:
  - thumbnail height uses card ratio-aware sizing (`45%`, min `120px`)
  - content spacing tuned so metadata/actions align better in square cards.
- Responsive behavior for category showcase:
  - `<=1000px`: 3 columns
  - `<=900px`: 2 columns
  - `<=720px`: 1 column

### 2026-03-04 (fixed thin category cards caused by nested grid mode)
- Root cause found: category showcase was rendered inside `#productsGrid.sectionGrid`, so showcase container occupied only one grid column on desktop.
- Fix applied:
  - added `categoryMode` toggle in `router.js`
    - `renderProductsCategoryPage()` -> `#productsGrid.classList.add("categoryMode")`
    - `renderProductsPage()` -> `#productsGrid.classList.remove("categoryMode")`
  - added CSS override: `#productsGrid.categoryMode { display:block; }`
- Result: category showcase now uses full content width and cards are no longer unnaturally thin.

### 2026-03-04 (desktop category cards widened: 4-col to 3-col)
- Adjusted category page desktop card layout because cards looked too thin:
  - `.categoryShowcaseBlock .sectionGrid` changed from 4 columns to 3 columns
  - gap increased from `14px` to `16px`.
- Kept responsive behavior:
  - `<=1000px`: 2 columns
  - `<=720px`: 1 column

### 2026-03-04 (category page card sizing/layout adjusted to fit page UI)
- Tuned category-page product card layout to better match wide page UI:
  - expanded `#page-products .routeContainer` max width from base to `1440px`
  - added category-specific grid override: `.categoryShowcaseBlock .sectionGrid` -> 4 columns on desktop.
- Added responsive fallbacks for category showcase grid:
  - `<=1000px`: 3 columns
  - `<=900px`: 2 columns
  - `<=720px`: 1 column
- Result: each category type block now presents `4` sample cards in one row on desktop without awkward wrap.

### 2026-03-04 (added template/asset sample upsert scripts and executed all)
- Added scripts:
  - `scripts/supabase_upsert_category_sample_templates.sh` (templates 84 upsert)
  - `scripts/supabase_upsert_category_sample_assets.sh` (assets 84 upsert)
  - `scripts/supabase_upsert_category_samples_all.sh` (products/templates/assets batch runner)
- Executed batch upsert script:
  - products: HTTP 200, returned 84
  - templates: HTTP 201, returned 84
  - assets: HTTP 201, returned 84
- Verified readback from all three tables with sample ID patterns (`sample_*`, `tpl_sample_*`) succeeded.

### 2026-03-04 (Supabase upsert script added and executed for category samples)
- Added executable script: `scripts/supabase_upsert_category_samples.sh`.
- Script behavior:
  - builds 84 sample product rows (7 categories x 3 types x 4 items)
  - upserts into `public.products` via Supabase REST (`on_conflict=id`, merge-duplicates).
- Executed script against project Supabase:
  - HTTP `201`
  - `Upserted rows returned: 84`
- Verified readback from Supabase `products` with `id like sample_%` (sample rows returned successfully).

### 2026-03-04 (admin data now auto-seeded with category sample products)
- Added `ensureCategorySampleProductsInStore()` in `router.js` to auto-create/update real admin product data for category samples.
- On init, sample products are ensured in `lf.products.v1` with stable IDs:
  - pattern: `sample_<category-slug>_<typeIndex>_<itemIndex>`
  - total: 7 categories x (3 types x 4 items) = 84 sample products.
- Sample metadata is also ensured in `cms.productMeta.v1` (category/basePrice/tags/mockups/description/options/published).
- Result: category pages and admin product list are now backed by actual stored sample products, not only UI-only cards.

### 2026-03-04 (top category now opens dedicated category pages with 3x4 samples)
- Added dedicated category route: `#/products/category/:categorySlug`.
- Header category menu now navigates directly to category pages (`slogan/uchiwa/keyring/small-goods/mugcup/tshirt/special-deals`).
- Implemented category showcase renderer in `router.js`:
  - each category page renders 3 product types
  - each type renders 4 sample products (total 12 cards/category).
- Sample cards include `상세/Customize` actions linked to available real product IDs for flow continuity.
- Regular `/products` list still works with existing filter bar, and category page hides the filter to focus on showcase.

### 2026-03-04 (store/admin category system unified to 7 fixed categories)
- Unified category source to requested 7 values across storefront and admin:
  - `슬로건 / 우치와 / 키링 / 소품 / 머그컵 / 티셔츠 / 특가상품`
- Header category menu now binds by category key (`data-top-category`) and clicking a category:
  - stores `cms.productFilters.v1` category
  - routes to `#/products`
  - applies same filter immediately when already on product list.
- Product list category filter buttons now always render the same 7 categories (+ 전체) with per-category counts.
- Home category cards now render from the same 7-category set and click-through applies filtered product view.
- Admin product form category switched to fixed select list (same 7 categories) and save path normalizes category values to this set.
- Seed/default categories aligned to new system (router seed + `main.js` default product category).

### 2026-03-04 (brand click navigates to home)
- Changed header brand `LINEFACTORY` from static text to link (`href="#/"`) so clicking it moves to home route.
- Preserved visual style by adding `text-decoration:none` and `color:inherit` to `.commerceBrand`.

### 2026-03-04 (header category labels updated to requested set)
- Updated top header category labels/order to match requested screenshot:
  - `슬로건 / 우치와 / 키링 / 소품 / 머그컵 / 티셔츠 / 특가상품 🔔`
- Applied special style for `특가상품` (`.navItemDeal`) with red emphasis tone.
- Kept links pointing to `#/products` for now so category menu remains navigable without route changes.

### 2026-03-04 (home redesigned to Apple-style minimal landing concept)
- Rebuilt `/` home layout into a cleaner Apple-style landing direction with large centered hero, deep-dark gradient spotlight, and wide spacing rhythm.
- Replaced old mall-home blocks with new sections while keeping dynamic mounts intact:
  - `#homeCategoryGrid` (category data)
  - `#homeFeatured` (featured products)
- Added new homepage sections/components:
  - `appleHero` (headline + CTA)
  - `appleFeatureStrip` (3 core platform highlights)
  - `appleBlock` sections for Category / Best Picks
  - `appleBottomPanel` for admin operation CTA.
- Added responsive style system for the new home concept in `style.css` with desktop/tablet/mobile adjustments.
- Validation checks passed: `node --check router.js`, `node --check main.js`, CSS brace balance `open=423 close=423`.

### 2026-03-04 (admin store stats moved to right mini sidebar)
- Moved `스토어 현황` on `/admin/products` from inline section to a compact right-side panel layout.
- Introduced `adminProductsLayout` with two columns: main admin content + sticky mini sidebar (`adminProductsSide`).
- Kept stats mount ID unchanged (`#adminStoreStats`) so existing render logic continues without JS changes.
- Added compact stat card sizing (`adminMiniPulse`) for small right-bar presentation and mobile fallback to single-column stack.
- Marked stats panel with `data-no-accordion=1` so it remains always visible despite admin accordion mode.
- Validation checks passed: `node --check router.js`, `node --check main.js`, CSS brace balance `open=399 close=399`.

### 2026-03-04 (admin accordion sections added)
- Added collapsible accordion behavior for admin route sections (`/admin/products`, `/admin/products/new|:id/edit`, `/admin/templates`, `/admin/options`, `/admin/inbox`, `/admin/inbox/:submissionId`).
- Section open/closed state now persists in localStorage with key `cms.adminAccordions.v1`, restoring previous work context after refresh/navigation.
- Accordion headers are generated from each section first heading/label and include chevron state feedback.
- Applied dedicated admin accordion UI styles in `style.css` with compact collapsed mode and clean panel hierarchy.
- Validation checks passed: `node --check router.js`, `node --check main.js`, CSS brace balance `open=388 close=388`.

### 2026-03-04 (admin page UI cleanup pass)
- Polished admin route UI density and hierarchy across `/admin/login`, `/admin/products`, `/admin/products/:id/edit`, `/admin/templates`, `/admin/options`, `/admin/inbox`, and submission detail.
- Unified admin cards/sections to white surfaces with softer borders/shadows for cleaner readability.
- Refined admin table/filter presentation:
  - filter bars now sit on contained panel surfaces with calmer button states
  - admin product/inbox tables now have cleaner hover feedback and balanced header/body contrast.
- Improved admin form rhythm:
  - consistent title scale/label weight/input focus tone on admin screens
  - better action button sizing and compact asset-list containers.
- Admin two-column grids now use `auto-fit(minmax(320px, 1fr))` for more stable responsive behavior.
- Validation checks passed: `node --check router.js`, `node --check main.js`, CSS brace balance `open=377 close=377`.

### 2026-03-04 (mobile quantity stepper optimization)
- Optimized `/products/:id` quantity UX for mobile (`<=720px`):
  - quantity input switches to read-only mode on mobile (button-driven adjustment only)
  - retained editable input on desktop.
- Improved touch ergonomics for stepper:
  - larger +/- hit targets and input height on mobile
  - removed native number spin controls for cleaner control surface.
- Added minor accessibility/UX hints (`inputMode=numeric`, title hint for mobile behavior).
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (quantity stepper + store pulse moved to admin)
- Added quantity controls on `/products/:id` (`detailQtyMinus/detailQtyInput/detailQtyPlus`) with per-product persisted qty state (`cms.detailQty.v1`).
- Product detail pricing/final-check now updates with quantity:
  - summary shows unit price, qty, total
  - final pre-order check reflects selected qty.
- Moved `스토어 현황` from home hero to admin products page:
  - new admin panel mount `#adminStoreStats`
  - added `renderAdminStorePulse()` and wired refresh on route enter, submission create, and status save.
- Added styles for quantity stepper and admin pulse board (`.qtyStepper`, `.detailQtyBox`, `.adminPulseBoard`).
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`, router DOM ID parity check (missing 0).

### 2026-03-04 (added final pre-order check box on product detail)
- Added a `주문 전 최종 확인` box in `/products/:id` right panel (`#detailFinalCheck`).
- `renderProductDetail()` now populates real-time final-check info:
  - selected options
  - quantity (default 1)
  - estimated production lead time (single-view vs multi-view template heuristic)
  - final note about production file confirmation.
- Added dedicated styles: `.finalCheckBox`, `.finalCheckTitle`, `.finalCheckRow`, `.finalCheckNote`.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (product detail checkout/summary UX polish)
- Improved `/products/:id` option + price UX to feel more like a standard commerce checkout sidebar.
- `renderProductDetail()` changes:
  - localized option labels (`사이즈/컬러/소재`)
  - stronger CTA copy (`이 상품 커스터마이즈`)
  - price area now shows `예상 결제금액` headline tied to real-time total
  - summary panel now renders structured breakdown: `기본가 / 옵션 추가 / 합계 + 선택옵션`.
- Added corresponding detail-only styles:
  - `priceCaption`, `detailChip`, `summaryRow`, `summaryMeta` and refined option label typography.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (product detail page refined to slim mall tone)
- Refined `/products/:id` visual style to match the slim shopping-mall theme used in header/cards.
- Updated detail layout/cards:
  - lighter border + smaller radius + softer shadow for `detailGallery/detailOptions`
  - tighter spacing and reduced right panel width for cleaner density.
- Updated tabs/preview/price area:
  - slimmer mockup tab buttons
  - mockup view switched from dashed to clean solid surface
  - price summary changed to neutral info tone (less orange alert-style)
  - primary customize CTA in detail options made full-width with compact sizing.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (product card tone unified with mall header/landing)
- Refined product cards (`homeFeatured`, `/products`) to match the new slim shopping-mall visual language.
- Updated card/thumbnail/meta/button rhythm:
  - lighter border/shadow, smaller radius, tighter spacing
  - balanced typography hierarchy (title/body/meta/button sizes)
  - subtle hover lift for card clarity without heavy visual effects.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (header/nav/search/icons unified to mall tone)
- Refined top header UI to match shopping-mall landing tone with a cleaner/slimmer visual language.
- Updated header/nav styles:
  - reduced brand/nav/search/icon visual weight and typography size
  - converted nav links to pill-style category chips with subtle active/hover states
  - simplified icon buttons (soft bordered square) and removed heavy gradient/hover glow.
- Updated search box styling:
  - cleaner border-only field with inline search glyph (`.searchBox::before`)
  - tighter height/padding and calmer color contrast.
- Adjusted responsive header breakpoints (`<=1400`, `<=1100`, `<=780`) to keep the new tone consistent on tablet/mobile.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (home converted to shopping-mall style landing)
- Replaced home (`/`) structure from platform-style narrative layout to a standard commerce landing flow:
  - main visual hero banner + right status panel
  - category quick section
  - promo strip (3 cards)
  - best products section
  - bottom CTA for admin operations
- Kept dynamic mounts intact (`homeStats`, `homeCategoryGrid`, `homeFeatured`) so existing `renderHomeExperience()` data binding continues to work.
- Added new slim/simple style classes (`mallHero*`, `mallPromo*`, `mallBottomCta`) and responsive rules for tablet/mobile.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`, router DOM ID parity check (missing 0).

### 2026-03-04 (home hero stats upgraded with inbox data + spacious polish)
- Upgraded home hero right-side metrics to include real inbox-driven indicators:
  - `최근 30일 제출 건수` (from `state.submissions.createdAt`)
  - `인박스 처리율` (non-`Received` status ratio within recent 30-day window)
- `renderHomeExperience()` now computes `recent/processed/processingRate` and renders value + meta lines for trust readability.
- Refined hero-side visual density to feel less cluttered:
  - increased panel/card spacing and padding
  - larger stat typography with calmer hierarchy
  - added subtle gradient surfaces and `homeStatMeta` secondary text.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (homepage premium redesign for global audience)
- Rebuilt `/` home screen into a full platform-grade landing experience:
  - hero with strong positioning copy + multi-CTA + trust chips
  - live platform pulse stats panel (`homeStats`)
  - audience segmentation cards (개인/크리에이터/단체/기업)
  - popular category block (`homeCategoryGrid`)
  - 4-step workflow section + enterprise CTA strip
- Added data-driven home renderer `renderHomeExperience()` in `router.js`:
  - uses published catalog/products/templates to populate featured cards, stats, and category counts.
  - wired into init, route(`/`), and `lf:catalog-updated` refresh flow.
- Added comprehensive style system for new home sections in `style.css` with responsive behavior for tablet/mobile.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`, router DOM ID parity check (missing 0).

### 2026-03-04 (follow-up bundle: template mockup preview + admin option editor + Supabase product columns)
- Product detail mockup gallery now prefers linked template pages:
  - `/products/:id` tabs are built from `lf.templates.v1` by `productId` + `pageName`.
  - When `templateImageUrl` exists, the mockup pane shows real image preview (`.mockupPreviewImg`) instead of text-only placeholder.
- Admin product form expanded with option editing:
  - Added `adminFormOptSize/adminFormOptColor/adminFormOptMaterial` textareas (CSV `label:+delta` format).
  - Save flow now parses and stores option arrays into `cms.productMeta.v1`, so storefront detail/options/price update use admin-edited option sets.
- Supabase `products` extension implemented end-to-end:
  - Schema updated in `supabase-schema.sql`: `category`, `base_price`, `is_published` columns + `alter table ... add column if not exists`.
  - `main.js` product fetch/upsert now reads/writes those columns with missing-column fallback for legacy DBs.
  - Template-save product upsert path also includes the new product columns with fallback.
- Catalog sync robustness improved:
  - Router emits `CustomEvent("lf:catalog-updated", { detail: { source: "router" } })`.
  - `main.js` listens and performs local refresh path for router-origin updates (prevents immediate Supabase overwrite during route-admin edits).
- Validation checks passed: `node --check main.js`, `node --check router.js`, `node --check api-client.js`, DOM ID parity checks (`main.js`/`router.js` missing 0).

### 2026-03-04 (catalog integration + category filter + admin product-template linkage)
- Reworked `router.js` catalog source to use editor stores (`lf.products.v1`, `lf.templates.v1`) plus route metadata store (`cms.productMeta.v1`), instead of static `PRODUCT_DATA`.
- Added product category filtering on `/products` via `#productsCategoryFilter` and persisted selection in `cms.productFilters.v1`.
- Upgraded `/admin/products/new|edit` form to real data bindings with IDs and save/delete logic:
  - product base fields (id/name/category/basePrice/tags/description/canvasMode/published)
  - multi-select template linkage (`adminFormTemplateLinks`)
  - save now syncs selected templates by updating `templates[].productId`, and delete reassigns linked templates to fallback product.
- Added cross-screen sync event `lf:catalog-updated`:
  - emitted from `main.js` when product/template admin changes happen in editor-side admin controls
  - consumed in both `main.js` and `router.js` to refresh product/template/catalog UIs without hard refresh.
- Added CSS support for template multi-select usability (`select[multiple]` min-height).
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`, plus DOM ID parity checks (`main.js`/`router.js` missing IDs: 0).

### 2026-03-04 (admin filter tab persistence)
- Added `localStorage` persistence for admin section filter tabs in `router.js`.
- New key: `cms.adminFilters.v1`; state now loads/saves per filter bar ID (`adminProductsFilter`, `adminTemplatesFilter`).
- On init, saved filter is restored if valid; otherwise falls back to `all`.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`.

### 2026-03-04 (admin route UI organized with section filters)
- Added admin section filter bars for focused workflows:
  - `/admin/products`: `전체/연결/상품/제작방식/기본배경/에셋`
  - `/admin/templates`: `전체/시각 편집/템플릿 관리`
- Annotated admin blocks with `data-admin-block` and implemented route-level filter controller `initAdminSectionFilters()` in `router.js`.
- Added modern pill-style filter button UI (`.adminFilterBar`, `.adminFilterBtn`) in `style.css` with active/hover states.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`, and main.js DOM ID parity check (missing 0).

### 2026-03-04 (editor admin DOM fully moved to admin routes)
- Removed legacy admin dock panels (`adminSb/adminProduct/adminTemplate/adminAsset`) from editor drawer in `#page-editor`.
- Moved the same admin control forms/IDs to admin pages:
  - `/admin/products`: Supabase connect, product save, make-type mapping, default asset mapping, asset upload/list.
  - `/admin/templates`: template/page add-save-load form (ID/name/group/page/output/upload/list).
- Removed obsolete `userModeBtn/adminModeBtn` references from `main.js`; editor now has no mode-switch DOM dependency.
- Verified integrity: `node --check main.js`, `node --check router.js`, `node --check api-client.js`, and main.js DOM ID parity check (missing 0).

### 2026-03-04 (editor admin UI strip-down continued)
- Removed editor dock rail entries for `모드/연결/상품/템플릿/에셋` from `index.html`; editor rail now exposes user-facing `옵션/이미지` only.
- Removed editor `모드 전환` panel markup from drawer (`userModeBtn/adminModeBtn` no longer rendered in editor HTML).
- Scoped `renderMode()` DOM toggling to `#page-editor` only, preventing global `.adminOnly/.userOnly` side-effects on `/admin/*` screens.
- Validation checks passed: `node --check main.js`, `node --check router.js`.

### 2026-03-04 (editor admin mode moved to /admin routes only)
- Locked editor runtime to user mode by default (`EDITOR_ADMIN_MODE_ENABLED = false`) and normalized mode restore from draft/history snapshots.
- Disabled editor drawer access to mode/admin targets; editor now exposes only user-facing `flow/assets` panels.
- Hid editor "관리자 모드" button and changed its click behavior to route to `#/admin/login` when triggered.
- Result: 관리자 기능은 에디터 내부가 아닌 `/admin/*` 화면에서만 사용하도록 분리 유지.

### 2026-03-04 (removed editor top sticky submit summary bar)
- Deleted the top editor sticky bar (`Price Summary + Submit Request`) from `index.html`.
- Removed associated route/CSS references (`editorSummarySticky`, `editorStickyPrice`, `editorSubmitBtn`).
- Wired submission trigger to existing editor `#export` button in `router.js` so submit flow still works without the removed bar.
- Validation checks passed: `node --check router.js`, `node --check main.js`, CSS brace balance open=261 close=261.

### 2026-03-04 (removed submit-info modal flow)
- Removed editor submit info modal UI and related styles/scripts completely.
- `Submit Request` now triggers direct submit flow without modal input fields.
- Submission customer info now uses default placeholder (`웹 사용자`, `-`, `-`) and keeps editor note/context.
- Validation checks passed: `node --check router.js`, `node --check main.js`, `node --check api-client.js`; CSS brace balance open=263 close=263.

### 2026-03-04 (phase 1/2/3 implemented: submit flow + template visual editor + api pipeline hooks)
- Added `EditorBridge` in `main.js` exposing validation/context/export bundle for route-level submit flow.
- Implemented editor submit modal (contact fields + notes) and end-to-end submission handling in `router.js`.
- Submission pipeline now attempts API endpoints via new `api-client.js` (`/api/submissions`, `/api/editor/export/production`) with local fallback storage when unavailable.
- Added admin inbox/detail real-data flow from submissions store, including runtime download buttons for SPEC/Preview/Production files and status/internal-note updates.
- Added visual template editor in `/admin/templates` with draggable/resizable print-area rectangle + numeric sync + local persistence + API save hook.
- Added route-level UI blocks/controls in `index.html` and style support in `style.css` (modal/template stage).
- Validation checks passed: `node --check main.js`, `node --check router.js`, `node --check api-client.js`, DOM id parity checks (missing ids: 0), CSS brace balance open=266 close=266.

### 2026-03-04 (custom mockup studio multi-route shell + architecture output)
- Implemented hash-based multi-route web app shell for user/admin flows directly in `index.html` + `router.js`.
- Added full route screens (user: home/products/detail/editor/my-submissions, admin: login/products/new-edit/templates/options/inbox/detail).
- Kept existing advanced canvas editor as route `#/editor/:productId` and added route-driven product sync into editor select when possible.
- Added storefront/admin demo data rendering (cards, tables, product detail options + real-time price summary) in `router.js`.
- Added sticky editor price/submit UI hook and submission modal placeholder entry point.
- Added comprehensive route UI styling blocks in `style.css` for cards/tables/detail layouts/chips/responsive behavior.
- Added architecture deliverable `CUSTOM_MOCKUP_STUDIO_PLAN.md` with component breakdown, state plan, and high-level API endpoints + payload example.
- Validation checks passed: `node --check main.js`, `node --check router.js`, CSS brace balance open=260 close=260.

### 2026-03-03 (page-by-page canvas editing workflow improvement)
- Added admin template page workflow controls: `그룹 페이지 불러오기` select (`adminTplPageSelect`) + `선택 페이지 불러오기` button.
- Implemented page-group option sync (`syncAdminTemplatePageOptions`) tied to product/group/template changes.
- Added reusable page load helper (`applyTemplateToAdminEditor`) so saved page templates can be loaded back into canvas/form for per-page alignment and re-save.
- Enhanced page add flow to immediately refresh page-group options after draft generation.
- Updated template render/select flows to keep page group/page name + page select list synchronized.
- Validation checks passed: `node --check main.js`, DOM id parity check (missing ids: 0).

### 2026-03-03 (page-add UX improvement without forced-save feel)
- Improved `페이지 추가` flow to support repeated pre-save page drafting without "save first" style guidance.
- Page add now auto-fills product from current state when possible, increments from current `_pN` id draft, and avoids duplicate id collisions.
- Replaced alert guidance with inline status text (`adminTplImageInfo`) to reduce interruption and remove save-first implication.
- Validation check passed: `node --check main.js`.

### 2026-03-03 (template page add + page naming feature)
- Added template page metadata support: `pageGroup` + `pageName` across app/local storage/supabase row mapping.
- Admin template UI now includes `페이지 그룹`, `페이지 이름`, and `페이지 추가` helper button.
- `페이지 추가` auto-generates next page draft ID (`*_pN`) and suggested page name (`앞면/뒷면/페이지 N`) within same product+group.
- Template select/admin list now show page labels for disambiguation (e.g., `[앞면]`).
- Template badge now includes selected page name.
- Supabase schema updated with `templates.page_group` and `templates.page_name` + backfill defaults.
- Validation checks passed: `node --check main.js`, DOM id parity check (missing ids: 0).

### 2026-03-03 (modern button/icon/menu redesign)
- Replaced dark/flat button language with modern gradient-accent system across primary/secondary/icon/dock/tool buttons.
- Added richer interactions: hover lift, glow shadows, active press feedback, and consistent focus-visible rings for accessibility.
- Updated menu/nav/toggle chips to match accent palette and motion; added reduced-motion fallback for users with motion preference.
- Updated dock panel step badges from dark blocks to light branded chips for visual consistency.
- CSS validation passed: brace balance open=222 close=222.

### 2026-03-03 (search box double-border fix)
- Fixed double-looking search input by excluding `.searchBox input[type="text"]` from global text-input chrome (border/radius/padding/shadow reset).

### 2026-03-03 (interface visual redesign pass)
- Per user request, performed full UI tone upgrade to remove dated look while preserving existing functionality/IDs.
- Introduced premium visual direction in `style.css`: layered background gradients, glass-like header/panel surfaces, tighter typography scale, and consistent neutral/accent palette.
- Upgraded component styling: cards/forms/buttons/toolbars/asset cards/dock rail states with improved depth, borders, hover feedback, and contrast hierarchy.
- Kept responsive behavior intact; media breakpoints remain compatible with existing mobile bottom dock logic.
- CSS validation passed: brace balance open=210 close=210.

### 2026-03-03 (image clarity improvement under template overlays)
- Improved on-canvas perceived sharpness while keeping user images below template layers.
- Made frame fill transparent (removed white haze), reduced guide overlay opacity to 0.5.
- Tuned template overlay visibility with `opacity:0.68` + `mix-blend-mode:multiply` for clearer image alignment visibility.
- Added image rendering hints on layer/template images (`image-rendering:auto`, `translateZ(0)` on user layer img).

### 2026-03-03 (image-under-template layer order fix)
- Updated canvas stacking so user image layers always render below template layers for alignment work.
- Changed z-index order in `style.css`: `#imageLayerStack` -> 20, `.templateBgLayer` -> 30, `.frame` -> 32 (text remains above).
- Result: uploads/library images consistently stay under template overlays regardless of load path.

### 2026-03-03 (null addEventListener fix for loading stall)
- Addressed runtime crash `Cannot read properties of null (reading addEventListener)` around toggle bindings.
- Made top toggle event binding null-safe (`tgBleed/tgSafe/tgText/tgGuides`).
- Made snapshot restore checkbox assignments null-safe for same toggle ids.
- Validation check passed: `node --check main.js`.

### 2026-03-03 (loading-stuck hotfix)
- Investigated "불러오는 중..." stall and added defensive init/fetch fallbacks.
- `fetchProducts()` no longer throws hard on non-missing-table Supabase errors; now downgrades to LOCAL mode and continues.
- `init()` now wraps product/template/asset refresh calls with try/catch and forces local render fallbacks to prevent startup abort.
- Validation check passed: `node --check main.js`.

### 2026-03-03 (brand text update)
- Changed top header brand label from `MARPPLE` to `LINEFACTORY` in `index.html`.

### 2026-03-03 (ruler feature removal)
- Removed ruler feature from UI and logic entirely.
- Deleted `tgRuler` toggle and ruler DOM/canvas nodes from `index.html`; canvas work area now renders directly without ruler wrapper.
- Removed ruler-related state/handlers/rendering in `main.js` (`show.ruler`, ruler toggle listener, ruler draw code).
- Kept `resizeRulers()` as safe no-op to avoid touching many existing call sites.
- Updated `style.css` to drop ruler layout styles and map canvas styling directly to `.work`.
- Validation checks passed: `node --check main.js`, CSS brace balance OK.

### 2026-03-03 (marpple-inspired UI upgrade pass)
- Applied visual redesign toward marketplace-style editor while preserving existing JS IDs/behaviors.
- Added sticky commerce header/navigation/search actions in `index.html`.
- Reworked top info strip into compact editor title + status badges.
- Restyled stage to light-gray workspace with stronger right option-card emphasis and improved card/button hierarchy.
- Added responsive rules for new header on <=1100px and <=780px; mobile keeps existing bottom dock hard-override behavior.
- Validation checks passed: `node --check main.js`, CSS brace balance (open=218, close=218), HTML body/tag structure verified.

### 2026-03-03 (marpple-style UI feasibility check)
- User requested editor UI to be reshaped similar to MARPPLE screenshot (top commerce header, large center canvas, right options card, right vertical action rail).
- Verified current app already has compatible structure (`stage`, `dockRail`, `dockDrawer`) so visual conversion is feasible with HTML/CSS-focused changes while keeping existing JS IDs/events.
- Noted inspection caveat: screenshot #1 shows script-driven shell/iframe-style output, so exact DOM cloning from DevTools is limited; recommend style/structure recreation in our own markup.

# Session Log

Purpose: Keep minimal context so future conversations can continue without re-explaining everything.

## Update Rules
- Write short, high-signal notes only.
- Focus on decisions, preferences, and pending work.
- Newest entry goes on top.

## Entries
### 2026-03-02 (ui fix: active-layer-delete overflow)
- Fixed `활성 레이어 삭제` button layout overflow in Assets panel.
- Root cause: base `.btn2 { white-space: nowrap; }` forced overflow in 2-column `.row`.
- Added `.row > * { min-width:0 }` and button-specific rule `#clearImageSelect { width:100%; white-space:normal; ... }`.
- CSS sanity check passed (brace balance OK).

### 2026-03-02 (layer bugfix follow-up: visibility/activation/alignment)
- User reported: added layer features not visible/active, and first uploaded image appeared to disappear after second upload.
- Applied fixes:
- User upload input now supports multi-select (`#file` has `multiple`) and uploads create multiple layers in one pass.
- New layer placement now uses incremental offset from active layer (`+12px` cascade) to avoid exact overlap that looked like disappearance.
- Layer panel control activation robustness improved (`setSelected` now also refreshes `renderLayerList`; `syncLayerControls` null-guarded).
- Layer button alignment improved in CSS (`#layerList .assetActions` grid + consistent button sizing).
- Post-fix sanity checks passed: `node --check main.js`, CSS brace balance OK.

### 2026-03-02 (multi-image layer system upgrade)
- Implemented Photoshop-style multi-image layer workflow for user mode:
- New layers panel in Assets drawer with stack list + controls:
- order up/down, duplicate, delete
- per-layer visibility toggle, lock toggle
- per-layer opacity slider and blend mode (`normal/multiply/screen/overlay/darken/lighten`)
- Image add behavior changed: every library pick or file upload creates a NEW image layer (no longer overwrites single image).
- Canvas rendering switched from single `imgLayer` model to dynamic `imageLayerStack` model with active-layer selection.
- Drag/resize/zoom/align now operate on active image layer; locked layers block edits.
- Validation updated for multi-layer rules (at least one layer required, safe-area and low-size checks per visible layer).
- Export upgraded to include all visible image layers in z-order with opacity/blend compositing; SPEC now exports `imageLayers[]` + `activeLayerId`.
- Product switch/reset now clears image layer stack explicitly before applying defaults.
- Sanity checks passed: `node --check main.js`, CSS brace balance OK.

### 2026-03-02 (usability upgrade pass: draft/history/smart actions)
- Upgraded user-facing editing UX with convenience features:
- Added editor draft autosave badge + engine (`lf.editorDraft.v1`), debounced autosave, and restore on init.
- Draft restore intentionally excludes direct-upload image blobs for storage safety; library-selected assets restore normally.
- Added in-session undo/redo history stack (limit 80), toolbar buttons, and keyboard shortcuts:
- Undo: `Ctrl/Cmd+Z`
- Redo: `Ctrl/Cmd+Shift+Z` and `Ctrl/Cmd+Y`
- Added quick productivity actions:
- `Safe 맞춤` button to scale+center selected layer inside safe area.
- Shortcut help button (`?`) and save shortcut `Ctrl/Cmd+S` mapped to production export.
- Added upload-image preview cache for in-session history restore of uploaded images.
- Added draft status indicator in top badge row (`준비/저장중/저장됨/복원됨/없음/실패`).
- Sanity checks passed: `node --check main.js`, CSS brace balance OK.

### 2026-03-02 (supabase smoke + policy verification)
- Executed `./scripts/supabase_smoke_check.sh` against `https://rdvvnnspothqtxwdobtp.supabase.co` with anon key.
- Read checks passed:
- `products` select OK.
- `templates` select with `product_id` OK.
- `assets` select with `product_id` OK.
- Storage list for `editor-assets` OK (`assets/`, `templates/` prefixes visible).
- Additional policy write verification passed (anon role):
- `products` insert (HTTP 201) and delete (HTTP 200) succeeded with temporary `smoke_*` ID.
- Storage object upload to `editor-assets/smoke/*.txt` (HTTP 200) and delete (HTTP 200) succeeded.
- Result: Supabase schema/RLS/storage policies are operational for current DEV/TEST open-write configuration.

### 2026-03-02 (mobile regression check run)
- Executed mobile regression pass for safe-area/bottom dock/drawer flow/touch targets using checklist + code inspection.
- Confirmed presence and consistency of:
- `viewport-fit=cover` meta.
- Safe-area CSS vars and mobile dock clearance math (`--safe-*`, `--dock-clearance`).
- Mobile hard override (`@media <=900px`) forcing bottom horizontal dock and drawer bottom clearance.
- Drawer mode logic in JS (`isDrawerTargetAllowed`, `setDrawerPanel`, `renderMode`) initializes to single active panel and mode-consistent targets.
- Quick static sanity checks passed: `node --check main.js` (no syntax errors), `style.css` brace balance OK.
- Remaining to fully close item 1: real-device visual/touch verification on iOS/Android for actual notch/home-indicator environments.

### 2026-03-02 (status check + next-step recommendation)
- Repo status reviewed for handoff:
- Tracked changes pending: `index.html`, `main.js`, `style.css`, and tracked deletion `README.md`.
- Untracked set includes docs/checklists/scripts/schema plus debug/log/image artifacts.
- `REGRESSION_CHECKLIST.md` is present and ready for execution; no in-code `TODO/FIXME/HACK/TBD` markers found via ripgrep.
- Recommended next work order: (1) mobile real-device regression pass, (2) Supabase smoke + policy verification, (3) repo hygiene pass (README decision + artifact ignore/stage strategy).

### 2026-03-02 (mobile final polish)
- Completed pending mobile pass focused on real-device safe-area/touch ergonomics.
- Added `viewport-fit=cover` in `index.html` for notch/home-indicator-safe rendering.
- Added CSS safe-area vars and dock clearance math (`--safe-*`, `--dock-clearance`) to prevent drawer content from being hidden behind fixed bottom dock.
- Mobile hard override (`@media <=900px`) now positions dock with safe-area aware left/right/bottom offsets and applies matching bottom padding/scroll-padding.
- Increased mobile tool button target size to 44px and slightly raised dock label legibility on small screens.
- Initial drawer active state cleaned up to avoid dual-active rail buttons on first paint (`flow` active by default).

### 2026-03-02
- Supabase template workflow expanded:
- Admin template now supports PNG uploads for base/bleed/safe guides, preview in drawing canvas, and save to Supabase (`templates/*` storage paths).
- `templates` model extended in app with:
- `template_image_url/path/name/fit`
- `bleed_image_url/path/name`
- `safe_image_url/path/name`
- Added `real` image-fit option; canvas + export renderer both support `cover/contain/fill/real`.
- Added template background layer + bleed/safe guide overlays inside frame; existing bleed/safe ON/OFF toggles preserved.
- Fixed template save blockers:
- Removed forced "base PNG required" gate.
- Improved failure alerts by stage (base/bleed/safe upload).
- Added safer template storage key sanitization (non-ASCII template IDs caused `Invalid key` errors in Supabase storage).
- Added fallback protection in `upsertTemplate` for product FK issues.
- Large-size handling improved:
- Editing view and print output are separated.
- Export auto-scales DPI/px for browser safety (pixel/edge caps), while preserving print export flow.
- Mobile UI heavily reworked while keeping desktop behavior:
- Bottom fixed horizontal dock for mobile.
- Forced content order for usability: canvas first, then toolbar, then menu drawer.
- Additional mobile breakpoints and hard overrides added to reduce overlap/vertical-rail issues.
- Text layer updated to render without white background in canvas/export (text-only display).
- Pending next session:
- Verify mobile layout after cache-hard-refresh on real device widths and do final polish pass (spacing/typography/touch targets).

### 2026-03-01
- UI-only phase started (backend frozen):
- Layout changed to full-width responsive canvas-first flow; options panel moved below canvas.
- Enforced bottom panel layout at structure level: changed right `aside` to bottom `section.panelBottom` and forced `.grid` block flow to prevent side placement.
- User requested side split; layout updated again to 3-column desktop structure (left panel / center canvas / right panel) with mobile fallback stack.
- Updated again per request: moved controls into in-canvas UI with left icon sidebar + right drawer; only selected menu panel is shown.
- Refined to non-overlap professional layout: stage now uses fixed 3-zone grid (`icon rail / canvas work / drawer`) so menu no longer covers drawing canvas.
- Further refinement for alignment/responsive stability: adjusted breakpoints to keep canvas row priority and force drawer to row-3 on <=980px to prevent canvas dropping.
- Visual polish pass based on provided reference component:
- Added floating top-left action pills, centered title capsule, and bottom-right utility pills.
- Restacked stage to `canvas / right icon rail / right drawer` for clearer editor hierarchy.
- Fixed CSS cascade ordering so mobile media queries for floating controls are not overridden by base styles.
- Fixed canvas dropping issue explicitly: replaced auto grid placement with named grid areas (`canvas/toolbar/rail/drawer`) and removed vertical auto-centering side effects from `rulerShell`.
- User flow restructured into card sections in order: product select -> template select -> option select.
- Added admin UI for product-specific make-type configuration (localStorage-based) and wired user `makeType` dropdown to selected product.
- User executed Supabase migration; verification completed:
- `products/templates/assets` product-aware selects now succeed.
- Write smoke tests passed for products/templates and full asset E2E (storage upload + assets insert + readback + cleanup).
- Attempted to execute required steps 1/2 directly; confirmed via Supabase REST that migration is NOT yet applied (`products` table missing, `templates.product_id` and `assets.product_id` missing).
- Added executable smoke checker script `scripts/supabase_smoke_check.sh` for immediate post-migration verification.
- Product-based mode refactor complete:
- User mode now requires product selection and filters templates/assets by product.
- Admin mode now supports product CRUD, template-to-product mapping, and asset-to-product upload mapping.
- Added product-aware canvas display mode (`fit`/`compact`/`focus`) and exported product metadata in SPEC.
- Extended Supabase schema with `products` table and `product_id` columns/policies (with backward-compatible app fallbacks).
- Supabase issue diagnosis: remote asset save/load failed because schema had read-only policies; added DB write/storage policies in `supabase-schema.sql` and strengthened app-side connection probes/messages in `main.js`.
- Sequential dev update complete:
- Supabase UX improved (input validation, ping test, retry 2x, detailed failure reason, button loading state, LOCAL fallback clarity).
- Export robustness improved (high-quality smoothing, safer font stack, `toBlob` null guard, export error alerts).
- Added manual regression checklist: `REGRESSION_CHECKLIST.md`.
- Continued development: hardened DOM rendering in `main.js` by replacing `innerHTML` with safe element creation in template/image list UIs.
- User wants lightweight continuity notes.
- User does not need human-readable detail; notes just need to be sufficient for assistant context.
- At the start of each new conversation, open this file first and continue with context.
- Setup complete: created `SESSION_LOG.md` and local `AGENTS.md` continuity instructions.
